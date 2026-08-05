# BR-003: Understaffing Detection

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Detect when an office's current staffing is meaningfully below its recommended staffing, using Labor Model data, for manager review.

## Rule Type

Deterministic detection rule. No formula or numeric threshold is defined yet.

## Important Limitation

The Labor Model workbook provides Recommended Staffing and Current Staffing per office (see [`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md)), but:

- The exact unit of measure (headcount, full-time equivalent, or role-broken-out) is unresolved.
- Whether "meaningful" understaffing is a fixed gap, a percentage gap, or the workbook-provided Staffing Adherence % is unresolved (see [BR-006](BR-006-staffing-adherence.md)).
- No numeric threshold has been approved.

## Required Inputs

Potential inputs:

- Office identity and reporting period
- Recommended Staffing (from Labor Model import)
- Current Staffing (from Labor Model import)
- Staffing Difference (current minus recommended; see [`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md))
- Staffing Adherence % (from Labor Model import, if used as the detection basis instead of raw difference)
- Known open positions
- Data freshness for the Labor Model import

## Proposed Outcome Categories

- Understaffed
- At or near model
- Overstaffed
- Insufficient data

Do not define scoring weights yet.

## Proposed Processing Logic

```text
Load Recommended Staffing and Current Staffing for the office and period
  -> Validate data freshness and completeness
  -> Compute Staffing Difference
  -> Compare against Staffing Adherence % (once its formula is confirmed) or an approved threshold
  -> Flag understaffed offices for review
  -> Display reasons and underlying values
  -> Require manager review
```

## Explainability Requirements

The detection output must show:

- Recommended Staffing and Current Staffing values used
- Staffing Difference
- Staffing Adherence %, if available
- Reporting period and data freshness
- Rule version
- That this is a detection signal, not a staffing decision

## Safety and Business Controls

- Do not automatically open a position, approve a hire, or transfer staff.
- Do not treat a single period's understaffing as proof of a structural problem; consider trend where available.
- Allow the manager to override or dismiss the flag with a reason.
- Feed this signal into [BR-002 Hiring Recommendation](BR-002-hiring-recommendation.md) and [BR-005 LSS Recommendation](BR-005-lss-recommendation.md) rather than acting independently.

## Dependencies

- Labor Model import ([`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md))
- Approved Staffing Adherence formula ([BR-006](BR-006-staffing-adherence.md))
- Approved unit of measure for staffing counts

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
