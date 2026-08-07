# Sprint 3B.4 — Import Provenance Closure

**Version:** 1.0
**Date:** 2026-08-06
**Status:** Complete — local, uncommitted, pending founder/engineering review
**Branch:** `docs/sprint-3b-physical-model` (same branch as Sprint 3B, 3B.1, 3B.2, and 3B.3; not a new branch)

**⚠️ Current-state pointer (added by Sprint 3B.4A):** this report remains historically accurate for what Sprint 3B.4 itself did, but two gaps this pass left open (Import Job supersession crossing an unrelated base Import Profile, and no verification that an Import Job's Profile Version actually permitted its snapshot's canonical target) were closed by a follow-on pass. This report's own false "enforced transitively" correction claim (Correction 1) is accurate as stated; a *separate*, pre-existing occurrence of that same withdrawn phrase elsewhere in [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) was also found and annotated by the follow-on pass. See [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](SPRINT_3B_4A_FINAL_RECONCILIATION.md) for the current, controlling state of the import-lineage design.

## Purpose

This report documents a fourth, narrowly-scoped correction pass, limited entirely to the import-provenance/lineage subsystem ([`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) and the import-facing columns of the four canonical snapshot headers and their detail tables). The Organization, authorization, snapshot-versioning, metrics, scenario, Alert, Recommendation, retention, and RLS-preparation designs were explicitly out of scope for this pass and are unaffected.

Sprint 3B.1 through 3B.3 closed every lineage gap at the **Organization** level: a row could no longer be connected to a different organization's data anywhere in the import chain. This pass found and closed a more specific gap one level down — two rows can share an Organization while having been produced by two **different Import Jobs**, and organization-matching alone never caught that. It also found and corrected a false claim in the Sprint 3B.3 report (an equality Sprint 3B.3 asserted was "enforced transitively" was not actually enforced at all), two duplicated facts (a second copy of Import Profile Version, and the Payroll account-mapping version), and one binding gap (an Import Job's override not verified against its own declared Profile Version).

None of the six corrections below reverses a founder-approved business decision; all are engineering corrections to how already-approved decisions are physically enforced.

## 1. Safety-Check Results

All Phase 1 safety checks passed before any file was changed:

| Check | Result |
|---|---|
| Repository root is `C:\Users\david\OneDrive\Desktop\LabPulse-Remote-Inspection` | ✅ Pass |
| Remote is `Magnivoxs/LabPulse` | ✅ Pass |
| Branch is `docs/sprint-3b-physical-model` | ✅ Pass |
| Nothing staged | ✅ Pass (`git diff --cached --stat` empty) |
| Existing Sprint 3B/3B.1/3B.2/3B.3 work present | ✅ Pass — 15 modified files + 7 untracked entries (including `SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`) |
| No new commit or push occurred | ✅ Pass — `git log` shows only the pre-existing root commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e` |
| The separate `Labpulse` workspace untouched | ✅ Confirmed — not read from, written to, or referenced |

No check failed or was ambiguous.

## 2. Corrections Applied

### Correction 1 — Validation Issue must share the Validation Result's source row

**The problem, verified directly (not assumed from the prior report):** Sprint 3B.3's own text claimed the equality between `import_validation_issue.import_source_row_id` and its parent `import_validation_result.import_source_row_id` was "enforced transitively." Reading the actual Sprint 3B.3 foreign key, this was false: the parent relationship was `(organization_id, import_validation_result_id) → import_validation_result (organization_id, id)` — a two-column, **organization-only** match. Nothing compared the Issue's own `import_source_row_id` (populated only when `import_normalized_value_id IS NOT NULL`) against the cited Validation Result's `import_source_row_id` at all. An Issue could, before this correction, cite a Validation Result for source row A while itself carrying `import_source_row_id = B`.

**Fix:**
- `import_validation_result` gains `UNIQUE (organization_id, import_source_row_id, id)` (a new composite parent key) and `UNIQUE (import_source_row_id)` — the latter states, as a genuine constraint, the MVP's actual grain: **exactly one immutable Validation Result per source row.** [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md) was checked directly and describes no scenario requiring multiple validation attempts on the same physical row — a corrected/reprocessed file is represented as a new Import Job producing new source rows, never a second validation pass over an existing one. No conflicting repository requirement was found, so no history mechanism was invented.
- `import_validation_issue.import_source_row_id` is corrected from nullable to `NOT NULL` on every row.
- `import_validation_issue`'s parent relationship is corrected to a genuine three-column composite FK: `(organization_id, import_source_row_id, import_validation_result_id) → import_validation_result (organization_id, import_source_row_id, id)`. Because the parent now carries the matching composite unique key, this FK makes the equality **actually** impossible to violate — not merely assumed.
- The false "enforced transitively" sentence is withdrawn from [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) and replaced with an explanation of exactly why the prior claim was wrong and what specifically closes the gap now.

**Files changed:** `docs/database/06-import-lineage-model.md`, `docs/database/04-keys-relationships-and-constraints.md`.

### Correction 2 — Preserve Import Job identity throughout source lineage

**The problem:** `import_source_section` already carried `import_job_id` (Sprint 3B.2), but `import_source_row` and `import_normalized_value` did not — they were tied to their immediate parent only, with Import Job agreement holding *transitively* through a multi-hop join, never verified as a direct, declarative fact. The four `import_normalized_value_<type>_snapshot` link tables, and the three detail tables (`payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`), inherited the same gap: two rows sharing an organization but produced by two different Import Jobs could be connected with nothing rejecting it.

**Fix — denormalized `import_job_id`, propagated with composite FKs, not left to a query path:**
- `import_source_row` gains `import_job_id` (`NOT NULL`) and a composite FK to `import_source_section (organization_id, import_job_id, id)` (requiring `import_source_section` to gain that parent key). Also gains `UNIQUE (organization_id, import_job_id, id)` as a new parent key of its own.
- `import_normalized_value` gains `import_job_id` (`NOT NULL`) and a composite FK to `import_source_row (organization_id, import_job_id, id)`. Also gains `UNIQUE (organization_id, import_job_id, id)`.
- The four typed link tables (`import_normalized_value_revenue_snapshot` and its three siblings) each gain `import_job_id` and two strengthened composite FKs: one to `import_normalized_value (organization_id, import_job_id, id)`, one to `<type>_snapshot (organization_id, import_job_id, id)` — requiring each of the four canonical snapshot headers to expose that same new parent key.
- `payroll_snapshot_line_item` and `labor_model_staffing_measure` each gain `import_job_id` and two composite FKs sharing that same column value — one to their own snapshot header, one to their cited `import_source_row` — using the identical "two composite FKs sharing one column, proving both sides agree" technique Sprint 3B.3 already established for Scenario-version binding.
- `backlog_stage_count` gets the same treatment, but conditionally: its `import_job_id` is nullable (manual entries have none), a new same-row `CHECK` requires `import_job_id` and `import_source_row_id` to be both-populated or both-`NULL` (never mixed), and its two composite FKs rely on PostgreSQL's default `MATCH SIMPLE` semantics — automatically skipped when `import_job_id IS NULL`, which is exactly the desired behavior for manual entries.

**One honest remaining gap, documented rather than silently left unaddressed:** nothing can force a manual `backlog_stage_count`'s own header to *also* be manual (as opposed to attaching, via the pre-existing unconditional organization-only FK, to an imported header) — `MATCH SIMPLE` skips the check entirely when the child column is `NULL`, and PostgreSQL has no declarative construct for "the referenced row's column must also be null." This is added as a **named, seventh item** in [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "What Remains Genuinely Open for Sprint 3C," in the same category as the other cross-row consistency rules already listed there (predecessor-exactness, supersession acyclicity, assignment-closure).

**No new table was created anywhere in this correction**, per the explicit instruction — every change is a new column and/or a strengthened composite FK on an existing table.

**Files changed:** `docs/database/06-import-lineage-model.md`, `docs/database/03-column-and-type-catalog.md`, `docs/database/04-keys-relationships-and-constraints.md`, `docs/architecture/erd-physical-proposed.md`.

### Correction 3 — Remove duplicated Import Profile Version fact on `import_normalized_value`

**The problem:** `import_normalized_value.import_profile_version_id` was an independently writable plain FK, duplicating a fact fully determined by `import_job_id → import_job.import_profile_version_id` — exactly one Import Job produces a given normalized value, and that job pins exactly one Profile Version; there is no scenario in this design where a single Import Job applies two different profile versions to different rows it produces.

**Fix:** the column is removed. The fact is derived exclusively through `import_normalized_value.import_job_id → import_job.import_profile_version_id`, matching the identical principle Sprint 3B.3 already applied to the four canonical snapshot headers. No repository-backed reason to keep an independent copy was found.

**Files changed:** `docs/database/06-import-lineage-model.md`.

### Correction 4 — Bind Organization override to the Import Job's Profile Version

**The problem:** `import_job.organization_import_profile_override_id` (Sprint 3B.2) verified only that the override belonged to the Import Job's own organization — it did not verify the override had been defined for the **same Profile Version** the Import Job itself declares (`import_job.import_profile_version_id`). An organization with overrides built against two different base Profile Versions could, before this correction, have had an Import Job pin one version while its override pointed at a mapping built for a different one — a mismatched pairing nothing rejected.

**Fix:** `organization_import_profile_override` gains `UNIQUE (organization_id, import_profile_version_id, id)`. `import_job.organization_import_profile_override_id`'s FK is strengthened to the three-column composite `(organization_id, import_profile_version_id, organization_import_profile_override_id) → organization_import_profile_override (organization_id, import_profile_version_id, id)`.

**Explicitly does not conflict with the approved supersession judgment call:** the pre-existing decision that a *superseding* Import Job may use a newer Profile Version than the job it supersedes concerns two **different** Import Jobs' Profile Versions differing from each other across a reprocessing chain (a cross-row permissiveness rule, deliberately not required). This correction concerns **one single Import Job's own override always agreeing with that same job's own declared Profile Version** — an internal-consistency rule on one row, which must always hold. The two operate on different relationships and were verified not to interact.

**Files changed:** `docs/database/06-import-lineage-model.md`, `docs/database/04-keys-relationships-and-constraints.md`, `docs/architecture/erd-physical-proposed.md`.

### Correction 5 — Resolve Payroll account-mapping duplication

**Investigation, per the instruction to determine intent from controlling repository documents before acting:** [`docs/entities/payroll-snapshot.md`](../entities/payroll-snapshot.md) and every other entity/business document were checked directly for any description of an "account mapping version" as a concept distinct from the Import Job's own Organization override. **None exists.** `organization_import_profile_override`'s own Sprint 3B-era documentation explicitly stated it "also serves as the `account_mapping_version` referenced by `payroll_snapshot.account_mapping_version_id`" — the repository's own words already described these as the same fact, recorded in two independently writable places with nothing preventing disagreement.

**Determination: same fact.** Preferred correction applied:
- `payroll_snapshot.account_mapping_version_id` is removed entirely.
- The fact is derived exclusively through `payroll_snapshot.import_job_id → import_job.organization_import_profile_override_id`.
- `organization_import_profile_override`'s own documentation is updated to remove the "also serves as" framing, since it no longer serves two purposes — it is now purely what its name says.

No second mapping system was invented; the ambiguity is resolved by elimination, not preserved.

**Files changed:** `docs/database/06-import-lineage-model.md`, `docs/database/03-column-and-type-catalog.md`, `docs/database/04-keys-relationships-and-constraints.md`, `docs/database/02-table-catalog.md`.

### Correction 6 — Update the complete-lineage claim

Every instance of the imprecise "every lineage arrow is an enforced foreign key" framing (originating in Sprint 3B.1's Correction 7, repeated in Sprint 3B.2/3B.3 narrative text) is corrected to state precisely what dimension of enforcement applies to each relationship, rather than a single blanket claim that was true only along the Organization axis. A new **Import-Provenance Integrity Matrix** — child record, parent/target record, Organization / Import Job / source-row / Profile-Version enforcement, and manual-entry exceptions — is added to [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md), and is now the authoritative, per-relationship statement replacing the older, less precise claim wherever it appeared.

**Files changed:** `docs/database/06-import-lineage-model.md`, `docs/database/02-table-catalog.md`, `docs/database/04-keys-relationships-and-constraints.md`, `docs/architecture/erd-physical-proposed.md`.

## 3. Import-Provenance Integrity Matrix (summary)

The full matrix is in [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) "Import-Provenance Integrity Matrix." In summary, as of this correction: every parent/child relationship in the import chain enforces Organization agreement; every relationship where the child logically has one producing Import Job now also enforces Import-Job agreement (new in this pass); source-row-level enforcement covers the Validation Result/Issue chain (now exact-row-matched, not merely organization-matched) and every detail table; Profile-Version duplication is eliminated everywhere it existed (`import_normalized_value`, `payroll_snapshot`) rather than merely constrained; and the one deliberate exception (`import_job.supersedes_import_job_id` not requiring Profile-Version equality) is a documented judgment call, not an oversight.

## 4. Exact Final MVP Table Count: 61

**Unchanged.** No table was added or removed. Every correction in this pass added columns and/or strengthened composite foreign keys on tables that already existed as of Sprint 3B.2 (`import_source_row`, `import_normalized_value`, `import_validation_result`, `import_validation_issue`, `organization_import_profile_override`, `import_job`, the four canonical snapshot headers, the four typed link tables, `payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`), or removed a genuinely duplicated column (`payroll_snapshot.account_mapping_version_id`, `import_normalized_value.import_profile_version_id`). Verified consistent across [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md), [`docs/database/README.md`](../database/README.md) *(not independently modified this pass — carries the same count, no separate verification needed since it references the table catalog directly)*, [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md), and this report.

## 5. Remaining Sprint 3C Work (Import-Lineage-Specific)

- The new, seventh "What Remains Genuinely Open for Sprint 3C" trigger: manual `backlog_stage_count` rows must belong to manual `backlog_snapshot` headers.
- Existing residual items, unaffected by this pass: predecessor-exactness for snapshot/Metric Observation revisions, Recommendation supersession acyclicity, `employee_office_assignment` exactly-once closure, the eight Global-or-Same-Organization Reference Pattern trigger sites, the "at least one office grant" transactional check for office-scoped Permissions, and RLS policy SQL itself (out of scope for all of Sprint 3B/3B.1–3B.4).
- `btree_gist` extension setup remains a one-time Sprint 3C prerequisite for the `EXCLUDE` constraints already documented in prior passes (unaffected by this one).

## 6. Remaining Founder/Business Questions

None were newly surfaced by this pass. Both judgment calls made (Correction 1's "no evidence of multiple Validation Results per row" determination, and Correction 5's "same fact, not a distinct concept" determination for the Payroll account-mapping question) were resolved by direct inspection of controlling repository documents, not by founder decision — neither required a business-meaning invention, and neither is flagged as a conflict requiring escalation, since no contradicting repository evidence was found in either case.

## 7. Confirmations

- **ADR-007 remains `Proposed`.** Only its Amendment section was extended (a new "Amendment: Sprint 3B.4 Corrections" section, dated 2026-08-06); its Status field was not touched.
- **ADR-004 remains `Accepted`**, untouched by this pass.
- **No founder-approved business decision was reversed.** All six corrections are engineering-level fixes to how already-approved decisions are physically enforced (Import Job identity, Profile Version binding, source-row matching) — none touches Office/Location terminology, Region-as-metadata, the Labor%/Payroll% separation, approved thresholds, franchise exclusion, deferred snapshot types, or the archive-not-delete default.
- **No unresolved business meaning was invented.** Both judgment calls (Corrections 1 and 5) were resolved by checking what the repository already says, not by guessing.
- **No MVP table was added or removed.** The count remains exactly 61.
- **No executable SQL, migration file, Supabase project, dependency, or application code was created.**
- **Nothing was staged, committed, pushed, merged, or made into a pull request.** All changes remain local, uncommitted modifications and untracked files on `docs/sprint-3b-physical-model`.
- **The separate, non-Git `Labpulse` architecture workspace was never read from, written to, or otherwise referenced.**

## Related Documents

- [Sprint 3B Report](SPRINT_3B_REPORT.md)
- [Sprint 3B.1 Review Corrections](SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Import Lineage Model](../database/06-import-lineage-model.md)
- [Keys, Relationships, and Constraints](../database/04-keys-relationships-and-constraints.md)
- [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)
