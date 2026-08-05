# Canonical Data Principles

**Version:** 0.1
**Status:** Discovery / Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Explain, in one place, why every downstream component of LabPulse depends on canonical objects instead of import-specific schemas, and what principles govern the boundary between each stage of the pipeline. This document supports [ADR-005](../decisions/ADR-005-canonical-data-model.md); the ADR records the decision, this document explains how to reason about it day to day.

## The Pipeline

```text
Import
  -> Validation
  -> Normalization
  -> Canonical Objects
  -> Business Rules
  -> Scenario Engine
  -> Presentation Layer
```

This is the same pipeline introduced in [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md), viewed here from the "why," not the "how."

### Import

A source file or feed, in whatever shape its origin system produces it. Treated as untrusted per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md). Nothing downstream of Normalization may reference this stage directly.

### Validation

Confirms the import matches its declared Import Profile ([`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)) structurally, by type, and against business plausibility rules ([`docs/imports/05-import-validation.md`](../imports/05-import-validation.md)). Validation happens before any canonical object is created, so canonical objects never have to represent an invalid state.

### Normalization

Maps validated, source-specific rows into canonical shapes, per [`docs/imports/04-data-normalization.md`](../imports/04-data-normalization.md). This is the only stage allowed to know both the source layout and the canonical shape at the same time.

### Canonical Objects

The stable, source-independent representation of every business concept LabPulse reasons about — organizations, offices, snapshots, rules, metrics, alerts, recommendations, scenarios, and more. Cataloged conceptually in [`docs/entities/`](../entities/). This is the contract every later stage relies on.

### Business Rules

Rules such as [BR-001](../business/rules/BR-001-prioritize-location-review.md) through [BR-006](../business/rules/BR-006-staffing-adherence.md) read only canonical objects. A rule should be testable with synthetic canonical data and never need a sample import file to run.

### Scenario Engine

Uses canonical objects as its baseline (see [`docs/scenario-engine/README.md`](../scenario-engine/README.md)). Scenario assumptions are layered on top of canonical data; they never replace or bypass it.

### Presentation Layer

Dashboards and any future reporting surface display canonical objects, business-rule outputs, and scenario outputs. The presentation layer must not compute authoritative figures itself, per [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) and [`CLAUDE.md`](../../CLAUDE.md).

## Why Downstream Components Depend on Canonical Objects, Not Import-Specific Schemas

1. **A single source of truth per concept.** If "backlog case count" were computed differently by a dashboard query and a business rule, the two could disagree with no way to explain why. Canonical objects make disagreement structurally impossible within LabPulse's own logic.
2. **Source-format changes stay contained.** When a P&L export changes its column names, only that source's Import Profile needs to change (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)). Business rules, the scenario engine, and dashboards are unaffected because they never saw the old format either.
3. **Testability.** A business rule or scenario can be tested against hand-built canonical fixtures without needing a realistic sample spreadsheet, satisfying the Development Constitution's "calculations are independently testable" principle ([`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md)).
4. **Explainability.** Every alert and recommendation must show its underlying values and rule version ([BR-001](../business/rules/BR-001-prioritize-location-review.md)). That is only meaningful if "the underlying values" refers to one canonical figure, not whichever raw import happened to produce it.
5. **Multi-tenant and office-based safety.** Canonical objects are the natural place to enforce organization and office scoping consistently ([ADR-002](../decisions/ADR-002-multi-tenant-data-model.md), [ADR-004](../decisions/ADR-004-office-based-authorization.md)) — one enforcement point instead of one per subsystem.

## Boundary Rules

- No business rule, scenario, or presentation-layer document may reference a spreadsheet column, sheet name, or P&L line label directly. Those belong only in Import Profile documents.
- No canonical object may be defined ad hoc inside a business rule or scenario document. New or changed canonical concepts belong in [`docs/entities/`](../entities/) first.
- A canonical object's fields are described here and in [`docs/entities/`](../entities/) at a conceptual level only; concrete column types, keys, and indexes are Sprint 2 (database design) work, not this sprint's.

## What This Document Does Not Define

- The concrete database schema (see [`docs/entities/`](../entities/) for the conceptual catalog; SQL design is future work).
- Specific validation or normalization code.
- Caching or aggregation strategy for read performance (see [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) Aggregation Strategy, itself still provisional).

## Related Documents

- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [Import Framework](../imports/01-import-framework.md)
- [Entity Catalog](../entities/)
- [Recommendation Framework](recommendation-framework.md)
- [Decision Graph](decision-graph.md)
- [Open Questions](../development/open-questions.md)
