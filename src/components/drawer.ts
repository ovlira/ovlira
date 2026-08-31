import { LitElement, css, html, nothing } from 'lit';

export type DrawerPlacement = 'left' | 'right';

let drawerId = 0;

/** A native dialog presented as a focused side panel for supplemental work. */
export class OvDrawer extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    modal: { type: Boolean, reflect: true },
    heading: { type: String, reflect: true },
    description: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    dismissible: { type: Boolean, reflect: true },
  };

  open = false;
  modal = true;
  heading = '';
  description = '';
  placement: DrawerPlacement = 'right';
  dismissible = true;
  private hasActions = false;
  private nativeMode: 'modal' | 'nonmodal' | null = null;
  private suppressNativeClose = false;
  private readonly instanceId = `ov-drawer-${++drawerId}`;

  static styles = css`
    :host { display: block; }
    :host([open]) { min-block-size: var(--ov-space-1, 0.25rem); }
    dialog { background: transparent; border: 0; color: var(--ov-text, var(--ov-color-ink, #171717)); inset-block: 0; inset-inline-end: 0; margin: 0; max-block-size: 100dvh; max-inline-size: min(28rem, 100vw); padding: 0; position: fixed; width: 100%; }
    :host([placement='left']) dialog { inset-inline-end: auto; inset-inline-start: 0; }
    dialog::backdrop { background: color-mix(in srgb, var(--ov-text, var(--ov-color-ink, #171717)) 30%, transparent); }
    .surface { background: var(--ov-surface-raised, var(--ov-color-surface-raised, #ffffff)); border-inline-start: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); box-shadow: var(--ov-shadow-md, 0 10px 30px rgb(0 0 0 / 0.12)); display: flex; flex-direction: column; min-block-size: 100dvh; overflow: hidden; padding: var(--ov-space-6, 1.5rem); }
    :host([placement='left']) .surface { border-inline-end: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-inline-start: 0; }
    header { align-items: flex-start; display: flex; gap: var(--ov-space-4, 1rem); justify-content: space-between; }
    h2 { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 600 var(--ov-text-lg, 1rem) / var(--ov-line-tight, 1.2) var(--ov-font-sans, sans-serif); letter-spacing: -0.015em; margin: 0; }
    .description { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-sm, 0.82rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin-block-start: var(--ov-space-1, 0.25rem); }
    .body { flex: 1; font: 400 var(--ov-text-md, 0.875rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); margin-block-start: var(--ov-space-6, 1.5rem); overflow: auto; }
    .body::slotted(*) { margin-block: 0; }
    footer { align-items: center; border-block-start: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); display: flex; flex-wrap: wrap; gap: var(--ov-space-2, 0.5rem); justify-content: flex-end; margin-block-start: var(--ov-space-6, 1.5rem); padding-block-start: var(--ov-space-4, 1rem); }
    footer[hidden] { display: none; }
    .close { appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; font: 500 var(--ov-text-sm, 0.82rem) / 1 var(--ov-font-sans, sans-serif); min-height: var(--ov-control-height, 2.5rem); padding: 0.55rem 0.65rem; }
    .close:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    @media (hover: hover) { .close:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); } }
    @media (max-width: 40rem) { dialog { max-inline-size: 100vw; } .surface { padding: var(--ov-space-4, 1rem); } }
    @media (prefers-reduced-motion: reduce) { .close { transition: none; } }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('open') || changed.has('modal')) this.syncNativeDialog();
  }

  render() {
    const titleId = `${this.instanceId}-heading`;
    const descriptionId = `${this.instanceId}-description`;
    return html`
      <dialog part="drawer" aria-labelledby=${titleId} aria-describedby=${this.description ? descriptionId : nothing} @close=${this.handleNativeClose} @cancel=${this.handleNativeCancel}>
        <div class="surface" part="surface">
          <header part="header">
            <div><h2 id=${titleId} part="heading">${this.heading}</h2>${this.description ? html`<div id=${descriptionId} class="description" part="description">${this.description}</div>` : nothing}</div>
            ${this.dismissible ? html`<button class="close" part="close" type="button" @click=${this.requestClose}>Close</button>` : nothing}
          </header>
          <div class="body" part="body"><slot></slot></div>
          <footer ?hidden=${!this.hasActions} part="actions"><slot name="actions" @slotchange=${this.handleActionsSlot}></slot></footer>
        </div>
      </dialog>
    `;
  }

  private handleActionsSlot(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const hasActions = slot.assignedNodes({ flatten: true }).length > 0;
    if (hasActions !== this.hasActions) {
      this.hasActions = hasActions;
      this.requestUpdate();
    }
  }

  private syncNativeDialog() {
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (!dialog) return;
    if (!this.open) {
      if (dialog.open) this.closeNativeDialog(dialog);
      this.nativeMode = null;
      return;
    }
    const mode = this.modal ? 'modal' : 'nonmodal';
    if (dialog.open && this.nativeMode === mode) return;
    if (dialog.open) dialog.open = false;
    this.nativeMode = mode;
    if (mode === 'modal' && typeof dialog.showModal === 'function') dialog.showModal();
    else if (mode === 'nonmodal' && typeof dialog.show === 'function') dialog.show();
    else dialog.open = true;
  }

  private requestClose = () => {
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    else this.handleNativeClose();
  };

  private closeNativeDialog(dialog: HTMLDialogElement) {
    this.suppressNativeClose = true;
    try {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.open = false;
    } finally {
      this.suppressNativeClose = false;
    }
  }

  private handleNativeClose = () => {
    this.nativeMode = null;
    if (this.suppressNativeClose || !this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
  };

  private handleNativeCancel = (event: Event) => {
    if (!this.dismissible) {
      event.preventDefault();
      return;
    }
    const cancelEvent = new Event('cancel', { bubbles: true, cancelable: true, composed: true });
    if (!this.dispatchEvent(cancelEvent)) event.preventDefault();
  };
}

customElements.define('ov-drawer', OvDrawer);

declare global {
  interface HTMLElementTagNameMap {
    'ov-drawer': OvDrawer;
  }
}
