# Scenario: Should I Request LSS Support?

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Describe the shape of a scenario that helps a manager evaluate whether to request Lab Support Specialist (LSS) support for an office. No formulas are defined here.

## Question

> Should I request LSS support for this office?

## Background

LSS (Lab Support Specialist) is a traveling laboratory technician who assists offices needing temporary operational support, as defined in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md). Exact assignment rules and support duration are not yet defined (see OQ-040 and OQ-041 in [`docs/development/open-questions.md`](../development/open-questions.md)).

## Related Business Rules

- [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md)
- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md)
- [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)

## Conceptual Inputs

- Backlog case count and stage distribution (see [`docs/business/07-backlog.md`](../business/07-backlog.md))
- Overtime cost and recurrence (see [`docs/business/04-overtime.md`](../business/04-overtime.md))
- Staffing adherence and vacancy status (see [BR-006](../business/rules/BR-006-staffing-adherence.md))
- Whether the condition appears temporary or structural
- Known LSS availability and duration norms (unresolved — see Open Questions)

## Conceptual Outputs

- A recommendation for or against requesting LSS support, for manager review
- The reasons the recommendation was produced (which triggers were present)
- Estimated support cost, once LSS cost data and typical duration are known (not yet available)
- Comparison against the hiring and overtime-vs-hiring scenarios where relevant, since LSS is one of several potential responses to the same underlying triggers

## Workflow Shape

```text
Backlog, overtime, or staffing trigger observed
  -> Manager opens the LSS-support scenario
  -> Scenario loads backlog, overtime, and staffing-adherence context
  -> Manager reviews whether the condition looks temporary or structural
  -> Scenario surfaces a recommendation and its reasons
  -> Manager decides whether to request LSS support outside the scenario engine
```

## Important Limitation

Final LSS assignment decisions remain case-by-case, consistent with the general pattern already established for overtime review in [`docs/business/04-overtime.md`](../business/04-overtime.md). This scenario supports that judgment; it does not automate the request.

## What Is Not Yet Defined

- LSS assignment eligibility criteria (OQ-040).
- Typical or maximum LSS support duration (OQ-041).
- LSS cost structure, if any is tracked centrally versus regionally.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
