# LabPulse Entity Catalog

**Version:** 0.1
**Status:** Discovery / Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

This is the conceptual catalog of canonical entities every LabPulse subsystem is expected to consume, per [ADR-005](../decisions/ADR-005-canonical-data-model.md) and [`docs/architecture/canonical-data-principles.md`](../architecture/canonical-data-principles.md). Each entity document describes purpose, relationships, and high-level fields only.

**This catalog does not define SQL tables.** Concrete database schema, keys, types, and indexes are Sprint 2 (Database Design) work, not this sprint's. Treat every "Proposed fields" list here as a conceptual starting point, not a column list.

## How to Use This Catalog

- Business rules, scenarios, metrics, and architecture documents should reference entities from this catalog by name rather than inventing new field names ad hoc.
- Where an entity's design depends on an unresolved open question, that question is linked rather than guessed at.
- "Office" and "Location" are the same entity; this catalog uses "Office," the canonical term established in [ADR-004](../decisions/ADR-004-office-based-authorization.md).

## Entities

| Entity | Summary |
|---|---|
| [Organization](organization.md) | The tenant — a dental laboratory organization using LabPulse |
| [Office](office.md) | The canonical operational and authorization unit (formerly "Location") |
| [User](user.md) | An authenticated person who accesses LabPulse |
| [Permission](permission.md) | A grant of a User's access to an Office, set of Offices, or Organization |
| [Employee](employee.md) | A lab staff member tracked for staffing, payroll, and overtime purposes |
| [JobRole](job-role.md) | An Employee's job/position classification (Processor, Waxer, Technician, Lab Manager, LSS, and similar) |
| [SecurityRole](security-role.md) | An authorization role referenced by Permission (candidate list still being reconciled) |
| ~~[Role](role.md)~~ | Superseded — split into JobRole and SecurityRole; kept for historical reference only |
| [LaborModelSnapshot](labor-model-snapshot.md) | A point-in-time Labor Model import result for an office and period |
| [RevenueSnapshot](revenue-snapshot.md) | A point-in-time revenue figure for an office and period, from Power BI or the P&L |
| [PayrollSnapshot](payroll-snapshot.md) | A point-in-time payroll and overtime expense figure for an office and period, from the P&L |
| [BacklogSnapshot](backlog-snapshot.md) | A point-in-time backlog case count, by production stage, for an office |
| [ProductionSnapshot](production-snapshot.md) | A point-in-time production volume/output capture for an office (purpose and relationships only; fields not yet defined) |
| [QualitySnapshot](quality-snapshot.md) | A point-in-time quality-indicator capture for an office (purpose and relationships only; fields not yet defined) |
| [CareerGridSnapshot](career-grid-snapshot.md) | A point-in-time Career Grid capture for an office (purpose and relationships only; fields not yet defined) |
| [RecruitingSnapshot](recruiting-snapshot.md) | A point-in-time recruiting/open-positions capture for an office (purpose and relationships only; fields not yet defined) |
| [Scenario](scenario.md) | A single what-if modeling run (hiring, overtime-vs-hiring, LSS, and future types) |
| [Recommendation](recommendation.md) | A standard, explainable suggestion for manager review, per the Recommendation Framework |
| [BusinessRule](business-rule.md) | A versioned, configurable definition of an approved business rule (BR-001 and later) |
| [Metric](metric.md) | A versioned definition of an approved metric from the Metrics Dictionary |
| [Alert](alert.md) | A specific triggered instance of a business rule's threshold or condition |
| [Task](task.md) | A manager-tracked follow-up action, owner, status, and due date |
| [ImportProfile](import-profile.md) | A versioned, declarative description of one source-file type |
| [ImportJob](import-job.md) | A single execution of an import, producing history and lineage |

## Related Documents

- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
- [Canonical Data Principles](../architecture/canonical-data-principles.md)
- [Recommendation Framework](../architecture/recommendation-framework.md)
- [Decision Graph](../architecture/decision-graph.md)
- [Metrics Dictionary](../data/01-metrics-dictionary.md)
- [Business Rules](../business/rules/)
- [Open Questions](../development/open-questions.md)
