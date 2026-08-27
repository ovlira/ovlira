import { LitElement, css, html } from 'lit';

export interface SelectOption {
  value: string;
  label: string;
}

let selectId = 0;

/** A labelled native select for a short list of options. */
export class OvSelect extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    value: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    options: { type: Array },
    helpText: { type: String, attribute: 'help-text' },
  };

  label = '';
  value = '';
  required = false;
  disabled = false;
  options: SelectOption[] = [];
  helpText = '';
  private readonly selectId = `ov-select-${++selectId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.45rem; }
    label { color: var(--ov-color-ink, #1d211d); font: 650 var(--ov-text-sm, 0.84rem) / 1.2 var(--ov-font-mono, monospace); }
    select { appearance: none; background: var(--ov-color-surface, #fffdf6); border: 1px solid var(--ov-color-line, #d7d9cf); border-radius: var(--ov-radius-sm, 0.35rem); color: var(--ov-color-ink, #1d211d); font: 500 var(--ov-text-md, 1rem) / 1.2 var(--ov-font-sans, sans-serif); min-height: 2.75rem; padding: 0.7rem 2.5rem 0.7rem 0.8rem; }
    select:focus { border-color: var(--ov-field-accent, var(--ov-color-accent-strong, #7cad24)); box-shadow: 0 0 0 3px rgb(199 243 107 / 0.35); outline: none; }
    select:disabled { background: var(--ov-color-canvas, #f4f1e8); cursor: not-allowed; opacity: 0.65; }
    .message { color: var(--ov-color-muted, #687066); font: 500 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
  `;

  render() {
    const messageId = `${this.selectId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.selectId}>${this.label}${this.required ? html`<span aria-hidden="true">*</span>` : ''}</label>
        <select part="select" id=${this.selectId} .value=${this.value} ?required=${this.required} ?disabled=${this.disabled} aria-describedby=${this.helpText ? messageId : nothingValue} @change=${this.handleChange}>
          ${!this.required ? html`<option value="">Choose an option</option>` : ''}
          ${this.options.map((option) => html`<option value=${option.value}>${option.label}</option>`)}
        </select>
        ${this.helpText ? html`<div id=${messageId} class="message">${this.helpText}</div>` : ''}
      </div>
    `;
  }

  private handleChange(event: Event) {
    this.value = (event.target as HTMLSelectElement).value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

const nothingValue = '';
customElements.define('ov-select', OvSelect);

declare global {
  interface HTMLElementTagNameMap {
    'ov-select': OvSelect;
  }
}
