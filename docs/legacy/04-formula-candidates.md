# Formula Candidates

**Version:** 0.1
**Status:** Discovery — candidates only, none approved
**Last Updated:** 2026-08-04

## Purpose

Every business formula found in the legacy application, described in behavior only — **no code is reproduced**. Each entry states purpose, inputs, outputs, source location, whether documentation already exists, and whether founder validation is required.

---

### Laboratory Expense Percentage (legacy: "Lab Exp %")

**Purpose:** Express laboratory expense as a share of revenue.
**Inputs:** Monthly revenue; monthly laboratory expense (the "with outside lab spend" variant).
**Outputs:** A percentage; undefined/unavailable when revenue is zero or missing.
**Source location:** `src-tauri/src/commands.rs:927-935` (dashboard), `commands.rs:1565-1587` (rankings).
**Documentation exists?** Yes — [Total Laboratory Expense Percentage](../data/01-metrics-dictionary.md) is already defined, with a different approved threshold (10.8%) and different known line items than legacy's single "lab expense" figure.
**Founder validation required?** Yes — to confirm whether legacy's "lab expense with outside" figure corresponds to the same numerator as the approved metric.

### Personnel Percentage (legacy: "Personnel %")

**Purpose:** Express personnel/payroll expense as a share of revenue.
**Inputs:** Monthly revenue; monthly personnel expense.
**Outputs:** A percentage; undefined when revenue is zero or missing.
**Source location:** `commands.rs:937-945`, `commands.rs:1589-1610`.
**Documentation exists?** Likely corresponds to [Payroll Percentage](../data/01-metrics-dictionary.md), but under a different name and with a different approved threshold (8.0%).
**Founder validation required?** Yes — confirm "Personnel %" and "Payroll Percentage" are the same concept before treating them as interchangeable.

### Overtime Percentage (legacy: "Overtime %")

**Purpose:** Express overtime expense as a share of revenue.
**Inputs:** Monthly revenue; monthly overtime expense.
**Outputs:** A percentage; undefined when revenue is zero or missing.
**Source location:** `commands.rs:947-955`.
**Documentation exists?** No — current architecture's overtime rule ([`docs/business/04-overtime.md`](../business/04-overtime.md)) is a dollar threshold ($500/month), not a percentage of revenue.
**Founder validation required?** Yes — determine whether a percentage-based overtime signal should exist alongside the dollar-based one.

### Outside Lab Spend

**Purpose:** Isolate the portion of laboratory expense attributable to outsourced case work.
**Inputs:** Laboratory expense including outside spend; laboratory expense excluding outside spend.
**Outputs:** A dollar amount (the difference); explicitly never accepted as a direct import value — always derived.
**Source location:** `src-tauri/src/commands.rs:1147, 1157`; also computed client-side in `src/components/FinancialEntryForm.tsx:189-190` for live display during entry.
**Documentation exists?** No.
**Founder validation required?** Yes — confirm this concept is wanted and how it should relate to the known "OTHER LABORATORY SUPPLIES" / general laboratory-expense line items in [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md).

### Outside Lab Spend Percentage

**Purpose:** Express outside lab spend as a share of total laboratory expense.
**Inputs:** Outside Lab Spend (see above); laboratory expense including outside spend.
**Outputs:** A percentage.
**Source location:** `src/components/FinancialEntryForm.tsx:202` (client-side display only during entry; not persisted to the database in the reviewed schema).
**Documentation exists?** No.
**Founder validation required?** Yes.

### Margin Percentage

**Purpose:** Express gross margin after laboratory expense as a share of revenue.
**Inputs:** Revenue; laboratory expense including outside spend.
**Outputs:** A percentage; the legacy implementation returns 0 (not "unavailable") when revenue is zero — noted as a deviation from LabPulse's null/zero-handling convention.
**Source location:** `commands.rs:1810-1827` (used only in the Rankings feature).
**Documentation exists?** No.
**Founder validation required?** Yes — also flag the zero-revenue-returns-0 behavior as something to correct if adopted, since current convention requires "unavailable," not zero.

### Average Case Value

**Purpose:** Estimate revenue generated per case.
**Inputs:** Summed revenue over a period; summed backlog case count over the same period.
**Outputs:** A dollar amount; 0 when the denominator is zero (again a deviation from the "unavailable" convention).
**Source location:** `commands.rs:1790-1809`.
**Documentation exists?** No.
**Founder validation required?** Yes — and specifically, whether "backlog case count" is the right denominator at all (see [03-business-rule-comparison.md](03-business-rule-comparison.md) item 10) versus a true completed-case or throughput count.

### Data Completeness Percentage

**Purpose:** Measure how much of the expected monthly data (financial + volume) has actually been submitted over a period.
**Inputs:** Count of months with a financial record; count of months with a volume record; total months in the selected period.
**Outputs:** A percentage: `(financial months + volume months) / (total months × 2) × 100`.
**Source location:** `commands.rs:1666-1704`.
**Documentation exists?** No — `docs/product/02-mvp-prd.md` requires a data-quality indicator generically, with no formula.
**Founder validation required?** Yes.

### Submission Compliance Rate

**Purpose:** Measure the share of expected weekly submissions an office actually made.
**Inputs:** Count of weeks submitted; total weeks tracked.
**Outputs:** A percentage.
**Source location:** `commands.rs:2320-2323`.
**Documentation exists?** No.
**Founder validation required?** Yes.

### Submission Streak (Current and Longest)

**Purpose:** Track consecutive weekly submission behavior for compliance monitoring.
**Inputs:** An ordered sequence of weekly submitted/not-submitted flags.
**Outputs:** Two integers — current consecutive-submission count (counting back from the most recent week) and the longest such run ever observed.
**Source location:** `commands.rs:2325-2345`.
**Documentation exists?** No.
**Founder validation required?** Yes.

### Backlog in Lab / Backlog in Clinic

**Purpose:** Split total backlog into two locations — work still inside the laboratory versus work at the clinic side of the workflow.
**Inputs:** Weekly or monthly counts across five lab-side stages (setups, fixed cases, over-denture, processes, finishes) and four clinic-side stages (wax try-in, delivery, outside lab, on hold).
**Outputs:** Two separate integer totals (sum of their respective stage counts).
**Source location:** `commands.rs:1454-1455` (monthly rollup); `src-tauri/src/db.rs:121-131` (schema).
**Documentation exists?** Partially — [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) Backlog Cases lists example stages ("To be set," "To be processed," "To be delivered," "Resets," "Remakes") that only partially overlap with this taxonomy.
**Founder validation required?** Yes — this is the most direct evidence available toward resolving OQ-049 (final production-stage taxonomy).

### Total Weekly Units

**Purpose:** Aggregate total production volume across all appliance tiers and case types in a week.
**Inputs:** Eleven unit-type counts: immediate, economy, economy-plus, premium, ultimate, repair, reline, partial, retry, remake, bite block.
**Outputs:** A single integer (sum of all eleven).
**Source location:** `commands.rs:1456-1458`; schema in `db.rs:159-178`.
**Documentation exists?** No — this appliance-tier/case-type taxonomy does not exist anywhere in current documentation.
**Founder validation required?** Yes.

### Weekly-to-Monthly Volume Aggregation

**Purpose:** Roll up weekly production/backlog data into a monthly figure.
**Inputs:** All weekly records for an office within a fixed week-number band assigned to a given month (a non-calendar-aligned scheme, e.g., weeks 1–4 → month 1).
**Outputs:** A monthly record where each field is the average of the matching weekly records, rounded to the nearest whole number.
**Source location:** `commands.rs:1383-1508`.
**Documentation exists?** No — no weekly-to-monthly rollup rule exists anywhere in the current Import Framework or Snapshot Strategy.
**Founder validation required?** Yes — this is a significant, previously undocumented aggregation rule.

## Related Documents

- [Business Rule Comparison](03-business-rule-comparison.md)
- [Gap Analysis](08-gap-analysis.md)
- [Metrics Dictionary](../data/01-metrics-dictionary.md)
