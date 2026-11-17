'use strict';

// Presentación de los resultados ya calculados por FloorPlanRevisionBudget.
function comparacionEconomica(snapshot, {esc, eur}) {
 const result = snapshot.economiaComparada;
 if (!result) return null;
 if (!/^fixture-economia-/.test(snapshot.variant || '') ||
     result.schema !== 'rubik-sota.revision-budget-comparison' || result.totals.status !== result.status) {
  throw new Error('Comparación económica sin contrato de fixture reconocido');
 }
 const {totals, before, after} = result;
 const states = {
  complete:'Comparación completa', partial:'Comparación parcial', incoherent:'Presupuestos incompatibles',
  'one-sided':'Presupuesto de una sola revisión', none:'Sin presupuesto'
 };
 if (!Object.hasOwn(states,result.status)) throw new Error('Estado económico desconocido');
 const allowed = side => side?.matchesRevision === true;
 const sideRows = (side, label) => !allowed(side) ? '' : [
  [label, side.complete ? 'Base imponible' : 'Base conocida', side.net],
  [label, side.complete ? 'IVA' : 'IVA conocido', side.tax],
  [label, side.complete ? 'Total con IVA' : 'Importe conocido con IVA', side.gross]
 ];
 const rows = [];
 if (result.status === 'complete' || result.status === 'one-sided') {
  for (const entries of [sideRows(before,'Revisión base'), sideRows(after,'Revisión propuesta')]) {
   if (entries) rows.push(...entries);
  }
  if (result.status === 'complete') rows.push(['Comparación','Diferencia con IVA',totals.gross.delta]);
 }
 if (result.status === 'partial') {
  rows.push(['Revisión base','Base conocida',totals.knownNet.before],
            ['Revisión propuesta','Base conocida',totals.knownNet.after],
            ['Comparación','Diferencia de partidas comparables con IVA',totals.comparable.grossDelta]);
 }
 const table = rows.length ? `<table style="margin-top:5mm"><thead><tr><th>Ámbito</th><th>Concepto</th><th class="num">Importe</th></tr></thead>
  <tbody>${rows.map(([scope,label,value])=>`<tr><td>${scope}</td><td>${label}</td><td class="num">${Number.isFinite(value)?eur(value):'—'}</td></tr>`).join('')}</tbody></table>` : '';
 const note = result.status==='partial' && totals.excluded.length ?
  `<p class="caption">Partidas no comparables: ${totals.excluded.length}.</p>` : '';
 return {html:`<div class="grid"><div class="c1-12"><p class="status">Fixture de laboratorio · Datos sintéticos</p>
  <h2 class="h2" style="margin-top:6mm">${states[result.status]}</h2><p class="read">${esc(totals.statement)}</p>
  ${table}${note}<div style="margin-top:7mm"><h3 class="h3">Otros ámbitos</h3>
  <p class="caption">Honorarios: no aportados.</p><p class="caption">Compra del inmueble: importe no aportado.</p>
  <p class="caption">Impuestos de compra: no aportados.</p><p class="caption">Condiciones comerciales: no aportadas.</p></div></div></div>`};
}

module.exports = {comparacionEconomica};
