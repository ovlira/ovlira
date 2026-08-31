import { LitElement, css, html, nothing } from 'lit';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let radioGroupId = 0;

/** A labelled native radio group for choosing one option from a short list. */
export class OvRadioGroup extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    options: { type: Array },
    helpText: { type: String, attribute: 'help-text' },
    error: { type: String },
  };

  label = '';
  name = '';
  value = '';
  required = false;
  disabled = false;
  options: RadioOption[] = [];
  helpText = '';
  error = '';
  private readonly groupId = `ov-radio-group-${++radioGroupId}`;

  static styles = css`
    :host { display: block; }
    fieldset { border: 0; display: grid; gap: 0.35rem; margin: 0; min-inline-size: 0; padding: 0; }
    legend { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); padding: 0; }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    .options { display: grid; gap: 0.25rem; margin-block-start: 0.2rem; }
    .option { align-items: center; color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; display: grid; font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); gap: 0.65rem; grid-template-columns: auto minmax(0, 1fr); min-height: var(--ov-touch-target, 2.75rem); }
    .option:has(input:disabled) { cursor: not-allowed; opacity: 0.56; }
    input { accent-color: var(--ov-text, var(--ov-color-ink, #171717)); block-size: 1.1rem; inline-size: 1.1rem; margin: 0; }
    input:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.groupId}-message`;
    const groupName = this.name || this.groupId;
    return html`
      <fieldset part="field" ?disabled=${this.disabled} aria-invalid=${this.error ? 'true' : 'false'} aria-describedby=${this.error || this.helpText ? messageId : nothing}>
        <legend part="label">${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''}</legend>
        <div class="options">
          ${this.options.map((option, index) => html`
            <label class="option" part="option" for=${`${this.groupId}-${index}`}>
              <input
                part="radio"
                id=${`${this.groupId}-${index}`}
                type="radio"
                name=${groupName}
                value=${option.value}
                .checked=${option.value === this.value}
                ?required=${this.required}
                ?disabled=${this.disabled || Boolean(option.disabled)}
                @change=${this.handleChange}
              />
              <span>${option.label}</span>
            </label>
          `)}
        </div>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : ''}
      </fieldset>
    `;
  }

  private handleChange(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

customElements.define('ov-radio-group', OvRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    'ov-radio-group': OvRadioGroup;
  }
}
