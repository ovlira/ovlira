# Human visual review

This is the approval protocol for the six shipped recipe starters. It is a design review, not a request for an agent to redesign the catalogue. Review the generated screen as a user would see it, record defects, and leave component source unchanged while deciding whether the fixture passes.

The focused candidate workflow for individual catalogue components is documented separately in [`design/component-visual-review.md`](./design/component-visual-review.md).

The agent scope ends at fixture wiring, behavior, accessibility checks, and evidence capture. Only a human designer may choose new visual direction or approve changes to the theme, component styling, or screenshot baselines. The current reference package is indexed in [`design/reference-manifest.json`](./design/reference-manifest.json).

## What a reviewer signs off

Approve a recipe only when it is clear, legible, and coherent at all three widths; its required states are understandable; keyboard focus and labels are usable; and the default and designer-supplied contrasting themes both retain the intended hierarchy. A review can reject a fixture without proposing a replacement design. Record the smallest concrete issue for the catalogue owner to address.

Use these decisions:

- **Pass** — no blocker and no unresolved visual inconsistency that would make this a poor starting point.
- **Revise** — the recipe is usable, but hierarchy, spacing, type, color, or responsive behavior needs a catalogue change.
- **Block** — a task cannot be completed or understood, content is clipped or unreadable, a required state is missing, or keyboard/accessibility behavior fails.

## Start the single review app

Use one Vite app for the entire behavior review. It lives in `examples/visual-review`, imports the shipped components, token export, and approved [`ovlira-contrast-theme.css`](./design/ovlira-contrast-theme.css) directly, and provides recipe navigation, state controls, and baseline interactions. No per-recipe `init`, `add`, or `npm install` is needed.

From the Ovlira checkout, run this exact block:

```bash
cd "$(git rev-parse --show-toplevel)"
npm install
npm run build
npm run review:visual:build
npm run review:visual
```

Open the local URL printed by Vite. Leave that one server running while you switch between Settings, Search, CRUD table, Detail, Empty state, and Application shell in the left navigation. Stop it with `Ctrl-C` when the review is complete.

The app's baseline interactions are deliberately small but observable: save settings shows a success state, search filters the sample rows, CRUD creates a new row, detail edits the record name, Empty state reveals a created result, and shell navigation changes the page context. CLI-generated starters use the same canonical fixture markup and expose the same action seams.

If you see `Missing script: "dev"`, you are in the checkout root or an old per-recipe fixture. Run `npm run review:visual` from the checkout root instead. The generated `init` projects still contain their own `dev` script, but they are no longer the review workflow.

The review app is the canonical review surface for this phase. Generated recipe starters remain a separate output contract, but both paths import the same fixture definitions from `src/recipes/fixtures.ts` so the compositions cannot silently drift.

## Automated gates

Install the pinned Chromium build once, then run the browser gates:

```bash
npx playwright install chromium
npm run test:browser
npm run test:visual
```

`test:browser` covers baseline interactions, axe WCAG checks in light, dark, and contrast themes, horizontal overflow at all three widths, and 44px touch targets at 375px. `test:visual` compares every default state in all three themes at all three widths and every additional required state at 1440px.

`npm run test:visual:update` creates candidate baselines. It is not an approval action. A human reviews those images, records the decision, and then changes `baselineStatus` in [`design/reference-manifest.json`](./design/reference-manifest.json) to `approved` in the same reviewed change. Intentional visual changes repeat that process; agents must not refresh snapshots merely to make a failed comparison pass.

## Review sequence

Use a browser viewport of 1440 × 900, 768 × 1024, and 375 × 812. The middle width exercises the compact desktop boundary; the narrow width catches wrapping and touch-target problems.

For each recipe:

1. At the wide width, identify the primary task in five seconds. Check hierarchy, grouping, alignment, readable line length, and whether secondary actions stay secondary.
2. At the middle and narrow widths, check that no text, control, state switcher, navigation item, table column, or action is clipped or horizontally stranded. Resize while the page is populated, not only when empty.
3. Use the state controls in the generated fixture. Verify that exactly one state is visible, the selected control is announced with `aria-pressed`, and the message and next action match the state.
4. Tab through the whole screen. Confirm a visible focus ring, sensible order, real labels for inputs/selects, keyboard-operable buttons and links, and no focus trap. Use a screen reader if available for the final decision.
5. Repeat the wide and narrow checks with the contrasting theme supplied by the designer. Apply only that approved theme file; do not ask an agent to invent palette, typography, radius, or density values.
6. Record the decision, viewport, state, theme, and evidence before moving to the next fixture.

The generated state controls are:

| Recipe | States to inspect |
| --- | --- |
| `page.settings` | Saved, Loading, Error |
| `page.search` | Results, Loading, Empty, Error |
| `page.crud-table` | Records, Loading, Empty, Error, Saved |
| `page.detail` | Ready, Loading, Error |
| `state.empty` | Empty, then the observable Success result from its one next action |
| `shell.application` | Default shell (no state switcher; check nav and overview) |

## What to look for

Use the following short checklist. It is intentionally focused on the things static validation cannot prove.

- **Task and hierarchy:** one obvious page purpose; one clear primary action per task region; headings and supporting copy explain what happens next; empty and error states offer a useful next action.
- **Layout:** related items are grouped; group gaps are visibly larger than within-group gaps; cards, controls, and tables align; no fixed text container causes overflow; the shell remains navigable on touch widths.
- **Typography:** headings do not collide or wrap awkwardly; body text is comfortable to read; labels, values, and metadata have a clear order; long IDs or links remain available rather than silently truncating.
- **Color and theme:** text and controls remain legible against every surface; status is not communicated by color alone; the accent has a deliberate role; changing the theme changes the character of the screen without editing components.
- **Interaction:** controls have an obvious hover/pressed/focus state; state changes are interruptible and understandable; destructive-looking actions are not beside the primary action unless the recipe explicitly calls for them.
- **Accessibility:** semantic buttons and links behave as expected; hit areas are comfortable at 375px; focus is never removed; loading and routine updates read as status, while urgent errors are distinct.

If a check fails because a visual value is hard-coded in a component or recipe style, note the value and file as a catalogue contract issue. Do not “fix” it by adding arbitrary values to the fixture.

## Contrasting theme pass

The second pass is designer-owned. The approved contrasting artifact is [`design/ovlira-contrast-theme.css`](./design/ovlira-contrast-theme.css); the agent only applies it and verifies that palette, shape language, and density change globally while labels, states, and layout remain coherent. Check the approved theme at 1440px and 375px at minimum.

The artifact and its generated recipe/reference screenshots received explicit Pass decisions on 2026-08-31. Their content digests are release-tested; any intentional change requires a new candidate generation and human review.

## Evidence record

Copy this table into the review issue or pull request and attach screenshots for every **Revise** or **Block** result. One wide and one narrow screenshot is enough for a passing recipe; include the middle width when the decision depends on the breakpoint.

| Recipe | Theme | Viewport | States exercised | Decision | Evidence / issue |
| --- | --- | --- | --- | --- | --- |
| `page.settings` | Default | 1440 / 768 / 375 | Saved, Loading, Error |  |  |
| `page.search` | Default | 1440 / 768 / 375 | Results, Loading, Empty, Error |  |  |
| `page.crud-table` | Default | 1440 / 768 / 375 | Records, Loading, Empty, Error, Saved |  |  |
| `page.detail` | Default | 1440 / 768 / 375 | Ready, Loading, Error |  |  |
| `state.empty` | Default | 1440 / 768 / 375 | Empty, Success |  |  |
| `shell.application` | Default | 1440 / 768 / 375 | Default shell |  |  |
| All six | Contrasting | 1440 / 375 | Representative default + required states |  |  |

The v0.3 visual exit criterion is six **Pass** decisions at the three widths plus a passing contrasting-theme pass. A failed review should produce a small catalogue fix or an explicit decision to defer; it should not expand the roadmap into a visual editor or an agent styling project.
