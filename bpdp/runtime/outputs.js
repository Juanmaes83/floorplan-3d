/* BP-DP PREMIUM · SALIDAS: vídeo MP4 real y lámina PNG (módulo ES).
 *
 * Vídeo: exportación DETERMINISTA fotograma a fotograma (cada fotograma es el estado exacto del guion en i/fps), con
 * WebCodecs H.264 y el muxer de RUBIK FloorPlanConstructionMp4 (mismo método que presentation-film.js de RUBIK). El
 * fichero se inspecciona (inspect) antes de ofrecerse; se muestra en un <video> real y se descarga con sus bytes.
 * Lámina: composición en lienzo 2D de vistas renderizadas por el mismo runtime, con cajetín, revisión y escala.
 */
// Tasa ajustada a la duración: a 1080p, 8 Mbps como máximo y nunca más de ~14 MB por vídeo (se puede compartir y adjuntar).
export async function h264Config(width, height, fps, duration = 15) {
  if (typeof VideoEncoder === 'undefined' || !window.FloorPlanConstructionMp4) return null;
  for (const codec of ['avc1.640028', 'avc1.4D0028', 'avc1.42E028']) { const cfg = { codec, width, height, bitrate: Math.round(Math.min(width >= 1920 ? 8_000_000 : 5_000_000, 14e6 * 8 / Math.max(1, duration) * .92)), framerate: fps, avc: { format: 'avc' } };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch { } }
  return null;
}
// Some WebCodecs encoders repeat the NAL header in their AVC configuration
// record. Only correct the matching single SPS/PPS shape we can identify.
function normalizarAvcC(data) {
  if (data.length < 17 || data[0] !== 1 || (data[5] & 31) !== 1) return data;
  const spsSize = (data[6] << 8) | data[7], ppsCount = 8 + spsSize;
  if (ppsCount + 5 > data.length || data[ppsCount] !== 1 ||
    (data[8] & 31) !== 7 || data[8] !== data[9] || data[10] !== data[1] ||
    data[11] !== data[2] || data[12] !== data[3]) return data;
  const ppsSize = (data[ppsCount + 1] << 8) | data[ppsCount + 2], ppsStart = ppsCount + 3;
  if (ppsSize < 2 || ppsStart + ppsSize > data.length ||
    (data[ppsStart] & 31) !== 8 || data[ppsStart] !== data[ppsStart + 1]) return data;
  const corrected = new Uint8Array(data.length - 2);
  corrected.set(data.subarray(0, 8));
  corrected[4] |= 0xfc;
  corrected[5] |= 0xe0;
  corrected[6] = (spsSize - 1) >> 8;
  corrected[7] = (spsSize - 1) & 255;
  corrected.set(data.subarray(9, ppsStart), 8);
  corrected[ppsStart - 3] = (ppsSize - 1) >> 8;
  corrected[ppsStart - 2] = (ppsSize - 1) & 255;
  corrected.set(data.subarray(ppsStart + 1), ppsStart - 1);
  return corrected;
}
/**
 * @param o.duration s · o.fps · o.width/height · o.apply(t) aplica el estado del guion · o.draw(ctx,t,w,h) compone el fotograma
 */
export async function exportMp4({ duration, fps = 30, width = 1920, height = 1080, apply, draw, onProgress, signal }) {
  const cfg = await h264Config(width, height, fps, duration);
  if (!cfg) throw Object.assign(Error('Este navegador no puede codificar H.264 con WebCodecs; no se genera ningún vídeo.'), { code: 'NO_H264' });
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d');
  const n = Math.round(duration * fps) + 1, samples = []; let avcC = null, failure = null; const t0 = performance.now();
  const enc = new VideoEncoder({ output: (chunk, meta) => { if (meta?.decoderConfig?.description && !avcC) avcC = new Uint8Array(meta.decoderConfig.description); const d = new Uint8Array(chunk.byteLength); chunk.copyTo(d); samples.push({ data: d, key: chunk.type === 'key', ts: chunk.timestamp }); }, error: e => { failure = e; } });
  enc.configure(cfg);
  try {
    for (let i = 0; i < n; i++) {
      if (signal?.aborted) throw Object.assign(Error('Preparación cancelada: no se ha generado nada.'), { code: 'CANCELLED' }); if (failure) throw failure;
      const t = Math.min(duration, i / fps); apply(t); draw(ctx, t, width, height);
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      try { enc.encode(vf, { keyFrame: i % fps === 0 }); } finally { vf.close(); }
      while (enc.encodeQueueSize > 4) { if (failure) throw failure; await new Promise(r => setTimeout(r, 4)); }
      if (i % 3 === 0) { onProgress?.(i / n); await new Promise(r => setTimeout(r, 0)); }
    }
    await enc.flush(); if (failure) throw failure;
  } finally { if (enc.state !== 'closed') enc.close(); }
  if (!avcC || samples.length !== n) throw Error('El codificador no devolvió todos los fotogramas: no se ha guardado nada.');
  samples.sort((a, b) => a.ts - b.ts);
  const bytes = window.FloorPlanConstructionMp4.mux({ width, height, fps, samples, avcC: normalizarAvcC(avcC) });
  const info = window.FloorPlanConstructionMp4.inspect ? window.FloorPlanConstructionMp4.inspect(bytes) : null;
  const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
  return { blob: new Blob([bytes], { type: 'video/mp4' }), bytes: bytes.length, sha256: sha, frames: n, fps, width, height, codec: cfg.codec, duration: (n - 1) / fps + 1 / fps, encodeMs: Math.round(performance.now() - t0), inspect: info };
}

// ── PNG con densidad física (chunk pHYs): el archivo declara sus ppp, así 3307 × 2339 px a 200 ppp = A3 420 × 297 mm ──
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export async function pngConDensidad(blob, dpi) {
  const src = new Uint8Array(await blob.arrayBuffer()), ppm = Math.round(dpi / 0.0254), chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1; dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 8 + 13 + 4; // firma + IHDR (longitud, tipo, datos, CRC)
  const out = new Uint8Array(src.length + 21); out.set(src.subarray(0, ihdrEnd)); out.set(chunk, ihdrEnd); out.set(src.subarray(ihdrEnd), ihdrEnd + 21);
  return new Blob([out], { type: 'image/png' });
}
/** Escalas normalizadas de plano: la menor (más detallada) a partir de la preferida con la que la vista cabe. */
export const ESCALAS = [50, 75, 100, 125, 150, 200, 250, 300, 400, 500];
export function escalaQueCabe(extW, extH, drawW, drawH, dpi, preferida = 100) {
  for (const e of ESCALAS) { if (e < preferida) continue; const ppm = 1000 / e / 25.4 * dpi; if (extW * ppm <= drawW && extH * ppm <= drawH) return { escala: e, ppm }; }
  const e = ESCALAS[ESCALAS.length - 1]; return { escala: e, ppm: 1000 / e / 25.4 * dpi, noCabe: true };
}
/** Caja de un texto girado (ancho, alto) alrededor de su centro. */
export function cajaGirada(cx, cy, tw, th, ang) { const c = Math.abs(Math.cos(ang)), s = Math.abs(Math.sin(ang)), w = tw * c + th * s, h = tw * s + th * c; return { x: cx - w / 2, y: cy - h / 2, w, h }; }
export const solapa = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;

/** Descarga real de un Blob (se usa el mismo objeto que reproduce el <video>). */
export function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }

/** Diálogo accesible: Tab/Mayús+Tab dentro, Escape cierra, el foco vuelve a quien lo abrió. */
export function dialogo(root, { label, opener = document.activeElement, onClose }) {
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', label);
  root.appendChild(m); let cerrado = false;
  const focusables = () => [...m.querySelectorAll('button,select,input,video[controls],[tabindex]:not([tabindex="-1"])')].filter(n => !n.disabled && n.getClientRects().length);
  const close = () => { if (cerrado) return; cerrado = true; document.removeEventListener('keydown', esc, true); onClose?.(); m.remove(); (opener?.isConnected ? opener : null)?.focus({ preventScroll: true }); };
  // Escape cierra el diálogo SUPERIOR esté donde esté el foco (p. ej. si un botón se deshabilitó con el foco encima).
  const esc = e => { if (e.key !== 'Escape' || cerrado) return; const top = [...document.querySelectorAll('.modal')].pop(); if (top !== m || m.contains(e.target)) return; e.preventDefault(); e.stopPropagation(); close(); };
  document.addEventListener('keydown', esc, true);
  m.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return; const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !m.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !m.contains(document.activeElement))) { e.preventDefault(); first.focus(); } });
  m.addEventListener('focusout', e => { if (!cerrado && e.relatedTarget && !m.contains(e.relatedTarget)) focusables()[0]?.focus({ preventScroll: true }); });
  return { m, close, get cerrado() { return cerrado; } };
}

const vigenciaHTML = v => v.vigente ? `<span class="vig ok">Vigente · revisión ${v.preparada.slice(0, 12)}</span>`
  : `<span class="vig obs">Obsoleta · preparada con la revisión ${v.preparada.slice(0, 12)}; el proyecto está ahora en ${String(v.actual).slice(0, 12)}. Prepárala de nuevo.</span>`;

/**
 * Modal de vídeo: Preparar → progreso → reproductor real + metadatos + Descargar.
 * `validez(revision)` → {vigente, preparada, actual}: se consulta al terminar, al reabrir y al pulsar «Descargar»; una salida
 * obsoleta se identifica y su descarga queda bloqueada. `cached` muestra la última salida sin volver a prepararla.
 */
export function videoModal(root, { title, filename, run, cached = null, validez, opener, onResult }) {
  const D = dialogo(root, { label: title, opener, onClose: () => ac?.abort() }), m = D.m; let ac = null;
  const prepare = () => {
    ac = new AbortController();
    m.innerHTML = `<div class="sheet"><h2>${title}</h2><p class="sub">Preparando el vídeo fotograma a fotograma (1920 × 1080 · 30 fps · H.264). La escena es la misma que ves en la herramienta.</p>
     <div class="progress"><i></i></div><p class="status" aria-live="polite">Preparando…</p><div class="actions"><button type="button" class="btn" data-a="cancel">Cancelar</button></div></div>`;
    const bar = m.querySelector('.progress i'), status = m.querySelector('.status'); m.querySelector('[data-a="cancel"]').focus();
    return run({ signal: ac.signal, onProgress: p => { bar.style.width = (p * 100).toFixed(1) + '%'; status.textContent = `Fotograma ${Math.round(p * 100)} %`; } })
      .then(r => { if (D.cerrado) return r; onResult?.(r); return show(r, false); })
      .catch(e => { if (e.code === 'CANCELLED' || D.cerrado) return null; status.textContent = e.message; bar.style.background = 'var(--accent)'; throw e; });
  };
  const show = async (r, reabierta) => {
    const v = validez ? await validez(r.revision) : { vigente: true, preparada: r.revision || '', actual: r.revision || '' };
    if (D.cerrado) return r;
    const url = r.url || (r.url = URL.createObjectURL(r.blob));
    m.innerHTML = `<div class="sheet"><h2>${title}</h2><p class="sub">${reabierta ? 'Última versión preparada.' : 'Vídeo listo.'} Se reproduce aquí y se descarga con los mismos bytes.</p>
     <p class="vigencia" aria-live="polite">${vigenciaHTML(v)}</p>
     <div class="player"><video controls playsinline preload="metadata" src="${url}"></video>
     <div class="meta"><div><b>Duración</b><span>${r.duration.toFixed(2)} s</span></div><div><b>Resolución</b><span>${r.width} × ${r.height}</span></div><div><b>Fotogramas</b><span>${r.frames} · ${r.fps} fps</span></div>
     <div><b>Formato</b><span>MP4 · H.264 (${r.codec})</span></div><div><b>Tamaño</b><span>${(r.bytes / 1e6).toFixed(2)} MB</span></div><div><b>SHA-256</b><span>${r.sha256.slice(0, 16)}…</span></div><div><b>Revisión</b><span>${r.revision ? r.revision.slice(0, 12) : '—'}</span></div><div><b>Firma</b><span>${r.firma?.estudio ? r.firma.estudio : 'Sin firma (solo título)'}</span></div></div></div>
     <div class="actions"><button type="button" class="btn primary" data-a="dl" ${v.vigente ? '' : 'disabled aria-disabled="true"'}>${v.vigente ? 'Descargar MP4' : 'No vigente'}</button><button type="button" class="btn" data-a="again">Preparar de nuevo</button><button type="button" class="btn" data-a="close">Cerrar</button></div></div>`;
    m.dataset.vigente = String(v.vigente); window.__bpdpLastVideo = r; window.__bpdpLastVideoVigencia = v;
    (m.querySelector('[data-a="dl"]:not([disabled])') || m.querySelector('[data-a="again"]')).focus({ preventScroll: true });
    return r;
  };
  m.addEventListener('click', async e => { const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'cancel' || a === 'close') D.close();
    if (a === 'again') prepare().catch(() => { });
    if (a === 'dl') { const r = window.__bpdpLastVideo, v = validez ? await validez(r.revision) : { vigente: true };
      if (!v.vigente) { m.querySelector('.vigencia').innerHTML = vigenciaHTML(v); const b = m.querySelector('[data-a="dl"]'); b.disabled = true; b.textContent = 'No vigente'; m.dataset.vigente = 'false'; m.querySelector('[data-a="again"]')?.focus({ preventScroll: true }); return; }
      download(r.blob, filename); } });
  const done = cached ? show(cached, true) : prepare();
  return { modal: m, done, close: D.close };
}

/** Modal de lámina: vista previa real + descarga PNG, con la misma vigencia que el vídeo. */
export function sheetModal(root, { title, filename, blob, meta, revision, validez, opener }) {
  const D = dialogo(root, { label: title, opener }), m = D.m, url = URL.createObjectURL(blob);
  m.innerHTML = `<div class="sheet"><h2>${title}</h2><p class="sub">${meta}</p><p class="vigencia" aria-live="polite"></p><img alt="${title}" src="${url}"><div class="actions"><button type="button" class="btn primary" data-a="dl">Descargar PNG</button><button type="button" class="btn" data-a="close">Cerrar</button></div></div>`;
  const check = async () => { const v = validez ? await validez(revision) : { vigente: true, preparada: revision || '', actual: revision || '' }; if (D.cerrado) return v;
    m.querySelector('.vigencia').innerHTML = vigenciaHTML(v); m.dataset.vigente = String(v.vigente); const b = m.querySelector('[data-a="dl"]'); const tenia = document.activeElement === b; b.disabled = !v.vigente; b.textContent = v.vigente ? 'Descargar PNG' : 'No vigente'; if (tenia && b.disabled) m.querySelector('[data-a="close"]')?.focus({ preventScroll: true }); return v; };
  m.addEventListener('click', async e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'close') { URL.revokeObjectURL(url); D.close(); } if (a === 'dl' && (await check()).vigente) download(blob, filename); });
  check(); m.querySelector('[data-a="dl"]').focus(); window.__bpdpLastSheet = { bytes: blob.size, type: blob.type, revision }; return m;
}

/** Cajetín de lámina (convención de plano técnico): proyecto, escenario, revisión, escala, fecha, certeza. */
export function titleBlock(ctx, x, y, w, h, rows, { ink = '#26328a', paper = '#ffffff' } = {}) {
  ctx.save(); ctx.fillStyle = paper; ctx.fillRect(x, y, w, h); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  const rh = h / rows.length; ctx.lineWidth = 1.2;
  rows.forEach(([k, v, strong], i) => { const yy = y + i * rh; if (i) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    ctx.fillStyle = '#5d6480'; ctx.font = `600 ${Math.round(rh * .26)}px ui-monospace,Consolas,monospace`; ctx.fillText(k.toUpperCase(), x + 18, yy + rh * .36);
    // El valor siempre cabe en su fila: se reduce el cuerpo hasta un 60 %; si aún no cabe, se recorta con «…».
    let fs = Math.round(rh * (strong ? .42 : .34)); const fam = 'Bahnschrift,"DIN Alternate",system-ui,sans-serif', max = w - 36, f = () => { ctx.font = `${strong ? 700 : 500} ${fs}px ${fam}`; };
    f(); const min = Math.round(fs * .6); while (fs > min && ctx.measureText(v).width > max) { fs--; f(); } let t = String(v); while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -2) + '…';
    ctx.fillStyle = ink; ctx.fillText(t, x + 18, yy + rh * .82); });
  ctx.restore();
}
