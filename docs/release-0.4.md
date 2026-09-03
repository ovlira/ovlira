# 0.4 release evidence

0.4 should prove local installation and bounded composition, not expand the catalogue.

## Release hardening

- Fresh tarball npm installation, local CLI search/inspect/init/add/check, production build, and clean reinstall are exercised by `scripts/package-smoke.mjs` on both Node CI versions.
- Repeated-use coverage must preserve edited application data, action handlers, navigation, theme, and recipe registration. Re-adding an adapted recipe should report a conflict at its registered path, not register a fresh copy elsewhere.
- Browser CI builds workspace packages before consumers.
- Full release gate must pass from a clean checkout before tagging.

## Visual review pending

Release-check run on 2026-09-03: package checks and fresh-install smoke passed; the main browser suite passed 187/187; the component matrix passed 151/153. The only remaining failures were the two narrow overview comparisons below. This is not a green release gate.

After adding the domain rehearsal, the expanded main browser suite passed 199/199 (including all 12 domain/theme/viewport cases). The component matrix remained 151/153, with the same two overview differences. Unit/evaluation tests passed 72/72. The preparation work is tracked in GitHub PR #5; publication remains blocked, and package versions are intentionally unchanged.

The narrow catalogue overview in light and dark is 36px taller than its approved baseline because the navigation wraps instead of clipping Validation. This follows DESIGN.md's responsive navigation rule, but the two changed component-review overview images still require human approval. Do not blanket-update snapshots or approve component styling to clear this gate.

The earlier date-input failure was a browser page-setup timeout. The accordion dark capture was light; setting the persisted theme before navigation fixes the test setup. Both focused checks passed without baseline changes on 2026-09-03.

## Adaptation rehearsal and outstanding benchmark

`examples/adaptation` now contains an agent-authored CRUD adaptation for all three domains below, using the generated stylesheet and theme unchanged. `tests/browser/adaptation.spec.ts` exercises validation, keyboard creation, failed-read retry, empty recovery, safe text rendering, record navigation, browser Back, accessibility, and overflow in both themes at 375px and 1440px. This is a shared implementation tested twelve ways, **not twelve independent agent implementations**. Independent scored runs remain outstanding.

Observed friction: `ov-data-table` has no public record-link or row-action interface, despite the recipe listing navigation as an extension point. The rehearsal uses an approved selector plus explicit Open action; it does not modify component styling or inject actions into shadow DOM. The generated starter also permits blank names and hides the collection after creation; the adapted application implements validation and preserves the collection beside success feedback.

The existing 12/12 result measures selection plus harness-executed generation. It is not evidence of autonomous domain adaptation.

Use `page.crud-table` for these three tasks, with identical evaluation rules:

1. Customer records: list customer name, owner and lifecycle stage; create a customer with validation; open a customer record and return to the list.
2. Equipment inventory: list asset name, location and availability; create an asset with validation; open an asset record and return to the list.
3. Editorial content: list article title, editor and publication status; create an article with validation; open an article record and return to the list.

Use deterministic local data and simulated asynchronous operations. No external service or credentials are needed. Give the agent the task and design authority, not a preselected command plan. Preserve its command trace and final source diff.

### Acceptance per run

- Agent discovers and inspects the approved recipe before implementation.
- Creation changes the rendered collection; invalid input does not create a record.
- Record navigation and browser Back work.
- Loading, empty, error/retry, and successful creation are observable through interactions, not just state markers.
- Data remains intact after navigating away and back within the session.
- Production build and Ovlira check pass; keyboard checks and automated accessibility checks pass.
- Render and inspect at 375px and 1440px in both themes.
- No component source, base styling, or design-authority changes.
- Reinitialization and repeated add preserve adapted source and theme byte-for-byte; expected conflicts are acceptable, silent replacement is not.

Start with one run in each domain. Repair evidenced recipe/descriptor/validator friction, then freeze the task set and run each four times. Require at least 11/12 successful runs, zero data-loss failures, and the existing CLI response budgets. Record model, commit, prompts, failures, artifacts, and human visual decisions. Report rehearsal and scored runs separately.

## Publication checklist

- Resolve visual review and complete adaptation evidence above.
- Update both package versions, CLI elements dependency, lockfile, and release notes together.
- Confirm publishing configuration for both package names; exercise candidate installation before tagging.
- Publish elements before CLI. Do not publish or tag as part of diagnostic work.
