import * as THREE from '../vendor/three/build/three.module.js';

const $ = id => document.getElementById(id);
const Core = window.FloorPlanCore;
const { directSun, droneFlight } = window.FloorPlanSunDrone;
const { inspectPlan } = window.FloorPlanValidation;
const units = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const number = value => units.format(value);
const checks = {
  'door-opening-width': 'Ancho del hueco de puerta',
  'passage-opening-height': 'Altura del hueco de paso',
  'declared-room-height': 'Altura libre declarada',
  'bedroom-area': 'Superficie de dormitorio',
  'stair-width': 'Ancho de escalera',
  'stair-headroom': 'Altura libre sobre la escalera'
};

function example() {
  const project = Core.initial();
  const { center } = Core.geometry(project);
  const ring = [[499980, 4399980], [500020, 4399980], [500020, 4400020], [499980, 4400020]];
  project.site = {
    northOffsetDeg: 0,
    location: { latitude: 40.4168, longitude: -3.7038, timeZone: 'Europe/Madrid' },
    parcel: window.FloorPlanParcelCore.normalizeParcel({
      reference: 'EXAMPLE0000001', sourceCrs: 'EPSG:25830',
      sourceGeometry: { type: 'MultiPolygon', polygons: [{ rings: [ring] }] }
    }),
    buildingPlacement: {
      horizontal: { modelAnchorMm: center, parcelLocalAnchorMm: { x: 0, y: 0 }, source: { type: 'user-entered' } }
    }
  };
  return project;
}

let source = example();
let uploadRevision = 0;
const canvas = $('flight');
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100000);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8eeeb');
scene.add(new THREE.HemisphereLight('#ffffff', '#8f8a78', 2.1));
const light = new THREE.DirectionalLight('#fff2d9', 2.1);
light.position.set(4, 10, 6);
scene.add(light);
const architecture = new THREE.Group();
scene.add(architecture);
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch { $('flight-state').textContent = 'WebGL no está disponible. Puedes consultar las comprobaciones y el sol.'; }
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#f6f2e7' });
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#b3aaa0', side: THREE.DoubleSide });
let flight;
let animation = 0;
let started;
const progress = $('progress');

function draw(time = +progress.value) {
  if (!renderer || flight?.status !== 'preview') return;
  const pose = flight.pose(time);
  camera.fov = pose.fov;
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  canvas.dataset.frame = String(time);
}

function layout() {
  if (!renderer || !canvas.clientHeight) return;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  flight = droneFlight(source, camera.aspect);
  const ready = flight.status === 'preview';
  $('play').disabled = progress.disabled = !ready;
  $('flight-state').textContent = ready
    ? 'Duración de la vista previa: ' + flight.duration + ' s.'
    : 'Hace falta geometría de muros para generar el vuelo.';
  if (ready) draw();
  else renderer.clear();
}

function stopFlight() {
  cancelAnimationFrame(animation);
  animation = 0;
  $('play').textContent = 'Reproducir vuelo';
}

function rebuildScene() {
  stopFlight();
  progress.value = '0';
  for (const mesh of [...architecture.children]) {
    mesh.geometry.dispose();
    mesh.removeFromParent();
  }
  const levels = source.levels || [{ project: source, offsetMm: { x: 0, y: 0 }, elevationMm: 0 }];
  for (const level of levels) {
    const { walls, rooms } = Core.geometry(level.project);
    for (const wall of walls.filter(w => w.status !== 'demolished')) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.spanMm / 1000, wall.height, wall.thickness / 1000), wallMaterial);
      mesh.position.set((wall.center[0] + level.offsetMm.x) / 1000, level.elevationMm / 1000 + wall.height / 2,
        (wall.center[1] + level.offsetMm.y) / 1000);
      mesh.rotation.y = -wall.angle;
      architecture.add(mesh);
    }
    for (const room of rooms) {
      const shape = new THREE.Shape(room.poly.map(([x, y]) =>
        new THREE.Vector2((x + level.offsetMm.x) / 1000, -(y + level.offsetMm.y) / 1000)));
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = level.elevationMm / 1000;
      architecture.add(mesh);
    }
  }
  layout();
}

function list(id, rows) {
  $(id).replaceChildren(...rows.map(text => {
    const row = document.createElement('li');
    row.textContent = text;
    return row;
  }));
}

function evaluate() {
  const report = inspectPlan(source, { setbackMm: $('setback').valueAsNumber * 1000 });
  const { surfaces, setback, findings } = report;
  $('areas').textContent = surfaces.areaM2 === null ? 'Superficie no disponible.'
    : 'Superficie útil: ' + number(surfaces.areaM2) + ' m²' +
      (surfaces.status === 'estimated' ? ' · estimada' : ' · escala confirmada') +
      (surfaces.complete ? '' : ' · subtotal de estancias con dato');
  $('parcel').textContent = setback.measuredMm === undefined ? 'Retranqueo pendiente de datos de parcela, implantación o referencia.'
    : setback.reason === 'outside-parcel' ? 'La huella modelada sale de la parcela.'
    : 'Distancia mínima modelada al lindero: ' + number(setback.measuredMm / 1000) + ' m · ' +
      (setback.status === 'review' ? 'requiere revisión' : 'dentro de la referencia');
  const projectFor = levelId => source.levels ? source.levels.find(level => level.id === levelId)?.project : source;
  const roomLabel = (id, levelId) => {
    const roomIndex = projectFor(levelId)?.rooms.findIndex(r => r.id === id);
    const level = source.levels?.findIndex(l => l.id === levelId);
    return (level >= 0 ? 'Planta ' + (level + 1) + ' · ' : '') +
      (roomIndex >= 0 ? 'Estancia ' + (roomIndex + 1) : id);
  };
  $('finding-count').textContent = 'Revisiones del plano (' + findings.length + ')';
  list('findings', findings.map(row => checks[row.kind] + ' · ' + roomLabel(row.id, row.levelId) + ' · ' +
    (row.status === 'insufficient-data' ? 'dato sin comprobar' : number(row.measured) + ' ' + row.unit +
      ' (referencia ' + number(row.reference) + ' ' + row.unit + ')')));
  const solar = directSun(source, $('date').value);
  const solarReason = {
    timeZone: 'zona horaria', coordinates: 'coordenadas', north: 'norte',
    'date-time-zone': 'fecha y zona horaria', 'non-standard-local-day': 'día con cambio de hora'
  };
  list('sun-results', solar.status === 'indicative'
    ? solar.rooms.map(row => roomLabel(row.roomId, row.levelId) + ' · ' + (row.directHours === null
      ? 'sin ventana exterior identificada' : number(row.directHours) + ' h'))
    : ['Cálculo no disponible. Revisa ' + (solarReason[solar.reason] || 'los datos solares') + '.']);
  $('status').textContent = 'Evaluación completada.';
}

$('inputs').addEventListener('submit', event => {
  event.preventDefault();
  evaluate();
});
$('file').addEventListener('change', async () => {
  const revision = ++uploadRevision;
  const file = $('file').files[0];
  if (!file) return;
  try {
    const content = await file.text();
    if (revision !== uploadRevision) return;
    const candidate = JSON.parse(content);
    if (window.FloorPlanBuilding.isBuilding(candidate)) window.FloorPlanBuilding.validate(candidate);
    else Core.validate(candidate);
    source = candidate;
    $('source').textContent = 'Proyecto local · ' + file.name;
    rebuildScene();
    evaluate();
  } catch (error) {
    if (revision === uploadRevision) $('status').textContent = 'No se pudo evaluar el archivo: ' + error.message;
  }
});
$('play').addEventListener('click', () => {
  if (animation) return stopFlight();
  if (+progress.value >= flight.duration) progress.value = '0';
  started = performance.now() - +progress.value * 1000;
  $('play').textContent = 'Pausar vuelo';
  function tick(now) {
    const time = Math.min((now - started) / 1000, flight.duration);
    progress.value = String(time);
    draw(time);
    if (time >= flight.duration) stopFlight();
    else animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
});
progress.addEventListener('input', () => { stopFlight(); draw(); });
new ResizeObserver(layout).observe(canvas);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopFlight(); });
if (!renderer) $('play').disabled = progress.disabled = true;
rebuildScene();
evaluate();
