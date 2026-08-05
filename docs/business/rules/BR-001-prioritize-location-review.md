# BR-001: Prioritize Location Review

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Identify locations that should receive management attention based on financial, staffing, overtime, backlog, quality, recruiting, and operational indicators.

## Rule Type

Deterministic prioritization rule with configurable thresholds and qualitative review inputs.

## Confirmed Initial Triggers

A location should be considered for review when one or more of the following is true:

1. Payroll percentage above 8.0% of monthly P&L revenue
2. Laboratory expense percentage above 10.8% of monthly P&L revenue
3. Revenue declines significantly month over month
4. Monthly overtime cost above $500
5. Repeated weekly overtime (recurrence period unresolved)
6. Total backlog of 20 or more cases
7. The office receives unusually large orders
8. Resets or remakes indicate a possible quality issue
9. A staffing vacancy or shortage affects operating performance
10. Manager communications indicate an urgent issue

## Important Limitation

Only the 8.0% payroll threshold, 10.8% laboratory expense threshold, $500 monthly overtime threshold, and 20-case backlog threshold are currently numeric.

Other triggers remain qualitative and must not be hard-coded until approved definitions are documented.

## Qualifications on Numeric Triggers

- The 20-case backlog trigger is only an initial manual-review threshold, not proof that an office is underperforming.
- High-volume locations may require different, configurable backlog thresholds.
- The $500 monthly overtime threshold triggers review, not an automatic decision. Repeated overtime across multiple weeks is an additional trigger; the required number and continuity of weeks is unresolved.
- Daily Power BI revenue should not replace final P&L revenue in finalized calculations.
- Monthly P&L revenue is the authoritative denominator for current monthly percentage rules (payroll percentage and laboratory expense percentage).

## Required Inputs

Potential inputs:

- Location
- Reporting period
- Net or approved revenue measure
- Payroll expense
- Total laboratory expense
- Overtime hours
- Overtime cost
- Backlog
- Open positions
- Staffing
- Expected staffing
- Resets
- Remakes
- Large-order information
- Manager-entered alerts
- Data freshness
- Data quality

## Proposed Priority Categories

- Critical
- High
- Medium
- Monitor
- Normal

Do not define scoring weights yet.

## Proposed Processing Logic

```text
Validate data
  -> Evaluate confirmed thresholds
  -> Evaluate approved qualitative flags
  -> Identify missing or stale data
  -> Determine whether multiple risks are present
  -> Assign provisional review priority
  -> Display reasons
  -> Require manager review
```

## Explainability Requirements

The prioritization output must show:

- Triggered conditions
- Current values
- Target values
- Reporting periods
- Data sources
- Data freshness
- Missing data
- Rule version
- Whether the trigger is numeric or manager-entered

## Safety and Business Controls

- Do not automatically discipline, transfer, hire, terminate, or evaluate an employee.
- Do not treat a reset or remake as proof that a technician caused the issue.
- Do not treat AI output as the rule result.
- Do not hide missing or stale data.
- Allow the manager to override or dismiss a recommendation with a reason.
- Preserve an audit history of material status changes in a future implementation.

## Example

Use synthetic data:

```text
Location: Location 101
Payroll percentage: 8.7%
Payroll target: 8.0%
Total laboratory expense: 11.1%
Laboratory expense target: 10.8%
Revenue trend: Down 7% month over month
Overtime: Not evaluated in this example
Backlog: Not evaluated in this example

Result:
High-priority review

Reasons:
- Payroll above approved threshold
- Total laboratory expense above approved threshold
- Revenue declined month over month

Limitations:
- This example does not illustrate the $500 overtime or 20-case backlog triggers
- Repeated-overtime recurrence period and volume-adjusted backlog thresholds are not yet approved
```

## Dependencies

- Approved revenue definition
- Approved payroll definition
- Approved laboratory-expense definition
- Overtime threshold
- Backlog threshold
- Revenue-decline threshold
- Data freshness rules
- Location target configuration

## Related Rules

BR-001 is the general location-review prioritization rule. More specific detection and recommendation rules build on it and on the same underlying data:

- [BR-002 Hiring Recommendation](BR-002-hiring-recommendation.md)
- [BR-003 Understaffing Detection](BR-003-understaffing-detection.md)
- [BR-004 Overtime Escalation](BR-004-overtime-escalation.md)
- [BR-005 LSS Recommendation](BR-005-lss-recommendation.md)
- [BR-006 Staffing Adherence](BR-006-staffing-adherence.md)

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
