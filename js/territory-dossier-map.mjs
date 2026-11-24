import { IGN_TILES, loadProjection, parcelPoint } from './territory-map-adapter.mjs';
import { googleContextLinks } from './territory-context-links.mjs';

export const IGN_CREDIT = 'Mapa Base de España (IGNBaseTodo) · Sistema Cartográfico Nacional / Instituto Geográfico Nacional · CC BY 4.0';
const TILE = 256;
const WIDTH = 768;
const HEIGHT = 384;

export async function dossierLocation(parcel) {
  const project = await loadProjection();
  return googleContextLinks(parcelPoint(parcel.sourceCrs, [parcel.frame.originX, parcel.frame.originY], project)).map;
}

export async function captureIgnBasemap(parcel, signal) {
  const project = await loadProjection();
  signal.throwIfAborted();
  const [lon, lat] = parcelPoint(parcel.sourceCrs, [parcel.frame.originX, parcel.frame.originY], project);
  const span = parcel.sourceGeometry.polygons.reduce((size, polygon) => polygon.rings[0].reduce((max, [x, y]) =>
    Math.max(max, Math.abs(x - parcel.frame.originX) * 4, Math.abs(y - parcel.frame.originY) * 8), size), 360);
  const latitude = lat * Math.PI / 180;
  const zoom = Math.min(19, Math.max(5, Math.floor(Math.log2(40075016.686 * Math.cos(latitude) * WIDTH / (TILE * span)))));
  const n = 2 ** zoom;
  const left = (lon + 180) / 360 * n * TILE - WIDTH / 2;
  const top = Math.max(0, Math.min(n * TILE - HEIGHT, (1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * n * TILE - HEIGHT / 2));
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw Error('Canvas unavailable');
  const tasks = [];
  for (let y = Math.floor(top / TILE); y <= Math.floor((top + HEIGHT - 1) / TILE); y++) {
    for (let x = Math.floor(left / TILE); x <= Math.floor((left + WIDTH - 1) / TILE); x++) {
      const wrappedX = (x % n + n) % n;
      const url = IGN_TILES.replace('{z}', zoom).replace('{x}', wrappedX).replace('{y}', y);
      tasks.push((async () => {
        const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok || !/^image\//i.test(response.headers.get('content-type') || '')) throw Error('IGN tile unavailable');
        const bitmap = await createImageBitmap(await response.blob());
        try { signal.throwIfAborted(); context.drawImage(bitmap, Math.round(x * TILE - left), Math.round(y * TILE - top), TILE, TILE); }
        finally { bitmap.close(); }
      })());
    }
  }
  await Promise.all(tasks);
  signal.throwIfAborted();
  return { dataUrl: canvas.toDataURL('image/png'), credit: IGN_CREDIT };
}
