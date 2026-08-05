# Entity: ImportJob

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents a single execution of an import — one uploaded file processed through the pipeline — producing history and lineage.

## Description

An ImportJob ties together the uploaded source file (treated as untrusted, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md)), the [ImportProfile](import-profile.md) version used, the [User](user.md) who uploaded it, and the resulting validation and normalization outcomes. This is the entity that satisfies the "maintain import history" requirement in [`CLAUDE.md`](../../CLAUDE.md).

## Owner

Operations Manager or Organization Administrator (uploads and approves imports, per role permissions).

## Relationships

- Belongs to one [Organization](organization.md).
- Uses one version of one [ImportProfile](import-profile.md).
- Uploaded by one [User](user.md).
- Produces zero or more [LaborModelSnapshot](labor-model-snapshot.md), [RevenueSnapshot](revenue-snapshot.md), [PayrollSnapshot](payroll-snapshot.md), or [BacklogSnapshot](backlog-snapshot.md) records upon successful normalization.

## Proposed Fields (High Level)

- Organization reference
- Import profile reference and version
- Uploaded-by user reference
- Uploaded-at timestamp
- Source file reference (metadata, not raw content stored as a queryable data source)
- Status (pending, validated, approved, normalized, failed)
- Error and warning counts

## Update Cadence

Created per upload; status updates as it moves through validation, approval, and normalization.

## Source Systems

User-initiated upload; the file itself is the "Import" stage input described in [`docs/imports/01-import-framework.md`](../imports/01-import-framework.md).

## Validation Considerations

- File-type and size validation must happen server-side, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) File Upload Security.
- Invalid records must be preserved with reasons, never silently discarded (see [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md)).
- The raw source file must be stored separately from normalized data, per [`CLAUDE.md`](../../CLAUDE.md) Data Rules.

## Future Database Implications

Expected to be the audit/lineage table that every snapshot record references back to, supporting the Development Constitution principle that "imports are versioned." No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Not a direct input to any business rule; upstream of the canonical objects rules depend on.

## Related Scenarios

None directly; upstream of the data scenarios consume.

## Related Metrics

None directly.
