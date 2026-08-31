import { LitElement, css, html, nothing } from 'lit';

let sliderId = 0;

/** A labelled native range control for bounded numeric values. */
export class OvSlider extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: Number, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    step: { type: Number, reflect: true },
    showValue: { type: Boolean, attribute: 'show-value', reflect: true },
    disabled: { type: Boolean, reflect: true },
    helpText: { type: String, attribute: 'help-text' },
    error: { type: String },
  };

  label = '';
  name = '';
  value = 50;
  min = 0;
  max = 100;
  step = 1;
  showValue = true;
  disabled = false;
  helpText = '';
  error = '';
  private readonly inputId = `ov-slider-${++sliderId}`;

  static styles = css`
    :host { display: block; }
    .field { display: grid; gap: var(--ov-space-2, 0.5rem); }
    .label-row { align-items: baseline; display: flex; gap: var(--ov-space-3, 0.75rem); justify-content: space-between; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    output { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 500 var(--ov-text-xs, 0.72rem) / 1.3 var(--ov-font-mono, monospace); }
    input { accent-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); inline-size: 100%; margin: 0; min-block-size: var(--ov-touch-target, 2.75rem); }
    input:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 3px; }
    input:disabled { cursor: not-allowed; opacity: 0.56; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  render() {
    const messageId = `${this.inputId}-message`;
    return html`
      <div class="field" part="field">
        <div class="label-row">
          <label for=${this.inputId} part="label">${this.label}</label>
          ${this.showValue ? html`<output for=${this.inputId} part="value">${this.value}</output>` : nothing}
        </div>
        <input id=${this.inputId} name=${this.name || nothing} type="range" min=${this.min} max=${this.max} step=${this.step} .value=${String(this.value)} ?disabled=${this.disabled} aria-invalid=${this.error ? 'true' : 'false'} aria-describedby=${this.error || this.helpText ? messageId : nothing} part="slider" @input=${this.handleInput} @change=${this.handleChange}>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : nothing}
      </div>
    `;
  }

  private updateValue(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.valueAsNumber;
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

customElements.define('ov-slider', OvSlider);

declare global {
  interface HTMLElementTagNameMap {
    'ov-slider': OvSlider;
  }
}
