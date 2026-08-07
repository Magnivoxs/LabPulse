# Sprint 3B Report — Logical-to-Physical Database Mapping

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Complete — local, uncommitted, pending founder review. **Amended by Sprint 3B.1 (2026-08-06):** a review pass found fifteen relational-design issues in the proposal this report describes and corrected them without reversing any founder decision recorded below. See [`SPRINT_3B_1_REVIEW_CORRECTIONS.md`](SPRINT_3B_1_REVIEW_CORRECTIONS.md) for the full account — most notably, the exact MVP table count changed from this report's approximate "~53" (actually 54) to a corrected, exact 59, and several table designs referenced below (`permission`, `permission_set`, `alert`, `metric_observation`, `employee`, the four canonical snapshots, `import_normalized_value`) were structurally revised. **Further amended by Sprint 3B.2 (2026-08-06):** a second, narrower review pass found ten cross-tenant and revision-integrity issues plus a broader audit's worth of the same patterns recurring elsewhere; the exact MVP table count became **61**. **Further amended by Sprint 3B.3 (2026-08-06):** a third, narrower pass verified every composite foreign key introduced by the two prior passes actually had a matching parent key, and closed eight further gaps in evidence-table tenant matching, snapshot-to-import integrity, scenario-version binding, validation-result lineage, and same-row check-constraint coverage. The exact MVP table count is **unchanged at 61** — Sprint 3B.3 added no new tables. **Further amended by Sprint 3B.4 (2026-08-06):** a fourth, narrowly-scoped pass examined only the import-provenance/lineage subsystem and closed six gaps where Organization-level enforcement alone (established by 3B.1–3B.3) left room for two rows produced by two *different* Import Jobs, within the same Organization, to be incorrectly connected — plus a false "enforced transitively" claim, a second duplicated Profile Version fact, an Import-Job-to-override Profile-Version binding gap, and the Payroll account-mapping duplication. The exact MVP table count is **unchanged at 61** — Sprint 3B.4 added no new tables. **Further amended by Sprint 3B.4A (2026-08-06):** a fifth, narrow pass closed two gaps Sprint 3B.4 itself left open (an Import Job's supersession chain could still cross an unrelated base Import Profile; nothing verified an Import Job's Profile Version was actually permitted to produce its snapshot's canonical target), and corrected several documentation contradictions Sprint 3B.4 introduced or left un-annotated elsewhere in the proposal (a stale historical composite-FK table, a not-fully-withdrawn "enforced transitively" claim, a stale reference to a removed column, an incomplete Sprint 3C trigger inventory, and four incorrect ERD cardinalities). The exact MVP table count is **unchanged at 61** — Sprint 3B.4A added no new tables. See [`SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md), [`SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`](SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md), [`SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md`](SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md), and [`SPRINT_3B_4A_FINAL_RECONCILIATION.md`](SPRINT_3B_4A_FINAL_RECONCILIATION.md) for the full accounts. This report is preserved unmodified below as the historical record of Sprint 3B's own decisions and reasoning; where it conflicts with any corrections report, the **most recent** corrections report (Sprint 3B.4A) is authoritative for the physical model's current state.

## Purpose

This report documents Sprint 3B's execution: translating the founder-approved Sprint 3A decision packet and the existing conceptual entity catalog / logical data platform design into a proposed PostgreSQL/Supabase physical schema. Per the sprint's authorization, this is **documentation only** — no migrations, executable SQL, Supabase project, dependencies, or application code were created, and nothing was committed or pushed.

---

## 1. Safety-Check Results

All Phase 1 safety checks passed before any file was changed:

| Check | Result |
|---|---|
| Repository remote is `Magnivoxs/LabPulse` | ✅ Pass |
| Current branch is `docs/architecture-main` (before creating the working branch) | ✅ Pass |
| `git fetch origin` | ✅ Ran cleanly |
| Working tree clean | ✅ Pass (`git status --short` empty) |
| Local branch synchronized with `origin/docs/architecture-main` | ✅ Pass (even, no ahead/behind) |
| Branch descends from root commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e` | ✅ Pass — this commit **is** the branch's sole root (confirmed via `git merge-base --is-ancestor` and `git rev-list --count HEAD` = 1) |
| No secrets or real-data files present in the proposed work area | ✅ Pass (verified again in Section 13) |

No check failed or was ambiguous; Phase 2 proceeded.

## 2. Branch Created

`docs/sprint-3b-physical-model`, created from the synchronized `docs/architecture-main` (commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e`). This branch did not already exist locally or remotely before creation. It has **not** been pushed.

## 3. Approved Founder Decisions Recorded

All twelve founder-approved controlling decisions from the authorizing prompt were applied:

1. **Canonical terminology** — Office remains the sole canonical backend term; no Location table/entity/FK created; Region remains descriptive metadata, never an authorization boundary. Reaffirmed physically in [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) `office`.
2. **Authorization model** — Capability-based, Office-scoped design proposed in [`docs/database/07-authorization-data-model.md`](../database/07-authorization-data-model.md). MVP `security_role` seed limited to Organization Administrator, Operations Manager, Read-Only Viewer; the six expanded candidates explicitly deferred. No hardcoded role-name authorization logic anywhere in the proposal.
3. **Staffing-model representation** — Extensible header (`labor_model_snapshot`) + staffing-measure detail (`labor_model_staffing_measure`) design, supporting headcount, FTE, and role-broken-out measures, source-provided unit/value, and import lineage. OQ-061 marked partially resolved at the architecture level.
4. **Labor Model % vs. Payroll Percentage** — Modeled as two permanently separate, never-merged values on separate snapshot tables. OQ-060 marked resolved (separation decision only).
5. **Backlog representation** — Header (`backlog_snapshot`) + detail (`backlog_stage_count`) + configurable, versioned dimension (`production_stage`). No legacy taxonomy hardcoded; Resets/Remakes inclusion represented as a configurable, unresolved flag.
6. **Retention and deletion** — Archive/deactivate confirmed as default (no `ON DELETE CASCADE` anywhere; meaningful status columns, not generic delete flags). No universal self-service hard-delete mechanism designed. Anonymization/tombstoning and identity/operational-fact separation recorded as future options only.
7. **Legacy rules and thresholds** — The four approved, configurable, versioned thresholds (8.0%, 10.8%, $500, 20 cases) are the only seed data; legacy thresholds not adopted anywhere. OQ-066 marked resolved for MVP.
8. **Franchise support** — Excluded entirely from the MVP tenant hierarchy; `organization` → `office` remains strictly two-level. OQ-055 marked resolved for MVP.
9. **Scenario versioning** — `scenario_definition`/`scenario_definition_version` proposed, matching the existing versioned-definition pattern; no AI state-machine schema introduced.
10. **Notifications** — No persistent Notification table created; Alert/Recommendation/Task remain authoritative.
11. **Deferred snapshots** — No physical tables for ProductionSnapshot, QualitySnapshot, CareerGridSnapshot, or RecruitingSnapshot; conceptual documentation untouched.
12. **Import provenance** — Full relational lineage chain proposed in [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md); row/file hashes present for integrity only, never as the sole lineage mechanism.

## 4. Files Created

**`docs/database/`** (10 files):
`README.md`, `01-physical-model-principles.md`, `02-table-catalog.md`, `03-column-and-type-catalog.md`, `04-keys-relationships-and-constraints.md`, `05-temporal-versioning-and-snapshots.md`, `06-import-lineage-model.md`, `07-authorization-data-model.md`, `08-retention-archive-and-erasure-boundaries.md`, `09-deferred-entities.md`, `10-schema-review-checklist.md`

**Other new files:**
- `docs/architecture/erd-physical-proposed.md`
- `docs/decisions/ADR-007-proposed-physical-data-model.md`
- `docs/development/SPRINT_3B_REPORT.md` (this document)

**Total new files: 13.**

## 5. Existing Files Updated

- `docs/decisions/ADR-004-office-based-authorization.md` — Status: Proposed → **Accepted (2026-08-05)**; Acceptance section added; history preserved, not rewritten
- `docs/entities/security-role.md` — MVP candidate list resolved (3 seeded, 6 deferred); prior reconciliation note preserved as historical
- `docs/entities/permission.md` — physical mapping summary added (normalized office-grant join, effective dates, revoke-and-recreate)
- `docs/entities/labor-model-snapshot.md` — extensible staffing-measure design and OQ-061 partial resolution recorded
- `docs/entities/backlog-snapshot.md` — header/detail/dimension design recorded; moved into MVP scope
- `docs/data-model/05-retention-policy.md` — archive/deactivate default confirmed; erasure pathway explicitly still open
- `docs/data-model/snapshot-strategy.md` — BacklogSnapshot MVP readiness updated; four immature snapshots' deferral reaffirmed
- `docs/data/01-metrics-dictionary.md` — Labor % of Revenue / Payroll Percentage separation decision recorded; OQ-060 status updated
- `docs/development/open-questions.md` — OQ-055, OQ-060, OQ-061, OQ-066 statuses updated with precise scope of what was and was not resolved; no other question touched
- `docs/development/DECISION_LOG.md` — new dated entry for the Sprint 3B founder decision packet and ADR-004 acceptance
- `docs/development/PROJECT_MEMORY.md` — Sprint 3A/3B added to Completed Deliverables, Current Milestone, Current Decisions, Known Risks, Remaining Architectural Work, Recommended Next Sprint, Repository Health, Current Sprint, and Open Questions sections
- `docs/development/AI_CONTEXT.md` — current phase/sprint/milestone, active ADRs, current risks, outstanding questions, priorities, and expected next sprint updated
- `docs/development/EXECUTIVE_SUMMARY.md` — current maturity, current risks, and immediate priorities updated (repository-stewardship trigger: this document directly stated "Sprint 3, not yet started," now stale)
- `docs/backlog/PRODUCT_BACKLOG.md` — Sprint 3A/3B entries added; affected backlog items (SecurityRole reconciliation, legacy threshold reconciliation, RLS, schema design, temporary assignments, franchise, retention) updated to reflect resolved/partially-resolved status (repository-stewardship trigger, same reason as above)
- `README.md` — Current Status section and documentation index updated to reflect Sprint 3 underway and the new `docs/database/` directory (repository-stewardship trigger, same reason as above)

**Total existing files updated: 15.**

**Note on scope:** the founder's task prompt explicitly listed 12 of these 15 files for update. `EXECUTIVE_SUMMARY.md`, `PRODUCT_BACKLOG.md`, and `README.md` were not on that explicit list but were updated under `CLAUDE.md`'s Repository Stewardship rule, because each contained a directly false statement after this sprint's changes (most notably, all three said "Sprint 3 – Database Design, not yet started," which Sprint 3A/3B's completion makes incorrect). Per `CLAUDE.md`, "only update a document if the sprint's changes actually affect what it says" — this was judged to apply here; no other content in these three files was touched.

## 6. Physical-Model Summary

The proposal uses UUID primary keys, `TIMESTAMPTZ`/`DATE` per data grain, `NUMERIC` for all money/percentages (never floating-point), lookup tables in place of native `ENUM` for any organization-configurable value set, normalized join tables in place of array columns (most notably `permission_office_grant` for Office scoping), and `JSONB` limited to three individually-justified genuinely-variable-structure columns. Three snapshot types use header/detail patterns (PayrollSnapshot, LaborModelSnapshot, BacklogSnapshot) specifically to avoid fixed-column assumptions about still-unresolved business questions. Every table's `organization_id`/`office_id` denormalization is called out explicitly, along with the consistency-enforcement gap it creates (see Section 12). Full detail in [`docs/database/`](../database/) and [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md).

## 7. Proposed Initial MVP Table Inventory

**Tenant/Identity (6):** `organization`, `office`, `app_user`, `employee`, `job_role`, `employee_office_assignment` (⚠️ flagged optional)

**Authorization (6):** `security_role`, `capability`, `permission_set`, `permission_set_capability`, `permission`, `permission_office_grant`

**Imports/Lineage (8):** `import_profile`, `import_profile_version`, `organization_import_profile_override`, `import_job`, `import_source_section`, `import_source_row`, `import_validation_result`, `import_normalized_value`

**Snapshots (8):** `revenue_snapshot`, `payroll_snapshot`, `payroll_snapshot_line_item`, `labor_model_snapshot`, `labor_model_staffing_measure`, `backlog_snapshot`, `production_stage`, `backlog_stage_count`

**Metrics/Rules (7 + 4 typed joins):** `metric_definition`, `metric_definition_version`, `business_rule`, `business_rule_version`, `metric_observation` (⚠️ flagged judgment call), `metric_observation_*_snapshot` (×4), `alert`

**Scenarios (5 + 4 typed joins):** `scenario_definition`, `scenario_definition_version`, `scenario_run`, `scenario_run_*_snapshot` (×4), `scenario_input`, `scenario_output`

**Recommendations/Tasks (7):** `recommendation`, `recommendation_lifecycle_event`, `recommendation_evidence_alert`, `recommendation_evidence_metric_observation`, `task`, `task_status_history` (⚠️ flagged optional)

**Audit (1):** `audit_event`

**Approximate total: 53 tables** (including typed join tables and two flagged-optional tables). See [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) for the authoritative list with per-table detail.

## 8. Deferred Table Inventory

No physical table created for: `ProductionSnapshot`, `QualitySnapshot`, `CareerGridSnapshot`, `RecruitingSnapshot`, any Notification/delivery/read-receipt structure, any franchise-grouping structure, any AI-specific state/credential table, or any universal hard-delete mechanism. Full rationale per item in [`docs/database/09-deferred-entities.md`](../database/09-deferred-entities.md).

## 9. Key Architecture Decisions

- **Typed join tables, not polymorphic references**, for Evidence and Scenario-baseline relationships — preserves enforced foreign-key integrity at the cost of a small amount of repeated structure (one exception: `import_normalized_value`'s soft reference to its eventual snapshot, and `audit_event`'s necessarily-generic `entity_type`/`entity_id` pair).
- **`organization_id` denormalized onto office-scoped tables** to simplify Sprint 3C's RLS design, with the resulting consistency risk named explicitly rather than silently assumed safe.
- **Lookup tables over native `ENUM`** for anything organization-configurable or evolving (SecurityRole, JobRole, production stage).
- **No `ON DELETE CASCADE` anywhere** — defaults to `RESTRICT`, matching "nothing is deleted" as a structural property, not just a convention.
- **Recommendation's current state is never a column** — always derived from the latest `recommendation_lifecycle_event` row, physically enforcing immutability.

## 10. Remaining Founder Questions

None of the founder's twelve decisions require further founder input to proceed to Sprint 3C. The following remain open but are **not** Sprint 3C blockers, per the Sprint 3A schema-blocker analysis:

- Which Labor Model staffing unit the real workbook actually uses (OQ-061, source confirmation)
- Office ID exact format (OQ-056)
- Whether an office can appear in multiple regional worksheets (OQ-057)
- Staffing Adherence % exact formula (OQ-059)
- Legacy terminology equivalence and remaining legacy reconciliation items (OQ-067–OQ-073)
- Whether LabPulse should encourage organization-defined custom SecurityRoles as a product feature (the schema supports it either way)

## 11. Remaining Engineering Decisions for Sprint 3C

- **The `organization_id`/`office_id` consistency-enforcement mechanism** (trigger, application-layer invariant, or dropping the denormalization) — see [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md). This is the single most important unresolved item before RLS policies can be written safely.
- Whether Permission's `effective_end_date` is enforced automatically or requires manual revocation (OQ-054, expiry half).
- Whether `metric_observation` should be persisted at Evidence-citation time only (as recommended) or via a different approach.
- Confirmation of the 1:1 SecurityRole–Permission-Set assumption.
- Confirmation or removal of the optional `employee_office_assignment` and `task_status_history` tables.
- Index and partitioning strategy for high-volume tables (`audit_event`, `alert`) once real query patterns are known.

## 12. Known Risks and Tradeoffs

- **`organization_id`/`office_id` consistency gap** (see above) — the most significant structural risk carried forward from this sprint.
- **UUID primary keys** trade minor storage/index overhead for tenant-safety and Supabase convention alignment — accepted, not free.
- **Several judgment calls** (`metric_observation` persistence, 1:1 Permission Set assumption, two optional tables) were made without a directly on-point repository instruction; each is flagged individually and should not be treated as final until Sprint 3D confirms it.
- **`import_normalized_value`'s soft reference** to its eventual snapshot is the one deliberate departure from the typed-join-table integrity pattern used everywhere else, accepted because normalization necessarily precedes snapshot-row creation.
- **This proposal is only as sound as the Sprint 3A/3B decisions it builds on** — if any decision is revisited, the specific affected tables are traceable via Section 3 above and the cross-references throughout [`docs/database/`](../database/).

## 13. Consistency-Check Results

| # | Check | Result |
|---|---|---|
| 1 | No new backend use of `location_id`, `locations`, or a Location entity | ✅ Pass — only match is the checklist's own description of the rule |
| 2 | New physical-model docs use `office_id` consistently | ✅ Pass — confirmed present and consistent across all relevant files |
| 3 | Region never modeled as an authorization boundary | ✅ Pass — `office.region` has no FK to any authorization table; every mention is descriptive/documentary |
| 4 | No hardcoded authorization check depends on role names | ✅ Pass — no `if role = '...'` pattern found; only the checklist's description of what to avoid |
| 5 | Labor Model Labor % and Payroll % are separate | ✅ Pass — distinct columns on distinct tables, cross-referenced but never merged |
| 6 | No speculative Production/Quality/CareerGrid/Recruiting tables | ✅ Pass — only referenced in the deferred-entities rationale, no table definitions |
| 7 | No Notification table added | ✅ Pass — only referenced in the deferred-entities rationale |
| 8 | Legacy thresholds not adopted | ✅ Pass — no legacy numeric value (20%, 25%, 15%, >50, >100) appears as seed/default/example; only referenced in the checklist's description of what to avoid |
| 9 | No executable SQL or migration files created | ✅ Pass — `find` for `*.sql` and `*migrations*` returned nothing outside `.git/` |
| 10 | No secrets, credentials, real records, or personal account information added | ✅ Pass — pattern scan for API keys, passwords, secrets, private-key headers, service-role references returned nothing |
| 11 | `git diff --check` | ⚠️ One flagged line: `docs/data/01-metrics-dictionary.md:965`, a trailing-whitespace warning on a line I added. **Verified as a false positive**, not a defect: this file's pre-existing convention (confirmed by inspecting line 94, `**Business definition:**  ` with two trailing spaces, predating this sprint) uses trailing double-spaces as an intentional Markdown hard line break. My added line follows the same established convention exactly. No line was altered to fix this, since doing so would remove the intended line break and break consistency with the rest of the document. |
| 12 | New/changed relative Markdown links resolve | ✅ Pass, after this file's creation — an automated scan of all new/changed files found only forward-references to this report (which did not yet exist at scan time); re-scanning after this file's creation confirms all links resolve (see below) |
| 13 | `git status --short` | See Section 14 |
| 14 | All work remains on `docs/sprint-3b-physical-model` | ✅ Pass — confirmed via `git rev-parse --abbrev-ref HEAD` |
| 15 | No commit or push occurred | ✅ Pass — `git log` shows only the pre-existing root commit; `git branch -vv` shows no remote-tracking branch for `docs/sprint-3b-physical-model` |

## 14. `git status --short`

```
 M README.md
 M docs/backlog/PRODUCT_BACKLOG.md
 M docs/data-model/05-retention-policy.md
 M docs/data-model/snapshot-strategy.md
 M docs/data/01-metrics-dictionary.md
 M docs/decisions/ADR-004-office-based-authorization.md
 M docs/development/AI_CONTEXT.md
 M docs/development/DECISION_LOG.md
 M docs/development/EXECUTIVE_SUMMARY.md
 M docs/development/PROJECT_MEMORY.md
 M docs/development/open-questions.md
 M docs/entities/backlog-snapshot.md
 M docs/entities/labor-model-snapshot.md
 M docs/entities/permission.md
 M docs/entities/security-role.md
?? docs/architecture/erd-physical-proposed.md
?? docs/database/
?? docs/decisions/ADR-007-proposed-physical-data-model.md
?? docs/development/SPRINT_3B_REPORT.md
```

(Captured before this report's own creation appears as `??`; this file itself is the final addition to the working tree.)

## 15. Confirmation

**No SQL, migrations, dependencies, real data, commit, or pull request were created during Sprint 3B.** All changes described in this report exist only as local, uncommitted modifications and untracked files on branch `docs/sprint-3b-physical-model`. Nothing has been pushed to any remote. `main`, `archive/tauri-desktop-v1`, and `docs/architecture-main` are all untouched by this sprint's work.

## 16. Recommended Next Step

Founder review of this report and the [`docs/database/`](../database/) proposal, followed by either:

(a) approval to proceed to **Sprint 3C — RLS and Security Policy Design**, starting with the `organization_id`/`office_id` consistency-enforcement decision named in Section 11, or

(b) requested revisions to any flagged judgment call (Section 12) before Sprint 3C begins.

No commit, push, merge, or pull request should occur until the founder explicitly authorizes it — this branch remains local-only pending that instruction.
