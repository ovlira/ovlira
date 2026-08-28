#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runCli } from '../cli/index.js';

export type TestSpecKind = 'workflow';
export type TestAssertionType = 'search.contains' | 'inspect.kind' | 'check.exit' | 'diagnostic.contains';

export interface TestAssertion {
  type: TestAssertionType;
  id: string;
  kind: string;
  ruleId: string;
  expected: string;
}

export interface TestSpec {
  version: 1;
  id: string;
  kind: TestSpecKind;
  prompt: string;
  search: string;
  targetId: string;
  targetKind: 'component' | 'recipe';
  assertions: TestAssertion[];
}

export interface AssertionResult {
  type: TestAssertionType;
  passed: boolean;
  detail: string;
}

export interface SpecRunResult {
  id: string;
  passed: boolean;
  assertions: AssertionResult[];
  failure?: string;
}

export interface SpecReport {
  version: 1;
  specs: SpecRunResult[];
  summary: { total: number; passed: number; failed: number; passRate: number };
}

interface CliResult { code: number; stdout: string[]; stderr: string[] }

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const specsPath = path.join(packageRoot, 'src', 'evals', 'specs.json');

export async function loadTestSpecs(): Promise<TestSpec[]> {
  const value = JSON.parse(await fs.readFile(specsPath, 'utf8')) as unknown;
  if (!Array.isArray(value)) throw new Error('Structured test specs must be an array.');
  const specs = value.map((spec, index) => parseTestSpec(spec, `specs[${index}]`));
  const ids = new Set<string>();
  for (const spec of specs) {
    if (ids.has(spec.id)) throw new Error(`Duplicate structured test spec ID “${spec.id}”.`);
    ids.add(spec.id);
  }
  return specs;
}

export async function runSpecById(id: string): Promise<SpecRunResult> {
  const spec = (await loadTestSpecs()).find((candidate) => candidate.id === id);
  if (!spec) throw new Error(`Unknown structured test spec “${id}”.`);
  return runSpec(spec);
}

export async function runSpecs(): Promise<SpecReport> {
  const specs = await loadTestSpecs();
  const results = await Promise.all(specs.map(runSpec));
  const passed = results.filter((result) => result.passed).length;
  return { version: 1, specs: results, summary: { total: results.length, passed, failed: results.length - passed, passRate: results.length ? Number((passed / results.length).toFixed(3)) : 0 } };
}

export function renderSpecAsVitest(spec: TestSpec, importPath = '../../src/evals/spec-runner.js'): string {
  const title = spec.prompt.replace(/\s+/g, ' ').trim().replace(/\*\//g, '* /');
  return `import { describe, expect, it } from 'vitest';
import { runSpecById } from ${JSON.stringify(importPath)};

describe(${JSON.stringify(`${spec.id}: ${title}`)}, () => {
  it('passes its approved Ovlira assertions', async () => {
    const result = await runSpecById(${JSON.stringify(spec.id)});
    expect(result.passed, result.failure ?? JSON.stringify(result.assertions)).toBe(true);
  });
});
`;
}

async function runSpec(spec: TestSpec): Promise<SpecRunResult> {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), `ovlira-spec-${spec.id}-`));
  try {
    const init = await runCommand(['init', '.', '--json'], project);
    if (init.code !== 0) return { id: spec.id, passed: false, assertions: [], failure: 'Could not initialize the temporary project.' };

    const search = await runCommand(['search', spec.search, '--json'], project);
    const searchJson = parseObject(search.stdout[0]);
    const inspect = await runCommand(['inspect', spec.targetId, '--json'], project);
    const inspectJson = parseObject(inspect.stdout[0]);
    const add = await runCommand(['add', spec.targetId, '--cwd', project, '--json'], project);
    const check = await runCommand(['check', '--cwd', project, '--json'], project);
    const checkJson = parseObject(check.stdout[0]);
    const assertions = spec.assertions.map((assertion) => evaluateAssertion(assertion, { search, searchJson, inspect, inspectJson, add, check, checkJson }));
    const failed = assertions.find((assertion) => !assertion.passed);
    return { id: spec.id, passed: !failed, assertions, ...(failed ? { failure: failed.detail } : {}) };
  } finally {
    await fs.rm(project, { recursive: true, force: true });
  }
}

function evaluateAssertion(assertion: TestAssertion, values: { search: CliResult; searchJson: Record<string, unknown>; inspect: CliResult; inspectJson: Record<string, unknown>; add: CliResult; check: CliResult; checkJson: Record<string, unknown> }): AssertionResult {
  if (assertion.type === 'search.contains') {
    const results = Array.isArray(values.searchJson.results) ? values.searchJson.results : [];
    const passed = values.search.code === 0 && results.some((result) => result && typeof result === 'object' && (result as { id?: unknown }).id === assertion.id);
    return { type: assertion.type, passed, detail: passed ? `search returned ${assertion.id}` : `search did not return ${assertion.id}` };
  }
  if (assertion.type === 'inspect.kind') {
    const passed = values.inspect.code === 0 && values.inspectJson.id === assertion.id && values.inspectJson.kind === assertion.kind;
    return { type: assertion.type, passed, detail: passed ? `inspect returned ${assertion.id} as ${assertion.kind}` : `inspect did not return ${assertion.id} as ${assertion.kind}` };
  }
  if (assertion.type === 'check.exit') {
    const expected = Number(assertion.expected);
    const passed = values.check.code === expected;
    return { type: assertion.type, passed, detail: passed ? `check exited ${expected}` : `check exited ${values.check.code}; expected ${expected}` };
  }
  const diagnostics = Array.isArray(values.checkJson.diagnostics) ? values.checkJson.diagnostics : [];
  const passed = diagnostics.some((diagnostic) => diagnostic && typeof diagnostic === 'object' && (diagnostic as { ruleId?: unknown }).ruleId === assertion.ruleId && JSON.stringify(diagnostic).includes(assertion.expected));
  return { type: assertion.type, passed, detail: passed ? `check emitted ${assertion.ruleId}` : `check did not emit ${assertion.ruleId} containing ${assertion.expected}` };
}

export function parseTestSpec(value: unknown, location = 'spec'): TestSpec {
  if (!value || typeof value !== 'object') throw new Error(`${location} must be an object.`);
  const spec = value as Partial<TestSpec>;
  const { id, kind, prompt, search, targetId, targetKind, assertions: rawAssertions } = spec;
  if (spec.version !== 1 || typeof id !== 'string' || !/^[a-z0-9][a-z0-9.-]*$/.test(id)) throw new Error(`${location} has an invalid version or ID.`);
  if (kind !== 'workflow') throw new Error(`${location}.kind must be workflow.`);
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error(`${location}.prompt must be a non-empty string.`);
  if (typeof search !== 'string' || !search.trim()) throw new Error(`${location}.search must be a non-empty string.`);
  if (typeof targetId !== 'string' || !targetId.trim()) throw new Error(`${location}.targetId must be a non-empty string.`);
  if (targetKind !== 'component' && targetKind !== 'recipe') throw new Error(`${location}.targetKind must be component or recipe.`);
  if (!Array.isArray(rawAssertions) || !rawAssertions.length) throw new Error(`${location}.assertions must contain at least one assertion.`);
  const parsedAssertions = rawAssertions.map((assertion, index) => validateAssertion(assertion, `${location}.assertions[${index}]`));
  return { version: 1, id, kind, prompt, search, targetId, targetKind, assertions: parsedAssertions };
}

function validateAssertion(value: unknown, location: string): TestAssertion {
  if (!value || typeof value !== 'object') throw new Error(`${location} must be an object.`);
  const assertion = value as Partial<TestAssertion>;
  const { type, id, kind, ruleId, expected } = assertion;
  if (!['search.contains', 'inspect.kind', 'check.exit', 'diagnostic.contains'].includes(type ?? '')) throw new Error(`${location}.type is unsupported.`);
  if (typeof id !== 'string' || typeof kind !== 'string' || typeof ruleId !== 'string' || typeof expected !== 'string') throw new Error(`${location} requires string id, kind, ruleId, and expected fields.`);
  if (type === 'search.contains' && !id) throw new Error(`${location}.id is required for search.contains.`);
  if (type === 'inspect.kind' && (!id || !['component', 'recipe'].includes(kind))) throw new Error(`${location} requires an id and component or recipe kind for inspect.kind.`);
  if (type === 'check.exit' && !/^\d+$/.test(expected)) throw new Error(`${location}.expected must be a numeric exit code for check.exit.`);
  if (type === 'diagnostic.contains' && (!ruleId || !expected)) throw new Error(`${location} requires ruleId and expected for diagnostic.contains.`);
  return { type: type as TestAssertionType, id, kind, ruleId, expected };
}

async function runCommand(args: string[], cwd: string): Promise<CliResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runCli(args, cwd, { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) });
  return { code, stdout, stderr };
}

function parseObject(value: string | undefined): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

async function renderFiles(outDirectory: string, specs: TestSpec[]): Promise<string[]> {
  await fs.mkdir(outDirectory, { recursive: true });
  const files: string[] = [];
  for (const spec of specs) {
    const file = path.join(outDirectory, `${spec.id}.test.ts`);
    const importPath = `${path.relative(path.dirname(file), path.join(packageRoot, 'src', 'evals', 'spec-runner.ts')).replace(/\\/g, '/').replace(/\.ts$/, '.js')}`;
    await fs.writeFile(file, renderSpecAsVitest(spec, importPath));
    files.push(file);
  }
  return files;
}

async function runGeneratedTests(files: string[]) {
  const entry = path.join(packageRoot, 'node_modules', 'vitest', 'vitest.mjs');
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [entry, 'run', ...files], { cwd: packageRoot, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
  return exitCode;
}

async function main(argv: string[]) {
  const json = argv.includes('--json');
  const shouldRender = argv.includes('--render');
  const shouldRun = argv.includes('--run');
  const outArg = argv.find((arg) => arg === '--out') ? argv[argv.indexOf('--out') + 1] : argv.find((arg) => arg.startsWith('--out='))?.slice(6);
  const specs = await loadTestSpecs();
  let files: string[] = [];
  if (shouldRender || shouldRun) files = await renderFiles(path.resolve(outArg ?? path.join('reports', 'generated-tests')), specs);
  if (shouldRun) process.exitCode = await runGeneratedTests(files);
  else {
    const report = await runSpecs();
    if (json) console.log(JSON.stringify(report, null, 2));
    else console.log(`Ovlira structured specs: ${report.summary.passed}/${report.summary.total} passed${shouldRender ? ` · rendered ${files.length} Vitest files` : ''}`);
    process.exitCode = report.summary.failed ? 1 : 0;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.endsWith(`${path.sep}evals${path.sep}spec-runner.js`) || invokedPath.endsWith(`${path.sep}evals${path.sep}spec-runner.ts`)) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) console.log('Usage: npm run eval:specs [-- --json] | npm run eval:specs:vitest');
  else main(process.argv.slice(2)).catch((error) => { console.error(`ovlira specs: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
}
