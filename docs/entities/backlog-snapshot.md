# Entity: BacklogSnapshot

**Version:** 0.3
**Status:** Proposed (physical mapping proposed 2026-08-05, total-count representation corrected 2026-08-06; stage taxonomy still unresolved — see below)
**Last Updated:** 2026-08-06

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

**Update (Sprint 3B, 2026-08-05):** a proposed physical mapping now exists in [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) and [`03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md), using a **header/detail/dimension** design: a `backlog_snapshot` header, a `backlog_stage_count` detail table, and a `production_stage` dimension table that is organization-configurable and versioned (new or renamed stages are new rows, not new columns). This moves BacklogSnapshot into MVP scope for Sprint 3B — see [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md) for the corresponding update. The still-unresolved question of whether Resets/Remakes count toward the total (OQ-051) is represented as a per-stage `is_included_in_total` configurable flag, **not resolved by this schema**.

**Update (Sprint 3B.1, 2026-08-06) — invented default removed, total representation corrected:** Sprint 3B's `production_stage.is_included_in_total` flag defaulted to `true` for most stages and `false` for Resets/Remakes specifically — an invented business assumption nothing in the repository approved, since OQ-051 explicitly says this is unresolved. The flag is now nullable with **no default for any stage**, remaining genuinely unresolved until a founder or organization-specific decision sets it explicitly. The single `total_case_count` column, which silently meant either an imported or a derived value depending on the row, has also been replaced with four separate fields — a source-provided total, a derived total, an explicit basis/status field, and a discrepancy amount — so no total silently implies an unresolved stage-inclusion decision. See [`docs/database/03-column-and-type-catalog.md`](../database/03-column-and-type-catalog.md) and [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md).

## Related Business Rules

- [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md)
- [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md)

## Related Scenarios

- [LSS Support](../scenario-engine/03-lss-support.md)
- [Hiring](../scenario-engine/01-hiring.md)

## Related Metrics

Backlog Cases, Backlog by Production Stage (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
