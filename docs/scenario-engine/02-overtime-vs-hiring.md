# Scenario: Overtime Versus Hiring

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations
**Last Updated:** 2026-08-04

## Purpose

Describe the shape of a scenario that compares continuing to pay overtime against hiring, including when a hire might break even. No formulas are defined here.

## Questions

> Will hiring reduce overtime enough to matter?
> When will hiring break even against current overtime cost?

## Related Business Rules

- [BR-004 Overtime Escalation](../business/rules/BR-004-overtime-escalation.md)
- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md)

## Related Discovery Documents

- [`docs/business/04-overtime.md`](../business/04-overtime.md) — current overtime review triggers and decision context
- [`docs/product/01-product-vision.md`](../product/01-product-vision.md) — Scenario Engine, break-even and ROI outputs listed as potential outputs

## Conceptual Inputs

- Current monthly overtime cost and recurrence pattern (see [`docs/business/04-overtime.md`](../business/04-overtime.md))
- Proposed hire assumptions: role, wage, employer burden percentage, training/ramp-up period
- Expected overtime reduction if the hire is made (a manager-entered assumption, not a system-calculated certainty)
- Office revenue capacity and current backlog, for context on whether reduced overtime is realistic given demand

## Conceptual Outputs

- Change in overtime payroll (expected reduction)
- Added regular payroll from the hire
- Net payroll change
- Estimated break-even period (the point at which cumulative added regular payroll cost is offset by cumulative overtime savings)
- Confidence classification or explicit warning when assumptions are weak (for example, no historical overtime trend available)
- Assumptions used, shown explicitly to the manager

## Workflow Shape

```text
Overtime escalation trigger observed (BR-004)
  -> Manager opens the overtime-vs-hiring scenario
  -> Scenario loads current overtime cost, recurrence, and revenue/backlog context
  -> Manager enters hire assumptions and an expected overtime-reduction assumption
  -> Scenario produces projected payroll change and break-even estimate
  -> Manager reviews before deciding whether to proceed
```

## Important Limitation

Whether overtime is "acceptable" is case-by-case per [`docs/business/04-overtime.md`](../business/04-overtime.md); this scenario supports that judgment with numbers, it does not replace it. The scenario must never be presented as a guaranteed result, per [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 9 (Calculation Rules).

## What Is Not Yet Defined

- The break-even formula itself.
- How to estimate expected overtime reduction from a hire (this is currently a manager-entered assumption, not a derived value).
- Employer burden percentage source and defaults.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
