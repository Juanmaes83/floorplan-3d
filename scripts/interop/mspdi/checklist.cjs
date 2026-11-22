#!/usr/bin/env node
'use strict';
/* M13 · Genera la hoja de comprobación manual en Microsoft Project y GanttProject a partir de los XML de muestra:
 * por fila, lo que la aplicación debe mostrar (nombre, inicio, fin, duración, hito y predecesoras con tipo y desfase).
 * Lee el propio XML (no el plan de origen), para que la hoja describa exactamente el archivo que se abre.
 * Uso: node scripts/interop/mspdi/checklist.cjs docs/integration/m13-mspdi/muestras > docs/integration/m13-mspdi/COMPROBACION-APLICACIONES.md */
const fs=require('node:fs'),path=require('node:path');
const dir=process.argv[2];if(!dir){console.error('Uso: checklist.cjs DIR-MUESTRAS');process.exit(1);}
const MSP={0:'FF',1:'FC',2:'CF',3:'CC'},EN={0:'FF',1:'FS',2:'SF',3:'SS'};
const val=(x,n)=>{const m=new RegExp(`<${n}>([^<]*)</${n}>`).exec(x);return m?m[1]:null;};
const unesc=s=>s&&s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const dmy=iso=>{const [d,t]=iso.split('T');const [y,m,dd]=d.split('-');return `${dd}/${m}/${y} ${t.slice(0,5)}`;};
const ORDER=['interfaz-escritorio.mspdi.xml','milestones.xml','dependencyTypes.xml','textAndCalendar.xml','simpleHouse.xml','complex.xml'];
const out=[`# M13 · Comprobación en Microsoft Project y GanttProject

Hoja generada por \`scripts/interop/mspdi/checklist.cjs\` a partir de los XML de \`muestras/\`: describe **exactamente** lo que contiene cada archivo. La lectura con MPXJ 13.12.0 ya da estos mismos valores campo a campo (\`verify-report.json\`), y queda acreditada como **prueba del lector**. Esta hoja sirve para comprobarlo **en las aplicaciones**.

## Cómo abrir

| Aplicación | Pasos |
|---|---|
| Microsoft Project (escritorio) | 1. Archivo › Abrir y elegir el \`.xml\` (tipo «Formato XML»).<br>2. Si pregunta, «Como un nuevo proyecto».<br>3. Añadir las columnas **Id**, **Nombre**, **Duración**, **Comienzo**, **Fin**, **Predecesoras**, **Tipo de restricción**, **Fecha de restricción** y **Texto1** («RUBIK id») |
| GanttProject 3.4 | 1. Proyecto › Importar › Microsoft Project (\`.xml\`).<br>2. Revisar la tabla y el Gantt.<br>3. Abrir cada dependencia en «Propiedades de la tarea» › Predecesoras |

## Qué debe cumplirse en todos los archivos

1. **Ninguna fecha se mueve al abrir.** Cada tarea lleva «No comenzar antes de» en su inicio, y el calendario del proyecto es «RUBIK · días naturales (7 días)», con sábados y domingos laborables.
2. Las **duraciones** son días naturales: una tarea que cruza un fin de semana conserva sus días.
3. Los **hitos** tienen duración 0 y aparecen con el símbolo de hito.
4. Las **predecesoras** conservan tipo y desfase: FC/CC/FF/CF en Microsoft Project en español, que en GanttProject equivalen a Fin-Inicio, Inicio-Inicio, Fin-Fin e Inicio-Fin.
5. **Avance 0 %** en todas las tareas, sin fechas reales ni costes: es un plan, no una ejecución.
6. En Microsoft Project, **Texto1** muestra el id de RUBIK y **Texto2** su WBS. GanttProject puede no mostrar los campos personalizados: no es un fallo del archivo.

**Nota sobre el fin en GanttProject:** la duración en días es la referencia. Si la columna «Fin» de GanttProject muestra el día siguiente al último día de trabajo, es su convención de visualización, no un desplazamiento: comprobar que la barra termina al final del día indicado aquí.

**Formato de las columnas:** «Inicio» y «Fin» se dan como dd/mm/aaaa hh:mm. En «Predecesoras», «2CC+4 días» significa que depende de la fila 2, de comienzo a comienzo, con 4 días de desfase.
`];
for(const f of ORDER){
  const file=path.join(dir,f);if(!fs.existsSync(file))continue;
  const xml=fs.readFileSync(file,'utf8'),tasks=[...xml.matchAll(/<Task>([\s\S]*?)<\/Task>/g)].map(m=>m[1]).filter(t=>val(t,'UID')!=='0');
  const idOfUid=new Map(tasks.map(t=>[val(t,'UID'),val(t,'ID')]));
  const rows=tasks.map(t=>{const ms=val(t,'Milestone')==='1',h=Number(/PT(\d+)H/.exec(val(t,'Duration'))[1]),days=h/8;
    const preds=[...t.matchAll(/<PredecessorLink>([\s\S]*?)<\/PredecessorLink>/g)].map(m=>{const p=m[1],lag=Number(val(p,'LinkLag'))/4800;return `${idOfUid.get(val(p,'PredecessorUID'))}${MSP[val(p,'Type')]}${lag?(lag>0?'+':'')+lag+(Math.abs(lag)===1?' día':' días'):''}`;});
    return {id:val(t,'ID'),name:unesc(val(t,'Name')),start:dmy(val(t,'Start')),finish:dmy(val(t,'Finish')),dur:ms?'0 días (hito)':`${days} ${days===1?'día':'días'}`,preds:preds.join('; ')||'—',rubik:/<FieldID>188743731<\/FieldID><Value>([^<]*)</.exec(t)[1]};});
  const ms=rows.filter(r=>/hito/.test(r.dur)).length,links=rows.reduce((s,r)=>s+(r.preds==='—'?0:r.preds.split('; ').length),0);
  out.push(`\n## \`${f}\`\n\n${unesc(val(xml,'Title'))} · **${rows.length} filas**, ${ms} hitos y ${links} dependencias. Inicio del proyecto: ${rows.length?dmy(val(xml,'StartDate')):'—'} · fin: ${rows.length?dmy(val(xml,'FinishDate')):'—'}.\n`);
  const show=f==='complex.xml'?[...rows.slice(0,6),...rows.filter(r=>/hito/.test(r.dur))]:rows;
  if(f==='complex.xml')out.push('Se listan las 6 primeras filas y los 6 hitos. Comprobar además el total de filas, de hitos y de dependencias, y que el fin del proyecto coincide.\n');
  out.push('| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |\n|---|---|---|---|---|---|---|---|---|');
  for(const r of show)out.push(`| ${r.id} | ${r.name.replace(/\|/g,'\\|')} | ${r.start} | ${r.finish} | ${r.dur} | ${r.preds} | ${r.rubik} | ☐ | ☐ |`);
}
out.push(`\n## Resultado de la comprobación externa

| Aplicación y versión | Archivos comprobados | Resultado | Observaciones | Quién y fecha |
|---|---|---|---|---|
| Microsoft Project | | ☐ correcto ☐ con diferencias | | |
| GanttProject 3.4.x | | ☐ correcto ☐ con diferencias | | |
`);
process.stdout.write(out.join('\n')+'\n');
