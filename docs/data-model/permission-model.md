# Permission Model

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Design capability-based authorization for LabPulse: what a [User](../entities/user.md) can actually do, expressed as a set of named capabilities collected by a [SecurityRole](../entities/security-role.md) and scoped to one or more offices. **Permissions are never hardcoded** — a capability check asks "does this user's role grant this capability, for this office," not "is this user's role literally named X."

## Naming Note: Capability vs. the Permission Entity (Resolved Here, Like the Role Split)

The instruction behind this document says "permissions are capabilities" — but [`docs/entities/permission.md`](../entities/permission.md) already defines **Permission** as the entity that grants a User a SecurityRole scoped to an Office (established in Sprint 1.5). Using "Permission" for both "a single grantable action" and "the grant record itself" would recreate the exact kind of naming collision the JobRole/SecurityRole split resolved.

This document resolves it the same way: a single grantable action (for example, "Import Labor Model") is called a **Capability**, not a "Permission." The existing **Permission** entity keeps its Sprint 1.5 meaning: the record that grants a User a SecurityRole for a given Office scope. A **Permission Set** is the collection of Capabilities a SecurityRole grants.

## The Hierarchy

```text
User
  ↓
SecurityRole
  ↓
Permission Set (a collection of Capabilities)
  ↓
Office Assignment
```

Read top-down: a User is granted one or more SecurityRoles; each SecurityRole comes with a Permission Set (its bundle of Capabilities); the grant is scoped by an Office Assignment — one office, many offices, an entire organization, or a temporary window (per [ADR-004](../decisions/ADR-004-office-based-authorization.md)).

This is the same concept as the existing [Permission entity](../entities/permission.md), described from the User's point of view: a **Permission** record *is* the combination of "this User" + "this SecurityRole (and therefore this Permission Set)" + "this Office Assignment." This document does not introduce a new entity; it explains the Permission entity's internal logic in more depth.

## Capabilities Are Atomic and Named

A Capability is a single, named, checkable action — never a vague role name used as a stand-in for "can do everything an X can do." Examples named for this sprint:

- Import Labor Model
- View P&L
- Approve Hiring
- Run Scenario
- Manage Users
- View Executive Dashboard

Each of these should be checkable independently: a User could, in principle, hold "View P&L" without "Approve Hiring," or vice versa, if their SecurityRole's Permission Set is composed that way.

## Roles Collect Capabilities; Users Receive Roles

- A **Capability** is never assigned directly to a User. It only exists inside a **Permission Set**.
- A **Permission Set** is owned by exactly one **SecurityRole** and lists the Capabilities that role grants.
- A **User** never holds a raw list of Capabilities — they hold one or more **SecurityRoles** (via **Permission** records), and their effective Capabilities are the union of every Permission Set from every SecurityRole they hold, each scoped by that Permission's Office Assignment.

This means adding a new Capability to a SecurityRole's Permission Set immediately changes what every User with that role can do — no per-user update is needed, and no capability check should ever be written against a literal role name.

## Example (Conceptual, Not a Final Capability List)

```text
SecurityRole: Operations Manager
Permission Set:
  - View Executive Dashboard
  - Run Scenario
  - View P&L (office-scoped)

SecurityRole: Organization Administrator
Permission Set:
  - Manage Users
  - Import Labor Model
  - View Executive Dashboard
  - View P&L (organization-wide)
  - Approve Hiring

User: [Operations Manager] at Office A + [Organization Administrator] at Organization level
Effective Capabilities: union of both Permission Sets, each scoped by its own Office Assignment
```

This is illustrative only — it does not resolve the two unreconciled SecurityRole candidate lists already flagged in [`docs/entities/security-role.md`](../entities/security-role.md), and it does not assign a final Capability list to any real SecurityRole.

## Relationship to Office-Based Authorization

This document does not change [ADR-004](../decisions/ADR-004-office-based-authorization.md)'s `Organization -> Office -> Permissions -> User` scoping hierarchy. That hierarchy answers **where** a User's access applies; this document answers **what** they can do once scoped there. A Permission record combines both: SecurityRole (what, via its Permission Set) + Office Assignment (where).

## Why Capability-Based, Not Role-Name-Based

- Per [ADR-000](../decisions/ADR-000-architectural-philosophy.md) ("configuration before customization," "no hidden business logic"), authorization checks must not be hardcoded against role names scattered through application logic.
- New SecurityRoles (for example, reconciling the "Recruiter" or "Payroll" candidates in [`docs/entities/security-role.md`](../entities/security-role.md)) can be introduced by composing existing Capabilities into a new Permission Set, without touching every place a capability is checked.
- Capability checks remain meaningful even if SecurityRole names change or are reorganized.

## What This Document Does Not Define

- The final list of Capabilities (only illustrative examples are given).
- The final SecurityRole-to-Permission-Set mapping (blocked on reconciling the two candidate role lists — see [`docs/entities/security-role.md`](../entities/security-role.md) Open Questions).
- Database schema for Capability, Permission Set, or Permission (Sprint 3 scope).
- UI for managing roles and capabilities.

## Related Documents

- [Entity: Permission](../entities/permission.md)
- [Entity: SecurityRole](../entities/security-role.md)
- [Entity: User](../entities/user.md)
- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [Relationship Catalog](relationship-catalog.md)
- [Security Requirements](../security/01-security-requirements.md)
