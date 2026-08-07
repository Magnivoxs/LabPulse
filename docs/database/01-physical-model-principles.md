# Physical Model Principles

**Version:** 0.4 (Sprint 3B.3 corrections applied — see [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md); Sprint 3B.1 and 3B.2 corrections also applied — see [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md) and [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md))
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

State the cross-cutting PostgreSQL/Supabase conventions every table in [`02-table-catalog.md`](02-table-catalog.md) follows, so individual table documents do not repeat the reasoning. Where a table departs from these defaults, that departure is called out explicitly in its own entry.

## Primary Keys: UUID

Every table uses a `UUID` primary key (`id`), generated server-side (`gen_random_uuid()` via the `pgcrypto`/`pgcrypto`-equivalent extension Supabase provides, or `gen_random_uuid()` built into PostgreSQL 13+).

**Why:**

- Supabase's own convention (`auth.users.id` is a UUID); a `User`-linked table with a UUID PK can share the identifier directly (see [`07-authorization-data-model.md`](07-authorization-data-model.md)).
- Avoids sequential-ID enumeration risk when records are ever exposed to a client, even indirectly through an API response.
- Avoids cross-tenant ID collisions being meaningful or guessable across Organizations, which matters once Row-Level Security is the only enforcement boundary (Sprint 3C).
- No distributed ID-generation coordination is needed between import batch processes and interactive writes.

**Trade-off acknowledged:** UUIDs are 16 bytes versus 4–8 for integers, and are not naturally sortable by creation order. Every table that needs creation-order sorting also carries a `created_at TIMESTAMPTZ`, so this is not a functional gap — only a minor storage and index-size cost, accepted per [ADR-000](../decisions/ADR-000-architectural-philosophy.md)'s preference for traceability and safety over micro-optimization at this stage.

## Timestamps: `TIMESTAMPTZ`, Never Naive

Every point-in-time column (`created_at`, `occurred_at`, `triggered_at`, `uploaded_at`, and similar) is `TIMESTAMPTZ`, stored in UTC. Naive `TIMESTAMP` (without time zone) is never used, because LabPulse organizations may operate across time zones and an ambiguous timestamp would corrupt reporting-period and audit-trail accuracy.

## Dates: `DATE` for Calendar-Grain Fields

Fields that represent a calendar day or reporting boundary with no time-of-day meaning (`reporting_period_start`, `reporting_period_end`, `reporting_date`, `due_date`, `effective_start_date`, `effective_end_date`) use `DATE`, not `TIMESTAMPTZ`. Mixing the two would create spurious time-zone-driven off-by-one-day bugs when comparing a reporting period against a snapshot's `created_at`.

## Money and Percentages: `NUMERIC`, Never Floating-Point

Per [`CLAUDE.md`](../../CLAUDE.md) Calculation Rules ("Currency math must avoid unsafe floating-point handling"), every currency and percentage column is `NUMERIC`, never `REAL`/`DOUBLE PRECISION`/`FLOAT`.

- **Currency:** `NUMERIC(14,2)`. Fourteen total digits comfortably covers organization-level monthly P&L figures with no realistic overflow risk, and two decimal places match standard currency precision. No monetary calculation in the schema itself performs authoritative math — see [`docs/data-model/03-versioning-strategy.md`](../data-model/03-versioning-strategy.md) and [`CLAUDE.md`](../../CLAUDE.md) ("AI must not perform authoritative financial calculations"; application-layer pure functions do, per [ADR-000](../decisions/ADR-000-architectural-philosophy.md)).
- **Percentages:** `NUMERIC(7,4)`, stored as the percentage value itself (for example, `8.0000` for 8%, not `0.08`). This matches how the Metrics Dictionary and BR-001 already express thresholds ("above 8.0%") and avoids a silent /100 or ×100 translation bug between storage and display.
- **Staffing/case counts:** `NUMERIC(10,2)` where a fractional value is possible (full-time-equivalent staffing), `INTEGER` where a value is inherently a whole count (case counts, headcount, hours if always whole).

## Text: `TEXT`, Not `VARCHAR(n)`

PostgreSQL's `TEXT` and `VARCHAR(n)` have identical storage and performance characteristics; an arbitrary length cap on `VARCHAR(n)` only adds a constraint that must be revisited if legitimate values exceed it (for example, a long dismissal reason). `TEXT` is used everywhere, with `CHECK` constraints applied only where a real, approved business rule bounds the value (for example, a percentage's plausible range, once one is approved).

## Enumerations: Lookup Tables Preferred Over Native `ENUM`

Native PostgreSQL `ENUM` types are avoided for any value set that is organization-configurable, likely to gain new values, or explicitly flagged as unresolved in the repository (for example, production stages, SecurityRole names). A lookup table is used instead, because:

- Adding a value to a lookup table is a data change; adding a value to a native `ENUM` is a schema change requiring a migration and, in older PostgreSQL versions, transactional restrictions.
- A lookup table can carry an organization-scoping column, an `is_active`/effective-dating pair, and a display order — a native `ENUM` cannot.
- This directly matches [ADR-000](../decisions/ADR-000-architectural-philosophy.md)'s "configuration before customization" principle and the explicit instruction (per [`docs/entities/security-role.md`](../entities/security-role.md)) that "the final set of SecurityRole values should not be hard-coded... without a configuration mechanism."

A small, fixed, non-configurable status vocabulary that is unlikely to ever need a new value without an accompanying application-logic change (for example, an `import_job.status` of `pending`/`validated`/`approved`/`normalized`/`failed`) is represented as `TEXT` with a `CHECK` constraint listing the allowed values, rather than a lookup table or native `ENUM`. This keeps the constraint visible in the table definition itself and just as easy to alter as a lookup-table row, without a second table for a value set no business process configures.

## `JSONB`: Only for Genuinely Variable or Raw-Payload Structure

Per the founder's explicit constraint, `JSONB` is not a substitute for relational design. **This proposal uses exactly five `JSONB` columns, across four tables** — an exact count, corrected here from Sprint 3B's "exactly three places," which undercounted by omitting `organization_import_profile_override.mapping_definition`:

1. `import_source_row.raw_data` — the raw, as-imported row content, whose shape is defined entirely by the source file and Import Profile version, not by LabPulse's own schema (see [`06-import-lineage-model.md`](06-import-lineage-model.md)).
2. `import_profile_version.schema_definition` — the declarative description of a source file's expected shape, which is inherently a variable, versioned document per [`docs/entities/import-profile.md`](../entities/import-profile.md), not a fixed relational structure.
3. `organization_import_profile_override.mapping_definition` — an organization's own alias/mapping overrides layered on a shared base profile version. Same justification as #2: a variable, versioned, self-describing document (which source column aliases to which canonical field, for this organization specifically), never queried into its internal shape by any downstream logic outside the import pipeline itself.
4. `audit_event.before_value` — a before-snapshot of an arbitrary entity's changed fields, whose shape varies by which entity type was audited (see [`docs/data-model/04-audit-strategy.md`](../data-model/04-audit-strategy.md)).
5. `audit_event.after_value` — same table, the corresponding after-snapshot.

No canonical business fact (a snapshot value, a metric, a permission grant) is stored as `JSONB`.

## Arrays: Avoided in Favor of Normalized Join Tables

PostgreSQL array columns are not used anywhere a many-to-many or one-to-many relationship exists. The clearest example is Permission's office scoping: rather than a `permission.office_ids UUID[]` column, a `permission_office_grant` join table is used (see [`07-authorization-data-model.md`](07-authorization-data-model.md)), per the founder's explicit instruction. This preserves real foreign-key referential integrity, makes Row-Level Security policies simpler to write correctly in Sprint 3C, and allows standard indexing.

## Tenant Scoping: `organization_id` Carried Directly Where It Aids RLS

Every tenant-owned table carries an `organization_id` column, even on tables that are also scoped to an `office_id` (whose parent `office` row already implies the organization). This is **intentional denormalization**, retained per Sprint 3B.1's review, and now enforced declaratively rather than left as an open integrity risk:

- **Why:** A Row-Level Security policy that can filter on `organization_id` directly, without joining through `office`, is simpler to write correctly and (per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) "defense in depth") does not depend on the `office` table's own RLS policy being correct to protect a child table.
- **Integrity risk this creates, now closed (Sprint 3B.1 Correction 2):** Sprint 3B flagged that a row's `organization_id` could, in principle, be written inconsistently with its `office_id`'s actual organization, and left the fix to Sprint 3C as an open choice between a trigger, an application-layer invariant, or dropping the denormalization. This proposal now closes that gap **declaratively**, using composite foreign keys — `(organization_id, office_id) REFERENCES office (organization_id, id)` — for every table that carries both columns, and the equivalent pattern for `organization_id` paired with any other tenant-scoped reference (a User, a Permission, a Recommendation). See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Declarative Tenant Consistency" for the full pattern, which tables use it, and the small, explicitly-named residual set that genuinely still requires a Sprint 3C decision (nullable-organization system-default rows, and `audit_event`'s polymorphic reference).
- Every such denormalization and its corresponding composite FK is called out per-table in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md), not left as an unstated assumption.

## System-Default vs. Organization-Override Precedence (Sprint 3B.1 Correction 15)

Several tables in this proposal use a nullable `organization_id` to distinguish a system-default row (`organization_id IS NULL`, available to every organization) from an organization-specific override (`organization_id` set) — `security_role`, `job_role`, `production_stage`, `business_rule_version`, and the `import_profile_version`/`organization_import_profile_override` pair. Sprint 3B did not state a precedence rule when both a system-default and an organization-specific row could apply simultaneously; this correction states it explicitly, once, here, rather than per-table:

**When a system-default row and an organization-specific row are both effective for the same organization at the same time, the organization-specific row takes precedence.** The system-default row is used only when no organization-specific row is currently effective for that organization. This matches ordinary "override" semantics and is the only precedence order consistent with an organization-specific row existing at all — an override that could be silently ignored in favor of the default would not be a meaningful override. Sprint 3C's read paths (application queries, and any RLS-adjacent lookup function) must implement this precedence consistently; it is not encoded as a database constraint, since precedence-at-query-time is a query-shape concern, not a write-time integrity concern.

## Global-or-Same-Organization Reference Pattern (Sprint 3B.2, new)

Several lookup/definition tables use a nullable `organization_id` to mean "system-default row, usable by every organization" (`job_role`, `security_role`, `production_stage`, `business_rule_version`) — see "System-Default vs. Organization-Override Precedence" above. A **different** integrity question arises whenever a tenant-owned row (which always has a real, non-null `organization_id`) holds a foreign key **into** one of these nullable-organization tables: the referenced row must be either a global default (`organization_id IS NULL`, always a valid target for any organization) **or** a row belonging to that *same* organization — **never** another organization's custom row.

This is a conditional ("this OR that") rule, not a strict equality, so it **cannot** be expressed as a single declarative composite foreign key the way the Declarative Tenant Consistency pattern in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) is. A composite FK enforces unconditional equality between two column pairs; it has no way to say "match, or the target is NULL." Sprint 3B.1 did not surface this as a distinct pattern; Sprint 3B.2's broader integrity audit found it recurring in six places (see [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) for the full list and per-case detail):

1. `security_role.permission_set_id` → `permission_set` (Correction 3)
2. `permission.security_role_id` → `security_role` (Correction 3)
3. `employee.job_role_id` → `job_role`
4. `labor_model_staffing_measure.job_role_id` → `job_role`
5. `scenario_input.value_reference_job_role_id` → `job_role` (Correction 9)
6. `backlog_stage_count.production_stage_id` → `production_stage`
7. `recommendation.origin_business_rule_version_id` → `business_rule_version`
8. `condition_evaluation`'s indirect exposure to `business_rule_version` via `business_rule_condition` (Correction 6)

**Enforcement mechanism (Sprint 3C, not implemented here):** a `BEFORE INSERT OR UPDATE` trigger on the referencing table, verifying `<target_table>.organization_id IS NULL OR <target_table>.organization_id = <referencing_row>.organization_id` for the specific foreign key in question. This is the standard, correct way to enforce a "same-tenant-or-global" reference rule in PostgreSQL — it is a genuine database-level constraint (rejecting an invalid write at the trigger, not merely an application-layer convention), just not one expressible as a plain `FOREIGN KEY` clause. RLS visibility alone is not relied on for this — a trigger enforces it regardless of which role or policy context performs the write.

Each of the eight sites above still carries a plain (unconditional) foreign key guaranteeing the referenced row *exists*; the trigger adds the *tenant-ownership* half of the guarantee on top of that existing referential-integrity guarantee.

## Naming Conventions

- Tables: `snake_case`, singular (`office`, not `offices`) — matches the entity catalog's singular naming and keeps foreign-key column names readable (`office_id` referencing `office.id`).
- Foreign keys: `<referenced_table>_id`.
- Boolean columns: prefixed `is_` or phrased as a clear yes/no question (`is_finalized`, `is_included_in_total`).
- Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`. Mutable tables additionally have `updated_at TIMESTAMPTZ`.

## What This Document Does Not Define

- The literal `CREATE TABLE` statements (explicitly out of scope for Sprint 3B).
- Index selection beyond what is called out per-table in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) as a consideration, not a final decision.
- Row-Level Security policy logic (Sprint 3C).

## Related Documents

- [Table Catalog](02-table-catalog.md)
- [Column and Type Catalog](03-column-and-type-catalog.md)
- [Keys, Relationships, and Constraints](04-keys-relationships-and-constraints.md)
- [CLAUDE.md](../../CLAUDE.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
