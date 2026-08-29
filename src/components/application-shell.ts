import { LitElement, css, html } from 'lit';

/** A responsive app frame with navigation and a main content region. */
export class OvApplicationShell extends LitElement {
  static properties = { navLabel: { type: String, attribute: 'nav-label', reflect: true } };
  navLabel = 'Primary navigation';

  static styles = css`
    :host { background: var(--ov-color-canvas, #f4f1e8); color: var(--ov-color-ink, #1d211d); display: block; min-height: 100%; }
    .shell { display: grid; grid-template-columns: var(--ov-shell-rail, 15rem) minmax(0, 1fr); min-height: 100vh; }
    .rail { background: var(--ov-color-ink, #1d211d); color: var(--ov-color-surface, #fffdf6); display: flex; flex-direction: column; gap: 2.5rem; padding: 1.4rem; }
    .brand { border-bottom: 1px solid rgb(255 253 246 / 0.18); padding-bottom: 1.4rem; }
    nav { display: grid; gap: 0.35rem; }
    .nav-slot::slotted(*) { color: rgb(255 253 246 / 0.7); font: 650 var(--ov-text-sm, 0.84rem) / 1.2 var(--ov-font-mono, monospace); padding: 0.7rem 0.8rem; text-decoration: none; }
    .nav-slot::slotted(*:hover), .nav-slot::slotted([aria-current="page"]) { background: var(--ov-color-accent, #c7f36b); color: var(--ov-color-ink, #1d211d); }
    .content { min-width: 0; }
    .header { border-bottom: 1px solid var(--ov-color-line, #d7d9cf); min-height: 3.8rem; padding: 1rem 2.5rem; }
    main { margin: 0 auto; max-width: 78rem; padding: 3rem 2.5rem 5rem; }
    @media (max-width: 56rem) { .shell { grid-template-columns: 1fr; } .rail { gap: 1rem; padding: 1rem; } nav { display: flex; overflow-x: auto; } .header { padding: 0.8rem 1.25rem; } main { padding: 2rem 1.25rem 4rem; } }
  `;

  render() {
    return html`<div class="shell" part="shell">
      <aside class="rail" part="rail"><div class="brand" part="brand"><slot name="brand"></slot></div><nav part="nav" aria-label=${this.navLabel}><slot class="nav-slot" name="nav"></slot></nav></aside>
      <div class="content" part="content"><header class="header" part="header"><slot name="header"></slot></header><main part="main"><slot></slot></main></div>
    </div>`;
  }
}

customElements.define('ov-application-shell', OvApplicationShell);
declare global { interface HTMLElementTagNameMap { 'ov-application-shell': OvApplicationShell; } }
