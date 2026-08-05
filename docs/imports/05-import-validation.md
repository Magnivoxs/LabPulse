# Import Validation

**Version:** 0.1
**Status:** Discovery / Architecture
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Define the categories of validation applied to an import before its rows are normalized into the Canonical LabPulse Data Model. See the overall pipeline in [`01-import-framework.md`](01-import-framework.md).

## Principle

Invalid records must never be silently discarded. This is a repository-wide rule (see [`CLAUDE.md`](../../CLAUDE.md), [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 11, and [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md)). Validation exists to flag and preserve problems for review, not to quietly drop rows.

## Validation Categories

### Structural Validation

Checks driven directly by the active Import Profile (see [`03-import-profiles.md`](03-import-profiles.md)):

- Expected sheets or sections are present.
- Required columns are present or mappable via a known alias.
- Unexpected columns are identified rather than silently ignored.

### Type Validation

- Numeric fields contain valid numbers.
- Date fields contain valid dates.
- Percentage fields fall within a plausible range (exact plausible ranges are not yet defined for Labor Model fields such as Staffing Adherence %; see Open Questions).
- Currency fields are parseable without unsafe floating-point handling, per [`CLAUDE.md`](../../CLAUDE.md) Calculation Rules.

### Referential Validation

- Office ID (or equivalent office-identifying field) resolves to a known office, or is flagged for manager review as a new/unknown office rather than silently creating one.
- Reporting period is well-formed and consistent with the source's expected cadence (see [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) Data Cadence).

### Business Validation

- Values that a business rule depends on (for example, a revenue or expense figure feeding [BR-001](../business/rules/BR-001-prioritize-location-review.md)) are checked for plausibility, not just type-correctness.
- Duplicate rows for the same office and reporting period are detected.
- Reporting-period conflicts (for example, an import that would overwrite an already-finalized monthly P&L figure) are flagged rather than silently applied, consistent with [`docs/business/01-revenue.md`](../business/01-revenue.md)'s rule that finalized P&L values must not be silently overwritten by preliminary data.

## Data Quality Findings

Carried forward from [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 11, validation should identify:

- Missing required values
- Duplicate rows
- Invalid dates
- Invalid numeric values
- Unknown offices
- Unknown employees
- Unexpected columns
- Reporting-period conflicts
- Outlier values
- Stale data

## Validation Outcome States

Each imported row should resolve to one of:

- **Accepted** — passes all applicable validation rules.
- **Accepted with warning** — passes required validation but trips a lower-severity check (for example, an outlier value); surfaced to the user, not blocked.
- **Rejected** — fails required validation; preserved in import history with the specific reason, not discarded.
- **Unresolved reference** — a referential check (for example, unknown Office ID) could not be resolved; requires manager decision before proceeding.

## What This Document Does Not Define

- Specific numeric plausibility ranges for any metric (none are approved yet beyond the confirmed thresholds already documented in [`docs/business/rules/BR-001-prioritize-location-review.md`](../business/rules/BR-001-prioritize-location-review.md)).
- The exact error-reporting UI.
- Profile-specific validation rules themselves (those belong inside each Import Profile).

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
