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
    table { border-collapse: collapse; color: var(--ov-color-ink, #1d211d); min-width: 100%; text-align: left; }
    caption { color: var(--ov-color-muted, #687066); font: 700 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-mono, monospace); letter-spacing: 0.08em; margin-bottom: 0.8rem; text-align: left; text-transform: uppercase; }
    th { background: var(--ov-color-canvas, #f4f1e8); font: 700 var(--ov-text-xs, 0.72rem) / 1.2 var(--ov-font-mono, monospace); letter-spacing: 0.04em; text-transform: uppercase; }
    td { font: 500 var(--ov-text-sm, 0.84rem) / 1.4 var(--ov-font-sans, sans-serif); }
    th, td { border-bottom: 1px solid var(--ov-color-line, #d7d9cf); padding: 0.85rem 1rem; white-space: nowrap; }
    tbody tr:hover { background: rgb(199 243 107 / 0.12); }
    .empty { color: var(--ov-color-muted, #687066); font-style: italic; }
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
