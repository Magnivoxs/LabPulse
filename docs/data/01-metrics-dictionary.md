# LabPulse Metrics Dictionary

**Version:** 0.1  
**Status:** Discovery

## Purpose

This document is the authoritative source for metric definitions used by LabPulse.

No metric should be implemented until its definition, required fields, calculation rules, reporting grain, and exclusions are documented here.

## Metric Template

Each metric should use the following structure:

### Metric Name

**Business definition:**  
Describe what the metric means in plain language.

**Formula:**  
Document the exact formula.

**Required fields:**  

- Field name
- Field name

**Reporting grain:**  
Examples: organization, region, location, employee, week, month.

**Reporting period:**  
Document applicable time periods.

**Inclusions:**  

- Included item

**Exclusions:**  

- Excluded item

**Target behavior:**  
Describe whether targets are fixed or configurable.

**Null and zero behavior:**  
Describe how missing values and zero denominators are handled.

**Validation rules:**  

- Validation rule

**Example:**  
Use synthetic values.

**Status:**  
Proposed, approved, deprecated, or implemented.

---

## Proposed MVP Metrics

### Net Revenue

**Business definition:**  
Revenue recognized for the selected reporting period after approved adjustments.

**Formula:**  
To be confirmed.

**Required fields:**  

- location_id
- period_start
- period_end
- net_revenue

**Reporting grain:**  
Location and reporting period.

**Target behavior:**  
Targets should be configurable by organization and location.

**Status:**  
Proposed.

**Alias note:**  
This entry is retained as a distinct, still-unresolved metric. The founder's second business-discovery interview separately confirmed [Monthly P&L Revenue](#monthly-pl-revenue) as the primary authoritative dashboard revenue metric. `Net Revenue` must not be silently treated as equivalent to Monthly P&L Revenue — whether the P&L's revenue line represents gross, net, or adjusted revenue is unresolved (see Monthly P&L Revenue status below).

---

### Monthly P&L Revenue

**Business definition:**  
Total office revenue reported on the final monthly profit and loss statement.

**Authoritative source:**  
Monthly P&L.

**Operational secondary source:**  
Power BI prior-day revenue.

**Formula:**  
Imported authoritative monthly value. No derived formula currently required.

**Required fields:**  

- location_id
- reporting_month
- total_office_revenue

**Reporting grain:**  
Location and calendar or approved fiscal month.

**Usage:**  
Primary dashboard revenue, payroll-percentage denominator, laboratory-expense-percentage denominator, comparison, trend, and scenario baseline.

**Conflict handling:**  
When daily Power BI values and the final monthly P&L differ, the P&L is authoritative for finalized dashboard reporting.

**Null and zero behavior:**  
If monthly P&L revenue is zero or missing, dependent percentage metrics (payroll percentage, laboratory expense percentage) must return an unavailable state rather than zero or infinity.

**Status:**  
Provisionally approved, subject to confirmation of whether the P&L line is gross revenue, net revenue, adjusted revenue, or another accounting label. See [Net Revenue](#net-revenue) alias note above — do not merge these entries until that confirmation happens.

**Related open questions:**  
See [`docs/development/open-questions.md`](../development/open-questions.md), Revenue section.

---

### Labor Cost

**Business definition:**  
The qualifying labor expense attributed to a location and reporting period.

**Formula:**  
To be confirmed.

**Required fields:**  

- location_id
- period_start
- period_end
- qualifying_labor_cost

**Reporting grain:**  
Location and reporting period.

**Status:**  
Proposed.

---

### Labor Percentage

**Business definition:**  
Qualifying labor cost expressed as a percentage of net revenue.

**Formula:**

```text
labor_percentage =
    qualifying_labor_cost / net_revenue * 100
```

**Required fields:**

- qualifying_labor_cost
- net_revenue

**Reporting grain:**  
Location and reporting period.

**Null and zero behavior:**  
If net revenue is zero or missing, the metric should return an unavailable state rather than infinity or zero.

**Example:**

```text
Qualifying labor cost: $10,000
Net revenue: $125,000
Labor percentage: 8.0%
```

**Status:**  
Proposed. Inclusion rules still require confirmation.

---

### Overtime Hours

**Business definition:**  
Total approved overtime hours attributed to a location during the selected period.

**Formula:**

```text
sum(overtime_hours)
```

**Reporting grain:**  
Location, employee, department, and reporting period where supported.

**Status:**  
Proposed.

---

### Overtime Cost

**Business definition:**  
Total labor cost associated with overtime hours during the selected period.

**Formula:**  
To be confirmed based on available payroll data.

**Status:**  
Proposed.

---

### Employee Count

**Business definition:**  
The number of active employees assigned to a location during the reporting period.

**Formula:**  
To be confirmed, including treatment of shared employees and partial periods.

**Status:**  
Proposed.

---

### Technician Count

**Business definition:**  
The number of active employees whose approved JobRole classification (see [`docs/entities/job-role.md`](../entities/job-role.md)) is included in technician staffing.

**Formula:**  
To be confirmed.

**Status:**  
Proposed.

---

### Revenue per Technician

**Business definition:**  
Net revenue divided by technician count for the selected period.

**Formula:**

```text
revenue_per_technician =
    net_revenue / technician_count
```

**Null and zero behavior:**  
If technician count is zero or missing, return unavailable.

**Status:**  
Proposed.

---

### Revenue per Labor Hour

**Business definition:**  
Net revenue divided by qualifying labor hours.

**Formula:**

```text
revenue_per_labor_hour =
    net_revenue / qualifying_labor_hours
```

**Status:**  
Proposed.

---

### Expected Staffing

**Business definition:**  
The staffing level recommended by the approved labor model for the selected location and reporting period.

**Formula:**  
To be supplied by the domain owner.

**Status:**  
Proposed.

---

### Actual Staffing

**Business definition:**  
The approved count or full-time equivalent staffing assigned to a location.

**Formula:**  
To be confirmed.

**Status:**  
Proposed.

---

### Staffing Variance

**Business definition:**  
The difference between actual staffing and expected staffing.

**Formula:**

```text
staffing_variance =
    actual_staffing - expected_staffing
```

**Interpretation:**

- Positive values may indicate staffing above the model
- Negative values may indicate staffing below the model
- The metric must not independently determine whether staffing is appropriate

**Status:**  
Proposed.

---

### Revenue Growth

**Business definition:**  
The percentage change in revenue between the selected period and an approved comparison period.

**Formula:**

```text
revenue_growth_percentage =
    (current_revenue - comparison_revenue)
    / comparison_revenue
    * 100
```

**Null and zero behavior:**  
If comparison revenue is zero or missing, return unavailable.

**Status:**  
Proposed.

---

## Metrics Proposed From Business-Discovery Interview

The following metrics were introduced by the founder's first business-discovery interview (see [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) and [`docs/business/rules/BR-001-prioritize-location-review.md`](../business/rules/BR-001-prioritize-location-review.md)). Their formulas are conceptual only. No numeric threshold beyond the two confirmed in the interview (8% payroll, 10.8% total laboratory expense) has been approved, and neither threshold's formula inputs are fully resolved yet.

### Payroll Expense

**Business definition:**  
The qualifying payroll-related expense attributed to a location for the monthly reporting period, drawn from known P&L payroll line items.

**Known included line items:**

- SALARIES
- OVERTIME PAY - SUPPORT STAFF
- BONUS
- PAYROLL TAX EXPENSE
- 401K EXPENSE
- HEALTH, LIFE, DENTAL, WC, SHORT TERM

**Inclusions:**  
Current known P&L lines above.

**Exclusions:**  
To be confirmed.

**Line-item mapping behavior:**  
Organization-configurable, because P&L account names may differ across organizations or P&L formats.

**Reporting grain:**  
Location and monthly reporting period.

**Status:**  
Proposed pending exhaustive line-item confirmation. The current list is a known subset, not a confirmed-exhaustive list; additional payroll-related lines may exist.

**Related open questions:**  
See [`docs/development/open-questions.md`](../development/open-questions.md), Payroll and Laboratory Expense section.

---

### Payroll Percentage

**Business definition:**  
Payroll expense expressed as a percentage of monthly P&L revenue. Used as a location investigation trigger when it exceeds the confirmed 8.0% threshold.

**Formula:**

```text
payroll_percentage =
    qualifying_payroll_expense
    / monthly_p_and_l_revenue
    * 100
```

**Required fields:**  

- qualifying_payroll_expense (see [Payroll Expense](#payroll-expense); known lines confirmed, exhaustiveness unresolved)
- monthly_p_and_l_revenue (see [Monthly P&L Revenue](#monthly-pl-revenue))

**Reporting grain:**  
Location, monthly (P&L-sourced).

**Reporting period:**  
Monthly.

**Inclusions:**  
Known payroll line items listed under [Payroll Expense](#payroll-expense) above.

**Exclusions:**  
To be confirmed.

**Target behavior:**  
Initial review threshold: above 8.0%. This is a **business threshold used to flag locations for review**, not an automatic decision. The threshold must be configurable and versioned; the current 8.0% value is not guaranteed to apply to every future organization.

**Null and zero behavior:**  
If monthly P&L revenue is zero or missing, the metric must return an unavailable state rather than zero or infinity.

**Validation rules:**  
To be confirmed.

**Example:**  
Use synthetic values only; see BR-001 example.

**Status:**  
Proposed. Formula inputs are directionally confirmed via known line items; exhaustiveness and treatment of unusual adjustments remain unresolved.

**Related open questions:**  
OQ-007, OQ-011, OQ-012, OQ-014, OQ-015, and additional payroll-line-inclusion and unusual-adjustment questions (see [`docs/development/open-questions.md`](../development/open-questions.md))

---

### Qualifying Laboratory Expense

**Business definition:**  
A proposed measure of laboratory and operational expense attributed to a location for the monthly reporting period, drawn from known P&L expense line items. This is a source measure, not yet a confirmed final metric name.

**Known line items:**

- OPERATIONAL EXPENSE
- SMALL EQUIPMENT PURCHASES
- LABORATORY SUPPLIES
- TEETH SUPPLIES
- OTHER LABORATORY SUPPLIES
- OFFICE SUPPLIES
- TRAVEL/LODGING/MEALS
- DUES & SUBSCRIPTIONS
- LSS SERVICES
- LICENSES
- PROPERTY, USE, & OTHER TAX
- OTHER EXPENSES

**Inclusions:**  
This list is not exhaustive. P&L formats may vary, and account mappings should be configurable by organization.

**Exclusions:**  
Payroll inclusion has not been established. Do not assume payroll is included in this measure — the known line items above appear operational rather than clearly payroll-inclusive.

**Reporting grain:**  
Location and monthly reporting period.

**Status:**  
Proposed. The preferred metric name remains unresolved.

**Related open questions:**  
See [`docs/development/open-questions.md`](../development/open-questions.md), Payroll and Laboratory Expense section.

---

### Total Laboratory Expense Percentage

**Business definition:**  
Qualifying laboratory expense expressed as a percentage of monthly P&L revenue. Used as a location investigation trigger when it exceeds the confirmed 10.8% threshold.

**Formula:**

```text
laboratory_expense_percentage =
    qualifying_laboratory_expense
    / monthly_p_and_l_revenue
    * 100
```

**Required fields:**  

- qualifying_laboratory_expense (see [Qualifying Laboratory Expense](#qualifying-laboratory-expense))
- monthly_p_and_l_revenue (see [Monthly P&L Revenue](#monthly-pl-revenue))

**Reporting grain:**  
Location, monthly (P&L-sourced).

**Reporting period:**  
Monthly.

**Inclusions:**  
Known line items listed under [Qualifying Laboratory Expense](#qualifying-laboratory-expense) above.

**Exclusions:**  
Payroll must not be assumed included without confirmation.

**Target behavior:**  
Initial manual-review threshold: above 10.8%. This is a **business threshold used to flag locations for review**, not an automatic decision. The threshold is configurable and versioned.

**Null and zero behavior:**  
If monthly P&L revenue is zero or missing, the metric should return an unavailable state.

**Validation rules:**  
To be confirmed.

**Example:**  
Use synthetic values only; see BR-001 example.

**Status:**  
Proposed. Formula inputs unresolved as to exhaustiveness and payroll treatment. Preferred label may later become `Operational Laboratory Expense Percentage` or another approved term — do not rename the product-facing metric without business confirmation.

**Related open questions:**  
OQ-013, OQ-014, OQ-015, and additional questions on payroll exclusion, final metric name, and account-mapping variation (see [`docs/development/open-questions.md`](../development/open-questions.md))

---

### Monthly Overtime Cost

**Business definition:**  
Monthly overtime-pay expense associated with support staff or other approved laboratory personnel.

**Authoritative source:**  
Monthly P&L or approved payroll report.

**Formula:**  
To be confirmed based on available payroll data.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location and monthly reporting period.

**Reporting period:**  
Monthly.

**Target behavior:**  
Initial manual-review threshold: greater than $500 in one month. Additional trigger: repeated overtime over multiple weeks. This is a business threshold used to flag locations for review, not an automatic decision.

**Important limitation:**  
The repeated-overtime period (number of consecutive or non-consecutive weeks) and its data source are not yet defined.

**Null and zero behavior:**  
To be confirmed.

**Status:**  
Proposed. Supersedes the generic [Overtime Cost](#overtime-cost) metric above for review-threshold purposes; that entry is retained for the broader MVP overtime-cost concept.

**Related open questions:**  
OQ-016, OQ-017, and the repeated-overtime-duration question (see [`docs/development/open-questions.md`](../development/open-questions.md))

---

### Backlog Cases

**Business definition:**  
Total active laboratory cases currently in production or awaiting completion across approved production stages at a location.

**Unit:**  
Cases (not individual units).

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location, likely daily or weekly.

**Target behavior:**  
Initial manual-review threshold: 20 or more total cases. A universal threshold may create false positives for high-volume locations; the future rule should support location-specific, volume-adjusted, or model-specific thresholds.

**Current stages:**

- To be set
- To be processed
- To be delivered
- Resets
- Remakes
- Other stages to be confirmed

**Not currently tracked:**  
Days behind.

**Null and zero behavior:**  
To be confirmed.

**Status:**  
Proposed. This entry supersedes the prior generic "Backlog" entry now that unit (cases) and initial threshold (20) are confirmed; stage taxonomy and volume-adjusted thresholds remain unresolved.

**Related open questions:**  
OQ-018, OQ-019, and new questions on volume-adjusted thresholds and reset/remake presentation (see [`docs/development/open-questions.md`](../development/open-questions.md))

---

### Backlog by Production Stage

**Business definition:**  
A proposed metric recording backlog case counts broken out by production stage, for a location and reporting date.

**Required dimensions:**  

- organization_id
- location_id
- reporting_date
- production_stage
- case_count

**Reporting grain:**  
Location, reporting date, and production stage.

**Status:**  
Proposed. Final stage taxonomy is unresolved (see current stages listed under [Backlog Cases](#backlog-cases)).

**Related open questions:**  
See [`docs/development/open-questions.md`](../development/open-questions.md), Overtime and Backlog section.

---

### Open Positions

**Business definition:**  
The count of unfilled staffing positions at a location. Reviewed as the fourth of the manager's first five daily KPIs.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location.

**Target behavior:**  
To be confirmed.

**Null and zero behavior:**  
To be confirmed.

**Status:**  
Proposed.

---

### Reset Count

**Business definition:**  
The number of resets attributed to a location during the reporting period. Resets are a quality-diagnostic indicator that may point to a bite problem (clinical) or a technician-quality problem (laboratory).

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location and reporting period.

**Target behavior:**  
No threshold confirmed.

**Status:**  
Proposed. "Reset" is not yet formally defined.

**Related open questions:**  
OQ-021, OQ-023, OQ-024

---

### Reset Rate

**Business definition:**  
Reset count expressed as a rate (for example, per case or per period). Exact denominator undefined.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location and reporting period.

**Null and zero behavior:**  
To be confirmed.

**Status:**  
Proposed.

**Related open questions:**  
OQ-021, OQ-023

---

### Remake Count

**Business definition:**  
The number of remakes attributed to a location during the reporting period. Remakes are a quality-diagnostic indicator that may point to a bite problem (clinical) or a technician-quality problem (laboratory).

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location and reporting period.

**Target behavior:**  
No threshold confirmed.

**Status:**  
Proposed. "Remake" is not yet formally defined.

**Related open questions:**  
OQ-022, OQ-023, OQ-024

---

### Remake Rate

**Business definition:**  
Remake count expressed as a rate (for example, per case or per period). Exact denominator undefined.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Location and reporting period.

**Null and zero behavior:**  
To be confirmed.

**Status:**  
Proposed.

**Related open questions:**  
OQ-022, OQ-023

---

### Call Rate

**Business definition:**  
A measure of call activity used as a contributing indicator when investigating revenue decline. Exact definition and source system are unresolved and may originate outside the laboratory function.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Likely practice or location level.

**Status:**  
Proposed. Definition and system of record unresolved.

**Related open questions:**  
OQ-027, OQ-031

---

### Welcome-Call Completion Rate

**Business definition:**  
The rate at which "welcome calls" are completed. Used as a contributing indicator when investigating revenue decline. "Welcome call" itself is not yet defined.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Likely practice or location level.

**Status:**  
Proposed. Definition, measurement method, and system of record unresolved.

**Related open questions:**  
OQ-028, OQ-029, OQ-031

---

### Conversion Rate

**Business definition:**  
A measure of conversion (definition unresolved) used as a contributing indicator when investigating revenue decline.

**Formula:**  
To be confirmed.

**Required fields:**  
To be confirmed.

**Reporting grain:**  
Likely practice or location level.

**Status:**  
Proposed. Definition and system of record unresolved.

**Related open questions:**  
OQ-030, OQ-031

---

## Metrics Proposed From the Labor Model Import

The following metrics come from the Labor Model workbook analyzed for the Import Framework (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)). No real office IDs, office names, regions, or numeric values are recorded anywhere in this repository — only field definitions.

### Recommended Staffing

**Business definition:**  
The staffing level the Labor Model recommends for an office. This is the Labor-Model-sourced instance of the existing generic [Expected Staffing](#expected-staffing) metric above.

**Formula:**  
Imported value from the Labor Model workbook. No derived formula.

**Required fields:**  

- office_id
- reporting_period
- recommended_staffing

**Reporting grain:**  
Office and reporting period.

**Status:**  
Proposed. Exact unit (headcount, full-time equivalent, or role-broken-out) unresolved.

**Related open questions:**  
OQ-061 (see [`docs/development/open-questions.md`](../development/open-questions.md))

---

### Current Staffing

**Business definition:**  
The staffing level currently assigned to an office. This is the Labor-Model-sourced instance of the existing generic [Actual Staffing](#actual-staffing) metric above.

**Formula:**  
Imported value from the Labor Model workbook. No derived formula.

**Required fields:**  

- office_id
- reporting_period
- current_staffing

**Reporting grain:**  
Office and reporting period.

**Status:**  
Proposed. Exact unit unresolved (see OQ-061).

---

### Staffing Difference

**Business definition:**  
The difference between current staffing and recommended staffing for an office. This follows the same shape as the existing generic [Staffing Variance](#staffing-variance) metric above.

**Formula:**

```text
staffing_difference =
    current_staffing - recommended_staffing
```

**Required fields:**  

- current_staffing
- recommended_staffing

**Reporting grain:**  
Office and reporting period.

**Interpretation:**

- Positive values may indicate staffing above the model.
- Negative values may indicate staffing below the model.
- The metric must not independently determine whether staffing is appropriate.

**Status:**  
Proposed. Not yet confirmed whether the Labor Model workbook provides this as a column or whether LabPulse must calculate it.

**Related open questions:**  
See [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md).

---

### Staffing Adherence %

**Business definition:**  
A percentage, provided by the Labor Model workbook, expressing how closely current staffing matches recommended staffing for an office.

**Formula:**  
To be confirmed. Not yet known whether this is `current_staffing / recommended_staffing * 100`, a weighted variant, or another calculation.

**Required fields:**  

- office_id
- reporting_period
- staffing_adherence_percentage

**Reporting grain:**  
Office and reporting period.

**Target behavior:**  
No numeric review threshold has been approved.

**Null and zero behavior:**  
If recommended staffing is zero or missing, the metric should return an unavailable state rather than zero or infinity, consistent with other percentage metrics in this dictionary.

**Status:**  
Proposed. Formula and threshold both unresolved; see [BR-006 Staffing Adherence](../business/rules/BR-006-staffing-adherence.md).

**Related open questions:**  
OQ-059, OQ-065

---

### Labor % of Revenue

**Business definition:**  
A labor-cost-to-revenue percentage as computed within the Labor Model workbook itself.

**Formula:**  
To be confirmed. Not yet known whether this uses the same numerator and denominator as the P&L-derived [Payroll Percentage](#payroll-percentage) metric above, or a separate Labor-Model-internal calculation.

**Required fields:**  

- office_id
- reporting_period
- labor_percentage_of_revenue

**Reporting grain:**  
Office and reporting period.

**Important limitation:**  
This metric must not be assumed equivalent to [Payroll Percentage](#payroll-percentage). Displaying both without reconciliation could mislead a manager if they diverge.

**Status:**  
Proposed. Relationship to Payroll Percentage unresolved.

**Related open questions:**  
OQ-060

---

## Governance Rules

- Metric definitions must not be duplicated in application components.
- Approved formulas should be implemented as tested shared functions.
- Formula changes require documentation and test updates.
- Dashboard labels should match this dictionary.
- AI-generated explanations must use the approved definitions.
