# AI Context Briefing

**Version:** 0.2
**Last Updated:** 2026-08-04
**Purpose:** A fast, self-contained briefing for any AI assistant starting work on this repository. Read this instead of relying on prior conversation history — the repository is the source of truth. If anything here conflicts with a linked document, the linked document wins; update this file.

## What project is this?

LabPulse: an operations intelligence and decision-support platform for dental laboratory organizations. Primary user: a Lab Operations Manager who compares office performance, monitors revenue/payroll, investigates overtime, evaluates staffing, and models decisions. See [`docs/product/00-north-star.md`](../product/00-north-star.md) and [`docs/product/01-product-vision.md`](../product/01-product-vision.md).

## Current phase

**Platform Design.** Product discovery is complete for several business areas; architecture and domain modeling are underway. **No application code, dependencies, database migrations, or SQL exist.** Do not write any unless explicitly instructed, and even then check [`CLAUDE.md`](../../CLAUDE.md) first.

## Current sprint

**Sprint 2.5 – Legacy Knowledge Extraction** (2026-08-04). A repository comparison audit found the founder's archived GitHub repository (`Magnivoxs/LabPulse`) contains a working Tauri desktop application (not the implementation target) with real, validated business logic. This sprint extracted that knowledge — business rules, formulas, import behavior, terminology, gaps — into [`docs/legacy/`](../legacy/README.md), without copying any code. See [`docs/legacy/README.md`](../legacy/README.md) for the full extraction; **nothing in it is automatically adopted** — every finding is a candidate for founder validation.

## Current milestone

Sprint 1 (Platform Foundation), Sprint 1.5 (Domain Model Finalization), Sprint 2 (Data Platform Design), and Sprint 2.5 (Legacy Knowledge Extraction) are all complete. **Sprint 3 (Database Design) has not started.** (Naming note: Sprint 1.5 originally called the database-design sprint "Sprint 2" — it is renumbered Sprint 3 now that the founder used "Sprint 2" for data platform design instead.)

## Active ADRs

All currently **Proposed** (none formally Accepted yet):

- [ADR-000](../decisions/ADR-000-architectural-philosophy.md) — Architectural philosophy (read this first)
- [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md) — Next.js + Supabase
- [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md) — Organization-based multi-tenancy with RLS
- [ADR-003](../decisions/ADR-003-ai-provider-strategy.md) — Customer-controlled AI providers
- [ADR-004](../decisions/ADR-004-office-based-authorization.md) — Office-based authorization (Organization → Office → Permissions → User)
- [ADR-005](../decisions/ADR-005-canonical-data-model.md) — Canonical data model as the single internal contract
- [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) — Data platform philosophy (logical model before database)

## Repository conventions

- **Office is the sole canonical internal term.** "Location" is permitted only as a UI display label, never a backend concept. See [`docs/entities/office.md`](../entities/office.md).
- **JobRole vs. SecurityRole**: JobRole = an Employee's job classification (Processor, Waxer, Technician, Lab Manager, LSS...). SecurityRole = a User's authorization role (candidate list not yet reconciled — see [`docs/entities/security-role.md`](../entities/security-role.md)). Never conflate these; this split resolved a naming collision (see [`docs/entities/role.md`](../entities/role.md) for history).
- Business rules are numbered `BR-00N` and live in [`docs/business/rules/`](../business/rules/).
- Canonical entities live in [`docs/entities/`](../entities/) — conceptual only, no SQL.
- No formula, threshold, or business rule is ever invented; unresolved items go in [`docs/development/open-questions.md`](open-questions.md), not into working code or docs as fact.
- Recommendations are immutable (see Recommendation Lifecycle below).
- **Capability vs. Permission**: a Capability is a single grantable action (e.g., "Import Labor Model," "Approve Hiring"). The Permission entity is the grant record (User + SecurityRole + Office scope). Never conflate these — see [`docs/data-model/permission-model.md`](../data-model/permission-model.md).
- Logical data model precedes database design: every entity's lifecycle (Created/Updated/Versioned/Immutable/Archived/Soft-Deleted/Hard-Deleted) is settled in [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md) before Sprint 3 begins.
- "Nothing is deleted" is the default posture (see [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)) — hard deletion is rare and its reconciliation with legal/contractual erasure obligations is still an open question.
- **`docs/legacy/` is historical reference only.** It documents business knowledge found in an archived, non-target Tauri application. Nothing in it is approved architecture; every item is classified Already Documented / Needs Validation / Missing from Architecture / Legacy Only / Reject in [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md). Never treat a legacy formula or threshold as settled.

## Business philosophy

- The 8.0% payroll, 10.8% laboratory expense, $500 overtime, and 20-case backlog thresholds are the **only** approved numeric review triggers so far — all are manual-review triggers, never automatic actions.
- Monthly P&L revenue is authoritative for finalized reporting; daily Power BI revenue is operational-only.
- See [`docs/business/rules/BR-001-prioritize-location-review.md`](../business/rules/BR-001-prioritize-location-review.md) through [`BR-006`](../business/rules/BR-006-staffing-adherence.md).

## Architecture philosophy

Twelve principles in [ADR-000](../decisions/ADR-000-architectural-philosophy.md): business first, deterministic before AI, explain every recommendation, configuration before customization, canonical data model, version everything, no hidden business logic, testability, traceability, security by default, multi-tenant from day one, import independence.

## Canonical entities

24 entities cataloged in [`docs/entities/README.md`](../entities/README.md): Organization, Office, User, Permission, Employee, JobRole, SecurityRole, LaborModelSnapshot, RevenueSnapshot, PayrollSnapshot, BacklogSnapshot, ProductionSnapshot*, QualitySnapshot*, CareerGridSnapshot*, RecruitingSnapshot*, Scenario, Recommendation, BusinessRule, Metric, Alert, Task, ImportProfile, ImportJob. (*fields intentionally undefined — purpose/relationships only.) Their relationships, lifecycles, and versioning rules are now fully documented conceptually in [`docs/data-model/`](../data-model/) and [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md) — still no SQL.

## Active business rules

[BR-001](../business/rules/BR-001-prioritize-location-review.md) Prioritize Location Review, [BR-002](../business/rules/BR-002-hiring-recommendation.md) Hiring Recommendation, [BR-003](../business/rules/BR-003-understaffing-detection.md) Understaffing Detection, [BR-004](../business/rules/BR-004-overtime-escalation.md) Overtime Escalation, [BR-005](../business/rules/BR-005-lss-recommendation.md) LSS Recommendation, [BR-006](../business/rules/BR-006-staffing-adherence.md) Staffing Adherence. Only BR-001's thresholds are fully approved; BR-002–006 have no approved formulas yet.

## Recommendation lifecycle

Immutable. States: Generated → Presented → Approved/Rejected → Completed/Superseded → Archived. Never mutate a recommendation in place; append new state. Every recommendation persists Origin, Evidence, Business Rule Version, Scenario Version, Snapshot Version, Approval, Outcome, Resolution, and Superseded By. See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md).

## Current risks

- Entity catalog and data model are conceptual only — do not derive SQL from them without a dedicated Sprint 3 pass.
- Labor % of Revenue (Labor Model) may diverge from Payroll Percentage (P&L) — not yet reconciled.
- SecurityRole candidate list has two unreconciled versions (PRD's 3 vs. Sprint 1.5's 6).
- Only the Labor Model workbook has a fully documented source schema; every other import source is still schema-undocumented.
- Scenario definitions are not yet formally versioned (blocks part of Recommendation Persistence).
- "Nothing is deleted" is not yet reconciled with legitimate deletion obligations.
- **Legacy alert thresholds conflict sharply with approved thresholds** (legacy: Lab Expense >20%/>25%, Personnel >15%/>20%, Backlog >50/>100 vs. approved 10.8%/8.0%/20) — unresolved, see [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md) and OQ-066.
- See [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md) Known Risks for the full list.

## Things intentionally NOT implemented

Application code, dependencies, database migrations, SQL, PostgreSQL tables, Prisma schemas, TypeScript interfaces, API routes, React components, Supabase configuration, concrete database schema, any business-rule formula beyond the four approved thresholds (8.0%, 10.8%, $500, 20 cases), any event-bus or notification technology choice. Also: no legacy code was copied or reused during the Sprint 2.5 legacy extraction — see [`docs/legacy/`](../legacy/README.md).

## Outstanding questions

73+ tracked in [`docs/development/open-questions.md`](open-questions.md), spanning revenue, payroll/expense, overtime/backlog, quality, revenue root-cause, operational decisions, architecture/authorization, import framework/Labor Model, new business rules/scenario engine, and (new, OQ-066–OQ-073) legacy reconciliation — threshold conflicts, terminology equivalence (Personnel % vs. Payroll Percentage, etc.), backlog/production taxonomy, and candidate metrics (Margin %, Outside Lab Spend, Data Completeness %, Submission Compliance). Plus newly surfaced (not yet numbered): SecurityRole reconciliation, Scenario versioning, hard-delete/retention reconciliation, and whether a formal Notifications entity is needed. Never implement from an unresolved question.

## Current priorities

1. Reconcile SecurityRole candidate lists (PRD vs. Sprint 1.5's expanded list).
2. Resolve the legacy reconciliation questions (OQ-066–OQ-073) — especially the threshold conflicts and backlog/production taxonomy — since they directly affect Sprint 3 schema decisions.
3. Resolve enough of OQ-056–OQ-061 (Labor Model/import specifics), Scenario versioning, and the Notifications-entity question to support Sprint 3 database design.
4. Keep [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md), this file, [`docs/development/EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md), [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md), [`README.md`](../../README.md), and [`docs/development/DECISION_LOG.md`](DECISION_LOG.md) current at the end of every sprint, per [`CLAUDE.md`](../../CLAUDE.md) Repository Stewardship.

## Expected next sprint

**Sprint 3 – Database Design.** Translate the conceptual entity catalog and the logical data platform design ([`docs/data-model/`](../data-model/)) into a concrete, reviewable schema proposal (new ADR): field types, keys, relationships, RLS policy design. Informed by, but not bound to, the legacy findings in [`docs/legacy/`](../legacy/README.md). Still no migrations or application code — a design, not running SQL. See [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md) Recommended Next Sprint.
