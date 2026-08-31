import { LitElement, css, html, nothing } from 'lit';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';
export type ToastCloseReason = 'dismiss' | 'timeout';

export interface ToastCloseDetail {
  reason: ToastCloseReason;
}

/** A transient, dismissible notification that an owning region places in the UI. */
export class OvToast extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    tone: { type: String, reflect: true },
    heading: { type: String, reflect: true },
    duration: { type: Number, reflect: true },
    dismissible: { type: Boolean, reflect: true },
    closeLabel: { type: String, attribute: 'close-label', reflect: true },
  };

  open = false;
  tone: ToastTone = 'info';
  heading = '';
  duration = 5000;
  dismissible = true;
  closeLabel = 'Dismiss notification';
  private timer: number | undefined;
  private startedAt = 0;
  private remaining = 0;
  private hovered = false;
  private focused = false;

  static styles = css`
    :host { display: block; }
    .toast { --toast-tone: var(--ov-info, var(--ov-color-info, #5f5f5f)); align-items: flex-start; background: var(--ov-surface-raised, var(--ov-color-surface-raised, #ffffff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-inline-start: 2px solid var(--toast-tone); border-radius: var(--ov-radius-md, 7px); box-shadow: var(--ov-shadow-sm, none); color: var(--ov-text, var(--ov-color-ink, #171717)); display: flex; gap: var(--ov-space-4, 1rem); justify-content: space-between; max-inline-size: min(28rem, 100%); padding: var(--ov-space-4, 1rem); }
    .toast.success { --toast-tone: var(--ov-good, var(--ov-color-success, #15743a)); }
    .toast.warning { --toast-tone: var(--ov-warn, var(--ov-color-warning, #805c00)); }
    .toast.danger { --toast-tone: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    .toast[hidden] { display: none; }
    .copy { display: grid; gap: 0.25rem; min-inline-size: 0; }
    strong { color: var(--toast-tone); font: 600 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .message { font: 400 var(--ov-text-sm, 0.82rem) / var(--ov-line-body, 1.55) var(--ov-font-sans, sans-serif); }
    .close { appearance: none; background: transparent; border: 0; border-radius: var(--ov-radius-sm, 5px); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); cursor: pointer; flex: 0 0 auto; font: 500 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-sans, sans-serif); min-block-size: var(--ov-touch-target, 2.75rem); padding: 0.45rem 0.25rem; }
    .close:hover { color: var(--ov-text, var(--ov-color-ink, #171717)); }
    .close:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
  `;

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('open') || changed.has('duration')) {
      this.clearTimer();
      if (this.open) {
        this.remaining = this.normalizedDuration;
        this.scheduleDismissal();
      }
    }
  }

  disconnectedCallback() {
    this.clearTimer();
    super.disconnectedCallback();
  }

  render() {
    const role = this.tone === 'danger' ? 'alert' : 'status';
    return html`
      <section
        class="toast ${this.tone}"
        role=${role}
        aria-live=${this.tone === 'danger' ? 'assertive' : 'polite'}
        aria-atomic="true"
        ?hidden=${!this.open}
        part="toast"
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
      >
        <div class="copy" part="copy"><strong ?hidden=${!this.heading} part="heading">${this.heading}</strong><div class="message" part="message"><slot></slot></div></div>
        ${this.dismissible ? html`<button class="close" type="button" part="close" aria-label=${this.closeLabel} @click=${this.dismiss}>Dismiss</button>` : nothing}
      </section>
    `;
  }

  private get normalizedDuration() {
    return Number.isFinite(this.duration) && this.duration > 0 ? this.duration : 0;
  }

  private dismiss = () => this.close('dismiss');

  private close(reason: ToastCloseReason) {
    if (!this.open) return;
    this.clearTimer();
    this.open = false;
    this.dispatchEvent(new CustomEvent<ToastCloseDetail>('close', { detail: { reason }, bubbles: true, composed: true }));
  }

  private scheduleDismissal() {
    if (!this.open || this.remaining <= 0) return;
    this.startedAt = Date.now();
    this.timer = window.setTimeout(() => this.close('timeout'), this.remaining);
  }

  private pauseDismissal = () => {
    if (!this.timer || this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
    this.clearTimer();
  };

  private handleMouseEnter = () => {
    this.hovered = true;
    this.pauseDismissal();
  };

  private handleMouseLeave = () => {
    this.hovered = false;
    this.resumeDismissal();
  };

  private handleFocusIn = () => {
    this.focused = true;
    this.pauseDismissal();
  };

  private handleFocusOut = () => {
    this.focused = false;
    this.resumeDismissal();
  };

  private resumeDismissal = () => {
    if (this.open && !this.timer && !this.hovered && !this.focused) this.scheduleDismissal();
  };

  private clearTimer() {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
  }
}

customElements.define('ov-toast', OvToast);

declare global {
  interface HTMLElementTagNameMap {
    'ov-toast': OvToast;
  }
}
