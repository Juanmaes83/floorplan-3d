import {inspectGLB, inspectTextures, LIMITS} from '../../../js/asset-loader.mjs';
import {validateLocalGLBGeometry} from './upstream/src/lib/utils/localGLBGeometry.ts';

const SHA256 = /^[a-f0-9]{64}$/;
const ownText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

// The donor's content identity is independent of filenames, placement and display names.
// This laboratory returns a private admission plan. F0 owns any eventual writes and quotas.
export async function planAdmission(buffer, metadata, current = []) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0 || buffer.byteLength > LIMITS.bytes) {
    throw Error('El GLB supera los límites de la prueba F3 o está vacío.');
  }
  const {title, rights} = metadata || {};
  if (!ownText(title, 100) || !['original', 'licensed'].includes(rights?.basis) ||
      !ownText(rights.attribution, 200) || !ownText(rights.license, 160) ||
      typeof rights.evidenceSha256 !== 'string' || !SHA256.test(rights.evidenceSha256)) {
    throw Error('Falta procedencia, atribución o prueba de derechos del modelo.');
  }
  const permission = {
    basis: rights.basis, attribution: rights.attribution.trim(), license: rights.license.trim(),
    evidenceSha256: rights.evidenceSha256, scope: 'local-private',
  };

  const original = buffer.slice(0);
  const document = inspectGLB(original);
  // F3 has already verified the JSON and BIN chunk boundaries and the embedded buffer length.
  const binary = new Uint8Array(original, 28 + new DataView(original).getUint32(12, true));
  const {scene} = validateLocalGLBGeometry({document, binary});
  const resources = inspectTextures(original);
  const hash = await crypto.subtle.digest('SHA-256', original);
  const sha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const id = `model-${sha256}`;
  const matches = current.filter(entry => entry.sha256 === sha256);
  const existing = matches[0];
  if (existing) {
    if (matches.length !== 1 || existing.id !== id || !ownText(existing.title, 100) || existing.bytes !== original.byteLength ||
        Object.keys(permission).some(key => existing.permission?.[key] !== permission[key])) {
      throw Error('El modelo ya está registrado con una procedencia distinta. Revisa el conflicto antes de continuar.');
    }
  }
  return {action: existing ? 'reuse' : 'stage', descriptor: {
    id, sha256, bytes: original.byteLength, title: existing?.title ?? title.trim(), permission,
    resources, geometry: scene.scenes[scene.activeScene],
  }};
}
