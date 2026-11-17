// v1.4 · Auditoría ampliada §3 · MATRIZ DE COMPLETITUD PROFESIONAL RP01–RP21 con un ORÁCULO INDEPENDIENTE del catálogo de
// selección: para cada campo profesional que la receta promete (requeridas + completas), busca en el TEXTO de los PDF finales
// (pdftotext, ES y EN) la evidencia de que el documento lo representa. Un PDF existente no basta. Solo lectura.
// Uso: node tools/auditoria-recetas.cjs → evidence/recetas/auditoria-completitud.json + reports/16-AUDITORIA-RECETAS-v1.4.md
'use strict';
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),R=require('./recetas.cjs'),OUT=path.join(LAB,'out/v3');
const txt={};const T=(id,en)=>{const f=path.join(OUT,id+(en?'.en':'')+'.pdf');const k=f;if(!(k in txt))txt[k]=fs.existsSync(f)?execFileSync('pdftotext',['-q',f,'-']).toString():null;return txt[k];};
// Oráculo: patrones de contenido profesional por campo (ES|EN). Escrito a partir del mandato, no del catálogo.
const O={geometria:/planta|floor ?plan|\bplan\b/i,superficies:/superficie|m²|area/i,vistas3d:/vista del modelo|model view|vista 3d|3d view|\bviews?\b/i,materiales:/pavimento|flooring|material/i,objetos:/objeto|object|mobiliario|furniture/i,
 presupuesto:/total con iva|total incl|base imponible|tax base/i,presupuestoRevisado:/revisión del presupuesto|budget review|presupuesto (no )?revisado|budget (not )?reviewed/i,marca:/estudio|studio/i,planObra:/plan de obra|works? (plan|schedule)|fases/i,
 concepto:/concepto|concept/i,revisionAnterior:/estado actual|revisión anterior|existing state|previous revision/i,fotosAportadas:/fotograf[ií]a aportada|supplied photo/i,
 alcanceServicios:/alcance,? (de (los )?)?servicios|scope,? (of )?services/i,honorarios:/honorarios|fees?\b/i,exclusiones:/no incluye|exclusiones|excluded|not included/i,validezOferta:/validez|validity|valid (for|until)/i,
 precioInmueble:/precio (del inmueble|de compra)|property price|purchase price/i,impuestosCompra:/impuestos de (la )?compra|purchase taxes|transfer tax/i,referenciasMoodboard:/moodboard|concepto y referencias|concept and references/i,
 ofertaTecnica:/oferta técnica|technical (offer|proposal)/i,vinculoPlanPresupuesto:/vinculad[oa] al presupuesto|linked to the budget/i,dimensionesHuecos:/dimensiones de (los )?huecos|opening (sizes|dimensions)/i,
 catalogoProductos:/fabricante y referencia|manufacturer and reference/i,preciosVerificados:/cuando está verificado|when verified|precio verificado|verified price/i,variantesGuardadas:/variante|variant/i};
// Ausencia rotulada: el documento dice explícitamente que no tiene el dato (no inventa). Cuenta como honesto, no como completo.
const NEG=/no (facilitad|incluid|disponible|tiene)|sin (referencia|precio|producto)|not (supplied|included|available)|no (product|price|reference)/i;
// v1.4 §4 · VALIDEZ: además del patrón, los VALORES exactos de la fixture deben estar en el PDF, en su formato de cada idioma.
let AP={};try{AP=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/aportaciones.json'),'utf8')).campos||{};}catch{}
const fmt=(v,en)=>new Intl.NumberFormat(en?'en-GB':'es-ES',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(v);
const VAL={honorarios:a=>a.valor.flatMap(x=>[[fmt(x.importe,0),fmt(x.importe,1)]]),precioInmueble:a=>[[fmt(a.valor.importe,0),fmt(a.valor.importe,1)]],impuestosCompra:a=>[[fmt(a.valor.importe,0),fmt(a.valor.importe,1)]],
 preciosVerificados:a=>a.valor.map(x=>[fmt(x.importe,0),fmt(x.importe,1)]),catalogoProductos:a=>a.valor.map(x=>[x.sku,x.sku]),exclusiones:a=>a.valor.map(x=>[x,x]),
 referenciasMoodboard:a=>a.valor.map(x=>[x.nota,x.nota]),ofertaTecnica:a=>[[a.valor.metodo,a.valor.metodo]],alcanceServicios:a=>a.valor.map(x=>[x.entregables,x.entregables]),validezOferta:a=>[[`${a.valor.dias} días`,`${a.valor.dias} days`]]};
const flat=x=>(x||'').replace(/\s+/g,' ');
const REG=JSON.parse(fs.readFileSync(path.join(OUT,'entrega/entrega.json'),'utf8'));
const rows=R.RECETAS.map(r=>{const propios=r.sel?.documentos||null;const docs=propios||(r.sel?REG.tipos.find(t=>t.tipo===r.sel.tipo)?.documents.filter(d=>d!=='entrega-integral')||[]:[]);const campos=[...new Set([...(r.requeridas||[]),...(r.completas||[])])];
 const ev=campos.map(c=>{const res={campo:c,tipo:(r.requeridas||[]).includes(c)?'requerida':'complementaria'};if(!O[c]){res.oraculo='sin patrón';return res;}
  res.es=docs.some(d=>O[c].test(flat(T(d,false))));res.en=docs.some(d=>O[c].test(flat(T(d,true))));
  if(VAL[c]&&AP[c]){const want=VAL[c](AP[c]);res.valoresES=want.every(([e])=>docs.some(d=>flat(T(d,false)).includes(e)));res.valoresEN=want.every(([,e])=>docs.some(d=>flat(T(d,true)).includes(e)));res.es=res.es&&res.valoresES;res.en=res.en&&res.valoresEN;}
  return res;});
 // corte: campos que dependen de otras fases (no se implementan en el laboratorio)
 const CORTE={revisionAnterior:'E2 (ENT-04)',variantesGuardadas:'E2 (UX-07)',dimensionesHuecos:'E4',fotosAportadas:'E4',vinculoPlanPresupuesto:'E3/E6 (FT3D-8)'};
 const corteCampos=ev.filter(e=>CORTE[e.campo]&&!(e.es&&e.en)).map(e=>`${e.campo} → ${CORTE[e.campo]}`);
 const faltan=ev.filter(e=>e.oraculo!=='sin patrón'&&!CORTE[e.campo]&&!(e.es&&e.en)).map(e=>e.campo+(e.es&&!e.en?' (solo ES)':''));
 const estado=r.nivel!=='L'?(r.nivel==='C'?'C: contrato y bloqueo (no implementar motor)':'F: futuro, dependencias registradas')
  :!docs.length?'L sin documentos: incompleta'
  :faltan.length?`L exportable, INCOMPLETA documentalmente (${faltan.join(', ')})`:`L completa documentalmente (ES y EN)${corteCampos.length?`; corte: ${corteCampos.join(', ')}`:''}; pendiente revisión humana`;
 return {key:r.key,nivel:r.nivel,finalidad:r.es,perfiles:r.perfiles,fases:r.fases,familia:r.familia,tipo:r.tipo,corte:r.corte,documentos:docs,requeridas:r.requeridas,opcionales:r.opcionales||[],completas:r.completas||[],evidencia:ev,faltan,corte:corteCampos,estado:(!propios&&r.nivel==='L'?`[documentos heredados de «${r.sel?.tipo}»] `:'')+estado,
  ausenciaRotulada:docs.some(d=>NEG.test(T(d,false)||''))};});
const combos=[];for(const p of Object.keys(R.PERFILES))for(const f of Object.keys(R.FASES)){const l=R.filtrar({perfil:p,fase:f});combos.push({perfil:p,fase:f,recetas:l.map(x=>x.key),L:l.filter(x=>x.nivel==='L').map(x=>x.key)});}
const out={schema:'rubik-lab-auditoria-recetas/1',fecha:new Date().toISOString(),catalogo:R.VERSION,oraculo:'patrones de contenido sobre pdftotext de los PDF finales de out/v3 (ES y .en)',recetas:rows,combinaciones:combos,
 resumen:{L:rows.filter(r=>r.nivel==='L').length,LCompletas:rows.filter(r=>r.nivel==='L'&&!r.faltan.length&&r.documentos.length).length,LIncompletas:rows.filter(r=>r.nivel==='L'&&(r.faltan.length||!r.documentos.length)).map(r=>r.key),combinaciones:combos.length,combinacionesSinL:combos.filter(c=>!c.L.length).map(c=>c.perfil+'·'+c.fase)}};
fs.mkdirSync(path.join(LAB,'evidence/recetas'),{recursive:true});fs.writeFileSync(path.join(LAB,'evidence/recetas/auditoria-completitud.json'),JSON.stringify(out,null,1));
const md=['# 16 · Auditoría de completitud profesional RP01–RP21 (v1.4 ampliada)','',`Generado por \`tools/auditoria-recetas.cjs\` (oráculo independiente del catálogo sobre el texto de los PDF finales). Catálogo ${R.VERSION}.`,'',
 '| Receta | Nivel | Finalidad | Perfiles · fases | Documentos | Campos sin representar (ES) | Estado real | Corte |','|---|---|---|---|---|---|---|---|',
 ...rows.map(r=>`| ${r.key} | ${r.nivel} | ${r.finalidad} | ${r.perfiles.join(',')} · ${r.fases.join(',')} | ${r.documentos.join(', ')||'—'} | ${r.faltan.join(', ')||'—'} | ${r.estado} | ${r.corte} |`),'',
 `## Perfiles × fases (${combos.length})`,'','| Perfil | Fase | Recetas | L |','|---|---|---|---|',...combos.map(c=>`| ${c.perfil} | ${c.fase} | ${c.recetas.join(', ')||'—'} | ${c.L.join(', ')||'**ninguna**'} |`),'',
 `**Resumen:** ${out.resumen.LCompletas}/${out.resumen.L} recetas L representan todos sus campos en los bytes finales. Incompletas: ${out.resumen.LIncompletas.join(', ')||'ninguna'}. Combinaciones sin receta L: ${out.resumen.combinacionesSinL.join(', ')||'ninguna'}.`,'',
 'Límite del oráculo: detecta presencia de contenido por patrones; no juzga su corrección (eso lo hacen los QA de cada bloque) ni sustituye la revisión humana.'];
fs.writeFileSync(path.join(LAB,'reports/16-AUDITORIA-RECETAS-v1.4.md'),md.join('\n')+'\n');console.log(JSON.stringify(out.resumen,null,1));
