# BR-005: LSS Recommendation

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Recommend, for manager review, whether requesting Lab Support Specialist (LSS) support may be appropriate for an office — never to request or assign LSS support automatically.

## Rule Type

Deterministic recommendation rule that combines signals from other detection rules. No formula or numeric threshold is defined yet.

## Background

LSS is a traveling laboratory technician who assists offices needing temporary operational support, as defined in [`docs/business/00-executive-workflow.md`](../00-executive-workflow.md). Assignment rules and support duration are not yet defined (see OQ-040 and OQ-041 in [`docs/development/open-questions.md`](../../development/open-questions.md)).

## Important Limitation

No LSS-eligibility formula or numeric threshold has been approved. Final decisions remain case-by-case, consistent with the pattern already established for overtime review in [`docs/business/04-overtime.md`](../04-overtime.md).

## Required Inputs

Potential inputs:

- Office identity and reporting period
- Backlog case count and stage distribution (see [`docs/business/07-backlog.md`](../07-backlog.md))
- Overtime escalation status (from [BR-004](BR-004-overtime-escalation.md))
- Understaffing status (from [BR-003](BR-003-understaffing-detection.md))
- Whether the condition appears temporary or structural (manager-entered judgment)
- LSS availability and typical duration (not yet known — see Open Questions)

## Proposed Outcome Categories

- Recommend requesting LSS support
- Recommend monitoring
- Insufficient data
- No action indicated

Do not define scoring weights yet.

## Proposed Processing Logic

```text
Gather backlog, overtime-escalation, and understaffing signals for the office
  -> Evaluate whether the pattern looks temporary or structural
  -> Identify missing or stale inputs
  -> Produce a recommendation category with reasons
  -> Link to the LSS-support scenario for manager modeling
  -> Require manager review before any request is made
```

## Explainability Requirements

The recommendation output must show:

- Which underlying signals (backlog, overtime escalation, understaffing) contributed
- Current values for each contributing signal
- Data freshness for each contributing signal
- Rule version
- That this is a recommendation, not a request or assignment

## Safety and Business Controls

- Do not automatically request, assign, or schedule LSS support.
- Do not treat this recommendation as a substitute for the case-by-case judgment the founder described for overtime and staffing decisions generally.
- Allow the manager to override or dismiss the recommendation with a reason.
- Present this recommendation alongside, not instead of, [BR-002 Hiring Recommendation](BR-002-hiring-recommendation.md) — LSS and hiring are alternative responses to overlapping signals.

## Dependencies

- Approved Backlog thresholds (BR-001, [`docs/business/07-backlog.md`](../07-backlog.md))
- Approved Overtime Escalation rule (BR-004)
- Approved Understaffing Detection rule (BR-003)
- LSS eligibility and duration definitions (unresolved — OQ-040, OQ-041)
- LSS-support scenario ([`docs/scenario-engine/03-lss-support.md`](../../scenario-engine/03-lss-support.md))

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
