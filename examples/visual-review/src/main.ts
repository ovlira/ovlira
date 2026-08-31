import '@fontsource-variable/inter/wght.css';
import '../../../src/components/index.ts';
import '../../../src/tokens/tokens.css';
import { recipeFixture, recipeFixtureMarkup, recipeFixtureStyles, recipeFixtures, type RecipeFixtureId } from '../../../src/recipes/fixtures.ts';
import './styles.css';

interface TableRow {
  name: string;
  owner: string;
  status?: string;
  updated?: string;
}

const defaultSearchRows: TableRow[] = [
  { name: 'Northstar studio', owner: 'Maya Chen', status: 'Active' },
  { name: 'Field notes', owner: 'Jon Bell', status: 'Archived' },
  { name: 'Signal house', owner: 'Anika Rao', status: 'Active' },
];
const defaultCrudRows: TableRow[] = [
  { name: 'Northstar studio', owner: 'Maya Chen', updated: 'Today' },
  { name: 'Field notes', owner: 'Jon Bell', updated: 'Yesterday' },
];

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Visual review app root is missing.');

const fixtureStyle = document.createElement('style');
fixtureStyle.dataset.ovliraFixtureStyles = '';
fixtureStyle.textContent = recipeFixtureStyles;
document.head.append(fixtureStyle);

const initial = new URLSearchParams(window.location.search);
const fixtureOnly = initial.get('mode') === 'fixture';
let activeRecipe = validRecipe(initial.get('recipe')) ?? 'page.settings';
let activeState = validState(activeRecipe, initial.get('state'));
let theme: 'light' | 'dark' = initial.get('theme') === 'dark' ? 'dark' : 'light';
let searchRows = [...defaultSearchRows];
let crudRows = [...defaultCrudRows];
let detailName = 'Northstar studio';

document.documentElement.dataset.theme = theme;
render();

function validRecipe(value: string | null): RecipeFixtureId | undefined {
  return recipeFixtures.some((fixture) => fixture.id === value) ? value as RecipeFixtureId : undefined;
}

function validState(recipeId: RecipeFixtureId, value: string | null): string {
  const fixture = recipeFixture(recipeId);
  return value && fixture.states.includes(value) ? value : fixture.defaultState;
}

function render() {
  delete document.body.dataset.ready;
  const fixture = recipeFixture(activeRecipe);
  if (fixtureOnly) {
    document.body.classList.add('fixture-only');
    const shellFixture = activeRecipe === 'page.settings' || activeRecipe === 'shell.application';
    app.innerHTML = `<div class="fixture-only-stage ${shellFixture ? 'is-shell' : ''}" data-testid="fixture-stage" data-recipe="${activeRecipe}" data-state="${activeState}">${recipeFixtureMarkup(activeRecipe)}</div>`;
    hydrateComponents();
    wireInteractions();
    showState(activeState, false);
    document.body.dataset.ready = 'true';
    return;
  }
  document.body.classList.remove('fixture-only');
  app.innerHTML = `
    <a class="skip-link" href="#review-main">Skip to fixture</a>
    <div class="review-frame">
      <aside class="review-sidebar">
        <div class="review-brand"><strong>Ovlira</strong><span>Visual review</span></div>
        <p class="nav-label">Recipe fixtures</p>
        <nav aria-label="Recipe fixtures">${recipeFixtures.map((item) => `<button type="button" class="recipe-tab" data-recipe="${item.id}" aria-current="${item.id === activeRecipe ? 'page' : 'false'}"><span>${item.label}</span><small>${item.category}</small></button>`).join('')}</nav>
        <div class="review-note"><p class="nav-label">Review mode</p><p>Record visual defects. Do not redesign the system in the harness.</p></div>
      </aside>
      <main id="review-main" class="review-main">
        <header class="review-topbar">
          <div><p class="eyebrow">${fixture.category} recipe</p><h1>${fixture.label}</h1><p>${fixture.description}</p></div>
          <button type="button" class="theme-button" data-theme-toggle aria-label="Switch to ${theme === 'dark' ? 'light' : 'dark'} theme"><span aria-hidden="true">${theme === 'dark' ? '☼' : '◐'}</span></button>
        </header>
        <div class="review-meta" aria-label="Review requirements"><span>1440 · 768 · 375</span><span>Required states</span><span>Keyboard pass</span></div>
        <div class="fixture-stage" data-testid="fixture-stage" data-recipe="${activeRecipe}" data-state="${activeState}">${recipeFixtureMarkup(activeRecipe)}</div>
        <footer class="review-footer"><span><strong>Human sign-off:</strong> Pass, Revise, or Block</span><span>Default theme · ${theme} scheme</span></footer>
      </main>
    </div>`;

  hydrateComponents();
  wireInteractions();
  showState(activeState, false);
  document.body.dataset.ready = 'true';
}

function wireInteractions() {
  app.querySelectorAll<HTMLButtonElement>('button.recipe-tab[data-recipe]').forEach((button) => button.addEventListener('click', () => {
    activeRecipe = button.dataset.recipe as RecipeFixtureId;
    activeState = recipeFixture(activeRecipe).defaultState;
    render();
  }));

  app.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>('[data-ovlira-state-target]').forEach((button) => button.addEventListener('click', () => showState(button.dataset.ovliraStateTarget ?? '')));

  if (activeRecipe === 'page.settings') {
    app.querySelectorAll<HTMLElement>('[data-ovlira-action="save"]').forEach((button) => button.addEventListener('click', () => {
      const status = app.querySelector<HTMLElement & { heading?: string }>('[data-settings-status]');
      if (status) {
        status.heading = 'Changes saved';
        status.textContent = 'Your workspace details are up to date.';
      }
      showState('success');
    }));
  }

  app.querySelector<HTMLElement>('[data-ovlira-action="search"]')?.addEventListener('click', runSearch);
  app.querySelector<HTMLElement>('[data-ovlira-action="search-create"]')?.addEventListener('click', () => {
    searchRows = [...defaultSearchRows];
    hydrateTables();
    updateSearchCount();
    showState('results');
  });

  app.querySelectorAll<HTMLElement>('[data-ovlira-action="create"]').forEach((button) => button.addEventListener('click', () => {
    const form = app.querySelector<HTMLElement>('[data-ovlira-create-form]');
    if (form) {
      form.hidden = false;
      focusNativeControl(form);
    }
  }));
  if (activeRecipe === 'page.crud-table') app.querySelector<HTMLElement>('[data-ovlira-action="save"]')?.addEventListener('click', saveCrud);

  app.querySelector<HTMLElement>('[data-ovlira-action="edit"]')?.addEventListener('click', () => {
    const form = app.querySelector<HTMLElement>('[data-ovlira-edit-form]');
    if (form) {
      form.hidden = false;
      focusNativeControl(form);
    }
  });
  app.querySelector<HTMLElement>('[data-ovlira-action="save-detail"]')?.addEventListener('click', saveDetail);
  app.querySelector<HTMLElement>('[data-ovlira-action="back"]')?.addEventListener('click', () => showState('ready'));

  app.querySelector<HTMLElement>('[data-ovlira-action="create-empty"]')?.addEventListener('click', () => showState('success'));
  app.querySelector<HTMLElement>('[data-ovlira-action="new"]')?.addEventListener('click', () => {
    const activity = app.querySelector<HTMLElement>('[data-shell-activity]');
    if (activity) activity.textContent = 'A new project draft is ready to configure.';
  });
  app.querySelectorAll<HTMLAnchorElement>('[data-ovlira-nav]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    app.querySelectorAll('[data-ovlira-nav]').forEach((item) => item.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'page');
    const destination = link.dataset.ovliraNav ?? 'Overview';
    const utility = app.querySelector<HTMLElement>('[data-shell-utility]');
    if (utility) utility.textContent = `Workspace · ${destination}`;
    const header = app.querySelector<HTMLElement & { title?: string }>('[data-shell-header]');
    if (header) header.title = destination === 'Overview' ? 'Project overview' : destination;
  }));
}

function hydrateComponents() {
  const selects = app.querySelectorAll('ov-select');
  if (activeRecipe === 'page.settings') {
    if (selects[0]) selects[0].options = [{ value: 'eu', label: 'Europe' }, { value: 'us', label: 'United States' }];
    if (selects[1]) selects[1].options = [{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }];
  } else if (selects[0]) {
    selects[0].options = [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }];
  }
  hydrateTables();
}

function hydrateTables() {
  const searchTable = app.querySelector('ov-data-table[data-search-table]');
  if (searchTable) {
    searchTable.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }];
    searchTable.rows = searchRows as Record<string, string>[];
  }
  const crudTable = app.querySelector('ov-data-table[data-crud-table]');
  if (crudTable) {
    crudTable.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: 'Owner' }, { key: 'updated', label: 'Updated' }];
    crudTable.rows = crudRows as Record<string, string>[];
  }
}

function showState(name: string, updateUrl = true) {
  const fixture = recipeFixture(activeRecipe);
  if (!fixture.states.includes(name)) name = fixture.defaultState;
  activeState = name;
  app.querySelectorAll<HTMLElement>('[data-ovlira-state]').forEach((state) => { state.hidden = state.dataset.ovliraState !== name; });
  app.querySelectorAll<HTMLElement>('[data-ovlira-state-target]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.ovliraStateTarget === name)));
  const stage = app.querySelector<HTMLElement>('[data-testid="fixture-stage"]');
  if (stage) stage.dataset.state = name;
  if (updateUrl) syncUrl();
}

function syncUrl() {
  const params = new URLSearchParams({ recipe: activeRecipe, state: activeState, theme });
  if (fixtureOnly) params.set('mode', 'fixture');
  window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
}

function runSearch() {
  const query = readValue('[data-ovlira-search-input]').trim().toLowerCase();
  const status = readValue('[data-ovlira-search-status]');
  searchRows = defaultSearchRows.filter((row) => (!query || Object.values(row).some((value) => value?.toLowerCase().includes(query))) && (!status || status === 'all' || row.status?.toLowerCase() === status));
  hydrateTables();
  updateSearchCount();
  showState(searchRows.length ? 'results' : 'empty');
}

function updateSearchCount() {
  const count = app.querySelector<HTMLElement>('[data-ovlira-result-count]');
  if (count) count.textContent = `${searchRows.length} match${searchRows.length === 1 ? '' : 'es'}`;
}

function saveCrud() {
  const name = readValue('[data-ovlira-create-input]').trim() || 'Untitled project';
  crudRows = [{ name, owner: 'You', updated: 'Just now' }, ...crudRows];
  const form = app.querySelector<HTMLElement>('[data-ovlira-create-form]');
  if (form) form.hidden = true;
  hydrateTables();
  showState('success');
}

function saveDetail() {
  const name = readValue('[data-ovlira-detail-input]').trim();
  if (name) detailName = name;
  const header = app.querySelector<HTMLElement & { title?: string }>('[data-detail-header]');
  if (header) header.title = detailName;
  const form = app.querySelector<HTMLElement>('[data-ovlira-edit-form]');
  if (form) form.hidden = true;
  showState('ready');
}

function readValue(selector: string): string {
  const host = app.querySelector<HTMLElement & { value?: string }>(selector);
  const native = host?.shadowRoot?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
  return native?.value ?? host?.value ?? '';
}

function focusNativeControl(container: Element) {
  const component = container.querySelector<HTMLElement>('ov-input, ov-select');
  window.requestAnimationFrame(() => component?.shadowRoot?.querySelector<HTMLElement>('input, select')?.focus());
}
