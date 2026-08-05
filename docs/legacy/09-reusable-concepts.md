# Reusable Concepts

**Version:** 0.1
**Status:** Discovery — concepts only, no code reused
**Last Updated:** 2026-08-04

## Purpose

Concepts from the legacy application worth carrying forward into LabPulse's design — **as ideas to be redesigned within the current architecture, never as code or implementation to copy.** Each item notes what would need to change before it could be adopted.

## 1. The production-stage and backlog taxonomy

Legacy's lab-side (5 stages) / clinic-side (4 stages) backlog split, plus its eleven-category unit-tier/case-type breakdown, is the richest real business knowledge found in this extraction. It should directly inform the founder-validation pass on `BacklogSnapshot` and `ProductionSnapshot` fields — not as a schema to copy, but as a starting checklist of real categories to confirm, rename, or reject. See [07-legacy-terminology.md](07-legacy-terminology.md) and [04-formula-candidates.md](04-formula-candidates.md).

## 2. Weekly-source, monthly-rollup pattern

The idea that a snapshot can be sourced from finer-grained (weekly) data and rolled up to a coarser grain (monthly) via averaging is a genuinely useful pattern for `docs/data-model/snapshot-strategy.md` to formalize — with a calendar-aligned rollup, not legacy's fixed week-number bands, and as an immutable derived snapshot rather than an upsert-in-place record.

## 3. Data completeness as a first-class, formula-backed metric

Legacy proves out a simple, concrete formula for "how much of the expected data actually arrived." The current PRD only requires a "data-quality indicator" in the abstract — this is a good starting point for making that concrete, once redefined against LabPulse's canonical snapshot model rather than raw table row counts.

## 4. Submission compliance as a distinct report, not just a freshness badge

Treating on-time data submission as its own trend-worthy report (streaks, compliance rate) rather than only a per-metric freshness indicator is a reasonable product idea. Worth considering as a future Dashboard/Notifications-domain feature (see [`docs/architecture/domain-boundaries.md`](../architecture/domain-boundaries.md)), redesigned around immutable Alert/Recommendation history rather than a live-queried streak calculation.

## 5. Previous-period comparison with copy-forward during entry

A validated, real UX pattern: showing the prior period's value next to the field being entered, with an explicit action to copy it forward. Relevant to any future manual-entry surface built on top of the canonical import pipeline — though in the current architecture, manual entry would need to produce a new immutable snapshot rather than overwrite a mutable row.

## 6. Referential validation before accepting dependent records

Legacy's rule — a staff or contact record cannot be imported for an office that doesn't exist yet — is exactly the "Unresolved Reference" behavior already designed in [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md). This is confirmation the design is sound, not a new idea, but worth noting as validated by real prior behavior.

## 7. Template-driven office onboarding

Generating a downloadable, pre-structured template (with an instructions sheet) for a user to fill out and re-upload is a good onboarding pattern for the Import Profile concept — it reduces the column-mapping burden for a first-time or infrequent importer. Would need to be redesigned around a versioned Import Profile rather than a fixed, code-defined template.

## 8. Explicit acknowledgment that thresholds need to be configurable

Not a technique to reuse, but a validation worth stating plainly: the founder had already reached the "thresholds should not be hardcoded" conclusion independently (`Settings.tsx`'s "Coming in Phase 3..." placeholder), before this architecture's ADR-000 codified the same principle. This strengthens confidence that the current direction matches real operational need, not just an abstract design preference.

## What Is Explicitly Not Reusable

- Any Rust, TypeScript, or SQL from the legacy codebase — none was copied into this repository.
- The upsert-with-no-history persistence model.
- The office hard-delete/cascade pattern.
- The fixed, non-calendar week-to-month banding (the concept of rollup is reusable; the specific banding is not).
- Any specific numeric threshold, pending founder validation (see [03-business-rule-comparison.md](03-business-rule-comparison.md)).

## Related Documents

- [Gap Analysis](08-gap-analysis.md)
- [Formula Candidates](04-formula-candidates.md)
- [Legacy Terminology](07-legacy-terminology.md)
