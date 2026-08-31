export type RecipeFixtureId = 'page.settings' | 'page.search' | 'page.crud-table' | 'page.detail' | 'state.empty' | 'shell.application';

export interface RecipeFixtureDefinition {
  id: RecipeFixtureId;
  label: string;
  category: 'Page' | 'State' | 'Layout';
  description: string;
  states: readonly string[];
  defaultState: string;
}

export const recipeFixtures: readonly RecipeFixtureDefinition[] = [
  { id: 'page.settings', label: 'Settings', category: 'Page', description: 'Grouped preferences with feedback and clear save boundaries.', states: ['success', 'loading', 'error'], defaultState: 'success' },
  { id: 'page.search', label: 'Search', category: 'Page', description: 'Query-first results with loading, empty, and error paths.', states: ['results', 'loading', 'empty', 'error'], defaultState: 'results' },
  { id: 'page.crud-table', label: 'CRUD table', category: 'Page', description: 'A focused collection surface with create and saved states.', states: ['records', 'loading', 'empty', 'error', 'success'], defaultState: 'records' },
  { id: 'page.detail', label: 'Detail', category: 'Page', description: 'Identity-first record context with a compact edit seam.', states: ['ready', 'loading', 'error'], defaultState: 'ready' },
  { id: 'state.empty', label: 'Empty state', category: 'State', description: 'A clear first action for a collection with no records.', states: ['empty', 'success'], defaultState: 'empty' },
  { id: 'shell.application', label: 'Application shell', category: 'Layout', description: 'Persistent navigation with a focused content frame.', states: ['default'], defaultState: 'default' },
];

export function recipeFixture(id: RecipeFixtureId): RecipeFixtureDefinition {
  return recipeFixtures.find((fixture) => fixture.id === id) ?? recipeFixtures[0];
}

const stateLabels: Record<string, string> = {
  success: 'Saved',
  results: 'Results',
  records: 'Records',
  ready: 'Ready',
  loading: 'Loading',
  empty: 'Empty',
  error: 'Error',
};

function stateSwitcher(fixture: RecipeFixtureDefinition): string {
  if (fixture.states.length < 2) return '';
  return `<nav class="fixture-state" aria-label="${fixture.label} preview state"><span class="state-label">Preview state</span>${fixture.states.map((state) => `<button type="button" class="state-tab" data-ovlira-state-target="${state}" aria-pressed="${state === fixture.defaultState}">${stateLabels[state] ?? state}</button>`).join('')}</nav>`;
}

export function recipeFixtureMarkup(id: RecipeFixtureId): string {
  const fixture = recipeFixture(id);
  if (id === 'page.settings') return settingsMarkup(fixture);
  if (id === 'page.search') return searchMarkup(fixture);
  if (id === 'page.crud-table') return crudMarkup(fixture);
  if (id === 'page.detail') return detailMarkup(fixture);
  if (id === 'state.empty') return emptyMarkup();
  return shellMarkup();
}

function settingsMarkup(fixture: RecipeFixtureDefinition): string {
  return `<ov-application-shell>
    <a slot="brand" class="brand-mark" href="#settings">Ovlira <span>Local UI kit</span></a>
    <a slot="nav" href="#settings" aria-current="page">Workspace</a><a slot="nav" href="#activity">Activity</a><a slot="nav" href="#members">Members</a>
    <span slot="header" class="shell-utility">Workspace · Settings</span>
    <div class="recipe-page settings-page">
      <ov-page-header eyebrow="Workspace" title="Workspace settings" description="Keep the everyday details of your workspace clear and current."></ov-page-header>
      ${stateSwitcher(fixture)}
      <div class="state-feedback">
        <div data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Loading settings">Fetching the latest workspace details.</ov-alert></div>
        <div data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Could not save">Check the highlighted fields and try again.</ov-alert></div>
        <div data-ovlira-state="success"><ov-alert tone="success" heading="Ready to save" data-settings-status>Your workspace details are ready to update.</ov-alert></div>
      </div>
      <div class="settings-sections">
        <section class="settings-section" data-ovlira-region="identity" aria-labelledby="settings-identity">
          <div class="section-intro"><div><p class="section-label">Identity</p><h2 id="settings-identity">Workspace profile</h2></div><p>The details teammates see when they join your space.</p></div>
          <div class="field-grid"><ov-input label="Workspace name" value="Northstar studio" required></ov-input><ov-input label="Workspace URL" value="northstar" required></ov-input></div>
          <div class="decision-row"><span class="hint">Last synced just now</span><ov-button variant="primary" data-ovlira-action="save">Save profile</ov-button></div>
        </section>
        <section class="settings-section" data-ovlira-region="preferences" aria-labelledby="settings-preferences">
          <div class="section-intro"><div><p class="section-label">Preferences</p><h2 id="settings-preferences">Default preferences</h2></div><p>Set the defaults applied to new members.</p></div>
          <div class="field-grid"><ov-select label="Default region" required data-setting-region></ov-select><ov-select label="Week starts on" required data-setting-week></ov-select></div>
          <div class="decision-row"><span class="hint">Applies to new members</span><ov-button variant="primary" data-ovlira-action="save">Save preferences</ov-button></div>
        </section>
      </div>
    </div>
  </ov-application-shell>`;
}

function searchMarkup(fixture: RecipeFixtureDefinition): string {
  return `<main class="recipe-page">
    <ov-page-header eyebrow="Find" title="Search records" description="Keep the query, result count, and next action in the same view."></ov-page-header>
    <div class="search-controls" data-ovlira-region="search"><ov-input label="Search records" placeholder="Name, owner, or ID" data-ovlira-search-input></ov-input><ov-select label="Status" data-ovlira-search-status></ov-select><ov-button variant="primary" data-ovlira-action="search">Search</ov-button></div>
    <p class="result-count" role="status" aria-live="polite" data-ovlira-result-count>3 matches</p>
    ${stateSwitcher(fixture)}
    <section data-ovlira-state="results"><ov-data-table caption="Search results" data-search-table></ov-data-table></section>
    <section data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Searching">Looking for records that match your query.</ov-alert></section>
    <section data-ovlira-state="empty" hidden><ov-empty-state title="No matching records" description="Try a broader search or create a new record."><ov-button slot="action" variant="primary" data-ovlira-action="search-create">Create record</ov-button></ov-empty-state></section>
    <section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Search unavailable">Check the connection and try again.</ov-alert></section>
  </main>`;
}

function crudMarkup(fixture: RecipeFixtureDefinition): string {
  return `<main class="recipe-page">
    <ov-page-header eyebrow="Collection" title="Projects" description="Keep ownership and recent movement visible at a glance."><span slot="actions"><ov-button variant="primary" data-ovlira-action="create">Create project</ov-button></span></ov-page-header>
    ${stateSwitcher(fixture)}
    <section data-ovlira-state="records"><ov-data-table caption="Projects" data-crud-table></ov-data-table></section>
    <section data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Loading projects">Fetching the latest records.</ov-alert></section>
    <section data-ovlira-state="empty" hidden><ov-empty-state title="No projects yet" description="Create the first project to begin."><ov-button slot="action" variant="primary" data-ovlira-action="create">Create project</ov-button></ov-empty-state></section>
    <section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Could not load projects">Check the connection and try again.</ov-alert></section>
    <section data-ovlira-state="success" hidden><ov-alert tone="success" heading="Project created">The new project is ready to open.</ov-alert></section>
    <div class="inline-form" data-ovlira-create-form hidden><ov-input label="Project name" placeholder="e.g. Northstar studio" data-ovlira-create-input></ov-input><ov-button variant="primary" data-ovlira-action="save">Add project</ov-button></div>
  </main>`;
}

function detailMarkup(fixture: RecipeFixtureDefinition): string {
  return `<main class="recipe-page">
    <ov-page-header eyebrow="Record" title="Northstar studio" description="A focused view of one record before taking action." data-detail-header><span slot="actions"><ov-button variant="secondary" data-ovlira-action="back">Back</ov-button><ov-button variant="primary" data-ovlira-action="edit">Edit record</ov-button></span></ov-page-header>
    <div class="inline-form" data-ovlira-edit-form hidden><ov-input label="Record name" value="Northstar studio" data-ovlira-detail-input></ov-input><ov-button variant="primary" data-ovlira-action="save-detail">Save name</ov-button></div>
    ${stateSwitcher(fixture)}
    <div data-ovlira-state="ready" class="detail-sections">
      <section class="detail-section" aria-labelledby="detail-identity"><div class="section-intro"><div><p class="section-label">Identity</p><h2 id="detail-identity">Workspace profile</h2></div><ov-badge tone="success">Active</ov-badge></div><dl class="detail-list"><div><dt>Owner</dt><dd>Maya Chen</dd></div><div><dt>Region</dt><dd>Europe</dd></div><div><dt>Created</dt><dd>12 March 2026</dd></div></dl></section>
      <section class="detail-section" aria-labelledby="detail-context"><div class="section-intro"><div><p class="section-label">Context</p><h2 id="detail-context">What to know</h2></div></div><p class="section-copy">Keep identity and current status above secondary fields so the next action remains clear.</p></section>
    </div>
    <section data-ovlira-state="loading" hidden><ov-alert tone="info" heading="Loading record">Fetching the record summary.</ov-alert></section>
    <section data-ovlira-state="error" hidden><ov-alert tone="danger" heading="Could not load record">Check the connection and try again.</ov-alert></section>
  </main>`;
}

function emptyMarkup(): string {
  return `<main class="recipe-page compact-recipe">
    <ov-page-header eyebrow="Collection" title="Projects" description="A calm starting point when the first record does not exist yet."></ov-page-header>
    <section data-ovlira-state="empty"><ov-empty-state title="Nothing here yet" description="Create the first project to begin."><ov-button slot="action" variant="primary" data-ovlira-action="create-empty">Create project</ov-button></ov-empty-state></section>
    <section data-ovlira-state="success" hidden><ov-alert tone="success" heading="Project created">The new project is ready to open.</ov-alert></section>
  </main>`;
}

function shellMarkup(): string {
  return `<ov-application-shell>
    <a slot="brand" class="brand-mark" href="#overview">Ovlira <span>Local UI kit</span></a>
    <a slot="nav" href="#overview" aria-current="page" data-ovlira-nav="Overview">Overview</a><a slot="nav" href="#projects" data-ovlira-nav="Projects">Projects</a><a slot="nav" href="#activity" data-ovlira-nav="Activity">Activity</a>
    <span slot="header" class="shell-utility" data-shell-utility>Workspace · Overview</span>
    <div class="recipe-page shell-page"><ov-page-header eyebrow="Application" title="Project overview" description="A persistent shell for a focused local product surface." data-shell-header><span slot="actions"><ov-button variant="primary" data-ovlira-action="new">Create project</ov-button></span></ov-page-header><div class="overview-sections"><section><p class="section-label">At a glance</p><h2>Keep the next step visible</h2><p>Use the shell for persistent navigation, then let each screen stay focused on one task.</p><span class="hint">Three active projects</span></section><section><p class="section-label">Recent activity</p><h2>Small updates, clear context</h2><p data-shell-activity>Give people a lightweight trail of what changed without turning the overview into a dashboard.</p><span class="hint">Updated a few minutes ago</span></section></div></div>
  </ov-application-shell>`;
}

export const recipeFixtureStyles = `
.recipe-page { color: var(--ov-text, var(--ov-color-ink, #171717)); margin-inline: auto; max-width: var(--ov-content-wide, 64rem); }
.settings-page, .shell-page { margin: 0; max-width: none; }
.brand-mark { color: var(--ov-text, var(--ov-color-ink, #171717)); display: flex; flex-direction: column; font: 600 var(--ov-text-lg, 1rem)/1.2 var(--ov-font-sans, sans-serif); justify-content: center; min-height: var(--ov-control-height, 2.5rem); text-decoration: none; }
.brand-mark span { color: var(--ov-faint, #767676); font-size: var(--ov-text-xs, .72rem); font-weight: 400; margin-block-start: .25rem; }
.shell-utility { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font-size: var(--ov-text-sm, .82rem); }
.fixture-state { align-items: center; border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / .10))); display: flex; flex-wrap: wrap; gap: var(--ov-space-2, .5rem); margin-block-end: var(--ov-space-8, 2rem); padding-block-end: var(--ov-space-3, .75rem); }
.state-label, .section-label { color: var(--ov-faint, #767676); font: 600 var(--ov-text-xs, .72rem)/1.2 var(--ov-font-sans, sans-serif); letter-spacing: .08em; text-transform: uppercase; }
.state-label { margin-inline-end: var(--ov-space-2, .5rem); }
.state-tab { background: transparent; border: 0; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; font: 400 var(--ov-text-sm, .82rem)/1 var(--ov-font-sans, sans-serif); min-height: var(--ov-control-height, 2.5rem); padding: var(--ov-space-2, .5rem) var(--ov-space-1, .25rem); }
.state-tab[aria-pressed='true'] { color: var(--ov-text, var(--ov-color-ink, #171717)); font-weight: 500; }
.state-tab:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
.state-feedback { margin-block-end: var(--ov-space-8, 2rem); min-height: 2.5rem; }
[data-ovlira-state][hidden], [data-ovlira-create-form][hidden], [data-ovlira-edit-form][hidden] { display: none; }
.settings-sections, .detail-sections, .overview-sections { display: grid; gap: var(--ov-space-10, 2.5rem); }
.settings-section, .detail-section, .overview-sections > section { border-block-start: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / .10))); padding-block-start: var(--ov-space-4, 1rem); }
.section-intro { align-items: flex-start; display: grid; gap: var(--ov-space-4, 1rem); grid-template-columns: minmax(10rem, .75fr) 1.5fr; margin-block-end: var(--ov-space-6, 1.5rem); }
.section-label { margin: 0 0 var(--ov-space-1, .25rem); }
.section-intro h2, .overview-sections h2 { font: 600 var(--ov-text-lg, 1rem)/1.3 var(--ov-font-sans, sans-serif); margin: 0; }
.section-intro > p, .section-copy, .overview-sections p { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font-size: var(--ov-text-sm, .82rem); line-height: var(--ov-line-body, 1.55); margin: 0; }
.field-grid { display: grid; gap: var(--ov-space-6, 1.5rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.decision-row { align-items: center; border-block-start: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / .10))); display: flex; gap: var(--ov-space-4, 1rem); justify-content: space-between; margin-block-start: var(--ov-space-6, 1.5rem); padding-block-start: var(--ov-space-4, 1rem); }
.hint, .result-count { color: var(--ov-faint, #767676); font-size: var(--ov-text-xs, .72rem); }
.search-controls { align-items: end; display: grid; gap: var(--ov-space-4, 1rem); grid-template-columns: minmax(0, 1fr) minmax(10rem, .35fr) auto; margin-block-end: var(--ov-space-3, .75rem); }
.result-count { margin: 0 0 var(--ov-space-6, 1.5rem); }
.inline-form { align-items: end; border-block: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / .10))); display: grid; gap: var(--ov-space-4, 1rem); grid-template-columns: minmax(0, 1fr) auto; margin-block-end: var(--ov-space-8, 2rem); padding-block: var(--ov-space-4, 1rem); }
.detail-list { margin: 0; }
.detail-list div { display: grid; gap: var(--ov-space-4, 1rem); grid-template-columns: minmax(8rem, .75fr) 1.5fr; padding-block: var(--ov-space-2, .5rem); }
.detail-list dt { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); }
.detail-list dd { margin: 0; overflow-wrap: anywhere; }
.overview-sections { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.overview-sections h2 { margin-block-end: var(--ov-space-1, .25rem); }
.overview-sections .hint { display: inline-block; margin-block-start: var(--ov-space-4, 1rem); }
.compact-recipe { max-width: var(--ov-content-narrow, 34rem); }
@media (hover: hover) { .state-tab:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / .055))); color: var(--ov-text, var(--ov-color-ink, #171717)); } }
@media (max-width: 47.5rem) { .brand-mark, .state-tab { min-height: var(--ov-touch-target, 2.75rem); } .field-grid, .overview-sections, .search-controls { grid-template-columns: 1fr; } .section-intro { grid-template-columns: 1fr; gap: var(--ov-space-1, .25rem); } .inline-form { grid-template-columns: 1fr; } }
@media (max-width: 27rem) { .decision-row { align-items: flex-start; flex-direction: column; } .detail-list div { grid-template-columns: 1fr; gap: var(--ov-space-1, .25rem); } }
`;
