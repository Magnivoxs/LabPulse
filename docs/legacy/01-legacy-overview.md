# Legacy Application Overview

**Version:** 0.1
**Status:** Historical reference only
**Last Updated:** 2026-08-04

## What It Is

A working desktop application named "LabPulse," built with Tauri 2 (Rust backend) and React 19 + TypeScript + Vite (frontend), backed by a local SQLite database (`rusqlite`, bundled). It was developed over 15 commits between 2025-12-23 and 2026-01-07 by the same founder, then development paused in favor of the current architecture-first approach (see the Repository Comparison Audit in this conversation history).

## Architecture

- **Runtime:** Single-user desktop application (Tauri), not a multi-tenant web platform.
- **Database:** One SQLite file (`labpulse.db`) stored in the OS application-data directory — outside any repository, never committed to Git.
- **Frontend:** React Router-based single-page app (`Overview`, `Rankings`, `Directory`, `OfficeDetail`, `DataEntry`, `Compliance`, `Settings` pages).
- **Backend:** Tauri "commands" (Rust functions exposed to the frontend via IPC) in `commands.rs`, database schema/migrations in `db.rs`, Excel import logic in `imports.rs`.
- **No multi-tenancy, no authentication, no roles/permissions.** One installation manages all offices directly; there is no Organization, User, or SecurityRole concept anywhere in the code.
- **No API layer, no server** — the "backend" is local Rust code called directly from the UI process.

## Scope Actually Built

Based on commit history and source inspection, the application reached:

- An office directory (list, add via Excel template, remove with cascading delete)
- Monthly data entry across four categories: Financial, Operations, Volume, Notes
- A dashboard summarizing all offices with computed percentages and simple threshold-based alerts
- A rankings page (revenue, cases, average case value, margin)
- A weekly-volume bulk import with automatic monthly aggregation
- A compliance/submission-tracking page (weekly submission streaks)
- A basic settings page with a database sanity check and an explicit placeholder for future configurable alert thresholds

## Business Domain Confirmed

The legacy application operates on the same domain as the current architecture: dental laboratory offices, each with monthly financial figures (revenue, lab expense, personnel expense, overtime, bonus), operational figures (backlog, labor model, staffing), and weekly production volume by stage and case type. It managed real data during use: one commit message states "21 offices, 43 staff, 21 contacts imported." That data lives only in the local SQLite file on the original machine — it was not found in the Git repository (confirmed during the Repository Comparison Audit).

## Data Maturity

Real, working formulas and thresholds exist in the code (see [`04-formula-candidates.md`](04-formula-candidates.md) and [`03-business-rule-comparison.md`](03-business-rule-comparison.md)) — this is empirical evidence of what the founder considered meaningful at the time, not an approved specification. Several values conflict with thresholds already approved in the current architecture (see Business Rule Comparison) and must not be assumed correct without founder validation.

## Why Development Paused (Inferred, Not Confirmed)

Not stated anywhere in the code or commit messages. The `Settings.tsx` page contains an explicit placeholder — "Alert Thresholds: Coming in Phase 3..." — suggesting the founder already recognized hardcoded thresholds as a limitation to address in a later phase that was never reached. This is treated as an inference, not a confirmed fact, and should be validated with the founder if relevant.

## Related Documents

- [Feature Inventory](02-feature-inventory.md)
- [Business Rule Comparison](03-business-rule-comparison.md)
- [Repository Comparison Audit findings — this conversation]
