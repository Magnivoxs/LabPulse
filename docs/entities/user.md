# Entity: User

**Version:** 0.1
**Status:** Proposed (fields conceptual)
**Last Updated:** 2026-08-04

## Purpose

Represents an authenticated person who accesses LabPulse.

## Description

A User is a system account, distinct from an [Employee](employee.md) (a lab staff member tracked for staffing/payroll purposes). A Lab Operations Manager, for example, is typically both a User (they log in) and may or may not also be represented as an Employee record, depending on whether they are tracked in staffing data. This distinction avoids conflating "who can log in" with "who works at an office."

## Owner

Organization Administrator (manages user accounts and role assignments).

## Relationships

- Belongs to one [Organization](organization.md).
- Is granted access to one or more [Office](office.md) records, or organization-wide access, via [Permission](permission.md).
- Creates [Scenario](scenario.md) runs.
- Resolves [Alert](alert.md) and [Recommendation](recommendation.md) records (acknowledges, dismisses, accepts).
- Owns [Task](task.md) records.
- Initiates [ImportJob](import-job.md) uploads.

## Proposed Fields (High Level)

- Identity (name, email)
- Authentication reference (Supabase Auth identity)
- Status (active, invited, disabled)
- Organization reference

## Update Cadence

As needed — onboarding, offboarding, and profile edits.

## Source Systems

Supabase Auth (per [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md)); not imported from spreadsheet sources.

## Validation Considerations

- Email uniqueness and verified identity, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) Authentication.
- A disabled User must lose effective access immediately; this must be enforced server-side, never only in the UI.

## Future Database Implications

Expected to reference Supabase's `auth.users` table rather than duplicating credential storage, per [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md). No schema is defined here — see [ADR-005](../decisions/ADR-005-canonical-data-model.md).

## Related Business Rules

Not a direct input to any business rule; Users act on the outputs of business rules (alerts, recommendations).

## Related Scenarios

Users initiate and review all scenario types in [`docs/scenario-engine/README.md`](../scenario-engine/README.md).

## Related Metrics

None directly.

## Related ADRs

- [ADR-001: Next.js and Supabase](../decisions/ADR-001-nextjs-and-supabase.md)
- [ADR-004: Office-Based Authorization](../decisions/ADR-004-office-based-authorization.md)
