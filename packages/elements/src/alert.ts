import { LitElement, css, html } from 'lit';

/** An inline message with a live-region role. */
export class OvAlert extends LitElement {
  static properties = { tone: { type: String, reflect: true }, heading: { type: String } };
  tone: 'info' | 'success' | 'warning' | 'danger' = 'info';
  heading = '';

  static styles = css`
    :host { display: block; }
    section { --alert-tone: var(--ov-info, var(--ov-color-info, #5f5f5f)); align-items: flex-start; background: transparent; border-inline-start: 2px solid var(--alert-tone); color: var(--ov-text, var(--ov-color-ink, #171717)); display: flex; gap: 0.65rem; padding: 0.2rem 0 0.2rem 0.75rem; }
    section.success { --alert-tone: var(--ov-good, var(--ov-color-success, #15743a)); }
    section.warning { --alert-tone: var(--ov-warn, var(--ov-color-warning, #805c00)); }
    section.danger { --alert-tone: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    .mark { background: var(--alert-tone); border-radius: 50%; flex: 0 0 auto; height: 0.4rem; margin-top: 0.42rem; width: 0.4rem; }
    .copy { display: grid; gap: 0.2rem; font: 400 var(--ov-text-sm, 0.82rem) / 1.48 var(--ov-font-sans, sans-serif); }
    strong { color: var(--alert-tone); font: 600 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
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
