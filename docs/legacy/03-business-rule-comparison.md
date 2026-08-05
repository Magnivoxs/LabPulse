# Business Rule Comparison

**Version:** 0.1
**Status:** Discovery — comparison only, no adoption
**Last Updated:** 2026-08-04

## Purpose

Compare every significant calculation or decision found in the legacy application against the current architecture. **This document does not adopt legacy behavior.** Each item is classified as exactly one of: **Already Documented**, **Needs Validation**, **Missing from Architecture**, **Legacy Only**, **Reject**.

## Comparison

### 1. Laboratory expense threshold: warning >20%, critical >25%

**Legacy source:** `src/types/Dashboard.ts:73-83`. **Current architecture:** [BR-001](../business/rules/BR-001-prioritize-location-review.md) / [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md) approved threshold is **10.8%**, a single review trigger, not a two-tier warning/critical scale.
**Classification: Needs Validation.** The legacy value is roughly double the approved threshold and uses a two-tier severity scale our architecture does not currently have. This conflict must go to the founder — do not assume either value is correct without confirmation.

### 2. Personnel expense threshold: warning >15%, critical >20%

**Legacy source:** `src/types/Dashboard.ts:88-98`. **Current architecture:** Payroll Percentage approved threshold is **8.0%** ([BR-001](../business/rules/BR-001-prioritize-location-review.md)).
**Classification: Needs Validation.** Same pattern as above — legacy's "critical" tier (20%) is 2.5x the approved 8.0% threshold. Also raises the question of whether "Personnel %" and "Payroll Percentage" are the same metric — see [07-legacy-terminology.md](07-legacy-terminology.md).

### 3. Backlog threshold: warning >50 cases, critical >100 cases

**Legacy source:** `src/types/Dashboard.ts:103-113`. **Current architecture:** approved threshold is **20 or more cases** ([BR-001](../business/rules/BR-001-prioritize-location-review.md), [`docs/business/07-backlog.md`](../business/07-backlog.md)).
**Classification: Needs Validation.** Legacy's thresholds are 2.5x–5x higher. Note the current architecture already anticipates this kind of variance via "volume-adjusted thresholds for high-volume locations" (OQ-050) — legacy's higher numbers may reflect specific high-volume offices rather than a universal disagreement.

### 4. Overtime percentage has no alert rule in legacy

**Legacy source:** `src/types/Dashboard.ts` — `overtime_percent` is computed (`commands.rs:947-955`) but `generateAlerts()` never evaluates it.
**Classification: Needs Validation.** Current architecture's overtime trigger is dollar-based ($500/month, [`docs/business/04-overtime.md`](../business/04-overtime.md)), not percentage-of-revenue. Legacy computed a percentage but apparently never finished wiring an alert to it. Worth asking the founder whether a percentage-based overtime signal is wanted alongside the dollar-based one.

### 5. Office hard delete with cascading removal across related tables

**Legacy source:** `src-tauri/src/commands.rs:2024-2117` (`remove_office`).
**Classification: Reject.** Directly conflicts with [ADR-006](../decisions/ADR-006-data-platform-philosophy.md) ("nothing is deleted") and the Archived-not-Deleted default in [`docs/data-model/entity-lifecycle.md`](../data-model/entity-lifecycle.md). Do not replicate this pattern.

### 6. Upsert-on-import with no history retained

**Legacy source:** every import function uses `ON CONFLICT ... DO UPDATE`, overwriting prior values with no record of what changed (`imports.rs`, `commands.rs:1160-1184`, `commands.rs:1461-1502`).
**Classification: Reject.** Conflicts with the immutable-snapshot design in [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md) — a new import should produce a new snapshot, not silently overwrite the prior one.

### 7. Percentages suppressed for multi-month date ranges

**Legacy source:** `commands.rs:924-961` — percentages are only computed when `start == end` (a single month); multi-month ranges return `None` for all percentages and use `SUM()` for absolute figures instead.
**Classification: Needs Validation.** A reasonable-looking constraint (averaging percentages of percentages is often misleading) that the current architecture has not yet addressed for trend/period views. Worth considering, not yet approved.

### 8. Backlog averaged (not summed) across multi-month ranges

**Legacy source:** `commands.rs:963-995` — uses `AVG(backlog_case_count)`, rounded, for multi-month views.
**Classification: Needs Validation.** Relevant to how a future `BacklogSnapshot` should aggregate across a selected period; not yet decided in current architecture.

### 9. Weekly-to-monthly volume aggregation via a fixed week-number band, averaged

**Legacy source:** `commands.rs:1383-1508` (`aggregate_weekly_to_monthly`) — weeks are bucketed into months using a fixed, non-calendar table (weeks 1–4 → month 1, 5–8 → month 2, 9–13 → month 3, ...), then averaged and rounded per office/month.
**Classification: Missing from Architecture.** No such rollup rule exists anywhere in the current Import Framework or Snapshot Strategy. This is a real, working algorithm for a problem (weekly→monthly rollup) our architecture has not yet addressed at all.

### 10. "Average Case Value" = revenue ÷ backlog case count

**Legacy source:** `commands.rs:1790-1809`.
**Classification: Reject** (as implemented) **— underlying concept Needs Validation.** Dividing revenue by a backlog (pending-work) count rather than a completed-case or throughput count is semantically questionable — it conflates a snapshot quantity with a flow quantity. The business need behind it ("how much is each case worth") is legitimate and worth asking the founder about; this specific formula should not be copied.

### 11. "Margin %" = (revenue − lab expense with outside) ÷ revenue × 100

**Legacy source:** `commands.rs:1810-1827`.
**Classification: Missing from Architecture.** No margin metric exists anywhere in the current Metrics Dictionary.

### 12. "Outside Lab Spend" auto-calculated, never imported directly

**Legacy source:** `commands.rs:1147, 1157` — `outside_lab_spend = lab_exp_with_outside − lab_exp_no_outside`; the import explicitly ignores any imported value for this column because it is derived.
**Classification: Missing from Architecture.** Not currently a named metric or field anywhere in the Metrics Dictionary or PayrollSnapshot design.

### 13. "Data Completeness %" = (financial submissions + volume submissions) ÷ (months × 2) × 100

**Legacy source:** `commands.rs:1666-1704`.
**Classification: Missing from Architecture.** `docs/product/02-mvp-prd.md` requires a "data-quality indicator" generically but defines no formula.

### 14. Compliance rate, current streak, longest streak (weekly submission tracking)

**Legacy source:** `commands.rs:2281-2385`.
**Classification: Missing from Architecture.** No submission-compliance concept exists anywhere in current documentation.

### 15. Referential validation: staff/contact imports require the office to already exist

**Legacy source:** `imports.rs:178-190, 260-272`.
**Classification: Already Documented.** Matches [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md) "Unresolved Reference" outcome exactly. Good corroboration of an existing design decision.

### 16. Invalid/incomplete rows produce warnings and are skipped, never silently dropped

**Legacy source:** throughout `imports.rs` and the bulk-import functions in `commands.rs`.
**Classification: Already Documented.** Matches [`CLAUDE.md`](../../CLAUDE.md) ("do not silently discard invalid records") and [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md).

### 17. Job title normalization: strip "ADDL " prefix

**Legacy source:** `imports.rs:170-173`.
**Classification: Missing from Architecture.** A specific, real data-cleaning rule for staff/JobRole imports that nothing in [`docs/entities/job-role.md`](../entities/job-role.md) or the import validation docs anticipates.

### 18. Contact role hardcoded to "Lab Manager" for the contacts-import flow

**Legacy source:** `imports.rs:257`.
**Classification: Legacy Only.** A narrow implementation shortcut tied to one specific import file's known content, not a generalizable rule.

### 19. Import row-count reporting bug: updates counted as inserts

**Legacy source:** `imports.rs` — `rows_inserted` increments on every successful `ON CONFLICT DO UPDATE`, `rows_updated` is never incremented in `import_offices`, `import_staff`, or `import_contacts` (contrast with `import_bulk_financials`, `commands.rs:1186-1197`, which does distinguish correctly).
**Classification: Reject.** A defect, not a business rule — flagged so it is not mistaken for intentional behavior and is not replicated.

### 20. Office "Model" constrained to exactly PO or PLLC

**Legacy source:** `db.rs:31` (CHECK constraint), `imports.rs:76-85` (import-time validation).
**Classification: Needs Validation.** A real office-classification attribute (likely "Professional Organization" vs. "Professional Limited Liability Company," not confirmed) with no equivalent field anywhere in the current [Office entity](../entities/office.md).

### 21. Alert severity: info / warning / critical (three levels, only two used by threshold rules)

**Legacy source:** `src/types/Dashboard.ts:21`.
**Classification: Needs Validation.** Current [Alert](../entities/alert.md) entity has no defined severity scale yet; this is a reasonable starting candidate but not approved.

### 22. Explicit acknowledgment that thresholds should be configurable, never implemented

**Legacy source:** `src/pages/Settings.tsx:90-94` ("Alert Thresholds — Coming in Phase 3...").
**Classification: Already Documented.** Strong corroboration of the "no hardcoded thresholds" / "configuration before customization" principles already in [ADR-000](../decisions/ADR-000-architectural-philosophy.md) — nothing new to adopt, but valuable confirmation the founder had already reached the same conclusion independently.

## Summary Counts

| Classification | Count |
|---|---|
| Already Documented | 4 |
| Needs Validation | 8 |
| Missing from Architecture | 6 |
| Legacy Only | 1 |
| Reject | 3 |

## Related Documents

- [Formula Candidates](04-formula-candidates.md)
- [Gap Analysis](08-gap-analysis.md)
- [Open Questions](../development/open-questions.md)
