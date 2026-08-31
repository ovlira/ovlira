# Contrasting theme handoff

The contrasting theme is the one remaining designer-owned input for the v0.3 visual exit criterion. It is not another prompt, an automatic dark-mode inversion, or an agent-selected palette. It is a small approved theme artifact that changes the character of the same fixtures without changing their anatomy or behavior.

## Required deliverable

Provide one CSS file, for example `docs/design/ovlira-contrast-theme.css`, that overrides the semantic surface used by [`src/tokens/tokens.css`](../../src/tokens/tokens.css):

- `--ov-bg`, `--ov-surface`, `--ov-surface-raised`, `--ov-text`, `--ov-muted`, and `--ov-faint`;
- `--ov-border`, `--ov-hover`, and `--ov-focus`;
- `--ov-info`, `--ov-good`, `--ov-warn`, and `--ov-bad`; and
- any intentional font, radius, density, or motion changes through the existing `--ov-*` contract.

The file should be applied with a named selector such as `:root[data-theme="contrast"]`. It must not require edits to component source or recipe markup. If the contrast is only chromatic, leave typography, radius, density, and motion unchanged rather than copying unnecessary values.

## Evidence to attach

Capture the six canonical fixtures at 1440 × 900 and 375 × 812 at minimum; 768 × 1024 is recommended. Include the default state plus each recipe's required states where the change affects legibility or hierarchy. Record the designer, date, intent, and Pass/Revise/Block decision in the review issue.

After approval, the agent will:

1. add the named theme to `reference-manifest.json`;
2. add `contrast` to the theme selector in the review and reference harnesses;
3. capture Playwright baselines for the same fixture/state/viewport matrix; and
4. run the existing interaction, axe, overflow, touch-target, and screenshot gates.

The agent may report a contrast failure or wire the artifact into the harness. It may not choose replacement values or call the default dark scheme a contrasting theme.
