# LabPulse Project Memory

**Version:** 0.4
**Status:** Platform Design
**Last Updated:** 2026-08-04

## Purpose

This is the repository's persistent memory: a single place to see current architecture, current decisions, interview coverage, risks, pending work, and repository health without re-reading every document. It should be updated whenever architecture changes, a decision is made, an interview is completed, or a milestone is reached.

## Current Milestone

**Sprint 1 (Platform Foundation), Sprint 1.5 (Domain Model Finalization & AI Knowledge Layer), Sprint 2 (Data Platform Design), and Sprint 2.5 (Legacy Knowledge Extraction) are all complete.** The repository has defined the canonical data model concept, a conceptual entity catalog (24 entities), an immutable Recommendation lifecycle with a concrete persistence design, a full logical data platform (relationships, lifecycle, versioning, audit, retention, snapshot strategy, import persistence, capability-based permissions), DDD-inspired domain boundaries, a conceptual ERD, a dedicated AI knowledge layer, and an extraction of validated business knowledge from a previously undocumented legacy implementation. See Completed Deliverables below. **Sprint 3 (Database Design) has not started; see Recommended Next Sprint.**

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
| Office-based authorization (replaces region-based) | Proposed | [ADR-004](../decisions/ADR-004-office-based-authorization.md) |
| Canonical data model as the single internal contract | Proposed | [ADR-005](../decisions/ADR-005-canonical-data-model.md) |
| Architectural philosophy (read first) | Proposed | [ADR-000](../decisions/ADR-000-architectural-philosophy.md) |
| Data platform philosophy (logical model before database) | Proposed | [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) |

No ADR has been formally **Accepted** yet; all remain **Proposed** pending review, consistent with the repository still being in Discovery/Architecture, not implementation.

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

- **Labor % of Revenue vs. Payroll Percentage divergence:** the Labor Model workbook's "Labor % of Revenue" field may or may not be the same calculation as the P&L-derived Payroll Percentage metric. Presenting both without reconciliation could mislead a manager (OQ-060).
- **New business rules (BR-002 through BR-006) have no approved formulas or thresholds.** They exist as structure only; implementing them prematurely with assumed values would violate the repository's "do not invent business rules" constraint.
- **Single-workbook dependency for Labor Model schema:** only one workbook has been analyzed; formatting risk across future workbook revisions or other organizations' formats is unconfirmed.
- **Temporary office assignments and future franchises** are named requirements in ADR-004 without a design; implementing office-based authorization before these are designed risks rework.
- **Real data discipline:** the repository must continue to contain no real office names, real Office IDs, real region names, or real financial/staffing values. This has been maintained so far and must be re-verified on every future documentation pass.
- **SecurityRole candidate list is unreconciled:** the PRD's initial three roles (Organization Administrator, Operations Manager, Read-Only Viewer) and Sprint 1.5's expanded six-role list (Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive) have not been reconciled into one approved list (see [`docs/entities/security-role.md`](../entities/security-role.md)).
- **Entity catalog is conceptual only:** [`docs/entities/`](../entities/) defines purpose, relationships, and high-level fields, not a schema. Four entities (ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, RecruitingSnapshot) do not yet even have fields defined, by design.
- **Scenario definitions are not yet formally versioned**, which blocks fully populating a Recommendation's "Scenario Version" field as designed in [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md).
- **Hard-delete / retention reconciliation is unresolved:** [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)'s "nothing is deleted" principle has not yet been reconciled with legitimate deletion obligations (contractual/legal erasure requests) — see [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md) Open Questions.
- **Notifications has no formal entity yet** — see [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) Open Questions.
- **Legacy alert thresholds conflict sharply with approved thresholds** (roughly 2–5x higher in every case found: laboratory expense, personnel expense, and backlog). Requires founder resolution before Sprint 3 treats any threshold as a stable default — see [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md) and OQ-066.
- **Terminology equivalence unconfirmed:** whether legacy's "Personnel %" and "Lab Exp %" are the same metrics as the approved Payroll Percentage and Laboratory Expense Percentage is not yet confirmed (OQ-067) — treating them as interchangeable without confirmation would risk corrupting the Metrics Dictionary.

**Resolved this sprint (Sprint 2.5):** none of the risks above are new; the legacy-related risks were surfaced, not resolved, by the legacy knowledge extraction. **Resolved in Sprint 1.5:** the "Role" naming ambiguity (split into JobRole and SecurityRole) and Office/Location terminology drift (Office is now sole canonical term; OQ-053 Resolved) — see [`docs/development/DECISION_LOG.md`](DECISION_LOG.md).

## Remaining Architectural Work

Not yet designed or approved:

- Concrete database schema derived from the conceptual entity catalog in [`docs/entities/`](../entities/) and the logical data model in [`docs/data-model/`](../data-model/) — field types, keys, indexes, and constraints (**Sprint 3** scope)
- Row-Level Security policy design for office-based and organization-based scoping
- Franchise grouping design within the authorization hierarchy
- Temporary office assignment design (expiry, renewal)
- Import Profile schema implementation (conceptually defined in [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md); no profiles beyond Labor Model's schema exist yet)
- AI credential storage mechanism (ADR-003 defers this explicitly)
- Database migration strategy and tooling choice
- Reconciliation of the two SecurityRole candidate lists (see Known Risks)
- Fields for the four purpose-only snapshot entities (ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, RecruitingSnapshot)
- Formal versioning design for Scenario definitions (see Known Risks)
- Hard-delete / retention reconciliation (see Known Risks)
- A formal Notifications entity, if one is needed (see Known Risks)
- Any event-bus, queue, or notification technology implied by [`docs/architecture/event-driven-processing.md`](../architecture/event-driven-processing.md) (explicitly deferred, guidance only)
- Resolution of the legacy threshold conflicts and backlog/production-taxonomy questions (OQ-066–OQ-073) before Sprint 3 finalizes related entity fields and configuration defaults

## Recommended Next Sprint

**Sprint 3 – Database Design.** Translate the conceptual entity catalog ([`docs/entities/`](../entities/)) and the logical data platform design ([`docs/data-model/`](../data-model/)) into a concrete, reviewable schema proposal (as a new ADR): field types, keys, relationships, and Row-Level Security policy design for office- and organization-scoped tables. Reconcile the two SecurityRole candidate lists, settle Scenario versioning and the Notifications entity question, resolve enough of OQ-056 through OQ-061 (Labor Model/import specifics), and resolve the legacy reconciliation questions (OQ-066–OQ-073) to avoid designing around unconfirmed assumptions. Still no migrations or application code — Sprint 3 produces a reviewable design, not running SQL.

## Repository Health

- Status: Platform Design, as intended — no application code, no dependencies, no database migrations exist.
- Documentation is internally cross-linked (business rules, metrics dictionary, architecture, imports, scenario engine, entities, data model, legacy findings, decisions, open questions, and the AI knowledge layer) and has been kept consistent across updates.
- No confidential, real employee, real customer, or real financial data has been found in the repository as of this update, including in the legacy source inspected during Sprint 2.5 (confirmed during the Repository Comparison Audit).
- Open-question backlog is actively used and current (73 tracked questions as of this update) rather than left to go stale.
- Business-rule and metric documents consistently flag unresolved formulas rather than assuming values, per [`CLAUDE.md`](../../CLAUDE.md) — including newly discovered legacy formulas, none of which were adopted without flagging them for validation.
- A repository-stewardship rule exists in [`CLAUDE.md`](../../CLAUDE.md) requiring this file, AI_CONTEXT, EXECUTIVE_SUMMARY, PRODUCT_BACKLOG, README, and DECISION_LOG to be reviewed at the end of every sprint — this update is the third application of that rule.

## Current Sprint

**Sprint 2.5 – Legacy Knowledge Extraction: Complete (2026-08-04).**

Scope: a repository comparison audit (see prior conversation) found the founder's archived GitHub repository contains a working Tauri desktop application covering much of LabPulse's business domain. This sprint extracted its business rules, formulas, import workflows, terminology, and gaps into [`docs/legacy/`](../legacy/README.md), classifying every finding against current architecture without adopting any of it automatically. No application code was written or copied, the legacy repository was not modified, and no architecture decisions were altered.

Prior sprints: **Sprint 2 – Data Platform Design** (2026-08-04) delivered ADR-006 and the full [`docs/data-model/`](../data-model/) set, [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md), and [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md). **Sprint 1.5 – Domain Model Finalization & AI Knowledge Layer** (2026-08-04) delivered the AI knowledge layer, ADR-000, the JobRole/SecurityRole split, the Office/Location convention, four purpose-only snapshot entities, the immutable Recommendation lifecycle, and the event-driven conceptual pipeline. **Sprint 1 – Platform Foundation** (2026-08-04) delivered the North Star, ADR-005, the original 18-entity conceptual catalog, the Recommendation Framework, and the Decision Graph.

**Sprint 3 (Database Design) has not started.**

## Open Questions

The authoritative, individually tracked question log is [`docs/development/open-questions.md`](open-questions.md). As of this update it spans:

- Data cadence and workflow (OQ-001–OQ-006)
- Revenue (OQ-007–OQ-010, OQ-043)
- Payroll and laboratory expense (OQ-011–OQ-015, OQ-044–OQ-046)
- Overtime and backlog (OQ-016–OQ-020, OQ-047–OQ-052)
- Quality (OQ-021–OQ-026)
- Revenue root cause (OQ-027–OQ-032)
- Operational decisions (OQ-033–OQ-042)
- Architecture and authorization (OQ-053 Resolved; OQ-054–OQ-055 still open)
- Import framework and Labor Model (OQ-056–OQ-061)
- New business rules and scenario engine (OQ-062–OQ-065)
- **Legacy reconciliation (OQ-066–OQ-073, new this sprint)** — threshold conflicts, terminology equivalence, backlog/production taxonomy, candidate metrics (Margin %, Outside Lab Spend, Data Completeness %), submission compliance, weekly-to-monthly aggregation, and Labor Model Value

Not yet numbered open questions, but tracked here and recommended for the log before Sprint 3: reconciling the two SecurityRole candidate lists (see [`docs/entities/security-role.md`](../entities/security-role.md)), Scenario definition versioning, hard-delete/retention reconciliation, and whether a formal Notifications entity is needed (see Known Risks above).

No formula, threshold, or business rule should be implemented from an open question until it is resolved and dated — this now explicitly includes every formula and threshold found in the legacy application (see [`docs/legacy/`](../legacy/README.md)).
