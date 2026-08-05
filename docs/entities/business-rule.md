# Entity: BusinessRule

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a versioned, configurable definition of an approved business rule — the structured counterpart to the human-readable documents in [`docs/business/rules/`](../business/rules/).

## Description

BusinessRule is metadata about a rule definition (its code, version, and organization-specific threshold configuration), not a specific evaluation result. A specific evaluation result — "this office tripped this rule this period" — is an [Alert](alert.md) or [Recommendation](recommendation.md), which reference a BusinessRule version.

## Owner

Lab Operations (defines rule intent and thresholds); Engineering (implements evaluation logic against the approved definition).

## Relationships

- Referenced by [Alert](alert.md) and [Recommendation](recommendation.md) records to record which rule and version produced them.
- May reference [Metric](metric.md) definitions it depends on.
- May have [Organization](organization.md)-specific threshold configuration overrides.

## Proposed Fields (High Level)

- Rule code (for example, BR-001)
- Name
- Version
- Status (Proposed, Approved, Deprecated)
- Threshold configuration (organization-configurable, versioned, effective-dated)
- Reference to the source documentation file

## Update Cadence

Versioned on change. A rule's logic or threshold must not be edited in place once used to produce a real Alert or Recommendation; a new version is created instead, per the Development Constitution ("business rules are versioned") in [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## Source Systems

Defined internally, derived from the approved documents in [`docs/business/rules/`](../business/rules/). Not imported from any external source.

## Validation Considerations

- A rule version must never be presented as approved if its underlying formula or threshold is still marked unresolved in [`docs/development/open-questions.md`](../development/open-questions.md) (for example, BR-002 through BR-006 currently have no approved thresholds).
- Organization-specific overrides must not silently invent a threshold beyond what has been approved generally.

## Future Database Implications

Expected to require an append-only or versioned-row design so historical Alerts and Recommendations remain interpretable against the rule version active when they were produced. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

All of them: [BR-001](../business/rules/BR-001-prioritize-location-review.md) through [BR-006](../business/rules/BR-006-staffing-adherence.md).

## Related Scenarios

Indirectly, through the Alerts and Recommendations that reference a BusinessRule and feed scenarios (see [`docs/scenario-engine/README.md`](../scenario-engine/README.md)).

## Related Metrics

Every metric referenced by a business rule's "Required Inputs" section (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).

## Related ADRs

- [ADR-005: Canonical Data Model](../decisions/ADR-005-canonical-data-model.md)
