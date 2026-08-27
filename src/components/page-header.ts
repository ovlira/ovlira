import { LitElement, css, html } from 'lit';

/** A page title block with optional context and actions. */
export class OvPageHeader extends LitElement {
  static properties = { title: { type: String, reflect: true }, description: { type: String }, eyebrow: { type: String } };
  title = '';
  description = '';
  eyebrow = '';

  static styles = css`
    :host { display: block; }
    header { align-items: end; display: flex; gap: 2rem; justify-content: space-between; padding: 0 0 1.5rem; }
    .copy { min-width: 0; }
    .eyebrow { color: var(--ov-color-accent-strong, #7cad24); font: 700 var(--ov-text-xs, 0.72rem) / 1 var(--ov-font-mono, monospace); letter-spacing: 0.12em; margin-bottom: 0.65rem; text-transform: uppercase; }
    h1 { color: var(--ov-color-ink, #1d211d); font: 700 var(--ov-text-xl, 3.25rem) / var(--ov-line-tight, 1.15) var(--ov-font-sans, sans-serif); letter-spacing: -0.055em; margin: 0; }
    p { color: var(--ov-color-muted, #687066); font: 500 var(--ov-text-md, 1rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin: 0.85rem 0 0; max-width: 48rem; }
    .actions { align-items: center; display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: end; }
    @media (max-width: 40rem) { header { align-items: start; flex-direction: column; gap: 1.25rem; } .actions { justify-content: start; } }
  `;

  render() {
    return html`<header part="header">
      <div class="copy">
        <div class="eyebrow" part="eyebrow" ?hidden=${!this.eyebrow}>${this.eyebrow}</div>
        <h1 part="title">${this.title}</h1>
        <p part="description" ?hidden=${!this.description}>${this.description}</p>
      </div>
      <div class="actions" part="actions"><slot name="actions"></slot></div>
    </header>`;
  }
}

customElements.define('ov-page-header', OvPageHeader);
declare global { interface HTMLElementTagNameMap { 'ov-page-header': OvPageHeader; } }
