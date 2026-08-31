import { LitElement, css, html, nothing } from 'lit';

let progressId = 0;

/** A labelled native progress indicator for determinate or indeterminate work. */
export class OvProgress extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    value: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    indeterminate: { type: Boolean, reflect: true },
    showValue: { type: Boolean, attribute: 'show-value', reflect: true },
  };

  label = 'Progress';
  value = 0;
  max = 100;
  indeterminate = false;
  showValue = false;
  private readonly instanceId = `ov-progress-${++progressId}`;

  static styles = css`
    :host { display: block; }
    .progress { display: grid; gap: 0.45rem; }
    .header { align-items: baseline; display: flex; gap: var(--ov-space-4, 1rem); justify-content: space-between; }
    label { color: var(--ov-text, var(--ov-color-ink, #171717)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .value { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.3 var(--ov-font-mono, monospace); }
    progress { appearance: none; background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); border: 0; border-radius: var(--ov-radius-pill, 999px); block-size: 0.45rem; display: block; inline-size: 100%; overflow: hidden; }
    progress::-webkit-progress-bar { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); border-radius: inherit; }
    progress::-webkit-progress-value { background: var(--ov-focus, var(--ov-color-accent-strong, #525252)); border-radius: inherit; }
    progress::-moz-progress-bar { background: var(--ov-focus, var(--ov-color-accent-strong, #525252)); border-radius: inherit; }
    progress:indeterminate { background: linear-gradient(90deg, var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))) 0 35%, var(--ov-focus, var(--ov-color-accent-strong, #525252)) 50%, var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))) 65%); background-size: 220% 100%; }
    @media (prefers-reduced-motion: no-preference) { progress:indeterminate { animation: ov-progress-scan 1.4s ease-in-out infinite; } }
    @media (prefers-reduced-motion: reduce) { progress { animation: none; } }
    @keyframes ov-progress-scan { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  `;

  render() {
    const max = this.normalizedMax;
    const value = this.normalizedValue(max);
    const percent = Math.round((value / max) * 100);
    return html`
      <div class="progress" part="progress">
        <div class="header"><label for=${this.instanceId} part="label">${this.label}</label>${this.showValue && !this.indeterminate ? html`<span class="value" part="value">${percent}%</span>` : nothing}</div>
        <progress id=${this.instanceId} max=${max} part="bar" aria-label=${this.label} value=${this.indeterminate ? nothing : value}>${this.indeterminate ? '' : `${percent}%`}</progress>
      </div>
    `;
  }

  private get normalizedMax() {
    return Number.isFinite(this.max) && this.max > 0 ? this.max : 100;
  }

  private normalizedValue(max: number) {
    return Number.isFinite(this.value) ? Math.min(max, Math.max(0, this.value)) : 0;
  }
}

customElements.define('ov-progress', OvProgress);

declare global {
  interface HTMLElementTagNameMap {
    'ov-progress': OvProgress;
  }
}
