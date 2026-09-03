import { LitElement, css, html } from 'lit';

export interface TableColumn {
  key: string;
  label: string;
}

/** A compact labelled table for comparable records. */
export class OvDataTable extends LitElement {
  static properties = { caption: { type: String, reflect: true }, columns: { type: Array }, rows: { type: Array } };
  caption = '';
  columns: TableColumn[] = [];
  rows: Record<string, string>[] = [];

  static styles = css`
    :host { display: block; overflow-x: auto; }
    table { border-collapse: collapse; color: var(--ov-text, var(--ov-color-ink, #171717)); font-variant-numeric: tabular-nums; min-width: 100%; text-align: start; }
    caption { color: var(--ov-faint, #767676); font: 600 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-sans, sans-serif); letter-spacing: 0.08em; margin-block-end: 0.75rem; text-align: start; text-transform: uppercase; }
    th { color: var(--ov-faint, #767676); font: 600 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-sans, sans-serif); letter-spacing: 0.05em; text-transform: uppercase; }
    td { font: 400 var(--ov-text-sm, 0.82rem) / 1.45 var(--ov-font-sans, sans-serif); }
    th, td { border-bottom: 1px solid var(--ov-border, var(--ov-color-line, rgb(0 0 0 / 0.10))); padding: 0.68rem 0.75rem; white-space: nowrap; }
    th:first-child, td:first-child { padding-inline-start: 0; }
    th:last-child, td:last-child { padding-inline-end: 0; }
    .empty { color: var(--ov-muted, var(--ov-color-muted, #6f6f6f)); font-style: normal; }
    @media (hover: hover) { tbody tr:hover { background: var(--ov-hover, var(--ov-color-accent, rgb(0 0 0 / 0.055))); } }
  `;

  render() {
    return html`<table part="table">
      <caption part="caption">${this.caption}</caption>
      <thead part="header"><tr>${this.columns.map((column) => html`<th scope="col">${column.label}</th>`)}</tr></thead>
      <tbody part="body">
        ${this.rows.length ? this.rows.map((row) => html`<tr part="row">${this.columns.map((column) => html`<td>${row[column.key] ?? ''}</td>`)}</tr>`) : html`<tr><td class="empty" colspan=${Math.max(this.columns.length, 1)}>No records yet.</td></tr>`}
      </tbody>
    </table>`;
  }
}

customElements.define('ov-data-table', OvDataTable);
declare global { interface HTMLElementTagNameMap { 'ov-data-table': OvDataTable; } }
