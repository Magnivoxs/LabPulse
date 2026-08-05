# ADR-001: Use Next.js and Supabase

**Status:** Proposed  
**Date:** 2026-08-04

## Context

LabPulse requires a web application, authentication, a relational database, file storage, tenant isolation, and a maintainable development workflow.

## Options Considered

1. Next.js with Supabase
2. React with a separate Express API and PostgreSQL
3. Django with PostgreSQL
4. A low-code platform

## Proposed Decision

Use Next.js with TypeScript for the application and Supabase for PostgreSQL, authentication, storage, and Row-Level Security.

## Reasons

- Supports a single TypeScript codebase
- Provides managed PostgreSQL
- Provides integrated authentication
- Supports Row-Level Security
- Supports incremental MVP development
- Works well with GitHub and Vercel
- Reduces initial infrastructure burden

## Risks

- Poorly designed Row-Level Security could expose data
- Application logic could become tightly coupled to Supabase
- Server and client boundaries could be misused
- Edge Functions could be added unnecessarily

## Consequences

- Database access patterns must respect RLS
- Service-role keys must remain server-side
- Database migrations must be stored in source control
- Supabase-specific logic should be isolated where practical

## Conditions for Revisiting

Revisit this decision if:

- Required enterprise authentication cannot be supported
- Supabase creates material performance limitations
- Compliance requirements require another hosting model
- Vendor coupling materially slows development
