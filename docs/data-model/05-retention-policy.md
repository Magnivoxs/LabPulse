# Retention Policy

**Version:** 0.1
**Status:** Discovery / Data Platform Design — directional, not final
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Describe how long LabPulse retains different categories of data, consistent with [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)'s "nothing is deleted" principle, while acknowledging that principle is not yet reconciled with real-world deletion obligations.

## Default Retention Posture

**Retain indefinitely by default.** Snapshots, alerts, recommendations, business-rule and metric version history, and import history are retained for the life of the organization's account, because:

- Explaining a past recommendation requires the exact data that produced it, even years later.
- Trend and comparison features (see [`docs/business/01-revenue.md`](../business/01-revenue.md) Variance and Trend Requirements) depend on historical snapshots remaining available.
- Audit obligations (see [`04-audit-strategy.md`](04-audit-strategy.md)) assume historical records are not purged.

## Retention Categories

| Category | Examples | Default Retention |
|---|---|---|
| Canonical snapshots | RevenueSnapshot, PayrollSnapshot, LaborModelSnapshot, and the other five in [`snapshot-strategy.md`](snapshot-strategy.md) | Indefinite, immutable |
| Business-rule and metric version history | BusinessRule, Metric versions | Indefinite, versioned |
| Recommendations and their lifecycle history | Recommendation, all lifecycle states | Indefinite, immutable (see [`recommendation-persistence.md`](recommendation-persistence.md)) |
| Import history | ImportJob, validation/normalization outcomes | Indefinite (see [`import-persistence.md`](import-persistence.md)) |
| Raw imported file content | The uploaded source file itself | Retained per Archive stage in [`import-persistence.md`](import-persistence.md); exact duration not yet decided (see Open Questions) |
| Audit events | Per [`04-audit-strategy.md`](04-audit-strategy.md) | Indefinite by default; exact duration not yet decided |
| Session/authentication data | Login sessions, tokens | Short-lived, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) Authentication — not governed by this document |
| Employee data | See [`docs/entities/employee.md`](../entities/employee.md) | Sensitive; retention must additionally satisfy applicable employment-data handling requirements, not yet defined |

## Archival, Not Deletion, Is the Default Offboarding Behavior

When an office closes, an employee departs, or an organization's contract ends, the default behavior is to **archive**, not delete (see [`02-data-lifecycle.md`](02-data-lifecycle.md) Archived state) — the data becomes inactive and excluded from normal views, but remains intact and auditable.

## Where Deletion May Legitimately Be Required

- A customer's contractual or legal right to data erasure.
- Accidental import of data that should never have entered the system (for example, real employee data uploaded during prototype testing, which [`CLAUDE.md`](../../CLAUDE.md) prohibits from ever being committed or retained).

These cases are **not yet designed**. A true hard-delete pathway would need to reconcile with every downstream reference to the deleted data (a Recommendation's Evidence, a Snapshot referenced by a since-superseded Recommendation) without breaking the immutable-history guarantee for records that do not need to be deleted. This is flagged as an open question, not resolved by this document.

## Retention Is Configurable Intent, Not Yet a Mechanism

This document states retention *intent*. It does not specify a database TTL mechanism, cold-storage tiering, or deletion job — those are Sprint 3+ implementation concerns, to be designed only after the categories and defaults above are confirmed.

## Open Questions

- How long is raw imported file content retained before being purged or moved to cold storage, if ever?
- How does a legitimate deletion request (contractual or legal) get reconciled with immutable Snapshots, Recommendations, and Evidence that reference the data to be deleted?
- Are there category-specific retention limits required by any future compliance obligation (for example, employment-record retention law), given LabPulse currently uses only synthetic employee data and has not yet reviewed this?

## Related Documents

- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
- [Data Lifecycle](02-data-lifecycle.md)
- [Audit Strategy](04-audit-strategy.md)
- [Import Persistence](import-persistence.md)
- [Recommendation Persistence](recommendation-persistence.md)
