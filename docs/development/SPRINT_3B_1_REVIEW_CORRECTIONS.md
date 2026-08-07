# Sprint 3B.1 — Physical Model Review Corrections

**Version:** 1.0
**Date:** 2026-08-06
**Status:** Complete — local, uncommitted, pending founder/engineering review
**Branch:** `docs/sprint-3b-physical-model` (same branch as Sprint 3B; not a new branch)

## Purpose

This report documents a correction pass on the Sprint 3B physical data model proposal ([`docs/database/`](../database/), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)). A review identified fifteen relational-design issues — none of which reverses a founder-approved business decision from Sprint 3A/3B, but several of which were genuine engineering errors that would have produced an unsound or unsafe physical schema if carried forward unchanged. This report explains each correction, why it was necessary, and what changed.

Per the authorizing instructions for this pass: no executable SQL, migrations, Supabase project, dependencies, or application code were created; nothing was staged, committed, pushed, or merged; ADR-007 remains **Proposed**; ADR-004 remains **Accepted**; no founder-approved business decision was reversed — only engineering interpretations of those decisions were corrected.

> **⚠️ Partially superseded by Sprint 3B.2.** A second, narrower review pass ([`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)) found ten further cross-tenant and revision-integrity issues, several of which correct claims made in this document (marked inline below with `> **⚠️ Superseded...**` or `> **Extended in Sprint 3B.2.**` blockquotes at the relevant correction). The physical design files in [`docs/database/`](../database/) reflect the **current, Sprint 3B.2-corrected** state; this document is retained as the historical record of the Sprint 3B.1 pass and is not rewritten to match.

## How to Read the Corrections Below

Each correction states: what was wrong in Sprint 3B, why it mattered, what changed, and where. Full column/constraint detail lives in [`docs/database/`](../database/) itself — this report explains the *reasoning*, not a duplicate schema listing.

---

## Correction 1 — Immutable Snapshot Revisions

**What was wrong:** `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, and `backlog_snapshot` each had a uniqueness constraint on their natural key (office/period/source) with no way to insert a second row for the same key. This directly conflicted with the stated immutable-correction model: a real correction (a restated P&L, a re-run import) had nowhere to go except an `UPDATE` or a delete of the original row — exactly what "immutable" forbids.

**What changed:** All four tables gained `revision_number` (starts at 1, increments per correction) and `supersedes_snapshot_id` (self-referencing, pointing at the row a correction replaces). The natural-key uniqueness constraint now includes `revision_number`, so multiple revisions can coexist; a separate `UNIQUE (supersedes_snapshot_id)` constraint guarantees only one direct successor can supersede a given row. The **latest** revision is identified by `MAX(revision_number)` within a natural-key group — a plain query, not a mutable `is_current` flag, which would itself require an `UPDATE` against the previously-current row every time a new revision arrives (the exact mutation this correction exists to prevent). See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) "Immutable Revisions — Shared Pattern" and [`04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md).

> **Extended in Sprint 3B.2.** The self-referencing `supersedes_snapshot_id` FK described above only matched the same **organization** — it did not verify the predecessor shared the same Office, reporting period, or source type, meaning a snapshot could in principle have been recorded as superseding a different Office's row within the same organization. Sprint 3B.2 Correction 5 strengthened this to match the row's complete natural key, and extended the identical pattern to `metric_observation` (Correction 1). See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Corrections 1 and 5.

---

## Correction 2 — Declarative Tenant Consistency

**What was wrong:** Sprint 3B recorded the `organization_id`/`office_id` consistency problem — nothing preventing a row's `organization_id` from disagreeing with its `office_id`'s actual organization — as an **unresolved** Sprint 3C decision between a trigger, an application-layer check, or dropping the denormalization.

**What changed:** `office`, `app_user`, `employee`, `permission`, `recommendation`, `alert`, and each snapshot table now expose a composite unique key (`UNIQUE (organization_id, id)`), letting every child table replace its plain foreign key with a **composite foreign key** — `(organization_id, office_id) REFERENCES office (organization_id, id)`, and the equivalent for user references. PostgreSQL then rejects, at write time, any row whose `organization_id` disagrees with its parent's — no trigger, no application code, no possibility of silent divergence. This closes the gap **declaratively** for every relationship with a stable composite parent key. A materially smaller residual list remains for Sprint 3C: nullable-organization system-default rows (where a composite key against a specific organization isn't meaningful), `audit_event`'s deliberate polymorphic reference, and the "at least one child row exists" requirement for office-scoped Permissions (see Correction 3), which no declarative constraint can express. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Declarative Tenant Consistency."

> **Extended in Sprint 3B.2.** This correction covered header-level tables. Sprint 3B.2 Correction 2 found the identical unenforced pattern one level down, on detail and join tables this pass did not reach: `payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`, the import-lineage detail chain, `metric_observation_component`, the Scenario baseline and Recommendation evidence join tables, and `task`. It also identified a genuinely new residual category — "global-or-same-organization" references, which even a composite FK cannot express because the rule is conditional, not unconditional equality — see [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md) "Global-or-Same-Organization Reference Pattern." See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 2.

---

## Correction 3 — Fail-Closed Authorization Scope

**What was wrong:** Sprint 3B's rule — "zero `permission_office_grant` rows means organization-wide access" — inferred a *broadened* access grant from the *absence* of child records. Any bug, incomplete write, or migration error leaving an office-scoped Permission with no grant rows would silently become organization-wide access instead of failing safely. This is a fail-open pattern, and the founder's instruction is explicit that it must not exist.

**What changed:** `permission.scope_type` is now a genuinely explicit two-value field (`organization`, `office`) — `single_office`/`many_offices` distinctions were removed, since row count alone already expresses one office versus many, and `temporary` was removed as a scope value, since temporal limits (now `TIMESTAMPTZ`, not `DATE`) are independent of scope and apply to any scope type. Organization-wide access is recognized **only** when `scope_type = 'organization'` — never inferred from a missing or empty collection. A `permission_office_grant` row now carries a denormalized `scope_type` column, constrained to `'office'` and composite-FK'd back to its parent Permission's own `scope_type`, so a grant can only ever attach to an office-scoped Permission. The "at least one grant row must exist for an office-scoped Permission" requirement — which no PostgreSQL constraint can express declaratively — is documented for Sprint 3C as a deferred constraint trigger, firing at transaction commit. A full fail-closed Effective Access Evaluation Rule is now stated explicitly (disabled user, revoked grant, future start, passed end, inactive office/organization — every condition a denial, none a widening). See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md).

---

## Correction 4 — Permission Set Relationship

**What was wrong:** Sprint 3B put `security_role_id` on `permission_set` (a FK *from* Permission Set *to* Security Role), made it unique, and claimed dropping that uniqueness constraint would let several roles share one Permission Set. **This claim was relationally incorrect.** A foreign-key column holds exactly one value per row regardless of a uniqueness constraint — removing `UNIQUE` from `permission_set.security_role_id` would not let multiple roles share one Permission Set; it would let one Security Role acquire *multiple* Permission Set rows, the opposite of the stated intent.

**What changed:** The relationship direction is reversed. `permission_set` now has its own identity (`id`, `name`, `status`) with no reference back to `security_role`; `security_role.permission_set_id` is the foreign key, pointing the other way. This is the relationally correct direction for "several roles can reference the same Permission Set later" — any number of `security_role` rows can independently set `permission_set_id` to the same value, a genuine many-role-to-one-Permission-Set capability available without a schema change. See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md).

> **Extended in Sprint 3B.2.** The relationship direction fixed here was correct, but `permission_set` still had no concept of tenant ownership at all — every Permission Set was implicitly global, with no way for an organization to define its own custom capability composition without exposing it to (or being exposed to) every other organization. Sprint 3B.2 Correction 3 added a nullable `permission_set.organization_id` and the accompanying Global-or-Same-Organization Reference Pattern trigger requirement. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 3.

---

## Correction 5 — Business-Rule Conditions

**What was wrong:** A single `threshold_value`/`threshold_operator`/`threshold_unit` column set on `business_rule_version` cannot represent BR-001, which has four independent numeric triggers (payroll %, lab expense %, overtime cost, backlog count), let alone any future rule with more than one condition.

**What changed:** `business_rule_condition` is a new table, one row per independent condition within a rule version, each with its own condition code, type (numeric/qualitative/missing-data/stale-data/other), optional Metric Definition Version reference, operator, threshold value/unit, enabled flag, display order, and human-readable explanation. BR-001's global default version now carries exactly four condition rows. `alert` references the exact `business_rule_condition` that fired, not the broad parent rule version. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

---

## Correction 6 — Metric Reproducibility and Components

**What was wrong:** `reporting_grain` and `null_zero_behavior` lived on `metric_definition` (never-changing identity), even though both are calculation-sensitive properties that could legitimately change between versions. Separately, `metric_observation` assumed exactly one numerator and one denominator per observation, which does not hold for comparison metrics or multi-input calculations.

**What changed:** `reporting_grain` and `null_zero_behavior` moved to `metric_definition_version`, alongside new `calculation_key` and `implementation_version` columns identifying exactly which deterministic implementation produced a given observation (no executable formula code is ever stored). `metric_observation`'s `numerator_value`/`denominator_value` columns were removed in favor of `metric_observation_component` — an arbitrary number of typed rows per observation (numerator, denominator, current value, comparison value, input, adjustment, or other), each optionally citing the exact snapshot it came from via a typed nullable FK (enforced to at most one via `CHECK (num_nonnulls(...) <= 1)`). This is strictly more precise than Sprint 3B's observation-level typed joins, which recorded *which snapshot types* an observation cited but not *which component came from which snapshot*. A new uniqueness constraint on `metric_observation` (`metric_definition_version_id`, `office_id`, `reporting_period_start`, `reporting_period_end`) enforces reuse of an existing durable observation rather than silently persisting a duplicate. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

> **⚠️ Superseded in part by Sprint 3B.2.** The uniqueness constraint described in the last sentence above was itself found to be incorrect — it blocked a legitimate second observation whenever a source snapshot was corrected without the metric's own calculation version changing. Sprint 3B.2 Correction 1 replaced it with an `evaluation_fingerprint`-based constraint plus a `revision_number`/`supersedes_metric_observation_id` pair, mirroring the snapshot revision pattern. `metric_observation_component`'s typed snapshot references are also now organization-**and**-office matched (Sprint 3B.2 Correction 2), not merely typed. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Corrections 1 and 2.

---

## Correction 7 — Fully Relational Import Lineage

**What was wrong:** `import_normalized_value.target_table`/`target_record_id` was a soft, non-FK reference to whichever snapshot row a normalized value eventually fed into, justified by "the normalized value is created before its target exists." Creation order does not justify a soft reference — the normalized value can be created first with no target reference, and a separate link-table row inserted afterward, once the target exists and a real FK is satisfiable.

**What changed:** `target_table`/`target_record_id` are removed entirely. Four new typed link tables (`import_normalized_value_revenue_snapshot` and three siblings) connect a normalized value to its header snapshot, populated only once that header row exists. Separately, `payroll_snapshot_line_item`, `labor_model_staffing_measure`, and `backlog_stage_count` now carry a **direct** `import_source_row_id` foreign key rather than going through `import_normalized_value` at all — each is produced by exactly one source row, so the indirection added no traceability value. A new `import_validation_issue` table supports multiple distinct problems per validation result (field, severity, issue code, message). New uniqueness constraints close remaining gaps: section position within a job, row number within a section, organization override version numbers, and one normalized value per canonical field per source row. Every import-lineage arrow is now an enforced foreign key, with no remaining exception. See [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md).

> **Extended in Sprint 3B.2.** "Every import-lineage arrow is an enforced foreign key" was true in the sense of *table existence*, but several of these FKs did not yet enforce *organization ownership* — `import_source_section`, `import_source_row`, and `import_normalized_value` all lacked their own `organization_id`, so a plain FK could not by itself guarantee two linked rows shared the same organization. Sprint 3B.2 Correction 2 added `organization_id` to all three and converted their FKs to composite (organization-matched) FKs. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 2.

---

## Correction 8 — Alert Lifecycle Consistency

**What was wrong:** Sprint 3B classified `alert` as immutable while placing mutable `status`, `dismissal_reason`, `dismissed_by_user_id`, and `dismissed_at` columns directly on the `alert` row — an internal contradiction.

**What changed:** `alert` is now a genuinely immutable core (exact rule condition, metric observation, reporting period, triggered value, creation time, office/organization). A new `alert_lifecycle_event` table records each transition (open/acknowledged/dismissed) as its own row, with a `sequence_number` unique within its parent Alert. Current state is always derived from the latest event by `sequence_number`, never a mutable column — the same pattern already used for `recommendation`. Valid transitions (open→acknowledged, open→dismissed, acknowledged→dismissed, never back to open) are documented for a Sprint 3C trigger. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) and [`05-temporal-versioning-and-snapshots.md`](../database/05-temporal-versioning-and-snapshots.md).

> **⚠️ Superseded in part by Sprint 3B.2.** Requiring `metric_observation_id NOT NULL` on the immutable `alert` core (still true as stated above) turned out to be too strict: a `business_rule_condition` whose `condition_type` is `qualitative`, `missing_data`, or `stale_data` legitimately has no Metric Observation to cite. Sprint 3B.2 Correction 6 introduced `condition_evaluation`/`condition_evaluation_evidence` and moved `business_rule_condition_id`, `metric_observation_id` (now nullable), `reporting_period_start`/`end`, and `triggered_value` off `alert` entirely, onto `condition_evaluation`. `alert_lifecycle_event` itself is unaffected. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 6.

---

## Correction 9 — Backlog Totals and Unresolved Inclusion

**What was wrong:** `production_stage.is_included_in_total` defaulted to `true` generally and `false` specifically for Resets/Remakes — an invented business assumption, since OQ-051 (whether Resets/Remakes count toward the total) is explicitly unresolved. Separately, `backlog_snapshot.total_case_count` silently meant either an imported fact or a derived calculation depending on the row, with no way to tell which from the column alone.

**What changed:** `is_included_in_total` is now nullable with **no default for any stage** — `NULL` means genuinely unresolved, for every stage, until an explicit decision is recorded. `total_case_count` is replaced by four fields: `source_provided_total_case_count` (imported fact, when present), `derived_total_case_count` (computed from included stages, `NULL` whenever any relevant stage's inclusion flag is unresolved), `displayed_total_basis` (which one, if either, is currently trustworthy), and `total_discrepancy_amount` (when both exist and disagree). No total silently implies an unresolved stage-inclusion decision. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

---

## Correction 10 — Employee Office Assignment Source of Truth

**What was wrong:** `employee.office_id` (mutable "current office") and `employee_office_assignment` (historical assignment log) both claimed to represent an Employee's Office, with no stated authority between them — an ambiguity, not just a documentation gap.

**What changed:** `employee.office_id` is removed entirely. An Employee's current Office is now derived from the `employee_office_assignment` row with `effective_end_date IS NULL` — one authoritative source. No separate `home_office_id`/`primary_office_id` was invented, since no repository document requires a distinct "home office" concept beyond "current office." `employee_office_assignment` gained a non-overlap `EXCLUDE` constraint (via `btree_gist`) preventing two simultaneously-active assignments for the same Employee, a same-organization composite FK back to both `employee` and `office`, and — because it is now load-bearing rather than a historical supplement — it is upgraded from Sprint 3B's ⚠️ optional judgment call to ✅ MVP-required; Sprint 3B's claim that it "can be dropped without affecting any other table's design" is corrected and withdrawn. `employee.linked_app_user_id` also gained a same-organization composite FK and a partial unique index enforcing at-most-one-Employee-per-User. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

> **⚠️ Superseded in part by Sprint 3B.2.** This document's own description of `employee_office_assignment` as "append-only" is inaccurate: an append-only table never updates a row, but this design requires updating the prior row's `effective_end_date` on every transfer. Sprint 3B.2 Correction 8 corrected the description to "effective-dated, historically preserved" (an active row may be updated exactly once, to close it) — the physical design was already correct; only the "append-only" label was wrong. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 8.

---

## Correction 11 — Scenario Parameter Definitions and Typed Values

**What was wrong:** `scenario_input`/`scenario_output` used free-text `input_key`/`output_key` columns with no versioned definition, unit, data type, or required/optional state to validate against.

**What changed:** New `scenario_parameter_definition`/`scenario_output_definition` tables, tied to `scenario_definition_version`, define each input/output's key, display name, data type, unit, required state, validation notes, and display order. `scenario_input`/`scenario_output` now reference these definitions instead of a free-text key, with five typed value columns (numeric, text, boolean, date, reference) and a genuine same-row `CHECK (num_nonnulls(...) = 1)` requiring exactly one to be populated. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

> **⚠️ Superseded in part by Sprint 3B.2.** The `reference` typed value column above (`value_reference_id`) was itself an unrestricted `UUID` with no identifiable target table — the same class of problem this correction otherwise fixed. Sprint 3B.2 Correction 9 replaced it with two typed, composite-FK-enforced columns (`value_reference_job_role_id`, `value_reference_office_id`), the only two reference target types with concrete precedent anywhere in the repository. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 9.

---

## Correction 12 — Recommendation and Alert Lifecycle Ordering

**What was wrong:** `recommendation_lifecycle_event` (and, after Correction 8, `alert_lifecycle_event`) relied on `occurred_at` alone to determine the latest event — a timestamp is not guaranteed to be a reliable total order across events, especially under clock skew or fine-grained timing.

**What changed:** Both tables now carry a `sequence_number`, monotonic and unique within their parent (`recommendation_id`/`alert_id`). Current state is derived from `MAX(sequence_number)`, never timestamp comparison alone. Both tables' initial event (`generated`/`open`) must be created atomically, in the same transaction as their parent row — a Recommendation or Alert must never exist, even momentarily, with zero lifecycle events. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md).

---

## Correction 13 — Task History

**What was wrong:** `task_status_history` was listed as an "optional" MVP addition despite Task's own status vocabulary and lifecycle design being unresolved (OQ-042) — a mismatch between the table's readiness and its inclusion status.

**What changed:** `task_status_history` is removed from the MVP table inventory entirely and moved to [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md), pending OQ-042. `task.status` remains a plain mutable column, now explicitly labeled **provisional**. Until a dedicated lifecycle table is approved, `audit_event` is the interim mechanism for recording material Task changes.

---

## Correction 14 — ERD Completeness

**What was wrong:** Several typed join tables (Recommendation Evidence, Scenario baseline references, Metric Observation source citations) were drawn as direct annotated lines ("(typed join)") rather than as actual boxes — readable, but not physically accurate to what PostgreSQL will actually create.

**What changed:** [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) gained a fifth section showing every join/link table as an explicit box: `recommendation_evidence_alert`, `recommendation_evidence_metric_observation`, the four `scenario_run_*_snapshot` tables, `metric_observation_component`'s four typed snapshot references, and the four new `import_normalized_value_*_snapshot` link tables. Sections 1–4 were also updated throughout to reflect every other correction (business_rule_condition, alert_lifecycle_event, scenario parameter/output definitions, the corrected Permission Set FK direction, the removed `employee.office_id` relationship, the new snapshot supersession self-references).

---

## Correction 15 — Documentation Consistency

Several smaller, independent fixes:

- **JSONB count corrected:** Sprint 3B's "exactly three places" undercounted — `organization_import_profile_override.mapping_definition` is also `JSONB` and was omitted from the original list. The exact count is now stated: **five columns, four tables** ([`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md)).
- **`git diff --check` genuinely fixed, not dismissed:** Sprint 3B's report called a `docs/data/01-metrics-dictionary.md` trailing-whitespace warning a "false positive" (a pre-existing Markdown hard-break convention). That line was, in fact, newly added *in* Sprint 3B, so it was this sprint's own addition triggering the warning — not a pre-existing, out-of-scope convention. It has been changed from a trailing-double-space hard break to an explicit `<br>` tag. `git diff --check` now exits `0` with no whitespace-error output (the accompanying `LF will be replaced by CRLF` lines are a separate, harmless Windows line-ending notice unrelated to `--check`'s actual pass/fail signal).
- **`app_user.email` clarified:** it is a **synchronized cache** of `auth.users.email`, not a duplicate source of truth — `auth.users` remains authoritative. The sync mechanism (a Postgres trigger on `auth.users`, or an application-layer sync) and the privacy implication (this column is exposed to `app_user`'s own RLS surface, not confined to Supabase's `auth` schema controls) are now both documented explicitly.
- **Real database-level cross-field constraints added where possible**, rather than leaving everything as an application-layer note: the composite-FK pattern (Correction 2), the `permission_office_grant` scope-consistency composite FK (Correction 3), and two genuine `CHECK` constraints using PostgreSQL's `num_nonnulls()` (Corrections 6 and 11) replace what would otherwise have been purely documentation-level invariants.
- **Non-overlapping effective periods:** `employee_office_assignment`, `production_stage`, `business_rule_version`, `metric_definition_version`, and `scenario_definition_version` now use `EXCLUDE USING gist (...)` constraints (via the `btree_gist` extension) instead of a plain `UNIQUE` on a version number, which never actually prevented two overlapping date ranges from coexisting.

  > **⚠️ Superseded by Sprint 3B.2.** This bullet's claim was itself incomplete for the two *nullable-`organization_id`* tables in this list, `production_stage` and `business_rule_version`: a single `EXCLUDE` constraint including `organization_id WITH =` does **not** catch two overlapping system-default (`organization_id IS NULL`) rows, since PostgreSQL treats each `NULL` as distinct from every other `NULL` — the opposite of the protection this bullet claimed. Sprint 3B.2 Correction 4 fixed both tables with two separate `EXCLUDE` constraints (one per nullability scope). `metric_definition_version` and `scenario_definition_version` have no `organization_id` column and were never affected; `employee_office_assignment`'s `EXCLUDE` has no `organization_id` in its predicate and was also unaffected. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) Correction 4.

- **System-default vs. organization-override precedence** is now stated once, explicitly, in [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md): when both a system-default and an organization-specific row are simultaneously effective, the organization-specific row wins.
- **Exact table count stated, not approximated:** Sprint 3B's report said "~53 tables"; the actual count was 54. After this correction pass, the exact count was **59** — the count is now **61** after Sprint 3B.2 (see [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)) — see [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) for the current per-domain breakdown.
- **Mermaid/FK agreement:** the ERD rewrite (Correction 14) was cross-checked against every table and FK described in `docs/database/` as of this correction pass.
- **False "no downstream impact" claim removed:** `employee_office_assignment`'s Sprint 3B description claiming it "can be dropped without affecting any other table's design" is corrected and withdrawn (Correction 10) — it is now load-bearing.

---

## Required Review of the Five Original Judgment Calls

1. **Typed joins over a polymorphic reference: accepted.** This design choice was sound and is retained throughout, including in every new table this correction pass introduces (`metric_observation_component`'s typed snapshot references, the new `import_normalized_value_*_snapshot` link tables).
2. **Metric Observation persistence approach: accepted, with the durable-evaluation modifications in Correction 6.** Persisting only at Evidence-citation time (Alert, Recommendation, saved Scenario, scheduled evaluation, export) — never for a transient dashboard render — is now the settled design, no longer flagged as an open judgment call requiring separate confirmation. The single numerator/denominator assumption it originally carried has been replaced by `metric_observation_component`.
3. **Employee Office Assignment: retained, and made authoritative.** Not merely kept as an optional addition — Correction 10 makes it the sole source of truth for an Employee's current Office, removing the redundant `employee.office_id` column entirely.
4. **Task Status History: deferred.** Correction 13 formally moves it out of the MVP table inventory into Deferred Entities, resolving the original "optional" flag in the direction of exclusion rather than inclusion, pending OQ-042.
5. **SecurityRole–Permission Set strict 1:1 as originally modeled: rejected and corrected.** The 1:1 cardinality itself is not rejected as a starting point (each of the three MVP roles still gets its own dedicated Permission Set) — what is rejected is the **incorrect relational claim and FK direction** Sprint 3B used to describe it. Correction 4 reverses the FK so that a future many-role-to-one-Permission-Set need is actually satisfiable without a schema change, which Sprint 3B's original direction could not have supported no matter how its uniqueness constraint was adjusted.
6. **Organization ID denormalization: retained, with composite foreign-key enforcement.** The denormalization itself is unchanged and still judged worthwhile for RLS simplicity — what changed is that Correction 2 closes its consistency risk declaratively instead of leaving it as an open Sprint 3C question.

---

## Final Checks

1. **Repository root and branch reverified:** `C:\Users\david\OneDrive\Desktop\LabPulse-Remote-Inspection`, branch `docs/sprint-3b-physical-model` — confirmed at both the start and end of this correction pass.
2. **Nothing staged:** `git diff --cached --stat` empty throughout.
3. **No commit or push occurred:** `git log --oneline --decorate --all` shows no new commit beyond the existing root commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e`; no push was performed.
4. **No SQL or migration file exists:** confirmed — this correction pass added and edited only Markdown documentation.
5. **ADR-007 remains Proposed:** confirmed — only its Risks/Consequences sections were amended; its Status field was not changed.
6. **ADR-004 remains Accepted:** confirmed — untouched by this correction pass.
7. **No founder-approved decision was reversed:** every correction is an engineering-interpretation fix (a relational cardinality error, a fail-open inference, an immutability/uniqueness conflict, an invented default) — none changes Office terminology, region-as-metadata, the Labor%/Payroll% separation, the four approved thresholds, franchise exclusion, deferred snapshot types, deferred Notifications, or the archive-not-delete default.
8. **Every office-owned table has a documented same-Organization enforcement path:** via the composite-FK pattern in [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Declarative Tenant Consistency," with the small residual list of genuine exceptions explicitly named.
9. **Corrections coexist with RLS design with no known fail-open condition:** the Effective Access Evaluation Rule in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) lists only denial conditions; no branch of the rule widens access when a check is ambiguous or a related row is missing.
10. **Snapshots support immutable corrections:** confirmed via Correction 1's revision/supersession pattern on all four snapshot header tables.
11. **Exact source-row lineage is enforceable:** confirmed via Correction 7 — every lineage arrow, including the previously-soft normalized-value target, is now a real foreign key.
12. **BR-001 can be represented without stuffing several thresholds into one row:** confirmed via Correction 5's `business_rule_condition` table (four independent condition rows for BR-001's global default version).
13. **No unresolved backlog inclusion value was seeded:** confirmed via Correction 9 — `production_stage.is_included_in_total` has no default for any stage.
14. **`git diff --check` returns no warnings:** confirmed — exit code `0`, no whitespace-error output, after the genuine fix in Correction 15 (not a dismissal).
15. **All relative Markdown links validated:** every new and changed cross-reference in the files touched by this correction pass resolves to an existing path within the repository.
16. **`git status --short`:** all fifteen files modified in Sprint 3B (from before this pass) remain modified; the four Sprint 3B untracked entries remain untracked (with `docs/database/` now containing eleven files instead of ten — this new report is a twelfth new top-level file, `docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`). No file was staged, and no commit or push occurred.

## Related Documents

- [Sprint 3B Report](SPRINT_3B_REPORT.md)
- [ADR-007: Proposed Physical Data Model](../decisions/ADR-007-proposed-physical-data-model.md)
- [Database Design Overview](../database/README.md)
- [Table Catalog](../database/02-table-catalog.md)
- [Proposed Physical ERD](../architecture/erd-physical-proposed.md)
