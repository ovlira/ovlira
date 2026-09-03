import { execFile as execFileCallback } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { metadataReport } from '../src/catalogue/index.js';
import { runCli, validateProject } from '../src/cli/index.js';
import { packageVersion } from '../src/version.js';

const execFile = promisify(execFileCallback);
const recipes = ['page.settings', 'page.search', 'page.crud-table', 'page.detail', 'state.empty', 'shell.application'];

async function tempProject() { return fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-test-')); }

function ioCapture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { io: { stdout: (value: string) => stdout.push(value), stderr: (value: string) => stderr.push(value) }, stdout, stderr };
}

async function initialise(project: string) {
  expect(await runCli(['init', '.', '--json'], project, ioCapture().io)).toBe(0);
}

async function linkDependencies(project: string) {
  await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(project, 'node_modules'), 'dir');
}

describe('ovlira CLI', () => {
  it('returns bounded, stable search results', async () => {
    const first = ioCapture();
    expect(await runCli(['search', 'page.settings', '--json'], process.cwd(), first.io)).toBe(0);
    expect(JSON.parse(first.stdout[0])).toMatchObject({
      version: 1,
      query: 'page.settings',
      filters: { kind: null, tag: null, category: null, limit: 8 },
      results: [{ id: 'page.settings', kind: 'recipe' }],
    });
    const second = ioCapture();
    await runCli(['search', 'page.settings', '--json'], process.cwd(), second.io);
    expect(second.stdout[0]).toBe(first.stdout[0]);
  });

  it('exposes package imports through inspect', async () => {
    const capture = ioCapture();
    expect(await runCli(['inspect', 'ov-input', '--json'], process.cwd(), capture.io)).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toMatchObject({
      id: 'component.input',
      kind: 'component',
      api: { tag: 'ov-input', importPath: '@ovlira/elements/input.js' },
    });
  });

  it('supports filters and focused inspect sections', async () => {
    const search = ioCapture();
    expect(await runCli(['search', 'input', '--kind', 'component', '--category', 'forms', '--limit', '1', '--json'], process.cwd(), search.io)).toBe(0);
    expect(JSON.parse(search.stdout[0])).toMatchObject({ filters: { kind: 'component', category: 'forms', limit: 1 }, results: [{ id: 'component.input' }] });
    const inspect = ioCapture();
    expect(await runCli(['inspect', 'page.settings', '--section', 'guidance', '--json'], process.cwd(), inspect.io)).toBe(0);
    expect(JSON.parse(inspect.stdout[0])).toMatchObject({ section: 'guidance', data: { requiredStates: ['loading', 'error', 'success'] } });
  });

  it('returns structured errors for invalid input', async () => {
    for (const args of [
      ['inspect', 'component.input', '--section', 'bogus', '--json'],
      ['search', 'input', '--bogus', '--json'],
      ['search', 'input', '--limit', 'nope', '--json'],
      ['add', 'component.nope', '--json'],
    ]) {
      const capture = ioCapture();
      expect(await runCli(args, process.cwd(), capture.io)).toBe(1);
      expect(JSON.parse(capture.stdout[0]).error.code).toBeTruthy();
    }
  });

  it('validates the catalogue metadata', async () => {
    expect(metadataReport).toMatchObject({ version: 1, valid: true, componentCount: 35, recipeCount: 6, issues: [] });
  });

  it('initialises package mode with a local CLI script', async () => {
    const project = await tempProject();
    const capture = ioCapture();
    expect(await runCli(['init', '.', '--json'], project, capture.io)).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toMatchObject({ version: 2, next: 'npm install && npm run ovlira -- add page.settings' });
    const manifest = JSON.parse(await fs.readFile(path.join(project, '.ovlira.json'), 'utf8'));
    expect(manifest).toEqual({ version: 2, mode: 'package', elementsVersion: packageVersion, recipes: {}, entry: 'src/main.ts' });
    const pkg = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
    expect(pkg).toMatchObject({
      scripts: { ovlira: 'ovlira' },
      dependencies: { '@ovlira/elements': `^${packageVersion}` },
      devDependencies: { '@ovlira/cli': `^${packageVersion}` },
    });
    await expect(fs.access(path.join(project, 'src/components'))).rejects.toThrow();
  });

  it('merges an existing package.json without replacing user fields', async () => {
    const project = await tempProject();
    await fs.writeFile(path.join(project, 'package.json'), JSON.stringify({ name: 'existing', scripts: { test: 'vitest' }, dependencies: { zod: '^4.0.0' } }));
    await initialise(project);
    const pkg = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('existing');
    expect(pkg.scripts).toMatchObject({ test: 'vitest', ovlira: 'ovlira' });
    expect(pkg.dependencies).toMatchObject({ zod: '^4.0.0', '@ovlira/elements': `^${packageVersion}` });
  });

  it('runs init → recipe add → build → check in package mode', async () => {
    const project = await tempProject();
    await initialise(project);
    const add = ioCapture();
    expect(await runCli(['add', 'page.settings', '--cwd', project, '--json'], project, add.io)).toBe(0);
    expect(JSON.parse(add.stdout[0])).toMatchObject({
      version: 2,
      kind: 'recipe',
      entry: 'src/main.ts',
      imports: expect.arrayContaining(['@ovlira/elements/input.js']),
    });
    const entry = await fs.readFile(path.join(project, 'src/main.ts'), 'utf8');
    expect(entry).toContain("import '@ovlira/elements/input.js';");
    expect(entry).not.toContain('register-all');
    await linkDependencies(project);
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
    const check = await validateProject(project);
    expect(check).toMatchObject({ version: 1, ok: true, diagnostics: [] });
  }, 30_000);

  it('generates every recipe with direct imports and valid states', async () => {
    for (const recipe of recipes) {
      const project = await tempProject();
      await initialise(project);
      expect(await runCli(['add', recipe, '--cwd', project], project, ioCapture().io)).toBe(0);
      const entry = await fs.readFile(path.join(project, 'src/main.ts'), 'utf8');
      expect(entry).toContain("@ovlira/elements/");
      expect(entry).not.toContain('register-all');
      expect(await validateProject(project)).toMatchObject({ ok: true, diagnostics: [] });
    }
  });

  it('treats component add as a non-mutating import lookup', async () => {
    const project = await tempProject();
    await initialise(project);
    const before = await fs.readFile(path.join(project, 'src/main.ts'), 'utf8');
    const capture = ioCapture();
    expect(await runCli(['add', 'component.tooltip', '--cwd', project, '--json'], project, capture.io)).toBe(0);
    expect(JSON.parse(capture.stdout[0])).toMatchObject({
      version: 2,
      kind: 'component',
      tag: 'ov-tooltip',
      importPath: '@ovlira/elements/tooltip.js',
      changed: [],
    });
    expect(await fs.readFile(path.join(project, 'src/main.ts'), 'utf8')).toBe(before);
  });

  it('adds multiple recipes as independent local modules and preserves theme overrides', async () => {
    const project = await tempProject();
    await initialise(project);
    expect(await runCli(['add', 'page.settings', '--cwd', project], project, ioCapture().io)).toBe(0);
    const themePath = path.join(project, 'src/styles/ovlira-theme.css');
    await fs.appendFile(themePath, ':root { --ov-color-accent: rebeccapurple; }\n');
    const second = ioCapture();
    expect(await runCli(['add', 'page.search', '--cwd', project, '--json'], project, second.io)).toBe(0);
    expect(JSON.parse(second.stdout[0])).toMatchObject({ entry: 'src/pages/search.ts' });
    expect(await fs.readFile(themePath, 'utf8')).toContain('rebeccapurple');
    const manifest = JSON.parse(await fs.readFile(path.join(project, '.ovlira.json'), 'utf8'));
    expect(manifest.recipes).toEqual({ 'page.settings': 'src/main.ts', 'page.search': 'src/pages/search.ts' });
    const page = await fs.readFile(path.join(project, 'src/pages/search.ts'), 'utf8');
    expect(page).toContain("import '@ovlira/elements/input.js';");
    expect(page).toContain("import '../styles/ovlira-theme.css';");
  });

  it('preflights recipe output conflicts without changing the manifest', async () => {
    const project = await tempProject();
    await initialise(project);
    await fs.mkdir(path.join(project, 'src/pages'), { recursive: true });
    await fs.writeFile(path.join(project, 'src/pages/settings.ts'), '// user-owned\n');
    const manifestBefore = await fs.readFile(path.join(project, '.ovlira.json'), 'utf8');
    const capture = ioCapture();
    expect(await runCli(['add', 'page.settings', '--cwd', project, '--out', 'src/pages/settings.ts', '--json'], project, capture.io)).toBe(1);
    expect(JSON.parse(capture.stdout[0]).conflicts).toEqual(['src/pages/settings.ts']);
    expect(await fs.readFile(path.join(project, '.ovlira.json'), 'utf8')).toBe(manifestBefore);
  });

  it('keeps an adapted recipe registered at its original path on repeated use', async () => {
    const project = await tempProject();
    try {
      await initialise(project);
      expect(await runCli(['add', 'page.settings'], project, ioCapture().io)).toBe(0);
      const entryPath = path.join(project, 'src/main.ts');
      const original = await fs.readFile(entryPath, 'utf8');
      expect(await runCli(['add', 'page.settings'], project, ioCapture().io)).toBe(0);
      await expect(fs.access(path.join(project, 'src/pages/settings.ts'))).rejects.toThrow();
      const adapted = original + '\n// Application-owned data, action and navigation seams\nconst customer = { name: "Acme", saved: false };\nconst saveCustomer = () => { customer.saved = true; };\nwindow.addEventListener("customer-save", saveCustomer);\nwindow.addEventListener("customer-back", () => { location.hash = "customers"; });\n';
      await fs.writeFile(entryPath, adapted);
      const themePath = path.join(project, 'src/styles/ovlira-theme.css');
      const theme = await fs.readFile(themePath, 'utf8') + '\n/* Application-owned theme */\n';
      await fs.writeFile(themePath, theme);
      const manifestPath = path.join(project, '.ovlira.json');
      const manifestBefore = await fs.readFile(manifestPath, 'utf8');
      await initialise(project);
      const capture = ioCapture();
      expect(await runCli(['add', 'page.settings', '--json'], project, capture.io)).toBe(1);
      expect(JSON.parse(capture.stdout[0]).conflicts).toEqual(['src/main.ts']);
      expect(await fs.readFile(manifestPath, 'utf8')).toBe(manifestBefore);
      expect(await fs.readFile(entryPath, 'utf8')).toBe(adapted);
      expect(await fs.readFile(themePath, 'utf8')).toBe(theme);
      expect(await runCli(['add', 'page.search'], project, ioCapture().io)).toBe(0);
      expect(await fs.readFile(entryPath, 'utf8')).toBe(adapted);
      expect(await fs.readFile(themePath, 'utf8')).toBe(theme);
      expect((await validateProject(project)).ok).toBe(true);
    } finally {
      await fs.rm(project, { recursive: true, force: true });
    }
  });

  it('rejects registered recipe paths outside the project', async () => {
    const project = await tempProject();
    try {
      await initialise(project);
      const manifestPath = path.join(project, '.ovlira.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      manifest.recipes['page.settings'] = '../outside.ts';
      await fs.writeFile(manifestPath, JSON.stringify(manifest));
      const capture = ioCapture();
      expect(await runCli(['add', 'page.settings', '--json'], project, capture.io)).toBe(1);
      expect(capture.stdout.join('')).toContain('escapes the project directory');
    } finally {
      await fs.rm(project, { recursive: true, force: true });
    }
  });

  it('reports a known component used without its module import', async () => {
    const project = await tempProject();
    await initialise(project);
    await fs.writeFile(path.join(project, 'src/main.ts'), `document.body.innerHTML = '<h1>Example</h1><ov-tooltip content="Help"><button slot="trigger">?</button></ov-tooltip>';\n`);
    const result = await validateProject(project);
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ ruleId: 'component.not-imported', file: 'src/main.ts' }));
  });

  it('reports package version drift without rewriting the project', async () => {
    const project = await tempProject();
    await initialise(project);
    const packagePath = path.join(project, 'package.json');
    const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    pkg.dependencies['@ovlira/elements'] = '^0.4.0';
    await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
    const result = await validateProject(project);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ ruleId: 'project.elements-version-drift', severity: 'warning' }));
    expect(JSON.parse(await fs.readFile(path.join(project, '.ovlira.json'), 'utf8')).elementsVersion).toBe(packageVersion);
  });

  it('recognises required props assigned through component properties', async () => {
    const project = await tempProject();
    await initialise(project);
    await fs.writeFile(path.join(project, 'src/main.ts'), `import '@ovlira/elements/data-table.js';\ndocument.body.innerHTML = '<h1>Data</h1><ov-data-table></ov-data-table>';\nconst table = document.querySelector('ov-data-table');\nif (table) table.caption = 'Projects';\n`);
    expect((await validateProject(project)).diagnostics.find((item) => item.ruleId === 'component.required-prop')).toBeUndefined();
  });
});
