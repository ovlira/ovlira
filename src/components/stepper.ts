import { LitElement, css, html } from 'lit';

export type StepState = 'upcoming' | 'current' | 'complete' | 'error';

export interface StepperItem {
  value: string;
  label: string;
  description?: string;
  state?: StepState;
}

/** A compact ordered progress indicator for multi-step workflows. */
export class OvStepper extends LitElement {
  static properties = {
    items: { type: Array },
    value: { type: String, reflect: true },
    orientation: { type: String, reflect: true },
  };

  items: StepperItem[] = [];
  value = '';
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  static styles = css`
    :host { display: block; }
    ol { display: flex; gap: 0; list-style: none; margin: 0; padding: 0; }
    li { align-items: flex-start; display: flex; flex: 1 1 0; min-inline-size: 0; position: relative; }
    li:not(:last-child)::after { background: var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); block-size: 1px; content: ''; inset-block-start: 0.85rem; inset-inline-start: calc(1.7rem + var(--ov-space-2, 0.5rem)); inset-inline-end: var(--ov-space-2, 0.5rem); position: absolute; }
    .marker { align-items: center; background: var(--ov-surface, var(--ov-color-surface, #ffffff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 50%; color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: inline-flex; flex: none; font: 500 var(--ov-text-xs, 0.72rem) / 1 var(--ov-font-mono, monospace); height: 1.7rem; justify-content: center; position: relative; width: 1.7rem; z-index: 1; }
    .copy { display: grid; gap: var(--ov-space-1, 0.25rem); min-inline-size: 0; padding-inline-start: var(--ov-space-2, 0.5rem); }
    .label { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .description { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    li[data-state='current'] .marker { background: var(--ov-text, var(--ov-color-ink, #171717)); border-color: var(--ov-text, var(--ov-color-ink, #171717)); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); }
    li[data-state='current'] .label, li[data-state='complete'] .label { color: var(--ov-text, var(--ov-color-ink, #171717)); }
    li[data-state='complete'] .marker { background: var(--ov-good, var(--ov-color-success, #15743a)); border-color: var(--ov-good, var(--ov-color-success, #15743a)); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); }
    li[data-state='error'] .marker { border-color: var(--ov-bad, var(--ov-color-danger, #b42318)); color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    li[data-state='error'] .label { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    :host([orientation='vertical']) ol { display: grid; gap: 0; }
    :host([orientation='vertical']) li { min-block-size: 3.5rem; }
    :host([orientation='vertical']) li:not(:last-child)::after { block-size: auto; inset-block-start: 1.9rem; inset-block-end: 0.3rem; inset-inline-start: 0.85rem; inset-inline-end: auto; width: 1px; }
    @media (max-width: 40rem) {
      ol { display: grid; gap: var(--ov-space-3, 0.75rem); }
      li { flex: none; }
      li:not(:last-child)::after { display: none; }
      :host([orientation='horizontal']) li { min-block-size: 2.75rem; }
    }
  `;

  render() {
    const currentIndex = this.items.findIndex((item) => item.value === this.value);
    return html`
      <ol part="stepper" aria-label="Progress">
        ${this.items.map((item, index) => {
          const state = item.state ?? this.derivedState(index, currentIndex);
          return html`
            <li part="step" data-value=${item.value} data-state=${state} aria-current=${state === 'current' ? 'step' : 'false'}>
              <span class="marker" part="marker" aria-hidden="true">${state === 'complete' ? '✓' : index + 1}</span>
              <span class="copy"><span class="label" part="label">${item.label}</span>${item.description ? html`<span class="description" part="description">${item.description}</span>` : ''}</span>
            </li>
          `;
        })}
      </ol>
    `;
  }

  private derivedState(index: number, currentIndex: number): StepState {
    if (currentIndex < 0) return index === 0 ? 'current' : 'upcoming';
    if (index < currentIndex) return 'complete';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  }
}

customElements.define('ov-stepper', OvStepper);

declare global {
  interface HTMLElementTagNameMap {
    'ov-stepper': OvStepper;
  }
}
