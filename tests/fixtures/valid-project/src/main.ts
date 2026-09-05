import '@ovlira/elements/page-header.js';
import '@ovlira/elements/input.js';
import '@ovlira/elements/button.js';

const app = document.querySelector('#app');
if (app) app.innerHTML = `
  <main>
    <h1 class="sr-only">Settings</h1>
    <ov-page-header title="Settings"></ov-page-header>
    <div data-ovlira-state="loading" hidden>Loading…</div>
    <div data-ovlira-state="error" hidden>Error.</div>
    <div data-ovlira-state="success" hidden>Saved.</div>
    <section data-ovlira-region="profile">
      <h2>Profile</h2>
      <ov-input label="Name"></ov-input>
      <ov-button variant="primary">Save</ov-button>
    </section>
  </main>
`;
