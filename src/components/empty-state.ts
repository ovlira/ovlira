import { LitElement, css, html } from 'lit';

/** A calm, actionable explanation for a collection with no items. */
export class OvEmptyState extends LitElement {
  static properties = { title: { type: String, reflect: true }, description: { type: String } };
  title = '';
  description = '';

  static styles = css`
    :host { display: block; }
    section { align-items: center; background: var(--ov-color-surface, #fffdf6); border: 1px dashed var(--ov-color-line, #d7d9cf); border-radius: var(--ov-radius-lg, 1rem); display: flex; flex-direction: column; min-height: 14rem; justify-content: center; padding: 2rem; text-align: center; }
    .glyph { align-items: center; background: var(--ov-color-accent, #c7f36b); border-radius: var(--ov-radius-md, 0.65rem); display: flex; font: 800 1.2rem / 1 var(--ov-font-mono, monospace); height: 2.6rem; justify-content: center; margin-bottom: 1rem; transform: rotate(-4deg); width: 2.6rem; }
    h2 { color: var(--ov-color-ink, #1d211d); font: 700 var(--ov-text-lg, 1.25rem) / 1.2 var(--ov-font-sans, sans-serif); margin: 0; }
    p { color: var(--ov-color-muted, #687066); font: 500 var(--ov-text-sm, 0.84rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin: 0.55rem 0 1.2rem; max-width: 30rem; }
  `;

  render() {
    return html`<section part="state" aria-labelledby="title"><div class="glyph" aria-hidden="true">∅</div><h2 id="title" part="title">${this.title}</h2><p part="description" ?hidden=${!this.description}>${this.description}</p><div part="action"><slot name="action"></slot></div></section>`;
  }
}

customElements.define('ov-empty-state', OvEmptyState);
declare global { interface HTMLElementTagNameMap { 'ov-empty-state': OvEmptyState; } }
