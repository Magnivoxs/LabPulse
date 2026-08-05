# Versioning Strategy

**Version:** 0.1
**Status:** Discovery / Data Platform Design
**Owner:** Engineering
**Last Updated:** 2026-08-04

## Purpose

Define what gets versioned in LabPulse, why, and the rule every versioned entity must follow: a record produced under an old version is never reinterpreted as if a newer version had produced it.

## What Gets Versioned

| Entity | Why it's versioned |
|---|---|
| [BusinessRule](../entities/business-rule.md) | Thresholds and logic change over time (for example, the 8.0% payroll threshold could change); every Alert and Recommendation must show which rule version produced it. |
| [Metric](../entities/metric.md) | Formulas change (per [`CLAUDE.md`](../../CLAUDE.md), "formula changes require tests and documentation updates"); a historical figure must remain interpretable against the formula that computed it. |
| [ImportProfile](../entities/import-profile.md) | Source-file layouts change; every [ImportJob](../entities/import-job.md) is tied to the profile version active at import time (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)). |
| Recommendation Framework | The standard recommendation envelope itself may evolve (see [`docs/architecture/recommendation-framework.md`](../architecture/recommendation-framework.md)); each Recommendation records the framework version that shaped it. |

## What Is Immutable Instead of Versioned

Snapshots, Alerts, and Recommendations are not versioned — they are immutable point-in-time facts (see [`02-data-lifecycle.md`](02-data-lifecycle.md)). Versioning applies to *definitions* (rules, metrics, profiles) that get applied repeatedly over time; immutability applies to *observations and conclusions* (a snapshot, an alert, a recommendation) that happen once. A new Labor Model import does not "version" the prior LaborModelSnapshot — it creates a new, separate, immutable snapshot for a new period (see [`snapshot-strategy.md`](snapshot-strategy.md)).

## Versioning Rules

1. **A version is never edited in place.** Changing a business rule's threshold creates version N+1; version N remains queryable forever.
2. **Every record produced by a versioned definition stores which version produced it.** An Alert stores the BusinessRule version; a normalized Snapshot stores the ImportProfile version; a Recommendation stores the BusinessRule, Scenario, and Snapshot versions it depended on (see [`recommendation-persistence.md`](recommendation-persistence.md)).
3. **Versions are sequential and monotonic per definition**, not branching — there is one current version of BR-001 at a time, with a linear history behind it.
4. **A new version requires the same rigor as the original**: per [`CLAUDE.md`](../../CLAUDE.md), formula/threshold changes require documentation and test updates before the new version is considered approved.
5. **Effective dating**: a version has an effective-start date; the previous version's effective-end date is set at the same time. This allows "what rule was in effect on this date" to be answered exactly, supporting configurable, versioned thresholds as required by [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) Development Constitution.

## Organization-Specific Configuration and Versioning

Where a definition is organization-configurable (for example, a payroll account mapping, per [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md)), the organization-specific override is itself versioned independently of the shared base definition. This means an organization's mapping can change without affecting the global rule version, and vice versa.

## What This Document Does Not Define

- The literal storage mechanism for versions (a history table, an event log, or otherwise) — Sprint 3 (database design) scope.
- Numeric version-numbering scheme (semantic vs. sequential integer) — Sprint 3 scope.

## Related Documents

- [ADR-006: Data Platform Philosophy](../decisions/ADR-006-data-platform-philosophy.md)
- [Data Lifecycle](02-data-lifecycle.md)
- [Snapshot Strategy](snapshot-strategy.md)
- [Recommendation Persistence](recommendation-persistence.md)
- [Entity: BusinessRule](../entities/business-rule.md)
- [Entity: Metric](../entities/metric.md)
