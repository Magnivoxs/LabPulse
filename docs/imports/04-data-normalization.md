# Data Normalization

**Version:** 0.1
**Status:** Discovery / Architecture
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Describe how validated import rows become the Canonical LabPulse Data Model — the single internal representation that business rules, the scenario engine, and dashboards read from. See the overall pipeline in [`01-import-framework.md`](01-import-framework.md).

## What Normalization Does

Normalization takes rows that have already passed validation (see [`05-import-validation.md`](05-import-validation.md)) and, using the active Import Profile's normalization rules:

1. Maps source columns (via the profile's aliases) to canonical field names.
2. Resolves the row to a canonical `organization` and `office` (see [ADR-004](../decisions/ADR-004-office-based-authorization.md)).
3. Resolves the row to a canonical reporting period (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) reporting-grain conventions).
4. Converts source values into canonical types (for example, currency into a currency-safe representation per [`CLAUDE.md`](../../CLAUDE.md) Calculation Rules, percentages into a consistent numeric representation).
5. Writes the normalized record alongside a reference back to its source import, preserving lineage.

## Canonical LabPulse Data Model

The canonical model is the only data shape that Business Rules, the Scenario Engine, and Dashboards are allowed to depend on. Raw imported rows and source-file structure are never read downstream of normalization.

This document does not define the canonical schema itself — that belongs in [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) (Data Architecture Direction) once it is approved. This document defines the *behavior* normalization must guarantee regardless of the final schema:

- Every normalized record is traceable to the import and Import Profile version that produced it.
- Every normalized record is scoped to an organization and office.
- Every normalized record carries an explicit reporting period.
- Normalization never invents a value that was not present, validated, or explicitly defaulted by an approved rule.
- Normalization never silently discards a row that passed validation.

## Source Data Kept Separate

Per [`CLAUDE.md`](../../CLAUDE.md) Data Rules, normalized data is stored separately from the uploaded source file. The source file is retained (or its metadata is retained) as import history, not as a queryable data source for business rules or dashboards.

## Normalization Rules Are Profile-Specific and Versioned

Each Import Profile owns its own normalization rules (see [`03-import-profiles.md`](03-import-profiles.md)). Changing how a source type is normalized means changing that profile's normalization rules and issuing a new profile version — it must not require touching the canonical model, business rules, the scenario engine, or dashboards.

## Known Normalization Challenges (From Source Data Inventory)

Carried forward from [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md) and [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md):

- Hierarchical rows and subtotals in P&L-style sources must not be mistaken for detail lines.
- Negative values represented with parentheses must be parsed correctly.
- Variable account naming across P&L formats must be resolved through profile aliases, not hard-coded logic.
- Month and year-to-date columns must be distinguished so the correct reporting period is recorded.
- Merged cells and multiple header rows in workbook-style sources (Labor Model, Career Grid) must be handled without corrupting row-to-office mapping.
- Office ID formatting consistency across regional worksheets is unconfirmed (see [`02-labor-model-import.md`](02-labor-model-import.md)).

## What This Document Does Not Define

- The exact canonical database schema (pending architecture approval).
- Specific parsing or transformation code.
- The exact formula definitions for derived metrics (those live in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) and business rule documents, not here).

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
