import { LitElement, css, html } from 'lit';

/** A calm, actionable explanation for a collection with no items. */
export class OvEmptyState extends LitElement {
  static properties = { title: { type: String, reflect: true }, description: { type: String } };
  title = '';
  description = '';

  static styles = css`
    :host { display: block; }
    section { align-items: flex-start; display: flex; flex-direction: column; justify-content: center; min-height: 10rem; padding-block: 1.5rem; text-align: start; }
    h2 { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 600 var(--ov-text-lg, 1rem) / 1.3 var(--ov-font-sans, sans-serif); margin: 0; }
    p { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-sm, 0.82rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin: 0.4rem 0 1rem; max-width: 34rem; }
  `;

  render() {
    return html`<section part="state" aria-labelledby="title"><h2 id="title" part="title">${this.title}</h2><p part="description" ?hidden=${!this.description}>${this.description}</p><div part="action"><slot name="action"></slot></div></section>`;
  }
}

customElements.define('ov-empty-state', OvEmptyState);
declare global { interface HTMLElementTagNameMap { 'ov-empty-state': OvEmptyState; } }
