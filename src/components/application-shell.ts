import { LitElement, css, html } from 'lit';

/** A responsive app frame with navigation and a main content region. */
export class OvApplicationShell extends LitElement {
  static properties = { navLabel: { type: String, attribute: 'nav-label', reflect: true } };
  navLabel = 'Primary navigation';

  static styles = css`
    :host { background: var(--ov-bg, var(--ov-color-canvas, #ffffff)); color: var(--ov-text, var(--ov-color-ink, #171717)); display: block; min-height: 100%; }
    .shell { display: grid; grid-template-columns: var(--ov-shell-rail, 14rem) minmax(0, 1fr); min-height: 100vh; }
    .rail { background: var(--ov-bg, var(--ov-color-canvas, #ffffff)); border-inline-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); display: flex; flex-direction: column; gap: 2rem; padding: 2.2rem 1.1rem 1.5rem; }
    .brand { padding-inline: 0.55rem; }
    nav { display: grid; gap: 0.15rem; }
    .nav-slot::slotted(*) { align-items: center; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: flex; font: 400 var(--ov-text-md, 0.875rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-control-height, 2.5rem); padding: 0.48rem 0.55rem; text-decoration: none; }
    .nav-slot::slotted([aria-current="page"]) { color: var(--ov-text, var(--ov-color-ink, #171717)); font-weight: 500; }
    .content { min-width: 0; }
    .header { border-bottom: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); min-height: 3.4rem; padding: 0.8rem clamp(1.4rem, 5vw, 4rem); }
    .header[hidden] { display: none; }
    main { box-sizing: border-box; margin: 0 auto; max-width: var(--ov-content-wide, 64rem); padding: clamp(2.2rem, 6vw, 5.5rem) clamp(1.4rem, 5vw, 4rem) 5rem; width: 100%; }
    @media (hover: hover) { .nav-slot::slotted(*:hover) { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); } }
    @media (max-width: 47.5rem) { .shell { grid-template-columns: 1fr; } .rail { border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-inline-end: 0; gap: 1rem; padding: 1rem 1.4rem; } .brand { padding-inline: 0; } nav { display: flex; gap: 0.4rem; overflow-x: auto; } .nav-slot::slotted(*) { flex: 0 0 auto; min-height: var(--ov-touch-target, 2.75rem); } .header { padding: 0.8rem 1.4rem; } main { padding: 1.5rem 1.4rem 4rem; } }
  `;

  render() {
    return html`<div class="shell" part="shell">
      <aside class="rail" part="rail"><div class="brand" part="brand"><slot name="brand"></slot></div><nav part="nav" aria-label=${this.navLabel}><slot class="nav-slot" name="nav"></slot></nav></aside>
      <div class="content" part="content"><header class="header" part="header"><slot name="header" @slotchange=${this.handleHeaderSlot}></slot></header><main part="main"><slot></slot></main></div>
    </div>`;
  }

  private handleHeaderSlot(event: Event) {
    const slot = event.target as HTMLSlotElement;
    if (slot.parentElement) slot.parentElement.hidden = slot.assignedElements().length === 0;
  }
}

customElements.define('ov-application-shell', OvApplicationShell);
declare global { interface HTMLElementTagNameMap { 'ov-application-shell': OvApplicationShell; } }
