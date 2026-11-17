// v1.4 §8 · Localización del selector de recetas y accesibilidad básica, en Chromium emulado (no es Safari real ni un
// dispositivo físico). Idioma de INTERFAZ ≠ idioma del DOCUMENTO. Uso: node tools/selector-ui-qa.cjs → evidence/recetas/selector-ui-qa.json
'use strict';
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');const LAB=path.resolve(__dirname,'..');
const ES=require('../i18n/es-words.cjs');const esSet=new Set((Array.isArray(ES)?ES:ES.words||[]).map(w=>w.toLowerCase()));
const cases=[];const add=(id,ok,d)=>{cases.push({id,result:ok?'PASS':'FAIL',detalle:d});console.log(ok?'PASS':'FAIL',id,ok?'':JSON.stringify(d).slice(0,300));};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const page=await b.newPage({viewport:{width:1440,height:900}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('file://'+path.join(LAB,'out/v3/profesional/preparar-entrega.html'));
 const panel=()=>page.evaluate(()=>[...document.querySelectorAll('[data-t],#fPerfil option,#fFase option,#recList,#recCount,#recDetail')].map(e=>e.innerText).join('\n'));
 await page.locator('[data-rec="RP01"]').first().click();const es1=await panel();
 await page.locator('input[name=uilang][value=en]').check();await page.locator('[data-rec="RP13"]').first().click();await page.locator('[data-rec="RP01"]').first().click();const en1=await panel();
 const docLang=await page.evaluate(()=>document.querySelector('[name=idioma]:checked').value);
 const PROJ=/Fixture|Estudio|RUBIK|RP\d\d|·/;const resid=[...new Set(en1.split(/[^A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+/).filter(w=>w.length>2&&esSet.has(w.toLowerCase())))];
 add('UI-01 interfaz en inglés con documento en español: idiomas independientes',docLang==='es'&&/Apply the recipe|Cannot be issued|No client download/.test(en1)&&/You will get|Check/.test(en1)&&/Aplicar la receta/.test(es1),{docLang,muestra:en1.slice(0,300)});
 add('UI-02 sin restos en español en el selector con interfaz en inglés (nombres de documento y datos aparte)',resid.length<=3,{resid});
 await page.locator('[data-rec="RP13"]').first().click();const c13=await page.locator('#recDetail').innerText();add('UI-03 estados, errores y contratos localizados (RP13, contrato)',/What it will require|No client download/.test(c13),{c13:c13.slice(0,200)});
 // teclado y foco
 await page.locator('input[name=uilang][value=es]').focus();await page.keyboard.press('Tab');const f1=await page.evaluate(()=>{const a=document.activeElement;const st=getComputedStyle(a);return {tag:a.tagName,outline:st.outlineStyle,ow:st.outlineWidth,boxShadow:st.boxShadow};});
 add('UI-04 teclado: el foco avanza y es visible',f1.tag!=='BODY'&&(f1.outline!=='none'||f1.boxShadow!=='none'),f1);
 // reflujo a 320 px y zoom 200 % emulado
 for(const [w,s] of [[320,1],[640,2]]){const p2=await b.newPage({viewport:{width:w,height:800},deviceScaleFactor:s});await p2.goto('file://'+path.join(LAB,'out/v3/profesional/preparar-entrega.html'));await p2.locator('input[name=uilang][value=en]').check();
  const ov=await p2.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);add(`UI-05 reflujo ${w}px (escala ${s}): sin desplazamiento horizontal`,ov<=1,{ov});await p2.close();}
 add('UI-06 sin errores de página',!errs.length,errs);await b.close();
 const out={schema:'rubik-lab-selector-ui-qa/1',navegador:'Chromium (Playwright, emulado)',pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases};
 fs.writeFileSync(path.join(LAB,'evidence/recetas/selector-ui-qa.json'),JSON.stringify(out,null,1));console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);})();
