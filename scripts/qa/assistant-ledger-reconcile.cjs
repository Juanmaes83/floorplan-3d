'use strict';
/* Conciliación SIN RED del libro común de gasto de IA (api/_spend-ledger.js) con los costes del proveedor.
   Uso: node scripts/qa/assistant-ledger-reconcile.cjs <registro.json> <costes.csv>
   - registro.json: array exportado de rubik:spend:log (entradas {op:'reserve'|'settle', id, family, usd, at}); sin contenido.
   - costes.csv: cabecera «fecha,familia,usd» (familia text|image), exportado del panel del proveedor por proyecto y día.
   Salida: tabla por día y familia + veredicto. Código: 0 ok · 3 review (reservas abiertas) · 2 blocking (libro < factura) · 1 error. */
const fs=require('node:fs'),L=require('../../api/_spend-ledger.js');
function parseCsv(text){const lines=String(text).trim().split(/\r?\n/);const h=lines.shift().split(',').map(s=>s.trim().toLowerCase());
 const i={date:h.indexOf('fecha')>=0?h.indexOf('fecha'):h.indexOf('date'),family:h.indexOf('familia')>=0?h.indexOf('familia'):h.indexOf('family'),usd:h.indexOf('usd')};
 if(Object.values(i).some(x=>x<0))throw new Error('cabecera esperada: fecha,familia,usd');
 return lines.filter(Boolean).map(l=>{const c=l.split(',').map(s=>s.trim());const usd=Number(c[i.usd]);if(!/^\d{4}-\d{2}-\d{2}$/.test(c[i.date])||!Number.isFinite(usd))throw new Error('fila inválida: '+l);return {date:c[i.date],family:c[i.family],usd};});}
function main(argv=process.argv.slice(2)){
 if(argv.length!==2){console.error('Uso: assistant-ledger-reconcile <registro.json> <costes.csv>');return 1;}
 let log,rows;try{log=JSON.parse(fs.readFileSync(argv[0],'utf8'));rows=parseCsv(fs.readFileSync(argv[1],'utf8'));if(!Array.isArray(log))throw new Error('el registro debe ser un array');}catch(e){console.error('Error: '+e.message);return 1;}
 const r=L.reconcile(log,rows);console.table(r.rows);console.log(JSON.stringify({verdict:r.verdict,totals:r.totals}));
 return r.verdict==='ok'?0:r.verdict==='review'?3:2;}
if(require.main===module)process.exit(main());
module.exports={main,parseCsv};
