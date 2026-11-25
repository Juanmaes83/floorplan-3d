/* Asesor RUBIK · los seis perfiles salen de la configuración ÚNICA js/assistant-unified.js (§2.1). Esta capa conserva la
   interfaz AsesorProfiles que ya usan el laboratorio y la entrada desde Home. */
(function(root){'use strict';
 const U=root.RubikAssistantUnified||(typeof require==='function'?require('../../js/assistant-unified.js')&&root.RubikAssistantUnified:null);
 root.AsesorProfiles=Object.freeze({ids:U.ids,get:id=>U.profile(id),valid:id=>U.ids.includes(id)});
})(typeof self!=='undefined'?self:globalThis);
