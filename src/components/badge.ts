import { LitElement, css, html } from 'lit';

/** A compact status marker. */
export class OvBadge extends LitElement {
  static properties = { tone: { type: String, reflect: true } };
  tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' = 'neutral';

  static styles = css`
    :host { display: inline-block; }
    span { background: var(--ov-color-canvas, #f4f1e8); border: 1px solid var(--ov-color-line, #d7d9cf); border-radius: var(--ov-radius-pill, 999px); color: var(--ov-color-ink, #1d211d); display: inline-flex; font: 650 var(--ov-text-xs, 0.72rem) / 1 var(--ov-font-mono, monospace); letter-spacing: 0.02em; padding: 0.42rem 0.62rem; }
    .accent { background: var(--ov-color-accent, #c7f36b); border-color: transparent; }
    .success { background: var(--ov-color-success, #bce8bb); border-color: transparent; }
    .warning { background: var(--ov-color-warning, #f5d58c); border-color: transparent; }
    .danger { background: var(--ov-color-danger, #f3b0a8); border-color: transparent; }
  `;

  render() { return html`<span part="badge" class=${this.tone}><slot></slot></span>`; }
}

customElements.define('ov-badge', OvBadge);
declare global { interface HTMLElementTagNameMap { 'ov-badge': OvBadge; } }
