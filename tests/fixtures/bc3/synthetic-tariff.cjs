'use strict';
// SYNTHETIC TEST ONLY: invented codes, descriptions and prices of a studio tariff in BC3 with two price columns.
const records=[
 '~V|ESTUDIO DE PRUEBA|FIEBDC-3/2016|Generador de prueba|Precios\\Zona A\\Zona B|ANSI||||||',
 '~C|TARIFA##||Tarifa de prueba|||0|',
 '~C|C01#||Acabados|||0|',
 '~C|PAV-ROBLE|m2|Pavimento de tarima de roble|38.5\\41|01092026\\|0|',
 '~C|PINT-LISA|m2|Pintura plástica lisa en paredes|7.9\\8.4|01092026\\|0|',
 '~C|PUERTA-LISA|ud|Puerta de paso lisa lacada|210\\225|01092026\\|0|',
 '~C|RODAPIE|ml|Rodapié de madera lacado|9.75\\10.2|01092026\\|0|',
 '~C|MORTERO|kg|Mortero de prueba|0.4|01092026|0|',
 '~D|TARIFA|C01#\\1\\1\\||',
 '~D|C01#|PAV-ROBLE\\1\\1\\PINT-LISA\\1\\1\\PUERTA-LISA\\1\\1\\RODAPIE\\1\\1\\MORTERO\\1\\1\\||'
];
const text=records.join('\r\n')+'\r\n\x1a';
module.exports={text,bytes:()=>new Uint8Array(Buffer.from(text,'latin1'))};
