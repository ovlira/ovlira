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

  it('keeps textarea label, rows, and help text in a native contract', async () => {
    document.body.innerHTML = '<ov-textarea label="Project description" name="description" rows="5" help-text="Keep this concise." required></ov-textarea>';
    const element = document.querySelector('ov-textarea') as import('../src/components/textarea.js').OvTextarea;
    await element.updateComplete;
    const label = element.shadowRoot?.querySelector('label');
    const textarea = element.shadowRoot?.querySelector('textarea');
    expect(label?.textContent).toContain('Project description');
    expect(label?.htmlFor).toBe(textarea?.id);
    expect(textarea?.rows).toBe(5);
    expect(textarea?.required).toBe(true);
    expect(element.shadowRoot?.querySelector('.message')?.textContent).toContain('Keep this concise.');
  });

  it('keeps checkbox label, selection, and help text in a native contract', async () => {
    document.body.innerHTML = '<ov-checkbox label="Keep me signed in" name="remember" checked help-text="Use this only on a private device." required></ov-checkbox>';
    const element = document.querySelector('ov-checkbox') as import('../src/components/checkbox.js').OvCheckbox;
    await element.updateComplete;
    const label = element.shadowRoot?.querySelector('label');
    const checkbox = element.shadowRoot?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(label?.htmlFor).toBe(checkbox?.id);
    expect(checkbox?.checked).toBe(true);
    expect(checkbox?.required).toBe(true);
    expect(element.shadowRoot?.querySelector('.message')?.textContent).toContain('Use this only on a private device.');
  });

  it('keeps radio group legend, options, and selected value in a native contract', async () => {
    document.body.innerHTML = '<ov-radio-group label="Workspace visibility" name="visibility" value="team" help-text="Choose who can access this workspace." required></ov-radio-group>';
    const element = document.querySelector('ov-radio-group') as import('../src/components/radio-group.js').OvRadioGroup;
    element.options = [{ value: 'private', label: 'Only me' }, { value: 'team', label: 'Everyone on the team' }];
    await element.updateComplete;
    const fieldset = element.shadowRoot?.querySelector('fieldset');
    const legend = element.shadowRoot?.querySelector('legend');
    const radios = [...(element.shadowRoot?.querySelectorAll('input[type="radio"]') ?? [])] as HTMLInputElement[];
    expect(fieldset?.getAttribute('aria-describedby')).toContain('ov-radio-group-');
    expect(legend?.textContent).toContain('Workspace visibility');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
    expect(radios.every((radio) => radio.required)).toBe(true);
  });

  it('keeps toggle label, switch semantics, and checked state in a native contract', async () => {
    document.body.innerHTML = '<ov-toggle label="Email me about project activity" name="activity" checked help-text="You can change this at any time."></ov-toggle>';
    const element = document.querySelector('ov-toggle') as import('../src/components/toggle.js').OvToggle;
    await element.updateComplete;
    const label = element.shadowRoot?.querySelector('label');
    const toggle = element.shadowRoot?.querySelector('input[role="switch"]') as HTMLInputElement | null;
    expect(label?.htmlFor).toBe(toggle?.id);
    expect(toggle?.checked).toBe(true);
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
    expect(element.shadowRoot?.querySelector('.message')?.textContent).toContain('You can change this at any time.');
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

  it('scopes application-shell navigation styles to the nav slot', async () => {
    document.body.innerHTML = '<ov-application-shell><a slot="nav" href="#overview">Overview</a></ov-application-shell>';
    const element = document.querySelector('ov-application-shell') as import('../src/components/application-shell.js').OvApplicationShell;
    await element.updateComplete;
    const navSlot = element.shadowRoot?.querySelector('slot[name="nav"]');
    expect(navSlot?.classList.contains('nav-slot')).toBe(true);
  });
});
