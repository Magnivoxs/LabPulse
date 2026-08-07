# Snapshot Strategy

**Version:** 0.2
**Status:** Discovery / Data Platform Design — MVP physical-schema readiness updated 2026-08-05
**Owner:** Engineering / Lab Operations
**Last Updated:** 2026-08-05

## Purpose

Document every canonical snapshot entity's data-platform characteristics — update frequency, lifecycle, versioning, and retention — in one place. Each snapshot's business purpose, owner, source, and relationships are already defined in [`docs/entities/`](../entities/); this document does not repeat that in full, only summarizes it and adds the dimensions [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) requires: how often it updates, how it moves through its lifecycle, whether/how it is versioned, and how long it is retained.

## Shared Rules (Apply to Every Snapshot)

- **Lifecycle:** Created once (via Normalization, see [`import-persistence.md`](import-persistence.md)), then **Immutable** for the rest of its life, eventually **Archived** per [`05-retention-policy.md`](05-retention-policy.md). No snapshot is ever Updated in place.
- **Versioning:** Snapshots themselves are not versioned (see [`03-versioning-strategy.md`](03-versioning-strategy.md) — versioning applies to definitions, not observations). Each snapshot instead **references** the [ImportProfile](../entities/import-profile.md) version and [ImportJob](../entities/import-job.md) that produced it, so its provenance is always traceable.
- **Retention:** Indefinite by default (see [`05-retention-policy.md`](05-retention-policy.md)) — historical snapshots remain necessary for trend analysis and for explaining historical Alerts and Recommendations.

## RevenueSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/revenue-snapshot.md`](../entities/revenue-snapshot.md).
- **Update frequency:** Daily (Power BI, operational) and monthly (P&L, authoritative/finalized).
- **Lifecycle:** Standard (above). A finalized P&L snapshot must never be overwritten by a later preliminary Power BI snapshot for the same period — a new, distinct snapshot is created instead, with its `is_finalized` distinction preserved (see [`docs/business/01-revenue.md`](../business/01-revenue.md)).
- **Versioning:** Standard (above).
- **Retention:** Standard (above); required for month-over-month and trend calculations.

## PayrollSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md).
- **Update frequency:** Monthly, matching the P&L.
- **Lifecycle:** Standard (above).
- **Versioning:** Standard (above); additionally references the organization-specific account-mapping version active at import time (see [`03-versioning-strategy.md`](03-versioning-strategy.md) Organization-Specific Configuration).
- **Retention:** Standard (above); required for payroll-percentage and overtime trend history.

## LaborModelSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/labor-model-snapshot.md`](../entities/labor-model-snapshot.md).
- **Update frequency:** Expected monthly (exact cadence still marked "To be confirmed" in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md)).
- **Lifecycle:** Standard (above).
- **Versioning:** Standard (above).
- **Retention:** Standard (above); required for Staffing Adherence trend and Understaffing Detection history.

## BacklogSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/backlog-snapshot.md`](../entities/backlog-snapshot.md).
- **Update frequency:** Not yet confirmed — likely daily or weekly (OQ-052).
- **Lifecycle:** Standard (above).
- **Versioning:** Standard (above).
- **Retention:** Standard (above); backlog trend display is an explicit product requirement ([`docs/business/07-backlog.md`](../business/07-backlog.md)).
- **MVP physical-schema readiness (Sprint 3B, 2026-08-05):** moved into MVP scope via a header/detail/dimension design (`backlog_snapshot` + `backlog_stage_count` + a configurable, versioned `production_stage` dimension) that does not require the final production-stage taxonomy (OQ-049, OQ-069) to be confirmed before the tables exist — a new or renamed stage is a new row, not a schema change. See [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md).

## ProductionSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/production-snapshot.md`](../entities/production-snapshot.md) (purpose/relationships only — fields not yet defined, per Sprint 1.5 scope).
- **Update frequency:** Not yet confirmed; source Production Report's frequency is itself marked "To be confirmed" in [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md).
- **Lifecycle:** Standard (above), once fields are defined.
- **Versioning:** Standard (above), once an Import Profile exists for this source.
- **Retention:** Standard (above).

## QualitySnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/quality-snapshot.md`](../entities/quality-snapshot.md) (purpose/relationships only — fields not yet defined).
- **Update frequency:** Not yet confirmed; no source system has been identified yet (resets/remakes definitions remain open — OQ-021 through OQ-026).
- **Lifecycle:** Standard (above), once fields and source are defined.
- **Versioning:** Standard (above).
- **Retention:** Standard (above); quality history is especially sensitive given the non-attribution rule in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) (a reset/remake must never be automatically attributed to a specific technician or clinician) — retention design must preserve that rule, not just the data.

## CareerGridSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/career-grid-snapshot.md`](../entities/career-grid-snapshot.md) (purpose/relationships only — fields not yet defined).
- **Update frequency:** Weekly, updated Mondays, per [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) — though that same document flags an unresolved inconsistency with an earlier "updated monthly" statement (OQ-001).
- **Lifecycle:** Standard (above), once fields are defined.
- **Versioning:** Standard (above).
- **Retention:** Standard (above); required for JobRole/skill progression history.

## RecruitingSnapshot

- **Purpose / Owner / Relationships:** See [`docs/entities/recruiting-snapshot.md`](../entities/recruiting-snapshot.md) (purpose/relationships only — fields not yet defined).
- **Update frequency:** Not yet confirmed; the Open Positions Report source does not state a frequency in [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md).
- **Lifecycle:** Standard (above), once fields are defined.
- **Versioning:** Standard (above).
- **Retention:** Standard (above); required for Open Positions trend and for correlating recruiting response time against Understaffing Detection alerts.

## MVP Physical-Schema Status (Sprint 3B, 2026-08-05)

RevenueSnapshot, PayrollSnapshot, LaborModelSnapshot, and BacklogSnapshot all have proposed physical table designs as of Sprint 3B — see [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md). **ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, and RecruitingSnapshot remain physically deferred** — no table was created for any of the four, per [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md); their entries below are unchanged from prior sprints and remain purpose/relationships-only.

## Summary Table

| Snapshot | Update Frequency | Source Documented? |
|---|---|---|
| RevenueSnapshot | Daily + Monthly | Yes |
| PayrollSnapshot | Monthly | Yes |
| LaborModelSnapshot | Monthly (unconfirmed) | Yes (full schema) |
| BacklogSnapshot | Daily/Weekly (unconfirmed — OQ-052) | Partially |
| ProductionSnapshot | Unconfirmed | No |
| QualitySnapshot | Unconfirmed | No |
| CareerGridSnapshot | Weekly, Mondays (inconsistency noted — OQ-001) | Partially |
| RecruitingSnapshot | Unconfirmed | Partially |

## Related Documents

- [Entity Catalog](../entities/README.md)
- [Data Lifecycle](02-data-lifecycle.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Retention Policy](05-retention-policy.md)
- [Import Persistence](import-persistence.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
