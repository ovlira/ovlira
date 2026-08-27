import { LitElement, css, html } from 'lit';

let inputId = 0;

/** A labelled native input with help and error messaging. */
export class OvInput extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
    placeholder: { type: String, reflect: true },
    type: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    helpText: { type: String, attribute: 'help-text' },
  };

  label = '';
  name = '';
  value = '';
  placeholder = '';
  type = 'text';
  required = false;
  disabled = false;
  error = '';
  helpText = '';
  private readonly inputId = `ov-input-${++inputId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.45rem; }
    label { color: var(--ov-color-ink, #1d211d); font: 650 var(--ov-text-sm, 0.84rem) / 1.2 var(--ov-font-mono, monospace); }
    .required { color: var(--ov-color-accent-strong, #7cad24); margin-left: 0.2rem; }
    input {
      background: var(--ov-color-surface, #fffdf6);
      border: 1px solid var(--ov-color-line, #d7d9cf);
      border-radius: var(--ov-radius-sm, 0.35rem);
      color: var(--ov-color-ink, #1d211d);
      font: 500 var(--ov-text-md, 1rem) / 1.2 var(--ov-font-sans, sans-serif);
      min-height: 2.75rem;
      padding: 0.7rem 0.8rem;
      transition: border 140ms ease, box-shadow 140ms ease;
    }
    input::placeholder { color: var(--ov-color-muted, #687066); }
    input:focus { border-color: var(--ov-field-accent, var(--ov-color-accent-strong, #7cad24)); box-shadow: 0 0 0 3px rgb(199 243 107 / 0.35); outline: none; }
    input[aria-invalid="true"] { border-color: var(--ov-color-danger, #f3b0a8); }
    input:disabled { background: var(--ov-color-canvas, #f4f1e8); cursor: not-allowed; opacity: 0.65; }
    .message { color: var(--ov-color-muted, #687066); font: 500 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: #9d3328; }
  `;

  render() {
    const messageId = `${this.inputId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.inputId}>${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''}</label>
        <input
          part="input"
          id=${this.inputId}
          name=${this.name || nothingValue}
          type=${this.type}
          .value=${this.value}
          placeholder=${this.placeholder || nothingValue}
          ?required=${this.required}
          ?disabled=${this.disabled}
          aria-invalid=${this.error ? 'true' : 'false'}
          aria-describedby=${this.error || this.helpText ? messageId : nothingValue}
          @input=${this.handleInput}
        />
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : ''}
      </div>
    `;
  }

  private handleInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: null, inputType: 'insertText' }));
  }
}

const nothingValue = '';
customElements.define('ov-input', OvInput);

declare global {
  interface HTMLElementTagNameMap {
    'ov-input': OvInput;
  }
}
