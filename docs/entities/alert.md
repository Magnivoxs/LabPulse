# Entity: Alert

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a specific triggered instance of a business rule's threshold or condition for one office and reporting period — for example, "Payroll Percentage above 8.0% for this office, this month."

## Description

An Alert is the record that a [BusinessRule](business-rule.md) evaluation crossed a threshold or matched a condition. It is distinct from a [Recommendation](recommendation.md): an Alert reports what was observed; a Recommendation (which may synthesize one or more Alerts) suggests what to consider doing. Per [BR-001](../business/rules/BR-001-prioritize-location-review.md), an Alert must never be hidden and must always show its triggered condition, current value, target value, and data source.

## Owner

Lab Operations (defines trigger conditions); Engineering (implements evaluation).

## Relationships

- Scoped to one [Office](office.md).
- Produced by one [BusinessRule](business-rule.md) version, evaluated against one or more canonical snapshots.
- May contribute to one or more [Recommendation](recommendation.md) records.
- May generate a [Task](task.md) directly, without an intervening Recommendation.

## Proposed Fields (High Level)

- Office reference
- Business rule code and version
- Reporting period
- Current value and threshold value
- Triggered timestamp
- Status (open, acknowledged, dismissed)
- Dismissal reason (when applicable)

## Update Cadence

Created whenever a business rule evaluates new canonical data (typically monthly for P&L-based rules, more frequently for backlog).

## Source Systems

Not imported; derived internally from business-rule evaluation.

## Validation Considerations

- Must never be silently suppressed; a dismissed Alert must retain its dismissal reason, per [BR-001](../business/rules/BR-001-prioritize-location-review.md) Safety and Business Controls.
- Must show whether the underlying trigger is numeric (approved threshold) or qualitative/manager-entered, per [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) acceptance criteria.

## Future Database Implications

Expected to be a high-volume, append-friendly table (one row per triggered condition per period), distinct from the lower-volume Recommendation table. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

All of [BR-001](../business/rules/BR-001-prioritize-location-review.md) through [BR-006](../business/rules/BR-006-staffing-adherence.md) can produce Alerts.

## Related Scenarios

Alerts commonly launch a [Scenario](scenario.md) for further investigation, via a [Recommendation](recommendation.md)'s suggested next step.

## Related Metrics

Whichever metric the triggering business rule evaluates (see [`docs/architecture/decision-graph.md`](../architecture/decision-graph.md) for the metric-to-rule mapping).
