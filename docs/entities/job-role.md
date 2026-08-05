# Entity: JobRole

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents an Employee's job or position classification within the laboratory — for example, Processor, Waxer, Finisher, Full Technician, Lab Manager, Trainer, or LSS.

## Description

JobRole is the entity formerly documented as the generic "Role" ([`docs/entities/role.md`](role.md), now superseded — see that document for the historical naming-collision note). JobRole exists specifically to describe **what an Employee does at an office**: staffing classification, technician-count eligibility, and Career Grid progression. It is distinct from [SecurityRole](security-role.md), which governs **what a User is allowed to do in LabPulse**.

## Owner

Operations Manager / Lab Operations (job-role taxonomy); Engineering (implementation).

## Relationships

- Assigned to [Employee](employee.md) records.
- Feeds technician-related [Metric](metric.md) definitions (Technician Count, Revenue per Technician).
- Referenced by [CareerGridSnapshot](career-grid-snapshot.md) for skill/level progression.
- Distinct from, and never merged with, [SecurityRole](security-role.md).

## Proposed Fields (High Level)

- JobRole name (for example: Processor, Waxer, Finisher, Full Technician, Lab Manager, Trainer, LSS)
- Category or classification (used to determine technician-count eligibility)
- Whether the role counts toward "technician" for staffing metrics

## Update Cadence

Rare — job-role taxonomies change infrequently.

## Source Systems

Career Grid and Employee Roster (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)).

## Validation Considerations

- JobRole-name consistency across the Career Grid and Employee Roster is not yet confirmed (both sources are flagged with "inconsistent role names" as a known formatting issue).
- Which JobRoles count as "technician" for staffing metrics is an open question (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 16).
- LSS, listed here as an example JobRole, is a traveling support technician (see [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) LSS Definition) — confirm whether LSS staff are tracked as Employees of a home office, as a pooled resource, or both, before finalizing this classification (not yet resolved).

## Future Database Implications

Should be modeled as clearly distinct from the table backing [SecurityRole](security-role.md), so the historical "Role" naming collision (see [`docs/entities/role.md`](role.md)) cannot recur as a schema collision. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) (technician counts contribute to staffing comparisons)
- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md) (proposed hire's JobRole)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md) (proposed hire role)

## Related Metrics

Technician Count, Revenue per Technician (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).

## Open Questions

- Which JobRoles count as technicians (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 16).
- Whether LSS staff are tracked as Employees of a specific office (see above).
