# Entity: Permission

**Version:** 0.3
**Status:** Proposed (physical mapping proposed 2026-08-05, fail-closed scope corrected 2026-08-06; expiry enforcement still open)
**Last Updated:** 2026-08-06

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
- Office reference(s) — expressed as a normalized set (one row per granted Office), not a single nullable field
- SecurityRole reference (candidate values still being reconciled — see [`docs/entities/security-role.md`](security-role.md))
- **Scope type: explicit, fail-closed** (`organization` or `office` — see the Sprint 3B.1 correction below; organization-wide access is recognized only when this field explicitly says so, never inferred from an absent or empty Office collection)
- Effective start and end dates (independent of scope type; may apply to any grant, per the Sprint 3B.1 correction below)

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

**Update (Sprint 3B, 2026-08-05):** a proposed physical mapping now exists in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md). Key points, not repeated in full here:

- A single office, many offices, and organization-wide access are all expressed through the **same** normalized `permission_office_grant` join table, never an array-of-office-IDs column — resolving how this entity's "Office reference (nullable)" field becomes physical.
- `Effective start and end dates` (listed above) map directly to proposed effective-dating columns — closing the "how should this be modeled" half of OQ-054. **Not yet closed:** whether expiry is automatically enforced or requires manual revocation remains open.
- Revocation is modeled as "revoke + recreate," matching [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md): a revoked grant is retained with a `revoked_at` timestamp, never deleted or reactivated in place.

**Update (Sprint 3B.1, 2026-08-06) — fail-closed scope, corrected:** Sprint 3B's physical mapping stated "zero `permission_office_grant` rows means organization-wide access," inferring a broadened grant from an absent child collection. This has been corrected: organization-wide access is now recognized **only** when an explicit `scope_type = 'organization'` field says so; a Permission scoped to a specific office with zero grant rows is an invalid, incomplete state, never organization-wide access. Effective-dating columns also moved from `DATE` to `TIMESTAMPTZ`, and are now independent of scope (an organization-wide grant may also be time-bounded). See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) "Fail-Closed Authorization Scope" and [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md) for the full correction.

**Update (Sprint 3B.2, 2026-08-06):** `permission.security_role_id` cannot reference another Organization's custom SecurityRole — a Sprint 3C trigger enforces "the referenced SecurityRole is a global default, or belongs to this same Organization." See [`docs/database/01-physical-model-principles.md`](../database/01-physical-model-principles.md) "Global-or-Same-Organization Reference Pattern" and [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md).

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

- OQ-054 (temporary office assignment design) — **Partially resolved 2026-08-05:** physical column design proposed; expiry-enforcement mechanism still open, see above.
- OQ-055 (future franchise grouping design) — **Resolved for MVP, 2026-08-05:** excluded from the MVP tenant hierarchy; see [`docs/development/open-questions.md`](../development/open-questions.md) and [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) Franchise Groupings.
