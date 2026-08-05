# UI Workflow Analysis

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

Document the user workflows and screens found in the legacy application. This describes behavior, not code or visual design, and is not a UI specification for the new platform.

## Screens (React Router pages)

`Overview`, `Rankings`, `Directory`, `OfficeDetail`, `DataEntry`, `Compliance`, `Settings` — seven top-level pages, all reachable from a persistent navigation structure (inferred from routing; exact nav component not separately inspected).

## Workflow 1: Daily/Monthly Review (Overview → Data Entry)

```text
Open app
  -> Overview dashboard loads all offices for the current month
  -> Each office rendered as a card: office ID/name, model, DFO, latest data month,
     revenue, lab expense %, personnel %, backlog count, color-coded status border,
     alert badges (info/warning/critical), data-completeness badge
  -> User filters/searches/sorts the office grid (by state, DFO, model, data status, or free text)
  -> User clicks an office card
  -> Navigates to Data Entry, pre-selecting that office and the current month/year
```

This directly mirrors the "start-of-day review → identify locations outside target → investigate" pattern already documented in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md), built for a single-office-at-a-time drill-down rather than a queue of flagged items.

## Workflow 2: Monthly Data Entry

```text
Select office and month/year (dedicated selector component)
  -> Tab across four categories: Financial, Operations, Volume, Notes
  -> Each tab shows a green checkmark once data exists for that office/month
  -> Financial tab: 11 fields, with Outside Lab Spend auto-calculated and displayed read-only,
     percentages (Lab Exp %, Personnel %, Outside Lab %, Overtime %) computed live as values are typed
  -> "Previous month" values shown for comparison; a copy-forward action is available
  -> Save persists via upsert (create if absent, overwrite if present)
  -> Load re-populates the form from the saved record for that office/month
```

Source: commit messages `a1e317c`, `dc48844`; component files `FinancialEntryForm.tsx`, `OperationsEntryForm.tsx`, `VolumeEntryForm.tsx`, `NotesSection.tsx`, `MonthOfficeSelector.tsx`.

## Workflow 3: Office Directory Management

```text
View Directory (searchable/filterable list of all offices with model, DFO, contact info)
  -> Click an office -> detail modal with office info and action buttons
  -> "Add Office": download a 5-sheet Excel template (Info, Contact, Financials, Ops, Instructions)
       -> fill it out -> upload via drag-and-drop or file picker
       -> transaction-based insert across all related tables
  -> "Remove Office": confirmation dialog showing the office name
       -> transaction-based cascading delete across contacts, financials, and ops tables
  -> Export: CSV or Excel export of the full directory, respecting active filters
```

Source: commit `3283f3e`. Note the Remove Office workflow is flagged **Reject** in [03-business-rule-comparison.md](03-business-rule-comparison.md) — it is a real, working user flow, but its underlying hard-delete behavior conflicts with the current immutability principle.

## Workflow 4: Rankings

```text
Select a metric (Revenue, Cases, Average Case Value, Margin)
  -> Select a time period (Current, Last Month, Quarter-to-Date, Year-to-Date)
  -> View offices ranked by the selected metric, highest to lowest
  -> Navigate month-by-month without changing the selected metric
```

Source: commit `88e56e4`. No equivalent page or workflow exists in current product documentation — see [02-feature-inventory.md](02-feature-inventory.md).

## Workflow 5: Submission Compliance Review

```text
View Compliance page: every office's weekly submission history
  -> Filter by DFO
  -> Sort by compliance rate, current streak, or longest streak
  -> View a visual week-by-week submission pattern (last 10 weeks with data)
  -> Rankings displayed with color-coded badges for high/low compliance
```

Source: commit `4813fd7`. Entirely new concept relative to current documentation.

## Workflow 6: Settings / Admin Sanity Check

```text
Open Settings
  -> View database file location
  -> View row counts for every table (offices, staff, contacts, financials, ops, volume, notes, alerts)
  -> Refresh on demand
  -> (Placeholder, never built) "Alert Thresholds" configuration section
```

Source: `src/pages/Settings.tsx`. The unfinished placeholder is documented as evidence in [01-legacy-overview.md](01-legacy-overview.md) and [03-business-rule-comparison.md](03-business-rule-comparison.md), not as a workflow to replicate as-is (a local SQLite table-count view has no direct equivalent in a multi-tenant architecture).

## Recurring UI Patterns Observed

- **Color-coded status borders** on cards (green/yellow/red) based on alert severity.
- **Data completeness badges** (Complete/Partial/No Data) shown consistently across Overview and Rankings.
- **Tab indicators** (checkmarks) showing which data categories have been entered for the current office/month.
- **Previous-period comparison** shown inline during data entry, with a copy-forward shortcut.
- **Click-through navigation** from summary views (Overview cards) directly into the relevant detail/entry screen.

These patterns are already anticipated in spirit by `docs/product/02-mvp-prd.md` Dashboard Requirements (data freshness, data-quality indicators, explainable results) but were never specified at this level of interaction detail.

## Related Documents

- [Feature Inventory](02-feature-inventory.md)
- [Gap Analysis](08-gap-analysis.md)
- [Reusable Concepts](09-reusable-concepts.md)
