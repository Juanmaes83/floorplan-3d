// v1.3 · Inglés. Traductor del DOM compuesto (documentos y web) con el diccionario i18n/en.json, ANTES de paginar.
// Se evalúa en la página como (I18N)(dict, data): recorre nodos de texto y alt/aria-label/title.
//  1) frase exacta del diccionario (texto normalizado del nodo);
//  2) si no, reglas ordenadas [patrón, sustitución] sobre el texto (fragmentos con números o datos del proyecto);
//  3) números de formato español → inglés (12,37 → 12.37; 1.572,78 → 1,572.78), salvo escalas 1:50 y huellas;
//  4) meses y fechas.
// Los DATOS DEL PROYECTO (nombres de estancias, materiales, objetos, partidas, estudio, título, texto del estudio) no se
// traducen: el texto del estudio se marca lang="es". Devuelve las cifras y los restos en español para el gate del compositor.
function I18N(dict,data,mode){
 const norm=s=>s.replace(/\s+/g,' ').trim();
 const ALL=Array.isArray(data)?data:data.all,MASK=Array.isArray(data)?[]:data.mask;
 const dataSet=new Set(ALL.map(norm));
 // Un texto dentro de [data-ui] es interfaz aunque coincida con un dato (la leyenda «Ventana» frente a la partida «Ventana»):
 // se traduce y el gate no lo enmascara.
 // Los nombres del proyecto se protegen con marcadores mientras actúan las reglas (p. ej. « y » → « and » no debe tocar
 // «Fernández y Sánchez»); se restauran al final. La búsqueda exacta va antes, sobre el texto sin proteger.
 const masks=MASK.map(norm).filter(x=>x.length>=4).sort((a,b)=>b.length-a.length);
 const protect=t=>{const keep=[];for(const m of masks){if(!t.includes(m))continue;t=t.split(m).join('\u0001'+keep.length+'\u0002');keep.push(m);}return [t,keep];};
 const restore=(t,keep)=>t.replace(/\u0001(\d+)\u0002/g,(_,i)=>keep[+i]);
 const rules=dict.rules.map(([p,r,f])=>[new RegExp(p,f||'g'),r]);
 const exact=dict.exact;
 const esNum=/(?<![\w:.,/-])(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)(?![\w:]|[.,]\d)/g;
 const toEn=s=>s.replace(esNum,m=>m.replace(/\./g,'§').replace(',','.').replace(/§/g,','));
 const rule=s0=>{let [s,keep]=protect(s0);for(const [re,r] of rules)s=s.replace(re,r);return restore(toEn(s),keep);};
 // frase exacta → cada frase (exacta o reglas) → reglas sobre el conjunto
 const phrase=n=>{if(exact[n]!==undefined)return toEn(exact[n]);const parts=n.split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ¿«(0-9])/);
  if(parts.length>1)return parts.map(x=>exact[x]!==undefined?toEn(exact[x]):rule(x)).join(' ');return rule(n);};
 const tr=(t,ui)=>{const n=norm(t);if(!n||(!ui&&dataSet.has(n)))return t;const lead=t.match(/^\s*/)[0],trail=t.match(/\s*$/)[0];return lead+phrase(n)+trail;};
 let n;const nodes=[];
 if(mode!=='check'){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while((n=w.nextNode())){if(n.parentElement.closest('script,style,[lang="es"]:not(html)'))continue;nodes.push(n);}
  for(const t of nodes)t.textContent=tr(t.textContent,!!t.parentElement.closest('[data-ui]'));
  for(const e of document.querySelectorAll('[alt],[aria-label],[title]'))for(const a of ['alt','aria-label','title'])if(e.getAttribute(a)&&!e.closest('[lang="es"]:not(html)'))e.setAttribute(a,tr(e.getAttribute(a)));
  document.title=tr(document.title);document.documentElement.lang='en';}
 if(mode==='translate')return {nodes:nodes.length};
 // gate: se enmascaran los datos del proyecto (los más largos primero, sin distinguir mayúsculas) y se buscan palabras españolas
 const ES=new Set(dict.spanishWords);const gateMasks=[...dataSet].filter(x=>x.length>1).sort((a,b)=>b.length-a.length).map(x=>new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'));
 const residual=[];const check=(txt,where,ui)=>{let m=txt;if(!ui)for(const re of gateMasks)m=m.replace(re,' ');
  for(const wd of m.toLowerCase().split(/[^a-záéíóúüñ¿¡]+/i)){if(!wd)continue;if(ES.has(wd)||/[áéíóúñ¿¡]/.test(wd))residual.push({w:wd,t:txt.slice(0,90),where});}};
 const w2=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while((n=w2.nextNode())){if(n.parentElement.closest('script,style,[lang="es"]:not(html)'))continue;const t=norm(n.textContent);if(t)check(t,'texto',!!n.parentElement.closest('[data-ui]'));}
 for(const e of document.querySelectorAll('[alt],[aria-label],[title]'))for(const a of ['alt','aria-label','title'])if(e.getAttribute(a)&&!e.closest('[lang="es"]:not(html)'))check(e.getAttribute(a),a);
 check(document.title,'title');
 // texto generado por CSS (content: "…"): no es un nodo de texto, pero se ve en pantalla
 for(const st of document.querySelectorAll('style'))for(const m of st.textContent.matchAll(/content:\s*(['"])((?:(?!\1).)+)\1/g))if(/[a-záéíóúñ]{3}/i.test(m[2]))check(m[2],'css content');
 return {nodes:nodes.length,residual};
}
