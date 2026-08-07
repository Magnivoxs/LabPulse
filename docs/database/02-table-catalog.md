# Table Catalog

**Version:** 0.6 (Sprint 3B.4A corrections applied — see [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md); Sprint 3B.1, 3B.2, 3B.3, and 3B.4 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Catalog every proposed physical table: its purpose, owning domain (per [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md)), tenant/office scope, MVP inclusion decision, and remaining open questions. Column-level detail is in [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md); key and constraint detail is in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md).

**MVP inclusion legend:** ✅ MVP | ⚠️ MVP with a named limitation | ⛔ Deferred (see [`09-deferred-entities.md`](09-deferred-entities.md))

## Exact MVP Table Count: 61

**Sprint history:** Sprint 3B: **54**. Sprint 3B.1: **59**. Sprint 3B.2: **61**. Sprint 3B.3: **61** (zero tables added). Sprint 3B.4: **61** (zero tables added). **Sprint 3B.4A: 61 (zero tables added).** Every Sprint 3B.4 correction added columns, constraints, and composite-FK-supporting keys to existing tables (`import_source_row`, `import_normalized_value`, `import_validation_result`, `import_validation_issue`, `organization_import_profile_override`, `import_job`, `payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`, and the four canonical snapshot headers), or removed a genuinely duplicated column (`payroll_snapshot.account_mapping_version_id`). Every Sprint 3B.4A correction likewise added only columns and constraints (`import_profile_id` on `import_job`; a permitted-target declaration inside `import_profile_version.schema_definition`'s existing `JSONB` content) — no table was added or removed by either pass:

| Domain | Sprint 3B | Sprint 3B.1 | Sprint 3B.2 | Sprint 3B.3 | Sprint 3B.4 | Sprint 3B.4A | Change (3B.4 → 3B.4A) |
|---|---|---|---|---|---|---|---|
| Tenant and Organization Structure | 2 | 2 | 2 | 2 | 2 | 2 | — |
| Identity and Workforce | 4 | 4 | 4 | 4 | 4 | 4 | — |
| Authorization | 6 | 6 | 6 | 6 | 6 | 6 | — |
| Imports and Lineage | 8 | 13 | 13 | 13 | 13 | 13 | — (`import_job` gains `import_profile_id`; supersession strengthened to same-base-Profile; target-compatibility declared inside existing `schema_definition` JSONB; no table added/removed) |
| Canonical Snapshots | 8 | 8 | 8 | 8 | 8 | 8 | — (no column or constraint change in this domain from Sprint 3B.4A specifically — target-compatibility enforcement lives on the Imports and Lineage side) |
| Metrics and Business Rules | 10 | 9 | 11 | 11 | 11 | 11 | — |
| Scenarios | 9 | 11 | 11 | 11 | 11 | 11 | — |
| Recommendations and Work Tracking | 6 | 5 | 5 | 5 | 5 | 5 | — |
| Audit | 1 | 1 | 1 | 1 | 1 | 1 | — |
| **Total** | **54** | **59** | **61** | **61** | **61** | **61** | **+0** |

## 1. Tenant and Organization Structure

### `organization`

- **Purpose:** The tenant root. Every other table scopes to exactly one organization, directly or transitively.
- **Domain:** Organizations. **Scope:** Is the tenant boundary itself.
- **MVP:** ✅
- **Temporal behavior:** Mutable (name, status can change). Not versioned, not immutable.
- **Archival:** Supports an inactive/archived status; never hard-deleted in the ordinary course of business (see [`08-retention-archive-and-erasure-boundaries.md`](08-retention-archive-and-erasure-boundaries.md)).
- **RLS sensitivity:** Root of every RLS policy on every other tenant-owned table.
- **Open questions:** None blocking.

### `office`

- **Purpose:** The canonical operational and authorization unit (formerly "Location"), per [ADR-004](../decisions/ADR-004-office-based-authorization.md).
- **Domain:** Organizations. **Scope:** Organization.
- **MVP:** ✅
- **Temporal behavior:** Mutable (name, region, status). Not versioned, not immutable.
- **Archival:** Supports archived/inactive status (office closure) without deletion.
- **Import lineage:** Referenced by every import-derived snapshot; itself created/edited directly, not imported.
- **RLS sensitivity:** Primary scoping table alongside `organization` for every office-scoped table. **Sprint 3B.1 Correction 2:** carries `UNIQUE (organization_id, id)`, the composite key every office-scoped, organization-denormalized table now references declaratively — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md).
- **Region handling:** `region` is a plain nullable descriptive column — **not** a foreign key to any authorization table, and not referenced by any RLS policy design in this proposal.
- **Open questions:** Office ID format (OQ-056), whether an office can appear in multiple Labor Model regional worksheets (OQ-057), unresolved legacy attributes DFO/Model/Standardization Status (OQ-068, deliberately excluded).

## 2. Identity and Workforce

### `app_user`

- **Purpose:** A LabPulse-application profile for an authenticated person, distinct from Supabase's own `auth.users`.
- **Domain:** Users. **Scope:** Organization.
- **MVP:** ✅
- **Design note:** `app_user.id` is the **same UUID** as the corresponding `auth.users.id` row (a shared-primary-key pattern). `email` is a **synchronized cache** of `auth.users.email`, not a duplicate source of truth — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) for the sync mechanism and privacy note (Sprint 3B.1 Correction 15).
- **Temporal behavior:** Mutable (status, display name).
- **Archival:** Soft-deletable (disabled); a disabled user must lose effective access immediately, enforced by Sprint 3C's RLS/authorization checks and the Effective Access Evaluation Rule in [`07-authorization-data-model.md`](07-authorization-data-model.md).
- **RLS sensitivity:** High — is the anchor for every `auth.uid()`-based RLS policy, and for the composite FK pattern every tenant-scoped user reference now uses (Correction 2).

### `employee`

- **Purpose:** A lab staff member tracked for staffing, payroll, and overtime purposes — explicitly **not** assumed to be the same as an `app_user` row.
- **Domain:** Organizations. **Scope:** Organization. (**No longer Office-scoped directly — see below.**)
- **MVP:** ✅
- **Sprint 3B.1 Correction 10 — `office_id` removed.** Sprint 3B's mutable `employee.office_id` created an unresolved ambiguity against `employee_office_assignment`. This proposal has one authoritative source: an Employee's current Office is derived from the `employee_office_assignment` row with `effective_end_date IS NULL`. `employee` itself carries no office reference.
- **Relationship to `app_user`:** `linked_app_user_id` is a **nullable** foreign key, optional in both directions, now with a composite FK enforcing same-organization and a partial unique index enforcing at-most-one-Employee-per-User.
- **Temporal behavior:** Mutable (employment status, pay type).
- **Archival:** Supports terminated status without deletion.
- **Sensitivity:** Classified as sensitive data; no real employee data may ever populate this table in this repository.
- **Open questions:** Whether LSS staff are tracked as Employees of a home office, a pooled resource, or both — unaffected by the `office_id` removal, since a pooled/multi-office model would be expressed through `employee_office_assignment` regardless.

### `job_role`

- **Purpose:** An Employee's job/position classification — distinct from `security_role`.
- **Domain:** Organizations. **Scope:** Organization (organization-configurable taxonomy).
- **MVP:** ✅
- **Temporal behavior:** Rarely updated; not versioned.
- **Open questions:** Which JobRoles count as "technician" for staffing metrics is unresolved; represented as a configurable `is_technician BOOLEAN` column.

### `employee_office_assignment`

- **Purpose:** The **sole authoritative source** of which Office an Employee is currently, or was historically, assigned to — **Sprint 3B.1 Correction 10 removed `employee.office_id`**, so this table is no longer merely a historical supplement to a mutable current-office column; it now *is* the current-office fact as well as the history.
- **Domain:** Organizations. **Scope:** Organization, Office.
- **MVP:** ✅ (**upgraded from Sprint 3B's ⚠️ judgment call** — no longer droppable; `employee`'s current office depends entirely on this table now, so the Sprint 3B claim that it "can be dropped without affecting any other table's design" is corrected and withdrawn).
- **Temporal behavior (corrected, Sprint 3B.2 Correction 8):** **Effective-dated, historically preserved — not fully append-only.** `employee_id`, `office_id`, and `effective_start_date` are immutable from creation; an active row may be updated **exactly once**, to close it by setting `effective_end_date`. Sprint 3B.1 called this table "append-only" while simultaneously requiring exactly that one update — an internal contradiction, now corrected. A same-employee, non-overlapping-date-range `EXCLUDE` constraint prevents two simultaneously-active assignments; a Sprint 3C trigger enforces the exactly-once-closure rule — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) and [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md).

## 3. Authorization

See [`07-authorization-data-model.md`](07-authorization-data-model.md) for the full narrative. Tables: `security_role`, `capability`, `permission_set`, `permission_set_capability`, `permission`, `permission_office_grant`.

All ✅ MVP. **Sprint 3B.1 Corrections 3 and 4** corrected, respectively, the Permission fail-open scope inference and the Permission Set–SecurityRole relationship direction. **Sprint 3B.2 Correction 3** adds tenant ownership to `permission_set` (a nullable `organization_id`: `NULL` = platform-owned, set = organization-owned) and closes the "which role may use which Permission Set" and "which Permission may use which SecurityRole" gaps with a documented Sprint 3C trigger — see [`07-authorization-data-model.md`](07-authorization-data-model.md) for the full explanation. No table was added or removed by either correction pass; the count is unchanged from Sprint 3B.

## 4. Imports and Lineage

See [`06-import-lineage-model.md`](06-import-lineage-model.md) for the full narrative. Tables: `import_profile`, `import_profile_version`, `organization_import_profile_override`, `import_job`, `import_source_section`, `import_source_row`, `import_validation_result`, `import_validation_issue` (**new**), `import_normalized_value`, `import_normalized_value_revenue_snapshot`, `import_normalized_value_payroll_snapshot`, `import_normalized_value_labor_model_snapshot`, `import_normalized_value_backlog_snapshot` (**four new typed link tables**).

All ✅ MVP. **Sprint 3B.1 Correction 7** removed the polymorphic `target_table`/`target_record_id` soft reference entirely — every lineage arrow in this domain is an enforced foreign key, with no polymorphic exception. **Sprint 3B.2 Correction 2** propagated `organization_id` onto `import_source_section`, `import_source_row`, and `import_normalized_value` (previously scoped only transitively through `import_job`), so every detail and link table in this chain can declaratively guarantee it was produced from, or links to, a source row belonging to its own organization. **Sprint 3B.3 Correction 5** withdraws Sprint 3B.2's "considered and declined" decision not to enforce this same pattern on `import_validation_result` and `import_validation_issue`. **Sprint 3B.4 corrects the remaining, more specific gap organization-matching alone left open: two rows can share an organization while still having been produced by two different Import Jobs.** Corrections 1, 2, 3, 4, and 5 propagate a denormalized `import_job_id` through `import_source_row`, `import_normalized_value`, and the four typed link tables; correct `import_validation_issue`'s parent relationship to genuinely (not merely "transitively," as Sprint 3B.3 incorrectly claimed) require the same source row as its Validation Result; remove the duplicated `import_profile_version_id` fact from `import_normalized_value`; bind an Import Job's override to its own declared Profile Version; and resolve the Payroll account-mapping duplication by removing `payroll_snapshot.account_mapping_version_id` entirely. **Sprint 3B.4A closes two further gaps: an Import Job's supersession chain can no longer cross an unrelated base Import Profile, and a Sprint 3C trigger requirement now verifies each canonical snapshot type's producing Import Job actually used a Profile Version that declares that target as permitted.** See [`06-import-lineage-model.md`](06-import-lineage-model.md) "Import-Provenance Integrity Matrix" for the complete, current, per-relationship statement of what is enforced. No table was added or removed by any of these five correction passes — this domain's own table count has held steady at **13** since Sprint 3B.1 (see the Sprint-by-Sprint table above); the proposal's **overall** MVP table count is **61**, unchanged since Sprint 3B.2, not to be confused with this domain-specific figure.

## 5. Canonical Snapshots

See [`05-temporal-versioning-and-snapshots.md`](05-temporal-versioning-and-snapshots.md) for the shared snapshot lifecycle pattern, including the Sprint 3B.1 Correction 1 revision/supersession pattern applied to all four snapshot types below, **strengthened in Sprint 3B.2 Correction 5**: a snapshot may now supersede only a row sharing its complete natural key (organization, office, reporting period/date, and source type where applicable), not merely the same organization — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Snapshot and Metric Observation Supersession Integrity."

### `revenue_snapshot` — ✅ MVP

Point-in-time office revenue for a period, from Power BI (daily) or the P&L (monthly, authoritative). Header-only. Supports multiple immutable revisions per office/period/source via `revision_number`/`supersedes_snapshot_id`, with the self-reference now matched against the complete natural key (Corrections 1 and 5). **Sprint 3B.3 Correction 3:** `import_job_id` is now a same-organization composite FK (was a plain, unenforced FK). **Sprint 3B.4 Correction 2:** the header also gains `UNIQUE (organization_id, import_job_id, id)`, so its own typed link table can prove a linked normalized value came from the *same* Import Job the header itself declares, not merely the same organization.

### `payroll_snapshot` + `payroll_snapshot_line_item` — ✅ MVP

Header/detail pair, as in Sprint 3B. Each line item now carries a direct, same-organization-enforced `import_source_row_id` and a same-organization-enforced `payroll_snapshot_id` (Corrections 2 and 7), and the header supports natural-key-matched revisions (Corrections 1 and 5). **Sprint 3B.3 Correction 3:** `import_job_id` is now a same-organization composite FK, and the header's independently writable `import_profile_version_id` column is removed — it is now derived exclusively through `import_job_id → import_job.import_profile_version_id`, eliminating a fact that could previously disagree between the two locations. **Sprint 3B.4 Correction 2:** each line item also gains `import_job_id`, strengthening both of its composite FKs from organization-only to organization-**and**-Import-Job, so a line item can no longer cite a source row from a different Import Job than its own header. **Sprint 3B.4 Correction 5:** `account_mapping_version_id` is removed from the header entirely, resolving a second duplicated-fact gap the same way — derived exclusively through `import_job_id → import_job.organization_import_profile_override_id`.

### `labor_model_snapshot` + `labor_model_staffing_measure` — ✅ MVP

Header/detail pair implementing the founder-approved extensible staffing design. Each staffing measure now carries same-organization-enforced `import_source_row_id`/`labor_model_snapshot_id` references (Correction 2), and the header supports natural-key-matched revisions (Corrections 1 and 5). OQ-061 remains partially resolved at the architecture level. **Sprint 3B.3 Correction 3:** same `import_job_id` composite-FK and `import_profile_version_id` removal as `payroll_snapshot` above. **Sprint 3B.4 Correction 2:** same same-Import-Job strengthening on the staffing-measure detail rows as `payroll_snapshot_line_item` above.

### `backlog_snapshot` + `production_stage` + `backlog_stage_count` — ✅ MVP (Founder Decision 5)

Header/detail/dimension triple. **Sprint 3B.1 Correction 9** replaced the single `total_case_count` column with `source_provided_total_case_count`, `derived_total_case_count`, `displayed_total_basis`, and `total_discrepancy_amount`, and removed the invented default assumption that Resets/Remakes are excluded from the total — `production_stage.is_included_in_total` is now nullable with no seeded default for any stage, remaining genuinely unresolved (OQ-051) until an explicit decision is recorded. Each stage count now carries same-organization-enforced references and an optional direct `import_source_row_id` (Corrections 2 and 7), and the header supports natural-key-matched revisions (Corrections 1 and 5). **Sprint 3B.2 Correction 4** also fixed `production_stage`'s non-overlap constraint, which — as a single `EXCLUDE` including a nullable `organization_id` — previously failed to catch two overlapping system-default stage definitions; it is now two separate constraints, one per scope. **Sprint 3B.3 Correction 3:** `import_job_id` is now a same-organization composite FK, and a genuine same-row `CHECK` now enforces the previously-documentation-only "imported XOR manually-entered" rule between `import_job_id` and `manual_entry_user_id`. **Sprint 3B.4 Correction 2:** `backlog_stage_count` gains its own `import_job_id` and a matching same-row `CHECK` (imported XOR manual, mirroring the header's own rule) plus conditional same-Import-Job composite FKs; one honest cross-row gap remains a named Sprint 3C trigger — a manual stage count's header must also be manual, which no `CHECK` or plain composite FK can express.

## 6. Metrics and Business Rules

### `metric_definition` + `metric_definition_version` — ✅ MVP

**Sprint 3B.1 Correction 6** moved `reporting_grain` and `null_zero_behavior` from `metric_definition` to `metric_definition_version` (calculation-sensitive properties belong with the versioned definition, not the never-changing identity), and added `calculation_key` and `implementation_version` so a `metric_observation` can identify exactly which deterministic implementation computed it. No formula logic is stored as executable code or SQL.

### `business_rule` + `business_rule_version` + `business_rule_condition` — ✅ MVP

**Sprint 3B.1 Correction 5** removed `threshold_value`/`threshold_operator`/`threshold_unit` from `business_rule_version` (a single set of threshold columns cannot represent BR-001's four independent numeric triggers) and introduced `business_rule_condition`, one row per independent condition within a rule version. `alert` now references the exact `business_rule_condition` that fired (via `condition_evaluation`, see below), not the broad parent rule version. The legacy thresholds (Founder Decision 7 / OQ-066) remain unseeded anywhere in this design. **Sprint 3B.2 Correction 4** also fixed `business_rule_version`'s non-overlap constraint, the same nullable-`organization_id` `EXCLUDE` bug found on `production_stage`.

### `metric_observation` + `metric_observation_component` — ✅ MVP (judgment call now settled, not merely flagged)

- **Purpose:** Persist a specific computed metric value for an office/period, together with every value that contributed to it, the metric version, and the specific snapshot(s) each contributing value was computed from.
- **Sprint 3B.1 Correction 6:** Sprint 3B's `numerator_value`/`denominator_value` columns assumed every observation has exactly one numerator and denominator, which does not hold for comparison metrics or multi-input calculations. `metric_observation_component` replaces both columns with an arbitrary number of typed, individually-sourced component rows (numerator, denominator, current value, comparison value, input, adjustment, or other), each optionally citing the exact snapshot it came from via a same-organization-**and**-office-matched composite FK (at most one, enforced by a `CHECK` using `num_nonnulls()`) (Correction 2).
- **Persistence policy, still the settled design (see judgment-call review in [`SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)):** a row is persisted only when a value becomes a durable evaluation record (cited by Alert, Recommendation, saved Scenario, scheduled evaluation, or export), never for a transient dashboard render.
- **Sprint 3B.2 Correction 1 — identity model corrected.** Sprint 3B.1's `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end)` incorrectly blocked a legitimate second observation whenever a source snapshot was corrected without the metric's own calculation version changing. `metric_observation` now carries `evaluation_fingerprint`, `revision_number`, and `supersedes_metric_observation_id` — the identical revision/supersession pattern as the four canonical snapshots — and the uniqueness constraint includes `evaluation_fingerprint`, so a genuine correction is always insertable while an exact duplicate is still blocked. See [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Metric Observation Identity and Reuse."
- **Sprint 3B.3 Correction 1 — missing composite-FK parent keys added.** Sprint 3B.2 introduced composite foreign keys *from* `metric_observation_component`, `condition_evaluation`, `recommendation_evidence_metric_observation`, and `metric_observation`'s own self-referencing `supersedes_metric_observation_id` *into* this table, but never verified a matching parent-side `UNIQUE` constraint actually existed. Three keys close that gap — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Composite Foreign Key Verification Matrix." None affects how many observations may exist for a given natural key.

### `condition_evaluation` + `condition_evaluation_evidence` — ✅ MVP (new tables, Sprint 3B.2 Correction 6)

- **Purpose:** The immutable record of "this specific Business Rule Condition was evaluated, at this time, for this Office, with this evidence" — introduced because Sprint 3B.1's `alert` required `metric_observation_id NOT NULL`, which cannot represent a condition whose `condition_type` is `qualitative`, `missing_data`, `stale_data`, or `other` (none of which necessarily has a Metric Observation to cite).
- `condition_evaluation` carries the exact `business_rule_condition_id`, organization/office, reporting period, evaluation time, and — only for `numeric` conditions — a `metric_observation_id` and triggered value; non-numeric conditions instead carry a `qualitative_summary`.
- `condition_evaluation_evidence` provides typed, relational evidence beyond a text summary (a specific `import_job` for a `missing_data`/`stale_data` condition; a specific snapshot for a `referenced_snapshot` condition) — no `JSONB`, no unrestricted free text standing in for structured evidence. **Sprint 3B.3 Correction 2** added the `office_id` column this table was missing entirely (without which its "organization-and-office-matched" snapshot references could not actually be expressed as composite FKs), plus an evidence-shape `CHECK` tying `evidence_role` to which reference columns must be populated.
- No **natural-key** uniqueness constraint, deliberately, so the same condition can be legitimately re-evaluated across corrected source data without repeating the exact mistake Correction 1 fixed on `metric_observation`. **Sprint 3B.3 Correction 1** added two purely structural, ID-based composite keys (`UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)`) needed only to support `condition_evaluation_evidence` and `alert`'s composite FKs into this table — these say nothing about how many times a condition may be evaluated and do not reintroduce the withdrawn natural-key constraint.

### `alert` + `alert_lifecycle_event` — ✅ MVP

**Sprint 3B.1 Correction 8** split Sprint 3B's single `alert` table (which inconsistently combined an "immutable" classification with mutable `status`/`dismissal_reason`/`dismissed_by_user_id`/`dismissed_at` columns) into an immutable `alert` core plus an append-only `alert_lifecycle_event` history, mirroring the pattern already used for `recommendation`. Current Alert state is derived from the latest lifecycle event by `sequence_number` (Correction 12), never a mutable column. **Sprint 3B.2 Correction 6** further reduces the `alert` core to a thin, RLS-friendly pointer — `organization_id`, `office_id`, `condition_evaluation_id`, `triggered_at` — with the exact rule condition, metric observation, reporting period, and triggered value now living on `condition_evaluation` instead, so `alert` can represent every condition type, not only `numeric`. **Sprint 3B.3 Correction 6** adds `UNIQUE (condition_evaluation_id)` — no more than one Alert may ever be generated from the same immutable Condition Evaluation; a repeated evaluation produces a new `condition_evaluation` row, and therefore, if warranted, a new distinct Alert.

## 7. Scenarios

### `scenario_definition` + `scenario_definition_version` — ✅ MVP (Founder Decision 9)

Unchanged from Sprint 3B — immutable Scenario Definition Version support, no AI state-machine schema.

### `scenario_parameter_definition` + `scenario_output_definition` (new, Sprint 3B.1) — ✅ MVP

**Sprint 3B.1 Correction 11** — versioned, typed definitions for every scenario input and output, tied to `scenario_definition_version`. Replaces Sprint 3B's unrestricted free-text `input_key`/`output_key` design, which could not reliably validate scenario values. **Sprint 3B.2 Correction 9** adds `reference_target_type` (`job_role` or `office`), naming which typed reference column a `reference`-typed definition expects.

### `scenario_run` + baseline-snapshot join tables + `scenario_input` + `scenario_output` — ✅ MVP

`scenario_run` unchanged in shape (gains an additional composite unique key for the baseline join tables' same-Office enforcement). `scenario_input`/`scenario_output` reference a `scenario_parameter_definition`/`scenario_output_definition` row instead of a free-text key, with typed value columns and a `CHECK` requiring exactly one to be populated. **Sprint 3B.2 Correction 9** replaces the single, unenforceable generic `value_reference_id` with two typed, composite-FK-enforced columns — `value_reference_job_role_id` and `value_reference_office_id` — the only two reference target types with any concrete precedent in the repository; no other generic reference type is invented. **Sprint 3B.2 Correction 2** also adds `organization_id` and same-Office composite FKs to the four baseline-snapshot join tables, closing "a Scenario Run for Office A must not use an Office B snapshot." **Sprint 3B.3 Correction 4:** `scenario_input`/`scenario_output` each gain a `scenario_definition_version_id` column, declaratively bound both to the parent Run's own version and to the cited Parameter/Output Definition's owning version — closing a gap where a value could previously have cited a definition belonging to a *different* Scenario Definition Version than the one its Run actually used.

## 8. Recommendations and Work Tracking

### `recommendation` — ✅ MVP

Immutable core record; Approval/Outcome/Resolution are not columns on this table. **Sprint 3B.2 Correction 7** reverses the supersession direction: `supersedes_recommendation_id` now lives on the **newer** row, pointing backward at the Recommendation it replaces, so the older (already-immutable) row is never mutated — correcting Sprint 3B.1's `superseded_by_recommendation_id`, which required updating the old row. Same-Organization-and-Office enforcement, one-successor-max, and no-self-reference are all declarative; cycle-freedom requires a documented Sprint 3C trigger (see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md)). `origin_scenario_run_id` also gained a same-Office composite FK (Correction 2), found during the broader integrity audit as a previously fully-unenforced plain FK.

### `recommendation_lifecycle_event` — ✅ MVP

**Sprint 3B.1 Correction 12** added a `sequence_number`, unique within `recommendation_id`, so current state is never inferred from `occurred_at` alone. The initial `generated` event must be created atomically with its parent `recommendation` row.

### `recommendation_evidence_alert` + `recommendation_evidence_metric_observation` — ✅ MVP

**Sprint 3B.2 Correction 2** adds `organization_id`/`office_id` and same-Organization-**and**-Office composite FKs to both join tables — a Recommendation can no longer cite another organization's, or another Office's, Alert or Metric Observation.

### `task` — ✅ MVP (header only; history deferred)

`task` remains mutable, per its "Updated: Yes" classification, with `status` explicitly labeled **provisional** pending OQ-042. **Sprint 3B.1 Correction 13:** `task_status_history` is no longer proposed as an optional MVP addition — it has moved to [`09-deferred-entities.md`](09-deferred-entities.md). Until a dedicated lifecycle table is approved, `audit_event` is the interim mechanism for recording material Task changes. **Sprint 3B.2 Correction 2** adds same-Organization-and-Office composite FKs on `related_alert_id` and `related_recommendation_id`, both explicitly named by the founder as previously unenforced.

## 9. Audit

### `audit_event` — ✅ MVP

Generic append-only audit log, unchanged from Sprint 3B. Recommendation and Alert lifecycle transitions are not duplicated into `audit_event`, since each now has its own dedicated append-only history.

## Deferred (Not Created This Sprint)

See [`09-deferred-entities.md`](09-deferred-entities.md) for the full rationale: no physical tables for `ProductionSnapshot`, `QualitySnapshot`, `CareerGridSnapshot`, or `RecruitingSnapshot`; no `Notification`/notification-delivery table; no franchise-grouping table; **no `task_status_history` table (moved here in Sprint 3B.1, Correction 13)**.

## Related Documents

- [Physical Model Principles](01-physical-model-principles.md)
- [Column and Type Catalog](03-column-and-type-catalog.md)
- [Keys, Relationships, and Constraints](04-keys-relationships-and-constraints.md)
- [Deferred Entities](09-deferred-entities.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
