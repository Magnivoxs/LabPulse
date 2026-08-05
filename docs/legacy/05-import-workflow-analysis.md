# Import Workflow Analysis

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

Document how the legacy application actually imports data, and compare it against the new Import Framework ([`docs/imports/01-import-framework.md`](../imports/01-import-framework.md)).

## File Formats Supported

**XLSX only**, read via the Rust `calamine` crate. No CSV, no API. Four distinct import flows exist:

1. Office list import (`Office_list.xlsx`)
2. Staff list import (`full_staff_list_per_office.xlsx`)
3. Contacts import (`Lab_manager_Contact_List.xlsx`)
4. Bulk financials import (reads a specifically named worksheet, `monthly_financials`, inside a workbook)
5. Bulk weekly volume import (similar named-worksheet pattern, inferred from `import_bulk_weekly_volume`)

Source: `src-tauri/src/imports.rs`, `src-tauri/src/commands.rs:1059-1383`.

## Import Sequence

There is no unified pipeline. Each import type is a standalone function invoked directly from a specific UI action:

```text
User selects a file (native file dialog)
  -> Rust command opens the workbook directly
  -> Rows are read positionally (by column index, not header name) for Offices/Staff/Contacts
  -> A specific named worksheet is read for bulk Financials/Volume
  -> Each row is validated and upserted into SQLite, row by row
  -> An import_log row is written summarizing the whole file
  -> The frontend displays a summary (rows processed / inserted / updated / warnings)
```

There is no separate "validate, preview, then approve" step — import and persistence happen in the same operation. There is no column-mapping UI; column meaning is fixed by position (or by worksheet name) in code.

## Validation Behavior

- **Row-level, not file-level.** A malformed row produces a warning and is skipped; the rest of the file still imports.
- **Column-count check:** rows with fewer columns than expected are rejected with a warning.
- **Type coercion:** numeric cells accept Int, Float, or numeric String; non-numeric values fail gracefully to `None`/skip rather than crashing the import.
- **Referential validation:** staff and contact imports check that the target office already exists; if not, the row is skipped with a warning (the office is never auto-created).
- **Domain validation:** office `model` must be exactly `"PO"` or `"PLLC"` (case-normalized to uppercase); anything else is rejected with a warning.
- **No duplicate-row detection within a single file** beyond what the database's `UNIQUE` constraints enforce at insert time.

## Duplicate Handling

Every import type uses `INSERT ... ON CONFLICT ... DO UPDATE` (a true upsert) keyed on a natural key (`office_id` for offices; `(office_id, name)` for staff; `(office_id, year, month)` for financials/ops/volume). **The prior value is silently overwritten — no history of what the previous value was is retained anywhere.**

## Error Handling

- Warnings are collected into a list and returned to the frontend as part of the import summary, and also persisted (as a JSON string) in the `import_log` table.
- A row-level failure never aborts the whole file; processing continues.
- A workbook-open failure (bad file, wrong format) does abort the whole import with a single error.

## User Interaction

- Native OS file picker (Tauri dialog plugin) — no drag-and-drop for the four core imports; drag-and-drop exists specifically for the "Add Office from Template" flow (per commit `3283f3e`).
- After import, the user sees a summary count and a list of warning strings — no interactive per-row correction UI, no ability to re-map columns, no preview-before-commit step.
- The "Add Office via Template" flow generates a downloadable template (5 sheets: Info, Contact, Financials, Ops, Instructions) so the user has a starting point, rather than requiring them to match an existing format from scratch.

## Comparison Against the New Import Framework

| Dimension | Legacy | Current Import Framework |
|---|---|---|
| Pipeline stages | Single combined "read + validate + write" step | Distinct Import → Validation → Normalization → Canonical Snapshot stages ([`docs/imports/01-import-framework.md`](../imports/01-import-framework.md)) |
| Column mapping | Fixed by position or worksheet name, in code | Alias-based, configurable per organization ([`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md)) |
| Versioning | None — no concept of an import profile version | Every import tied to a specific Import Profile version ([`docs/data-model/03-versioning-strategy.md`](../data-model/03-versioning-strategy.md)) |
| History on re-import | Overwritten (upsert, no history) | New immutable snapshot per import ([`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md)) |
| Referential validation | Present (office must pre-exist for staff/contacts) | Already Documented — matches [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md) "Unresolved Reference" category |
| Invalid rows | Warned and skipped, never silently dropped | Already Documented — matches [`CLAUDE.md`](../../CLAUDE.md) and current validation design |
| Audit trail | `import_log` table: type, filename, counts, warnings, timestamp | Matches [ImportJob](../entities/import-job.md) conceptually, but simpler — no profile-version reference, no validation/normalization stage breakdown |
| Weekly→monthly rollup | A specific, working averaging algorithm exists | **Missing** — no equivalent rule exists yet (see [04-formula-candidates.md](04-formula-candidates.md)) |
| Office ID format | Plain integer, normalized by trimming and parsing | Resolves part of OQ-056 — legacy evidence suggests a plain integer key, not an alphanumeric code, though this needs founder confirmation before treating it as settled |

## Notable Gaps in the Legacy Approach (Not to Be Replicated)

- No import versioning of any kind.
- No distinction between validation and normalization as separate stages — a row is written to its final table the moment it passes row-level checks.
- Inconsistent import-summary accuracy: three of the four import functions never correctly increment "rows updated" even when an upsert updates an existing row (see [03-business-rule-comparison.md](03-business-rule-comparison.md) item 19).

## Related Documents

- [Import Framework](../imports/01-import-framework.md)
- [Import Validation](../imports/05-import-validation.md)
- [Import Persistence](../data-model/import-persistence.md)
- [Formula Candidates](04-formula-candidates.md)
