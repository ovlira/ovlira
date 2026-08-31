import { LitElement, css, html } from 'lit';

/** A page title block with optional context and actions. */
export class OvPageHeader extends LitElement {
  static properties = { title: { type: String, reflect: true }, description: { type: String }, eyebrow: { type: String } };
  title = '';
  description = '';
  eyebrow = '';

  static styles = css`
    :host { display: block; }
    header { align-items: flex-start; display: flex; gap: 1.5rem; justify-content: space-between; padding-block-end: 2rem; }
    .copy { min-width: 0; }
    .eyebrow { color: var(--ov-faint, #767676); font: 600 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-sans, sans-serif); letter-spacing: 0.08em; margin-block-end: 0.5rem; text-transform: uppercase; }
    h1 { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 600 var(--ov-text-xl, 1.3rem) / var(--ov-line-tight, 1.2) var(--ov-font-sans, sans-serif); letter-spacing: -0.025em; margin: 0; text-wrap: balance; }
    p { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-md, 0.875rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin: 0.55rem 0 0; max-width: 38rem; text-wrap: pretty; }
    .actions { align-items: center; display: flex; flex: 0 0 auto; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; }
    @media (max-width: 40rem) { header { flex-direction: column; gap: 1rem; } .actions { justify-content: flex-start; } }
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
