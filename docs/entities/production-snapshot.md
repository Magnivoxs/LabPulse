# Entity: ProductionSnapshot

**Version:** 0.1
**Status:** Proposed — purpose and relationships only; fields intentionally not yet defined (Sprint 1.5 scope)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of production volume and output for one office — units, cases, or departmental output produced over a period.

## Description

Captures the office's production activity as reported by the Production Report source (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)). This is conceptually related to, but distinct from, [BacklogSnapshot](backlog-snapshot.md): BacklogSnapshot captures unfinished, pending work; ProductionSnapshot captures completed output. Together they give a fuller picture of an office's throughput than either alone.

**This document defines purpose and relationships only. Fields are intentionally not yet defined**, per Sprint 1.5 scope — see [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## Owner

Lab Operations (business meaning); Engineering (future normalization behavior).

## Relationships

- Belongs to one [Office](office.md).
- Would be produced by an [ImportJob](import-job.md) using a future Production Report [ImportProfile](import-profile.md) (not yet analyzed or documented).
- Conceptually related to [BacklogSnapshot](backlog-snapshot.md) (completed output vs. pending work) and [Employee](employee.md)/[JobRole](job-role.md) (who produced it, if tracked at that level).
- May inform future capacity-related metrics (for example, Revenue per Technician, revenue capacity used in the [Hiring](../scenario-engine/01-hiring.md) scenario).

## Source Systems

Production Report (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)); format and cadence not yet confirmed there ("To be confirmed").

## Related Business Rules

None yet defined. May inform a future capacity-related business rule once production data is analyzed.

## Related Scenarios

Potentially relevant to [Hiring](../scenario-engine/01-hiring.md) as capacity context, once defined.

## Related Metrics

None yet defined in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md); production volume is referenced only informally there via the Production Report source entry today.

## Open Questions

- Whether the Production Report should be analyzed into a formal Import Profile (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md), which does not yet list it).
- What unit(s) of production this snapshot should capture (units, cases, or both) and at what grain (office, department, employee).
