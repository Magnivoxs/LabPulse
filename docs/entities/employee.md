# Entity: Employee

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a lab staff member tracked for staffing, payroll, and overtime purposes.

## Description

An Employee is distinct from a [User](user.md): a User can log into LabPulse, while an Employee is a person tracked in operational and staffing data (technicians, support staff, and other roles). Employee data is sensitive; per [`CLAUDE.md`](../../CLAUDE.md) and [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md), only synthetic data may be used during prototype development, and no real employee data may be committed to this repository.

## Owner

Operations Manager (day-to-day staffing); Organization Administrator (roster management).

## Relationships

- Belongs to one [Office](office.md).
- Has one [JobRole](job-role.md) (job/position classification — for example, Processor, Waxer, Finisher, Full Technician, Lab Manager, Trainer, LSS).
- Contributes to [LaborModelSnapshot](labor-model-snapshot.md) (current staffing) and [PayrollSnapshot](payroll-snapshot.md) (payroll and overtime) aggregates.

## Proposed Fields (High Level)

- Identity (name — synthetic only in this repository)
- Office reference
- JobRole reference
- Employment status (active, terminated)
- Pay type and standard hours
- Start and end dates

## Update Cadence

Ongoing — hires, terminations, and role changes occur regularly; exact source-system cadence is unconfirmed.

## Source Systems

Employee Roster and Career Grid (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)); overtime and payroll amounts flow through [PayrollSnapshot](payroll-snapshot.md) from the P&L rather than from the roster directly.

## Validation Considerations

- Must resolve to a known Office.
- Sensitive fields (compensation, personal identifiers) require the handling described in [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) Data Classification.
- Real employee data must never be committed to this repository, per [`CLAUDE.md`](../../CLAUDE.md).

## Future Database Implications

Expected to require stricter access controls than most other entities, given its sensitivity classification. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md)
- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md)
- [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md)
- [Overtime vs. Hiring](../scenario-engine/02-overtime-vs-hiring.md)

## Related Metrics

Employee Count, Technician Count, Revenue per Technician (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
