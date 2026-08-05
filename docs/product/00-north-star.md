# LabPulse North Star

**Version:** 0.1
**Status:** Discovery / Platform Design
**Owner:** Founder / Lab Operations
**Last Updated:** 2026-08-04

## Purpose

This document is the single, durable statement of why LabPulse exists and what principles every future decision — product, architecture, or implementation — must be checked against. It sits above the Product Vision ([`docs/product/01-product-vision.md`](01-product-vision.md)) and the MVP PRD ([`docs/product/02-mvp-prd.md`](02-mvp-prd.md)), which describe what is being built; this document describes why, and under what constraints.

## Mission

Give Lab Operations Managers one trustworthy place to understand what is happening across their offices, why it is happening, and what action is worth considering — replacing disconnected spreadsheets and manual reconciliation with standardized, explainable information.

## Vision

LabPulse becomes the operational nervous system for a dental laboratory organization: every office's revenue, payroll, backlog, overtime, and staffing data flows into one consistent model, every review trigger and recommendation is traceable to an approved rule, and every manager decision is better informed without being made by the software itself.

## Product Principles

### 1. Deterministic-first

Every financial, staffing, overtime, and scenario calculation is produced by tested, deterministic domain logic. AI may explain, summarize, or assist — it never calculates, and it never replaces a business rule. This is already codified in [`CLAUDE.md`](../../CLAUDE.md), [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md), and every ADR that touches AI (see [ADR-003](../decisions/ADR-003-ai-provider-strategy.md)).

### 2. Explainability

No number appears on a dashboard, alert, or recommendation without its source, its formula or rule version, its reporting period, and its assumptions being visible. A manager should never have to trust a figure they cannot trace. See the Explainability Requirements already established in [BR-001](../business/rules/BR-001-prioritize-location-review.md) and extended by every later business rule.

### 3. User trust

LabPulse earns trust by being honest about uncertainty: unresolved formulas, unconfirmed thresholds, and unavailable data are shown as such — never silently defaulted, guessed, or hidden. This principle is why the repository's open-questions log ([`docs/development/open-questions.md`](../development/open-questions.md)) is treated as authoritative rather than an afterthought.

### 4. Configuration over customization

Differences between organizations, offices, and P&L formats are handled through configurable mappings, thresholds, and effective dates — not one-off code paths per customer. See [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md) and the Development Constitution in [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

### 5. One canonical data model

Every subsystem — business rules, the scenario engine, dashboards, and any future integration — reads and writes the same internal canonical objects. No subsystem is allowed to build its own private interpretation of the data. This is the subject of [ADR-005](../decisions/ADR-005-canonical-data-model.md) and [`docs/architecture/canonical-data-principles.md`](../architecture/canonical-data-principles.md).

### 6. Multi-tenant readiness

Every canonical entity is designed, from the start, to be safely shared across organizations without cross-tenant leakage. Tenant isolation is a design input to the canonical model, not a security patch applied afterward. See [ADR-002](../decisions/ADR-002-multi-tenant-data-model.md) and [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md).

### 7. Import independence

The canonical data model must never be shaped by the layout of any single source file. New source formats are onboarded by writing a new Import Profile, not by changing business rules, the scenario engine, or dashboards. See [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) and [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## What This Enables

Because the platform commits to these principles before implementation, LabPulse should be able to:

- Onboard a new organization's P&L format without touching business-rule code.
- Change a threshold (for example, the 8% payroll trigger) without a deployment, because thresholds are configurable and versioned.
- Explain any alert or recommendation to a skeptical manager on demand.
- Add a new recommendation type (see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)) without redesigning the data model.

## What This Repository Is Not Yet Doing

Per the repository's current stage, this north star does not authorize:

- Writing application code
- Installing dependencies
- Creating database migrations or SQL
- Choosing a final, implementation-ready schema

Those belong to later, explicitly scoped sprints (see [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md)).

## Related Documents

This document states these commitments for a product audience. [ADR-000: Architectural Philosophy](../decisions/ADR-000-architectural-philosophy.md) restates the same commitments in engineering/architecture terms for contributors making design decisions — the two should be kept consistent with each other.

- [ADR-000: Architectural Philosophy](../decisions/ADR-000-architectural-philosophy.md)
- [Product Vision](01-product-vision.md)
- [MVP PRD](02-mvp-prd.md)
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [Canonical Data Principles](../architecture/canonical-data-principles.md)
- [Recommendation Framework](../architecture/recommendation-framework.md)
- [Open Questions](../development/open-questions.md)
