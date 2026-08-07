# LabPulse Decision Log

**Version:** 0.2
**Last Updated:** 2026-08-05

## Purpose

A chronological history of important project decisions that do not require their own Architecture Decision Record. Decisions significant enough to need full context, options-considered, and revisit conditions get an ADR (see [`docs/decisions/`](../decisions/)); smaller but still consequential decisions — naming corrections, terminology conventions, lifecycle rules, process rules — are recorded here instead, in the order they were made.

This log also cross-references decisions that *did* get an ADR, so a reader can see the full timeline in one place without gaps.

## Format

Each entry includes: Date, Decision, Reason, Related ADR, Related Business Rule, Impact.

---

### 2026-08-04 — Adopt Next.js and Supabase as the proposed technology direction

**Reason:** Supports a single TypeScript codebase, managed PostgreSQL, integrated authentication, and Row-Level Security, with a fast path to an MVP.
**Related ADR:** [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md)
**Related Business Rule:** None
**Impact:** Sets technology direction, pending formal acceptance; no implementation has begun.

### 2026-08-04 — Adopt organization-based multi-tenancy with Row-Level Security

**Reason:** Appropriate isolation model for an MVP SaaS product without per-tenant infrastructure overhead.
**Related ADR:** [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md)
**Related Business Rule:** None
**Impact:** Every tenant-owned entity must be designed with organization scoping from the start.

### 2026-08-04 — Adopt a customer-controlled AI provider strategy

**Reason:** Avoid routing all customer AI usage through the founder's personal account; keep AI explicitly non-authoritative for calculations.
**Related ADR:** [ADR-003](../decisions/ADR-003-ai-provider-strategy.md)
**Related Business Rule:** None
**Impact:** AI features remain disabled until a reviewed credential-storage design exists.

### 2026-08-04 — Confirm four numeric business-rule thresholds from founder interviews

**Reason:** Direct founder interview input identified exactly four numeric review triggers: payroll percentage above 8.0%, laboratory expense percentage above 10.8%, monthly overtime cost above $500, and backlog at 20 or more cases. All other triggers remain qualitative or unresolved rather than guessed.
**Related ADR:** None
**Related Business Rule:** [BR-001](../business/rules/BR-001-prioritize-location-review.md)
**Impact:** These remain the only approved numeric thresholds anywhere in the repository as of this entry.

### 2026-08-04 — Replace region-based authorization with office-based authorization

**Reason:** Real thresholds and the Labor Model workbook both operate at the office level; region is useful only as descriptive metadata, not a security boundary.
**Related ADR:** [ADR-004](../decisions/ADR-004-office-based-authorization.md)
**Related Business Rule:** None
**Impact:** Data-entity list and future RLS design center on Office; region demoted to metadata.

### 2026-08-04 — Adopt a single canonical data model as every subsystem's shared contract

**Reason:** Prevent duplicated or divergent definitions of the same business concept across business rules, the scenario engine, and dashboards, and prevent import-layout coupling before database design begins.
**Related ADR:** [ADR-005](../decisions/ADR-005-canonical-data-model.md)
**Related Business Rule:** None directly; all business rules depend on this model
**Impact:** 18-entity conceptual catalog created ([`docs/entities/`](../entities/)); concrete database schema deferred to Sprint 2.

### 2026-08-04 — Split the "Role" entity into JobRole and SecurityRole

**Reason:** "Role" was being used for two unrelated concepts — an Employee's job classification (Processor, Waxer, Technician, Lab Manager, LSS, and similar) and a User's access-control level (Organization Administrator, Operations Manager, and similar). Left unresolved, this risked becoming a schema collision, not just a documentation ambiguity. This is a naming/domain-modeling correction, not a system-wide architectural tradeoff, so it did not warrant a full ADR.
**Related ADR:** None (governed by [ADR-000](../decisions/ADR-000-architectural-philosophy.md) principles of traceability and no hidden business logic)
**Related Business Rule:** None directly
**Impact:** [`docs/entities/role.md`](../entities/role.md) marked Superseded and preserved for history; [`docs/entities/job-role.md`](../entities/job-role.md) and [`docs/entities/security-role.md`](../entities/security-role.md) created; references across the repository updated.

### 2026-08-04 — Declare "Office" the sole canonical internal term

**Reason:** Resolve OQ-053 and remove a standing terminology-drift risk before database design begins. "Location" remains acceptable only as a user-interface display label.
**Related ADR:** [ADR-004](../decisions/ADR-004-office-based-authorization.md) (Terminology section updated)
**Related Business Rule:** None
**Impact:** [`docs/entities/office.md`](../entities/office.md) and [`docs/development/open-questions.md`](open-questions.md) (OQ-053) updated; historical `location_id` references in older documents are not retroactively rewritten.

### 2026-08-04 — Make Recommendations immutable with a defined seven-state lifecycle

**Reason:** Recommendations must remain auditable after the fact; overwriting a past recommendation's outcome would break traceability and explainability.
**Related ADR:** None directly (implements [ADR-000](../decisions/ADR-000-architectural-philosophy.md) principles of version everything, explain every recommendation, and traceability)
**Related Business Rule:** [BR-002](../business/rules/BR-002-hiring-recommendation.md), [BR-005](../business/rules/BR-005-lss-recommendation.md)
**Impact:** [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`docs/entities/recommendation.md`](../entities/recommendation.md) updated with states Generated, Presented, Approved, Rejected, Completed, Superseded, Archived; future schema must be append-only for recommendation status.

### 2026-08-04 — Adopt an event-driven conceptual pipeline as architectural guidance only

**Reason:** Name the previously-unbroken-out steps between business rules and the dashboard (Snapshot Update, Recommendation Generation, Notifications, Dashboard Refresh) without committing to any specific messaging technology.
**Related ADR:** None (explicitly deferred — no technology chosen)
**Related Business Rule:** None directly
**Impact:** [`docs/architecture/event-driven-processing.md`](../architecture/event-driven-processing.md) created as shared vocabulary for future implementation discussions.

### 2026-08-04 — Establish a repository-stewardship rule for end-of-sprint documentation upkeep

**Reason:** Prevent the repository's own memory documents (PROJECT_MEMORY, AI_CONTEXT, EXECUTIVE_SUMMARY, PRODUCT_BACKLOG, README, DECISION_LOG) from going stale as sprints accumulate.
**Related ADR:** None
**Related Business Rule:** None
**Impact:** [`CLAUDE.md`](../../CLAUDE.md) updated with a Repository Stewardship section; this sprint's own close-out is the first application of the rule.

### 2026-08-04 — Adopt a logical data platform philosophy before database design

**Reason:** Designing a database schema without first deciding data ownership, versioning, audit, snapshot, and immutability philosophy risks baking in mutable, untraceable data patterns the platform's explainability requirements cannot afford.
**Related ADR:** [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)
**Related Business Rule:** None directly; underlies all of them
**Impact:** [`docs/data-model/`](../data-model/) created (entity relationships, data lifecycle, versioning, audit, retention strategies, relationship catalog, snapshot strategy, import persistence, recommendation persistence, permission model, entity lifecycle); [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) and [`erd-concept.md`](../architecture/erd-concept.md) created. Sprint 3 (Database Design) now has a settled logical foundation to translate into schema.

### 2026-08-04 — Resolve a second naming collision: "Permission" (the grant entity) vs. "Permission" (a capability)

**Reason:** Sprint 2's capability-based authorization design used "permission" to mean a single grantable action (for example, "Import Labor Model"), which would have collided with the existing [Permission entity](../entities/permission.md) (a User+SecurityRole+Office grant record) established in Sprint 1.5. Left unresolved, this would have recreated the exact ambiguity the JobRole/SecurityRole split was created to prevent.
**Related ADR:** None directly (governed by [ADR-000](../decisions/ADR-000-architectural-philosophy.md) traceability and no-hidden-business-logic principles)
**Related Business Rule:** None
**Impact:** Introduced **Capability** (a single grantable action) and **Permission Set** (a SecurityRole's collection of Capabilities) as distinct terms in [`docs/data-model/permission-model.md`](../data-model/permission-model.md); the existing Permission entity's meaning is unchanged and cross-referenced.

### 2026-08-04 — Formalize "Evidence" as a Recommendation concept, not a new entity

**Reason:** [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) already referenced "contributing signals" informally; Sprint 2's persistence design needed a precise, named concept for what a Recommendation cites as justification, without introducing an entity with its own independent lifecycle.
**Related ADR:** None
**Related Business Rule:** BR-002, BR-005 (recommendation-producing rules)
**Impact:** [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md) and [`relationship-catalog.md`](../data-model/relationship-catalog.md) define Evidence as a reference collection (Alerts, Metrics, Snapshot instances) scoped to the citing Recommendation, not a standalone catalog entity.

### 2026-08-04 — Extract legacy business knowledge without adopting legacy behavior

**Reason:** A repository comparison audit found the founder's archived GitHub repository contains a working Tauri desktop application covering much of LabPulse's business domain, built and paused before the documentation-first effort began. It contains real, validated formulas, import behavior, and terminology that would be a mistake to ignore — but also real conflicts (notably, alert thresholds roughly 2–5x the approved values) that would be a mistake to silently adopt.
**Related ADR:** None (governed by [ADR-000](../decisions/ADR-000-architectural-philosophy.md) "business first" and "no hidden business logic")
**Related Business Rule:** BR-001 (threshold conflicts directly affect it); indirectly BR-002 through BR-006
**Impact:** [`docs/legacy/`](../legacy/README.md) created (10 documents). No legacy code was copied or reused. Every finding classified as Already Documented / Needs Validation / Missing from Architecture / Legacy Only / Reject — nothing adopted automatically. 8 new open questions added (OQ-066–OQ-073).

### 2026-08-05 — Accept ADR-004 (Office-Based Authorization) and approve Sprint 3B's founder decision packet

**Reason:** Following the Sprint 3A independent decision-reconciliation review, the founder explicitly authorized Sprint 3B (Logical-to-Physical Database Mapping) and approved a packet of controlling decisions needed to unblock physical schema design: canonical Office/Location terminology (reaffirmed), the MVP SecurityRole list, an extensible staffing-unit representation, the Labor Model/Payroll Percentage separation, a header/detail/dimension BacklogSnapshot design, the archive-not-delete retention default, non-adoption of legacy thresholds, and franchise-grouping exclusion from MVP.
**Related ADR:** [ADR-004](../decisions/ADR-004-office-based-authorization.md) (Proposed → Accepted); [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) (new, Proposed)
**Related Business Rule:** BR-001 (thresholds reaffirmed, not changed)
**Impact:** [`docs/database/`](../database/) (ten documents) and [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) created as the Sprint 3B physical-model proposal. OQ-055, OQ-060, OQ-061, and OQ-066 updated in [`docs/development/open-questions.md`](open-questions.md) to reflect exactly what was resolved (see that document for the precise scope of each — several are resolved only "for MVP" or "at the architecture level," not resolved in full). No migration, SQL, or Supabase project was created. See [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md) for the complete founder decision packet and physical-model summary.

## Related Documents

- [Project Memory](PROJECT_MEMORY.md)
- [AI Context](AI_CONTEXT.md)
- [Executive Summary](EXECUTIVE_SUMMARY.md)
- [Architecture Decisions](../decisions/README.md)
- [Open Questions](open-questions.md)
- [Sprint 3B Report](SPRINT_3B_REPORT.md)
