# Entity: Office

**Version:** 0.1
**Status:** Proposed (existence and authorization role confirmed by ADR-004; fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a single dental laboratory office — the canonical operational and authorization unit in LabPulse.

## Description

"Office" and "Location" refer to the same real-world entity. As of Sprint 1.5 (Domain Model Finalization), **"Office" is the sole canonical internal term** — used in the data model, business rules, entity catalog, and all backend/architecture documentation. **"Location" is permitted only as a user interface display label**, where it may read more naturally to end users; it must never appear as a distinct backend concept, field name, or second source of truth. This resolves the synonym ambiguity previously left open in [ADR-004](../decisions/ADR-004-office-based-authorization.md) and OQ-053. Nearly every business rule, metric, alert, recommendation, and scenario in LabPulse is scoped to an Office. Region is descriptive metadata on an Office, not a separate authorization entity.

## Owner

Organization Administrator (creates/edits offices); Operations Manager (operates within assigned offices).

## Relationships

- Belongs to one [Organization](organization.md).
- Has many [Employee](employee.md) records.
- Is the access-scoping target of [Permission](permission.md) (a user may be granted one office, many offices, or organization-wide access).
- Has many [LaborModelSnapshot](labor-model-snapshot.md), [RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), and [BacklogSnapshot](backlog-snapshot.md) records over time.
- Is the scope of [Alert](alert.md), [Recommendation](recommendation.md), [Scenario](scenario.md), and [Task](task.md) records.

## Proposed Fields (High Level)

- Office identity (internal id, external/source-provided Office ID from imports)
- Display name (never a real value in this repository)
- Region (descriptive metadata, not an authorization boundary)
- Status (active, inactive)
- Organization reference

## Update Cadence

Rare. Offices are created infrequently (new location opens) and edited occasionally (name, region metadata).

## Source Systems

Primarily identified via the Labor Model workbook's Office ID field (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)); also referenced by P&L, Payroll, and Power BI sources once their profiles are defined.

## Validation Considerations

- Office ID format is not yet confirmed (OQ-056 in [`docs/development/open-questions.md`](../development/open-questions.md)).
- It is unresolved whether an office can appear in more than one regional worksheet (OQ-057).
- An import referencing an unknown Office ID must be flagged for manager decision, not silently create a new office (see [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md)).

## Future Database Implications

Expected to be a primary scoping table alongside Organization for Row-Level Security, per [ADR-004](../decisions/ADR-004-office-based-authorization.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

All of [BR-001](../business/rules/BR-001-prioritize-location-review.md) through [BR-006](../business/rules/BR-006-staffing-adherence.md) evaluate at the Office level.

## Related Scenarios

All scenarios in [`docs/scenario-engine/README.md`](../scenario-engine/README.md) are scoped to an Office.

## Related Metrics

Every metric in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) that has "Location" or "Office" as its reporting grain.

## Related ADRs

- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
