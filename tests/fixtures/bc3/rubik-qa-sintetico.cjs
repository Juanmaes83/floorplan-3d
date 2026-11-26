'use strict';
// SYNTHETIC TEST ONLY · reconstrucción del BC3 de la prueba humana §5.2 («RUBIK QA BC3 SINTETICO», columnas Zona A / Zona B).
// El archivo original del propietario no está en el repositorio: códigos, textos y precios son inventados; el valor de
// Zona B de ROBLE (42,75 €/m²) es el que el propietario vio en su captura. Incluye una referencia de unidad incompatible.
const records=[
 '~V|RUBIK QA|FIEBDC-3/2016|Generador de prueba|Precios\\Zona A\\Zona B|ANSI||||||',
 '~C|QA##||RUBIK QA BC3 SINTETICO|||0|',
 '~C|QA01#||Pavimentos de prueba|||0|',
 '~C|ROBLE|m2|Pavimento de parqué de roble natural barnizado, colocado flotante sobre lámina de polietileno|39.9\\42.75|01112026\\|0|',
 '~C|ROBLE-UD|ud|Tabla suelta de roble para reposición (unidad, no superficie)|4.1\\4.4|01112026\\|0|',
 '~C|PORCEL|m2|Pavimento porcelánico rectificado 60×60|31.2\\33.6|01112026\\|0|',
 '~D|QA|QA01#\\1\\1\\||',
 '~D|QA01#|ROBLE\\1\\1\\ROBLE-UD\\1\\1\\PORCEL\\1\\1\\||'
];
const text=records.join('\r\n')+'\r\n\x1a';
module.exports={text,bytes:()=>new Uint8Array(Buffer.from(text,'latin1'))};
