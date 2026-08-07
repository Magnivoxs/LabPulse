# Sprint 3B.4A — Final Import Reconciliation

**Version:** 1.0
**Date:** 2026-08-06
**Status:** Complete — local, uncommitted, pending founder/engineering review
**Branch:** `docs/sprint-3b-physical-model` (same branch as Sprint 3B, 3B.1, 3B.2, 3B.3, and 3B.4; not a new branch)

## Purpose

This report documents a fifth, narrow reconciliation pass on the import-provenance/lineage subsystem. It closes two gaps Sprint 3B.4 itself left open — an Import Job's supersession chain could still cross an unrelated base Import Profile, and nothing verified an Import Job's Profile Version was actually permitted to produce its snapshot's canonical target — and corrects several documentation contradictions Sprint 3B.4 introduced or left un-annotated elsewhere in the proposal, plus four incorrect physical ERD cardinalities. As with every prior correction pass in this lineage, none of the corrections below reverses a founder-approved business decision; all are engineering corrections. The Organization, authorization, snapshot-versioning, metrics, scenario, Alert, Recommendation, retention, and RLS-preparation designs remained out of scope.

---

## 1. Safety-Check Results

All checks performed before any edit, per Phase 1 of the authorizing prompt:

| Check | Result |
|---|---|
| Git root is `C:\Users\david\OneDrive\Desktop\LabPulse-Remote-Inspection` | ✅ Pass |
| Branch is `docs/sprint-3b-physical-model` | ✅ Pass |
| Remote is `Magnivoxs/LabPulse` | ✅ Pass |
| Nothing staged (`git diff --cached --stat` empty) | ✅ Pass |
| Existing Sprint 3B through Sprint 3B.4 work present (15 modified + 8 untracked entries, matching every prior sprint's expected file set) | ✅ Pass |
| No new commit or push (`git log` shows only the pre-existing root commit `f8022ea233f95dfe1e46f6d19d21cc3e63f9927e`) | ✅ Pass |
| `C:\Users\david\OneDrive\Desktop\Labpulse` not touched | ✅ Confirmed — never read from or written to during this pass |

All checks passed; work proceeded.

---

## 2. Import Job Same-Profile Supersession Rule (Correction 1)

**The gap:** `import_job.supersedes_import_job_id` enforced only that its predecessor belonged to the same Organization. Nothing stopped a Payroll Import Job from being recorded as superseding an unrelated Labor Model, Backlog, or Power BI Import Job, provided both belonged to the same organization — a nonsensical supersession chain that every prior correction pass's Organization-level enforcement was blind to.

**The fix:**

- `import_job` gains `import_profile_id UUID NOT NULL` — the base profile this job used, independent of which version.
- `import_job.import_profile_version_id` is strengthened from a plain FK to a composite FK: `(import_profile_id, import_profile_version_id) → import_profile_version (import_profile_id, id)`, requiring `import_profile_version` to carry a new `UNIQUE (import_profile_id, id)`.
- `import_job.supersedes_import_job_id` is strengthened to: `(organization_id, import_profile_id, supersedes_import_job_id) → import_job (organization_id, import_profile_id, id)`, requiring `import_job` to carry a new `UNIQUE (organization_id, import_profile_id, id)`.

**What this guarantees:**

- Same Organization (unchanged from Sprint 3B.3).
- Same base Import Profile (new — the actual gap this correction closes).
- A newer Import Profile *Version* within that same base profile remains explicitly permitted — this correction does **not** touch or tighten the existing Sprint 3B.3 judgment call that profile-version equality across a supersession is deliberately not required. The two rules operate on different granularities (base profile: now mandatory; version within that profile: still permissive) and do not interact.
- `CHECK (supersedes_import_job_id IS DISTINCT FROM id)` rules out direct self-reference declaratively.
- `UNIQUE (supersedes_import_job_id)` (nulls excluded) limits each Import Job to at most one direct successor. No repository requirement supports branching, so this is retained without exception.

**Cycle-prevention (named as a Sprint 3C trigger, not implemented):** `import_job` has no `revision_number` to make cycle-freedom an arithmetic certainty the way the four canonical snapshots and `metric_observation` do. Sprint 3C should implement the same pattern already established for Recommendation supersession acyclicity: a trigger requiring `supersedes_import_job_id` (when set) to reference an Import Job whose `uploaded_at` is strictly earlier than the new row's own `uploaded_at`. Combined with the single-successor uniqueness constraint (already fully declarative), this makes an indirect cycle impossible for the identical reason it is impossible for Recommendation — a cycle would require a chain of strictly-decreasing timestamps returning to its own starting value, which cannot happen since `uploaded_at` is assigned once, at insert time, and never updated.

See [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) "Can a Superseding Import Job Use a Different Profile Version?" and [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Additional Composite FKs Added in Sprint 3B.4A."

---

## 3. Import Profile Target-Compatibility Rule (Correction 2)

**The gap:** the controlling architecture establishes that an Import Profile's normalization rules determine which canonical target(s) it produces, but nothing in the physical model stopped an Import Job using, say, a Labor Model profile from producing a `payroll_snapshot` row. Organization and Import Job foreign keys alone cannot catch this — both would be perfectly valid while the *kind* of data produced is nonsensical.

**No new table added.** A single Import Profile Version may legitimately permit more than one canonical target (a P&L-style profile producing both Revenue and Payroll facts, for example), so this is not modeled as one profile equals exactly one snapshot type.

**MVP target codes (exhaustive):** `revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`.

**Declaration mechanism:** `import_profile_version.schema_definition` — already a justified, versioned `JSONB` document — is now required to include an immutable array field naming exactly which of the four codes that specific Profile Version is permitted to produce. Because `schema_definition` is immutable per version (a new permitted-target set is a new `version_number`, never an edit to an existing version), this carries the same versioned-and-immutable guarantee as every other fact inside that document. This is additional required content within an existing column, not a new relational fact needing its own storage or table.

**Sprint 3C trigger requirement (named, not implemented — a `CHECK` cannot read another table's `JSONB` column):** a `BEFORE INSERT OR UPDATE` trigger on each of the four canonical snapshot headers, verifying `NEW.import_job_id`'s Import Job used a Profile Version whose declared permitted-target set includes that header's own target code. This trigger must reject an incompatible target even when every other foreign key (Organization, Import Job) is fully valid.

**Inherited compatibility:** the four typed link tables and the imported-path detail rows (`payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`) do not need a separate copy of this check — each already carries a same-Import-Job composite FK to its own snapshot header (Sprint 3B.4 Correction 2), so once the header itself passes target-compatibility validation at insert time, every detail/link row referencing it is transitively covered.

**Manual Backlog exemption:** a manually-entered `backlog_snapshot` (`import_job_id IS NULL`) has no Import Job to validate a Profile Version against, and is entirely exempt — consistent with every other Import-Job-scoped rule in this proposal.

**No hardcoded profile-type assumption:** the permitted-target set lives entirely inside each specific Profile Version's own `schema_definition`; a future Profile Version — of an existing or new profile type — can declare whatever combination of the four MVP codes it supports, with no schema change.

See [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) "Import Profile Normalization-Target Compatibility" and the extended "Import-Provenance Integrity Matrix" (new "Target compatibility" column).

---

## 4. Every Stale Contradiction Removed (Correction 3)

A targeted search across all `docs/database/*.md` files for the exact phrase `"enforced transitively"`, remaining Organization-only import relationship statements that Sprint 3B.4 actually strengthened, and any statement claiming Profile Version or account-mapping duplication still existed, found and fixed the following:

1. **`docs/database/04-keys-relationships-and-constraints.md` — the Sprint 3B.2 historical composite-FK table.** Six rows (`import_source_row`, `import_normalized_value`, the four typed link tables as one row, `payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`) stated organization-only relationships with no indication they were later strengthened. **Before:** plain statements of the Sprint 3B.2 organization-only FKs, presented without qualification. **After:** each row is now marked **[superseded, see Sprint 3B.4]**, with a prefatory note directing the reader to the actual, currently-controlling Sprint 3B.4 table further below. The rows are preserved, not deleted, as a historical record of what Sprint 3B.2 itself closed.

2. **`docs/database/04-keys-relationships-and-constraints.md` — "Validation-Result Lineage Integrity (Sprint 3B.3, Correction 5)" section.** This section still contained, in flowing prose (not flagged as historical), the claim that Issue/Result source-row equality was "enforced transitively." **Before:** "Because `import_validation_issue.import_source_row_id` must independently equal `import_validation_result.import_source_row_id` for the *same* validation result (enforced transitively — both ultimately trace to the one `import_source_row_id` on `import_validation_result`)..." presented as a currently-accurate statement. **After:** the section is retitled to flag it as historical, the "enforced transitively" claim is explicitly quoted and withdrawn in place with the reasoning why it was false, and the reader is pointed to [`docs/database/06-import-lineage-model.md`](../database/06-import-lineage-model.md) `import_validation_issue` for the current, correct, three-column composite FK design from Sprint 3B.4 Correction 1.

3. **`docs/database/04-keys-relationships-and-constraints.md` — Uniqueness Constraints table, `organization_import_profile_override` row.** **Before:** "the second constraint supports `import_job.organization_import_profile_override_id`'s **and** `payroll_snapshot.account_mapping_version_id`'s new composite FKs" — but `payroll_snapshot.account_mapping_version_id` was removed entirely in Sprint 3B.4 Correction 5 and no longer exists. **After:** corrected to name only the still-existing `import_job.organization_import_profile_override_id` consumer, with an explicit parenthetical noting the removed column does not consume this key.

4. **`docs/database/04-keys-relationships-and-constraints.md` — "Complete List of Sprint 3C Triggers."** This consolidated list, numbered 1 through 9, omitted a trigger requirement that Sprint 3B.4 itself introduced elsewhere in the same document ("What Remains Genuinely Open for Sprint 3C," item 7: a manually-entered `backlog_stage_count`'s header must also be manual). **Before:** the consolidated list stopped at item 9, silently missing this requirement. **After:** added as item 10, alongside two genuinely new items from this pass — item 11 (Import Job supersession cycle-prevention) and item 12 (Import Profile target-compatibility). The list is now a complete, accurate inventory of all twelve outstanding Sprint 3C trigger requirements.

5. **`docs/database/02-table-catalog.md` — Imports and Lineage domain summary.** **Before:** "No table was added or removed by any of these four correction passes; the count is unchanged from Sprint 3B.1" — ambiguous, since a reader could mistake this as claiming the proposal's *overall* table count is still 59 (Sprint 3B.1's figure) rather than 61. **After:** reworded to state explicitly that this domain's own table count has held steady at 13 tables since Sprint 3B.1, while the proposal's overall MVP table count is 61, unchanged since Sprint 3B.2 — the two figures are now clearly distinguished.

No other occurrence of "enforced transitively," a stale organization-only claim, or a duplicated-fact claim was found in `docs/database/`. Historical Sprint reports (`SPRINT_3B_REPORT.md`, `SPRINT_3B_1_REVIEW_CORRECTIONS.md`, `SPRINT_3B_2_INTEGRITY_CORRECTIONS.md`, `SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md`, `SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md`) were left with their original findings intact and received only a current-state pointer note, per the "preserve history, don't rewrite" instruction.

---

## 5. ERD Cardinalities Corrected (Correction 4)

All four fixes applied to [`docs/architecture/erd-physical-proposed.md`](../architecture/erd-physical-proposed.md):

1. **Organization override ↔ Import Job.** **Before:** `IMPORT_JOB ||--o{ ORGANIZATION_IMPORT_PROFILE_OVERRIDE` — read literally, this claimed each Import Job has many overrides and each override belongs to exactly one Import Job, backwards from reality. **After:** `ORGANIZATION_IMPORT_PROFILE_OVERRIDE o|--o{ IMPORT_JOB : "optionally used by"` — each Import Job uses zero-or-one override; each override may be reused by zero-or-many Import Jobs.
2. **Backlog Snapshot ↔ Import Job.** **Before:** `IMPORT_JOB ||--o| BACKLOG_SNAPSHOT` — limited one Import Job to at most one Backlog Snapshot. **After:** `IMPORT_JOB o|--o{ BACKLOG_SNAPSHOT` — one imported file may contain data for multiple Offices, so an Import Job may produce zero-or-many Backlog Snapshots; each Backlog Snapshot still references zero-or-one Import Job, since it may instead be manually entered.
3. **Validation Result ↔ Source Row.** **Before:** `IMPORT_SOURCE_ROW ||--o{ IMPORT_VALIDATION_RESULT` — zero-or-many, contradicting the row's own label ("exactly one") and the actual `UNIQUE (import_source_row_id)` constraint added in Sprint 3B.4 Correction 1. **After:** `IMPORT_SOURCE_ROW ||--o| IMPORT_VALIDATION_RESULT` — zero-or-one, matching the real constraint (zero, because a row may momentarily exist before validation runs; never more than one, per the unique constraint).
4. **Payroll line-item wording.** **Before:** label included "(1 row : 1 detail row; ...)" with no `UNIQUE (import_source_row_id)` constraint on `payroll_snapshot_line_item` to actually support that claim (verified directly — no such constraint exists anywhere in `04-keys-relationships-and-constraints.md`). **After:** the "1 row : 1 detail row" clause is removed; the label now reads "produces directly (same-Import-Job composite FK...)" with a note explaining why the stricter label was removed.

Additionally, per Correction 1's requirement to show the new Import Profile identity path: `IMPORT_PROFILE ||--o{ IMPORT_JOB : "identifies (base profile)"` was added alongside the existing, unchanged `IMPORT_PROFILE_VERSION ||--o{ IMPORT_JOB : "used by"` relationship, and the self-referencing `IMPORT_JOB` supersession line's label was updated to note the new same-base-Profile requirement. Explanatory notes below both diagrams were updated to match, and a note disambiguating which 🆕 markers in Section 2 belong to Sprint 3B.4 (Import-Job-level enforcement) versus Sprint 3B.4A (cardinality/identity corrections) was added to prevent the two from being conflated.

---

## 6. Exact Table Count

**61 — unchanged.** Verified consistent across:

- [`docs/database/02-table-catalog.md`](../database/02-table-catalog.md) (explicit per-sprint history table, now including a Sprint 3B.4A column showing +0)
- [`docs/database/README.md`](../database/README.md)
- [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md) (new Sprint 3B.4A amendment states the count explicitly)
- This report

Both Sprint 3B.4A corrections added only columns (`import_job.import_profile_id`) and constraints (new `UNIQUE` keys, strengthened composite FKs) to existing tables, or required additional content within an already-existing `JSONB` column (`import_profile_version.schema_definition`'s permitted-target declaration). No table was created or removed.

---

## 7. Remaining Sprint 3C Triggers

The consolidated inventory in [`docs/database/04-keys-relationships-and-constraints.md`](../database/04-keys-relationships-and-constraints.md) "Complete List of Sprint 3C Triggers" now contains twelve items:

1. At least one `permission_office_grant` row for a `scope_type = 'office'` Permission.
2. Global-or-same-organization reference validation (eight sites).
3. Snapshot and Metric Observation predecessor-exactness.
4. Recommendation supersession acyclicity.
5. `employee_office_assignment` exactly-once closure.
6. Alert and Recommendation lifecycle transition validation.
7. Immutability enforcement on every insert-only table.
8. Scenario value/definition type agreement.
9. `condition_evaluation` numeric/non-numeric consistency.
10. **A manually-entered `backlog_stage_count`'s header must also be manual** (Sprint 3B.4 — previously present only in "What Remains Genuinely Open for Sprint 3C," now also in this consolidated list, closing an omission).
11. **Import Job supersession cycle-prevention** (Sprint 3B.4A, Correction 1 — new).
12. **Import Profile normalization-target compatibility** (Sprint 3B.4A, Correction 2 — new).

None of these twelve is implemented as SQL in Sprint 3B through Sprint 3B.4A.

## Remaining Founder/Business Questions

None. Both corrections in this pass were purely relational/declarative-integrity fixes with no unresolved business-meaning component. The one judgment call made (profile-version equality remaining unaffected across a same-Profile supersession) is a direct, unmodified carry-forward of the existing Sprint 3B.3 judgment call, not a new one.

---

## 8. Confirmation

**ADR-007 remains `Status: Proposed`.** Only a new, dated "Amendment: Sprint 3B.4A Corrections" section was added; the ADR's governance status is unchanged, consistent with every prior amendment in this lineage. **ADR-004 remains `Status: Accepted`, untouched.**

**No SQL, migration, dependency, real data, staging, commit, push, merge, or deployment occurred.** All work is local, uncommitted, on branch `docs/sprint-3b-physical-model`. The separate, non-Git `Labpulse` workspace folder was never touched, read from, or written to.

### Final Validation (all 15 items)

1. Repository root, remote, and branch reverified — all match. ✅
2. Nothing staged (`git diff --cached --stat` empty). ✅
3. No new commit or push (`git log --all` shows only the pre-existing root commit and the unrelated legacy `main`/`archive` history). ✅
4. An Import Job cannot supersede a job from another base Import Profile — enforced by the new `(organization_id, import_profile_id, supersedes_import_job_id)` composite FK. ✅
5. Different versions of the same profile remain permitted in a supersession chain — the existing Sprint 3B.3 judgment call is explicitly unaffected and unmodified. ✅
6. Every imported snapshot type has a documented profile-target compatibility rule — named as Sprint 3C trigger item 12. ✅
7. Manual Backlog remains exempt from Import Profile compatibility — explicitly stated, since a manual `backlog_snapshot` has no Import Job to validate against. ✅
8. No current database-design document still claims Validation Issue source-row equality is "enforced transitively" — the one remaining occurrence was found and explicitly withdrawn in place. ✅
9. Current import FKs are not described as Organization-only where Sprint 3B.4 strengthened them — the six affected rows in the Sprint 3B.2 historical table are now explicitly marked superseded. ✅
10. The ERD has correct override, Backlog, Validation Result, and line-item cardinality — all four fixed and verified against the actual constraints (or explicit absence thereof) in `04-keys-relationships-and-constraints.md`. ✅
11. Table count remains 61 everywhere — verified across all four locations named in Section 6. ✅
12. ADR-007 remains Proposed. ✅
13. `git diff --check` returns exit code 0 — verified directly (the CRLF/LF informational notices Git prints separately are not whitespace-check failures). ✅
14. Relative Markdown links in every file touched by this pass validated — all resolve. ✅
15. `git status --short` run — see below. ✅

### `git status --short`

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
?? docs/development/SPRINT_3B_1_REVIEW_CORRECTIONS.md
?? docs/development/SPRINT_3B_2_INTEGRITY_CORRECTIONS.md
?? docs/development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md
?? docs/development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md
?? docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md
?? docs/development/SPRINT_3B_REPORT.md
```

Identical to the pre-pass state except for the addition of this report itself as a new untracked file. Nothing staged.

## Related Documents

- [Import Lineage Model](../database/06-import-lineage-model.md)
- [Keys, Relationships, and Constraints](../database/04-keys-relationships-and-constraints.md)
- [Table Catalog](../database/02-table-catalog.md)
- [Physical ERD](../architecture/erd-physical-proposed.md)
- [ADR-007](../decisions/ADR-007-proposed-physical-data-model.md)
- [Sprint 3B Report](SPRINT_3B_REPORT.md)
- [Sprint 3B.1 Review Corrections](SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.2 Integrity Corrections](SPRINT_3B_2_INTEGRITY_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Sprint 3B.4 Import Provenance Closure](SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md)
