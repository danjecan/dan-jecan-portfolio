#!/usr/bin/env node
/**
 * Injects tools/case-studies.content.json into case-studies.html as plain
 * CS_DATA, between the CS_DATA markers.
 *
 * The case studies are public. This is the declassified copy — no client
 * metrics, no internal system names, no attributed failures. Edit the JSON,
 * run this, commit case-studies.html.
 *
 *   node tools/build-case-studies.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'tools', 'case-studies.content.json');
const CONTENT_EXAMPLE = join(ROOT, 'tools', 'case-studies.content.example.json');
const TARGET = join(ROOT, 'case-studies.html');

let contentPath = CONTENT;
try {
  await readFile(CONTENT, 'utf8');
} catch {
  contentPath = CONTENT_EXAMPLE;
  console.warn('\n  ⚠  tools/case-studies.content.json not found — using case-studies.content.example.json (placeholder text).\n');
}

const raw = JSON.parse(await readFile(contentPath, 'utf8'));
const data = { studies: raw.studies };

const block = `/*CS_DATA_START*/\n  const CS_DATA = ${JSON.stringify(data)};\n  /*CS_DATA_END*/`;
const html = await readFile(TARGET, 'utf8');
const re = /\/\*CS_DATA_START\*\/[\s\S]*?\/\*CS_DATA_END\*\//;
if (!re.test(html)) {
  console.error('  ✗  Could not find the /*CS_DATA_START*/ … /*CS_DATA_END*/ markers in case-studies.html');
  process.exit(1);
}
await writeFile(TARGET, html.replace(re, block));

console.log(`  ✓  Injected ${raw.studies.length} case studies into case-studies.html (${JSON.stringify(data).length} chars)\n`);
