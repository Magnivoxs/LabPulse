# Sprint 3B.2 — Cross-Tenant and Revision Integrity Corrections

**Version:** 1.0
**Date:** 2026-08-06
**Status:** Complete — local, uncommitted, pending founder/engineering review
**Branch:** `docs/sprint-3b-physical-model` (same branch as Sprint 3B and Sprint 3B.1; not a new branch)

## Purpose

This report documents a second, narrower correction pass on the Sprint 3B/3B.1 physical data model proposal ([`docs/database/`](../database/), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)). A review identified ten cross-tenant and revision-integrity issues that the Sprint 3B.1 pass had not caught, plus several further instances of the same failure patterns found during a broader integrity audit performed after applying the ten. None of these corrections reverses a founder-approved business decision from Sprint 3A/3B/3B.1; all are engineering corrections.

Per the authorizing instructions for this pass: no executable SQL, migrations, Supabase project, dependencies, or application code were created; nothing was staged, committed, pushed, or merged; ADR-007 remains **Proposed**; ADR-004 remains **Accepted**; no founder-approved business decision was reversed — only engineering interpretations of those decisions were corrected; no unresolved business meaning was invented (where the MVP's actual requirement was genuinely unconfirmed — for example, which Scenario reference target types are needed — this report says so explicitly rather than guessing).

> **📌 Current-state pointer (added Sprint 3B.3):** A further correction pass, [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md), found that this pass's own composite foreign keys — from `metric_observation_component`, `condition_evaluation`, `recommendation_evidence_metric_observation`, and `condition_evaluation_evidence`/`alert` into `metric_observation` and `condition_evaluation` — had no matching parent-side `UNIQUE` constraint ever declared on either target table, and closed that gap. It also found `condition_evaluation_evidence` was missing the `office_id` column its own organization-and-office-matched snapshot references (described in Correction 6 below) required to exist as composite FKs at all, and withdrew this report's "considered and deliberately not applied" decision on `import_validation_result`/`import_validation_issue` (see Section 3 below). This report's content is otherwise current and superseded only where explicitly marked.

## 1. Safety Checks

Reverified before any file was changed:

| Check | Result |
|---|---|
| Git root is `C:\Users\david\OneDrive\Desktop\LabPulse-Remote-Inspection` | ✅ Pass |
| Branch is `docs/sprint-3b-physical-model` | ✅ Pass |
| Remote is `Magnivoxs/LabPulse` | ✅ Pass |
| Existing Sprint 3B/3B.1 work present (15 modified + 5 untracked entries in `git status --short`) | ✅ Pass |
| Nothing staged | ✅ Pass |
| No new commit or push | ✅ Pass |

## 2. Every Issue Corrected

### Correction 1 — Metric Observation Revisions and Corrected Inputs

**What was wrong:** Sprint 3B.1's uniqueness constraint on `metric_observation` — `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end)` — assumed the only reason two observations could share that tuple is an erroneous duplicate. In fact, a source snapshot correction (a `payroll_snapshot` revision, for example) can legitimately require a *new* `metric_observation` for the same metric version, office, and period, computed from corrected inputs — and the old constraint would reject that legitimate row outright.

**What changed:** `metric_observation` gained `evaluation_fingerprint` (a deterministic, application-computed value over the metric version, office, period, implementation version, and the ordered set of components about to be inserted — each expressed by its resolved source snapshot id or literal value), `revision_number`, and `supersedes_metric_observation_id` — the identical revision/supersession pattern used by the four canonical snapshots. The uniqueness constraint now includes `evaluation_fingerprint`, so an exact duplicate is still blocked while a genuine correction (different fingerprint) is always insertable. `computed_at` is never part of identity. Alerts and Recommendations retain their original historical reference because `metric_observation` rows are immutable and never updated or deleted — a reference to revision 1 continues to resolve to revision 1's exact values forever, regardless of later corrections. Reuse works by computing the fingerprint before insert and reusing an existing row with the same fingerprint rather than inserting a duplicate. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Metric Observation Identity and Reuse."

### Correction 2 — Same-Tenant Enforcement on All Joins and Details

**What was wrong:** Sprint 3B.1's composite-FK pattern covered header-level tables (snapshots, `alert`, `recommendation`, `task`, `scenario_run`, `metric_observation`) but left detail and join tables one level down — `payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`, the import-lineage chain (`import_source_section`, `import_source_row`, `import_normalized_value` and its four typed link tables), `metric_observation_component`, the four `scenario_run_*_snapshot` tables, `scenario_input`/`scenario_output`, `recommendation_evidence_alert`/`recommendation_evidence_metric_observation`, and `task.related_alert_id`/`related_recommendation_id` — with plain, unenforced foreign keys into tenant-owned parents.

**What changed:** Every table above gained its own denormalized `organization_id` (and, where required, `office_id`) and a composite FK to its referenced parent(s). Concretely: `import_source_section`/`import_source_row`/`import_normalized_value` each gained `organization_id` propagated down from `import_job`, closing "detail rows must not connect a parent snapshot to a source row from another Organization's Import Job"; the four `import_normalized_value_*_snapshot` link tables now enforce organization match on both sides; `payroll_snapshot_line_item`/`labor_model_staffing_measure`/`backlog_stage_count` enforce organization match against both their header snapshot and their source row; `metric_observation_component`'s typed snapshot references now require organization **and** office match, not merely a typed FK; the four `scenario_run_*_snapshot` tables enforce same-**Office** match (not merely organization) between a Scenario Run and its baseline snapshots, directly closing the founder's example ("a Scenario Run for Office A must not use an Office B snapshot"); `recommendation_evidence_alert`/`recommendation_evidence_metric_observation` and `task.related_alert_id`/`related_recommendation_id` all now require organization-and-office match. Two additional gaps found only during the broader audit were also closed: `recommendation.origin_scenario_run_id` (previously a fully unenforced plain FK) and `import_job.organization_import_profile_override_id`/`payroll_snapshot.account_mapping_version_id` (both previously plain FKs into an organization-scoped table). `production_stage_id` on `backlog_stage_count` is **deliberately not** given a composite FK — see "Intentionally Permitted Cross-Organization References" below. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) and [`06-import-lineage-model.md`](../database/06-import-lineage-model.md).

### Correction 3 — Security Role and Permission Set Tenant Ownership

**What was wrong:** `permission_set` had no concept of tenant ownership at all — every Permission Set was implicitly global and writable by anyone with write access to the table, with no way for one organization to define a custom capability composition without exposing it to (or being exposed to) every other organization or a global role.

**What changed:** `permission_set` gained a nullable `organization_id` — `NULL` means platform-owned and immutable (writable only through trusted platform administration), a real value means organization-owned. A global `security_role` may reference only a global `permission_set`; an organization-specific `security_role` may reference a same-organization `permission_set` or an intentional global one, never another organization's custom set. `capability` remains global in every case. This is a **conditional** rule ("match, or the target is global"), which cannot be a plain composite FK — it requires a Sprint 3C `BEFORE INSERT OR UPDATE` trigger, documented as the new, reusable "Global-or-Same-Organization Reference Pattern" (see [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md)). The identical fix was also applied to `permission.security_role_id`, per the founder's explicit instruction, so a Permission can never be granted using another organization's custom SecurityRole. This is not relied on as an RLS-visibility-only guarantee — the trigger is a genuine write-time database constraint. See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md).

### Correction 4 — Nullable-Scope Non-Overlap Constraints

**What was wrong:** Sprint 3B.1 claimed a single `EXCLUDE USING gist (organization_id WITH =, code WITH =, daterange(...) WITH &&)` constraint on `production_stage` "prevents two simultaneously-effective definitions of the same stage code," including for system-default rows. This was backwards: PostgreSQL's GiST exclusion machinery, like a plain `UNIQUE` index, does not treat two `NULL` values as equal — so this single constraint would **fail to catch** two overlapping system-default rows for the same code, the opposite of the protection Sprint 3B.1 believed it provided. `business_rule_version` had the identical bug.

**What changed:** Both tables now use **two** separate `EXCLUDE` constraints: one scoped to `organization_id IS NULL` (comparing only the business key, with no `organization_id` column in the constraint at all), and one scoped to `organization_id IS NOT NULL` (unchanged from Sprint 3B.1, now correctly limited to only the rows where it's meaningful). `metric_definition_version` and `scenario_definition_version` have no `organization_id` column and are unaffected; `employee_office_assignment`'s `EXCLUDE` has no `organization_id` in its predicate and was never subject to this bug. All prior claims that the single-constraint design already covers system defaults are withdrawn. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "The Nullable-`organization_id` Exclusion Bug."

### Correction 5 — Snapshot Supersession Natural-Key Integrity

**What was wrong:** Sprint 3B.1's self-referencing `supersedes_snapshot_id` composite FK on the four canonical snapshots matched only the same **organization** — it did not verify the predecessor shared the same Office, reporting period, or source type, meaning a snapshot could in principle have been recorded as superseding a *different Office's* row within the same organization.

**What changed:** Each snapshot table's self-referencing FK now matches the row's **complete natural key** — for `revenue_snapshot`: organization, office, reporting period, and source type; for the other three: organization, office, and reporting period/date. Because the child row's own natural-key columns are literally the columns being cross-checked (a self-reference), this single composite FK declaratively guarantees the predecessor shares the same organization, office, and full natural key, with no trigger required for that half. `CHECK (revision_number >= 1)` and `CHECK ((revision_number = 1 AND supersedes_snapshot_id IS NULL) OR (revision_number > 1 AND supersedes_snapshot_id IS NOT NULL))` are both genuinely declarative. What still requires a Sprint 3C trigger: verifying a predecessor's `revision_number` equals exactly `this row's revision_number - 1` (a cross-row arithmetic comparison no `CHECK` can express). Once that trigger exists, "no disconnected/branching chains" and "no cycles" both become emergent arithmetic consequences rather than separately-enforced rules — a branch is already ruled out by `UNIQUE (supersedes_snapshot_id)`, and a cycle would require a chain of strictly-decreasing positive integers to return to its own starting value, which is impossible. The identical pattern was applied to `metric_observation` (Correction 1). See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Snapshot and Metric Observation Supersession Integrity."

### Correction 6 — Alert Evidence for Every Condition Type

**What was wrong:** `alert.metric_observation_id` was `NOT NULL`, which cannot represent a `business_rule_condition` whose `condition_type` is `qualitative`, `missing_data`, `stale_data`, or `other` — none of which necessarily has a Metric Observation to cite.

**What changed:** Two new tables. `condition_evaluation` (immutable) carries the exact `business_rule_condition_id`, organization/office, reporting period, evaluation time, and — only for `numeric` conditions — a nullable `metric_observation_id` and triggered value; non-numeric conditions instead carry a `qualitative_summary`. `condition_evaluation_evidence` provides typed, relational evidence beyond a text summary (a specific `import_job` for a `missing_data`/`stale_data` condition; a specific snapshot for a `referenced_snapshot` condition) — no `JSONB`, no unrestricted free text standing in for structured evidence. `alert` is reduced to a thin, RLS-friendly pointer (`organization_id`, `office_id`, `condition_evaluation_id`, `triggered_at`) at the evaluation that produced it; the exact rule condition, metric observation, reporting period, and triggered value all now live on `condition_evaluation`. No uniqueness constraint exists on `condition_evaluation` beyond its primary key, deliberately, avoiding the exact mistake Correction 1 fixed on `metric_observation` — the same condition can be legitimately re-evaluated across corrected source data. These are the only two new tables this correction pass adds. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) and [`04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Alert Evidence Model."

### Correction 7 — Immutable Recommendation Supersession

**What was wrong:** `recommendation.superseded_by_recommendation_id` required mutating the **older**, already-immutable `recommendation` row the moment a newer one superseded it — directly contradicting Recommendation's own immutable-core design (this was carried unchanged from the original Sprint 3B design; Sprint 3B.1 did not touch it).

**What changed:** The direction is reversed: **`recommendation.supersedes_recommendation_id`**, populated on the newer row, pointing backward at the Recommendation it replaces. The older row is never touched. Composite FK enforces same Organization **and** same Office (no exception is documented anywhere in this repository for cross-Office supersession); `UNIQUE (supersedes_recommendation_id)` limits each Recommendation to one direct successor; `CHECK (supersedes_recommendation_id IS DISTINCT FROM id)` rules out direct self-reference. Unlike the snapshot/metric-observation pattern, `recommendation` has no `revision_number`, so cycle-freedom requires a documented Sprint 3C trigger (the referenced row's `generated_at` must be strictly earlier), rather than the arithmetic certainty available on the revision-numbered tables — introducing a `revision_number` solely for this purpose would be more machinery than this correction calls for. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Immutable Recommendation Supersession."

### Correction 8 — Employee Assignment Lifecycle Wording

**What was wrong:** Sprint 3B.1 described `employee_office_assignment` as "append-only" while simultaneously requiring that a transfer **update** the prior row's `effective_end_date` — append-only, by definition, means no row is ever updated.

**What changed:** Adopted Option A — effective-dated mutable closure, the accurate description of a design that was already otherwise correct. `employee_id`, `office_id`, and `effective_start_date` are immutable from creation; an active row (`effective_end_date IS NULL`) may be updated **exactly once**, to close it; once closed, it can never be reopened or otherwise changed. This is historically preserved and effective-dated, not full event-sourcing. A Sprint 3C `BEFORE UPDATE` trigger is documented to enforce the exactly-once-closure rule (rejecting any update to an already-closed row, or any change to a field other than the one permitted `NULL → non-NULL` transition). See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Employee Assignment Lifecycle."

### Correction 9 — Typed Scenario References

**What was wrong:** `scenario_input.value_reference_id`/`scenario_output.value_reference_id` were unrestricted `UUID` columns with no identifiable target table — a generic reference the founder's instruction specifically prohibits.

**What changed:** No repository document (including [`docs/entities/scenario.md`](../entities/scenario.md), whose `structure_notes` remain unconfirmed) confirms a specific reference target type is definitely required for MVP. The only concrete precedent anywhere in the repository is the illustrative `proposed_hire_job_role` parameter-key example and the product's general transfer/office-comparison scenario language. Per the instruction to design minimally rather than invent unconfirmed target types, this design supports **exactly two** target types: `value_reference_job_role_id` and `value_reference_office_id`, both typed and composite-FK-enforced (Office match is a plain, unconditional composite FK since `office.organization_id` is never nullable; JobRole match requires the Global-or-Same-Organization trigger since `job_role.organization_id` is nullable). `scenario_parameter_definition`/`scenario_output_definition` gained `reference_target_type` naming which typed column a `reference`-typed definition expects. This design is additive if a third type is ever confirmed, and can simply go unused if neither is ultimately needed. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) and [`04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Typed Scenario References."

### Correction 10 — Physical ERD Accuracy

**What was wrong:** Section 5 of [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) drew `PERMISSION ||--o{ PERMISSION_SET_CAPABILITY` as if it were a direct relationship, with a note explaining it was "a shortcut." No such foreign key exists — the real, and only, chain is `PERMISSION → SECURITY_ROLE → PERMISSION_SET → PERMISSION_SET_CAPABILITY`.

**What changed:** That line is removed entirely. The ERD is updated throughout to reflect every other correction in this report: `CONDITION_EVALUATION`/`CONDITION_EVALUATION_EVIDENCE` as explicit boxes (Section 4 and 5), `METRIC_OBSERVATION`'s new self-referencing supersession line (Section 3), `ORGANIZATION ||--o{ PERMISSION_SET` as a new optional relationship (Section 1), the corrected `RECOMMENDATION` self-reference direction (Section 4), and the two new `JOB_ROLE`/`OFFICE` references from `SCENARIO_INPUT` (Section 4). A note may summarize a transitive path in prose, but no line is drawn where no real foreign key or join table exists. See [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md).

## 3. Broader Integrity Audit Findings

After applying the ten corrections above, every remaining relationship in the corrected documents was scanned for the same seven failure patterns. Findings, beyond the specific tables the founder's prompt named:

1. **Plain UUID FKs into nullable-organization lookup tables, found and fixed via the Global-or-Same-Organization Reference Pattern:** `employee.job_role_id`, `labor_model_staffing_measure.job_role_id`, `backlog_stage_count.production_stage_id` (see "Intentionally Permitted" note below — this one is deliberately *not* forced to same-organization, since it is a legitimate global-lookup case), `recommendation.origin_business_rule_version_id`, and `condition_evaluation`'s indirect exposure to `business_rule_version` via `business_rule_condition`. Combined with the two sites the founder named directly (`security_role.permission_set_id`, `permission.security_role_id`) and the one from Correction 9 (`scenario_input.value_reference_job_role_id`), this pattern now applies at **eight** sites total, documented once in [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md) rather than repeated eight times.
2. **Plain, fully-unenforced FKs into tenant-owned (non-nullable-organization) tables:** `recommendation.origin_scenario_run_id` and `import_job.organization_import_profile_override_id`/`payroll_snapshot.account_mapping_version_id` — all three closed with ordinary composite FKs (Correction 2's pattern, no trigger needed, since the target's `organization_id` is never nullable in these cases).
3. **Immutable records with fields needing later mutation** — none found beyond what Correction 6 already fixed (`alert`). The newly introduced `condition_evaluation`/`condition_evaluation_evidence` tables are fully insert-only with no mutable fields.
4. **Effective-dated constraints relying on nullable equality** — fully covered by Correction 4; no third table with this exact combination (nullable `organization_id` + `EXCLUDE` constraint) exists in this proposal.
5. **Unique constraints blocking legitimate corrections** — fully covered by Correction 1; `condition_evaluation` was deliberately designed with no such constraint from the start (see Correction 6).
6. **Generic UUID references with no enforceable target** — fully covered by Correction 9; `audit_event.entity_type`/`entity_id` remains the one deliberate, documented exception (a table that by definition audits every entity type).
7. **RLS designs that could widen access from an absent related row** — no new instance found. The Sprint 3B.1 fail-closed Effective Access Evaluation Rule is unaffected by any Sprint 3B.2 change; `permission_set.organization_id`'s new nullability governs *capability composition ownership*, not per-row access-widening, and introduces no new fail-open branch.

**Considered and deliberately not applied:** `import_validation_result` and `import_validation_issue` were evaluated for the same `organization_id`-propagation treatment and left as plain FKs — both are reachable only through a single `import_source_row_id` (already organization-scoped transitively) and are always created by the exact same import-pipeline execution as the row they describe, so there is no realistic write path capable of crossing organizations. Propagating `organization_id` here would add columns and composite FKs for a risk with no plausible cause, which the instruction not to redesign stable parts of the model unnecessarily counsels against.

> **⚠️ Superseded by Sprint 3B.3, Correction 5.** This reasoning was withdrawn: a plausible-write-path argument describes expected application behavior, not a database-enforced guarantee, and does not satisfy the explicit instruction that "service-role or future import code bugs must still be rejected by the database." Both tables now carry a denormalized `organization_id` and composite FKs, and `import_validation_issue` is additionally constrained to reference a normalized value from the same source row as its parent Validation Result. See [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md) "Correction 5."

## 4. Exact Tables Added or Removed

**Added (2):** `condition_evaluation`, `condition_evaluation_evidence` (both Correction 6).

**Removed:** none.

Every other correction added columns and constraints to existing tables (`organization_id`/`office_id` propagation, revision/fingerprint columns, typed reference columns, corrected FK directions) without changing the table count.

## 5. Exact Final MVP Table Count: 61

| Domain | Sprint 3B | Sprint 3B.1 | Sprint 3B.2 | Change (3B.1 → 3B.2) |
|---|---|---|---|---|
| Tenant and Organization Structure | 2 | 2 | 2 | — |
| Identity and Workforce | 4 | 4 | 4 | — |
| Authorization | 6 | 6 | 6 | — |
| Imports and Lineage | 8 | 13 | 13 | — |
| Canonical Snapshots | 8 | 8 | 8 | — |
| Metrics and Business Rules | 10 | 9 | **11** | **+2** |
| Scenarios | 9 | 11 | 11 | — |
| Recommendations and Work Tracking | 6 | 5 | 5 | — |
| Audit | 1 | 1 | 1 | — |
| **Total** | **54** | **59** | **61** | **+2** |

This count agrees across [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md), [`docs/database/README.md`](../database/README.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md), and this report.

## 6. Updated Tenant-Integrity Matrix (Every Join/Detail Table)

| Table | Organization enforcement | Office enforcement | Mechanism |
|---|---|---|---|
| `import_source_section` | ✅ Composite FK → `import_job` | N/A (no Office concept) | Declarative |
| `import_source_row` | ✅ Composite FK → `import_source_section` | N/A | Declarative |
| `import_normalized_value` | ✅ Composite FK → `import_source_row` | N/A | Declarative |
| `import_normalized_value_*_snapshot` (×4) | ✅ Composite FK, both sides | N/A | Declarative |
| `payroll_snapshot_line_item` | ✅ Composite FK, header and source row | Implied via header | Declarative |
| `labor_model_staffing_measure` | ✅ Composite FK, header and source row | Implied via header | Declarative |
| `backlog_stage_count` | ✅ Composite FK, header and (optional) source row | Implied via header | Declarative; `production_stage_id` intentionally unenforced (global lookup) |
| `metric_observation_component` | ✅ Composite FK, parent and (per-type) snapshot | ✅ Composite FK, per-type snapshot | Declarative |
| `scenario_run_*_snapshot` (×4) | ✅ Composite FK, both sides | ✅ Composite FK, both sides | Declarative |
| `scenario_input` / `scenario_output` | ✅ Composite FK → `scenario_run` | Implied via `scenario_run` | Declarative; typed reference columns per Correction 9 |
| `recommendation_evidence_alert` | ✅ Composite FK, both sides | ✅ Composite FK, both sides | Declarative |
| `recommendation_evidence_metric_observation` | ✅ Composite FK, both sides | ✅ Composite FK, both sides | Declarative |
| `task.related_alert_id` / `related_recommendation_id` | ✅ Composite FK | ✅ Composite FK | Declarative |
| `recommendation.origin_scenario_run_id` | ✅ Composite FK | ✅ Composite FK | Declarative |
| `import_job.organization_import_profile_override_id`, `payroll_snapshot.account_mapping_version_id` | ✅ Composite FK | N/A | Declarative |
| `employee.job_role_id`, `labor_model_staffing_measure.job_role_id`, `scenario_input.value_reference_job_role_id` | ⚠️ Global-or-same-org | N/A | Sprint 3C trigger |
| `backlog_stage_count.production_stage_id` | 🟢 Intentional global lookup, no enforcement | N/A | Documented exception |
| `recommendation.origin_business_rule_version_id`, `condition_evaluation` → `business_rule_condition` | ⚠️ Global-or-same-org | N/A | Sprint 3C trigger |
| `security_role.permission_set_id`, `permission.security_role_id` | ⚠️ Global-or-same-org | N/A | Sprint 3C trigger |

Legend: ✅ fully declarative today · ⚠️ requires a documented Sprint 3C trigger (conditional rule) · 🟢 intentional, no enforcement needed.

## 7. Snapshot and Metric Observation Revision Rules

- **Identity:** natural key (organization, office, period/date, source type where applicable) + `revision_number`. `metric_observation` additionally requires `evaluation_fingerprint` to distinguish a genuine correction from a genuine duplicate at the same natural key.
- **Supersession:** `supersedes_<row>_id`, self-referencing, composite-FK-matched to the full natural key (not merely organization).
- **Constraints, declarative today:** `revision_number >= 1`; revision 1 ⟺ `supersedes_*_id IS NULL`; `UNIQUE (supersedes_*_id)` (one successor max); `CHECK (supersedes_*_id IS DISTINCT FROM id)`.
- **Constraints requiring a Sprint 3C trigger:** predecessor's `revision_number` equals `this row's revision_number - 1`. Once in place, "no branching" and "no cycles" are emergent arithmetic consequences, not separate mechanisms.
- **Finding the latest revision:** `MAX(revision_number)` within the natural-key group — no `is_current` flag anywhere in this proposal.
- **Historical references survive corrections:** any FK to a specific `revenue_snapshot`/`payroll_snapshot`/`labor_model_snapshot`/`backlog_snapshot`/`metric_observation` row remains valid and historically exact forever, since these rows are immutable and never updated or deleted.

## 8. Global/Default Versus Organization-Owned Authorization Rules

- **Global (`organization_id IS NULL`):** `security_role` (3 MVP defaults), `permission_set` (platform-owned, immutable), `job_role`, `production_stage`, `business_rule_version` (BR-001's default), `capability` (always global, no nullable column at all), `metric_definition_version`/`scenario_definition_version` (always global, no `organization_id` column at all).
- **Organization-owned:** any of the above tables' rows with a non-null `organization_id`; `permission`, `permission_office_grant`, `security_role_capability` composition for an org-owned `permission_set`.
- **The rule governing every cross-reference between the two:** a tenant-owned row may reference a global default row, or a same-organization row — never another organization's custom row. This is the Global-or-Same-Organization Reference Pattern, applied at eight sites, each requiring a Sprint 3C trigger since the rule is conditional.
- **One organization can never alter another's, or a global role's, capability composition** — `permission_set_capability` rows are scoped entirely by their parent `permission_set_id`'s own ownership.

## 9. Condition-Evaluation and Alert Evidence Model

See Correction 6 above for the full design. Summary: `alert` (thin pointer) → `condition_evaluation` (immutable, carries the exact condition, period, and — for numeric conditions only — the Metric Observation) → optionally, `condition_evaluation_evidence` (typed relational evidence for non-numeric conditions: a cited Import Job or snapshot). Every documented `condition_type` (`numeric`, `qualitative`, `missing_data`, `stale_data`, `other`) can now produce an explainable Alert without inventing an unapproved condition type or storing unstructured JSON in place of relational evidence.

## 10. Remaining Engineering Items for Sprint 3C

All items below are implementation tasks for a proposal already considered structurally sound, not open design questions:

1. The Global-or-Same-Organization Reference Pattern trigger, at all eight named sites.
2. The predecessor-exactness trigger for snapshot and Metric Observation revisions.
3. The Recommendation supersession acyclicity trigger.
4. The `employee_office_assignment` exactly-once-closure trigger.
5. The pre-existing (Sprint 3B.1) items: the "at least one `permission_office_grant` row" deferred trigger, Alert/Recommendation lifecycle-transition validation triggers, Permission expiry enforcement mechanism (scheduled job vs. real-time check), and general immutability enforcement (rejecting `UPDATE`s on insert-only tables).
6. `btree_gist` extension setup (a one-time step, not a design decision).
7. Actual RLS policy SQL, built on top of the ownership/access dependencies this and prior reports document.

## 11. Remaining Founder/Business Questions

None newly introduced by this pass. This correction pass was scoped entirely to relational-integrity engineering issues; every genuinely unresolved business question already named in Sprint 3A/3B/3B.1 (Resets/Remakes inclusion in backlog totals, Labor Model staffing unit confirmation, OQ-042 Task lifecycle, the retention/erasure conflict, and others) remains exactly as unresolved as before, per the instruction not to invent an answer.

## 12. Confirmations

- **ADR-007 remains `Proposed`.** Not marked Accepted by this pass.
- **ADR-004 remains `Accepted`.** Untouched by this pass.
- **No SQL, migration, dependency, real data, staging, commit, push, merge, or deployment occurred** at any point during this correction pass.

## Required Review of the Judgment Calls Named in the Authorizing Prompt

1. **Typed joins: accepted, unaffected.** Every new table this pass introduces (`condition_evaluation_evidence`'s typed snapshot references) follows the same typed-join, no-polymorphic-reference discipline.
2. **Metric Observation: accepted with the durable-evaluation modifications above.** The persistence policy itself (durable-evaluation-only) is unchanged from Sprint 3B.1; this pass corrected the *identity* model underneath it (Correction 1), not the policy.
3. **Employee Office Assignment: retained and made authoritative.** Unaffected by this pass's substance (Correction 8 only fixed its *description*, not its physical design, which was already correct).
4. **Task Status History: deferred.** Unaffected by this pass.
5. **SecurityRole–Permission Set strict 1:1 as modeled in Sprint 3B: rejected and corrected (in Sprint 3B.1).** This pass (Correction 3) extends that correction with tenant ownership, not a reversal of it.
6. **Organization ID denormalization: retained with composite foreign-key enforcement (established in Sprint 3B.1).** This pass extends the same enforcement one level down to detail/join tables (Correction 2) and introduces the Global-or-Same-Organization Reference Pattern for the cases a plain composite FK cannot cover.

## Related Documents

- [Sprint 3B Report](SPRINT_3B_REPORT.md)
- [Sprint 3B.1 Review Corrections](SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Table Catalog](../database/02-table-catalog.md)
- [Keys, Relationships, and Constraints](../database/04-keys-relationships-and-constraints.md)
- [Authorization Data Model](../database/07-authorization-data-model.md)
- [ADR-007: Proposed Physical Data Model](../decisions/ADR-007-proposed-physical-data-model.md)
- [Proposed Physical ERD](../architecture/erd-physical-proposed.md)
