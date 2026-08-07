# Entity: LaborModelSnapshot

**Version:** 0.3
**Status:** Proposed (physical mapping proposed 2026-08-05, revision/lineage model corrected 2026-08-06; OQ-061 partially resolved — see below)
**Last Updated:** 2026-08-06

## Purpose

Represents a point-in-time capture of Labor Model data for one office and reporting period.

## Description

Produced by normalizing a Labor Model import (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)). Captures Recommended Staffing, Current Staffing, Staffing Adherence %, and Labor % of Revenue as they existed in the source workbook for that office and period, plus lineage back to the import that produced it.

## Owner

Lab Operations (business meaning); Engineering (normalization behavior).

## Relationships

- Belongs to one [Office](office.md).
- Produced by one [ImportJob](import-job.md), using one version of the Labor Model [ImportProfile](import-profile.md).
- Feeds the [Metric](metric.md) definitions: Recommended Staffing, Current Staffing, Staffing Difference, Staffing Adherence %, Labor % of Revenue.
- Feeds [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) and [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md).

## Proposed Fields (High Level)

- Office reference
- Reporting period
- Recommended staffing value
- Current staffing value
- Staffing adherence percentage
- Labor percentage of revenue
- Import job and profile version reference

## Update Cadence

Expected monthly, matching the Labor Model's general cadence noted in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) Data Cadence (exact frequency still marked "To be confirmed" there).

## Source Systems

Labor Model workbook (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)).

## Validation Considerations

- Office ID must resolve to a known [Office](office.md) (see [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md)).
- Staffing unit (headcount, FTE, or role-broken-out) — **OQ-061 partially resolved 2026-08-05 at the architecture level:** the physical model supports all three units without requiring a redesign; which unit the current Labor Model workbook actually uses remains unconfirmed and is not blocked by this schema.
- Staffing Adherence % formula is unresolved (OQ-059); this snapshot stores the workbook-provided value as-is until that is resolved.

## Future Database Implications

Expected to be a time-series table keyed by office and reporting period, similar in shape to the other snapshot entities. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

**Update (Sprint 3B, 2026-08-05):** a proposed physical mapping now exists in [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) and [`03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md). Per the founder's explicit instruction not to assume staffing is always headcount, the design uses an extensible **header (`labor_model_snapshot`) plus staffing-measure detail table (`labor_model_staffing_measure`)** rather than fixed `recommended_headcount`/`current_headcount` columns. Each staffing measure row records its own unit type (headcount, full-time-equivalent, or role-broken-out), an optional JobRole reference (populated only for role-broken-out rows), the parsed numeric value, and the **source-provided unit label and raw source-provided value**, preserved verbatim for lineage regardless of how the value is parsed. **Labor % of Revenue and Payroll Percentage are stored as separate, unmerged values** (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md), OQ-060 resolved) — `labor_model_snapshot.labor_percentage_of_revenue` retains the workbook's own terminology and value, never overwritten or reconciled against `payroll_snapshot`'s Payroll Percentage.

**Update (Sprint 3B.1, 2026-08-06):** two corrections apply here. First, `labor_model_snapshot` now supports multiple immutable revisions per office/period (a `revision_number`/`supersedes_snapshot_id` pattern), so a corrected import no longer requires overwriting or blocking against the original — see [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) "Immutable Revisions." Second, `labor_model_staffing_measure` now carries a direct `import_source_row_id` foreign key rather than an intermediate normalized-value indirection, since each staffing measure is produced by exactly one source row — closing a lineage gap that previously relied on a non-enforced soft reference. See [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md).

## Related Business Rules

- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md)
- [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md)
- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md) (indirectly, via BR-003)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md)
- [LSS Support](../scenario-engine/03-lss-support.md)

## Related Metrics

Recommended Staffing, Current Staffing, Staffing Difference, Staffing Adherence %, Labor % of Revenue (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
