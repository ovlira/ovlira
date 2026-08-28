/**
 * Product budgets for the serialized output an agent receives from Ovlira.
 *
 * These are intentionally separate from provider-reported model usage in
 * runner.ts. They measure only the strings emitted by a local CLI invocation.
 */
export const outputBudgets = {
  search: 700,
  inspectFocused: 500,
  inspectFull: 900,
  discoveryWorkflow: 1_500,
} as const;

/**
 * Estimate output tokens without depending on a model/provider tokenizer.
 *
 * Four UTF-8 bytes is a stable, conservative approximation for the compact
 * English metadata emitted by the CLI. This is a regression signal, not an
 * accounting claim about any particular model's tokenizer.
 */
export function estimateOutputTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(new TextEncoder().encode(text).length / 4);
}

export function measureOutputTokens(outputs: readonly string[]): number {
  return outputs.reduce((total, output) => total + estimateOutputTokens(output), 0);
}
