# Legacy Feature Inventory

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

A complete inventory of features found in the legacy Tauri application, each classified against the current architecture as exactly one of: **Already Planned**, **Missing**, **Future Enhancement**, or **Legacy Only**.

## Inventory

| Feature | Legacy Description | Current Status | Notes |
|---|---|---|---|
| Office Directory listing | List all offices with model, DFO, address, phone | **Already Planned** | Matches [Office](../entities/office.md) and Location Comparison concepts |
| Add Office via Excel template | Upload a 5-sheet Excel template (Info, Contact, Financials, Ops, Instructions) to create an office | **Already Planned** | Matches the Import Framework's intent, though the legacy template bundles office creation with several data types at once — see [05-import-workflow-analysis.md](05-import-workflow-analysis.md) |
| Remove Office (hard delete, cascading) | Deletes the office and all related rows (contacts, financials, ops) in one transaction | **Legacy Only** | Conflicts with [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("nothing is deleted"); current design favors Archived over hard delete (see [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md)) |
| Directory export (CSV / Excel) | Export office directory respecting active filters | **Future Enhancement** | Not yet in `docs/product/02-mvp-prd.md`; plausible dashboard requirement |
| Monthly Financial data entry form | 11-field manual entry form per office/month | **Already Planned** | Conceptually covered by [PayrollSnapshot](../entities/payroll-snapshot.md) / [RevenueSnapshot](../entities/revenue-snapshot.md), though current architecture is import-first, not manual-entry-first |
| Monthly Operations data entry form | Backlog count, overtime value, labor model value, staffing fields | **Already Planned** | Covered conceptually by [BacklogSnapshot](../entities/backlog-snapshot.md) and [LaborModelSnapshot](../entities/labor-model-snapshot.md) |
| Monthly/Weekly Volume data entry (stage + tier breakdown) | Detailed lab/clinic stage counts and appliance-tier/case-type unit counts | **Missing** | No current entity has this level of granularity — see [08-gap-analysis.md](08-gap-analysis.md) |
| Notes / action items per office/month | Free-text monthly manager notes | **Missing** | No "Note" entity exists; [Task](../entities/task.md) is action-tracking, not a journal — different concept |
| Previous-month comparison / copy-forward in entry forms | Shows prior month's values inline; can copy forward | **Missing** | Not specified anywhere in current architecture |
| Auto-calculated percentages during entry | Lab Exp %, Personnel %, Outside Lab %, Overtime % computed live as data is typed | **Already Planned** | Metric concepts exist in the Metrics Dictionary; the "calculate live during entry" UX pattern is not yet specified |
| Dashboard Overview (office cards, KPIs, alerts) | Grid of office cards with revenue, lab %, personnel %, backlog, and alerts | **Already Planned** | Matches `docs/product/02-mvp-prd.md` Dashboard Requirements closely |
| Dashboard filters (state, DFO, model, search, data status) | Filter/search offices by several dimensions | **Missing** | State/DFO/model are new filter dimensions not yet in comparison requirements |
| Dashboard alerts (info/warning/critical) | Threshold-based alerts shown per office card | **Already Planned** | Matches [Alert](../entities/alert.md); exact thresholds differ — see [03-business-rule-comparison.md](03-business-rule-comparison.md) |
| Data completeness badges | Complete / Partial / No Data indicator per office | **Already Planned** | Matches the "data-quality indicator" requirement in `docs/product/02-mvp-prd.md` |
| Rankings page (revenue, cases, avg case value, margin) with month navigation | Dedicated page ranking offices by selectable metric and time period | **Missing** | Not a distinct page/feature anywhere in current documentation; Location Comparison is related but not identical |
| Compliance / submission-tracking page | Weekly submission streaks, compliance rate, visual history | **Missing** | Entirely new product concept — see [08-gap-analysis.md](08-gap-analysis.md) |
| Weekly volume bulk import with auto-aggregation to monthly | Imports weekly rows, then averages them into a monthly record using a fixed week-number-to-month band | **Missing** | The Import Framework has no defined weekly-to-monthly aggregation rule yet |
| Database sanity check (table row counts, DB file path) | Admin/debug view of local SQLite state | **Legacy Only** | Specific to a single local SQLite file; a "data health" admin view could be a Future Enhancement in the multi-tenant architecture but is not a direct port |
| Settings placeholder for configurable alert thresholds | Explicit "Coming in Phase 3..." placeholder, never implemented | **Already Planned** | Directly validates the current "no hardcoded thresholds" / "configuration before customization" principles ([ADR-000](../decisions/ADR-000-architectural-philosophy.md)) |
| Import log (audit of every import) | Records import type, filename, row counts, warnings, timestamp | **Already Planned** | Matches [ImportJob](../entities/import-job.md), though simpler (no validation/normalization staging, no profile versioning) |
| Alerts table with dismiss flag | Persisted alerts with a boolean dismissed flag | **Already Planned** | Matches [Alert](../entities/alert.md); current design additionally wants a dismissal reason and full history, which legacy does not have |

## Summary

- **Already Planned:** 12 features — the current architecture's conceptual coverage is broader than the legacy app's, even though nothing is implemented yet.
- **Missing:** 7 features/concepts — most significantly the Volume/production-stage granularity, Rankings, Compliance tracking, and dashboard filter dimensions (state/DFO/model).
- **Future Enhancement:** 1 (directory export).
- **Legacy Only:** 2 (hard-delete-with-cascade, and the SQLite-specific sanity check) — neither should be ported as-is.

## Related Documents

- [Gap Analysis](08-gap-analysis.md)
- [Business Rule Comparison](03-business-rule-comparison.md)
- [UI Workflow Analysis](06-ui-workflow-analysis.md)
