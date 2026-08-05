# Import Profiles

**Version:** 0.1
**Status:** Discovery / Architecture
**Owner:** Lab Operations / Engineering
**Last Updated:** 2026-08-04

## Purpose

Define what an Import Profile is, what it must contain, and which source-report types are expected to eventually have one. An Import Profile is the only place that is allowed to know about a specific source file's layout, per the Import Framework's design principle that no application logic may depend directly on source-file layouts (see [`01-import-framework.md`](01-import-framework.md)).

## What an Import Profile Contains

Every Import Profile must define:

- **Expected sheets** — the worksheet(s) or file section(s) the profile expects to find.
- **Required columns** — columns that must be present and mappable for an import to be accepted.
- **Optional columns** — columns that may be present and, if mapped, are imported; their absence does not block the import.
- **Aliases** — recognized alternate names for each column (for example, different P&L formats naming the same account line differently), so mapping does not require an exact column-name match.
- **Version** — the profile's own version number. Imports are tied to the profile version active at import time, so a later profile change does not reinterpret historical imports.
- **Validation rules** — the structural, type, and business validation rules that apply to this source type (see [`05-import-validation.md`](05-import-validation.md)).
- **Normalization rules** — how validated rows map into the Canonical LabPulse Data Model (see [`04-data-normalization.md`](04-data-normalization.md)).

## Profile Lifecycle

```text
Draft profile
  -> Reviewed against sample/sanitized source files
  -> Versioned and approved
  -> Used for imports
  -> Revised as source formats change
  -> New version created (old version retained for historical imports)
```

Profiles are versioned, not silently edited in place, consistent with the Development Constitution principle that imports are versioned (see [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md)).

## Expected Profile Types

Every report type is intended to eventually have its own profile. Known and anticipated profile types:

| Profile | Status | Notes |
|---|---|---|
| Labor Model | Schema documented | See [`02-labor-model-import.md`](02-labor-model-import.md) |
| Career Grid | Not yet documented | Source described in [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md); column-level profile not yet defined |
| P&L | Partially documented | Known payroll and laboratory-expense line items exist in [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md); full profile (all sheets, all aliases) not yet defined |
| Payroll | Not yet documented | May overlap with P&L payroll line items; relationship between a standalone payroll report and P&L payroll lines is unresolved |
| Power BI | Not yet documented | Daily revenue export structure not yet analyzed |
| CSV (generic) | Not yet documented | A minimal, generic CSV profile may be useful as a fallback for simple imports |
| Future API | Not yet documented | Placeholder for any future direct system-to-system integration; no API source has been analyzed |

Only the Labor Model profile has a documented schema at this stage. All others remain open questions until their source files or exports are analyzed the same way the Labor Model workbook was.

## Profile Independence

A profile change (for example, adding a new alias or a new optional column) must not require changes to validation logic outside that profile's own rules, normalization logic outside that profile's own mapping, business rules, the scenario engine, or dashboards. This isolation is what allows LabPulse to support new or changed source formats without touching downstream logic.

## Relationship to Configuration Requirements

Import Profiles are the mechanism behind the "configurable account mapping" requirements already established in [`docs/business/02-payroll-and-expenses.md`](../business/02-payroll-and-expenses.md) and [`docs/data/02-source-data-inventory.md`](../data/02-source-data-inventory.md): an organization-specific mapping is an organization-specific set of alias overrides on top of a shared base profile, not a separate profile per organization.

## Open Questions

Link to:

[../development/open-questions.md](../development/open-questions.md)
