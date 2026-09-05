import '@ovlira/elements/page-header.js';
import '@ovlira/elements/button.js';
import '@ovlira/elements/data-table.js';
import '@ovlira/elements/empty-state.js';
import '@ovlira/elements/alert.js';
import '@ovlira/elements/input.js';
import '@ovlira/elements/select.js';
import '@ovlira/elements/default-theme.css';
import './styles/ovlira-theme.css';
import './styles.css';

// One agent-authored rehearsal, not independent benchmark runs.
const domains = {
  customers: { title: 'Customers', singular: 'customer', owner: 'Owner', status: 'Lifecycle stage', initial: ['Acme studio', 'Maya', 'Active'] },
  equipment: { title: 'Equipment', singular: 'asset', owner: 'Location', status: 'Availability', initial: ['Field recorder', 'Studio', 'Available'] },
  editorial: { title: 'Articles', singular: 'article', owner: 'Editor', status: 'Publication status', initial: ['Field notes', 'Jon', 'Draft'] },
};
const params = new URLSearchParams(location.search);
const domain = domains[params.get('domain') as keyof typeof domains] ?? domains.customers;
document.documentElement.dataset.theme = params.get('theme') === 'dark' ? 'dark' : 'light';
type RecordData = { id: string; name: string; owner: string; status: string };
let rows: RecordData[] = params.get('empty') === '1' ? [] : [{ id: '1', name: domain.initial[0], owner: domain.initial[1], status: domain.initial[2] }];
let failOnce = params.get('fail') === '1';
let loading = true;
let error = false;
let created = false;
let sequence = 1;
const app = document.querySelector<HTMLDivElement>('#app')!;

function render() {
  const selected = rows.find(row => location.hash === `#record/${row.id}`);
  app.innerHTML = `<div class="starter"><main class="recipe-page">
    <ov-page-header eyebrow="Collection" title="${domain.title}" description="Manage records and their current status."></ov-page-header>
    <section data-ovlira-state="loading" ${loading ? '' : 'hidden'}><ov-alert heading="Loading records" role="status">Fetching the latest records.</ov-alert></section>
    <section data-ovlira-state="error" ${error ? '' : 'hidden'}><ov-alert tone="danger" heading="Could not load records">Your records have not changed.</ov-alert><ov-button variant="secondary" data-retry>Retry</ov-button></section>
    <section data-ovlira-state="success" ${created && !loading && !error && !selected ? '' : 'hidden'}><ov-alert tone="success" heading="Record created" role="status">The new record is ready to open.</ov-alert></section>
    <div ${loading || error ? 'hidden' : ''}>
      <section data-detail ${selected ? '' : 'hidden'}><a class="state-tab" href="#">Back to collection</a><dl class="detail-list"><div><dt>Name</dt><dd data-name></dd></div><div><dt>${domain.owner}</dt><dd data-owner></dd></div><div><dt>${domain.status}</dt><dd data-status></dd></div></dl></section>
      <div ${selected ? 'hidden' : ''}>
        <section data-ovlira-state="empty" ${rows.length ? 'hidden' : ''}><ov-empty-state title="No records yet" description="Create the first ${domain.singular} to begin."></ov-empty-state></section>
        <span data-create><ov-button variant="primary">Create ${domain.singular}</ov-button></span>
        <form class="inline-form" data-ovlira-create-form hidden novalidate>
          <div class="preview-stack"><ov-input label="Name" required data-field="name"></ov-input><ov-input label="${domain.owner}" required data-field="owner"></ov-input><ov-input label="${domain.status}" required data-field="status"></ov-input></div>
          <ov-button type="button" variant="primary" data-save>Add ${domain.singular}</ov-button>
        </form>
        <section data-ovlira-state="records" ${rows.length ? '' : 'hidden'}>
          <ov-data-table caption="${domain.title}"></ov-data-table>
          <div class="search-controls"><ov-select label="Open record"></ov-select><ov-button variant="secondary" data-open disabled>Open record</ov-button></div>
        </section>
      </div>
    </div>
  </main></div>`;
  if (selected) {
    app.querySelector('ov-page-header')!.title = selected.name;
    for (const field of ['name', 'owner', 'status'] as const) app.querySelector(`[data-${field}]`)!.textContent = selected[field];
  }
  const table = app.querySelector('ov-data-table')!;
  table.columns = [{ key: 'name', label: 'Name' }, { key: 'owner', label: domain.owner }, { key: 'status', label: domain.status }];
  table.rows = rows;
  const picker = app.querySelector('ov-select')!;
  picker.options = rows.map(row => ({ value: row.id, label: row.name }));
  picker.value = '';
  picker.addEventListener('change', () => { app.querySelector<import('@ovlira/elements/button.js').OvButton>('[data-open]')!.disabled = !picker.value; });
  app.querySelector('[data-open]')!.addEventListener('click', () => { if (picker.value) location.hash = `record/${picker.value}`; });
  app.querySelector('[data-retry]')!.addEventListener('click', () => void load());
  const form = app.querySelector<HTMLFormElement>('form')!;
  const create = app.querySelector<HTMLElement>('[data-create]')!;
  create.addEventListener('click', async () => {
    form.hidden = false;
    create.hidden = true;
    const first = form.querySelector('ov-input')!;
    await first.updateComplete;
    first.shadowRoot?.querySelector('input')?.focus();
  });
  const save = () => {
    const values = { name: '', owner: '', status: '' };
    let invalid: HTMLInputElement | undefined;
    for (const key of Object.keys(values) as (keyof typeof values)[]) {
      const field = form.querySelector<import('@ovlira/elements/input.js').OvInput>(`[data-field="${key}"]`)!;
      values[key] = field.value.trim();
      field.error = values[key] ? '' : `Enter ${key === 'name' ? 'a name' : key === 'owner' ? domain.owner.toLowerCase() : domain.status.toLowerCase()}.`;
      if (field.error && !invalid) invalid = field.shadowRoot?.querySelector('input') ?? undefined;
    }
    if (invalid) { invalid.focus(); return; }
    rows = [{ id: String(++sequence), ...values }, ...rows];
    created = true;
    render();
    void app.querySelector('ov-select')!.updateComplete.then(() => app.querySelector('ov-select')?.shadowRoot?.querySelector('select')?.focus());
  };
  form.addEventListener('submit', event => { event.preventDefault(); save(); });
  form.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); save(); } });
  app.querySelector('[data-save]')!.addEventListener('click', save);
}
async function load() {
  loading = true;
  error = false;
  render();
  await new Promise(resolve => setTimeout(resolve, 180));
  loading = false;
  error = failOnce;
  failOnce = false;
  render();
}
window.addEventListener('hashchange', render);
void load();
