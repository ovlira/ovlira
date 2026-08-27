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
      border-radius: var(--ov-button-radius, var(--ov-radius-md, 0.65rem));
      cursor: pointer;
      display: inline-flex;
      font: 650 var(--ov-text-sm, 0.84rem) / 1 var(--ov-font-mono, monospace);
      gap: 0.55rem;
      justify-content: center;
      min-height: 2.65rem;
      padding: 0.75rem 1rem;
      transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }
    button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--ov-shadow-sm); }
    button:active:not(:disabled) { transform: translateY(0); }
    button:focus-visible { outline: 3px solid var(--ov-color-accent, #c7f36b); outline-offset: 3px; }
    button:disabled { cursor: not-allowed; opacity: 0.56; }
    button.primary { background: var(--ov-color-ink, #1d211d); color: var(--ov-color-surface, #fffdf6); }
    button.secondary { background: var(--ov-color-surface, #fffdf6); border-color: var(--ov-color-line, #d7d9cf); color: var(--ov-color-ink, #1d211d); }
    button.quiet { background: transparent; color: var(--ov-color-ink, #1d211d); }
    button.danger { background: var(--ov-color-danger, #f3b0a8); color: var(--ov-color-ink, #1d211d); }
    button.sm { min-height: 2.1rem; padding: 0.55rem 0.75rem; }
    button.lg { min-height: 3.1rem; padding: 0.9rem 1.2rem; }
    .spinner { animation: spin 800ms linear infinite; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; height: 0.8rem; width: 0.8rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } .spinner { animation: none; } }
  `;

  render() {
    return html`
      <button
        part="button"
        class=${this.variant}
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
