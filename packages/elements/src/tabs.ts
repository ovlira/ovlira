import { LitElement, css, html, nothing } from 'lit';

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsChangeDetail {
  value: string;
  label: string;
}

let tabsId = 0;

/** A controlled tablist with keyboard navigation and named panel slots. */
export class OvTabs extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    value: { type: String, reflect: true },
    orientation: { type: String, reflect: true },
    items: { type: Array },
  };

  label = 'Tabs';
  value = '';
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  items: TabItem[] = [];
  private readonly instanceId = `ov-tabs-${++tabsId}`;
  private activeIndex = -1;

  static styles = css`
    :host { display: block; }
    .tabs { display: grid; gap: var(--ov-space-4, 1rem); }
    .tablist { align-items: center; border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); display: flex; gap: var(--ov-space-4, 1rem); overflow-x: auto; }
    :host([orientation='vertical']) .tabs { grid-template-columns: minmax(8rem, auto) minmax(0, 1fr); gap: var(--ov-space-6, 1.5rem); }
    :host([orientation='vertical']) .tablist { align-items: stretch; border-block-end: 0; border-inline-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); flex-direction: column; gap: 0.1rem; overflow-x: visible; padding-inline-end: var(--ov-space-2, 0.5rem); }
    .tab { appearance: none; background: transparent; border: 0; border-block-end: 2px solid transparent; border-radius: var(--ov-radius-sm, 5px) var(--ov-radius-sm, 5px) 0 0; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; flex: 0 0 auto; font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); min-block-size: var(--ov-touch-target, 2.75rem); padding: 0.55rem 0.1rem; text-align: start; }
    .tab:hover:not(:disabled) { color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .tab:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .tab[aria-selected='true'] { border-block-end-color: var(--ov-focus, var(--ov-color-accent-strong, #525252)); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .tab:disabled { cursor: not-allowed; opacity: 0.48; }
    :host([orientation='vertical']) .tab { border-block-end: 0; border-inline-end: 2px solid transparent; border-radius: var(--ov-radius-sm, 5px) 0 0 var(--ov-radius-sm, 5px); padding-inline: 0.65rem; }
    :host([orientation='vertical']) .tab[aria-selected='true'] { border-inline-end-color: var(--ov-focus, var(--ov-color-accent-strong, #525252)); }
    .panel { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 400 var(--ov-text-md, 0.875rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); min-inline-size: 0; }
    .panel[hidden] { display: none; }
    .panel:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    @media (max-width: 40rem) {
      :host([orientation='vertical']) .tabs { grid-template-columns: 1fr; }
      :host([orientation='vertical']) .tablist { border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-inline-end: 0; flex-direction: row; overflow-x: auto; padding-inline-end: 0; }
      :host([orientation='vertical']) .tab { border-block-end: 2px solid transparent; border-inline-end: 0; border-radius: var(--ov-radius-sm, 5px) var(--ov-radius-sm, 5px) 0 0; }
      :host([orientation='vertical']) .tab[aria-selected='true'] { border-block-end-color: var(--ov-focus, var(--ov-color-accent-strong, #525252)); border-inline-end-color: transparent; }
    }
    @media (prefers-reduced-motion: reduce) { .tab { transition: none; } }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('items') || changed.has('value')) this.ensureSelection();
  }

  render() {
    const selected = this.selectedValue;
    const orientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    return html`
      <div class="tabs" part="tabs">
        <div class="tablist" role="tablist" aria-label=${this.label} aria-orientation=${orientation} part="tablist">
          ${this.items.map((item, index) => html`
            <button
              id=${this.tabId(index)}
              class="tab"
              type="button"
              role="tab"
              part="tab"
              data-index=${index}
              aria-controls=${this.panelId(index)}
              aria-selected=${String(item.value === selected)}
              tabindex=${item.value === selected ? '0' : '-1'}
              ?disabled=${Boolean(item.disabled)}
              @click=${() => this.selectItem(index)}
              @keydown=${(event: KeyboardEvent) => this.handleKeydown(event, index)}
            >${item.label}</button>
          `)}
        </div>
        <div class="panels" part="panels">
          ${this.items.map((item, index) => html`
            <section
              id=${this.panelId(index)}
              class="panel"
              role="tabpanel"
              part="panel"
              aria-labelledby=${this.tabId(index)}
              tabindex="0"
              ?hidden=${item.value !== selected}
            ><slot name=${item.value}></slot></section>
          `)}
        </div>
      </div>
    `;
  }

  private get selectedValue() {
    const selected = this.items.find((item) => item.value === this.value && !item.disabled);
    return selected?.value ?? this.items.find((item) => !item.disabled)?.value ?? '';
  }

  private ensureSelection() {
    const selected = this.selectedValue;
    if (selected && this.value !== selected) this.value = selected;
  }

  private tabId(index: number) { return `${this.instanceId}-tab-${index}`; }
  private panelId(index: number) { return `${this.instanceId}-panel-${index}`; }

  private selectItem(index: number) {
    const item = this.items[index];
    if (!item || item.disabled || item.value === this.selectedValue) return;
    this.value = item.value;
    this.dispatchEvent(new CustomEvent<TabsChangeDetail>('change', { detail: { value: item.value, label: item.label }, bubbles: true, composed: true }));
  }

  private handleKeydown(event: KeyboardEvent, index: number) {
    const horizontal = this.orientation !== 'vertical';
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
    const backward = horizontal ? 'ArrowLeft' : 'ArrowUp';
    if (event.key === forward || event.key === backward) {
      event.preventDefault();
      this.focusTab(this.nextEnabledIndex(index, event.key === forward ? 1 : -1));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.focusTab(event.key === 'Home' ? this.firstEnabledIndex() : this.lastEnabledIndex());
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectItem(index);
    }
  }

  private firstEnabledIndex() { return this.items.findIndex((item) => !item.disabled); }

  private lastEnabledIndex() {
    for (let index = this.items.length - 1; index >= 0; index -= 1) if (!this.items[index]?.disabled) return index;
    return -1;
  }

  private nextEnabledIndex(index: number, direction: 1 | -1) {
    const enabled = this.items.map((item, itemIndex) => item.disabled ? -1 : itemIndex).filter((itemIndex) => itemIndex >= 0);
    if (!enabled.length) return -1;
    const position = enabled.indexOf(index);
    return enabled[(position + direction + enabled.length) % enabled.length] ?? enabled[0] ?? -1;
  }

  private focusTab(index: number) {
    if (index < 0) return;
    this.activeIndex = index;
    this.selectItem(index);
    this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLButtonElement>(`.tab[data-index="${index}"]`)?.focus());
  }
}

customElements.define('ov-tabs', OvTabs);

declare global {
  interface HTMLElementTagNameMap {
    'ov-tabs': OvTabs;
  }
}
