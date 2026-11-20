'use strict';
// E3 · Escribe la matriz de las 43 fuentes contra master (reports/22b) desde e3/e3-core.js y la evidencia de e3-qa.json.
// Uso: node tools/e3-matriz.cjs <pinSha>   (requiere evidence/e3/e3-qa.json del mismo pin)
const fs=require('fs'),path=require('path');const E3=require('../e3/e3-core.js'),A=require('./f0-adaptador.cjs');
const sha=process.argv[2];if(!sha){console.error('Uso: node tools/e3-matriz.cjs <pinSha>');process.exit(1);}
const LAB=path.resolve(__dirname,'..');const qa=JSON.parse(fs.readFileSync(path.join(LAB,'evidence/e3/e3-qa.json'),'utf8'));
if(qa.pin!==sha)throw new Error('La evidencia es de otro pin: '+qa.pin);
const ev=qa.evidenciasMatriz;const ESTADO={confirmada:'disponible si hay dato',motor:'disponible si hay geometría y motor',sesion:'disponible solo «ready» sin cambios',local:'parcial (no portable)','consumidor-pendiente':'ausente',historial:'ausente','sin-fuente':'ausente',aportacion:'ausente',fuera:'ausente'};
const esc=s=>String(s??'—').replace(/\|/g,'\\|');
let md=`# 22b · Matriz de las 43 fuentes de receta contra master \`${sha}\`\n\nGenerada por \`tools/e3-matriz.cjs\` desde \`e3/e3-core.js\` (MATRIZ). Cada evidencia se comprobó en el pin (caso E3-02 de \`evidence/e3/e3-qa.json\`). «Antes» es el estado del mapa F0 del informe 21 (\`tools/f0-adaptador.cjs\`, master \`dd528119\`).\n\n`;
md+='| # | Fuente | Antes | Clase en master | Módulo y función | Autoridad del dato | Condición de disponibilidad | Revisión e identidad | Consumidor (recetas) | Privacidad y licencia | Estado efectivo en E3 | Motivo si no es utilizable / cambio | Evidencia (archivo:línea) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
let i=0;const cuenta={};
for(const [id,m] of Object.entries(E3.MATRIZ)){i++;cuenta[m.clase]=(cuenta[m.clase]||0)+1;
 const e=ev.filter(x=>x.fuente===id).map(x=>`\`${x.archivo}:${x.linea}\``).join(', ')||'— (sin dato en master)';
 const motivo=m.cambio||(ESTADO[m.clase]==='ausente'?E3.TF[m.clase==='consumidor-pendiente'?'consumidor-pendiente':m.clase==='historial'?'historial':m.clase].es:'');
 md+=`| ${i} | \`${id}\` | ${A.MAPA[id].estado} | **${m.clase}** | ${esc(m.modulo)} | ${esc(m.autoridad)} | ${esc(m.condicion)} | ${esc(m.identidad)} | ${esc(m.consumidor)} | ${esc(m.privacidad)} | ${ESTADO[m.clase]} | ${esc(motivo)} | ${e} |\n`;}
md+=`\n**Recuento por clase:** ${Object.entries(cuenta).map(([k,v])=>`${k} ${v}`).join(' · ')} (total ${i}).\n`;
fs.writeFileSync(path.join(LAB,'reports/22b-MATRIZ-43-FUENTES.md'),md);console.log(JSON.stringify(cuenta));
