# Entity: PayrollSnapshot

**Version:** 0.1
**Status:** Proposed (known line items confirmed; canonical fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of payroll and laboratory-expense line items for one office and reporting period, from the monthly P&L.

## Description

Captures the known payroll-related lines (SALARIES, OVERTIME PAY - SUPPORT STAFF, BONUS, PAYROLL TAX EXPENSE, 401K EXPENSE, HEALTH/LIFE/DENTAL/WC/SHORT TERM) and known laboratory-expense lines documented in [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md), mapped through an organization-configurable account mapping. Monthly Overtime Cost is one of the payroll lines captured here, not a separate snapshot type.

## Owner

Lab Operations (business meaning); Engineering (normalization and account-mapping behavior).

## Relationships

- Belongs to one [Office](office.md).
- Produced by one [ImportJob](import-job.md), using the P&L [ImportProfile](import-profile.md).
- Feeds Payroll Percentage, Laboratory Expense Percentage, and Monthly Overtime Cost metrics.
- Feeds [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md) and [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md).

## Proposed Fields (High Level)

- Office reference
- Reporting period
- Line items (account label and amount, per the organization's account mapping)
- Qualifying payroll expense (aggregated from known payroll lines)
- Qualifying laboratory expense (aggregated from known laboratory-expense lines)
- Monthly overtime cost (one specific payroll line)
- Account-mapping version used
- Import job and profile version reference

## Update Cadence

Monthly, matching the P&L's cadence.

## Source Systems

Monthly P&L (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md) and [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md)).

## Validation Considerations

- Account mapping is organization-configurable; an unmapped line must be flagged, not silently excluded or included.
- Whether the known payroll and laboratory-expense line lists are exhaustive is unresolved (see [`docs/development/open-questions.md`](../development/open-questions.md), Payroll and Laboratory Expense section).
- Whether payroll is excluded from the laboratory-expense measure is unresolved (OQ-044).
- Hierarchical rows, subtotals, and parenthetical negatives must be handled correctly during normalization (see [`docs/imports/04-data-normalization.md`](../imports/04-data-normalization.md)).

## Future Database Implications

Expected to require a flexible line-item representation (rather than fixed columns per account) to accommodate organization-specific and evolving P&L formats. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

- [BR-001 Prioritize Location Review](../business/rules/BR-001-prioritize-location-review.md)
- [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)

## Related Scenarios

- [Overtime vs. Hiring](../scenario-engine/02-overtime-vs-hiring.md)
- [Hiring](../scenario-engine/01-hiring.md)

## Related Metrics

Payroll Expense, Payroll Percentage, Qualifying Laboratory Expense, Total Laboratory Expense Percentage, Monthly Overtime Cost (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md)).
