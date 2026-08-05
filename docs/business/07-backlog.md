# Backlog Business Rules

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Define how laboratory backlog is measured, classified, reviewed, and adjusted for office volume. This document is derived from the founder's second business-discovery interview and supplements [`docs/business/00-executive-workflow.md`](00-executive-workflow.md) and [`docs/business/rules/BR-001-prioritize-location-review.md`](rules/BR-001-prioritize-location-review.md).

## Current Measurement

- Backlog is measured in cases.
- Individual units are not the primary backlog measure.
- Days behind are not currently tracked.
- Backlog is tracked by production stage.

## Initial Review Threshold

Twenty or more total cases in the laboratory triggers manual review.

## Production Stages

Current examples:

- To be set
- To be processed
- To be delivered
- Resets
- Remakes
- Other stages to be confirmed

## Important Qualification

Some backlog is normal.

Higher-volume offices may reasonably carry a larger backlog than typical offices, and may require a configurable, higher review threshold. No specific office or its actual revenue is recorded here; this is a generalized business rule only.

A fixed threshold should therefore be treated as an initial review trigger, not proof that an office is underperforming.

## Proposed Future Normalization

Potential approaches include:

- Threshold by monthly revenue band
- Backlog per technician
- Backlog per average daily case volume
- Backlog by production stage
- Backlog trend
- Location-specific target
- Operating-model-specific target

Do not select an approach yet.

## Review Workflow

```text
Backlog reaches review threshold
  -> Validate case count
  -> Review production-stage distribution
  -> Compare location volume
  -> Review staffing
  -> Review overtime
  -> Review vacancies
  -> Review large orders
  -> Review resets and remakes
  -> Determine temporary versus structural cause
  -> Select support, staffing, quality, or monitoring action
```

## Product Requirements

- Display total backlog and stage-level backlog
- Show the threshold applied
- Support configurable thresholds
- Show office-volume context
- Display trend over time when historical data is available
- Avoid comparing offices without volume context
- Permit manager-entered notes

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
