# Schema Review Checklist

**Version:** 0.5 (Sprint 3B.4A corrections applied — see [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md); Sprint 3B.1, 3B.2, 3B.3, and 3B.4 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

A checklist for Sprint 3D's independent design review of this proposal, and for any founder review that happens before Sprint 3C begins. Each item should be answered explicitly, not assumed.

## Terminology and Authorization Boundaries

- [ ] No table, column, or foreign key named `location` or `location_id` appears anywhere in `docs/database/`.
- [ ] `office_id` is used consistently as the office foreign-key name across every table.
- [ ] `office.region` is a plain descriptive column with no foreign key to any authorization table, and no RLS-dependency note anywhere treats it as a scoping boundary.
- [ ] No capability check, RLS policy note, or authorization dependency described anywhere in `docs/database/` references a SecurityRole by literal name (e.g., "if role = 'Operations Manager'"); every authorization dependency is described in terms of Capabilities.
- [ ] The `security_role` MVP seed list contains exactly the three founder-approved roles (Organization Administrator, Operations Manager, Read-Only Viewer); the six expanded candidates are documented as deferred, not seeded.
- [ ] A role named "Regional Manager" is never treated as creating region-based authorization anywhere in `docs/database/`; its access, if ever added, flows entirely through Capabilities and Office/Organization-scoped `permission_office_grant` rows.

## Financial and Metric Integrity

- [ ] Every currency column is `NUMERIC(14,2)`; no `REAL`, `DOUBLE PRECISION`, or `FLOAT` appears anywhere in `03-column-and-type-catalog.md`.
- [ ] Every percentage column is `NUMERIC(7,4)` or equivalent fixed-precision type.
- [ ] `labor_model_snapshot.labor_percentage_of_revenue` and `payroll_snapshot.qualifying_payroll_expense`/Payroll Percentage are stored as separate values with no column or view that silently merges them.
- [ ] `metric_observation` preserves its metric version and reporting period, and every contributing value is preserved as a `metric_observation_component` row, not a bare computed percentage alone.
- [ ] `business_rule_condition` stores the four approved BR-001 thresholds (8.0%, 10.8%, $500, 20 cases) as configurable, versioned, organization-overridable data — not as constants anywhere in schema documentation, and not stuffed into a single `business_rule_version` row.
- [ ] No legacy threshold value (Lab Expense >20%/>25%, Personnel >15%/>20%, Backlog >50/>100) appears as seed data, default, or example anywhere in `docs/database/`.
- [ ] `alert` references the exact `business_rule_condition` that triggered it (via `condition_evaluation`, Sprint 3B.2 Correction 6), not merely the parent `business_rule_version`.

## Snapshot, Versioning, and Lifecycle Discipline

- [ ] No snapshot table has an `UPDATE`-oriented column set (no `updated_at` on `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`, `alert`, `condition_evaluation`, `recommendation`, `metric_observation`, `scenario_run`).
- [ ] Every canonical snapshot table's uniqueness constraint includes `revision_number`, so a correction is insertable as a new row rather than blocked or requiring an `UPDATE`; `supersedes_snapshot_id` is unique (only one direct successor per superseded row).
- [ ] No canonical snapshot table uses a mutable `is_current` flag; the latest revision is identified by `MAX(revision_number)` within its natural key.
- [ ] `recommendation` and `alert` both have no mutable `status` column; current state for each is derivable only from its respective append-only lifecycle event table, using `sequence_number` (not `occurred_at` alone) to determine the latest event.
- [ ] Every `*_version` table has `effective_start_date`/`effective_end_date`, and every version/configuration table with meaningfully overlapping-risk ranges (`employee_office_assignment`, `production_stage`, `business_rule_version`, `metric_definition_version`, `scenario_definition_version`) uses a non-overlap `EXCLUDE` constraint, not merely a `UNIQUE` version number.
- [ ] A documented precedence rule exists for every system-default-vs-organization-override table pair (organization-specific wins when both are effective).

## Deferred Scope

- [ ] No `production_snapshot`, `quality_snapshot`, `career_grid_snapshot`, or `recruiting_snapshot` table appears anywhere in `docs/database/`.
- [ ] No `notification`, notification-delivery, or read-receipt table appears anywhere in `docs/database/`.
- [ ] No `franchise` table or organization-to-organization grouping structure appears anywhere in `docs/database/`.
- [ ] No AI-specific state-machine or credential table appears anywhere in `docs/database/`.
- [ ] `task_status_history` does not appear in `02-table-catalog.md`'s MVP inventory — only in `09-deferred-entities.md`.

## Structural Safety

- [ ] No executable `CREATE TABLE`, `CREATE POLICY`, or other executable SQL statement appears anywhere in `docs/database/` or `docs/architecture/erd-physical-proposed.md` — constraint *shapes* (e.g. an `EXCLUDE USING gist (...)` clause, a `CHECK (...)` clause) are documented as illustrative notation within table cells and prose, consistent with how ordinary `CHECK` constraints were already documented in Sprint 3B, and are not runnable as standalone statements.
- [ ] No migration file exists anywhere in the repository as a result of this sprint.
- [ ] No table carries an office-array or organization-array column where a normalized join table (`permission_office_grant` and similar) would serve instead.
- [ ] Every foreign key's `ON DELETE` behavior is documented (`RESTRICT` by default); no undocumented `CASCADE` exists.
- [ ] Every `JSONB` column's use is individually justified, with an exact count (five columns, four tables) stated in [`01-physical-model-principles.md`](01-physical-model-principles.md); no `JSONB` column stands in for an otherwise-normalizable canonical fact.
- [ ] `import_normalized_value` no longer has a `target_table`/`target_record_id` soft reference; every import-lineage arrow is a real, enforced foreign key.
- [ ] No table or claim in `docs/database/` states that a table "can be dropped with no downstream impact" while another document depends on it — `employee_office_assignment`'s Sprint 3B "no downstream impact" claim has been corrected and withdrawn (Correction 10).

## Data and Secrets Hygiene

- [ ] No real office name, real Office ID, real region name, real employee name, or real financial figure appears anywhere in `docs/database/` (every example is synthetic or a bare placeholder).
- [ ] No credential, API key, database password, or connection string appears anywhere in `docs/database/`.
- [ ] No fake-but-plausible account, URL, or external-service detail was introduced as a stand-in for a real one.

## Authorization Scope Safety

- [ ] `permission.scope_type` has exactly two values (`organization`, `office`); no scope value is inferred from the absence of child rows.
- [ ] A `permission_office_grant` row can only exist for a Permission whose `scope_type = 'office'` (enforced via the composite FK to `permission (id, scope_type)` plus the `CHECK (scope_type = 'office')` on the grant's own denormalized copy).
- [ ] The Effective Access Evaluation Rule in [`07-authorization-data-model.md`](07-authorization-data-model.md) has no branch that widens access when a related row is missing or a check is ambiguous — every listed condition is a denial, never a grant.
- [ ] Permission's effective-dating columns are `TIMESTAMPTZ`, not `DATE`.

## Cross-Tenant and Revision Integrity (Sprint 3B.2, new)

- [ ] Every table with two or more tenant-owned references (`payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`, the four `import_normalized_value_*_snapshot` tables, `metric_observation_component`, the four `scenario_run_*_snapshot` tables, `scenario_input`, `scenario_output`, `recommendation_evidence_alert`, `recommendation_evidence_metric_observation`, `task`) carries `organization_id` (and `office_id` where relevant) with a composite FK to its referenced parent(s) — no row can connect records from different Organizations, and, where named, different Offices.
- [ ] Every reference from a tenant-owned row into a nullable-`organization_id` lookup table (`job_role`, `security_role`, `permission_set`, `production_stage`, `business_rule_version`) is documented as either an intentional global-lookup reference or a Global-or-Same-Organization Reference requiring a Sprint 3C trigger — never a plain, unenforced FK with no stated rationale.
- [ ] `security_role.permission_set_id` and `permission.security_role_id` cannot, once the Sprint 3C trigger is implemented, resolve to another Organization's custom row.
- [ ] `production_stage` and `business_rule_version` each use **two** `EXCLUDE` constraints (one for `organization_id IS NULL`, one for `organization_id IS NOT NULL`), not one — a single constraint including a nullable `organization_id WITH =` does not catch two overlapping system-default rows.
- [ ] Every snapshot's (and `metric_observation`'s) self-referencing `supersedes_*_id` composite FK matches the row's **complete natural key** (organization, office, period, source type where applicable), not merely organization.
- [ ] `metric_observation`'s uniqueness constraint includes `evaluation_fingerprint`, so a corrected re-evaluation (different inputs) is never blocked by the same constraint that blocks a genuine duplicate (identical inputs).
- [ ] `alert.metric_observation_id` (now on `condition_evaluation`) is nullable, and every `business_rule_condition.condition_type` (`numeric`, `qualitative`, `missing_data`, `stale_data`, `other`) can produce an explainable Alert.
- [ ] `recommendation.supersedes_recommendation_id` is populated on the newer row (not `superseded_by_recommendation_id` on the older, already-immutable row).
- [ ] `employee_office_assignment` is described as effective-dated/historically-preserved (one permitted closure mutation), not "append-only."
- [ ] `scenario_input`/`scenario_output` have no unrestricted, untyped `value_reference_id` column.
- [ ] The physical ERD draws no relationship line for which no real foreign key or join table exists (the Sprint 3B.1 `PERMISSION ||--o{ PERMISSION_SET_CAPABILITY` shortcut has been removed).
- [ ] The exact MVP table count (61) agrees across `02-table-catalog.md`, `docs/database/README.md`, the ERD's own notes, ADR-007, and every Sprint 3B/3B.1/3B.2/3B.3/3B.4/3B.4A report.

## Composite-Key and Row-Shape Completeness (Sprint 3B.3, new)

- [ ] Every composite foreign key documented in `04-keys-relationships-and-constraints.md` references a column list actually backed by a matching `PRIMARY KEY` or `UNIQUE` constraint on the parent — verified in full via the "Composite Foreign Key Verification Matrix."
- [ ] `metric_observation` and `condition_evaluation` each carry `UNIQUE (organization_id, id)` and `UNIQUE (organization_id, office_id, id)`, closing the two gaps where a composite FK previously pointed at a non-existent parent key.
- [ ] `condition_evaluation_evidence` carries its own `office_id`, and its composite FKs to `condition_evaluation` and the four snapshot types are organization-**and**-office matched, not organization-only.
- [ ] `condition_evaluation_evidence`'s `evidence_role` is tied to which reference columns must be populated by a same-row `CHECK` — no row can pair a mismatched role/reference combination, and no row can be entirely empty (no reference, no notes).
- [ ] `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, and `backlog_snapshot`'s `import_job_id` are same-organization-**and**-same-Import-Job composite FKs, not plain FKs; `import_job.supersedes_import_job_id` is a same-organization-**and**-same-base-Import-Profile composite self-FK (**corrected, Sprint 3B.4A** — previously same-organization-only, which permitted an unrelated profile type into the same supersession chain).
- [ ] `import_profile_version_id` is recorded exactly once (on `import_job`), not independently on any snapshot header or on `import_normalized_value`; `import_job.import_profile_id` and `import_job.import_profile_version_id` agree via a composite FK to `import_profile_version (import_profile_id, id)` (**new, Sprint 3B.4A**).
- [ ] `backlog_snapshot` has a genuine same-row `CHECK` enforcing "imported XOR manually-entered" between `import_job_id` and `manual_entry_user_id`, not merely a documentation convention.
- [ ] Each of the four canonical snapshot headers' producing Import Job used a Profile Version whose declared permitted-target set actually includes that header's own canonical target code — named as a Sprint 3C trigger requirement, not assumed (**new, Sprint 3B.4A**); a manually-entered `backlog_snapshot` is exempt.
- [ ] `scenario_input`/`scenario_output` cannot cite a Parameter/Output Definition belonging to a different Scenario Definition Version than their own parent Scenario Run used — verified via the `scenario_definition_version_id` composite-FK chain, not merely a same-Run or same-global-table check individually.
- [ ] `import_validation_result` and `import_validation_issue` both carry `organization_id` and composite FKs to their respective parents; `import_validation_issue.import_normalized_value_id`, when populated, is constrained to the same source row as its parent Validation Result, not merely the same organization.
- [ ] `permission`'s effective-date and revocation ordering (`effective_end_at > effective_start_at`; `revoked_at >= granted_at`) are real `CHECK` constraints, not documentation-only conventions.
- [ ] `import_normalized_value` has a `CHECK` requiring exactly one of `canonical_value_text`/`canonical_value_numeric`; `business_rule_condition` has a `CHECK` requiring numeric-only fields exclusively for `condition_type = 'numeric'`.
- [ ] Every lifecycle `sequence_number`, every `*_version.version_number`, and every snapshot/metric-observation `revision_number` has a `CHECK (>= 1)`; every `display_order` has a `CHECK (>= 0)`.
- [ ] `alert` has `UNIQUE (condition_evaluation_id)` — no more than one Alert may be generated from the same immutable Condition Evaluation.

## Open Items Sprint 3C Must Resolve Before Writing RLS Policies

- [ ] Whether Permission's `effective_end_at` is enforced automatically (scheduled job) or via a real-time check, per [`07-authorization-data-model.md`](07-authorization-data-model.md).
- [ ] The deferred constraint trigger enforcing "at least one `permission_office_grant` row for every `scope_type = 'office'` Permission" (existence of at least one related row cannot be a declarative PostgreSQL constraint).
- [ ] The trigger validating Alert and Recommendation lifecycle-event transitions against their documented allow-lists.
- [ ] Whether to add a `BEFORE INSERT/UPDATE` trigger as defense-in-depth on top of the composite-FK tenant-consistency pattern (Correction 2) — not required for correctness, since the composite FKs already enforce it declaratively, but may still be evaluated for additional safety.
- [ ] **(New, Sprint 3B.2)** The Global-or-Same-Organization Reference Pattern trigger, at all eight named sites (see [`01-physical-model-principles.md`](01-physical-model-principles.md)).
- [ ] **(New, Sprint 3B.2)** The predecessor-exactness trigger for snapshot and Metric Observation revisions (`revision_number` must equal predecessor's `+ 1`).
- [ ] **(New, Sprint 3B.2)** The Recommendation supersession acyclicity trigger (`generated_at` strictly earlier than the superseding row's).
- [ ] **(New, Sprint 3B.2)** The `employee_office_assignment` exactly-once-closure trigger.
- [ ] **(New, Sprint 3B.3)** The Scenario value/definition type-agreement trigger — the populated value column on `scenario_input`/`scenario_output` must match its referenced definition's `data_type` and, when applicable, `reference_target_type`.
- [ ] **(New, Sprint 3B.3)** The `condition_evaluation` numeric/non-numeric consistency trigger — `metric_observation_id`/`numeric_triggered_value` must be jointly present for `numeric` conditions and jointly absent otherwise, cross-referencing the parent `business_rule_condition.condition_type`.

## Related Documents

- [Table Catalog](02-table-catalog.md)
- [Keys, Relationships, and Constraints](04-keys-relationships-and-constraints.md)
- [Sprint 3B Report](../development/SPRINT_3B_REPORT.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Sprint 3B.4 Import Provenance Closure](../development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md)
- [Sprint 3B.4A Final Reconciliation](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md)
