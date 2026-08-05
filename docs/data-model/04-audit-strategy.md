# Audit Strategy

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Define what LabPulse audits, why, and how audit relates to (but is distinct from) versioning and immutability. This elaborates the Logging and Auditing requirements already listed in [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) into a data-model concern.

## Audit vs. Versioning vs. Immutability

These three concepts are related but distinct:

- **Immutability** (see [`02-data-lifecycle.md`](02-data-lifecycle.md)) means a record, once created, cannot change.
- **Versioning** (see [`03-versioning-strategy.md`](03-versioning-strategy.md)) means a *definition* changes over time in a tracked, sequential way.
- **Audit** means every meaningful *action* — whether it created, versioned, or transitioned something — is attributed to who or what did it, when, and (where relevant) why.

An immutable Alert doesn't need an audit trail of its own values changing (they can't), but it does need an audit record of who viewed, acknowledged, or dismissed it. A versioned BusinessRule doesn't need an audit trail of the threshold value changing (that's what versioning already records), but it does need an audit record of who approved the new version.

## What Gets Audited

Per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md), audit events should eventually include:

- Authentication events
- User and SecurityRole changes (see [`permission-model.md`](permission-model.md))
- Import creation and approval ([ImportJob](../entities/import-job.md))
- Mapping and Import Profile version changes
- Business rule and metric version changes
- Target/threshold configuration changes
- Recommendation lifecycle transitions ([`recommendation-persistence.md`](recommendation-persistence.md)) — Presented, Approved, Rejected, Completed, Superseded, Archived
- Scenario execution
- AI-provider configuration changes
- Administrative actions

## Audit Record Shape (Conceptual)

Every audit event conceptually captures:

- What happened (event type)
- Who or what caused it (a User, or a system process such as a scheduled business-rule evaluation)
- When it happened
- What entity and version it affected
- Why, where a reason was recorded (for example, a Recommendation rejection reason)

This is not a schema — see [`docs/entities/`](../entities/) and Sprint 3 for how this might eventually be represented as tables.

## What Must Never Be in an Audit Record

Per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md): raw secrets, passwords, full authentication tokens, unnecessary employee information, or confidential imported file contents.

## Audit Is Additive, Never Corrective

An audit record is never edited or deleted to fix a mistake. If an audit record is wrong (for example, attributed to the wrong user due to a bug), the correction is a new audit record noting the correction — the original remains, per [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("immutable history").

## Relationship to Recommendations and Alerts

[Recommendation](../entities/recommendation.md) lifecycle transitions (see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)) and [Alert](../entities/alert.md) status changes are themselves a form of domain-specific audit trail — they do not need a separate generic audit event for every transition if the entity's own immutable history already captures who changed its state and when. Generic audit events are for actions not already captured by an entity's own immutable/versioned design (for example, a permission change, which is not itself a versioned or immutable business entity).

## What This Document Does Not Define

- The literal audit-log storage mechanism (append-only table, external log system, or otherwise) — Sprint 3 scope.
- Audit-log retention duration (see [`05-retention-policy.md`](05-retention-policy.md)).
- Alerting or monitoring on audit events.

## Related Documents

- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
- [Data Lifecycle](02-data-lifecycle.md)
- [Versioning Strategy](03-versioning-strategy.md)
- [Retention Policy](05-retention-policy.md)
- [Security Requirements](../security/01-security-requirements.md)
