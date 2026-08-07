# Column and Type Catalog

**Version:** 0.4 (Sprint 3B.3 corrections applied — see [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md); Sprint 3B.1 and 3B.2 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Exhaustive proposed column list per table, with PostgreSQL types and nullability, per [`01-physical-model-principles.md`](01-physical-model-principles.md)'s conventions. Every table also has `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, omitted below for brevity unless a table's `created_at` behaves unusually.

Legend: **R** = required (`NOT NULL`), **N** = nullable.

## Tenant and Organization

### `organization`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `name` | `TEXT` | R | Display name; synthetic only in this repository |
| `status` | `TEXT` | R | `CHECK` in (`active`, `archived`) |
| `updated_at` | `TIMESTAMPTZ` | N | |

**Composite key for cross-table enforcement:** `UNIQUE (id, organization_id)` patterns used elsewhere require the *parent* side of a same-tenant relationship to expose a composite unique key. `organization` itself is the tenant root, so no such key is needed on `organization` — it is always the target of a plain `organization_id -> organization.id` foreign key, never the child side of a composite pattern.

### `office`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | FK → `organization.id` |
| `external_office_id` | `TEXT` | R | Source-provided Office ID (OQ-056 format unconfirmed) |
| `display_name` | `TEXT` | R | UI label only — see [ADR-004](../decisions/ADR-004-office-based-authorization.md) Terminology |
| `region` | `TEXT` | N | Descriptive metadata only; never an authorization boundary |
| `status` | `TEXT` | R | `CHECK` in (`active`, `inactive`) |
| `updated_at` | `TIMESTAMPTZ` | N | |

**Sprint 3B.1 Correction 2 (Declarative Tenant Consistency):** `office` carries an additional `UNIQUE (organization_id, id)` constraint (alongside its ordinary primary key on `id` alone). This composite unique key is what lets every office-scoped, organization-scoped table below reference `office` via a **composite foreign key** — `(organization_id, office_id) REFERENCES office (organization_id, id)` — instead of two independent foreign keys that PostgreSQL cannot cross-check against each other. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Declarative Tenant Consistency" for the full pattern and which tables use it.

## Identity and Workforce

### `app_user`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `id` | `UUID` | R | **Shared PK with `auth.users.id`** — not independently generated |
| `organization_id` | `UUID` | R | FK → `organization.id` |
| `display_name` | `TEXT` | R | |
| `email` | `TEXT` | R | **Synchronized cache, not the sole source of truth — see below** |
| `status` | `TEXT` | R | `CHECK` in (`invited`, `active`, `disabled`) |
| `updated_at` | `TIMESTAMPTZ` | N | |

**Composite key for cross-table enforcement:** `UNIQUE (organization_id, id)`, mirroring `office`'s pattern — lets any tenant-scoped table that references an `app_user` (a grantor, an uploader, a task owner, an actor) enforce "this person belongs to the same organization as this record" declaratively. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md).

**Sprint 3B.1 Correction 15 — `app_user.email` clarified:** this column is a **synchronized cache** of `auth.users.email`, not a replacement for it. `auth.users` (Supabase-managed) remains the sole source of truth for authentication and credential purposes; `app_user.email` exists only so RLS policies and application queries scoped to tenant tables can read a user's email without crossing into the `auth` schema, which Supabase restricts from ordinary tenant-facing queries.

- **Synchronization mechanism (Sprint 3C to implement, not built here):** either (a) a Postgres trigger on `auth.users` (`AFTER UPDATE OF email`) that writes the new value into `app_user.email`, which is the standard Supabase-recommended pattern for profile-table email mirroring, or (b) an application-layer sync performed whenever a user-initiated email change flow completes. Option (a) is preferred because it cannot be bypassed by a write path that forgets to sync.
- **Privacy implication:** duplicating email into `app_user` widens this column's exposure surface to every RLS policy and role that can read `app_user` rows, rather than being confined to Supabase's own `auth` schema access controls. Any RLS gap on `app_user` therefore exposes email in a way a gap elsewhere would not. This is judged an acceptable, explicitly-documented trade-off (the same table already exposes `display_name`, an equally identifying field, under the same RLS boundary) rather than a reason to avoid the cache — but it means `app_user.email` must never be granted to a broader read audience than `app_user.display_name` already is.

### `employee`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | FK → `organization.id` |
| `job_role_id` | `UUID` | R | FK → `job_role.id` — **Sprint 3B.2:** `job_role.organization_id` is nullable (system-default job roles), so this is a Global-or-Same-Organization Reference (see [`01-physical-model-principles.md`](01-physical-model-principles.md)), enforced by a Sprint 3C trigger, not a plain composite FK. Found during the Sprint 3B.2 broader integrity audit — Sprint 3B carried this as a fully unenforced plain FK. |
| `linked_app_user_id` | `UUID` | N | Composite FK → `app_user (organization_id, id)` — see below |
| `display_name` | `TEXT` | R | Synthetic only in this repository |
| `employment_status` | `TEXT` | R | `CHECK` in (`active`, `terminated`) |
| `pay_type` | `TEXT` | N | Unresolved exhaustive vocabulary; free text pending confirmation |
| `standard_hours` | `NUMERIC(5,2)` | N | |
| `start_date` | `DATE` | R | |
| `end_date` | `DATE` | N | |
| `updated_at` | `TIMESTAMPTZ` | N | |

**Sprint 3B.1 Correction 10 — `office_id` removed from `employee`.** Sprint 3B's `employee.office_id` (mutable "current office" column) created an ambiguity against `employee_office_assignment`, which already tracked the same fact with history. This proposal now has **one authoritative source**: an Employee's current Office is the `office_id` of their `employee_office_assignment` row where `effective_end_date IS NULL` (the open-ended, currently-active assignment). `employee` itself carries no office reference at all. No repository document requires a separate "home office" distinct from "current office," so no `home_office_id`/`primary_office_id` field is invented here — if that distinction is ever needed, it should be added explicitly under one of those names, never re-using `office_id`.

**Composite key for cross-table enforcement:** `UNIQUE (organization_id, id)` on `employee` — used by `employee_office_assignment`'s composite FK back to `employee` (see below).

**`linked_app_user_id` constraints (Sprint 3B.1 Correction 10):**

- **Same-organization enforcement:** composite FK `(organization_id, linked_app_user_id) REFERENCES app_user (organization_id, id)` — declaratively guarantees a linked User belongs to the same Organization as the Employee, closing the gap the founder specifically named.
- **Cardinality:** `UNIQUE (linked_app_user_id)` as a partial unique index (`WHERE linked_app_user_id IS NOT NULL`) — enforces that a given `app_user` is linked from at most one `employee` row, matching the intended 1:1 relationship in that direction while remaining optional in both directions (an Employee need not have a User; a User need not have an Employee).

### `job_role`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | N | `NULL` = system-default row available to every organization |
| `name` | `TEXT` | R | |
| `is_technician` | `BOOLEAN` | R | Default `false`; which roles count as technician is unresolved (OQ per [`docs/entities/job-role.md`](../entities/job-role.md)) |
| `is_active` | `BOOLEAN` | R | Default `true` |

**Precedence rule (Sprint 3B.1 Correction 15):** see "System-Default vs. Organization-Override Precedence" in [`01-physical-model-principles.md`](01-physical-model-principles.md) — applies to every table in this document with a nullable `organization_id` meaning "system default."

### `employee_office_assignment`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized — see composite FKs below |
| `employee_id` | `UUID` | R | Composite FK → `employee (organization_id, id)` |
| `office_id` | `UUID` | R | Composite FK, with `organization_id` → `office (organization_id, id)` |
| `effective_start_date` | `DATE` | R | |
| `effective_end_date` | `DATE` | N | `NULL` = current assignment |

**Sprint 3B.1 Correction 10 — this table is now the sole authoritative source of an Employee's Office, and is required MVP, not an optional/droppable addition.** Sprint 3B's table catalog entry incorrectly stated this table "can be dropped without affecting any other table's design." That claim is now false: `employee`'s current-office fact depends entirely on this table, so it can no longer be described as having no downstream impact. See [`02-table-catalog.md`](02-table-catalog.md).

**Sprint 3B.2 Correction 8 — "append-only" was an inaccurate description, corrected to Option A (effective-dated mutable closure).** Sprint 3B.1 called this table "append-only" while also requiring that a transfer **update** the prior row's `effective_end_date` — an internal contradiction, since append-only means no row is ever updated. The accurate model: `employee_id`, `office_id`, and `effective_start_date` are immutable from creation; an active row (`effective_end_date IS NULL`) may be updated **exactly once**, to close it by setting `effective_end_date`; once closed, a row can never be reopened or otherwise changed. This is historically-preserved and effective-dated, not full event-sourcing. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Employee Assignment Lifecycle" for the Sprint 3C trigger this requires.

**Sprint 3B.2 Correction 2 — `organization_id` added.** This table now carries its own `organization_id` (denormalized from both `employee_id` and `office_id`, which must already agree per the composite FKs below), enabling the same RLS-friendly direct-organization-filter pattern used throughout this proposal.

**Non-overlap enforcement:** because the business model permits only one primary Office per Employee at a time, this table needs a same-employee, non-overlapping-date-range guarantee — a plain `UNIQUE` or `CHECK` constraint cannot express "no two rows for the same employee may have overlapping `[effective_start_date, effective_end_date)` ranges." PostgreSQL's `EXCLUDE` constraint (via the `btree_gist` extension) is designed for exactly this:

```text
EXCLUDE USING gist (
  employee_id WITH =,
  daterange(effective_start_date, effective_end_date, '[)') WITH &&
)
```

This is documented here as the required constraint *shape*, matching how this document already expresses `CHECK` constraints in table cells rather than full `CREATE TABLE` statements — it is not an executable migration, and `btree_gist` is a standard, built-in PostgreSQL extension, not custom code. Sprint 3C is responsible for the actual `CREATE EXTENSION`/`CREATE TABLE` statements.

**Composite keys:** `UNIQUE (organization_id, id)` on `employee_office_assignment` itself is not needed (nothing references this table by ID), but its own two composite FKs above close the "does this assignment's office and employee agree on organization" gap entirely declaratively.

## Authorization

See [`07-authorization-data-model.md`](07-authorization-data-model.md) for full column detail on `security_role`, `capability`, `permission_set`, `permission_set_capability`, `permission`, `permission_office_grant`.

## Imports and Lineage

See [`06-import-lineage-model.md`](06-import-lineage-model.md) for full column detail on all import-domain tables, including the Sprint 3B.1 corrections removing the polymorphic `target_table`/`target_record_id` soft reference and adding `import_validation_issue` and the typed normalized-value link tables.

## Canonical Snapshots

### Immutable Revisions — Shared Pattern (Sprint 3B.1 Correction 1)

Sprint 3B's uniqueness constraints on `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, and `backlog_snapshot` (one row per office/period/source) directly conflicted with the stated immutable-correction model: a real-world correction (a restated P&L, a re-run import) must be insertable as a **new row**, not blocked by a uniqueness violation, and never requires updating or deleting the row it corrects. All four tables now add:

| Column | Type | R/N | Notes |
|---|---|---|---|
| `revision_number` | `INTEGER` | R | Starts at `1`; each correction for the same natural key inserts the next integer |
| `supersedes_snapshot_id` | `UUID` | N | Self-referencing FK → this table's own `id`; `NULL` for the first revision |

**Uniqueness, corrected:** the natural-key uniqueness constraint now includes `revision_number` (so multiple revisions for the same office/period/source can coexist), **plus** a separate `UNIQUE (supersedes_snapshot_id)` constraint (nulls excluded, since PostgreSQL treats each `NULL` as distinct) — this guarantees **only one direct successor can supersede a given row**, per the founder's explicit requirement. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) for the exact constraint list.

**Identifying the current/latest revision without mutating the older row:** the latest revision for a given natural key (office/period/source) is simply the row with `MAX(revision_number)` within that group — a plain query, not a stored flag. No `is_current` boolean is used, because a mutable flag would itself require an `UPDATE` against the previously-current row every time a new revision arrives, which is exactly the mutation this correction exists to prevent. `supersedes_snapshot_id` independently preserves the exact correction lineage (which specific row corrected which), which `revision_number` alone would not capture if revisions were ever supplied out of order.

**Composite keys (Sprint 3B.2, Correction 5 — strengthened from organization-only to the complete natural key):** each of the four snapshot tables now carries **three** distinct composite unique keys, each serving a different consumer:

1. `UNIQUE (organization_id, id)` — supports organization-only composite FKs (for example, the `import_normalized_value_*_snapshot` link tables, which have no office context of their own).
2. `UNIQUE (organization_id, office_id, id)` — **new in Sprint 3B.2** — supports organization-**and**-office composite FKs (for example, `metric_observation_component`'s typed snapshot references, and the `scenario_run_*_snapshot` join tables' same-Office enforcement).
3. A table-specific natural-key composite (for example, on `revenue_snapshot`: `UNIQUE (organization_id, office_id, reporting_period_start, reporting_period_end, source_type, id)`) — **new in Sprint 3B.2**, used **only** by the table's own self-referencing `supersedes_snapshot_id` composite FK, which must match the complete natural key, not merely organization: `(organization_id, office_id, reporting_period_start, reporting_period_end, source_type, supersedes_snapshot_id) REFERENCES revenue_snapshot (organization_id, office_id, reporting_period_start, reporting_period_end, source_type, id)`. Sprint 3B.1's organization-only self-reference was too permissive — it would have allowed a snapshot to be recorded as superseding a *different Office's* (or *different period's*) row within the same organization, which is a real integrity gap, not merely a theoretical one. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Snapshot and Metric Observation Supersession Integrity" for the full reasoning, including what this composite FK does and does not enforce on its own (a Sprint 3C trigger is still required for the "predecessor's revision number is exactly one less" rule).

### `revenue_snapshot`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK, with `organization_id` → `office (organization_id, id)` |
| `reporting_period_start` | `DATE` | R | |
| `reporting_period_end` | `DATE` | R | |
| `source_type` | `TEXT` | R | `CHECK` in (`power_bi_daily`, `pnl_monthly`) |
| `total_office_revenue` | `NUMERIC(14,2)` | R | **Imported fact** |
| `is_finalized` | `BOOLEAN` | R | Default `false`; `true` only for `pnl_monthly` |
| `revision_number` | `INTEGER` | R | See Immutable Revisions pattern above |
| `supersedes_snapshot_id` | `UUID` | N | Self-referencing, complete-natural-key composite FK (Sprint 3B.2 Correction 5) |
| `import_job_id` | `UUID` | R | **Sprint 3B.3 Correction 3:** composite FK, with `organization_id` → `import_job (organization_id, id)` — corrected from a plain FK; a snapshot can never be recorded against a different organization's Import Job |

**`import_profile_version_id` removed (Sprint 3B.3 Correction 3).** Sprint 3B/3B.1/3B.2 carried this as an independently writable column here, duplicating the exact same fact already recorded, immutably, on `import_job.import_profile_version_id` — with nothing preventing the two from disagreeing for the same import. This proposal now derives it exclusively through `import_job_id → import_job.import_profile_version_id`; it is never stored a second time on the snapshot header.

**Composite key added (Sprint 3B.4 Correction 2):** `UNIQUE (organization_id, import_job_id, id)`, in addition to the existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `import_normalized_value_revenue_snapshot`'s strengthened same-Import-Job composite FK. See [`06-import-lineage-model.md`](06-import-lineage-model.md).

### `payroll_snapshot`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `reporting_period_start` | `DATE` | R | |
| `reporting_period_end` | `DATE` | R | |
| `qualifying_payroll_expense` | `NUMERIC(14,2)` | R | **Normalized/derived** — sum of line items flagged payroll-qualifying |
| `qualifying_laboratory_expense` | `NUMERIC(14,2)` | R | **Normalized/derived** |
| `monthly_overtime_cost` | `NUMERIC(14,2)` | R | **Normalized fact** — one specific payroll line, per [`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md) |
| `revision_number` | `INTEGER` | R | |
| `supersedes_snapshot_id` | `UUID` | N | |
| `import_job_id` | `UUID` | R | **Sprint 3B.3 Correction 3:** composite FK, with `organization_id` → `import_job (organization_id, id)`; corrected from a plain FK |

**`import_profile_version_id` removed (Sprint 3B.3 Correction 3)** — same reasoning as `revenue_snapshot` above; derived exclusively through `import_job_id`.

**`account_mapping_version_id` removed (Sprint 3B.4 Correction 5).** Sprint 3B/3B.1/3B.2 carried this as an independently writable composite FK to `organization_import_profile_override`, duplicating a fact already determined by this same row's own `import_job_id`: the account-mapping override actually in effect for this Payroll Snapshot is, by definition, whichever override its producing Import Job used. Nothing previously prevented the two from disagreeing — an Import Job could pin one override while the snapshot it produced independently recorded a different one. This column is removed; the fact is now derived exclusively through `payroll_snapshot.import_job_id → import_job.organization_import_profile_override_id`, matching the same never-store-it-twice principle already applied to `import_profile_version_id` above. No repository document ([`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md) or elsewhere) describes the account-mapping version as a concept distinct from the Import Job's own override, so this is treated as the same fact, not preserved as an ambiguity.

**Composite key added (Sprint 3B.4 Correction 2):** `UNIQUE (organization_id, import_job_id, id)`, in addition to the existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `import_normalized_value_payroll_snapshot`'s and `payroll_snapshot_line_item`'s strengthened same-Import-Job composite FKs. See [`06-import-lineage-model.md`](06-import-lineage-model.md).

### `payroll_snapshot_line_item`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized, enables the composite FKs below |
| `import_job_id` | `UUID` | R | **New (Sprint 3B.4 Correction 2)** — denormalized, must agree with both `payroll_snapshot_id`'s and `import_source_row_id`'s own Import Job (enforced by the two composite FKs below sharing this same column) |
| `payroll_snapshot_id` | `UUID` | R | Composite FK, with `organization_id`**and**`import_job_id` → `payroll_snapshot (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version |
| `import_source_row_id` | `UUID` | R | Composite FK, with `organization_id`**and**`import_job_id` → `import_source_row (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version; one source row produces exactly one line item, and this now guarantees that source row belongs to the same Import Job as the header it feeds, not merely the same organization. See [`06-import-lineage-model.md`](06-import-lineage-model.md) "Detail Tables — Same-Import-Job Enforcement" |
| `account_label` | `TEXT` | R | **Imported fact**, as-mapped |
| `account_category` | `TEXT` | R | `CHECK` in (`payroll`, `laboratory_expense`, `unmapped`) |
| `amount` | `NUMERIC(14,2)` | R | **Imported fact** |
| `is_included_in_qualifying_expense` | `BOOLEAN` | R | Reflects the organization's account mapping at import time |

### `labor_model_snapshot`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `reporting_period_start` | `DATE` | R | |
| `reporting_period_end` | `DATE` | R | |
| `staffing_adherence_percentage` | `NUMERIC(7,4)` | N | **Imported fact**, stored as-is (OQ-059 formula unresolved) |
| `labor_percentage_of_revenue` | `NUMERIC(7,4)` | N | **Imported fact** — kept permanently separate from `payroll_snapshot`'s Payroll Percentage per Founder Decision 4 / OQ-060; never merged, overwritten, or reconciled by this schema |
| `revision_number` | `INTEGER` | R | |
| `supersedes_snapshot_id` | `UUID` | N | |
| `import_job_id` | `UUID` | R | **Sprint 3B.3 Correction 3:** composite FK, with `organization_id` → `import_job (organization_id, id)`; corrected from a plain FK |

**`import_profile_version_id` removed (Sprint 3B.3 Correction 3)** — same reasoning as `revenue_snapshot` above; derived exclusively through `import_job_id`.

**Composite key added (Sprint 3B.4 Correction 2):** `UNIQUE (organization_id, import_job_id, id)`, in addition to the existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `import_normalized_value_labor_model_snapshot`'s and `labor_model_staffing_measure`'s strengthened same-Import-Job composite FKs. See [`06-import-lineage-model.md`](06-import-lineage-model.md).

### `labor_model_staffing_measure`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized, enables the composite FKs below |
| `import_job_id` | `UUID` | R | **New (Sprint 3B.4 Correction 2)** — denormalized, must agree with both `labor_model_snapshot_id`'s and `import_source_row_id`'s own Import Job |
| `labor_model_snapshot_id` | `UUID` | R | Composite FK, with `organization_id`**and**`import_job_id` → `labor_model_snapshot (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version |
| `import_source_row_id` | `UUID` | R | Composite FK, with `organization_id`**and**`import_job_id` → `import_source_row (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version. See [`06-import-lineage-model.md`](06-import-lineage-model.md) "Detail Tables — Same-Import-Job Enforcement" |
| `measure_type` | `TEXT` | R | `CHECK` in (`recommended`, `current`) |
| `unit_type` | `TEXT` | R | `CHECK` in (`headcount`, `fte`, `role_broken_out`) — supports OQ-061's three candidate units without a redesign |
| `job_role_id` | `UUID` | N | FK → `job_role.id`; populated only when `unit_type = 'role_broken_out'`. **Sprint 3B.2:** `job_role.organization_id` is nullable, so this is a Global-or-Same-Organization Reference enforced by a Sprint 3C trigger (see [`01-physical-model-principles.md`](01-physical-model-principles.md)), found during the broader integrity audit |
| `measure_value` | `NUMERIC(10,2)` | N | Parsed numeric value; **derived from** `source_provided_value` |
| `source_provided_unit_label` | `TEXT` | N | Raw source terminology, retained verbatim |
| `source_provided_value` | `TEXT` | R | **Imported fact**, raw as-imported string — always retained even if unparsable |

### `backlog_snapshot`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `reporting_date` | `DATE` | R | |
| `source_provided_total_case_count` | `INTEGER` | N | **Sprint 3B.1 Correction 9 — imported fact.** Populated only when the source directly provides a total; `NULL` otherwise |
| `derived_total_case_count` | `INTEGER` | N | **Derived value** — sum of stage counts where `production_stage.is_included_in_total = true`; `NULL` whenever any relevant stage's inclusion flag is still unresolved for this organization (see `production_stage` below) |
| `displayed_total_basis` | `TEXT` | R | `CHECK` in (`source_provided`, `derived`, `unavailable`) — which of the two total columns (if either) is authoritative for display; `unavailable` when neither can be trusted |
| `total_discrepancy_amount` | `INTEGER` | N | `source_provided_total_case_count - derived_total_case_count`, computed only when both are non-null; `NULL` otherwise |
| `revision_number` | `INTEGER` | R | |
| `supersedes_snapshot_id` | `UUID` | N | |
| `import_job_id` | `UUID` | N | **Sprint 3B.3 Correction 3:** composite FK, with `organization_id` → `import_job (organization_id, id)`; `NULL` when manually entered; corrected from a plain FK |
| `manual_entry_user_id` | `UUID` | N | Composite FK, with `organization_id` → `app_user (organization_id, id)`; populated when `import_job_id IS NULL` |

**Source-shape `CHECK` (Sprint 3B.3 Correction 3):** `CHECK ((import_job_id IS NOT NULL AND manual_entry_user_id IS NULL) OR (import_job_id IS NULL AND manual_entry_user_id IS NOT NULL))` — the "one or the other" relationship between these two columns was previously only a documentation convention; it is now a genuine, enforced same-row constraint. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Snapshot-to-Import Tenant Integrity."

**Composite key added (Sprint 3B.4 Correction 2):** `UNIQUE (organization_id, import_job_id, id)`, in addition to the existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `import_normalized_value_backlog_snapshot`'s and imported-path `backlog_stage_count`'s strengthened same-Import-Job composite FKs. Because `import_job_id` is nullable here, this key simply excludes manually-entered rows from ever satisfying an Import-Job-matched composite FK — the correct behavior, since a manual header has no Import Job to match against. See [`06-import-lineage-model.md`](06-import-lineage-model.md).

**Sprint 3B.1 Correction 9 — no single `total_case_count` column.** Sprint 3B's single `total_case_count` column silently meant "imported fact" in some cases and "derived calculation" in others, and implicitly assumed Resets/Remakes were excluded from the total by defaulting `production_stage.is_included_in_total` to `false` for those two stages — an invented business assumption nothing in the repository approved. This design removes that assumption entirely: `production_stage.is_included_in_total` is now nullable with **no default and no seeded value for any stage**, `derived_total_case_count` is `NULL` until every relevant stage's inclusion flag is confirmed for that organization, and `displayed_total_basis` makes explicit, per snapshot, which total (if either) is currently trustworthy for display.

### `production_stage`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | N | `NULL` = system-default stage available to every organization |
| `code` | `TEXT` | R | Stable identifier, e.g. `to_be_set` |
| `name` | `TEXT` | R | Display label |
| `is_included_in_total` | `BOOLEAN` | **N** | **Sprint 3B.1 Correction 9 — no default, for any stage.** `NULL` = the business meaning of this stage (whether it counts toward total backlog) is unresolved for this organization/stage combination (OQ-051). This must remain nullable and unseeded until a founder or organization-specific decision explicitly sets it `true` or `false` for a given stage. |
| `display_order` | `INTEGER` | R | |
| `effective_start_date` | `DATE` | R | |
| `effective_end_date` | `DATE` | N | |

**Non-overlap (corrected, Sprint 3B.2 Correction 4):** a single `EXCLUDE` constraint including a nullable `organization_id WITH =` does **not** actually catch two overlapping system-default rows — PostgreSQL treats each `NULL` as distinct, so two `organization_id IS NULL` rows for the same `code` would never be flagged as conflicting under Sprint 3B.1's single-constraint design, the opposite of the protection that design claimed to provide. Corrected to **two** separate constraints:

```text
EXCLUDE USING gist (code WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)
  WHERE (organization_id IS NULL)

EXCLUDE USING gist (organization_id WITH =, code WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)
  WHERE (organization_id IS NOT NULL)
```

See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "The Nullable-`organization_id` Exclusion Bug" for the full explanation.

### `backlog_stage_count`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized, enables the composite FKs below |
| `import_job_id` | `UUID` | N | **New (Sprint 3B.4 Correction 2)** — mirrors `backlog_snapshot.import_job_id`'s own nullability; `NULL` for a manually-entered stage count, populated for an imported one |
| `backlog_snapshot_id` | `UUID` | R | Unconditional composite FK, with `organization_id` → `backlog_snapshot (organization_id, id)` (Sprint 3B.2, always enforced regardless of `import_job_id`). **Additional, conditional composite FK (Sprint 3B.4 Correction 2):** `(organization_id, import_job_id, backlog_snapshot_id) → backlog_snapshot (organization_id, import_job_id, id)` — checked only when `import_job_id IS NOT NULL` (PostgreSQL `MATCH SIMPLE` default), requiring an imported stage count's header to share its exact Import Job |
| `production_stage_id` | `UUID` | R | FK → `production_stage.id` — **deliberately not** a composite/organization-enforced FK: a `production_stage` row may legitimately be a global default (`organization_id IS NULL`) shared by every organization, which is the intended lookup-table pattern, not a gap. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Intentionally Permitted Cross-Organization References." |
| `import_source_row_id` | `UUID` | N | When populated, composite FK, with `organization_id`**and**`import_job_id` → `import_source_row (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version; `NULL` when the stage count originates from manual entry rather than an import |
| `case_count` | `INTEGER` | R | `CHECK (case_count >= 0)` |

**Source-shape `CHECK` (new, Sprint 3B.4 Correction 2):** `CHECK ((import_job_id IS NOT NULL AND import_source_row_id IS NOT NULL) OR (import_job_id IS NULL AND import_source_row_id IS NULL))` — a stage count is either fully imported (both populated) or fully manual (both `NULL`); previously only a documentation convention, now a genuine same-row constraint. One cross-row gap remains honestly undocumented as anything other than a Sprint 3C trigger requirement: nothing here can force a manual stage count's own header to *also* be manual (as opposed to a manual count attaching, via the unconditional base FK, to an imported header) — see [`06-import-lineage-model.md`](06-import-lineage-model.md) "Detail Tables — Same-Import-Job Enforcement" for the full explanation of why this specific case cannot be a `CHECK` or a plain composite FK.

## Metrics and Business Rules

### `metric_definition`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `code` | `TEXT` | R | e.g. `payroll_percentage` |
| `name` | `TEXT` | R | |
| `status` | `TEXT` | R | `CHECK` in (`proposed`, `approved`, `deprecated`) |

**Sprint 3B.1 Correction 6 — identity only.** `reporting_grain` and `null_zero_behavior` have moved to `metric_definition_version` below: both are calculation-sensitive properties that could legitimately change between versions of the same metric (for example, a refined null-handling policy), so they belong with the versioned, reproducible calculation definition, not the never-changing identity row — matching the same identity/version split already used for `business_rule`, `import_profile`, and `scenario_definition`.

### `metric_definition_version`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `metric_definition_id` | `UUID` | R | FK → `metric_definition.id` |
| `version_number` | `INTEGER` | R | Sequential, monotonic per definition |
| `reporting_grain` | `TEXT` | R | e.g. `office_period` — **moved from `metric_definition` (Correction 6)** |
| `null_zero_behavior` | `TEXT` | R | e.g. `unavailable` — **moved from `metric_definition` (Correction 6)** |
| `formula_description` | `TEXT` | R | Human-readable; no executable formula stored |
| `calculation_key` | `TEXT` | R | **New (Correction 6).** A stable identifier for the deterministic calculation implementation this version uses (for example, `payroll_percentage_calc`), independent of the human-readable formula description |
| `implementation_version` | `TEXT` | R | **New (Correction 6).** An immutable code/build identifier (for example, a semantic version or commit SHA of the calculation module) sufficient to identify exactly which deterministic implementation produced any `metric_observation` citing this version. No executable formula code is ever stored in the database — this column identifies the implementation, it does not contain it. |
| `effective_start_date` | `DATE` | R | |
| `effective_end_date` | `DATE` | N | |

**Non-overlap:** `EXCLUDE USING gist (metric_definition_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)`.

### `business_rule`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `code` | `TEXT` | R | e.g. `BR-001` |
| `name` | `TEXT` | R | |
| `status` | `TEXT` | R | `CHECK` in (`proposed`, `approved`, `deprecated`) |

### `business_rule_version`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `business_rule_id` | `UUID` | R | FK → `business_rule.id` |
| `organization_id` | `UUID` | N | `NULL` = shared/global default version |
| `version_number` | `INTEGER` | R | |
| `effective_start_date` | `DATE` | R | |
| `effective_end_date` | `DATE` | N | |

**Sprint 3B.1 Correction 5 — `threshold_value`/`threshold_operator`/`threshold_unit` removed from this table.** A single set of threshold columns on `business_rule_version` cannot represent BR-001 (which has four independent numeric triggers) or any rule with more than one condition. See `business_rule_condition` below, which now carries every threshold.

**Non-overlap (corrected, Sprint 3B.2 Correction 4):** the same nullable-`organization_id` exclusion bug identified on `production_stage` applies here — a single `EXCLUDE` including `organization_id WITH =` does not catch two overlapping global-default rule versions. Corrected to two constraints:

```text
EXCLUDE USING gist (business_rule_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)
  WHERE (organization_id IS NULL)

EXCLUDE USING gist (business_rule_id WITH =, organization_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)
  WHERE (organization_id IS NOT NULL)
```

### `business_rule_condition` (new — Sprint 3B.1 Correction 5)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `business_rule_version_id` | `UUID` | R | FK → `business_rule_version.id` |
| `condition_code` | `TEXT` | R | Stable identifier, e.g. `payroll_pct_above_threshold`; unique within its parent version |
| `condition_type` | `TEXT` | R | `CHECK` in (`numeric`, `qualitative`, `missing_data`, `stale_data`, `other`) |
| `metric_definition_version_id` | `UUID` | N | FK → `metric_definition_version.id`; populated when the condition evaluates a specific metric (typical for `numeric` conditions) |
| `operator` | `TEXT` | N | `CHECK` in (`gt`, `gte`, `lt`, `lte`); `NULL` for non-numeric condition types |
| `threshold_value` | `NUMERIC(10,4)` | N | e.g. `8.0000`; `NULL` for non-numeric condition types |
| `threshold_unit` | `TEXT` | N | e.g. `percent`, `usd`, `cases` |
| `is_enabled` | `BOOLEAN` | R | Default `true` — whether this specific condition is currently active, independent of sibling conditions on the same rule version |
| `display_order` | `INTEGER` | R | |
| `explanation` | `TEXT` | R | Human-readable explanation of what the condition means and why it exists |
| `allows_organization_override` | `BOOLEAN` | R | Default `true` — whether an organization-specific `business_rule_version` may supply a different value for this same `condition_code`. Effective version context (which specific version is in force for a given organization/date) is inherited from the parent `business_rule_version`'s own `organization_id`/`effective_start_date`/`effective_end_date` — not duplicated here. |

**Uniqueness:** `UNIQUE (business_rule_version_id, condition_code)`.

**BR-001, represented:** BR-001's approved global default version (`business_rule_version.organization_id IS NULL`) carries exactly four `business_rule_condition` rows — `payroll_pct_above_threshold` (8.0%), `lab_expense_pct_above_threshold` (10.8%), `monthly_overtime_above_threshold` ($500), `backlog_at_least_threshold` (20 cases) — each independently versioned, enabled, and explained, closing the requirement that BR-001 not be stuffed into a single row.

### `metric_observation`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `metric_definition_version_id` | `UUID` | R | FK → `metric_definition_version.id` |
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `reporting_period_start` | `DATE` | R | |
| `reporting_period_end` | `DATE` | R | |
| `computed_value` | `NUMERIC(14,4)` | N | `NULL` when `availability_state = 'unavailable'` |
| `availability_state` | `TEXT` | R | `CHECK` in (`available`, `unavailable`) — explicit null/zero-denominator handling, never a silent `0` or infinity |
| `availability_reason` | `TEXT` | N | Populated when `availability_state = 'unavailable'` (for example, `zero_denominator`, `missing_source_data`) |
| `evaluation_fingerprint` | `TEXT` | R | **New (Sprint 3B.2 Correction 1)** — a deterministic value (application-computed, e.g. a SHA-256 digest) over `metric_definition_version_id` + `office_id` + reporting period + `implementation_version` + the ordered set of about-to-be-inserted components (each as `component_key` + either its resolved source snapshot id or its literal value+unit). Identifies "these exact inputs were used," distinct from `computed_at`. |
| `revision_number` | `INTEGER` | R | **New (Sprint 3B.2 Correction 1)** — starts at `1`; a corrected re-evaluation (different `evaluation_fingerprint`) for the same version/office/period inserts the next integer |
| `supersedes_metric_observation_id` | `UUID` | N | **New (Sprint 3B.2 Correction 1)** — self-referencing composite FK, matching the same natural-key pattern as the four canonical snapshots; `NULL` for the first revision |
| `computed_at` | `TIMESTAMPTZ` | R | Plain metadata timestamp — **never part of identity**, per the founder's explicit instruction |

**Sprint 3B.1 Correction 6 — `numerator_value`/`denominator_value` removed.** A single numerator/denominator pair cannot represent every metric this schema needs to support (a comparison metric may have a current value and a comparison value; a multi-input metric may have more than two inputs). See `metric_observation_component` below, which replaces both columns with an arbitrary number of typed, individually-sourced components.

**Uniqueness, corrected (Sprint 3B.2 Correction 1):** Sprint 3B.1's `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end)` incorrectly blocked a legitimate second observation whenever a source snapshot was corrected without the metric's own calculation version changing. Corrected to `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)` — this still prevents persisting a genuine duplicate (same exact inputs computed twice), while permitting any number of observations with *different* fingerprints (genuine corrections) for the same version/office/period. `UNIQUE (supersedes_metric_observation_id)` (nulls excluded) limits each observation to one direct successor. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Metric Observation Identity and Reuse" for the full reasoning, including how the latest revision is found and how Alerts/Recommendations retain their original historical reference regardless of later corrections.

**Composite-FK-support keys added (Sprint 3B.3 Correction 1):** `UNIQUE (organization_id, id)`, `UNIQUE (organization_id, office_id, id)`, and `UNIQUE (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — Sprint 3B.2 introduced composite FKs *from* `metric_observation_component`, `condition_evaluation`, `recommendation_evidence_metric_observation`, and `metric_observation`'s own self-referencing `supersedes_metric_observation_id` *into* this table, but never verified a matching parent-side `UNIQUE` constraint actually existed for any of them. These three keys close that gap; none affects how many observations may exist for a given natural key. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Composite Foreign Key Verification Matrix."

**Persistence policy (unchanged from Sprint 3B, now the settled design — see judgment-call review in [`SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)):** a row is persisted only when a computed value becomes a durable evaluation record — cited by an Alert, Recommendation, saved Scenario, scheduled evaluation, or exported report — never for a transient dashboard render.

### `metric_observation_component` (Sprint 3B.1 Correction 6, replaces the four `metric_observation_*_snapshot` typed join tables)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized, enables the composite FKs below |
| `metric_observation_id` | `UUID` | R | **Sprint 3B.2:** composite FK, with `organization_id` → `metric_observation (organization_id, id)` |
| `component_key` | `TEXT` | R | Stable key, e.g. `qualifying_payroll_expense`; unique within its parent observation |
| `component_role` | `TEXT` | R | `CHECK` in (`numerator`, `denominator`, `current_value`, `comparison_value`, `input`, `adjustment`, `other`) |
| `component_value` | `NUMERIC(14,4)` | R | |
| `unit` | `TEXT` | R | e.g. `usd`, `percent`, `count` |
| `office_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized copy of the parent observation's office, needed only to support the organization-**and**-office composite FKs below |
| `source_revenue_snapshot_id` | `UUID` | N | **Sprint 3B.2:** composite FK, with `organization_id`+`office_id` → `revenue_snapshot (organization_id, office_id, id)` — strengthened from a plain typed FK to enforce same organization **and** office as the parent observation |
| `source_payroll_snapshot_id` | `UUID` | N | Same pattern, → `payroll_snapshot (organization_id, office_id, id)` |
| `source_labor_model_snapshot_id` | `UUID` | N | Same pattern, → `labor_model_snapshot (organization_id, office_id, id)` |
| `source_backlog_snapshot_id` | `UUID` | N | Same pattern, → `backlog_snapshot (organization_id, office_id, id)` |

**Check constraint:** `CHECK (num_nonnulls(source_revenue_snapshot_id, source_payroll_snapshot_id, source_labor_model_snapshot_id, source_backlog_snapshot_id) <= 1)` — a component may cite at most one snapshot type (zero when the component is not snapshot-derived, e.g. a manually-entered comparison value); PostgreSQL's built-in `num_nonnulls()` makes this a genuine, enforceable same-row `CHECK`, not an application-layer convention.

**Uniqueness:** `UNIQUE (metric_observation_id, component_key)`.

**Why this replaces the observation-level typed join tables:** Sprint 3B's `metric_observation_*_snapshot` tables recorded *which snapshot types* an observation cited, but not *which component came from which snapshot* — a Payroll Percentage observation's numerator (from `payroll_snapshot`) and denominator (from `revenue_snapshot`) were indistinguishably lumped together. Attaching the typed snapshot reference to each **component** instead is strictly more precise, still fully relational (no polymorphic column), and directly satisfies "exact component values" paired with "exact source snapshots," now additionally guaranteeing (Sprint 3B.2) that each cited snapshot belongs to the same Organization and Office as the observation itself.

### `condition_evaluation` (new — Sprint 3B.2 Correction 6)

The immutable record of "this specific Business Rule Condition was evaluated, at this time, for this Office, with this evidence" — introduced so `alert` can represent every `business_rule_condition.condition_type`, not only `numeric`.

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `business_rule_condition_id` | `UUID` | R | The exact condition evaluated. Its parent `business_rule_version` may be a global default (nullable `organization_id`) — a Global-or-Same-Organization Reference, Sprint 3C trigger required (see [`01-physical-model-principles.md`](01-physical-model-principles.md)) |
| `reporting_period_start` | `DATE` | R | |
| `reporting_period_end` | `DATE` | R | |
| `evaluated_at` | `TIMESTAMPTZ` | R | |
| `metric_observation_id` | `UUID` | N | Composite FK, with `organization_id`+`office_id` → `metric_observation (organization_id, office_id, id)`. **Populated only for `numeric` conditions** — `NULL` for `qualitative`, `missing_data`, `stale_data`, and `other`, satisfying the requirement that a Metric Observation must not be universally required |
| `numeric_triggered_value` | `NUMERIC(14,4)` | N | Populated only alongside `metric_observation_id` |
| `qualitative_summary` | `TEXT` | N | Human-readable explanation of why a non-numeric condition fired (e.g. "No Backlog import received for this Office in the prior 14 days"); populated when `metric_observation_id IS NULL` |

No **natural-key** uniqueness constraint — deliberately, so a condition can be legitimately re-evaluated for the same office/period across corrected source data without hitting the exact mistake Correction 1 fixed on `metric_observation`. **Composite-FK-support keys added (Sprint 3B.3 Correction 1):** `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `condition_evaluation_evidence` and `alert`'s composite FKs into this table, which Sprint 3B.2 introduced without ever declaring the matching parent key. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Composite Foreign Key Verification Matrix."

### `condition_evaluation_evidence` (new — Sprint 3B.2 Correction 6; `office_id` and evidence-shape checks added, Sprint 3B.3 Correction 2)

Typed, relational evidence for non-numeric conditions needing more than a text summary — for example, citing the specific `import_job` a `missing_data`/`stale_data` condition concerns. Satisfies "preserve source/evidence references without unrestricted JSON replacing relational design."

| Column | Type | R/N | Notes |
|---|---|---|---|
| `condition_evaluation_id` | `UUID` | R | Composite FK, with `organization_id`+`office_id` → `condition_evaluation (organization_id, office_id, id)` — **corrected in Sprint 3B.3** from a plain FK, now that this row carries its own `office_id` to compose the key from |
| `organization_id` | `UUID` | R | Denormalized, enables the composite FKs below |
| `office_id` | `UUID` | R | **New (Sprint 3B.3 Correction 2)** — Sprint 3B.2 omitted this column entirely, which meant the "organization-and-office-matched" snapshot references below could not actually be expressed as composite FKs. Must always match the parent `condition_evaluation`'s office, enforced by the composite FK above |
| `evidence_role` | `TEXT` | R | `CHECK` in (`missing_import`, `stale_snapshot`, `referenced_snapshot`, `other`) |
| `referenced_import_job_id` | `UUID` | N | Composite FK, with `organization_id` → `import_job (organization_id, id)`. `import_job` has no `office_id` (a single import can cover multiple Offices), so only organization-match is enforceable here |
| `referenced_revenue_snapshot_id` | `UUID` | N | Composite FK, with this row's own `organization_id`+`office_id` → `revenue_snapshot (organization_id, office_id, id)` |
| `referenced_payroll_snapshot_id` | `UUID` | N | Same pattern |
| `referenced_labor_model_snapshot_id` | `UUID` | N | Same pattern |
| `referenced_backlog_snapshot_id` | `UUID` | N | Same pattern |
| `notes` | `TEXT` | N | Required when `evidence_role = 'other'`; also carries the missing-Import-Job explanation for `evidence_role = 'missing_import'` when no relevant Import Job has ever existed — see below |

**Check constraints:** `CHECK (num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id, referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) <= 1)` — same mutual-exclusivity pattern as `metric_observation_component`. **New (Sprint 3B.3 Correction 2):** a second, evidence-shape `CHECK` ties `evidence_role` to which columns must actually be populated, and rules out an entirely empty row — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Alert Evidence Model" for the full constraint text and the honest representation chosen for a `missing_data` condition with no Import Job to cite.

### `alert` (Sprint 3B.1 Correction 8 — immutable core only; Sprint 3B.2 Correction 6 — redesigned to reference `condition_evaluation`; see `alert_lifecycle_event` below)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized, retained directly for RLS simplicity |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `condition_evaluation_id` | `UUID` | R | **New (Sprint 3B.2 Correction 6)** — composite FK, with `organization_id`+`office_id` → `condition_evaluation (organization_id, office_id, id)`. The single reference to the immutable evaluation that produced this Alert. **`UNIQUE (condition_evaluation_id)` added (Sprint 3B.3 Correction 6)** — no more than one Alert may ever be generated from the same immutable Condition Evaluation; a repeated evaluation produces a new `condition_evaluation` row, and therefore, if warranted, a new distinct Alert |
| `triggered_at` | `TIMESTAMPTZ` | R | The moment **this Alert** was generated — kept distinct from `condition_evaluation.evaluated_at` |

**Sprint 3B.2 Correction 6 — `business_rule_condition_id`, `metric_observation_id`, `reporting_period_start`/`reporting_period_end`, and `triggered_value` (all present through Sprint 3B.1) have moved to `condition_evaluation`.** Sprint 3B.1's `metric_observation_id NOT NULL` could not represent a condition that fires with no Metric Observation (`qualitative`, `missing_data`, `stale_data`, `other` condition types) — this is the correction. `alert` is now a thin, RLS-friendly pointer at the evaluation that produced it, rather than duplicating that evaluation's own facts.

Sprint 3B's `status`, `dismissal_reason`, `dismissed_by_user_id`, and `dismissed_at` columns remain on `alert_lifecycle_event` (Sprint 3B.1 Correction 8, unaffected by this further change) — an Alert's core record is immutable and carries no mutable status, matching how `recommendation` already works.

### `alert_lifecycle_event` (new — Sprint 3B.1 Correction 8)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized — enables composite FK on `actor_user_id` and on `alert_id` (see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md)) |
| `alert_id` | `UUID` | R | Composite FK, with `organization_id` → `alert (organization_id, id)` |
| `sequence_number` | `INTEGER` | R | **Sprint 3B.1 Correction 12** — monotonic within `alert_id`; the current state is the row with `MAX(sequence_number)`, never inferred from `occurred_at` alone |
| `state` | `TEXT` | R | `CHECK` in (`open`, `acknowledged`, `dismissed`) |
| `actor_user_id` | `UUID` | N | Composite FK, with `organization_id` → `app_user (organization_id, id)`; `NULL` for the system-generated initial `open` event |
| `occurred_at` | `TIMESTAMPTZ` | R | |
| `reason` | `TEXT` | N | Required (app-layer) for `dismissed` |

**Uniqueness:** `UNIQUE (alert_id, sequence_number)`.

**Atomicity (Sprint 3B.1 Correction 12):** the initial `open` event (`sequence_number = 1`) must be created in the same transaction as its parent `alert` row — an Alert must never exist, even momentarily, with no lifecycle event. Sprint 3C should enforce this via a single stored write path (function/RPC) rather than trusting every caller to remember both inserts.

**Valid transitions (documented for Sprint 3C, no SQL written here):** `open → acknowledged`, `open → dismissed` (direct dismissal is allowed), `acknowledged → dismissed`. No transition returns to `open` — if the underlying condition re-triggers after dismissal, a new `alert` row is generated, not a reopened lifecycle event. Sprint 3C should enforce this either with a trigger validating `(previous_state, new_state)` against this allow-list, or an equivalent application-layer guard.

## Scenarios

### `scenario_definition` / `scenario_definition_version`

| Table | Column | Type | R/N | Notes |
|---|---|---|---|---|
| `scenario_definition` | `code` | `TEXT` | R | e.g. `hiring` |
| `scenario_definition` | `name` | `TEXT` | R | |
| `scenario_definition` | `status` | `TEXT` | R | `CHECK` in (`proposed`, `approved`, `deprecated`) |
| `scenario_definition_version` | `scenario_definition_id` | `UUID` | R | FK |
| `scenario_definition_version` | `version_number` | `INTEGER` | R | |
| `scenario_definition_version` | `structure_notes` | `TEXT` | N | No formulas defined at this stage, per [`docs/entities/scenario.md`](../entities/scenario.md) |
| `scenario_definition_version` | `effective_start_date` | `DATE` | R | |
| `scenario_definition_version` | `effective_end_date` | `DATE` | N | |

**Non-overlap:** `EXCLUDE USING gist (scenario_definition_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)`.

### `scenario_parameter_definition` / `scenario_output_definition` (new — Sprint 3B.1 Correction 11)

| Table | Column | Type | R/N | Notes |
|---|---|---|---|---|
| `scenario_parameter_definition` | `scenario_definition_version_id` | `UUID` | R | FK. **Sprint 3B.3 Correction 4:** this table also gains `UNIQUE (scenario_definition_version_id, id)`, letting `scenario_input` verify a cited definition belongs to the exact version it claims to |
| `scenario_parameter_definition` | `parameter_key` | `TEXT` | R | Stable, e.g. `proposed_hire_job_role`; unique within its version |
| `scenario_parameter_definition` | `display_name` | `TEXT` | R | |
| `scenario_parameter_definition` | `data_type` | `TEXT` | R | `CHECK` in (`numeric`, `text`, `boolean`, `date`, `reference`) |
| `scenario_parameter_definition` | `reference_target_type` | `TEXT` | N | **New (Sprint 3B.2 Correction 9)** — `CHECK` in (`job_role`, `office`); required when `data_type = 'reference'`, `NULL` otherwise. Names which of `scenario_input`'s two typed reference columns this definition expects populated. |
| `scenario_parameter_definition` | `unit` | `TEXT` | N | |
| `scenario_parameter_definition` | `is_required` | `BOOLEAN` | R | Default `true` |
| `scenario_parameter_definition` | `validation_notes` | `TEXT` | N | |
| `scenario_parameter_definition` | `display_order` | `INTEGER` | R | |
| `scenario_output_definition` | `scenario_definition_version_id` | `UUID` | R | FK. **Sprint 3B.3 Correction 4:** same `UNIQUE (scenario_definition_version_id, id)` addition, for `scenario_output` |
| `scenario_output_definition` | `output_key` | `TEXT` | R | Stable, e.g. `projected_payroll_percentage`; unique within its version |
| `scenario_output_definition` | `display_name` | `TEXT` | R | |
| `scenario_output_definition` | `data_type` | `TEXT` | R | Same vocabulary as parameter `data_type` |
| `scenario_output_definition` | `reference_target_type` | `TEXT` | N | Same as `scenario_parameter_definition.reference_target_type` above |
| `scenario_output_definition` | `unit` | `TEXT` | N | |
| `scenario_output_definition` | `display_order` | `INTEGER` | R | |

**Uniqueness:** `UNIQUE (scenario_definition_version_id, parameter_key)` and `UNIQUE (scenario_definition_version_id, output_key)` respectively, plus `UNIQUE (scenario_definition_version_id, id)` on each (Sprint 3B.3 Correction 4, see above).

**Same-row `CHECK` (Sprint 3B.3 Correction 6):** both tables gain `CHECK ((data_type = 'reference' AND reference_target_type IS NOT NULL) OR (data_type <> 'reference' AND reference_target_type IS NULL))` — fully declarative, no trigger needed.

### `scenario_run`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `scenario_definition_version_id` | `UUID` | R | FK → `scenario_definition_version.id` |
| `created_by_user_id` | `UUID` | R | Composite FK, with `organization_id` → `app_user (organization_id, id)` |
| `warnings` | `TEXT` | N | |

**Composite keys:** `UNIQUE (organization_id, id)` — used by `scenario_input`/`scenario_output`'s composite FK (Sprint 3B.2 Correction 2). `UNIQUE (organization_id, office_id, id)` (**new, Sprint 3B.2**) — used by the four `scenario_run_*_snapshot` join tables' same-Office composite FKs and by `recommendation.origin_scenario_run_id`'s composite FK. `UNIQUE (id, scenario_definition_version_id)` (**new, Sprint 3B.3 Correction 4**) — lets `scenario_input`/`scenario_output` declaratively verify they cite the exact Scenario Definition Version their parent Run used, not merely *a* valid version.

### `scenario_run_revenue_snapshot` / `..._payroll_snapshot` / `..._labor_model_snapshot` / `..._backlog_snapshot`

Four typed join tables: `organization_id UUID` + `office_id UUID` (**new, Sprint 3B.2 Correction 2** — denormalized from `scenario_run`) + `scenario_run_id UUID` + `<type>_snapshot_id UUID`, composite PK on `(scenario_run_id, <type>_snapshot_id)`. **Sprint 3B.2:** `(organization_id, office_id, scenario_run_id) → scenario_run (organization_id, office_id, id)` and `(organization_id, office_id, <type>_snapshot_id) → <type>_snapshot (organization_id, office_id, id)` — both composite FKs require the **same Office**, not merely the same Organization, directly closing the founder's explicit example: "A Scenario Run for Office A must not use an Office B snapshot." No exception to same-Office baselines is documented anywhere in this repository, so none is permitted.

### `scenario_input` / `scenario_output` (Sprint 3B.1 Correction 11 — typed, definition-referencing values; Sprint 3B.2 Correction 9 — typed reference targets, replacing the single generic `value_reference_id`)

| Table | Column | Type | R/N | Notes |
|---|---|---|---|---|
| `scenario_input` | `organization_id` | `UUID` | R | **New (Sprint 3B.2 Correction 2)** — denormalized from `scenario_run`, enables the composite FKs below |
| `scenario_input` | `scenario_run_id` | `UUID` | R | Composite FK, with `organization_id` → `scenario_run (organization_id, id)` |
| `scenario_input` | `scenario_definition_version_id` | `UUID` | R | **New (Sprint 3B.3 Correction 4)** — composite FK `(scenario_run_id, scenario_definition_version_id) → scenario_run (id, scenario_definition_version_id)`, guaranteeing this exactly matches the parent Run's own version |
| `scenario_input` | `scenario_parameter_definition_id` | `UUID` | R | **Sprint 3B.3 Correction 4:** composite FK `(scenario_definition_version_id, scenario_parameter_definition_id) → scenario_parameter_definition (scenario_definition_version_id, id)` — replaces the Sprint 3B.1 plain FK, now guaranteeing the cited definition belongs to the exact same version as this row's own `scenario_definition_version_id` (which in turn must match the parent Run, per above) |
| `scenario_input` | `value_numeric` | `NUMERIC(14,4)` | N | |
| `scenario_input` | `value_text` | `TEXT` | N | |
| `scenario_input` | `value_boolean` | `BOOLEAN` | N | |
| `scenario_input` | `value_date` | `DATE` | N | |
| `scenario_input` | `value_reference_job_role_id` | `UUID` | N | **New (Sprint 3B.2 Correction 9), replaces `value_reference_id`** — populated only when the referenced definition's `reference_target_type = 'job_role'`. `job_role.organization_id` is nullable, so this is a Global-or-Same-Organization Reference, Sprint 3C trigger required |
| `scenario_input` | `value_reference_office_id` | `UUID` | N | **New (Sprint 3B.2 Correction 9)** — populated only when `reference_target_type = 'office'`. Composite FK, with `organization_id` → `office (organization_id, id)` — `office.organization_id` is never nullable, so this is a plain, unconditional composite FK |
| `scenario_output` | `organization_id` | `UUID` | R | Same as `scenario_input` |
| `scenario_output` | `scenario_run_id` | `UUID` | R | Composite FK, with `organization_id` → `scenario_run (organization_id, id)` |
| `scenario_output` | `scenario_definition_version_id` | `UUID` | R | **New (Sprint 3B.3 Correction 4)** — same pattern as `scenario_input` above |
| `scenario_output` | `scenario_output_definition_id` | `UUID` | R | **Sprint 3B.3 Correction 4:** composite FK `(scenario_definition_version_id, scenario_output_definition_id) → scenario_output_definition (scenario_definition_version_id, id)` — same pattern as `scenario_input` above |
| `scenario_output` | `value_numeric` | `NUMERIC(14,4)` | N | |
| `scenario_output` | `value_text` | `TEXT` | N | |
| `scenario_output` | `value_boolean` | `BOOLEAN` | N | |
| `scenario_output` | `value_date` | `DATE` | N | |
| `scenario_output` | `value_reference_job_role_id` | `UUID` | N | Same pattern as `scenario_input` |
| `scenario_output` | `value_reference_office_id` | `UUID` | N | Same pattern |

**Why exactly these two target types, and no others (Sprint 3B.2 Correction 9):** Sprint 3B.1's single, generic `value_reference_id UUID` had no identifiable target table — precisely the unenforceable generic reference the founder's instruction prohibits. No repository document (including [`docs/entities/scenario.md`](../entities/scenario.md), whose `structure_notes` remain unconfirmed) confirms a specific reference target type is definitely required for MVP. The only concrete precedent anywhere in the repository is the illustrative `proposed_hire_job_role` parameter-key example and the product's general transfer/office-comparison scenario language — so this design supports exactly JobRole and Office, typed and enforced, and no other generic reference machinery. `scenario_parameter_definition`/`scenario_output_definition` gain a `reference_target_type TEXT NULL CHECK IN ('job_role', 'office')` column (populated only when `data_type = 'reference'`) naming which of the two typed columns a given definition expects — see below.

**Check constraint (both tables):** `CHECK (num_nonnulls(value_numeric, value_text, value_boolean, value_date, value_reference_job_role_id, value_reference_office_id) = 1)` — exactly one compatible value column populated, a genuine same-row `CHECK` using PostgreSQL's built-in `num_nonnulls()`. Which column is expected to be non-null for a given row is determined by the referenced definition's `data_type`/`reference_target_type`; matching the two requires a Sprint 3C trigger, since a `CHECK` cannot join across tables to read the definition row (**Sprint 3B.3 Correction 4** — added to the named Sprint 3C trigger inventory in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md), rather than left as an unlisted "application-layer validation") — but the "exactly one populated" half is fully enforced at the database level regardless.

**Binding to the exact Scenario Definition Version (Sprint 3B.3 Correction 4):** see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Binding Scenario Values to the Run's Exact Definition Version" for the full reasoning behind the new `scenario_definition_version_id` column and its two composite FKs.

**Uniqueness:** `UNIQUE (scenario_run_id, scenario_parameter_definition_id)` on `scenario_input`; `UNIQUE (scenario_run_id, scenario_output_definition_id)` on `scenario_output`.

## Recommendations and Work Tracking

### `recommendation`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `recommendation_type` | `TEXT` | R | e.g. `hiring`, `lss`, `transfer`, `coaching`, `travel`, `budget` |
| `origin_business_rule_version_id` | `UUID` | N | FK → `business_rule_version.id`. **Sprint 3B.2:** `business_rule_version.organization_id` is nullable (global default rules, e.g. BR-001), so this is a Global-or-Same-Organization Reference, Sprint 3C trigger required (see [`01-physical-model-principles.md`](01-physical-model-principles.md)) — found during the broader integrity audit |
| `origin_scenario_run_id` | `UUID` | N | **Sprint 3B.2:** composite FK, with `organization_id`+`office_id` → `scenario_run (organization_id, office_id, id)` — corrected from a plain, fully-unenforced FK, found during the broader integrity audit |
| `reasons` | `TEXT` | R | |
| `assumptions` | `TEXT` | N | |
| `limitations` | `TEXT` | N | |
| `suggested_next_step_scenario_definition_id` | `UUID` | N | FK → `scenario_definition.id` — this table is global, so a plain FK is sufficient |
| `supersedes_recommendation_id` | `UUID` | N | **Corrected (Sprint 3B.2 Correction 7) — direction reversed from `superseded_by_recommendation_id`.** Populated on the **newer** row, pointing backward at the Recommendation it replaces, so the older (already-immutable) row is never mutated. Composite FK `(organization_id, office_id, supersedes_recommendation_id) → recommendation (organization_id, office_id, id)` — same Organization **and** same Office; no exception is documented anywhere in this repository, so none is permitted. `UNIQUE (supersedes_recommendation_id)` (nulls excluded) limits each Recommendation to one direct successor. `CHECK (supersedes_recommendation_id IS DISTINCT FROM id)` rules out direct self-reference; a Sprint 3C trigger (requiring the referenced row's `generated_at` to be strictly earlier) rules out cycles — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Immutable Recommendation Supersession." |
| `generated_at` | `TIMESTAMPTZ` | R | |

**Composite keys:** `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` (**new, Sprint 3B.2**) — the first supports `recommendation_lifecycle_event`'s composite FK; the second supports `task`, `recommendation_evidence_alert`, and `recommendation_evidence_metric_observation`'s same-Office composite FKs (Sprint 3B.2 Correction 2). The self-referencing supersession FK above uses the second.

### `recommendation_lifecycle_event`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized — Sprint 3B.1 addition, enabling composite FKs below |
| `recommendation_id` | `UUID` | R | Composite FK, with `organization_id` → `recommendation (organization_id, id)` |
| `sequence_number` | `INTEGER` | R | **Sprint 3B.1 Correction 12** — monotonic within `recommendation_id`; current state = row with `MAX(sequence_number)`, never timestamp-only |
| `state` | `TEXT` | R | `CHECK` in (`generated`,`presented`,`approved`,`rejected`,`completed`,`superseded`,`archived`) |
| `occurred_at` | `TIMESTAMPTZ` | R | |
| `actor_user_id` | `UUID` | N | Composite FK, with `organization_id` → `app_user (organization_id, id)`; `NULL` for system-driven transitions |
| `reason` | `TEXT` | N | Required (app-layer) for `rejected` |

**Uniqueness:** `UNIQUE (recommendation_id, sequence_number)`.

**Atomicity (Sprint 3B.1 Correction 12):** the initial `generated` event (`sequence_number = 1`) must be created in the same transaction as its parent `recommendation` row, for the same reason as `alert`/`alert_lifecycle_event` above.

### `recommendation_evidence_alert` / `recommendation_evidence_metric_observation`

Join tables: `organization_id UUID` + `office_id UUID` (**new, Sprint 3B.2 Correction 2** — denormalized from `recommendation`) + `recommendation_id UUID` + `alert_id UUID` / `metric_observation_id UUID`, composite PK on the original two FK columns. **Sprint 3B.2:** `(organization_id, office_id, recommendation_id) → recommendation (organization_id, office_id, id)` and `(organization_id, office_id, alert_id) → alert (organization_id, office_id, id)` (or `metric_observation`, same pattern) — a Recommendation cannot cite another organization's Alert or Metric Observation (the founder's explicit requirement), and, as an additional tightening applied during the broader integrity audit, cannot cite another **Office's** either, since both tables are already Office-scoped and no repository document contemplates cross-Office evidence citation.

### `task`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | R | Denormalized |
| `office_id` | `UUID` | R | Composite FK → `office (organization_id, id)` |
| `related_alert_id` | `UUID` | N | **Sprint 3B.2:** composite FK, with `organization_id`+`office_id` → `alert (organization_id, office_id, id)` |
| `related_recommendation_id` | `UUID` | N | **Sprint 3B.2:** composite FK, with `organization_id`+`office_id` → `recommendation (organization_id, office_id, id)` |
| `description` | `TEXT` | R | |
| `owner_user_id` | `UUID` | R | Composite FK, with `organization_id` → `app_user (organization_id, id)` |
| `status` | `TEXT` | R | **Provisional** — vocabulary and full lifecycle design are unresolved (OQ-042); `CHECK` in (`open`,`in_progress`,`done`,`cancelled`) is an interim proposal only, and this column remains a plain mutable field (not append-only) until OQ-042 is answered |
| `due_date` | `DATE` | N | |
| `resolution_note` | `TEXT` | N | |
| `updated_at` | `TIMESTAMPTZ` | N | |

**Sprint 3B.1 Correction 13 — `task_status_history` removed from this document.** It has moved to [`09-deferred-entities.md`](09-deferred-entities.md), pending OQ-042. Until a dedicated lifecycle table is approved, material Task changes (status transitions, reassignment) should be recorded in `audit_event` as the interim mechanism, per [`docs/data-model/04-audit-strategy.md`](../data-model/04-audit-strategy.md).

## Audit

### `audit_event`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | N | `NULL` only for platform-level system events with no tenant context |
| `office_id` | `UUID` | N | |
| `actor_user_id` | `UUID` | N | Composite FK, with `organization_id` → `app_user (organization_id, id)` — checked only when both columns are non-null (PostgreSQL `MATCH SIMPLE` default), so platform-level events with a `NULL` `organization_id` are unaffected |
| `actor_type` | `TEXT` | R | `CHECK` in (`user`, `system`) |
| `event_type` | `TEXT` | R | e.g. `permission_granted`, `import_profile_version_changed` |
| `entity_type` | `TEXT` | R | e.g. `permission`, `business_rule_version` |
| `entity_id` | `UUID` | N | Deliberate, sole soft (non-FK) reference in this proposal — `audit_event` must reference arbitrary entity types by design, per [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) |
| `occurred_at` | `TIMESTAMPTZ` | R | |
| `correlation_id` | `UUID` | N | Ties related events together (e.g. one `import_job`'s stages) |
| `before_value` | `JSONB` | N | Never secrets, tokens, or full file contents |
| `after_value` | `JSONB` | N | Same restriction |
| `reason` | `TEXT` | N | |

## Related Documents

- [Table Catalog](02-table-catalog.md)
- [Physical Model Principles](01-physical-model-principles.md)
- [Keys, Relationships, and Constraints](04-keys-relationships-and-constraints.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
