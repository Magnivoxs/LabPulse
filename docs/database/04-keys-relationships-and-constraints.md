# Keys, Relationships, and Constraints

**Version:** 0.6 (Sprint 3B.4A corrections applied — see [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md); Sprint 3B.1, 3B.2, 3B.3, and 3B.4 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Document primary keys, foreign keys, uniqueness rules, check constraints, and index considerations across the proposed schema, extending [`02-table-catalog.md`](02-table-catalog.md) and [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md).

## Primary Keys

Every table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, except pure join tables, which use a composite primary key on their two (or more) foreign-key columns and have no surrogate `id`. Join tables using a composite PK: `permission_set_capability`, `permission_office_grant`, `import_normalized_value_revenue_snapshot`/`..._payroll_snapshot`/`..._labor_model_snapshot`/`..._backlog_snapshot`, `scenario_run_revenue_snapshot`/`..._payroll_snapshot`/`..._labor_model_snapshot`/`..._backlog_snapshot`, `recommendation_evidence_alert`, `recommendation_evidence_metric_observation`.

`metric_observation_component` is **not** a pure join table (it carries its own substantive columns — `component_key`, `component_role`, `component_value`, `unit` — alongside its typed nullable source-snapshot FK columns), so it keeps a surrogate `id UUID PRIMARY KEY`, per the general rule.

`app_user` is the one exception among non-join tables: its `id` is not self-generated but copied from `auth.users.id` at row creation, establishing a 1:1 shared-key relationship (see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md)).

## Declarative Tenant Consistency (Sprint 3B.1 Correction 2 — replaces the unresolved Sprint 3B gap)

Sprint 3B recorded the `organization_id`/`office_id` consistency problem as an **unresolved** Sprint 3C item: nearly every snapshot, `alert`, `recommendation`, `task`, `scenario_run`, and `metric_observation` carried both a denormalized `organization_id` and an `office_id`, with nothing preventing them from disagreeing, because a plain PostgreSQL `CHECK` constraint cannot join across tables. This correction closes that gap **declaratively**, using standard composite foreign keys, for every relationship where it is structurally possible — leaving only a small, explicitly-named residual set for Sprint 3C.

### The Pattern

1. The **parent** table exposes a composite unique key pairing its tenant-scope column with its own `id` — for example, `office` gets `UNIQUE (organization_id, id)` in addition to its ordinary primary key on `id` alone. `app_user`, `employee`, `permission`, `recommendation`, `alert`, and each of the four immutable snapshot tables get the same treatment (`UNIQUE (organization_id, id)`).
2. Any **child** table that already carries its own `organization_id` and a foreign key to that parent replaces the parent foreign key with a **composite foreign key** referencing both columns at once: `(organization_id, <parent>_id) REFERENCES <parent> (organization_id, id)`.
3. PostgreSQL then rejects, at write time, any row whose `organization_id` disagrees with the referenced parent's `organization_id` — no trigger, no application-layer check, no possibility of the two silently diverging.

Because the parent's own `organization_id` is already validated by its own foreign key to `organization`, the child's separate direct `organization_id -> organization.id` foreign key becomes redundant once the composite pattern is in place, and is dropped in favor of the transitive guarantee — this is called out per-table below so the removal is a documented decision, not a silent omission.

### Where This Pattern Is Applied

| Child table | Composite FK | Closes |
|---|---|---|
| `employee_office_assignment` | `(organization_id, office_id) → office (organization_id, id)` and `(organization_id, employee_id) → employee (organization_id, id)` | Both office and employee agree with the assignment's own org |
| `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `metric_observation`, `alert`, `scenario_run`, `recommendation`, `task` | `(organization_id, office_id) → office (organization_id, id)` | The single largest source of the original gap — every office-scoped, org-denormalized table |
| `revenue_snapshot.supersedes_snapshot_id`, `payroll_snapshot.supersedes_snapshot_id`, `labor_model_snapshot.supersedes_snapshot_id`, `backlog_snapshot.supersedes_snapshot_id` | `(organization_id, supersedes_snapshot_id) → <same table> (organization_id, id)` | A snapshot can never be recorded as superseding a different organization's row |
| `recommendation.supersedes_recommendation_id` | `(organization_id, office_id, supersedes_recommendation_id) → recommendation (organization_id, office_id, id)` — **corrected in Sprint 3B.2 Correction 7**, both the column name/direction (was `superseded_by_recommendation_id`, populated on the old row) and the matched key (was organization-only, now organization-and-office) | Same, for Recommendation supersession — see "Immutable Recommendation Supersession" below |
| `permission_office_grant` | `(organization_id, office_id) → office (organization_id, id)` **and** `(permission_id, organization_id) → permission (id, organization_id)` (requires `permission` to also carry `UNIQUE (id, organization_id)`) | Both halves of "this grant's office belongs to this grant's organization" **and** "this grant's organization matches its parent Permission's organization" — fully closing the gap the founder specifically raised for Permission's office scoping |
| `permission_office_grant.scope_type` (denormalized copy of `permission.scope_type`) | `(permission_id, scope_type) → permission (id, scope_type)` (requires `permission` to carry `UNIQUE (id, scope_type)`) | Guarantees a `permission_office_grant` row can only exist for a Permission whose `scope_type = 'office'` — see [`07-authorization-data-model.md`](07-authorization-data-model.md) |
| `employee.linked_app_user_id` | `(organization_id, linked_app_user_id) → app_user (organization_id, id)` | A linked App User belongs to the same Organization as the Employee |
| `permission.user_id`, `permission.granted_by_user_id` | `(organization_id, user_id) → app_user (organization_id, id)`, same for `granted_by_user_id` | Every actor on a Permission grant is in the same organization as the grant |
| `import_job.uploaded_by_user_id` | `(organization_id, uploaded_by_user_id) → app_user (organization_id, id)` | |
| `backlog_snapshot.manual_entry_user_id` | `(organization_id, manual_entry_user_id) → app_user (organization_id, id)` | |
| `scenario_run.created_by_user_id` | `(organization_id, created_by_user_id) → app_user (organization_id, id)` | |
| `alert.dismissed_by_user_id` — **removed**; dismissal is now recorded on `alert_lifecycle_event`, see next row | — | Superseded by Correction 8 |
| `alert_lifecycle_event.actor_user_id` | `(organization_id, actor_user_id) → app_user (organization_id, id)`, plus `(organization_id, alert_id) → alert (organization_id, id)` | Both the actor and the parent Alert agree with the event's own org |
| `recommendation_lifecycle_event.actor_user_id` | `(organization_id, actor_user_id) → app_user (organization_id, id)`, plus `(organization_id, recommendation_id) → recommendation (organization_id, id)` | Same, for Recommendation lifecycle events |
| `task.owner_user_id` | `(organization_id, owner_user_id) → app_user (organization_id, id)` | |
| `audit_event.actor_user_id` | `(organization_id, actor_user_id) → app_user (organization_id, id)` | Checked only when both columns are non-null (`MATCH SIMPLE`, PostgreSQL's default) — platform-level events with `organization_id IS NULL` are unaffected |

### Additional Composite FKs Added in Sprint 3B.2 (Correction 2 — Closing the Remaining Join/Detail Gaps)

Sprint 3B.1's pass covered the header-level tables (snapshots, `alert`, `recommendation`, `task`, `scenario_run`, `metric_observation`) but left several **detail and join tables one level down** carrying only plain, unenforced foreign keys into tenant-owned parents. Sprint 3B.2 closes these. Each detail/join table below gained its own denormalized `organization_id` (and, where noted, `office_id`) specifically so it could expose the composite FKs listed:

**⚠️ Historical note (added Sprint 3B.4A, Correction 3):** the six rows below marked **[superseded, see Sprint 3B.4]** state the *organization-only* relationships as they stood after Sprint 3B.2. Sprint 3B.4 subsequently **strengthened every one of them** to also require same-Import-Job agreement, not merely same-organization — see "Additional Composite FKs Added in Sprint 3B.4" further below for the actual, currently controlling composite FKs. The rows are preserved here (not deleted) as a record of what Sprint 3B.2 itself closed, but a reader must treat the Sprint 3B.4 table, not this one, as the current physical design for these six relationships.

| Child table | New composite FK(s) | Closes |
|---|---|---|
| `import_source_section` | `(organization_id, import_job_id) → import_job (organization_id, id)` | A section belongs to the same organization as its Import Job |
| `import_source_row` | `(organization_id, import_source_section_id) → import_source_section (organization_id, id)` **[superseded, see Sprint 3B.4]** | A row belongs to the same organization as its section |
| `import_normalized_value` | `(organization_id, import_source_row_id) → import_source_row (organization_id, id)` **[superseded, see Sprint 3B.4]** | A normalized value belongs to the same organization as its source row |
| `import_normalized_value_revenue_snapshot`, `..._payroll_snapshot`, `..._labor_model_snapshot`, `..._backlog_snapshot` | `(organization_id, import_normalized_value_id) → import_normalized_value (organization_id, id)` **and** `(organization_id, <type>_snapshot_id) → <type>_snapshot (organization_id, id)` **[superseded, see Sprint 3B.4]** | An import-lineage link can never connect a normalized value to a snapshot of a *different* organization — closes the founder's explicit "import lineage link must connect an import source from the same Organization as the target snapshot" requirement |
| `payroll_snapshot_line_item` | `(organization_id, payroll_snapshot_id) → payroll_snapshot (organization_id, id)` **and** `(organization_id, import_source_row_id) → import_source_row (organization_id, id)` **[superseded, see Sprint 3B.4]** | A line item cannot be attached to a different organization's header, nor produced from a different organization's Import Job — closes "detail rows must not connect a parent snapshot to a source row from another Organization's Import Job" |
| `labor_model_staffing_measure` | Same pattern, against `labor_model_snapshot` and `import_source_row` **[superseded, see Sprint 3B.4]** | Same |
| `backlog_stage_count` | `(organization_id, backlog_snapshot_id) → backlog_snapshot (organization_id, id)` **and**, when `import_source_row_id IS NOT NULL`, `(organization_id, import_source_row_id) → import_source_row (organization_id, id)` **[superseded, see Sprint 3B.4]** | Same. `production_stage_id` is deliberately **not** given a composite FK here — see "Intentionally Permitted Cross-Organization References" below |
| `metric_observation_component` | `(organization_id, metric_observation_id) → metric_observation (organization_id, id)`, plus a same-**organization-and-office** composite FK — `(organization_id, office_id, source_<type>_snapshot_id) → <type>_snapshot (organization_id, office_id, id)` — for whichever of the four typed snapshot columns is populated | A component's parent observation, and whichever exact snapshot it cites, all agree on organization **and** office — closes "a Metric Observation component must cite a snapshot belonging to the same Organization and Office as the observation" |
| `scenario_run_revenue_snapshot`, `..._payroll_snapshot`, `..._labor_model_snapshot`, `..._backlog_snapshot` | `(organization_id, office_id, scenario_run_id) → scenario_run (organization_id, office_id, id)` **and** `(organization_id, office_id, <type>_snapshot_id) → <type>_snapshot (organization_id, office_id, id)` | A Scenario Run's baseline snapshot must be the **same Office**, not merely the same Organization — closes the founder's explicit example ("A Scenario Run for Office A must not use an Office B snapshot") |
| `scenario_input`, `scenario_output` | `(organization_id, scenario_run_id) → scenario_run (organization_id, id)` | Same-organization enforcement for scenario values; see Correction 9 below for the typed reference columns' own composite FKs |
| `recommendation_evidence_alert` | `(organization_id, office_id, recommendation_id) → recommendation (organization_id, office_id, id)` **and** `(organization_id, office_id, alert_id) → alert (organization_id, office_id, id)` | A Recommendation cannot cite another organization's **or another office's** Alert — the founder's instruction named Organization only; Office-match is an additional tightening applied here because both tables are already Office-scoped and no repository document contemplates cross-Office evidence citation (see the broader-audit note below) |
| `recommendation_evidence_metric_observation` | Same pattern, against `recommendation` and `metric_observation` | Same |
| `task.related_alert_id` | `(organization_id, office_id, related_alert_id) → alert (organization_id, office_id, id)` | Same-organization-and-office enforcement |
| `task.related_recommendation_id` | `(organization_id, office_id, related_recommendation_id) → recommendation (organization_id, office_id, id)` | Same |
| `recommendation.origin_scenario_run_id` | `(organization_id, office_id, origin_scenario_run_id) → scenario_run (organization_id, office_id, id)` | Found during the broader integrity audit (not in the founder's named list) — Sprint 3B carried this as a plain FK with no tenant enforcement at all |
| ~~`import_job.organization_import_profile_override_id` | `(organization_id, organization_import_profile_override_id) → organization_import_profile_override (organization_id, id)`~~ | **Superseded, Sprint 3B.4 Correction 4** — strengthened to a three-column FK also matching `import_profile_version_id`; see "Additional Composite FKs Added in Sprint 3B.4" below |
| ~~`payroll_snapshot.account_mapping_version_id` | `(organization_id, account_mapping_version_id) → organization_import_profile_override (organization_id, id)`~~ | **Removed, Sprint 3B.4 Correction 5** — the column itself is removed; the fact is now derived through `payroll_snapshot.import_job_id → import_job.organization_import_profile_override_id`, never stored a second time. See [`06-import-lineage-model.md`](06-import-lineage-model.md) |

**Supporting composite unique keys added to enable the above:** `import_job`, `import_source_section`, `import_source_row`, `import_normalized_value`, and `organization_import_profile_override` each gain `UNIQUE (organization_id, id)`. `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `alert`, `recommendation`, and `scenario_run` each gain an *additional* `UNIQUE (organization_id, office_id, id)` alongside their existing Sprint 3B.1 `UNIQUE (organization_id, id)` — the two serve different consumers (organization-only composite FKs vs. organization-and-office composite FKs) and are not redundant; see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) for exactly which consumer uses which.

### Additional Composite FKs Added in Sprint 3B.4 (Correction 2 — Same-Import-Job Enforcement; Corrections 1, 4, 5 — Validation-Row, Override-Version, and Account-Mapping Fixes)

Sprint 3B.2/3B.3 closed every *organization*-level lineage gap. Sprint 3B.4 closes the one remaining level down: two rows can share an organization while still having been produced by two different Import Jobs, and organization-matching alone never caught that. Each table below gains a denormalized `import_job_id` (where it did not already have one) specifically so it can expose the composite FKs listed:

| Child table | New/strengthened composite FK(s) | Closes |
|---|---|---|
| `import_source_row` | `(organization_id, import_job_id, import_source_section_id) → import_source_section (organization_id, import_job_id, id)` — strengthened from organization-only | A row's declared Import Job must match its own Section's Import Job |
| `import_normalized_value` | `(organization_id, import_job_id, import_source_row_id) → import_source_row (organization_id, import_job_id, id)` — strengthened from organization-only | A normalized value's declared Import Job must match its own source row's Import Job |
| `import_normalized_value_revenue_snapshot`, `..._payroll_snapshot`, `..._labor_model_snapshot`, `..._backlog_snapshot` | `(organization_id, import_job_id, import_normalized_value_id) → import_normalized_value (organization_id, import_job_id, id)` **and** `(organization_id, import_job_id, <type>_snapshot_id) → <type>_snapshot (organization_id, import_job_id, id)` — both strengthened from organization-only | The founder's explicit gap: "a canonical snapshot that declares one producing Import Job must not cite source rows or normalized values from another Import Job, even within the same Organization" |
| `payroll_snapshot_line_item` | `(organization_id, import_job_id, payroll_snapshot_id) → payroll_snapshot (organization_id, import_job_id, id)` **and** `(organization_id, import_job_id, import_source_row_id) → import_source_row (organization_id, import_job_id, id)` — both strengthened from organization-only, sharing the same `import_job_id` value to transitively guarantee header and source row agree | Same rule, applied to the detail-table path instead of the header-aggregation path |
| `labor_model_staffing_measure` | Same pattern, against `labor_model_snapshot` and `import_source_row` | Same |
| `backlog_stage_count` | Same pattern, against `backlog_snapshot` and `import_source_row`, but **conditionally enforced** (`MATCH SIMPLE` skips the check when `import_job_id IS NULL`, i.e. for manual entries) — plus a new same-row `CHECK` ruling out a mixed imported/manual state | Same, with an honest carve-out for manually-entered stage counts, which have no Import Job at all |
| `import_validation_result` | `UNIQUE (organization_id, import_source_row_id, id)` **and** `UNIQUE (import_source_row_id)` (new parent keys, not a child-side FK) | States, as a real constraint, the MVP's one-Validation-Result-per-source-row grain (Correction 1) |
| `import_validation_issue` | `(organization_id, import_source_row_id, import_validation_result_id) → import_validation_result (organization_id, import_source_row_id, id)` — strengthened from organization-only; `import_source_row_id` is now `NOT NULL` on every row | Withdraws the Sprint 3B.3 false "enforced transitively" claim — an Issue can no longer cite a Validation Result for one source row while itself declaring a different one (Correction 1) |
| `import_job.organization_import_profile_override_id` | `(organization_id, import_profile_version_id, organization_import_profile_override_id) → organization_import_profile_override (organization_id, import_profile_version_id, id)` — strengthened from organization-only | An Import Job's override must have been defined for the exact Profile Version that same Import Job declares, not merely belong to the right organization (Correction 4) |

**Supporting composite unique keys added (Sprint 3B.4):** `import_source_section` and `import_source_row` each gain `UNIQUE (organization_id, import_job_id, id)`, in addition to their existing `UNIQUE (organization_id, id)`. `import_normalized_value` gains the same, in addition to its existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, import_source_row_id, id)`. `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, and `backlog_snapshot` each gain `UNIQUE (organization_id, import_job_id, id)`, in addition to their existing `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)`. `organization_import_profile_override` gains `UNIQUE (organization_id, import_profile_version_id, id)`. None of these is redundant with an existing key — each serves a distinct composite-FK consumer; see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) and [`06-import-lineage-model.md`](06-import-lineage-model.md) for exactly which consumer uses which.

**`payroll_snapshot.account_mapping_version_id` is removed, not strengthened (Correction 5).** Unlike every other row in this table, this is not a case of upgrading a composite FK — the column itself no longer exists. See [`06-import-lineage-model.md`](06-import-lineage-model.md) `organization_import_profile_override` for the full reasoning.

### Additional Composite FKs Added in Sprint 3B.4A (Correction 1 — Import Profile Identity in Supersession)

Sprint 3B.3/3B.4 required an Import Job's `supersedes_import_job_id` to match only its predecessor's **organization** — permitting, for example, a Payroll Import Job to be recorded as superseding an unrelated Labor Model, Backlog, or Power BI Import Job, provided both belonged to the same organization. Sprint 3B.4A closes this:

| Child table | New/strengthened composite FK(s) | Closes |
|---|---|---|
| `import_job.import_profile_version_id` | `(import_profile_id, import_profile_version_id) → import_profile_version (import_profile_id, id)` — strengthened from a plain FK | An Import Job's declared Profile Version must actually belong to the same Import Job's own declared base Profile |
| `import_job.supersedes_import_job_id` | `(organization_id, import_profile_id, supersedes_import_job_id) → import_job (organization_id, import_profile_id, id)` — strengthened from organization-only | An unrelated base Import Profile can no longer enter the same supersession chain; a newer **version** of the same profile remains explicitly permitted (unaffected judgment call, see [`06-import-lineage-model.md`](06-import-lineage-model.md)) |

**Supporting composite unique keys added (Sprint 3B.4A):** `import_profile_version` gains `UNIQUE (import_profile_id, id)`. `import_job` gains `UNIQUE (organization_id, import_profile_id, id)`, in addition to its existing `UNIQUE (organization_id, id)`.

**Note on the previously-stated cycle-prevention pattern:** `import_job.supersedes_import_job_id`'s cycle-freedom (see "Complete List of Sprint 3C Triggers" below, item 11) follows the same `uploaded_at`-strictly-earlier pattern already established for Recommendation supersession — a Sprint 3C trigger, not a declarative constraint, since `import_job` has no `revision_number` to make cycle-freedom an arithmetic certainty the way the four canonical snapshots do.

### Intentionally Permitted Cross-Organization References (Sprint 3B.2)

Per the founder's instruction to "document every intentionally permitted cross-Office relationship" (generalized here to cross-*Organization*, since these are lookup tables, not Office-level exceptions): the following references are **deliberately** allowed to cross organizational ownership, because the target is a **system-default, global lookup row** (`organization_id IS NULL`), not another organization's private data. This is the same category as item 1 in "What Remains Genuinely Open for Sprint 3C" below, called out here explicitly per-reference rather than only as a general category:

- `backlog_stage_count.production_stage_id` may reference a global default `production_stage` row, used by every organization.
- `employee.job_role_id`, `labor_model_staffing_measure.job_role_id`, `scenario_input.value_reference_job_role_id` may each reference a global default `job_role` row.
- `recommendation.origin_business_rule_version_id`, and `condition_evaluation`'s indirect citation of `business_rule_version` via `business_rule_condition`, may reference a global default `business_rule_version` row (BR-001's approved default thresholds, for example).
- `security_role.permission_set_id` may reference a global (platform-owned) `permission_set` row; `permission.security_role_id` may reference a global (system-default) `security_role` row.

**What is never permitted**, and is exactly what the Global-or-Same-Organization Reference Pattern's Sprint 3C trigger (see [`01-physical-model-principles.md`](01-physical-model-principles.md)) exists to block: any of the above referencing **another specific organization's** custom row (a non-null `organization_id` that does not match the referencing row's own organization). No accidental cross-organization reference of this kind is permitted anywhere in this proposal.

### What Remains Genuinely Open for Sprint 3C

The composite-FK pattern requires the parent side to have a stable `(organization_id, id)` (or equivalent) composite key, and only enforces **unconditional** equality. It does **not** apply — and is not claimed to apply — to:

1. **Global-or-same-organization references** (the eight sites listed in [`01-physical-model-principles.md`](01-physical-model-principles.md) "Global-or-Same-Organization Reference Pattern") — these need a **conditional** rule ("match, or the target is global"), which requires a Sprint 3C trigger, not a plain composite FK. This is a distinct residual category from the "nullable-organization version/configuration tables" item below: that item is about the *target* table's own effective-dating design; this item is about *referencing rows elsewhere in the schema* needing tenant-ownership enforcement against that same class of table.
2. **`audit_event.entity_type`/`entity_id`** — the one deliberate polymorphic soft reference in this proposal (see below); a table designed to audit every entity type by definition cannot have a single typed FK target.
3. **The transactional "at least one child row" requirement** for `scope_type = 'office'` Permissions (a Permission must have at least one `permission_office_grant` row) — existence of at least one row is not expressible as a declarative constraint in PostgreSQL; it requires a deferred constraint trigger. See [`07-authorization-data-model.md`](07-authorization-data-model.md) "Fail-Closed Authorization Scope" for the documented enforcement approach.
4. **The snapshot- and metric-observation-revision predecessor-exactness rule** ("a revision's predecessor is exactly `revision_number - 1`") — the composite FK enforces *which row* can be superseded (same natural key), but not the arithmetic relationship between the two rows' revision numbers, which requires a Sprint 3C trigger. See "Snapshot and Metric Observation Supersession Integrity (Sprint 3B.2, Correction 5 and Correction 1)" below.
5. **The Recommendation supersession acyclicity rule** — see "Immutable Recommendation Supersession (Sprint 3B.2, Correction 7)" below.
6. **The `employee_office_assignment` exactly-once-closure rule** — see "Employee Assignment Lifecycle (Sprint 3B.2, Correction 8)" below.
7. **A manually-entered `backlog_stage_count`'s header must also be manual** (**new, Sprint 3B.4 Correction 2**) — `backlog_stage_count.import_job_id IS NULL` must imply `backlog_snapshot.import_job_id IS NULL` for its own header. `MATCH SIMPLE` composite-FK semantics skip enforcement entirely when the child's `import_job_id` is `NULL`, and no PostgreSQL declarative construct can instead require "the referenced row's own column must also be null" — this needs a Sprint 3C trigger, same category as items 4–6 above (a cross-row consistency rule, not a same-row `CHECK` or an unconditional composite FK).

This is a substantially smaller residual list than Sprint 3B's original "not resolved in Sprint 3B, Sprint 3C must choose one of three options" framing — the composite-FK pattern above **is** the chosen resolution for every case where a stable, unconditional composite parent key exists; the seven items above remain genuinely open, each because it needs either a conditional rule or a cross-row arithmetic/ordering/consistency check, neither of which a plain `FOREIGN KEY` or `CHECK` clause can express in PostgreSQL.

## Composite Foreign Key Verification Matrix (Sprint 3B.3 Correction 1, extended Sprint 3B.4)

Sprint 3B.1 and 3B.2 introduced dozens of composite foreign keys but did not, in every case, verify that the referenced column list was actually backed by a matching `PRIMARY KEY` or `UNIQUE` constraint on the parent — a composite FK referencing a non-existent composite unique key is not a real constraint PostgreSQL can create at all. This audit closes that gap. Two real gaps were found: `metric_observation` and `condition_evaluation` each already had composite FKs *pointing at them* (from `metric_observation_component`, `recommendation_evidence_metric_observation`, `condition_evaluation`, `condition_evaluation_evidence`, and `alert`) with no corresponding parent-side `UNIQUE` constraint ever declared. Both are corrected below; every other composite FK in the proposal was checked and already had a valid matching parent key.

**`metric_observation` — composite keys added (previously missing entirely):**

- `UNIQUE (organization_id, id)` — required by `metric_observation_component.metric_observation_id`'s composite FK.
- `UNIQUE (organization_id, office_id, id)` — required by `condition_evaluation.metric_observation_id`'s and `recommendation_evidence_metric_observation.metric_observation_id`'s composite FKs.
- `UNIQUE (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — required by `metric_observation`'s own self-referencing `supersedes_metric_observation_id` composite FK (documented in "Snapshot and Metric Observation Supersession Integrity" below), which was previously referencing a composite column list with no corresponding parent `UNIQUE` constraint at all.

These are added **alongside**, not instead of, the existing `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)` and `UNIQUE (supersedes_metric_observation_id)` constraints from Sprint 3B.2 — four distinct uniqueness constraints on one table, each serving a different consumer, none redundant.

**`condition_evaluation` — composite keys added (previously "none beyond PK — deliberate"):**

- `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — required by `condition_evaluation_evidence.condition_evaluation_id`'s and `alert.condition_evaluation_id`'s composite FKs.

**This does not reintroduce the mistake Correction 1 (Sprint 3B.2) fixed on `metric_observation`.** These are structural, ID-based composite keys that support cross-table FK enforcement — they say nothing about how many times the same business condition/office/period may be evaluated. `condition_evaluation` still has **no natural-key uniqueness constraint** (no constraint on `business_rule_condition_id` + `office_id` + `reporting_period_start`/`reporting_period_end`), so a condition can still be legitimately re-evaluated any number of times across corrected source data, exactly as Sprint 3B.2 intended.

**Full verification matrix — every composite FK in this proposal and its matching parent key:**

| Child table.column(s) | Parent table.column(s) | Matching parent key | Enforcement |
|---|---|---|---|
| `office.(organization_id, id)` | — | `UNIQUE (organization_id, id)` on `office` itself | Declarative (defines the key, doesn't consume one) |
| `employee_office_assignment.(organization_id, office_id)` | `office.(organization_id, id)` | `office` `UNIQUE (organization_id, id)` | Declarative |
| `employee_office_assignment.(organization_id, employee_id)` | `employee.(organization_id, id)` | `employee` `UNIQUE (organization_id, id)` | Declarative |
| `{revenue,payroll,labor_model,backlog}_snapshot.(organization_id, office_id)` | `office.(organization_id, id)` | `office` `UNIQUE (organization_id, id)` | Declarative |
| `{revenue,payroll,labor_model,backlog}_snapshot.(organization_id, office_id, <natural key>, supersedes_snapshot_id)` | Same table, same columns | Table's own natural-key composite `UNIQUE` (per table, see below) | Declarative for key-matching; **Sprint 3C trigger** for predecessor-exactness |
| `metric_observation.(organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, supersedes_metric_observation_id)` | Same table, same columns | `metric_observation` `UNIQUE (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — **added, Sprint 3B.3** | Declarative for key-matching; **Sprint 3C trigger** for predecessor-exactness |
| `metric_observation_component.(organization_id, metric_observation_id)` | `metric_observation.(organization_id, id)` | `metric_observation` `UNIQUE (organization_id, id)` — **added, Sprint 3B.3** | Declarative |
| `metric_observation_component.(organization_id, office_id, source_<type>_snapshot_id)` | `<type>_snapshot.(organization_id, office_id, id)` | `<type>_snapshot` `UNIQUE (organization_id, office_id, id)` | Declarative |
| `condition_evaluation.(organization_id, office_id)` | `office.(organization_id, id)` | `office` `UNIQUE (organization_id, id)` | Declarative |
| `condition_evaluation.(organization_id, office_id, metric_observation_id)` | `metric_observation.(organization_id, office_id, id)` | `metric_observation` `UNIQUE (organization_id, office_id, id)` — **added, Sprint 3B.3** | Declarative |
| `condition_evaluation_evidence.(organization_id, office_id, condition_evaluation_id)` | `condition_evaluation.(organization_id, office_id, id)` | `condition_evaluation` `UNIQUE (organization_id, office_id, id)` — **added, Sprint 3B.3** | Declarative |
| `condition_evaluation_evidence.(organization_id, office_id, referenced_<type>_snapshot_id)` | `<type>_snapshot.(organization_id, office_id, id)` | `<type>_snapshot` `UNIQUE (organization_id, office_id, id)` | Declarative |
| `condition_evaluation_evidence.(organization_id, referenced_import_job_id)` | `import_job.(organization_id, id)` | `import_job` `UNIQUE (organization_id, id)` | Declarative |
| `alert.(organization_id, office_id, condition_evaluation_id)` | `condition_evaluation.(organization_id, office_id, id)` | `condition_evaluation` `UNIQUE (organization_id, office_id, id)` — **added, Sprint 3B.3** | Declarative |
| `recommendation_evidence_metric_observation.(organization_id, office_id, metric_observation_id)` | `metric_observation.(organization_id, office_id, id)` | `metric_observation` `UNIQUE (organization_id, office_id, id)` — **added, Sprint 3B.3** | Declarative |
| `{revenue,payroll,labor_model,backlog}_snapshot.(organization_id, import_job_id)` | `import_job.(organization_id, id)` | `import_job` `UNIQUE (organization_id, id)` | Declarative (**Sprint 3B.3 Correction 3** — was a plain FK) |
| `import_job.(organization_id, supersedes_import_job_id)` | `import_job.(organization_id, id)` (self) | `import_job` `UNIQUE (organization_id, id)` | Declarative (**Sprint 3B.3 Correction 3** — was a plain, unenforced self-FK) |
| `scenario_input`/`scenario_output`.`(scenario_run_id, scenario_definition_version_id)` | `scenario_run.(id, scenario_definition_version_id)` | `scenario_run` `UNIQUE (id, scenario_definition_version_id)` — **added, Sprint 3B.3** | Declarative |
| `scenario_input`.`(scenario_definition_version_id, scenario_parameter_definition_id)` | `scenario_parameter_definition.(scenario_definition_version_id, id)` | `scenario_parameter_definition` `UNIQUE (scenario_definition_version_id, id)` — **added, Sprint 3B.3** | Declarative |
| `scenario_output`.`(scenario_definition_version_id, scenario_output_definition_id)` | `scenario_output_definition.(scenario_definition_version_id, id)` | `scenario_output_definition` `UNIQUE (scenario_definition_version_id, id)` — **added, Sprint 3B.3** | Declarative |
| `import_source_row.(organization_id, import_job_id, import_source_section_id)` | `import_source_section.(organization_id, import_job_id, id)` | `import_source_section` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative |
| `import_normalized_value.(organization_id, import_job_id, import_source_row_id)` | `import_source_row.(organization_id, import_job_id, id)` | `import_source_row` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative |
| `import_normalized_value_<type>_snapshot.(organization_id, import_job_id, import_normalized_value_id)` | `import_normalized_value.(organization_id, import_job_id, id)` | `import_normalized_value` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative |
| `import_normalized_value_<type>_snapshot.(organization_id, import_job_id, <type>_snapshot_id)` | `<type>_snapshot.(organization_id, import_job_id, id)` | `<type>_snapshot` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative |
| `{payroll_snapshot_line_item, labor_model_staffing_measure}.(organization_id, import_job_id, <header>_id)` | `<header>.(organization_id, import_job_id, id)` | `<header>` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative |
| `{payroll_snapshot_line_item, labor_model_staffing_measure, backlog_stage_count}.(organization_id, import_job_id, import_source_row_id)` | `import_source_row.(organization_id, import_job_id, id)` | `import_source_row` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative (conditional/`MATCH SIMPLE` for `backlog_stage_count`, which allows `NULL`) |
| `backlog_stage_count.(organization_id, import_job_id, backlog_snapshot_id)` | `backlog_snapshot.(organization_id, import_job_id, id)` | `backlog_snapshot` `UNIQUE (organization_id, import_job_id, id)` — **added, Sprint 3B.4** | Declarative, conditional (`MATCH SIMPLE` skips when `import_job_id IS NULL`) |
| `import_validation_issue.(organization_id, import_source_row_id, import_validation_result_id)` | `import_validation_result.(organization_id, import_source_row_id, id)` | `import_validation_result` `UNIQUE (organization_id, import_source_row_id, id)` — **added, Sprint 3B.4 Correction 1** | Declarative |
| `import_job.(organization_id, import_profile_version_id, organization_import_profile_override_id)` | `organization_import_profile_override.(organization_id, import_profile_version_id, id)` | `organization_import_profile_override` `UNIQUE (organization_id, import_profile_version_id, id)` — **added, Sprint 3B.4 Correction 4** | Declarative |
| `import_job.(import_profile_id, import_profile_version_id)` | `import_profile_version.(import_profile_id, id)` | `import_profile_version` `UNIQUE (import_profile_id, id)` — **added, Sprint 3B.4A Correction 1** | Declarative |
| `import_job.(organization_id, import_profile_id, supersedes_import_job_id)` | `import_job.(organization_id, import_profile_id, id)` (self) | `import_job` `UNIQUE (organization_id, import_profile_id, id)` — **added, Sprint 3B.4A Correction 1** | Declarative for key-matching; **Sprint 3C trigger** for cycle-prevention |
| Every other composite FK listed earlier in this document (permission/office-grant, import-lineage detail chain, recommendation/task/scenario-baseline join tables) | — | Verified already present in Sprint 3B.1/3B.2/3B.3/3B.4 — see "Declarative Tenant Consistency," "Additional Composite FKs Added in Sprint 3B.2," "Additional Composite FKs Added in Sprint 3B.4," and "Additional Composite FKs Added in Sprint 3B.4A" above | Declarative |

No composite FK in this proposal now references a column list without a verified matching parent `PRIMARY KEY`/`UNIQUE` constraint.

## Why Typed Join Tables Instead of a Polymorphic Reference

Three places in this proposal could have used a single generic "reference any snapshot type" table (`entity_id UUID, entity_type TEXT, snapshot_id UUID, snapshot_type TEXT`): scenario baseline references, metric-observation-component source-snapshot references, and (in the audit domain) entity references. This proposal uses **typed join tables or typed nullable FK columns per snapshot type** for the first two, and a plain `entity_type TEXT` + `entity_id UUID` pair (not a true FK) only for `audit_event`, which by definition audits arbitrary entity types and cannot enforce a single FK target.

**Reasoning:**

- A typed reference (a join table, or a set of typed nullable FK columns as on `metric_observation_component`) gets a real, enforced foreign key to the specific target table — PostgreSQL can guarantee the referenced row exists and reject an invalid reference at write time.
- A generic polymorphic table cannot have an enforced foreign key at all (the "type" column determines which table `entity_id` should resolve against, which PostgreSQL cannot express declaratively), silently reintroducing the kind of unenforced reference integrity risk [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) and [ADR-000](../decisions/ADR-000-architectural-philosophy.md) ("no hidden business logic") argue against.
- **Sprint 3B.1 Correction 7 removed the one place this proposal previously departed from this rule** — `import_normalized_value.target_table`/`target_record_id` — see [`06-import-lineage-model.md`](06-import-lineage-model.md). Creation order (the normalized value existing before its target snapshot row) is not a valid reason to avoid a foreign key: the normalized value is created first with no target reference at all, and a separate typed link-table row (`import_normalized_value_revenue_snapshot` and its three siblings) is inserted only once the canonical target row exists. Every lineage arrow in this proposal is a genuinely enforced foreign key. **Sprint 3B.4 refines what "enforced" actually guarantees for the import-lineage chain specifically:** through Sprint 3B.3, "enforced" meant organization-matching only; Sprint 3B.4 extends this to Import-Job-matching (and, for the Payroll account-mapping fact, eliminating a duplicated column entirely rather than merely constraining it) — see [`06-import-lineage-model.md`](06-import-lineage-model.md) "Import-Provenance Integrity Matrix" for the complete, current, per-relationship statement of exactly which dimensions (organization, Import Job, source row, profile version) are enforced for each arrow in that specific chain.
- `audit_event` is the deliberate, sole remaining exception because it audits **every** entity type in the system by design; adding a dozen typed join tables to `audit_event` would defeat its purpose as a single generic log. This is called out explicitly as the one place a soft (non-FK-enforced) reference is accepted, and is limited to a logging table with no downstream business logic depending on the reference resolving correctly.

## Snapshot and Metric Observation Supersession Integrity (Sprint 3B.2, Correction 5 and Correction 1)

Sprint 3B.1 gave each of the four canonical snapshot tables a same-**organization** self-referencing composite FK on `supersedes_snapshot_id`. Sprint 3B.2 strengthens this: a snapshot may supersede **only** a row sharing its **complete natural key** (organization, office, reporting period/date, and — for `revenue_snapshot` — `source_type`), not merely the same organization.

**Corrected self-referencing composite FK, per table:**

| Table | Self-referencing composite FK |
|---|---|
| `revenue_snapshot` | `(organization_id, office_id, reporting_period_start, reporting_period_end, source_type, supersedes_snapshot_id) → revenue_snapshot (organization_id, office_id, reporting_period_start, reporting_period_end, source_type, id)` |
| `payroll_snapshot` | `(organization_id, office_id, reporting_period_start, reporting_period_end, supersedes_snapshot_id) → payroll_snapshot (organization_id, office_id, reporting_period_start, reporting_period_end, id)` |
| `labor_model_snapshot` | Same shape as `payroll_snapshot` |
| `backlog_snapshot` | `(organization_id, office_id, reporting_date, supersedes_snapshot_id) → backlog_snapshot (organization_id, office_id, reporting_date, id)` |
| `metric_observation` | `(organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, supersedes_metric_observation_id) → metric_observation (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — deliberately **excludes** `evaluation_fingerprint` from the matched columns, since a correction's entire purpose is to have a *different* fingerprint from the row it supersedes (see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) `metric_observation`) |

Because the child row's own natural-key columns are literally the columns being cross-checked (a self-reference), this single composite FK declaratively guarantees the predecessor shares the same organization, office, and full natural key — no trigger needed for *that* half of the requirement.

**What this composite FK does NOT enforce, and why (requires a Sprint 3C trigger):**

- **`revision_number >= 1`** — a plain, same-row `CHECK (revision_number >= 1)`, fully declarative, no trigger needed.
- **Revision 1 has `supersedes_snapshot_id IS NULL`; revision > 1 has it set** — a plain, same-row `CHECK ((revision_number = 1 AND supersedes_snapshot_id IS NULL) OR (revision_number > 1 AND supersedes_snapshot_id IS NOT NULL))`, fully declarative, no trigger needed.
- **The predecessor's `revision_number` is exactly this row's `revision_number - 1`** — this compares a value on the *referenced* row against a value on *this* row; PostgreSQL `CHECK` constraints cannot read another row's columns, and a composite FK can only assert the referenced row *exists* with matching key columns, not compare its non-key columns arithmetically. This requires a Sprint 3C `BEFORE INSERT` trigger that looks up the referenced predecessor and rejects the insert unless its `revision_number` equals `NEW.revision_number - 1`.
- **Only one direct successor** — already fully declarative via `UNIQUE (supersedes_snapshot_id)` (nulls excluded), unchanged from Sprint 3B.1.
- **No disconnected or branching chains** — an emergent consequence of the two rules above, not a separately-enforced rule: because revision 1 is the only row permitted to have no predecessor, and every revision `N > 1` must (once the Sprint 3C trigger is in place) point to a row that is *exactly* revision `N - 1`, reaching any revision `N` requires an unbroken chain `1, 2, ..., N` to already exist. A "branch" would require two different rows both claiming to be the unique successor of the same predecessor, which `UNIQUE (supersedes_snapshot_id)` already forbids.
- **No row can directly or indirectly supersede itself (no cycles)** — also an emergent consequence, not a separate mechanism: `CHECK (supersedes_snapshot_id IS DISTINCT FROM id)` rules out direct self-reference declaratively. Indirect cycles are ruled out by the same arithmetic fact used above: once the Sprint 3C trigger enforces "predecessor's `revision_number` is exactly one less than mine," every step in a supersession chain **strictly decreases** `revision_number` by exactly one. A cycle would require a chain of strictly-decreasing positive integers to return to its starting value, which is arithmetically impossible. No separate cycle-detection logic is required once the predecessor-exactness trigger exists.

This same reasoning — composite FK for natural-key matching, `CHECK` for the base-case/non-base-case split, one Sprint 3C trigger for predecessor-exactness, cycle-freedom as an emergent arithmetic consequence — applies identically to `metric_observation`'s new `revision_number`/`supersedes_metric_observation_id` pair (Correction 1), not only the four snapshot tables.

## Metric Observation Identity and Reuse (Sprint 3B.2, Correction 1)

Sprint 3B.1's uniqueness constraint on `metric_observation` — `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end)` — was **incorrect**: it assumed the only reason two observations could exist for the same version/office/period is an erroneous duplicate computation. In fact, a **source snapshot correction** (a `payroll_snapshot` revision, for example) can legitimately require a **new** `metric_observation` for the *same* metric version, office, and period, computed from **different, corrected inputs** — and the old constraint would reject that legitimate second row outright, with no way to insert it.

**Corrected identity model:**

- `metric_observation.evaluation_fingerprint TEXT NOT NULL` — a deterministic value (for example, a SHA-256 digest, computed by application code before insert, not a stored generated column) over the canonical combination of: `metric_definition_version_id`, `office_id`, `reporting_period_start`, `reporting_period_end`, `implementation_version`, and the ordered (by `component_key`) list of every component about to be inserted — each expressed as `(component_key, component_role, and either its resolved source snapshot id or its literal component_value + unit)`. Two evaluations that used **exactly** the same inputs produce the same fingerprint; a correction to any contributing snapshot (which is itself a new row with a new UUID, per the Immutable Revisions pattern) necessarily changes at least one component's resolved snapshot id, and therefore the fingerprint.
- `metric_observation.revision_number INTEGER NOT NULL DEFAULT 1` and `metric_observation.supersedes_metric_observation_id UUID NULL` — the identical revision/supersession pattern used by the four canonical snapshots (see above), so a corrected re-evaluation is a new row, never an `UPDATE` of the prior one.
- **Corrected uniqueness:** `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)` — this is the actual duplicate-prevention mechanism: it blocks re-persisting an observation with **the same exact inputs** (a genuine duplicate), while permitting any number of observations with **different** fingerprints for the same version/office/period (genuine corrections). `UNIQUE (supersedes_metric_observation_id)` (nulls excluded) limits each observation to at most one direct successor, matching the snapshot pattern.
- **`computed_at` is never part of identity** — it remains a plain metadata timestamp (when this row was computed), with no uniqueness or lookup role; identity is entirely the version/office/period/fingerprint tuple above, per the founder's explicit instruction.

**Finding the latest applicable observation:** the same pattern as snapshots — `MAX(revision_number)` within the natural key group (`metric_definition_version_id`, `office_id`, `reporting_period_start`, `reporting_period_end`), a plain query, no stored `is_current` flag.

**How Alerts and Recommendations retain their original historical reference:** `alert` (via `condition_evaluation`, see Correction 6) and `recommendation_evidence_metric_observation` each store a plain foreign key to the **specific** `metric_observation.id` they cited at the time of their own creation. Because `metric_observation` rows are immutable and never updated or deleted (only superseded by a new row), that reference remains historically exact and dereferenceable forever, regardless of how many later revisions supersede it — an Alert generated from revision 1 continues to point at revision 1's exact component values even after revision 2 is inserted.

**How reuse works without blocking a correction:** before inserting, the application computes the `evaluation_fingerprint` from the exact inputs it is about to use. If a row already exists with the same `(metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)`, that row is reused (its `id` is returned; no insert occurs) — this is the "reuse an identical durable observation" path. If the fingerprint differs because a source snapshot was corrected, a new row is inserted with `revision_number = <prior max> + 1` and `supersedes_metric_observation_id` set to the prior row's `id` — this is the "permit a corrected evaluation" path, never blocked by the uniqueness constraint because the fingerprint differs.

## Snapshot-to-Import Tenant Integrity (Sprint 3B.3, Correction 3)

Sprint 3B.1/3B.2 propagated `organization_id` deep into the import-lineage detail chain (`import_source_row`, `payroll_snapshot_line_item`, and similar), but left each of the four canonical snapshot headers' own `import_job_id` as a **plain**, unenforced FK straight to `import_job.id` — the one remaining place in the header-level chain where a snapshot could, in principle, be recorded against a different organization's Import Job. Corrected:

- `revenue_snapshot.import_job_id`, `payroll_snapshot.import_job_id`, `labor_model_snapshot.import_job_id`, and `backlog_snapshot.import_job_id` (the latter nullable, populated only for the imported path — see below) each become a composite FK: `(organization_id, import_job_id) → import_job (organization_id, id)`. `import_job` already carries `UNIQUE (organization_id, id)` (added in Sprint 3B.2), so no new parent key is needed.
- `import_job.supersedes_import_job_id` gains the identical treatment: `(organization_id, supersedes_import_job_id) → import_job (organization_id, id)` (self-referencing) — a reprocessing job can never be recorded as superseding a different organization's Import Job.
- **Whether a superseding Import Job may use a different Import Profile Version than the job it supersedes:** same-Organization is mandatory (enforced above); **profile-version equality is deliberately *not* required.** No repository document states that a reprocessing run must use the identical profile version as the run it corrects — and requiring equality would block the common, legitimate case where an organization's Import Profile mapping is itself corrected between a faulty original upload and its reprocessing (the entire point of the correction may be exactly that mapping fix). This is a judgment call, not a repository-stated rule: it is the more permissive of the two reasonable readings, chosen because the more restrictive one would block a plausible real corrective workflow with no stated business justification for the restriction.

**Resolving the duplicated `import_profile_version_id` fact.** Sprint 3B recorded the exact Import Profile Version in **two** independently writable places: once on `import_job.import_profile_version_id` (the version active at import time) and again on each of `revenue_snapshot`, `payroll_snapshot`, and `labor_model_snapshot`'s own `import_profile_version_id` column — with nothing preventing the two from disagreeing for the same import. **Corrected (preferred approach): the redundant column is removed from all three snapshot headers.** `import_job` remains the single, immutable source of "which Import Profile Version was used"; a snapshot's profile version is now always derived through its own `import_job_id` (`revenue_snapshot.import_job_id → import_job.import_profile_version_id`), never stored a second time. (`backlog_snapshot` never had this column — its imported-path fact was already singly-sourced through `import_job_id`.) See [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) for the corrected column lists.

**`backlog_snapshot` source-shape rule (Sprint 3B.3, Correction 3):** `backlog_snapshot.import_job_id` and `backlog_snapshot.manual_entry_user_id` were already mutually described as "one or the other," but this was previously only a documentation convention, not an enforced constraint. Corrected with a genuine same-row `CHECK`:

```text
CHECK (
  (import_job_id IS NOT NULL AND manual_entry_user_id IS NULL)
  OR (import_job_id IS NULL AND manual_entry_user_id IS NOT NULL)
)
```

An explicit `source_type` discriminant column was considered and rejected as unnecessary machinery: the two nullable FK columns already unambiguously encode which path produced the row once the `CHECK` above rules out both-populated and both-null, and a redundant discriminant column would itself need to be kept in sync with the two FKs it duplicates.

## Validation-Result Lineage Integrity (Sprint 3B.3, Correction 5 — historical; parent-relationship claim corrected Sprint 3B.4, see note below)

Sprint 3B.2's broader integrity audit **considered and deliberately declined** to propagate `organization_id` onto `import_validation_result` and `import_validation_issue`, reasoning that both are reachable only through a single `import_source_row_id`, always created by the same import-pipeline execution as the row they describe, with "no realistic write path" capable of attaching either to a different organization's row. **This reasoning is withdrawn.** The founder's instruction is explicit: "do not rely on 'the import pipeline would never do that' as the integrity mechanism — service-role or future import code bugs must still be rejected by the database." A plausible-write-path argument is not a substitute for a database-enforced constraint, and Sprint 3B.2's own stated principle elsewhere in this proposal (declarative enforcement over trusted application behavior) argues directly against the exception it carved out here. Corrected:

- `import_validation_result` gains a denormalized `organization_id UUID NOT NULL`, with composite FK `(organization_id, import_source_row_id) → import_source_row (organization_id, id)` — a validation result can never be recorded against a different organization's source row.
- `import_validation_issue` gains a denormalized `organization_id UUID NOT NULL`, with composite FK `(organization_id, import_validation_result_id) → import_validation_result (organization_id, id)` (requiring `import_validation_result` to also carry `UNIQUE (organization_id, id)`) — an issue can never be recorded against a different organization's validation result.
- **The same-source-row requirement for `import_validation_issue.import_normalized_value_id`:** when an issue references a specific normalized value, that value must have originated from **the same source row** as the Validation Result it belongs to — a stronger, three-way requirement than organization-matching alone (a normalized value from a *different row in the same organization* would still be wrong). This is enforced by extending the composite key one level further: `import_validation_issue` gains a denormalized `import_source_row_id UUID NULL` (populated only when `import_normalized_value_id IS NOT NULL`), with composite FK `(organization_id, import_source_row_id, import_normalized_value_id) → import_normalized_value (organization_id, import_source_row_id, id)` — requiring `import_normalized_value` to additionally carry `UNIQUE (organization_id, import_source_row_id, id)` (alongside its existing `UNIQUE (organization_id, id)`, which remains needed by the four typed link tables).

**⚠️ Superseded claim, withdrawn in Sprint 3B.4 (Correction 1) — preserved here for history only:** this section originally went on to claim that "`import_validation_issue.import_source_row_id` must independently equal `import_validation_result.import_source_row_id` for the *same* validation result (**enforced transitively** — both ultimately trace to the one `import_source_row_id` on `import_validation_result`)." **That claim was false.** The parent-relationship FK this section actually specified above was `(organization_id, import_validation_result_id) → import_validation_result (organization_id, id)` — a two-column, **organization-only** match. Nothing in it, or anywhere else, compared the Issue's own `import_source_row_id` against the cited Validation Result's `import_source_row_id`; the two columns were independent and could disagree. Sprint 3B.4 Correction 1 genuinely closes this: `import_validation_result` gained `UNIQUE (organization_id, import_source_row_id, id)`, and `import_validation_issue`'s parent FK was strengthened to the three-column `(organization_id, import_source_row_id, import_validation_result_id) → import_validation_result (organization_id, import_source_row_id, id)`. See [`06-import-lineage-model.md`](06-import-lineage-model.md) `import_validation_issue` for the current, correct, controlling design — no document in this proposal should describe the row-matching requirement as "enforced transitively" any longer; it is a genuine composite FK.

These three tables (`import_validation_result`, `import_validation_issue`, and `condition_evaluation_evidence`) are added to the tenant-integrity matrix in [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md), which also carries the complete, updated matrix across every join/detail table in this proposal (superseded in turn by [`06-import-lineage-model.md`](06-import-lineage-model.md) "Import-Provenance Integrity Matrix" for the import-lineage-specific subset, current as of Sprint 3B.4A).

## Foreign Keys and Cascade Behavior

No foreign key in this proposal uses `ON DELETE CASCADE`. Per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("nothing is deleted") and [`docs/data-model/01-entity-relationships.md`](../data-model/01-entity-relationships.md) (Ownership Hierarchy pattern), a parent row is expected to be archived, not deleted, so cascading deletion is not the normal operational path. Where a parent row must ever be hard-deleted (the rare exception, see [`08-retention-archive-and-erasure-boundaries.md`](08-retention-archive-and-erasure-boundaries.md)), the correct behavior is decided per-case in Sprint 3C, not defaulted to `CASCADE`, which could silently destroy immutable historical evidence (a Recommendation's cited Alert, for example).

All foreign keys default to `ON DELETE RESTRICT` (PostgreSQL's implicit default when no `ON DELETE` clause is given), meaning an attempt to delete a still-referenced row fails loudly rather than cascading or silently nulling references. This is a deliberate, conservative default for Sprint 3B/3B.1; Sprint 3C may selectively relax it only where archival design requires (also not decided here).

## Uniqueness Constraints

| Table | Unique constraint | Why |
|---|---|---|
| `organization` | *(none beyond PK)* | Tenant root |
| `office` | `(organization_id, external_office_id)`; `(organization_id, id)` | An Office ID is only guaranteed unique within its source organization; the second constraint supports composite FKs from every office-scoped table (Correction 2) |
| `app_user` | `(organization_id, email)`; `(organization_id, id)` | Matches [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) "email uniqueness" per tenant; the second constraint supports composite FKs from every user-referencing tenant table (Correction 2) |
| `employee` | `(organization_id, id)`; `(linked_app_user_id)` partial, `WHERE linked_app_user_id IS NOT NULL` | Composite-FK support; enforces at-most-one-Employee-per-User (Correction 10) |
| `employee_office_assignment` | `EXCLUDE USING gist (employee_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)` | Prevents overlapping active assignment periods for the same Employee (Correction 10) — requires the `btree_gist` extension |
| `revenue_snapshot` | `(office_id, reporting_period_start, reporting_period_end, source_type, revision_number)`; `(supersedes_snapshot_id)`; `(organization_id, id)`; `(organization_id, office_id, id)` **[3B.2]**; `(organization_id, office_id, reporting_period_start, reporting_period_end, source_type, id)` **[3B.2]** | A revision number is unique per natural key; only one direct successor may supersede a given row; the three composite-unique variants each support a different class of composite-FK consumer — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) |
| `payroll_snapshot` | Same pattern as `revenue_snapshot`, minus `source_type` in the natural key | Same |
| `labor_model_snapshot` | Same pattern | Same |
| `backlog_snapshot` | Same pattern, using `reporting_date` in place of a start/end range | Same |
| `backlog_stage_count` | `(backlog_snapshot_id, production_stage_id)` | One count per stage per snapshot |
| `production_stage` | Two `EXCLUDE USING gist` constraints, one for `organization_id IS NULL` (business key only), one for `organization_id IS NOT NULL` (business key + organization) | **Corrected (Sprint 3B.2 Correction 4)** — a single constraint including a nullable `organization_id WITH =` does **not** catch two overlapping system-default rows, since PostgreSQL treats each `NULL` as distinct; see "The Nullable-`organization_id` Exclusion Bug" above |
| `security_role` | `(organization_id, name)` | Where `organization_id IS NULL`, uniqueness is enforced on `name` alone via a partial unique index, since standard uniqueness treats `NULL` as distinct per row |
| `capability` | `(code)` | Global, LabPulse-defined, not organization-scoped |
| `permission_set` | *(none on `security_role_id` — that column no longer exists here, see Correction 4)* | See [`07-authorization-data-model.md`](07-authorization-data-model.md) |
| `security_role` | `(permission_set_id)` **not** unique — **Sprint 3B.1 Correction 4:** the FK direction is reversed from Sprint 3B (`security_role.permission_set_id → permission_set.id`); multiple `security_role` rows may reference the same `permission_set_id` without any schema change, which is the correct, forward-compatible cardinality (see [`07-authorization-data-model.md`](07-authorization-data-model.md)) |
| `job_role` | `(organization_id, name)` (partial unique index for `organization_id IS NULL`, as with `security_role`) | |
| `permission` | `(id, organization_id)`; `(id, scope_type)` | Support composite FKs from `permission_office_grant` (Correction 2 & 3) |
| `permission_office_grant` | `(permission_id, office_id)` (composite PK) | One row per office per Permission |
| `import_profile_version` | `(import_profile_id, version_number)`; `(import_profile_id, id)` **[added, Sprint 3B.4A Correction 1]** | Sequential, monotonic versions; the second constraint supports `import_job.import_profile_version_id`'s strengthened composite FK |
| `import_job` | `(organization_id, id)` **[3B.2]**; `(organization_id, import_profile_id, id)` **[added, Sprint 3B.4A Correction 1]** | The first supports `import_source_section` and the four canonical snapshot headers' composite FKs (3B.3); the second supports the strengthened `supersedes_import_job_id` self-FK requiring the same base Import Profile (3B.4A) |
| `organization_import_profile_override` | `(organization_id, import_profile_version_id, version_number)`; `(organization_id, import_profile_version_id, id)` **[3B.4 Correction 4]** | An organization's own override version numbers are sequential per base profile version; the second constraint supports `import_job.organization_import_profile_override_id`'s composite FK (**`payroll_snapshot.account_mapping_version_id` no longer exists as of Sprint 3B.4 Correction 5 — it does not consume this key**) |
| `import_source_section` | `(import_job_id, section_index)`; `(organization_id, id)` **[3B.2]** | A section's position within its Import Job is unique; the second constraint supports `import_source_row`'s composite FK |
| `import_source_row` | `(import_source_section_id, row_number)`; `(organization_id, id)` **[3B.2]** | A row's position within its section is unique; the second constraint supports every detail table's composite FK to it |
| `import_normalized_value` | `(import_source_row_id, canonical_field_name)`; `(organization_id, id)` **[3B.2]** | One normalized value per canonical field per source row; the second constraint supports the four typed link tables' composite FKs |
| `business_rule_version` | Two `EXCLUDE USING gist` constraints, same NULL-scope split as `production_stage` above | **Corrected (Sprint 3B.2 Correction 4)** — same bug and same fix as `production_stage`; Sprint 3B.1's single-constraint version is withdrawn |
| `business_rule_condition` | `(business_rule_version_id, condition_code)` | **New (Correction 5, Sprint 3B.1)** |
| `metric_definition_version` | `EXCLUDE USING gist (metric_definition_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)` | Non-overlap; no `organization_id` column exists on this table, so the nullable-scope bug does not apply here |
| `metric_observation` | `(metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)` **[corrected, 3B.2]**; `(supersedes_metric_observation_id)` **[new, 3B.2]**; `(organization_id, id)` **[added, 3B.3]**; `(organization_id, office_id, id)` **[added, 3B.3]**; `(organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` **[added, 3B.3]** | **Corrected (Sprint 3B.2 Correction 1)** — the Sprint 3B.1 constraint (without `evaluation_fingerprint`) incorrectly blocked a legitimate second observation after a source-snapshot correction; see "Metric Observation Identity and Reuse" above. **Sprint 3B.3 Correction 1** adds the three composite-FK-support keys that Sprint 3B.2 required but never actually declared — see "Composite Foreign Key Verification Matrix" above |
| `metric_observation_component` | `(metric_observation_id, component_key)` | **New (Correction 6, Sprint 3B.1)** |
| `condition_evaluation` | `(organization_id, id)`; `(organization_id, office_id, id)` **[both added, Sprint 3B.3 Correction 1]** — no natural-key uniqueness, deliberately, see "Alert Evidence Model" above | **New table (Sprint 3B.2 Correction 6)**; composite-FK-support keys added in Sprint 3B.3 after `condition_evaluation_evidence` and `alert` were found to reference a composite key that did not yet exist |
| `condition_evaluation_evidence` | *(none beyond PK)* | **New table (Sprint 3B.2 Correction 6)** |
| `scenario_definition_version` | `EXCLUDE USING gist (scenario_definition_id WITH =, daterange(effective_start_date, effective_end_date, '[)') WITH &&)` | Non-overlap; no `organization_id` column on this table |
| `scenario_parameter_definition` | `(scenario_definition_version_id, parameter_key)`; `(scenario_definition_version_id, id)` **[added, Sprint 3B.3 Correction 4]** | The second constraint supports `scenario_input`'s composite FK binding an input to a definition belonging to the exact same Scenario Definition Version |
| `scenario_output_definition` | `(scenario_definition_version_id, output_key)`; `(scenario_definition_version_id, id)` **[added, Sprint 3B.3 Correction 4]** | Same, for `scenario_output` |
| `scenario_input` | `(scenario_run_id, scenario_parameter_definition_id)` | |
| `scenario_output` | `(scenario_run_id, scenario_output_definition_id)` | |
| `recommendation` | `(organization_id, id)`; `(organization_id, office_id, id)` **[3B.2]**; `(supersedes_recommendation_id)` **[new, 3B.2]** | Composite-FK support; only one direct successor may supersede a given Recommendation (Correction 7) |
| `recommendation_lifecycle_event` | `(recommendation_id, sequence_number)` | |
| `alert_lifecycle_event` | `(alert_id, sequence_number)` | |
| `alert` | `(organization_id, id)`; `(organization_id, office_id, id)` **[3B.2]** | Composite-FK support |
| `scenario_run` | `(organization_id, id)`; `(organization_id, office_id, id)` **[3B.2]**; `(id, scenario_definition_version_id)` **[added, Sprint 3B.3 Correction 4]** | The Sprint 3B.2 constraints support the four `scenario_run_*_snapshot` join tables' same-Office composite FKs; the new Sprint 3B.3 constraint lets `scenario_input`/`scenario_output` declaratively verify they cite the **same** Scenario Definition Version as their parent Run, not merely the same Run |

## Check Constraints

| Table.Column | Constraint |
|---|---|
| `backlog_stage_count.case_count` | `>= 0` |
| `import_job.error_count`, `.warning_count` | `>= 0` |
| `payroll_snapshot_line_item.amount` | No sign restriction — negative values are valid (credits/adjustments), per [`docs/imports/04-data-normalization.md`](../imports/04-data-normalization.md) parenthetical-negative handling |
| `revenue_snapshot.reporting_period_end` | `>= reporting_period_start` |
| Every `*_version` table's `effective_end_date` | `IS NULL OR effective_end_date >= effective_start_date` |
| `employee.end_date` | `IS NULL OR end_date >= start_date` |
| `employee_office_assignment.effective_end_date` | `IS NULL OR effective_end_date >= effective_start_date` |
| `permission_office_grant.scope_type` | `= 'office'` — the denormalized copy of the parent Permission's `scope_type`, enforced equal to `'office'` by this `CHECK` in combination with the composite FK described above |
| `metric_observation_component` | `num_nonnulls(source_revenue_snapshot_id, source_payroll_snapshot_id, source_labor_model_snapshot_id, source_backlog_snapshot_id) <= 1` — a genuine same-row `CHECK` using PostgreSQL's built-in `num_nonnulls()` |
| `condition_evaluation_evidence` | `num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id, referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) <= 1` — **New (Sprint 3B.2 Correction 6)**, same pattern |
| `scenario_input`, `scenario_output` | `num_nonnulls(value_numeric, value_text, value_boolean, value_date, value_reference_job_role_id, value_reference_office_id) = 1` — **Changed (Sprint 3B.2 Correction 9)**, extended from a single generic `value_reference_id` to two typed reference columns |
| `backlog_snapshot.total_discrepancy_amount` | Only computed/non-null when both `source_provided_total_case_count` and `derived_total_case_count` are non-null — `CHECK (total_discrepancy_amount IS NULL OR (source_provided_total_case_count IS NOT NULL AND derived_total_case_count IS NOT NULL))` — a real `CHECK`, not a documentation-only convention |
| `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `metric_observation` | `CHECK (revision_number >= 1)`; `CHECK ((revision_number = 1 AND supersedes_<row>_id IS NULL) OR (revision_number > 1 AND supersedes_<row>_id IS NOT NULL))` — **New (Sprint 3B.2 Correction 1 & 5)**, see "Snapshot and Metric Observation Supersession Integrity" above |
| `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `recommendation` | `CHECK (supersedes_<row>_id IS DISTINCT FROM id)` — **New (Sprint 3B.2 Correction 5 & 7)** — no row may directly supersede itself |
| `employee_office_assignment.effective_end_date` (repeated here for emphasis) | `IS NULL OR effective_end_date >= effective_start_date`; enforcement that a **closed** row's `effective_end_date`, `employee_id`, `office_id`, and `effective_start_date` can never subsequently change is a Sprint 3C trigger, not a `CHECK` — see "Employee Assignment Lifecycle" above |
| `permission` | `CHECK (effective_end_at IS NULL OR effective_start_at IS NULL OR effective_end_at > effective_start_at)`; `CHECK (revoked_at IS NULL OR revoked_at >= granted_at)` — **New (Sprint 3B.3, Correction 6)**, genuine same-row `CHECK` constraints |
| `import_normalized_value` | `CHECK (num_nonnulls(canonical_value_text, canonical_value_numeric) = 1)` — **New (Sprint 3B.3, Correction 6)**. No documented case in this proposal requires a normalized value to be entirely absent (an unparsable or missing source value is represented by the corresponding `import_validation_issue`, not by a both-null normalized-value row); if a genuine "normalized but unavailable" case is confirmed later, this should be widened to `<= 1` together with an explicit `is_unavailable` flag, not silently loosened |
| `business_rule_condition` | `CHECK ((condition_type = 'numeric' AND metric_definition_version_id IS NOT NULL AND operator IS NOT NULL AND threshold_value IS NOT NULL AND threshold_unit IS NOT NULL) OR (condition_type <> 'numeric' AND metric_definition_version_id IS NULL AND operator IS NULL AND threshold_value IS NULL AND threshold_unit IS NULL))` — **New (Sprint 3B.3, Correction 6)**. No documented non-numeric condition type in this repository needs a threshold field populated; if one is confirmed later, it should be added as a named exception, not by loosening this unconditionally |
| `alert_lifecycle_event.sequence_number`, `recommendation_lifecycle_event.sequence_number` | `>= 1` — **New (Sprint 3B.3, Correction 6)** |
| `import_profile_version.version_number`, `organization_import_profile_override.version_number`, `business_rule_version.version_number`, `metric_definition_version.version_number`, `scenario_definition_version.version_number` | `>= 1` — **New (Sprint 3B.3, Correction 6)** |
| `business_rule_condition.display_order`, `scenario_parameter_definition.display_order`, `scenario_output_definition.display_order`, `production_stage.display_order` | `>= 0` — **New (Sprint 3B.3, Correction 6)** |
| `scenario_parameter_definition`, `scenario_output_definition` | `CHECK ((data_type = 'reference' AND reference_target_type IS NOT NULL) OR (data_type <> 'reference' AND reference_target_type IS NULL))` — **New (Sprint 3B.3, Correction 4)**, see "Binding Scenario Values to the Run's Exact Definition Version" above |
| `backlog_snapshot` | `CHECK ((import_job_id IS NOT NULL AND manual_entry_user_id IS NULL) OR (import_job_id IS NULL AND manual_entry_user_id IS NOT NULL))` — **New (Sprint 3B.3, Correction 3)**, see "Snapshot-to-Import Tenant Integrity" above |
| `condition_evaluation_evidence` (evidence-shape) | See the full evidence-shape `CHECK` in "Alert Evidence Model" above — **New (Sprint 3B.3, Correction 2)**, distinct from and additional to the pre-existing `num_nonnulls(...) <= 1` row above |
| `alert.(condition_evaluation_id)` | `UNIQUE (condition_evaluation_id)` — **New (Sprint 3B.3, Correction 6)**; a uniqueness constraint, not a `CHECK`, cross-referenced here — see "Alert Evidence Model" above |

Every status/type/category column documented in [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) as "`CHECK` in (...)" carries that explicit `CHECK` constraint, listed there rather than repeated here.

## Non-Overlapping Effective Periods (Sprint 3B.1 Correction 15, corrected further in Sprint 3B.2 Correction 4)

Every version/configuration table whose rows are meant to represent non-overlapping periods of validity uses a PostgreSQL `EXCLUDE` constraint (via the `btree_gist` extension), not merely a `UNIQUE` constraint on a version number, which does not prevent two overlapping date ranges from coexisting. Applied to: `employee_office_assignment`, `production_stage`, `business_rule_version`, `metric_definition_version`, `scenario_definition_version`. `import_profile_version` and `organization_import_profile_override` are intentionally **not** given this treatment: a new profile version does not retroactively invalidate the previous one in the same simple way (an `import_job` explicitly pins the exact version it used), so sequential `version_number` uniqueness remains the correct constraint there.

### The Nullable-`organization_id` Exclusion Bug (Sprint 3B.2, Correction 4)

Sprint 3B.1 claimed a single `EXCLUDE USING gist (organization_id WITH =, code WITH =, daterange(...) WITH &&)` constraint on `production_stage` "prevents two simultaneously-effective definitions of the same stage code," including for system-default rows (`organization_id IS NULL`). **This claim was wrong, in the opposite direction from how a nullable-equality bug is usually described:** PostgreSQL's GiST exclusion machinery, like a plain `UNIQUE` index, does not treat two `NULL` values as equal to each other by default — so a single `EXCLUDE` constraint including `organization_id WITH =` would **fail to catch** two overlapping system-default rows for the same `code` (each `NULL` is treated as distinct from every other `NULL`, so no conflict is ever detected between them), the exact opposite of the protection Sprint 3B.1 believed this constraint provided. The bug is real; the claimed direction of the risk was backwards.

**Corrected design — two separate exclusion constraints, not one:**

```text
-- Constraint A: system-default rows (organization_id IS NULL) — compares on
-- the business key alone, with no organization_id column in the constraint at all,
-- so two default rows for the same code correctly conflict when their ranges overlap.
EXCLUDE USING gist (
  code WITH =,
  daterange(effective_start_date, effective_end_date, '[)') WITH &&
) WHERE (organization_id IS NULL)

-- Constraint B: organization-specific rows — unchanged from Sprint 3B.1,
-- scoped to only the rows where organization_id is actually set.
EXCLUDE USING gist (
  organization_id WITH =,
  code WITH =,
  daterange(effective_start_date, effective_end_date, '[)') WITH &&
) WHERE (organization_id IS NOT NULL)
```

Applied to **`production_stage`** and **`business_rule_version`** (the only two effective-dated, nullable-`organization_id` tables in this proposal that use an `EXCLUDE` constraint — `metric_definition_version` and `scenario_definition_version` have no `organization_id` column at all and are unaffected; `employee_office_assignment`'s `EXCLUDE` has no `organization_id` in its predicate and was never subject to this bug). See [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) for the exact per-table constraint text. **All prior claims that the single-constraint design already covers system defaults are withdrawn** — see [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md), which now carries a pointer to this correction.

## Alert Evidence Model (Sprint 3B.2, Correction 6)

Sprint 3B.1's `alert` table required `metric_observation_id NOT NULL`, which cannot represent a `business_rule_condition` whose `condition_type` is `qualitative`, `missing_data`, `stale_data`, or `other` — none of which necessarily has a Metric Observation to cite. Sprint 3B.2 introduces `condition_evaluation` (the immutable record of "this specific Business Rule Condition was evaluated, at this time, for this Office/Organization/period, with this evidence") and `condition_evaluation_evidence` (typed, relational evidence for non-numeric conditions), and reduces `alert` to a thin, denormalized-for-RLS pointer at the evaluation that produced it.

**`condition_evaluation`** (new, immutable, MVP):

- `organization_id`, `office_id` (composite FK → `office`) — denormalized, matching every other immutable-core table's RLS pattern.
- `business_rule_condition_id` (required FK) — the exact condition; global-or-same-organization enforcement per [`01-physical-model-principles.md`](01-physical-model-principles.md), since the condition's parent `business_rule_version` may be a global default.
- `reporting_period_start`, `reporting_period_end` (required `DATE`).
- `evaluated_at` (required `TIMESTAMPTZ`).
- `metric_observation_id` (**nullable** FK → `metric_observation`) — populated only for `numeric` conditions; `NULL` for every other `condition_type`, closing the "must not be universally required" requirement.
- `numeric_triggered_value` (nullable `NUMERIC(14,4)`) — populated only alongside `metric_observation_id`.
- `qualitative_summary` (nullable `TEXT`) — a human-readable explanation of why a non-numeric condition fired (for example, "No Backlog import received for this Office in the prior 14 days" for a `stale_data` condition), populated when `metric_observation_id IS NULL`.

**`condition_evaluation_evidence`** (new, MVP) — typed, relational evidence for conditions needing more than a text summary (for example, citing the specific `import_job` a `missing_data`/`stale_data` condition is about):

- `condition_evaluation_id` (required FK).
- `organization_id`, `office_id` (both required, **`office_id` added in Sprint 3B.3 Correction 2** — Sprint 3B.2 omitted it, which meant the "organization-and-office-matched" snapshot references described below could not actually be expressed as composite FKs, since there was no `office_id` on this row to compose them from. Corrected composite FK: `(organization_id, office_id, condition_evaluation_id) → condition_evaluation (organization_id, office_id, id)` — this row's own organization and office must always match its parent Condition Evaluation's, not merely be assumed to via the parent).
- `evidence_role` (`CHECK` in `missing_import`, `stale_snapshot`, `referenced_snapshot`, `other`).
- `referenced_import_job_id` (nullable, composite FK `(organization_id, referenced_import_job_id) → import_job (organization_id, id)` — organization-only match, since `import_job` has no `office_id` of its own).
- `referenced_revenue_snapshot_id` / `..._payroll_snapshot_id` / `..._labor_model_snapshot_id` / `..._backlog_snapshot_id` (nullable, each a composite FK `(organization_id, office_id, referenced_<type>_snapshot_id) → <type>_snapshot (organization_id, office_id, id)`, using this row's **own** `organization_id`/`office_id` columns directly, not the parent's — the parent-match is separately guaranteed by the `condition_evaluation_id` composite FK above) — `CHECK (num_nonnulls(...) <= 1)`, the same mutual-exclusivity pattern as `metric_observation_component`.
- `notes` (nullable `TEXT`).

No column here is `JSONB` — every piece of evidence is a typed, enforced relational reference, satisfying "preserve source/evidence references without unrestricted JSON replacing relational design."

**Evidence-shape `CHECK` constraints (Sprint 3B.3, Correction 2)** — Sprint 3B.2 left `evidence_role` as a free-standing classification with no same-row rule tying it to which reference columns must actually be populated, which permitted a nonsensical row (`evidence_role = 'other'` with a populated snapshot reference, or a fully empty row with no reference and no notes). Corrected:

```text
CHECK (
  (evidence_role = 'referenced_snapshot'
     AND num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id,
                       referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) = 1
     AND referenced_import_job_id IS NULL)
  OR (evidence_role = 'stale_snapshot'
     AND num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id,
                       referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) = 1)
  OR (evidence_role = 'missing_import'
     AND (referenced_import_job_id IS NOT NULL OR notes IS NOT NULL)
     AND num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id,
                       referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) = 0)
  OR (evidence_role = 'other'
     AND notes IS NOT NULL
     AND referenced_import_job_id IS NULL
     AND num_nonnulls(referenced_revenue_snapshot_id, referenced_payroll_snapshot_id,
                       referenced_labor_model_snapshot_id, referenced_backlog_snapshot_id) = 0)
)
```

This guarantees: `referenced_snapshot` and `stale_snapshot` each require exactly one typed snapshot reference (per the founder's instruction); any role citing an Import Job (`missing_import`) requires `referenced_import_job_id` **or**, when no relevant Import Job exists at all, a structured `notes` explanation instead (see below); `other` may use `notes` but is barred from populating any typed reference column, so it cannot masquerade as typed evidence; and no combination of `evidence_role` values permits an entirely empty row (every branch requires at least one of a typed reference or `notes`).

**Representing a true `missing_data` condition with no missing Import Job to cite (Sprint 3B.3, Correction 2):** the founder's instruction is not to require a nonexistent Import Job. This proposal's chosen representation, the simplest one the existing schema already supports without inventing a new column or table: when an Import Job of the relevant type *has* run before (even if it is now stale), `referenced_import_job_id` points at that **last known** Import Job — giving a concrete anchor ("no import since this one") — with `evidence_role = 'missing_import'`. When **no** Import Job of the relevant type has ever run for the Office (there is nothing to reference at all), `referenced_import_job_id` is left `NULL` and `notes` is required instead (enforced by the `CHECK` above) to carry a structured, human-readable explanation (for example, "No Backlog import of any kind has been received for this Office since organization onboarding"). This is honest about the limits of what a foreign key can express — a reference to something that has never existed cannot be a foreign key — without falling back to unrestricted `JSONB`.

**`alert`, redesigned:**

- `organization_id`, `office_id` (composite FK → `office`) — retained directly on `alert` for RLS simplicity, per the intentional-denormalization principle.
- `condition_evaluation_id` (required, composite FK `(organization_id, office_id, condition_evaluation_id) → condition_evaluation (organization_id, office_id, id)`) — the single reference to the immutable evaluation that produced this Alert.
- `triggered_at` (required `TIMESTAMPTZ`) — the moment **this Alert** was generated; kept distinct from `condition_evaluation.evaluated_at` (the moment the underlying condition was evaluated), since the two are conceptually separate events even though usually simultaneous in practice.

`alert.business_rule_condition_id`, `alert.metric_observation_id`, `alert.reporting_period_start`/`reporting_period_end`, and `alert.triggered_value` (all present in the Sprint 3B.1 design) are **removed** — every one of those facts now lives on `condition_evaluation`, reachable via `alert.condition_evaluation_id`. `alert_lifecycle_event` (Sprint 3B.1 Correction 8) is unaffected by this change.

**No new *natural-key* uniqueness constraint on `condition_evaluation`** — deliberately, to avoid repeating the exact mistake Correction 1 fixed on `metric_observation`: multiple evaluations of the same condition for the same office/period must remain insertable across corrected re-evaluations, with no natural-key uniqueness blocking a legitimate second evaluation. (Sprint 3B.3 Correction 1 does add two purely structural, ID-based composite keys — `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)` — needed only to support `condition_evaluation_evidence` and `alert`'s composite FKs into this table; see "Composite Foreign Key Verification Matrix" above. These say nothing about how many times a condition may be evaluated and do not reintroduce the withdrawn constraint.)

**`alert.(condition_evaluation_id)` uniqueness (Sprint 3B.3, Correction 6):** `UNIQUE (condition_evaluation_id)` — no repository document describes a need for more than one Alert to be generated from the same immutable Condition Evaluation. A repeated evaluation of the same condition (for example, on the next scheduled run) produces a **new** `condition_evaluation` row, which may then produce its own, distinct `alert` — never a second `alert` pointing at an already-alerted evaluation. This closes an otherwise-open door to duplicate Alerts for what is, from an evidentiary standpoint, the exact same triggering event.

**`condition_evaluation` same-row consistency (Sprint 3C trigger, documented here, not implemented):** three rules that a plain `CHECK` cannot fully express without cross-referencing `business_rule_condition.condition_type` (a different table) are documented for Sprint 3C's trigger inventory rather than left as an unstated assumption: (1) when the parent `business_rule_condition.condition_type = 'numeric'`, `metric_observation_id` and `numeric_triggered_value` must both be non-null; (2) when `condition_type` is anything else, both must be null (and `qualitative_summary` must be non-null instead); (3) `reporting_period_end >= reporting_period_start` — this third rule *is* a plain same-row `CHECK` (`CHECK (reporting_period_end >= reporting_period_start)`), fully declarative, listed here together with (1) and (2) only because all three govern the same table's temporal/evidentiary consistency.

## Immutable Recommendation Supersession (Sprint 3B.2, Correction 7)

Sprint 3B.1's `recommendation.superseded_by_recommendation_id` required mutating the **older**, already-immutable `recommendation` row the moment a newer one superseded it — directly contradicting Recommendation's own immutable-core design. Sprint 3B.2 reverses the direction: **`recommendation.supersedes_recommendation_id`**, populated on the **new** row, pointing backward at the older Recommendation it replaces. The older row is never touched.

- **Composite FK:** `(organization_id, office_id, supersedes_recommendation_id) → recommendation (organization_id, office_id, id)` — enforces same organization **and** same Office; no exception is documented anywhere in this repository for cross-Office supersession, so none is permitted.
- **At most one direct successor:** `UNIQUE (supersedes_recommendation_id)` (nulls excluded).
- **No self-reference:** `CHECK (supersedes_recommendation_id IS DISTINCT FROM id)`.
- **No cycles (Sprint 3C trigger, documented here, not implemented):** unlike the snapshot/metric-observation pattern, `recommendation` has no `revision_number` to make cycle-freedom an arithmetic certainty — introducing one solely for this purpose would be more machinery than this correction calls for. Instead, Sprint 3C should implement a trigger requiring `supersedes_recommendation_id` (when set) to reference a Recommendation whose `generated_at` is **strictly earlier** than the new row's own `generated_at`. Combined with `UNIQUE (supersedes_recommendation_id)`, this makes a cycle impossible: a cycle would require a chain of strictly-decreasing `generated_at` values that returns to its own starting point, which cannot happen since `generated_at` is assigned once, at insert time, and never updated.

[`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) and [`05-temporal-versioning-and-snapshots.md`](05-temporal-versioning-and-snapshots.md) are updated to reflect the corrected direction.

## Employee Assignment Lifecycle (Sprint 3B.2, Correction 8)

Sprint 3B.1 described `employee_office_assignment` as "append-only" while simultaneously requiring that a transfer **update** the prior row's `effective_end_date` — an internal contradiction, since true append-only means no row is ever updated after creation. Sprint 3B.2 adopts **Option A — effective-dated mutable closure** as the accurate model:

- `employee_id`, `office_id`, and `effective_start_date` are immutable from the moment a row is created.
- An **active** row (`effective_end_date IS NULL`) may be updated **exactly once**, to set `effective_end_date` when a transfer occurs.
- Once closed (`effective_end_date IS NOT NULL`), a row can never be reopened or otherwise changed.
- This table is therefore **historically preserved and effective-dated**, not fully append-only event-sourcing — a deliberately narrower, more accurate description than Sprint 3B.1 used.

**Enforcement (Sprint 3C trigger, documented here, not implemented):** a `BEFORE UPDATE` trigger rejecting any update where `OLD.effective_end_date IS NOT NULL` (a closed row is being touched at all) or where `NEW.employee_id`, `NEW.office_id`, or `NEW.effective_start_date` differ from `OLD` (any field other than the one permitted `NULL → non-NULL` transition on `effective_end_date` is being changed). The `EXCLUDE` non-overlap constraint (unchanged from Sprint 3B.1) continues to guarantee no two rows for the same Employee have overlapping active periods.

## Typed Scenario References (Sprint 3B.2, Correction 9)

Sprint 3B.1's `scenario_input.value_reference_id`/`scenario_output.value_reference_id` were unrestricted `UUID` columns with no identifiable target table — a generic reference the founder's instruction specifically prohibits. No repository document (including [`docs/entities/scenario.md`](../entities/scenario.md), whose `structure_notes` remain unconfirmed) confirms a specific reference target type is definitely required for MVP; the only concrete precedent anywhere in the repository is the illustrative `proposed_hire_job_role` parameter-key example (implying a JobRole reference) and the product's general "transfer"/office-comparison scenarios (implying an Office reference). Per the founder's instruction to design minimally rather than invent unconfirmed target types, this proposal supports **exactly these two, and no others**:

- `scenario_input`/`scenario_output` each replace the single `value_reference_id` with **two typed nullable columns**: `value_reference_job_role_id` and `value_reference_office_id`.
- `scenario_parameter_definition`/`scenario_output_definition` gain `reference_target_type TEXT NULL CHECK IN ('job_role', 'office')`, populated only when `data_type = 'reference'`, naming which of the two typed columns the definition expects to be populated (matching the two to each other is an application-layer validation, the same limitation already documented for the `data_type`/typed-value-column pairing).
- **`value_reference_office_id`:** composite FK `(organization_id, value_reference_office_id) → office (organization_id, id)` — `office.organization_id` is never nullable, so this is a plain, unconditional composite FK, no trigger needed.
- **`value_reference_job_role_id`:** `job_role.organization_id` **is** nullable (system-default job roles) — this is the Global-or-Same-Organization Reference Pattern (see [`01-physical-model-principles.md`](01-physical-model-principles.md)), requiring the same Sprint 3C trigger as the other six sites of that pattern, not a plain composite FK.
- The mutual-exclusivity `CHECK` on both tables extends to `CHECK (num_nonnulls(value_numeric, value_text, value_boolean, value_date, value_reference_job_role_id, value_reference_office_id) = 1)`.

This design is additive if a third reference target type is ever confirmed (one new nullable column, one new `CHECK IN (...)` value) rather than a schema break, and can also simply go unused (no `scenario_parameter_definition` row ever sets `data_type = 'reference'`) if neither type is ultimately needed — either outcome requires no further redesign of `scenario_input`/`scenario_output` themselves.

## Binding Scenario Values to the Run's Exact Definition Version (Sprint 3B.3, Correction 4)

Sprint 3B.1/3B.2 gave `scenario_input`/`scenario_output` a composite FK to `scenario_run` (same organization) and a plain FK to `scenario_parameter_definition`/`scenario_output_definition` (global tables). Neither FK, individually or together, prevented a `scenario_input` row from citing a Parameter Definition belonging to a **different** Scenario Definition Version than the one its own `scenario_run` actually used — for example, a Run created against version 2 of a Scenario Definition could, with nothing to stop it, record an input against a Parameter Definition that only exists in version 3. This is now closed declaratively:

- `scenario_input`/`scenario_output` each gain a `scenario_definition_version_id UUID NOT NULL` column.
- **Run-version agreement:** composite FK `(scenario_run_id, scenario_definition_version_id) REFERENCES scenario_run (id, scenario_definition_version_id)` — requires `scenario_run` to expose `UNIQUE (id, scenario_definition_version_id)` (added above). This guarantees the input/output's `scenario_definition_version_id` is **exactly** the version its parent Run was created against — not merely *a* valid version, but *the* one that Run used.
- **Definition-version agreement:** composite FK `(scenario_definition_version_id, scenario_parameter_definition_id) REFERENCES scenario_parameter_definition (scenario_definition_version_id, id)` (and the equivalent for `scenario_output`/`scenario_output_definition`) — requires `scenario_parameter_definition`/`scenario_output_definition` to expose `UNIQUE (scenario_definition_version_id, id)` (added above). This guarantees the cited Parameter/Output Definition **itself** belongs to that same version, not merely that some version-agreement chain exists.
- Together, these two composite FKs — sharing the same `scenario_definition_version_id` value on the child row — transitively guarantee the Run's version, the input's declared version, and the definition's owning version are all identical. Neither FK alone would catch a mismatch where, for example, the input's `scenario_definition_version_id` agreed with the Run but the cited definition belonged to a different version (or vice versa); both must hold simultaneously, which PostgreSQL enforces automatically once both composite FKs reference the same column.

**Sprint 3C validation rule (documented here, not implemented):** the populated value column (`value_numeric`/`value_text`/`value_boolean`/`value_date`/`value_reference_job_role_id`/`value_reference_office_id`) must match the referenced definition's `data_type` and, when `data_type = 'reference'`, its `reference_target_type`. A `CHECK` constraint cannot join across tables to read the definition row's `data_type`, so this is added to the Sprint 3C trigger inventory below as a `BEFORE INSERT OR UPDATE` trigger on `scenario_input`/`scenario_output`, alongside the existing same-row `num_nonnulls(...) = 1` `CHECK` (which independently guarantees exactly one value column is populated, regardless of which one).

**Same-row `CHECK` on the definition tables:** `scenario_parameter_definition` and `scenario_output_definition` each gain `CHECK ((data_type = 'reference' AND reference_target_type IS NOT NULL) OR (data_type <> 'reference' AND reference_target_type IS NULL))` — fully declarative, no trigger needed, since both columns live on the same row.

**Note (Sprint 3B.3 cleanup):** a stray, empty duplicate `## Foreign Keys and Cascade Behavior` heading (with no content under it, distinct from the populated section of the same name earlier in this document) was found immediately before this point and removed — a leftover artifact from an earlier edit pass, not a substantive change.

## System-Default vs. Organization-Override Precedence

See [`01-physical-model-principles.md`](01-physical-model-principles.md) "System-Default vs. Organization-Override Precedence" — applies to every nullable-`organization_id` table in this document (`security_role`, `job_role`, `production_stage`, `business_rule_version`, and the `import_profile_version`/`organization_import_profile_override` pair).

## Index Considerations (Not Final)

These are documented as considerations Sprint 3C should evaluate against real query patterns, not committed index definitions:

- Every foreign-key column should generally get a supporting index (PostgreSQL does not auto-index FK columns, unlike PKs); this includes every new composite FK column pair introduced by Correction 2.
- `(office_id, reporting_period_start)` composite indexes on every snapshot table, to support the dashboard's dominant query shape ("this office, this period, and recent trend") — combined with a partial-index or query-time `MAX(revision_number)` pattern to fetch only the latest revision efficiently (Correction 1).
- `(organization_id, status)` on `alert` and `recommendation`, to support "show me all open items for my organization" queries.
- A partial or covering index on `alert_lifecycle_event`/`recommendation_lifecycle_event` for the "latest event per parent" access pattern (`(alert_id, sequence_number DESC)` / `(recommendation_id, sequence_number DESC)`) — used to derive current state — may be worth evaluating once real query volume is known.
- `audit_event.correlation_id` and `audit_event.occurred_at` — audit queries are expected to be time-range and correlation-driven.
- `btree_gist` must be enabled (`CREATE EXTENSION IF NOT EXISTS btree_gist;`) before any `EXCLUDE USING gist` constraint above can be created — a one-time Sprint 3C setup step, not a migration decision made here.

## What This Document Does Not Define

- Literal `CREATE INDEX`, `CREATE EXTENSION`, or `CREATE TABLE` statements.
- Partitioning strategy for high-volume tables (`audit_event`, `alert`) — not evaluated in Sprint 3B/3B.1/3B.2; may be a Sprint 3C or later concern if volume warrants it.
- Row-Level Security policy SQL (Sprint 3C) — see [`07-authorization-data-model.md`](07-authorization-data-model.md) for the ownership/access dependencies Sprint 3C will need.

### Complete List of Sprint 3C Triggers This Proposal Requires

Every trigger named across this document and [`07-authorization-data-model.md`](07-authorization-data-model.md), gathered in one place:

1. **At least one `permission_office_grant` row for a `scope_type = 'office'` Permission** — existence-of-a-related-row cannot be a declarative constraint. See [`07-authorization-data-model.md`](07-authorization-data-model.md) "Fail-Closed Authorization Scope."
2. **Global-or-same-organization reference validation**, at each of the eight sites listed in [`01-physical-model-principles.md`](01-physical-model-principles.md) "Global-or-Same-Organization Reference Pattern" — one conditional rule, reusable across all eight, not eight independent triggers in spirit (though each is a distinct trigger attachment point).
3. **Snapshot and Metric Observation predecessor-exactness** — a superseding row's `revision_number` must equal its predecessor's `revision_number + 1`, across all five revisable tables (`revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `metric_observation`). See "Snapshot and Metric Observation Supersession Integrity" above.
4. **Recommendation supersession acyclicity** — `supersedes_recommendation_id`, when set, must reference a Recommendation with a strictly earlier `generated_at`. See "Immutable Recommendation Supersession" above.
5. **`employee_office_assignment` exactly-once closure** — a closed row (`effective_end_date IS NOT NULL`) can never be updated again; an active row may only transition `effective_end_date` from `NULL` to a value, nothing else. See "Employee Assignment Lifecycle" above.
6. **Alert and Recommendation lifecycle transition validation** — against the documented allow-lists in [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md).
7. **Immutability enforcement** on every insert-only table (rejecting `UPDATE`s to substantive columns) — see [`05-temporal-versioning-and-snapshots.md`](05-temporal-versioning-and-snapshots.md).
8. **Scenario value/definition type agreement (Sprint 3B.3, Correction 4)** — the populated value column on `scenario_input`/`scenario_output` must match its referenced definition's `data_type` and (when applicable) `reference_target_type`. See "Binding Scenario Values to the Run's Exact Definition Version" above.
9. **`condition_evaluation` numeric/non-numeric consistency (Sprint 3B.3, Correction 6)** — `metric_observation_id`/`numeric_triggered_value` must be jointly present for `numeric` conditions and jointly absent otherwise, cross-referencing the parent `business_rule_condition.condition_type`. See "Alert Evidence Model" above.
10. **A manually-entered `backlog_stage_count`'s header must also be manual (Sprint 3B.4, Correction 2)** — `backlog_stage_count.import_job_id IS NULL` must imply `backlog_snapshot.import_job_id IS NULL` for its own header; `MATCH SIMPLE` composite-FK semantics cannot express this, since they skip enforcement entirely when the child's `import_job_id` is `NULL`. This item was present in "What Remains Genuinely Open for Sprint 3C" above since Sprint 3B.4 but is added to this consolidated list only now, in Sprint 3B.4A, closing an omission — the requirement itself is unchanged.
11. **Import Job supersession cycle-prevention and same-base-Profile enforcement (Sprint 3B.4A, Correction 1)** — `import_job.supersedes_import_job_id`, when set, must reference an Import Job whose `uploaded_at` is strictly earlier than the new row's own `uploaded_at` (the same pattern as Recommendation supersession acyclicity, item 4 above). The same-base-`import_profile_id` requirement itself is already declarative (a composite FK, not a trigger) as of this sprint — only cycle-prevention remains a trigger. See [`06-import-lineage-model.md`](06-import-lineage-model.md) "Can a Superseding Import Job Use a Different Profile Version?"
12. **Import Profile normalization-target compatibility (Sprint 3B.4A, Correction 2)** — each of the four canonical snapshot headers' `import_job_id` must reference an Import Job whose Profile Version declares that specific canonical target as permitted, inside `schema_definition`. A `CHECK` cannot read another table's `JSONB` column, so this requires a `BEFORE INSERT OR UPDATE` trigger on each of the four headers. See [`06-import-lineage-model.md`](06-import-lineage-model.md) "Import Profile Normalization-Target Compatibility."

None of these twelve are implemented as SQL in Sprint 3B through Sprint 3B.4A — this list exists so Sprint 3C starts from a complete, named inventory rather than rediscovering each requirement while writing policies.

## Related Documents

- [Table Catalog](02-table-catalog.md)
- [Column and Type Catalog](03-column-and-type-catalog.md)
- [Physical Model Principles](01-physical-model-principles.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Sprint 3B.4 Import Provenance Closure](../development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md)
- [Sprint 3B.4A Final Reconciliation](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md)
