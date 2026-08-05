# LabPulse System Architecture

**Version:** 0.1  
**Status:** Proposed

## Architecture Goals

- Maintainable code
- Strong tenant isolation
- Testable business calculations
- Clean separation of concerns
- Minimal unnecessary dependencies
- Configurable metrics and targets
- Reliable data imports
- Provider-independent AI integration
- Incremental delivery

## Proposed System Overview

```text
User Browser
    |
    v
Next.js User Interface
    |
    v
Server Actions and API Routes
    |
    +----------------------+
    |                      |
    v                      v
Supabase Auth         Application Services
                           |
                           +------------------------+
                           |                        |
                           v                        v
                    PostgreSQL Database       Import Pipeline
                           |                        |
                           v                        v
                    Normalized Data          Validation and Mapping
                           |
                           v
                    Metrics Engine
                           |
                           v
                    Scenario Engine
                           |
                           v
                    Dashboards and Recommendations
                           |
                           v
                    Optional AI Explanation Layer
```

## Separation of Responsibilities

### Presentation Layer

Responsible for:

- User interface
- Forms
- Tables
- Charts
- Filters
- Accessible interactions
- Displaying approved calculated results

The presentation layer should not contain authoritative financial formulas.

### Application Layer

Responsible for:

- Authorization checks
- Workflow orchestration
- Use-case logic
- Import coordination
- Scenario execution
- Recommendation coordination

### Domain Layer

Responsible for:

- Metrics
- Financial formulas
- Staffing formulas
- Overtime calculations
- Break-even calculations
- Validation rules
- Scenario assumptions

Domain logic should use pure, tested functions where practical.

### Data Layer

Responsible for:

- Database queries
- Database migrations
- Tenant-scoped persistence
- Imported source records
- Normalized operational records
- Audit history

### AI Integration Layer

Responsible for:

- Provider abstraction
- Provider configuration
- Prompt construction
- Response validation
- Usage controls
- Plain-language explanations

AI must not replace authorization or deterministic calculations.

## Data Flow

### Import Flow

The canonical import pipeline is:

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

No application logic may depend directly on source-file (for example, Excel) layouts. All layout-specific knowledge lives inside an Import Profile; everything downstream of Normalization reads only the Canonical LabPulse Data Model.

The user-facing sequence within the Import and Import Profile stages is:

```text
Upload
  -> Server-side file validation
  -> Select or detect Import Profile
  -> Parse headers and rows using the profile's expected sheets and columns
  -> Suggest field mappings using the profile's aliases
  -> User confirms mapping
  -> Validate records against the profile's validation rules
  -> Preview errors
  -> Approve import
  -> Normalize data into the Canonical LabPulse Data Model
  -> Store import history
  -> Recalculate affected aggregates
```

Full detail on this pipeline is maintained in [`docs/imports/`](../imports/01-import-framework.md), not duplicated here.

### Dashboard Flow

```text
Authenticated request
  -> Authorize organization and location access
  -> Retrieve normalized or aggregated data
  -> Apply approved metric definitions
  -> Return typed response
  -> Render dashboard
```

### Scenario Flow

```text
User selects scenario
  -> Load authorized baseline data
  -> Validate scenario assumptions
  -> Run deterministic calculations
  -> Produce output and warnings
  -> Optionally generate plain-language explanation
  -> Record scenario metadata if approved
```

## Proposed Technology Stack

### Application

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts

### Platform

- Supabase Auth
- PostgreSQL
- Supabase Storage
- Row-Level Security
- Supabase Edge Functions only where they provide a clear benefit

### Delivery

- GitHub
- GitHub Actions
- Vercel

These choices must be documented in an Architecture Decision Record before implementation.

## Authorization Architecture

Per [ADR-004](../decisions/ADR-004-office-based-authorization.md), authorization is office-based, not region-based:

```text
Organization
  -> Office
    -> Permissions
      -> User
```

- **Office** is the tenant-owned operational unit for authorization, import, and business-rule purposes. "Office" and "Location" refer to the same entity; see ADR-004's Terminology section for why both terms currently appear across the repository.
- **Region** is descriptive metadata on an office (used for grouping and Labor Model regional worksheets), not an authorization boundary.
- A user's office access may be: one office, many offices, an entire organization, a temporary (time-bounded) office assignment, or a future franchise grouping. Temporary assignments and franchise grouping are pending architecture, not yet designed.
- Row-Level Security policies must key off organization and office scope, never off region alone.

## Data Architecture Direction

Potential core entities include:

- organizations
- users
- organization_memberships
- offices (canonical operational/authorization unit; synonymous with "locations" in existing business and data documents — see ADR-004)
- office_permissions (user-to-office or user-to-organization access grants, including temporary assignments)
- region (descriptive metadata field on an office, not a standalone authorization entity)
- employees
- job_roles (Employee job/position classification — see [`docs/entities/job-role.md`](../entities/job-role.md))
- security_roles (authorization roles referenced by permissions — see [`docs/entities/security-role.md`](../entities/security-role.md); distinct from job_roles, resolving a prior naming collision)
- reporting_periods
- revenue_records
- labor_records
- overtime_records
- staffing_targets
- location_targets
- labor_model_imports (recommended staffing, current staffing, staffing adherence, labor % of revenue per office and reporting period)
- imports
- import_profiles (expected sheets, required/optional columns, aliases, version, validation rules, normalization rules per source type)
- import_files
- import_mappings
- import_errors
- scenarios
- scenario_results
- alerts
- audit_events

This is an initial conceptual list, not an approved schema. `offices` and `locations` are listed separately here only to show lineage; a future schema should not implement both.

## Calculation Architecture

Financial and operational calculations should:

- Exist in one authoritative domain module
- Use explicit input types
- Return typed result objects
- Handle missing and invalid data explicitly
- Avoid floating-point ambiguity for currency
- Include unit tests
- Expose assumptions
- Be reusable by dashboards, APIs, imports, and scenarios

Currency calculations should use integer minor units or a reviewed decimal implementation.

## Aggregation Strategy

Dashboard performance should not depend on repeatedly scanning all raw imported rows in the browser.

The application may use:

- Database views
- Materialized views
- Precomputed aggregates
- Scheduled aggregation
- Incremental recalculation

The chosen strategy should remain simple during the MVP.

## AI Provider Abstraction

Business logic should call a provider-neutral interface.

Conceptual example:

```text
AIProvider
  - generateExplanation()
  - summarizeFindings()
  - answerAuthorizedQuestion()
```

Provider-specific implementations may include:

- OpenAIProvider
- AnthropicProvider
- GeminiProvider

No provider-specific code should be embedded throughout dashboard components.

## Initial Deployment Boundaries

The initial prototype may use synthetic data and no external AI provider.

Real data, multi-tenant production access, and AI credential storage must not be enabled until their security requirements are implemented and reviewed.
