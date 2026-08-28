# Dan Jecan Portfolio

Portfolio site for Dan Jecan, Senior UX Researcher — Home, About,
Resume, Contact, and case studies, themed around a generated
topographic-map motif.

**Live site:** https://danjecan.github.io/dan-jecan-portfolio/
**Repo:** https://github.com/danjecan/dan-jecan-portfolio

## What's here

- `index.html`, `about.html`, `contact.html`, `resume.html`,
  `case-studies.html` — the whole site. Plain static HTML/CSS/JS, no
  build step, no runtime dependencies (Google Fonts is the only
  external asset). Self-contained pages with semantic
  `<nav>` / `<main>` / `<footer>` landmarks; decorative SVGs marked
  `aria-hidden`. Responsive, mobile breakpoint at 640px.
  - `contact.html` — no form; a `mailto:` button plus real LinkedIn /
    Facebook links.
  - `resume.html` — a deliberately scannable CV: company names as the
    visual anchor, dates in a right rail, one line of context each.
    `@media print` strips the chrome for Ctrl-P.
  - `case-studies.html` — a tabbed panel of six write-ups. See below.
- `tools/` — small Node scripts that regenerate baked content:
  `build-topo.mjs` / `topo-core.mjs` (the topographic backgrounds) and
  `build-case-studies.mjs` (the case-study data). Not needed to serve
  the site; run them after editing their inputs, then commit the HTML.

## Design system (the "kit")

All five pages share one CSS block at the top of their `<style>` — the
same `:root` tokens and the same rules for `body`, `.container` /
`.container-narrow`, `.nav-*`, `.topo-bg` / `.scrim` / `.lamp`,
`.eyebrow`, `.lead`, `.btn` (+ `-primary` / `-ghost` / `-rust` /
`-block`), `.tag`, `.footer-*`, and the shared mobile overrides.
Everything below that block is page-specific and written against the
tokens. There's no shared stylesheet (self-contained pages), so **the
kit is duplicated into each file** — change it in one place and paste
to the others.

- **Colour:** `--ink` headings, `--text` body, `--text-soft`
  secondary, `--muted` meta/labels; `--accent` green (one CTA colour),
  `--rust` the single warm accent; `--rule` / `--rule-soft` hairlines;
  `--bg` / `--surface` / `--feature` (tan callout).
- **Type:** Domine (`.display`) for headings, Karla for everything
  else. Body 16px / 1.65. One fluid `clamp()` per heading level; a
  `.lead` for intros; a green `.eyebrow` above each page title and a
  small uppercase kicker for in-page section labels.
- **Layout:** every page shares one left rail. `.container` (1160px,
  centred) holds the nav and footer; `.container-narrow` uses the same
  box but caps its children at 760px, so the reading column starts at
  the same left edge as the nav on every page. Each page opens with a
  `.eyebrow` label at an identical x/y, then the heading. Contact is a
  two-column grid that stacks below 720px; Home keeps a wider hero.
  `.page` is a flex column with a sticky footer;
  `html { overflow-y: scroll }` reserves the scrollbar gutter.
- **Cursor:** the OS cursor is untouched for reading; on hover over
  interactive elements a small hollow rust ring shows via an inline
  SVG data-URI, gated to `@media (hover: hover) and (pointer: fine)`.

## Topographic backgrounds

Marching squares over a noise field of a few smooth "hills" — not
hand-drawn. The raw output is disconnected line segments, so the
generator **stitches them into continuous polylines and emits
quadratic-bezier paths through the segment midpoints**; without that
last step the small innermost loops render as visible polygons instead
of circles.

- `tools/topo-core.mjs` — the generator (stitch + smooth).
- `tools/build-topo.mjs` — one shared frame
  (`viewBox 0 0 1600 1000`, `xMidYMid slice`) for every page; only the
  per-page `bumps` differ. `node tools/build-topo.mjs` bakes the
  `<path>`s into `<g id="topoLayer">` on all five pages, plus Home's
  `<svg class="pin-layer">` "you are here" marker and its dotted summit
  trail. Commit the HTML.
- The topo is a **fixed, full-viewport backdrop** on every page. Paths
  are baked faint; a cursor **"lantern"** does the rest — `.scrim` is a
  radial gradient centred on `--mx`/`--my` (eased from the pointer in
  the page script) that goes from transparent at the cursor to a cream
  veil beyond ~300px, so the map is a whisper everywhere and crisp
  where you look. A `.lamp` div adds a warm `mix-blend-mode: screen`
  glow. Gated to `@media (hover: hover) and (pointer: fine)`;
  `prefers-reduced-motion` swaps in a static vignette; touch gets a
  flat veil. The terrain also parallax-drifts (slower than the light);
  Home's pin and trail ride the same drift.

## Case studies

The Wizz Air / Cisco / Brenntag / Bosch / Netflix / Medocity write-ups
are **public**. `tools/case-studies.content.json` is the source; it is
the *declassified* copy — no client metrics, no internal system names,
no attributed failures. `case-studies.html` is a **tabbed panel**, one
case study at a time, one tab per client, deep-linkable
(`case-studies.html#netflix`, and the Home page's case rows link
straight to the matching tab), arrow-key navigable.

Each study follows the same shape (see
`tools/case-studies.content.example.json`): `key`, `company` (the tab
label), `title`, `summary` (a short lead), an optional `pull` (a
participant quote if `by` is set, otherwise a one-line takeaway,
dropped in after "What we found"), a `meta` block (`role`, `team`,
`timeline`, `methods[]`, rendered as a small card plus method chips),
and a `sections` array of `{ "h": heading, "body": text }` with the
same six headings every time (Context, The question, Approach, What we
found, Impact, What I'd do differently) so the studies stay scannable
side by side. "What I'd do differently" renders as a tinted reflection
block. Blank line between paragraphs in a body.

To edit: change `tools/case-studies.content.json`, run
`node tools/build-case-studies.mjs` (it injects the JSON into
`case-studies.html` as plain `CS_DATA` between the `/*CS_DATA…*/`
markers), then commit `case-studies.html` and the JSON.

## Notes

- `resume.html` content is real (from Dan's resume + LinkedIn export,
  Aug 2026); the phone number is deliberately left off this public
  page. The International Mountain Leader line comes from the About
  page. "Instructure = education-technology" and the "Senior UX
  Researcher" title for UX studio are inferences from LinkedIn, not
  from explicit job descriptions.
- `contact.html` / `case-studies.html` open external links in a new
  tab with `rel="noopener noreferrer"`.
- Pointer parallax on the topo moves the inner `<g>` by up to
  `sx * 42` px; disabled under `prefers-reduced-motion` and below
  640px, and (like any `requestAnimationFrame` loop) paused while the
  tab is backgrounded.
