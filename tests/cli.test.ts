import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { metadataReport } from '../src/catalogue/index.js';
import { runCli, validateProject } from '../src/cli/index.js';

async function tempProject() { return fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-test-')); }

function ioCapture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { io: { stdout: (value: string) => stdout.push(value), stderr: (value: string) => stderr.push(value) }, stdout, stderr };
}

describe('ovlira CLI', () => {
  it('returns bounded, stable JSON search results', async () => {
    const capture = ioCapture();
    const code = await runCli(['search', 'settings', '--json'], process.cwd(), capture.io);
    expect(code).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toEqual({
      version: 1,
      query: 'settings',
      filters: { kind: null, tag: null, category: null, limit: 8 },
      results: [expect.objectContaining({ id: 'page.settings', kind: 'recipe', title: 'Settings page' })],
    });
    const second = ioCapture();
    await runCli(['search', 'settings', '--json'], process.cwd(), second.io);
    expect(second.stdout[0]).toBe(capture.stdout[0]);
  });

  it('inspects one descriptor and gives useful errors for unknown IDs', async () => {
    const capture = ioCapture();
    expect(await runCli(['inspect', 'ov-input', '--json'], process.cwd(), capture.io)).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toMatchObject({ id: 'component.input', kind: 'component', api: { tag: 'ov-input' } });
    const errorCapture = ioCapture();
    expect(await runCli(['inspect', 'component.nope'], process.cwd(), errorCapture.io)).toBe(1);
    expect(errorCapture.stderr[0]).toContain('Unknown catalogue entry');
    const jsonError = ioCapture();
    expect(await runCli(['add', 'component.nope', '--json'], process.cwd(), jsonError.io)).toBe(1);
    expect(JSON.parse(jsonError.stdout[0])).toMatchObject({ version: 1, error: { code: 'catalogue.not-found' } });
  });

  it('supports bounded search filters and focused inspect sections', async () => {
    const searchCapture = ioCapture();
    expect(await runCli(['search', 'field', '--kind', 'component', '--category', 'forms', '--limit', '1', '--json'], process.cwd(), searchCapture.io)).toBe(0);
    expect(JSON.parse(searchCapture.stdout[0])).toMatchObject({ filters: { kind: 'component', category: 'forms', limit: 1 }, results: [{ id: 'component.input' }] });
    const inspectCapture = ioCapture();
    expect(await runCli(['inspect', 'ov-input', '--section', 'api', '--json'], process.cwd(), inspectCapture.io)).toBe(0);
    expect(JSON.parse(inspectCapture.stdout[0])).toMatchObject({ id: 'component.input', section: 'api', data: { tag: 'ov-input' } });
  });

  it('validates metadata and exposes a normalized registry index', async () => {
    expect(metadataReport).toMatchObject({ version: 1, valid: true, componentCount: 10, recipeCount: 6 });
    expect(metadataReport.issues).toEqual([]);
    const capture = ioCapture();
    expect(await runCli(['metadata', '--json'], process.cwd(), capture.io)).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toMatchObject({ valid: true, index: { byTag: { 'ov-input': 'component.input' } } });
  });

  it('runs the complete init → add → check vertical slice', async () => {
    const project = await tempProject();
    const initCapture = ioCapture();
    expect(await runCli(['init', '.', '--json'], project, initCapture.io)).toBe(0);
    const addCapture = ioCapture();
    expect(await runCli(['add', 'page.settings', '--cwd', project, '--json'], project, addCapture.io)).toBe(0);
    const addResult = JSON.parse(addCapture.stdout[0]);
    expect(addResult.added).toContain('ov-input');
    expect(addResult.files).toContain('src/components/ovlira/input.ts');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('Workspace settings');
    const checkCapture = ioCapture();
    expect(await runCli(['check', '--cwd', project, '--json'], project, checkCapture.io)).toBe(0);
    expect(JSON.parse(checkCapture.stdout[0])).toMatchObject({ version: 1, ok: true });
  });

  it('keeps add idempotent and protects local edits unless forced', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    const first = ioCapture();
    expect(await runCli(['add', 'component.button', '--cwd', project, '--json'], project, first.io)).toBe(0);
    const second = ioCapture();
    expect(await runCli(['add', 'component.button', '--cwd', project, '--json'], project, second.io)).toBe(0);
    expect(JSON.parse(second.stdout[0]).skipped).toContain('src/components/ovlira/button.ts');
    const buttonPath = path.join(project, 'src/components/ovlira/button.ts');
    await fs.appendFile(buttonPath, '\n// local edit\n');
    const conflict = ioCapture();
    expect(await runCli(['add', 'component.button', '--cwd', project, '--json'], project, conflict.io)).toBe(1);
    expect(JSON.parse(conflict.stdout[0]).conflicts).toContain('src/components/ovlira/button.ts');
    const forced = ioCapture();
    expect(await runCli(['add', 'component.button', '--cwd', project, '--force', '--json'], project, forced.io)).toBe(0);
    expect(JSON.parse(forced.stdout[0]).changed).toContain('src/components/ovlira/button.ts');
    expect(await fs.readFile(buttonPath, 'utf8')).not.toContain('// local edit');

    const explicitEntryProject = await tempProject();
    expect(await runCli(['init', '.'], explicitEntryProject, ioCapture().io)).toBe(0);
    const explicitEntry = ioCapture();
    expect(await runCli(['add', 'component.input', '--cwd', explicitEntryProject, '--entry', 'src/app.ts', '--json'], explicitEntryProject, explicitEntry.io)).toBe(0);
    expect(JSON.parse(explicitEntry.stdout[0]).entry).toBe('src/app.ts');
    expect(await fs.readFile(path.join(explicitEntryProject, 'src/app.ts'), 'utf8')).toContain('ov-input');
  });

  it('accepts a required prop assigned through an obvious DOM property binding', async () => {
    const project = await tempProject();
    await fs.mkdir(path.join(project, 'src'), { recursive: true });
    await fs.writeFile(path.join(project, '.ovlira.json'), JSON.stringify({ version: 1, added: ['ov-input'], recipes: [], entry: 'src/main.ts' }));
    await fs.writeFile(path.join(project, 'src/main.ts'), `const field = document.querySelector('ov-input');\nfield.label = 'Workspace name';\ndocument.body.innerHTML = '<h1>Settings</h1><ov-input></ov-input>';\n`);
    const result = await validateProject(project);
    expect(result.diagnostics.filter((diagnostic) => diagnostic.ruleId === 'component.required-prop')).toEqual([]);
  });

  it('reports deterministic diagnostics for the invalid fixture', async () => {
    const fixture = path.join(process.cwd(), 'tests', 'fixtures', 'invalid-project');
    const result = await validateProject(fixture);
    const ruleIds = result.diagnostics.map((diagnostic) => diagnostic.ruleId);
    expect(result.ok).toBe(false);
    expect(ruleIds).toEqual(expect.arrayContaining([
      'component.unknown',
      'component.required-prop',
      'composition.disallowed-child',
      'recipe.required-state',
      'actions.one-primary',
      'tokens.unapproved-literal',
      'a11y.heading-jump',
    ]));
    expect(result.diagnostics.every((diagnostic) => diagnostic.suggestion.length > 0)).toBe(true);
  });

  it('passes the valid fixture', async () => {
    const fixture = path.join(process.cwd(), 'tests', 'fixtures', 'valid-project');
    const result = await validateProject(fixture);
    expect(result).toMatchObject({ version: 1, ok: true });
    expect(result.diagnostics).toEqual([]);
  });
});
