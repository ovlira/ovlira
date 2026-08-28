import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateOutputTokens, measureOutputTokens, outputBudgets } from '../src/evals/budgets.js';
import { runCli } from '../src/cli/index.js';

async function tempProject() { return fs.mkdtemp(path.join(os.tmpdir(), 'ovlira-budget-')); }

function ioCapture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { io: { stdout: (value: string) => stdout.push(value), stderr: (value: string) => stderr.push(value) }, stdout, stderr };
}

describe('Ovlira output budgets', () => {
  it('uses a deterministic UTF-8 estimate', () => {
    expect(estimateOutputTokens('')).toBe(0);
    expect(estimateOutputTokens('a'.repeat(4))).toBe(1);
    expect(estimateOutputTokens('a'.repeat(5))).toBe(2);
    expect(estimateOutputTokens('éé')).toBe(1);
  });

  it('keeps default search and focused/full inspect responses within budget', async () => {
    const search = ioCapture();
    expect(await runCli(['search', 'settings page', '--json'], process.cwd(), search.io)).toBe(0);
    expect(measureOutputTokens(search.stdout)).toBeLessThanOrEqual(outputBudgets.search);

    const focused = ioCapture();
    expect(await runCli(['inspect', 'page.settings', '--section', 'guidance', '--json'], process.cwd(), focused.io)).toBe(0);
    expect(measureOutputTokens(focused.stdout)).toBeLessThanOrEqual(outputBudgets.inspectFocused);

    const full = ioCapture();
    expect(await runCli(['inspect', 'page.settings', '--json'], process.cwd(), full.io)).toBe(0);
    expect(measureOutputTokens(full.stdout)).toBeLessThanOrEqual(outputBudgets.inspectFull);
  });

  it('keeps the normal search → focused inspect → add → check path within budget', async () => {
    const project = await tempProject();
    // Project setup is a fixture prerequisite; only the agent-facing path is measured.
    expect(await runCli(['init', '.'], project, ioCapture().io)).toBe(0);

    const search = ioCapture();
    expect(await runCli(['search', 'settings page', '--json'], project, search.io)).toBe(0);
    const focused = ioCapture();
    expect(await runCli(['inspect', 'page.settings', '--section', 'guidance', '--json'], project, focused.io)).toBe(0);
    const add = ioCapture();
    expect(await runCli(['add', 'page.settings', '--cwd', project, '--json'], project, add.io)).toBe(0);
    const check = ioCapture();
    expect(await runCli(['check', '--cwd', project, '--json'], project, check.io)).toBe(0);

    const total = [search.stdout, focused.stdout, add.stdout, check.stdout]
      .reduce((sum, output) => sum + measureOutputTokens(output), 0);
    expect(total).toBeLessThanOrEqual(outputBudgets.discoveryWorkflow);
  });
});
