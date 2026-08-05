# LabPulse Source Data Inventory

**Version:** 0.1  
**Status:** Discovery

## Purpose

This document catalogs the files, reports, and systems that may provide data to LabPulse.

Do not place confidential source files in the repository.

Use sanitized samples or synthetic examples only.

## Source Template

### Source Name

**Purpose:**  

**Owner:**  

**Format:**  

**Frequency:**  

**Delivery method:**  

**One row represents:**  

**Important fields:**  

- Field

**Known formatting issues:**  

- Issue

**Sensitive information:**  

- Data classification

**Required for MVP:**  
Yes or no.

**Sanitized sample available:**  
Yes or no.

**Import priority:**  
High, medium, or low.

**Notes:**  

---

## Initial Source Candidates

### Labor Model

**Purpose:**  
Defines expected staffing or labor targets based on operational factors.

**Format:**  
Likely Excel or CSV.

**Frequency:**  
To be confirmed.

**Important fields:**  

- Location identifier
- Revenue range
- Expected staffing
- Role (JobRole — see [`docs/entities/job-role.md`](../entities/job-role.md); not an authorization role)
- Target labor percentage
- Effective period

**Known formatting issues:**  

- Merged cells
- Multiple header rows
- Formula cells
- Office-specific sections
- Inconsistent naming

**Required for MVP:**  
Yes.

**Import priority:**  
High.

---

### Profit and Loss Statement

**Purpose:**  
Provides revenue, labor expense, and other financial results.

**Format:**  
Excel, CSV, or PDF.

**Frequency:**  
Likely monthly.

**Important fields:**  

- Location identifier
- Reporting period
- Total office revenue
- All payroll-related account lines (for example: SALARIES, OVERTIME PAY - SUPPORT STAFF, BONUS, PAYROLL TAX EXPENSE, 401K EXPENSE, HEALTH, LIFE, DENTAL, WC, SHORT TERM)
- All qualifying laboratory-expense account lines (for example: OPERATIONAL EXPENSE, SMALL EQUIPMENT PURCHASES, LABORATORY SUPPLIES, TEETH SUPPLIES, OTHER LABORATORY SUPPLIES, OFFICE SUPPLIES, TRAVEL/LODGING/MEALS, DUES & SUBSCRIPTIONS, LSS SERVICES, LICENSES, PROPERTY, USE, & OTHER TAX, OTHER EXPENSES)
- Monthly overtime expense
- Account labels
- Account identifiers, if available
- Actual versus budget fields, if available

**Known formatting issues:**  

- Hierarchical rows
- Subtotals
- Month and year-to-date columns
- Negative values represented with parentheses
- Variable account naming
- Different account names across P&L formats
- Account lines added or omitted between formats or periods
- Subtotals mistaken for detail lines
- Payroll and operational expense sections using different hierarchies
- Adjustments made after preliminary reporting
- Multiple revenue labels (for example, gross versus net versus adjusted revenue)

**Notes:**  
The known payroll and laboratory-expense line items above are drawn from the founder's second business-discovery interview and are not confirmed to be exhaustive; additional lines may exist and P&L formats may omit or classify items differently. Configurable, organization-specific account mapping is likely required (see [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md)).

**Required for MVP:**  
Yes.

**Import priority:**  
High.

---

### Career Grid

**Purpose:**  
Tracks employee level, role, skills, progression, or compensation structure.

**Format:**  
Likely Excel.

**Frequency:**  
To be confirmed.

**Important fields:**  

- Employee identifier
- Role (JobRole — see [`docs/entities/job-role.md`](../entities/job-role.md); not an authorization role)
- Level
- Skill category
- Effective date
- Location

**Known formatting issues:**  

- Color-coded meaning
- Multiple worksheets
- Free-text notes
- Inconsistent role names

**Required for MVP:**  
To be confirmed.

**Import priority:**  
Medium.

---

### Overtime Report

**Purpose:**  
Tracks overtime hours and costs.

**Format:**  
Excel or CSV.

**Frequency:**  
Weekly or pay-period based.

**Important fields:**  

- Employee identifier
- Location identifier
- Department
- Regular hours
- Overtime hours
- Overtime cost
- Reporting period
- Overtime reason

**Required for MVP:**  
Yes.

**Import priority:**  
High.

---

### Revenue Report

**Purpose:**  
Provides revenue by location and reporting period.

**Format:**  
Excel or CSV.

**Frequency:**  
Daily, weekly, or monthly.

**Important fields:**  

- Location identifier
- Date or period
- Gross revenue
- Net revenue
- Adjustments

**Required for MVP:**  
Yes.

**Import priority:**  
High.

---

### Employee Roster

**Purpose:**  
Provides active employee assignments and roles.

**Format:**  
Excel or CSV.

**Frequency:**  
To be confirmed.

**Important fields:**  

- Employee identifier
- Location identifier
- Role (JobRole — see [`docs/entities/job-role.md`](../entities/job-role.md); not an authorization role)
- Employment status
- Start date
- End date
- Pay type
- Standard hours

**Sensitive information:**  
May contain personal and compensation data.

**Required for MVP:**  
Yes, using synthetic data during prototype development.

**Import priority:**  
High.

---

### Open Positions Report

**Purpose:**  
Tracks recruiting needs and position status.

**Format:**  
Excel or CSV.

**Important fields:**  

- Position identifier
- Location identifier
- Role (JobRole — see [`docs/entities/job-role.md`](../entities/job-role.md); not an authorization role)
- Open date
- Status
- Priority
- Expected start date

**Required for MVP:**  
Optional for the earliest prototype.

**Import priority:**  
Medium.

---

### Production Report

**Purpose:**  
Tracks production volume, units, cases, or departmental output.

**Format:**  
To be confirmed.

**Important fields:**  

- Location identifier
- Department
- Date
- Units
- Cases
- Product category

**Required for MVP:**  
To be confirmed.

**Import priority:**  
Medium.

---

### Training Report

**Purpose:**  
Tracks employee training and competency.

**Format:**  
To be confirmed.

**Required for MVP:**  
No.

**Import priority:**  
Low.

---

### Equipment Record

**Purpose:**  
Tracks equipment availability, age, maintenance, and risk.

**Format:**  
To be confirmed.

**Required for MVP:**  
No.

**Import priority:**  
Low.

## Import Strategy Notes

The first production-quality importer should prioritize structured CSV and XLSX files.

PDF ingestion should be deferred until structured imports are stable because PDF tables are less reliable and frequently require document-specific extraction logic.
