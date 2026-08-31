import { LitElement, css, html } from 'lit';

/** A compact status marker. */
export class OvBadge extends LitElement {
  static properties = { tone: { type: String, reflect: true } };
  tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' = 'neutral';

  static styles = css`
    :host { display: inline-block; }
    span { background: transparent; border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: inline-flex; font: 500 var(--ov-text-xs, 0.72rem) / 1.1 var(--ov-font-sans, sans-serif); padding: 0.28rem 0.45rem; }
    .accent { color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .success { border-color: currentColor; color: var(--ov-good, var(--ov-color-success, #15743a)); }
    .warning { border-color: currentColor; color: var(--ov-warn, var(--ov-color-warning, #805c00)); }
    .danger { border-color: currentColor; color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() { return html`<span part="badge" class=${this.tone}><slot></slot></span>`; }
}

customElements.define('ov-badge', OvBadge);
declare global { interface HTMLElementTagNameMap { 'ov-badge': OvBadge; } }
