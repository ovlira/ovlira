# Ultra-Minimal UI Design Rules

Design interfaces with an ultra-minimal, highly intentional product aesthetic.

The UI should feel calm, precise, lightweight and engineered rather than decorated.

## Core philosophy

Reduce the interface to the smallest number of visual elements required to communicate structure and enable interaction.

Prefer:

* typography over containers
* spacing over dividers
* alignment over decoration
* text over badges
* subtle colour over filled backgrounds
* native-feeling controls over elaborate components
* progressive disclosure over permanently visible controls

Every element should earn its place.

If removing an element does not reduce usability or comprehension, remove it.

Do not attempt to make the interface feel visually impressive through decoration. Make it feel excellent through proportion, alignment, typography and interaction quality.

---

## Layout

Use a strong underlying alignment system.

Default to a single primary content column for focused interfaces.

For narrow utility/product screens:

* use a content width around `30–34em`
* centre the column horizontally
* provide approximately `1.5–1.75em` horizontal page padding
* allow generous whitespace above the application rather than pinning content against the top edge
* increase top whitespace naturally on larger screens
* reduce it on smaller screens

Do not automatically stretch interfaces across the viewport.

If the product genuinely requires tables, dashboards, editors or multi-column layouts, allow additional width while preserving the same density, typography and alignment principles.

Everything within a region should share obvious left and right edges.

Avoid arbitrary indentation.

Related controls should align precisely.

Labels, values, statuses and actions should form consistent visual columns wherever possible.

---

## Spacing

Use spacing deliberately rather than generously.

The interface should be compact without feeling cramped.

Think in a small, consistent spacing scale roughly equivalent to:

* `0.15–0.25em` — tiny relationships
* `0.35–0.5em` — closely related content
* `0.7–1em` — controls and rows
* `1.5–2em` — groups
* `2–2.5em` — major sections

Avoid excessive padding.

Most content does not need a box surrounding it.

Use larger gaps to communicate major hierarchy changes and smaller gaps to communicate relationships.

Whitespace should have meaning.

---

## Typography

Use **Inter** where available, falling back to a high-quality system sans-serif.

Typography should carry much of the visual hierarchy.

Keep the overall type scale small.

Default body copy should feel slightly more compact than a typical marketing website.

Suggested hierarchy:

### Primary page title

* approximately `1.15em`
* weight `600`
* slightly negative letter spacing around `-0.02em`

### Larger record/detail title

* approximately `1.3–1.4em`
* weight `600`
* restrained rather than dramatic

### Normal content

* regular weight
* approximately `400`
* comfortable `1.45–1.6` line-height where text wraps

### Important inline information

* weight `500`
* avoid unnecessary bold text

### Secondary/meta information

* around `0.85–0.9em`
* muted colour

### Section labels

Use tiny editorial labels rather than conventional large headings:

* approximately `0.7–0.75em`
* weight `600`
* uppercase
* letter spacing around `0.08em`
* faint colour

Avoid oversized headings.

Avoid huge dashboard numbers unless the information genuinely warrants that hierarchy.

Avoid using many font weights.

Usually `400`, `500` and `600` are sufficient.

---

## Colour system

Build the entire interface around semantic tokens rather than arbitrary component colours.

### Light theme

Use approximately:

* background: `#fff`
* primary text: `#171717`
* secondary text: `#777`
* faint text: `#aaa`
* border: `rgba(0,0,0,0.10)`
* hover surface: `rgba(0,0,0,0.055)`

### Dark theme

Use approximately:

* background: `#111`
* primary text: `#eee`
* secondary text: `#888`
* faint text: `#666`
* border: `rgba(255,255,255,0.10)`
* hover surface: `rgba(255,255,255,0.07)`

Do not simply invert colours.

Tune muted and faint colours independently for each theme.

Both themes should preserve approximately the same perceived hierarchy.

---

## Semantic colour

Colour should communicate meaning, not branding.

Reserve semantic colour for states such as:

* success / healthy
* warning / requires attention
* destructive / error

Keep these colours restrained.

Do not put every status inside a coloured pill.

Prefer coloured text alone where sufficient.

Neutral states should remain neutral.

The majority of the interface should remain monochrome.

This makes semantic colour much more meaningful when it appears.

---

## Surfaces

The page background should usually be the interface surface.

Do not default to:

* cards
* panels
* tinted sections
* floating containers
* bordered boxes

Group content structurally using spacing and typography first.

Use a border only when it genuinely clarifies a boundary.

Use shadows almost exclusively for elements that physically overlay other content, such as menus or popovers.

Even there, keep shadows subtle.

---

## Borders

Borders should be low contrast.

Use approximately `1px` with roughly `10%` opacity relative to the foreground.

Good uses include:

* row separators
* dropdown boundaries
* secondary buttons
* input underlines
* confirmation boundaries

Avoid surrounding every component with a border.

---

## Border radius

Use modest radii.

Typical values:

* `5–6px` for small controls
* `7–8px` for buttons, rows and menus

Do not make everything heavily rounded.

Avoid excessive pill-shaped UI.

Pills should primarily be used where the shape has functional meaning, such as a toggle.

---

## Buttons

Use three levels of action.

### Primary action

A compact filled button:

* foreground colour as background
* page background as text colour
* no unnecessary shadow
* around `0.65em 0.9em` padding
* approximately `7px` radius

Primary actions should be uncommon enough that they remain obvious.

### Secondary action

Use:

* transparent background
* subtle border
* normal foreground text
* same compact sizing as the primary action

### Tertiary / text action

Prefer plain text with:

* no border
* no background
* no extra padding unless required for hit area
* muted colour
* foreground colour on hover

Many interface actions should be tertiary rather than becoming visible buttons.

---

## Icon buttons

Keep icon controls extremely quiet.

Use approximately:

* `2em × 2em` hit area
* `1em` icon size
* transparent default background
* muted icon colour
* `6px` radius

On hover or keyboard focus:

* apply the subtle hover surface
* promote the icon to primary text colour

Use simple stroke icons.

Avoid colourful iconography.

Avoid putting icons into decorative circles unless functionally justified.

---

## Navigation

Navigation should look like text, not a collection of tabs.

Prefer:

`Overview    Activity    Settings`

rather than filled segmented controls.

Inactive items:

* muted text

Active item:

* normal foreground text

Do not automatically add:

* backgrounds
* borders
* underlines
* pills

Use approximately `1em` spacing between items.

Let typography communicate selection.

---

## Rows and lists

Lists should feel lightweight and information-dense.

For interactive rows:

* allow the clickable area to extend slightly beyond the text alignment
* use approximately `0.5em 0.7em` padding
* use a subtle `6–8px` hover radius
* keep the default background transparent
* reveal only a faint surface on hover

Use flex or grid alignment to place:

* identity/content on the left
* status/metadata on the right

Keep right-side metadata visually quiet.

Long primary labels should truncate gracefully rather than destroying alignment.

Secondary row context should:

* sit close beneath the primary label
* be smaller
* use faint text

Related subordinate rows may be slightly reduced in opacity until hovered, provided accessibility remains acceptable.

---

## Forms

Inputs should be visually quiet.

Prefer an underline-style input where appropriate:

* transparent background
* no surrounding box
* no radius
* subtle bottom border
* full available width
* generous enough vertical padding for usability

Placeholder text should use the faint colour.

On focus, strengthen the border slightly instead of adding a large glow.

Do not use oversized form controls.

---

## Data and field layouts

For label/value information, use aligned grids rather than cards.

A good pattern is:

`Label        Value`

with:

* muted labels
* normal values
* consistent label column width
* compact vertical spacing
* approximately `1em` column gap

Allow values to wrap when necessary.

For before/after comparisons, use aligned columns:

`Old value    →    New value`

Collapse these vertically on very narrow screens.

---

## Section structure

Separate major conceptual areas with approximately `2–2.5em` of vertical whitespace.

Use the small uppercase section-label style to establish context.

Do not put each section inside a card.

A detail screen might visually read as:

Page title
Secondary descriptor
Status

SECTION LABEL
Content

SECTION LABEL
Content

SECTION LABEL
Content

The spacing itself should make the hierarchy obvious.

---

## Status and metadata

Secondary metadata should be quiet enough that it disappears when the user is not looking for it.

Use faint text for information such as:

* timestamps
* counts
* last updated
* secondary descriptions
* supporting context

Use middle-dot separators where several short metadata values appear inline:

`24 items · Updated 2m ago · Automatic`

Avoid chips unless a chip is genuinely interactive or categorical.

---

## Menus and popovers

Menus may use a floating surface because they overlay the page.

Keep them:

* small
* narrowly sized
* subtly bordered
* lightly shadowed
* approximately `8px` radius
* compactly padded

Menu items should have transparent backgrounds by default.

Use the standard subtle hover surface on interaction.

Do not turn menus into large modal-like panels.

---

## Toggles

Keep switches small.

Use:

* neutral subtle track
* circular thumb
* semantic success colour for an enabled state where appropriate
* very short motion around `150ms`

Do not use large mobile-style switches in otherwise dense desktop interfaces.

---

## Interaction

Interactions should feel nearly instantaneous.

Animation should be functional rather than expressive.

Default transition durations should be approximately `100–180ms`.

Good animation:

* toggle movement
* subtle colour transitions
* menu appearance
* loading rotation
* small state changes

Avoid:

* spring animations
* exaggerated scaling
* bouncing
* large slide transitions
* decorative motion

The product should feel stable.

---

## Loading states

Keep loading UI inline where possible.

Prefer a short text status accompanied by a very small spinner.

Do not automatically replace the whole interface with:

* skeleton cards
* full-screen loaders
* elaborate progress animations

Preserve context while work happens.

---

## Empty states

Empty states should be concise.

Use plain language explaining:

1. what is currently true
2. the most useful next action, if one exists

Do not add illustrations merely because the screen is empty.

Do not turn empty states into marketing panels.

---

## Error states

Errors should remain integrated into the page.

Use semantic error text and clear actions.

Avoid giant red alert boxes unless the error is sufficiently severe to warrant one.

The interface should become more visually prominent only in proportion to the importance of the problem.

---

## Confirmation

Prefer inline confirmation near the initiating context when possible.

A lightweight confirmation region can use:

* a subtle top divider
* explanatory muted text
* compact Confirm and Cancel actions

Do not default every confirmation to a modal dialog.

Reserve modal interruption for decisions where losing surrounding context is acceptable or interruption is essential.

---

## Responsive behaviour

Do not redesign the entire interface for mobile.

Preserve the same hierarchy and visual language.

Primarily:

* reduce outer whitespace
* preserve readable horizontal padding
* allow navigation to wrap
* stack multi-column comparisons
* allow flexible rows to wrap where necessary
* keep touch targets usable

Responsive behaviour should feel like the same interface adapting, not a separate mobile design.

---

## Light and dark themes

Always design both themes together.

Never treat dark mode as an afterthought.

Use semantic variables such as:

`--bg`
`--text`
`--muted`
`--faint`
`--border`
`--hover`
`--good`
`--warn`
`--bad`

Components should consume semantic variables rather than hard-coded light-theme values.

Where theme selection exists:

* respect the system preference initially
* allow explicit user selection
* persist that selection

Make sure changing theme does not alter spacing, hierarchy or component geometry.

---

## Accessibility

Minimalism must not come at the cost of usability.

Ensure:

* interactive controls have adequate hit areas
* icon-only buttons have accessible labels
* keyboard focus states remain clearly perceivable
* colour is not the sole indicator of important state
* text contrast remains sufficient
* controls retain semantic HTML behaviour

A visually subtle interface can still have robust invisible accessibility semantics.

---

## Content style

Interface copy should be short and direct.

Prefer:

`Everything is up to date.`

over:

`All of your records have successfully completed the synchronization process.`

Prefer:

`Retry`

over:

`Try synchronization again`

Prefer:

`No results.`

over explanatory filler when the context already makes the meaning obvious.

Do not add helper text simply to fill space.

---

## Avoid these visual patterns

Unless the specific product genuinely requires them, avoid:

* dashboard card grids
* excessive cards
* gradients
* glassmorphism
* coloured page backgrounds
* decorative blobs
* oversized hero typography
* giant headings
* excessive icons
* icon containers
* pill-shaped navigation
* badge-heavy status systems
* heavy shadows
* thick borders
* excessive rounded corners
* floating action buttons
* excessive whitespace inside components
* unnecessarily large controls
* permanently visible secondary actions
* decorative illustrations
* arbitrary accent colours
* multiple competing font sizes
* over-designed empty states
* excessive animation

Do not make a simple interface look complex in order to make it appear designed.

---

## Decision rule

Whenever choosing between two visual solutions, choose the quieter one unless the louder treatment materially improves usability.

Before adding a visual element ask:

**Can hierarchy, alignment, typography, spacing or wording solve this instead?**

If yes, use those first.

The finished interface should feel as though almost nothing has been styled, while closer inspection reveals that every size, alignment, weight, colour and spacing decision has been carefully considered.
