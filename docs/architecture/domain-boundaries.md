# Domain Boundaries

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Propose Domain-Driven Design (DDD) inspired bounded contexts for LabPulse: groupings of entities and responsibilities that should change together, be owned by a clear part of the system, and depend on each other only in one direction. This is conceptual boundary-setting, not implementation — no modules, packages, or services are created by this document.

## Why Domain Boundaries Matter Here

The entity catalog ([`docs/entities/`](../entities/)) and relationship catalog ([`docs/data-model/relationship-catalog.md`](../data-model/relationship-catalog.md)) describe *what* exists and how it relates. This document describes *who is responsible for what* — so that, for example, the code that evaluates a business rule never needs to know how an import was parsed, and the code that renders a dashboard never needs to compute a payroll percentage itself. This is the same separation-of-responsibilities principle already stated architecturally in [`docs/architecture/01-system-architecture.md`](01-system-architecture.md), applied at the domain level.

## Domains

### Organizations

**Responsibility:** Manage the structure of the business itself — organizations, offices, employees, and job classifications.
**Owns:** [Organization](../entities/organization.md), [Office](../entities/office.md), [Employee](../entities/employee.md), [JobRole](../entities/job-role.md).
**Must not:** Contain business-rule evaluation logic, authorization logic, or presentation logic.
**Depends on:** Nothing (foundational domain).

### Users

**Responsibility:** Manage authenticated identities and their basic profile.
**Owns:** [User](../entities/user.md).
**Must not:** Decide what a User is allowed to do (that is the Permissions domain's responsibility) or store business data.
**Depends on:** Organizations (a User belongs to an Organization).

### Permissions

**Responsibility:** Resolve what a User can do and where, using capability-based authorization.
**Owns:** [Permission](../entities/permission.md), [SecurityRole](../entities/security-role.md), Permission Set / Capability (see [`docs/data-model/permission-model.md`](../data-model/permission-model.md)).
**Must not:** Perform business calculations, or hardcode a capability check against a literal role name.
**Depends on:** Users, Organizations (Office Assignment scope).

### Imports

**Responsibility:** Turn untrusted source files into validated, normalized data, and hand it to the Snapshots domain. Owns the entire pipeline described in [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) up to (not including) canonical snapshot storage.
**Owns:** [ImportProfile](../entities/import-profile.md), [ImportJob](../entities/import-job.md), and the raw/validation/normalization records described in [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md).
**Must not:** Evaluate business rules, generate alerts or recommendations, or expose source-file structure to any other domain.
**Depends on:** Organizations (scoping to an Organization/Office).

### Snapshots

**Responsibility:** Own the canonical, immutable, point-in-time operational facts every other domain reads from, and the approved Metric definitions computed over them.
**Owns:** [RevenueSnapshot](../entities/revenue-snapshot.md), [PayrollSnapshot](../entities/payroll-snapshot.md), [LaborModelSnapshot](../entities/labor-model-snapshot.md), [BacklogSnapshot](../entities/backlog-snapshot.md), [ProductionSnapshot](../entities/production-snapshot.md), [QualitySnapshot](../entities/quality-snapshot.md), [CareerGridSnapshot](../entities/career-grid-snapshot.md), [RecruitingSnapshot](../entities/recruiting-snapshot.md), [Metric](../entities/metric.md) definitions and computed values.
**Must not:** Decide whether a value is "good" or "bad" (that is the Business Rules domain's job) or know anything about how the data was imported.
**Depends on:** Imports (receives normalized data from it), Organizations (Office scoping).

### Business Rules

**Responsibility:** Evaluate canonical Snapshots and Metrics against versioned, approved rules to produce Alerts.
**Owns:** [BusinessRule](../entities/business-rule.md) definitions, [Alert](../entities/alert.md).
**Must not:** Decide what action a manager should take (that is the Recommendations domain's job), or model hypothetical futures (that is the Scenarios domain's job).
**Depends on:** Snapshots.

### Scenarios

**Responsibility:** Model what-if questions (hiring, overtime-vs-hiring, LSS support, and future types) using canonical baseline data plus explicit manager-entered assumptions.
**Owns:** [Scenario](../entities/scenario.md).
**Must not:** Automatically execute any modeled action, or be treated as a guaranteed result (see [`docs/scenario-engine/README.md`](../scenario-engine/README.md) Safety).
**Depends on:** Snapshots (baseline data), Organizations (Office scope), Users (who ran it).

### Recommendations

**Responsibility:** Synthesize Alerts, Metrics, and Scenario outputs into a standard, immutable, explainable Recommendation with a defined lifecycle, and track manager follow-up.
**Owns:** [Recommendation](../entities/recommendation.md), [Task](../entities/task.md), and the Evidence references described in [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md).
**Must not:** Generate its own business logic (it consumes Business Rules domain output) or automatically transition itself to Approved/Rejected/Completed (see [`docs/architecture/recommendation-framework.md`](recommendation-framework.md) Safety).
**Depends on:** Business Rules, Scenarios, Snapshots, Users.

### Dashboard

**Responsibility:** Aggregate and present canonical data, Alerts, and Recommendations for viewing and comparison.
**Owns:** No persistent entities of its own — this is a read-model / presentation-layer concern, per [`docs/architecture/01-system-architecture.md`](01-system-architecture.md) Presentation Layer.
**Must not:** Compute authoritative financial or staffing figures itself, or contain business logic.
**Depends on:** Every domain above, as a read-only consumer.

### Notifications

**Responsibility:** Inform Users that a new Alert or Recommendation exists, corresponding to the "Notifications" step in [`docs/architecture/event-driven-processing.md`](event-driven-processing.md).
**Owns:** No formal entity yet defined in [`docs/entities/`](../entities/) — notification delivery is not yet modeled; see Open Questions.
**Must not:** Decide business logic or become the system of record for whether an Alert/Recommendation was reviewed (that remains the Recommendations/Business Rules domain's own state).
**Depends on:** Recommendations, Business Rules, Users.

### AI

**Responsibility:** Provide explanation, summarization, and natural-language interaction over data the current User is authorized to see.
**Owns:** AI provider configuration and abstraction, per [ADR-003](../decisions/ADR-003-ai-provider-strategy.md).
**Must not:** Perform deterministic business calculations, replace a Business Rule, or be treated as a source of truth (see [ADR-000](../decisions/ADR-000-architectural-philosophy.md) "deterministic before AI").
**Depends on:** Read-only, authorization-filtered access to Snapshots, Alerts, and Recommendations.

### Infrastructure

**Responsibility:** Provide the technical substrate every other domain runs on — authentication mechanics, Row-Level Security enforcement, audit-log plumbing, deployment.
**Owns:** No business entities; implements the *mechanism* behind policies other domains decide (for example, Infrastructure enforces the authorization decisions the Permissions domain makes).
**Must not:** Contain business-specific rules or domain logic.
**Depends on:** Nothing conceptually, but technically underlies every other domain.

## Dependency Direction

```text
Infrastructure  ←  (underlies everything, depends on nothing)
Organizations   ←  (foundational)
Users           →  Organizations
Permissions     →  Users, Organizations
Imports         →  Organizations
Snapshots       →  Imports, Organizations
Business Rules  →  Snapshots
Scenarios       →  Snapshots, Organizations, Users
Recommendations →  Business Rules, Scenarios, Snapshots, Users
Notifications   →  Recommendations, Business Rules, Users
Dashboard       →  (reads from all of the above)
AI              →  (reads from Snapshots, Alerts, Recommendations, authorization-filtered)
```

No arrow points backward: Snapshots never depends on Business Rules, Business Rules never depends on Recommendations, and so on. This one-directional dependency is what keeps each domain independently testable and explainable, per [ADR-000](../decisions/ADR-000-architectural-philosophy.md).

## What This Document Does Not Define

- Module, package, or service boundaries in code (Sprint 3+ implementation scope).
- Which domains might eventually become separate deployable services (this repository has explicitly avoided premature microservices, per [`CLAUDE.md`](../../CLAUDE.md)).
- API contracts between domains.

## Open Questions

- Notifications has no formal entity yet — should it be modeled as its own entity (a NotificationRecord) in a future sprint, or treated purely as an ephemeral delivery mechanism with the Recommendation/Alert's own state being authoritative?

## Related Documents

- [System Architecture](01-system-architecture.md)
- [Entity Catalog](../entities/README.md)
- [Relationship Catalog](../data-model/relationship-catalog.md)
- [ADR-000: Architectural Philosophy](../decisions/ADR-000-architectural-philosophy.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
