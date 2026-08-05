# Entity: Scenario

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a single what-if modeling run — hiring, overtime-vs-hiring, LSS support, and future types — as described in [`docs/scenario-engine/README.md`](../scenario-engine/README.md).

## Description

A Scenario captures the baseline canonical data used, the manager's entered assumptions, and the resulting projected outputs, always kept distinguishable from historical fact per [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 9. No formulas are defined at this stage — this entity describes structure only.

## Owner

Operations Manager (runs scenarios); Lab Operations (defines scenario types and their business meaning).

## Relationships

- Belongs to one [Office](office.md).
- Created by one [User](user.md).
- Uses [RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), [BacklogSnapshot](backlog-snapshot.md), and [LaborModelSnapshot](labor-model-snapshot.md) as baseline data.
- May be initiated from a [Recommendation](recommendation.md)'s suggested next step.

## Proposed Fields (High Level)

- Office reference
- Scenario type (hiring, overtime-vs-hiring, LSS support, and future types)
- Baseline snapshot references
- Manager-entered assumptions
- Projected outputs
- Warnings / confidence notes
- Created-by user reference and timestamp

## Update Cadence

Created on demand by a manager; not a periodic or scheduled entity.

## Source Systems

Not imported; created directly within LabPulse using canonical baseline data plus manager-entered assumptions.

## Validation Considerations

- Assumptions must be clearly and permanently distinguishable from historical canonical data in the stored record, not just in the UI.
- A scenario must never be presented as a guaranteed result (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 9 Calculation Rules).

## Future Database Implications

Expected to store both inputs (assumptions) and outputs (projections) for later review/audit rather than being purely ephemeral/computed-on-read. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md)
- [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)
- [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md)
- [Overtime vs. Hiring](../scenario-engine/02-overtime-vs-hiring.md)
- [LSS Support](../scenario-engine/03-lss-support.md)

## Related Metrics

Any metric referenced as a scenario input or output (see individual scenario documents).
