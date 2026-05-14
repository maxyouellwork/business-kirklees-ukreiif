// Render one print-ready PDF per UKREiiF 2026 delegate.
// Page 1 = front (worn-side identity). Page 2 = back (QR / scan-me).
// Card size: 70x100mm. Output: lanyards/output/<code>.pdf
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { resolve, extname, join } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(import.meta.dirname, 'output');
const LANDING_URL = 'https://businesskirklees.com/ukreiif/';

const DELEGATES = [
  { code: 'js', firstName: 'Jess',     lastName: 'Newbould',    role: 'Inward Investment Project Officer' },
  { code: 'cw', firstName: 'Chelsey',  lastName: 'Warvill',     role: 'Communications Business Partner' },
  { code: 'jb', firstName: 'James',    lastName: 'Barker',      role: 'Inward Investment Project Officer' },
  { code: 'cd', firstName: 'Chris',    lastName: 'Duffill',     role: 'Head of Business, Economy & Growth' },
  { code: 'tf', firstName: 'Thomas',   lastName: 'Fish',        role: 'Head of Town Centre Programmes' },
  { code: 'jo', firstName: 'Joanne',   lastName: 'Bartholomew', role: 'Service Director — Development' },
  { code: 'dw', firstName: 'David',    lastName: 'Wildman',     role: 'Service Director for Skills & Regeneration' },
  { code: 'ds', firstName: 'David',    lastName: 'Shepherd',    role: 'Executive Director for Place' },
  { code: 'dg', firstName: 'David',    lastName: 'Glover',      role: 'Senior Responsible Officer, Our Cultural Heart' },
];

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

// Returns a single-file HTML page with both sides as two print pages (70x100mm each).
function buildHtml({ firstName, lastName, role, code }, serverBase) {
  const qrUrl = `${LANDING_URL}?d=${code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&qzone=1&bgcolor=245-240-235&data=${encodeURIComponent(qrUrl)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { size: 70mm 100mm; margin: 0; }
  @font-face{font-family:"VAG";src:url("${serverBase}/fonts/vag-bold.ttf");font-weight:700}
  @font-face{font-family:"VAG";src:url("${serverBase}/fonts/vag-light.ttf");font-weight:300}
  @font-face{font-family:"DIN";src:url("${serverBase}/fonts/din-regular.otf");font-weight:400}
  @font-face{font-family:"DIN";src:url("${serverBase}/fonts/din-bold.otf");font-weight:700}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:"DIN",system-ui,sans-serif;background:transparent}

  .card{
    width:70mm;
    height:100mm;
    overflow:hidden;
    position:relative;
    background:#1a2234;
    color:#f5f0eb;
    page-break-after:always;
  }
  .card:last-child{page-break-after:auto}

  /* ===== FRONT ===== */
  .front{
    background:linear-gradient(165deg,#1a2234 0%,#243044 100%);
    padding:7mm 6mm 6mm;
    display:flex;
    flex-direction:column;
  }
  .front-glow{
    position:absolute;
    top:-15mm;right:-15mm;
    width:50mm;height:50mm;
    background:radial-gradient(circle,rgba(212,104,26,.45) 0%,rgba(212,104,26,0) 65%);
    pointer-events:none;
  }
  .front-glow-2{
    position:absolute;
    bottom:-25mm;left:-15mm;
    width:60mm;height:60mm;
    background:radial-gradient(circle,rgba(0,201,219,.18) 0%,rgba(0,201,219,0) 65%);
    pointer-events:none;
  }
  .front-top{
    position:relative;z-index:2;
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:auto;
  }
  .front-bk{
    width:11mm;height:11mm;
    display:block;
  }
  .front-name-block{
    margin-top:auto;
    margin-bottom:7mm;
    position:relative;
    z-index:2;
  }
  .front-eyebrow{
    font-size:2.2mm;
    font-weight:700;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:#e8842f;
    margin-bottom:2mm;
  }
  .front-name{
    font-family:"VAG",sans-serif;
    font-weight:700;
    font-size:9.5mm;
    line-height:.95;
    letter-spacing:-.02em;
    color:#f5f0eb;
    margin-bottom:2.5mm;
  }
  .front-role{
    font-size:3mm;
    line-height:1.35;
    color:rgba(245,240,235,.78);
    max-width:58mm;
  }
  .front-foot{
    border-top:.3mm solid rgba(255,255,255,.13);
    padding-top:3.5mm;
    display:flex;
    justify-content:space-between;
    align-items:center;
    position:relative;
    z-index:2;
  }
  .front-kc{
    height:6.5mm;
    width:auto;
    filter:brightness(0) invert(1);
    opacity:.9;
  }
  .front-foot-sub{
    font-size:2.2mm;
    color:rgba(245,240,235,.5);
    letter-spacing:.04em;
    text-align:right;
  }

  /* ===== BACK ===== */
  .back{
    background:#f5f0eb;
    color:#1a2234;
    padding:9mm 6mm 5mm;
    display:flex;
    flex-direction:column;
    align-items:center;
  }
  .back::before{
    content:"";
    position:absolute;
    top:0;left:0;right:0;height:1.8mm;
    background:#d4681a;
  }
  .back-cta{
    font-family:"VAG",sans-serif;
    font-weight:700;
    font-size:9mm;
    line-height:.95;
    letter-spacing:-.025em;
    color:#1a2234;
    text-align:center;
    margin-top:2mm;
    margin-bottom:2mm;
  }
  .back-cta em{
    font-style:normal;
    color:#d4681a;
  }
  .back-sub{
    font-size:2.4mm;
    line-height:1.3;
    color:rgba(26,34,52,.6);
    text-align:center;
    margin-bottom:3mm;
    max-width:55mm;
  }
  .back-qr-frame{
    margin-bottom:auto;
  }
  .back-qr{
    width:50mm;height:50mm;
    display:block;
  }
  .back-foot{
    width:100%;
    text-align:center;
    padding-top:2mm;
  }
  .back-foot-line{
    font-size:2.3mm;
    font-weight:700;
    color:#1a2234;
    letter-spacing:.01em;
    opacity:.7;
  }
</style>
</head>
<body>

  <!-- Page 1 — FRONT -->
  <div class="card front">
    <div class="front-glow"></div>
    <div class="front-glow-2"></div>
    <div class="front-top">
      <img class="front-bk" src="${serverBase}/lanyards/bk-mark.png" alt="">
    </div>
    <div class="front-name-block">
      <div class="front-eyebrow">Invest in Kirklees</div>
      <div class="front-name">${firstName}<br>${lastName}</div>
      <div class="front-role">${role} · Kirklees Council</div>
    </div>
    <div class="front-foot">
      <img class="front-kc" src="${serverBase}/lanyards/kc-logo.png" alt="">
      <div class="front-foot-sub">businesskirklees.com</div>
    </div>
  </div>

  <!-- Page 2 — BACK -->
  <div class="card back">
    <div class="back-cta">Let's<br><em>connect.</em></div>
    <div class="back-sub">£3.5bn of regeneration.<br>Sites, schemes, and the team to talk to.</div>
    <div class="back-qr-frame">
      <img class="back-qr" src="${qrSrc}" alt="">
    </div>
    <div class="back-foot">
      <div class="back-foot-line">businesskirklees.com</div>
    </div>
  </div>

</body>
</html>`;
}

async function main(){
  if(!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR,{recursive:true});

  const PORT=9882;
  const server=await startServer(PORT);
  const serverBase=`http://localhost:${PORT}`;

  const browser=await puppeteer.launch({headless:true});

  for(const d of DELEGATES){
    const page=await browser.newPage();
    const html=buildHtml(d, serverBase);
    await page.setContent(html,{waitUntil:'networkidle0'});
    await page.evaluate(()=>document.fonts.ready);
    await new Promise(r=>setTimeout(r,400));
    const pdfPath=resolve(OUTPUT_DIR,`${d.code}-${d.firstName.toLowerCase()}-${d.lastName.toLowerCase()}.pdf`);
    await page.pdf({
      path:pdfPath,
      width:'70mm',
      height:'100mm',
      printBackground:true,
      preferCSSPageSize:true,
      margin:{top:0,right:0,bottom:0,left:0},
    });
    console.log(`  ✓ ${d.code}  ${d.firstName} ${d.lastName}  →  ${pdfPath}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`\nDone. ${DELEGATES.length} PDFs written to ${OUTPUT_DIR}/`);
}

main().catch(e=>{console.error(e);process.exit(1)});
