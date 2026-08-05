# Executive Operations Review Workflow

**Version:** 0.1
**Status:** Discovery
**Business Owner:** Lab Operations
**Primary User:** Lab Operations Manager
**Last Updated:** 2026-08-04

## Purpose

This document describes how a Lab Operations Manager begins the workday, reviews performance, identifies offices requiring attention, investigates possible causes, and selects operational actions.

It is derived from the founder's first business-discovery interview and is intended to ground LabPulse's dashboard, alerting, and investigation features in the manager's actual working process.

## Important Observation

The workflow is not based on one report.

It combines daily communications, timekeeping tasks, daily revenue data, weekly staffing or career information, and monthly financial and labor-model information. Any product design that assumes a single daily data source will not reflect how the manager actually works.

## Daily Starting Workflow

The manager does not begin with one specific report. The normal daily starting workflow includes the following items, generally in this order:

1. **Timesheet and missed-punch review**
   - Source: Timekeeping system (system name `To be confirmed`)
   - Typical frequency: Daily
   - Operational purpose: Identify missed punches that must be corrected before payroll processing
   - Data type: Structured data

2. **Payroll approval work**
   - Source: Timekeeping or payroll system (`To be confirmed`)
   - Typical frequency: Daily, or payroll-cycle dependent
   - Operational purpose: Approve payroll-related time entries
   - Data type: Structured data

3. **Email review**
   - Source: Email
   - Typical frequency: Daily
   - Operational purpose: Identify urgent items, requests, and escalations
   - Data type: Unstructured communication

4. **Text and missed-call review**
   - Source: Phone / text messaging
   - Typical frequency: Daily
   - Operational purpose: Identify urgent items not captured in email
   - Data type: Unstructured communication

5. **Power BI prior-day revenue review**
   - Source: Power BI
   - Typical frequency: Daily
   - Operational purpose: Understand the previous day's revenue by practice
   - Data type: Structured data

The information primarily comes from corporate systems and Power BI. Details such as the exact timekeeping system name, and whether messages/calls should be represented in LabPulse, are marked `To be confirmed` (see [Open Questions](../development/open-questions.md)).

## Data Cadence

| Data source | Data type | Current frequency | Expected freshness | Known lag | Primary use | Status |
|---|---|---|---|---|---|---|
| Power BI prior-day revenue | Structured | Daily | Previous day | 1 day | Daily revenue review | Confirmed |
| Timesheets / missed punches | Structured | Daily or payroll-cycle dependent | `To be confirmed` | `To be confirmed` | Payroll accuracy, missed-punch correction | Partially confirmed |
| Profit and loss (P&L) statement | Structured | Monthly | `To be confirmed` | `To be confirmed` | Payroll %, laboratory expense %, authoritative monthly revenue for finalized dashboard reporting | Confirmed |
| Labor model | Structured | Monthly | `To be confirmed` | `To be confirmed` | Expected staffing comparison | Confirmed |
| Career grid | Structured | Weekly, updated Mondays | `To be confirmed` | `To be confirmed` | Staffing / skill review | See inconsistency note below |
| Email | Unstructured | Continuous / daily review | N/A | N/A | Urgent issue awareness | Confirmed, representation in LabPulse `To be confirmed` |
| Text messages and missed calls | Unstructured | Continuous / daily review | N/A | N/A | Urgent issue awareness | Confirmed, representation in LabPulse `To be confirmed` |

### Career grid cadence inconsistency

The interview response first stated that "P&Ls, labor model, and career grid are updated monthly," then separately stated that "career grid is updated weekly on Mondays."

Per the interview instructions, the weekly Monday update is treated as the more specific rule for the career grid in this document. However, this is an unresolved inconsistency in the source interview and has been logged in [Open Questions](../development/open-questions.md) (OQ-001) rather than silently resolved.

## First Five KPIs

The manager reviews KPIs in the following order:

1. Revenue
2. Payroll percentage
3. Overtime
4. Open positions
5. Backlog

This order is the initial default dashboard priority but remains subject to refinement as additional interviews and usage feedback are gathered.

## Location Investigation Triggers

A manager may stop and investigate a location when one or more of the following occurs. Four thresholds are currently numeric (payroll percentage, laboratory expense percentage, monthly overtime cost, and backlog case count); revenue decline and large orders remain qualitative and unconfirmed.

All numeric thresholds below are manual-review triggers only. Crossing a threshold flags a location for manager review; it does not automatically approve hiring, transfers, discipline, budget changes, or any other operational action. See the Safety and Business Controls in [BR-001](rules/BR-001-prioritize-location-review.md).

**Revenue source for these thresholds:** Daily Power BI revenue supports day-to-day operational awareness (see Daily Starting Workflow above) but is not the primary dashboard revenue metric. Monthly P&L revenue — total office revenue for the month — is the primary dashboard revenue metric and is authoritative for finalized dashboard reporting; it is also the denominator used below for payroll percentage and laboratory expense percentage. When daily Power BI revenue and the final monthly P&L differ, the P&L is authoritative. See [Revenue Business Rules](01-revenue.md).

### Payroll percentage

- Trigger: Above 8% of monthly P&L revenue
- Source: P&L
- Status: Confirmed initial threshold
- Clarification required: inclusions, exclusions, reporting period, and whether targets vary by location or organization

### Total laboratory expense percentage

- Trigger: Above 10.8% of monthly P&L revenue
- Status: Confirmed initial threshold
- Clarification required: exact included expense categories, reporting period, whether payroll is excluded from this measure, and the final user-facing metric name — these remain open questions and are not resolved by this document (see [Open Questions](../development/open-questions.md))

### Revenue decline

- Trigger: Significant month-over-month decline
- Status: Qualitative
- Threshold: To be confirmed

### Overtime

- Trigger: Monthly overtime cost greater than $500
- Additional trigger: Repeated overtime across multiple weeks
- Status: Confirmed initial threshold for monthly cost; the repeated-overtime trigger is confirmed in principle, but the required number of repeated weeks is unresolved
- Context: Overtime is not judged in isolation and is not primarily judged by hours. Whether overtime is acceptable depends on staffing, vacancies, revenue, backlog, and local circumstances; final decisions remain case-by-case. See [Overtime Business Rules](04-overtime.md).

### Backlog

- Trigger: Twenty or more total laboratory cases
- Unit: Cases, not individual units
- Tracking: Backlog is tracked by production stage
- Status: Confirmed initial threshold
- Clarification required: A fixed threshold may create false positives for high-volume locations, which may reasonably carry more backlog; future thresholds may need to be location-specific or volume-adjusted. See [Backlog Business Rules](07-backlog.md).

### Large orders

- Trigger: Unusually large orders
- Status: Qualitative
- Threshold and business effect: To be confirmed

## Investigation Workflow

When a location requires investigation, the manager generally follows this sequence:

1. Reviews revenue trends
2. Compares current staffing with expected staffing
3. Reviews overtime
4. Reviews backlog
5. Reviews resets and remakes
6. Determines whether the likely cause is laboratory quality, clinical quality, demand, staffing, or another operational issue
7. Contacts the lab manager or relevant operational leader
8. Escalates clinical issues to the Clinical Director

These indicators are related rather than independent: staffing shortfalls can drive overtime, overtime and backlog can both signal capacity strain, and resets/remakes can point toward either a laboratory-quality or clinical-quality root cause. Revenue decline is investigated using a related but distinct set of indicators (see [Revenue Decline Investigation](#revenue-decline-investigation) below).

## Root-Cause Classification

The following initial root-cause categories are **proposed** and have not been validated against additional interviews:

- Laboratory quality
- Clinical quality
- Staffing shortage
- Staffing allocation
- Revenue or demand decline
- Overtime dependency
- Excess backlog
- Large-order demand spike
- Recruiting delay
- Equipment or capacity issue
- Unknown or mixed cause

## Quality Escalation Logic

- Technician-quality issues are addressed through laboratory operations (the lab operations leader works with the technician or lab leadership).
- Clinical-quality issues are escalated to the Clinical Director for action with the clinical team.
- Resets and remakes are diagnostic indicators, not proof of one specific cause:
  - Resets and remakes may indicate bite problems (a clinical indicator).
  - Resets and remakes may indicate technician-quality problems (a laboratory indicator).
- A manager should review additional context before assigning responsibility. LabPulse must not automatically attribute a reset or remake to a technician or clinician.

## Revenue Decline Investigation

When investigating a revenue decline, the manager's current contributing indicators include:

- Call rates
- Welcome-call completion
- Conversion rates
- Appliance quality
- Staffing
- Backlog
- Overtime
- Historical revenue trend

Some of these measures (for example, call rates, welcome-call completion, and conversion rates) may come from systems outside the laboratory function, such as practice or clinical operations systems. Ownership and system-of-record for these measures are `To be confirmed`.

## Common Operational Decisions

After review, the manager typically selects one of the following actions:

- Approve hiring
- Delay hiring
- Transfer technicians
- Coach a manager
- Schedule travel
- Escalate an issue to leadership
- Adjust or review laboratory ordering budgets
- Determine whether additional laboratory support is needed
- Request support from an LSS
- Take no action and continue monitoring

## LSS Definition

**LSS** stands for **Lab Support Specialist**.

- An LSS is a traveling laboratory technician who assists offices needing temporary operational support.
- May be assigned to offices with staffing, backlog, training, quality, or workload concerns.
- Exact assignment rules are not yet defined (see [Open Questions](../development/open-questions.md)).

## Product Implications

Based on this workflow, LabPulse will likely need to support:

- Daily, weekly, and monthly data-freshness indicators
- A prioritized exception queue
- Location investigation pages
- Root-cause classification
- Notes and escalation tracking
- Support-action tracking (including LSS requests)
- Links between financial, staffing, quality, recruiting, and operational metrics
- Manual entry or integration for qualitative communication signals where practical
- Clear separation between source data and manager judgment

## Initial Workflow Summary

```text
Start-of-day review
  -> Check communications and payroll exceptions
  -> Review prior-day revenue
  -> Review prioritized KPIs
  -> Identify locations outside target
  -> Investigate related staffing, overtime, backlog, quality, and demand indicators
  -> Classify likely cause
  -> Choose an action
  -> Assign, escalate, or monitor
  -> Record outcome
```

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
