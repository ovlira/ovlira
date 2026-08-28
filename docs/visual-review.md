# Human visual review

This is the approval protocol for the six shipped recipe starters. It is a design review, not a request for an agent to redesign the catalogue. Review the generated screen as a user would see it, record defects, and leave component source unchanged while deciding whether the fixture passes.

## What a reviewer signs off

Approve a recipe only when it is clear, legible, and coherent at all three widths; its required states are understandable; keyboard focus and labels are usable; and the default and contrasting themes both retain the intended hierarchy. A review can reject a fixture without proposing a replacement design. Record the smallest concrete issue for the catalogue owner to address.

Use these decisions:

- **Pass** — no blocker and no unresolved visual inconsistency that would make this a poor starting point.
- **Revise** — the recipe is usable, but hierarchy, spacing, type, color, or responsive behavior needs a catalogue change.
- **Block** — a task cannot be completed or understood, content is clipped or unreadable, a required state is missing, or keyboard/accessibility behavior fails.

## Prepare fresh fixtures

Run this from the Ovlira checkout. The commands create disposable projects, so the review does not depend on an adapted application or local edits.

```bash
npm install
npm run build

OVLIRA_REPO="$(pwd)"
REVIEW_ROOT="$(mktemp -d /tmp/ovlira-visual-review.XXXXXX)"

node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/settings"
node "$OVLIRA_REPO/dist/cli/index.js" add page.settings --cwd "$REVIEW_ROOT/settings"
node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/search"
node "$OVLIRA_REPO/dist/cli/index.js" add page.search --cwd "$REVIEW_ROOT/search"
node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/crud"
node "$OVLIRA_REPO/dist/cli/index.js" add page.crud-table --cwd "$REVIEW_ROOT/crud"
node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/detail"
node "$OVLIRA_REPO/dist/cli/index.js" add page.detail --cwd "$REVIEW_ROOT/detail"
node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/empty"
node "$OVLIRA_REPO/dist/cli/index.js" add state.empty --cwd "$REVIEW_ROOT/empty"
node "$OVLIRA_REPO/dist/cli/index.js" init "$REVIEW_ROOT/shell"
node "$OVLIRA_REPO/dist/cli/index.js" add shell.application --cwd "$REVIEW_ROOT/shell"

for project in "$REVIEW_ROOT"/*; do
  (cd "$project" && npm install && npm run build)
done
```

The checkout root intentionally has no `dev` script: it is the Ovlira CLI package. Keep this terminal session open so `REVIEW_ROOT` remains defined, then start a fixture from its generated project directory and open the printed local URL:

```bash
cd "$REVIEW_ROOT/settings"
npm run dev
```

If you are still at the checkout root, the equivalent explicit command is:

```bash
npm --prefix "$REVIEW_ROOT/settings" run dev
```

Replace `settings` with `search`, `crud`, `detail`, `empty`, or `shell` for the other fixtures. Keep `REVIEW_ROOT` until the review is complete; remove only that exact temporary directory afterward with `rm -rf "$REVIEW_ROOT"`.

## Review sequence

Use a browser viewport of 1440 × 900, 768 × 1024, and 375 × 812. The middle width is deliberately below the shell's 56rem breakpoint; the narrow width catches wrapping and touch-target problems.

For each recipe:

1. At the wide width, identify the primary task in five seconds. Check hierarchy, grouping, alignment, readable line length, and whether secondary actions stay secondary.
2. At the middle and narrow widths, check that no text, control, state switcher, navigation item, table column, or action is clipped or horizontally stranded. Resize while the page is populated, not only when empty.
3. Use the state controls in the generated fixture. Verify that exactly one state is visible, the selected control is announced with `aria-pressed`, and the message and next action match the state.
4. Tab through the whole screen. Confirm a visible focus ring, sensible order, real labels for inputs/selects, keyboard-operable buttons and links, and no focus trap. Use a screen reader if available for the final decision.
5. Repeat the wide and narrow checks with a deliberately contrasting theme. Edit only the project's `src/styles/ovlira-theme.css`; do not edit copied component files or `src/styles.css` for this pass.
6. Record the decision, viewport, state, theme, and evidence before moving to the next fixture.

The generated state controls are:

| Recipe | States to inspect |
| --- | --- |
| `page.settings` | Saved, Loading, Error |
| `page.search` | Results, Loading, Empty, Error |
| `page.crud-table` | Records, Loading, Empty, Error, Saved |
| `page.detail` | Ready, Loading, Error |
| `state.empty` | Empty (no switcher; confirm the one next action) |
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

The second pass only needs to prove the theme seam, not establish a new brand. In the copied theme file, change semantic roles together so the screen has a clearly different character. For example:

```css
:root {
  --ov-color-canvas: #111820;
  --ov-color-surface: #1a2430;
  --ov-color-surface-raised: #243243;
  --ov-color-ink: #f7fbff;
  --ov-color-muted: #bfd0d8;
  --ov-color-line: #5c7080;
  --ov-color-accent: #6d5efc;
  --ov-color-accent-strong: #8fc7ff;
  --ov-color-info: #24527a;
  --ov-color-success: #1d5c48;
  --ov-color-warning: #775112;
  --ov-color-danger: #7a2d3d;
  --ov-font-sans: Georgia, 'Times New Roman', serif;
  --ov-font-mono: 'SFMono-Regular', Consolas, monospace;
  --ov-radius-sm: 0;
  --ov-radius-md: 0.25rem;
  --ov-radius-lg: 0.5rem;
}
```

The exact values may change during design review. The acceptance question is whether the palette, typography, and shape language change globally while labels, states, and layout remain coherent. Check the contrasting theme at 1440px and 375px at minimum.

## Evidence record

Copy this table into the review issue or pull request and attach screenshots for every **Revise** or **Block** result. One wide and one narrow screenshot is enough for a passing recipe; include the middle width when the decision depends on the breakpoint.

| Recipe | Theme | Viewport | States exercised | Decision | Evidence / issue |
| --- | --- | --- | --- | --- | --- |
| `page.settings` | Default | 1440 / 768 / 375 | Saved, Loading, Error |  |  |
| `page.search` | Default | 1440 / 768 / 375 | Results, Loading, Empty, Error |  |  |
| `page.crud-table` | Default | 1440 / 768 / 375 | Records, Loading, Empty, Error, Saved |  |  |
| `page.detail` | Default | 1440 / 768 / 375 | Ready, Loading, Error |  |  |
| `state.empty` | Default | 1440 / 768 / 375 | Empty |  |  |
| `shell.application` | Default | 1440 / 768 / 375 | Default shell |  |  |
| All six | Contrasting | 1440 / 375 | Representative default + required states |  |  |

The v0.3 visual exit criterion is six **Pass** decisions at the three widths plus a passing contrasting-theme pass. A failed review should produce a small catalogue fix or an explicit decision to defer; it should not expand the roadmap into a visual editor or an agent styling project.
