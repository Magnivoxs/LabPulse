# LabPulse Open Questions

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

This document is the authoritative backlog of unresolved business, data, and product questions surfaced during discovery interviews.

No formula, threshold, or business rule should be implemented from an unresolved question. Items here must be answered and dated before they are treated as approved.

## Format

Each entry includes:

- **ID**
- **Category**
- **Question**
- **Why it matters**
- **Status**
- **Owner**
- **Answer or decision**
- **Date resolved**

Unless otherwise noted, status is `Open` and owner is `Founder / Lab Operations`.

---

## Data Cadence and Workflow

### OQ-001

**Category:** Data cadence and workflow
**Question:** Is the career grid officially updated weekly, monthly, or both?
**Why it matters:** The founder interview stated both that "P&Ls, labor model, and career grid are updated monthly" and, separately, that "career grid is updated weekly on Mondays." [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) currently treats the weekly Monday update as the more specific and authoritative cadence per task instructions, but the underlying inconsistency is unresolved and affects data-freshness expectations and import scheduling.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-002

**Category:** Data cadence and workflow
**Question:** What time is prior-day revenue normally available in Power BI?
**Why it matters:** Determines when the dashboard can reliably show "prior-day revenue" as current, and when the freshness indicator should flag it as stale.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-003

**Category:** Data cadence and workflow
**Question:** Is Power BI revenue final, estimated, or subject to later P&L adjustment?
**Why it matters:** Affects whether daily revenue figures should be labeled as provisional and whether variances between daily and monthly reporting should be expected and explained rather than treated as data-quality errors.
**Status:** Resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed Power BI daily revenue is used for day-to-day operational analysis but is not the primary dashboard revenue metric. Monthly P&L revenue (total office revenue for the month) is the primary, authoritative dashboard revenue metric; when Power BI daily revenue and the final P&L differ, the P&L is authoritative. See [`docs/business/01-revenue.md`](../business/01-revenue.md).
**Date resolved:** 2026-08-04

### OQ-004

**Category:** Data cadence and workflow
**Question:** Which timesheet system is used?
**Why it matters:** Needed to scope any future integration or import mapping for timesheet and missed-punch data.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-005

**Category:** Data cadence and workflow
**Question:** Can missed-punch and payroll-approval data be exported?
**Why it matters:** Determines whether this workflow step can be represented in LabPulse at all during the MVP, or must remain outside the product.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-006

**Category:** Data cadence and workflow
**Question:** Should messages, calls, and emails be represented manually in LabPulse or remain outside the MVP?
**Why it matters:** These are unstructured communication signals that currently inform investigation but have no defined data model. A decision is needed before designing any manual-entry or integration feature.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Revenue

### OQ-007

**Category:** Revenue
**Question:** What exact revenue definition is used for payroll percentage?
**Why it matters:** The 8% payroll threshold cannot be implemented as a calculation until the revenue denominator is precisely defined (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md), Payroll Percentage).
**Status:** Partially resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed the denominator is Monthly P&L Revenue (total office revenue on the final monthly P&L), which is authoritative over daily Power BI revenue for finalized reporting. The exact accounting classification of that P&L revenue line (gross, net, or adjusted) remains unresolved — see OQ-043.
**Date resolved:** 2026-08-04 (partial)

### OQ-008

**Category:** Revenue
**Question:** What constitutes a significant month-over-month revenue decline?
**Why it matters:** This investigation trigger is currently qualitative only. A numeric or rule-based threshold is required before it can drive an automated alert (see BR-001).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-009

**Category:** Revenue
**Question:** Should daily revenue be compared with budget, prior day, same weekday, prior month, or prior year?
**Why it matters:** Affects the design of the revenue trend chart and which comparison values are shown alongside the current-day figure.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-010

**Category:** Revenue
**Question:** Are large orders included in normal revenue reporting, and how should they affect forecasts?
**Why it matters:** Unusually large orders are a named investigation trigger; understanding how they interact with revenue reporting is necessary to avoid false-positive decline or spike alerts.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-043

**Category:** Revenue
**Question:** Is the monthly P&L revenue line gross revenue, net revenue, adjusted revenue, or another accounting label?
**Why it matters:** [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) documents Monthly P&L Revenue as provisionally approved but flags this accounting classification as unresolved; it must not be silently treated as equivalent to the separately defined `Net Revenue` metric.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Payroll and Laboratory Expense

### OQ-011

**Category:** Payroll and laboratory expense
**Question:** Which payroll categories are included in the 8% threshold?
**Why it matters:** Required to implement the Payroll Percentage metric's numerator (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
**Status:** Partially resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed known payroll-related P&L line items: SALARIES, OVERTIME PAY - SUPPORT STAFF, BONUS, PAYROLL TAX EXPENSE, 401K EXPENSE, and HEALTH, LIFE, DENTAL, WC, SHORT TERM. This list is not yet confirmed to be exhaustive; additional payroll-related lines may exist.
**Date resolved:** 2026-08-04 (partial)

### OQ-012

**Category:** Payroll and laboratory expense
**Question:** Does payroll percentage include overtime, bonus, PTO, payroll burden, benefits, LSS, Lab Hub, or temporary labor?
**Why it matters:** Each of these components could materially change the calculated payroll percentage and the accuracy of the 8% threshold.
**Status:** Partially resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** Overtime pay (support staff), bonus, payroll tax, 401(k), and health/life/dental/WC/short-term benefits are confirmed included via the known line items in OQ-011. PTO, temporary labor, LSS costs, Lab Hub costs, manager labor, and unusual adjustments are not represented by a confirmed account line and remain open.
**Date resolved:** 2026-08-04 (partial)

### OQ-013

**Category:** Payroll and laboratory expense
**Question:** Which expense categories are included in the 10.8% total laboratory expense threshold?
**Why it matters:** Required to implement the Total Laboratory Expense Percentage metric's numerator.
**Status:** Partially resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed known laboratory/operational-expense P&L line items: OPERATIONAL EXPENSE, SMALL EQUIPMENT PURCHASES, LABORATORY SUPPLIES, TEETH SUPPLIES, OTHER LABORATORY SUPPLIES, OFFICE SUPPLIES, TRAVEL/LODGING/MEALS, DUES & SUBSCRIPTIONS, LSS SERVICES, LICENSES, PROPERTY, USE, & OTHER TAX, and OTHER EXPENSES. This list is not exhaustive, and P&L formats may vary. See OQ-044, OQ-045, and OQ-046 for related unresolved questions.
**Date resolved:** 2026-08-04 (partial)

### OQ-014

**Category:** Payroll and laboratory expense
**Question:** Do payroll and laboratory-expense targets vary by office type, region, or operating model?
**Why it matters:** Determines whether the 8% and 10.8% thresholds are global constants or configurable per location/organization.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:** 8.0% and 10.8% are confirmed as the current initial targets and must be implemented as configurable and versioned rather than hard-coded, but whether they should actually differ by office type, region, or operating model is still unresolved.
**Date resolved:**

### OQ-015

**Category:** Payroll and laboratory expense
**Question:** Are the 8% and 10.8% thresholds evaluated monthly only, or over additional periods?
**Why it matters:** P&L data is currently monthly; if thresholds should also be evaluated weekly or daily, additional data sources or estimation logic would be required.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-044

**Category:** Payroll and laboratory expense
**Question:** Is payroll excluded from the 10.8% laboratory expense measure?
**Why it matters:** The known laboratory-expense line items appear operational rather than clearly payroll-inclusive, but this has not been explicitly confirmed. Payroll must not be assumed included without confirmation (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md), Total Laboratory Expense Percentage).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-045

**Category:** Payroll and laboratory expense
**Question:** What should the final user-facing metric name be for the 10.8% laboratory expense measure?
**Why it matters:** The current phrase "total laboratory expense" may be ambiguous given the operational nature of the known line items. Candidates include `Laboratory Expense Percentage` and `Operational Laboratory Expense Percentage`, but the product must not be renamed without business confirmation.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-046

**Category:** Payroll and laboratory expense
**Question:** How do account mappings vary across different P&L formats?
**Why it matters:** Some P&L formats may omit, rename, or classify line items differently, so account-to-metric mappings likely need to be organization-configurable rather than fixed.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Overtime and Backlog

### OQ-016

**Category:** Overtime and backlog
**Question:** What numeric overtime threshold requires investigation?
**Why it matters:** "Excessive overtime" is currently a qualitative trigger only; it cannot drive an automated alert without a numeric threshold.
**Status:** Resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed an initial threshold: monthly overtime cost greater than $500 triggers manual review. Repeated overtime across multiple weeks is an additional trigger (see OQ-047 for the unresolved recurrence period).
**Date resolved:** 2026-08-04

### OQ-017

**Category:** Overtime and backlog
**Question:** Is overtime evaluated as hours, dollars, percentage of revenue, percentage of total hours, or a combination?
**Why it matters:** Determines the required fields and formula shape for any future overtime threshold metric.
**Status:** Partially resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** Overtime is not primarily judged by hours; the confirmed initial trigger is monthly overtime cost (dollars) above $500. Hours and percentage-based measures remain open as potential supporting metrics rather than the primary trigger.
**Date resolved:** 2026-08-04 (partial)

### OQ-018

**Category:** Overtime and backlog
**Question:** What numeric backlog threshold requires investigation?
**Why it matters:** "Excess backlog" is currently a qualitative trigger only; it cannot drive an automated alert without a numeric threshold.
**Status:** Resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** The second business-discovery interview confirmed an initial threshold: 20 or more total cases in the laboratory triggers manual review. This is an initial review trigger only; see OQ-050 for the unresolved question of volume-adjusted thresholds for high-volume locations.
**Date resolved:** 2026-08-04

### OQ-019

**Category:** Overtime and backlog
**Question:** Is backlog measured in cases, units, days, or department-specific categories?
**Why it matters:** Determines the required fields and units for the Backlog metric (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
**Status:** Resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** Backlog is measured in cases, not individual units, and is tracked by production stage. Days behind are not currently tracked. See OQ-049 for the unresolved final production-stage taxonomy.
**Date resolved:** 2026-08-04

### OQ-020

**Category:** Overtime and backlog
**Question:** How should unusually large orders be identified?
**Why it matters:** Needed to turn the qualitative "large orders" investigation trigger into a detectable condition.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-047

**Category:** Overtime and backlog
**Question:** How many consecutive or non-consecutive weeks of overtime constitute "repeated overtime" requiring review?
**Why it matters:** The second business-discovery interview confirmed that repeated overtime across multiple weeks is a review trigger in addition to the $500 monthly cost trigger, but explicitly left the exact number of weeks and required continuity undefined.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-048

**Category:** Overtime and backlog
**Question:** What case-by-case criteria distinguish acceptable overtime from overtime requiring corrective action?
**Why it matters:** Whether overtime is acceptable depends on revenue, staffing, vacancies, backlog, and local circumstances; final decisions remain case-by-case. Without documented criteria, this judgment cannot be made consistent or auditable.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-049

**Category:** Overtime and backlog
**Question:** What is the final production-stage taxonomy for backlog tracking?
**Why it matters:** Known example stages (to be set, to be processed, to be delivered, resets, remakes) were confirmed, but the founder indicated additional stages remain to be confirmed. A final taxonomy is required to implement Backlog by Production Stage (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-050

**Category:** Overtime and backlog
**Question:** How should backlog thresholds be adjusted for high-volume locations?
**Why it matters:** A universal 20-case threshold may create false positives for high-volume offices, which may reasonably carry more backlog. A volume-adjusted, per-technician, or location-specific approach has not yet been selected.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-051

**Category:** Overtime and backlog
**Question:** Does total backlog include resets and remakes, or are they presented separately?
**Why it matters:** Resets and remakes are listed as backlog production stages, but it is unclear whether they should count toward the 20-case total backlog trigger or be broken out as a distinct quality signal.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-052

**Category:** Overtime and backlog
**Question:** What is the snapshot timing and reporting frequency for backlog case counts?
**Why it matters:** Backlog is tracked by production stage, but how often counts are captured (for example, daily versus real-time) and at what time of day is undefined; this affects data-freshness display and comparability across locations.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Quality

### OQ-021

**Category:** Quality
**Question:** How are resets defined?
**Why it matters:** Required to implement the Reset Count and Reset Rate metrics.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-022

**Category:** Quality
**Question:** How are remakes defined?
**Why it matters:** Required to implement the Remake Count and Remake Rate metrics.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-023

**Category:** Quality
**Question:** What rates or counts indicate a quality concern?
**Why it matters:** Needed to define an actionable threshold for quality-related investigation triggers.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-024

**Category:** Quality
**Question:** How is a likely clinical issue distinguished from a laboratory-quality issue?
**Why it matters:** Directly affects the Quality Escalation Logic in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md); incorrect classification could misdirect escalation between lab operations and the Clinical Director.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-025

**Category:** Quality
**Question:** Are bite issues tracked separately?
**Why it matters:** Bite issues were named as a specific example of a clinical-leaning cause behind resets/remakes; separate tracking could improve root-cause classification accuracy.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-026

**Category:** Quality
**Question:** What other quality measures should be included?
**Why it matters:** Resets and remakes may not be the only quality signals available; other measures could improve root-cause accuracy.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Revenue Root Cause

### OQ-027

**Category:** Revenue root cause
**Question:** What call-rate metrics are used?
**Why it matters:** Required to implement the Call Rate metric and to support revenue-decline investigation.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-028

**Category:** Revenue root cause
**Question:** What is a welcome call?
**Why it matters:** Required to define the Welcome-Call Completion Rate metric and confirm it is scoped consistently across locations.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-029

**Category:** Revenue root cause
**Question:** How is welcome-call completion measured?
**Why it matters:** Required to define the formula and required fields for the Welcome-Call Completion Rate metric.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-030

**Category:** Revenue root cause
**Question:** How is conversion rate defined?
**Why it matters:** Required to implement the Conversion Rate metric.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-031

**Category:** Revenue root cause
**Question:** Which systems provide call, welcome-call, and conversion data?
**Why it matters:** These measures may originate outside the laboratory function (for example, practice or clinical operations systems); system ownership must be identified before any import or integration can be scoped.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-032

**Category:** Revenue root cause
**Question:** How is appliance quality connected to revenue analysis?
**Why it matters:** Appliance quality was named as a revenue-decline contributing indicator, but its measurement and relationship to revenue is undefined.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Operational Decisions

### OQ-033

**Category:** Operational decisions
**Question:** What criteria support approving a hire?
**Why it matters:** Needed to connect the Scenario Engine and recommendation logic to a defensible hiring decision.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-034

**Category:** Operational decisions
**Question:** What criteria support delaying a hire?
**Why it matters:** Needed to distinguish "approve hiring" from "delay hiring" as recommendation outcomes.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-035

**Category:** Operational decisions
**Question:** What criteria support transferring a technician?
**Why it matters:** Needed to implement Transfer Analysis as described in [`docs/product/01-product-vision.md`](../product/01-product-vision.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-036

**Category:** Operational decisions
**Question:** What criteria trigger manager coaching?
**Why it matters:** Needed to define this operational decision as a recommendation outcome rather than an ad hoc judgment call.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-037

**Category:** Operational decisions
**Question:** What criteria trigger travel?
**Why it matters:** Needed to define this operational decision as a recommendation outcome.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-038

**Category:** Operational decisions
**Question:** What criteria trigger leadership escalation?
**Why it matters:** Needed to distinguish routine monitoring from actionable escalation in the prioritized location-review queue.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-039

**Category:** Operational decisions
**Question:** How are laboratory ordering budgets established and monitored?
**Why it matters:** Needed to connect the "review ordering budgets" operational decision to a measurable input.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-040

**Category:** Operational decisions
**Question:** What criteria determine whether LSS support is needed?
**Why it matters:** Needed to implement LSS-request logic and eligibility rules referenced in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) and [BR-005 LSS Recommendation](../business/rules/BR-005-lss-recommendation.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-041

**Category:** Operational decisions
**Question:** How long is LSS support normally assigned?
**Why it matters:** Needed to model LSS support duration and cost in future scenario or staffing calculations, including [`docs/scenario-engine/03-lss-support.md`](../scenario-engine/03-lss-support.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-042

**Category:** Operational decisions
**Question:** How should actions and outcomes be recorded?
**Why it matters:** Needed to design the action/owner/status/follow-up tracking referenced in [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Architecture and Authorization

### OQ-053

**Category:** Architecture and authorization
**Question:** Should "location" terminology throughout the repository be formally renamed to "office" to match the Office Authorization architecture ([ADR-004](../decisions/ADR-004-office-based-authorization.md)), or should both terms remain permanent synonyms?
**Why it matters:** ADR-004 introduces "office" as the canonical term for new architecture, import, and scenario-engine documents, while existing metrics, business-rule, and PRD documents use "location." Leaving this unresolved risks long-term terminology drift.
**Status:** Resolved
**Owner:** Founder / Lab Operations
**Answer or decision:** Sprint 1.5 (Domain Model Finalization) resolved this: "Office" is the sole canonical internal term (data model, business rules, entity catalog, backend/architecture docs). "Location" is permitted only as a user-interface display label and must never become a second backend concept. Existing documents using "location_id" or "location" in a backend sense are historical and not retroactively rewritten; new documentation must use "Office." See [`docs/entities/office.md`](../entities/office.md) and [ADR-004](../decisions/ADR-004-office-based-authorization.md).
**Date resolved:** 2026-08-04

### OQ-054

**Category:** Architecture and authorization
**Question:** How should temporary office assignments be modeled (start date, end date, auto-expiry, renewal)?
**Why it matters:** ADR-004 names temporary office assignment as a required access pattern but does not design it; needed before office-based authorization can be implemented.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-055

**Category:** Architecture and authorization
**Question:** How should a future franchise grouping fit into the Organization -> Office -> Permissions -> User hierarchy?
**Why it matters:** ADR-004 names future franchises as a required access pattern but does not design where a franchise grouping sits relative to organization and office.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Import Framework and Labor Model

### OQ-056

**Category:** Import framework and Labor Model
**Question:** What is the exact Office ID format used in source systems (length, prefix, alphanumeric pattern)?
**Why it matters:** Needed to implement structural and type validation for the Labor Model import profile (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-057

**Category:** Import framework and Labor Model
**Question:** Does every office appear in exactly one Labor Model regional worksheet, or can an office appear in more than one (for example, during a regional reassignment)?
**Why it matters:** Affects how the Labor Model import profile deduplicates or reconciles rows across the four regional worksheets.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-058

**Category:** Import framework and Labor Model
**Question:** What additional worksheets (for example, summary or instructions sheets) exist in the Labor Model workbook, and do they require their own handling?
**Why it matters:** The Labor Model import profile currently documents only the four regional worksheets; other worksheets, if present, are unaccounted for.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-059

**Category:** Import framework and Labor Model
**Question:** What is the exact formula behind the Labor Model workbook's Staffing Adherence % field?
**Why it matters:** Required to implement [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md) and to decide whether LabPulse should consume the workbook's value as-is or recompute it.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-060

**Category:** Import framework and Labor Model
**Question:** Is "Labor % of Revenue" in the Labor Model workbook the same calculation as the P&L-derived Payroll Percentage metric, or a separate, potentially divergent value?
**Why it matters:** If these two values can diverge, presenting them without distinction could mislead a manager about payroll performance; see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-061

**Category:** Import framework and Labor Model
**Question:** What unit is used for Recommended Staffing and Current Staffing (headcount, full-time equivalent, or role-specific breakdown)?
**Why it matters:** Required to implement [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) and to normalize Labor Model data consistently.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## New Business Rules and Scenario Engine

### OQ-062

**Category:** New business rules and scenario engine
**Question:** What criteria or threshold should determine a Hiring Recommendation?
**Why it matters:** Required to implement [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md) beyond its current structure-only definition.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-063

**Category:** New business rules and scenario engine
**Question:** What gap between current and recommended staffing should be considered "understaffed"?
**Why it matters:** Required to implement [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) with an actual threshold.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-064

**Category:** New business rules and scenario engine
**Question:** What escalation workflow should apply when overtime recurs after a prior review, beyond the existing $500 monthly and repeated-week triggers?
**Why it matters:** Required to implement [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)'s Monitor/Flagged/Escalated categories.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-065

**Category:** New business rules and scenario engine
**Question:** What Staffing Adherence % threshold, if any, should trigger manual review?
**Why it matters:** Required to implement [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md) with an actual review threshold, once OQ-059 confirms the underlying formula.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

---

## Legacy Reconciliation

Surfaced by Sprint 2.5 (Legacy Knowledge Extraction) from the archived Tauri desktop application. See [`docs/legacy/`](../legacy/README.md) for full detail. None of these questions should be resolved by assuming the legacy application's behavior was correct — see [`docs/legacy/03-business-rule-comparison.md`](../legacy/03-business-rule-comparison.md).

### OQ-066

**Category:** Legacy reconciliation
**Question:** Do the legacy application's alert thresholds (Lab Expense >20%/>25%, Personnel >15%/>20%, Backlog >50/>100 cases) indicate the currently approved thresholds (10.8%, 8.0%, 20 cases) should be reconsidered, or do they reflect a different context (for example, specific high-volume offices)?
**Why it matters:** A real, working prior implementation used substantially higher thresholds than [BR-001](../business/rules/BR-001-prioritize-location-review.md)'s approved values. This conflict should not be silently resolved in either direction.
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-067

**Category:** Legacy reconciliation
**Question:** Is "Personnel %" (legacy term) the same metric as "Payroll Percentage," and is "Lab Exp %" the same as "Laboratory Expense Percentage"?
**Why it matters:** If these are the same underlying concepts under different names, legacy's formula and threshold history becomes directly relevant evidence; if they differ, conflating them would corrupt the Metrics Dictionary. See [`docs/legacy/07-legacy-terminology.md`](../legacy/07-legacy-terminology.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-068

**Category:** Legacy reconciliation
**Question:** What do the office attributes "DFO," "Model" (constrained to PO or PLLC), and "Standardization Status" mean, and should they become Office entity fields?
**Why it matters:** All three are used throughout the legacy application (as filters, import fields, and a database constraint) with no definition found in any code comment or documentation. Related to OQ-056 (Office ID format).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-069

**Category:** Legacy reconciliation
**Question:** Does the legacy backlog taxonomy (Backlog in Lab: 5 stages; Backlog in Clinic: 4 stages; a separate 11-category unit-tier/case-type breakdown) reflect the taxonomy LabPulse should adopt for production-stage tracking?
**Why it matters:** This is the most concrete evidence found toward resolving OQ-049 (final production-stage taxonomy) and OQ-051 (whether resets/remakes are included in total backlog) — legacy tracks remakes as a separate unit-type count, not part of either backlog total. See [`docs/legacy/04-formula-candidates.md`](../legacy/04-formula-candidates.md) and [`07-legacy-terminology.md`](../legacy/07-legacy-terminology.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-070

**Category:** Legacy reconciliation
**Question:** Should LabPulse adopt Margin %, Outside Lab Spend (and Outside Lab Spend %), and Data Completeness % as approved metrics, and if so, with what exact formulas?
**Why it matters:** All three have real, working legacy implementations with no current equivalent in the Metrics Dictionary. See [`docs/legacy/04-formula-candidates.md`](../legacy/04-formula-candidates.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-071

**Category:** Legacy reconciliation
**Question:** Should submission compliance (weekly on-time-data tracking with streaks) become a LabPulse feature, and if so, how should "submitted" be defined and recorded?
**Why it matters:** A real legacy feature and UI page with no current equivalent anywhere in LabPulse's product documentation. Note the legacy `submission_compliance` table was queried in code but never found in its own database migrations — the legacy implementation itself may be incomplete. See [`docs/legacy/09-reusable-concepts.md`](../legacy/09-reusable-concepts.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-072

**Category:** Legacy reconciliation
**Question:** What weekly-to-monthly aggregation rule, if any, should LabPulse use for volume/production data, and should it be calendar-aligned (unlike the legacy application's fixed week-number bands)?
**Why it matters:** No such rule exists anywhere in the current Import Framework or [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md); legacy has a complete, working, but non-calendar-aligned implementation. See [`docs/legacy/04-formula-candidates.md`](../legacy/04-formula-candidates.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**

### OQ-073

**Category:** Legacy reconciliation
**Question:** What does "Labor Model Value" (a single numeric field in the legacy monthly operations record) represent, and how does it relate to Recommended Staffing / Current Staffing in [LaborModelSnapshot](../entities/labor-model-snapshot.md)?
**Why it matters:** Unclear whether this is a target dollar figure, a staffing-model score, or something else entirely. See [`docs/legacy/07-legacy-terminology.md`](../legacy/07-legacy-terminology.md).
**Status:** Open
**Owner:** Founder / Lab Operations
**Answer or decision:**
**Date resolved:**
