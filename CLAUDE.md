# Claude Code Instructions for LabPulse

## Project Purpose

LabPulse is an operations intelligence and decision-support platform for dental laboratory organizations.

The initial primary user is a Lab Operations Manager.

## Required Working Method

Before making changes:

1. Read the relevant files in `docs/`.
2. Inspect the current implementation.
3. Identify the smallest safe change.
4. State assumptions.
5. Do not invent business rules.

After making changes:

1. Run formatting.
2. Run linting.
3. Run TypeScript type checking.
4. Run relevant tests.
5. Review the diff.
6. Report files changed and remaining risks.

## Architecture Rules

- Use strict TypeScript.
- Keep modules small and focused.
- Separate presentation, application, domain, and data concerns.
- Do not place authoritative financial formulas in React components.
- Implement business calculations as tested pure functions where practical.
- Avoid duplicated business logic.
- Avoid unnecessary abstractions.
- Avoid premature microservices.
- Avoid broad refactors without approval.
- Do not introduce dependencies without explaining why they are needed.
- Prefer platform capabilities and small clear functions over packages.

## Security Rules

- Never expose Supabase service-role credentials to browser code.
- Never commit secrets.
- Never store AI credentials in plain text.
- Never disable RLS as a shortcut.
- Never rely on client-side filtering for authorization.
- Validate external input server-side.
- Treat uploaded files as untrusted.
- Treat imported spreadsheet text as untrusted.
- Treat AI output as untrusted.
- Do not log secrets or unnecessary sensitive information.
- Use the principle of least privilege.
- Flag any requested implementation that creates a security risk.

## Data Rules

- Store normalized data separately from uploaded source files.
- Maintain import history.
- Do not silently discard invalid records.
- Use explicit validation.
- Handle null, missing, and zero-denominator cases.
- Use synthetic data during prototype development.
- Do not add real employee, payroll, or company financial data to the repository.

## Calculation Rules

- AI must not perform authoritative financial calculations.
- Currency math must avoid unsafe floating-point handling.
- Calculations must expose assumptions.
- Approved metric definitions come from `docs/data/01-metrics-dictionary.md`.
- Missing business definitions must be flagged rather than guessed.
- Formula changes require tests and documentation updates.

## Database Rules

- Use migrations.
- Track migrations in source control.
- Every tenant-owned table must have an approved tenant-isolation design.
- RLS policies require tests.
- Do not make destructive schema changes without explicit approval.

## UI Rules

- Build accessible interfaces.
- Use semantic HTML.
- Support keyboard navigation.
- Do not hide critical information only in chart color.
- Show metric definitions and reporting periods.
- Show data freshness and data-quality status where relevant.
- Avoid dashboard clutter.

## Git Rules

- Make small, reviewable changes.
- Do not commit generated secrets or local environment files.
- Do not rewrite unrelated files.
- Do not perform large formatting-only changes without approval.
- Summarize meaningful changes clearly.

## Documentation Rules

Update documentation when:

- Architecture changes
- Security assumptions change
- Metrics change
- New dependencies are added
- Business rules are implemented
- Important tradeoffs are accepted

Significant architecture decisions require an ADR.

## Repository Stewardship

At the conclusion of every sprint, Claude should review and, if changes made during the sprint require it, update:

- `docs/development/PROJECT_MEMORY.md`
- `docs/development/AI_CONTEXT.md`
- `docs/development/EXECUTIVE_SUMMARY.md`
- `docs/backlog/PRODUCT_BACKLOG.md`
- `README.md`
- `docs/development/DECISION_LOG.md`

Only update a document if the sprint's changes actually affect what it says — do not touch a file just to bump a date. When in doubt about whether a change is sprint-ending or mid-sprint, prefer updating these documents at the end of the reported unit of work rather than leaving them stale for a future session to reconcile. This keeps the repository itself usable as a source of truth for future AI sessions and contributors without depending on conversation history.

## Current Project Stage

The project is in discovery and documentation.

Do not begin application implementation unless explicitly instructed.
