# Recommendation Persistence

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Define exactly what a persisted Recommendation record stores, extending the conceptual envelope in [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and the [Recommendation entity](../entities/recommendation.md) with the specific field list needed to make every recommendation permanently explainable, per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md).

## Recommendations Are Immutable

As established in [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md): a Recommendation record is created once and never edited in place. Every lifecycle transition (Generated → Presented → Approved/Rejected → Completed/Superseded → Archived) appends a new, timestamped entry rather than mutating the record. **Historical recommendations remain readable forever** — this document does not change that; it specifies what fields must be present to make that readability meaningful.

## What Every Recommendation Stores

| Field | Meaning |
|---|---|
| **Origin** | Which [BusinessRule](../entities/business-rule.md) (or combination of rules) and, where applicable, which [Scenario](../entities/scenario.md) run generated this recommendation, plus its Office and reporting-period scope. This is the "who/what produced this" record. |
| **Evidence** | The specific [Alert](../entities/alert.md), [Metric](../entities/metric.md) values, and canonical [Snapshot](snapshot-strategy.md) instances cited as justification — formalizing what [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) calls "contributing signals." See [`relationship-catalog.md`](relationship-catalog.md) Notes on "Evidence." |
| **Business Rule Version** | The exact version of the Origin BusinessRule active when this recommendation was generated (see [`03-versioning-strategy.md`](03-versioning-strategy.md)). |
| **Scenario Version** | If a Scenario run informed this recommendation, the version of the scenario definition/framework used. (Scenario definitions are not yet formally versioned in [`docs/entities/scenario.md`](../entities/scenario.md) — this is a gap to close before Sprint 3; see Open Questions.) |
| **Snapshot Version** | A reference to the exact Snapshot instance(s) used as Evidence, identified by their reporting period and creation timestamp. Note: Snapshots themselves are immutable and are not "versioned" in the sense BusinessRule and Metric are (see [`03-versioning-strategy.md`](03-versioning-strategy.md)); "Snapshot Version" here means "a pointer to a specific, identified snapshot instance," not a version number. |
| **Approval** | If and when the recommendation reached the Approved state: who approved it and when. |
| **Outcome** | If the recommendation reached the Completed state: what actually happened when the approved action was carried out. |
| **Resolution** | The manager's reason, recorded at Approved or Rejected — why they made that call. |
| **Superseded By** | If a newer recommendation replaced this one before it reached Completed or Rejected, a reference to that newer recommendation (see [`01-entity-relationships.md`](01-entity-relationships.md) Supersession pattern). Never populated by editing the old record's other fields — only this pointer is added. |

## Why Each Field Exists

- **Origin + Business Rule Version + Scenario Version + Snapshot Version** together answer "exactly what produced this, and against what data and rules" — the core explainability requirement from [BR-001](../business/rules/BR-001-prioritize-location-review.md) and [ADR-000](../decisions/ADR-000-architectural-philosophy.md).
- **Evidence** makes the justification inspectable without re-running the original rule evaluation.
- **Approval / Outcome / Resolution** together form the audit trail of what a human decided and what happened, satisfying [`04-audit-strategy.md`](04-audit-strategy.md) for this entity type.
- **Superseded By** allows the system to show "this recommendation is outdated, here is the current one" without ever hiding or deleting the original — satisfying [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)'s immutable-history principle.

## Relationship to the Recommendation Framework's Lifecycle

This document does not redefine the lifecycle states (Generated, Presented, Approved, Rejected, Completed, Superseded, Archived) — those remain as specified in [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md). This document specifies the fields that lifecycle populates: Approval is written at the Approved transition, Outcome at Completed, Resolution at Approved or Rejected, and Superseded By at Superseded.

## What This Document Does Not Define

- The literal storage shape (a single wide record vs. an event-sourced append log) — Sprint 3 scope.
- Scoring, ranking, or prioritization of multiple open recommendations for the same office.
- UI presentation of Evidence or historical recommendations.

## Open Questions

- Scenario definitions are not yet formally versioned (see [`docs/entities/scenario.md`](../entities/scenario.md)); this must be resolved before "Scenario Version" can be populated reliably.
- Whether Evidence should store a snapshot of the cited values at recommendation-generation time, or only references to be resolved later against immutable snapshots (both should produce the same answer, since snapshots are immutable, but the storage approach differs) — Sprint 3 scope.

## Related Documents

- [Recommendation Framework](../architecture/recommendation-framework.md)
- [Entity: Recommendation](../entities/recommendation.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Snapshot Strategy](snapshot-strategy.md)
- [Relationship Catalog](relationship-catalog.md)
- [Audit Strategy](04-audit-strategy.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
