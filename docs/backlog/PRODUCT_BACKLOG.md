# LabPulse Product Backlog

**Version:** 0.4
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

This is the first professional backlog for LabPulse, organized by epic. Every item is marked **Discovery** because the repository is still in the discovery/architecture phase — no item here is approved for implementation, and this backlog does not authorize writing application code, installing dependencies, or creating database migrations.

## Development Constitution

These principles govern how every backlog item below must eventually be implemented. They are drawn from [`CLAUDE.md`](../../CLAUDE.md) and the architecture and security documents already in this repository, restated here as a single, durable reference.

1. **No hardcoded thresholds.** Every numeric review trigger (payroll %, laboratory expense %, overtime cost, backlog cases, and any future threshold) must be configurable and versioned, never a literal constant in application or UI code.
2. **No hardcoded business rules.** Business rules live in tested domain functions, not scattered across UI components or ad hoc scripts.
3. **Business rules are versioned.** A rule's version must be visible in its output so a manager can tell which definition produced a given recommendation.
4. **Imports are versioned.** Every import is tied to the Import Profile version active at import time (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)), so historical imports remain interpretable after a profile changes.
5. **Calculations are independently testable.** Financial, staffing, overtime, and scenario calculations are pure functions with unit tests, independent of the UI.
6. **Business logic stays outside UI.** The presentation layer displays results; it never computes authoritative financial or staffing figures.
7. **Explain every recommendation.** Every alert, flag, or scenario output shows the data used, the rule or formula applied, the assumptions made, and its limitations.
8. **AI never replaces deterministic business rules.** AI may explain or summarize; it must never be the source of a financial, staffing, or threshold calculation.
9. **Configuration before customization.** Prefer organization-level configuration (mappings, thresholds, targets) over one-off code paths per customer.
10. **Backward-compatible migrations.** Database changes are additive and reversible where practical; destructive schema changes require explicit approval per [`CLAUDE.md`](../../CLAUDE.md).
11. **Every feature requires documentation.** A feature is not complete until its business rule, metric definition, or architecture decision is documented in this repository.

## How to Read This Backlog

Each epic lists candidate items at a discovery level of detail — enough to communicate intent, not enough to start building. Every item's status is **Discovery** until it has an approved design and, where relevant, an accepted ADR or a resolved set of open questions.

---

## Sprint Progress

### Sprint 1 – Platform Foundation: Complete (2026-08-04)

Delivered the shared canonical language every future component depends on, ahead of database design:

- [North Star](../product/00-north-star.md) product principles
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [Entity Catalog](../entities/) (18 conceptual entities)
- [Recommendation Framework](../architecture/recommendation-framework.md)
- [Decision Graph](../architecture/decision-graph.md)
- [Canonical Data Principles](../architecture/canonical-data-principles.md)

This closes the "Design the Canonical LabPulse Data Model schema" item under Epic: Import Framework **at the conceptual level only** — see that item's updated note below. No backlog item has moved out of **Discovery** status, since none has an approved concrete schema, accepted ADR, or fully resolved open questions yet.

### Sprint 1.5 – Domain Model Finalization & AI Knowledge Layer: Complete (2026-08-04)

Prepared the repository so future AI sessions and contributors can rely on it as the source of truth instead of conversation history:

- [ADR-000: Architectural Philosophy](../decisions/ADR-000-architectural-philosophy.md)
- [AI Context](../development/AI_CONTEXT.md), [Executive Summary](../development/EXECUTIVE_SUMMARY.md), [Decision Log](../development/DECISION_LOG.md)
- [JobRole](../entities/job-role.md) / [SecurityRole](../entities/security-role.md) split, resolving the "Role" naming collision (see superseded [Role](../entities/role.md))
- Office/Location terminology convention finalized (see [`docs/entities/office.md`](../entities/office.md); resolves OQ-053)
- Four conceptual snapshot entities added, purpose/relationships only: [ProductionSnapshot](../entities/production-snapshot.md), [QualitySnapshot](../entities/quality-snapshot.md), [CareerGridSnapshot](../entities/career-grid-snapshot.md), [RecruitingSnapshot](../entities/recruiting-snapshot.md)
- Recommendation lifecycle made immutable (Generated → Presented → Approved/Rejected → Completed/Superseded → Archived)
- [Event-Driven Processing](../architecture/event-driven-processing.md) conceptual pipeline documented (architectural guidance only)
- [`CLAUDE.md`](../../CLAUDE.md) Repository Stewardship rule established

Still no backlog item has moved out of **Discovery** status. New open item: reconcile the two SecurityRole candidate lists (see [`docs/entities/security-role.md`](../entities/security-role.md)) — added under Epic: Authentication below.

### Sprint 2 – Data Platform Design: Complete (2026-08-04)

Defined HOW information exists inside LabPulse — not schema, but the logical model beneath it, so Sprint 3 translates already-settled decisions instead of making them implicitly through table design:

- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
- [`docs/data-model/`](../data-model/): entity-relationship patterns, data lifecycle framework, versioning strategy, audit strategy, retention policy
- [Relationship Catalog](../data-model/relationship-catalog.md) — every entity relationship, conceptual only
- [Snapshot Strategy](../data-model/snapshot-strategy.md) — all 8 snapshots with update frequency, lifecycle, versioning, retention
- [Import Persistence](../data-model/import-persistence.md) and [Recommendation Persistence](../data-model/recommendation-persistence.md)
- [Permission Model](../data-model/permission-model.md) — capability-based authorization; resolved a second naming collision (Capability vs. the Permission entity)
- [Entity Lifecycle](../data-model/entity-lifecycle.md) — full lifecycle matrix for all 24 entities
- [Domain Boundaries](../architecture/domain-boundaries.md) — 12 DDD-inspired bounded contexts
- [ERD Concept](../architecture/erd-concept.md) — 2 conceptual Mermaid ER diagrams, no SQL

Still no backlog item has moved out of **Discovery** status. New open items added below: Scenario definition versioning (Epic: Scenario Engine), hard-delete/retention reconciliation (Epic: Database), and a possible Notifications entity (Epic: Dashboard).

**Naming correction:** the sprint previously called "Sprint 2 – Database Design" (see Sprint 1.5 entry above) is renumbered **Sprint 3**, since the founder used "Sprint 2" for this data-platform-design sprint instead.

### Sprint 2.5 – Legacy Knowledge Extraction: Complete (2026-08-04)

A repository comparison audit found the founder's archived GitHub repository contains a working Tauri desktop application covering much of LabPulse's business domain. This sprint extracted its business knowledge into [`docs/legacy/`](../legacy/README.md) — **no code was copied or reused, and nothing was automatically adopted**:

- [Legacy Overview](../legacy/01-legacy-overview.md), [Feature Inventory](../legacy/02-feature-inventory.md), [Business Rule Comparison](../legacy/03-business-rule-comparison.md), [Formula Candidates](../legacy/04-formula-candidates.md)
- [Import Workflow Analysis](../legacy/05-import-workflow-analysis.md), [UI Workflow Analysis](../legacy/06-ui-workflow-analysis.md), [Legacy Terminology](../legacy/07-legacy-terminology.md)
- [Gap Analysis](../legacy/08-gap-analysis.md), [Reusable Concepts](../legacy/09-reusable-concepts.md)

**Critical finding:** legacy alert thresholds conflict sharply with approved thresholds (see [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md)) — new backlog items added below (Epic: Business Rules) to track resolution. 8 new open questions added (OQ-066–OQ-073).

### Sprint 3 – Database Design: Not started

See [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md) Recommended Next Sprint.

---

## Epic: Business Rules

- Implement BR-001 Prioritize Location Review — **Discovery**
- Implement BR-002 Hiring Recommendation — **Discovery** (blocked on OQ-062)
- Implement BR-003 Understaffing Detection — **Discovery** (blocked on OQ-061, OQ-063)
- Implement BR-004 Overtime Escalation — **Discovery** (blocked on OQ-047, OQ-064)
- Implement BR-005 LSS Recommendation — **Discovery** (blocked on OQ-040, OQ-041)
- Implement BR-006 Staffing Adherence — **Discovery** (blocked on OQ-059, OQ-065)
- Design the standard Recommendation object structure — **Discovery** (conceptual design complete, see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md); implementation still Discovery)
- Design a shared business-rule evaluation and versioning mechanism — **Discovery** (conceptual versioning strategy complete, see [`docs/data-model/03-versioning-strategy.md`](../data-model/03-versioning-strategy.md))
- Reconcile legacy alert thresholds against approved thresholds (laboratory expense, personnel/payroll, backlog) — **Discovery** (new this sprint; see [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md), OQ-066)
- Evaluate candidate metrics discovered in the legacy application (Margin %, Outside Lab Spend, Outside Lab Spend %, Data Completeness %) for inclusion in the Metrics Dictionary — **Discovery** (see [`docs/legacy/04-formula-candidates.md`](../legacy/04-formula-candidates.md), OQ-070)

## Epic: Import Framework

- Design the Canonical LabPulse Data Model schema — **Discovery** (conceptual entity catalog and logical data model complete, see [`docs/entities/`](../entities/), [ADR-005](../decisions/ADR-005-canonical-data-model.md), and [`docs/data-model/`](../data-model/); concrete schema is Sprint 3 scope)
- Implement raw-import/archive/audit persistence — **Discovery** (conceptual design complete, see [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md))
- Implement the Import Profile schema (expected sheets, required/optional columns, aliases, version, validation rules, normalization rules) — **Discovery**
- Implement the Labor Model import profile — **Discovery** (blocked on OQ-056–OQ-061)
- Implement the P&L import profile — **Discovery**
- Implement the Payroll import profile — **Discovery**
- Implement the Career Grid import profile — **Discovery**
- Implement the Power BI import profile — **Discovery**
- Implement a generic CSV import profile — **Discovery**
- Implement the validation pipeline (structural, type, referential, business) — **Discovery**
- Implement the normalization pipeline — **Discovery**
- Implement import history and audit tracking — **Discovery**
- Design a weekly-to-monthly aggregation rule for volume/production imports — **Discovery** (new this sprint; legacy has a working but non-calendar-aligned reference implementation, see [`docs/legacy/04-formula-candidates.md`](../legacy/04-formula-candidates.md), OQ-072)

## Epic: Scenario Engine

- Design the scenario execution architecture (inputs, assumptions, outputs, warnings) — **Discovery**
- Implement the hiring scenario — **Discovery** (see [`docs/scenario-engine/01-hiring.md`](../scenario-engine/01-hiring.md))
- Implement the overtime-vs-hiring scenario, including break-even estimation — **Discovery** (see [`docs/scenario-engine/02-overtime-vs-hiring.md`](../scenario-engine/02-overtime-vs-hiring.md))
- Implement the LSS-support scenario — **Discovery** (see [`docs/scenario-engine/03-lss-support.md`](../scenario-engine/03-lss-support.md))
- Implement transfer-analysis scenario — **Discovery**
- Implement revenue increase/decrease scenarios — **Discovery**
- Design formal versioning for Scenario definitions — **Discovery** (new this sprint; blocks fully populating a Recommendation's Scenario Version field, see [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md) Open Questions)

## Epic: Dashboard

- Design the executive dashboard (first five KPIs: revenue, payroll percentage, overtime, open positions, backlog) — **Discovery**
- Design the location/office comparison page — **Discovery**
- Design the prioritized review queue driven by BR-001 through BR-006 — **Discovery**
- Design data-freshness and data-quality indicators — **Discovery**
- Design explainable-recommendation presentation components — **Discovery**
- Evaluate a Rankings view (rank offices by metric, with time-period navigation) — **Discovery** (new this sprint; validated legacy feature with no current product spec, see [`docs/legacy/02-feature-inventory.md`](../legacy/02-feature-inventory.md))
- Evaluate a Submission Compliance report (weekly data-submission streaks and rates) — **Discovery** (new this sprint; see [`docs/legacy/09-reusable-concepts.md`](../legacy/09-reusable-concepts.md), OQ-071)

## Epic: Notifications

- Decide whether Notifications needs a formal entity (a NotificationRecord) or remains an ephemeral delivery mechanism over existing Alert/Recommendation state — **Discovery** (new this sprint, see [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) Open Questions)
- Design the notification-delivery step in the event-driven conceptual pipeline — **Discovery** (see [`docs/architecture/event-driven-processing.md`](../architecture/event-driven-processing.md); no technology chosen)

## Epic: Authentication

- Implement Supabase Auth integration — **Discovery**
- Implement the Office Authorization hierarchy (Organization -> Office -> Permissions -> User) per [ADR-004](../decisions/ADR-004-office-based-authorization.md) — **Discovery** (blocked on OQ-054, OQ-055)
- Implement capability-based SecurityRole access control (candidate role values under reconciliation — see [`docs/entities/security-role.md`](../entities/security-role.md); capability model designed in [`docs/data-model/permission-model.md`](../data-model/permission-model.md)) — **Discovery**
- Implement temporary office assignment support — **Discovery** (blocked on OQ-054)
- Reconcile the two SecurityRole candidate lists (PRD's initial three vs. Sprint 1.5's expanded six) — **Discovery** (see [`docs/entities/security-role.md`](../entities/security-role.md))
- Define the final Capability list per SecurityRole's Permission Set — **Discovery** (blocked on the reconciliation above; see [`docs/data-model/permission-model.md`](../data-model/permission-model.md))

## Epic: Security

- Implement Row-Level Security policies scoped to organization and office — **Discovery**
- Implement cross-tenant access tests — **Discovery**
- Implement file-upload validation and private storage for imports — **Discovery**
- Implement audit logging for imports, SecurityRole changes, and scenario execution — **Discovery** (conceptual audit strategy complete, see [`docs/data-model/04-audit-strategy.md`](../data-model/04-audit-strategy.md))
- Implement AI credential storage design and review — **Discovery**

## Epic: Database

- Design and approve the initial schema (organizations, offices, permissions, imports, import profiles, canonical records, business-rule outputs, scenarios) — **Discovery** (conceptual entity relationships, lifecycle, and ERD complete, see [`docs/data-model/`](../data-model/) and [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md); this is Sprint 3 scope)
- Establish migration tooling and source-control tracking — **Discovery**
- Design RLS test strategy — **Discovery**
- Reconcile "nothing is deleted" with legitimate hard-delete/erasure obligations — **Discovery** (new this sprint, see [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md) Open Questions)

## Epic: Integrations

- Analyze and document the Power BI export structure — **Discovery**
- Analyze and document the Career Grid workbook structure — **Discovery**
- Analyze and document a representative P&L export structure — **Discovery**
- Evaluate future API-based integrations — **Discovery**

## Epic: AI

- Design the AI provider abstraction layer — **Discovery** (see [ADR-003](../decisions/ADR-003-ai-provider-strategy.md))
- Design organization-controlled AI credential configuration — **Discovery**
- Design plain-language explanation generation for dashboard and scenario output — **Discovery**
- Design AI usage limits and disable-by-default behavior — **Discovery**

---

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
