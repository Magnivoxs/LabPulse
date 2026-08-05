# BR-004: Overtime Escalation

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Escalate overtime findings that persist after an initial manual review, using the confirmed overtime triggers from [`docs/business/04-overtime.md`](../04-overtime.md), rather than treating every month's overtime alert identically regardless of history.

## Rule Type

Deterministic escalation rule layered on top of the already-confirmed overtime review triggers. No new numeric threshold is introduced by this rule beyond what is already approved.

## Confirmed Inputs (Already Approved)

- Monthly overtime cost greater than $500 triggers manual review ([`docs/business/04-overtime.md`](../04-overtime.md), [BR-001](BR-001-prioritize-location-review.md)).
- Repeated overtime across multiple weeks also triggers review; the required number of weeks is unresolved (see OQ-047 in [`docs/development/open-questions.md`](../../development/open-questions.md)).

## Important Limitation

This rule does not define a new overtime dollar threshold. It defines an escalation workflow — how repeated monthly triggers should be treated differently from a first occurrence — which is not yet approved and must not be hard-coded until it is.

## Required Inputs

Potential inputs:

- Office identity and reporting period
- Monthly overtime cost (see [Monthly Overtime Cost](../../data/01-metrics-dictionary.md#monthly-overtime-cost))
- Overtime trigger history for the office (how many consecutive or non-consecutive months/weeks have tripped the $500 trigger)
- Staffing, vacancy, backlog, and revenue context (per [`docs/business/04-overtime.md`](../04-overtime.md), overtime is never judged in isolation)
- Prior manager notes or dismissals for this office's overtime flags

## Proposed Outcome Categories

- Monitor (first or infrequent occurrence)
- Flagged for review (meets the $500 monthly trigger)
- Escalated (repeated occurrence meeting an as-yet-unresolved recurrence definition)

Do not define scoring weights yet.

## Proposed Processing Logic

```text
Evaluate monthly overtime cost against the $500 trigger
  -> Check trigger history for the office
  -> If this is a repeated occurrence, evaluate against the (unresolved) repeated-overtime definition
  -> Assign Monitor, Flagged, or Escalated status
  -> Display contributing context (staffing, vacancies, backlog, revenue)
  -> Require manager review; do not auto-escalate to an action
```

## Explainability Requirements

The escalation output must show:

- Current monthly overtime cost and the $500 trigger
- Trigger history for the office
- Contributing context values
- Rule version
- That escalation reflects recurrence, not automatic severity of consequence

## Safety and Business Controls

- Do not automatically transfer, discipline, hire, or take budget action based on escalation status.
- Escalation changes visibility and priority of manager review; it does not change the underlying business threshold.
- Allow the manager to record why an escalated flag is or is not actionable.
- Feed escalated status into [BR-002 Hiring Recommendation](BR-002-hiring-recommendation.md) and [BR-005 LSS Recommendation](BR-005-lss-recommendation.md) as one contributing signal among several.

## Dependencies

- Approved $500 monthly overtime threshold (already confirmed)
- Approved repeated-overtime recurrence definition (unresolved — OQ-047)
- Overtime-vs-hiring scenario ([`docs/scenario-engine/02-overtime-vs-hiring.md`](../../scenario-engine/02-overtime-vs-hiring.md))

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
