import { LitElement, css, html, nothing } from 'lit';

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
    error: { type: String },
  };

  label = '';
  value = '';
  required = false;
  disabled = false;
  options: SelectOption[] = [];
  helpText = '';
  error = '';
  private readonly selectId = `ov-select-${++selectId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.35rem; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    label span { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    select { background-color: transparent; border: 0; border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 0; color: var(--ov-text, var(--ov-color-ink, #171717)); font: 400 var(--ov-text-md, 0.875rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-touch-target, 2.75rem); padding-block: 0.62rem; transition: border-color var(--ov-motion-fast, 120ms) ease, box-shadow var(--ov-motion-fast, 120ms) ease; }
    select:focus-visible { border-block-end-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); box-shadow: inset 0 -1px 0 var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); outline: 2px solid transparent; }
    select[aria-invalid="true"] { border-block-end-color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    select:disabled { cursor: not-allowed; opacity: 0.56; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.selectId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.selectId}>${this.label}${this.required ? html`<span aria-hidden="true">*</span>` : ''}</label>
        <select part="select" id=${this.selectId} .value=${this.value} ?required=${this.required} ?disabled=${this.disabled} aria-invalid=${this.error ? 'true' : 'false'} aria-describedby=${this.error || this.helpText ? messageId : nothing} @change=${this.handleChange}>
          ${!this.required ? html`<option value="">Choose an option</option>` : ''}
          ${this.options.map((option) => html`<option value=${option.value}>${option.label}</option>`)}
        </select>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}">${this.error || this.helpText}</div>` : ''}
      </div>
    `;
  }

  private handleChange(event: Event) {
    this.value = (event.target as HTMLSelectElement).value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

customElements.define('ov-select', OvSelect);

declare global {
  interface HTMLElementTagNameMap {
    'ov-select': OvSelect;
  }
}
