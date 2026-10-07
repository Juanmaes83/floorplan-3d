'use strict';

const fs = require('node:fs/promises');
const fsNative = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../../../js/project-core.js');
const Review = require('../../../js/layout-review.js');

const MAX_PROJECT_BYTES = 15 * 1024 * 1024;
const MAX_LAYOUT_OBJECTS = 100;
const MAX_PAGE_SIZE = 100;
const MAX_RESPONSE_BYTES = 750 * 1024;

function fail(message) { throw new Error(message); }

function areaM2(polygon) {
  let twiceArea = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  return Math.round(Math.abs(twiceArea / 2) / 1_000_000 * 100) / 100;
}

function snapshotMeta(project, bytes, stat) {
  return {
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    schemaVersion: project.schemaVersion,
    projectId: project.id,
    projectName: project.name,
    sizeBytes: bytes.byteLength,
    modifiedAt: stat.mtime.toISOString(),
  };
}

function createProjectReader(inputPath) {
  if (typeof inputPath !== 'string' || !inputPath.trim()) fail('Indica la ruta de un JSON exportado.');
  const requestedPath = path.resolve(inputPath);
  let canonicalPath = null;

  async function load() {
    let linkInfo;
    try { linkInfo = await fs.lstat(requestedPath); }
    catch { fail('No se puede leer el archivo JSON seleccionado. Comprueba la ruta y los permisos.'); }
    if (linkInfo.isSymbolicLink()) fail('Por seguridad, selecciona el archivo JSON directamente, no un enlace simbólico.');
    const resolved = await fs.realpath(requestedPath);
    if (canonicalPath && resolved !== canonicalPath) fail('La ruta del JSON cambió tras iniciar el servidor. Reinícialo con el archivo elegido.');
    canonicalPath ||= resolved;
    const noFollow = fsNative.constants.O_NOFOLLOW || 0;
    const handle = await fs.open(resolved, fsNative.constants.O_RDONLY | noFollow);
    let bytes, stat;
    try {
      stat = await handle.stat();
      if (!stat.isFile()) fail('La ruta seleccionada no es un archivo normal.');
      if (stat.dev !== linkInfo.dev || stat.ino !== linkInfo.ino) fail('El archivo seleccionado cambió mientras se abría. Reinicia el servidor con el JSON correcto.');
      if (stat.size < 1 || stat.size > MAX_PROJECT_BYTES) fail('El JSON debe ocupar entre 1 byte y 15 MiB.');
      bytes = await handle.readFile();
    } finally { await handle.close(); }
    if (bytes.byteLength > MAX_PROJECT_BYTES) fail('El JSON supera el límite de 15 MiB.');
    let project;
    try { project = JSON.parse(bytes.toString('utf8')); }
    catch { fail('El archivo seleccionado no contiene JSON válido.'); }
    try { C.validate(project); }
    catch (error) { fail('El JSON no cumple FloorPlanProjectV1: ' + error.message); }
    return { project, snapshot: snapshotMeta(project, bytes, stat) };
  }

  return Object.freeze({ load });
}

function safeJson(value) {
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
    fail('La respuesta supera 750 KiB. Reduce el tamaño del proyecto o consulta los elementos por páginas.');
  }
  return value;
}

async function getSummary(reader) {
  const { project, snapshot } = await reader.load();
  const countedRooms = project.rooms.filter(r => r.countsTowardArea);
  return safeJson({
    snapshot,
    units: project.units,
    scaleConfidence: project.scale?.confidence ?? 'unknown',
    counts: {
      rooms: project.rooms.length,
      roomsCountingTowardArea: countedRooms.length,
      walls: project.walls.length,
      openings: project.openings.length,
      objects: project.objects.length,
      sourceImages: (project.sourceImages || []).length,
    },
    usefulAreaM2: Math.round(countedRooms.reduce((sum, r) => sum + areaM2(r.polygon), 0) * 100) / 100,
    note: 'La superficie se deriva de los polígonos de estancia del JSON; no es una medición certificada.',
  });
}

function projectElements(project, kind) {
  const map = { rooms: 'rooms', walls: 'walls', openings: 'openings', objects: 'objects' };
  const key = map[kind];
  if (!key) fail('Tipo de elemento no admitido.');
  return project[key];
}

function publicElement(kind, item) {
  if (kind === 'rooms') return {
    id: item.id, name: item.name, polygon: item.polygon,
    labelAt: item.labelAt, countsTowardArea: item.countsTowardArea,
    areaM2: areaM2(item.polygon),
  };
  if (kind === 'walls') return {
    id: item.id, start: item.start, end: item.end, thicknessMm: item.thicknessMm,
    heightMm: item.heightMm, structure: item.structure, status: item.status,
  };
  if (kind === 'openings') return {
    id: item.id, wallId: item.wallId, kind: item.kind, offsetMm: item.offsetMm,
    widthMm: item.widthMm, heightMm: item.heightMm, sillHeightMm: item.sillHeightMm,
    ...(item.swing ? { swing: item.swing } : {}),
  };
  return {
    id: item.id, type: item.type, name: item.name, position: item.position,
    size: item.size, rotationDeg: item.rotationDeg,
    ...(item.roomId ? { roomId: item.roomId } : {}),
  };
}

async function listElements(reader, args = {}) {
  const { project, snapshot } = await reader.load();
  const kind = args.kind;
  const all = projectElements(project, kind);
  const query = typeof args.query === 'string' ? args.query.trim().toLocaleLowerCase() : '';
  const filtered = all.filter(item => {
    if (args.roomId && item.roomId !== args.roomId) return false;
    if (!query) return true;
    return [item.id, item.name, item.type, item.kind].some(v => typeof v === 'string' && v.toLocaleLowerCase().includes(query));
  });
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isSafeInteger(args.limit) ? args.limit : 50));
  const offset = Math.max(0, Number.isSafeInteger(args.offset) ? args.offset : 0);
  return safeJson({
    snapshot, kind, total: filtered.length, offset, limit,
    items: filtered.slice(offset, offset + limit).map(item => publicElement(kind, item)),
  });
}

async function getElement(reader, args = {}) {
  const { project, snapshot } = await reader.load();
  const collections = ['rooms', 'walls', 'openings', 'objects'];
  for (const kind of collections) {
    const item = project[kind].find(candidate => candidate.id === args.id);
    if (item) return safeJson({ snapshot, kind, item: publicElement(kind, item) });
  }
  fail('No existe un elemento con ese ID en el JSON seleccionado.');
}

async function reviewLayout(reader, args = {}) {
  const { project, snapshot } = await reader.load();
  if (project.objects.length > MAX_LAYOUT_OBJECTS) {
    fail('La revisión MCP admite hasta 100 muebles por proyecto para mantener acotado el cálculo. La revisión del editor sigue disponible.');
  }
  const result = Review.review(project, {
    ...(args.clearanceMm === undefined ? {} : { clearanceMm: args.clearanceMm }),
  });
  return safeJson({ snapshot, ...result });
}

module.exports = {
  MAX_PROJECT_BYTES, MAX_LAYOUT_OBJECTS, MAX_RESPONSE_BYTES,
  createProjectReader, getSummary, listElements, getElement, reviewLayout,
};
