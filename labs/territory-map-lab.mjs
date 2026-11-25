import { openParcelMap } from '../js/territory-map-adapter.mjs';
const $ = id => document.getElementById(id);
const choice = $('parcel-choice'), status = $('map-status'), container = $('map'), tilt = $('map-tilt');
const base = $('map-basemap'), attribution = $('map-attribution');
let controller, map;
function select(reference) {
  choice.value = reference;
  map?.select(reference);
  status.textContent = 'Parcela seleccionada · ' + reference;
}
async function show(parcels) {
  controller?.abort();
  const request = controller = new AbortController();
  map = null;
  base.setAttribute('aria-pressed', 'false');
  attribution.hidden = true;
  tilt.setAttribute('aria-pressed', 'false');
  choice.replaceChildren(...parcels.map(p => new Option(p.reference, p.reference)));
  status.textContent = 'Preparando mapa…';
  try {
    const created = await openParcelMap(container, parcels, {
      signal: request.signal, initialReference: choice.value, onPick: select,
      onBasemapError: () => { status.textContent = 'El IGN no ha respondido. Las parcelas siguen disponibles.'; }
    });
    if (request.signal.aborted) return;
    map = created;
    select(choice.value);
  } catch {
    if (!request.signal.aborted) status.textContent = 'Mapa no disponible. Puedes consultar las referencias en el selector.';
  }
}
choice.addEventListener('change', () => select(choice.value));
$('map-zoom-in').onclick = () => map?.zoom(1);
$('map-zoom-out').onclick = () => map?.zoom(-1);
$('map-reset').onclick = () => { tilt.setAttribute('aria-pressed', 'false'); map?.reset(); };
tilt.onclick = () => {
  const active = tilt.getAttribute('aria-pressed') !== 'true';
  tilt.setAttribute('aria-pressed', String(active));
  map?.tilt(active);
};
base.onclick = () => {
  const active = base.getAttribute('aria-pressed') !== 'true';
  if (!map?.basemap(active)) return;
  base.setAttribute('aria-pressed', String(active));
  attribution.hidden = !active;
};
let revision = 0;
$('parcel-file').addEventListener('change', async event => {
  const request = ++revision;
  const [file] = event.target.files;
  if (!file) return;
  try {
    if (file.size > window.FloorPlanParcelCore.LIMITS.documentBytes) throw Error();
    const text = await file.text();
    if (request === revision) await show(window.FloorPlanCatastroParcel.listDocumentParcels(text));
  } catch {
    if (request === revision) status.textContent = 'No se pudo leer el GML. Se conserva el mapa anterior.';
  }
});
window.addEventListener('pagehide', () => controller?.abort(), { once: true });
const demo = offset => window.FloorPlanParcelCore.normalizeParcel({
  reference: 'EJEMPLO000000' + (offset ? '2' : '1'), sourceCrs: 'EPSG:25830',
  sourceGeometry: { type: 'MultiPolygon', polygons: [{ rings: [[
    [500000 + offset, 4400000], [500025 + offset, 4400000], [500025 + offset, 4400030], [500000 + offset, 4400030]
  ]] }] }
});
await show([demo(0), demo(33)]);
