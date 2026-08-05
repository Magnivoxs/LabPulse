# Import Framework

**Version:** 0.1
**Status:** Discovery / Architecture
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Define the architecture that turns untrusted, inconsistently formatted source files (spreadsheets, exports, and future API feeds) into the Canonical LabPulse Data Model that all business rules, the scenario engine, and dashboards depend on.

This document is architecture, not application code. No application logic may depend directly on a source file's layout (for example, an Excel sheet name, column order, or cell formatting). All layout-specific knowledge is isolated inside an Import Profile (see [`03-import-profiles.md`](03-import-profiles.md)).

## Pipeline

```text
Import
  -> Import Profile
  -> Validation
  -> Normalization
  -> Canonical LabPulse Data Model
  -> Business Rules
  -> Scenario Engine
  -> Dashboard
```

### Import

The raw uploaded file and its metadata (uploader, organization, timestamp, source type, file hash). Treated as untrusted input per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md). The file itself is never treated as a data source for anything downstream of Normalization.

### Import Profile

A versioned, declarative description of one source-file type: which sheets/sections are expected, which columns are required or optional, which column-name aliases are recognized, and which validation and normalization rules apply. See [`03-import-profiles.md`](03-import-profiles.md).

### Validation

Structural, type, and business validation applied against the Import Profile's rules before any data is normalized or accepted. See [`05-import-validation.md`](05-import-validation.md). Invalid records are never silently discarded, per [`CLAUDE.md`](../../CLAUDE.md) and [`docs/product/02-mvp-prd.md`](../product/02-mvp-prd.md).

### Normalization

Transformation of validated, profile-mapped rows into the Canonical LabPulse Data Model's shape (organization, office, reporting period, and typed metric or record values). See [`04-data-normalization.md`](04-data-normalization.md).

### Canonical LabPulse Data Model

The single internal representation that every downstream layer reads. Business Rules, the Scenario Engine, and Dashboards must never read raw import rows or source-file structures directly — only the canonical model. This is what makes the system source-file-agnostic: a new source format only requires a new Import Profile, not changes to business rules, the scenario engine, or dashboards.

### Business Rules

Approved business rules (see [`docs/business/rules/`](../business/rules/)) evaluate canonical data to produce review triggers, flags, and recommendations. Business rules never parse or depend on source-file structure.

### Scenario Engine

Uses canonical data as its baseline for modeling questions such as hiring, overtime-versus-hiring, and LSS support (see [`docs/scenario-engine/`](../scenario-engine/README.md)).

### Dashboard

Presents canonical, rule-evaluated, and scenario data to the user, per [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md).

## Design Principles

- No application logic may depend directly on source-file layouts. Layout knowledge lives only in Import Profiles.
- Every import is tied to a specific, versioned Import Profile version, so historical imports remain interpretable even after a profile changes.
- Validation happens before normalization; normalization never has to guess at invalid data.
- Invalid or unmapped records are preserved and surfaced, never silently dropped.
- Import history is retained separately from normalized data (see [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md) and [`CLAUDE.md`](../../CLAUDE.md) Data Rules).
- Account and column mappings are organization-configurable, not hard-coded, per [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md).

## Relationship to Existing Architecture

This framework elaborates, and does not replace, the Import Flow described in [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md). That document's high-level system diagram remains authoritative for how the import pipeline fits alongside authentication, the database, and the AI layer.

## Out of Scope for This Document

- Concrete database schema for import tables (see Data Architecture Direction in [`docs/architecture/01-system-architecture.md`](../architecture/01-system-architecture.md); not yet approved).
- Specific validation or normalization code.
- UI design for the import wizard.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
