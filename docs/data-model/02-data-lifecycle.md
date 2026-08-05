# Data Lifecycle: Framework

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Define the possible lifecycle states any entity in LabPulse's data model can pass through, and what each state means. [`entity-lifecycle.md`](entity-lifecycle.md) applies this framework to every entity in the catalog; this document defines the vocabulary once so that document does not have to redefine it per entity.

## Lifecycle States

### Created

The entity's first record comes into existence. For imported data, this happens during [Normalization](../imports/04-data-normalization.md); for manager-entered data, this happens on manager action.

### Updated

A mutable entity's current record changes in place. **Only entities explicitly marked mutable in [`entity-lifecycle.md`](entity-lifecycle.md) may be Updated** — most entities in this data model are either Versioned or Immutable instead (see below), per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md).

### Versioned

Rather than being updated in place, a new version of the entity is created, and the prior version remains readable and is marked as superseded (or simply as "not current"). Used for anything whose meaning changes over time in a way that must remain explainable against the version active when a dependent record was produced (business rules, metrics, import profiles). See [`03-versioning-strategy.md`](03-versioning-strategy.md).

### Immutable

The entity, once created, is never changed and never versioned — it is a permanent fact as of its creation. Used for point-in-time records where "the fact as it was recorded" must never be altered (snapshots, alerts, recommendations, audit events). See [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md) and [`snapshot-strategy.md`](snapshot-strategy.md).

### Archived

The entity is no longer active or current, but remains in place and fully readable — it has simply exited the "current/active" set. Archiving never destroys data. See [`05-retention-policy.md`](05-retention-policy.md).

### Soft Deleted

The entity is marked as deleted (hidden from normal views and normal use) but its data is retained and recoverable. Distinct from Archived: an archived entity is expected and normal (a completed recommendation); a soft-deleted entity represents an explicit removal decision (a user account being deactivated) that could, in principle, be reversed.

### Deleted (Hard Delete)

The entity's data is permanently and irrecoverably removed. Per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("nothing is deleted") and [`import-persistence.md`](import-persistence.md), hard deletion is the exception, not the default, and is expected to be reserved for cases such as legally required data removal — not for routine cleanup. See Open Questions.

## Transition Rules

- An entity's applicable states are fixed by its type (see [`entity-lifecycle.md`](entity-lifecycle.md)) — for example, a RevenueSnapshot is Created then Immutable; it is never Updated.
- Versioned entities transition old versions to "not current," never to Deleted.
- Immutable entities have exactly one transition available after Created: Archived (for retention purposes only — see [`05-retention-policy.md`](05-retention-policy.md)). They are never Updated, Versioned, or (ordinarily) Deleted.
- Soft Deleted is reversible by design; Deleted is not.

## Why This Framework Exists

Without a shared vocabulary, "delete," "archive," "deactivate," and "supersede" get used interchangeably across documents and, eventually, across implementation — silently reintroducing the mutable, unauditable data this platform is explicitly designed to avoid (see [ADR-006](../decisions/ADR-006-data-platform-philosophy.md)).

## Open Questions

- Under what circumstances (if any) is a true Hard Delete required (for example, a customer's right-to-erasure request), and how does that reconcile with "nothing is deleted" for snapshots and recommendations that reference the deleted data as Evidence? Not yet resolved — see [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) Risks.

## Related Documents

- [Entity Lifecycle (per-entity application)](entity-lifecycle.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Retention Policy](05-retention-policy.md)
- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
