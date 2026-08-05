# BR-002: Hiring Recommendation

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Recommend, for manager review, whether an office may warrant hiring — never to hire automatically.

## Rule Type

Deterministic recommendation rule that combines outputs from other detection rules and qualitative context. No formula or numeric threshold is defined yet.

## Relationship to Other Rules

This rule does not independently detect a condition. It synthesizes signals already raised by:

- [BR-003 Understaffing Detection](BR-003-understaffing-detection.md)
- [BR-004 Overtime Escalation](BR-004-overtime-escalation.md)
- [BR-001 Prioritize Location Review](BR-001-prioritize-location-review.md) (backlog and revenue-capacity context)

## Important Limitation

No hiring-recommendation formula or numeric threshold has been approved. This rule currently documents structure, inputs, and safety controls only, consistent with the instruction not to invent formulas.

## Required Inputs

Potential inputs:

- Office identity and reporting period
- Understaffing status (from BR-003)
- Overtime escalation status (from BR-004)
- Backlog case count and trend
- Monthly P&L revenue and revenue capacity
- Known open positions
- Manager-entered context (vacancies, planned departures, training in progress)

## Proposed Outcome Categories

- Recommend hiring
- Recommend monitoring
- Insufficient data
- No action indicated

Do not define scoring weights yet.

## Proposed Processing Logic

```text
Gather understaffing, overtime-escalation, and backlog signals for the office
  -> Evaluate whether multiple signals corroborate each other
  -> Identify missing or stale inputs
  -> Produce a recommendation category with reasons
  -> Link to the hiring scenario for manager modeling
  -> Require manager review before any action
```

## Explainability Requirements

The recommendation output must show:

- Which underlying signals (BR-003, BR-004, backlog, revenue) contributed
- Current values for each contributing signal
- Data freshness for each contributing signal
- Rule version
- That this is a recommendation, not a decision

## Safety and Business Controls

- Do not automatically open a position, approve a hire, or take any staffing action.
- Do not treat this recommendation as guaranteed to be correct; it is a starting point for the [hiring scenario](../../scenario-engine/01-hiring.md).
- Allow the manager to override or dismiss the recommendation with a reason.
- Preserve an audit history of material status changes in a future implementation.

## Dependencies

- Approved Understaffing Detection rule (BR-003)
- Approved Overtime Escalation rule (BR-004)
- Approved Backlog thresholds (BR-001, [`docs/business/07-backlog.md`](../07-backlog.md))
- Approved Monthly P&L Revenue metric ([`docs/data/01-metrics-dictionary.md`](../../data/01-metrics-dictionary.md))
- Hiring scenario definition ([`docs/scenario-engine/01-hiring.md`](../../scenario-engine/01-hiring.md))

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
