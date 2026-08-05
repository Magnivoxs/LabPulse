# Gap Analysis: Legacy Application → Current Architecture

**Version:** 0.1
**Status:** Discovery
**Last Updated:** 2026-08-04

## Purpose

Compare what the legacy application actually built and validated in real use against what the current architecture has designed, and identify what is missing — prioritized so Sprint 3 (Database Design) can weigh which gaps matter most before schema work proceeds.

```text
Legacy Application (built, used, then paused)
  ↓
Current Architecture (designed, not yet implemented)
```

## Priority: Critical

### Numeric threshold conflicts

Legacy's alert thresholds for laboratory expense (>20%/>25%), personnel expense (>15%/>20%), and backlog (>50/>100) differ substantially from the four approved thresholds (10.8%, 8.0%, 20 cases, plus the $500 overtime trigger which legacy never implemented as a rule at all). **This must be resolved with the founder before Sprint 3 treats any threshold as a stable default**, since the schema's configuration/versioning design should accommodate whichever values are confirmed. See [03-business-rule-comparison.md](03-business-rule-comparison.md) items 1–3.

### Production/backlog stage taxonomy

Legacy has a fully worked-out, two-location (lab/clinic) backlog taxonomy with nine total stages, plus a separate eleven-category unit-tier/case-type taxonomy — all currently undocumented in LabPulse. This is the single most direct piece of evidence available for resolving OQ-049 (final production-stage taxonomy) and for defining the still-fieldless `BacklogSnapshot` and `ProductionSnapshot` entities. **Sprint 3 should not finalize these entities' fields without founder review of this taxonomy.**

## Priority: High

### Weekly-to-monthly aggregation rule

The Import Framework and Snapshot Strategy have no defined rule for rolling weekly source data up into a monthly snapshot. Legacy has a complete, working (if non-calendar-aligned) implementation. This gap directly affects how `ProductionSnapshot` and `BacklogSnapshot` update cadence should be designed (see [`docs/data-model/snapshot-strategy.md`](../data-model/snapshot-strategy.md), which currently lists both as "update frequency unconfirmed").

### Terminology reconciliation

`DFO`, `Lab Hub`, office `Model` (PO/PLLC), `Standardization Status`, and the `Personnel %` ↔ `Payroll Percentage` / `Lab Exp %` ↔ `Laboratory Expense Percentage` naming questions are all unresolved and touch fields that would otherwise be finalized in Sprint 3's Office and PayrollSnapshot schema. See [07-legacy-terminology.md](07-legacy-terminology.md).

### Missing metrics: Margin %, Outside Lab Spend (+ %), Data Completeness %

Three formulas with real, working implementations exist with no equivalent anywhere in the Metrics Dictionary. Each represents a real business need the founder already built once. See [04-formula-candidates.md](04-formula-candidates.md).

## Priority: Medium

### Missing workflow: Rankings

An entire page/workflow (rank offices by revenue, cases, average case value, or margin, with month navigation) exists in legacy with no equivalent anywhere in current product documentation. Related to, but distinct from, Location Comparison.

### Missing concept: Submission Compliance

Weekly submission-rate tracking with streaks is a fully realized (though partially broken — see below) legacy concept with no current equivalent. Worth product-level consideration, not just a data-model gap.

### Missing entity: Notes / journal

Legacy has a free-text monthly note per office, distinct from the current [Task](../entities/task.md) entity (which is action/owner/status/due-date oriented, not a journal). No current entity covers this.

### Missing UX pattern: previous-period comparison and copy-forward

A specific, validated interaction pattern (show last period's value inline, allow copying it forward) exists in legacy with no current specification.

### Missing dashboard dimensions: state, DFO, model as filters

Legacy filters offices by state (parsed from the office name), DFO, and model — three filter dimensions not present in current comparison/dashboard requirements.

## Priority: Low

### Office hard-delete with cascading removal

A real, working feature — but its underlying behavior conflicts with the immutability principle and should not be ported. Low priority specifically because the recommendation (reject, use Archive instead) is already clear; no further analysis is needed before Sprint 3.

### SQLite table-count sanity check

A legacy-only admin/debug tool tied to a single local database file. Not a gap worth prioritizing against a multi-tenant architecture; at most, informs a possible future "data health" admin view.

### Import row-count reporting inconsistency

A defect (not a design gap) — flagged so it is not replicated, requires no further architectural analysis.

### Orphaned `submission_compliance` table reference

`get_compliance_data` queries a table never defined in the reviewed migrations (`db.rs`). This is a gap *in the legacy code itself*, not evidence of a design LabPulse should follow — noted for completeness, not for adoption.

## Missing Reporting Capabilities Summary

Beyond the items above, legacy demonstrates two reporting concepts with no current equivalent at all:

- **Rankings** (comparative ordering by metric, with time-period navigation)
- **Compliance/submission reporting** (data-discipline tracking as its own first-class report, not just a dashboard freshness indicator)

Both are Medium priority: real and validated, but neither blocks Sprint 3 schema work the way the Critical/High items do.

## Related Documents

- [Business Rule Comparison](03-business-rule-comparison.md)
- [Formula Candidates](04-formula-candidates.md)
- [Feature Inventory](02-feature-inventory.md)
- [Reusable Concepts](09-reusable-concepts.md)
