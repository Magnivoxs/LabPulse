# Revenue Business Rules

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

This document describes how revenue is used for daily operations, finalized dashboard reporting, comparison, thresholds, investigations, and scenarios. It is derived from the founder's second business-discovery interview and supplements [`docs/business/00-executive-workflow.md`](00-executive-workflow.md).

## Revenue Sources

### Power BI Prior-Day Revenue

- Used for daily operational awareness.
- May be reviewed by practice.
- Not the authoritative finalized dashboard value.
- Update timing and exact accounting basis remain unresolved.

### Monthly P&L Revenue

- Primary dashboard revenue.
- Total office revenue for the month.
- Authoritative when it differs from Power BI.
- Used as denominator for payroll and laboratory-expense percentages.
- Exact accounting label (gross, net, or adjusted revenue) remains to be confirmed.

## Source Hierarchy

```text
Final monthly P&L
  -> Authoritative finalized reporting

Power BI prior-day revenue
  -> Operational monitoring and early trend awareness
```

## Dashboard Requirements

- Default finalized revenue view should use monthly P&L data.
- Power BI data may later be added as a daily operational view.
- Preliminary and finalized revenue must be visually distinguishable.
- Every revenue value should display source, reporting period, freshness, and finalized status.
- Final P&L values must not be silently overwritten by preliminary daily values.

## Variance and Trend Requirements

LabPulse should eventually support:

- Month-over-month change
- Budget variance (proposed)
- Year-over-year change (proposed)
- Rolling average (proposed)
- Daily pace (proposed)
- Forecast versus actual (proposed)

Only month-over-month review is currently confirmed. The others are proposed and unresolved.

## Revenue Investigation

Revenue decline is linked to:

- Staffing
- Overtime
- Backlog
- Call rates
- Welcome-call completion
- Conversion rate
- Appliance quality
- Large orders
- Data freshness

## Business Risks

- Preliminary values may differ from final P&L values.
- Revenue definitions may vary by organization.
- Large one-time orders may distort trends.
- Calendar versus fiscal periods may differ.
- Revenue adjustments may occur after the initial report.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
