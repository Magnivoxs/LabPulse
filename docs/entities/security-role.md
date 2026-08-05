# Entity: SecurityRole

**Version:** 0.1
**Status:** Proposed (fields conceptual; candidate list needs reconciliation — see below)
**Last Updated:** 2026-08-04

## Purpose

Represents an authorization role — what a [User](user.md) is allowed to do in LabPulse — for example, Regional Manager, Operations Director, Recruiter, Payroll, Administrator, or Executive.

## Description

SecurityRole is the entity formerly documented as part of the generic "Role" ([`docs/entities/role.md`](role.md), now superseded — see that document for the historical naming-collision note). SecurityRole governs **access and permissions**, referenced by [Permission](permission.md) to determine what a User may view or do. It is distinct from [JobRole](job-role.md), which describes what an Employee does at an office.

## Important: Candidate List Needs Reconciliation

Two lists of candidate security roles now exist in this repository and have not been reconciled:

1. [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 12 lists: Organization Administrator, Operations Manager, Read-Only Viewer.
2. This sprint's domain finalization names: Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive.

These may represent the same underlying roles at different points in the founder's thinking, a broader set the PRD's initial three were only a starting subset of, or genuinely different access levels (for example, "Payroll" and "Recruiter" sound like functional/departmental roles rather than general management levels). This document does not guess which is correct — it records both and flags the reconciliation as needed before database design. See Open Questions.

## Owner

Organization Administrator (grants and manages security roles).

## Relationships

- Referenced by [Permission](permission.md) to determine a [User](user.md)'s allowed actions.
- Scoped per [ADR-004](../decisions/ADR-004-office-based-authorization.md)'s `Organization -> Office -> Permissions -> User` hierarchy — a SecurityRole is what Permission grants, not a replacement for office-level scoping.
- Distinct from, and never merged with, [JobRole](job-role.md).

## Proposed Fields (High Level)

- SecurityRole name (candidates: Organization Administrator, Operations Manager, Read-Only Viewer, Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive — pending reconciliation)
- Permission set or capability list associated with the role
- Whether the role is organization-wide or office-scoped by default

## Update Cadence

Rare — security-role taxonomies change infrequently, though the current candidate list is still being finalized.

## Source Systems

Defined directly within LabPulse; not imported from any source file.

## Validation Considerations

- Role changes should be logged, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) Authorization.
- Permission checks must be enforced server-side; UI visibility is never an authorization boundary.
- A SecurityRole must never be confused with a JobRole in implementation, given the historical naming collision this split was created to resolve.

## Future Database Implications

Should be modeled as clearly distinct from the table backing [JobRole](job-role.md). The final set of SecurityRole values should not be hard-coded into application logic without a configuration mechanism, consistent with "configuration before customization" in [ADR-000](../decisions/ADR-000-architectural-philosophy.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Not a direct input to any business rule; SecurityRole governs who may view or act on business-rule outputs.

## Related Scenarios

Governs which Users may create or view [Scenario](scenario.md) runs.

## Related Metrics

None directly.

## Related ADRs

- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)

## Sprint 2 Note

[`docs/data-model/permission-model.md`](../data-model/permission-model.md) elaborates how a SecurityRole grants a **Permission Set** — a named collection of **Capabilities** (for example, Import Labor Model, View P&L, Approve Hiring, Run Scenario, Manage Users, View Executive Dashboard). Permissions are capability-based, never hardcoded to a role name.

## Open Questions

- Reconcile the PRD's three initial role candidates (Organization Administrator, Operations Manager, Read-Only Viewer) with this sprint's expanded candidate list (Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive) before database design.
- Whether SecurityRoles are global (fixed by LabPulse) or organization-configurable.
