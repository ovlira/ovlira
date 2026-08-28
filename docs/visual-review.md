# Human visual review

This is the approval protocol for the six shipped recipe starters. It is a design review, not a request for an agent to redesign the catalogue. Review the generated screen as a user would see it, record defects, and leave component source unchanged while deciding whether the fixture passes.

## What a reviewer signs off

Approve a recipe only when it is clear, legible, and coherent at all three widths; its required states are understandable; keyboard focus and labels are usable; and the default and contrasting themes both retain the intended hierarchy. A review can reject a fixture without proposing a replacement design. Record the smallest concrete issue for the catalogue owner to address.

Use these decisions:

- **Pass** — no blocker and no unresolved visual inconsistency that would make this a poor starting point.
- **Revise** — the recipe is usable, but hierarchy, spacing, type, color, or responsive behavior needs a catalogue change.
- **Block** — a task cannot be completed or understood, content is clipped or unreadable, a required state is missing, or keyboard/accessibility behavior fails.

## Prepare fresh fixtures

Run this from the Ovlira checkout. The commands create disposable projects under `reports/visual-review` (which is git-ignored), so the review does not depend on an adapted application or local edits. The first command removes only that generated review directory so stale files cannot cause conflicts.

```bash
cd "$(git rev-parse --show-toplevel)"
npm install
npm run build

rm -rf reports/visual-review
mkdir -p reports/visual-review

node dist/cli/index.js init reports/visual-review/settings
node dist/cli/index.js add page.settings --cwd reports/visual-review/settings
node dist/cli/index.js init reports/visual-review/search
node dist/cli/index.js add page.search --cwd reports/visual-review/search
node dist/cli/index.js init reports/visual-review/crud
node dist/cli/index.js add page.crud-table --cwd reports/visual-review/crud
node dist/cli/index.js init reports/visual-review/detail
node dist/cli/index.js add page.detail --cwd reports/visual-review/detail
node dist/cli/index.js init reports/visual-review/empty
node dist/cli/index.js add state.empty --cwd reports/visual-review/empty
node dist/cli/index.js init reports/visual-review/shell
node dist/cli/index.js add shell.application --cwd reports/visual-review/shell

for project in reports/visual-review/*; do
  (cd "$project" && npm install && npm run build)
done
```

The checkout root intentionally has no `dev` script: it is the Ovlira CLI package. Start a fixture with its exact path:

```bash
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/settings" run dev
```

Stop the server with `Ctrl-C`. Start another fixture by changing only the final directory name:

```bash
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/search" run dev
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/crud" run dev
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/detail" run dev
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/empty" run dev
npm --prefix "$(git rev-parse --show-toplevel)/reports/visual-review/shell" run dev
```

If npm reports `/settings/package.json` or another missing `package.json`, the fixtures have not been prepared in this checkout. Rerun the single preparation block above, then run one of the exact commands above. Do not type a placeholder path.

The generated fixtures remain at `reports/visual-review` across terminal sessions. Remove only that directory after the review with `rm -rf reports/visual-review`.

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
