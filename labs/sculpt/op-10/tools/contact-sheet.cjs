'use strict';
// SCULPT OP-10 · Hoja comparativa (antes/después) a partir de PNG, compuesta con Chromium (sin Pillow).
// Uso: node contact-sheet.cjs SALIDA.png "Título" "Fila A" dirA "Fila B" dirB [vistas=axon,rom_living,rom_kitchen,rom_master]
const fs = require('node:fs'), path = require('node:path'), { chromium } = require('playwright');
(async () => {
  const [out, title, la, da, lb, db, views = 'axon,rom_living,rom_kitchen,rom_master'] = process.argv.slice(2);
  if (fs.existsSync(out)) throw Error('Refusing overwrite: ' + out);
  const v = views.split(','), img = (d, n) => 'data:image/png;base64,' + fs.readFileSync(path.join(d, n + '.png')).toString('base64');
  const row = (label, d) => `<div class="lab">${label}</div>` + v.map(n => `<figure><img src="${img(d, n)}"><figcaption>${n}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f4f1eb;font:13px/1.3 system-ui;color:#1f1d1a}
    h1{font-size:15px;margin:0 0 10px}.g{display:grid;grid-template-columns:110px repeat(${v.length},1fr);gap:8px;align-items:center}
    figure{margin:0}img{width:100%;display:block;border:1px solid #d8d0c0}figcaption{font-size:11px;color:#6b665e}.lab{font-weight:600}</style>
    <h1>${title}</h1><div class="g">${row(la, da)}${row(lb, db)}</div>`;
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: 1 }); await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
})().catch(e => { console.error(e.message); process.exitCode = 1; });
