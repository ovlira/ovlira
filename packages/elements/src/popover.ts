import { LitElement, css, html, nothing } from 'lit';

export type PopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

let popoverId = 0;

/** A non-modal floating surface for contextual content and controls. */
export class OvPopover extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    placement: { type: String, reflect: true },
    dismissible: { type: Boolean, reflect: true },
  };

  label = 'More details';
  open = false;
  disabled = false;
  placement: PopoverPlacement = 'bottom';
  dismissible = true;
  private readonly instanceId = `ov-popover-${++popoverId}`;

  static styles = css`
    :host { display: inline-block; position: relative; }
    .trigger { align-items: center; appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-md, 7px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; display: inline-flex; font: 500 var(--ov-text-sm, 0.82rem) / 1.2 var(--ov-font-sans, sans-serif); gap: 0.45rem; justify-content: center; min-height: var(--ov-touch-target, 2.75rem); padding: 0.45rem 0.65rem; }
    .trigger:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .trigger:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    .trigger:disabled { cursor: not-allowed; opacity: 0.56; }
    .popover { background: var(--ov-surface-raised, var(--ov-color-surface-raised, #ffffff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: var(--ov-radius-lg, 8px); box-shadow: var(--ov-shadow-md, 0 10px 30px rgb(0 0 0 / 0.12)); color: var(--ov-text, var(--ov-color-ink, #171717)); inset-block-start: calc(100% + var(--ov-space-2, 0.5rem)); inset-inline-start: 0; max-inline-size: min(28rem, calc(100vw - var(--ov-space-8, 2rem))); min-inline-size: min(14rem, calc(100vw - var(--ov-space-8, 2rem))); padding: var(--ov-space-4, 1rem); position: absolute; text-align: start; z-index: 10; }
    .popover[hidden] { display: none; }
    .content { font: 400 var(--ov-text-sm, 0.82rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); }
    .content::slotted(*) { margin-block: 0; }
    :host([placement='top']) .popover { inset-block-end: calc(100% + var(--ov-space-2, 0.5rem)); inset-block-start: auto; }
    :host([placement='right']) .popover { inset-block-start: 0; inset-inline-start: calc(100% + var(--ov-space-2, 0.5rem)); }
    :host([placement='left']) .popover { inset-block-start: 0; inset-inline-end: calc(100% + var(--ov-space-2, 0.5rem)); inset-inline-start: auto; }
    @media (max-width: 40rem) { .popover { max-inline-size: calc(100vw - var(--ov-space-8, 2rem)); min-inline-size: min(14rem, calc(100vw - var(--ov-space-8, 2rem))); } }
    @media (prefers-reduced-motion: reduce) { .trigger { transition: none; } }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    if (this.open) {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown);
      this.dispatchEvent(new Event('open', { bubbles: true, composed: true }));
    } else {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
      if (changed.get('open') !== undefined) this.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    }
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    super.disconnectedCallback();
  }

  render() {
    const contentId = `${this.instanceId}-content`;
    return html`
      <button class="trigger" type="button" part="trigger" aria-haspopup="dialog" aria-expanded=${String(this.open)} aria-controls=${contentId} ?disabled=${this.disabled} @click=${this.toggleSurface} @keydown=${this.handleTriggerKeydown}>
        <slot name="trigger">${this.label}</slot>
      </button>
      <div id=${contentId} class="popover" role="dialog" aria-label=${this.label} part="popover" ?hidden=${!this.open} @keydown=${this.handlePopoverKeydown}>
        <div class="content" part="content"><slot></slot></div>
      </div>
    `;
  }

  private toggleSurface = () => {
    if (this.disabled) return;
    if (this.open) this.closeSurface();
    else this.open = true;
  };

  private handleTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open && this.dismissible) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSurface();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!this.open) this.open = true;
    this.updateComplete.then(() => this.focusFirstContentControl());
  };

  private handlePopoverKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.dismissible) return;
    event.preventDefault();
    event.stopPropagation();
    this.closeSurface();
  };

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (this.dismissible && !event.composedPath().includes(this)) this.closeSurface(false);
  };

  private focusFirstContentControl() {
    const control = this.shadowRoot?.querySelector<HTMLElement>('.content [autofocus], .content button, .content a, .content input, .content select, .content textarea, .content [tabindex]:not([tabindex="-1"])');
    control?.focus();
  }

  private closeSurface(restoreFocus = true) {
    if (!this.open) return;
    this.open = false;
    if (restoreFocus) this.updateComplete.then(() => this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus());
  }
}

customElements.define('ov-popover', OvPopover);

declare global {
  interface HTMLElementTagNameMap {
    'ov-popover': OvPopover;
  }
}
