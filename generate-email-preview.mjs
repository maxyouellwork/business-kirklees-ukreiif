import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname, join } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname);
const HTML_PATH = '/email-pack-preview.html';
const OUTPUT_PNG = resolve(PROJECT_ROOT, 'email-pack.png');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf',
};

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
