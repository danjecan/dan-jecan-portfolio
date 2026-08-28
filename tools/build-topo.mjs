#!/usr/bin/env node
// Regenerates the baked topographic-contour <path>s inside <g id="topoLayer">
// on every page, using the smoothed generator in tools/topo-core.mjs.
//
//   node tools/build-topo.mjs
//
// Every page shares ONE viewBox (1600 x 1000) and renders the topo as a fixed,
// full-viewport backdrop (xMidYMid slice). Only the "bumps" differ per page, so
// each page keeps a distinct terrain while the framing/scale stay identical.
// Lines are few and faint on purpose — a texture, not a subject.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildContours } from './topo-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const VIEW_W = 1600;
const VIEW_H = 1000;
const COLS = 160;
const ROWS = 100;
const LEVELS = 34;
const SEED = 20250801;
const STROKE_OPACITY = '0.6';

// A calm, evenly-spread terrain: one softly-dominant hill near mid-frame (so it
// survives the center-crop on portrait viewports) plus gentle wide hills across
// the whole 1600x1000 field. Each page varies the focal position and the gentle
// hills so the "map" differs, but the overall density stays uniform everywhere.
const PAGES = [
  {
    file: 'index.html', peak: true, focal: { cx: 1040, cy: 360 },
    bumps: [
      { cx: 1040, cy: 360, amp: 0.62, r: 380, sy: 1.30, rot: -0.30 },
      { cx: 260, cy: 240, amp: 0.34, r: 420, sy: 1.20, rot: 0.40 },
      { cx: 220, cy: 860, amp: 0.40, r: 400, sy: 1.25, rot: 0.60 },
      { cx: 720, cy: 760, amp: 0.30, r: 360, sy: 1.40, rot: 1.00 },
      { cx: 1420, cy: 820, amp: 0.32, r: 380, sy: 1.20, rot: -0.50 },
      { cx: 1200, cy: 120, amp: 0.26, r: 340, sy: 1.30, rot: 0.20 },
    ],
  },
  {
    file: 'about.html',
    bumps: [
      { cx: 800, cy: 480, amp: 0.58, r: 400, sy: 1.35, rot: 0.20 },
      { cx: 180, cy: 300, amp: 0.36, r: 400, sy: 1.25, rot: 0.50 },
      { cx: 240, cy: 900, amp: 0.34, r: 380, sy: 1.20, rot: -0.40 },
      { cx: 1360, cy: 260, amp: 0.34, r: 400, sy: 1.30, rot: -0.30 },
      { cx: 1400, cy: 860, amp: 0.36, r: 380, sy: 1.25, rot: 0.60 },
      { cx: 900, cy: 60, amp: 0.24, r: 320, sy: 1.20, rot: 0.10 },
    ],
  },
  {
    file: 'contact.html',
    bumps: [
      { cx: 960, cy: 320, amp: 0.60, r: 380, sy: 1.35, rot: -0.30 },
      { cx: 300, cy: 200, amp: 0.34, r: 400, sy: 1.20, rot: 0.40 },
      { cx: 220, cy: 820, amp: 0.38, r: 400, sy: 1.25, rot: 0.55 },
      { cx: 780, cy: 860, amp: 0.30, r: 360, sy: 1.40, rot: 0.90 },
      { cx: 1400, cy: 640, amp: 0.34, r: 380, sy: 1.20, rot: -0.50 },
      { cx: 1320, cy: 120, amp: 0.24, r: 320, sy: 1.30, rot: 0.20 },
    ],
  },
  {
    file: 'resume.html',
    bumps: [
      { cx: 700, cy: 420, amp: 0.58, r: 400, sy: 1.35, rot: 0.30 },
      { cx: 240, cy: 260, amp: 0.40, r: 400, sy: 1.30, rot: 0.35 },
      { cx: 300, cy: 880, amp: 0.32, r: 380, sy: 1.20, rot: -0.40 },
      { cx: 1360, cy: 320, amp: 0.34, r: 400, sy: 1.25, rot: -0.30 },
      { cx: 1400, cy: 820, amp: 0.36, r: 380, sy: 1.25, rot: 0.50 },
      { cx: 950, cy: 80, amp: 0.24, r: 320, sy: 1.20, rot: 0.10 },
    ],
  },
  {
    file: 'case-studies.html',
    bumps: [
      { cx: 1000, cy: 520, amp: 0.58, r: 400, sy: 1.40, rot: 0.50 },
      { cx: 240, cy: 300, amp: 0.36, r: 400, sy: 1.20, rot: -0.40 },
      { cx: 300, cy: 880, amp: 0.34, r: 380, sy: 1.30, rot: 0.30 },
      { cx: 720, cy: 120, amp: 0.30, r: 360, sy: 1.25, rot: 0.20 },
      { cx: 1420, cy: 260, amp: 0.32, r: 380, sy: 1.20, rot: -0.30 },
      { cx: 1400, cy: 880, amp: 0.30, r: 360, sy: 1.25, rot: 0.60 },
    ],
  },
];

const SVG_RE = /(<svg class="topo-bg"[^>]*>)([\s\S]*?)(<\/svg>)/;
// The "you are here" marker lives in its own overlay SVG (same viewBox + slice,
// so it lands on the exact spot) that sits ABOVE the content layer, otherwise the
// pointer never reaches it. It is deliberately NOT inside #topoLayer, so it stays
// put while the terrain parallax-drifts under it.
const PIN_RE = /<svg class="pin-layer"[\s\S]*?<\/svg>/;

for (const p of PAGES) {
  const path = join(ROOT, p.file);
  let html = await readFile(path, 'utf8');
  if (!SVG_RE.test(html)) {
    console.error(`  ✗  ${p.file}: no <svg class="topo-bg"> found`);
    process.exitCode = 1;
    continue;
  }

  const levels = buildContours(VIEW_W, VIEW_H, SEED, COLS, ROWS, p.bumps, LEVELS);
  const paths = levels
    .filter((lv) => lv.d)
    .map((lv) => `      <path d="${lv.d}" opacity="${STROKE_OPACITY}" stroke-width="${lv.indexLine ? '1.1' : '0.7'}"></path>`)
    .join('\n');

  const svg =
    `<svg class="topo-bg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">\n` +
    `    <g id="topoLayer" fill="none" stroke="#4B5D45" stroke-linejoin="round" stroke-linecap="round">\n` +
    `${paths}\n` +
    `    </g>\n  </svg>`;

  html = html.replace(SVG_RE, svg);

  if (p.peak) {
    const { cx, cy } = p.focal || p.bumps[0];
    // Hit target first so the CSS `~` sibling combinator can reach the dot + label.
    const pinSvg =
      `<svg class="pin-layer" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">\n` +
      `    <g id="pinShift">\n` +
      `      <circle class="pin-hit" cx="${cx}" cy="${cy}" r="30"></circle>\n` +
      `      <circle class="pin-solid" cx="${cx}" cy="${cy}" r="4" fill="#B85C3C" stroke="none"></circle>\n` +
      `      <circle class="pin-dot" cx="${cx}" cy="${cy}" r="4" fill="none" stroke="#B85C3C" stroke-width="1.3"></circle>\n` +
      `      <g class="pin-label">\n` +
      `        <line x1="${cx - 8}" y1="${cy}" x2="${cx - 34}" y2="${cy}"></line>\n` +
      `        <text x="${cx - 40}" y="${cy}" text-anchor="end" dominant-baseline="middle">YOU ARE HERE</text>\n` +
      `      </g>\n` +
      `    </g>\n  </svg>`;
    if (PIN_RE.test(html)) html = html.replace(PIN_RE, pinSvg);
    else console.error(`  ✗  ${p.file}: no <svg class="pin-layer"> found — add the placeholder element`);
  }

  await writeFile(path, html);
  console.log(`  ✓  ${p.file}: ${LEVELS} contour paths${p.peak ? ' + "you are here" marker' : ''}`);
}
