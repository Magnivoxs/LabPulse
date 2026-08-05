# Scenario: Should I Hire?

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Describe the shape of a hiring scenario: what it needs as input, what it should help a manager understand, and which business rules it draws on. No formulas are defined here.

## Question

> Should I hire one or more technicians for this office?

## Related Business Rules

- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md)
- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md)
- [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md)

## Conceptual Inputs

Drawn from the Canonical LabPulse Data Model and existing metric definitions (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)):

- Office identity and current staffing adherence status
- Recommended staffing versus current staffing
- Backlog (case count and stage distribution)
- Overtime cost and recurrence
- Monthly P&L revenue and revenue trend
- Known open positions
- Manager-entered context (already known vacancies, planned departures, training ramp-up)
- Proposed hire assumptions: role, expected hourly wage or salary, expected start date, expected training/ramp-up period

## Conceptual Outputs

Consistent with the generic scenario output shape already defined in [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 9:

- Change in regular payroll
- Change in labor percentage
- Estimated capacity change
- Estimated effect on backlog
- Estimated effect on overtime (see [`02-overtime-vs-hiring.md`](02-overtime-vs-hiring.md))
- Assumptions used
- Warnings (for example, missing staffing-adherence data, stale backlog data)
- A recommendation for manager review, not an automatic action

## Workflow Shape

```text
Understaffing or backlog or overtime trigger observed
  -> Manager opens the hiring scenario for the office
  -> Scenario loads current staffing adherence, backlog, overtime, and revenue context
  -> Manager enters or confirms hire assumptions
  -> Scenario produces projected effects and assumptions
  -> Manager reviews, adjusts assumptions, or dismisses
  -> Manager decides whether to proceed outside the scenario engine (for example, opening a position)
```

## What Is Not Yet Defined

- The exact hiring-recommendation formula or threshold (see [BR-002](../business/rules/BR-002-hiring-recommendation.md)).
- How training/ramp-up time affects projected capacity.
- How multiple simultaneous triggers (understaffing plus backlog plus overtime) should be weighed together.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
