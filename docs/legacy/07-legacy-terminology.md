# Legacy Terminology

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

Every business term discovered in the legacy application that is not already fully defined in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) or elsewhere, with meaning (if known), where it was found, and whether it requires founder validation.

## Terms

### DFO

**Meaning (if known):** Unconfirmed. Appears as an office attribute/column positioned immediately after "Managing Dentist" in the office import template (column G, per the code comment `F=Managing Dentist, G=DFO`). Used throughout the UI as a filter dimension ("Filter by DFO," "All DFOs"). Likely an abbreviation for a regional or district role (for example, "District Field Officer" or "Doctor Field Officer") but this is a guess, not a finding.
**Where found:** `src-tauri/src/imports.rs:59`, `src-tauri/src/db.rs:35`, `src/components/DashboardFilters.tsx:21-134`, `src/pages/Compliance.tsx:39-163`.
**Requires Founder Validation? Yes — meaning is completely unconfirmed.**

### Lab Hub

**Meaning (if known):** A financial line item on the monthly financial record, distinct from LSS Expense. Added as a "NEW FIELD" per a code comment, suggesting it was a recent addition at the time development paused. Not defined anywhere in current documentation.
**Where found:** `src-tauri/src/db.rs:83` (schema column `lab_hub`), `src/components/FinancialEntryForm.tsx:437-441`.
**Requires Founder Validation? Yes.**

### LSS Expense

**Meaning (if known):** Likely corresponds to the already-known `LSS SERVICES` laboratory-expense line item in [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md) — good corroborating evidence, not a new term, but the exact equivalence is unconfirmed.
**Where found:** `db.rs:84`, `FinancialEntryForm.tsx:460-464`.
**Requires Founder Validation? Yes (to confirm equivalence, not to define from scratch).**

### Personnel % / Personnel Expense

**Meaning (if known):** Personnel expense as a percentage of revenue. Likely corresponds to [Payroll Percentage](../data/01-metrics-dictionary.md) / [Payroll Expense](../data/01-metrics-dictionary.md), but named differently and thresholded very differently (see [03-business-rule-comparison.md](03-business-rule-comparison.md)).
**Where found:** `db.rs:85` (`personnel_exp`), `commands.rs:937-945`.
**Requires Founder Validation? Yes.**

### Lab Exp % (with outside / without outside)

**Meaning (if known):** Laboratory expense as a percentage of revenue, tracked in two variants depending on whether outsourced lab spend is included. Likely corresponds to [Total Laboratory Expense Percentage](../data/01-metrics-dictionary.md), but with an inside/outside split not currently in the Metrics Dictionary.
**Where found:** `db.rs:78-79` (`lab_exp_no_outside`, `lab_exp_with_outside`).
**Requires Founder Validation? Yes.**

### Outside Lab Spend

**Meaning (if known):** The dollar difference between "with outside" and "without outside" lab expense — i.e., the cost specifically attributable to outsourced case work. Auto-calculated, never entered directly.
**Where found:** `db.rs:80`, `commands.rs:1147,1157`.
**Requires Founder Validation? Yes.**

### Model: PO / PLLC

**Meaning (if known):** An office classification attribute, constrained to exactly two values. Likely "Professional Organization" and "Professional Limited Liability Company" (a legal/business-structure classification), but this expansion is inferred, not confirmed by any code comment or documentation.
**Where found:** `db.rs:31` (CHECK constraint), `imports.rs:76-85`.
**Requires Founder Validation? Yes.**

### Standardization Status

**Meaning (if known):** Unconfirmed. An office attribute stored as free text, imported from column H of the office template.
**Where found:** `db.rs:36`, `imports.rs:59,91-95`.
**Requires Founder Validation? Yes.**

### Backlog in Lab / Backlog in Clinic

**Meaning (if known):** A two-location split of backlog: work still physically in the laboratory (sum of five stages: setups, fixed cases, over-denture, processes, finishes) versus work at the clinic side of the process (sum of four stages: wax try-in, delivery, outside lab, on hold).
**Where found:** `db.rs:121-131`, `commands.rs:1454-1455`.
**Requires Founder Validation? Yes — this is the most concrete evidence found toward resolving OQ-049 (production-stage taxonomy).**

### Lab-side production stages: setups, fixed cases, over-denture, processes, finishes

**Meaning (if known):** Sequential(?) stages of laboratory production work. "Setups" and "finishes" plausibly correspond to the "To be set" and completion-adjacent stages already named as examples in [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) Backlog Cases, but exact correspondence is unconfirmed.
**Where found:** `db.rs:123-127`.
**Requires Founder Validation? Yes.**

### Clinic-side stages: wax try-in, delivery, outside lab, on hold

**Meaning (if known):** Stages of the workflow once a case reaches the clinic. Entirely new relative to current documentation, which has not previously distinguished a clinic-side backlog at all.
**Where found:** `db.rs:128-131`.
**Requires Founder Validation? Yes.**

### Unit tiers: immediate, economy, economy-plus, premium, ultimate

**Meaning (if known):** Appear to be appliance/case quality or pricing tiers used to categorize production volume. Not defined anywhere in current documentation.
**Where found:** `db.rs:132-136`.
**Requires Founder Validation? Yes.**

### Case types: repair, reline, partial, retry, remake, bite block

**Meaning (if known):** Categories of case/unit type tracked alongside the tiers above. "Remake" directly corresponds to the "Remakes" backlog stage already named as an example in the Metrics Dictionary — notably, in legacy this is tracked as a unit-type count, separate from the Backlog in Lab / Backlog in Clinic totals, which is direct evidence relevant to OQ-051 (whether resets/remakes are included in total backlog or presented separately — legacy presents them separately).
**Where found:** `db.rs:137-142`.
**Requires Founder Validation? Yes.**

### ADDL (staff title prefix)

**Meaning (if known):** A prefix on some imported job titles, stripped during import normalization. Likely means "Additional" (a supplemental or secondary staff designation), but this is inferred.
**Where found:** `imports.rs:170-173`.
**Requires Founder Validation? Yes.**

### Data Completeness

**Meaning (if known):** The share of expected monthly data (financial + volume records) actually submitted over a period. A concrete formula exists (see [04-formula-candidates.md](04-formula-candidates.md)).
**Where found:** `commands.rs:1666-1704`, `src/types/Dashboard.ts:46-56` (a related but distinct three-way Complete/Partial/None status).
**Requires Founder Validation? Yes.**

### Submission Compliance

**Meaning (if known):** Weekly, per-office tracking of whether expected data was submitted, with compliance rate and streak calculations. References a `submission_compliance` table that was not found anywhere in the reviewed database migrations (`db.rs`) — a gap in the legacy code itself, not just in documentation.
**Where found:** `commands.rs:2281-2385` (queries the table); table definition not located.
**Requires Founder Validation? Yes — including how weekly submission is actually recorded, since its schema was not found.**

### Labor Model Value

**Meaning (if known):** A single numeric field on the monthly operations record. Unclear whether this is a target dollar figure, a staffing-model score, or something else — "Labor Model" already exists as a concept in current documentation but as a source of Recommended/Current Staffing, not a single value.
**Where found:** `db.rs:105` (`labor_model_value`).
**Requires Founder Validation? Yes.**

## Related Documents

- [Metrics Dictionary](../data/01-metrics-dictionary.md)
- [Business Rule Comparison](03-business-rule-comparison.md)
- [Open Questions](../development/open-questions.md)
