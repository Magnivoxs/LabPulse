# Entity: CareerGridSnapshot

**Version:** 0.1
**Status:** Proposed — purpose and relationships only; fields intentionally not yet defined (Sprint 1.5 scope)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of Career Grid data for one office — employee level, JobRole, skill category, and progression, as of a given update.

## Description

The Career Grid tracks employee level, role, skills, and progression (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)), on a cadence noted as weekly, updated Mondays, in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) — though that document also flags an unresolved inconsistency with an earlier "updated monthly" statement (OQ-001). CareerGridSnapshot is where that data would live once fully analyzed.

**This document defines purpose and relationships only. Fields are intentionally not yet defined**, per Sprint 1.5 scope — see [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## Owner

Operations Manager / Lab Operations (staffing and skill review).

## Relationships

- Belongs to one [Office](office.md).
- Would be produced by an [ImportJob](import-job.md) using a future Career Grid [ImportProfile](import-profile.md) (not yet analyzed in the depth [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md) achieved for the Labor Model workbook).
- Relates to [Employee](employee.md) and [JobRole](job-role.md) (level, skill category, and progression per employee).
- Conceptually related to [LaborModelSnapshot](labor-model-snapshot.md) (both describe staffing, at different levels of individual detail).

## Source Systems

Career Grid workbook (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)); known formatting issues include color-coded meaning, multiple worksheets, free-text notes, and inconsistent role names.

## Related Business Rules

None yet defined directly, though JobRole-consistency issues here affect [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) indirectly via technician-count accuracy.

## Related Scenarios

None yet defined directly.

## Related Metrics

None yet formally defined; relates to the unresolved technician-classification questions referenced in [`docs/entities/job-role.md`](job-role.md).

## Open Questions

- Whether the Career Grid is updated weekly, monthly, or both (OQ-001).
- JobRole-name consistency across the Career Grid and Employee Roster (noted in [`docs/entities/job-role.md`](job-role.md)).
