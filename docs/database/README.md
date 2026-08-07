# Database Design (Sprint 3B, corrected in Sprint 3B.1, Sprint 3B.2, Sprint 3B.3, Sprint 3B.4, and Sprint 3B.4A)

**Version:** 0.6 (Sprint 3B.4A corrections applied — see [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md); Sprint 3B.1, 3B.2, 3B.3, and 3B.4 corrections also applied)
**Status:** Proposed — logical-to-physical mapping, no migrations or SQL yet
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

This directory translates the conceptual entity catalog ([`docs/entities/`](../entities/)) and the logical data platform design ([`docs/data-model/`](../data-model/)) into a proposed PostgreSQL/Supabase physical schema, per [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) and the founder-approved decisions recorded in [`docs/development/SPRINT_3B_REPORT.md`](../development/SPRINT_3B_REPORT.md). **Sprint 3B.1** corrected fifteen relational-design issues found in review (immutable snapshot revisions, declarative tenant consistency, fail-closed authorization scope, and others). **Sprint 3B.2** corrected ten further cross-tenant and revision-integrity issues (Metric Observation revisions, same-tenant enforcement on join/detail tables, SecurityRole/Permission Set tenant ownership, nullable-scope non-overlap constraints, snapshot supersession natural-key integrity, Alert evidence for every condition type, immutable Recommendation supersession, Employee assignment lifecycle wording, typed Scenario references, and physical ERD accuracy) plus a broader integrity audit. **Sprint 3B.3** verified every composite foreign key introduced by the two prior passes actually has a matching parent key, and closed eight further gaps (missing composite parent keys, `condition_evaluation_evidence`'s missing `office_id`, snapshot-to-import tenant integrity, duplicated import-profile-version fact, Scenario-version binding, validation-result lineage integrity, and a full inventory of enforceable same-row `CHECK` constraints). **Sprint 3B.4**, narrowly scoped to the import-provenance/lineage subsystem only, closed the one-level-more-specific gap the prior three passes left open — Organization-matching alone did not stop two rows produced by two *different* Import Jobs (within the same organization) from being connected — plus a false "enforced transitively" claim, two duplicated facts (a second Profile Version copy, the Payroll account-mapping version), and an Import-Job-to-override Profile-Version binding gap. **Sprint 3B.4A**, a fifth, narrow pass on the same subsystem, closed two further gaps Sprint 3B.4 itself left open (Import Job supersession could still cross an unrelated base Import Profile; nothing verified an Import Job's Profile Version was actually permitted to produce its snapshot's canonical target), and corrected several documentation contradictions Sprint 3B.4 introduced or left un-annotated (a stale historical composite-FK table, an incompletely-withdrawn "enforced transitively" claim, a stale reference to a removed column, an incomplete Sprint 3C trigger inventory, and four incorrect ERD cardinalities). See [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md), [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md), [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md), [`docs/development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md`](../development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md), and [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md) for the full accounts. This proposal now describes exactly **61** MVP tables (see [`02-table-catalog.md`](02-table-catalog.md)) — unchanged in count since Sprint 3B.2; none of Sprint 3B.3, 3B.4, or 3B.4A added a new table.

**This is a design proposal, not an implementation.** No executable SQL, no migrations, and no Supabase project exist as a result of this work. Everything here is reviewable documentation, per [`CLAUDE.md`](../../CLAUDE.md)'s Database Rules and the current project stage.

## How to Read This Directory

| Document | Covers |
|---|---|
| [01-physical-model-principles.md](01-physical-model-principles.md) | Cross-cutting rules every table follows: UUID strategy, timestamps, money/percentage types, enums vs. lookup tables, tenant scoping |
| [02-table-catalog.md](02-table-catalog.md) | Every proposed table: purpose, domain, scope, MVP status |
| [03-column-and-type-catalog.md](03-column-and-type-catalog.md) | Per-table column lists with PostgreSQL types and nullability |
| [04-keys-relationships-and-constraints.md](04-keys-relationships-and-constraints.md) | Primary keys, foreign keys, unique constraints, check constraints |
| [05-temporal-versioning-and-snapshots.md](05-temporal-versioning-and-snapshots.md) | How versioning, immutability, and header/detail snapshot patterns are physically represented |
| [06-import-lineage-model.md](06-import-lineage-model.md) | Physical traceability from a dashboard value back to a source file and row |
| [07-authorization-data-model.md](07-authorization-data-model.md) | SecurityRole, Capability, Permission Set, and Office-scoped grants |
| [08-retention-archive-and-erasure-boundaries.md](08-retention-archive-and-erasure-boundaries.md) | Archive/deactivate default behavior and the still-open erasure pathway |
| [09-deferred-entities.md](09-deferred-entities.md) | What is intentionally not being built yet, and why |
| [10-schema-review-checklist.md](10-schema-review-checklist.md) | Checklist for Sprint 3D's independent design review |

See also:

- [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md) — Mermaid ER diagrams
- [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) — the decision record for this proposal (Status: Proposed)
- [`docs/development/SPRINT_3B_REPORT.md`](../development/SPRINT_3B_REPORT.md) — the Sprint 3B report, founder decisions applied, and remaining questions
- [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md) — the Sprint 3B.1 corrections report
- [`docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](../development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md) — the Sprint 3B.2 corrections report
- [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md) — the Sprint 3B.3 corrections report
- [`docs/development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md`](../development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md) — the Sprint 3B.4 corrections report
- [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md) — the Sprint 3B.4A corrections report

## What This Directory Does Not Contain

- Executable SQL or migration files.
- Row-Level Security policy SQL (documented as ownership/access dependencies here; actual policy design is Sprint 3C).
- Real company, employee, financial, or credential data.
- Application code.
- A finalized, Accepted schema — ADR-007 remains Proposed until Sprint 3D's independent review and founder sign-off.

## Related Documents

- [Entity Catalog](../entities/README.md)
- [Data Model (logical)](../data-model/)
- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
- [ADR-007: Proposed Physical Data Model](../decisions/ADR-007-proposed-physical-data-model.md)
