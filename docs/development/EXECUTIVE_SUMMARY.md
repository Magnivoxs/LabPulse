# LabPulse Executive Summary

**Version:** 0.3
**Date:** 2026-08-04
**Audience:** Founder, investors, architects, reviewers, and future contributors

## Mission

LabPulse is an operations intelligence and decision-support platform for dental laboratory organizations. It replaces disconnected spreadsheets, financial reports, labor models, and manual reconciliation with one standardized, explainable view of how each office is performing — so a Lab Operations Manager can move from "what happened?" to "why did it happen, and what should I do about it?"

## Current Maturity

LabPulse is in **Platform Design**, the stage between business discovery and database/application implementation. No application code, third-party dependencies, database schema, or infrastructure has been created. What exists is a deliberately thorough body of business rules, architecture decisions, and a canonical data-model definition — the shared language every future engineering decision will be built on.

This is an intentional sequencing choice, not a delay: starting database or application work before this foundation existed would very likely have produced repeated schema redesigns and business logic tightly coupled to whichever spreadsheet format was analyzed first.

## Completed Work

- **Business discovery**, covering the executive workflow, revenue, payroll and laboratory expense, overtime, and backlog — each grounded in founder interviews, with confirmed numeric review thresholds (payroll above 8.0%, laboratory expense above 10.8%, overtime cost above $500/month, backlog at 20+ cases) and everything else explicitly marked open rather than guessed.
- **An import framework** describing how untrusted source files (starting with the Labor Model workbook) become standardized internal data, without ever letting a spreadsheet's layout leak into business logic.
- **A scenario-engine concept** for modeling hiring, overtime-vs-hiring, and LSS-support decisions, without prematurely defining their arithmetic.
- **Six numbered business rules** (location-review prioritization, hiring recommendation, understaffing detection, overtime escalation, LSS recommendation, and staffing adherence), each documenting purpose, inputs, and safety controls even where their exact thresholds remain open questions.
- **An architecture decision record (ADR) series**, including the technology direction (Next.js/Supabase), multi-tenancy model, AI provider strategy, office-based authorization (replacing an earlier region-based concept), and — this sprint — a single canonical data model every subsystem will share.
- **An 18-entity conceptual catalog** describing every core object in the system (organizations, offices, users, permissions, employees, snapshots of revenue/payroll/labor/backlog data, recommendations, alerts, and more) at a business level, with no database schema yet attached.
- **A domain-modeling cleanup pass** (this sprint) that resolved a naming collision between an employee's job classification and a user's system permissions, fixed the "Office vs. Location" terminology question for good, and made every recommendation the system produces immutable and auditable.
- **An AI knowledge layer** (Sprint 1.5) so that any future AI-assisted session — or new engineer — can orient to the project from the repository alone, without depending on prior conversation history.
- **A full logical data platform design** (Sprint 2), settling how information exists inside LabPulse before any schema is written: data ownership, versioning, audit, retention, and immutable-history philosophy (ADR-006); a relationship catalog and conceptual ERD covering all 24 entities; a concrete persisted-field design for recommendations (Origin, Evidence, rule/scenario/snapshot versions, Approval, Outcome, Resolution, Superseded By); capability-based permissions (never hardcoded); and twelve DDD-inspired domain boundaries with one-directional dependencies.
- **Legacy knowledge extraction** (this sprint, Sprint 2.5) from a previously undocumented, archived implementation — see Legacy Application Findings below.

## Legacy Application Findings

A repository comparison audit discovered that the founder had already built and used a working desktop application (Tauri/Rust/SQLite) covering much of this same business domain in late 2025, before pausing to pursue the current architecture-first approach. That application is **archived and is not the implementation target**, but it contains real, validated business knowledge: working formulas for laboratory expense, personnel expense, margin, and data-completeness percentages; a detailed backlog and production-stage taxonomy; real import and validation behavior; and evidence the founder had already independently concluded that hardcoded alert thresholds needed to become configurable — the same conclusion this project's architecture (ADR-000) reached independently.

This knowledge has been extracted into [`docs/legacy/`](../legacy/README.md) — no code was copied or reused. Every finding is classified against the current architecture (Already Documented, Needs Validation, Missing from Architecture, Legacy Only, or Reject) and nothing is automatically adopted. The most significant finding: the legacy application's alert thresholds (laboratory expense >20%/>25%, personnel >15%/>20%, backlog >50/>100 cases) differ substantially from this project's currently approved thresholds (10.8%, 8.0%, 20 cases) — a conflict requiring founder resolution before Sprint 3.

## Upcoming Milestones

**Sprint 3 – Database Design** is next: turning the conceptual entity catalog and this sprint's logical data platform design into a concrete, reviewable schema proposal, including how row-level security will enforce office- and organization-level access. This will still not include application code or running migrations — it produces a design to be reviewed before anything is built. (Note: an earlier draft of this document referred to this as "Sprint 2"; the founder has since used that number for data platform design instead, so the database-design milestone is now Sprint 3.)

Beyond that, the roadmap (see [`docs/product/01-product-vision.md`](../product/01-product-vision.md)) moves through application foundation (authentication, tenant isolation), data ingestion, operational-intelligence dashboards, and decision-support scenario modeling, in that order.

## Architecture Maturity

**Design-stage, not implementation-stage — now with the data platform's internal logic fully specified.** Every major architectural question has at least a proposed answer with documented reasoning and risks (see the ADR series), but none has been formally accepted, and none has been implemented. The canonical data model, import pipeline, recommendation lifecycle and persistence, authorization hierarchy, capability-based permission model, and domain boundaries are all specified conceptually; concrete schema, APIs, and infrastructure choices remain ahead.

## Business Maturity

**Substantially further along than architecture.** Five business areas (executive workflow, revenue, payroll/laboratory expense, overtime, backlog) have confirmed definitions and thresholds directly from founder interviews. Several more (hiring, staffing/Labor Model, LSS support) have documented structure but not yet approved formulas. A meaningful number of business questions remain explicitly open — quality/resets-and-remakes, recruiting, transfer criteria, and others — and are tracked rather than assumed.

## Code Maturity

**None.** Zero lines of application code, zero dependencies, zero database tables. This is by design at this stage, not an oversight — CLAUDE.md, the project's operating instructions, explicitly prohibits beginning implementation until the groundwork in this repository is reviewed.

## Repository Health

The repository is internally consistent and actively cross-linked: business rules point to the metrics they use, entities point to the business rules and scenarios that reference them, every ADR points to the entities and rules it affects, and the new data-model documents point back to the entities and ADRs they elaborate. No confidential, real employee, real customer, or real financial data has been found in the repository at any point. An open-questions log (73+ tracked items) is treated as a first-class artifact rather than left to go stale, and a standing rule (see [`CLAUDE.md`](../../CLAUDE.md)) requires the repository's memory documents to be kept current at the end of every sprint — this document is itself evidence of that rule being followed for a third time.

## Current Risks

- **Design-before-implementation risk is being managed, not eliminated.** The conceptual entity catalog and logical data model could still reveal gaps once a real schema is attempted in Sprint 3.
- **Two unreconciled candidate lists for security roles** (an earlier three-role list vs. a newer six-role list) need a founder decision before permissions can be designed.
- **Only one source format (the Labor Model workbook) has been fully schema-documented**; P&L, Payroll, Career Grid, and Power BI imports still need the same treatment.
- **Several business rules (hiring, understaffing, overtime escalation, LSS, staffing adherence) have no approved formulas yet** — a discipline that protects against guessing, but that also means those rules cannot be implemented as-is.
- **"Nothing is deleted" is not yet reconciled with real-world deletion obligations** (contractual or legal erasure requests) — flagged, not resolved, this sprint.
- **Scenario definitions are not yet formally versioned**, leaving one field of the new Recommendation persistence design (Scenario Version) not fully specifiable yet.
- **Legacy alert thresholds conflict sharply with approved thresholds** (roughly double, in every case found) — unresolved; see Legacy Application Findings above and [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md).

## Immediate Priorities

1. Reconcile the two security-role candidate lists.
2. Resolve the legacy threshold conflicts and backlog/production-taxonomy questions (OQ-066–OQ-073) — these directly affect Sprint 3 schema decisions.
3. Resolve enough of the outstanding Labor Model and import-framework questions, Scenario versioning, and the deletion/retention question to support real schema design.
4. Begin Sprint 3 (Database Design) once the above are addressed, translating the entity catalog and logical data model into a concrete, reviewable schema.

## Future Vision

LabPulse aims to become the operational nervous system for a multi-office dental laboratory organization: every office's revenue, payroll, backlog, staffing, and quality data flowing into one consistent model; every review trigger and recommendation traceable to an approved, versioned rule; every recommendation immutable and auditable; and every manager decision better informed without ever being made by the software itself. The discipline shown in this discovery-and-design phase — resolving ambiguity before writing code, documenting every threshold's source, and refusing to invent business rules — is intended to be the same discipline the eventual production system is held to.
