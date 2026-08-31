import { LitElement, css, html, nothing } from 'lit';

let numberInputId = 0;

/** A labelled native number field with bounds, step, help, and error messaging. */
export class OvNumberInput extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
    min: { type: String, reflect: true },
    max: { type: String, reflect: true },
    step: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    helpText: { type: String, attribute: 'help-text' },
  };

  label = '';
  name = '';
  value = '';
  min = '';
  max = '';
  step = '';
  required = false;
  disabled = false;
  error = '';
  helpText = '';
  private readonly inputId = `ov-number-input-${++numberInputId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.35rem; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    input { background: transparent; border: 0; border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 0; box-sizing: border-box; color: var(--ov-text, var(--ov-color-ink, #171717)); font: 400 var(--ov-text-md, 0.875rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-touch-target, 2.75rem); padding: 0.62rem 0; transition: border-color var(--ov-motion-fast, 120ms) ease, box-shadow var(--ov-motion-fast, 120ms) ease; }
    input:focus-visible { border-block-end-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); box-shadow: inset 0 -1px 0 var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); outline: 2px solid transparent; }
    input[aria-invalid='true'] { border-block-end-color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    input:disabled { cursor: not-allowed; opacity: 0.56; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.inputId}-message`;
    return html`
      <div class="field" part="field">
        <label for=${this.inputId} part="label">${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing}</label>
        <input id=${this.inputId} name=${this.name || nothing} type="number" .value=${this.value} min=${this.min || nothing} max=${this.max || nothing} step=${this.step || nothing} ?required=${this.required} ?disabled=${this.disabled} aria-invalid=${this.error ? 'true' : 'false'} aria-describedby=${this.error || this.helpText ? messageId : nothing} part="input" @input=${this.handleInput} @change=${this.handleChange}>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : nothing}
      </div>
    `;
  }

  private updateValue(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    this.updateValue(event);
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  private handleChange = (event: Event) => {
    event.stopPropagation();
    this.updateValue(event);
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value } }));
  };
}

customElements.define('ov-number-input', OvNumberInput);

declare global {
  interface HTMLElementTagNameMap {
    'ov-number-input': OvNumberInput;
  }
}
