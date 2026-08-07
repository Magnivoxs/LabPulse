# AI Context Briefing

**Version:** 0.3
**Last Updated:** 2026-08-05
**Purpose:** A fast, self-contained briefing for any AI assistant starting work on this repository. Read this instead of relying on prior conversation history — the repository is the source of truth. If anything here conflicts with a linked document, the linked document wins; update this file.

## What project is this?

LabPulse: an operations intelligence and decision-support platform for dental laboratory organizations. Primary user: a Lab Operations Manager who compares office performance, monitors revenue/payroll, investigates overtime, evaluates staffing, and models decisions. See [`docs/product/00-north-star.md`](../product/00-north-star.md) and [`docs/product/01-product-vision.md`](../product/01-product-vision.md).

## Current phase

**Platform Design, Sprint 3 (Database Design) underway.** Product discovery is complete for several business areas; a proposed physical schema now exists as documentation only. **No application code, dependencies, database migrations, or SQL exist.** Do not write any unless explicitly instructed, and even then check [`CLAUDE.md`](../../CLAUDE.md) first.

## Current sprint

**Sprint 3B – Logical-to-Physical Database Mapping** (2026-08-05, complete). Following founder approval of Sprint 3A's decision packet, this sprint proposed a PostgreSQL/Supabase physical schema in [`docs/database/`](../database/) (ten documents), [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md), and [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) (Proposed). [ADR-004](../decisions/ADR-004-office-based-authorization.md) was Accepted. This is a **design proposal, not an implementation** — no migrations, SQL, or Supabase project exist. See [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md).

## Current milestone

Sprint 1 through Sprint 2.5 are complete. **Sprint 3 (Database Design) is underway and gated: 3A (Decision Reconciliation) and 3B (Logical-to-Physical Mapping) are complete; 3C (RLS and Security Policy Design) and 3D (Independent Design Review) have not started.**

## Active ADRs

One **Accepted**, the rest **Proposed**:

- [ADR-000](../decisions/ADR-000-architectural-philosophy.md) — Architectural philosophy (read this first) — Proposed
- [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md) — Next.js + Supabase — Proposed
- [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md) — Organization-based multi-tenancy with RLS — Proposed
- [ADR-003](../decisions/ADR-003-ai-provider-strategy.md) — Customer-controlled AI providers — Proposed
- [ADR-004](../decisions/ADR-004-office-based-authorization.md) — Office-based authorization (Organization → Office → Permissions → User) — **Accepted (2026-08-05)**
- [ADR-005](../decisions/ADR-005-canonical-data-model.md) — Canonical data model as the single internal contract — Proposed
- [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) — Data platform philosophy (logical model before database) — Proposed
- [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) — Proposed physical data model (Sprint 3B) — Proposed

## Repository conventions

- **Office is the sole canonical internal term.** "Location" is permitted only as a UI display label, never a backend concept. See [`docs/entities/office.md`](../entities/office.md).
- **JobRole vs. SecurityRole**: JobRole = an Employee's job classification (Processor, Waxer, Technician, Lab Manager, LSS...). SecurityRole = a User's authorization role — MVP list resolved 2026-08-05 to exactly three (Organization Administrator, Operations Manager, Read-Only Viewer); six more are explicitly deferred (see [`docs/entities/security-role.md`](../entities/security-role.md)). Never conflate JobRole and SecurityRole; this split resolved a naming collision (see [`docs/entities/role.md`](../entities/role.md) for history).
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

24 entities cataloged in [`docs/entities/README.md`](../entities/README.md): Organization, Office, User, Permission, Employee, JobRole, SecurityRole, LaborModelSnapshot, RevenueSnapshot, PayrollSnapshot, BacklogSnapshot, ProductionSnapshot*, QualitySnapshot*, CareerGridSnapshot*, RecruitingSnapshot*, Scenario, Recommendation, BusinessRule, Metric, Alert, Task, ImportProfile, ImportJob. (*fields intentionally undefined — purpose/relationships only; still physically deferred after Sprint 3B, see [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md).) Their relationships, lifecycles, and versioning rules are documented conceptually in [`docs/data-model/`](../data-model/) and [`docs/architecture/erd-concept.md`](../architecture/erd-concept.md); a **proposed** physical schema for the remaining twenty entities now exists in [`docs/database/`](../database/) and [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) — still no executable SQL or migrations.

## Active business rules

[BR-001](../business/rules/BR-001-prioritize-location-review.md) Prioritize Location Review, [BR-002](../business/rules/BR-002-hiring-recommendation.md) Hiring Recommendation, [BR-003](../business/rules/BR-003-understaffing-detection.md) Understaffing Detection, [BR-004](../business/rules/BR-004-overtime-escalation.md) Overtime Escalation, [BR-005](../business/rules/BR-005-lss-recommendation.md) LSS Recommendation, [BR-006](../business/rules/BR-006-staffing-adherence.md) Staffing Adherence. Only BR-001's thresholds are fully approved; BR-002–006 have no approved formulas yet.

## Recommendation lifecycle

Immutable. States: Generated → Presented → Approved/Rejected → Completed/Superseded → Archived. Never mutate a recommendation in place; append new state. Every recommendation persists Origin, Evidence, Business Rule Version, Scenario Version, Snapshot Version, Approval, Outcome, Resolution, and Superseded By. See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md).

## Current risks

- Entity catalog and data model are conceptual only; a **proposed** physical schema exists in [`docs/database/`](../database/) as of Sprint 3B, still pending Sprint 3D's independent review before any table design is final.
- Labor % of Revenue (Labor Model) and Payroll Percentage (P&L) are now permanently treated as separate, never-merged facts (resolved 2026-08-05) — whether their formulas would actually diverge numerically remains unconfirmed.
- SecurityRole MVP list resolved 2026-08-05 (3 roles); 6 more explicitly deferred, not reconciled away.
- Only the Labor Model workbook has a fully documented source schema; every other import source is still schema-undocumented.
- Scenario definitions have a proposed physical version design (Sprint 3B) but the logical-model gap in [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md) has not yet been updated to match.
- "Nothing is deleted" default (archive/deactivate) confirmed 2026-08-05; legitimate-erasure pathway remains deliberately undesigned.
- **New (Sprint 3B):** the `organization_id`/`office_id` consistency-enforcement mechanism is unresolved — Sprint 3C must decide it before RLS policies can trust denormalized `organization_id` columns. See [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md).
- **Legacy alert thresholds:** non-adoption resolved 2026-08-05 (OQ-066) — the four approved thresholds remain the configurable defaults; a future volume-adjusted model remains a separate open enhancement.
- See [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md) Known Risks for the full list.

## Things intentionally NOT implemented

Application code, dependencies, database migrations, executable SQL, Prisma schemas, TypeScript interfaces, API routes, React components, Supabase configuration or project, RLS policy SQL, any business-rule formula beyond the four approved thresholds (8.0%, 10.8%, $500, 20 cases), any event-bus or notification technology choice. The Sprint 3B physical schema in [`docs/database/`](../database/) is a **design proposal in Markdown**, not a `CREATE TABLE` statement anywhere. Also: no legacy code was copied or reused during the Sprint 2.5 legacy extraction — see [`docs/legacy/`](../legacy/README.md).

## Outstanding questions

73+ tracked in [`docs/development/open-questions.md`](open-questions.md). Resolved or partially resolved 2026-08-05: OQ-055 (franchise, MVP scope), OQ-060 (Labor%/Payroll% separation), OQ-061 (staffing unit, architecture level only), OQ-066 (legacy thresholds not adopted for MVP). Still fully open: OQ-001–OQ-053 (except OQ-053 itself, already Resolved), OQ-054 (partially), OQ-056–OQ-059, OQ-062–OQ-065, OQ-067–OQ-073. Never implement from an unresolved question.

## Current priorities

1. Sprint 3C — RLS and Security Policy Design, using [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md) as the starting point, and resolving the `organization_id`/`office_id` consistency-enforcement mechanism first.
2. Sprint 3D — Independent Design Review of the Sprint 3B physical-model proposal, confirming or revising the judgment calls flagged in [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md).
3. Resolve the remaining legacy reconciliation questions (OQ-067–OQ-073) and OQ-056–OQ-059 (Labor Model/import specifics) as founder time allows — none block Sprint 3C.
4. Keep [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md), this file, [`docs/development/EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md), [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md), [`README.md`](../../README.md), and [`docs/development/DECISION_LOG.md`](DECISION_LOG.md) current at the end of every sprint, per [`CLAUDE.md`](../../CLAUDE.md) Repository Stewardship.

## Expected next sprint

**Sprint 3C – RLS and Security Policy Design.** Design (as documentation, not executable SQL) the Row-Level Security policy logic for every tenant-owned table in the Sprint 3B physical-model proposal, and resolve the `organization_id`/`office_id` consistency-enforcement mechanism. Sprint 3D (Independent Design Review) should follow before any part of the schema is treated as Accepted. Still no migrations or application code. See [`docs/development/SPRINT_3B_REPORT.md`](SPRINT_3B_REPORT.md) Section 10 and [`docs/development/PROJECT_MEMORY.md`](PROJECT_MEMORY.md) Recommended Next Sprint.
