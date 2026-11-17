// v1.4 · Auditoría ampliada §3 · MATRIZ DE COMPLETITUD PROFESIONAL RP01–RP21 con un ORÁCULO INDEPENDIENTE del catálogo de
// selección: para cada campo profesional que la receta promete (requeridas + completas), busca en el TEXTO de los PDF finales
// (pdftotext, ES y EN) la evidencia de que el documento lo representa. Un PDF existente no basta. Solo lectura.
// Uso: node tools/auditoria-recetas.cjs → evidence/recetas/auditoria-completitud.json + reports/16-AUDITORIA-RECETAS-v1.4.md
'use strict';
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),R=require('./recetas.cjs'),OUT=path.join(LAB,'out/v3');
const txt={};const T=(id,en)=>{const f=path.join(OUT,id+(en?'.en':'')+'.pdf');const k=f;if(!(k in txt))txt[k]=fs.existsSync(f)?execFileSync('pdftotext',['-q',f,'-']).toString():null;return txt[k];};
// Oráculo: patrones de contenido profesional por campo (ES|EN). Escrito a partir del mandato, no del catálogo.
const O={geometria:/planta|floor ?plan/i,superficies:/superficie|m²|area/i,vistas3d:/vista del modelo|model view|vista 3d|3d view/i,materiales:/pavimento|flooring|material/i,objetos:/objeto|object|mobiliario|furniture/i,
 presupuesto:/total con iva|total incl|base imponible|tax base/i,presupuestoRevisado:/presupuesto revisado|reviewed (budget|by the studio)|revisado por el estudio/i,marca:/estudio|studio/i,planObra:/plan de obra|works? (plan|schedule)|fases/i,
 concepto:/concepto|concept/i,revisionAnterior:/estado actual|revisión anterior|existing state|previous revision/i,fotosAportadas:/fotograf[ií]a aportada|supplied photo/i,
 alcanceServicios:/alcance de (los )?servicios|scope of services|servicios incluidos/i,honorarios:/honorarios|fees?\b/i,exclusiones:/no incluye|exclusiones|excluded|not included/i,validezOferta:/validez|valid (for|until)/i,
 precioInmueble:/precio (del inmueble|de compra)|purchase price|asking price/i,impuestosCompra:/impuestos de (la )?compra|itp|transfer tax|stamp duty/i,referenciasMoodboard:/moodboard|referencias? (visual|de ambiente)|mood ?board/i,
 ofertaTecnica:/oferta técnica|technical (offer|proposal)/i,vinculoPlanPresupuesto:/vinculad[oa] al presupuesto|linked to the budget/i,dimensionesHuecos:/dimensiones de (los )?huecos|opening (sizes|dimensions)/i,
 catalogoProductos:/fabricante:|referencia de fabricante [A-Z0-9]|manufacturer:/i,preciosVerificados:/precio verificado|verified price/i,variantesGuardadas:/variante|variant/i};
// Ausencia rotulada: el documento dice explícitamente que no tiene el dato (no inventa). Cuenta como honesto, no como completo.
const NEG=/no (facilitad|incluid|disponible|tiene)|sin (referencia|precio|producto)|not (supplied|included|available)|no (product|price|reference)/i;
const rows=R.RECETAS.map(r=>{const docs=r.sel?.documentos||[];const campos=[...new Set([...(r.requeridas||[]),...(r.completas||[])])];
 const ev=campos.map(c=>{const res={campo:c,tipo:(r.requeridas||[]).includes(c)?'requerida':'complementaria'};if(!O[c]){res.oraculo='sin patrón';return res;}
  res.es=docs.some(d=>O[c].test(T(d,false)||''));res.en=docs.some(d=>O[c].test(T(d,true)||''));return res;});
 const faltan=ev.filter(e=>e.oraculo!=='sin patrón'&&!e.es).map(e=>e.campo);
 const estado=r.nivel!=='L'?(r.nivel==='C'?'C: contrato y bloqueo (no implementar motor)':'F: futuro, dependencias registradas')
  :!docs.length?'L sin documento propio: incompleta'
  :faltan.length?`L exportable, INCOMPLETA documentalmente (${faltan.join(', ')})`:'L completa documentalmente (pendiente revisión humana)';
 return {key:r.key,nivel:r.nivel,finalidad:r.es,perfiles:r.perfiles,fases:r.fases,familia:r.familia,tipo:r.tipo,corte:r.corte,documentos:docs,requeridas:r.requeridas,opcionales:r.opcionales||[],completas:r.completas||[],evidencia:ev,faltan,estado,
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
