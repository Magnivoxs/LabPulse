# Entity: Organization

**Version:** 0.1
**Status:** Proposed (existence confirmed by architecture; fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a dental laboratory organization — the top-level tenant boundary in LabPulse.

## Description

Every other tenant-owned entity (Office, User via Permission, Employee, snapshots, alerts, recommendations, scenarios) is scoped, directly or transitively, to exactly one Organization. An Organization is created once during onboarding and rarely changes structurally afterward.

## Owner

Organization Administrator (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 12, Roles and Permissions).

## Relationships

- Has many [Office](office.md) records.
- Has many [User](user.md) records, granted access via [Permission](permission.md).
- Owns organization-specific configuration: [ImportProfile](import-profile.md) mapping overrides, [BusinessRule](business-rule.md) threshold overrides.
- Scopes every [LaborModelSnapshot](labor-model-snapshot.md), [RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), and [BacklogSnapshot](backlog-snapshot.md) transitively through Office.

## Proposed Fields (High Level)

- Organization identity (name, status)
- Creation and onboarding metadata
- Configuration settings (threshold overrides, account-mapping overrides)
- Multi-tenant isolation key referenced by every scoped entity

## Update Cadence

Rare. Created at onboarding; edited occasionally (name changes, configuration updates).

## Source Systems

Created directly within LabPulse (not imported from any source file).

## Validation Considerations

- Must exist before any Office, User, or import can be associated with it.
- Configuration overrides (thresholds, mappings) must never silently override an approved default without an explicit, auditable change, per [`CLAUDE.md`](../../CLAUDE.md).

## Future Database Implications

Expected to be the root tenant-scoping table referenced (directly or indirectly) by Row-Level Security policies on every tenant-owned table, per [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

All business rules ([BR-001](../business/rules/BR-001-prioritize-location-review.md) through [BR-006](../business/rules/BR-006-staffing-adherence.md)) are evaluated within an Organization's scope, and their thresholds are organization-configurable and versioned per [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) Development Constitution.

## Related Scenarios

Scenarios (see [`docs/scenario-engine/README.md`](../scenario-engine/README.md)) are scoped to an Organization transitively through Office.

## Related Metrics

Not directly; Organization is a scoping entity, not a metric source.

## Related ADRs

- [ADR-002: Organization-Based Multi-Tenancy](../decisions/ADR-002-multi-tenant-data-model.md)
- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
