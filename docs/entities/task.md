# Entity: Task

**Version:** 0.1
**Status:** Proposed (fields conceptual; design largely unresolved)
**Last Updated:** 2026-08-04

## Purpose

Represents a manager-tracked follow-up action, owner, status, and due date, arising from an [Alert](alert.md) or [Recommendation](recommendation.md).

## Description

Tasks are how LabPulse supports the "record an action, owner, status, and follow-up date" requirement in [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) (Daily Operations Review section), without the system itself performing the underlying action. Creating a Task is always a manager decision.

## Owner

Operations Manager (creates and resolves tasks); assignable to any [User](user.md).

## Relationships

- Scoped to one [Office](office.md).
- May originate from an [Alert](alert.md) or [Recommendation](recommendation.md).
- Assigned to a [User](user.md) (owner).

## Proposed Fields (High Level)

- Office reference
- Related alert or recommendation reference (optional)
- Description
- Owner (user reference)
- Status
- Due date
- Resolution note

## Update Cadence

Created and updated on demand by managers; not periodic.

## Source Systems

Not imported; created directly within LabPulse.

## Validation Considerations

How actions and outcomes should be recorded is an open question (OQ-042 in [`docs/development/open-questions.md`](../development/open-questions.md)); this entity's design should not be treated as final until that is resolved.

## Future Database Implications

Design should not preclude future workflow features (reminders, escalation) but none are approved yet. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Indirectly, any business rule whose Alert or Recommendation a manager chooses to act on.

## Related Scenarios

A Task may record the outcome of acting on a Scenario's suggested action, without the Scenario Engine performing that action itself.

## Related Metrics

None directly.
