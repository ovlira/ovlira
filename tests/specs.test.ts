import { describe, expect, it } from 'vitest';
import { loadTestSpecs, parseTestSpec, renderSpecAsVitest, runSpecById, runSpecs } from '../src/evals/spec-runner.js';

describe('structured Ovlira test specs', () => {
  it('loads a compact, unique catalogue of versioned specs', async () => {
    const specs = await loadTestSpecs();
    expect(specs.length).toBe(3);
    expect(new Set(specs.map((spec) => spec.id)).size).toBe(specs.length);
    expect(specs.every((spec) => spec.version === 1 && spec.assertions.length > 0)).toBe(true);
  });

  it('runs every spec through the real CLI without network access', async () => {
    const report = await runSpecs();
    expect(report).toMatchObject({ version: 1, summary: { total: 3, passed: 3, failed: 0, passRate: 1 } });
    expect(report.specs.every((spec) => spec.passed)).toBe(true);
  });

  it('renders a bounded Vitest file that calls the approved runner only', async () => {
    const spec = (await loadTestSpecs())[0];
    const source = renderSpecAsVitest(spec);
    expect(source).toContain("from 'vitest'");
    expect(source).toContain('runSpecById');
    expect(source).toContain(JSON.stringify(spec.id));
    expect(source).not.toContain('child_process');
  });

  it('reports unknown generated spec IDs clearly', async () => {
    await expect(runSpecById('missing.spec')).rejects.toThrow('Unknown structured test spec');
  });

  it('rejects malformed model-shaped specs before execution', () => {
    expect(() => parseTestSpec({ version: 1, id: 'bad-spec', kind: 'workflow', prompt: 'x', search: 'x', targetId: 'component.input', targetKind: 'component', assertions: [{ type: 'check.exit', id: '', kind: '', ruleId: '', expected: 'success' }] })).toThrow('numeric exit code');
    expect(() => parseTestSpec({ version: 1, id: 'bad-spec', kind: 'validator', prompt: 'x', search: 'x', targetId: 'component.input', targetKind: 'component', assertions: [{ type: 'check.exit', id: '', kind: '', ruleId: '', expected: '0' }] })).toThrow('kind must be workflow');
  });
});
