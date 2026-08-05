# Entity: Role (Superseded)

**Version:** 0.1
**Status:** Superseded — split into [JobRole](job-role.md) and [SecurityRole](security-role.md)
**Last Updated:** 2026-08-04

## Superseded Notice

Sprint 1.5 (Domain Model Finalization) resolved the naming ambiguity this document originally flagged by splitting "Role" into two distinct entities:

- **[JobRole](job-role.md)** — an Employee's job/position classification (Processor, Waxer, Finisher, Full Technician, Lab Manager, Trainer, LSS, and similar).
- **[SecurityRole](security-role.md)** — an authorization role used by [Permission](permission.md) (candidate values under reconciliation — see that document's Open Questions).

This document is preserved, unedited below, as a historical record of the original naming-collision finding and the reasoning that led to the split. New work should reference JobRole and SecurityRole directly, not this document. Existing links to this document remain valid for that historical context.

---

## Original Document (Historical — Not Updated)

## Purpose

Represents a job or position classification for an [Employee](employee.md) (for example, technician, lab manager) — not an access-control role.

## Description

**Naming ambiguity, flagged rather than silently resolved:** the word "role" is used in two different senses across this repository:

1. **Employee Role** (this entity) — a job/position classification used for staffing and technician-count metrics, sourced from the Career Grid and Employee Roster.
2. **Access-control role** — Organization Administrator, Operations Manager, Read-Only Viewer, used by [Permission](permission.md) to determine what a User may do in LabPulse.

These are different concepts that happen to share a common English word. This document defines only the first sense. [Permission](permission.md) defines the second. A future implementation must not conflate the two into a single "role" table — see Open Questions.

## Owner

Operations Manager / Lab Operations (job-role taxonomy); distinct from Organization Administrator's ownership of access-control roles.

## Relationships

- Assigned to [Employee](employee.md) records.
- Feeds technician-related [Metric](metric.md) definitions.

## Proposed Fields (High Level)

- Role name (for example, Technician, Lab Manager)
- Category or classification (used to determine technician-count eligibility)
- Whether the role counts toward "technician" for staffing metrics

## Update Cadence

Rare — job-role taxonomies change infrequently.

## Source Systems

Career Grid and Employee Roster (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)).

## Validation Considerations

- Role-name consistency across the Career Grid and Employee Roster is not yet confirmed (both sources are flagged with "inconsistent role names" as a known formatting issue).
- Which roles count as "technician" for staffing metrics is an open question (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 16).

## Future Database Implications

Should be modeled as clearly distinct from any access-control role table backing [Permission](permission.md), to avoid the naming collision described above becoming a data-model collision. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) (technician counts contribute to staffing comparisons)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md) (proposed hire role)

## Related Metrics

Technician Count, Revenue per Technician (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).

## Open Questions

- Which roles count as technicians (see [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 16 Open Questions).
- Whether "Role" (this entity) and access-control role (in [Permission](permission.md)) should share any implementation, or remain fully separate — not yet raised in [`docs/development/open-questions.md`](../development/open-questions.md) prior to this catalog; recommended to be added there before database design.
