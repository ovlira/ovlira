import '../../../src/components/index.ts';
import '../../../src/tokens/tokens.css';
import './styles.css';

type RecipeId = 'settings' | 'search' | 'crud' | 'detail' | 'empty' | 'shell';

interface RecipeDefinition {
  id: RecipeId;
  label: string;
  category: string;
  description: string;
}

interface TableRow {
  name: string;
  owner: string;
  status: string;
}

const recipes: RecipeDefinition[] = [
  { id: 'settings', label: 'Settings', category: 'Page', description: 'Grouped preferences with feedback and save boundaries.' },
  { id: 'search', label: 'Search', category: 'Page', description: 'Query-first results with loading, empty, and error paths.' },
  { id: 'crud', label: 'CRUD table', category: 'Page', description: 'A collection surface with create and saved states.' },
  { id: 'detail', label: 'Detail', category: 'Page', description: 'Identity-first record context with an edit seam.' },
  { id: 'empty', label: 'Empty state', category: 'State', description: 'A clear first action for a collection with no records.' },
  { id: 'shell', label: 'Application shell', category: 'Layout', description: 'Persistent navigation with a focused content frame.' },
];

const defaultSearchRows: TableRow[] = [
  { name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' },
  { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' },
  { name: 'Signal house', owner: 'Anika Rao', status: 'Active' },
];

const defaultCrudRows: TableRow[] = [
  { name: 'Northstar studio', owner: 'Maya Chen', status: 'Today' },
  { name: 'Field notes', owner: 'Jon Bell', status: 'Yesterday' },
];

let activeRecipe: RecipeId = 'settings';
let searchRows = [...defaultSearchRows];
let crudRows = [...defaultCrudRows];
let settingsSaved = false;
let detailEditing = false;
let detailName = 'Northstar studio';
let emptyCreated = false;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Visual review app root is missing.');

function render() {
  app.innerHTML = `
    <div class="review-frame">
      <header class="review-header">
        <div class="wordmark"><span class="wordmark-mark">O</span><span><strong>OVLIRA</strong><small>VISUAL REVIEW</small></span></div>
        <div class="header-actions">
          <span class="header-status"><span class="status-dot"></span>Local fixture lab</span>
        </div>
      </header>
      <div class="review-body">
        <aside class="review-nav" aria-label="Recipe fixtures">
          <div class="nav-intro"><span class="eyebrow">Catalogue review</span><p>One app, six approved starting points.</p></div>
          <nav>${recipes.map((recipe) => `<button type="button" class="recipe-tab ${recipe.id === activeRecipe ? 'is-active' : ''}" data-recipe="${recipe.id}"><span>${recipe.label}</span><small>${recipe.category}</small></button>`).join('')}</nav>
          <div class="nav-note"><span class="eyebrow">Review mode</span><p>Check behavior first. Record visual changes for designer approval.</p></div>
        </aside>
        <main class="review-main">
          <div class="review-toolbar">
            <div><span class="eyebrow">${activeRecipe === 'shell' ? 'Layout recipe' : 'Screen recipe'}</span><h1>${recipeById(activeRecipe).label}</h1><p>${recipeById(activeRecipe).description}</p></div>
            <div class="toolbar-meta"><span>Three widths</span><span>Required states</span><span>Keyboard pass</span></div>
          </div>
          <div class="fixture-stage" data-fixture="${activeRecipe}">${fixtureMarkup(activeRecipe)}</div>
        </main>
      </div>
      <footer class="review-footer"><span><strong>Human sign-off:</strong> Pass, Revise, or Block.</span><span>Review protocol: docs/visual-review.md</span></footer>
    </div>`;
  wireInteractions();
  hydrateComponents();
}

function recipeById(id: RecipeId) { return recipes.find((recipe) => recipe.id === id) ?? recipes[0]; }

function fixtureMarkup(id: RecipeId): string {
  if (id === 'settings') return settingsFixture();
  if (id === 'search') return searchFixture();
  if (id === 'crud') return crudFixture();
  if (id === 'detail') return detailFixture();
  if (id === 'empty') return emptyFixture();
  return shellFixture();
}

function stateSwitcher(label: string, states: string[], selected: string): string {
  return `<nav class="fixture-state" aria-label="${label}"><span class="state-label">Preview state</span>${states.map((state) => `<button type="button" class="state-tab ${state === selected ? 'is-active' : ''}" data-state="${state}" aria-pressed="${state === selected}">${state}</button>`).join('')}</nav>`;
}

function settingsFixture(): string {
  return `<ov-application-shell>
    <a slot="brand" class="brand-mark" href="#settings">OVLIRA <span>VISUAL LAB</span></a>
    <a slot="nav" href="#settings" aria-current="page">Workspace</a><a slot="nav" href="#activity">Activity</a><a slot="nav" href="#members">Members</a>
    <span slot="header" class="shell-utility">LOCAL / SETTINGS <ov-badge tone="accent">Prototype</ov-badge></span>
    <div class="fixture-shell settings-shell">
    <div class="fixture-kicker">Workspace / Settings</div>
    <div class="fixture-heading"><div><span class="eyebrow">Control surface</span><h2>Workspace settings</h2><p>Keep the everyday details of your workspace clear, current, and easy to hand off.</p></div><ov-badge tone="accent">Prototype</ov-badge></div>
    ${stateSwitcher('Settings states', ['Saved', 'Loading', 'Error'], settingsSaved ? 'Saved' : 'Saved')}
    <div class="state-panel" data-state-panel="Loading" hidden><ov-alert tone="info" heading="Loading settings">Fetching the latest workspace details.</ov-alert></div>
    <div class="state-panel" data-state-panel="Error" hidden><ov-alert tone="danger" heading="Could not save">Check the highlighted fields and try again.</ov-alert></div>
    <div class="state-panel" data-state-panel="Saved"><ov-alert tone="success" heading="${settingsSaved ? 'Changes saved' : 'Ready to save'}">${settingsSaved ? 'Your workspace details are up to date.' : 'Your changes will appear here after saving.'}</ov-alert></div>
    <div class="fixture-grid">
      <ov-card><div slot="header" class="card-heading"><span class="card-kicker">01 / identity</span><h3>Workspace profile</h3><p>The details teammates see when they join your space.</p></div><div class="field-grid"><ov-input label="Workspace name" value="Northstar studio" required></ov-input><ov-input label="Workspace URL" value="northstar" required></ov-input></div><div slot="footer" class="card-actions"><span class="hint">Last synced just now</span><ov-button variant="primary" data-action="save-settings">Save profile</ov-button></div></ov-card>
      <ov-card><div slot="header" class="card-heading"><span class="card-kicker">02 / preferences</span><h3>Default preferences</h3><p>Set the defaults that keep new work moving.</p></div><div class="field-grid"><ov-select label="Default region" required data-setting-region></ov-select><ov-select label="Week starts on" required data-setting-week></ov-select></div><div slot="footer" class="card-actions"><span class="hint">Applies to new members</span><ov-button variant="primary" data-action="save-settings">Save preferences</ov-button></div></ov-card>
    </div>
    </div>
  </ov-application-shell>`;
}

function searchFixture(): string {
  return `<section class="fixture-shell">
    <div class="fixture-kicker">Find / Records</div>
    <div class="fixture-heading"><div><span class="eyebrow">Query-first</span><h2>Search records</h2><p>Keep the query, result count, and next action in the same view.</p></div><span class="result-count" data-search-count>${searchRows.length} matches</span></div>
    <div class="search-controls" data-ovlira-region="search"><ov-input label="Search records" placeholder="Name, owner, or ID" data-search-input></ov-input><ov-select label="Status" data-search-status></ov-select><ov-button variant="primary" data-action="search-run">Search</ov-button></div>
    ${stateSwitcher('Search states', ['Results', 'Loading', 'Empty', 'Error'], 'Results')}
    <div class="state-panel" data-state-panel="Results"><ov-data-table caption="Search results" data-search-table></ov-data-table></div>
    <div class="state-panel" data-state-panel="Loading" hidden><ov-alert tone="info" heading="Searching">Looking for records that match your query.</ov-alert></div>
    <div class="state-panel" data-state-panel="Empty" hidden><ov-empty-state title="No matching records" description="Try a broader search or create a new record."><ov-button slot="action" variant="primary" data-action="search-create">Create record</ov-button></ov-empty-state></div>
    <div class="state-panel" data-state-panel="Error" hidden><ov-alert tone="danger" heading="Search unavailable">Check the connection and try again.</ov-alert></div>
  </section>`;
}

function crudFixture(): string {
  return `<section class="fixture-shell">
    <div class="fixture-kicker">Manage / Projects</div>
    <div class="fixture-heading"><div><span class="eyebrow">Collection</span><h2>Projects</h2><p>Keep ownership and recent movement visible at a glance.</p></div><ov-button variant="primary" data-action="crud-create">New project</ov-button></div>
    ${stateSwitcher('Collection states', ['Records', 'Loading', 'Empty', 'Error', 'Saved'], 'Records')}
    <div class="state-panel" data-state-panel="Records"><ov-data-table caption="Projects" data-crud-table></ov-data-table></div>
    <div class="state-panel" data-state-panel="Loading" hidden><ov-alert tone="info" heading="Loading projects">Fetching the latest records.</ov-alert></div>
    <div class="state-panel" data-state-panel="Empty" hidden><ov-empty-state title="No projects yet" description="Create the first project to begin."><ov-button slot="action" variant="primary" data-action="crud-create">Create project</ov-button></ov-empty-state></div>
    <div class="state-panel" data-state-panel="Error" hidden><ov-alert tone="danger" heading="Could not load projects">Check the connection and try again.</ov-alert></div>
    <div class="state-panel" data-state-panel="Saved" hidden><ov-alert tone="success" heading="Project created">The new project is ready to open.</ov-alert></div>
    <div class="inline-create" data-crud-form hidden><ov-input label="Project name" placeholder="e.g. Northstar studio" data-crud-input></ov-input><ov-button variant="primary" data-action="crud-save">Add project</ov-button></div>
  </section>`;
}

function detailFixture(): string {
  return `<section class="fixture-shell">
    <div class="fixture-kicker">Record / Northstar studio</div>
    <div class="fixture-heading"><div><span class="eyebrow">Record</span><h2 data-detail-title>${detailName}</h2><p>A focused view of one record before taking action.</p></div><div class="fixture-actions"><ov-button variant="secondary" data-action="detail-back">Back</ov-button><ov-button variant="primary" data-action="detail-edit">${detailEditing ? 'Close edit' : 'Edit record'}</ov-button></div></div>
    ${stateSwitcher('Detail states', ['Ready', 'Loading', 'Error'], 'Ready')}
    <div class="state-panel" data-state-panel="Ready"><div class="fixture-grid detail-grid"><ov-card><div slot="header" class="card-heading"><span class="card-kicker">Identity</span><h3>Workspace profile <ov-badge tone="success">Active</ov-badge></h3></div><dl class="detail-list"><div><dt>Owner</dt><dd>Maya Chen</dd></div><div><dt>Region</dt><dd>Europe</dd></div><div><dt>Created</dt><dd>12 March 2026</dd></div></dl></ov-card><ov-card><div slot="header" class="card-heading"><span class="card-kicker">Context</span><h3>What to know</h3></div><p>Keep identity and current status above secondary fields so the next action is easy to understand.</p></ov-card></div></div>
    <div class="state-panel" data-state-panel="Loading" hidden><ov-card><p class="state-copy">Loading the record summary…</p></ov-card></div>
    <div class="state-panel" data-state-panel="Error" hidden><ov-alert tone="danger" heading="Could not load record">Check the connection and try again.</ov-alert></div>
    <div class="inline-edit" data-detail-form ${detailEditing ? '' : 'hidden'}><ov-input label="Record name" value="${detailName}" data-detail-input></ov-input><ov-button variant="primary" data-action="detail-save">Save name</ov-button></div>
  </section>`;
}

function emptyFixture(): string {
  return `<section class="fixture-shell compact-fixture">
    <div class="fixture-kicker">Collection / First run</div>
    <div class="fixture-heading"><div><span class="eyebrow">State recipe</span><h2>Projects</h2><p>A calm starting point when the first record does not exist yet.</p></div></div>
    <div class="state-panel" data-state-panel="Empty" ${emptyCreated ? 'hidden' : ''}><ov-empty-state title="Nothing here yet" description="Create the first project to begin."><ov-button slot="action" variant="primary" data-action="empty-create">Create project</ov-button></ov-empty-state></div>
    <div class="state-panel" data-state-panel="Created" ${emptyCreated ? '' : 'hidden'}><ov-alert tone="success" heading="Project created">The new project is ready to open.</ov-alert></div>
  </section>`;
}

function shellFixture(): string {
  return `<section class="fixture-shell shell-fixture">
    <div class="fixture-kicker">Application / Frame</div>
    <ov-application-shell>
      <a slot="brand" class="brand-mark" href="#overview">OVLIRA <span>VISUAL LAB</span></a>
      <a slot="nav" href="#overview" aria-current="page" data-shell-nav="Overview">Overview</a><a slot="nav" href="#projects" data-shell-nav="Projects">Projects</a><a slot="nav" href="#activity" data-shell-nav="Activity">Activity</a>
      <span slot="header" class="shell-utility">LOCAL / OVERVIEW <ov-badge tone="accent">Prototype</ov-badge></span>
      <div class="shell-content"><ov-page-header data-shell-header eyebrow="Application frame" title="Project overview" description="A persistent shell for a focused local product surface."><span slot="actions"><ov-button variant="primary" data-action="shell-new">New project</ov-button></span></ov-page-header><div class="overview-grid"><ov-card><div slot="header" class="card-heading"><span class="card-kicker">At a glance</span><h3>Keep the next step visible</h3></div><p>Use the shell for persistent navigation, then let each screen stay focused on one task.</p><span slot="footer" class="hint">Three active projects</span></ov-card><ov-card><div slot="header" class="card-heading"><span class="card-kicker">Recent activity</span><h3>Small updates, clear context</h3></div><p data-shell-activity>Give people a lightweight trail of what changed without turning the overview into a dashboard.</p><span slot="footer" class="hint">Updated a few minutes ago</span></ov-card></div></div>
    </ov-application-shell>
  </section>`;
}

function wireInteractions() {
  app.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach((button) => button.addEventListener('click', () => {
    activeRecipe = button.dataset.recipe as RecipeId;
    render();
  }));
  app.querySelectorAll<HTMLButtonElement>('[data-state]').forEach((button) => button.addEventListener('click', () => showState(button.dataset.state ?? '')));
  app.querySelectorAll<HTMLElement>('[data-action="save-settings"]').forEach((button) => button.addEventListener('click', () => {
    settingsSaved = true;
    showState('Saved');
    const panel = app.querySelector<HTMLElement>('[data-state-panel="Saved"]');
    if (panel) panel.querySelector('ov-alert')?.setAttribute('heading', 'Changes saved');
  }));
  app.querySelector<HTMLElement>('[data-action="search-run"]')?.addEventListener('click', runSearch);
  app.querySelector<HTMLElement>('[data-action="search-create"]')?.addEventListener('click', () => {
    searchRows = [...defaultSearchRows];
    const count = app.querySelector<HTMLElement>('[data-search-count]');
    if (count) count.textContent = `${searchRows.length} matches`;
    hydrateComponents();
    showState('Results');
  });
  app.querySelector<HTMLElement>('[data-action="crud-create"]')?.addEventListener('click', () => {
    const form = app.querySelector<HTMLElement>('[data-crud-form]');
    if (form) form.hidden = false;
    focusNativeControl(form);
  });
  app.querySelector<HTMLElement>('[data-action="crud-save"]')?.addEventListener('click', saveCrud);
  app.querySelector<HTMLElement>('[data-action="detail-edit"]')?.addEventListener('click', () => {
    detailEditing = !detailEditing;
    render();
    if (detailEditing) focusNativeControl(app.querySelector('[data-detail-form]'));
  });
  app.querySelector<HTMLElement>('[data-action="detail-save"]')?.addEventListener('click', saveDetail);
  app.querySelector<HTMLElement>('[data-action="detail-back"]')?.addEventListener('click', () => showState('Ready'));
  app.querySelector<HTMLElement>('[data-action="empty-create"]')?.addEventListener('click', () => {
    emptyCreated = true;
    render();
  });
  app.querySelector<HTMLElement>('[data-action="shell-new"]')?.addEventListener('click', () => {
    const activity = app.querySelector<HTMLElement>('[data-shell-activity]');
    if (activity) activity.textContent = 'A new project draft is ready to configure.';
  });
  app.querySelectorAll<HTMLAnchorElement>('[data-shell-nav]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    app.querySelectorAll('[data-shell-nav]').forEach((item) => item.classList.remove('is-current'));
    link.classList.add('is-current');
    const header = app.querySelector<HTMLElement>('[data-shell-header]');
    const destination = link.dataset.shellNav ?? 'Overview';
    if (header) {
      header.setAttribute('title', destination === 'Overview' ? 'Project overview' : destination);
      header.setAttribute('description', destination === 'Activity' ? 'A lightweight trail of the changes that matter.' : destination === 'Projects' ? 'A focused collection view inside the persistent frame.' : 'A persistent shell for a focused local product surface.');
    }
  }));
}

function focusNativeControl(container: Element | null) {
  const component = container?.querySelector<HTMLElement>('ov-input, ov-select');
  component?.shadowRoot?.querySelector<HTMLElement>('input, select')?.focus();
}

function showState(name: string) {
  app.querySelectorAll<HTMLElement>('[data-state-panel]').forEach((panel) => { panel.hidden = panel.dataset.statePanel !== name; });
  app.querySelectorAll<HTMLElement>('[data-state]').forEach((button) => {
    const active = button.dataset.state === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function runSearch() {
  showState('Loading');
  window.setTimeout(() => {
    const query = readControlValue('[data-search-input]').trim().toLowerCase();
    const status = readControlValue('[data-search-status]');
    searchRows = defaultSearchRows.filter((row) => (!query || Object.values(row).some((value) => value.toLowerCase().includes(query))) && (!status || row.status.toLowerCase() === status));
    const count = app.querySelector<HTMLElement>('[data-search-count]');
    if (count) count.textContent = `${searchRows.length} match${searchRows.length === 1 ? '' : 'es'}`;
    hydrateComponents();
    showState(searchRows.length ? 'Results' : 'Empty');
  }, 180);
}

function saveCrud() {
  const name = readControlValue('[data-crud-input]').trim() || 'Untitled project';
  crudRows = [{ name, owner: 'You', status: 'Just now' }, ...crudRows];
  hydrateComponents();
  const form = app.querySelector<HTMLElement>('[data-crud-form]');
  if (form) form.hidden = true;
  showState('Saved');
}

function saveDetail() {
  const name = readControlValue('[data-detail-input]').trim();
  const title = app.querySelector<HTMLElement>('[data-detail-title]');
  if (name) detailName = name;
  if (title) title.textContent = detailName;
  detailEditing = false;
  render();
}

function readControlValue(selector: string): string {
  const host = app.querySelector<HTMLElement & { value?: string }>(selector);
  const property = host?.value;
  if (typeof property === 'string' && property) return property;
  const native = host?.shadowRoot?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
  return native?.value ?? '';
}

function hydrateComponents() {
  const selects = app.querySelectorAll<HTMLElement & { options?: unknown; value?: string }>('ov-select');
  selects.forEach((select) => {
    if (select.hasAttribute('data-search-status')) select.options = [{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }];
    else if (select.hasAttribute('data-setting-week')) select.options = [{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }];
    else select.options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }];
  });
  const searchTable = app.querySelector<HTMLElement & { columns?: unknown; rows?: unknown }>('[data-search-table]');
  if (searchTable) { searchTable.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }]; searchTable.rows = searchRows; }
  const crudTable = app.querySelector<HTMLElement & { columns?: unknown; rows?: unknown }>('[data-crud-table]');
  if (crudTable) { crudTable.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Updated' }]; crudTable.rows = crudRows; }
}

render();
