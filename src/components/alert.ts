import { LitElement, css, html } from 'lit';

/** An inline message with a live-region role. */
export class OvAlert extends LitElement {
  static properties = { tone: { type: String, reflect: true }, heading: { type: String } };
  tone: 'info' | 'success' | 'warning' | 'danger' = 'info';
  heading = '';

  static styles = css`
    :host { display: block; }
    section { align-items: flex-start; background: var(--ov-color-info, #b8d9ef); border: 1px solid rgb(29 33 29 / 0.12); border-radius: var(--ov-radius-md, 0.65rem); color: var(--ov-color-ink, #1d211d); display: flex; gap: 0.8rem; padding: 0.9rem 1rem; }
    section.success { background: var(--ov-color-success, #bce8bb); }
    section.warning { background: var(--ov-color-warning, #f5d58c); }
    section.danger { background: var(--ov-color-danger, #f3b0a8); }
    .mark { background: currentColor; border-radius: 50%; flex: 0 0 auto; height: 0.45rem; margin-top: 0.4rem; width: 0.45rem; }
    .copy { display: grid; gap: 0.25rem; font: 500 var(--ov-text-sm, 0.84rem) / 1.45 var(--ov-font-sans, sans-serif); }
    strong { font: 700 var(--ov-text-sm, 0.84rem) / 1.2 var(--ov-font-mono, monospace); }
  `;

  render() {
    return html`<section part="alert" class=${this.tone} role=${this.tone === 'danger' ? 'alert' : 'status'}>
      <span class="mark" aria-hidden="true"></span>
      <div class="copy"><strong ?hidden=${!this.heading} part="heading">${this.heading}</strong><div part="message"><slot></slot></div></div>
    </section>`;
  }
}

customElements.define('ov-alert', OvAlert);
declare global { interface HTMLElementTagNameMap { 'ov-alert': OvAlert; } }
