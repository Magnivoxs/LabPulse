# Entity: LaborModelSnapshot

**Version:** 0.1
**Status:** Proposed (source schema documented; canonical fields conceptual)
**Last Updated:** 2026-08-04

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
- Staffing unit (headcount, FTE, or role-broken-out) is unresolved (OQ-061).
- Staffing Adherence % formula is unresolved (OQ-059); this snapshot stores the workbook-provided value as-is until that is resolved.

## Future Database Implications

Expected to be a time-series table keyed by office and reporting period, similar in shape to the other snapshot entities. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md)
- [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md)
- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md) (indirectly, via BR-003)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md)
- [LSS Support](../scenario-engine/03-lss-support.md)

## Related Metrics

Recommended Staffing, Current Staffing, Staffing Difference, Staffing Adherence %, Labor % of Revenue (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
