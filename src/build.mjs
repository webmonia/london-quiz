// Сглобява index.html: вмъква шрифтовете, гербовете и химна директно във файла,
// за да работи играта без интернет.
// Стартиране: node src/build.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(ROOT, 'src', 'trivia.template.html');
const OUTPUT = path.join(ROOT, 'index.html');
const ASSETS_DIR = path.join(ROOT, 'assets');
const PLACEHOLDER_PATTERN = /\{\{[A-Z0-9_]+\}\}/g;
const BYTES_IN_MB = 1024 * 1024;

const MIME = Object.freeze({
  WOFF2: 'font/woff2',
  SVG: 'image/svg+xml',
  PNG: 'image/png',
});

const toBase64 = async (file) => (await readFile(path.join(ASSETS_DIR, file))).toString('base64');
const toDataUri = async (file, mime) => `data:${mime};base64,${await toBase64(file)}`;

const PLACEHOLDERS = Object.freeze({
  FONT_NUNITO_CYRILLIC: () => toDataUri('fonts/nunito-cyrillic.woff2', MIME.WOFF2),
  FONT_NUNITO_LATIN: () => toDataUri('fonts/nunito-latin.woff2', MIME.WOFF2),
  FONT_UNBOUNDED_CYRILLIC: () => toDataUri('fonts/unbounded-cyrillic.woff2', MIME.WOFF2),
  FONT_UNBOUNDED_LATIN: () => toDataUri('fonts/unbounded-latin.woff2', MIME.WOFF2),
  ARMS_ENGLAND: () => toDataUri('arms-england.svg', MIME.SVG),
  ARMS_UK: () => toDataUri('arms-uk.png', MIME.PNG),
  ANTHEM_MP3_BASE64: () => toBase64('anthem.mp3'),
});

const build = async () => {
  const template = await readFile(TEMPLATE, 'utf8');
  const values = await Promise.all(
    Object.entries(PLACEHOLDERS).map(async ([key, load]) => [key, await load()]),
  );
  const html = values.reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, () => value),
    template,
  );

  const missing = html.match(PLACEHOLDER_PATTERN);
  if (missing) throw new Error(`Unreplaced placeholders: ${missing.join(', ')}`);

  await writeFile(OUTPUT, html);
  const sizeMb = (Buffer.byteLength(html) / BYTES_IN_MB).toFixed(2);
  console.log(`Built ${path.relative(ROOT, OUTPUT)} (${sizeMb} MB)`);
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
