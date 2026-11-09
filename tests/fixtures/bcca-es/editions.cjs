'use strict';
// SYNTHETIC TEST ONLY: two invented editions of a BCCA-like price base (codes, texts and prices are invented).
// Edition 2025 changes one price, keeps another, removes one item and changes one unit, to test explicit updates.
const Fiebdc=require('../../../js/fiebdc3-codec.js');
const file=records=>records.join('\r\n')+'\r\n\x1a';
const ed=(edition,rows)=>{const codes=rows.map(r=>r.split('|')[1]).filter(c=>c!=='SYN-EXC');return file([
  `~V|SYNTHETIC TEST ONLY|FIEBDC-3/2016|Synthetic generator|Precio|ANSI||||||`,
  '~C|SYNB##||Base ficticia|||0|',
  '~C|01#||Movimiento de tierras ficticio|||0|',
  '~C|02#||Albañilería ficticia|||0|',
  ...rows,
  '~D|SYNB##|01#\\1\\1\\02#\\1\\1\\||',
  '~D|01#|SYN-EXC\\1\\1\\||',
  `~D|02#|${codes.map(c=>c+'\\1\\1\\').join('')}|`
]);};
const e2024=ed('2024',[
  '~C|SYN-EXC|m3|Excavación ficticia|9.5|01012024|0|',
  '~C|SYN-FAB|m2|Fábrica de ladrillo ficticia|31.2|01012024|0|',
  '~C|SYN-PUE|ud|Puerta de paso ficticia|180|01012024|0|',
  '~C|SYN-ROD|m|Rodapié ficticio|8.4|01012024|0|',
  '~C|SYN-OLD|m2|Partida retirada ficticia|12|01012024|0|',
  '~C|SYN-NOPRICE|m2|Partida sin precio ficticia||01012024|0|'
]);
const e2025=ed('2025',[
  '~C|SYN-EXC|m3|Excavación ficticia|10.1|01012025|0|',
  '~C|SYN-FAB|m2|Fábrica de ladrillo ficticia|33.7|01012025|0|',
  '~C|SYN-PUE|ud|Puerta de paso ficticia|180|01012025|0|',
  '~C|SYN-ROD|kg|Rodapié ficticio por peso|2.1|01012025|0|',
  '~C|SYN-NOPRICE|m2|Partida sin precio ficticia||01012025|0|'
]);
const source=edition=>({label:`SYNTHETIC TEST ONLY — BCCA-like ${edition}`,sourceName:'SYNTHETIC TEST ONLY — invented BCCA-like dataset',sourceUrl:null,edition,attribution:null,licenseName:null,licenseUrl:null});
const bytes=text=>new Uint8Array(Buffer.from(text,'latin1'));
module.exports={e2024,e2025,source,bytes,model:text=>Fiebdc.parse(bytes(text))};
