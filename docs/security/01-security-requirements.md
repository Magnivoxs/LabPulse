# LabPulse Security Requirements

**Version:** 0.1  
**Status:** Initial Baseline

## Purpose

This document defines mandatory security requirements for LabPulse.

Security requirements are part of the product definition and must not be postponed until deployment.

## Core Principles

- Least privilege
- Deny by default
- Defense in depth
- Tenant isolation
- Server-side authorization
- Minimal data collection
- Secure defaults
- Auditable changes
- No secrets in source control
- Deterministic business calculations

## Multi-Tenant Isolation

- Every tenant-owned database record must include an organization identifier or use an equally strong tenant-isolation design.
- Supabase Row-Level Security must be enabled on every tenant-owned table.
- Access must not depend only on frontend filters.
- Organization membership must be validated server-side.
- Cross-tenant access tests must be created.
- Administrative access must be explicit and auditable.

## Authentication

- Use Supabase Auth unless an architecture decision approves another provider.
- Require verified identity for production access.
- Production password and session policies must be documented.
- Session handling must use secure framework-supported methods.
- Authentication errors must not expose sensitive implementation details.

## Authorization

- Use role-based access control, based on SecurityRole (see [`docs/entities/security-role.md`](../entities/security-role.md)) — distinct from an Employee's JobRole (see [`docs/entities/job-role.md`](../entities/job-role.md)).
- Permissions should be checked on the server.
- Sensitive operations should require explicit permissions.
- User interface visibility is not an authorization boundary.
- SecurityRole changes should be logged.

## Secrets

Never commit:

- Supabase service-role keys
- Database passwords
- AI API keys
- OAuth client secrets
- Encryption keys
- Production tokens

Secrets must be:

- Stored in approved environment or secret-management systems
- Available only to required server-side processes
- Rotatable
- Excluded from logs
- Excluded from browser bundles

## AI Provider Credentials

LabPulse must not route all customer AI usage through the founder's personal account.

The future product should support organization-controlled provider credentials or provider authorization flows.

Requirements:

- Never expose provider credentials to browser JavaScript.
- Never store credentials as plain text.
- Never write credentials to logs.
- Never place credentials in prompts.
- Encrypt credentials using a reviewed secret-management design.
- Restrict credential access to authorized server-side code.
- Support credential deletion and rotation.
- Disable AI features safely when no provider is configured.

For the initial prototype, AI integrations should remain disabled or use local development credentials outside source control.

## Data Classification

Potential data classes include:

- Public product information
- Internal operational data
- Confidential financial data
- Employee-related data
- Authentication data
- Secret credentials

The MVP should not process patient clinical data.

Any future handling of protected health information requires a separate compliance and architecture review.

## File Upload Security

- Allow only approved file types.
- Validate file type server-side.
- Do not trust filename extensions.
- Apply file-size limits.
- Generate server-controlled storage names.
- Prevent path traversal.
- Store uploads in private storage by default.
- Scan or isolate uploads where appropriate.
- Parse files in controlled server-side processes.
- Treat spreadsheet formulas and imported text as untrusted data.
- Do not execute macros.
- Maintain import audit records.
- Do not silently ignore invalid records.

## Input Validation

- Validate all external input at system boundaries.
- Use schema validation.
- Reject unexpected fields where appropriate.
- Use parameterized database access.
- Encode output appropriately.
- Treat imported text and AI output as untrusted.
- Never construct executable code from imported data.

## AI Security

Potential threats include:

- Prompt injection through imported files
- Sensitive-data disclosure
- Cross-tenant context leakage
- Hallucinated calculations
- Malicious generated links or instructions
- Excessive provider cost

Requirements:

- Do not allow AI models to bypass application permissions.
- Retrieve only data the current user is authorized to access.
- Separate system instructions from imported content.
- Label imported content as untrusted.
- Never use AI as the authoritative calculator.
- Apply provider usage limits.
- Log metadata without logging sensitive prompt contents by default.
- Allow organizations to disable AI features.

## Logging and Auditing

Audit events should eventually include:

- Authentication events
- User and role changes
- Import creation
- Import approval
- Mapping changes
- Target changes
- Scenario execution
- AI-provider configuration changes
- Administrative actions

Logs must not contain:

- Raw secrets
- Passwords
- Full authentication tokens
- Unnecessary employee information
- Confidential imported files

## Dependency Security

- Minimize third-party dependencies.
- Prefer well-maintained libraries.
- Pin dependency versions using a lockfile.
- Enable automated dependency scanning.
- Review new dependencies before installation.
- Remove unused dependencies.
- Do not install packages solely to avoid writing small, clear functions.

## Development Controls

Before merging code:

- Linting must pass.
- Type checking must pass.
- Relevant tests must pass.
- No secrets may be present.
- Database changes must use migrations.
- Authorization changes must include tests.
- Major architecture changes must include an ADR.

## Production Readiness Requirements

Before using real customer or company data:

- Complete a security review
- Test tenant isolation
- Test role permissions
- Review data retention
- Review backup and recovery
- Review AI credential storage
- Configure monitoring
- Configure error reporting
- Establish incident-response procedures
- Document data deletion
