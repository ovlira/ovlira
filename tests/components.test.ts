import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    const thumb = element.shadowRoot?.querySelector('.toggle-control .thumb');
    expect(label?.htmlFor).toBe(toggle?.id);
    expect(toggle?.checked).toBe(true);
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
    expect(thumb).not.toBeNull();
    expect(element.shadowRoot?.querySelector('.message')?.textContent).toContain('You can change this at any time.');
  });

  it('keeps dialog heading, body, actions, and explicit close semantics', async () => {
    document.body.innerHTML = '<ov-dialog heading="Archive this project?" description="People will lose access." open><p>Review this decision.</p><ov-button slot="actions">Archive</ov-button></ov-dialog>';
    const element = document.querySelector('ov-dialog') as import('../src/components/dialog.js').OvDialog;
    await element.updateComplete;
    const dialog = element.shadowRoot?.querySelector('dialog');
    const heading = element.shadowRoot?.querySelector('h2');
    const description = element.shadowRoot?.querySelector('.description');
    const actions = element.shadowRoot?.querySelector('slot[name="actions"]');
    expect(dialog?.open).toBe(true);
    expect(dialog?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(dialog?.getAttribute('aria-describedby')).toBe(description?.id);
    expect(element.textContent).toContain('Review this decision.');
    expect(actions?.assignedElements()).toHaveLength(1);

    const close = vi.fn();
    element.addEventListener('close', close);
    element.shadowRoot?.querySelector<HTMLButtonElement>('.close')?.click();
    await element.updateComplete;
    expect(element.open).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('renders an accessible inline spinner with a visible status label', async () => {
    document.body.innerHTML = '<ov-spinner label="Loading projects"></ov-spinner>';
    const element = document.querySelector('ov-spinner') as import('../src/components/spinner.js').OvSpinner;
    await element.updateComplete;
    const status = element.shadowRoot?.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toContain('Loading projects');
    expect(element.shadowRoot?.querySelector('[part="indicator"]')).not.toBeNull();
  });

  it('opens a menu, exposes menuitems, and emits a selected action', async () => {
    document.body.innerHTML = '<ov-menu label="Project actions"></ov-menu>';
    const element = document.querySelector('ov-menu') as import('../src/components/menu.js').OvMenu;
    element.items = [{ value: 'duplicate', label: 'Duplicate project' }, { value: 'archive', label: 'Archive project', disabled: true }];
    await element.updateComplete;
    const trigger = element.shadowRoot?.querySelector<HTMLButtonElement>('.trigger');
    trigger?.click();
    await element.updateComplete;
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(element.shadowRoot?.querySelector('[role="menu"]')?.hasAttribute('hidden')).toBe(false);
    expect(element.shadowRoot?.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
    const select = vi.fn();
    element.addEventListener('select', select);
    element.shadowRoot?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.click();
    expect(select).toHaveBeenCalledTimes(1);
    expect((select.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: 'duplicate', label: 'Duplicate project' });
  });

  it('renders pagination semantics and emits page changes', async () => {
    document.body.innerHTML = '<ov-pagination current-page="2" total-pages="12" label="Project pages"></ov-pagination>';
    const element = document.querySelector('ov-pagination') as import('../src/components/pagination.js').OvPagination;
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('nav')?.getAttribute('aria-label')).toBe('Project pages');
    expect(element.shadowRoot?.querySelector('[aria-current="page"]')?.textContent).toBe('2');
    const change = vi.fn();
    element.addEventListener('change', change);
    element.shadowRoot?.querySelector<HTMLButtonElement>('[aria-label="Next page"]')?.click();
    expect(element.currentPage).toBe(3);
    expect(change).toHaveBeenCalledTimes(1);
    expect((change.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ page: 3 });
  });

  it('keeps combobox label, listbox semantics, filtering, and selected value in a native contract', async () => {
    document.body.innerHTML = '<ov-combobox label="Project owner" placeholder="Search people"></ov-combobox>';
    const element = document.querySelector('ov-combobox') as import('../src/components/combobox.js').OvCombobox;
    element.options = [{ value: 'maya', label: 'Maya Chen' }, { value: 'jon', label: 'Jon Bell' }, { value: 'anika', label: 'Anika Rao' }];
    await element.updateComplete;
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]');
    expect(input?.getAttribute('aria-controls')).toContain('ov-combobox-');
    input?.focus();
    await element.updateComplete;
    const currentInput = element.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]');
    expect(currentInput?.getAttribute('aria-expanded')).toBe('true');
    expect(element.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(3);
    currentInput!.value = 'Maya';
    currentInput?.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(1);
    element.shadowRoot?.querySelector<HTMLElement>('[role="option"]')?.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    await element.updateComplete;
    const selectedInput = element.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]');
    expect(element.value).toBe('maya');
    expect(selectedInput?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders tabs with tablist semantics, named panels, and keyboard selection', async () => {
    document.body.innerHTML = '<ov-tabs label="Project views" value="overview"><p slot="overview">Summary</p><p slot="activity">Recent activity</p></ov-tabs>';
    const element = document.querySelector('ov-tabs') as import('../src/components/tabs.js').OvTabs;
    element.items = [{ value: 'overview', label: 'Overview' }, { value: 'activity', label: 'Activity' }];
    await element.updateComplete;
    const tablist = element.shadowRoot?.querySelector('[role="tablist"]');
    const tabs = [...(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
    const panels = [...(element.shadowRoot?.querySelectorAll<HTMLElement>('[role="tabpanel"]') ?? [])];
    expect(tablist?.getAttribute('aria-label')).toBe('Project views');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(true);
    const change = vi.fn();
    element.addEventListener('change', change);
    tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.value).toBe('activity');
    expect(change).toHaveBeenCalledTimes(1);
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders an open toast with a live-region role and dismisses it', async () => {
    document.body.innerHTML = '<ov-toast tone="success" heading="Saved" duration="0" open>Your changes are ready.</ov-toast>';
    const element = document.querySelector('ov-toast') as import('../src/components/toast.js').OvToast;
    await element.updateComplete;
    const toast = element.shadowRoot?.querySelector('[role="status"]');
    expect(toast?.getAttribute('aria-live')).toBe('polite');
    expect(element.textContent).toContain('Your changes are ready.');
    const close = vi.fn();
    element.addEventListener('close', close);
    element.shadowRoot?.querySelector<HTMLButtonElement>('.close')?.click();
    await element.updateComplete;
    expect(element.open).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
    expect((close.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ reason: 'dismiss' });
  });

  it('keeps progress native and supports determinate and indeterminate states', async () => {
    document.body.innerHTML = '<ov-progress label="Importing projects" value="68" max="100" show-value></ov-progress>';
    const element = document.querySelector('ov-progress') as import('../src/components/progress.js').OvProgress;
    await element.updateComplete;
    const progress = element.shadowRoot?.querySelector('progress') as HTMLProgressElement | null;
    expect(progress?.value).toBe(68);
    expect(progress?.max).toBe(100);
    expect(element.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('68%');
    element.indeterminate = true;
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('progress')?.hasAttribute('value')).toBe(false);
  });

  it('renders decorative skeleton variants with the requested line count', async () => {
    document.body.innerHTML = '<ov-skeleton variant="text" lines="3"></ov-skeleton>';
    const element = document.querySelector('ov-skeleton') as import('../src/components/skeleton.js').OvSkeleton;
    await element.updateComplete;
    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(element.shadowRoot?.querySelectorAll('[part="line"]')).toHaveLength(3);
    element.variant = 'circle';
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('.circle')).not.toBeNull();
  });

  it('opens tooltip content for a slotted trigger and dismisses with Escape', async () => {
    document.body.innerHTML = '<ov-tooltip content="Keyboard shortcut: /"><button slot="trigger" type="button" aria-label="Search help">?</button></ov-tooltip>';
    const element = document.querySelector('ov-tooltip') as import('../src/components/tooltip.js').OvTooltip;
    await element.updateComplete;
    const trigger = element.querySelector('button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-describedby')).toContain('ov-tooltip-');
    trigger.focus();
    await element.updateComplete;
    expect(element.open).toBe(true);
    expect(element.shadowRoot?.querySelector('[role="tooltip"]')?.textContent).toContain('Keyboard shortcut: /');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.open).toBe(false);
  });

  it('renders avatar initials, status semantics, and an image-error fallback', async () => {
    document.body.innerHTML = '<ov-avatar name="Maya Chen" status="online"></ov-avatar>';
    const element = document.querySelector('ov-avatar') as import('../src/components/avatar.js').OvAvatar;
    await element.updateComplete;
    const avatar = element.shadowRoot?.querySelector('[part="avatar"]');
    expect(avatar?.getAttribute('role')).toBe('img');
    expect(avatar?.getAttribute('aria-label')).toBe('Maya Chen, Online');
    expect(element.shadowRoot?.querySelector('[part="status"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.shadowRoot?.querySelector('[part="initials"]')?.textContent).toBe('MC');
    element.src = '/missing-avatar.png';
    await element.updateComplete;
    element.shadowRoot?.querySelector<HTMLImageElement>('img')?.dispatchEvent(new Event('error'));
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('[part="initials"]')?.textContent).toBe('MC');
    expect(element.shadowRoot?.querySelector('img')).toBeNull();
  });

  it('renders linked parent breadcrumbs and marks only the current location', async () => {
    document.body.innerHTML = '<ov-breadcrumbs label="Project path"></ov-breadcrumbs>';
    const element = document.querySelector('ov-breadcrumbs') as import('../src/components/breadcrumbs.js').OvBreadcrumbs;
    element.items = [{ label: 'Projects', href: '/projects' }, { label: 'Northstar studio', href: '/projects/northstar' }, { label: 'Settings' }];
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('nav')?.getAttribute('aria-label')).toBe('Project path');
    expect(element.shadowRoot?.querySelectorAll('a')).toHaveLength(2);
    expect(element.shadowRoot?.querySelector('[aria-current="page"]')?.textContent).toBe('Settings');
    expect(element.shadowRoot?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('renders accordion disclosures and keeps open item state property-backed', async () => {
    document.body.innerHTML = '<ov-accordion></ov-accordion>';
    const element = document.querySelector('ov-accordion') as import('../src/components/accordion.js').OvAccordion;
    element.items = [{ value: 'summary', label: 'Project summary' }, { value: 'members', label: 'Members' }];
    element.innerHTML = '<p slot="summary">A concise overview.</p><p slot="members">Three people have access.</p>';
    await element.updateComplete;
    const details = [...(element.shadowRoot?.querySelectorAll<HTMLDetailsElement>('details') ?? [])];
    expect(details).toHaveLength(2);
    expect(details[0]?.querySelector('[part="panel"]')?.getAttribute('role')).toBe('region');
    details[0]?.querySelector('summary')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    details[0]!.open = true;
    details[0]?.dispatchEvent(new Event('toggle', { bubbles: true }));
    await element.updateComplete;
    expect(element.openItems).toEqual(['summary']);
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.getAttribute('aria-controls')).toContain('ov-accordion-');
  });

  it('keeps slider range semantics and emits numeric input details', async () => {
    document.body.innerHTML = '<ov-slider label="Opacity" min="0" max="100" value="50" step="5" show-value></ov-slider>';
    const element = document.querySelector('ov-slider') as import('../src/components/slider.js').OvSlider;
    await element.updateComplete;
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]');
    expect(input?.getAttribute('min')).toBe('0');
    expect(input?.getAttribute('max')).toBe('100');
    expect(input?.getAttribute('step')).toBe('5');
    expect(element.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('50');
    const inputEvent = vi.fn();
    element.addEventListener('input', inputEvent);
    input!.value = '65';
    input?.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.value).toBe(65);
    expect(element.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('65');
    expect((inputEvent.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: 65 });
  });

  it('keeps file upload input labelled and lists selected files', async () => {
    document.body.innerHTML = '<ov-file-upload label="Project archive" name="archive" accept=".zip" required></ov-file-upload>';
    const element = document.querySelector('ov-file-upload') as import('../src/components/file-upload.js').OvFileUpload;
    await element.updateComplete;
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input?.getAttribute('aria-labelledby')).toContain('ov-file-upload-');
    expect(input?.required).toBe(true);
    const file = new File(['archive'], 'project.zip', { type: 'application/zip' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    const change = vi.fn();
    element.addEventListener('change', change);
    input?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.files).toHaveLength(1);
    expect(element.shadowRoot?.querySelector('.file-name')?.textContent).toBe('project.zip');
    expect(change).toHaveBeenCalledTimes(1);
    expect((change.mock.calls[0]?.[0] as CustomEvent).detail.files[0]).toBe(file);
  });

  it('keeps date input constraints and emits the ISO value', async () => {
    document.body.innerHTML = '<ov-date-input label="Launch date" min="2026-01-01" max="2026-12-31" value="2026-03-12" required></ov-date-input>';
    const element = document.querySelector('ov-date-input') as import('../src/components/date-input.js').OvDateInput;
    await element.updateComplete;
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[type="date"]');
    expect(input?.value).toBe('2026-03-12');
    expect(input?.min).toBe('2026-01-01');
    expect(input?.max).toBe('2026-12-31');
    expect(input?.required).toBe(true);
    const change = vi.fn();
    element.addEventListener('change', change);
    input!.value = '2026-04-02';
    input?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.value).toBe('2026-04-02');
    expect((change.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: '2026-04-02' });
  });

  it('keeps number input bounds and emits the string value', async () => {
    document.body.innerHTML = '<ov-number-input label="Seats" min="1" max="24" step="1" value="4" required></ov-number-input>';
    const element = document.querySelector('ov-number-input') as import('../src/components/number-input.js').OvNumberInput;
    await element.updateComplete;
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input[type="number"]');
    expect(input?.type).toBe('number');
    expect(input?.value).toBe('4');
    expect(input?.min).toBe('1');
    expect(input?.max).toBe('24');
    expect(input?.step).toBe('1');
    expect(input?.required).toBe(true);
    const change = vi.fn();
    element.addEventListener('change', change);
    input!.value = '8';
    input?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.value).toBe('8');
    expect((change.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: '8' });
  });

  it('opens and dismisses a labelled popover while restoring trigger focus', async () => {
    document.body.innerHTML = '<ov-popover label="Project details"><span slot="trigger">View details</span><p>Last updated recently.</p></ov-popover>';
    const element = document.querySelector('ov-popover') as import('../src/components/popover.js').OvPopover;
    await element.updateComplete;
    const trigger = element.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]');
    const surface = element.shadowRoot?.querySelector<HTMLElement>('[part="popover"]');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(surface?.hasAttribute('hidden')).toBe(true);
    trigger?.click();
    await element.updateComplete;
    expect(element.open).toBe(true);
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(surface?.hasAttribute('hidden')).toBe(false);
    trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await element.updateComplete;
    expect(element.open).toBe(false);
    expect(document.activeElement).toBe(element);
  });

  it('renders nested tree semantics and toggles expanded parents', async () => {
    document.body.innerHTML = '<ov-tree label="Project files"></ov-tree>';
    const element = document.querySelector('ov-tree') as import('../src/components/tree.js').OvTree;
    element.items = [{ value: 'src', label: 'src', children: [{ value: 'main', label: 'main.ts' }] }, { value: 'readme', label: 'README.md' }];
    element.expanded = ['src'];
    element.value = 'main';
    await element.updateComplete;
    const tree = element.shadowRoot?.querySelector('[role="tree"]');
    const parent = element.shadowRoot?.querySelector<HTMLElement>('[part="item"][data-value="src"]');
    const child = element.shadowRoot?.querySelector<HTMLElement>('[part="item"][data-value="main"]');
    expect(tree?.getAttribute('aria-label')).toBe('Project files');
    expect(parent?.getAttribute('aria-expanded')).toBe('true');
    expect(child?.getAttribute('aria-level')).toBe('2');
    expect(child?.getAttribute('aria-selected')).toBe('true');
    parent?.querySelector<HTMLButtonElement>('[part="disclosure"]')?.click();
    await element.updateComplete;
    expect(element.expanded).toEqual([]);
    expect(element.shadowRoot?.querySelector('[data-value="main"]')).toBeNull();
  });

  it('renders stepper progress with aligned markers and stateful connectors', async () => {
    document.body.innerHTML = '<ov-stepper value="access" orientation="vertical"></ov-stepper>';
    const element = document.querySelector('ov-stepper') as import('../src/components/stepper.js').OvStepper;
    element.items = [{ value: 'details', label: 'Details' }, { value: 'access', label: 'Access', description: 'Choose who can enter.' }, { value: 'review', label: 'Review' }];
    await element.updateComplete;
    const steps = [...(element.shadowRoot?.querySelectorAll<HTMLElement>('[part="step"]') ?? [])];
    expect(steps).toHaveLength(3);
    expect(steps[0]?.dataset.state).toBe('complete');
    expect(steps[1]?.dataset.state).toBe('current');
    expect(steps[1]?.getAttribute('aria-current')).toBe('step');
    expect(steps[0]?.querySelector('[part="marker"]')?.textContent).toBe('✓');
    expect(steps[0]?.querySelector('[part="connector"]')?.getAttribute('data-state')).toBe('complete');
    expect(steps[1]?.querySelector('[part="connector"]')?.getAttribute('data-state')).toBe('current');
    expect(steps[1]?.textContent).toContain('Choose who can enter.');
  });

  it('opens and closes a drawer with native dialog semantics', async () => {
    document.body.innerHTML = '<ov-drawer heading="Filters" description="Refine the visible projects." open><p>Choose filters.</p></ov-drawer>';
    const element = document.querySelector('ov-drawer') as import('../src/components/drawer.js').OvDrawer;
    await element.updateComplete;
    const dialog = element.shadowRoot?.querySelector('dialog');
    expect(dialog?.open).toBe(true);
    expect(dialog?.getAttribute('aria-labelledby')).toContain('ov-drawer-');
    expect(element.textContent).toContain('Choose filters.');
    const close = vi.fn();
    element.addEventListener('close', close);
    element.shadowRoot?.querySelector<HTMLButtonElement>('[part="close"]')?.click();
    await element.updateComplete;
    expect(element.open).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
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
