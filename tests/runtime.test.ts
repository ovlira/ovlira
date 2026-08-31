import { describe, expect, it } from 'vitest';
import { validateRuntimeDocument } from '../src/validator/runtime.js';

describe('runtime DOM validation contract', () => {
  it('checks native and Ovlira control names without inspecting component internals', () => {
    document.body.innerHTML = '<label for="name">Workspace name</label><input id="name"><ov-input label="Region"></ov-input><ov-textarea></ov-textarea><ov-checkbox></ov-checkbox><ov-radio-group></ov-radio-group><ov-input></ov-input>';

    const diagnostics = validateRuntimeDocument(document, { definedTags: new Set(['ov-input', 'ov-textarea', 'ov-checkbox', 'ov-radio-group']) });

    expect(diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual(['runtime.required-label', 'runtime.required-label', 'runtime.required-label', 'runtime.required-label']);
    expect(diagnostics[0]?.message).toContain('ov-textarea');
    expect(diagnostics[1]?.message).toContain('ov-checkbox');
    expect(diagnostics[2]?.message).toContain('ov-radio-group');
    expect(diagnostics[3]?.message).toContain('ov-input');
  });

  it('checks rendered heading order and marked recipe states', () => {
    document.body.innerHTML = '<h2>Section</h2><h4>Subsection</h4><div data-ovlira-state="loading"></div>';

    const diagnostics = validateRuntimeDocument(document, { requiredStates: ['loading', 'error'] });

    expect(diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual(['runtime.heading-start', 'runtime.heading-jump', 'runtime.required-state']);
  });

  it('checks primary actions and registered custom elements', () => {
    document.body.innerHTML = '<section data-ovlira-region="profile"><ov-button variant="primary">Save</ov-button><ov-button variant="primary">Apply</ov-button></section><ov-missing></ov-missing>';

    const diagnostics = validateRuntimeDocument(document, { definedTags: new Set(['ov-button']) });

    expect(diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual(['runtime.one-primary', 'runtime.component-undefined']);
  });

  it('passes a coherent rendered fragment', () => {
    document.body.innerHTML = '<h1>Settings</h1><label for="name">Workspace name</label><input id="name"><section data-ovlira-region="profile"><ov-button variant="primary">Save</ov-button></section><div data-ovlira-state="loading"></div><div data-ovlira-state="error"></div>';

    expect(validateRuntimeDocument(document, { definedTags: new Set(['ov-button']), requiredStates: ['loading', 'error'] })).toEqual([]);
  });
});
