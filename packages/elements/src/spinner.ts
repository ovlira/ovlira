import { LitElement, css, html } from 'lit';

/** A small inline loading indicator with an accessible status label. */
export class OvSpinner extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    size: { type: String, reflect: true },
  };

  label = 'Loading';
  size: 'sm' | 'md' = 'sm';

  static styles = css`
    :host { display: inline-block; }
    .status { align-items: center; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: inline-flex; font: 400 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); gap: 0.5rem; }
    .indicator { animation: ov-spinner-rotate 700ms linear infinite; border: 2px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-block-start-color: var(--ov-text, var(--ov-color-ink, #171717)); border-radius: 50%; block-size: 0.8rem; display: inline-block; flex: 0 0 auto; inline-size: 0.8rem; }
    :host([size='md']) .indicator { block-size: 1rem; inline-size: 1rem; }
    @keyframes ov-spinner-rotate { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .indicator { animation: none; } }
  `;

  render() {
    return html`<span class="status" role="status" aria-live="polite" part="status"><span class="indicator" aria-hidden="true" part="indicator"></span><span part="label">${this.label}</span></span>`;
  }
}

customElements.define('ov-spinner', OvSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'ov-spinner': OvSpinner;
  }
}
