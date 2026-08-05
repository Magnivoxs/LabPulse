# Labor Model Import

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Document the import structure of the Labor Model workbook so it can be represented as an Import Profile (see [`03-import-profiles.md`](03-import-profiles.md)) without committing the workbook itself, any real office names, or any real office IDs to the repository.

This document describes schema only. No real office names, real office IDs, real region names, or real staffing/financial values appear anywhere in this document. All examples use clearly synthetic placeholders.

## Workbook Structure

The Labor Model workbook, as analyzed, contains multiple worksheets:

- **Four regional worksheets** — each covering the offices within one region. Real region names are not reproduced here; this document refers to them generically as Regional Sheet 1 through Regional Sheet 4.
- Additional worksheets may exist (for example, a summary or instructions sheet); their structure is not yet fully confirmed and is marked as an open question.

Each regional worksheet is expected to contain one row per office, with the columns described below.

## Known Fields

| Field | Description | Status |
|---|---|---|
| Office ID | Uniquely identifies an office/location. Format not yet confirmed (see Open Questions). | Confirmed to exist |
| Location | A display name or label for the office. Real values must never be committed to this repository. | Confirmed to exist |
| Regional metadata | The region associated with the office. Per [ADR-004](../decisions/ADR-004-office-based-authorization.md), this is descriptive metadata, not an authorization boundary. | Confirmed to exist |
| Recommended Staffing | The staffing level the labor model recommends for the office. Corresponds to the existing generic [Expected Staffing](../data/01-metrics-dictionary.md#expected-staffing) metric. | Confirmed to exist; exact unit (headcount, FTE, or role-broken-out) unresolved |
| Current Staffing | The staffing level currently assigned to the office. Corresponds to the existing generic [Actual Staffing](../data/01-metrics-dictionary.md#actual-staffing) metric. | Confirmed to exist; exact unit unresolved |
| Staffing Adherence % | A percentage expressing how closely current staffing matches recommended staffing. | Confirmed to exist; exact formula not yet confirmed (see [BR-006](../business/rules/BR-006-staffing-adherence.md)) |
| Labor % of Revenue | A labor-cost-to-revenue percentage, as computed within the Labor Model workbook itself. | Confirmed to exist; relationship to the P&L-derived [Payroll Percentage](../data/01-metrics-dictionary.md#payroll-percentage) metric is unresolved — these may or may not be the same calculation (see Open Questions) |

## Derived Fields (Not Yet Confirmed as Source Columns)

These are documented here because they are named directly in founder discussion, but it is not yet confirmed whether the workbook provides them as columns or whether they must be calculated by LabPulse from Recommended Staffing and Current Staffing:

- **Staffing Difference** — conceptually `current_staffing - recommended_staffing`, following the same shape as the existing [Staffing Variance](../data/01-metrics-dictionary.md#staffing-variance) formula. Positive values may indicate staffing above the model; negative values may indicate staffing below the model. The metric must not independently determine whether staffing is appropriate.
- **Staffing Adherence** — see Staffing Adherence % above; whether this is a workbook-provided value or a LabPulse-calculated value is unresolved.

## Illustrative Schema Example (Synthetic Only)

```text
Sheet: Regional Sheet 1
Row:
  Office ID: OFF-0001
  Location: Office A
  Region: Region 1
  Recommended Staffing: [synthetic placeholder value]
  Current Staffing: [synthetic placeholder value]
  Staffing Adherence %: [synthetic placeholder value]
  Labor % of Revenue: [synthetic placeholder value]
```

No real office identifiers, names, regions, or numeric values are recorded in this repository.

## Known Formatting Risks

- Four separate regional worksheets likely means column order, headers, or minor formatting may differ slightly sheet to sheet.
- Merged cells, multiple header rows, and formula cells are already flagged as general Labor Model risks in [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md) and apply here.
- Office ID formatting consistency across sheets is not yet confirmed.
- It is not yet confirmed whether every office appears in exactly one regional sheet or could appear in more than one (for example, during a regional reassignment).

## Relationship to Office Authorization

Office ID is expected to be the natural key that maps a Labor Model row to the canonical `office` entity described in [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) and [ADR-004](../decisions/ADR-004-office-based-authorization.md). Region, as a column in this workbook, becomes descriptive metadata on that office rather than an authorization boundary.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
