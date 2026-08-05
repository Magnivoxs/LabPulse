# Entity: RevenueSnapshot

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time revenue figure for one office and reporting period, from either Power BI (daily, preliminary) or the monthly P&L (authoritative).

## Description

Distinguishes source and finalization status explicitly, so the platform can honor the rule established in [`docs/business/01-revenue.md`](../business/01-revenue.md): the monthly P&L is authoritative for finalized dashboard reporting, and a finalized P&L value must never be silently overwritten by a preliminary Power BI value.

## Owner

Lab Operations (business meaning); Engineering (normalization behavior).

## Relationships

- Belongs to one [Office](office.md).
- Produced by one [ImportJob](import-job.md), using either the Power BI or P&L [ImportProfile](import-profile.md) (P&L profile shared with [PayrollSnapshot](payroll-snapshot.md)).
- Feeds the Monthly P&L Revenue metric, the denominator for Payroll Percentage and Laboratory Expense Percentage.
- Feeds [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md) (revenue decline trigger).

## Proposed Fields (High Level)

- Office reference
- Reporting period
- Source type (Power BI daily, monthly P&L)
- Total office revenue value
- Finalized flag
- Import job and profile version reference

## Update Cadence

Daily (Power BI) and monthly (P&L), per [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) Data Cadence.

## Source Systems

Power BI export; monthly P&L (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)).

## Validation Considerations

- Conflict handling: when a finalized P&L snapshot exists for a period, a later or differing Power BI value must not overwrite it (see [`docs/business/01-revenue.md`](../business/01-revenue.md)).
- The exact accounting classification of the P&L revenue line (gross, net, or adjusted) is unresolved (OQ-043).
- Power BI export structure has not yet been analyzed into an Import Profile (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)).

## Future Database Implications

Expected to be a time-series table keyed by office, reporting period, and source type, with an explicit finalized flag to support the non-overwrite rule. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md)

## Related Scenarios

Baseline revenue context for all scenarios in [`docs/scenario-engine/README.md`](../scenario-engine/README.md).

## Related Metrics

Monthly P&L Revenue, Net Revenue, Revenue Growth (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
