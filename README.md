# LabPulse

LabPulse is an operations intelligence and decision-support platform for dental laboratory organizations.

The initial product is designed for Lab Operations Managers who need to compare location performance, monitor revenue and labor, investigate overtime, evaluate staffing needs, and model possible operational decisions.

## Current Status

Platform Design (Sprint 1 – Platform Foundation, Sprint 1.5 – Domain Model Finalization & AI Knowledge Layer, Sprint 2 – Data Platform Design, and Sprint 2.5 – Legacy Knowledge Extraction all complete). The repository has moved through product discovery, an architecture transition, a domain-modeling cleanup pass, a logical data platform design pass, and an extraction of validated business knowledge from a previously undocumented archived implementation — settling data ownership, versioning, audit, retention, and immutability *before* any database schema is written. Start with [ADR-000](docs/decisions/ADR-000-architectural-philosophy.md) or [AI Context](docs/development/AI_CONTEXT.md) for a fast orientation, or [Project Memory](docs/development/PROJECT_MEMORY.md) for full current architecture, decisions, and the recommended next sprint (Sprint 3 – Database Design, not yet started).

No application code, dependencies, or database migrations exist yet. The repository is not production-ready and should not contain real employee, payroll, customer, or confidential company data.

## Product Direction

LabPulse is intended to provide:

- Location performance comparison
- Revenue analytics
- Labor-model analysis
- Overtime intelligence
- Staffing analysis
- Data import and normalization
- Scenario modeling
- Explainable recommendations
- Optional AI-supported summaries

## Proposed Technology Stack

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- shadcn/ui
- GitHub
- Vercel

The stack remains proposed until architecture decisions are accepted.

## Documentation

### Product

- [North Star](docs/product/00-north-star.md)
- [Product Vision](docs/product/01-product-vision.md)
- [MVP PRD](docs/product/02-mvp-prd.md)

### Data

- [Metrics Dictionary](docs/data/01-metrics-dictionary.md)
- [Source Data Inventory](docs/data/02-source-data-inventory.md)

### Architecture

- [ADR-000: Architectural Philosophy](docs/decisions/ADR-000-architectural-philosophy.md) — read this first
- [System Architecture](docs/architecture/01-system-architecture.md)
- [Domain Boundaries](docs/architecture/domain-boundaries.md) — DDD-inspired bounded contexts
- [ERD Concept](docs/architecture/erd-concept.md) — conceptual Mermaid ER diagrams, no SQL
- [Canonical Data Principles](docs/architecture/canonical-data-principles.md)
- [Recommendation Framework](docs/architecture/recommendation-framework.md)
- [Decision Graph](docs/architecture/decision-graph.md)
- [Event-Driven Processing](docs/architecture/event-driven-processing.md) (conceptual, no technology chosen)
- [Architecture Decisions (ADR index)](docs/decisions/README.md)
- [Entity Catalog](docs/entities/README.md)

### Data Model

- [`docs/data-model/`](docs/data-model/) — logical data platform design: [entity relationships](docs/data-model/01-entity-relationships.md), [data lifecycle](docs/data-model/02-data-lifecycle.md), [versioning strategy](docs/data-model/03-versioning-strategy.md), [audit strategy](docs/data-model/04-audit-strategy.md), [retention policy](docs/data-model/05-retention-policy.md)
- [Relationship Catalog](docs/data-model/relationship-catalog.md)
- [Snapshot Strategy](docs/data-model/snapshot-strategy.md)
- [Import Persistence](docs/data-model/import-persistence.md)
- [Recommendation Persistence](docs/data-model/recommendation-persistence.md)
- [Permission Model](docs/data-model/permission-model.md) — capability-based authorization
- [Entity Lifecycle](docs/data-model/entity-lifecycle.md)

### Security

- [Security Requirements](docs/security/01-security-requirements.md)

### Business Rules and Import/Scenario Architecture

- [Business Rules](docs/business/rules/BR-001-prioritize-location-review.md)
- [Import Framework](docs/imports/01-import-framework.md)
- [Scenario Engine](docs/scenario-engine/README.md)

### Repository Memory and Planning

- [AI Context](docs/development/AI_CONTEXT.md) — fast briefing for any AI assistant starting work here
- [Executive Summary](docs/development/EXECUTIVE_SUMMARY.md) — for founders, investors, architects, and reviewers
- [Project Memory](docs/development/PROJECT_MEMORY.md)
- [Decision Log](docs/development/DECISION_LOG.md)
- [Product Backlog](docs/backlog/PRODUCT_BACKLOG.md)
- [Open Questions](docs/development/open-questions.md)

### Legacy Knowledge (Historical Reference Only)

- [`docs/legacy/`](docs/legacy/README.md) — business knowledge extracted from an archived, non-target implementation; nothing in it is approved architecture. Start with [Legacy Overview](docs/legacy/01-legacy-overview.md) and [Business Rule Comparison](docs/legacy/03-business-rule-comparison.md).

## Repository Structure

```text
docs/                    Product, architecture, data, security, and decision records
docs/entities/           Conceptual canonical entity catalog (no SQL)
docs/data-model/         Logical data platform design: relationships, lifecycle, versioning, audit, retention (no SQL)
docs/legacy/             Business knowledge extracted from an archived, non-target implementation (historical reference only)
docs/imports/            Import framework, import profiles, normalization, and validation architecture
docs/scenario-engine/    Scenario engine purpose and scenario-shape documents
docs/business/rules/     Numbered business rules (BR-001 and later)
docs/development/        Open questions and repository memory (PROJECT_MEMORY.md)
docs/backlog/            Product backlog
prompts/       Reusable AI and Claude Code prompts
app/           Future application code
supabase/      Future Supabase configuration and migrations
tests/         Future automated tests
scripts/       Future development and maintenance scripts
.github/       Future GitHub configuration and workflows
```

## Data Safety

Do not commit:

- Environment files
- API keys
- Database passwords
- Supabase service-role keys
- Real employee data
- Real compensation data
- Confidential profit-and-loss reports
- Customer-identifying information
- Unredacted source reports

Use sanitized or synthetic data during development.

## Development Guidance

Claude Code should follow the instructions in [`CLAUDE.md`](CLAUDE.md).

Application implementation should not begin until the MVP requirements, metric definitions, and security baseline have been reviewed.
