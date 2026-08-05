# Overtime Business Rules

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Define how overtime is measured, reviewed, contextualized, and used in future staffing scenarios. This document is derived from the founder's second business-discovery interview and supplements [`docs/business/00-executive-workflow.md`](00-executive-workflow.md) and [`docs/business/rules/BR-001-prioritize-location-review.md`](rules/BR-001-prioritize-location-review.md).

## Current Review Triggers

### Monthly cost trigger

Monthly overtime cost greater than $500 triggers manual review.

### Repeated overtime trigger

Repeated overtime across multiple weeks triggers manual review.

The number of weeks and required continuity are not yet defined.

## Current Decision Context

Overtime cannot be interpreted alone. It is not primarily judged by hours.

Review may include:

- Monthly revenue
- Staffing
- Vacancies
- Backlog
- Large orders
- Temporary absences
- Training or ramp-up
- Quality issues
- Production demand

Final decisions remain case-by-case.

## Initial Review Workflow

```text
Overtime trigger
  -> Verify source and reporting period
  -> Review staffing and vacancies
  -> Review backlog and large orders
  -> Review revenue and workload
  -> Determine whether overtime is temporary or recurring
  -> Compare cost with possible support or hiring options
  -> Select action or continue monitoring
```

## Potential Actions

- Continue monitoring
- Correct scheduling or timekeeping
- Adjust workload
- Request LSS support
- Transfer staff
- Open a position
- Delay hiring
- Investigate training or quality concerns

## Scenario Engine Implications

Future scenarios should compare:

- Current overtime cost
- Added regular payroll
- Employer burden
- Expected overtime reduction
- Ramp-up time
- Revenue capacity
- Break-even period
- Temporary support cost

Do not define these formulas yet.

## Safety

Overtime alone must not trigger automatic hiring, transfer, discipline, or termination.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
