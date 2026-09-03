import { LitElement, css, html } from 'lit';

/** A native button with explicit intent and progress states. */
export class OvButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    loading: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    type: { type: String, reflect: true },
  };

  /** Visual and semantic intent. */
  variant: 'primary' | 'secondary' | 'quiet' | 'danger' = 'primary';
  /** Control height and padding. */
  size: 'sm' | 'md' | 'lg' = 'md';
  /** Disables the button and announces progress. */
  loading = false;
  /** Prevents interaction. */
  disabled = false;
  /** Native button type. */
  type: 'button' | 'submit' | 'reset' = 'button';

  static styles = css`
    :host { display: inline-block; }
    button {
      align-items: center;
      border: 1px solid transparent;
      border-radius: var(--ov-button-radius, var(--ov-radius-md, 7px));
      cursor: pointer;
      display: inline-flex;
      font: 500 var(--ov-text-md, 0.875rem) / 1 var(--ov-font-sans, sans-serif);
      gap: 0.45rem;
      justify-content: center;
      min-height: var(--ov-control-height, 2.5rem);
      padding: 0.65rem 0.9rem;
      transition: background-color var(--ov-motion-fast, 120ms) ease, border-color var(--ov-motion-fast, 120ms) ease, opacity var(--ov-motion-fast, 120ms) ease, transform var(--ov-motion-fast, 120ms) ease-out;
    }
    button:active:not(:disabled) { transform: scale(0.98); }
    button:focus-visible { outline: 2px solid var(--ov-focus, var(--ov-color-accent-strong, #525252)); outline-offset: 2px; }
    button:disabled { cursor: not-allowed; opacity: 0.56; }
    button.primary { background: var(--ov-text, var(--ov-color-ink, #171717)); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); }
    button.secondary { background: transparent; border-color: var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); color: var(--ov-text, var(--ov-color-ink, #171717)); }
    button.quiet { background: transparent; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); padding-inline: 0.55rem; }
    button.danger { background: var(--ov-bad, var(--ov-color-danger, #b42318)); color: var(--ov-surface, var(--ov-color-surface, #ffffff)); }
    button.sm { min-height: 2.25rem; padding: 0.55rem 0.75rem; }
    button.lg { min-height: 2.75rem; padding: 0.75rem 1rem; }
    .spinner { animation: spin 800ms linear infinite; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; height: 0.8rem; width: 0.8rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (hover: hover) { button.primary:hover:not(:disabled), button.danger:hover:not(:disabled) { opacity: 0.86; } button.secondary:hover:not(:disabled), button.quiet:hover:not(:disabled) { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); color: var(--ov-text, var(--ov-color-ink, #171717)); } }
    @media (max-width: 47.5rem) { button, button.sm, button.lg { min-height: var(--ov-touch-target, 2.75rem); } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } .spinner { animation: none; } }
  `;

  render() {
    return html`
      <button
        part="button"
        class=${`${this.variant} ${this.size}`}
        ?disabled=${this.disabled || this.loading}
        type=${this.type}
        aria-busy=${this.loading ? 'true' : 'false'}
      >
        ${this.loading ? html`<span class="spinner" aria-hidden="true"></span><span>Working…</span>` : html`<slot></slot>`}
      </button>
    `;
  }
}

customElements.define('ov-button', OvButton);

declare global {
  interface HTMLElementTagNameMap {
    'ov-button': OvButton;
  }
}
