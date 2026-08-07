# LabPulse Project Memory

**Version:** 0.5
**Status:** Platform Design — Sprint 3 (Database Design) underway
**Last Updated:** 2026-08-05

## Purpose

This is the repository's persistent memory: a single place to see current architecture, current decisions, interview coverage, risks, pending work, and repository health without re-reading every document. It should be updated whenever architecture changes, a decision is made, an interview is completed, or a milestone is reached.

## Current Milestone

**Sprint 1 (Platform Foundation), Sprint 1.5 (Domain Model Finalization & AI Knowledge Layer), Sprint 2 (Data Platform Design), and Sprint 2.5 (Legacy Knowledge Extraction) are all complete.** The repository has defined the canonical data model concept, a conceptual entity catalog (24 entities), an immutable Recommendation lifecycle with a concrete persistence design, a full logical data platform (relationships, lifecycle, versioning, audit, retention, snapshot strategy, import persistence, capability-based permissions), DDD-inspired domain boundaries, a conceptual ERD, a dedicated AI knowledge layer, and an extraction of validated business knowledge from a previously undocumented legacy implementation. See Completed Deliverables below.

**Sprint 3 (Database Design) is underway and gated: Sprint 3A (Decision Reconciliation) and Sprint 3B (Logical-to-Physical Database Mapping) are complete; Sprint 3C (RLS and Security Policy Design) and Sprint 3D (Independent Design Review) have not started.** Sprint 3A produced a corrected decision-reconciliation report reviewing an external architecture review against the actual repository state. Sprint 3B translated the founder-approved decisions into a proposed physical PostgreSQL/Supabase schema — see [`docs/database/`](../database/), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md), and [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md). No migrations, executable SQL, or Supabase project exist yet — Sprint 3B produced a reviewable design proposal only, still local and uncommitted pending founder review.

**Legacy discovery:** a repository comparison audit found the founder's archived GitHub repository contains a working Tauri desktop application covering much of the same business domain, built and paused before this documentation-first effort began. It is not the implementation target, but its business knowledge has been extracted into [`docs/legacy/`](../legacy/README.md) — see Completed Deliverables (Sprint 2.5) and Known Risks below.

**Naming correction:** Sprint 1.5's Project Memory referred to the upcoming database-design sprint as "Sprint 2." The founder has since named this sprint (data platform design, no schema) "Sprint 2" instead. The database-design sprint is renumbered **Sprint 3** throughout this document and the rest of the repository as of this update.

## Current Architecture

- **Stack (proposed, not yet accepted):** Next.js, TypeScript, Supabase (PostgreSQL, Auth, Storage, Row-Level Security), Tailwind CSS, shadcn/ui, GitHub, Vercel. See [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md).
- **Multi-tenancy:** Shared database, organization-scoped records, Row-Level Security (ADR-002).
- **Authorization:** Office-based, not region-based. `Organization -> Office -> Permissions -> User`. Region is descriptive metadata on an office. See [ADR-004](../decisions/ADR-004-office-based-authorization.md).
- **Import architecture:** `Import -> Import Profile -> Validation -> Normalization -> Canonical LabPulse Data Model -> Business Rules -> Scenario Engine -> Dashboard`. No application logic may depend directly on source-file layouts. See [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md).
- **Canonical data model:** One set of canonical objects (cataloged conceptually in [`docs/entities/`](../entities/)) is the only shape every subsystem may depend on. Import layouts never become application models. See [ADR-005](../decisions/ADR-005-canonical-data-model.md) and [`docs/architecture/canonical-data-principles.md`](../architecture/canonical-data-principles.md).
- **Recommendations:** Every recommendation type (Hiring, LSS, Transfer, Coaching, Travel, Budget) shares one common structure and immutable lifecycle, with a concrete persisted-field design (Origin, Evidence, Business Rule Version, Scenario Version, Snapshot Version, Approval, Outcome, Resolution, Superseded By). See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md).
- **Data platform philosophy:** Logical data model precedes database design. Data ownership, versioning, audit, snapshots, and immutable history are all settled before schema work begins. See [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) and [`docs/data-model/`](../data-model/).
- **Permissions:** Capability-based, not hardcoded. `User -> SecurityRole -> Permission Set (Capabilities) -> Office Assignment`. See [`docs/data-model/permission-model.md`](../data-model/permission-model.md).
- **Domain boundaries:** Twelve DDD-inspired bounded contexts (Organizations, Users, Permissions, Imports, Snapshots, Business Rules, Scenarios, Recommendations, Dashboard, Notifications, AI, Infrastructure), each with one-directional dependencies. See [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md).
- **Layering:** Presentation, Application, Domain, Data, and AI Integration layers, with domain calculations as pure, tested functions. See [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md).
- **AI:** Provider-abstracted, organization-controlled, never authoritative for calculations. See ADR-003.

## Current Decisions

| Decision | Status | Reference |
|---|---|---|
| Next.js + Supabase | Proposed | [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md) |
| Organization-based multi-tenancy with RLS | Proposed | [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md) |
| Customer-controlled AI providers | Proposed | [ADR-003](../decisions/ADR-003-ai-provider-strategy.md) |
| Office-based authorization (replaces region-based) | **Accepted (2026-08-05)** | [ADR-004](../decisions/ADR-004-office-based-authorization.md) |
| Canonical data model as the single internal contract | Proposed | [ADR-005](../decisions/ADR-005-canonical-data-model.md) |
| Architectural philosophy (read first) | Proposed | [ADR-000](../decisions/ADR-000-architectural-philosophy.md) |
| Data platform philosophy (logical model before database) | Proposed | [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) |
| Proposed physical data model (Sprint 3B) | Proposed | [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) |

ADR-004 was formally **Accepted** on 2026-08-05 following explicit founder authorization for Sprint 3B. Every other ADR, including the new ADR-007, remains **Proposed** pending further review — see [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md).

## Completed Deliverables

### Sprint 1 – Platform Foundation

- [North Star](../product/00-north-star.md) — mission, vision, and the seven product principles (deterministic-first, explainability, user trust, configuration over customization, one canonical data model, multi-tenant readiness, import independence)
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [Entity Catalog](../entities/) — 18 conceptual canonical entities, no SQL
- [Recommendation Framework](../architecture/recommendation-framework.md) — one common structure and lifecycle for every recommendation type
- [Decision Graph](../architecture/decision-graph.md) — Mermaid diagrams mapping snapshots to metrics to business rules to alerts/recommendations to scenarios
- [Canonical Data Principles](../architecture/canonical-data-principles.md) — the Import → Validation → Normalization → Canonical Objects → Business Rules → Scenario Engine → Presentation Layer pipeline, explained

### Sprint 1.5 – Domain Model Finalization & AI Knowledge Layer

- [ADR-000: Architectural Philosophy](../decisions/ADR-000-architectural-philosophy.md) — the twelve principles every contributor reads first
- [AI Context](AI_CONTEXT.md), [Executive Summary](EXECUTIVE_SUMMARY.md), and [Decision Log](DECISION_LOG.md) — the repository's new AI knowledge layer
- Naming collision resolved: [JobRole](../entities/job-role.md) and [SecurityRole](../entities/security-role.md) split from the superseded [Role](../entities/role.md) entity
- Terminology resolved: "Office" is the sole canonical internal term; "Location" is UI-display-only (see [`docs/entities/office.md`](../entities/office.md), OQ-053 now Resolved)
- Four conceptual snapshot entities added (purpose/relationships only, fields deferred): [ProductionSnapshot](../entities/production-snapshot.md), [QualitySnapshot](../entities/quality-snapshot.md), [CareerGridSnapshot](../entities/career-grid-snapshot.md), [RecruitingSnapshot](../entities/recruiting-snapshot.md)
- Recommendation lifecycle made immutable: Generated → Presented → Approved/Rejected → Completed/Superseded → Archived (see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md))
- [Event-Driven Processing](../architecture/event-driven-processing.md) — conceptual pipeline extended with Snapshot Update, Recommendation Generation, Notifications, Dashboard Refresh (architectural guidance only, no technology chosen)
- [`CLAUDE.md`](../../CLAUDE.md) updated with a Repository Stewardship rule requiring these memory documents to be kept current at the end of every sprint

### Sprint 2 – Data Platform Design

- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md) — why logical models precede databases, data ownership, versioning/audit/snapshot philosophy, immutable history, operational-vs-imported separation
- [`docs/data-model/`](../data-model/) created: [Entity Relationships Framework](../data-model/01-entity-relationships.md), [Data Lifecycle Framework](../data-model/02-data-lifecycle.md), [Versioning Strategy](../data-model/03-versioning-strategy.md), [Audit Strategy](../data-model/04-audit-strategy.md), [Retention Policy](../data-model/05-retention-policy.md)
- [Relationship Catalog](../data-model/relationship-catalog.md) — every entity relationship, conceptual only
- [Snapshot Strategy](../data-model/snapshot-strategy.md) — all eight snapshot types with update frequency, lifecycle, versioning, and retention
- [Import Persistence](../data-model/import-persistence.md) — Raw Import → Validation → Normalization → Canonical Snapshot → Archive → Audit; nothing is deleted
- [Recommendation Persistence](../data-model/recommendation-persistence.md) — concrete persisted-field design (Origin, Evidence, versions, Approval, Outcome, Resolution, Superseded By)
- [Permission Model](../data-model/permission-model.md) — capability-based authorization; resolved a second naming collision (Capability vs. the Permission entity)
- [Entity Lifecycle](../data-model/entity-lifecycle.md) — Created/Updated/Versioned/Immutable/Archived/Soft-Deleted/Hard-Deleted applicability for all 24 entities
- [Domain Boundaries](../architecture/domain-boundaries.md) — twelve DDD-inspired bounded contexts with one-directional dependencies
- [ERD Concept](../architecture/erd-concept.md) — two conceptual Mermaid ER diagrams, no SQL

### Sprint 2.5 – Legacy Knowledge Extraction

- [`docs/legacy/`](../legacy/README.md) created (10 documents): overview, feature inventory, business rule comparison, formula candidates, import workflow analysis, UI workflow analysis, terminology, gap analysis, reusable concepts
- 5 real formulas found with no current equivalent (Margin %, Outside Lab Spend, Outside Lab Spend %, Data Completeness %, Submission Compliance Rate/Streaks) and a detailed backlog/production-stage taxonomy (Backlog in Lab: 5 stages; Backlog in Clinic: 4 stages; 11-category unit-tier/case-type breakdown) — the most concrete evidence yet toward resolving OQ-049
- **Critical conflict found:** legacy alert thresholds (laboratory expense >20%/>25%, personnel >15%/>20%, backlog >50/>100) differ substantially from the four approved thresholds (10.8%, 8.0%, 20 cases) — flagged for founder validation, not adopted
- 8 new open questions added (OQ-066–OQ-073), none resolved by assuming legacy behavior was correct
- No code copied or reused; no Git changes to either repository; no architecture decisions altered

### Sprint 3A – Decision Reconciliation and Schema Readiness

- A corrected decision-reconciliation report reviewing an external Gemini architecture review's findings against the actual repository state, rejecting or correcting several unverifiable or contradicted claims
- Identified the one genuine schema-blocking open question (OQ-061, staffing unit) versus many legitimately deferrable items
- A five-item founder decision packet, all subsequently approved (see Sprint 3B)

### Sprint 3B – Logical-to-Physical Database Mapping

- [`docs/database/`](../database/) created (ten documents): physical model principles, table catalog, column/type catalog, keys/relationships/constraints, temporal/versioning/snapshot patterns, import lineage model, authorization data model, retention/archive/erasure boundaries, deferred entities, schema review checklist
- [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) — four Mermaid ER diagrams distinguishing MVP, deferred, optional, version, and header/detail structures
- [ADR-007: Proposed Physical Data Model](../decisions/ADR-007-proposed-physical-data-model.md) (Proposed)
- [ADR-004](../decisions/ADR-004-office-based-authorization.md) formally **Accepted**
- Founder-approved decisions applied: MVP SecurityRole list (3 roles, 6 deferred), extensible staffing-unit design (OQ-061 partially resolved), Labor %/Payroll % permanent separation (OQ-060 resolved), BacklogSnapshot header/detail/dimension design (moved into MVP scope), archive-not-delete retention default confirmed, legacy thresholds not adopted (OQ-066 resolved for MVP), franchise grouping excluded from MVP (OQ-055 resolved for MVP)
- No migrations, executable SQL, Supabase project, dependencies, or application code created — a reviewable design proposal only, per [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md)

## Repository Maturity

The repository has progressed from pure business discovery (Sprint 0) through an architecture-transition pass (region-to-office authorization, import framework, scenario engine, BR-002–BR-006), into Platform Design (Sprint 1), through a domain-model finalization pass (Sprint 1.5) that closed out naming ambiguities and gave the repository a dedicated AI-facing knowledge layer, and now through Data Platform Design (Sprint 2), which settled ownership, versioning, audit, snapshot, and immutability philosophy before any schema exists. A named, cross-linked conceptual data model, a philosophy every decision can be checked against, and now a full logical data platform design exist ahead of any database or application work. This is intentionally sequenced to avoid the repeated database redesigns and tightly coupled code that would result from starting implementation without these decisions already settled.

## Completed Interviews

Per the founder, discovery interviews have been completed covering:

- Executive workflow — [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md)
- Revenue — [`docs/business/01-revenue.md`](../business/01-revenue.md)
- Payroll and labor expenses — [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md)
- Backlog — [`docs/business/07-backlog.md`](../business/07-backlog.md)
- Overtime — [`docs/business/04-overtime.md`](../business/04-overtime.md)
- Hiring — reflected structurally in [BR-002](../business/rules/BR-002-hiring-recommendation.md) and [`docs/scenario-engine/01-hiring.md`](../scenario-engine/01-hiring.md); no formula or threshold has been provided yet
- Labor Model — reflected in [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md); workbook structure documented, several fields (Staffing Adherence % formula, Labor % of Revenue reconciliation, staffing unit) remain unresolved
- LSS — reflected structurally in [BR-005](../business/rules/BR-005-lss-recommendation.md) and [`docs/scenario-engine/03-lss-support.md`](../scenario-engine/03-lss-support.md); eligibility and duration remain unresolved (OQ-040, OQ-041)
- Scenario planning — reflected in [`docs/scenario-engine/README.md`](../scenario-engine/README.md) and its three scenario documents; explicitly structure-only, no formulas yet

**Important nuance:** for Hiring, Labor Model, LSS, and Scenario Planning, "completed" reflects that the founder has covered these topics in conversation and this repository now has structural documentation for them. It does not mean every formula, threshold, or exhaustive field list has been confirmed — those gaps are tracked as open questions rather than assumed.

## Outstanding Interviews

Topics referenced elsewhere in the repository that do not yet have a dedicated interview or business-rules document:

- Career Grid (structure, cadence, and use beyond what's in [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md))
- Quality (resets, remakes, and other quality measures — OQ-021 through OQ-026)
- Recruiting and open positions (OQ-033 through OQ-042 touch this indirectly, but no dedicated interview exists)
- Transfer analysis criteria (OQ-035)
- Revenue root-cause systems: call rate, welcome-call, conversion rate (OQ-027 through OQ-032)
- Franchise model design (named as a future requirement in ADR-004, not yet interviewed)
- AI provider selection and billing model specifics (ADR-003 covers strategy, not a chosen provider)

## Known Risks

- **Labor % of Revenue vs. Payroll Percentage divergence:** **separation decision resolved 2026-08-05** — the two are now permanently treated as separate, never-merged facts (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)). Whether their underlying formulas would actually produce different numbers for a real workbook remains unconfirmed; the risk of silently conflating them, specifically, is closed.
- **New business rules (BR-002 through BR-006) have no approved formulas or thresholds.** They exist as structure only; implementing them prematurely with assumed values would violate the repository's "do not invent business rules" constraint.
- **Single-workbook dependency for Labor Model schema:** only one workbook has been analyzed; formatting risk across future workbook revisions or other organizations' formats is unconfirmed.
- **Temporary office assignments** now have a physical column design (Sprint 3B) but expiry enforcement is still undesigned (OQ-054 partially resolved). **Future franchises** are now explicitly excluded from the MVP hierarchy (OQ-055 resolved for MVP) rather than left as an implementation-blocking unknown, though the eventual franchise design itself remains open.
- **Real data discipline:** the repository must continue to contain no real office names, real Office IDs, real region names, or real financial/staffing values. This has been maintained so far and must be re-verified on every future documentation pass, including throughout Sprint 3B's schema documents.
- **SecurityRole candidate list:** **resolved for MVP, 2026-08-05** — the PRD's initial three roles (Organization Administrator, Operations Manager, Read-Only Viewer) are the approved MVP configuration; the expanded six-role list is explicitly deferred, not rejected (see [`docs/entities/security-role.md`](../entities/security-role.md)).
- **Entity catalog is conceptual only:** [`docs/entities/`](../entities/) defines purpose, relationships, and high-level fields, not a schema. Four entities (ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, RecruitingSnapshot) do not yet even have fields defined, by design, and remain physically deferred as of Sprint 3B (see [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md)).
- **Scenario definitions are not yet formally versioned** in the logical model, but Sprint 3B proposes a physical `scenario_definition`/`scenario_definition_version` design closing this gap at the schema level (see [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md)) — the logical-model gap in [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md) should be updated to reflect this in a future pass.
- **Hard-delete / retention reconciliation is unresolved:** the archive-not-delete **default** is now confirmed (Sprint 3B, see [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md)); the exceptional legitimate-erasure pathway remains deliberately undesigned — see [`docs/database/08-retention-archive-and-erasure-boundaries.md`](../database/08-retention-archive-and-erasure-boundaries.md).
- **Notifications has no formal entity yet** — deliberately still true after Sprint 3B; see [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) Open Questions and [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md).
- **Legacy alert thresholds conflict sharply with approved thresholds** (roughly 2–5x higher in every case found). **Resolved for MVP, 2026-08-05:** the legacy thresholds are not adopted; the four approved values remain the configurable, versioned defaults (OQ-066). A future volume-adjusted threshold model remains a separate, unresolved enhancement.
- **Terminology equivalence unconfirmed:** whether legacy's "Personnel %" and "Lab Exp %" are the same metrics as the approved Payroll Percentage and Laboratory Expense Percentage is not yet confirmed (OQ-067) — treating them as interchangeable without confirmation would risk corrupting the Metrics Dictionary.
- **New (Sprint 3B): `organization_id`/`office_id` consistency-enforcement gap.** Every table carrying a denormalized `organization_id` alongside an `office_id` has no schema-level guarantee the two agree; Sprint 3C must design a trigger, application-layer invariant, or alternative before RLS policies can safely trust `organization_id` — see [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md).

**Resolved this sprint (Sprint 3B, 2026-08-05):** SecurityRole MVP list, Labor %/Payroll % separation (conflation risk only), franchise MVP exclusion, legacy-threshold non-adoption, retention default confirmation, OQ-061 architecture-level partial resolution. **Resolved in Sprint 2.5:** none — legacy-related risks were surfaced, not resolved. **Resolved in Sprint 1.5:** the "Role" naming ambiguity (split into JobRole and SecurityRole) and Office/Location terminology drift (Office is now sole canonical term; OQ-053 Resolved) — see [`docs/development/DECISION_LOG.md`](DECISION_LOG.md).

## Remaining Architectural Work

Not yet designed or approved:

- **Row-Level Security policy design** (Sprint 3C) for office-based and organization-based scoping, using the ownership/access dependencies documented in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md)
- **The `organization_id`/`office_id` consistency-enforcement mechanism** (trigger, application-layer invariant, or design change) flagged as a new Sprint 3B risk above
- **Independent review of the Sprint 3B physical-model proposal** (Sprint 3D) before any table design is treated as final
- Franchise grouping's eventual design (excluded from MVP, not designed even conceptually — OQ-055)
- Temporary office assignment expiry-enforcement mechanism (OQ-054, columns proposed, behavior undecided)
- Import Profile schema implementation for sources beyond Labor Model (conceptually defined in [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md); Sprint 3B's physical import-lineage tables are source-agnostic, but only the Labor Model profile has a documented source schema)
- AI credential storage mechanism (ADR-003 defers this explicitly)
- Database migration strategy and tooling choice
- Fields, source systems, grain, and cadence for the four purpose-only snapshot entities (ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, RecruitingSnapshot) — still physically deferred after Sprint 3B
- A formal Notifications entity, if one is needed (still deferred after Sprint 3B)
- Any event-bus, queue, or notification technology implied by [`docs/architecture/event-driven-processing.md`](../architecture/event-driven-processing.md) (explicitly deferred, guidance only)
- Resolution of the remaining legacy reconciliation questions not touched by Sprint 3B (OQ-067 through OQ-073 except OQ-066)
- Confirmation or revision of the Sprint 3B judgment calls flagged throughout [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) (the `metric_observation` persistence approach, the 1:1 SecurityRole–Permission-Set assumption, `employee_office_assignment` and `task_status_history`'s inclusion)

## Recommended Next Sprint

**Sprint 3C – RLS and Security Policy Design.** Using the Sprint 3B physical-model proposal ([`docs/database/`](../database/)) and the ownership/access dependencies recorded in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md), design (as documentation, not executable SQL) the Row-Level Security policy logic for every tenant-owned table, and resolve the `organization_id`/`office_id` consistency-enforcement mechanism flagged as a Sprint 3B risk. Sprint 3D (Independent Design Review) should follow before any part of the physical model is treated as Accepted. See [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md) Section 10 for the full gated Sprint 3A–3D plan. Still no migrations or application code.

## Repository Health

- Status: Platform Design / Sprint 3 (Database Design) underway — no application code, no dependencies, no database migrations exist. Sprint 3B's physical-model proposal is documentation only, still local and uncommitted pending founder review.
- Documentation is internally cross-linked (business rules, metrics dictionary, architecture, imports, scenario engine, entities, data model, database design proposal, legacy findings, decisions, open questions, and the AI knowledge layer) and has been kept consistent across updates.
- No confidential, real employee, real customer, or real financial data has been found in the repository as of this update, including in the legacy source inspected during Sprint 2.5 and the new [`docs/database/`](../database/) documents added in Sprint 3B.
- Open-question backlog is actively used and current (73 tracked questions as of this update; four resolved or partially resolved this sprint — OQ-055, OQ-060, OQ-061, OQ-066) rather than left to go stale.
- Business-rule and metric documents consistently flag unresolved formulas rather than assuming values, per [`CLAUDE.md`](../../CLAUDE.md) — including newly discovered legacy formulas, none of which were adopted without flagging them for validation, and including every judgment call made during Sprint 3B's physical-model design, flagged individually rather than silently decided.
- A repository-stewardship rule exists in [`CLAUDE.md`](../../CLAUDE.md) requiring this file, AI_CONTEXT, EXECUTIVE_SUMMARY, PRODUCT_BACKLOG, README, and DECISION_LOG to be reviewed at the end of every sprint — this update is the fifth application of that rule.

## Current Sprint

**Sprint 3B – Logical-to-Physical Database Mapping: Complete (2026-08-05).**

Scope: following Sprint 3A's decision-reconciliation report and the founder's explicit approval of its recommendations, this sprint translated the conceptual entity catalog and logical data platform design into a proposed PostgreSQL/Supabase physical schema. Created [`docs/database/`](../database/) (ten documents), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), and [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) (Proposed). Accepted [ADR-004](../decisions/ADR-004-office-based-authorization.md). Updated [`docs/entities/security-role.md`](../entities/security-role.md), [`permission.md`](../entities/permission.md), [`labor-model-snapshot.md`](../entities/labor-model-snapshot.md), [`backlog-snapshot.md`](../entities/backlog-snapshot.md), [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md), [`snapshot-strategy.md`](../data-model/snapshot-strategy.md), [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md), and [`docs/development/open-questions.md`](open-questions.md) (OQ-055, OQ-060, OQ-061, OQ-066). No SQL, migrations, Supabase project, dependencies, or application code were created; nothing was committed or pushed — see [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md) for the full report.

**Sprint 3A – Decision Reconciliation and Schema Readiness: Complete (2026-08-05).** Produced a corrected decision-reconciliation report reviewing an external architecture review against actual repository state; identified OQ-061 as the only genuine schema blocker and produced the five-item founder decision packet Sprint 3B then implemented.

Prior sprints: **Sprint 2.5 – Legacy Knowledge Extraction** (2026-08-04) extracted business rules, formulas, import workflows, terminology, and gaps from the founder's archived Tauri desktop application into [`docs/legacy/`](../legacy/README.md), without adopting any of it automatically. **Sprint 2 – Data Platform Design** (2026-08-04) delivered ADR-006 and the full [`docs/data-model/`](../data-model/) set, [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md), and [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md). **Sprint 1.5 – Domain Model Finalization & AI Knowledge Layer** (2026-08-04) delivered the AI knowledge layer, ADR-000, the JobRole/SecurityRole split, the Office/Location convention, four purpose-only snapshot entities, the immutable Recommendation lifecycle, and the event-driven conceptual pipeline. **Sprint 1 – Platform Foundation** (2026-08-04) delivered the North Star, ADR-005, the original 18-entity conceptual catalog, the Recommendation Framework, and the Decision Graph.

**Sprint 3C (RLS and Security Policy Design) has not started.**

## Open Questions

The authoritative, individually tracked question log is [`docs/development/open-questions.md`](open-questions.md). As of this update it spans:

- Data cadence and workflow (OQ-001–OQ-006)
- Revenue (OQ-007–OQ-010, OQ-043)
- Payroll and laboratory expense (OQ-011–OQ-015, OQ-044–OQ-046)
- Overtime and backlog (OQ-016–OQ-020, OQ-047–OQ-052)
- Quality (OQ-021–OQ-026)
- Revenue root cause (OQ-027–OQ-032)
- Operational decisions (OQ-033–OQ-042)
- Architecture and authorization (OQ-053 Resolved; OQ-054 partially resolved; OQ-055 resolved for MVP)
- Import framework and Labor Model (OQ-056–OQ-059 still open; OQ-060 resolved; OQ-061 partially resolved at the architecture level)
- New business rules and scenario engine (OQ-062–OQ-065)
- **Legacy reconciliation (OQ-066–OQ-073)** — OQ-066 (threshold non-adoption) resolved for MVP this sprint; OQ-067–OQ-073 (terminology equivalence, backlog/production taxonomy, candidate metrics, submission compliance, weekly-to-monthly aggregation, Labor Model Value) remain open

Not yet numbered open questions, but tracked here: the exact `organization_id`/`office_id` consistency-enforcement mechanism (new this sprint, see Known Risks), and the judgment calls flagged throughout [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) awaiting Sprint 3D confirmation.

No formula, threshold, or business rule should be implemented from an open question until it is resolved and dated — this now explicitly includes every formula and threshold found in the legacy application (see [`docs/legacy/`](../legacy/README.md)) and every judgment call flagged in the Sprint 3B physical-model proposal until Sprint 3D confirms it.
