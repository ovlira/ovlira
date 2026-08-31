import { LitElement, css, html, nothing } from 'lit';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxChangeDetail {
  value: string;
  label: string;
}

let comboboxId = 0;

/** A labelled, searchable listbox for longer sets of known options. */
export class OvCombobox extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
    placeholder: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    options: { type: Array },
    helpText: { type: String, attribute: 'help-text' },
    error: { type: String },
    open: { type: Boolean, reflect: true },
  };

  label = '';
  name = '';
  value = '';
  placeholder = '';
  required = false;
  disabled = false;
  options: ComboboxOption[] = [];
  helpText = '';
  error = '';
  open = false;
  private readonly instanceId = `ov-combobox-${++comboboxId}`;
  private query = '';
  private activeIndex = -1;
  private userInput = false;

  static styles = css`
    *, *::before, *::after { box-sizing: border-box; }
    :host { display: block; position: relative; }
    .field { display: grid; gap: 0.35rem; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    label span { color: var(--ov-bad, var(--ov-color-danger, #b42318)); margin-inline-start: 0.2rem; }
    .control { position: relative; }
    input { appearance: none; background: transparent; border: 0; border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 0; color: var(--ov-text, var(--ov-color-ink, #171717)); font: 400 var(--ov-text-md, 0.875rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-control-height, 2.5rem); padding: 0.5rem 0; transition: border-color var(--ov-motion-fast, 120ms) ease, box-shadow var(--ov-motion-fast, 120ms) ease; width: 100%; }
    input::placeholder { color: var(--ov-faint, #767676); }
    input:focus-visible { border-block-end-color: var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); box-shadow: inset 0 -1px 0 var(--ov-field-accent, var(--ov-focus, var(--ov-color-accent-strong, #525252))); outline: 2px solid transparent; }
    input[aria-invalid='true'] { border-block-end-color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    input:disabled { cursor: not-allowed; opacity: 0.56; }
    .listbox { background: var(--ov-surface-raised, var(--ov-color-surface-raised, #fff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-lg, 8px); box-shadow: var(--ov-shadow-md, 0 10px 30px rgb(0 0 0 / 0.12)); inset-block-start: calc(100% + 0.35rem); inset-inline: 0; max-block-size: 15rem; overflow-y: auto; padding: 0.3rem; position: absolute; z-index: 10; }
    .listbox[hidden] { display: none; }
    .option { align-items: center; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; display: flex; font: 400 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); min-height: var(--ov-control-height, 2.5rem); padding: 0.45rem 0.65rem; }
    .option.active, .option:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); }
    .option[aria-disabled='true'] { cursor: not-allowed; opacity: 0.5; }
    .no-results { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: default; }
    .message { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    .message.error { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
  `;

  protected firstUpdated() {
    this.syncQueryFromValue();
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value')) {
      if (this.userInput) this.userInput = false;
      else this.syncQueryFromValue();
    }
    if (changed.has('options') && !this.userInput) this.syncQueryFromValue();
    if (changed.has('open')) {
      if (this.open) {
        document.addEventListener('pointerdown', this.handleDocumentPointerDown);
        this.activeIndex = -1;
      } else {
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
        this.activeIndex = -1;
      }
    }
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    super.disconnectedCallback();
  }

  render() {
    const messageId = `${this.instanceId}-message`;
    const listId = `${this.instanceId}-list`;
    const filtered = this.filteredOptions;
    return html`
      <div class="field" part="field">
        <label part="label" for=${this.instanceId}>${this.label}${this.required ? html`<span aria-hidden="true">*</span>` : ''}</label>
        <div class="control">
          <input
            part="input"
            id=${this.instanceId}
            name=${this.name || nothing}
            type="text"
            role="combobox"
            autocomplete="off"
            .value=${this.query}
            placeholder=${this.placeholder || nothing}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-autocomplete="list"
            aria-controls=${listId}
            aria-expanded=${String(this.open)}
            aria-activedescendant=${this.activeOptionId(filtered) ?? nothing}
            aria-invalid=${this.error ? 'true' : 'false'}
            aria-describedby=${this.error || this.helpText ? messageId : nothing}
            @focus=${this.handleFocus}
            @click=${this.handleFocus}
            @input=${this.handleInput}
            @keydown=${this.handleKeydown}
          />
          <div id=${listId} class="listbox" role="listbox" part="listbox" ?hidden=${!this.open}>
            ${filtered.length ? filtered.map((option, index) => html`
              <div
                id=${`${this.instanceId}-option-${index}`}
                class="option ${index === this.activeIndex ? 'active' : ''}"
                role="option"
                part="option"
                aria-selected=${option.value === this.value ? 'true' : 'false'}
                aria-disabled=${option.disabled ? 'true' : 'false'}
                @pointerdown=${(event: PointerEvent) => this.handleOptionPointerDown(event, index)}
                @mouseenter=${() => this.setActiveIndex(index)}
              >${option.label}</div>
            `) : html`<div class="option no-results" role="option" aria-disabled="true">No matches</div>`}
          </div>
        </div>
        ${this.error || this.helpText ? html`<div id=${messageId} class="message ${this.error ? 'error' : ''}" part="message">${this.error || this.helpText}</div>` : ''}
      </div>
    `;
  }

  private get selectedLabel() {
    return this.options.find((option) => option.value === this.value)?.label ?? '';
  }

  private get filteredOptions() {
    const selectedLabel = this.selectedLabel;
    const filter = this.open && !this.userInput && selectedLabel === this.query ? '' : this.query.trim().toLowerCase();
    if (!filter) return this.options;
    return this.options.filter((option) => option.label.toLowerCase().includes(filter) || option.value.toLowerCase().includes(filter));
  }

  private syncQueryFromValue() {
    this.query = this.selectedLabel || this.value;
  }

  private activeOptionId(filtered: ComboboxOption[]) {
    if (this.activeIndex < 0 || !filtered[this.activeIndex]) return undefined;
    return `${this.instanceId}-option-${this.activeIndex}`;
  }

  private firstEnabledIndex() {
    return this.filteredOptions.findIndex((option) => !option.disabled);
  }

  private lastEnabledIndex() {
    const filtered = this.filteredOptions;
    for (let index = filtered.length - 1; index >= 0; index -= 1) if (!filtered[index]?.disabled) return index;
    return -1;
  }

  private handleFocus = () => {
    if (this.disabled) return;
    this.userInput = false;
    this.open = true;
    this.activeIndex = -1;
    this.requestUpdate();
  };

  private handleInput = (event: Event) => {
    this.query = (event.target as HTMLInputElement).value;
    this.userInput = true;
    this.open = true;
    this.activeIndex = -1;
    if (this.value) this.value = '';
    this.requestUpdate();
    this.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: null, inputType: 'insertText' }));
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) this.open = true;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = this.moveActive(direction as 1 | -1);
      this.activeIndex = next;
      this.requestUpdate();
      return;
    }
    if (event.key === 'Enter' && this.open) {
      event.preventDefault();
      if (this.activeIndex >= 0) this.selectOption(this.activeIndex);
      return;
    }
    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      event.stopPropagation();
      this.closeList(true);
      return;
    }
    if (event.key === 'Tab') this.closeList(true);
  };

  private moveActive(direction: 1 | -1) {
    const filtered = this.filteredOptions;
    const enabled = filtered.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
    if (!enabled.length) return -1;
    const currentPosition = enabled.indexOf(this.activeIndex);
    const nextPosition = currentPosition < 0 ? (direction === 1 ? 0 : enabled.length - 1) : (currentPosition + direction + enabled.length) % enabled.length;
    return enabled[nextPosition] ?? enabled[0] ?? -1;
  }

  private setActiveIndex(index: number) {
    if (!this.filteredOptions[index]?.disabled) {
      this.activeIndex = index;
      this.requestUpdate();
    }
  }

  private handleOptionPointerDown(event: PointerEvent, index: number) {
    event.preventDefault();
    this.selectOption(index);
  }

  private selectOption(index: number) {
    const option = this.filteredOptions[index];
    if (!option || option.disabled) return;
    this.value = option.value;
    this.query = option.label;
    this.userInput = false;
    this.dispatchEvent(new CustomEvent<ComboboxChangeDetail>('change', { detail: { value: option.value, label: option.label }, bubbles: true, composed: true }));
    this.closeList(false);
  }

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (!event.composedPath().includes(this)) this.closeList(true);
  };

  private closeList(restoreQuery: boolean) {
    if (!this.open) return;
    this.open = false;
    if (restoreQuery) this.syncQueryFromValue();
  }
}

customElements.define('ov-combobox', OvCombobox);

declare global {
  interface HTMLElementTagNameMap {
    'ov-combobox': OvCombobox;
  }
}
