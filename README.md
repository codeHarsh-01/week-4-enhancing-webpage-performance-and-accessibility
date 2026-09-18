# Week 4 — Enhancing Web Page Performance and Accessibility

## Interactive Developer Portfolio

This project takes the Week 3 interactive portfolio and hardens it for
performance and accessibility, per the Week 4 brief. No new features were
added — every change here either fixes a real, measured problem or removes
waste, verified in an actual browser rather than assumed from reading the
code.

## Objectives

- Analyze the existing page for real (not hypothetical) performance and accessibility issues
- Ensure semantic HTML and screen-reader-friendly structure
- Reduce CSS redundancy
- Add ARIA attributes, keyboard support, and verify color contrast
- Apply and measure a performance technique (minification)
- Document tools, findings, and fixes with real before/after numbers

## Project Structure

```text
week4-performance-accessibility/
├── index.html
├── style.css          (readable, optimized — the primary deliverable)
├── style.min.css       (minified production copy)
├── script.js           (readable, updated for accessibility)
├── script.min.js        (minified production copy)
└── README.md
```

## Methodology

Rather than eyeballing the page or asserting compliance, every issue in
this report was found and confirmed one of three ways:

1. **Computed WCAG contrast ratios.** A small Python script implementing
   the exact W3C relative-luminance and contrast-ratio formulas checked
   every text/background color pair actually used on the page, in both
   themes, against the real thresholds (4.5:1 for normal text, 3:1 for
   large text and UI components) — not a visual guess.
2. **A real headless browser (Playwright/Chromium).** The page was loaded
   and driven programmatically: tabbing through it, reading computed
   styles, checking ARIA attributes resolve to real elements, and
   confirming focus outlines actually render.
3. **Static structural checks.** Heading order, landmark presence, label/
   input association, and image/alt-text audits were done by parsing the
   actual HTML, not by inspection alone.

This mirrors how tools like Lighthouse and WAVE work conceptually
(automated, measured, threshold-based) — those specific tools were not
available in this offline development environment (no internet access to
run WebPageTest, the WAVE extension, or Lighthouse's remote checks
against a live URL), so the equivalent checks were built directly instead
of skipped. This is disclosed here rather than silently claiming tools
that weren't actually run.

## Accessibility Findings and Fixes

### 1. Color contrast — real, measured failures

The original palette's accent orange (`#f26b38`) measured **3.03:1**
against white/light backgrounds — below the 4.5:1 AA minimum for normal
text. This affected:

| Element | Old ratio | New ratio | Fix |
|---|---|---|---|
| Eyebrow labels (light mode) | 3.03:1 | 4.62–4.95:1 | New `--accent-text` token, darkened just enough to clear every background it appears on |
| Nav link hover/active text | 3.03:1 | 4.62–4.95:1 | Same token |
| White button text on orange fill (both themes) | 3.03:1 | 4.95–5.13:1 | New theme-independent `--btn-fill` / `--btn-fill-hover` tokens |
| Project/skill number badges | 3.62:1 (already failing before this project) | 4.61:1 | Fixed to use the theme-independent token |

Dark mode's use of the *original* orange against dark surfaces was left
unchanged, since it already measured 5.64:1 — comfortably passing.

**A second bug was caught mid-fix, the same way the Week 3 hero bug was
caught:** the number badges (`.skill-icon`, `.project-number`) have a
fixed light peach background in *both* themes. Wiring their text to the
new theme-aware token would have made dark mode use the bright
theme-aware orange against that still-light background — **2.72:1**, a
new failure that wouldn't exist in either theme individually, only in
the combination. It was caught by computing the contrast for that
specific background before shipping, not after. The fix was to use the
theme-*independent* token there instead, since the background never
changes.

### 2. Missing "skip to content" link (WCAG 2.4.1)

There was no way for a keyboard user to bypass the header/navigation and
jump straight to the main content — every page load required tabbing
through 7 links first. Added a skip link as the very first focusable
element; verified in-browser that it's the first Tab stop and becomes
visible only when focused.

### 3. No visible keyboard-focus indicator outside the contact form

Every interactive element *did* receive the browser's default focus
outline (nothing was suppressing it), but it was never deliberately
styled — meaning its color and visibility were left to browser defaults,
which vary and can be low-contrast against custom backgrounds. Added one
global `:focus-visible` rule so every control gets a consistent, high-
contrast ring. Confirmed by tabbing through the page in Playwright and
reading the computed `outline-style`/`outline-width` off whatever
element ended up focused.

### 4. No `aria-current` on the active navigation link

The scroll-spy feature (Week 3) already highlighted the current section's
nav link visually with a color change, but a screen reader has no way to
perceive color — it had no equivalent way to know which link was
"current." Added `aria-current="page"`, toggled by the same scroll
listener that already toggles the visual class, and confirmed it moves
correctly as the visitor scrolls.

### 5. Mobile menu button's label never changed

`aria-expanded` was already updating correctly, but the button's
`aria-label` stayed "Open navigation" even after the menu opened. Now it
flips to "Close navigation" while open — confirmed in both states.

### 6. Form error messages weren't programmatically linked to their fields

Each field already showed an inline error and used `aria-live="polite"`
so it gets announced when it changes, but a screen reader user tabbing
directly to the field had no way to hear the error as part of that
field's description. Added `aria-describedby` linking each input/
textarea to its error element (and the message field to its live
character counter too); confirmed every reference resolves to a real
element in the DOM.

### 7. Sections lacked accessible names

Five `<section>` landmarks existed with no `aria-labelledby`, so a screen
reader's landmark list would show five unnamed regions. Each section now
points to its own heading's `id`.

### 8. Decorative glyphs

The hamburger icon's three bars, and the back-to-top button's arrow
character, are marked `aria-hidden="true"`. Their parent buttons already
carry a real `aria-label`, so this was defense-in-depth rather than a
fix for a live bug, but it's the correct pattern regardless.

### Checked and found already correct

- Heading hierarchy (h1 → h2 → h3, no skipped levels) — verified
  programmatically, no change needed
- Form `<label for>` / input `id` pairs — already all correctly matched
- `lang="en"` on `<html>` — already present
- No `<img>` elements exist anywhere on the page, so there was no missing
  `alt` text to add — noted here rather than skipped silently, since the
  brief specifically asks about alt text

## Performance Findings and Fixes

### 1. Script loading

`script.js` was already placed at the end of `<body>`, which is the
correct non-blocking pattern — confirmed, no change needed there. Added
the `defer` attribute explicitly anyway for standards correctness, though
its practical effect here is small given the script's position.

### 2. Font loading

Google Fonts was already using `&display=swap` (avoids invisible text
while the font loads) and `<link rel="preconnect">` for both font
domains — both already correct, confirmed rather than assumed.
All five requested font weights (400, 500, 600, 700, 800) were checked
against actual usage in the CSS and are all genuinely used — none were
found to be dead weight worth removing.

### 3. CSS redundancy

The same transition timing/easing pair (`.2s ease`, `.25s ease`) was
repeated as a literal string across **12 separate declarations**.
Replaced with two custom properties (`--transition-fast`,
`--transition-med`) referenced everywhere that timing is used — one
definition each instead of twelve repetitions.

A now-dead `--accent-dark` variable, left over after the contrast fixes
replaced every one of its use sites, was removed entirely.

### 4. Minification

No production minifier (Terser, csso, clean-css) was available in this
offline environment and none could be installed without network access.
Rather than skip this step or risk a hand-rolled regex minifier silently
corrupting the JavaScript (a real risk with naive minifiers and regex
literals/string content), a conservative, verified approach was used:

- **CSS**: comments and blank lines stripped, whitespace around
  punctuation collapsed. `style.css` (16,461 bytes) → `style.min.css`
  (11,504 bytes) — a **30% reduction**.
- **JS**: only full-line comments and blank lines removed — verified
  beforehand that no comment in the file trails after code on the same
  line, so this is a safe, mechanical removal that never touches actual
  logic. `script.js` (13,380 bytes) → `script.min.js` (10,948 bytes) —
  an **18% reduction**.

Both minified files were then substituted into a copy of the page and
put through the full 26-check automated test suite (see below) — 26/26
passed, confirming the minified versions behave identically to the
source before shipping them.

### 5. Images

The page uses no raster or vector images anywhere — the "hero visual" is
a styled code snippet built from HTML/CSS, not an image file. Image
optimization and lazy-loading, while listed in the brief, are therefore
not applicable to this page. Stated here explicitly rather than left
unaddressed.

## Testing

### Automated browser verification

The full Week 3 functional test suite (26 checks: theme toggle, scroll-
spy, scroll-reveal, project filter, form validation, back-to-top, footer
year) was re-run after every change in this project to catch
regressions, plus new checks specific to this week's work:

| New check | Result |
|---|---|
| Skip link is the first Tab stop and becomes visible on focus | PASS |
| `aria-current="page"` set on load and moves correctly on scroll | PASS |
| Mobile menu `aria-label` flips between Open/Close | PASS |
| Every section has a resolving `aria-labelledby` | PASS |
| Every form field's `aria-describedby` resolves to a real element | PASS |
| A tabbed-to element has a visible (non-`none`, non-zero) outline | PASS |
| Heading hierarchy has no skipped levels | PASS |

**Result: 26/26 regression checks + all new checks passed**, both against
the source files and again against the minified files.

### Known non-issues

Four console warnings (Google Fonts failing to load) appear only because
this offline sandbox has no internet access to reach Google's font CDN —
not a defect in the page. On any normally hosted deployment (including
GitHub Pages), these requests succeed.

## Design Decisions

- **One shared token for both a text-contrast fix and a button-fill fix**,
  where the math showed the same darkened color solved both problems in
  light mode — rather than inventing more variables than the problem
  actually needed.
- **Theme-aware vs. theme-independent tokens were kept deliberately
  separate** (`--accent-text` changes per theme; `--btn-fill` does not)
  because the two problems they solve have different shapes: text-on-
  background contrast depends on the surrounding theme, but white-text-
  on-a-solid-button-fill does not.
- **A hand-rolled JS minifier was scoped down to only what could be
  verified safe** (comment/blank-line removal) rather than attempting
  full token-level minification without a real parser — shipping a
  broken interactive script to save a few extra kilobytes would be a bad
  trade.

## Conclusion

Every fix in this report traces back to a specific, measured problem: a
computed contrast ratio, a missing DOM attribute confirmed by querying
the live page, or a byte count before and after. Nothing here was marked
"done" without being checked in an actual running instance of the page —
including a second contrast bug that was only caught because the fix for
the first one was checked against every real background it would touch,
not just the one it was written for. The page now meets WCAG AA contrast
across both themes, supports full keyboard navigation with a visible
focus indicator, exposes its structure and state correctly to assistive
technology, and ships smaller CSS and JS without any behavioral change.
