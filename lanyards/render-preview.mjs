// Render lanyard-preview.html to a single PNG showing both card sides side by side.
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname, join } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const HTML_PATH = '/lanyards/lanyard-preview.html';
const OUTPUT_PNG = resolve(import.meta.dirname, 'lanyard-preview.png');

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.svg':'image/svg+xml','.webp':'image/webp',
  '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf',
};

function startServer(port){
  return new Promise(res=>{
    const s=createServer((req,resp)=>{
      const p=decodeURIComponent(req.url.split('?')[0]);
      const f=join(PROJECT_ROOT,p);
      if(!existsSync(f)||!statSync(f).isFile()){resp.writeHead(404);resp.end('404');return}
      const m=MIME[extname(f).toLowerCase()]||'application/octet-stream';
      resp.writeHead(200,{'Content-Type':m});
      resp.end(readFileSync(f));
    });
    s.listen(port,()=>res(s));
  });
}

async function main(){
  const PORT=9881;
  const server=await startServer(PORT);
  const browser=await puppeteer.launch({headless:true});
  const page=await browser.newPage();
  await page.setViewport({width:760,height:520,deviceScaleFactor:2});
  await page.goto(`http://localhost:${PORT}${HTML_PATH}`,{waitUntil:'networkidle0'});
  await page.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,500));
  await page.screenshot({path:OUTPUT_PNG,type:'png',fullPage:true});
  console.log(`Wrote ${OUTPUT_PNG}`);
  await browser.close();
  server.close();
}

main().catch(e=>{console.error(e);process.exit(1)});
