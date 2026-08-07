# Retention, Archive, and Erasure Boundaries

**Version:** 0.2 (Sprint 3B.1 corrections applied — see [`docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md`](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md); **reviewed in both Sprint 3B.2 and Sprint 3B.3's broader integrity audits — no corrections needed here in either pass**, since this document names archival mechanisms already covered by other documents' composite-FK/`CHECK` corrections rather than defining new ones itself)
**Status:** Proposed — partially resolved policy, not a completed compliance design
**Owner:** Engineering / Lab Operations
**Last Updated:** 2026-08-06

## Purpose

Propose the physical structures that support the founder-approved default (archive/deactivate, not hard-delete) from [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md), while explicitly not designing the still-unresolved exceptional-erasure pathway. This document does not close the retention-versus-erasure conflict — it is recorded here as **partially resolved**, per the founder's own framing, not as complete.

## Archived/Inactive States

| Table | Archival mechanism |
|---|---|
| `organization` | `status` in (`active`,`archived`) |
| `office` | `status` in (`active`,`inactive`) |
| `employee` | `employment_status` in (`active`,`terminated`) |
| `app_user` | `status` in (`invited`,`active`,`disabled`) |
| `security_role`, `metric_definition`, `business_rule`, `scenario_definition` | `status` in (...,`deprecated`) |
| `alert` | **Sprint 3B.1 Correction 8:** `status` is no longer a column on `alert` itself — the archival-equivalent state (`dismissed`) is the latest `alert_lifecycle_event.state` for that Alert, per [`docs/database/05-temporal-versioning-and-snapshots.md`](05-temporal-versioning-and-snapshots.md). The archival mechanism is unchanged in spirit (a specific, meaningful state value, not a generic flag) — only its physical location moved from the immutable core to the append-only lifecycle table. |
| `permission` | `revoked_at TIMESTAMPTZ NULL` — a non-null value is the archival marker |

No table in this proposal has a bare `is_deleted BOOLEAN` flag standing in for a real status vocabulary — every archival state is expressed through the specific, meaningful status values a business user would recognize (`terminated`, `dismissed`, `revoked`), not a generic deletion flag, consistent with [`docs/data-model/02-data-lifecycle.md`](../data-model/02-data-lifecycle.md)'s distinction between Archived and Soft Deleted.

## What "Archive, Not Delete" Means Physically Here

Archiving a parent row (an `office` closing, an `employee` departing) **never** triggers a cascading delete of its children — see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) (`ON DELETE RESTRICT` default, no `CASCADE` anywhere). A closed Office's historical `revenue_snapshot`, `payroll_snapshot`, `alert`, and `recommendation` rows remain fully intact and queryable, satisfying [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md)'s "Archival, Not Deletion, Is the Default Offboarding Behavior."

## What Is Deliberately Not Designed Here

### A Universal Self-Service Hard-Delete Mechanism

Per the founder's explicit instruction, no table, function, or mechanism for organization-initiated hard deletion is proposed in Sprint 3B. No "delete my organization's data" pathway exists in this schema.

### Identity Anonymization / Tombstoning

[`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md) names accidental real-data import (for example, real employee data uploaded during prototype testing) as a case where deletion may legitimately be required. This proposal does **not** add an anonymization or tombstone column to `employee` or `app_user` — it is named here as a future option, per the founder's instruction to "support... as a future option" without assuming its final mechanism. A plausible future shape (not decided) would replace identifying fields with a tombstone marker while leaving non-identifying operational aggregates (a `payroll_snapshot`'s totals) intact; this is recorded as a direction, not a design.

### Separation of Identifying Data From Immutable Operational Facts

This proposal's `employee` table already keeps identifying data (`display_name`) separate from the operational facts that reference it only by ID (`payroll_snapshot` never stores an employee name — payroll is aggregated at the office level, per [`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md)). This existing separation is what would make a future tombstone-style erasure of `employee.display_name` *possible* without touching financial history — but the erasure mechanism itself is not designed here, only the separation that would make it tractable later.

### A Chosen Reconciliation Between "Nothing Is Deleted" and Legitimate Erasure

The core unresolved conflict named in [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md) Open Questions — how a legitimate deletion request reconciles with immutable Snapshots, Recommendations, and Evidence that reference the data to be deleted — is **not answered by this schema**. No foreign key in this proposal is designed with an eventual hard-delete path in mind (see [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) `ON DELETE RESTRICT` default); if a real erasure obligation arises, Sprint 3C or a later sprint must design a dedicated pathway, likely combining the tombstoning direction above with a manual, audited, engineering-assisted process (per the Sprint 3A founder decision to defer, not build, this for MVP).

## Retention Duration

No table in this proposal has a TTL, expiry timestamp, or scheduled-purge mechanism. Every retention category in [`docs/data-model/05-retention-policy.md`](../data-model/05-retention-policy.md) — canonical snapshots, business-rule/metric version history, recommendations, import history, audit events — is retained indefinitely by default, matching that document's stated posture. Raw imported file content's exact retention duration remains an open question (see [`06-import-lineage-model.md`](06-import-lineage-model.md) "What This Document Does Not Define").

## Related Documents

- [Retention Policy](../data-model/05-retention-policy.md)
- [Data Lifecycle](../data-model/02-data-lifecycle.md)
- [Entity Lifecycle](../data-model/entity-lifecycle.md)
- [Table Catalog](02-table-catalog.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
