/* Asesor RUBIK · SKILLS del agente con INTERROGATORIO SOCRÁTICO (laboratorio; determinista, sin modelo ni red).
   Principios (aplican a todos los skills):
   - Memoria explícita y visible: nombre, tarea y misión final. La persona la ve, la corrige y la puede olvidar.
   - Socrático: primero preguntas abiertas para entender qué quiere y qué necesita; después un resumen con sus palabras y
     «¿Lo he entendido bien?». Nada se propone antes de confirmar.
   - Realista y sincero: solo datos reales de RUBIK (superficies, tareas, presupuesto si el modo lo permite); lo estimado se
     dice; lo que falta se dice; nunca se inventan precios, fechas ni garantías.
   - Máxima seguridad legal: no hay asesoría legal, fiscal ni normativa vinculante; la normativa solo con fuente oficial
     verificada por un profesional; datos personales (DNI/NIE, IBAN, teléfono, correo) no se guardan ni se envían.
   - Respeta el modo: en modo cliente no hay costes internos; los cambios solo se proponen y se confirman en RUBIK. */
(function(root){'use strict';
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
 // Datos personales que nunca se guardan (se avisa y se descarta la respuesta).
 const PII=[[/\b\d{8}[a-z]\b|\b[xyz]\d{7}[a-z]\b/i,'un DNI o NIE'],[/\bES\d{2}[\s\d]{20,}/i,'un IBAN'],[/(\+34[\s-]?)?\b[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/,'un teléfono'],[/[^\s@]+@[^\s@]+\.[a-z]{2,}/i,'un correo electrónico']];
 const LEGAL=/licencia|permiso de obra|normativa|ley\b|legal|ilegal|multa|impuesto|iva\b|hacienda|fiscal|contrato|demanda|abogad|cte\b|codigo tecnico|accesibilidad obligatoria|urbanis/;
 const LEGAL_NOTE='No doy asesoría legal, fiscal ni normativa vinculante. Para licencias, normativa o impuestos consulta a un profesional colegiado o al organismo competente; RUBIK no verifica la normativa local.';
 const PROMISE=/garantiz|seguro que|sin duda|100 ?%|prometo/;
 const SKILLS={
  presupuesto:{titulo:'Presupuesto',preguntas:[
    ['alcance','¿Qué quieres conseguir con la obra o el proyecto, con tus palabras?'],
    ['prioridad','Si tuvieras que elegir, ¿qué es lo más importante: plazo, calidad o coste? ¿Por qué?'],
    ['limite','¿Tienes un límite de gasto? Puedes decir una cifra aproximada o «aún no lo sé».'],
    ['incluye','¿Qué debería incluir sí o sí, y qué podría quedar fuera?']]},
  organizacion:{titulo:'Organización',preguntas:[
    ['objetivo','¿Cuál es el resultado final que necesitas tener terminado?'],
    ['personas','¿Quién participa y quién decide en cada paso?'],
    ['bloqueos','¿Qué te está frenando ahora mismo?']]},
  puntualidad:{titulo:'Puntualidad y plazos',preguntas:[
    ['fecha','¿Para qué fecha lo necesitas? (por ejemplo 2026-12-20)'],
    ['dias','¿Cuántos días de trabajo crees que hacen falta?'],
    ['dependencias','¿De qué o de quién depende que se cumpla (permisos, proveedores, cliente)?']]},
  negocio:{titulo:'Negocio',preguntas:[
    ['cliente','¿Quién es tu cliente ideal para este trabajo?'],
    ['valor','¿Qué valor concreto recibe ese cliente que no consigue en otro sitio?'],
    ['medida','¿Cómo sabrás que ha salido bien? Dime una medida (encargos, margen, plazo de cobro…).']]}};

 class Mentor{
  constructor({rubik,mode='cliente',tools=root.AsesorTools,now=()=>new Date()}){Object.assign(this,{rubik,mode,tools,now});this.memoria={nombre:null,tarea:null,mision:null};this.skill=null;this.i=0;this.respuestas={};this.avisos=[];}
  recuerda(campo,valor){if(!['nombre','tarea','mision'].includes(campo))return false;const v=String(valor||'').trim().slice(0,120);const pii=this._pii(v);if(pii){this.avisos.push(pii);return false;}this.memoria[campo]=v||null;return true;}
  olvida(){this.memoria={nombre:null,tarea:null,mision:null};this.respuestas={};this.skill=null;this.i=0;}
  _pii(t){for(const [re,what] of PII)if(re.test(t))return `Parece ${what}. No lo guardo ni lo envío: no hace falta para ayudarte.`;return null;}
  _hola(){return this.memoria.nombre?`${this.memoria.nombre}, `:'';}
  empieza(skill){if(!SKILLS[skill])return {tipo:'error',texto:'No conozco ese tema.'};this.skill=skill;this.i=0;this.respuestas={};
   const m=this.memoria.mision?` Recuerdo tu misión: «${this.memoria.mision}».`:'';
   return {tipo:'pregunta',texto:`${this._hola()}vamos con ${SKILLS[skill].titulo.toLowerCase()}.${m} ${SKILLS[skill].preguntas[0][1]}`,clave:SKILLS[skill].preguntas[0][0]};}
  // Una respuesta de la persona: filtro legal y de datos personales, luego la siguiente pregunta o el resumen.
  responde(texto){const t=String(texto||'').trim();if(!this.skill)return {tipo:'error',texto:'Elige primero un tema.'};
   const pii=this._pii(t);if(pii)return {tipo:'aviso',texto:pii+' Respóndeme sin ese dato, por favor.',clave:SKILLS[this.skill].preguntas[this.i][0]};
   if(LEGAL.test(fold(t)))this.avisos.push(LEGAL_NOTE);
   const [clave]=SKILLS[this.skill].preguntas[this.i];this.respuestas[clave]=t.slice(0,300);this.i++;
   const legal=LEGAL.test(fold(t))?{legal:LEGAL_NOTE}:{};
   if(this.i<SKILLS[this.skill].preguntas.length){const [k,q]=SKILLS[this.skill].preguntas[this.i];return {tipo:'pregunta',texto:this._eco(t)+q,clave:k,...legal};}
   return {tipo:'confirmar',texto:this._resumen()+' ¿Lo he entendido bien?',...legal};}
  _eco(t){const c=t.length>60?t.slice(0,57)+'…':t;return `Entiendo: «${c}». `;}
  _resumen(){const r=this.respuestas,s=this.skill;
   if(s==='presupuesto')return `Resumen: quieres ${r.alcance}; tu prioridad es ${r.prioridad}; límite: ${r.limite}; imprescindible: ${r.incluye}.`;
   if(s==='organizacion')return `Resumen: el resultado final es ${r.objetivo}; participan ${r.personas}; ahora te frena ${r.bloqueos}.`;
   if(s==='puntualidad')return `Resumen: lo necesitas para ${r.fecha}; estimas ${r.dias} días; depende de ${r.dependencias}.`;
   return `Resumen: tu cliente ideal es ${r.cliente}; le aportas ${r.valor}; lo medirás por ${r.medida}.`;}
  // Tras confirmar: propuesta basada SOLO en datos reales de RUBIK y en lo que la persona dijo. Nada inventado.
  confirma(si){if(!si){this.i=0;this.respuestas={};return {tipo:'pregunta',texto:'De acuerdo, empecemos de nuevo para entenderlo mejor. '+SKILLS[this.skill].preguntas[0][1],clave:SKILLS[this.skill].preguntas[0][0]};}
   const out=this['_'+this.skill]();if(PROMISE.test(fold(out.texto)))out.texto=out.texto.replace(/garantiz\w*/gi,'intentar');
   if(this.memoria.tarea)out.texto+=` (Tarea: «${this.memoria.tarea}».)`;out.avisos=[...new Set(this.avisos)];return out;}
  _session(){return {state:'live',profile:'architecture',mode:this.mode,projectId:this.rubik.project()?.id,rubik:this.rubik};}
  _presupuesto(){const sup=this.tools.run(this._session(),'consultar_superficies',{});const m2=sup.ok?sup.data.totalM2:null;
   const base=m2?`La vivienda tiene ${m2.toLocaleString('es-ES')} m² útiles (dato de RUBIK${sup.data.estancias.some(e=>e.estado!=='measured')?', medida estimada: la escala no está calibrada':''}).`:'No tengo la superficie del proyecto.';
   if(this.mode==='cliente')return {tipo:'propuesta',texto:`${base} En esta sesión no puedo mostrar costes internos: es una consulta para el cliente. Anoto tu límite («${this.respuestas.limite}») y tus imprescindibles para que el profesional prepare el presupuesto con precios revisados.`,datos:{m2,importes:null}};
   const b=this.tools.run(this._session(),'resumen_presupuesto',{});
   if(!b.ok)return {tipo:'propuesta',texto:`${base} No puedo leer el presupuesto ahora (${b.error}).`,datos:{m2}};
   const neto=b.data?.neto;const completo=neto&&neto.complete;
   return {tipo:'propuesta',texto:`${base} ${completo?`Presupuesto neto calculado por RUBIK: ${neto.amount.toLocaleString('es-ES')} €.`:`El presupuesto aún no tiene un total fiable: faltan precios en algunas partidas${Number.isFinite(neto?.partialAmount)?` (suma parcial de lo que sí tiene precio: ${neto.partialAmount.toLocaleString('es-ES')} €, no es un total)`:''}.`} Contrasta con tu límite («${this.respuestas.limite}») antes de comprometer nada.`,datos:{m2,neto}};}
  _organizacion(){const G=this.rubik.win?.FloorPlanGuideUI;let tareas=[];try{tareas=G.progress().tasks.filter(t=>t.necessary).map(t=>({t:t.title?.[0]||t.id,s:t.status}));}catch{}
   const pend=tareas.filter(x=>x.s!=='completed');
   return {tipo:'propuesta',texto:`Para llegar a «${this.respuestas.objetivo}»: ${pend.length?`en RUBIK te quedan ${pend.length} tareas del proyecto (${pend.map(x=>x.t).join(', ')}).`:'en RUBIK no te quedan tareas necesarias del proyecto.'} Primer paso: resolver lo que te frena (${this.respuestas.bloqueos}) y que quien decide (${this.respuestas.personas}) lo valide.`,datos:{tareas}};}
  _puntualidad(){const fecha=new Date(this.respuestas.fecha+'T00:00:00Z'),hoy=this.now(),dias=Number(String(this.respuestas.dias).match(/\d+/)?.[0]);
   if(isNaN(fecha)||!Number.isFinite(dias))return {tipo:'propuesta',texto:'Necesito una fecha (AAAA-MM-DD) y un número de días para ser realista. ¿Me los dices?',datos:{}};
   const habiles=Math.max(0,Math.floor((fecha-hoy)/86400000*5/7)),margen=Math.ceil(dias*1.2);
   const ok=habiles>=margen;
   return {tipo:'propuesta',texto:`Quedan unos ${habiles} días laborables hasta ${this.respuestas.fecha}. Con un margen realista del 20 % necesitarías ${margen}. ${ok?'Es alcanzable si se cumplen las dependencias':'Es ajustado: no puedo decir que se cumpla'} (${this.respuestas.dependencias}). No es un compromiso: depende de terceros.`,datos:{habiles,margen,alcanzable:ok}};}
  _negocio(){return {tipo:'propuesta',texto:`Propuesta para tu cliente (${this.respuestas.cliente}): pon por delante ${this.respuestas.valor} y enséñalo con el proyecto en 3D y su entrega. Mide el resultado por ${this.respuestas.medida}, empezando con un objetivo pequeño. No es una garantía de resultados.`,datos:{}};}
 }
 root.AsesorSkills=Object.freeze({Mentor,SKILLS,LEGAL_NOTE});
})(typeof self!=='undefined'?self:globalThis);
