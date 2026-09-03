#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import { runCli } from '../cli/index.js';
import { packageVersion } from '../version.js';

const execFile = promisify(execFileCallback);

type Kind = 'component' | 'recipe';
type Section = 'api' | 'guidance' | 'example';

export type EvalOperation =
  | { op: 'search'; query: string; kind?: Kind; tag?: string; category?: string; limit?: number }
  | { op: 'inspect'; id: string; section?: Section }
  | { op: 'add'; id: string };

export interface EvalScenario {
  id: string;
  title: string;
  prompt: string;
  searchQuery: string;
  targetId: string;
  targetKind: Kind;
}

export interface EvalPlan {
  version: 1;
  scenarioId: string;
  plan: EvalOperation[];
}

export interface TokenUsage {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  uncachedInputTokens: number | null;
  cacheWriteInputTokens: number | null;
  outputTokens: number | null;
  reasoningOutputTokens: number | null;
  totalTokens: number | null;
}

export interface EvalOptions {
  scenarioId?: string;
  runs?: number;
  offline?: boolean;
  keep?: boolean;
  json?: boolean;
  reportPath?: string;
  model?: string;
  codexHome?: string;
  timeoutMs?: number;
}

interface CliCapture {
  stdout: string[];
  stderr: string[];
  io: { stdout: (value: string) => void; stderr: (value: string) => void };
}

interface CodexCall {
  ok: boolean;
  plan?: EvalPlan;
  rawMessage?: string;
  usage: TokenUsage;
  latencyMs: number;
  schemaValid: boolean;
  cliVersion: string;
  stderr: string;
  error?: string;
}

interface StepResult {
  op: string;
  args: string[];
  code: number;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

interface ScenarioRun {
  scenarioId: string;
  run: number;
  mode: 'live' | 'offline';
  passed: boolean;
  failure?: string;
  plan?: EvalPlan;
  codex: {
    cliVersion: string;
    model: string;
    latencyMs: number;
    schemaValid: boolean;
    usage: TokenUsage;
    error?: string;
    stderr?: string;
  };
  steps: StepResult[];
}

export interface EvalReport {
  version: 1;
  generatedAt: string;
  mode: 'live' | 'offline';
  tool: { name: 'ovlira'; version: string };
  profile: { transport: 'codex-exec'; hash: string; model: string };
  scenarios: ScenarioRun[];
  summary: {
    runs: number;
    scenarioCount: number;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    averageLatencyMs: number;
    tokens: TokenUsage;
  };
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scenarioPath = path.join(packageRoot, 'src', 'evals', 'scenarios.json');
const schemaPath = path.join(packageRoot, 'src', 'evals', 'codex-plan.schema.json');
const codexProfile = {
  approvalPolicy: 'never',
  sandbox: 'read-only',
  ephemeral: true,
  personality: 'none',
  projectDocMaxBytes: 0,
  contextSources: ['task prompt', 'compact search candidates'],
  disabledFeatures: [
    'apps', 'plugins', 'memories', 'multi_agent', 'multi_agent_v2', 'goals', 'hooks',
    'skill_search', 'tool_suggest', 'shell_tool', 'unified_exec', 'shell_snapshot',
    'browser_use', 'browser_use_external', 'browser_use_full_cdp_access', 'computer_use',
    'image_generation', 'in_app_browser', 'workspace_dependencies', 'standalone_web_search',
    'code_mode', 'code_mode_host', 'current_time_reminder', 'personality',
  ],
};

export async function runEvaluator(options: EvalOptions = {}): Promise<EvalReport> {
  const scenarios = await loadScenarios(options.scenarioId);
  const runs = Math.max(1, Math.min(options.runs ?? 1, 20));
  const model = options.model ?? process.env.OVLIRA_CODEX_MODEL ?? 'gpt-5.6-luna';
  const mode = options.offline ? 'offline' : 'live';
  const cliVersion = options.offline ? 'offline' : await getCodexVersion();
  const results: ScenarioRun[] = [];

  for (const scenario of scenarios) {
    for (let run = 1; run <= runs; run += 1) {
      results.push(await runScenario(scenario, run, { ...options, model, mode, cliVersion }));
    }
  }

  const report: EvalReport = {
    version: 1,
    generatedAt: new Date().toISOString(),
    mode,
    tool: { name: 'ovlira', version: packageVersion },
    profile: {
      transport: 'codex-exec',
      hash: hashValue({ ...codexProfile, model }),
      model,
    },
    scenarios: results,
    summary: summarize(results, runs),
  };
  if (options.reportPath) {
    const reportPath = path.resolve(options.reportPath);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  return report;
}

async function runScenario(
  scenario: EvalScenario,
  run: number,
  options: EvalOptions & { model: string; mode: 'live' | 'offline'; cliVersion: string },
): Promise<ScenarioRun> {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), `ovlira-eval-${scenario.id}-${run}-`));
  const agentCwd = await fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-codex-job-'));
  const steps: StepResult[] = [];
  let plan: EvalPlan | undefined;
  let codex: CodexCall | undefined;
  try {
    const discovery = await runCommand(['search', scenario.searchQuery, '--limit', '4', '--json'], project);
    const candidates = parseJson(discovery.stdout[0] ?? '{}') as { results?: unknown[] };
    const prompt = buildPrompt(scenario, candidates.results ?? []);
    codex = options.offline
      ? offlineCall(scenario)
      : await callCodex(prompt, schemaPath, agentCwd, options.model, options.codexHome, options.timeoutMs ?? 90_000);
    plan = codex.plan;
    if (!codex.ok || !plan) {
      return failedScenario(scenario, run, options, codex, steps, codex.error ?? 'Codex did not return a usable plan.');
    }

    const planError = validatePlan(plan, scenario);
    if (planError) return failedScenario(scenario, run, options, codex, steps, planError, plan);

    const init = await runCommand(['init', '.', '--json'], project);
    steps.push(step('init', ['.'], init));
    if (init.code !== 0) return failedScenario(scenario, run, options, codex, steps, 'Could not initialize the temporary project.', plan);

    for (const operation of plan.plan) {
      const args = operationArgs(operation, project);
      const result = await runCommand(args, project);
      const stepResult = step(operation.op, args, result);
      steps.push(stepResult);
      const failure = checkStep(operation, stepResult, scenario);
      if (failure) return failedScenario(scenario, run, options, codex, steps, failure, plan);
    }

    const check = await runCommand(['check', '--cwd', project, '--json'], project);
    steps.push(step('check', ['--cwd', project, '--json'], check));
    if (check.code !== 0) return failedScenario(scenario, run, options, codex, steps, 'Generated project failed ovlira check.', plan);
    const build = await buildGeneratedProject(project);
    steps.push({ op: 'build', args: ['npm', 'run', 'build'], code: build.code, ok: build.code === 0, ...(build.error ? { error: build.error } : {}) });
    if (build.code !== 0) return failedScenario(scenario, run, options, codex, steps, `Generated project failed npm run build: ${build.error ?? 'unknown error'}.`, plan);
    return { scenarioId: scenario.id, run, mode: options.mode, passed: true, plan, codex: compactCodex(codex, options.model), steps };
  } catch (error) {
    const fallback: CodexCall = codex ?? offlineCall(scenario);
    return failedScenario(scenario, run, options, fallback, steps, error instanceof Error ? error.message : String(error), plan);
  } finally {
    if (!options.keep) {
      await fs.rm(project, { recursive: true, force: true });
      await fs.rm(agentCwd, { recursive: true, force: true });
    }
  }
}

async function buildGeneratedProject(project: string) {
  try {
    await fs.symlink(path.join(packageRoot, 'node_modules'), path.join(project, 'node_modules'), 'dir');
    await execFile('npm', ['run', 'build'], { cwd: project, env: { ...process.env, NO_COLOR: '1' } });
    return { code: 0 };
  } catch (error: any) {
    return { code: typeof error?.code === 'number' ? error.code : 1, error: String(error?.stderr || error?.message || error).trim().slice(-1200) };
  }
}

function buildPrompt(scenario: EvalScenario, candidates: unknown[]) {
  return [
    'You are an Ovlira evaluation planner.',
    'Return only JSON matching the supplied output schema. Do not use markdown, shell commands, or explanations.',
    `The exact scenarioId value is ${JSON.stringify(scenario.id)}; copy it exactly into the response.`,
    `Scenario: ${scenario.prompt}`,
    `Required order: search, inspect one search result, add the inspected result. Use only these operation names: search, inspect, add.`,
    `The runner will initialize a temporary project and execute your plan. Do not include init or check operations.`,
    `Search candidates for query ${JSON.stringify(scenario.searchQuery)}: ${JSON.stringify(candidates)}`,
    'Choose a stable ID from the candidates; do not invent an ID. Keep the plan to the minimum useful operations. Every operation must include op, query, and id; use an empty string for the field that does not apply.',
  ].join('\n');
}

function offlineCall(scenario: EvalScenario): CodexCall {
  return {
    ok: true,
    plan: {
      version: 1,
      scenarioId: scenario.id,
      plan: [
        { op: 'search', query: scenario.searchQuery, limit: 4 },
        { op: 'inspect', id: scenario.targetId },
        { op: 'add', id: scenario.targetId },
      ],
    },
    usage: emptyUsage(),
    latencyMs: 0,
    schemaValid: true,
    cliVersion: 'offline',
    stderr: '',
  };
}

async function callCodex(prompt: string, outputSchema: string, cwd: string, model: string, codexHome: string | undefined, timeoutMs: number): Promise<CodexCall> {
  const args = [
    'exec', '--strict-config', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--skip-git-repo-check',
    '--sandbox', 'read-only', '-c', 'approval_policy="never"',
    '-c', 'project_doc_max_bytes=0', '-c', 'skills.include_instructions=false', '-c', 'memories.use_memories=false',
    '-c', 'include_apps_instructions=false', '-c', 'include_collaboration_mode_instructions=false',
    '-c', 'include_environment_context=false', '-c', 'include_permissions_instructions=false',
    ...codexProfile.disabledFeatures.flatMap((feature) => ['-c', `features.${feature}=false`]),
    '--model', model, '--output-schema', outputSchema, '--color', 'never', '--json', prompt,
  ];
  const started = performance.now();
  const child = spawn('codex', args, {
    cwd,
    env: { ...process.env, ...(codexHome ? { CODEX_HOME: path.resolve(codexHome) } : {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Codex timed out after ${timeoutMs}ms.`)); }, timeoutMs);
    child.once('error', reject);
    child.once('close', (code, signal) => { clearTimeout(timeout); resolve({ code, signal }); });
  }).catch((error) => ({ code: null, signal: null, error } as { code: null; signal: null; error: Error }));
  const parsed = parseCodexJsonl(stdout);
  const message = parsed.message;
  const plan = message ? parsePlan(message) : undefined;
  const processError = 'error' in exit ? exit.error.message : exit.code === 0 ? undefined : `Codex exited with ${exit.code ?? exit.signal ?? 'unknown status'}.`;
  const error = parsed.error ?? processError;
  return {
    ok: exit.code === 0 && Boolean(plan) && parsed.schemaValid,
    plan,
    rawMessage: message,
    usage: parsed.usage,
    latencyMs: Math.round(performance.now() - started),
    schemaValid: parsed.schemaValid,
    cliVersion: await getCodexVersion(),
    stderr: stderr.trim(),
    error: error ?? (!plan ? 'Codex returned no JSON plan.' : !parsed.schemaValid ? 'Codex output did not satisfy the requested schema.' : undefined),
  };
}

export function parseCodexJsonl(output: string): { message?: string; usage: TokenUsage; schemaValid: boolean; error?: string } {
  let message: string | undefined;
  let usage = emptyUsage();
  let schemaValid = true;
  let error: string | undefined;
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event: any;
    try { event = JSON.parse(line); } catch { schemaValid = false; continue; }
    if (event.type === 'item.completed' && event.item?.type === 'agent_message') message = event.item.text;
    if (event.type === 'turn.completed' && event.usage) usage = normalizeUsage(event.usage);
    if (event.type === 'error') { schemaValid = false; error = typeof event.message === 'string' ? event.message : 'Codex returned an error event.'; }
  }
  return { message, usage, schemaValid, error };
}

function parsePlan(message: string): EvalPlan | undefined {
  try {
    const fenced = message.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? message;
    const value = JSON.parse(fenced) as EvalPlan;
    if (value?.version !== 1 || typeof value.scenarioId !== 'string' || !Array.isArray(value.plan)) return undefined;
    return value;
  } catch { return undefined; }
}

function validatePlan(plan: EvalPlan, scenario: EvalScenario): string | undefined {
  if (plan.scenarioId !== scenario.id) return `Plan scenarioId must be ${scenario.id}.`;
  if (plan.plan.length < 3 || plan.plan.length > 6) return 'Plan must contain between three and six operations.';
  if (plan.plan[0]?.op !== 'search') return 'Plan must start with search.';
  if (plan.plan.some((operation) => !['search', 'inspect', 'add'].includes(operation.op))) return 'Plan contains an unsupported operation.';
  if (plan.plan.some((operation) => operation.op === 'search' && !operation.query?.trim())) return 'Every search operation needs a non-empty query.';
  if (plan.plan.some((operation) => (operation.op === 'inspect' || operation.op === 'add') && !operation.id?.trim())) return 'Every inspect and add operation needs a non-empty ID.';
  const inspectIndex = plan.plan.findIndex((operation) => operation.op === 'inspect');
  const addIndex = plan.plan.findIndex((operation) => operation.op === 'add');
  const inspect = plan.plan.find((operation): operation is Extract<EvalOperation, { op: 'inspect' }> => operation.op === 'inspect');
  const add = plan.plan.find((operation): operation is Extract<EvalOperation, { op: 'add' }> => operation.op === 'add');
  if (!inspect || !add) return 'Plan must contain inspect and add operations.';
  if (inspectIndex >= addIndex) return 'Plan must inspect before adding.';
  if (inspect.id !== add.id) return 'The inspected and added IDs must match.';
  if (inspect.id !== scenario.targetId) return `Plan selected ${inspect.id}; expected ${scenario.targetId}.`;
  if (plan.plan.some((operation) => operation.op === 'add' && operation.id !== scenario.targetId)) return 'Plan contains an unexpected add target.';
  return undefined;
}

function operationArgs(operation: EvalOperation, project: string): string[] {
  if (operation.op === 'search') {
    const args = ['search', operation.query, '--json'];
    if (operation.kind) args.push('--kind', operation.kind);
    if (operation.tag) args.push('--tag', operation.tag);
    if (operation.category) args.push('--category', operation.category);
    if (operation.limit) args.push('--limit', String(operation.limit));
    return args;
  }
  if (operation.op === 'inspect') return ['inspect', operation.id, '--json', ...(operation.section ? ['--section', operation.section] : [])];
  return ['add', operation.id, '--cwd', project, '--json'];
}

function checkStep(operation: EvalOperation, result: StepResult, scenario: EvalScenario): string | undefined {
  if (!result.ok) return `${operation.op} failed with exit code ${result.code}.`;
  if (operation.op === 'search') {
    const results = Array.isArray(result.result?.results) ? result.result.results : [];
    if (!(results as Array<{ id?: string }>).some((candidate) => candidate.id === scenario.targetId)) return `Search did not return ${scenario.targetId}.`;
  }
  if (operation.op === 'inspect' && (result.result?.id !== scenario.targetId || result.result?.kind !== scenario.targetKind)) return `Inspect did not return the expected ${scenario.targetKind} descriptor.`;
  if (operation.op === 'add') {
    if (result.result?.ok !== true) return 'Add did not report ok=true.';
    if (result.result.kind === 'recipe') {
      const imports = Array.isArray(result.result.imports) ? result.result.imports : [];
      if (!imports.length || imports.some((value) => typeof value !== 'string' || !value.startsWith('@ovlira/elements/'))) return 'Recipe add did not report direct @ovlira/elements imports.';
      const files = Array.isArray(result.result.files) ? result.result.files : [];
      if (files.some((value) => typeof value === 'string' && value.includes('src/components'))) return 'Recipe add attempted to copy component source.';
    }
  }
  return undefined;
}

async function runCommand(args: string[], cwd: string) {
  const capture = captureIO();
  const code = await runCli(args, cwd, capture.io);
  return { code, stdout: capture.stdout, stderr: capture.stderr };
}

function step(op: string, args: string[], result: { code: number; stdout: string[]; stderr: string[] }): StepResult {
  let parsed: Record<string, unknown> | undefined;
  try { parsed = JSON.parse(result.stdout[0] ?? '') as Record<string, unknown>; } catch { /* Human output is intentionally summarized below. */ }
  return { op, args: args.map((arg) => path.isAbsolute(arg) ? '<temp-project>' : arg), code: result.code, ok: result.code === 0, ...(parsed ? { result: summarizeStepResult(parsed) } : {}), ...(result.stderr[0] ? { error: result.stderr[0] } : {}) };
}

function summarizeStepResult(value: Record<string, unknown>): Record<string, unknown> {
  const keep = ['version', 'query', 'id', 'kind', 'ok', 'tag', 'importPath', 'imports', 'files', 'changed', 'skipped', 'conflicts', 'entry', 'next', 'results', 'diagnostics'];
  return Object.fromEntries(keep.filter((key) => key in value).map((key) => {
    if (key === 'diagnostics') return [key, summarizeDiagnostics(value[key])];
    if (key === 'results' && Array.isArray(value[key])) return [key, value[key].map((item) => typeof item === 'object' && item ? { id: (item as any).id, kind: (item as any).kind, title: (item as any).title } : item)];
    return [key, value[key]];
  }));
}

function summarizeDiagnostics(value: unknown) {
  return Array.isArray(value) ? value.map((diagnostic) => typeof diagnostic === 'object' && diagnostic ? { ruleId: (diagnostic as any).ruleId, severity: (diagnostic as any).severity } : diagnostic) : value;
}

function failedScenario(scenario: EvalScenario, run: number, options: EvalOptions & { model: string; mode: 'live' | 'offline'; cliVersion: string }, codex: CodexCall | undefined, steps: StepResult[], failure: string, plan?: EvalPlan): ScenarioRun {
  return { scenarioId: scenario.id, run, mode: options.mode, passed: false, failure, ...(plan ? { plan } : {}), codex: compactCodex(codex ?? offlineCall(scenario), options.model), steps };
}

function compactCodex(call: CodexCall, model: string) {
  return { cliVersion: call.cliVersion, model, latencyMs: call.latencyMs, schemaValid: call.schemaValid, usage: call.usage, ...(call.error ? { error: call.error } : {}), ...(call.error && call.stderr ? { stderr: call.stderr.slice(-1200) } : {}) };
}

function summarize(results: ScenarioRun[], runs: number): EvalReport['summary'] {
  const passed = results.filter((result) => result.passed).length;
  const usage = results.map((result) => result.codex.usage);
  return {
    runs,
    scenarioCount: new Set(results.map((result) => result.scenarioId)).size,
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length ? Number((passed / results.length).toFixed(3)) : 0,
    averageLatencyMs: results.length ? Math.round(results.reduce((sum, result) => sum + result.codex.latencyMs, 0) / results.length) : 0,
    tokens: sumUsage(usage),
  };
}

function sumUsage(usages: TokenUsage[]): TokenUsage {
  const sum = (key: keyof TokenUsage): number | null => {
    const values = usages.map((usage) => usage[key]);
    return values.every((value) => value === null) ? null : values.map((value) => value ?? 0).reduce((total, value) => total + value, 0);
  };
  return {
    inputTokens: sum('inputTokens'),
    cachedInputTokens: sum('cachedInputTokens'),
    uncachedInputTokens: sum('uncachedInputTokens'),
    cacheWriteInputTokens: sum('cacheWriteInputTokens'),
    outputTokens: sum('outputTokens'),
    reasoningOutputTokens: sum('reasoningOutputTokens'),
    totalTokens: sum('totalTokens'),
  };
}

function normalizeUsage(value: any): TokenUsage {
  const inputTokens = numberOrNull(value.input_tokens ?? value.inputTokens);
  const cachedInputTokens = numberOrNull(value.cached_input_tokens ?? value.cachedInputTokens);
  const outputTokens = numberOrNull(value.output_tokens ?? value.outputTokens);
  return {
    inputTokens,
    cachedInputTokens,
    uncachedInputTokens: inputTokens === null ? null : inputTokens - (cachedInputTokens ?? 0),
    cacheWriteInputTokens: numberOrNull(value.cache_write_input_tokens ?? value.cacheWriteInputTokens),
    outputTokens,
    reasoningOutputTokens: numberOrNull(value.reasoning_output_tokens ?? value.reasoningOutputTokens),
    totalTokens: numberOrNull(value.total_tokens ?? value.totalTokens) ?? (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null),
  };
}

function emptyUsage(): TokenUsage { return { inputTokens: null, cachedInputTokens: null, uncachedInputTokens: null, cacheWriteInputTokens: null, outputTokens: null, reasoningOutputTokens: null, totalTokens: null }; }
function numberOrNull(value: unknown): number | null { return typeof value === 'number' ? value : null; }
function hashValue(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12); }
function parseJson(value: string) { return JSON.parse(value); }

async function loadScenarios(scenarioId?: string): Promise<EvalScenario[]> {
  const scenarios = JSON.parse(await fs.readFile(scenarioPath, 'utf8')) as EvalScenario[];
  const filtered = scenarioId ? scenarios.filter((scenario) => scenario.id === scenarioId) : scenarios;
  if (!filtered.length) throw new Error(`Unknown eval scenario “${scenarioId}”. Available: ${scenarios.map((scenario) => scenario.id).join(', ')}.`);
  return filtered;
}

async function getCodexVersion() {
  const result = await new Promise<{ stdout: string; code: number | null }>((resolve) => {
    const child = spawn('codex', ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.on('error', () => resolve({ stdout: '', code: null }));
    child.on('close', (code) => resolve({ stdout, code }));
  });
  return result.code === 0 ? result.stdout.match(/codex-cli\s+\S+/)?.[0] ?? result.stdout.trim() : 'unavailable';
}

function captureIO(): CliCapture { const stdout: string[] = []; const stderr: string[] = []; return { stdout, stderr, io: { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) } }; }

function formatHuman(report: EvalReport) {
  const lines = [`Codex eval: ${report.summary.passed}/${report.summary.total} passed (${report.mode}, ${report.summary.runs} run${report.summary.runs === 1 ? '' : 's'})`];
  for (const scenario of report.scenarios) {
    const token = scenario.codex.usage.uncachedInputTokens === null ? '' : ` · ${scenario.codex.usage.uncachedInputTokens} uncached input tokens`;
    lines.push(`  ${scenario.passed ? 'PASS' : 'FAIL'} ${scenario.scenarioId}${token}${scenario.failure ? ` — ${scenario.failure}` : ''}`);
  }
  lines.push(`Average latency: ${report.summary.averageLatencyMs}ms · profile ${report.profile.hash}`);
  lines.push(`Total tokens: ${report.summary.tokens.totalTokens ?? 'n/a'} (uncached input ${report.summary.tokens.uncachedInputTokens ?? 'n/a'})`);
  return lines.join('\n');
}

function parseArgs(argv: string[]): EvalOptions {
  const options: EvalOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? '';
    if (arg === '--json') options.json = true;
    else if (arg === '--offline') options.offline = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--scenario') options.scenarioId = next();
    else if (arg.startsWith('--scenario=')) options.scenarioId = arg.slice(11);
    else if (arg === '--runs') options.runs = Number(next()) || 1;
    else if (arg.startsWith('--runs=')) options.runs = Number(arg.slice(7)) || 1;
    else if (arg === '--report') options.reportPath = next();
    else if (arg.startsWith('--report=')) options.reportPath = arg.slice(9);
    else if (arg === '--model') options.model = next();
    else if (arg.startsWith('--model=')) options.model = arg.slice(8);
    else if (arg === '--codex-home') options.codexHome = next();
    else if (arg.startsWith('--codex-home=')) options.codexHome = arg.slice(13);
    else if (arg === '--timeout-ms') options.timeoutMs = Number(next()) || 90_000;
    else if (arg.startsWith('--timeout-ms=')) options.timeoutMs = Number(arg.slice(13)) || 90_000;
  }
  return options;
}

function printHelp() {
  console.log(`ovlira Codex evaluations

Runs compact AI-authored plans against the real local Ovlira CLI.

Usage:
  npm run eval:codex -- --offline
  npm run eval:codex -- --scenario settings-recipe
  npm run benchmark:codex -- --runs 3 --report reports/codex.json

Options:
  --scenario ID       Run one scenario
  --runs N             Repeat each scenario for benchmark data (1–20)
  --offline            Skip Codex and replay the deterministic oracle plan
  --json               Print the full versioned report as JSON
  --report PATH        Write the report to PATH
  --keep              Keep temporary projects for inspection
  --model MODEL       Override the Codex model
  --codex-home PATH   Use an isolated CODEX_HOME when auth is available there
  --timeout-ms N      Bound each live Codex call (default 90000)`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.endsWith(`${path.sep}evals${path.sep}runner.js`) || invokedPath.endsWith(`${path.sep}evals${path.sep}runner.ts`)) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) printHelp();
  else runEvaluator(parseArgs(process.argv.slice(2))).then((report) => {
    if (parseArgs(process.argv.slice(2)).json) console.log(JSON.stringify(report, null, 2));
    else console.log(formatHuman(report));
    process.exitCode = report.summary.failed ? 1 : 0;
  }).catch((error) => { console.error(`ovlira eval: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
}
