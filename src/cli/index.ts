#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogue, catalogueSchemaVersion, componentForTag, components, metadataReport, recipes, registryIndex, resolveDescriptor, searchCatalogue } from '../catalogue/index.js';
import { collectAssignedProperties } from '../validator/ast.js';
import type { ComponentDescriptor, Descriptor, Diagnostic, ProjectManifest, RecipeDescriptor } from '../catalogue/types.js';
import tokens from '../tokens/tokens.json' with { type: 'json' };

const packageRoot = resolvePackageRoot();
const sourceRoot = path.join(packageRoot, 'src');
const tokenCssPath = path.join(sourceRoot, 'tokens', 'tokens.css');
const themeFileName = 'ovlira-theme.css';
const legacyThemeFileName = 'ovlira-tokens.css';
const projectFiles = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.html', '.css']);

export interface CliIO {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

interface ParsedArgs {
  command: string;
  positional: string[];
  json: boolean;
  cwd: string;
  format?: string;
  force: boolean;
  kind?: 'component' | 'recipe';
  tag?: string;
  category?: string;
  limit: number;
  section?: 'api' | 'guidance' | 'example';
  entry?: string;
}

interface FileText {
  absolute: string;
  relative: string;
  text: string;
}

const defaultIO: CliIO = { stdout: (text) => console.log(text), stderr: (text) => console.error(text) };

function resolvePackageRoot() {
  if (import.meta.url.startsWith('file:')) {
    try { return fileURLToPath(new URL('../..', import.meta.url)); } catch { /* Vitest may virtualize import.meta.url. */ }
  }
  return process.cwd();
}

export async function runCli(argv: string[], startingCwd = process.cwd(), io: CliIO = defaultIO): Promise<number> {
  const args = parseArgs(argv, startingCwd);
  const cwd = args.cwd;
  try {
    switch (args.command) {
      case 'init': return await initProject(cwd, args, io);
      case 'search': return searchCommand(args, io);
      case 'inspect': return inspectCommand(args, io);
      case 'add': return await addCommand(args, io);
      case 'list': return listCommand(args, io);
      case 'tokens': return await tokensCommand(args, io);
      case 'metadata': return metadataCommand(args, io);
      case 'check': return await checkCommand(cwd, args, io);
      case 'help':
      case '--help':
      case '-h': helpCommand(io); return 0;
      case 'version':
      case '--version': io.stdout('0.2.1'); return 0;
      default:
        io.stderr(`Unknown command “${args.command}”. Run “ovlira help” for available commands.`);
        return 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeCliError(args, io, 'cli.failed', message, 'Run “ovlira help” for command usage.');
    return 1;
  }
}

function writeCliError(args: ParsedArgs, io: CliIO, code: string, message: string, suggestion: string): number {
  if (args.json) io.stdout(JSON.stringify({ version: 1, error: { code, message, suggestion } }, null, 2));
  else io.stderr(`ovlira: ${message}`);
  return 1;
}

function parseArgs(argv: string[], startingCwd: string): ParsedArgs {
  const positional: string[] = [];
  let json = false;
  let cwd = startingCwd;
  let format: string | undefined;
  let force = false;
  let kind: ParsedArgs['kind'];
  let tag: string | undefined;
  let category: string | undefined;
  let limit = 8;
  let section: ParsedArgs['section'];
  let entry: string | undefined;
  let index = 0;
  const nextValue = () => argv[++index] ?? '';
  for (; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') json = true;
    else if (arg === '--force') force = true;
    else if (arg === '--cwd') cwd = path.resolve(startingCwd, nextValue());
    else if (arg === '--format') format = nextValue();
    else if (arg.startsWith('--format=')) format = arg.slice('--format='.length);
    else if (arg === '--kind') kind = nextValue() as ParsedArgs['kind'];
    else if (arg.startsWith('--kind=')) kind = arg.slice('--kind='.length) as ParsedArgs['kind'];
    else if (arg === '--tag') tag = nextValue();
    else if (arg.startsWith('--tag=')) tag = arg.slice('--tag='.length);
    else if (arg === '--category') category = nextValue();
    else if (arg.startsWith('--category=')) category = arg.slice('--category='.length);
    else if (arg === '--limit') limit = Number(nextValue()) || 8;
    else if (arg.startsWith('--limit=')) limit = Number(arg.slice('--limit='.length)) || 8;
    else if (arg === '--section') section = nextValue() as ParsedArgs['section'];
    else if (arg.startsWith('--section=')) section = arg.slice('--section='.length) as ParsedArgs['section'];
    else if (arg === '--entry') entry = nextValue();
    else if (arg.startsWith('--entry=')) entry = arg.slice('--entry='.length);
    else if ((arg === '--help' || arg === '-h') && !positional.length) positional.push('help');
    else if ((arg === '--version' || arg === '-v') && !positional.length) positional.push('version');
    else if (!arg.startsWith('-')) positional.push(arg);
  }
  return { command: positional.shift() ?? 'help', positional, json, cwd: path.resolve(cwd), format, force, kind, tag, category, limit: Math.max(1, Math.min(limit, 100)), section, entry };
}

function helpCommand(io: CliIO) {
  io.stdout(`ovlira — local, agent-first UI building blocks

Commands:
  ovlira init [directory]                 Create a small Vite + Lit project
  ovlira search <query> [--json]          Find components and recipes
  ovlira inspect <id> [--json]            Read one compact descriptor
  ovlira add <id> [--json]                Copy a component or recipe into a project
  ovlira list [--json]                    List the local catalogue
  ovlira tokens [--format css|json]       Export approved design tokens
  ovlira metadata [--json]                Validate metadata and show the registry index
  ovlira check [--json] [--cwd path]      Validate the current project

Search filters: --kind component|recipe, --tag ov-input, --category forms, --limit N.
Inspect sections: --section api|guidance|example.
Add --cwd path and optionally --entry src/main.ts to control the target project.
Use --force only when you intend to replace a locally edited generated file.`);
}

function compactDescriptor(item: Descriptor) {
  return { id: item.id, kind: item.kind, title: item.title, description: item.description, category: item.category, tags: item.tags };
}

function searchCommand(args: ParsedArgs, io: CliIO): number {
  const query = args.positional.join(' ').trim();
  const results = searchCatalogue(query)
    .filter((item) => !args.kind || item.kind === args.kind)
    .filter((item) => !args.category || item.category === args.category)
    .filter((item) => !args.tag || item.tags.includes(args.tag) || (item.kind === 'component' && item.api.tag === args.tag))
    .slice(0, args.limit)
    .map(compactDescriptor);
  if (args.json) io.stdout(JSON.stringify({ version: 1, query, filters: { kind: args.kind ?? null, tag: args.tag ?? null, category: args.category ?? null, limit: args.limit }, results }, null, 2));
  else if (!results.length) io.stdout(`No catalogue entries matched “${query}”.`);
  else io.stdout(results.map((item) => `${item.id.padEnd(22)} ${item.kind.padEnd(9)} ${item.title} — ${item.description}`).join('\n'));
  return 0;
}

function inspectCommand(args: ParsedArgs, io: CliIO): number {
  const id = args.positional[0];
  if (!id) return writeCliError(args, io, 'inspect.missing-id', 'inspect requires a component or recipe ID.', 'Pass a stable ID such as component.input or page.settings.');
  const item = resolveDescriptor(id);
  if (!item) return writeCliError(args, io, 'catalogue.not-found', `Unknown catalogue entry “${id}”.`, `Try “ovlira search ${id}”.`);
  if (args.section) {
    if (args.section === 'api' && item.kind !== 'component') return writeCliError(args, io, 'inspect.invalid-section', 'The api section is only available for components.', 'Inspect a component ID or use --section guidance for a recipe.');
    const data = inspectSection(item, args.section);
    if (args.json) io.stdout(JSON.stringify({ version: 1, id: item.id, section: args.section, data }, null, 2));
    else io.stdout(`${item.id} / ${args.section}\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
  } else if (args.json) io.stdout(JSON.stringify(item, null, 2));
  else io.stdout(formatInspect(item));
  return 0;
}

function inspectSection(item: Descriptor, section: NonNullable<ParsedArgs['section']>) {
  if (section === 'example') return item.kind === 'component' ? item.guidance.example : item.example;
  if (item.kind === 'component') return item[section];
  return { useWhen: item.useWhen, avoidWhen: item.avoidWhen, components: item.components, requiredStates: item.requiredStates, constraints: item.constraints, composition: item.composition };
}

function formatInspect(item: Descriptor): string {
  if (item.kind === 'component') {
    const props = item.api.props.map((prop) => `${prop.required ? '*' : ' '} ${prop.name}: ${prop.type}`).join('\n');
    return `${item.title}  ${item.id}\n${item.description}\n\nTag: ${item.api.tag}\nCategory: ${item.category}\n\nProps:\n${props || '  (none)'}\n\nUse when: ${item.guidance.useWhen.join(' ')}\nAvoid when: ${item.guidance.avoidWhen.join(' ')}\nConstraints:\n${item.guidance.constraints.map((constraint) => `  - ${constraint}`).join('\n')}\n\nExample: ${item.guidance.example}`;
  }
  return `${item.title}  ${item.id}\n${item.description}\n\nComponents: ${item.components.join(', ')}\nRequired states: ${item.requiredStates.join(', ') || 'none'}\nUse when: ${item.useWhen.join(' ')}\nAvoid when: ${item.avoidWhen.join(' ')}\nConstraints:\n${item.constraints.map((constraint) => `  - ${constraint}`).join('\n')}\n\nComposition:\n${item.composition.map((part) => `  - ${part}`).join('\n')}\n\nExample: ${item.example}`;
}

function listCommand(args: ParsedArgs, io: CliIO): number {
  const result = catalogue.map(compactDescriptor);
  if (args.json) io.stdout(JSON.stringify({ version: 1, results: result }, null, 2));
  else io.stdout(result.map((item) => `${item.id.padEnd(22)} ${item.kind.padEnd(9)} ${item.title}`).join('\n'));
  return 0;
}

async function tokensCommand(args: ParsedArgs, io: CliIO): Promise<number> {
  const format = args.json ? 'json' : (args.format ?? 'css');
  if (format === 'json') io.stdout(JSON.stringify({ version: 1, tokens }, null, 2));
  else if (format === 'css') io.stdout(await fs.readFile(tokenCssPath, 'utf8'));
  else return writeCliError(args, io, 'tokens.invalid-format', 'tokens --format must be css or json.', 'Use --format css or --format json.');
  return 0;
}

function metadataCommand(args: ParsedArgs, io: CliIO): number {
  const result = { ...metadataReport, schemaVersion: catalogueSchemaVersion, index: registryIndex };
  if (args.json) io.stdout(JSON.stringify(result, null, 2));
  else if (result.valid) io.stdout(`Metadata valid: ${result.componentCount} components, ${result.recipeCount} recipes\nCategories: ${Object.keys(result.index.byCategory).join(', ')}`);
  else io.stdout([`Metadata invalid: ${result.issues.length} issue(s)`, ...result.issues.map((issue) => `  ${issue.code} ${issue.path} — ${issue.message}`)].join('\n'));
  return result.valid ? 0 : 1;
}

async function initProject(cwd: string, args: ParsedArgs, io: CliIO): Promise<number> {
  const target = path.resolve(cwd, args.positional[0] ?? '.');
  await fs.mkdir(path.join(target, 'src', 'styles'), { recursive: true });
  await fs.mkdir(path.join(target, 'src', 'components', 'ovlira'), { recursive: true });
  const theme = await projectTheme(target);
  const files: Record<string, string> = {
    'package.json': JSON.stringify({ name: path.basename(target), private: true, type: 'module', scripts: { dev: 'vite', build: 'tsc && vite build' }, dependencies: { lit: '^3.3.0' }, devDependencies: { typescript: '^5.8.3', vite: '^7.1.0' } }, null, 2) + '\n',
    'index.html': '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Ovlira prototype</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n',
    'src/main.ts': starterEntry(theme.fileName),
    'src/styles.css': globalStyles(),
    'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', useDefineForClassFields: false, module: 'ESNext', moduleResolution: 'Bundler', strict: true, noEmit: true, skipLibCheck: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'] }, include: ['src'] }, null, 2) + '\n',
    'vite.config.ts': "import { defineConfig } from 'vite';\nexport default defineConfig({});\n",
    '.gitignore': 'node_modules\ndist\n',
    '.ovlira.json': JSON.stringify({ version: 1, added: [], recipes: [], entry: 'src/main.ts' } satisfies ProjectManifest, null, 2) + '\n',
  };
  files[`src/styles/${theme.fileName}`] = await fs.readFile(tokenCssPath, 'utf8');
  const written: string[] = [];
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(target, relative);
    if (!args.force && await exists(absolute)) continue;
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content);
    written.push(relative);
  }
  const result = { version: 1, directory: target, files: written, next: 'ovlira add page.settings' };
  if (args.json) io.stdout(JSON.stringify(result, null, 2));
  else io.stdout(`Initialised ${target}\n\nNext: cd ${target} && ovlira add page.settings`);
  return 0;
}

async function addCommand(args: ParsedArgs, io: CliIO): Promise<number> {
  const target = args.cwd;
  const requested = args.positional[0];
  if (!requested) return writeCliError(args, io, 'add.missing-id', 'add requires a component or recipe ID.', 'Pass a stable ID such as component.input or page.settings.');
  const item = resolveDescriptor(requested);
  if (!item) return writeCliError(args, io, 'catalogue.not-found', `Unknown catalogue entry “${requested}”.`, `Try “ovlira search ${requested}”.`);
  const manifestPath = path.join(target, '.ovlira.json');
  const manifest = await readManifest(manifestPath);
  if (args.entry) manifest.entry = projectRelativePath(target, args.entry);
  const tags = item.kind === 'component' ? [item.api.tag] : item.components;
  const changed: string[] = [];
  const skipped: string[] = [];
  const conflicts: string[] = [];
  const record = (relative: string, status: FileStatus) => {
    if (status === 'changed') changed.push(relative);
    else if (status === 'skipped') skipped.push(relative);
    else conflicts.push(relative);
  };
  for (const tag of tags) {
    const component = componentForTag(tag);
    if (!component) continue;
    const file = `${component.api.tag.replace('ov-', '')}.ts`;
    const destination = path.join(target, 'src', 'components', 'ovlira', file);
    const relative = projectRelativePath(target, destination);
    const status = await copyTemplate(path.join(sourceRoot, 'components', file), destination, args.force);
    record(relative, status);
    if (status !== 'conflict' && !manifest.added.includes(tag)) manifest.added.push(tag);
  }
  const theme = await projectTheme(target);
  const themeStatus = await copyUserTemplate(tokenCssPath, theme.absolute);
  record(theme.relative, themeStatus);
  if (item.kind === 'recipe' && !conflicts.length && !manifest.recipes.includes(item.id)) manifest.recipes.push(item.id);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const entryPath = path.join(target, manifest.entry);
  let entryWritten = false;
  const entryExists = await exists(entryPath);
  const entryIsStarter = entryExists && (await fs.readFile(entryPath, 'utf8')).includes('ovlira add page.settings');
  if (!entryExists || entryIsStarter || args.entry) {
    const entry = item.kind === 'recipe' ? recipeEntry(item, theme.fileName) : componentEntry(item, theme.fileName);
    record(projectRelativePath(target, entryPath), await writeProjectFile(entryPath, entry, args.force || entryIsStarter || !entryExists));
    entryWritten = true;
  } else {
    const examplePath = path.join(target, 'src', 'ovlira-example.ts');
    record(projectRelativePath(target, examplePath), await writeProjectFile(examplePath, item.kind === 'recipe' ? recipeEntry(item, theme.fileName) : componentEntry(item, theme.fileName), args.force));
  }
  const barrelPath = path.join(target, 'src', 'ovlira.generated.ts');
  const barrel = `${orderedAddedTags(manifest.added).map((tag) => `import './components/ovlira/${tag.replace('ov-', '')}.js';`).join('\n')}\n`;
  record(projectRelativePath(target, barrelPath), await writeProjectFile(barrelPath, barrel, args.force));
  const result = { version: 1, ok: conflicts.length === 0, id: item.id, kind: item.kind, added: tags, files: [...changed, ...skipped], changed, skipped, conflicts, entry: entryWritten ? manifest.entry : 'src/ovlira-example.ts' };
  if (args.json) io.stdout(JSON.stringify(result, null, 2));
  else io.stdout(`${conflicts.length ? `Could not safely add ${item.id}` : `Added ${item.id}`}\n${changed.map((file) => `  changed ${file}`).join('\n')}${skipped.map((file) => `  kept ${file}`).join('\n')}${conflicts.map((file) => `  conflict ${file}`).join('\n')}`);
  return conflicts.length ? 1 : 0;
}

type FileStatus = 'changed' | 'skipped' | 'conflict';

async function copyTemplate(source: string, destination: string, force: boolean): Promise<FileStatus> {
  return writeProjectFile(destination, await fs.readFile(source, 'utf8'), force);
}

async function copyUserTemplate(source: string, destination: string): Promise<FileStatus> {
  if (!await exists(destination)) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return 'changed';
  }
  return 'skipped';
}

async function writeProjectFile(destination: string, content: string, force: boolean): Promise<FileStatus> {
  if (!await exists(destination)) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content);
    return 'changed';
  }
  if (await fs.readFile(destination, 'utf8') === content) return 'skipped';
  if (!force) return 'conflict';
  await fs.writeFile(destination, content);
  return 'changed';
}

function projectRelativePath(project: string, requested: string): string {
  const absolute = path.resolve(project, requested);
  const relative = path.relative(project, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path “${requested}” escapes the project directory.`);
  return relative.split(path.sep).join('/');
}

function orderedAddedTags(tags: string[]) {
  return components.map((component) => component.api.tag).filter((tag) => tags.includes(tag));
}

async function readManifest(manifestPath: string): Promise<ProjectManifest> {
  if (!await exists(manifestPath)) throw new Error(`No .ovlira.json found in ${path.dirname(manifestPath)}. Run “ovlira init” first.`);
  const value = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as ProjectManifest;
  if (value.version !== 1 || !Array.isArray(value.added) || !Array.isArray(value.recipes)) throw new Error('Invalid .ovlira.json. Recreate it with “ovlira init”.');
  return value;
}

interface ProjectTheme {
  absolute: string;
  fileName: string;
  relative: string;
}

async function projectTheme(target: string): Promise<ProjectTheme> {
  const styles = path.join(target, 'src', 'styles');
  const next = path.join(styles, themeFileName);
  const legacy = path.join(styles, legacyThemeFileName);
  const absolute = await exists(next) || !await exists(legacy) ? next : legacy;
  return { absolute, fileName: path.basename(absolute), relative: projectRelativePath(target, absolute) };
}

function starterEntry(theme = themeFileName): string {
  return `import './styles/${theme}';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = \
    \`<main class="starter"><p class="kicker">OVLIRA / LOCAL PROTOTYPE</p><h1>Start with a building block.</h1><p>Search the catalogue, inspect the contract, then add a component or recipe.</p><code>ovlira add page.settings</code></main>\`;
}
`;
}

function globalStyles(): string {
  return `* { box-sizing: border-box; }
html, body, #app { margin: 0; min-height: 100%; }
body { background: var(--ov-color-canvas); color: var(--ov-color-ink); font-family: var(--ov-font-sans); }
.starter { margin: 12vh auto; max-width: 42rem; padding: var(--ov-space-8); }
.starter h1 { font-size: var(--ov-text-xl); letter-spacing: -0.07em; line-height: 0.95; margin: 0 0 var(--ov-space-4); }
.starter p:not(.kicker) { color: var(--ov-color-muted); font-size: var(--ov-text-lg); max-width: 34rem; }
.kicker, code { font: 700 var(--ov-text-xs) / 1.2 var(--ov-font-mono); letter-spacing: 0.12em; text-transform: uppercase; }
code { background: var(--ov-color-ink); color: var(--ov-color-accent); display: inline-block; margin-top: var(--ov-space-4); padding: var(--ov-space-3) var(--ov-space-4); text-transform: none; }
.demo { margin: 10vh auto; max-width: 52rem; padding: 0 var(--ov-space-6); }
.demo h1 { font-size: var(--ov-text-xl); letter-spacing: -0.07em; line-height: 0.95; margin: 0 0 var(--ov-space-6); }
.demo ov-alert, .demo ov-empty-state, .demo ov-data-table { margin-top: var(--ov-space-6); }
.brand-mark { color: var(--ov-color-surface); display: grid; font: 800 1.1rem / 1 var(--ov-font-mono); letter-spacing: -0.04em; text-decoration: none; }
.brand-mark span { color: var(--ov-color-accent); font-size: var(--ov-text-xs); letter-spacing: 0.08em; margin-top: 0.35rem; }
.utility { align-items: center; color: var(--ov-color-muted); display: flex; font: 700 var(--ov-text-xs) / 1 var(--ov-font-mono); gap: var(--ov-space-3); justify-content: space-between; letter-spacing: 0.08em; }
.settings-page { max-width: 70rem; }
.state-stack { display: grid; gap: var(--ov-space-3); margin-bottom: var(--ov-space-6); }
.settings-grid { display: grid; gap: var(--ov-space-6); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card-heading { display: grid; gap: var(--ov-space-1); }
.card-heading h2 { font-size: var(--ov-text-lg); letter-spacing: -0.04em; margin: 0; }
.card-heading p { color: var(--ov-color-muted); font-size: var(--ov-text-sm); margin: 0.2rem 0 0; }
.card-kicker { color: var(--ov-color-accent-strong); font: 700 var(--ov-text-xs) / 1 var(--ov-font-mono); letter-spacing: 0.1em; text-transform: uppercase; }
.field-grid { display: grid; gap: var(--ov-space-4); }
.card-actions { align-items: center; display: flex; gap: var(--ov-space-4); justify-content: space-between; }
.hint { color: var(--ov-color-muted); font: 500 var(--ov-text-xs) / 1.3 var(--ov-font-mono); }
.state-switcher { align-items: center; border-bottom: 1px solid var(--ov-color-line); display: flex; flex-wrap: wrap; gap: var(--ov-space-2); margin: 0 0 var(--ov-space-6); padding: 0 0 var(--ov-space-3); }
.state-switcher-label { color: var(--ov-color-muted); font: 700 var(--ov-text-xs) / 1.2 var(--ov-font-mono); letter-spacing: 0.08em; margin-right: var(--ov-space-2); text-transform: uppercase; }
.state-button { background: transparent; border: 0; border-radius: var(--ov-radius-sm); color: var(--ov-color-ink); cursor: pointer; font: 650 var(--ov-text-xs) / 1.2 var(--ov-font-mono); min-height: 2.1rem; padding: var(--ov-space-2) var(--ov-space-3); }
.state-button:hover, .state-button[aria-pressed="true"] { background: var(--ov-color-accent); }
.state-button:focus-visible { outline: 3px solid var(--ov-color-accent-strong); outline-offset: 2px; }
.search-controls { align-items: end; display: grid; gap: var(--ov-space-3); grid-template-columns: minmax(0, 1fr) minmax(11rem, 0.35fr) auto; margin-bottom: var(--ov-space-6); }
.overview-grid, .detail-grid { display: grid; gap: var(--ov-space-6); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.detail-list { display: grid; gap: var(--ov-space-3); margin: 0; }
.detail-list div { align-items: baseline; border-bottom: 1px solid var(--ov-color-line); display: flex; gap: var(--ov-space-4); justify-content: space-between; padding-bottom: var(--ov-space-3); }
.detail-list dt { color: var(--ov-color-muted); font: 700 var(--ov-text-xs) / 1.2 var(--ov-font-mono); text-transform: uppercase; }
.detail-list dd { color: var(--ov-color-ink); font: 500 var(--ov-text-sm) / 1.4 var(--ov-font-sans); margin: 0; }
.state-copy { color: var(--ov-color-muted); margin: 0; }
@media (max-width: 56rem) { .settings-grid, .overview-grid, .detail-grid { grid-template-columns: 1fr; } .search-controls { grid-template-columns: 1fr; } }
`;
}

function componentEntry(item: ComponentDescriptor, theme = themeFileName): string {
  return `import './ovlira.generated.js';
import './styles/${theme}';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = \`${componentMarkup(item)}\`;
  ${item.api.tag === 'ov-select' ? "const select = app.querySelector('ov-select'); if (select) select.options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }];" : ''}
}
`;
}

function componentMarkup(item: ComponentDescriptor): string {
  switch (item.api.tag) {
    case 'ov-input': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Input</h1><ov-input label="Workspace name" placeholder="e.g. Northstar"></ov-input></main>';
    case 'ov-select': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Select</h1><ov-select label="Region"></ov-select></main>';
    case 'ov-button': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Button</h1><ov-button variant="primary">Continue</ov-button></main>';
    case 'ov-badge': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Badge</h1><ov-badge tone="accent">Ready</ov-badge></main>';
    case 'ov-alert': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Alert</h1><ov-alert tone="info">A concise message with a next step.</ov-alert></main>';
    case 'ov-empty-state': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Empty state</h1><ov-empty-state title="No projects yet" description="Create a project to begin."></ov-empty-state></main>';
    case 'ov-page-header': return '<main class="demo"><ov-page-header title="Page header" description="A clear title block for a task screen."></ov-page-header></main>';
    case 'ov-data-table': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Data table</h1><ov-data-table caption="Recent projects"></ov-data-table></main>';
    case 'ov-application-shell': return '<ov-application-shell><a slot="brand" href="/">OVLIRA</a><a slot="nav" href="/" aria-current="page">Overview</a><p>Shell content.</p></ov-application-shell>';
    default: return `<main class="demo"><h1>${item.title}</h1></main>`;
  }
}

function recipeEntry(recipe: RecipeDescriptor, theme = themeFileName): string {
  const markup = recipe.id === 'page.settings' ? settingsMarkup() : genericRecipeMarkup(recipe);
  const setup = recipeSetup(recipe);
  return `import './ovlira.generated.js';\nimport './styles/${theme}';\nimport './styles.css';\n\nconst app = document.querySelector<HTMLDivElement>('#app');\nif (app) {\n  app.innerHTML = \`${markup}\`;\n  ${setup}\n  const stateButtons = app.querySelectorAll<HTMLElement>('[data-ovlira-state-target]');\n  const states = app.querySelectorAll<HTMLElement>('[data-ovlira-state]');\n  const showState = (name: string) => {\n    states.forEach((state) => { state.hidden = state.dataset.ovliraState !== name; });\n    stateButtons.forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.ovliraStateTarget === name)); });\n  };\n  stateButtons.forEach((button) => button.addEventListener('click', () => showState(button.dataset.ovliraStateTarget ?? '')));\n}\n`;
}

function recipeSetup(recipe: RecipeDescriptor): string {
  if (recipe.id === 'page.settings') return "const selects = app.querySelectorAll('ov-select'); selects.forEach((select) => { select.options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }]; });";
  if (recipe.id === 'page.search') return "const select = app.querySelector('ov-select'); if (select) select.options = [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]; const table = app.querySelector('ov-data-table'); if (table) { table.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }]; table.rows = [{ name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' }, { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' }]; }";
  if (recipe.id === 'page.crud-table') return "const table = app.querySelector('ov-data-table'); if (table) { table.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'updated', label: 'Updated' }]; table.rows = [{ name: 'Northstar studio', owner: 'Maya Chen', updated: 'Today' }, { name: 'Field notes', owner: 'Jon Bell', updated: 'Yesterday' }]; }";
  return '';
}

function settingsMarkup(): string {
  return `<ov-application-shell>
  <a slot="brand" class="brand-mark" href="/">OVLIRA <span>LOCAL UI KIT</span></a>
  <a slot="nav" href="/" aria-current="page">Workspace</a>
  <a slot="nav" href="/activity">Activity</a>
  <a slot="nav" href="/members">Members</a>
  <span slot="header" class="utility">LOCAL / SETTINGS <ov-badge tone="accent">Prototype</ov-badge></span>
  <div class="settings-page">
    <ov-page-header eyebrow="Control surface" title="Workspace settings" description="Keep the everyday details of your workspace clear, current, and easy to hand off."></ov-page-header>
    <nav class="state-switcher" aria-label="Preview settings state"><span class="state-switcher-label">Preview state</span><button type="button" class="state-button" data-ovlira-state-target="success" aria-pressed="true">Saved</button><button type="button" class="state-button" data-ovlira-state-target="loading" aria-pressed="false">Loading</button><button type="button" class="state-button" data-ovlira-state-target="error" aria-pressed="false">Error</button></nav>
    <div class="state-stack">
      <div data-ovlira-state="loading" hidden>Loading settings…</div>
      <ov-alert data-ovlira-state="error" tone="danger" heading="Could not save" hidden>Check the highlighted fields and try again.</ov-alert>
      <ov-alert data-ovlira-state="success" tone="success" heading="Changes saved">Your workspace details are up to date.</ov-alert>
    </div>
    <div class="settings-grid">
      <section data-ovlira-region="identity">
        <ov-card>
          <div slot="header" class="card-heading"><span class="card-kicker">01 / identity</span><h2>Workspace profile</h2><p>The details teammates see when they join your space.</p></div>
          <div class="field-grid"><ov-input label="Workspace name" value="Northstar studio" required></ov-input><ov-input label="Workspace URL" value="northstar" required></ov-input></div>
          <div slot="footer" class="card-actions"><span class="hint">Last synced just now</span><ov-button variant="primary">Save profile</ov-button></div>
        </ov-card>
      </section>
      <section data-ovlira-region="preferences">
        <ov-card>
          <div slot="header" class="card-heading"><span class="card-kicker">02 / preferences</span><h2>Default preferences</h2><p>Set the defaults that keep new work moving.</p></div>
          <div class="field-grid"><ov-select label="Default region" required></ov-select><ov-select label="Week starts on" required></ov-select></div>
          <div slot="footer" class="card-actions"><span class="hint">Applies to new members</span><ov-button variant="primary">Save preferences</ov-button></div>
        </ov-card>
      </section>
    </div>
  </div>
</ov-application-shell>`;
}

function genericRecipeMarkup(recipe: RecipeDescriptor): string {
  if (recipe.id === 'shell.application') return `<ov-application-shell>
  <a slot="brand" class="brand-mark" href="/">OVLIRA <span>LOCAL UI KIT</span></a>
  <a slot="nav" href="/" aria-current="page">Overview</a><a slot="nav" href="/projects">Projects</a><a slot="nav" href="/activity">Activity</a>
  <span slot="header" class="utility">LOCAL / OVERVIEW <ov-badge tone="accent">Prototype</ov-badge></span>
  <div class="demo shell-demo"><ov-page-header eyebrow="Application frame" title="Project overview" description="A persistent shell for a focused local product surface."><span slot="actions"><ov-button variant="primary">New project</ov-button></span></ov-page-header><div class="overview-grid"><ov-card><span slot="header" class="card-heading"><span class="card-kicker">At a glance</span><strong>Keep the next step visible</strong></span><p>Use the shell for persistent navigation, then let each screen stay focused on one task.</p><span slot="footer" class="hint">Three active projects</span></ov-card><ov-card><span slot="header" class="card-heading"><span class="card-kicker">Recent activity</span><strong>Small updates, clear context</strong></span><p>Give people a lightweight trail of what changed without turning the overview into a dashboard.</p><span slot="footer" class="hint">Updated a few minutes ago</span></ov-card></div></div>
</ov-application-shell>`;
  if (recipe.id === 'state.empty') return `<main class="demo"><p class="kicker">OVLIRA / RECIPE</p><ov-empty-state data-ovlira-state="empty" title="Nothing here yet" description="Create the first record to begin."><ov-button slot="action" variant="primary">Create record</ov-button></ov-empty-state></main>`;
  if (recipe.id === 'page.detail') return `<main class="demo"><p class="kicker">OVLIRA / RECIPE</p><ov-page-header eyebrow="Record" title="Northstar studio" description="A focused view of one record before taking action."><span slot="actions"><ov-button variant="secondary">Back</ov-button><ov-button variant="primary">Edit record</ov-button></span></ov-page-header><nav class="state-switcher" aria-label="Preview detail state"><span class="state-switcher-label">Preview state</span><button type="button" class="state-button" data-ovlira-state-target="ready" aria-pressed="true">Ready</button><button type="button" class="state-button" data-ovlira-state-target="loading" aria-pressed="false">Loading</button><button type="button" class="state-button" data-ovlira-state-target="error" aria-pressed="false">Error</button></nav><section class="detail-grid" data-ovlira-state="ready"><ov-card><span slot="header" class="card-heading"><span class="card-kicker">Identity</span><strong>Workspace profile <ov-badge tone="success">Active</ov-badge></strong></span><dl class="detail-list"><div><dt>Owner</dt><dd>Maya Chen</dd></div><div><dt>Region</dt><dd>Europe</dd></div><div><dt>Created</dt><dd>12 March 2026</dd></div></dl></ov-card><ov-card><span slot="header" class="card-heading"><span class="card-kicker">Context</span><strong>What to know</strong></span><p>Keep the identity and current status above secondary fields so the next action is easy to understand.</p></ov-card></section><section data-ovlira-state="loading" hidden><ov-card><p class="state-copy">Loading the record summary…</p></ov-card></section><section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Could not load record">Check the connection and try again.</ov-alert></section></main>`;
  if (recipe.id === 'page.search') return `<main class="demo"><p class="kicker">OVLIRA / RECIPE</p><ov-page-header eyebrow="Find" title="Search records" description="Keep the query, result count, and next action in the same view."></ov-page-header><div class="search-controls" data-ovlira-region="search"><ov-input label="Search records" placeholder="Name, email, or ID"></ov-input><ov-select label="Status"></ov-select><ov-button variant="primary">Search</ov-button></div><nav class="state-switcher" aria-label="Preview search state"><span class="state-switcher-label">Preview state</span><button type="button" class="state-button" data-ovlira-state-target="results" aria-pressed="true">Results</button><button type="button" class="state-button" data-ovlira-state-target="loading" aria-pressed="false">Loading</button><button type="button" class="state-button" data-ovlira-state-target="empty" aria-pressed="false">Empty</button><button type="button" class="state-button" data-ovlira-state-target="error" aria-pressed="false">Error</button></nav><section data-ovlira-state="results"><ov-data-table caption="Search results"></ov-data-table></section><section data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Searching">Looking for records that match your query.</ov-alert></section><section data-ovlira-state="empty" hidden><ov-empty-state title="No matching records" description="Try a broader search or create a new record."><ov-button slot="action" variant="primary">Create record</ov-button></ov-empty-state></section><section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Search unavailable">Check the connection and try again.</ov-alert></section></main>`;
  return `<main class="demo"><p class="kicker">OVLIRA / RECIPE</p><ov-page-header eyebrow="Collection" title="${recipe.title}" description="${recipe.description}"><span slot="actions"><ov-button variant="primary">Create record</ov-button></span></ov-page-header><nav class="state-switcher" aria-label="Preview collection state"><span class="state-switcher-label">Preview state</span><button type="button" class="state-button" data-ovlira-state-target="records" aria-pressed="true">Records</button><button type="button" class="state-button" data-ovlira-state-target="loading" aria-pressed="false">Loading</button><button type="button" class="state-button" data-ovlira-state-target="empty" aria-pressed="false">Empty</button><button type="button" class="state-button" data-ovlira-state-target="error" aria-pressed="false">Error</button><button type="button" class="state-button" data-ovlira-state-target="success" aria-pressed="false">Saved</button></nav><section data-ovlira-state="records"><ov-data-table caption="Projects"></ov-data-table></section><section data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Loading projects">Fetching the latest records.</ov-alert></section><section data-ovlira-state="empty" hidden><ov-empty-state title="No projects yet" description="Create the first project to begin."><ov-button slot="action" variant="primary">Create project</ov-button></ov-empty-state></section><section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Could not load projects">Check the connection and try again.</ov-alert></section><section data-ovlira-state="success" hidden><ov-alert tone="success" heading="Project created">The new project is ready to open.</ov-alert></section></main>`;
}

async function checkCommand(cwd: string, args: ParsedArgs, io: CliIO): Promise<number> {
  const result = await validateProject(cwd);
  if (args.json) io.stdout(JSON.stringify(result, null, 2));
  else if (result.ok) io.stdout(`ovlira check: passed (${result.filesScanned} files scanned)`);
  else io.stdout([`ovlira check: ${result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length} error(s), ${result.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length} warning(s)`, ...result.diagnostics.map(formatDiagnostic)].join('\n'));
  return result.ok ? 0 : 1;
}

export async function validateProject(cwd: string) {
  const manifestPath = path.join(cwd, '.ovlira.json');
  const diagnostics: Diagnostic[] = [];
  if (!await exists(manifestPath)) {
    diagnostics.push({ ruleId: 'project.not-initialized', severity: 'error', message: 'This directory is not an Ovlira project.', file: '.ovlira.json', line: 1, suggestion: 'Run “ovlira init” in the project directory.' });
    return { version: 1, ok: false, filesScanned: 0, diagnostics };
  }
  const manifest = await readManifest(manifestPath);
  const files = await collectProjectFiles(cwd);
  for (const tag of manifest.added) if (!componentForTag(tag)) diagnostics.push({ ruleId: 'component.unknown', severity: 'error', message: `Unknown Ovlira component “${tag}” in .ovlira.json.`, file: '.ovlira.json', line: 1, suggestion: 'Remove the entry or add the component from the current catalogue.' });
  for (const file of files) validateUnknownComponents(file, diagnostics);
  for (const file of files) validateRequiredProps(file, diagnostics);
  for (const file of files) validateNesting(file, diagnostics);
  validateRecipeStates(manifest, files, diagnostics);
  validatePrimaryActions(files, diagnostics);
  validateTokens(files, diagnostics);
  validateHeadings(files, diagnostics);
  diagnostics.sort((a, b) => `${a.file ?? ''}:${a.line ?? 0}:${a.ruleId}`.localeCompare(`${b.file ?? ''}:${b.line ?? 0}:${b.ruleId}`));
  return { version: 1, ok: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'), filesScanned: files.length, diagnostics };
}

async function collectProjectFiles(cwd: string): Promise<FileText[]> {
  const result: FileText[] = [];
  async function walk(directory: string) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (projectFiles.has(path.extname(entry.name))) result.push({ absolute, relative: path.relative(cwd, absolute).split(path.sep).join('/'), text: await fs.readFile(absolute, 'utf8') });
    }
  }
  await walk(cwd);
  return result.sort((a, b) => a.relative.localeCompare(b.relative));
}

function validateUnknownComponents(file: FileText, diagnostics: Diagnostic[]) {
  const known = new Set(components.map((component) => component.api.tag));
  const pattern = /<(ov-[a-z0-9-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(file.text))) {
    if (!known.has(match[1])) pushDiagnostic(diagnostics, 'component.unknown', 'error', `Unknown Ovlira component “${match[1]}”.`, file, match.index, 'Search the catalogue and add an approved component.');
  }
}

function validateRequiredProps(file: FileText, diagnostics: Diagnostic[]) {
  const requiredByTag = new Map(components.flatMap((component) => (component.guidance.requiredProps ?? []).map((prop) => [component.api.tag, prop] as const)));
  const assignedProperties = collectAssignedProperties(file.relative, file.text);
  const pattern = /<(ov-[a-z0-9-]+)\b([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(file.text))) {
    const required = requiredByTag.get(match[1]);
    if (required && !new RegExp(`(?:^|\\s|[.:])${required}(?:\\s|=|/|>|\\})`, 'i').test(match[2]) && !assignedProperties.has(`${match[1]}.${required}`)) pushDiagnostic(diagnostics, 'component.required-prop', 'error', `${match[1]} requires a ${required} prop.`, file, match.index, `Add ${required}="…" and keep it meaningful.`);
  }
}

function validateNesting(file: FileText, diagnostics: Diagnostic[]) {
  const disallowed = new Map(components.flatMap((component) => (component.guidance.disallowedChildren ?? []).map((child) => [component.api.tag, child] as const)));
  const stack: string[] = [];
  const pattern = /<\/?(ov-[a-z0-9-]+)\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(file.text))) {
    const full = match[0];
    const tag = match[1];
    if (full.startsWith('</')) { const index = stack.lastIndexOf(tag); if (index >= 0) stack.splice(index, 1); continue; }
    const parent = stack.at(-1);
    if (parent && disallowed.get(parent) === tag) pushDiagnostic(diagnostics, 'composition.disallowed-child', 'error', `${tag} cannot be nested inside ${parent}.`, file, match.index, 'Use a single action component and place additional actions beside it.');
    if (!full.endsWith('/>')) stack.push(tag);
  }
}

function validateRecipeStates(manifest: ProjectManifest, files: FileText[], diagnostics: Diagnostic[]) {
  const combined = files.map((file) => file.text).join('\n');
  for (const recipeId of manifest.recipes) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) { diagnostics.push({ ruleId: 'recipe.unknown', severity: 'error', message: `Unknown recipe “${recipeId}” in .ovlira.json.`, file: '.ovlira.json', line: 1, suggestion: 'Remove the entry or add the recipe from the current catalogue.' }); continue; }
    for (const state of recipe.requiredStates) if (!new RegExp(`data-ovlira-state=["']${state}["']`, 'i').test(combined)) {
      const file = files.find((candidate) => candidate.relative === manifest.entry) ?? files[0];
      diagnostics.push({ ruleId: 'recipe.required-state', severity: 'error', message: `${recipe.id} is missing its required ${state} state.`, file: file?.relative, line: file ? lineNumber(file.text, file.text.search(/<|$/)) : undefined, suggestion: `Add a visible or switchable element marked data-ovlira-state="${state}".` });
    }
  }
}

function validatePrimaryActions(files: FileText[], diagnostics: Diagnostic[]) {
  for (const file of files) {
    const regionPattern = /<(section|form|div)\b[^>]*data-ovlira-region=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi;
    let region: RegExpExecArray | null;
    while ((region = regionPattern.exec(file.text))) {
      const count = (region[3].match(/<ov-button\b[^>]*variant=["']primary["'][^>]*>/gi) ?? []).length;
      if (count > 1) pushDiagnostic(diagnostics, 'actions.one-primary', 'error', `Region “${region[2]}” contains ${count} primary actions.`, file, region.index, 'Keep one primary action in a task region; make secondary actions secondary or quiet.');
    }
  }
}

function validateTokens(files: FileText[], diagnostics: Diagnostic[]) {
  const approved = new Set(flattenTokenValues(tokens));
  for (const file of files) {
    if (file.relative.endsWith(`src/styles/${themeFileName}`) || file.relative.endsWith(`src/styles/${legacyThemeFileName}`) || file.relative.startsWith('src/components/ovlira/')) continue;
    const pattern = /#[0-9a-f]{3,8}\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(file.text))) if (!approved.has(match[0].toLowerCase())) pushDiagnostic(diagnostics, 'tokens.unapproved-literal', 'warning', `Literal color ${match[0]} is not an approved Ovlira token value.`, file, match.index, 'Use a --ov-* custom property from the token export.');
    const declarationPattern = /(?:padding|gap|border-radius|font-size)\s*:\s*([^;{}\n]+)/gi;
    while ((match = declarationPattern.exec(file.text))) {
      const value = match[1].trim();
      if (value !== '0' && !value.includes('var(--ov-') && !approved.has(value)) pushDiagnostic(diagnostics, 'tokens.unapproved-literal', 'warning', `Literal token value “${value}” is not in the approved Ovlira token set.`, file, match.index, 'Use a --ov-* custom property from the token export.');
    }
  }
}

function flattenTokenValues(value: unknown): string[] {
  if (typeof value === 'string') return [value.toLowerCase()];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(flattenTokenValues);
}

function validateHeadings(files: FileText[], diagnostics: Diagnostic[]) {
  const headings: { level: number; file: FileText; index: number }[] = [];
  for (const file of files) {
    if (file.relative.startsWith('src/components/ovlira/')) continue;
    const pattern = /<h([1-6])\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(file.text))) headings.push({ level: Number(match[1]), file, index: match.index });
    if (!/<h1\b/i.test(file.text)) {
      const pageHeader = /<ov-page-header\b[^>]*\btitle\s*=/i.exec(file.text);
      if (pageHeader) headings.push({ level: 1, file, index: pageHeader.index });
    }
  }
  headings.sort((a, b) => a.file.relative.localeCompare(b.file.relative) || a.index - b.index);
  if (headings[0] && headings[0].level !== 1) pushDiagnostic(diagnostics, 'a11y.heading-start', 'warning', `Heading hierarchy starts at h${headings[0].level}.`, headings[0].file, headings[0].index, 'Start the main page hierarchy with one h1.');
  for (let index = 1; index < headings.length; index += 1) if (headings[index].level - headings[index - 1].level > 1) pushDiagnostic(diagnostics, 'a11y.heading-jump', 'warning', `Heading hierarchy jumps from h${headings[index - 1].level} to h${headings[index].level}.`, headings[index].file, headings[index].index, 'Use the next heading level or restructure the section.');
}

function pushDiagnostic(diagnostics: Diagnostic[], ruleId: string, severity: Diagnostic['severity'], message: string, file: FileText, index: number, suggestion: string) {
  diagnostics.push({ ruleId, severity, message, file: file.relative, line: lineNumber(file.text, index), suggestion });
}

function lineNumber(text: string, index: number) { return text.slice(0, Math.max(index, 0)).split('\n').length; }
function formatDiagnostic(diagnostic: Diagnostic) { return `[${diagnostic.severity}] ${diagnostic.ruleId} ${diagnostic.file ?? ''}${diagnostic.line ? `:${diagnostic.line}` : ''} — ${diagnostic.message}\n  fix: ${diagnostic.suggestion}`; }
async function exists(file: string) { try { await fs.access(file); return true; } catch { return false; } }

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.endsWith(`${path.sep}cli${path.sep}index.js`) || invokedPath.endsWith(`${path.sep}cli${path.sep}index.ts`)) {
  runCli(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
