# Entity: QualitySnapshot

**Version:** 0.1
**Status:** Proposed — purpose and relationships only; fields intentionally not yet defined (Sprint 1.5 scope)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of quality indicators for one office — resets, remakes, and other quality measures.

## Description

Supports the Quality Escalation Logic already described in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md): resets and remakes are diagnostic indicators that may point to a clinical issue (for example, a bite problem) or a laboratory-quality issue (for example, a technician-quality problem), and must never be automatically attributed to a specific technician or clinician. QualitySnapshot is where that diagnostic data would live once resets, remakes, and other quality measures are formally defined.

**This document defines purpose and relationships only. Fields are intentionally not yet defined**, per Sprint 1.5 scope — see [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## Owner

Lab Operations and Clinical Director (shared ownership, reflecting the dual clinical/laboratory nature of resets and remakes).

## Relationships

- Belongs to one [Office](office.md).
- Would be produced by an [ImportJob](import-job.md) using a future quality-data [ImportProfile](import-profile.md) (source system not yet identified).
- Relates to [Employee](employee.md) and [JobRole](job-role.md) only through careful, non-attributing aggregation — per [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md), a reset or remake must never be automatically attributed to a specific technician or clinician.
- Conceptually related to [ProductionSnapshot](production-snapshot.md) (quality relative to volume produced).

## Source Systems

Not yet identified. Resets and remakes are currently discussed qualitatively in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md); no source report has been analyzed.

## Related Business Rules

None yet defined. Root-cause classification logic in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) (Quality Escalation Logic) is the closest existing business rule, but it has not been formalized as a numbered BR.

## Related Scenarios

None yet defined.

## Related Metrics

Reset Count, Reset Rate, Remake Count, Remake Rate (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) — all marked Proposed with unresolved definitions).

## Open Questions

- How resets are defined (OQ-021).
- How remakes are defined (OQ-022).
- What rates or counts indicate a quality concern (OQ-023).
- How a likely clinical issue is distinguished from a laboratory-quality issue (OQ-024).
- Whether bite issues are tracked separately (OQ-025).
- What other quality measures should be included (OQ-026).
