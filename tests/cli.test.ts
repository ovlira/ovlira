import { promises as fs } from 'node:fs';
import { execFile as execFileCallback } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { metadataReport } from '../src/catalogue/index.js';
import { runCli, validateProject } from '../src/cli/index.js';
import { packageVersion } from '../src/version.js';

const execFile = promisify(execFileCallback);

async function tempProject() { return fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-test-')); }

function ioCapture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { io: { stdout: (value: string) => stdout.push(value), stderr: (value: string) => stderr.push(value) }, stdout, stderr };
}

describe('ovlira CLI', () => {
  it('returns bounded, stable JSON search results', async () => {
    const capture = ioCapture();
    const code = await runCli(['search', 'page.settings', '--json'], process.cwd(), capture.io);
    expect(code).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toEqual({
      version: 1,
      query: 'page.settings',
      filters: { kind: null, tag: null, category: null, limit: 8 },
      results: [expect.objectContaining({ id: 'page.settings', kind: 'recipe', title: 'Settings page' })],
    });
    const second = ioCapture();
    await runCli(['search', 'page.settings', '--json'], process.cwd(), second.io);
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
    expect(await runCli(['search', 'input', '--kind', 'component', '--category', 'forms', '--limit', '1', '--json'], process.cwd(), searchCapture.io)).toBe(0);
    expect(JSON.parse(searchCapture.stdout[0])).toMatchObject({ filters: { kind: 'component', category: 'forms', limit: 1 }, results: [{ id: 'component.input' }] });
    const inspectCapture = ioCapture();
    expect(await runCli(['inspect', 'ov-input', '--section', 'api', '--json'], process.cwd(), inspectCapture.io)).toBe(0);
    expect(JSON.parse(inspectCapture.stdout[0])).toMatchObject({ id: 'component.input', section: 'api', data: { tag: 'ov-input' } });
    const recipeGuidance = ioCapture();
    expect(await runCli(['inspect', 'page.settings', '--section', 'guidance', '--json'], process.cwd(), recipeGuidance.io)).toBe(0);
    expect(JSON.parse(recipeGuidance.stdout[0])).toMatchObject({
      id: 'page.settings',
      section: 'guidance',
      data: {
        contentRegions: expect.arrayContaining(['page header', 'section feedback']),
        requiredStates: ['loading', 'error', 'success'],
        extensionPoints: {
          data: expect.arrayContaining(['field values']),
          actions: expect.arrayContaining(['save identity']),
          navigation: expect.arrayContaining(['brand link']),
        },
      },
    });
  });

  it('rejects invalid and unknown options with structured errors', async () => {
    const invalidSection = ioCapture();
    expect(await runCli(['inspect', 'component.input', '--section', 'bogus', '--json'], process.cwd(), invalidSection.io)).toBe(1);
    expect(JSON.parse(invalidSection.stdout[0])).toMatchObject({ version: 1, error: { code: 'cli.invalid-option' } });

    const unknownOption = ioCapture();
    expect(await runCli(['search', 'input', '--bogus', '--json'], process.cwd(), unknownOption.io)).toBe(1);
    expect(JSON.parse(unknownOption.stdout[0])).toMatchObject({ version: 1, error: { code: 'cli.unknown-option' } });

    const invalidLimit = ioCapture();
    expect(await runCli(['search', 'input', '--limit', 'nope', '--json'], process.cwd(), invalidLimit.io)).toBe(1);
    expect(JSON.parse(invalidLimit.stdout[0])).toMatchObject({ version: 1, error: { code: 'cli.invalid-option' } });
  });

  it('validates metadata and exposes a normalized registry index', async () => {
    expect(metadataReport).toMatchObject({ version: 1, valid: true, componentCount: 14, recipeCount: 6 });
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
    expect(addResult.files).toContain('src/styles/ovlira-theme.css');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain("./styles/ovlira-theme.css");
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('Workspace settings');
    const checkCapture = ioCapture();
    expect(await runCli(['check', '--cwd', project, '--json'], project, checkCapture.io)).toBe(0);
    expect(JSON.parse(checkCapture.stdout[0])).toMatchObject({ version: 1, ok: true });
  });

  it('generates a complete, checkable starter for every recipe', async () => {
    for (const recipe of ['page.settings', 'page.search', 'page.crud-table', 'page.detail', 'state.empty', 'shell.application']) {
      const project = await tempProject();
      expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
      expect(await runCli(['add', recipe, '--cwd', project], project, ioCapture().io)).toBe(0);
      const entry = await fs.readFile(path.join(project, 'src/main.ts'), 'utf8');
      expect(entry).toContain("./styles/ovlira-theme.css");
      expect(entry).toContain('Ovlira adaptation seams');
      if (recipe !== 'state.empty' && recipe !== 'shell.application') expect(entry).toContain('data-ovlira-state-target');
      if (recipe === 'page.settings') expect(entry).toContain('data-ovlira-action="save"');
      if (recipe === 'page.search') expect(entry).toContain('data-ovlira-action="search"');
      if (recipe === 'page.crud-table') expect(entry).toContain('data-ovlira-create-form');
      if (recipe === 'page.detail') expect(entry).toContain('data-ovlira-action="edit"');
      if (recipe === 'state.empty') expect(entry).toContain('data-ovlira-state="success"');
      if (recipe === 'shell.application') expect(entry).toContain('data-ovlira-nav');
      const check = ioCapture();
      expect(await runCli(['check', '--cwd', project, '--json'], project, check.io)).toBe(0);
      expect(JSON.parse(check.stdout[0])).toMatchObject({ version: 1, ok: true, diagnostics: [] });
      await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
      await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
    }
  }, 30_000);

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

  it('generates a buildable standalone textarea starter', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    const addCapture = ioCapture();
    expect(await runCli(['add', 'component.textarea', '--cwd', project, '--json'], project, addCapture.io)).toBe(0);
    expect(JSON.parse(addCapture.stdout[0]).added).toContain('ov-textarea');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('<ov-textarea');
    expect(await runCli(['check', '--cwd', project, '--json'], project, ioCapture().io)).toBe(0);
    await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
  }, 30_000);

  it('generates a buildable standalone checkbox starter', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    const addCapture = ioCapture();
    expect(await runCli(['add', 'component.checkbox', '--cwd', project, '--json'], project, addCapture.io)).toBe(0);
    expect(JSON.parse(addCapture.stdout[0]).added).toContain('ov-checkbox');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('<ov-checkbox');
    expect(await runCli(['check', '--cwd', project, '--json'], project, ioCapture().io)).toBe(0);
    await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
  }, 30_000);

  it('generates a buildable standalone radio group starter', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    const addCapture = ioCapture();
    expect(await runCli(['add', 'component.radio-group', '--cwd', project, '--json'], project, addCapture.io)).toBe(0);
    expect(JSON.parse(addCapture.stdout[0]).added).toContain('ov-radio-group');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('<ov-radio-group');
    expect(await runCli(['check', '--cwd', project, '--json'], project, ioCapture().io)).toBe(0);
    await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
  }, 30_000);

  it('generates a buildable standalone toggle starter', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    const addCapture = ioCapture();
    expect(await runCli(['add', 'component.toggle', '--cwd', project, '--json'], project, addCapture.io)).toBe(0);
    expect(JSON.parse(addCapture.stdout[0]).added).toContain('ov-toggle');
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain('<ov-toggle');
    expect(await runCli(['check', '--cwd', project, '--json'], project, ioCapture().io)).toBe(0);
    await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
  }, 30_000);

  it('preflights add conflicts without partially changing the project', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    await fs.writeFile(path.join(project, 'src/main.ts'), `document.body.innerHTML = '<h1>Existing app</h1>';\n`);
    await fs.writeFile(path.join(project, 'src/ovlira-example.ts'), '// user-owned example\n');
    const beforeManifest = await fs.readFile(path.join(project, '.ovlira.json'), 'utf8');

    const capture = ioCapture();
    expect(await runCli(['add', 'page.settings', '--cwd', project, '--json'], project, capture.io)).toBe(1);
    const result = JSON.parse(capture.stdout[0]);
    expect(result.conflicts).toEqual(['src/ovlira-example.ts']);
    expect(await fs.readFile(path.join(project, '.ovlira.json'), 'utf8')).toBe(beforeManifest);
    await expect(fs.access(path.join(project, 'src/components/ovlira/input.ts'))).rejects.toThrow();
  });

  it('preserves the user-owned theme while adding more components', async () => {
    const project = await tempProject();
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    expect(await runCli(['add', 'component.button', '--cwd', project], project, ioCapture().io)).toBe(0);

    const themePath = path.join(project, 'src/styles/ovlira-theme.css');
    const customizedTheme = `${await fs.readFile(themePath, 'utf8')}\n:root { --ov-color-accent: rebeccapurple; }\n`;
    await fs.writeFile(themePath, customizedTheme);

    const addCapture = ioCapture();
    expect(await runCli(['add', 'component.input', '--cwd', project, '--force', '--json'], project, addCapture.io)).toBe(0);
    const result = JSON.parse(addCapture.stdout[0]);
    expect(result.conflicts).toEqual([]);
    expect(result.skipped).toContain('src/styles/ovlira-theme.css');
    expect(await fs.readFile(themePath, 'utf8')).toBe(customizedTheme);
    expect(await runCli(['check', '--cwd', project, '--json'], project, ioCapture().io)).toBe(0);
  });

  it('keeps the v0.2 theme filename during an init/add pass', async () => {
    const project = await tempProject();
    const legacyThemePath = path.join(project, 'src/styles/ovlira-tokens.css');
    await fs.mkdir(path.dirname(legacyThemePath), { recursive: true });
    const legacyTheme = ':root { --ov-color-accent: rebeccapurple; }\n';
    await fs.writeFile(legacyThemePath, legacyTheme);

    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toContain("./styles/ovlira-tokens.css");
    expect(await runCli(['add', 'component.button', '--cwd', project], project, ioCapture().io)).toBe(0);
    expect(await fs.readFile(legacyThemePath, 'utf8')).toBe(legacyTheme);
    await expect(fs.access(path.join(project, 'src/styles/ovlira-theme.css'))).rejects.toThrow();
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

  it('checks heading hierarchy independently for each source entry', async () => {
    const project = await tempProject();
    await fs.mkdir(path.join(project, 'src'), { recursive: true });
    await fs.writeFile(path.join(project, '.ovlira.json'), JSON.stringify({ version: 1, added: [], recipes: [], entry: 'src/main.ts' }));
    await fs.writeFile(path.join(project, 'src/main.ts'), `document.body.innerHTML = '<h1>Home</h1><h2>Overview</h2>';\n`);
    await fs.writeFile(path.join(project, 'src/other.ts'), `document.body.innerHTML = '<h3>Other page</h3>';\n`);
    const result = await validateProject(project);
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: 'a11y.heading-start', file: 'src/other.ts' })]));
  });

  it('passes the valid fixture', async () => {
    const fixture = path.join(process.cwd(), 'tests', 'fixtures', 'valid-project');
    const result = await validateProject(fixture);
    expect(result).toMatchObject({ version: 1, ok: true });
    expect(result.diagnostics).toEqual([]);
  });
});
