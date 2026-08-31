import { LitElement, css, html, nothing } from 'lit';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

let tooltipId = 0;

/** A supplemental tooltip that opens for pointer hover and keyboard focus. */
export class OvTooltip extends LitElement {
  static properties = {
    content: { type: String, reflect: true },
    label: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
  };

  content = '';
  label = 'More information';
  placement: TooltipPlacement = 'top';
  open = false;
  private readonly instanceId = `ov-tooltip-${++tooltipId}`;
  private interactiveTrigger = false;
  private assignedTriggers: HTMLElement[] = [];
  private triggerDescriptions = new Map<HTMLElement, string | null>();

  static styles = css`
    :host { display: inline-block; position: relative; }
    .trigger { display: inline-flex; }
    .trigger:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .fallback-trigger { align-items: center; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: help; display: inline-flex; min-block-size: var(--ov-touch-target, 2.75rem); min-inline-size: var(--ov-touch-target, 2.75rem); padding: 0.35rem; }
    .tooltip { background: var(--ov-text, var(--ov-color-ink, #171717)); border-radius: var(--ov-radius-sm, 5px); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); font: 400 var(--ov-text-xs, 0.72rem) / 1.35 var(--ov-font-sans, sans-serif); inset-inline-start: 50%; max-inline-size: min(20rem, calc(100vw - 2rem)); padding: 0.45rem 0.6rem; position: absolute; transform: translateX(-50%); white-space: normal; width: max-content; z-index: 20; }
    .tooltip[hidden] { display: none; }
    :host([placement='top']) .tooltip { inset-block-end: calc(100% + 0.45rem); }
    :host([placement='right']) .tooltip { inset-block-start: 50%; inset-inline-start: calc(100% + 0.45rem); transform: translateY(-50%); }
    :host([placement='bottom']) .tooltip { inset-block-start: calc(100% + 0.45rem); }
    :host([placement='left']) .tooltip { inset-block-start: 50%; inset-inline-end: calc(100% + 0.45rem); inset-inline-start: auto; transform: translateY(-50%); }
    @media (max-width: 40rem) { .tooltip { max-inline-size: min(16rem, calc(100vw - 2rem)); } }
  `;

  render() {
    return html`
      <span
        class="trigger"
        part="trigger"
        tabindex=${this.interactiveTrigger ? '-1' : '0'}
        aria-describedby=${this.instanceId}
        @mouseenter=${this.show}
        @mouseleave=${this.hide}
        @focusin=${this.show}
        @focusout=${this.hide}
        @keydown=${this.handleKeydown}
      >
        <slot name="trigger" @slotchange=${this.handleTriggerSlot}>${this.label ? html`<span class="fallback-trigger" aria-hidden="true">?</span>` : nothing}</slot>
      </span>
      <span id=${this.instanceId} class="tooltip" role="tooltip" part="tooltip" ?hidden=${!this.open}>${this.content}</span>
    `;
  }

  disconnectedCallback() {
    this.restoreTriggerDescriptions();
    super.disconnectedCallback();
  }

  private handleTriggerSlot = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    this.restoreTriggerDescriptions();
    this.assignedTriggers = slot.assignedElements({ flatten: true }).filter((element): element is HTMLElement => element instanceof HTMLElement);
    this.interactiveTrigger = this.assignedTriggers.some((element) => element.matches('button, a, input, select, textarea, [tabindex]'));
    this.assignedTriggers.forEach((element) => {
      const describedBy = element.getAttribute('aria-describedby');
      if (!describedBy?.split(/\s+/).includes(this.instanceId)) {
        this.triggerDescriptions.set(element, describedBy);
        element.setAttribute('aria-describedby', [describedBy, this.instanceId].filter(Boolean).join(' '));
      }
    });
    this.requestUpdate();
  };

  private restoreTriggerDescriptions() {
    this.triggerDescriptions.forEach((previous, element) => {
      if (previous === null) element.removeAttribute('aria-describedby');
      else element.setAttribute('aria-describedby', previous);
    });
    this.triggerDescriptions.clear();
  }

  private show = () => {
    if (this.content) this.open = true;
  };

  private hide = () => {
    this.open = false;
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.open) return;
    event.preventDefault();
    event.stopPropagation();
    this.hide();
  };
}

customElements.define('ov-tooltip', OvTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'ov-tooltip': OvTooltip;
  }
}
