# Entity: RecruitingSnapshot

**Version:** 0.1
**Status:** Proposed — purpose and relationships only; fields intentionally not yet defined (Sprint 1.5 scope)
**Last Updated:** 2026-08-04

## Purpose

Represents a point-in-time capture of recruiting and open-position status for one office — open positions, priority, and pipeline status.

## Description

Supports the Open Positions metric and recruiting-related workflows described in [`docs/product/01-product-vision.md`](../product/01-product-vision.md) (Recruiting and Staffing module) and the Open Positions Report source (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)). RecruitingSnapshot is where that data would live once formally analyzed, and is the natural complement to [LaborModelSnapshot](labor-model-snapshot.md)'s Recommended Staffing vs. Current Staffing gap: an open position is often the recruiting-side response to that gap.

**This document defines purpose and relationships only. Fields are intentionally not yet defined**, per Sprint 1.5 scope — see [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## Owner

Operations Manager / Recruiting (see the expanded [SecurityRole](security-role.md) candidate list, which names a "Recruiter" role, not yet reconciled with the PRD's initial three roles).

## Relationships

- Belongs to one [Office](office.md).
- Would be produced by an [ImportJob](import-job.md) using a future Open Positions Report [ImportProfile](import-profile.md).
- Conceptually related to [LaborModelSnapshot](labor-model-snapshot.md) (Understaffing Detection may prompt a recruiting response captured here) and [JobRole](job-role.md) (the role being recruited for).
- Feeds the Open Positions metric already named in [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) Section 6 and the Open Positions KPI in [`docs/business/00-executive-workflow.md`](../business/00-executive-workflow.md) First Five KPIs.

## Source Systems

Open Positions Report (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md)) — marked optional for the earliest prototype there.

## Related Business Rules

- [BR-002 Hiring Recommendation](../business/rules/BR-002-hiring-recommendation.md) (a Hiring Recommendation may reference known open positions)
- [BR-003 Understaffing Detection](../business/rules/BR-003-understaffing-detection.md) (indirectly, as an existing open position may already address detected understaffing)

## Related Scenarios

- [Hiring](../scenario-engine/01-hiring.md) (known open positions are a named input there)

## Related Metrics

Open Positions (see [`docs/data/01-metrics-dictionary.md`](../data/01-metrics-dictionary.md) — currently Proposed, formula and fields to be confirmed).

## Open Questions

- Whether the Open Positions Report should be promoted from "optional for the earliest prototype" to required, given its relationship to Hiring Recommendation and Understaffing Detection.
- Reconciliation of the "Recruiter" SecurityRole candidate with the PRD's initial three roles (see [`docs/entities/security-role.md`](security-role.md)).
