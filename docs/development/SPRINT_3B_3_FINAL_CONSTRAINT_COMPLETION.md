# Sprint 3B.3 — Final Constraint Completion

**Version:** 1.0
**Date:** 2026-08-06
**Status:** Complete — local, uncommitted, pending founder/engineering review
**Branch:** `docs/sprint-3b-physical-model` (same branch as Sprint 3B, 3B.1, and 3B.2; not a new branch)

**Current-state pointer (added by Sprint 3B.4):** a fourth, narrower correction pass — [`SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md`](SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md) — has since found and closed six further import-lineage gaps this report did not catch: Import-Job-level (as opposed to merely Organization-level) enforcement through the source-row/normalized-value chain and the detail tables, a false "enforced transitively" claim on `import_validation_issue` (see Section 3, `import_validation_issue`, below — that specific claim is superseded), a second duplicated Import Profile Version fact on `import_normalized_value`, an Import-Job-to-override Profile-Version binding gap, and the Payroll account-mapping duplication. This report's content below is otherwise unchanged and remains accurate for everything outside the import-lineage subsystem.

## Purpose

This report documents a third, narrower correction pass on the Sprint 3B/3B.1/3B.2 physical data model proposal ([`docs/database/`](../database/), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)). This pass verified that every composite foreign key introduced by the two prior passes actually had a matching parent-side key declared, and closed eight further gaps in evidence-table tenant matching, snapshot-to-import integrity, scenario-version binding, validation-result lineage, and same-row check-constraint coverage. None of these corrections reverses a founder-approved business decision from Sprint 3A/3B/3B.1/3B.2; all are engineering corrections.

Per the authorizing instructions for this pass: no executable SQL, migrations, Supabase project, dependencies, or application code were created; nothing was staged, committed, pushed, or merged; ADR-007 remains **Proposed**; ADR-004 remains **Accepted**; no founder-approved business decision was reversed — only engineering interpretations of those decisions were corrected; no unresolved business meaning was invented; no MVP table was added or removed unless truly unavoidable (none was — the expected count of 61 held).

## 1. Safety-Check Results

Reverified before any file was changed:

| Check | Result |
|---|---|
| Git root is `C:\Users\david\OneDrive\Desktop\LabPulse-Remote-Inspection` | ✅ Pass |
| Branch is `docs/sprint-3b-physical-model` | ✅ Pass |
| Remote is `Magnivoxs/LabPulse` | ✅ Pass |
| Existing Sprint 3B/3B.1/3B.2 work present (15 modified + 6 untracked entries in `git status --short`) | ✅ Pass |
| Nothing staged | ✅ Pass |
| No new commit or push | ✅ Pass |

A prior attempt at this exact pass was interrupted mid-way by a session usage limit, not by any task failure. Its partial work (substantially complete edits to `docs/database/03-column-and-type-catalog.md`, `04-keys-relationships-and-constraints.md`, and `06-import-lineage-model.md`, covering Corrections 1 through 7) was independently verified line-by-line before being built upon, rather than trusted at face value — the relational logic in each (composite key column ordering, CHECK constraint completeness, cross-file consistency) checked out as sound. This report and the remaining files (Correction 8, the broader final audit, and all cross-referencing updates) complete that interrupted pass.

## 2. Every Issue Corrected

### Correction 1 — Composite Parent-Key Completion

Two real gaps were found by auditing every composite FK in the proposal against its claimed parent key: `metric_observation` and `condition_evaluation` each already had composite foreign keys *pointing at them* (from `metric_observation_component`, `recommendation_evidence_metric_observation`, `condition_evaluation`, `condition_evaluation_evidence`, and `alert`) with no corresponding parent-side `UNIQUE` constraint ever declared — meaning those composite FKs referenced a column list PostgreSQL could not actually create a constraint against. Every other composite FK in the proposal was checked and already had a valid matching parent key.

**`metric_observation` — three composite keys added:**
- `UNIQUE (organization_id, id)` — required by `metric_observation_component.metric_observation_id`.
- `UNIQUE (organization_id, office_id, id)` — required by `condition_evaluation.metric_observation_id` and `recommendation_evidence_metric_observation.metric_observation_id`.
- `UNIQUE (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — required by `metric_observation`'s own self-referencing `supersedes_metric_observation_id`.

These are added *alongside*, not instead of, the existing `UNIQUE (metric_definition_version_id, office_id, reporting_period_start, reporting_period_end, evaluation_fingerprint)` and `UNIQUE (supersedes_metric_observation_id)` constraints from Sprint 3B.2 — four distinct uniqueness constraints on one table, each serving a different consumer, none redundant, none reintroducing a natural-key restriction on how many times a period may be evaluated.

**`condition_evaluation` — two composite keys added** (previously "none beyond PK — deliberate"): `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)`, required by `condition_evaluation_evidence.condition_evaluation_id` and `alert.condition_evaluation_id`. `condition_evaluation` still has **no natural-key uniqueness constraint** — these are purely structural, ID-based composite keys that support cross-table FK enforcement; they say nothing about how many times the same business condition/office/period may be evaluated, and do not reintroduce the exact mistake this correction pass fixed on `metric_observation`.

**Resolution:** satisfies the requirement. See Section 4 below for the complete verification matrix covering every composite FK in the proposal, not only the two corrected here.

### Correction 2 — Repair `condition_evaluation_evidence`

Added `office_id UUID NOT NULL` — Sprint 3B.2 omitted this column entirely, which meant the "organization-and-office-matched" snapshot references it was already described as having could not actually be expressed as composite FKs, since there was no `office_id` on the row to compose them from. Corrected:

- `(organization_id, office_id, condition_evaluation_id) → condition_evaluation (organization_id, office_id, id)`.
- Each snapshot reference: `(organization_id, office_id, referenced_<type>_snapshot_id) → <type>_snapshot (organization_id, office_id, id)`, using this row's own columns, not the parent's (the parent-match is separately guaranteed by the FK above).
- `referenced_import_job_id`: `(organization_id, referenced_import_job_id) → import_job (organization_id, id)` — organization-only, since `import_job` has no `office_id` of its own.

**Evidence-shape `CHECK` added**, tying `evidence_role` to which columns must be populated:
- `referenced_snapshot` and `stale_snapshot` each require exactly one typed snapshot reference and no Import Job reference.
- `missing_import` requires either `referenced_import_job_id` or (when no relevant Import Job has ever run) a structured `notes` explanation, and no snapshot reference.
- `other` requires `notes`, and no snapshot or Import Job reference.
- No combination permits an entirely empty row.

**Representing `missing_data` with no Import Job to cite:** when an Import Job of the relevant type has run before (even if stale), `referenced_import_job_id` points at that last known job — a concrete anchor. When none has ever run, `referenced_import_job_id` is left `NULL` and `notes` is required instead, carrying a structured explanation. No `JSONB` is used anywhere on this table; this is honest about the limit of what a foreign key can express (a reference to something that has never existed cannot be a foreign key) without falling back to unrestricted free-form storage.

**Resolution:** satisfies the requirement in full.

### Correction 3 — Complete Snapshot-to-Import Tenant Integrity

`revenue_snapshot.import_job_id`, `payroll_snapshot.import_job_id`, `labor_model_snapshot.import_job_id`, and `backlog_snapshot.import_job_id` (nullable, imported-path only) each become a composite FK: `(organization_id, import_job_id) → import_job (organization_id, id)`. `import_job.supersedes_import_job_id` gains the identical treatment (self-referencing).

**Whether a superseding Import Job may use a different Profile Version:** same-Organization is mandatory; profile-version equality is deliberately **not** required. This is a judgment call, not a repository-stated rule — flagged for spot-check: no document requires a reprocessing run to use the identical profile version as the run it corrects, and requiring equality would block the legitimate case where the correction *is* a mapping fix. The more permissive reading was chosen because the stricter one has no stated business justification and would foreclose a plausible real workflow.

**Duplicated `import_profile_version_id` resolved:** the redundant, independently-writable column is removed from `revenue_snapshot`, `payroll_snapshot`, and `labor_model_snapshot` (it never existed on `backlog_snapshot`). `import_job` remains the single, immutable source; a snapshot's profile version is now always derived through `import_job_id → import_job.import_profile_version_id`, never stored a second time.

**`backlog_snapshot` source-shape rule:** a genuine same-row `CHECK` now enforces `(import_job_id IS NOT NULL AND manual_entry_user_id IS NULL) OR (import_job_id IS NULL AND manual_entry_user_id IS NOT NULL)` — previously only a documentation convention. An explicit `source_type` discriminant column was considered and rejected as unnecessary machinery, since the two nullable FKs plus this `CHECK` already unambiguously encode which path produced the row.

**Resolution:** satisfies the requirement in full.

### Correction 4 — Bind Scenario Values to the Run's Exact Definition Version

`scenario_input`/`scenario_output` each gain `scenario_definition_version_id UUID NOT NULL`. Two composite FKs, sharing this column, together guarantee the Run's version, the input's declared version, and the definition's owning version are all identical:

- **Run-version agreement:** `(scenario_run_id, scenario_definition_version_id) → scenario_run (id, scenario_definition_version_id)` — requires `scenario_run` to expose `UNIQUE (id, scenario_definition_version_id)` (added).
- **Definition-version agreement:** `(scenario_definition_version_id, scenario_parameter_definition_id) → scenario_parameter_definition (scenario_definition_version_id, id)` (and the `scenario_output`/`scenario_output_definition` equivalent) — requires `scenario_parameter_definition`/`scenario_output_definition` to expose `UNIQUE (scenario_definition_version_id, id)` (added).

Neither FK alone would catch a mismatch where the input's declared version agreed with the Run but the cited definition belonged to a different version, or vice versa — both must hold simultaneously, which PostgreSQL enforces once both composite FKs share the same column value.

**Sprint 3C validation rule documented, not implemented:** the populated value column must match the referenced definition's `data_type` and, when applicable, `reference_target_type` — a `CHECK` cannot join across tables to read this, so it is added to the Sprint 3C trigger inventory (Section 9).

**Same-row `CHECK` added** on both definition tables: `data_type = 'reference'` requires `reference_target_type`; other types require it null.

The existing typed JobRole/Office reference columns (Sprint 3B.2 Correction 9) are preserved unchanged.

**Resolution:** satisfies the requirement in full.

### Correction 5 — Complete Validation-Result Lineage Integrity

Sprint 3B.2's broader integrity audit considered and **deliberately declined** to propagate `organization_id` onto `import_validation_result`/`import_validation_issue`, reasoning both are reachable only through a single `import_source_row_id` with "no realistic write path" crossing organizations. **This reasoning is withdrawn.** A plausible-write-path argument describes expected application behavior, not a database-enforced guarantee, and does not satisfy the explicit instruction that service-role or future import-code bugs must still be rejected by the database. Corrected:

- `import_validation_result` gains a denormalized `organization_id NOT NULL`, composite FK `(organization_id, import_source_row_id) → import_source_row (organization_id, id)`.
- `import_validation_issue` gains a denormalized `organization_id NOT NULL`, composite FK `(organization_id, import_validation_result_id) → import_validation_result (organization_id, id)` (requiring `import_validation_result` to also carry `UNIQUE (organization_id, id)`).
- **Same-source-row requirement:** when an issue references a specific `import_normalized_value`, that value must originate from the **same source row** as the Validation Result it belongs to — a stronger, three-way requirement than organization-matching alone. `import_validation_issue` gains a denormalized `import_source_row_id` (populated only when `import_normalized_value_id IS NOT NULL`), with composite FK `(organization_id, import_source_row_id, import_normalized_value_id) → import_normalized_value (organization_id, import_source_row_id, id)` — requiring `import_normalized_value` to additionally carry `UNIQUE (organization_id, import_source_row_id, id)`.

**Resolution:** satisfies the requirement in full. [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) has been annotated with a pointer to this withdrawal.

### Correction 6 — Add Enforceable Row-Shape Checks

| Table | `CHECK` added |
|---|---|
| `permission` | `effective_end_at IS NULL OR effective_start_at IS NULL OR effective_end_at > effective_start_at`; `revoked_at IS NULL OR revoked_at >= granted_at` |
| `import_normalized_value` | `num_nonnulls(canonical_value_text, canonical_value_numeric) = 1` |
| `business_rule_condition` | `condition_type = 'numeric'` requires `metric_definition_version_id`+`operator`+`threshold_value`+`threshold_unit`; every other type requires all four `NULL` |
| `scenario_parameter_definition`, `scenario_output_definition` | `data_type = 'reference'` requires `reference_target_type`; other types require it `NULL` (shared with Correction 4) |
| `alert_lifecycle_event.sequence_number`, `recommendation_lifecycle_event.sequence_number` | `>= 1` |
| `import_profile_version.version_number`, `organization_import_profile_override.version_number`, `business_rule_version.version_number`, `metric_definition_version.version_number`, `scenario_definition_version.version_number` | `>= 1` |
| `business_rule_condition.display_order`, `scenario_parameter_definition.display_order`, `scenario_output_definition.display_order`, `production_stage.display_order` | `>= 0` |
| `alert` | `UNIQUE (condition_evaluation_id)` — no repository document describes a need for more than one Alert per immutable Condition Evaluation; a repeat evaluation produces a new `condition_evaluation` row and, if warranted, its own distinct Alert |

**`condition_evaluation` same-row consistency** — three rules governing temporal/evidentiary consistency, one of which is a plain same-row `CHECK` (`reporting_period_end >= reporting_period_start`, added now) and two of which require reading `business_rule_condition.condition_type` from a different table and are therefore documented for the Sprint 3C trigger inventory (Section 9), not implemented as a `CHECK` here: numeric conditions require `metric_observation_id`+`numeric_triggered_value` jointly present; non-numeric conditions require both jointly absent.

**Resolution:** satisfies the requirement in full — every enumerated check either is now a genuine `CHECK`/`UNIQUE` constraint, or is explicitly named as a Sprint 3C trigger requirement where a plain constraint cannot express it (cross-table reads).

### Correction 7 — Clean Import Job Documentation

`import_job.organization_import_profile_override_id`'s original Sprint 3B plain-FK definition and its Sprint 3B.2-corrected composite-FK definition existed as two separate rows describing the same column in [`06-import-lineage-model.md`](../database/06-import-lineage-model.md) — the duplicate (Sprint 3B's original) is removed, leaving one, sole, corrected definition.

**Can a superseding Import Job use a different Profile Version?** Answered under Correction 3 above (same-Organization mandatory, profile-version equality deliberately not required).

**Effective-date overlap clarified for both `import_profile_version` and `organization_import_profile_override`:** these dates are **informational only**. Every `import_job` explicitly pins the exact version/override it used at upload time — no read path in this proposal derives "which version is active today" from these dates. Consistent with this, neither table carries an `EXCLUDE` non-overlap constraint; sequential `version_number` uniqueness (already present) is the only uniqueness rule either table needs. This is a clarification of existing intent, not a new constraint — two versions with overlapping informational date ranges are not a conflict, since no query ever resolves ambiguity between them by date.

**Resolution:** satisfies the requirement in full.

### Correction 8 — Remove Stale Contradictions

[ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)'s Decision section originally stated the `organization_id`/`office_id` consistency-enforcement gap was "named explicitly as unresolved Sprint 3C work" in its entirety. This is now stale: composite foreign keys (Sprint 3B.1 Correction 2, Sprint 3B.2 Correction 2, and this pass's Corrections 1, 3, and 5) resolve every **unconditional** same-tenant relationship declaratively. The sentence is corrected in place, and a dated "Amendment: Sprint 3B.3 Corrections" section is added, preserving the existing Sprint 3B.1 and Sprint 3B.2 amendment sections unchanged. ADR-007's status remains **Proposed**; only its content is corrected, not its governance status.

No other stale sentence contradicting the Sprint 3B.3 design was found elsewhere in the touched documents during this review, beyond the Sprint 3B.2 "considered and declined" withdrawal already covered under Correction 5.

**Resolution:** satisfies the requirement in full.

## 3. Broader Final Audit

Applied the seven failure patterns from the original Sprint 3B.2 audit methodology across the entire model, not only the eight named corrections above — with particular attention to `docs/database/01`, `07`, and `08`, which had not been touched by any correction in this pass and might have accumulated the same patterns independently.

1. **Missing exact parent key** — fully covered by Correction 1; no third occurrence found beyond `metric_observation`/`condition_evaluation`.
2. **Child/target can differ in Organization** — fully covered by Corrections 2, 3, and 5; no further occurrence found in `01-physical-model-principles.md`, `07-authorization-data-model.md`, or `08-retention-archive-and-erasure-boundaries.md` (all three were read in full for this pass; none defines a new tenant-owned reference of its own — they document conventions and reference tables corrected elsewhere).
3. **Duplicated columns can disagree** — fully covered by Correction 3 (`import_profile_version_id`); no third duplicated-fact pair found.
4. **Definition/detail can belong to wrong parent version** — fully covered by Correction 4; no analogous gap found for `business_rule_condition`/`business_rule_version` or `metric_observation_component`/`metric_definition_version`, both of which already bind to a single specific version row with no intermediate "any version" ambiguity to exploit.
5. **Immutable row needing later mutation** — none found. `condition_evaluation`, `import_validation_result`, and `import_validation_issue` (this pass's most-touched tables) remain fully insert-only with no mutable fields added.
6. **Same-row invariant left to application code** — fully covered by Correction 6; no further un-enforced same-row invariant found during a full re-read of `03-column-and-type-catalog.md` and `04-keys-relationships-and-constraints.md`.
7. **Provenance link pointing to unrelated source row** — fully covered by Correction 5's three-way `import_validation_issue`/`import_normalized_value` key.

**No new instance of any of the seven patterns was found beyond the eight named corrections.** No file was edited for its own sake beyond what these corrections and their direct cross-references required — `01`, `05`, `07`, `08`, and `09` received version-bump and cross-reference updates only, with one substantive wording fix in `02-table-catalog.md` (the `condition_evaluation` uniqueness description, corrected from "no uniqueness constraint beyond the primary key" to "no *natural-key* uniqueness constraint," matching the precise language this pass's Correction 1 requires elsewhere).

## 4. Composite Foreign Key Verification Matrix

The complete matrix — every composite FK in the proposal and its matching parent key — is maintained as the authoritative copy in [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Composite Foreign Key Verification Matrix," reproduced here in full:

| Child table.column(s) | Parent table.column(s) | Matching parent key | Enforcement |
|---|---|---|---|
| `office.(organization_id, id)` | — | `UNIQUE (organization_id, id)` on `office` itself | Declarative |
| `employee_office_assignment.(organization_id, office_id)` | `office.(organization_id, id)` | `office` `UNIQUE (organization_id, id)` | Declarative |
| `employee_office_assignment.(organization_id, employee_id)` | `employee.(organization_id, id)` | `employee` `UNIQUE (organization_id, id)` | Declarative |
| `{revenue,payroll,labor_model,backlog}_snapshot.(organization_id, office_id)` | `office.(organization_id, id)` | `office` `UNIQUE (organization_id, id)` | Declarative |
| `{revenue,payroll,labor_model,backlog}_snapshot.(organization_id, office_id, <natural key>, supersedes_snapshot_id)` | Same table, same columns | Table's own natural-key composite `UNIQUE` | Declarative for key-matching; Sprint 3C trigger for predecessor-exactness |
| `metric_observation.(organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, supersedes_metric_observation_id)` | Same table, same columns | `metric_observation` `UNIQUE (organization_id, office_id, metric_definition_version_id, reporting_period_start, reporting_period_end, id)` — **added, Sprint 3B.3** | Declarative for key-matching; Sprint 3C trigger for predecessor-exactness |
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
| `import_validation_result.(organization_id, import_source_row_id)` | `import_source_row.(organization_id, id)` | `import_source_row` `UNIQUE (organization_id, id)` | Declarative (**Sprint 3B.3 Correction 5** — was a plain FK) |
| `import_validation_issue.(organization_id, import_validation_result_id)` | `import_validation_result.(organization_id, id)` | `import_validation_result` `UNIQUE (organization_id, id)` — **added, Sprint 3B.3** | Declarative (**Sprint 3B.3 Correction 5** — was a plain FK) |
| `import_validation_issue.(organization_id, import_source_row_id, import_normalized_value_id)` | `import_normalized_value.(organization_id, import_source_row_id, id)` | `import_normalized_value` `UNIQUE (organization_id, import_source_row_id, id)` — **added, Sprint 3B.3** | Declarative (**Sprint 3B.3 Correction 5** — new, three-way) |
| `scenario_input`/`scenario_output`.`(scenario_run_id, scenario_definition_version_id)` | `scenario_run.(id, scenario_definition_version_id)` | `scenario_run` `UNIQUE (id, scenario_definition_version_id)` — **added, Sprint 3B.3** | Declarative |
| `scenario_input`.`(scenario_definition_version_id, scenario_parameter_definition_id)` | `scenario_parameter_definition.(scenario_definition_version_id, id)` | `scenario_parameter_definition` `UNIQUE (scenario_definition_version_id, id)` — **added, Sprint 3B.3** | Declarative |
| `scenario_output`.`(scenario_definition_version_id, scenario_output_definition_id)` | `scenario_output_definition.(scenario_definition_version_id, id)` | `scenario_output_definition` `UNIQUE (scenario_definition_version_id, id)` — **added, Sprint 3B.3** | Declarative |
| Every other composite FK (permission/office-grant, import-lineage detail chain, recommendation/task/scenario-baseline join tables) | — | Verified already present in Sprint 3B.1/3B.2 | Declarative |

**No composite FK in this proposal now references a column list without a verified matching parent `PRIMARY KEY`/`UNIQUE` constraint.**

## 5. Updated Tenant-Integrity Matrix

Every table carrying two or more tenant-owned references, and its same-tenant enforcement path — carried forward from Sprint 3B.2 with the three tables this pass added:

| Table | Same-tenant enforcement | Added by |
|---|---|---|
| `payroll_snapshot_line_item` | `(organization_id, payroll_snapshot_id)` + `(organization_id, import_source_row_id)` composite FKs | 3B.2 |
| `labor_model_staffing_measure` | Same pattern, against `labor_model_snapshot` | 3B.2 |
| `backlog_stage_count` | `(organization_id, backlog_snapshot_id)` composite FK; `(organization_id, import_source_row_id)` when populated | 3B.2 |
| `import_normalized_value_{revenue,payroll,labor_model,backlog}_snapshot` (4 tables) | `(organization_id, import_normalized_value_id)` + `(organization_id, <type>_snapshot_id)` composite FKs | 3B.2 |
| `metric_observation_component` | `(organization_id, metric_observation_id)` + org-and-office-matched source snapshot FKs | 3B.2 |
| `scenario_run_{revenue,payroll,labor_model,backlog}_snapshot` (4 tables) | Org-and-office-matched composite FKs on both sides | 3B.2 |
| `scenario_input`, `scenario_output` | `(organization_id, scenario_run_id)` composite FK; **[3B.3]** `scenario_definition_version_id` binds to both Run and definition version | 3B.2 + 3B.3 |
| `recommendation_evidence_alert` | Org-and-office-matched composite FKs on both sides | 3B.2 |
| `recommendation_evidence_metric_observation` | Same pattern; **[3B.3]** parent-key gap on `metric_observation` side closed | 3B.2 + 3B.3 |
| `task.related_alert_id`, `task.related_recommendation_id` | Org-and-office-matched composite FKs | 3B.2 |
| `recommendation.origin_scenario_run_id` | Org-and-office-matched composite FK (found during 3B.2's own broader audit) | 3B.2 |
| `import_job.organization_import_profile_override_id`, `payroll_snapshot.account_mapping_version_id` | Org-matched composite FKs (found during 3B.2's own broader audit) | 3B.2 |
| `condition_evaluation_evidence` | **[New, 3B.3]** — `(organization_id, office_id, condition_evaluation_id)` + org-and-office-matched snapshot refs + org-matched Import Job ref; required adding `office_id` to this table first | 3B.3 |
| `import_validation_result` | **[New, 3B.3]** — `(organization_id, import_source_row_id)` composite FK; withdraws 3B.2's "no realistic write path" exception | 3B.3 |
| `import_validation_issue` | **[New, 3B.3]** — `(organization_id, import_validation_result_id)` composite FK plus a three-way same-source-row FK on `import_normalized_value_id` | 3B.3 |
| `{revenue,payroll,labor_model,backlog}_snapshot.import_job_id` | **[New, 3B.3]** — `(organization_id, import_job_id)` composite FK; was previously plain | 3B.3 |
| `import_job.supersedes_import_job_id` | **[New, 3B.3]** — `(organization_id, supersedes_import_job_id)` self-referencing composite FK; was previously plain | 3B.3 |

No table with two or more tenant-owned references remains on a plain, unenforced foreign key.

## 6. Snapshot and Metric Observation Revision Rules

Unchanged in principle from Sprint 3B.2, strengthened by this pass only at the composite-key-support level (Correction 1) and the import-lineage level (Correction 3):

- All four canonical snapshots and `metric_observation` use `revision_number`/`supersedes_<row>_id`, never a mutable `is_current` flag.
- A row may supersede only a row sharing its complete natural key (organization, office, reporting period/date, source type where applicable) — enforced by a self-referencing composite FK (Sprint 3B.2 Correction 5).
- `revision_number >= 1`; revision 1 has no predecessor; revision `> 1` must have one — both plain, declarative `CHECK` constraints.
- Only one direct successor per row (`UNIQUE (supersedes_<row>_id)`); no self-reference (`CHECK (supersedes_<row>_id IS DISTINCT FROM id)`).
- Predecessor-exactness (`revision_number` = predecessor's `+ 1`) and the resulting cycle-freedom guarantee both require a Sprint 3C trigger, since a `CHECK` cannot compare against another row's columns.
- `metric_observation` additionally carries `evaluation_fingerprint`, distinguishing a genuine correction (different inputs, new fingerprint) from an exact duplicate (same inputs, blocked by uniqueness) — see [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Metric Observation Identity and Reuse."
- **New this pass:** the four snapshot headers' `import_job_id` is now a composite FK, and the duplicated `import_profile_version_id` fact is removed from three of the four (see Correction 3).

## 7. Global/Default vs. Organization-Owned Authorization Rules

Unchanged from Sprint 3B.2 — this pass's Correction 3 (composite parent keys on `metric_observation`/`condition_evaluation`) and broader audit did not find any new instance of the Global-or-Same-Organization Reference Pattern beyond the eight sites Sprint 3B.2 already documented in [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md). Restated for completeness:

- A **global** SecurityRole (`organization_id IS NULL`) may reference only a **global** Permission Set.
- An **organization-specific** SecurityRole may reference a same-organization Permission Set, or, intentionally, a global immutable one — never another organization's custom Permission Set.
- The identical rule applies to `permission.security_role_id`.
- Capability definitions remain global in every case; only Permission Set *composition* can be organization-owned.
- Each of the eight sites (`security_role.permission_set_id`, `permission.security_role_id`, `employee.job_role_id`, `labor_model_staffing_measure.job_role_id`, `scenario_input.value_reference_job_role_id`, `backlog_stage_count.production_stage_id`, `recommendation.origin_business_rule_version_id`, and `condition_evaluation`'s indirect exposure via `business_rule_condition`) requires a Sprint 3C `BEFORE INSERT OR UPDATE` trigger, since a conditional "match, or the target is global" rule cannot be a plain composite FK.
- **Not relied on as an RLS-visibility-only guarantee** — each trigger is a genuine write-time database constraint, independent of which role or policy context performs the write.

## 8. Condition-Evaluation and Alert Evidence Model

- `condition_evaluation` (immutable, MVP): the exact Business Rule Condition, Organization/Office, reporting period, evaluation time; `metric_observation_id`+`numeric_triggered_value` populated only for `numeric` conditions; `qualitative_summary` populated otherwise. No natural-key uniqueness (deliberate). **This pass added** its two composite-FK-support keys (Correction 1).
- `condition_evaluation_evidence` (MVP): typed, relational evidence for non-numeric conditions — `evidence_role`, an optional Import Job reference, four mutually-exclusive optional typed snapshot references, and `notes`. No `JSONB` anywhere on this table. **This pass added** the missing `office_id` column and the evidence-shape `CHECK` (Correction 2), without which the table's own claimed organization-and-office matching could not have existed.
- `alert` (immutable core, MVP): a thin pointer — `organization_id`, `office_id`, `condition_evaluation_id`, `triggered_at`. **This pass added** `UNIQUE (condition_evaluation_id)` (Correction 6) — no more than one Alert per immutable Condition Evaluation.
- `alert_lifecycle_event` (unaffected by this pass): sequence-numbered, append-only; current state derived from the latest sequence, never a mutable column.

Every one of `business_rule_condition.condition_type`'s five values (`numeric`, `qualitative`, `missing_data`, `stale_data`, `other`) can produce an explainable, evidence-backed Alert.

## 9. Remaining Engineering Items for Sprint 3C

Consolidated trigger inventory (all documented, none implemented as SQL in Sprint 3B/3B.1/3B.2/3B.3):

1. At least one `permission_office_grant` row for every `scope_type = 'office'` Permission (existence-of-a-related-row cannot be declarative).
2. Global-or-same-organization reference validation, at the eight named sites (Section 7).
3. Snapshot and Metric Observation predecessor-exactness (`revision_number` = predecessor's `+ 1`), across all five revisable tables.
4. Recommendation supersession acyclicity (`supersedes_recommendation_id`, when set, must reference a strictly-earlier-`generated_at` row).
5. `employee_office_assignment` exactly-once closure.
6. Alert and Recommendation lifecycle-transition validation against their documented allow-lists.
7. Immutability enforcement (rejecting `UPDATE`s to substantive columns) on every insert-only table.
8. **(New, Sprint 3B.3)** Scenario value/definition type agreement — the populated value column on `scenario_input`/`scenario_output` must match its referenced definition's `data_type` and, when applicable, `reference_target_type`.
9. **(New, Sprint 3B.3)** `condition_evaluation` numeric/non-numeric consistency — `metric_observation_id`/`numeric_triggered_value` jointly present for `numeric` conditions, jointly absent otherwise.

Also unresolved for Sprint 3C, unrelated to any new trigger: whether Permission's `effective_end_at` is enforced by a scheduled job or a real-time check (OQ-054, engineering-owned).

## 10. Remaining Founder/Business Questions

None newly raised by this pass. The two judgment calls made without a directly on-point repository instruction are flagged here for spot-check, not as founder decisions required before Sprint 3C:

1. **Profile-version equality across an Import Job supersession is not required** (Correction 3/7) — a permissive-reading judgment call, reversible by adding a `CHECK` if the founder later confirms reprocessing must always use the identical profile version.
2. **`missing_data` evidence representation** (Correction 2) — chosen as the simplest schema-supported representation (last-known Import Job, or `notes` when none exists) rather than inventing a new table; reversible additively if a more specific representation is later confirmed necessary.

## 11. Exact Final MVP Table Count

**61.** Unchanged from Sprint 3B.2. Every Sprint 3B.3 correction added columns, constraints, and composite-FK-supporting keys to existing tables (including the two tables Sprint 3B.2 introduced, `condition_evaluation` and `condition_evaluation_evidence`) — none added or removed a table. Confirmed to agree across [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md), [`docs/database/README.md`](../database/README.md), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md), and this report.

## 12. Confirmation — ADR-007 Remains Proposed

**Confirmed.** ADR-007's `**Status:**` field was verified unchanged (`Proposed`) before and after this pass's edits. Only its Decision-section wording (Correction 8) and a new dated amendment section were added; its governance status was not touched. ADR-004 remains **Accepted**, untouched by this pass.

## 13. Confirmation — No Prohibited Actions Occurred

**Confirmed.** No executable SQL, migration file, Supabase project/connection, dependency installation, or application code was created. No file was staged (`git diff --cached --stat` empty before and after). No commit, push, merge, or pull request occurred (`git log --oneline --decorate --all` shows no commit beyond the pre-existing root commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e` on any branch). No real company, employee, financial, or credential data was introduced. The separate, non-Git `Labpulse` workspace was not read from, written to, or otherwise referenced.

## Final `git status --short`

```
 M README.md
 M docs/backlog/PRODUCT_BACKLOG.md
 M docs/data-model/05-retention-policy.md
 M docs/data-model/snapshot-strategy.md
 M docs/data/01-metrics-dictionary.md
 M docs/decisions/ADR-004-office-based-authorization.md
 M docs/development/AI_CONTEXT.md
 M docs/development/DECISION_LOG.md
 M docs/development/EXECUTIVE_SUMMARY.md
 M docs/development/PROJECT_MEMORY.md
 M docs/development/open-questions.md
 M docs/entities/backlog-snapshot.md
 M docs/entities/labor-model-snapshot.md
 M docs/entities/permission.md
 M docs/entities/security-role.md
?? docs/architecture/erd-physical-proposed.md
?? docs/database/
?? docs/decisions/ADR-007-proposed-physical-data-model.md
?? docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md
?? docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md
?? docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md
```

Nothing staged; no commit or push occurred; all work remains on `docs/sprint-3b-physical-model`.

## Related Documents

- [Table Catalog](../database/02-table-catalog.md)
- [Keys, Relationships, and Constraints](../database/04-keys-relationships-and-constraints.md)
- [Physical Model Principles](../database/01-physical-model-principles.md)
- [Authorization Data Model](../database/07-authorization-data-model.md)
- [Import Lineage Model](../database/06-import-lineage-model.md)
- [ADR-007: Proposed Physical Data Model](../decisions/ADR-007-proposed-physical-data-model.md)
- [Sprint 3B Report](SPRINT_3B_REPORT.md)
- [Sprint 3B.1 Review Corrections](SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
