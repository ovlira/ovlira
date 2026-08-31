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
    :host { --step-marker-size: 1.7rem; display: block; min-inline-size: 0; }
    ol { display: flex; gap: 0; list-style: none; margin: 0; padding: 0; }
    li { display: grid; flex: 1 1 0; grid-template-rows: auto auto; min-inline-size: 0; }
    .track { align-items: center; display: flex; justify-content: center; min-block-size: var(--step-marker-size); position: relative; }
    .marker { align-items: center; background: var(--ov-surface, var(--ov-color-surface, #ffffff)); border: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); border-radius: 50%; block-size: var(--step-marker-size); color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); display: inline-flex; flex: none; font: 500 var(--ov-text-xs, 0.72rem) / 1 var(--ov-font-mono, monospace); inline-size: var(--step-marker-size); justify-content: center; position: relative; z-index: 1; }
    .connector { background: var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); block-size: 1px; inset-block-start: 50%; inset-inline-end: calc(-50% + (var(--step-marker-size) / 2)); inset-inline-start: calc(50% + (var(--step-marker-size) / 2)); opacity: 0.6; position: absolute; transform: translateY(-50%); z-index: 0; }
    .copy { display: grid; gap: var(--ov-space-1, 0.25rem); min-inline-size: 0; padding-block-start: var(--ov-space-2, 0.5rem); padding-inline: var(--ov-space-2, 0.5rem); text-align: center; }
    .label { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 500 var(--ov-text-sm, 0.82rem) / 1.3 var(--ov-font-sans, sans-serif); }
    .description { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font: 400 var(--ov-text-xs, 0.72rem) / 1.4 var(--ov-font-sans, sans-serif); }
    li[data-state='current'] .marker { background: var(--ov-text, var(--ov-color-ink, #171717)); border-color: var(--ov-text, var(--ov-color-ink, #171717)); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); }
    li[data-state='current'] .label, li[data-state='complete'] .label { color: var(--ov-text, var(--ov-color-ink, #171717)); }
    li[data-state='complete'] .marker { background: var(--ov-good, var(--ov-color-success, #15743a)); border-color: var(--ov-good, var(--ov-color-success, #15743a)); color: var(--ov-bg, var(--ov-color-canvas, #ffffff)); }
    li[data-state='error'] .marker { border-color: var(--ov-bad, var(--ov-color-danger, #b42318)); color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    li[data-state='error'] .label { color: var(--ov-bad, var(--ov-color-danger, #b42318)); }
    li[data-connector-state='complete'] .connector { background: var(--ov-good, var(--ov-color-success, #15743a)); opacity: 1; }
    li[data-connector-state='current'] .connector { background: var(--ov-focus, var(--ov-color-accent-strong, #525252)); opacity: 1; }
    li[data-connector-state='error'] .connector { background: var(--ov-bad, var(--ov-color-danger, #b42318)); opacity: 1; }
    :host([orientation='vertical']) ol { display: grid; gap: 0; }
    :host([orientation='vertical']) li { align-items: stretch; grid-template-columns: var(--step-marker-size) minmax(0, 1fr); grid-template-rows: auto; }
    :host([orientation='vertical']) .track { align-items: center; flex-direction: column; justify-content: flex-start; }
    :host([orientation='vertical']) .connector { flex: 1 1 auto; inline-size: 1px; min-block-size: var(--ov-space-3, 0.75rem); position: static; transform: none; }
    :host([orientation='vertical']) .copy { padding-block: 0 var(--ov-space-4, 1rem); padding-inline: var(--ov-space-3, 0.75rem) 0; text-align: start; }
    :host([orientation='vertical']) li:last-child .copy { padding-block-end: 0; }
    @media (max-width: 40rem) {
      :host([orientation='horizontal']) ol { display: grid; }
      :host([orientation='horizontal']) li { align-items: stretch; flex: none; grid-template-columns: var(--step-marker-size) minmax(0, 1fr); grid-template-rows: auto; }
      :host([orientation='horizontal']) .track { align-items: center; flex-direction: column; justify-content: flex-start; }
      :host([orientation='horizontal']) .connector { flex: 1 1 auto; inline-size: 1px; min-block-size: var(--ov-space-3, 0.75rem); position: static; transform: none; }
      :host([orientation='horizontal']) .copy { padding-block: 0 var(--ov-space-4, 1rem); padding-inline: var(--ov-space-3, 0.75rem) 0; text-align: start; }
      :host([orientation='horizontal']) li:last-child .copy { padding-block-end: 0; }
    }
  `;

  render() {
    const currentIndex = this.items.findIndex((item) => item.value === this.value);
    const states = this.items.map((item, index) => item.state ?? this.derivedState(index, currentIndex));
    return html`
      <ol part="stepper" aria-label="Progress">
        ${this.items.map((item, index) => {
          const state = states[index] ?? 'upcoming';
          const connectorState = this.derivedConnectorState(index, state, states[index + 1], currentIndex);
          return html`
            <li part="step" data-value=${item.value} data-state=${state} data-connector-state=${index < this.items.length - 1 ? connectorState : 'none'} aria-current=${state === 'current' ? 'step' : 'false'}>
              <span class="track" part="track">
                <span class="marker" part="marker" aria-hidden="true">${state === 'complete' ? '✓' : index + 1}</span>
                ${index < this.items.length - 1 ? html`<span class="connector" part="connector" data-state=${connectorState} aria-hidden="true"></span>` : ''}
              </span>
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

  private derivedConnectorState(index: number, state: StepState, nextState: StepState | undefined, currentIndex: number): StepState {
    if (state === 'error' || nextState === 'error') return 'error';
    if (state === 'current') return 'current';
    if (state === 'complete' || nextState === 'current' || index < currentIndex) return 'complete';
    return 'upcoming';
  }
}

customElements.define('ov-stepper', OvStepper);

declare global {
  interface HTMLElementTagNameMap {
    'ov-stepper': OvStepper;
  }
}
