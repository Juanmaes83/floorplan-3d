'use strict';
// All identifiers, descriptions and prices below are invented for tests.
const Fiebdc=require('../../../js/fiebdc3-codec.js');
const file=records=>records.join('\r\n')+'\r\n\x1a';
const records=[
  '~V|SYNTHETIC TEST ONLY|FIEBDC-3/2016|Synthetic generator|Precios\\Norte\\Centro\\Sur|850||||||',
  '~C|ROOT##||Raíz ficticia|||0|',
  '~C|CAP#||Capítulo ficticio|||0|',
  '~C|SYN-FLOOR\\ALIASX\\|m2|Superficie ficticia|11\\12\\|01012026\\|0|',
  '~C|SYN-LENGTH|m|Longitud ficticia|3\\4\\5\\|02012026\\03012026\\|0|',
  '~C|SYN-KG|kg|Masa ficticia|7\\|01012026\\|0|',
  '~C|SYN-ZERO|m2|Precio cero ficticio|0\\|01012026\\|0|',
  '~C|SYN-EMPTY|m2|Sin precio ficticio||01012026|0|',
  '~C|SYN-NOUNIT||Sin unidad ficticia|9\\|01012026\\|0|',
  '~C|SYN-TEXT|m2||2\\|01012026\\|0|',
  '~D|ROOT|CAP\\1\\1\\||',
  '~D|CAP|SYN-FLOOR\\1\\1\\||',
  '~T|SYN-TEXT|Descripción ficticia del texto|'
];
const text=file(records);
const model=()=>Fiebdc.parse(text);
const single=()=>Fiebdc.parse(file([
  '~V|SYNTHETIC TEST ONLY|FIEBDC-3/2016|Synthetic generator|Precios\\Único|850||||||',
  '~C|SYN-SINGLE|m2|Partida única ficticia|6.5|01012026|0|'
]));
const duplicateLabels=()=>Fiebdc.parse(text.replace('Norte\\Centro\\Sur','Norte\\Norte\\Sur'));
const officialSource={label:'SYNTHETIC TEST ONLY — official-mode simulation',sourceName:'SYNTHETIC TEST ONLY — invented BCCA-like dataset',
  sourceUrl:'https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/bcca-ene-2024.html',
  edition:null,attribution:null,licenseName:null,licenseUrl:null};
module.exports={file,records,text,model,single,duplicateLabels,officialSource};
