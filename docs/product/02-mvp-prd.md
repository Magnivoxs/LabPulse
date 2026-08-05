# LabPulse MVP Product Requirements Document

**Version:** 0.1  
**Status:** Discovery  
**Primary User:** Lab Operations Managers

## 1. Purpose

This document defines the initial requirements for the LabPulse MVP.

The MVP should demonstrate that LabPulse can standardize operational data, compare location performance, identify meaningful changes, and model possible staffing or financial decisions.

## 2. MVP Objective

The MVP should allow a Lab Operations Manager to:

1. View operational performance across locations
2. Compare selected locations
3. Identify exceptions and risks
4. Review labor, revenue, overtime, and staffing metrics
5. Run basic what-if scenarios
6. Understand the assumptions behind calculated results
7. Use synthetic or sanitized data during prototype development

## 3. Primary User

### Lab Operations Manager

Typical responsibilities:

- Review multiple laboratory locations
- Monitor revenue and labor performance
- Investigate overtime
- Assess staffing needs
- Compare locations
- Support hiring and transfer decisions
- Communicate findings to leadership

## 4. MVP Scope

### Included

- Authentication prototype
- Organization and location structure
- Synthetic data
- Executive operations dashboard
- Location comparison
- Revenue metrics
- Labor metrics
- Overtime metrics
- Staffing metrics
- Configurable targets
- Basic alerts
- Basic scenario engine
- Import design and mapping prototype
- Audit-friendly calculation explanations

### Excluded from the first implementation

- Production payroll integrations
- Production HR integrations
- Automated employment decisions
- Full machine-learning forecasting
- Customer billing
- Native mobile applications
- Storing real AI credentials before secure secret storage is designed
- Medical or clinical patient information
- Automated changes to staffing or payroll systems

## 5. First Core Workflow

### Compare location performance

The user should be able to:

1. Open the location comparison page
2. Select two or more locations
3. Select a reporting period
4. View standardized metrics
5. Sort locations by metric
6. identify positive or negative variances
7. Open a location for more detail
8. View related alerts and possible actions

## 6. Initial Metrics

The exact definitions must be maintained in the metrics dictionary.

Initial candidates:

- Net revenue
- Revenue growth
- Labor cost
- Labor percentage
- Regular labor hours
- Overtime hours
- Overtime cost
- Overtime percentage
- Employee count
- Technician count
- Revenue per technician
- Revenue per labor hour
- Expected staffing
- Actual staffing
- Staffing variance
- Open positions
- Location target variance

## 7. Dashboard Requirements

The dashboard should include:

- Reporting-period selector
- Organization or region filters
- Key performance indicators
- Trend charts
- Location performance table
- Exception alerts
- Data freshness indicator
- Data-quality indicator
- Recommended review items

Every metric should support:

- A visible definition
- Reporting period
- Current value
- Comparison value
- Variance
- Data source
- Last updated timestamp

## 8. Location Comparison Requirements

The comparison page should support:

- Selecting multiple locations
- Selecting a time period
- Selecting comparison metrics
- Sorting and filtering
- Viewing target variance
- Viewing trend direction
- Opening location details
- Exporting sanitized prototype results later if approved

## 9. Scenario Engine Requirements

The Scenario Engine's purpose, the questions it must answer, and its relationship to business rules are documented in [`docs/scenario-engine/README.md`](../scenario-engine/README.md) and are not duplicated here. As of this update, no scenario formulas have been defined — see [`docs/scenario-engine/01-hiring.md`](../scenario-engine/01-hiring.md), [`02-overtime-vs-hiring.md`](../scenario-engine/02-overtime-vs-hiring.md), and [`03-lss-support.md`](../scenario-engine/03-lss-support.md).

### Initial scenario types

- Hire one employee
- Remove one vacant position
- Transfer one employee
- Increase revenue
- Decrease revenue
- Reduce overtime
- Change hourly wage
- Change expected staffing
- Change operating hours

### Inputs

Scenario inputs may include:

- Location
- Employee role
- Hourly wage
- Weekly regular hours
- Expected overtime reduction
- Revenue adjustment
- Effective date
- Training or ramp-up period
- Employer burden percentage
- Optional assumptions

### Outputs

Scenario outputs may include:

- Change in regular payroll
- Change in overtime payroll
- Net payroll change
- Change in labor percentage
- Estimated capacity change
- Estimated revenue change
- Estimated monthly effect
- Estimated annual effect
- Break-even period
- Assumptions
- Warnings
- Confidence classification

### Calculation rules

Scenario calculations must:

- Use deterministic functions
- Be covered by automated tests
- Expose assumptions
- Avoid hidden AI-generated arithmetic
- Clearly distinguish historical data from user-entered assumptions
- Never be represented as guaranteed results

## 10. Data Import Requirements

The canonical import architecture — Import → Import Profile → Validation → Normalization → Canonical LabPulse Data Model → Business Rules → Scenario Engine → Dashboard — is documented in [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md) and is not duplicated here. No application logic may depend directly on source-file layouts.

The planned import workflow should include:

1. File upload
2. File-type validation
3. Header detection
4. Column suggestion
5. User confirmation
6. Data validation
7. Error preview
8. Import approval
9. Normalization
10. Import history
11. Saved mapping template

Initial supported formats should be limited to:

- CSV
- XLSX

PDF ingestion should not be included until the CSV and XLSX workflows are reliable.

## 11. Data Quality Requirements

The application should identify:

- Missing required values
- Duplicate rows
- Invalid dates
- Invalid numeric values
- Unknown locations
- Unknown employees
- Unexpected columns
- Reporting-period conflicts
- Outlier values
- Stale data

The system should not silently discard invalid records.

## 12. Roles and Permissions

Access is expected to follow Office-Based Authorization (`Organization -> Office -> Permissions -> User`) per [ADR-004](../decisions/ADR-004-office-based-authorization.md), not region-based authorization. "Office" is the canonical internal term; "Location" may still appear in the user interface as a display label only — see ADR-004's Terminology section. A user's office access may span one office, many offices, an entire organization, a temporary office assignment, or a future franchise grouping — the last two are not yet designed.

These roles are candidate [SecurityRole](../entities/security-role.md) values (distinct from an Employee's [JobRole](../entities/job-role.md), per the Sprint 1.5 domain-model split). A second, expanded candidate list (Regional Manager, Operations Director, Recruiter, Payroll, Administrator, Executive) has since been named and is not yet reconciled with the three below — see [`docs/entities/security-role.md`](../entities/security-role.md) Open Questions.

Initial role candidates:

### Organization Administrator

- Configure organization
- Manage users
- Manage locations
- Configure targets
- Review import history
- Access all organization data

### Operations Manager

- View assigned locations
- Compare locations
- Run scenarios
- Review alerts
- Import approved data if permitted

### Read-Only Viewer

- View assigned dashboards
- View approved reports
- Cannot import or modify data

The final permissions model requires further definition.

## 13. Security Requirements

- Every tenant-owned table must use Row-Level Security
- Tenant access must not rely only on frontend filters
- Service-role credentials must never be exposed to the browser
- Uploaded files must be validated server-side
- Secrets must not be committed to Git
- Sensitive values must not be written to logs
- Input must be validated at system boundaries
- Authorization must be tested
- Import actions should be auditable
- AI output must not be treated as authoritative calculation results

## 14. Nonfunctional Requirements

### Maintainability

- Strict TypeScript
- Small focused modules
- Minimal dependencies
- Shared business logic
- No duplicated formulas
- Database migrations tracked in source control
- Architecture changes documented

### Performance

Initial dashboard pages should be designed to load quickly using aggregated data rather than repeatedly calculating every metric in the browser.

### Accessibility

The interface should use semantic elements, keyboard-accessible controls, readable contrast, and accessible chart alternatives.

### Observability

The future production system should support structured logs, error monitoring, and import diagnostics without exposing sensitive information.

## 15. Prototype Success Criteria

The prototype is successful when a Lab Operations Manager can:

- Understand the purpose of LabPulse within five minutes
- Compare multiple locations
- Identify a location requiring attention
- Understand why it requires attention
- Run a staffing or overtime scenario
- Understand the scenario assumptions
- Provide useful feedback on whether the workflow would help their job

## 16. Open Questions

- How is net revenue defined?
- Which payroll expenses count toward labor percentage?
- Which roles count as technicians?
- What is the reporting week?
- How are shared employees assigned?
- How are transfers represented?
- How are vacancies represented?
- How are labor-model targets calculated?
- Which metrics are location-specific?
- Which metrics are organization-wide?
- Which data sources are available weekly?
- Which data sources are available monthly?
- Which users may import files?
- Which users may run scenarios?
- Which users may configure assumptions?

The detailed, individually tracked backlog of discovery-interview open questions is maintained in [`docs/development/open-questions.md`](../development/open-questions.md).

## Daily Operations Review

This section captures MVP requirements derived from the founder's first business-discovery interview, documented in full in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md). It supplements, and does not replace, the requirements above.

### Context

The Lab Operations Manager's actual daily workflow combines data sources with different update cadences: daily revenue (Power BI), daily/payroll-cycle timekeeping data, weekly career-grid updates (Mondays), and monthly P&L and labor-model data. The MVP must be designed around this mixed cadence rather than assuming a single daily refresh.

### Requirements

- The MVP must support data with different update cadences (daily, weekly, and monthly) within the same dashboard.
- The home dashboard should show data freshness for each data source or metric displayed.
- The dashboard should prioritize the following KPIs, in this order, reflecting the manager's current review sequence: revenue, payroll percentage, overtime, open positions, backlog.
- The application should provide a prioritized location-review queue, informed by the triggers documented in [`docs/business/rules/BR-001-prioritize-location-review.md`](../business/rules/BR-001-prioritize-location-review.md).
- Locations in the review queue should display the reasons they were flagged, including which threshold or condition was triggered.
- Qualitative or manager-entered issues must be visually and structurally distinguishable from calculated, threshold-based alerts.
- Users should be able to record an action, owner, status, and follow-up date in a future workflow (not required for the earliest prototype, but the data model should not preclude it).
- Clinical-quality escalation must be distinguishable from laboratory-management actions, consistent with the Quality Escalation Logic in the executive workflow document.
- The MVP should use synthetic data until real-data security is approved, consistent with [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) and [`CLAUDE.md`](../../CLAUDE.md).

### Acceptance Criteria

- Given a dashboard displaying revenue, payroll percentage, overtime, open positions, and backlog for a location, when the page loads, then all five KPIs are visible without additional navigation and in the order listed above.
- Given a metric with a known update cadence (daily, weekly, or monthly), when it is displayed on the dashboard, then a freshness indicator shows the last-updated date and whether the data is within its expected cadence window.
- Given a location whose payroll percentage exceeds the confirmed 8% threshold or whose total laboratory expense exceeds the confirmed 10.8% threshold, when the review queue is generated, then that location appears in the queue with the specific triggered condition and its current and target values shown.
- Given a location flagged only by a qualitative or manager-entered condition (for example, a manager note about excessive overtime with no numeric threshold configured), when it is displayed in the review queue, then it is visibly labeled as manager-entered or qualitative rather than presented as a calculated alert.
- Given a flagged location associated with resets or remakes, when the manager views the flag detail, then the system does not assert a specific technician or clinician as the cause.
- Given no real customer, employee, or financial data has been approved for use, when the MVP is deployed for review, then only synthetic or sanitized data is present in the application.

### Explicitly Not Required for MVP

- Automated hiring, transfer, coaching, travel, or escalation decisions.
- Numeric thresholds for overtime, backlog, revenue decline, and large orders, since these remain unresolved (see [`docs/development/open-questions.md`](../development/open-questions.md)).
- Integration with email, text messaging, or call systems.

## 17. Revenue, Payroll, Expense, Overtime, and Backlog Requirements

This section captures MVP requirements derived from the founder's second business-discovery interview, documented in full in [`docs/business/01-revenue.md`](../business/01-revenue.md), [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md), [`docs/business/04-overtime.md`](../business/04-overtime.md), and [`docs/business/07-backlog.md`](../business/07-backlog.md). It supplements, and does not replace, the requirements above.

### Revenue Source Requirements

- Monthly P&L revenue is the finalized dashboard source.
- Daily Power BI revenue is optional for later operational monitoring, not required as the primary dashboard revenue metric.
- Preliminary (Power BI) and finalized (P&L) revenue values must be visually distinguishable.
- The dashboard must show data source and freshness for every revenue value displayed.
- Final monthly P&L values must not be silently overwritten by preliminary daily values.

### Configurable Financial Mappings

- P&L line-item mappings (payroll and laboratory-expense account lines) must be configurable by organization, since account names may differ across P&L formats.
- Thresholds must not be hard-coded into UI components.
- Thresholds should support effective dates and future versioning.

### Initial Alert Requirements

The following are documented as manual-review triggers, not automatic decisions:

- Payroll percentage above 8.0% of monthly P&L revenue
- Laboratory expense percentage above 10.8% of monthly P&L revenue
- Monthly overtime cost above $500
- Total backlog of at least 20 cases

### Acceptance Criteria

- Given an alert generated from any of the four triggers above, when a manager views the alert, then it shows the rule version and the underlying values used to evaluate it (numerator, denominator, threshold, and reporting period).
- Given any alert, when it is displayed, then the system does not automatically perform employment, transfer, or budget actions — the alert only flags the location for manager review.
- Given a backlog alert, when a manager views it, then the alert displays office-volume context so a high-volume location is not presented identically to a low-volume location.
- Given a finalized monthly payroll percentage or laboratory expense percentage, when it is calculated, then it uses monthly P&L revenue as the denominator, not daily Power BI revenue.
- Given a location or organization with missing or unconfigured account mappings, when a threshold metric would otherwise be calculated, then the system shows an unavailable or configuration-required state instead of a misleading numeric value.

## 18. Architecture Transition: Office Authorization, Import Framework, and New Business Rules

This section records MVP-relevant implications of the architecture-transition work in [ADR-004](../decisions/ADR-004-office-based-authorization.md), [`docs/imports/`](../imports/01-import-framework.md), and [`docs/scenario-engine/`](../scenario-engine/README.md). It supplements, and does not replace, the requirements above.

### Requirements

- Role and permission design (Section 12) must be implemented against the Office-Based Authorization hierarchy, not a region-based hierarchy.
- The MVP's import design (Section 10) must isolate all source-file-layout knowledge inside Import Profiles; no business-rule, scenario, or dashboard code may parse source-file structure directly.
- Labor Model data (Recommended Staffing, Current Staffing, Staffing Adherence %, Labor % of Revenue) should be treated as proposed metrics pending formula confirmation (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)), not displayed as finalized figures.
- New business rules BR-002 through BR-006 (hiring recommendation, understaffing detection, overtime escalation, LSS recommendation, staffing adherence) are structure-only at this stage; the MVP must not implement assumed formulas or thresholds for them.

### Explicitly Not Required for MVP (Architecture Phase)

- Temporary office assignments and future franchise grouping (named in ADR-004, not yet designed).
- Any Hiring, Understaffing, Overtime Escalation, LSS, or Staffing Adherence formula or numeric threshold, since none has been approved (see [`docs/development/open-questions.md`](../development/open-questions.md), OQ-059 and OQ-062–OQ-065).
- Import profiles for any source type other than the Labor Model's documented schema.
