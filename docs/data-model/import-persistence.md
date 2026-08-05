# Import Persistence

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Describe what happens to data at each stage of the import pipeline from a **persistence** perspective — what is stored, in what form, and for how long — extending [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) (which describes the pipeline's processing logic) with the storage and traceability guarantees required by [ADR-006](../decisions/ADR-006-data-platform-philosophy.md).

## Core Principle

**Nothing is deleted. Everything remains traceable.** Every stage below produces a persistent record; later stages never erase or overwrite earlier ones. If a later stage's understanding of the data changes (a correction, a reprocessing), that produces a new record, not a rewrite of the old one.

## Pipeline (Persistence View)

```text
Raw Import
  ↓
Validation
  ↓
Normalization
  ↓
Canonical Snapshot
  ↓
Archive
  ↓
Audit
```

### Raw Import

The uploaded source file and its metadata (uploader, organization, timestamp, file hash) are persisted as-is, treated as untrusted per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md). This is the permanent record of "what the source system actually said." See [`docs/entities/import-job.md`](../entities/import-job.md).

### Validation

The outcome of validating the Raw Import against its [ImportProfile](../entities/import-profile.md) (see [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md)) is persisted alongside the Raw Import — every row's Accepted / Accepted with Warning / Rejected / Unresolved Reference outcome is recorded, not just the final aggregate result. Rejected rows are **not** discarded; they remain attached to the ImportJob record.

### Normalization

The mapping from validated raw rows into canonical fields (see [`docs/imports/04-data-normalization.md`](../imports/04-data-normalization.md)) is itself a persisted, traceable step: each normalized value can be traced back to the specific raw row and ImportProfile version that produced it.

### Canonical Snapshot

The normalized data is persisted as one or more immutable canonical snapshots (see [`snapshot-strategy.md`](snapshot-strategy.md)) — RevenueSnapshot, PayrollSnapshot, and so on. Each snapshot references the ImportJob and ImportProfile version that produced it, per [`03-versioning-strategy.md`](03-versioning-strategy.md).

### Archive

Once a Raw Import and its associated Validation/Normalization outcomes are no longer part of active, current processing, they move to the Archived lifecycle state (see [`02-data-lifecycle.md`](02-data-lifecycle.md)) — retained in full, simply no longer part of the "current" working set. Archiving never deletes data; see [`05-retention-policy.md`](05-retention-policy.md) for how long archived import data is kept.

### Audit

Every stage above (upload, validation outcome, normalization, snapshot creation, archival) is itself an auditable event, per [`04-audit-strategy.md`](04-audit-strategy.md): who initiated the import, when each stage completed, and what the outcome was.

## Separation of Layers

Consistent with [`CLAUDE.md`](../../CLAUDE.md) Data Rules and [ADR-006](../decisions/ADR-006-data-platform-philosophy.md), three distinct layers exist and are never merged:

1. **Raw imported data** (Raw Import, Validation outcomes) — a historical record of what the source said.
2. **Canonical operational data** (Snapshots, and everything derived from them — Alerts, Recommendations) — what LabPulse concluded.
3. **Audit data** (who did what, when) — a record of the process itself, not the business facts.

A bug or correction in Normalization logic never rewrites a Canonical Snapshot in place — it produces a new ImportJob and a new snapshot, with the old one retained and both traceable.

## Why "Nothing Is Deleted"

- A Recommendation's Evidence (see [`recommendation-persistence.md`](recommendation-persistence.md)) may reference a specific historical Snapshot; deleting that Snapshot would make the Recommendation unexplainable after the fact.
- Regulatory and audit needs (see [`04-audit-strategy.md`](04-audit-strategy.md)) assume a complete history is available.
- Trend, comparison, and variance features (see [`docs/business/01-revenue.md`](../business/01-revenue.md)) depend on historical snapshots remaining queryable.

This principle is not yet reconciled with legitimate deletion obligations (contractual/legal erasure requests) — see [`05-retention-policy.md`](05-retention-policy.md) Open Questions.

## What This Document Does Not Define

- Physical storage location or format for archived raw files (Sprint 3 scope).
- Compression, cold-storage tiering, or cost-optimization strategy.
- The literal database representation of "traceability" (foreign keys vs. event log) — Sprint 3 scope.

## Related Documents

- [Import Framework](../imports/01-import-framework.md)
- [Import Validation](../imports/05-import-validation.md)
- [Data Normalization](../imports/04-data-normalization.md)
- [Snapshot Strategy](snapshot-strategy.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Audit Strategy](04-audit-strategy.md)
- [Retention Policy](05-retention-policy.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
