# Domain adaptation rehearsal

One agent-authored adaptation of generated `page.crud-table`, parameterized for customers, equipment, and editorial content. This is **not** twelve independent agent runs and must not be reported as the release autonomy benchmark.

Run from the repository: `npm exec vite -- --config examples/adaptation/vite.config.ts`.

Query parameters: `domain=customers|equipment|editorial`, `theme=light|dark`, `empty=1`, `fail=1` (the initial read fails once; Retry recovers). Data is in-memory and survives record navigation, not a full reload.

The generated stylesheet and theme are unchanged. There is no public row-link API on `ov-data-table`, so this rehearsal uses an approved select and Open record action instead of making shadow-DOM rows clickable. That is adaptation friction, not a new visual contract.
