# Scenario Engine

**Version:** 0.1
**Status:** Discovery
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

The Scenario Engine exists to help a Lab Operations Manager answer decision-support questions using canonical, normalized data and approved business rules — not to make decisions automatically. It is a central product feature described conceptually in [`docs/product/01-product-vision.md`](../product/01-product-vision.md) (Scenario Engine section) and [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md) (Section 9).

## Questions the Scenario Engine Should Answer

- Should I hire? (see [`01-hiring.md`](01-hiring.md))
- Should I transfer a technician between offices?
- Should I request LSS support? (see [`03-lss-support.md`](03-lss-support.md))
- Will hiring reduce overtime? (see [`02-overtime-vs-hiring.md`](02-overtime-vs-hiring.md))
- When will hiring break even? (see [`02-overtime-vs-hiring.md`](02-overtime-vs-hiring.md))
- Will backlog improve?

## Explicit Non-Goal at This Stage

**Do not create formulas yet.** This document set defines what the Scenario Engine must be able to reason about — its inputs, outputs, and the business rules it draws on — not the arithmetic itself. Formulas require approved business definitions, which for several of these questions do not yet exist (see Open Questions).

## Relationship to Business Rules

The Scenario Engine consumes, rather than duplicates, the review triggers and detection logic defined in [`docs/business/rules/`](../business/rules/):

- [BR-001](../business/rules/BR-001-prioritize-location-review.md) — Prioritize Location Review
- [BR-002](../business/rules/BR-002-hiring-recommendation.md) — Hiring Recommendation
- [BR-003](../business/rules/BR-003-understaffing-detection.md) — Understaffing Detection
- [BR-004](../business/rules/BR-004-overtime-escalation.md) — Overtime Escalation
- [BR-005](../business/rules/BR-005-lss-recommendation.md) — LSS Recommendation
- [BR-006](../business/rules/BR-006-staffing-adherence.md) — Staffing Adherence

A scenario answers "what if," using a business rule's detection logic as its starting baseline; a business rule answers "does this location need review right now."

## Relationship to Canonical Data

Per [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md), the Scenario Engine reads only the Canonical LabPulse Data Model. It never reads raw import rows or source-file structure directly.

## Safety

Consistent with [BR-001](../business/rules/BR-001-prioritize-location-review.md) and [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md):

- The Scenario Engine must not automatically execute hiring, transfer, discipline, or budget decisions.
- Scenario output is a recommendation for manager review, always showing its assumptions and data sources.
- AI may explain scenario output in plain language but must never generate the underlying calculation (see [`docs/decisions/ADR-003-ai-provider-strategy.md`](../decisions/ADR-003-ai-provider-strategy.md)).

## Documents in This Set

- [`01-hiring.md`](01-hiring.md) — Should I hire?
- [`02-overtime-vs-hiring.md`](02-overtime-vs-hiring.md) — Will hiring reduce overtime, and when does it break even?
- [`03-lss-support.md`](03-lss-support.md) — Should I request LSS support?

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
