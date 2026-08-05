# Legacy Knowledge Extraction

**Version:** 0.1
**Status:** Discovery — extracted business knowledge, not approved architecture
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

This folder captures institutional business knowledge found in the archived legacy Tauri desktop application (`Magnivoxs/LabPulse` on GitHub, inspected read-only in a sibling folder per the Repository Comparison Audit) before development of the new architecture-first platform continues.

**The legacy application is not the implementation target.** Nothing in this folder is copied code, and nothing here is automatically adopted into LabPulse's approved architecture. Every business rule, formula, and workflow described here is a **candidate for founder validation**, compared explicitly against what is already documented, and classified accordingly.

## Source

The legacy application: Tauri 2 (Rust backend, `rusqlite`/SQLite) + React 19 + TypeScript + Vite frontend. 15 commits, 2025-12-23 to 2026-01-07, single author. See the Repository Comparison Audit (this conversation) for the full technology and maturity assessment. File and line references throughout `docs/legacy/` point to paths within that repository (for example, `src-tauri/src/commands.rs:927`), not to anything present in this repository.

## How to Read This Folder

| Document | Contents |
|---|---|
| [01-legacy-overview.md](01-legacy-overview.md) | What the legacy app is, its architecture, scope, and maturity |
| [02-feature-inventory.md](02-feature-inventory.md) | Every legacy feature, classified against current architecture |
| [03-business-rule-comparison.md](03-business-rule-comparison.md) | Every legacy calculation/decision, classified: Already Documented / Needs Validation / Missing from Architecture / Legacy Only / Reject |
| [04-formula-candidates.md](04-formula-candidates.md) | Every formula found, with purpose, inputs, outputs, source location, and validation status |
| [05-import-workflow-analysis.md](05-import-workflow-analysis.md) | Legacy import behavior compared against the new Import Framework |
| [06-ui-workflow-analysis.md](06-ui-workflow-analysis.md) | Legacy user workflows and screens |
| [07-legacy-terminology.md](07-legacy-terminology.md) | Every business term found, with meaning (if known) and validation status |
| [08-gap-analysis.md](08-gap-analysis.md) | Legacy vs. current architecture: missing concepts, prioritized |
| [09-reusable-concepts.md](09-reusable-concepts.md) | Concepts (not code) worth carrying forward |

## Governing Rule

**Do not automatically adopt legacy behavior.** A legacy formula, threshold, or workflow existing in working code is evidence that a real business need exists — it is not, by itself, an approved definition. Where a legacy value conflicts with an already-approved LabPulse threshold (for example, alert percentages), both are recorded side by side and flagged for founder validation, per [`CLAUDE.md`](../../CLAUDE.md) ("do not invent business rules") and [ADR-000](../decisions/ADR-000-architectural-philosophy.md) ("business first").

## Related Documents

- [Open Questions](../development/open-questions.md)
- [Metrics Dictionary](../data/01-metrics-dictionary.md)
- [Business Rules](../business/rules/)
- [Entity Catalog](../entities/README.md)
- [Import Framework](../imports/01-import-framework.md)
