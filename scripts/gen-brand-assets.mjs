// Gera os assets rasterizados da marca (favicons, apple-touch-icon, OG) a partir
// do símbolo vetorial `public/icon.svg` e do layout da OG definido no handoff
// (`design/design_handoff_marca`). Rasteriza via screenshot do Chromium headless
// que o Playwright deixa em cache — não adiciona dependência ao projeto.
//
// Uso:  node scripts/gen-brand-assets.mjs
// Requer: binário chrome-headless-shell do Playwright em ~/Library/Caches/ms-playwright
//         (ou defina CHROME_BIN). Os arquivos gerados são versionados em public/;
//         só é preciso rodar de novo quando o símbolo ou o layout da OG mudarem.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const TMP = mkdtempSync(join(tmpdir(), 'brand-'));

// --- localizar o Chromium do Playwright -------------------------------------
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(cache)) throw new Error(`cache do Playwright não encontrado em ${cache}`);
  const builds = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort()
    .reverse();
  for (const b of builds) {
    const bin = join(cache, b, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    if (existsSync(bin)) return bin;
  }
  throw new Error(
    'chrome-headless-shell não encontrado; rode `npx playwright install chromium` ou defina CHROME_BIN',
  );
}
const CHROME = findChrome();

// --- screenshot de um HTML em WxH -------------------------------------------
let seq = 0;
function shoot(html, w, h, out, { waitFonts = false } = {}) {
  const htmlPath = join(TMP, `page-${seq++}.html`);
  writeFileSync(htmlPath, html);
  const args = [
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--screenshot=${out}`,
    `--window-size=${w},${h}`,
  ];
  if (waitFonts) args.push('--virtual-time-budget=5000');
  args.push(`file://${htmlPath}`);
  execFileSync(CHROME, args, { stdio: 'ignore' });
}

// --- símbolos ---------------------------------------------------------------
const SYMBOL_FULL = readFileSync(join(PUBLIC, 'icon.svg'), 'utf8').replace(
  'width="90" height="90"',
  'width="100%" height="100%"',
);

// versão simplificada p/ 16px: só o arco + o ponto (as barras viram ruído)
const SYMBOL_16 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%">
  <rect width="16" height="16" rx="4" fill="#141A24"/>
  <path d="M4 4 H7 A1 1 0 0 1 8 5 V11 A1 1 0 0 1 7 12 H4" fill="none" stroke="#36C275" stroke-width="2" stroke-linecap="butt"/>
  <circle cx="10" cy="8" r="2" fill="#C6F24E"/>
</svg>`;

const svgPage = (svg) =>
  `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`;

function renderIcon(svg, size, file) {
  const out = join(PUBLIC, file);
  shoot(svgPage(svg), size, size, out);
  return out;
}

// --- favicon.ico (PNG-in-ICO, sem dependência) ------------------------------
function packIco(pngPaths) {
  const imgs = pngPaths.map(({ size, path }) => ({ size, buf: readFileSync(path) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(imgs.length, 4);
  let offset = 6 + imgs.length * 16;
  const dir = [];
  for (const { size, buf } of imgs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dir, ...imgs.map((i) => i.buf)]);
}

// --- OG image 1200×630 ------------------------------------------------------
function ogHtml() {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Barlow:wght@400&family=Space+Mono:wght@400;700&display=swap';
  const mark = SYMBOL_FULL.replace('width="100%" height="100%"', 'width="74" height="74"');
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<style>*{box-sizing:border-box}</style></head>
<body style="margin:0;font-family:'Barlow',sans-serif">
<div style="position:relative;width:1200px;height:630px;background:#05070B;overflow:hidden">
  <div style="position:absolute;right:-40px;top:90px;width:520px;height:460px;opacity:.5">
    <div style="position:absolute;left:0;top:60px;width:120px;border-top:3px solid #28303F"></div>
    <div style="position:absolute;left:0;top:170px;width:120px;border-top:3px solid #28303F"></div>
    <div style="position:absolute;left:0;top:290px;width:120px;border-top:3px solid #28303F"></div>
    <div style="position:absolute;left:0;top:400px;width:120px;border-top:3px solid #28303F"></div>
    <div style="position:absolute;left:120px;top:60px;width:90px;height:110px;border-right:3px solid #28303F;border-top:3px solid #28303F;border-bottom:3px solid #28303F;border-radius:0 10px 10px 0"></div>
    <div style="position:absolute;left:120px;top:290px;width:90px;height:110px;border-right:3px solid #28303F;border-top:3px solid #28303F;border-bottom:3px solid #28303F;border-radius:0 10px 10px 0"></div>
    <div style="position:absolute;left:210px;top:115px;width:120px;height:230px;border-right:3px solid #FFB400;border-top:3px solid #FFB400;border-bottom:3px solid #FFB400;border-radius:0 12px 12px 0;opacity:.7"></div>
    <div style="position:absolute;left:330px;top:225px;width:90px;border-top:3px solid #36C275"></div>
    <div style="position:absolute;left:418px;top:215px;width:22px;height:22px;border-radius:99px;background:#C6F24E"></div>
  </div>
  <div style="position:absolute;left:80px;top:62px;right:80px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:18px">
        <div style="flex:none;width:74px;height:74px;border-radius:18px;background:#141A24;border:1px solid #28303F;display:flex;align-items:center;justify-content:center;padding:16px">${mark}</div>
        <span style="font-family:'Space Mono',monospace;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#687087">Segunda tela · Copa 2026</span>
      </div>
      <div style="display:flex;align-items:center;gap:9px;background:#FF2D55;padding:9px 16px;border-radius:99px">
        <span style="width:9px;height:9px;border-radius:99px;background:#fff"></span>
        <span style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:.14em;color:#fff">AO VIVO</span>
      </div>
    </div>
    <h1 style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:118px;line-height:.86;letter-spacing:.005em;text-transform:uppercase;color:#EBF1FB;margin:40px 0 0">Quem&#8209;Pega<br>&#8209;Quem</h1>
    <p style="font-size:24px;line-height:1.4;max-width:760px;color:#98A2B4;margin:24px 0 0">A chave da Copa se montando ao vivo — a cada gol, tudo muda.</p>
  </div>
  <div style="position:absolute;left:80px;bottom:56px;display:flex;align-items:center;gap:14px">
    <span style="font-family:'Space Mono',monospace;font-size:16px;color:#C6F24E">quempegaquem.app</span>
    <span style="width:5px;height:5px;border-radius:99px;background:#28303F"></span>
    <span style="font-family:'Space Mono',monospace;font-size:15px;color:#687087">8 melhores 3º · 16&#8209;avos</span>
  </div>
</div>
</body></html>`;
}

// --- run --------------------------------------------------------------------
console.log(`Chromium: ${CHROME}`);
const p16 = renderIcon(SYMBOL_16, 16, 'favicon-16.png');
const p32 = renderIcon(SYMBOL_FULL, 32, 'favicon-32.png');
const p48 = renderIcon(SYMBOL_FULL, 48, 'favicon-48.png');
renderIcon(SYMBOL_FULL, 180, 'apple-touch-icon.png');
writeFileSync(
  join(PUBLIC, 'favicon.ico'),
  packIco([
    { size: 16, path: p16 },
    { size: 32, path: p32 },
    { size: 48, path: p48 },
  ]),
);
shoot(ogHtml(), 1200, 630, join(PUBLIC, 'og-image.png'), { waitFonts: true });

console.log(
  'Gerado em public/: favicon-16/32/48.png, favicon.ico, apple-touch-icon.png, og-image.png',
);
