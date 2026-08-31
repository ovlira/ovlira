import { LitElement, css, html, nothing } from 'lit';

let checkboxId = 0;

/** A labelled native checkbox with help, error, and required states. */
export class OvCheckbox extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    checked: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    helpText: { type: String, attribute: 'help-text' },
  };

  label = '';
  name = '';
  value = 'on';
  checked = false;
  required = false;
  disabled = false;
  error = '';
  helpText = '';
  private readonly checkboxId = `ov-checkbox-${++checkboxId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.35rem; }
    label { align-items: center; color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; display: grid; font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); gap: 0.65rem; grid-template-columns: auto minmax(0, 1fr); min-height: var(--ov-touch-target, 2.75rem); }
    label:has(input:disabled) { cursor: not-allowed; opacity: 0.56; }
    input { accent-color: var(--ov-text, var(--ov-color-ink, #171717)); block-size: 1.1rem; inline-size: 1.1rem; margin: 0; }
    input:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); margin-inline-start: 1.75rem; }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.checkboxId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.checkboxId}>
          <input
            part="checkbox"
            id=${this.checkboxId}
            type="checkbox"
            name=${this.name || nothing}
            value=${this.value}
            .checked=${this.checked}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-invalid=${this.error ? 'true' : 'false'}
            aria-describedby=${this.error || this.helpText ? messageId : nothing}
            @change=${this.handleChange}
          />
          <span>${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''}</span>
        </label>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : ''}
      </div>
    `;
  }

  private handleChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

customElements.define('ov-checkbox', OvCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'ov-checkbox': OvCheckbox;
  }
}
