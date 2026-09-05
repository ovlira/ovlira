import { LitElement, css, html, nothing } from 'lit';

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
    .field { display: grid; gap: 0.35rem; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    input {
      background: transparent;
      border: 0;
      border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10)));
      border-radius: 0;
      color: var(--ov-text, var(--ov-color-ink, #171717));
      font: 400 var(--ov-text-md, 0.875rem) / 1.3 var(--ov-font-sans, sans-serif);
      min-height: var(--ov-touch-target, 2.75rem);
      padding: 0.62rem 0;
      transition: border-color var(--ov-motion-fast, 120ms) ease, box-shadow var(--ov-motion-fast, 120ms) ease;
    }
    input::placeholder { color: var(--ov-faint, #767676); }
    input:focus-visible { border-block-end-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); box-shadow: inset 0 -1px 0 var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); outline: 2px solid transparent; }
    input[aria-invalid="true"] { border-block-end-color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    input:disabled { cursor: not-allowed; opacity: 0.56; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.inputId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.inputId}>${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''}</label>
        <input
          part="input"
          id=${this.inputId}
          name=${this.name || nothing}
          type=${this.type}
          .value=${this.value}
          placeholder=${this.placeholder || nothing}
          ?required=${this.required}
          ?disabled=${this.disabled}
          aria-invalid=${this.error ? 'true' : 'false'}
          aria-describedby=${this.error || this.helpText ? messageId : nothing}
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

customElements.define('ov-input', OvInput);

declare global {
  interface HTMLElementTagNameMap {
    'ov-input': OvInput;
  }
}
