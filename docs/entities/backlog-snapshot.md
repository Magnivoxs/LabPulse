# Entity: BacklogSnapshot

**Version:** 0.1
**Status:** Proposed (fields conceptual; stage taxonomy unresolved)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of backlog case counts, by production stage, for one office.

## Description

Backlog is measured in cases, not individual units, and tracked by production stage, per [`docs/business/07-backlog.md`](../business/07-backlog.md). This entity captures both the total case count and the stage-level breakdown for a given snapshot moment.

## Owner

Lab Operations (business meaning); Engineering (normalization behavior).

## Relationships

- Belongs to one [Office](office.md).
- Produced by one [ImportJob](import-job.md) or manual entry.
- Feeds Backlog Cases and Backlog by Production Stage metrics.
- Feeds [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md) and [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md).

## Proposed Fields (High Level)

- Office reference
- Reporting date
- Total case count
- Case count by production stage
- Import job reference (or manual-entry indicator)

## Update Cadence

Snapshot timing and reporting frequency are unresolved (OQ-052 in [`docs/development/open-questions.md`](../development/open-questions.md)); likely daily or weekly.

## Source Systems

Production Report (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)); no dedicated Import Profile has been analyzed yet.

## Validation Considerations

- The final production-stage taxonomy is unresolved beyond the known examples (To be set, To be processed, To be delivered, Resets, Remakes) — OQ-049.
- Whether resets and remakes count toward the total backlog figure or are presented separately is unresolved (OQ-051).
- Case counts must be non-negative; duplicate snapshots for the same office and date must be detected, not silently summed.

## Future Database Implications

Expected to be a time-series table keyed by office and reporting date, with a related stage-breakdown table or structure. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md)
- [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md)

## Related Scenarios

- [LSS Support](../scenario-engine/03-lss-support.md)
- [Hiring](../scenario-engine/01-hiring.md)

## Related Metrics

Backlog Cases, Backlog by Production Stage (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
