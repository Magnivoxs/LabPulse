# Entity: Recommendation

**Version:** 0.1
**Status:** Proposed (structure defined by the Recommendation Framework; fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a standard, explainable suggestion for manager review, per [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md).

## Description

Every recommendation type (Hiring, LSS, Transfer, Coaching, Travel, Budget, and future types) is an instance of this entity's common envelope, optionally extended with type-specific detail. A Recommendation is distinct from an [Alert](alert.md): an Alert reports an observed condition; a Recommendation suggests what to consider doing about it.

## Owner

Lab Operations (defines recommendation types and their business meaning); Engineering (implements the common envelope).

## Relationships

- Scoped to one [Office](office.md).
- Produced by one or more [BusinessRule](business-rule.md) evaluations, often synthesizing one or more [Alert](alert.md) records.
- Points to a [Scenario](scenario.md) as its suggested next step, where one applies.
- Resolved by a [User](user.md) (Approved or Rejected).
- May generate a [Task](task.md) upon approval.

## Proposed Fields (High Level)

See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) for the full conceptual field-group breakdown: identity/scope, status, contributing signals, reasons, assumptions, rule/framework version, limitations, suggested next step, resolution, audit trail.

## Update Cadence

**Recommendations are immutable.** A Recommendation record is created once, when a business rule's recommendation logic fires, and is never edited in place. Its lifecycle (Generated -> Presented -> Approved/Rejected -> Completed/Superseded -> Archived, per [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)) is tracked as an append-only sequence of status entries, not by mutating a single status field.

## Source Systems

Not imported; derived internally from business-rule evaluation against canonical data.

## Validation Considerations

- Must never omit reasons, assumptions, or rule version, per the Recommendation Framework's safety requirements.
- Must never transition to "Approved" without an explicit manager action; a rule engine may transition a recommendation to "Superseded" automatically, but never to "Approved," "Rejected," or "Completed."
- Rejected, Completed, and Superseded recommendations must retain their full history for audit purposes — historical recommendations are never overwritten.

## Future Database Implications

Expected to require an append-only, audit-friendly design (a status-history table, not a single mutable status column) to satisfy both the "explain every recommendation" and immutability requirements in [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [ADR-000](../decisions/ADR-000-architectural-philosophy.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md)
- [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md)
- Indirectly, all detection/escalation rules ([BR-001](../business/rules/BR-001-prioritize-location-review.md), [BR-003](../business/rules/BR-003-understaffing-detection.md), [BR-004](../business/rules/BR-004-overtime-escalation.md), [BR-006](../business/rules/BR-006-staffing-adherence.md)) that contribute signals

## Related Scenarios

All scenarios in [`docs/scenario-engine/README.md`](../scenario-engine/README.md) may be a Recommendation's suggested next step.

## Related Metrics

Whichever metrics are cited in a given recommendation's contributing signals.
