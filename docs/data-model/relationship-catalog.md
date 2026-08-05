# Relationship Catalog

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Document every relationship between canonical entities in LabPulse's data model, using the patterns defined in [`01-entity-relationships.md`](01-entity-relationships.md). This is a conceptual catalog — **no SQL, foreign keys, or cardinality notation is defined here.** See [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md) for a visual (Mermaid) representation, and Sprint 3 for schema.

## Tenancy and Authorization

| Relationship | Pattern |
|---|---|
| Organization → Office | Ownership hierarchy |
| Office → Employee | Ownership hierarchy |
| Employee → JobRole | Reference (an Employee has one JobRole) |
| Organization → User | Ownership hierarchy |
| User → Permission → Office | Assignment (see [`permission-model.md`](permission-model.md)) |
| User → Permission → Organization | Assignment (organization-wide access, no Office scope) |
| Permission → SecurityRole | Reference (a Permission grants one SecurityRole) |
| SecurityRole → Permission Set | Reference (a SecurityRole collects a set of capabilities — see [`permission-model.md`](permission-model.md)) |

## Offices and Snapshots

| Relationship | Pattern |
|---|---|
| Office → RevenueSnapshot | Produces / derives |
| Office → PayrollSnapshot | Produces / derives |
| Office → LaborModelSnapshot | Produces / derives |
| Office → BacklogSnapshot | Produces / derives |
| Office → ProductionSnapshot | Produces / derives |
| Office → QualitySnapshot | Produces / derives |
| Office → CareerGridSnapshot | Produces / derives |
| Office → RecruitingSnapshot | Produces / derives |
| Employee → CareerGridSnapshot | Reference (a CareerGridSnapshot describes employees at an office as of a date) |
| Employee → PayrollSnapshot | Reference (aggregated into, not individually itemized at the snapshot level — see [`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md)) |

## Imports and Snapshots

| Relationship | Pattern |
|---|---|
| ImportProfile → ImportJob | Reference (an ImportJob uses one ImportProfile version) |
| ImportJob → RevenueSnapshot / PayrollSnapshot / LaborModelSnapshot / BacklogSnapshot | Produces / derives (see [`import-persistence.md`](import-persistence.md)) |
| Organization → ImportProfile | Reference (organization-specific mapping overrides on a shared base profile) |
| Organization → ImportJob | Ownership hierarchy |

## Business Rules, Metrics, Alerts

| Relationship | Pattern |
|---|---|
| BusinessRule → Metric | Reference (a rule's required inputs are one or more metrics) |
| BusinessRule → Snapshot (any type) | Evaluates / triggers |
| BusinessRule → Alert | Evaluates / triggers (a rule evaluation that meets a condition produces an Alert) |
| Metric → Snapshot (any type) | Produces / derives (a metric value is computed from one or more snapshots) |
| Alert → Office | Reference (an Alert is scoped to an Office) |

## Recommendations

| Relationship | Pattern |
|---|---|
| Recommendation → BusinessRule | Evaluates / triggers (the rule that produced it — see [`recommendation-persistence.md`](recommendation-persistence.md)) |
| Recommendation → Scenario | Reference (suggested next step; see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)) |
| Recommendation → Evidence | Synthesizes / references as evidence — **Evidence is not a standalone entity**; it is the named collection of Alert, Metric, and Snapshot references a Recommendation cites as its justification (see [`recommendation-persistence.md`](recommendation-persistence.md)) |
| Recommendation → Alert (one or more) | Synthesizes / references as evidence |
| Recommendation → Metric (one or more) | Synthesizes / references as evidence |
| Recommendation → Recommendation (Superseded By) | Supersession |
| Recommendation → Office | Reference (scoped to an Office) |
| Recommendation → User | Reference (resolved by — Approved/Rejected) |
| Recommendation → Task | Produces / derives (a Task may be generated upon Approval) |

## Scenarios

| Relationship | Pattern |
|---|---|
| Scenario → Office | Reference |
| Scenario → User | Reference (created by) |
| Scenario → Snapshot (any type) | Reference (baseline data used) |
| Scenario → Recommendation | Reference (a Recommendation may point to a Scenario as its next step; a completed Scenario run may itself be cited as Evidence for a later Recommendation) |

## Employees and Roles

| Relationship | Pattern |
|---|---|
| Employee → Office | Ownership hierarchy |
| Employee → JobRole | Reference |
| JobRole → Metric | Reference (Technician Count and similar metrics depend on JobRole classification) |
| User → SecurityRole | Reference, via Permission (see [`permission-model.md`](permission-model.md)) |

## Tasks

| Relationship | Pattern |
|---|---|
| Task → Office | Reference |
| Task → User | Reference (owner) |
| Task → Alert / Recommendation | Reference (origin, optional) |

## Notes on "Evidence"

"Evidence" appears throughout this catalog and in [`recommendation-persistence.md`](recommendation-persistence.md) as the formal name for what [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) originally called "contributing signals." It is not added to [`docs/entities/README.md`](../entities/README.md) as a new standalone entity, because it does not exist independently — it is always a reference collection scoped to the Recommendation that cites it. Future schema design (Sprint 3) should treat it as a join/reference structure, not a table with its own lifecycle.

## What This Document Does Not Define

- Cardinality (one-to-many vs. many-to-many) — conceptually most of the above are one-to-many from parent to child, except explicitly noted many-to-many patterns (Assignment, Evidence); exact cardinality is Sprint 3 scope.
- Foreign keys, join tables, or indexes.
- Cascade behavior on deletion or archival (see [`02-data-lifecycle.md`](02-data-lifecycle.md) for the lifecycle states involved).

## Related Documents

- [Entity Relationships: Framework](01-entity-relationships.md)
- [ERD Concept](../architecture/erd-concept.md)
- [Entity Catalog](../entities/README.md)
- [Recommendation Persistence](recommendation-persistence.md)
- [Permission Model](permission-model.md)
