# ADR-004: Use Office-Based Authorization Instead of Region-Based Authorization

**Status:** Proposed
**Date:** 2026-08-04

## Context

The initial system architecture ([`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md)) listed `regions` as a candidate core entity alongside `locations`, implying region could become an authorization or grouping boundary.

Founder interviews covering the Labor Model workbook show that:

- Regional sheets exist in the Labor Model workbook for reporting convenience.
- Office ID is the field that uniquely identifies a location.
- Real operational and financial thresholds (payroll percentage, laboratory expense percentage, overtime, backlog) are all evaluated at the office/location level, not the region level.
- Users may need to be granted access to a single office, many offices, an entire organization, a temporary office assignment, or (in the future) a franchise grouping.

A region-based authorization model would not naturally express these access patterns, since regions are a fixed geographic grouping rather than a flexible unit of access.

## Options Considered

1. Keep region as an authorization boundary between organization and location.
2. Use office-based authorization, with region retained only as descriptive metadata on an office.
3. Use a fully flexible tag-based or attribute-based access-control model.
4. Authorize only at the organization level (no sub-organization scoping).

## Decision

Replace region-based authorization with **office-based authorization**.

The authorization hierarchy becomes:

```text
Organization
  -> Office
    -> Permissions
      -> User
```

- **Office** is the canonical tenant-owned operational unit for authorization, import, and business-rule purposes. It refers to the same real-world entity that prior documents call "location" (see Terminology below).
- **Region** becomes descriptive metadata attached to an office (for example, for grouping in reports or Labor Model regional worksheets). Region is not an authorization boundary and must not gate access on its own.
- Users may be granted access to:
  - One office
  - Many offices
  - An entire organization
  - A temporary office assignment (time-bounded)
  - A future franchise grouping (a proposed grouping above office and below or alongside organization; not yet designed — see Open Questions)

## Terminology

**Update (Sprint 1.5, 2026-08-04): resolved.** "Office" and "Location" refer to the same entity. "Office" is now the sole canonical internal term — used in the data model, business rules, entity catalog, and all backend/architecture documentation. "Location" is permitted only as a user-interface display label; it must never become a second backend concept or field name. This resolves OQ-053. See [`docs/entities/office.md`](../entities/office.md) for the current statement of this convention.

Existing documents (for example, the metrics dictionary and BR-001) that use `location_id` and "location" in a backend/data sense are historical and are not retroactively rewritten by this update — see [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md) for tracking of any future cleanup pass. New documentation should use "Office" exclusively for anything other than UI copy.

*Original text (Sprint 1, superseded by the update above, preserved for history):* "This ADR adopts 'Office' as the canonical term for new architecture, import, and scenario-engine documentation... Until that decision is made, 'office' and 'location' should be treated as synonyms across the repository."

## Reasons

- Matches the unit at which real thresholds (payroll %, laboratory expense %, overtime, backlog) are already evaluated.
- Matches the Labor Model workbook's Office ID as the unique identifying key.
- Supports the full range of access patterns described by the founder (single office, many offices, whole organization, temporary assignment, future franchise) without overloading region.
- Keeps region available as useful descriptive/reporting metadata without making it a security boundary.
- Avoids a rigid, geography-based permission model that would need to change if regional boundaries change for business reasons unrelated to access control.

## Risks

- Introducing "office" alongside existing "location" terminology creates a temporary dual-vocabulary risk if not tracked carefully; this ADR requires treating them as synonyms until a formal rename decision is made.
- Temporary office assignments and future franchise groupings are named as requirements here but are not yet designed; implementing authorization before those are designed risks a rework.
- Office-level permission checks must still be enforced server-side per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md); UI-level office scoping is not a security boundary.
- Migrating any existing region-based assumptions (none implemented yet) must not silently drop tenant isolation.

## Consequences

- [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) data-entity list is updated to reflect organizations, offices, office permissions/assignments, and region as office metadata rather than a standalone authorization entity.
- Row-Level Security policies must be designed around office-level (and organization-level) scoping, not region.
- Import profiles that reference "Office ID" (for example, the Labor Model import) map directly to the canonical `office` entity.
- Future franchise support and temporary assignment support require their own design work before implementation; they are recorded as pending architecture in [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md).
- No database migration is created by this ADR; the project remains in architecture and documentation, not implementation.

## Conditions for Revisiting

Revisit if:

- Region turns out to be required as a genuine access boundary for a real customer (for example, a regional manager role that must be denied visibility into offices outside their region).
- Franchise support requires a grouping entity that materially changes the authorization hierarchy.
- Office-level permission volume becomes operationally unmanageable and a coarser default (for example, organization-level-only access with office-level exceptions) is needed.
