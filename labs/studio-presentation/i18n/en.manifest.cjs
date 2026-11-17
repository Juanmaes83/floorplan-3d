'use strict';

const exact = {
 'Plan de ejemplo importado: fechas ilustrativas y sin presupuesto vinculado (rotulado en la entrega).':
  'Imported example works plan, with illustrative dates and no linked budget, labelled in the delivery.',
 'Imágenes orientativas generadas con IA, rotuladas y siempre junto a la vista del modelo.':
  'Illustrative AI-generated images are labelled and shown alongside the model view.',
 'Ningún archivo de proyecto ni geometría en bruto.':'No editable project file or raw geometry.',
 'Solo el contacto del estudio.':'Only the studio contact details are included.',
 'Entrega completa.':'Complete delivery.',
 'RUBIK · Evolución de obra (FT3D-8) · Entrega · Generar vídeo':'RUBIK · Works progress (FT3D-8) · Delivery · Generate video',
 'RUBIK · Evolución de obra (FT3D-8) · Presentación de solo lectura':'RUBIK · Works progress (FT3D-8) · Read-only presentation',
 'RUBIK · Presentar mi vivienda · Grabar vídeo':'RUBIK · Present my home · Record video',
 'compositor del laboratorio (tools/compose.cjs)':'Laboratory composer (tools/compose.cjs)',
 'entrega compuesta':'Composed delivery',
 'rótulo de borrador estampado':'Draft mark applied',
 comprobado:'Verified',
 'pieza producida por el compositor':'Produced by the composer',
 'sin huella de origen registrada':'No source fingerprint recorded',
 'no disponible para comprobar':'Source unavailable for verification'
};

const mediaText = value => value == null ? value : (exact[value] || value
 .replace(/^HTML final podado \(sin scripts\) a partir de (.+)$/, 'Final script-free HTML pruned from $1')
 .replace(/^fotograma al (\d+) % del vídeo$/, 'Frame at $1% of the video')
 .replace(/^fotograma del segundo (\d+) del vídeo$/, 'Frame at second $1 of the video'));

function localizeManifest(manifest) {
 const when = gate => {
  const text = gate.t;
  if (exact[text]) return exact[text];
  if (gate.k==='Identidad del estudio' && gate.s==='ok') return text;
  return text.replace(/^Perfil sintético del laboratorio \((.*)\)\.$/, 'Synthetic laboratory profile ($1).')
   .replace(/^(.+), revisión (.+)\.$/, '$1, revision $2.')
   .replace(/^(\d+) de (\d+) partidas revisadas; precios de prueba de laboratorio\.$/, '$1 of $2 items reviewed. Laboratory test prices.')
   .replace(/^Grafo y texto \((\d+) archivos\) sin rastro de (.+)\.$/, 'The content graph and text ($1 files) contain none of the excluded sections: $2.');
 };
 manifest.gates = manifest.gates.map(g=>({...g,t:when(g)}));
 const base = ['Editable project', 'Interactive 3D visit (requires a published link)', 'Data from other projects'];
 manifest.notIncluded = [...base,...manifest.seleccion.excluidos.map(c=>'Section '+c),
  ...manifest.seleccion.omitidos.map(o=>'Resource '+o)];
 manifest.note = 'These fingerprints verify file integrity since export. They do not certify authorship or accuracy. The external digest is not a digital signature.';
 for (const {origin} of manifest.files) {
  for (const key of ['producer','transform','origenComprobado','from']) {
   if (Object.hasOwn(origin,key)) origin[key] = mediaText(origin[key]);
  }
 }
}

module.exports = {localizeManifest};
