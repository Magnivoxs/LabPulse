# ADR-000: Architectural Philosophy

**Status:** Proposed
**Date:** 2026-08-04

## Context

LabPulse's repository has grown across several sprints of discovery and platform design (see [`docs/development/PROJECT_MEMORY.md`](../development/PROJECT_MEMORY.md)) into a large body of business rules, entities, and architecture decisions. As the repository grows, and as more contributors — human and AI — work on it over time, there needs to be one short, foundational document that states the principles every other decision is checked against, before any contributor reads anything else.

This ADR is numbered **000**, intentionally out of sequence with [ADR-001](ADR-001-nextjs-and-supabase.md) onward, so it sorts first in any file listing and is read first by convention. It does not replace [`docs/product/00-north-star.md`](../product/00-north-star.md), which states LabPulse's mission and product principles for a product-focused audience; this ADR states the same underlying commitments in engineering/architecture terms, for a contributor about to write or review a design.

## Decision

Every contributor — human or AI — reads this document first. The following twelve principles govern every architecture and implementation decision in this repository:

### 1. Business first

No architecture or technical decision overrides an approved business rule or definition. When architecture and business understanding conflict, the business definition wins, and the architecture is adjusted — never the reverse. See [`docs/business/rules/`](../business/rules/).

### 2. Deterministic before AI

Every financial, staffing, overtime, and scenario calculation is deterministic, tested application logic. AI may explain, summarize, or assist; it never calculates and never replaces a business rule. See [ADR-003](ADR-003-ai-provider-strategy.md).

### 3. Explain every recommendation

No alert or recommendation is presented without its data source, rule version, assumptions, and limitations visible. See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md).

### 4. Configuration before customization

Organization- and office-specific variation (thresholds, account mappings, targets) is handled through configuration, not one-off code paths. See [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md).

### 5. Canonical data model

Every subsystem consumes the same internal canonical objects. Import layouts never become application models. See [ADR-005](ADR-005-canonical-data-model.md) and [`docs/architecture/canonical-data-principles.md`](../architecture/canonical-data-principles.md).

### 6. Version everything

Business rules, metrics, import profiles, and recommendations are versioned. Historical outputs remain interpretable against the version that produced them, and are never silently reinterpreted after the fact. See [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) Development Constitution.

### 7. No hidden business logic

Business logic lives in named, documented, testable rules and metrics — never buried in UI components, prompts, or ad hoc scripts. See [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) Separation of Responsibilities.

### 8. Testability

Financial, staffing, and scenario calculations are pure functions with unit tests, independent of the UI and independent of any specific import.

### 9. Traceability

Every canonical record traces back to the import and profile version that produced it (or is marked as manager-entered). Every alert and recommendation traces back to the business rule and metric values that produced it. See [`docs/entities/import-job.md`](../entities/import-job.md) and [`docs/entities/alert.md`](../entities/alert.md).

### 10. Security by default

Least privilege, deny by default, and server-side authorization are the starting point, not a later hardening pass. See [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md).

### 11. Multi-tenant from day one

Tenant isolation is a design input to the canonical model, not a patch applied before launch. See [ADR-002](ADR-002-multi-tenant-data-model.md) and [ADR-004](ADR-004-office-based-authorization.md).

### 12. Import independence

New source formats are onboarded by writing a new Import Profile, never by changing business rules, the scenario engine, or dashboards. See [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md).

## Reasons

- A repository this size needs one entry point that states principles once, rather than each document restating its own philosophy inconsistently.
- Numbering this ADR 000 makes "read this first" a structural fact, not a suggestion buried in a README.
- Stating these as architecture principles (not just product principles) gives engineers and AI contributors a direct, technical checklist to hold a design against, complementing the product-facing framing in [`docs/product/00-north-star.md`](../product/00-north-star.md).

## Risks

- A philosophy document that is not enforced in review provides no real guardrail; these principles must be checked during design and code review, not just referenced.
- Overlap with [`docs/product/00-north-star.md`](../product/00-north-star.md) risks drift if the two documents are updated independently; both must be reviewed together when either changes.
- Twelve principles is a lot to hold at once; contributors should treat this as a checklist to consult, not something to memorize perfectly.

## Consequences

- Every new ADR, business rule, entity, or architecture document should be checked against these twelve principles before being accepted.
- [`docs/development/AI_CONTEXT.md`](../development/AI_CONTEXT.md) references this ADR directly so any AI session can load the philosophy quickly.
- This ADR does not itself authorize or perform any implementation; it is a governance document.

## Conditions for Revisiting

Revisit if:

- A principle proves impossible to honor in practice and is repeatedly overridden without discussion.
- [`docs/product/00-north-star.md`](../product/00-north-star.md) and this ADR are found to have drifted into conflicting statements.
- A new category of principle (for example, around data retention or compliance) becomes necessary as the product matures.
