# Dan Jecan Portfolio

Portfolio site design for Dan Jecan, Senior UX Researcher — built with
Claude's Design canvas (Home, About, Contact, and a Design System
reference board), themed around a generated topographic-map motif.

**Live site:** https://danjecan.github.io/dan-jecan-portfolio/

## Structure

- `index.html`, `about.html`, `contact.html` — the actual browsable
  static site (real navigation between pages), served by GitHub Pages.
  Self-contained, no build step, no dependencies.
- `src/` — the editable Claude Design source. Each `*.dc.html` file is
  one artboard; `canvas.json` lays them out on the canvas.
  - `Main.dc.html` — Home
  - `About.dc.html` — About
  - `Contact.dc.html` — Contact
  - `DesignSystem.dc.html` — design system reference (type, color,
    components) — not part of the public site
- `dist/dan-jecan-basecamp.html` — the built Claude Design canvas
  (the editor view, with all artboards on one pan/zoom surface). Open
  it directly in a browser, or publish it as a Claude Artifact to get
  a shareable, editable link.

`index.html` / `about.html` / `contact.html` are generated from the
`src/` design (including the procedurally-generated topographic
background), but with the templating resolved to plain HTML/CSS/JS so
they run anywhere with no runtime dependency.

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
