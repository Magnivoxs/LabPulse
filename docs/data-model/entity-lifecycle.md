# Entity Lifecycle

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Apply the lifecycle framework in [`02-data-lifecycle.md`](02-data-lifecycle.md) to every entity in [`docs/entities/`](../entities/), so it is unambiguous which lifecycle operations are valid for each entity type before Sprint 3 (database design) begins.

## How to Read This Table

- **Created** — the entity can come into existence.
- **Updated** — the entity's current record can be changed in place. Most entities in this platform are **No** here by design (see [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)) — they are Versioned or Immutable instead.
- **Versioned** — changes produce a new version; old versions remain queryable (see [`03-versioning-strategy.md`](03-versioning-strategy.md)).
- **Immutable** — once created, never changes and is never versioned; a permanent point-in-time fact.
- **Archived** — can exit the active/current set while remaining fully readable.
- **Soft Deleted** — can be hidden/deactivated while remaining recoverable.
- **Hard Deleted** — can be permanently and irrecoverably removed. Marked **Rare** for nearly every entity, per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("nothing is deleted") — see [`05-retention-policy.md`](05-retention-policy.md) Open Questions for the unresolved exceptions.

## Tenancy and People

| Entity | Created | Updated | Versioned | Immutable | Archived | Soft Deleted | Hard Deleted |
|---|---|---|---|---|---|---|---|
| [Organization](../entities/organization.md) | Yes | Yes | No | No | Yes | Yes | Rare |
| [Office](../entities/office.md) | Yes | Yes | No | No | Yes | Yes | Rare |
| [User](../entities/user.md) | Yes | Yes | No | No | No | Yes | Rare |
| [Employee](../entities/employee.md) | Yes | Yes | No | No | Yes | Yes | Rare |
| [JobRole](../entities/job-role.md) | Yes | Yes (rare) | No | No | Yes | No | Rare |

## Authorization

| Entity | Created | Updated | Versioned | Immutable | Archived | Soft Deleted | Hard Deleted |
|---|---|---|---|---|---|---|---|
| [Permission](../entities/permission.md) | Yes | No (revoke + recreate) | Yes (effective-dated) | No | N/A | Yes (revoked) | Rare |
| [SecurityRole](../entities/security-role.md) | Yes | No | Yes | No | Yes | No | Rare |
| Permission Set (see [`permission-model.md`](permission-model.md)) | Yes | No | Yes (tied to SecurityRole version) | No | Yes | No | Rare |
| ~~[Role](../entities/role.md)~~ (Superseded) | Historical only | No — frozen | No | Yes (frozen as of Sprint 1.5) | Yes | No | No |

## Canonical Snapshots

All eight snapshot types share the same lifecycle profile (see [`snapshot-strategy.md`](snapshot-strategy.md)):

| Entity | Created | Updated | Versioned | Immutable | Archived | Soft Deleted | Hard Deleted |
|---|---|---|---|---|---|---|---|
| [RevenueSnapshot](../entities/revenue-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [PayrollSnapshot](../entities/payroll-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [LaborModelSnapshot](../entities/labor-model-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [BacklogSnapshot](../entities/backlog-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [ProductionSnapshot](../entities/production-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [QualitySnapshot](../entities/quality-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [CareerGridSnapshot](../entities/career-grid-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |
| [RecruitingSnapshot](../entities/recruiting-snapshot.md) | Yes | No | No | Yes | Yes | No | Rare |

## Business Logic and Decisions

| Entity | Created | Updated | Versioned | Immutable | Archived | Soft Deleted | Hard Deleted |
|---|---|---|---|---|---|---|---|
| [BusinessRule](../entities/business-rule.md) | Yes | No | Yes | No (per version) | Yes (deprecated) | No | Rare |
| [Metric](../entities/metric.md) | Yes | No | Yes | No (per version) | Yes (deprecated) | No | Rare |
| [Alert](../entities/alert.md) | Yes | No (status transitions are append-only) | No | Yes (core facts) | Yes | No | Rare |
| [Recommendation](../entities/recommendation.md) | Yes | No | No | Yes | Yes (a lifecycle state itself) | No | No |
| [Scenario](../entities/scenario.md) | Yes | No | No | Yes (once run) | Yes | No | Rare |
| [Task](../entities/task.md) | Yes | Yes | No | No | Yes | Yes | Rare |

## Imports

| Entity | Created | Updated | Versioned | Immutable | Archived | Soft Deleted | Hard Deleted |
|---|---|---|---|---|---|---|---|
| [ImportProfile](../entities/import-profile.md) | Yes | No | Yes | No (per version) | Yes (deprecated) | No | Rare |
| [ImportJob](../entities/import-job.md) | Yes | Yes (status progresses during processing, each transition audited) | No | Yes (once complete) | Yes | No | Rare |

## Cross-Cutting Notes

- **Nothing in this table is "Updated" and "Immutable" at the same time** — that would be a contradiction; every entity is exactly one of Updated, Versioned, or Immutable for its core content (see [`02-data-lifecycle.md`](02-data-lifecycle.md) Transition Rules).
- **"Hard Deleted: Rare" is not "Hard Deleted: Never."** It reflects [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)'s default posture; the actual mechanism and trigger conditions remain an open question (see [`05-retention-policy.md`](05-retention-policy.md)).
- **Recommendation is the only entity marked "Hard Deleted: No"** (not even "Rare") — per [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md), historical recommendations must remain readable forever without exception, since they are the platform's core explainability record.

## What This Document Does Not Define

- The literal mechanism behind any lifecycle operation (a status column, a separate history table, an event log) — Sprint 3 scope.
- Cascade behavior when a parent entity (for example, an Office) is archived — Sprint 3 scope, informed by [`01-entity-relationships.md`](01-entity-relationships.md) Ownership Hierarchy pattern.

## Related Documents

- [Data Lifecycle: Framework](02-data-lifecycle.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Retention Policy](05-retention-policy.md)
- [Entity Catalog](../entities/README.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
