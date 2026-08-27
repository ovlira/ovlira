import { beforeEach, describe, expect, it } from 'vitest';
import '../src/components/index.js';

describe('Ovlira components', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders a native button with a stable accessible contract', async () => {
    document.body.innerHTML = '<ov-button variant="primary">Save changes</ov-button>';
    const element = document.querySelector('ov-button') as import('../src/components/button.js').OvButton;
    await element.updateComplete;
    const button = element.shadowRoot?.querySelector('button');
    expect(element.textContent).toContain('Save changes');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-busy')).toBe('false');
  });

  it('keeps input label and native input association inside Shadow DOM', async () => {
    document.body.innerHTML = '<ov-input label="Email address" name="email" required></ov-input>';
    const element = document.querySelector('ov-input') as import('../src/components/input.js').OvInput;
    await element.updateComplete;
    const label = element.shadowRoot?.querySelector('label');
    const input = element.shadowRoot?.querySelector('input');
    expect(label?.textContent).toContain('Email address');
    expect(label?.htmlFor).toBe(input?.id);
    expect(input?.required).toBe(true);
  });

  it('renders property-backed table data without requiring JSON attributes', async () => {
    document.body.innerHTML = '<ov-data-table caption="Projects"></ov-data-table>';
    const element = document.querySelector('ov-data-table') as import('../src/components/data-table.js').OvDataTable;
    element.columns = [{ key: 'name', label: 'Name' }];
    element.rows = [{ name: 'Northstar' }];
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('caption')?.textContent).toBe('Projects');
    expect(element.shadowRoot?.querySelector('tbody')?.textContent).toContain('Northstar');
  });
});
