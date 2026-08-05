# ADR-002: Use Organization-Based Multi-Tenancy

**Status:** Proposed  
**Date:** 2026-08-04

## Context

LabPulse may serve multiple dental laboratory organizations.

Each organization must be isolated from every other organization.

## Options Considered

1. Shared database with organization identifiers and Row-Level Security
2. Separate schema per organization
3. Separate database per organization
4. Single-tenant application

## Proposed Decision

Use a shared PostgreSQL database with organization-scoped records and Supabase Row-Level Security.

## Reasons

- Appropriate for an MVP SaaS product
- Supports centralized migrations
- Lower operational complexity
- Works with Supabase authentication and RLS
- Supports organization membership and role-based access

## Risks

- Missing organization identifiers could cause data leakage
- Incorrect policies could expose cross-tenant data
- Administrative access could be overly broad
- Testing requirements are significant

## Consequences

- Tenant-owned records must be organization-scoped
- RLS must be enabled before tenant data is used
- Cross-tenant access tests are mandatory
- Organization access must be checked server-side
- Frontend filtering is never sufficient authorization

## Conditions for Revisiting

Revisit if:

- Enterprise customers require isolated databases
- Regulatory obligations require physical isolation
- Scale or backup requirements favor separate databases
