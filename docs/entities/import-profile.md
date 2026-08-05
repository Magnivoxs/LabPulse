# Entity: ImportProfile

**Version:** 0.1
**Status:** Proposed (structure defined; only Labor Model profile schema documented)
**Last Updated:** 2026-08-04

## Purpose

Represents a versioned, declarative description of one source-file type, per [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md).

## Description

An ImportProfile is the only place allowed to know a source file's layout (expected sheets, required/optional columns, aliases). Business rules, the scenario engine, and dashboards never reference an ImportProfile directly — they consume canonical objects produced through it.

## Owner

Engineering (implements and versions profiles); Lab Operations (confirms business meaning of mapped fields).

## Relationships

- Used by one or more [ImportJob](import-job.md) executions.
- May have [Organization](organization.md)-specific alias/mapping overrides layered on a shared base profile.
- Its normalization rules produce [LaborModelSnapshot](labor-model-snapshot.md), [RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), or [BacklogSnapshot](backlog-snapshot.md) records, depending on profile type.

## Proposed Fields (High Level)

- Profile type (Labor Model, P&L, Payroll, Career Grid, Power BI, CSV, future API)
- Version
- Expected sheets/sections
- Required columns
- Optional columns
- Aliases
- Validation rules reference
- Normalization rules reference

## Update Cadence

Versioned when a source format changes; not edited in place once used for a real import.

## Source Systems

Defined internally by analyzing each source type; only the Labor Model workbook has been analyzed in full so far (see [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)).

## Validation Considerations

- A profile change must not require changes to logic outside that profile's own rules (see [`docs/imports/03-import-profiles.md`](../imports/03-import-profiles.md) Profile Independence).
- Only the Labor Model profile type has a documented schema; P&L, Payroll, Career Grid, Power BI, CSV, and future API profiles remain open (see [`docs/development/open-questions.md`](../development/open-questions.md)).

## Future Database Implications

Expected to require a versioned-row design, since historical imports must remain interpretable against the profile version active at import time. No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Not a direct input to any business rule; sits upstream of the canonical objects rules depend on.

## Related Scenarios

None directly; upstream of the data scenarios consume.

## Related Metrics

None directly; determines which raw fields become available for metric computation.
