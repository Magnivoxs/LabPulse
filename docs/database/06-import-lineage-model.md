# Import Lineage Model

**Version:** 0.6 (Sprint 3B.4A corrections applied — see [`docs/development/SPRINT_3B_4A_FINAL_RECONCILIATION.md`](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md); Sprint 3B.1, 3B.2, 3B.3, and 3B.4 corrections also applied)
**Status:** Proposed
**Owner:** Engineering
**Last Updated:** 2026-08-06

## Purpose

Propose the physical relational representation of the traceability chain required by [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md) and the founder's explicit instruction: a dashboard value must be traceable to a specific source file and source row, and this must **not** rely on a row hash as the only provenance mechanism, and must be **fully relational** — no polymorphic soft target as the authoritative lineage mechanism.

## The Chain, End to End

```text
import_profile (now also directly identified on import_job, not only through import_profile_version
    — Sprint 3B.4A Correction 1)
  → import_profile_version
    → organization_import_profile_override (an organization's own override version, if any;
        now bound to the exact import_profile_version_id it was defined for — Sprint 3B.4 Correction 4)
    → import_job (one execution, one uploaded file; now the single denormalized "which Import Job"
        identity propagated through every descendant row below — Sprint 3B.4 Correction 2; and now
        pinned to its base import_profile_id so a supersession chain cannot cross unrelated profile
        types — Sprint 3B.4A Correction 1)
      → import_source_section (one worksheet/section within the file)
        → import_source_row (one row within a section)
          → import_validation_result (that row's validation outcome — now exactly one per row,
              Sprint 3B.4 Correction 1)
            → import_validation_issue (zero or more specific problems within that result — now
                genuinely tied to the same source row as its Validation Result, not merely assumed,
                Sprint 3B.4 Correction 1)
          → EITHER:
              (a) a detail row it produces directly (payroll_snapshot_line_item,
                  labor_model_staffing_measure, backlog_stage_count) — a direct FK, now also proven
                  to share its own snapshot header's exact Import Job (Sprint 3B.4 Correction 2), or
              (b) import_normalized_value (a canonical field this row contributes to a
                  header-level aggregate; now also carries its producing Import Job identity,
                  Sprint 3B.4 Correction 2) → a typed link table (now also Import-Job-matched,
                  Sprint 3B.4 Correction 2), populated once the target header snapshot row exists
                  → the header snapshot itself
              → metric_observation_component (a specific numerator/denominator/input citing
                that exact snapshot)
                → metric_observation → alert / recommendation_evidence (a business
                  conclusion citing that observation)
```

**Every arrow in this chain is an enforced foreign key**, and — as of Sprint 3B.4 — every arrow that needs to agree on *which specific Import Job* produced it now does so through a **denormalized, declaratively-checked `import_job_id`**, not merely a multi-hop join that happens to be organization-consistent. Sprint 3B's one original exception — `import_normalized_value.target_table`/`target_record_id` as a soft, non-FK reference — was removed in Sprint 3B.1 (Correction 7). Sprint 3B.2 and 3B.3 then closed the Organization-matching gaps at every level of this chain. **Sprint 3B.4 closes the remaining gap one level more specific than Organization: two rows can share an Organization while still having been produced by two different Import Jobs, and nothing before this pass stopped that.** **Sprint 3B.4A closes two further, independent gaps: (1) an Import Job's supersession chain enforced only same-Organization, permitting an unrelated base Import Profile into the same chain; (2) nothing anywhere verified that an Import Job's declared Profile Version was actually permitted to produce the canonical target its output snapshot claims to be.** See "Import-Provenance Integrity Matrix" below for the complete, current, honest statement of exactly what is and is not enforced.

## Tables

### `import_profile`

Identity only (`profile_type`, `description`, `status`) — the versioned content lives in `import_profile_version`, per [`docs/entities/import-profile.md`](../entities/import-profile.md).

### `import_profile_version`

| Column | Type | Notes |
|---|---|---|
| `import_profile_id` | `UUID` | FK |
| `version_number` | `INTEGER` | Sequential |
| `schema_definition` | `JSONB` | The declarative expected-shape document (sheets, required/optional columns, aliases) — **justified `JSONB`**, one of four such columns in this proposal (see [`01-physical-model-principles.md`](01-physical-model-principles.md) for the complete, exact list): this is inherently a variable, versioned, self-describing document, not a fixed relational structure, and nothing downstream queries into its internal shape relationally |
| `effective_start_date` | `DATE` | |
| `effective_end_date` | `DATE` | N |

**Effective dates are informational only (Sprint 3B.3 Correction 7, clarified explicitly here).** These two columns record the intended validity window a version was designed for; they are **never** used to auto-select "the currently active version" for a new import. Every `import_job` explicitly pins the exact `import_profile_version_id` it used at upload time — no query in this proposal derives "which version is active today" from these dates. Consistent with this, and per [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "Non-Overlapping Effective Periods," this table deliberately does **not** carry an `EXCLUDE` non-overlap constraint: two versions with overlapping informational date ranges are not a conflict, since no read path ever resolves ambiguity between them by date — sequential `version_number` uniqueness is the only uniqueness rule this table needs.

**Composite key (new, Sprint 3B.4 Correction 4 — supporting key only, added on the table this key's consumer references *into*, see `organization_import_profile_override` below):** none needed on this table itself; `import_profile_version.id` alone is already the target of `organization_import_profile_override.import_profile_version_id`, a plain (non-composite) FK, since `import_profile_version` is a global table with no `organization_id` of its own.

**`UNIQUE (import_profile_id, id)`** (**new, Sprint 3B.4A Correction 1**) — a second, additional composite key, required by `import_job.import_profile_version_id`'s corrected composite FK below, which must verify a Profile Version actually belongs to the exact base Import Profile that Import Job itself declares.

### Import Profile Normalization-Target Compatibility (Sprint 3B.4A, Correction 2)

The controlling architecture ([`docs/imports/04-data-normalization.md`](../imports/04-data-normalization.md) and [`docs/data-model/import-persistence.md`](../data-model/import-persistence.md)) establishes that an Import Profile's normalization rules determine which canonical target(s) it produces — but nothing in the physical model before this correction stopped an Import Job using, say, a Labor Model profile from producing a `payroll_snapshot` row, or a Payroll profile from producing a `labor_model_snapshot`. Organization and Import Job foreign keys alone cannot catch this: both would be perfectly valid while the *kind* of data produced is nonsensical.

A single Import Profile Version **may legitimately permit more than one** canonical target — for example, a P&L-style profile that produces both Revenue and Payroll facts from the same uploaded file — so this is **not** modeled as one profile equals exactly one snapshot type.

**MVP target codes** (exhaustive for this proposal; no other value is valid):

- `revenue_snapshot`
- `payroll_snapshot`
- `labor_model_snapshot`
- `backlog_snapshot`

**Declaration mechanism:** `import_profile_version.schema_definition` (already `JSONB`, already the declarative expected-shape document — see above) is required to include an immutable, versioned array field naming exactly which of the four codes above that specific Profile Version is permitted to produce. Because `schema_definition` is immutable once a Profile Version exists (a new permitted-target set is a new `version_number`, never an edit to an existing version), this declaration carries the same versioned-and-immutable guarantee as every other fact inside `schema_definition`. This does **not** add a new column, let alone a new table — it is additional required content within the existing justified-`JSONB` document, not a new relational fact needing its own storage.

**Sprint 3C constraint-trigger requirement (documented here, not implemented — a `CHECK` cannot read another table's `JSONB` column, so this genuinely requires a trigger):** a `BEFORE INSERT OR UPDATE` trigger on each of the four canonical snapshot headers verifying that `NEW.import_job_id`'s Import Job used a Profile Version whose declared permitted-target set (inside `schema_definition`) actually includes that header's own target code:

- `revenue_snapshot.import_job_id` → the Import Job's Profile Version must permit `revenue_snapshot`.
- `payroll_snapshot.import_job_id` → must permit `payroll_snapshot`.
- `labor_model_snapshot.import_job_id` → must permit `labor_model_snapshot`.
- Imported `backlog_snapshot.import_job_id` (when populated) → must permit `backlog_snapshot`.

This trigger must reject an incompatible target even when every other foreign key (Organization, Import Job) is fully valid — target compatibility is a distinct dimension from tenant/job identity, not a byproduct of either.

**Inherited compatibility, not duplicated checks:** the four `import_normalized_value_<type>_snapshot` typed link tables and the imported-path detail rows (`payroll_snapshot_line_item`, `labor_model_staffing_measure`, `backlog_stage_count`) do **not** need their own copy of this trigger. Each already carries a same-Import-Job composite FK to its own snapshot header (Sprint 3B.4 Correction 2); once that header itself has been validated against a compatible Profile Version at the moment it was inserted, every detail/link row that composite-FK-references it is transitively covered — there is no path for a detail row to exist against a header that failed target-compatibility validation, since the header insert itself would have been rejected.

**Manual Backlog exemption:** a manually-entered `backlog_snapshot` (`import_job_id IS NULL`) has no Import Job to validate a Profile Version against, and is therefore entirely exempt from this trigger — consistent with every other Import-Job-scoped rule in this proposal that already carves out the manual-entry path.

**No hardcoded profile-type assumption:** this design deliberately does not assume "a P&L profile always produces Revenue and Payroll" or any other fixed mapping. The permitted-target set lives entirely inside each specific `import_profile_version.schema_definition`, so a future Profile Version — of an existing profile type or an entirely new one (a future API-sourced profile, for example) — can declare whatever combination of the four MVP codes it actually supports, without any schema change.

### `organization_import_profile_override`

Organization-specific alias/mapping overrides layered on a shared base profile version, per [`docs/entities/import-profile.md`](../entities/import-profile.md) Relationships.

**No longer also serves as the Payroll account-mapping version (Sprint 3B.4 Correction 5 — see below).** Sprint 3B/3B.1/3B.2 additionally used this same table as the direct target of `payroll_snapshot.account_mapping_version_id`, an independently writable column with nothing tying it to the override actually used by the Import Job that produced the snapshot. That column is now removed; a Payroll Snapshot's account-mapping override is derived exclusively through `payroll_snapshot.import_job_id → import_job.organization_import_profile_override_id`. This table's sole remaining role is exactly what its name says: an organization's override of a base Import Profile Version.

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | FK |
| `import_profile_version_id` | `UUID` | FK — the base version being overridden |
| `version_number` | `INTEGER` | The organization override's own version, independent of the base profile's version number |
| `mapping_definition` | `JSONB` | **Justified `JSONB`** — same reasoning as `import_profile_version.schema_definition` above: a variable, versioned, self-describing mapping document, not queried relationally by downstream logic outside the import pipeline |
| `effective_start_date` | `DATE` | |
| `effective_end_date` | `DATE` | N |

**Uniqueness:** `UNIQUE (organization_id, import_profile_version_id, version_number)` (Sprint 3B.3 Correction 7) — an organization's override version numbers are sequential per base profile version. **`UNIQUE (organization_id, import_profile_version_id, id)`** (**new, Sprint 3B.4 Correction 4**) — the composite parent key required by `import_job`'s corrected three-column FK below; this is a distinct, additional key from the version-number uniqueness above, serving a different consumer (composite-FK support, not a natural-key rule).

**Effective dates are informational only (Sprint 3B.3 Correction 7)** — identical reasoning to `import_profile_version` above: `import_job.organization_import_profile_override_id` explicitly pins the exact override used, so these dates are never used for date-based auto-activation, and no `EXCLUDE` non-overlap constraint is applied here either.

### `import_job`

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | FK |
| `import_profile_id` | `UUID` | **New (Sprint 3B.4A Correction 1)** — FK to `import_profile`, the base profile this job used, independent of which version. Added specifically so `supersedes_import_job_id` can be pinned to the same base profile — see below |
| `import_profile_version_id` | `UUID` | Composite FK, with `import_profile_id` → `import_profile_version (import_profile_id, id)` — **strengthened, Sprint 3B.4A Correction 1**, from a plain FK, guaranteeing the declared version actually belongs to this job's own declared base profile, not merely that the version row exists somewhere. This is now the **sole** source of "which Import Profile Version was used" for this import — `revenue_snapshot`/`payroll_snapshot`/`labor_model_snapshot` no longer carry their own independent copy of this fact; a snapshot's profile version is always derived through `import_job_id → import_job.import_profile_version_id`. **Sprint 3B.4 Correction 3 extends the same reasoning one level deeper:** `import_normalized_value.import_profile_version_id` is likewise removed — see below |
| `uploaded_by_user_id` | `UUID` | Composite FK, with `organization_id` → `app_user (organization_id, id)` |
| `uploaded_at` | `TIMESTAMPTZ` | |
| `source_file_name` | `TEXT` | Original filename, treated as untrusted display metadata only |
| `source_file_storage_path` | `TEXT` | Server-controlled storage reference, per [`docs/security/01-security-requirements.md`](../security/01-security-requirements.md) File Upload Security — never a client-supplied path |
| `source_file_hash` | `TEXT` | SHA-256 of the uploaded file, for integrity/duplicate-detection **only** — not the primary lineage mechanism |
| `status` | `TEXT` | `CHECK` in (`pending`,`validated`,`approved`,`normalized`,`failed`) |
| `error_count` | `INTEGER` | |
| `warning_count` | `INTEGER` | |
| `supersedes_import_job_id` | `UUID` | N. **Strengthened, Sprint 3B.4A Correction 1:** composite FK, with `organization_id`**and**`import_profile_id` → `import_job (organization_id, import_profile_id, id)` (self-referencing) — from the Sprint 3B.3 organization-only version. A reprocessing run can now never be recorded as superseding a different organization's Import Job **or** a job that used an entirely different base Import Profile (a Payroll job superseding a Labor Model job, for example, which the organization-only version did not prevent). The superseded job's own rows are never deleted or edited. **Profile-*version* equality across a supersession remains deliberately not required** — see "Can a Superseding Import Job Use a Different Profile Version?" below; this correction concerns the base *profile*, a coarser and mandatory identity, not the specific version within it |
| `organization_import_profile_override_id` | `UUID` | N. **Corrected, Sprint 3B.4 Correction 4:** composite FK, with `organization_id`**and**`import_profile_version_id` → `organization_import_profile_override (organization_id, import_profile_version_id, id)` — strengthened from the Sprint 3B.2 organization-only composite FK. An Import Job's override must not only belong to its own organization; it must also have been defined **for the exact Import Profile Version this Import Job itself declares** (`import_profile_version_id`, above). The organization-only version left this open: an organization with overrides defined against two different base profile versions could, before this correction, have had an Import Job pin one profile version while its `organization_import_profile_override_id` pointed at an override built for a *different* version — a mismatched pairing nothing previously rejected. This is separate from, and does not conflict with, the approved decision (directly below) that a *superseding* Import Job may use a newer Profile Version than the job it supersedes: that decision concerns two different Import Jobs' profile versions differing from each other across a reprocessing chain; this correction concerns one single Import Job's own override always agreeing with its own declared profile version, which must always hold |

**Composite keys:** `UNIQUE (organization_id, id)` (Sprint 3B.2) — supports `import_source_section`'s composite FK below and the four canonical snapshot headers' `import_job_id` composite FKs (Sprint 3B.3) and `import_job`'s own self-referencing `supersedes_import_job_id`. **`UNIQUE (organization_id, import_profile_id, id)`** (**new, Sprint 3B.4A Correction 1**) — the composite parent key required by the strengthened self-referencing `supersedes_import_job_id` FK above; a distinct, additional key from the one before it, serving the narrower same-profile consumer specifically.

### Can a Superseding Import Job Use a Different Profile Version? (Sprint 3B.3, Correction 3; base-profile identity added Sprint 3B.4A, Correction 1)

**Same-Organization and same-base-Import-Profile are both now mandatory** for `supersedes_import_job_id` (enforced above — the latter closes a gap Sprint 3B.3 left open: nothing previously stopped a Payroll Import Job from superseding an unrelated Labor Model, Backlog, or other Import Job, provided both belonged to the same organization). **Profile-*version* equality, within that same base profile, remains deliberately not required.** This is a judgment call, not a rule stated anywhere in the repository: no document requires a reprocessing run to use the identical Import Profile Version as the run it corrects, and requiring version equality would block a plausible, legitimate corrective workflow — reprocessing a faulty upload using a profile version whose mapping was itself corrected in the interim, which may be exactly the point of the correction. The more permissive reading is adopted because the more restrictive one has no stated business justification and would foreclose a reasonable real-world case. **Sprint 3B.4 note (still accurate under 3B.4A):** this judgment call is unaffected by Correction 4 above — Correction 4 requires a *single* Import Job's override to match *that same job's own* profile version (an internal-consistency rule on one row), which says nothing about whether two *different* Import Jobs in a supersession chain must share a profile version (a cross-row permissiveness rule, deliberately not required). The two corrections operate on different relationships and do not interact.

**Cycle-prevention (Sprint 3C trigger, documented here, not implemented):** `import_job` has no `revision_number` to make cycle-freedom an arithmetic certainty the way the four canonical snapshots and `metric_observation` do (see "Snapshot and Metric Observation Supersession Integrity" in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md)) — introducing one solely for this purpose would be more machinery than this correction calls for. `CHECK (supersedes_import_job_id IS DISTINCT FROM id)` rules out direct self-reference declaratively, and Sprint 3C should implement the same pattern already used for Recommendation supersession: a trigger requiring `supersedes_import_job_id` (when set) to reference an Import Job whose `uploaded_at` is strictly earlier than the new row's own `uploaded_at`. Combined with **only one direct successor** (`UNIQUE (supersedes_import_job_id)`, nulls excluded — already fully declarative, no trigger needed), this makes an indirect cycle impossible for the same reason it is impossible for Recommendation: a cycle would require a chain of strictly-decreasing timestamps that returns to its own starting value, which cannot happen since `uploaded_at` is assigned once, at insert time, and never updated. No repository requirement supports branching (more than one job superseding the same predecessor), so the single-successor constraint is retained without exception.

### `import_source_section`

Represents one worksheet or section within an uploaded file (for example, one of the Labor Model workbook's four regional worksheets, per [`docs/imports/02-labor-model-import.md`](../imports/02-labor-model-import.md)).

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | Denormalized from `import_job` (Sprint 3B.2 Correction 2), enables the composite FK below |
| `import_job_id` | `UUID` | Composite FK, with `organization_id` → `import_job (organization_id, id)` (Sprint 3B.2) |
| `section_name` | `TEXT` | e.g. a worksheet name |
| `section_index` | `INTEGER` | Position within the file |

**Uniqueness:** `UNIQUE (import_job_id, section_index)` — a section's position within its Import Job is unique. `UNIQUE (organization_id, id)` (Sprint 3B.2) — supports composite FKs that only need organization-matching. **`UNIQUE (organization_id, import_job_id, id)`** (**new, Sprint 3B.4 Correction 2**) — a second, additional composite key, distinct from the one above, required by `import_source_row`'s new same-Import-Job composite FK below. These two keys are not redundant: one supports organization-only consumers, the other supports the strictly narrower Import-Job-matching consumers introduced by this correction.

### `import_source_row`

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | Denormalized from `import_source_section` (Sprint 3B.2 Correction 2), enables the composite FK below and every detail table's composite FK to this table |
| `import_job_id` | `UUID` | **New (Sprint 3B.4 Correction 2)** — denormalized from `import_source_section`, propagating the producing Import Job's identity one level further down the chain than Sprint 3B.2/3B.3 reached. Enables the composite FK immediately below, and every downstream detail/normalized-value table's own same-Import-Job composite FK into this table |
| `import_source_section_id` | `UUID` | Composite FK, with `organization_id`**and**`import_job_id` → `import_source_section (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version. A row's declared Import Job must now match its own Section's Import Job, not merely its Organization; since a `import_source_section` row is Import-Job-specific already (it has exactly one `import_job_id`), this FK is really guaranteeing the denormalized `import_source_row.import_job_id` value is correct, not merely consistent with organization |
| `row_number` | `INTEGER` | Position within the section, as it appeared in the source |
| `raw_data` | `JSONB` | The row's raw, as-uploaded column-value pairs — **justified `JSONB`**: shape is entirely source-defined and varies by Import Profile, never queried by application logic outside the import pipeline itself |
| `row_hash` | `TEXT` | For integrity/duplicate-detection only — **not** the lineage mechanism (see below) |

**Uniqueness:** `UNIQUE (import_source_section_id, row_number)` — a row's position within its section is unique. `UNIQUE (organization_id, id)` (Sprint 3B.2) — the composite-FK parent key that lets `import_validation_result` (organization-only match is sufficient there, since Correction 1 below adds a stronger, row-exact key of its own for its actual concern) declaratively guarantee organization agreement. **`UNIQUE (organization_id, import_job_id, id)`** (**new, Sprint 3B.4 Correction 2**) — a second, additional composite key required by `import_normalized_value`'s new same-Import-Job composite FK, and by `payroll_snapshot_line_item`/`labor_model_staffing_measure`/imported-path `backlog_stage_count`'s strengthened detail-table FKs, all below.

### `import_validation_result`

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | Denormalized (Sprint 3B.3 Correction 5), enables the composite FK below |
| `import_source_row_id` | `UUID` | Composite FK, with `organization_id` → `import_source_row (organization_id, id)` (Sprint 3B.3) |
| `outcome` | `TEXT` | `CHECK` in (`accepted`,`accepted_with_warning`,`rejected`,`unresolved_reference`), per [`docs/imports/05-import-validation.md`](../imports/05-import-validation.md) |
| `reason` | `TEXT` | N — populated for anything other than `accepted` |
| `validated_at` | `TIMESTAMPTZ` | |

A rejected row's `import_validation_result` row is never deleted — this is the physical enforcement of "invalid records must never be silently discarded."

**Composite keys, corrected and extended (Sprint 3B.4 Correction 1):** `UNIQUE (organization_id, id)` (Sprint 3B.3) is retained. **`UNIQUE (organization_id, import_source_row_id, id)`** (**new**) is the composite parent key required by `import_validation_issue`'s corrected three-column FK below. **`UNIQUE (import_source_row_id)`** (**new**) states, as a genuine database constraint rather than only a documentation assumption, the MVP's actual grain: **exactly one immutable Validation Result per imported source row.** No repository document ([`docs/imports/05-import-validation.md`](../imports/05-import-validation.md) or otherwise) describes or requires multiple validation attempts against the same physical source row; a corrected or reprocessed file is represented as a **new** Import Job producing **new** `import_source_row` rows, never as a second validation pass over an existing row. If a future requirement genuinely needs multiple Validation Results per row (for example, a distinct re-validation workflow), that is a new business requirement this proposal does not anticipate and does not attempt to design for speculatively — it would require revisiting this constraint, not working around it.

### `import_validation_issue`

A single `import_validation_result` row can summarize an outcome, but a real row can fail (or warn) for more than one independent reason at once — one field with a format problem and a different field with a missing-reference problem, for example. `import_validation_issue` supports multiple issues per validation result:

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | Denormalized (Sprint 3B.3 Correction 5), enables the composite FKs below |
| `import_source_row_id` | `UUID` | **Corrected, Sprint 3B.4 Correction 1: now `NOT NULL`** (previously nullable, "populated only when `import_normalized_value_id IS NOT NULL`" — see below for why that was insufficient). Denormalized from the parent Validation Result, and now required on **every** row regardless of whether `import_normalized_value_id` is populated, because it is the column that makes the corrected parent-relationship FK below possible |
| `import_validation_result_id` | `UUID` | **Corrected, Sprint 3B.4 Correction 1:** composite FK, with `organization_id`**and**`import_source_row_id` → `import_validation_result (organization_id, import_source_row_id, id)` — replaces the Sprint 3B.3 two-column (`organization_id`-only) FK. This is the actual fix: previously, nothing stopped an Issue from citing a Validation Result for source row A while itself carrying a *different* `import_source_row_id` (populated only for the normalized-value case) pointing at row B — the two-column FK checked only that the Validation Result belonged to the right organization, never that it belonged to the right **row** |
| `field_name` | `TEXT` | N — populated when the issue is specific to one column |
| `severity` | `TEXT` | `CHECK` in (`error`, `warning`, `info`) |
| `issue_code` | `TEXT` | Stable identifier, e.g. `missing_required_field`, `unresolved_office_id` |
| `message` | `TEXT` | Human-readable |
| `raw_value_reference` | `TEXT` | N — the offending raw value, when appropriate to record directly |
| `import_normalized_value_id` | `UUID` | N. Composite FK, with `organization_id`**and**`import_source_row_id` → `import_normalized_value (organization_id, import_source_row_id, id)` (unchanged from Sprint 3B.3 — this relationship was already correctly specified). Populated when the issue pertains to a specific normalized value rather than the raw row broadly; `import_normalized_value_id` itself may remain `NULL` for raw-row-level issues, but `import_source_row_id` is now always populated regardless |

**The Sprint 3B.3 "enforced transitively" claim is withdrawn (Sprint 3B.4 Correction 1).** Sprint 3B.3 stated that `import_validation_issue.import_source_row_id` "must independently equal `import_validation_result.import_source_row_id` for the same validation result (enforced transitively — both ultimately trace to the one `import_source_row_id` on `import_validation_result`)." **This was incorrect.** The Sprint 3B.3 parent FK to `import_validation_result` was `(organization_id, import_validation_result_id) → import_validation_result (organization_id, id)` — a two-column, organization-only match. Nothing in that FK, or anywhere else, actually compared the Issue's own `import_source_row_id` against the cited Validation Result's `import_source_row_id`; the two values were entirely independent, unenforced writable columns that merely happened to agree if application code always set them consistently. A row citing Validation Result A (for source row 1) while itself carrying `import_source_row_id = 2` would have been accepted by every constraint that existed before this correction. This is now genuinely closed by the corrected three-column composite FK above: because `import_validation_result` carries `UNIQUE (organization_id, import_source_row_id, id)` (Correction 1, above), the only way for `import_validation_issue.(organization_id, import_source_row_id, import_validation_result_id)` to satisfy that FK is for the Issue's own `import_source_row_id` to be **identical** to the cited Validation Result's `import_source_row_id` — there is no longer any value pair that could disagree and still be accepted.

### `import_normalized_value`

| Column | Type | Notes |
|---|---|---|
| `organization_id` | `UUID` | Denormalized from `import_source_row` (Sprint 3B.2 Correction 2), enables the composite FKs below and the four typed link tables' composite FKs |
| `import_job_id` | `UUID` | **New (Sprint 3B.4 Correction 2)** — denormalized from `import_source_row`, propagating Import Job identity to the point where the header-aggregation typed link tables need it |
| `import_source_row_id` | `UUID` | Composite FK, with `organization_id`**and**`import_job_id` → `import_source_row (organization_id, import_job_id, id)` — **strengthened, Sprint 3B.4 Correction 2**, from the Sprint 3B.2 organization-only version. The specific raw row this value came from must now match this row's own declared Import Job, not merely its organization |
| `canonical_field_name` | `TEXT` | e.g. `total_office_revenue` |
| `canonical_value_text` | `TEXT` | N |
| `canonical_value_numeric` | `NUMERIC(14,4)` | N |

**`import_profile_version_id` removed (Sprint 3B.4 Correction 3).** Sprint 3B/3B.1/3B.2/3B.3 carried this as an independently writable plain FK ("the exact profile version's mapping rule that produced it"), duplicating a fact already fully determined by `import_job_id → import_job.import_profile_version_id`: exactly one Import Job produces this row, that Import Job pins exactly one Import Profile Version, and every normalized value that Import Job produces was necessarily mapped using that same version — there is no scenario in this proposal's design where a single Import Job applies two different profile versions to different rows it produces. As with the identical Sprint 3B.3 correction on the four canonical snapshot headers, this proposal now derives the fact exclusively through `import_job_id`, never storing it a second time.

**`target_table`/`target_record_id` have been removed entirely (Sprint 3B.1 Correction 7).** Sprint 3B used these two columns as a soft, non-FK reference to whichever canonical snapshot row a normalized value eventually fed into, reasoning that the normalized value is created before its target snapshot row necessarily exists. **This reasoning does not justify a soft reference:** creation order is not a valid reason to avoid a foreign key, because the normalized value can be (and now is) created first with **no target reference of any kind**, and a separate typed link-table row is inserted **after** the canonical target row exists — at which point a real, enforced foreign key is always satisfiable. See the typed link tables below.

**Uniqueness:** `UNIQUE (import_source_row_id, canonical_field_name)` — one normalized value per canonical field per source row. `UNIQUE (organization_id, id)` (Sprint 3B.2) — supports `import_validation_issue`'s plain-normalized-value-existence needs. `UNIQUE (organization_id, import_source_row_id, id)` (Sprint 3B.3) — supports `import_validation_issue`'s same-source-row composite FK. **`UNIQUE (organization_id, import_job_id, id)`** (**new, Sprint 3B.4 Correction 2**) — supports the four typed link tables' strengthened same-Import-Job composite FKs below. Four distinct uniqueness constraints, each serving a different consumer, none redundant.

### `import_normalized_value_revenue_snapshot` / `..._payroll_snapshot` / `..._labor_model_snapshot` / `..._backlog_snapshot`

Four typed link tables, one per header snapshot type, each with `organization_id UUID` (Sprint 3B.2) + `import_job_id UUID` (**new, Sprint 3B.4 Correction 2**) + `import_normalized_value_id UUID` + `<type>_snapshot_id UUID`, composite PK on the latter two columns (`import_normalized_value_id`, `<type>_snapshot_id` — unchanged; `organization_id` and `import_job_id` are supporting columns, not part of the PK).

**Composite FKs, strengthened (Sprint 3B.4 Correction 2):** `(organization_id, import_job_id, import_normalized_value_id) → import_normalized_value (organization_id, import_job_id, id)` and `(organization_id, import_job_id, <type>_snapshot_id) → <type>_snapshot (organization_id, import_job_id, id)` — replacing the Sprint 3B.2 organization-only versions. **This is the correction that actually closes the gap named in Sprint 3B.4's authorizing instruction:** a canonical snapshot that declares one producing Import Job must not cite source rows or normalized values from another Import Job, even within the same organization. Before this correction, two normalized values produced by two entirely different Import Jobs for the same organization could both be linked to the same snapshot header, or a normalized value from Import Job A could be linked to a snapshot header whose own `import_job_id` was Import Job B — organization-matching alone did not catch either case. Requires the four canonical snapshot header tables (`revenue_snapshot`, `payroll_snapshot`, `labor_model_snapshot`, `backlog_snapshot`) to each additionally expose `UNIQUE (organization_id, import_job_id, id)` — see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) and [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) for the added parent keys. For `backlog_snapshot`, whose `import_job_id` is nullable (manual entries have `NULL`), this composite FK is simply never satisfiable — and therefore never exercised — for a manually-entered header, which is the correct behavior: a manually-entered Backlog Snapshot has no normalized-value aggregation path at all.

Populated **once the header snapshot row is committed** — the header aggregates values from potentially many source rows (for example, `payroll_snapshot.qualifying_payroll_expense` sums several `payroll_snapshot_line_item` rows, each ultimately traceable through its own `import_source_row_id`), so a many-normalized-values-to-one-header relationship needs a join table, not a single FK column on either side.

**Why detail rows don't need this indirection.** `payroll_snapshot_line_item`, `labor_model_staffing_measure`, and `backlog_stage_count` each carry a **direct** `import_source_row_id` foreign key instead of going through `import_normalized_value` at all (see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md)) — because each of those rows is produced by exactly **one** source row, the indirection through a normalized-value table adds no traceability value; a direct FK is simpler and equally enforced. `import_normalized_value` and its typed link tables exist specifically for the **header-level, many-source-rows-to-one-aggregate** case, where a direct 1:1 FK cannot represent the relationship.

### Detail Tables — Same-Import-Job Enforcement (Sprint 3B.4 Correction 2)

`payroll_snapshot_line_item`, `labor_model_staffing_measure`, and the imported path of `backlog_stage_count` (see [`03-column-and-type-catalog.md`](03-column-and-type-catalog.md) for full column lists) each already carried, as of Sprint 3B.2, a same-**organization** composite FK to both their own snapshot header and their producing `import_source_row`. That guaranteed organization agreement between the two, but not that the header and the source row were produced by the **same Import Job** — a header from Import Job A could, before this correction, have a detail row citing a source row from Import Job B, provided both jobs belonged to the same organization.

**Corrected, applying the same technique already used for Scenario-version binding (see "Binding Scenario Values to the Run's Exact Definition Version" in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md)):** each detail table gains its own denormalized `import_job_id`, and **two** composite FKs sharing that same column value:

- `(organization_id, import_job_id, <header>_id) → <header> (organization_id, import_job_id, id)` — the detail row's declared Import Job matches its own header's Import Job.
- `(organization_id, import_job_id, import_source_row_id) → import_source_row (organization_id, import_job_id, id)` — the detail row's declared Import Job matches its cited source row's Import Job.

Because both composite FKs reference the **same** `import_job_id` value on the child row, PostgreSQL enforcing both simultaneously transitively guarantees the header's Import Job and the source row's Import Job are identical — exactly the same "shared value across two composite FKs" principle already established for Scenario Runs, applied here to detail-row lineage instead.

**`backlog_stage_count` needs an additional, honest exception for the manual-entry path**, since (unlike `payroll_snapshot_line_item`/`labor_model_staffing_measure`, which are always produced by an import) a Backlog Stage Count may legitimately have no Import Job at all:

| Column | Type | Notes |
|---|---|---|
| `import_job_id` | `UUID` | **New (Sprint 3B.4 Correction 2), nullable** — mirrors `backlog_snapshot.import_job_id`'s own nullability for the manual-entry case |

**Source-shape `CHECK` (new, Sprint 3B.4 Correction 2):** `CHECK ((import_job_id IS NOT NULL AND import_source_row_id IS NOT NULL) OR (import_job_id IS NULL AND import_source_row_id IS NULL))` — a stage count is either fully imported (both populated) or fully manual (both `NULL`); a mixed state (one populated, one not) is now rejected at the database level, not merely discouraged by convention.

**Composite FKs (checked only when populated, via PostgreSQL's default `MATCH SIMPLE` foreign-key semantics — any `NULL` column in a composite FK skips enforcement for that row):** `(organization_id, import_job_id, backlog_snapshot_id) → backlog_snapshot (organization_id, import_job_id, id)` and `(organization_id, import_job_id, import_source_row_id) → import_source_row (organization_id, import_job_id, id)`, **in addition to** the unconditional, always-enforced `(organization_id, backlog_snapshot_id) → backlog_snapshot (organization_id, id)` base FK (Sprint 3B.2) that applies regardless of `import_job_id`'s nullability. For a manual stage count (`import_job_id IS NULL`), the two new composite FKs are simply not evaluated — exactly the desired behavior, since there is no Import Job to validate against. For an imported stage count, both are evaluated and require the header and the source row to share this row's exact declared Import Job.

**One honest remaining gap (added to the Sprint 3C trigger inventory, not silently left undocumented):** "a manually-entered `backlog_stage_count` (`import_job_id IS NULL`) must belong to a manually-entered `backlog_snapshot` (`backlog_snapshot.import_job_id IS NULL`), never an imported one" cannot be expressed as a `CHECK` (which cannot see another table's row) or as a composite FK (`MATCH SIMPLE` skips the check entirely when the child's `import_job_id` is `NULL`, and there is no PostgreSQL declarative mechanism that instead requires "the referenced row's own column must *also* be null"). This specific cross-row consistency rule requires a Sprint 3C trigger. It is a narrower, more specific instance of the same category of gap already named in [`04-keys-relationships-and-constraints.md`](04-keys-relationships-and-constraints.md) "What Remains Genuinely Open for Sprint 3C" (cross-row consistency rules a plain constraint cannot express) — added there as a new, seventh item by this correction.

## Why a Row Hash Alone Is Not the Lineage Mechanism

`import_source_row.row_hash` and `import_job.source_file_hash` exist **only** for integrity verification and duplicate-upload detection (e.g., "was this exact file already imported?"). They are explicitly **not** how a dashboard value traces back to its source, per the founder's constraint. The actual lineage mechanism is the fully relational chain of foreign keys above — every step is a real, joinable, enforced reference, so tracing a value never depends on a hash matching or an external lookup.

## Import-Provenance Integrity Matrix (Sprint 3B.4 Correction 6, extended Sprint 3B.4A)

Sprint 3B.1 stated "every arrow in this chain is now an enforced foreign key" after removing the one polymorphic soft reference. That statement was true as far as it went, but incomplete: an "enforced foreign key" can still enforce only *organization* agreement while silently permitting a *different Import Job* (or, in one case, a duplicated *Profile Version* fact, or a *mixed* manual/imported Backlog lineage) to slip through. Sprint 3B.4A closes one further, more specific gap: an Import Job's *supersession chain* enforced only same-Organization, permitting an unrelated Import Profile to slip into the same chain, and nothing anywhere verified that an Import Job's normalization target actually matched what its Profile Version was declared to produce. This matrix states, per relationship, exactly which dimensions are actually enforced as of Sprint 3B.4A — this is now the complete, honest replacement for the earlier, less precise claims.

| Child record | Parent/target record | Organization | Import Job | Source row | Profile version | Target compatibility | Manual-entry exception |
|---|---|---|---|---|---|---|---|
| `import_source_section` | `import_job` | ✅ | — (defines it) | — | — | — | — |
| `import_source_row` | `import_source_section` | ✅ | ✅ **[3B.4]** | — | — | — | — |
| `import_validation_result` | `import_source_row` | ✅ | *(transitively unambiguous — see note below)* | ✅ (1:1, `UNIQUE (import_source_row_id)`) **[3B.4]** | — | — | — |
| `import_validation_issue` | `import_validation_result` | ✅ | *(transitively unambiguous)* | ✅ (exact match, composite FK) **[3B.4]** | — | — | — |
| `import_validation_issue` | `import_normalized_value` | ✅ | *(transitively unambiguous)* | ✅ (same source row as parent result) **[3B.3, reaffirmed 3B.4]** | — | — | — |
| `import_normalized_value` | `import_source_row` | ✅ | ✅ **[3B.4]** | ✅ (direct FK) | — (derived via Import Job, column removed) **[3B.4]** | *(inherited from header — see below)* | — |
| `import_normalized_value_<type>_snapshot` (×4) | `import_normalized_value` | ✅ | ✅ **[3B.4]** | *(via normalized value)* | — | *(inherited from header)* **[3B.4A]** | Never satisfiable for a manual header — see above |
| `import_normalized_value_<type>_snapshot` (×4) | `<type>_snapshot` | ✅ | ✅ **[3B.4]** | *(via normalized value)* | — | *(inherited from header)* **[3B.4A]** | Same |
| `payroll_snapshot_line_item` | `payroll_snapshot` | ✅ | ✅ **[3B.4]** | *(header is not itself a source row)* | — | *(inherited from header)* **[3B.4A]** | Not applicable — Payroll is always imported |
| `payroll_snapshot_line_item` | `import_source_row` | ✅ | ✅ **[3B.4]** | ✅ (direct FK) | — | *(inherited from header)* | Not applicable |
| `labor_model_staffing_measure` | `labor_model_snapshot` / `import_source_row` | ✅ | ✅ **[3B.4]** | ✅ (direct FK) | — | *(inherited from header)* **[3B.4A]** | Not applicable — Labor Model is always imported |
| `backlog_stage_count` | `backlog_snapshot` | ✅ | ✅ when imported **[3B.4]**; skipped (by design) when manual | ✅ when imported; `NULL` when manual | — | *(inherited from header)* **[3B.4A]** | ✅ same-row `CHECK` rules out a mixed imported/manual state; the *cross-row* "manual count ↔ manual header" pairing remains a named Sprint 3C trigger |
| `backlog_stage_count` | `import_source_row` | ✅ when imported | ✅ when imported **[3B.4]** | ✅ (direct FK) when imported | — | *(inherited from header)* | `NULL` when manual |
| `{revenue,payroll,labor_model}_snapshot` | `import_job` | ✅ | ✅ (defines it) | — | Derived, not duplicated **[3B.3]** | ✅ Sprint 3C trigger, per profile version's declared permitted-target set **[3B.4A Correction 2]** | Not applicable — always imported |
| `backlog_snapshot` | `import_job` | ✅ | ✅ (defines it, nullable) | — | Not applicable (Backlog has no header-level profile-version fact) | ✅ Sprint 3C trigger, when imported **[3B.4A Correction 2]** | ✅ same-row `CHECK`, `import_job_id` XOR `manual_entry_user_id` **[3B.3]**; exempt from target-compatibility trigger when manual |
| `import_job` | `organization_import_profile_override` | ✅ | *(defines it)* | — | ✅ exact match **[3B.4]** | Not applicable | — |
| `import_job` (self, `supersedes_import_job_id`) | `import_job` | ✅ | ✅ same base `import_profile_id` required **[3B.4A Correction 1]** (declarative composite FK); profile-*version* equality deliberately not required — see judgment call above; cycle-freedom is a named Sprint 3C trigger (`uploaded_at` strictly earlier), same pattern as Recommendation supersession | — | — | Not applicable | — |
| `payroll_snapshot` | `organization_import_profile_override` (account mapping) | *(column removed — derived via `import_job`)* **[3B.4 Correction 5]** | | | | | |

**Note on "transitively unambiguous" Import Job entries above:** `import_validation_result` and `import_validation_issue` do not carry their own denormalized `import_job_id` column — this was a deliberate scope decision (see Correction 2 above), not an oversight, because `UNIQUE (import_source_row_id)` (Correction 1) already guarantees exactly one Validation Result per source row, and a source row belongs to exactly one Import Job; there is no possible ambiguity for a trigger or composite FK to resolve, so adding the column would be a redundant fact with no integrity value, not a genuine additional guarantee.

**Note on "inherited from header" Target compatibility entries:** the four typed link tables and the three imported-path detail tables do not carry their own target-compatibility check — see "Import Profile Normalization-Target Compatibility" above for why this is a deliberate inheritance through the same-Import-Job composite FK, not an oversight.

## What This Document Does Not Define

- Physical storage location/format for the archived raw file itself (S3-compatible object storage via Supabase Storage is the likely candidate, per [ADR-001](../decisions/ADR-001-nextjs-and-supabase.md), but not decided here).
- Compression or cold-storage tiering.
- The exact validation rule content per Import Profile (profile-specific, defined inside each profile's own version, not this schema).

## Related Documents

- [Import Persistence](../data-model/import-persistence.md)
- [Import Framework](../imports/01-import-framework.md)
- [Import Validation](../imports/05-import-validation.md)
- [Data Normalization](../imports/04-data-normalization.md)
- [Table Catalog](02-table-catalog.md)
- [Sprint 3B.1 Review Corrections](../development/SPRINT_3B_1_REVIEW_CORRECTIONS.md)
- [Sprint 3B.3 Final Constraint Completion](../development/SPRINT_3B_3_FINAL_CONSTRAINT_COMPLETION.md)
- [Sprint 3B.4 Import Provenance Closure](../development/SPRINT_3B_4_IMPORT_PROVENANCE_CLOSURE.md)
- [Sprint 3B.4A Final Reconciliation](../development/SPRINT_3B_4A_FINAL_RECONCILIATION.md)
