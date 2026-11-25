/* Render IA · catálogo CANÓNICO de estilos (§3, encargo 121ad35a). Lo usan la API (api/render.js), el cliente
   (js/ai-render-ui.js) y la muestra de Home. Cada estilo tiene un identificador estable, su etiqueta visible y el
   texto que se envía al generador. «Nórdico» y «Escandinavo» son UNA opción (id `scandinavian`); los alias aceptan
   identificadores de proyectos y peticiones anteriores sin romperlos. */
(function(root,factory){const c=factory();if(typeof module==='object'&&module.exports)module.exports=c;else root.RubikRenderStyles=c;})(typeof self!=='undefined'?self:globalThis,function(){'use strict';
 const STYLES=Object.freeze([
  {id:'natural',es:'Luz natural',en:'Natural light',zh:'自然光',prompt:'natural daylight, soft realistic shadows, neutral contemporary finishes'},
  {id:'warm',es:'Cálido',en:'Warm',zh:'温暖',prompt:'warm evening light, cosy atmosphere, warm wood and textile tones'},
  {id:'scandinavian',es:'Nórdico',en:'Nordic',zh:'北欧',prompt:'Scandinavian style, light oak, white walls, soft textiles, bright diffuse daylight'},
  {id:'industrial',es:'Industrial',en:'Industrial',zh:'工业风',prompt:'industrial loft style, exposed concrete and brick textures, black steel details, warm Edison-style lighting'},
  {id:'mediterranean',es:'Mediterráneo',en:'Mediterranean',zh:'地中海',prompt:'Mediterranean style, lime-washed white walls, terracotta and natural fibres, bright warm sunlight'},
  {id:'premium',es:'Premium inmobiliario',en:'Premium real estate',zh:'高端房产',prompt:'premium real-estate photography look, refined materials, balanced high-end lighting'}]);
 const ALIASES=Object.freeze({nordic:'scandinavian',nordico:'scandinavian','nórdico':'scandinavian',escandinavo:'scandinavian',mediterraneo:'mediterranean','mediterráneo':'mediterranean'});
 const ids=STYLES.map(s=>s.id);
 const canonical=id=>{if(typeof id!=='string')return null;const k=id.trim().toLowerCase();return ids.includes(k)?k:(Object.hasOwn(ALIASES,k)?ALIASES[k]:null);};
 const get=id=>STYLES.find(s=>s.id===canonical(id))||null;
 const label=(id,lang='es')=>{const s=get(id);return s?(s[lang]||s.es):null;};
 return Object.freeze({STYLES,ALIASES,ids,canonical,get,label,prompts:Object.freeze(Object.fromEntries(STYLES.map(s=>[s.id,s.prompt])))});});
