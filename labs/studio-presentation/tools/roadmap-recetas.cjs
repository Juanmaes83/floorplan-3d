// v1.4 §10 · Roadmap de RP13–RP21 generado del catálogo y de la evaluación REAL de fuentes sobre la entrega compuesta
// (bloqueo actual). No implementa ningún motor. Uso: node tools/roadmap-recetas.cjs → reports/18-ROADMAP-RP13-RP21.md
'use strict';
const fs=require('fs'),path=require('path'),RC=require('./recetas.cjs');const LAB=path.resolve(__dirname,'..');
const ctx=RC.contexto(LAB,path.join(LAB,'out/v3/entrega'),null);
const INT={RP13:'Comparador económico sobre FloorPlanRevisionBudget; ofertas aportadas como fuente atribuida',RP14:'ENT-04 (comparar/) + motivo atribuido; delta económico solo con revisiones coherentes (A25)',RP15:'FT3D-8 + observaciones y certificados de obra',
 RP16:'Registro de visitas OBR (no existe)',RP17:'ENT-05 especificación sobre catálogo acreditado',RP18:'Registro de remates OBR (no existe)',RP19:'Revisión ejecutada validada + manuales y garantías (E6)',RP20:'Liquidación y actas; sin firma simulada',RP21:'Evidencia ejecutada + archivo del propietario (E6/E7)'};
const rows=RC.RECETAS.filter(r=>+r.key.slice(2)>=13).map(r=>{const x=RC.resolver(r.key,ctx,'es');
 return `| ${r.key} | ${r.es} | ${r.nivel} | ${r.requeridas.map(i=>RC.FUENTES[i].es).join('; ')} | ${INT[r.key]} | ${(r.contrato||[]).join('; ')} | ${x.estado}: ${x.falta.map(i=>RC.FUENTES[i].es).join('; ')||'—'} | ${r.corte} |`;});
const md=['# 18 · Roadmap de recetas futuras RP13–RP21 (v1.4 §10)','',`Generado por \`tools/roadmap-recetas.cjs\` desde \`tools/recetas.cjs\` (${RC.VERSION}) y la evaluación de fuentes sobre la entrega compuesta. Ningún motor operativo se implementa; los negativos están en \`tools/recetas-qa.cjs\`.`,'',
 '| Receta | Finalidad | Nivel | Fuentes requeridas | Integración prevista | Criterios de aceptación (contrato) | Bloqueo actual | Corte |','|---|---|---|---|---|---|---|---|',...rows,'',
 '## Seguimiento de pilares (sin cambios de alcance)','','| Pilar | Estado en el laboratorio | Corte |','|---|---|---|',
 '| Dibujo vivo | Fotograma auténtico; exportación de la transformación no existe | E4/E5 |','| FT3D-8 | Vídeo, presentación y manifiesto reales; huella verificada con la función canónica | E3/E6 |',
 '| Render IA | 3 renders D7 con trazabilidad; sin persistencia de la imagen enviada | E4 (IMG-12/ENT-05) |','| Visita inmersiva | Ausencia explícita en la carpeta offline | E3/E6 |',
 '| Mi estudio (marca) | Perfiles de laboratorio; sin colores ni fuentes en producto (H07) | E3 |','| PDF avanzado | CSS Print + paginación medida; PDF/A no afirmado | E5 |','| Seguridad de entregas | Exportador con gates, verificador e inspector; publicación remota fuera | E6 (GOV-08, DEC-05) |','',
 'Sin IDs maestros ni olas nuevas.'];
fs.writeFileSync(path.join(LAB,'reports/18-ROADMAP-RP13-RP21.md'),md.join('\n')+'\n');console.log(rows.length,'recetas');
