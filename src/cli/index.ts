#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogue, catalogueSchemaVersion, componentForTag, components, metadataReport, recipes, registryIndex, resolveDescriptor, searchCatalogue } from '../catalogue/index.js';
import { recipeFixtureMarkup, recipeFixtureStyles, type RecipeFixtureId } from '../recipes/fixtures.js';
import { collectAssignedProperties } from '../validator/ast.js';
import { packageVersion } from '../version.js';
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
  parseError?: { code: string; message: string; suggestion: string };
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
  if (args.parseError) return writeCliError(args, io, args.parseError.code, args.parseError.message, args.parseError.suggestion);
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
      case '--version': io.stdout(packageVersion); return 0;
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
  let parseError: ParsedArgs['parseError'];
  let index = 0;
  const setParseError = (error: NonNullable<ParsedArgs['parseError']>) => { parseError ??= error; };
  const nextValue = (option: string, allowLeadingDash = false) => {
    const candidate = argv[index + 1];
    if (candidate === undefined || (!allowLeadingDash && candidate.startsWith('-'))) {
      setParseError({ code: 'cli.missing-option-value', message: `Option “${option}” requires a value.`, suggestion: `Pass a value after ${option}.` });
      return '';
    }
    index += 1;
    return candidate;
  };
  const setLimit = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setParseError({ code: 'cli.invalid-option', message: `Invalid --limit value “${raw}”.`, suggestion: 'Use a positive whole number for --limit.' });
      return;
    }
    limit = parsed;
  };
  for (; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') json = true;
    else if (arg === '--force') force = true;
    else if (arg === '--cwd') cwd = path.resolve(startingCwd, nextValue('--cwd'));
    else if (arg === '--format') format = nextValue('--format');
    else if (arg.startsWith('--format=')) format = arg.slice('--format='.length);
    else if (arg === '--kind') kind = nextValue('--kind') as ParsedArgs['kind'];
    else if (arg.startsWith('--kind=')) kind = arg.slice('--kind='.length) as ParsedArgs['kind'];
    else if (arg === '--tag') tag = nextValue('--tag');
    else if (arg.startsWith('--tag=')) tag = arg.slice('--tag='.length);
    else if (arg === '--category') category = nextValue('--category');
    else if (arg.startsWith('--category=')) category = arg.slice('--category='.length);
    else if (arg === '--limit') setLimit(nextValue('--limit', true));
    else if (arg.startsWith('--limit=')) setLimit(arg.slice('--limit='.length));
    else if (arg === '--section') section = nextValue('--section') as ParsedArgs['section'];
    else if (arg.startsWith('--section=')) section = arg.slice('--section='.length) as ParsedArgs['section'];
    else if (arg === '--entry') entry = nextValue('--entry');
    else if (arg.startsWith('--entry=')) entry = arg.slice('--entry='.length);
    else if ((arg === '--help' || arg === '-h') && !positional.length) positional.push('help');
    else if ((arg === '--version' || arg === '-v') && !positional.length) positional.push('version');
    else if (!arg.startsWith('-')) positional.push(arg);
    else setParseError({ code: 'cli.unknown-option', message: `Unknown option “${arg}”.`, suggestion: 'Run “ovlira help” to see supported options.' });
  }
  if (!parseError && kind && !['component', 'recipe'].includes(kind)) parseError = { code: 'cli.invalid-option', message: `Invalid --kind value “${kind}”.`, suggestion: 'Use --kind component or --kind recipe.' };
  if (!parseError && section && !['api', 'guidance', 'example'].includes(section)) parseError = { code: 'cli.invalid-option', message: `Invalid --section value “${section}”.`, suggestion: 'Use --section api, --section guidance, or --section example.' };
  if (!parseError && format && !['css', 'json'].includes(format)) parseError = { code: 'cli.invalid-option', message: `Invalid --format value “${format}”.`, suggestion: 'Use --format css or --format json.' };
  return { command: positional.shift() ?? 'help', positional, json, cwd: path.resolve(cwd), format, force, kind, tag, category, limit: Math.max(1, Math.min(limit, 100)), section, entry, parseError };
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
  return { useWhen: item.useWhen, avoidWhen: item.avoidWhen, components: item.components, requiredStates: item.requiredStates, constraints: item.constraints, composition: item.composition, contentRegions: item.contentRegions, extensionPoints: item.extensionPoints };
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
  const tags = item.kind === 'component' ? [item.api.tag] : item.components;
  const nextManifest: ProjectManifest = {
    version: manifest.version,
    added: [...manifest.added],
    recipes: [...manifest.recipes],
    entry: args.entry ? projectRelativePath(target, args.entry) : manifest.entry,
  };
  for (const tag of tags) if (!nextManifest.added.includes(tag)) nextManifest.added.push(tag);
  if (item.kind === 'recipe' && !nextManifest.recipes.includes(item.id)) nextManifest.recipes.push(item.id);

  const plans: PlannedFile[] = [];
  for (const tag of tags) {
    const component = componentForTag(tag);
    if (!component) continue;
    const file = `${component.api.tag.replace('ov-', '')}.ts`;
    const destination = path.join(target, 'src', 'components', 'ovlira', file);
    plans.push({
      absolute: destination,
      relative: projectRelativePath(target, destination),
      content: await fs.readFile(path.join(sourceRoot, 'components', file), 'utf8'),
    });
  }
  const theme = await projectTheme(target);
  plans.push({ absolute: theme.absolute, relative: theme.relative, content: await fs.readFile(tokenCssPath, 'utf8'), preserveExisting: true });
  const entryPath = path.join(target, nextManifest.entry);
  const entryExists = await exists(entryPath);
  const entryIsStarter = entryExists && (await fs.readFile(entryPath, 'utf8')).includes('ovlira add page.settings');
  const entryWritten = !entryExists || entryIsStarter || Boolean(args.entry);
  if (!entryExists || entryIsStarter || args.entry) {
    plans.push({
      absolute: entryPath,
      relative: projectRelativePath(target, entryPath),
      content: item.kind === 'recipe' ? recipeEntry(item, theme.fileName) : componentEntry(item, theme.fileName),
      forceWhenStarter: entryIsStarter || !entryExists,
    });
  } else {
    const examplePath = path.join(target, 'src', 'ovlira-example.ts');
    plans.push({
      absolute: examplePath,
      relative: projectRelativePath(target, examplePath),
      content: item.kind === 'recipe' ? recipeEntry(item, theme.fileName) : componentEntry(item, theme.fileName),
    });
  }
  const barrelPath = path.join(target, 'src', 'ovlira.generated.ts');
  const barrel = `${orderedAddedTags(nextManifest.added).map((tag) => `import './components/ovlira/${tag.replace('ov-', '')}.js';`).join('\n')}\n`;
  plans.push({ absolute: barrelPath, relative: projectRelativePath(target, barrelPath), content: barrel });

  const statuses = await Promise.all(plans.map(async (plan) => ({ plan, status: await plannedFileStatus(plan, args.force) })));
  const conflicts = statuses.filter(({ status }) => status === 'conflict').map(({ plan }) => plan.relative);
  if (conflicts.length && !args.force) {
    const result = { version: 1, ok: false, id: item.id, kind: item.kind, added: tags, files: [], changed: [], skipped: [], conflicts, entry: entryWritten ? nextManifest.entry : 'src/ovlira-example.ts' };
    if (args.json) io.stdout(JSON.stringify(result, null, 2));
    else io.stdout(`Could not safely add ${item.id}\n${conflicts.map((file) => `  conflict ${file}`).join('\n')}`);
    return 1;
  }

  for (const { plan, status } of statuses) if (status === 'changed') {
    await fs.mkdir(path.dirname(plan.absolute), { recursive: true });
    await fs.writeFile(plan.absolute, plan.content);
  }
  await fs.writeFile(manifestPath, JSON.stringify(nextManifest, null, 2) + '\n');
  const changed = statuses.filter(({ status }) => status === 'changed').map(({ plan }) => plan.relative);
  const skipped = statuses.filter(({ status }) => status === 'skipped').map(({ plan }) => plan.relative);
  const result = { version: 1, ok: true, id: item.id, kind: item.kind, added: tags, files: [...changed, ...skipped], changed, skipped, conflicts: [], entry: entryWritten ? nextManifest.entry : 'src/ovlira-example.ts' };
  if (args.json) io.stdout(JSON.stringify(result, null, 2));
  else io.stdout(`Added ${item.id}\n${changed.map((file) => `  changed ${file}`).join('\n')}${skipped.map((file) => `  kept ${file}`).join('\n')}`);
  return 0;
}

type FileStatus = 'changed' | 'skipped' | 'conflict';

interface PlannedFile {
  absolute: string;
  relative: string;
  content: string;
  preserveExisting?: boolean;
  forceWhenStarter?: boolean;
}

async function plannedFileStatus(plan: PlannedFile, force: boolean): Promise<FileStatus> {
  if (!await exists(plan.absolute)) return 'changed';
  if (plan.preserveExisting) return 'skipped';
  if (await fs.readFile(plan.absolute, 'utf8') === plan.content) return 'skipped';
  if (force || plan.forceWhenStarter) return 'changed';
  return 'conflict';
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
body { background: var(--ov-bg, var(--ov-color-canvas)); color: var(--ov-text, var(--ov-color-ink)); font-family: var(--ov-font-sans); font-size: var(--ov-text-md); -webkit-font-smoothing: antialiased; }
button, input, select, textarea { font: inherit; }
.starter, .demo { margin: 12vh auto; max-width: var(--ov-content-narrow, 34rem); padding-inline: var(--ov-space-6); }
.preview-stack { display: grid; gap: var(--ov-space-4, 1rem); }
.starter h1, .demo h1 { font-size: var(--ov-text-xl); font-weight: 600; letter-spacing: -0.025em; line-height: var(--ov-line-tight); margin: 0 0 var(--ov-space-4); }
.starter p:not(.kicker) { color: var(--ov-muted, var(--ov-color-muted)); line-height: var(--ov-line-body); }
.kicker { color: var(--ov-faint, var(--ov-color-muted)); font: 600 var(--ov-text-xs) / 1.2 var(--ov-font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
code { font-family: var(--ov-font-mono); overflow-wrap: anywhere; }
${recipeFixtureStyles}
`;
}

function componentEntry(item: ComponentDescriptor, theme = themeFileName): string {
  return `import './ovlira.generated.js';
import './styles/${theme}';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = \`${componentMarkup(item)}\`;
  ${item.api.tag === 'ov-select' ? "const select = app.querySelector('ov-select'); if (select) select.options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }];" : item.api.tag === 'ov-radio-group' ? "const radioGroup = app.querySelector('ov-radio-group'); if (radioGroup) radioGroup.options = [{ value: 'private', label: 'Only me' }, { value: 'team', label: 'Everyone on the team' }];" : item.api.tag === 'ov-menu' ? "const menu = app.querySelector('ov-menu'); if (menu) menu.items = [{ value: 'duplicate', label: 'Duplicate project' }, { value: 'archive', label: 'Archive project', tone: 'danger' }];" : item.api.tag === 'ov-pagination' ? '' : item.api.tag === 'ov-combobox' ? "const combobox = app.querySelector('ov-combobox'); if (combobox) combobox.options = [{ value: 'maya', label: 'Maya Chen' }, { value: 'jon', label: 'Jon Bell' }, { value: 'anika', label: 'Anika Rao' }];" : item.api.tag === 'ov-tabs' ? "const tabs = app.querySelector('ov-tabs'); if (tabs) tabs.items = [{ value: 'overview', label: 'Overview' }, { value: 'activity', label: 'Activity' }, { value: 'settings', label: 'Settings' }];" : item.api.tag === 'ov-breadcrumbs' ? "const breadcrumbs = app.querySelector('ov-breadcrumbs'); if (breadcrumbs) breadcrumbs.items = [{ label: 'Projects', href: '/projects' }, { label: 'Northstar studio', href: '/projects/northstar' }, { label: 'Settings' }];" : item.api.tag === 'ov-accordion' ? "const accordion = app.querySelector('ov-accordion'); if (accordion) { accordion.items = [{ value: 'summary', label: 'Project summary' }, { value: 'members', label: 'Members' }]; accordion.innerHTML = '<p slot=\"summary\">A concise overview of the project.</p><p slot=\"members\">Three people have access.</p>'; }" : ''}
}
`;
}

function componentMarkup(item: ComponentDescriptor): string {
  switch (item.api.tag) {
    case 'ov-input': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Input</h1><ov-input label="Workspace name" placeholder="e.g. Northstar"></ov-input></main>';
    case 'ov-textarea': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Textarea</h1><ov-textarea label="Project description" rows="5" placeholder="What is this project for?"></ov-textarea></main>';
    case 'ov-checkbox': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Checkbox</h1><ov-checkbox label="Keep me signed in" name="remember" checked></ov-checkbox></main>';
    case 'ov-radio-group': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Radio group</h1><ov-radio-group label="Workspace visibility" name="visibility" value="team"></ov-radio-group></main>';
    case 'ov-toggle': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Toggle</h1><ov-toggle label="Email me about project activity" name="activity" checked></ov-toggle></main>';
    case 'ov-dialog': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Dialog</h1><ov-dialog heading="Archive this project?" description="People will lose access to the project workspace." open><p>This action can be reversed later from project settings.</p><ov-button slot="actions" variant="danger">Archive project</ov-button></ov-dialog></main>';
    case 'ov-select': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Select</h1><ov-select label="Region"></ov-select></main>';
    case 'ov-spinner': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Spinner</h1><ov-spinner label="Loading projects"></ov-spinner></main>';
    case 'ov-menu': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Menu</h1><ov-menu label="Project actions"></ov-menu></main>';
    case 'ov-pagination': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Pagination</h1><ov-pagination current-page="2" total-pages="12" label="Project pages"></ov-pagination></main>';
    case 'ov-combobox': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Combobox</h1><ov-combobox label="Project owner" placeholder="Search people"></ov-combobox></main>';
    case 'ov-tabs': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Tabs</h1><ov-tabs label="Project views" value="overview"><p slot="overview">A summary of the project.</p><p slot="activity">Recent project activity.</p><p slot="settings">Project preferences.</p></ov-tabs></main>';
    case 'ov-toast': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Toast</h1><ov-toast tone="success" heading="Saved" open>Your project is up to date.</ov-toast></main>';
    case 'ov-progress': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Progress</h1><ov-progress label="Importing projects" value="68" max="100" show-value></ov-progress></main>';
    case 'ov-skeleton': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Skeleton</h1><section class="preview-stack" aria-busy="true" aria-label="Loading project details"><ov-skeleton variant="heading"></ov-skeleton><ov-skeleton variant="text" lines="3"></ov-skeleton></section></main>';
    case 'ov-tooltip': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Tooltip</h1><ov-tooltip content="Keyboard shortcut: /"><button slot="trigger" type="button" aria-label="Search help">?</button></ov-tooltip></main>';
    case 'ov-avatar': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Avatar</h1><ov-avatar name="Maya Chen" status="online"></ov-avatar></main>';
    case 'ov-breadcrumbs': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Breadcrumbs</h1><ov-breadcrumbs label="Project path"></ov-breadcrumbs></main>';
    case 'ov-accordion': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Accordion</h1><ov-accordion></ov-accordion></main>';
    case 'ov-slider': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>Slider</h1><ov-slider label="Opacity" min="0" max="100" value="68" show-value></ov-slider></main>';
    case 'ov-file-upload': return '<main class="demo"><p class="kicker">OVLIRA / COMPONENT</p><h1>File upload</h1><ov-file-upload label="Project archive" accept=".zip" name="archive"></ov-file-upload></main>';
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
  const seams = `<!-- Ovlira adaptation seams — content regions: ${recipe.contentRegions.join(', ')}; data: ${recipe.extensionPoints.data.join(', ')}; actions: ${recipe.extensionPoints.actions.join(', ')}; navigation: ${recipe.extensionPoints.navigation.join(', ')}. -->`;
  const markup = `${seams}\n${recipeFixtureMarkup(recipe.id as RecipeFixtureId)}`;
  const setup = recipeSetup(recipe);
  const behavior = recipeBehavior(recipe);
  return `import './ovlira.generated.js';\nimport './styles/${theme}';\nimport './styles.css';\n\nconst app = document.querySelector<HTMLDivElement>('#app');\nif (app) {\n  app.innerHTML = \`${markup}\`;\n  ${setup}\n  const stateButtons = app.querySelectorAll<HTMLElement>('[data-ovlira-state-target]');\n  const states = app.querySelectorAll<HTMLElement>('[data-ovlira-state]');\n  const showState = (name: string) => {\n    states.forEach((state) => { state.hidden = state.dataset.ovliraState !== name; });\n    stateButtons.forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.ovliraStateTarget === name)); });\n  };\n  stateButtons.forEach((button) => button.addEventListener('click', () => showState(button.dataset.ovliraStateTarget ?? '')));\n  ${behavior}\n}\n`;
}

function recipeSetup(recipe: RecipeDescriptor): string {
  if (recipe.id === 'page.settings') return "const selects = app.querySelectorAll('ov-select'); if (selects[0]) selects[0].options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }]; if (selects[1]) selects[1].options = [{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }];";
  if (recipe.id === 'page.search') return "const select = app.querySelector('ov-select'); if (select) select.options = [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]; const table = app.querySelector('ov-data-table'); if (table) { table.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }]; table.rows = [{ name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' }, { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' }, { name: 'Signal house', owner: 'Anika Rao', status: 'Active' }]; }";
  if (recipe.id === 'page.crud-table') return "const dataTable = app.querySelector('ov-data-table'); if (dataTable) { dataTable.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'updated', label: 'Updated' }]; dataTable.rows = [{ name: 'Northstar studio', owner: 'Maya Chen', updated: 'Today' }, { name: 'Field notes', owner: 'Jon Bell', updated: 'Yesterday' }]; }";
  return '';
}

function recipeBehavior(recipe: RecipeDescriptor): string {
  if (recipe.id === 'page.settings') return "app.querySelectorAll<HTMLElement>('[data-ovlira-action=\\\"save\\\"]').forEach((button) => button.addEventListener('click', () => { const status = app.querySelector<HTMLElement & { heading?: string }>('[data-settings-status]'); if (status) { status.heading = 'Changes saved'; status.textContent = 'Your workspace details are up to date.'; } showState('success'); }));";
  if (recipe.id === 'page.search') return `const readValue = (selector: string) => { const host = app.querySelector<HTMLElement & { value?: string }>(selector); const native = host?.shadowRoot?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select'); return native?.value ?? host?.value ?? ''; };
  const searchTable = app.querySelector('ov-data-table');
  app.querySelector<HTMLElement>('[data-ovlira-action="search"]')?.addEventListener('click', () => {
    showState('loading');
    window.setTimeout(() => {
      const query = readValue('[data-ovlira-search-input]').trim().toLowerCase();
      const status = readValue('[data-ovlira-search-status]');
      const rows = [
        { name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' },
        { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' },
        { name: 'Signal house', owner: 'Anika Rao', status: 'Active' },
      ].filter((row) => (!query || Object.values(row).some((value) => value.toLowerCase().includes(query))) && (!status || status === 'all' || row.status.toLowerCase() === status));
      if (searchTable) searchTable.rows = rows;
      const count = app.querySelector<HTMLElement>('[data-ovlira-result-count]');
      if (count) count.textContent = \`${'${rows.length}'} match${'${rows.length === 1 ? "" : "es"}'}\`;
      showState(rows.length ? 'results' : 'empty');
    }, 180);
  });
  app.querySelector<HTMLElement>('[data-ovlira-action="search-create"]')?.addEventListener('click', () => {
    if (searchTable) searchTable.rows = [{ name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' }, { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' }, { name: 'Signal house', owner: 'Anika Rao', status: 'Active' }];
    const count = app.querySelector<HTMLElement>('[data-ovlira-result-count]');
    if (count) count.textContent = '3 matches';
    showState('results');
  });`;
  if (recipe.id === 'page.crud-table') return `const readValue = (selector: string) => { const host = app.querySelector<HTMLElement & { value?: string }>(selector); const native = host?.shadowRoot?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select'); return native?.value ?? host?.value ?? ''; };
  const table = app.querySelector('ov-data-table');
  const createForm = app.querySelector<HTMLElement>('[data-ovlira-create-form]');
  app.querySelectorAll<HTMLElement>('[data-ovlira-action="create"]').forEach((button) => button.addEventListener('click', () => { if (createForm) { createForm.hidden = false; requestAnimationFrame(() => createForm.querySelector('ov-input')?.shadowRoot?.querySelector('input')?.focus()); } }));
  app.querySelector<HTMLElement>('[data-ovlira-action="save"]')?.addEventListener('click', () => {
    const name = readValue('[data-ovlira-create-input]').trim() || 'Untitled project';
    if (table) table.rows = [{ name, owner: 'You', updated: 'Just now' }, ...table.rows];
    if (createForm) createForm.hidden = true;
    showState('success');
  });`;
  if (recipe.id === 'page.detail') return `const readValue = (selector: string) => { const host = app.querySelector<HTMLElement & { value?: string }>(selector); const native = host?.shadowRoot?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select'); return native?.value ?? host?.value ?? ''; };
  const editForm = app.querySelector<HTMLElement>('[data-ovlira-edit-form]');
  app.querySelector<HTMLElement>('[data-ovlira-action="edit"]')?.addEventListener('click', () => { if (editForm) { editForm.hidden = false; requestAnimationFrame(() => editForm.querySelector('ov-input')?.shadowRoot?.querySelector('input')?.focus()); } });
  app.querySelector<HTMLElement>('[data-ovlira-action="save-detail"]')?.addEventListener('click', () => { const name = readValue('[data-ovlira-detail-input]').trim(); const header = app.querySelector('ov-page-header'); if (header && name) header.title = name; if (editForm) editForm.hidden = true; showState('ready'); });
  app.querySelector<HTMLElement>('[data-ovlira-action="back"]')?.addEventListener('click', () => { if (editForm) editForm.hidden = true; showState('ready'); });`;
  if (recipe.id === 'state.empty') return "const emptyState = app.querySelector<HTMLElement>('[data-ovlira-state=empty]'); const successState = app.querySelector<HTMLElement>('[data-ovlira-state=success]'); app.querySelector<HTMLElement>('[data-ovlira-action=\\\"create-empty\\\"]')?.addEventListener('click', () => { if (emptyState) emptyState.hidden = true; if (successState) successState.hidden = false; });";
  if (recipe.id === 'shell.application') return "app.querySelectorAll<HTMLAnchorElement>('[data-ovlira-nav]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); app.querySelectorAll('[data-ovlira-nav]').forEach((item) => item.removeAttribute('aria-current')); link.setAttribute('aria-current', 'page'); const destination = link.dataset.ovliraNav ?? 'Overview'; const utility = app.querySelector<HTMLElement>('[data-shell-utility]'); if (utility) utility.textContent = 'Workspace · ' + destination; const header = app.querySelector<HTMLElement & { title?: string }>('[data-shell-header]'); if (header) header.title = destination === 'Overview' ? 'Project overview' : destination; })); app.querySelector<HTMLElement>('[data-ovlira-action=\"new\"]')?.addEventListener('click', () => { const activity = app.querySelector<HTMLElement>('[data-shell-activity]'); if (activity) activity.textContent = 'New project flow opened. Keep the shell in place while the task changes.'; });";
  return '';
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
  for (const file of files) {
    if (file.relative.startsWith('src/components/ovlira/')) continue;
    const headings: { level: number; index: number }[] = [];
    const pattern = /<h([1-6])\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(file.text))) headings.push({ level: Number(match[1]), index: match.index });
    if (!/<h1\b/i.test(file.text)) {
      const pageHeader = /<ov-page-header\b[^>]*\btitle\s*=/i.exec(file.text);
      if (pageHeader) headings.push({ level: 1, index: pageHeader.index });
    }
    headings.sort((a, b) => a.index - b.index);
    if (headings[0] && headings[0].level !== 1) pushDiagnostic(diagnostics, 'a11y.heading-start', 'warning', `Heading hierarchy starts at h${headings[0].level}.`, file, headings[0].index, 'Start the main page hierarchy with one h1.');
    for (let index = 1; index < headings.length; index += 1) if (headings[index].level - headings[index - 1].level > 1) pushDiagnostic(diagnostics, 'a11y.heading-jump', 'warning', `Heading hierarchy jumps from h${headings[index - 1].level} to h${headings[index].level}.`, file, headings[index].index, 'Use the next heading level or restructure the section.');
  }
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
