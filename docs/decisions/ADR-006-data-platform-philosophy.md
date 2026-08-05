# ADR-006: Data Platform Philosophy

**Status:** Proposed
**Date:** 2026-08-04

## Context

Sprint 1 (Platform Foundation) established a conceptual entity catalog and canonical data model ([ADR-005](ADR-005-canonical-data-model.md)). Sprint 1.5 (Domain Model Finalization) resolved naming and terminology ambiguities and made recommendations immutable. Neither sprint answered a more fundamental question that must be settled **before** any database schema is designed: not what the entities are, but **how information exists inside LabPulse over time** — who owns it, how it changes, how it is proven correct after the fact, and what may never be lost.

Designing a database schema without first deciding these things risks baking in assumptions (mutable rows with no history, unclear ownership between imported and manager-entered data, no distinction between "current" and "as of a point in time") that are extremely expensive to unwind later. This ADR, and the [`docs/data-model/`](../data-model/) documents it introduces, exist to settle those questions first.

## Decision

Adopt the following data platform philosophy, elaborated in detail across [`docs/data-model/`](../data-model/):

### Why logical models precede databases

A logical data model describes what information exists, who owns it, how it changes, and how long it lives — independent of any specific database engine, table design, or ORM. Designing this first means the eventual physical schema is a translation of settled decisions, not a place where those decisions get made implicitly and inconsistently table-by-table. See [`docs/data-model/01-entity-relationships.md`](../data-model/01-entity-relationships.md) and [`docs/data-model/02-data-lifecycle.md`](../data-model/02-data-lifecycle.md).

### Data ownership

Every piece of data in LabPulse has exactly one authoritative owner at any point in time: either an external source system (via an import), or LabPulse itself (manager-entered, or system-derived). Data must never be silently edited by a party other than its owner — for example, a normalized snapshot derived from an import must not be hand-edited without that edit being recorded as a distinct, attributed event. See [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md).

### Versioning philosophy

Anything whose meaning can change over time — a business rule, a metric formula, an import profile, a recommendation-framework version — is versioned, and old versions remain queryable forever. A record produced under an old version is never reinterpreted as if the new version had produced it. See [`docs/data-model/03-versioning-strategy.md`](../data-model/03-versioning-strategy.md).

### Audit philosophy

Every material change to tenant-owned data is attributable: who or what made it, when, and why (which import, which rule evaluation, which manager action). Audit is a first-class concern designed into the data model, not a logging feature bolted on afterward. See [`docs/data-model/04-audit-strategy.md`](../data-model/04-audit-strategy.md).

### Snapshot philosophy

Point-in-time operational facts (revenue, payroll, backlog, staffing, and similar) are captured as immutable snapshots tied to a specific office and reporting period, never as a single continuously-overwritten "current value." This is what allows LabPulse to explain a historical alert or recommendation using the exact data that produced it, even after newer data has arrived. See [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md).

### Immutable history

Once a fact has been recorded — a snapshot, a business-rule evaluation, an alert, a recommendation — it is never rewritten or deleted to reflect new understanding. New understanding produces new records (a new snapshot version, a superseding recommendation), and old records remain permanently readable. See [`docs/data-model/recommendation-persistence.md`](../data-model/recommendation-persistence.md) and [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md).

### Separation between operational data and imported data

Imported data (raw file contents, as validated and normalized) and operational data (canonical snapshots, business-rule outputs, recommendations, manager actions) are kept as clearly separated layers, per [`CLAUDE.md`](../../CLAUDE.md) Data Rules ("store normalized data separately from uploaded source files"). Imported data is a historical record of what a source system said at a point in time; operational data is what LabPulse concluded from it. Conflating the two would make it impossible to answer "did the source data change, or did our interpretation of it change?"

## Reasons

- A database schema designed without these decisions tends to accumulate special-case mutability, undocumented ownership, and untraceable history — exactly the kind of technical debt a platform handling financial and staffing decisions cannot afford.
- Every business rule and recommendation in this repository already depends on explainability and traceability ([BR-001](../business/rules/BR-001-prioritize-location-review.md), [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)); this ADR makes the underlying data guarantees that explainability depends on explicit, rather than assumed.
- Settling ownership, versioning, audit, and immutability now means Sprint 3 (Database Design) translates already-agreed decisions into schema, instead of making these decisions implicitly through table design choices.

## Risks

- A logical model designed before any real database exists could still miss constraints that only become obvious during schema design; the [`docs/data-model/`](../data-model/) documents should be revisited, not treated as beyond question, once Sprint 3 begins.
- Full immutability and versioning has real storage and complexity costs; this ADR accepts that cost as necessary for a platform whose outputs inform staffing and financial decisions, but future implementers should not gold-plate every entity with the same rigor a Recommendation or Snapshot requires (see [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md) for which entities need which lifecycle guarantees).
- "Nothing is deleted" (see [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md)) must be reconciled with legitimate data-deletion obligations (for example, a departing customer's right to deletion) — this ADR does not yet address that reconciliation; see Open Questions in the referenced documents.

## Consequences

- [`docs/data-model/`](../data-model/) becomes the authoritative logical data platform reference, sitting between the conceptual entity catalog ([`docs/entities/`](../entities/)) and any future concrete schema.
- Sprint 3 (Database Design) must treat these philosophy decisions as inputs, not as open questions to relitigate from scratch.
- No database, migration, or SQL is created by this ADR; the project remains in documentation-only Data Platform Design.

## Conditions for Revisiting

Revisit if:

- Real-world data-deletion or compliance obligations (for example, a right-to-erasure request) prove incompatible with "nothing is deleted."
- Storage or performance costs of full immutability and versioning prove impractical for a specific entity once real usage patterns are known.
- Sprint 3 database design surfaces a case this philosophy does not adequately cover.
