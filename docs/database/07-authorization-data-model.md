# Authorization Data Model

**Version:** 0.3 (Sprint 3B.2 corrections applied — see [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md); Sprint 3B.1 corrections also applied; **Sprint 3B.3 reviewed this document for the broader integrity audit and found no new corrections needed here** — see [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md))
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Propose the physical structure for capability-based, Office-scoped authorization, per [ADR-004](../decisions/ADR-004-office-based-authorization.md) (Accepted) and [`docs/data-model/permission-model.md`](../data-model/permission-model.md). This document does not write RLS policy SQL — it defines the tables Sprint 3C's RLS policies will read.

## The Hierarchy, Physically

```text
app_user
  → permission (one row per grant; scope_type is explicit: 'organization' or 'office')
    → security_role (what — via permission_set → capability)
    → permission_office_grant (where, only when scope_type = 'office' — one or more offices)
```

This is one Permission record combining "this User" + "this SecurityRole (and therefore this Permission Set)" + "this scope," exactly as described in [`docs/data-model/permission-model.md`](../data-model/permission-model.md) — no new entity is introduced beyond what that document and [`docs/entities/permission.md`](../entities/permission.md) already describe.

## Tables

### `security_role`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | N | `NULL` = system-default role available to every organization |
| `name` | `TEXT` | R | |
| `permission_set_id` | `UUID` | R | **Sprint 3B.1 Correction 4** — FK → `permission_set.id`. **Sprint 3B.2 Correction 3:** `permission_set.organization_id` is nullable (platform-owned vs. organization-owned Permission Sets — see "Permission Set Relationship, Corrected" below), so this is a Global-or-Same-Organization Reference: valid only when the target Permission Set is platform-owned (`organization_id IS NULL`) or belongs to this same `security_role.organization_id`. Sprint 3C trigger required — see [`01-physical-model-principles.md`](01-physical-model-principles.md). |
| `is_mvp_default` | `BOOLEAN` | R | `true` for the three founder-approved MVP roles |
| `status` | `TEXT` | R | `CHECK` in (`active`, `deprecated`) |

**MVP seed data (Founder Decision 2):** exactly three system-default rows (`organization_id IS NULL`), matching [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 12:

- Organization Administrator
- Operations Manager
- Read-Only Viewer

The six expanded candidates (Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive) are **not** seeded as rows in this proposal — they remain deferred per the founder's explicit instruction, pending confirmed capability requirements. Because `security_role` supports an `organization_id`-scoped row, an organization can define its own additional role later without a schema change.

**On "Regional Manager" specifically:** if or when a role by this name is ever added, its row here has no special handling. Its actual access is expressed entirely through that role's `permission_set`'s `capability` composition and whichever `permission_office_grant` rows a specific User's `permission` record carries — never through `office.region`. This is the direct physical enforcement of the founder's explicit instruction that a role named "Regional Manager" must never itself create region-based authorization.

### `capability`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `code` | `TEXT` | R | Unique, e.g. `import_labor_model`, `view_pnl`, `approve_hiring`, `run_scenario`, `manage_users`, `view_executive_dashboard` |
| `name` | `TEXT` | R | Display label |
| `description` | `TEXT` | N | |

Global, not organization-scoped — Capabilities are LabPulse-defined atomic actions, per [`docs/data-model/permission-model.md`](../data-model/permission-model.md) ("Capabilities Are Atomic and Named"). The illustrative list above is **not final**; that document explicitly states the final Capability list is undefined. Seed data is limited to the six illustrative examples already named in the logical design, not invented beyond them — no unapproved capability-to-role mapping is seeded merely because these names appeared as examples.

### `permission_set` (Sprint 3B.1 Correction 4 — corrected relationship direction; Sprint 3B.2 Correction 3 — tenant ownership added)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `organization_id` | `UUID` | N | **New (Sprint 3B.2 Correction 3).** `NULL` = platform-owned, immutable Permission Set (writable only through trusted platform administration, never by tenant-scoped application code). A non-null value = an organization-owned, tenant-scoped custom Permission Set. |
| `name` | `TEXT` | R | |
| `status` | `TEXT` | R | `CHECK` in (`active`, `deprecated`) |

**What changed and why.** Sprint 3B modeled `permission_set.security_role_id` (a foreign key *from* Permission Set *to* Security Role), made unique, and stated: "dropping the uniqueness constraint would allow several roles to share one Permission Set." **That claim was relationally incorrect and is corrected here.** A foreign-key column can only ever hold one value per row — with or without a uniqueness constraint, a single `permission_set` row with `security_role_id` pointing at Role A cannot simultaneously belong to Role B. Removing the `UNIQUE` constraint on that column would not have let multiple roles share one Permission Set; it would have let one Security Role acquire *multiple* Permission Set rows (a one-role-to-many-sets relationship) — the opposite of what was claimed.

**Corrected design (the "Preferred" option):** `permission_set` now has its own identity (`id`, `name`, `status`) with **no** reference back to `security_role`. Instead, `security_role.permission_set_id` is a foreign key **from** Security Role **to** Permission Set. This is the relationally correct direction for "several roles can reference the same Permission Set later if needed": since the foreign key now lives on `security_role`, any number of `security_role` rows can independently set their `permission_set_id` to the same `permission_set.id` — a genuine many-role-to-one-permission-set capability, available without any schema change, the moment it's needed. For MVP, each of the three seeded roles still gets its own dedicated `permission_set` row (a de facto 1:1), but the cardinality is now expressed correctly rather than accidentally reversed.

**Tenant ownership, added in Sprint 3B.2 (Correction 3).** Sprint 3B.1 left `permission_set` with no tenant-ownership concept at all — every Permission Set was implicitly global, with no way for one organization to ever define its own custom capability composition without that composition being visible to, or alterable by, every other organization and every global role. The corrected model:

- A **global role** (`security_role.organization_id IS NULL`) may reference only a **global** Permission Set (`permission_set.organization_id IS NULL`).
- An **organization-specific role** (`security_role.organization_id = X`) may reference a **same-organization** Permission Set (`permission_set.organization_id = X`), or, intentionally, a **global, immutable** Permission Set (`permission_set.organization_id IS NULL`) — but never another organization's custom Permission Set.
- `capability` (below) remains global in every case — Capability *definitions* are never organization-owned; only the *composition* of Capabilities into a named Permission Set can be.
- `permission_set_capability` membership is tenant-owned exactly to the extent its parent `permission_set` is: a platform-owned Permission Set's membership is writable only through trusted platform administration (an RLS/privilege concern for Sprint 3C, not a schema element); an organization-owned Permission Set's membership is ordinary tenant-owned data.
- **One organization can never alter the capability composition used by another organization or by a global role** — since `permission_set_capability` rows are scoped entirely by their parent `permission_set_id`, and an organization's write access (Sprint 3C RLS) would only ever be granted over `permission_set` rows where `organization_id` matches its own.

**Enforcement mechanism.** The "global-or-same-organization" rule above is a *conditional* rule (match, or the target is global) — this cannot be expressed as a single unconditional composite foreign key. See [`01-physical-model-principles.md`](01-physical-model-principles.md) "Global-or-Same-Organization Reference Pattern" for the full reasoning and the Sprint 3C `BEFORE INSERT OR UPDATE` trigger this requires on `security_role.permission_set_id`. **This is not relied on as an RLS-visibility-only guarantee** — the trigger is a genuine write-time database constraint, independent of which role or policy context performs the write.

**The same pattern, applied to `permission.security_role_id` (per the founder's explicit instruction to also fix this reference):** `security_role.organization_id` is nullable in exactly the same way, so `permission.security_role_id` needs the identical Sprint 3C trigger — verifying `security_role.organization_id IS NULL OR security_role.organization_id = permission.organization_id` — so an organization-specific Permission record can never be granted using another organization's custom SecurityRole. A Permission may always reference a global (system-default) SecurityRole.

### `permission_set_capability`

Composite PK (`permission_set_id`, `capability_id`) — the join table implementing "a Permission Set lists the Capabilities that role grants." Unchanged from Sprint 3B.

### `permission` (Sprint 3B.1 Correction 3 — fail-closed scope, corrected)

| Column | Type | R/N | Notes |
|---|---|---|---|
| `user_id` | `UUID` | R | Composite FK, with `organization_id` → `app_user (organization_id, id)` |
| `organization_id` | `UUID` | R | FK → `organization.id` |
| `security_role_id` | `UUID` | R | FK → `security_role.id` |
| `scope_type` | `TEXT` | R | **Changed** — `CHECK` in (`organization`, `office`) only. See below for why the previous four-value vocabulary was collapsed. |
| `effective_start_at` | `TIMESTAMPTZ` | N | **Changed from `DATE` to `TIMESTAMPTZ`** — access can begin or end at a specific moment, and LabPulse organizations may span time zones; a calendar-day grain is not precise enough for an authorization boundary. Optional for **any** scope type, not only a former `'temporary'` value — see below. |
| `effective_end_at` | `TIMESTAMPTZ` | N | Same |
| `granted_by_user_id` | `UUID` | N | Composite FK, with `organization_id` → `app_user (organization_id, id)` |
| `granted_at` | `TIMESTAMPTZ` | R | |
| `revoked_at` | `TIMESTAMPTZ` | N | Per [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md) — Permission is "revoke + recreate," not "Update"; a revoked Permission row is retained (soft-deleted) and a new row is created for a re-grant |

**Composite keys:** `UNIQUE (id, organization_id)` and `UNIQUE (id, scope_type)` — both support `permission_office_grant`'s composite FKs below.

### Fail-Closed Authorization Scope — What Changed and Why

Sprint 3B's rule — **"zero `permission_office_grant` rows means organization-wide access"** — inferred a broadened access grant from the *absence* of child records. This is a fail-*open* pattern: any bug, migration error, or incomplete write that left a `scope_type = 'office'` Permission with no grant rows (even temporarily, mid-transaction) would silently become organization-wide access instead of failing safely. The founder's instruction is explicit that organization-wide access must never be inferred this way.

**Corrected model:**

1. `scope_type` is now a genuinely explicit, two-value field: `'organization'` or `'office'`. There is no longer a `'single_office'`/`'many_offices'` distinction, because — as the founder's instruction observes — the *number* of related `permission_office_grant` rows already expresses one office versus many through ordinary row count; a separate scope value for each was never doing real work.
2. There is no longer a `'temporary'` scope value. Temporal limits (`effective_start_at`/`effective_end_at`) are now **independent of scope** — an `'organization'`-scoped grant, a single-office grant, and a multi-office grant may all be time-bounded or permanent, in any combination. Conflating "temporary" with "scope" in Sprint 3B's four-value vocabulary made it impossible to express a time-bounded *organization-wide* grant, which the founder's requirements explicitly call for.
3. **`scope_type = 'office'` with zero `permission_office_grant` rows is now an invalid, not-yet-complete state — never organization-wide access.** A `permission_office_grant` row also now carries a denormalized `scope_type` column, constrained by `CHECK (scope_type = 'office')` and a composite FK `(permission_id, scope_type) REFERENCES permission (id, scope_type)` — this declaratively guarantees a grant row can only attach to a Permission whose own `scope_type` is `'office'`, so an `'organization'`-scoped Permission can never accidentally acquire office rows, and an `'office'`-scoped Permission's rows always agree with its own declared scope.
4. Organization-wide access is recognized **only** when `permission.scope_type = 'organization'` — never inferred from a missing or empty child collection.

**Transactional enforcement of the office-child requirement (documented for Sprint 3C, not implemented here).** PostgreSQL has no declarative way to require "at least one child row must exist" — a `CHECK` or foreign key can only validate rows that exist, not demand a minimum count of related rows. The founder's instruction to "document how the Office-child requirement will be enforced transactionally" is answered as follows: Sprint 3C should implement a **deferred constraint trigger** on `permission` (or on `permission_office_grant`, deferred to transaction commit) that, for every `scope_type = 'office'` Permission, verifies at least one `permission_office_grant` row exists referencing it — raising an error at `COMMIT` if not. Declaring the trigger `DEFERRABLE INITIALLY DEFERRED` allows the application to insert the `permission` row and its `permission_office_grant` row(s) in either order within one transaction, while still guaranteeing no transaction can commit an incomplete office-scoped grant. This is a documented requirement, not implemented SQL — Sprint 3C writes the trigger function.

### Effective Access Evaluation Rule (Fail-Closed, for Sprint 3C's RLS)

A Permission grants **no** effective access — regardless of `scope_type`, Capability, or Office grant — when **any** of the following is true:

- The granting User (`app_user.status`) is `disabled`.
- The Permission's `revoked_at` is not `NULL`.
- `effective_start_at` is set and is in the future relative to the access check time.
- `effective_end_at` is set and has passed relative to the access check time.
- The Organization (`organization.status`) is `archived`.
- For `scope_type = 'office'`: the specific Office being accessed (`office.status`) is `inactive`, **or** no valid `permission_office_grant` row exists for that Office under this Permission.

Every one of these is a **denial** condition — the design has no fallback path that widens access when a check is ambiguous or a related row is missing. This is the fail-closed property the founder's instruction requires, and it is the single most safety-critical rule Sprint 3C's RLS policies must implement faithfully.

### `permission_office_grant`

| Column | Type | R/N | Notes |
|---|---|---|---|
| `permission_id` | `UUID` | R | Composite FK, with `scope_type` → `permission (id, scope_type)` — see above |
| `organization_id` | `UUID` | R | Composite FK, with `office_id` → `office (organization_id, id)`; also composite FK, with `permission_id` → `permission (id, organization_id)` |
| `office_id` | `UUID` | R | See composite FKs above |
| `scope_type` | `TEXT` | R | `CHECK (scope_type = 'office')` — denormalized copy of the parent Permission's scope, see above |

Composite PK (`permission_id`, `office_id`). One row per office for `scope_type = 'office'`; **zero rows are structurally impossible to create for `scope_type = 'organization'`**, because the `(permission_id, scope_type)` composite FK would require a `permission` row with `scope_type = 'organization'` AND `scope_type = 'office'` simultaneously, which cannot exist.

**This is the explicit answer to the founder's instruction** not to duplicate one Permission row containing an array of Office IDs: a single office produces exactly one `permission_office_grant` row, many offices produce more than one, both through the identical normalized structure — no array column, no special-casing between "one office" and "many offices" beyond row count.

## Temporary Assignments (OQ-054, Founder Decision — Partial)

`permission.effective_start_at`/`effective_end_at` physically support time-bounded assignments **for any scope type**, closing the "how should this be modeled" half of OQ-054 more completely than Sprint 3B's design (which only populated these columns for a separate `'temporary'` scope value). **Not resolved by this schema:** whether expiry is automatically enforced (a scheduled job or RLS-time check against `effective_end_at`) or requires a manual revocation action, and whether an expired-but-not-revoked Permission should be treated identically to a revoked one at query time — though the Effective Access Evaluation Rule above already answers the second question in the fail-closed direction (an expired grant denies access regardless of `revoked_at`). Sprint 3C must still decide the enforcement *mechanism* (scheduled job vs. real-time check).

## Franchise Groupings (OQ-055, Founder Decision — Deferred for MVP)

No `franchise` table, no grouping level between `organization` and `office`, and no franchise-scoped `permission` variant exists in this proposal, per the founder's explicit MVP exclusion. `organization` and `office` remain a strict two-level hierarchy for MVP: every `office.organization_id` refers to exactly one Organization, with no cross-Organization access structure of any kind. See [`09-deferred-entities.md`](09-deferred-entities.md).

## What Sprint 3C Needs From This Document

- `permission` + `permission_office_grant` + `security_role` + `permission_set` + `permission_set_capability` are the tables every RLS policy on every tenant-owned table will need to join against (directly or via a `SECURITY DEFINER` helper function) to answer "can this `auth.uid()` access this row," applying the Effective Access Evaluation Rule above.
- The deferred constraint trigger enforcing "at least one `permission_office_grant` row for every `scope_type = 'office'` Permission."
- A decision on Permission expiry enforcement mechanism (scheduled job vs. real-time check).

## Related Documents

- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [Permission Model](../data-model/permission-model.md)
- [Entity: Permission](../entities/permission.md)
- [Entity: SecurityRole](../entities/security-role.md)
- [Table Catalog](02-table-catalog.md)
- [Keys, Relationships, and Constraints](04-keys-relationships-and-constraints.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
