# Deferred Entities

**Version:** 0.2 (Sprint 3B.1 corrections applied — see [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md); **confirmed unchanged by Sprint 3B.2 and Sprint 3B.3** — neither pass added, removed, or reclassified a deferred entity; see [`docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md) for confirmation)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Record, explicitly, what this proposal does **not** create a physical table for, and why — so absence reads as a deliberate decision, not an oversight, per the instruction "do not create placeholder tables merely because an entity name exists."

## Production, Quality, Career Grid, and Recruiting Snapshots

`ProductionSnapshot`, `QualitySnapshot`, `CareerGridSnapshot`, and `RecruitingSnapshot` remain **conceptual only** — no `production_snapshot`, `quality_snapshot`, `career_grid_snapshot`, or `recruiting_snapshot` table exists in this proposal.

**Why:** per [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md) and the Sprint 3A readiness classification, none of the four has a defined field list, and for three of the four no source system or Import Profile has even been identified yet:

| Entity | Missing before a table can be designed |
|---|---|
| ProductionSnapshot | Fields, unit(s) of measure, grain, source cadence — see [`docs/entities/production-snapshot.md`](../entities/production-snapshot.md) Open Questions |
| QualitySnapshot | Fields, source system (Reset/Remake definitions unresolved — OQ-021 through OQ-026), and a non-attribution constraint that must inform design *before* a schema is chosen, not after |
| CareerGridSnapshot | Fields, and an unresolved cadence contradiction (OQ-001, weekly vs. monthly) |
| RecruitingSnapshot | Fields, source cadence |

Creating a table with speculative columns for any of these would risk encoding a wrong guess into the schema — exactly the failure mode the founder's instruction is guarding against. Their conceptual documentation in [`docs/entities/`](../entities/) is untouched by this sprint and remains the correct place to track them until each is sufficiently defined.

**Re-entry condition:** once a source system, field list, grain, and cadence are confirmed for any one of these four, that snapshot alone can move to `02-table-catalog.md` as MVP-ready, following the same header/detail evaluation applied to `BacklogSnapshot` in this sprint — it does not require redesigning the other three or any already-built table.

## Notifications

No `notification` table, delivery-attempt log, read-state tracking, retry mechanism, or channel-tracking structure exists in this proposal, per the founder's explicit instruction.

**Why:** [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) itself flags Notifications as owning "No formal entity yet defined," and the open question there — whether Notifications should ever become its own entity or remain an ephemeral delivery mechanism over the existing Alert/Recommendation state — is unresolved. `alert.status` and the `recommendation_lifecycle_event` chain (specifically the `presented` state) remain the authoritative record of whether a User has been made aware of something; a future Notification table, if built, would be a delivery/read-receipt layer on top of these, not a replacement for them.

## Franchise Grouping

No `franchise` table or grouping level between `organization` and `office` exists in this proposal, per Founder Decision 8 (OQ-055 resolved for MVP). See [`07-authorization-data-model.md`](07-authorization-data-model.md) Franchise Groupings for the full rationale. `organization` → `office` remains a strict two-level tenant hierarchy for MVP.

## AI State Machine / AI-Specific Tables

No AI conversation-state, prompt-history, or AI-provider-credential table exists in this proposal. AI credential storage is explicitly deferred by [ADR-003](../decisions/ADR-003-ai-provider-strategy.md) pending a reviewed secret-management design, and the founder's Sprint 3B instruction explicitly excludes any AI state-machine schema from Scenario versioning. AI's read-only, authorization-filtered access to Snapshots/Alerts/Recommendations (per [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md) AI domain) requires no dedicated table of its own — it reads the same tables every other authorized consumer reads, filtered by the same `permission`/RLS design Sprint 3C will build.

## A Universal Self-Service Hard-Delete Mechanism

See [`08-retention-archive-and-erasure-boundaries.md`](08-retention-archive-and-erasure-boundaries.md) — deferred, not designed, per the founder's explicit instruction.

## `task_status_history`

**Sprint 3B.1 Correction 13 — moved here from the MVP table inventory (was previously listed in [`02-table-catalog.md`](02-table-catalog.md) as ⚠️ optional).** Task's own status vocabulary and lifecycle design are unresolved (OQ-042); a dedicated append-only history table risks over-designing before that question is answered, and is now deferred rather than proposed as an optional MVP addition. `task.status` remains a plain, mutable, explicitly **provisional** column for MVP (see [`docs/database/03-column-and-type-catalog.md`](03-column-and-type-catalog.md)). Until a dedicated Task lifecycle table is approved, material Task changes (status transitions, reassignment) should be recorded in `audit_event` as the interim mechanism, per [`docs/data-model/04-audit-strategy.md`](../data-model/04-audit-strategy.md).

**Re-entry condition:** once OQ-042 defines Task's lifecycle requirements (status vocabulary, whether transitions need actor/reason capture beyond what `audit_event` already provides), `task_status_history` can move to `02-table-catalog.md` as MVP-ready, following the same append-only, sequence-numbered pattern already used for `alert_lifecycle_event` and `recommendation_lifecycle_event`.

## Related Documents

- [Snapshot Strategy](../data-model/snapshot-strategy.md)
- [Domain Boundaries](../architecture/domain-boundaries.md)
- [Table Catalog](02-table-catalog.md)
- [Retention, Archive, and Erasure Boundaries](08-retention-archive-and-erasure-boundaries.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
