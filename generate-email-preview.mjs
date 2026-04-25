// Renders email-pack-preview.html → email-pack.png (1200x630 @ 2x).
// Auto-downloads the brochure PDF and extracts page 1 as brochure-cover.png
// (gitignored). Requires: puppeteer, poppler (`brew install poppler`).
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, writeFileSync, renameSync, unlinkSync } from 'fs';
import { resolve, extname, join } from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = resolve(import.meta.dirname);
const HTML_PATH = '/email-pack-preview.html';
const OUTPUT_PNG = resolve(PROJECT_ROOT, 'email-pack.png');
const COVER_PNG = resolve(PROJECT_ROOT, 'brochure-cover.png');
const PDF_PATH = resolve(PROJECT_ROOT, 'brochure.pdf');
const PDF_URL = 'https://businesskirklees.com/wp-content/uploads/2025/10/invest-in-huddersfield-brochure-2025.pdf';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf',
};

async function ensureCover() {
  if (existsSync(COVER_PNG)) return;
  console.log('Downloading brochure PDF…');
  const res = await fetch(PDF_URL);
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`);
  writeFileSync(PDF_PATH, Buffer.from(await res.arrayBuffer()));
  console.log('Extracting page 1…');
  execSync(`pdftoppm -r 220 -f 1 -l 1 -png "${PDF_PATH}" "${PROJECT_ROOT}/brochure-cover"`);
  renameSync(`${PROJECT_ROOT}/brochure-cover-01.png`, COVER_PNG);
  unlinkSync(PDF_PATH);
}

function startServer(port) {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = join(PROJECT_ROOT, urlPath);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        resp.writeHead(404);
        resp.end('Not found');
        return;
      }
      const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      resp.writeHead(200, { 'Content-Type': mime });
      resp.end(readFileSync(filePath));
    });
    server.listen(port, () => res(server));
  });
}

async function main() {
  await ensureCover();

  const PORT = 9879;
  const server = await startServer(PORT);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  await page.goto(`http://localhost:${PORT}${HTML_PATH}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));

  await page.screenshot({ path: OUTPUT_PNG, type: 'png', omitBackground: false });
  console.log(`Wrote ${OUTPUT_PNG}`);

  await browser.close();
  server.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
