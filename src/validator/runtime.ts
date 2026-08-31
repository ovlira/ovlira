import type { Diagnostic } from '../catalogue/types.js';

/**
 * The small DOM contract used by runtime-aware integrations.
 *
 * Ovlira deliberately does not start a browser from the core validator yet.
 * A browser adapter can render an app and pass its document (or a document
 * snapshot) to this pure function without changing the rule vocabulary.
 */
export interface RuntimeValidationOptions {
  /** Custom elements known to have been registered by the rendered app. */
  definedTags?: ReadonlySet<string>;
  /** States required by the selected recipe. */
  requiredStates?: readonly string[];
}

const controlSelector = 'input, select, textarea, [role="textbox"], [role="combobox"], ov-input, ov-select, ov-textarea, ov-checkbox';

export function validateRuntimeDocument(root: ParentNode, options: RuntimeValidationOptions = {}): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  validateRuntimeLabels(root, diagnostics);
  validateRuntimeHeadings(root, diagnostics);
  validateRuntimeStates(root, options.requiredStates ?? [], diagnostics);
  validateRuntimeActions(root, diagnostics);
  validateDefinedComponents(root, options.definedTags, diagnostics);
  return diagnostics;
}

function validateRuntimeLabels(root: ParentNode, diagnostics: Diagnostic[]) {
  for (const control of Array.from(root.querySelectorAll(controlSelector))) {
    if (accessibleName(control, root)) continue;
    diagnostics.push({
      ruleId: 'runtime.required-label',
      severity: 'error',
      message: `${control.tagName.toLowerCase()} has no accessible name in the rendered DOM.`,
      file: 'runtime',
      suggestion: 'Add a visible label, label attribute, aria-label, or aria-labelledby reference.',
    });
  }
}

function accessibleName(control: Element, root: ParentNode): string {
  const ariaLabel = control.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = control.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/).map((id) => root.querySelector(`#${escapeSelector(id)}`)?.textContent ?? '').join(' ').trim();
    if (text) return text;
  }

  const labelAttribute = control.getAttribute('label')?.trim();
  if (labelAttribute) return labelAttribute;

  const id = control.getAttribute('id');
  if (id) {
    const associated = root.querySelector(`label[for="${escapeAttribute(id)}"]`)?.textContent?.trim();
    if (associated) return associated;
  }

  const parentLabel = control.closest('label')?.textContent?.trim();
  if (parentLabel) return parentLabel;

  // A native button is not part of the control selector today, but the text
  // fallback makes this helper safe for adapters that add button-like roles.
  return control.textContent?.trim() ?? '';
}

function validateRuntimeHeadings(root: ParentNode, diagnostics: Diagnostic[]) {
  const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const levels = headings.map((heading) => Number(heading.tagName.slice(1)));
  if (levels[0] && levels[0] !== 1) diagnostics.push({
    ruleId: 'runtime.heading-start',
    severity: 'warning',
    message: `Rendered heading hierarchy starts at h${levels[0]}.`,
    file: 'runtime',
    suggestion: 'Start the main page hierarchy with one h1.',
  });
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] <= 1) continue;
    diagnostics.push({
      ruleId: 'runtime.heading-jump',
      severity: 'warning',
      message: `Rendered heading hierarchy jumps from h${levels[index - 1]} to h${levels[index]}.`,
      file: 'runtime',
      suggestion: 'Use the next heading level or restructure the section.',
    });
  }
}

function validateRuntimeStates(root: ParentNode, requiredStates: readonly string[], diagnostics: Diagnostic[]) {
  for (const state of requiredStates) {
    const selector = `[data-ovlira-state="${escapeAttribute(state)}"]`;
    if (root.querySelector(selector)) continue;
    diagnostics.push({
      ruleId: 'runtime.required-state',
      severity: 'error',
      message: `Rendered page is missing its required ${state} state.`,
      file: 'runtime',
      suggestion: `Render or include a state marker with data-ovlira-state="${state}".`,
    });
  }
}

function validateRuntimeActions(root: ParentNode, diagnostics: Diagnostic[]) {
  for (const region of Array.from(root.querySelectorAll('[data-ovlira-region]'))) {
    const primaryActions = region.querySelectorAll('ov-button[variant="primary"], button[data-ovlira-primary="true"]');
    if (primaryActions.length <= 1) continue;
    diagnostics.push({
      ruleId: 'runtime.one-primary',
      severity: 'error',
      message: `Rendered region “${region.getAttribute('data-ovlira-region')}” contains ${primaryActions.length} primary actions.`,
      file: 'runtime',
      suggestion: 'Keep one primary action in a task region; make additional actions secondary or quiet.',
    });
  }
}

function validateDefinedComponents(root: ParentNode, definedTags: ReadonlySet<string> | undefined, diagnostics: Diagnostic[]) {
  if (!definedTags) return;
  for (const element of Array.from(root.querySelectorAll('*'))) {
    const tag = element.tagName.toLowerCase();
    if (!tag.startsWith('ov-') || definedTags.has(tag)) continue;
    diagnostics.push({
      ruleId: 'runtime.component-undefined',
      severity: 'error',
      message: `Rendered Ovlira component “${tag}” is not registered.`,
      file: 'runtime',
      suggestion: `Import the implementation for ${tag} before rendering it, or choose an approved component.`,
    });
  }
}

function escapeSelector(value: string) {
  return value.replace(/([\\.#:[\],>+~*()'" ])/g, '\\$1');
}

function escapeAttribute(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
