# Independent adaptation protocol

Frozen starting revision: `ea637e5`. These tasks follow the three-domain rehearsal, but each scored implementation starts in a fresh agent context and a separate application directory. Agents must not read the shared rehearsal, other runs, or production implementation source. They may read DESIGN.md and ui.html and use the local CLI catalogue. The package implementation is frozen during the runs.

Twelve runs: four each for customer records, equipment inventory, and editorial content. Model: inherited parent model (no per-run override). Record each agent ID and its output directory. Local dependency resolution may reuse the repository installation; independent tarball installation is a separate release gate.

## Task

Build a working records-management prototype for the assigned domain. Discover and inspect the appropriate approved recipe; generate and adapt the composition locally. Each record has a name, a responsible person or location, and a lifecycle/availability/publication status. Users can create valid records, inspect a record, and navigate back without losing in-session data. Use deterministic local data with asynchronous loading and an observable, recoverable failure path. Include loading, empty, error, and success feedback.

Required behavior: blank required values cannot create records; keyboard users can create and open records; successful creation remains observable alongside the collection; browser Back works; user-provided text renders as text. Simulated failures must not lose records. Use native links or approved components for navigation. No component-source, base styling, token values, or design-authority changes. Retain the generated stylesheet and local theme unchanged; layout classes may be reused.

## Verification

Each run supplies executable Playwright tests and screenshots at 375px and 1440px in light/dark, plus a production build and CLI check. Tests must exercise creation, invalid input, record navigation/back, empty/loading/error/retry/success, accessible keyboard interactions, no horizontal page overflow, and axe accessibility. Test the native value actually displayed by record selectors. Record hashes of application source, theme and manifest before/after init/repeated add; conflicts are acceptable, overwrites or redirected recipe registration are not.

Parent review re-runs the submitted tests/build/check, inspects screenshots and source, and checks that implementation files are independently authored. Failed initial attempts and repairs inside a run remain recorded. A run may self-repair before its final submission; parent repairs after submission do not convert a failed scored run into a pass.

Gate: at least 11/12 final runs pass, zero data-loss failures, and unchanged CLI response budgets. Four viewport/theme tests of one app count as one implementation, never four independent successes. Human approval of shipped visual authority remains separate from agent visual inspection.
