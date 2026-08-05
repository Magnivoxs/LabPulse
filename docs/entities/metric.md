# Entity: Metric

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a versioned definition of an approved metric — the structured counterpart to entries in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md).

## Description

Metric is metadata about a definition (formula version, reporting grain, status), not a specific computed value for an office and period. A specific computed value lives on the relevant snapshot ([RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), [BacklogSnapshot](backlog-snapshot.md), [LaborModelSnapshot](labor-model-snapshot.md)) or is derived from one at read time.

## Owner

Lab Operations (approves business definitions); Engineering (implements approved formulas as tested functions).

## Relationships

- Referenced by [BusinessRule](business-rule.md) definitions that depend on it.
- Computed from one or more canonical snapshots.
- Referenced by [Alert](alert.md) and [Recommendation](recommendation.md) records to show which metric values contributed.

## Proposed Fields (High Level)

- Metric code and name
- Formula version
- Reporting grain (office, organization, reporting period)
- Null/zero handling behavior
- Status (Proposed, Approved, Deprecated)
- Reference to the source documentation entry

## Update Cadence

Versioned on formula change. Per [`CLAUDE.md`](../../CLAUDE.md) Calculation Rules, formula changes require tests and documentation updates before a new version is considered approved.

## Source Systems

Defined internally, derived from [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md). Not imported from any external source.

## Validation Considerations

- A metric must never be computed or displayed with an assumed formula while its dictionary status is "Proposed" with an unresolved formula (for example, Staffing Adherence % and Labor % of Revenue).
- Null and zero-denominator behavior must be explicit per metric, never defaulted to zero or infinity silently.

## Future Database Implications

Expected to require a versioned definition table so that historical figures remain interpretable against the formula version that produced them, mirroring [BusinessRule](business-rule.md)'s versioning need. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Every business rule in [`docs/business/rules/`](../business/rules/) depends on one or more metrics.

## Related Scenarios

Every scenario in [`docs/scenario-engine/README.md`](../scenario-engine/README.md) reads metrics as baseline inputs.

## Related Metrics

This entity represents the full contents of [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md); it is not limited to a subset.

## Related ADRs

- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
