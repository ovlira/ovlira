import { LitElement, css, html } from 'lit';

export type SkeletonVariant = 'text' | 'heading' | 'circle' | 'rect';

/** A decorative loading placeholder; the owning region should expose aria-busy. */
export class OvSkeleton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    lines: { type: Number, reflect: true },
    animated: { type: Boolean, reflect: true },
  };

  variant: SkeletonVariant = 'text';
  lines = 1;
  animated = true;

  static styles = css`
    :host { display: block; }
    .skeleton { display: grid; gap: var(--ov-space-2, 0.5rem); }
    .line { animation: ov-skeleton-pulse 1.35s ease-in-out infinite; background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); border-radius: var(--ov-radius-sm, 5px); display: block; min-block-size: 0.8rem; }
    @supports (background: color-mix(in srgb, black 10%, white)) { .line { background: color-mix(in srgb, var(--ov-muted, var(--ov-color-muted, #6f6f6f)) 14%, var(--ov-surface, var(--ov-color-surface, #ffffff))); } }
    .line:last-child { inline-size: 68%; }
    .heading .line { min-block-size: 1.25rem; inline-size: min(16rem, 75%); }
    .heading .line:last-child { inline-size: min(12rem, 58%); }
    .circle { aspect-ratio: 1; border-radius: 50%; inline-size: 3rem; }
    .rect { min-block-size: 8rem; inline-size: 100%; }
    .static .line, .static.circle, .static.rect { animation: none; }
    @media (prefers-reduced-motion: reduce) { .line, .circle, .rect { animation: none; } }
    @keyframes ov-skeleton-pulse { 0%, 100% { opacity: 0.62; } 50% { opacity: 1; } }
  `;

  render() {
    const variant = this.normalizedVariant;
    if (variant === 'circle') return html`<div class="skeleton circle ${this.animated ? '' : 'static'}" role="presentation" aria-hidden="true" part="skeleton"></div>`;
    if (variant === 'rect') return html`<div class="skeleton rect ${this.animated ? '' : 'static'}" role="presentation" aria-hidden="true" part="skeleton"></div>`;
    const count = Math.min(8, Math.max(1, Math.floor(Number.isFinite(this.lines) ? this.lines : 1)));
    return html`<div class="skeleton ${variant} ${this.animated ? '' : 'static'}" role="presentation" aria-hidden="true" part="skeleton">${Array.from({ length: count }, () => html`<span class="line" part="line"></span>`)}</div>`;
  }

  private get normalizedVariant(): SkeletonVariant {
    return ['text', 'heading', 'circle', 'rect'].includes(this.variant) ? this.variant : 'text';
  }
}

customElements.define('ov-skeleton', OvSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    'ov-skeleton': OvSkeleton;
  }
}
