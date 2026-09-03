import { LitElement, css, html } from 'lit';

export interface AccordionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

let accordionId = 0;

/** A native disclosure group for revealing related content on demand. */
export class OvAccordion extends LitElement {
  static properties = {
    items: { type: Array },
    openItems: { type: Array },
    multiple: { type: Boolean, reflect: true },
  };

  items: AccordionItem[] = [];
  openItems: string[] = [];
  multiple = false;
  private readonly instanceId = `ov-accordion-${++accordionId}`;

  static styles = css`
    :host { display: block; }
    .accordion { border-block-start: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); }
    details { border-block-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); }
    summary { align-items: center; color: var(--ov-text, var(--ov-color-ink, #171717)); cursor: pointer; display: flex; font: 500 var(--ov-text-sm, 0.82rem) / 1.35 var(--ov-font-sans, sans-serif); gap: var(--ov-space-3, 0.75rem); justify-content: space-between; list-style: none; min-block-size: var(--ov-touch-target, 2.75rem); padding-block: var(--ov-space-2, 0.5rem); }
    summary::-webkit-details-marker { display: none; }
    summary::after { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); content: '+'; font-size: var(--ov-text-lg, 1rem); font-weight: 400; line-height: 1; }
    details[open] summary::after { content: '−'; }
    summary:focus-visible { border-radius: var(--ov-radius-sm, 5px); outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    summary[aria-disabled='true'] { color: var(--ov-faint, #767676); cursor: not-allowed; }
    .panel { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-sm, 0.82rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); padding-block: 0 var(--ov-space-4, 1rem); }
    .panel::slotted(*) { margin-block: 0; }
    @media (prefers-reduced-motion: no-preference) { .panel { animation: reveal var(--ov-motion-fast, 120ms) ease-out; } }
    @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
    @keyframes reveal { from { opacity: 0; transform: translateY(-0.15rem); } to { opacity: 1; transform: translateY(0); } }
  `;

  render() {
    return html`
      <div class="accordion" part="accordion">
        ${this.items.map((item) => {
          const summaryId = `${this.instanceId}-${item.value}-summary`;
          const panelId = `${this.instanceId}-${item.value}-panel`;
          return html`
            <details part="item" data-value=${item.value} ?open=${this.isOpen(item.value)} @toggle=${this.handleToggle}>
              <summary id=${summaryId} part="summary" aria-controls=${panelId} aria-disabled=${item.disabled ? 'true' : 'false'} @click=${(event: MouseEvent) => this.handleSummaryClick(event, item.disabled)} @keydown=${(event: KeyboardEvent) => this.handleSummaryKeydown(event, item.disabled)}>
                <span>${item.label}</span>
              </summary>
              <div id=${panelId} class="panel" role="region" aria-labelledby=${summaryId} part="panel"><slot name=${item.value}></slot></div>
            </details>
          `;
        })}
      </div>
    `;
  }

  private isOpen(value: string) {
    return this.openItems.includes(value);
  }

  private handleSummaryClick(event: MouseEvent, disabled = false) {
    if (disabled) event.preventDefault();
  }

  private handleSummaryKeydown(event: KeyboardEvent, disabled = false) {
    if (disabled && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  }

  private handleToggle(event: Event) {
    const details = event.currentTarget as HTMLDetailsElement;
    const value = details.dataset.value;
    if (!value) return;
    const next = details.open
      ? (this.multiple ? [...this.openItems.filter((item) => item !== value), value] : [value])
      : this.openItems.filter((item) => item !== value);
    if (next.length === this.openItems.length && next.every((item, index) => item === this.openItems[index])) return;
    this.openItems = next;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value, open: details.open, openItems: [...next] } }));
  }
}

customElements.define('ov-accordion', OvAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'ov-accordion': OvAccordion;
  }
}
