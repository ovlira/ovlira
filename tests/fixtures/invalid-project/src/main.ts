const app = document.querySelector('#app');
if (app) app.innerHTML = `
  <main>
    <h1>Broken example</h1>
    <h3>Skipped level</h3>
    <ov-ghost></ov-ghost>
    <ov-page-header></ov-page-header>
    <ov-input></ov-input>
    <section data-ovlira-region="actions">
      <ov-button variant="primary"><ov-button variant="primary">Nested</ov-button></ov-button>
      <ov-button variant="primary">Also primary</ov-button>
    </section>
    <div data-ovlira-state="loading">Loading…</div>
    <style>.bad { color: #ff00ff; }</style>
  </main>
`;
