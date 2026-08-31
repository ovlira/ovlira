import { LitElement, css, html, nothing } from 'lit';

let toggleId = 0;

/** A compact native switch for an immediate boolean setting. */
export class OvToggle extends LitElement {
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
  private readonly toggleId = `ov-toggle-${++toggleId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: 0.35rem; }
    label { align-items: center; color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; display: grid; font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); gap: 0.75rem; grid-template-columns: minmax(0, 1fr) auto; min-height: var(--ov-touch-target, 2.75rem); }
    label:has(input:disabled) { cursor: not-allowed; opacity: 0.56; }
    input {
      appearance: none;
      background-color: var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10)));
      border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10)));
      border-radius: 999px;
      block-size: 1.25rem;
      inline-size: 2.25rem;
      margin: 0;
      position: relative;
      transition: background-color var(--ov-motion-fast, 150ms) ease, border-color var(--ov-motion-fast, 150ms) ease;
    }
    input::after { background: var(--ov-bg, var(--ov-color-canvas, #fff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 50%; block-size: 0.9rem; content: ''; inset-block-start: 0.1rem; inset-inline-start: 0.1rem; position: absolute; transition: transform var(--ov-motion-fast, 150ms) ease; }
    input:checked { background-color: var(--ov-good, var(--ov-color-success, #15743a)); border-color: var(--ov-good, var(--ov-color-success, #15743a)); }
    input:checked::after { transform: translateX(1rem); }
    input:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    input[aria-invalid="true"] { border-color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    .required { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.toggleId}-message`;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.toggleId}>
          <span>${this.label}${this.required ? html`<span class="required" aria-hidden="true">*</span>` : ''}</span>
          <input
            part="toggle"
            id=${this.toggleId}
            type="checkbox"
            role="switch"
            name=${this.name || nothing}
            value=${this.value}
            .checked=${this.checked}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-checked=${String(this.checked)}
            aria-invalid=${this.error ? 'true' : 'false'}
            aria-describedby=${this.error || this.helpText ? messageId : nothing}
            @change=${this.handleChange}
          />
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

customElements.define('ov-toggle', OvToggle);

declare global {
  interface HTMLElementTagNameMap {
    'ov-toggle': OvToggle;
  }
}
