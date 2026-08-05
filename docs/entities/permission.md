# Entity: Permission

**Version:** 0.1
**Status:** Proposed (fields conceptual; design depends on unresolved questions)
**Last Updated:** 2026-08-04

## Purpose

Represents a grant of a [User](user.md)'s access to an [Office](office.md), a set of offices, or an entire [Organization](organization.md), per the Office-Based Authorization hierarchy in [ADR-004](../decisions/ADR-004-office-based-authorization.md).

## Description

Permission is the join entity that implements the `Organization -> Office -> Permissions -> User` hierarchy. It expresses one of the access patterns named in ADR-004: a single office, many offices, an entire organization, a temporary (time-bounded) office assignment, or — in the future — a franchise grouping.

**Sprint 2 note:** [`docs/data-model/permission-model.md`](../data-model/permission-model.md) describes this same entity's internal logic in more depth, from the User's point of view: a Permission record combines a SecurityRole (which grants a Permission Set of Capabilities) with an Office Assignment (the scope). That document also resolves a second naming collision — "Capability" (a single grantable action, e.g., "Import Labor Model") is a distinct term from this "Permission" entity, to avoid reusing "Permission" for two different meanings.

## Owner

Organization Administrator (grants and revokes access).

## Relationships

- Grants a [User](user.md) access to one [Office](office.md), many Offices, or an entire [Organization](organization.md).
- References a [SecurityRole](security-role.md) — distinct from an Employee's [JobRole](job-role.md); see [`docs/entities/role.md`](role.md) for the historical naming-collision note that led to this split.
- May be time-bounded (temporary office assignment).

## Proposed Fields (High Level)

- User reference
- Organization reference
- Office reference (nullable — absence implies organization-wide access)
- SecurityRole reference (candidate values still being reconciled — see [`docs/entities/security-role.md`](security-role.md))
- Scope type (single office, many offices, organization-wide, temporary)
- Effective start and end dates (for temporary assignments)

## Update Cadence

As needed — role changes, onboarding, offboarding, temporary coverage assignments.

## Source Systems

Created directly within LabPulse; not imported from any source file.

## Validation Considerations

- A Permission's Office reference must resolve to an Office within the same Organization.
- Temporary assignment expiry behavior is not yet designed (OQ-054 in [`docs/development/open-questions.md`](../development/open-questions.md)).
- SecurityRole changes should be logged, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) Authorization.
- Permission checks must be enforced server-side; UI visibility is never an authorization boundary.

## Future Database Implications

Expected to be the primary driver of Row-Level Security policy logic for office- and organization-scoped tables, per [ADR-004](../decisions/ADR-004-office-based-authorization.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Not a direct input to any business rule; Permission governs who may view or act on business-rule outputs.

## Related Scenarios

Governs which Users may create or view [Scenario](scenario.md) runs for a given Office.

## Related Metrics

None directly.

## Related ADRs

- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [ADR-002: Organization-Based Multi-Tenancy](../decisions/ADR-002-multi-tenant-data-model.md)

## Open Questions

- OQ-054 (temporary office assignment design)
- OQ-055 (future franchise grouping design)
