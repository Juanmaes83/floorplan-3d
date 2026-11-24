// Optional official IGN Spain basemap. No remote tiles are loaded until requested.
const tiles = 'https://www.ign.es/wmts/ign-base?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=IGNBaseTodo&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
const projections = {
  'EPSG:25829': '+proj=utm +zone=29 +ellps=GRS80 +units=m +no_defs',
  'EPSG:25830': '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
  'EPSG:25831': '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs',
  'EPSG:32628': '+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs'
};

export function parcelPoint(sourceCrs, point, project) {
  const projection = projections[sourceCrs];
  if (!projection) throw Error('Unsupported parcel CRS');
  const [lng, lat] = project(projection, 'EPSG:4326', point);
  if (!Number.isFinite(lng) || Math.abs(lng) > 180 || !Number.isFinite(lat) || Math.abs(lat) > 85) {
    throw Error('Invalid parcel position');
  }
  return [lng, lat];
}

let projectionReady;
export function loadProjection() {
  projectionReady ||= Promise.resolve(window.proj4 || loadAsset('../vendor/proj4/proj4.js', 'script'))
    .then(() => window.proj4).catch(error => { projectionReady = undefined; throw error; });
  return projectionReady;
}

export function parcelFeatures(parcels, project) {
  return { type: 'FeatureCollection', features: parcels.map(parcel => {

    const coordinates = parcel.sourceGeometry.polygons.map(polygon => polygon.rings.map(ring => {
      const transformed = ring.map(point => {
        return parcelPoint(parcel.sourceCrs, point, project);
      });
      return [...transformed, transformed[0]];
    }));
    return { type: 'Feature', properties: { reference: parcel.reference }, geometry: { type: 'MultiPolygon', coordinates } };
  }) };
}

let dependencies;
function loadAsset(path, tag) {
  return new Promise((resolve, reject) => {
    const asset = document.createElement(tag);
    const url = new URL(path, import.meta.url);
    if (tag === 'link') { asset.rel = 'stylesheet'; asset.href = url; }
    else asset.src = url;
    asset.onload = resolve;
    asset.onerror = () => { asset.remove(); reject(Error('Map asset unavailable')); };
    document.head.append(asset);
  });
}

function libraries() {
  dependencies ||= Promise.all([
    window.maplibregl || loadAsset('../vendor/maplibre/maplibre-gl.js', 'script'),
    loadProjection(),
    loadAsset('../vendor/maplibre/maplibre-gl.css', 'link')
  ]).catch(error => { dependencies = undefined; throw error; });
  return dependencies;
}

export async function openParcelMap(container, parcels, { signal, onPick, initialReference, onBasemapError }) {
  await libraries();
  signal.throwIfAborted();
  const { Map, LngLatBounds } = window.maplibregl;
  const data = parcelFeatures(parcels, window.proj4);
  const bounds = new LngLatBounds();
  for (const feature of data.features) {
    for (const polygon of feature.geometry.coordinates) {
      for (const ring of polygon) for (const point of ring) bounds.extend(point);
    }
  }
  if (bounds.isEmpty()) throw Error('No parcels to display');
  const map = new Map({
    container, attributionControl: false, maxPitch: 55, maxZoom: 20, dragRotate: false, pitchWithRotate: false,
    scrollZoom: false, cooperativeGestures: true, renderWorldCopies: false,
    canvasContextAttributes: { contextType: 'webgl2' },
    style: {
      version: 8, sources: { parcels: { type: 'geojson', data } },
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#e9eded' } },
        { id: 'parcels', type: 'fill', source: 'parcels', paint: { 'fill-color': '#1f5a66', 'fill-opacity': 0.18 } },
        { id: 'picked', type: 'fill', source: 'parcels', filter: ['==', 'reference', initialReference],
          paint: { 'fill-color': '#783b4b', 'fill-opacity': 0.28 } },
        { id: 'outline', type: 'line', source: 'parcels', paint: { 'line-color': '#1f5a66', 'line-width': 2 } }
      ]
    },
    bounds, fitBoundsOptions: { padding: 36, maxZoom: 18, duration: 0 }
  });
  // MapLibre releases its workers, handlers and WebGL context with remove().
  const destroy = () => map.remove();
  signal.addEventListener('abort', destroy, { once: true });
  let picked = initialReference;
  map.on('load', () => map.setFilter('picked', ['==', 'reference', picked]));
  map.on('click', 'parcels', event => {
    const references = [...new Set(event.features.map(feature => feature.properties.reference))];
    if (references.length === 1) onPick(references[0]);
  });
  map.on('error', event => {
    if (event.sourceId === 'ign-basemap') onBasemapError?.();
  });
  return {
    basemap(active) {
      if (!map.getLayer('parcels')) return false;
      if (active && !map.getSource('ign-basemap')) {
        map.addSource('ign-basemap', { type: 'raster', tiles: [tiles], tileSize: 256, maxzoom: 19 });
        map.addLayer({ id: 'ign-basemap', type: 'raster', source: 'ign-basemap' }, 'parcels');
      } else if (!active && map.getSource('ign-basemap')) {
        map.removeLayer('ign-basemap');
        map.removeSource('ign-basemap');
      }
      return true;
    },
    select(reference) {
      picked = reference;
      if (map.getLayer('picked')) map.setFilter('picked', ['==', 'reference', reference]);
    },
    zoom(step) { map.setZoom(map.getZoom() + step); },
    reset() { map.jumpTo({ pitch: 0, bearing: 0 }); map.fitBounds(bounds, { padding: 36, maxZoom: 18, duration: 0 }); },
    tilt(active) { map.setPitch(active ? 45 : 0); }
  };
}
