'use strict';

const file=records=>records.join('\r\n')+'\r\n\x1a';

const base=file([
  '~V|Estudio Serra|FIEBDC-3/2024\\27102026|FloorPlan test|Precios\\Madrid\\Valencia|850||||||',
  '~K|2\\2\\2\\2\\2\\2\\2\\2\\EUR\\|0\\0\\0\\0\\21\\|2\\2\\2\\2\\2\\2\\2\\2\\2\\2\\2\\2\\EUR\\|1|',
  '~C|ROOT#|ud|Proyecto\\ principal|0\\125.5\\|27102026\\|0|',
  '~C|MAT-1\\ALIAS-1\\|m2|Pavimento cerámico|0\\25.50\\|27102026\\|0|',
  '~D|ROOT#|MAT-1\\1\\2\\|MAT-1\\1\\2\\\\|',
  '~T|MAT-1|Descripción de obra con eñe y línea dos\r\ncontinúa aquí|',
  '~W|MAD\\Madrid\\VAL\\Valencia\\|',
  '~X|dato sin interpretar|'
]);

const minimal=file([
  '~V|Autor|FIEBDC-3/2016|Generador|Precios|850||||||',
  '~C|ROOT#|ud|Obra|0|27102026|0|'
]);

module.exports={file,base,minimal};
