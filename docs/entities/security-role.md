# Entity: SecurityRole

**Version:** 0.3
**Status:** Proposed (MVP candidate list resolved 2026-08-05; Permission Set relationship direction corrected 2026-08-06 — see below; fields conceptual)
**Last Updated:** 2026-08-06

## Purpose

Represents an authorization role — what a [User](user.md) is allowed to do in LabPulse — for example, Regional Manager, Operations Director, Recruiter, Payroll, Administrator, or Executive.

## Description

SecurityRole is the entity formerly documented as part of the generic "Role" ([`docs/entities/role.md`](role.md), now superseded — see that document for the historical naming-collision note). SecurityRole governs **access and permissions**, referenced by [Permission](permission.md) to determine what a User may view or do. It is distinct from [JobRole](job-role.md), which describes what an Employee does at an office.

## MVP Candidate List: Resolved (Sprint 3B, 2026-08-05)

**Update (2026-08-05):** the founder approved the following as the **initial MVP role configuration**, per [`docs/development/SPRINT_3B_REPORT.md`](../development/SPRINT_3B_REPORT.md) Founder-Approved Decision 2:

- Organization Administrator
- Operations Manager
- Read-Only Viewer

These three, and only these three, are seeded as system-default `security_role` rows in the Sprint 3B physical proposal (see [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md)). The expanded candidates below are **explicitly deferred**, not rejected — they remain valid future roles pending confirmation of their actual capability requirements, and the physical design supports adding them later as organization-scoped or new system-default rows without a schema change.

**Deferred candidates (not seeded for MVP):** Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive.

A role named "Regional Manager," if and when it is added, must never itself create region-based authorization — its access would be expressed entirely through Office-scoped or organization-wide Permission grants, per [ADR-004](../decisions/ADR-004-office-based-authorization.md) (Accepted) and [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md).

### Original Reconciliation Note (Historical — Superseded Above)

Two lists of candidate security roles previously existed in this repository and had not been reconciled:

1. [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 12 lists: Organization Administrator, Operations Manager, Read-Only Viewer.
2. Sprint 1.5's domain finalization named: Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive.

These were left unreconciled because they could have represented the same underlying roles at different points in the founder's thinking, a broader set the PRD's initial three were only a starting subset of, or genuinely different access levels. The founder's Sprint 3B decision above resolves this for MVP purposes by adopting the PRD's three as the initial configuration and deferring the rest — it does not retroactively declare the six deferred candidates invalid or incorrect.

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

**Update (Sprint 3B.1, 2026-08-06):** the physical mapping's relationship direction between SecurityRole and Permission Set was corrected — the foreign key now lives on `security_role` (referencing `permission_set`), not the reverse. This means multiple SecurityRoles can reference the same Permission Set later without a schema change, which is the relationally correct expression of "a SecurityRole comes with a Permission Set" the logical model describes. See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) and [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md).

**Update (Sprint 3B.2, 2026-08-06):** Permission Sets themselves now carry tenant ownership — a nullable `organization_id` where `NULL` means platform-owned/immutable and a real value means organization-owned. A global SecurityRole may reference only a global Permission Set; an organization-specific SecurityRole may reference a same-organization Permission Set or an intentional global one, but never another organization's custom Permission Set (enforced by a Sprint 3C trigger, since this is a conditional rule no plain foreign key can express). See [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) "Permission Set Relationship, Corrected" and [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md).

## Open Questions

- ~~Reconcile the PRD's three initial role candidates with the expanded six-role candidate list before database design.~~ **Resolved 2026-08-05** — see MVP Candidate List above.
- Whether SecurityRoles are global (fixed by LabPulse) or organization-configurable. **Partially resolved 2026-08-05:** the physical design in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) supports both (a nullable `organization_id` column), so the schema does not block either answer; whether LabPulse should actually offer organization-defined custom roles as an MVP product feature remains an open product decision, not a schema question.
