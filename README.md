# Dan Jecan Portfolio

Portfolio site design for Dan Jecan, Senior UX Researcher — built with
Claude's Design canvas (Home, About, Contact, and a Design System
reference board), themed around a generated topographic-map motif.

## Structure

- `src/` — editable design source. Each `*.dc.html` file is one
  artboard (page); `canvas.json` lays them out on the canvas.
  - `Main.dc.html` — Home
  - `About.dc.html` — About
  - `Contact.dc.html` — Contact
  - `DesignSystem.dc.html` — design system reference (type, color,
    components)
- `dist/dan-jecan-basecamp.html` — the built, standalone canvas file.
  Open it directly in a browser, or publish it as a Claude Artifact to
  get a shareable, editable link.

## Resuming work

This was built with Claude Code's `/design` skill. To keep iterating:

1. Open a Claude Code session in this repo.
2. Ask Claude to update the design, referencing the files under `src/`.
3. Claude re-seeds `dist/dan-jecan-basecamp.html` from `src/` and can
   publish it as a Claude Artifact for live preview and editing.

The `dist/` file is generated — treat `src/` as the source of truth
when making changes by hand.
