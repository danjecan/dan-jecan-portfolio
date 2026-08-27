# Dan Jecan Portfolio

Portfolio site for Dan Jecan, Senior UX Researcher — Home, About,
Resume, Contact, and password-protected case studies, themed around a
generated topographic-map motif. The Home / About / Contact pages
started life on a Claude Design canvas (`src/`); Resume and Case
studies are static-only additions in the same visual language.

**Live site:** https://danjecan.github.io/dan-jecan-portfolio/
**Editable Claude Design canvas:** (removed)
**GitHub repo:** https://github.com/danjecan/dan-jecan-portfolio (public)

## Structure

- `index.html`, `about.html`, `contact.html`, `resume.html`,
  `case-studies.html` — the actual browsable static site (real
  navigation between pages), served by GitHub Pages. Self-contained, no
  build step, no runtime dependencies. Responsive (640px mobile
  breakpoint). Every page has semantic `<nav>` / `<main>` / `<footer>`
  landmarks and decorative SVGs marked `aria-hidden`.
  - `contact.html` — no form. Direct `mailto:` button plus LinkedIn /
    Facebook links (real URLs).
  - `resume.html` — standalone, deliberately scannable CV: company
    names as the visual anchor, dates in a right rail, one line of
    context each. Three roles (Instructure, UX studio, Kleffmann) plus
    Education / Languages / "Also". No download button — recruiters
    have the LinkedIn link. `@media print` still strips the chrome for
    Ctrl-P. Content transcribed from Dan's resume + LinkedIn export
    (Aug 2026); phone number deliberately omitted from this public page.
  - `case-studies.html` — password-gated. See below.
- `tools/` — `build-case-studies.mjs` (case-studies encryption, see
  below) and `build-topo.mjs` / `topo-core.mjs` (topo backgrounds, see
  "Topographic backgrounds").
- `src/` — the editable Claude Design source. Each `*.dc.html` file is
  one artboard; `canvas.json` lays them out on the canvas.
  - `Main.dc.html` / `About.dc.html` / `Contact.dc.html` — desktop
    pages (1440px frames)
  - `MainMobile.dc.html` / `AboutMobile.dc.html` /
    `ContactMobile.dc.html` — dedicated phone-frame artboards (390px),
    separate from the desktop ones and from the responsive static site
  - `DesignSystem.dc.html` — design system reference (type, color,
    components) — not part of the public site
- `dist/dan-jecan-basecamp.html` — the built Claude Design canvas
  (the editor view, with all artboards on one pan/zoom surface). Open
  it directly in a browser, or publish it as a Claude Artifact to get
  a shareable, editable link.

`index.html` / `about.html` / `contact.html` are generated from the
`src/` design (including the procedurally-generated topographic
background), but with the templating resolved to plain HTML/CSS/JS so
they run anywhere with no runtime dependency. `resume.html` and
`case-studies.html` are static-only — they follow the same visual
language but have no `src/` artboard yet.

## Design system (the "kit")

All five pages share one CSS block at the top of their `<style>` — the
same `:root` tokens and the same rules for `body`, `.container` /
`.container-narrow`, `.nav-*`, `.topo-bg` / `.scrim`, `.eyebrow`,
`.lead`, `.btn` (+ `-primary` / `-ghost` / `-rust` / `-block`), `.tag`,
`.footer-*`, and the shared mobile overrides. Everything below that
block is page-specific and written against the tokens. There's no
shared stylesheet (self-contained pages), so **the kit is duplicated
into each file** — change it in one place and paste to the others, or
ask Claude to.

- **Colour:** `--ink` headings, `--text` body, `--text-soft`
  secondary, `--muted` meta/labels; `--accent` green (one CTA colour),
  `--rust` the single warm accent (case-study links, the one rust
  button); `--rule` / `--rule-soft` hairlines; `--bg` / `--surface` /
  `--feature` (tan callout).
- **Type:** Domine (`.display`) for headings, Karla for everything
  else. Body 16px / 1.65. One fluid `clamp()` per heading level; a
  `.lead` for intro paragraphs; a `.eyebrow` (green) above page
  titles and a small uppercase kicker (`.r-block > h2`,
  `.cs-section h3`, `.section-label`) for in-page section labels.
- **Layout:** every page shares one left rail. `.container` (1160px,
  centred) holds the nav and footer; `.container-narrow` uses the same
  1160px box and caps its children at 760px (`.container-narrow > *`),
  so the reading column starts at the *same* left edge as the nav bar
  and footer links on every page rather than being centred. Each page
  opens with a `.eyebrow` label ("Senior UX Researcher" / "About" /
  "Resume" / "Contact" / "Case studies") at an identical x/y, then the
  heading. Contact is the same 1160 box as a two-column grid (copy
  left, card right) that stacks below 720px; Home keeps a wider hero.
  `.page` is a flex column with a sticky footer;
  `html { overflow-y: scroll }` reserves the scrollbar gutter so
  nothing shifts between short and tall pages.
- **Components:** one `.card` recipe (radius 16, soft shadow, fluid
  padding); pill buttons via `.btn`; non-interactive pills via `.tag`.
- **Cursor:** the OS cursor is untouched for reading; on hover over
  interactive elements (`a[href]`, `button`, `[role="button"]`,
  `.case-row`, …) a small hollow rust ring — matching the topo summit
  marker — shows via an inline SVG data-URI, gated to
  `@media (hover: hover) and (pointer: fine)` with a `, pointer`
  fallback.

## Case studies (password-protected)

The Bosch / Wizz Air / Netflix / Medocity write-ups are confidential.
`case-studies.html` only ever ships an **AES-GCM ciphertext** — the
plaintext is never in the published HTML. A visitor types the
password, the browser derives a key (PBKDF2-SHA256, 150k iterations)
and decrypts client-side. Unlock is remembered for the browser session
(`sessionStorage`); "Lock again" clears it.

To publish real content:

1. `cp tools/case-studies.content.example.json tools/case-studies.content.json`
   (the real file is `.gitignore`d — keep a private backup).
2. Edit `tools/case-studies.content.json` — each study has a `sections`
   array of `{ "h": heading, "body": text }`; separate paragraphs with
   a blank line.
3. `CASE_STUDIES_PASSWORD='the real password' node tools/build-case-studies.mjs`
   — this re-encrypts and rewrites the `CS_PAYLOAD` block in
   `case-studies.html`.
4. Commit `case-studies.html`. Share the password out-of-band (the
   Contact page tells people to email for it).

Shipped as-is, the page is encrypted under the placeholder password
`preview` with placeholder text, so the flow is testable but nothing
real is exposed.

## Resuming work

This was built with Claude Code's `/design` skill. To keep iterating:

1. Open a Claude Code session in this repo.
2. Ask Claude to update the design, referencing the files under `src/`.
3. Claude re-seeds `dist/dan-jecan-basecamp.html` from `src/`, can
   publish it as a Claude Artifact for live preview and editing, and
   regenerates `index.html` / `about.html` / `contact.html` for the
   public site.

Treat `src/` as the source of truth — `dist/` and the root HTML pages
are both generated from it.

## Gotchas already solved (don't rediscover these)

- `canvas.json`'s `launch` is set to `{"view":"focused","file":"Main.dc.html"}`
  on purpose — opening straight into the full canvas overview
  (`{"view":"canvas"}`) lands off-screen once enough artboards make
  the bounding box very tall (an editor first-load camera-fit race,
  not a content bug). "Fit artboards" from the toolbar still works
  fine once clicked manually.
- `index.html` / `about.html` / `contact.html` are hand-ported from
  `src/` with the Design Components templating resolved to plain
  JS/CSS — there's no automated build script for the text/markup, so
  after editing `src/` regenerate these by hand (or ask Claude to).

## Topographic backgrounds

Marching squares over a noise field of a few smooth "hills" — not
hand-drawn. The raw output is disconnected line segments, so the
generator **stitches them into continuous polylines and emits
quadratic-bezier paths through the segment midpoints**; without that
last step the small innermost loops render as visible 4- and 6-sided
polygons instead of circles.

- `tools/topo-core.mjs` — the generator (stitch + smooth).
- `tools/build-topo.mjs` — one shared frame (`viewBox 0 0 1600 1000`,
  `xMidYMid slice`, `opacity 0.32`) for every page; only the per-page
  `bumps` differ. `node tools/build-topo.mjs` bakes the `<path>`s into
  `<g id="topoLayer">` on **all five** pages; Home's `<circle>` summit
  marker is emitted too. Commit the HTML.
- The topo is a **fixed, full-viewport backdrop** on every page
  (`.topo-bg { position: fixed; inset: 0 }`). Paths are baked at
  `opacity 0.6`; a **cursor "lantern"** does the rest — `.scrim` is a
  radial gradient centred on `--mx`/`--my` (set from the pointer,
  eased at 0.16 in the page script) that goes from ~fully transparent
  at the cursor to a ~0.9 cream veil beyond ~300px, so the map is a
  faint whisper everywhere and brightens to crisp where you look
  ("mapping the unknown"). A second `.lamp` div adds a warm
  `mix-blend-mode: screen` glow. Gated to
  `@media (hover: hover) and (pointer: fine)`; `prefers-reduced-motion`
  swaps in a static off-centre vignette; touch gets a flat `0.82`
  veil. Terrain also parallax-drifts (slower than the light, for
  depth). The scroll-progress "trail" that used to be on
  Home/About/Contact has been removed.
- `src/Main|About|Contact.dc.html` carry an ES5 port of the same
  stitch+smooth inside their `buildContours`, but with their own older
  per-artboard bump sets — the canvas hasn't been re-seeded to the
  1600×1000 frame. `dist/dan-jecan-basecamp.html` is likewise a stale
  build artifact; re-seed from `src/` via the design skill to catch up.
- The `src/` navs now list a "Resume" link for parity with the static
  site, but it points at `#` — there is no Resume artboard on the
  canvas. The `*Mobile.dc.html` artboards were left with the old
  3-item nav (a 4th link is too tight at 390px).
- `resume.html` content is real (from Dan's resume + LinkedIn). The
  International Mountain Leader line comes from the About page, not the
  resume docs. Instructure is described as "education-technology" by
  inference from the company + LinkedIn top skills, not from an
  explicit job description. UX studio title shown as "Senior UX
  Researcher" per LinkedIn (the older PDF says "UX Researcher").
- Pointer parallax on the topo background moves the inner `<g>` by up
  to `sx * 42` px (was `24`; bumped for visibility). It only responds
  to `mousemove` — no effect on touch devices — is disabled under
  `prefers-reduced-motion` and below 640px, and (like any
  `requestAnimationFrame` loop) pauses while the tab is backgrounded.
  All five pages use the same value.
- `contact.html` / `case-studies.html` open external links
  (`linkedin.com/in/danjecan`, `facebook.com/danjecan`) in a new tab
  with `rel="noopener noreferrer"`.
