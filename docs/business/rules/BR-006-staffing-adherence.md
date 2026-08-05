# BR-006: Staffing Adherence

**Version:** 0.1
**Status:** Proposed
**Owner:** Lab Operations
**Effective Date:** Not yet approved
**Last Updated:** 2026-08-04

## Purpose

Define how the Labor Model workbook's Staffing Adherence % field is used as a review signal, and record what remains unresolved about its calculation.

## Rule Type

Metric-driven review rule. No formula is defined yet — Staffing Adherence % is currently a source-provided value (see [`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md)), and it is not yet confirmed whether LabPulse will consume it as-is or recompute it.

## Important Limitation

The following are unresolved:

- The exact formula behind Staffing Adherence % as produced in the Labor Model workbook (for example, whether it is `current_staffing / recommended_staffing * 100`, a weighted variant, or something else).
- Whether LabPulse should treat the workbook's value as authoritative or recompute it from Recommended Staffing and Current Staffing once those are normalized.
- Any numeric review threshold for Staffing Adherence %. None has been approved.

This rule must not be implemented with an assumed formula or threshold.

## Required Inputs

Potential inputs:

- Office identity and reporting period
- Recommended Staffing (from Labor Model import)
- Current Staffing (from Labor Model import)
- Staffing Adherence % (from Labor Model import)
- Staffing Difference (see [`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md))

## Proposed Outcome Categories

- Within adherence target
- Below adherence target
- Above adherence target
- Insufficient data

Do not define scoring weights or thresholds yet.

## Proposed Processing Logic

```text
Load Staffing Adherence % (or compute it once its formula is confirmed) for the office and period
  -> Validate data freshness and completeness
  -> Compare against an approved threshold (not yet defined)
  -> Flag offices outside the target for review
  -> Display underlying Recommended Staffing and Current Staffing values
  -> Require manager review
```

## Explainability Requirements

The output must show:

- Staffing Adherence % value used and its source (workbook-provided or LabPulse-computed)
- Underlying Recommended Staffing and Current Staffing values
- Reporting period and data freshness
- Rule version
- That no adherence threshold is yet approved, where applicable

## Safety and Business Controls

- Do not automatically take a staffing, hiring, or transfer action based on adherence status.
- Do not present an unapproved threshold as if it were confirmed.
- Feed adherence status into [BR-003 Understaffing Detection](BR-003-understaffing-detection.md), [BR-002 Hiring Recommendation](BR-002-hiring-recommendation.md), and [BR-005 LSS Recommendation](BR-005-lss-recommendation.md) as a contributing signal.

## Dependencies

- Labor Model import ([`docs/imports/02-labor-model-import.md`](../../imports/02-labor-model-import.md))
- Confirmed Staffing Adherence % formula (unresolved)
- Confirmed adherence review threshold (unresolved)

## Open Questions

Link to:

[../../development/open-questions.md](../../development/open-questions.md)
