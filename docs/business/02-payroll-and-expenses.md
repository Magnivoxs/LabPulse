# Payroll and Laboratory Expense Business Rules

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Document the current payroll and laboratory-expense thresholds, known P&L account mappings, review behavior, and configuration requirements. This document is derived from the founder's second business-discovery interview and supplements [`docs/business/00-executive-workflow.md`](00-executive-workflow.md) and [`docs/business/rules/BR-001-prioritize-location-review.md`](rules/BR-001-prioritize-location-review.md).

## Payroll Review Rule

### Initial threshold

Payroll above 8.0% of monthly P&L revenue triggers location review.

### Known payroll line items

- SALARIES
- OVERTIME PAY - SUPPORT STAFF
- BONUS
- PAYROLL TAX EXPENSE
- 401K EXPENSE
- HEALTH, LIFE, DENTAL, WC, SHORT TERM

Additional payroll-related lines may exist. This list is not yet confirmed to be exhaustive.

### Formula

```text
payroll_percentage =
    qualifying_payroll_expense
    / monthly_p_and_l_revenue
    * 100
```

### Current limitations

- The account list may not be exhaustive.
- P&L names may differ.
- Special adjustments may require exclusion.
- The threshold may change.
- Future customers may use different thresholds.

## Laboratory Expense Review Rule

### Initial threshold

Qualifying laboratory expense above 10.8% of monthly P&L revenue triggers location review.

### Known expense lines

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

Additional line items may appear, and some P&L formats may omit or classify items differently.

### Formula

```text
laboratory_expense_percentage =
    qualifying_laboratory_expense
    / monthly_p_and_l_revenue
    * 100
```

### Terminology warning

The current phrase `total laboratory expense` may be ambiguous.

The known line-item list above appears operational rather than clearly payroll-inclusive. Payroll must not be assumed to be included in this measure.

The current product metric name is not renamed automatically by this document. Business confirmation is required before selecting the final user-facing label (candidates include `Laboratory Expense Percentage` and `Operational Laboratory Expense Percentage`).

## Configuration Requirements

The future system should support:

- Organization-specific account mappings
- Versioned account mappings
- Configurable thresholds
- Effective dates
- Approved exclusions
- Manual adjustments with audit history
- Different targets by location or operating model if later approved

## Review Behavior

Crossing a threshold should:

- Flag the location for review
- Show included line items
- Show numerator and denominator
- Show source period
- Show variance from target
- Avoid automatic employment or budget actions

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
