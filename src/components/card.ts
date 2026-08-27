import { LitElement, css, html } from 'lit';

/** An article-like surface with optional header and footer slots. */
export class OvCard extends LitElement {
  static properties = { padding: { type: String, reflect: true } };
  padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  static styles = css`
    :host { display: block; }
    article { background: var(--ov-color-surface, #fffdf6); border: 1px solid var(--ov-color-line, #d7d9cf); border-radius: var(--ov-radius-lg, 1rem); box-shadow: var(--ov-shadow-sm); color: var(--ov-color-ink, #1d211d); overflow: hidden; }
    .header, .body, .footer { padding: var(--ov-card-padding, 1.5rem); }
    .header { border-bottom: 1px solid var(--ov-color-line, #d7d9cf); }
    .footer { border-top: 1px solid var(--ov-color-line, #d7d9cf); }
    .none { --ov-card-padding: 0; }
    .sm { --ov-card-padding: 0.85rem; }
    .md { --ov-card-padding: 1.5rem; }
    .lg { --ov-card-padding: 2rem; }
  `;

  render() {
    return html`
      <article part="card" class=${this.padding}>
        <div class="header" part="header"><slot name="header"></slot></div>
        <div class="body" part="body"><slot></slot></div>
        <div class="footer" part="footer"><slot name="footer"></slot></div>
      </article>
    `;
  }
}

customElements.define('ov-card', OvCard);
declare global { interface HTMLElementTagNameMap { 'ov-card': OvCard; } }
