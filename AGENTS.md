# AGENTS.md — danjecan.com

Shared instructions for any AI assistant or IDE working in this repo (Claude, ChatGPT/Codex, Cursor, Copilot…). `CLAUDE.md` just imports this file, so edit here only.

## What this is
Dan Jecan's portfolio site (Senior UX Researcher): Home, About, Resume, Contact, Case studies.
Domain: danjecan.com (see `CNAME`), served by GitHub Pages from `main`.
Repo: github.com/danjecan/dan-jecan-portfolio · Local: `~/Documents/Projects/danjecan.com`

**Read `README.md` first.** It documents the design system, topo backgrounds and case-study pipeline in detail.

## Ground rules
- Plain static HTML/CSS/JS. No framework, no build step, no runtime dependencies. Keep it that way.
- Each page is self-contained: the shared CSS "kit" is **duplicated in all five pages**. A change to the kit goes into every page.
- Generated content: run `node tools/build-topo.mjs` (backgrounds) or `node tools/build-case-studies.mjs` (case studies) after editing their inputs, then commit the generated HTML too.
- Case studies are public and **declassified**: no client metrics, internal system names or attributed failures.
- No phone number on public pages.
- Keep it accessible: landmarks, contrast, `prefers-reduced-motion`, works at 320px.

## Preview locally
`python3 -m http.server 8000`, then open http://localhost:8000

## Git
- Work on `main` for small changes; use a branch for anything larger. Commit messages: short imperative sentence.
- Pushing to `main` publishes the live site.
