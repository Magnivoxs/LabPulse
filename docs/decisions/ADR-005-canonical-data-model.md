# ADR-005: Establish a Canonical Data Model as the Single Internal Contract

**Status:** Proposed
**Date:** 2026-08-04

## Context

LabPulse now has documented business rules ([`docs/business/rules/`](../business/rules/)), an import framework ([`docs/imports/01-import-framework.md`](../imports/01-import-framework.md)), and a scenario engine concept ([`docs/scenario-engine/README.md`](../scenario-engine/README.md)). Each of these was designed to depend on "canonical" or "normalized" data, but the canonical model itself has never been formally named as an architectural decision — it has been assumed, referenced, and partially designed piecemeal.

The repository is entering Platform Design specifically to close that gap before any database or application work begins, per [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md)'s recommended next milestone.

Two failure modes motivate this ADR:

1. **Duplication and inconsistency**: if business rules, the scenario engine, and dashboards each interpret imported data independently, the same concept (for example, "office revenue") could be computed or represented differently in different places.
2. **Coupling to source layouts**: if any subsystem reads import-specific structures (spreadsheet rows, P&L line hierarchies, workbook sheet names) instead of a stable internal model, every source-format change becomes an application change.

## Options Considered

1. Define and require a canonical internal data model that every subsystem consumes; source-specific structure exists only inside Import Profiles.
2. Allow each subsystem (business rules, scenario engine, dashboard) to query import tables directly, with ad hoc joins and interpretation per feature.
3. Use the source file's own structure as the internal model (no normalization layer).
4. Normalize per-feature (each feature defines its own normalized view) rather than one shared canonical model.

## Decision

Adopt a single **Canonical LabPulse Data Model** as the only data shape that Business Rules, the Scenario Engine, dashboards, and any future integration may depend on.

```text
Import
  -> Validation
  -> Normalization
  -> Canonical Objects
  -> Business Rules
  -> Scenario Engine
  -> Presentation Layer
```

The canonical objects are cataloged, at a conceptual level, in [`docs/entities/`](../entities/). Concrete database schema is explicitly out of scope for this ADR and for the current sprint (see Consequences).

## Why Every Subsystem Must Consume the Same Internal Objects

- **One definition per concept.** "Office revenue," "payroll expense," "backlog case," and every other concept in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) must have exactly one authoritative representation. If the scenario engine and the dashboard each computed their own version, they could silently disagree.
- **Explainability depends on it.** [BR-001](../business/rules/BR-001-prioritize-location-review.md) and its successors require every alert and recommendation to show its underlying values and rule version. That is only possible if every consumer reads the same values from the same place.
- **Multi-tenant safety depends on it.** A single, well-scoped canonical model is what allows tenant isolation ([ADR-002](ADR-002-multi-tenant-data-model.md)) and office-based authorization ([ADR-004](ADR-004-office-based-authorization.md)) to be enforced consistently, rather than re-implemented per feature.

## Why Import Layouts Must Never Become Application Models

- Source files (P&L exports, the Labor Model workbook, Power BI exports) are owned by systems outside LabPulse's control and will change format without notice.
- If business rules or the scenario engine depended on a spreadsheet's column order or sheet names, every format change would require touching business logic — exactly the coupling [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) was written to prevent.
- Import Profiles ([`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)) exist specifically to absorb this variability so the canonical model never has to.

## Why Business Rules Operate Only on Canonical Entities

- Business rules (BR-001 through BR-006) are already documented as evaluating concepts like "monthly P&L revenue" and "backlog case count," not raw import rows. This ADR makes that an architectural requirement, not an implicit assumption.
- A business rule that reads canonical entities can be tested independently of any specific import, satisfying the Development Constitution principle that calculations are independently testable ([`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md)).
- Rule versioning ([`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) Development Constitution) only makes sense against a stable input shape; if the input shape changes with every import format, rule versions and data versions become entangled.

## Reasons

- Prevents duplicated or divergent definitions of the same business concept across subsystems.
- Isolates source-format volatility inside Import Profiles.
- Makes business rules, the scenario engine, and dashboards independently testable against the same fixtures.
- Supports multi-tenant and office-based authorization consistently.
- Matches the pipeline already described in [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) and [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md); this ADR formalizes it as a decision rather than leaving it as an implied convention.

## Risks

- Defining canonical objects prematurely, before enough source formats are analyzed, risks a model that must be reworked (only the Labor Model workbook has been fully schema-documented so far).
- Overly rigid canonical objects could make legitimate per-organization variation (see [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md)) awkward to represent; configuration must be designed into the canonical model, not bolted on.
- A canonical model that is designed but never enforced (subsystems quietly bypassing it) provides no benefit; enforcement requires discipline in later implementation sprints, not just documentation.
- The entity catalog in [`docs/entities/`](../entities/) is conceptual, not a schema; treating it as implementation-ready before database design would be premature.

## Consequences

- [`docs/entities/`](../entities/) becomes the conceptual reference for canonical objects; it does not define SQL tables, and no migration should be derived from it without a dedicated database-design pass (Sprint 2).
- Every future business rule, scenario, or dashboard document must reference canonical entities from [`docs/entities/`](../entities/) rather than inventing ad hoc field names.
- Import Profiles remain the only place source-format knowledge is allowed to live, per [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md).
- No database migration or SQL is created by this ADR; the project remains in Platform Design.

## Conditions for Revisiting

Revisit if:

- Multiple analyzed source formats reveal that a single canonical shape per concept cannot represent legitimate organizational variation without excessive optionality.
- Performance requirements demand denormalized or feature-specific read models (a caching or aggregation layer on top of the canonical model would be preferred over abandoning it — see Aggregation Strategy in [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md)).
- Database design (Sprint 2) surfaces a conceptual entity that cannot be reasonably modeled as designed here.
