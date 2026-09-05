import { describe, expect, it } from 'vitest';
import { parseCodexJsonl, runEvaluator } from '../src/evals/runner.js';

describe('Codex evaluation harness', () => {
  it('parses compact Codex JSONL messages and token usage', () => {
    const parsed = parseCodexJsonl([
      JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' }),
      JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"version":1,"scenarioId":"x","plan":[]}' } }),
      JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 120, cached_input_tokens: 40, output_tokens: 8, reasoning_output_tokens: 2, total_tokens: 128 } }),
    ].join('\n'));
    expect(parsed.message).toContain('scenarioId');
    expect(parsed.schemaValid).toBe(true);
    expect(parsed.usage).toMatchObject({ inputTokens: 120, cachedInputTokens: 40, uncachedInputTokens: 80, outputTokens: 8, totalTokens: 128 });
  });

  it('runs all scenario assertions offline without Codex or network access', async () => {
    const report = await runEvaluator({ offline: true, runs: 2 });
    expect(report.mode).toBe('offline');
    expect(report.summary).toMatchObject({ runs: 2, scenarioCount: 6, total: 12, passed: 12, failed: 0, passRate: 1 });
    expect(report.scenarios.every((scenario) => scenario.passed)).toBe(true);
    expect(report.scenarios.every((scenario) => scenario.steps.at(-2)?.op === 'check' && scenario.steps.at(-1)?.op === 'build')).toBe(true);
  }, 30_000);

  it('rejects an unknown scenario before creating a run', async () => {
    await expect(runEvaluator({ offline: true, scenarioId: 'missing-scenario' })).rejects.toThrow('Unknown eval scenario');
  });
});
