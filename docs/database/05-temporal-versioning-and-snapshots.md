# Temporal Behavior, Versioning, and Snapshot Patterns

**Version:** 0.4 (Sprint 3B.3 corrections applied — see [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md); Sprint 3B.1 and 3B.2 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Show how the logical lifecycle framework in [`docs/data-model/02-data-lifecycle.md`](../data-model/02-data-lifecycle.md), [`03-versioning-strategy.md`](../data-model/03-versioning-strategy.md), and [`entity-lifecycle.md`](../data-model/entity-lifecycle.md) is physically represented in this proposal's tables.

## Three Physical Patterns, Matching Three Logical Lifecycle Types

### 1. Versioned Definitions → `<entity>` + `<entity>_version` table pairs

Applies to: `import_profile`/`import_profile_version`, `business_rule`/`business_rule_version`, `metric_definition`/`metric_definition_version`, `scenario_definition`/`scenario_definition_version`.

Pattern:

- The parent table (`business_rule`) holds identity that never changes (`code`, `name`).
- The version table (`business_rule_version`) holds everything that can change over time, with `version_number`, `effective_start_date`, and `effective_end_date`.
- A new version is **always an `INSERT`**, never an `UPDATE` of an existing version row's substantive fields — per [`docs/data-model/03-versioning-strategy.md`](../data-model/03-versioning-strategy.md) Rule 1 ("a version is never edited in place").
- Every record produced under a version (an `alert` under a `business_rule_version`, a `revenue_snapshot` under an `import_profile_version`) stores a foreign key to that specific version row, so "what rule was in effect when this fired" is always answerable exactly, per Rule 5 (effective dating).

### 2. Immutable Point-in-Time Facts → Insert-Only Tables, No `UPDATE` Path, Corrections Are New Rows

Applies to: every canonical snapshot (`revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot` and their detail tables), the immutable core of `alert` and `condition_evaluation` (Sprint 3B.2 Correction 6), `metric_observation`, `metric_observation_component`, `recommendation`, `scenario_run`.

These tables have **no `updated_at` column** (see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md)) and no application code path is expected to issue an `UPDATE` against their substantive columns after creation, per [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md) — a snapshot is "Created" then "Immutable," never "Updated."

**Sprint 3B.1 Correction 1 — the revision pattern, corrected; Sprint 3B.2 Correction 1 and Correction 5 — strengthened and extended.** Sprint 3B's uniqueness constraints on the four canonical snapshot tables (one row per office/period/source) directly conflicted with this immutability model: a real correction (a restated P&L, a re-run import) had nowhere to go, because inserting a second row for the same natural key would violate the constraint, and the only alternative would have been to `UPDATE` or delete the original — exactly what immutability forbids. Each of the four snapshot tables carries `revision_number` and `supersedes_snapshot_id`, and the natural-key uniqueness constraint includes `revision_number`, so a correction is always insertable as a new row with the next revision number, `supersedes_snapshot_id` pointing at the row it corrects. The row being corrected is never updated or deleted. **Sprint 3B.2 Correction 5** strengthened the self-referencing FK from an organization-only match to the row's **complete natural key** (organization, office, period, source type where applicable) — Sprint 3B.1's organization-only version would have permitted a snapshot to be recorded as superseding a *different Office's* row within the same organization. **Sprint 3B.2 Correction 1** extends this identical pattern to `metric_observation` (`evaluation_fingerprint`, `revision_number`, `supersedes_metric_observation_id`), correcting a uniqueness constraint that had accidentally re-created the exact problem this pattern exists to solve — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) "Immutable Revisions — Shared Pattern" and `metric_observation`, and [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) for the exact columns and constraints, including why no mutable `is_current` flag is used: the latest revision is always identifiable as `MAX(revision_number)` within a natural-key group, a plain query rather than a stored, mutation-requiring flag.

**Enforcement note:** PostgreSQL itself does not prevent an `UPDATE` statement from being issued against these tables; true enforcement (a trigger that rejects `UPDATE`s on protected columns, or restricting `UPDATE` privilege at the database-role level) is a Sprint 3C decision, not designed here. This document records the *intended* behavior these tables must uphold, which Sprint 3C's RLS/privilege design should make structurally difficult to violate, not just a documentation convention trusted to application code alone. A second Sprint 3C trigger requirement — verifying a superseding row's `revision_number` is exactly its predecessor's `+ 1` — is documented in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) and applies to `metric_observation` as well as the four snapshots.

### 3. Append-Only Lifecycle History → A Separate Event Table, Never a Mutable Status Column

Applies to `recommendation` (via `recommendation_lifecycle_event`) and `alert` (via `alert_lifecycle_event`, **Sprint 3B.1 Correction 8** — see below; the evaluation facts that produced an Alert now live on the separate immutable `condition_evaluation` table, **Sprint 3B.2 Correction 6**, distinct from the lifecycle-event pattern described here). `task`'s status remains a plain mutable column for now, explicitly labeled provisional; `task_status_history` has moved to [`09-deferred-entities.md`](09-deferred-entities.md) pending OQ-042 (**Sprint 3B.1 Correction 13**).

**Distinct from `employee_office_assignment`'s pattern (Sprint 3B.2 Correction 8):** an append-only event table records an unbounded *sequence* of transitions for a parent whose identity never changes. `employee_office_assignment` is different — each row *is* one period of assignment, and the "lifecycle" is expressed by inserting a **new row** for a transfer (a new period), not by appending an event to a shared per-Employee history table. Its single permitted mutation (closing `effective_end_date` exactly once) is a narrower, table-specific allowance, not an instance of this three-pattern taxonomy — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Employee Assignment Lifecycle."

This is a distinct pattern from both of the above: the *parent* record (`recommendation`, `alert`) is itself immutable per pattern 2, but it has a *state* that changes over time (for a Recommendation: Generated → Presented → Approved/Rejected → …; for an Alert: Open → Acknowledged → Dismissed). Rather than adding a mutable `status` column to the parent (which would violate immutability) or creating a new parent row per state change (which would break the "one Recommendation/Alert, one identity" requirement), a **child event table** records each transition as its own immutable row. The parent's current state is always derived by querying the latest child event — **by `sequence_number`, not by `occurred_at` alone** (Sprint 3B.1 Correction 12: two events could in principle share a timestamp at sufficiently fine granularity or under clock skew; a monotonic, application-assigned `sequence_number`, unique within its parent, removes that ambiguity entirely). Neither table stores current state redundantly on the parent.

This is the direct physical answer to the explicit requirement: "Recommendations are immutable... tracked as an append-only sequence of status entries, not by mutating a single status field" — now applied consistently to Alert as well, since Sprint 3B had inconsistently classified `alert` as immutable while still placing mutable `status`/`dismissal_reason`/`dismissed_by_user_id`/`dismissed_at` columns directly on the `alert` row itself.

**Atomicity requirement (Correction 12):** the first lifecycle event (`generated` for a Recommendation, `open` for an Alert) must be created in the same transaction as its parent row, so neither a Recommendation nor an Alert can ever exist, even momentarily, with zero lifecycle events. This is a write-path requirement for Sprint 3C (ideally a single stored function/RPC performing both inserts), not something a `CHECK` constraint can enforce on its own.

## Snapshot Header/Detail Pattern

Three of the four MVP snapshot types use a header/detail pair rather than a single wide table, specifically to avoid encoding an assumption about a fixed, exhaustive set of sub-values:

| Snapshot | Header | Detail | Why detail is needed |
|---|---|---|---|
| PayrollSnapshot | `payroll_snapshot` | `payroll_snapshot_line_item` | P&L account line items are organization-configurable and not confirmed exhaustive (OQ-011–013) |
| LaborModelSnapshot | `labor_model_snapshot` | `labor_model_staffing_measure` | Staffing unit (headcount/FTE/role-broken-out) is unresolved (OQ-061); a fixed-column design would require a schema change the moment the real unit is confirmed to differ from the initial assumption |
| BacklogSnapshot | `backlog_snapshot` | `backlog_stage_count` (+ `production_stage` dimension) | Production-stage taxonomy is unresolved and organization-configurable (OQ-049, OQ-069) |

`RevenueSnapshot` remains header-only: a single revenue figure per office/period/source has no analogous internal breakdown requirement in any current repository document.

## Marking Values as Imported / Normalized / Derived / Finalized / Provisional

No single column marks a value's category — the category is a property of *which column it is*, documented in [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) per field with an explicit label:

- **Imported fact:** stored exactly as the source provided it (`payroll_snapshot_line_item.amount`, `labor_model_staffing_measure.source_provided_value`, `labor_model_snapshot.staffing_adherence_percentage`, `backlog_snapshot.source_provided_total_case_count`).
- **Normalized fact:** the imported value after profile-defined mapping/typing, but not yet a business computation (`payroll_snapshot_line_item.account_category`).
- **Derived value:** computed from other stored values (`payroll_snapshot.qualifying_payroll_expense`, `backlog_snapshot.derived_total_case_count` when summed from included stage counts, `labor_model_staffing_measure.measure_value` when parsed from `source_provided_value`).
- **Basis/status of a value that could be either:** `backlog_snapshot` is the one case where "imported" and "derived" are both legitimate paths to the same conceptual fact (a total case count) — **Sprint 3B.1 Correction 9** replaced the single `total_case_count` column (which silently meant one or the other depending on the row) with `source_provided_total_case_count`, `derived_total_case_count`, and an explicit `displayed_total_basis` column stating which one (if either) is currently trustworthy, plus `total_discrepancy_amount` when both exist and disagree. See [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md).
- **Finalized vs. provisional:** the only place this distinction is a first-class column is `revenue_snapshot.is_finalized`, per [`docs/business/01-revenue.md`](../business/01-revenue.md)'s explicit rule that a finalized P&L value is never silently overwritten by a later Power BI value — both remain queryable as distinct rows.

## What This Document Does Not Define

- The trigger or privilege mechanism that would structurally enforce immutability (Sprint 3C).
- The trigger enforcing valid Alert/Recommendation lifecycle transitions (Sprint 3C) — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) `alert_lifecycle_event` for the documented allow-list of transitions this trigger must implement.

## Related Documents

- [Data Lifecycle](../data-model/02-data-lifecycle.md)
- [Versioning Strategy](../data-model/03-versioning-strategy.md)
- [Entity Lifecycle](../data-model/entity-lifecycle.md)
- [Snapshot Strategy](../data-model/snapshot-strategy.md)
- [Table Catalog](02-table-catalog.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Sprint 3B.2 Integrity Corrections](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
