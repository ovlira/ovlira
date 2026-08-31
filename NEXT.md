The current demo already covers the **conceptual structure** really well. The next additions should make it feel less like documentation and more like a believable local developer tool — especially showing the actual `search → inspect → add → compose → check` loop.

I’d add these, roughly in priority order:

1. **Interactive Search Results**
   Make Catalogue search behave more like the real CLI. Searching `"settings page"` should return a maximum of eight ranked results with small relevance hints such as `recipe`, `component`, `settings`, `form`. This demonstrates the token-efficiency idea directly.

2. **Inspect sections**
   On a catalogue detail page add quiet tabs/text navigation for:
   `Overview · Guidance · API · Example`.
   This mirrors `ovlira inspect --section api|guidance|example` and shows that agents don't need to retrieve the whole descriptor.

3. **Rendered component preview**
   Under a component descriptor, show the actual component rendered using the theme:
   button variants, input states, alert states, etc.
   Keep this very small — not a Storybook clone.

4. **Recipe preview**
   Recipes are arguably the most important thing to demonstrate visually. Selecting `page.settings`, `page.search`, `page.detail`, etc. should show a compact rendered starter underneath the descriptor.

5. **Required-state preview switcher**
   For recipes:
   `Default · Loading · Empty · Error · Success`
   This directly communicates that recipes define required states rather than just happy-path layouts.

6. **“Add to project” interaction**
   Add a primary `Add recipe` action on recipe pages. Clicking it could show a lightweight inline result:
   `Added page.settings`
   followed by the files copied:
   `src/components/...`
   `src/styles/ovlira-theme.css`
   `src/ovlira.generated.ts`
   `src/example.ts`

7. **Generated-files view**
   Add a tiny **Project** section showing what Ovlira owns versus what the user owns. For example:
   `ovlira.generated.ts — generated`
   `ovlira-theme.css — user owned`
   `settings-page.ts — editable`
   This communicates the architecture very effectively.

8. **CLI command drawer/history**
   Show the commands corresponding to actions the user takes in the UI:
   `ovlira search "settings page" --json`
   `ovlira inspect page.settings --section guidance --json`
   `ovlira add page.settings`
   This keeps the demo explicitly CLI-first rather than accidentally suggesting the UI is the product.

9. **Token inspector**
   Clicking `--ov-space-3`, `--ov-text`, etc. could show:
   value,
   CSS custom property,
   semantic purpose,
   where it is used.
   Particularly useful for explaining why agents shouldn't invent arbitrary literals.

10. **Theme editor simulation**
    Not a full visual editor — just a tiny demonstration that the theme is replaceable. Have maybe three temporary demo presets:
    `Default · Contrast · Warm`
    and show the same recipe changing entirely through tokens.

11. **Literal-token violation demo**
    On Validation, add one intentionally broken example:
    `background: #ff5500`
    → `OVLIRA0017 Unapproved literal colour`
    → suggested fix: `Use var(--ov-...)`.
    This makes the validator much easier to understand.

12. **Multiple-primary-action violation**
    Another excellent validator example:
    two primary buttons inside one task region.
    Show Ovlira flagging it and recommending which action should become secondary.

13. **Invalid component example**
    Something like:
    `<ov-input></ov-input>`
    with no label.
    Then show:
    `Missing required label`
    plus line number and suggested fix.

14. **Before / after validation**
    Let the user press `Apply suggested fix`.
    The diagnostic disappears and the screen changes from:
    `3 issues`
    to
    `Everything passes.`
    This would make the demo feel surprisingly complete.

15. **Metadata explorer**
    Add a small page for:
    `ovlira metadata --json`
    showing the normalized catalogue index:
    ID, custom-element tag, type, category.
    It reinforces that Ovlira is structured data rather than prose documentation.

16. **Catalogue relationship information**
    When inspecting `page.settings`, show:
    `Uses`
    `ov-page-header`
    `ov-input`
    `ov-select`
    `ov-button`
    etc.
    And on a component show:
    `Used by page.settings, page.search`.
    This makes the catalogue feel like a coherent system.

17. **Token-cost / retrieval indicator**
    This could become one of the demo's strongest features. For example:
    `Search response · ~340 tokens`
    `Guidance section · ~220 tokens`
    `Full catalogue avoided · ~12,400 tokens`
    They can be illustrative demo values rather than claiming benchmark accuracy. It immediately communicates Ovlira's USP.

18. **Agent context panel**
    Show exactly what an agent receives after inspection:
    a compact JSON block with only the relevant descriptor fields.
    Then contrast it with:
    `Not sent: 15 other catalogue entries`.
    Again, this makes token efficiency tangible.

19. **Framework portability page**
    Add:
    `HTML · Lit · React · Vue · Angular`
    Selecting one shows the tiny integration snippet and relevant caveat:
    Vue custom-element config, Angular `CUSTOM_ELEMENTS_SCHEMA`, React property bridge, etc.

20. **Visual review section**
    Since the real project already has this concept, expose:
    `6 recipes · 3 widths · 2 themes · keyboard review`.
    Selecting a recipe could show Desktop / Tablet / Mobile and Light / Dark switches.

21. **Evaluation page**
    Show a fictional-but-plausible Codex evaluation run:
    `Scenario: settings-recipe`
    `Search ✓`
    `Inspect ✓`
    `Add ✓`
    `Check ✓`
    `Files modified: 7`
    `Validator errors: 0`
    This would explain the evaluation infrastructure without overwhelming people.

22. **Offline/local indicator**
    Somewhere very subtly show:
    `Local`
    or
    `No network required`.
    That's a meaningful architectural property of Ovlira and deserves to be visible.

23. **Package/repository health**
    A small About/Status area could show:
    `@ovlira/cli`
    `Node 20.19+`
    `Custom Elements Manifest`
    `Vite + TypeScript output`
    `0 runtime service dependencies`.

24. **Keyboard navigation**
    Make the demo itself prove some of Ovlira's philosophy: excellent tab order, `/` focuses search, `Esc` closes inspect view, arrow keys move catalogue selection. No need to advertise it heavily.

25. **Command palette**
    This is one larger addition I'd seriously consider:
    `⌘K`
    then:
    `Search catalogue`
    `Inspect component`
    `Run check`
    `View tokens`
    `Open visual review`.
    It suits a developer-oriented local utility while remaining extremely minimal.

The **five I'd build next** are **recipe previews, inspect sections, validation failures/fixes, token/retrieval cost visualization, and the CLI action history**. Together those would turn the demo from “here is what Ovlira contains” into **“here is why Ovlira is useful to an agent.”**
