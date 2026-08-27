#!/usr/bin/env node
/**
 * Encrypts tools/case-studies.content.json and injects the ciphertext into
 * case-studies.html between the CS_DATA markers.
 *
 * The site only ever ships the AES-GCM ciphertext — the plaintext case-study
 * content is never in the published HTML. Visitors type the password, the
 * browser derives the key (PBKDF2-SHA256) and decrypts client-side.
 *
 * Usage:
 *   CASE_STUDIES_PASSWORD='the real password' node tools/build-case-studies.mjs
 *
 * Then commit case-studies.html. Keep case-studies.content.json private
 * (it's gitignored) and share the password only with people you trust.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'tools', 'case-studies.content.json');
const CONTENT_EXAMPLE = join(ROOT, 'tools', 'case-studies.content.example.json');
const TARGET = join(ROOT, 'case-studies.html');
const PBKDF2_ITERATIONS = 150000;

const password = process.env.CASE_STUDIES_PASSWORD || 'preview';
if (password === 'preview') {
  console.warn('\n  ⚠  CASE_STUDIES_PASSWORD not set — encrypting under the placeholder password "preview".');
  console.warn('     Set a real password before publishing real content:\n');
  console.warn("       CASE_STUDIES_PASSWORD='…' node tools/build-case-studies.mjs\n");
}

let contentPath = CONTENT;
try {
  await readFile(CONTENT, 'utf8');
} catch {
  contentPath = CONTENT_EXAMPLE;
  console.warn('\n  ⚠  tools/case-studies.content.json not found — using case-studies.content.example.json (placeholder text).');
  console.warn('     Copy it to case-studies.content.json and fill in the real write-ups.\n');
}
const raw = JSON.parse(await readFile(contentPath, 'utf8'));
const plaintext = new TextEncoder().encode(JSON.stringify({ studies: raw.studies }));

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt']
);
const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

const b64 = (u8) => Buffer.from(u8).toString('base64');
const payload = {
  v: 1,
  iter: PBKDF2_ITERATIONS,
  salt: b64(salt),
  iv: b64(iv),
  ct: b64(new Uint8Array(cipherBuf))
};

const block = `/*CS_DATA_START*/\n  const CS_PAYLOAD = ${JSON.stringify(payload)};\n  /*CS_DATA_END*/`;
const html = await readFile(TARGET, 'utf8');
const re = /\/\*CS_DATA_START\*\/[\s\S]*?\/\*CS_DATA_END\*\//;
if (!re.test(html)) {
  console.error('  ✗  Could not find the /*CS_DATA_START*/ … /*CS_DATA_END*/ markers in case-studies.html');
  process.exit(1);
}
await writeFile(TARGET, html.replace(re, block));

console.log(`  ✓  Encrypted ${raw.studies.length} case studies into case-studies.html`);
console.log(`     password: ${password === 'preview' ? '"preview" (placeholder)' : '(from CASE_STUDIES_PASSWORD)'}`);
console.log(`     ciphertext: ${payload.ct.length} base64 chars\n`);
