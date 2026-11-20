// OP-05 · P1 · Cargador de bytes privados (LABORATORIO; no está conectado al visor). Solo acepta un ArrayBuffer que el
// llamador ya tiene: nunca una URL ni un Blob. Antes de decodificar nada comprueba, en este orden y sin atajos:
// longitud declarada, límite F3, SHA-256, contenedor F3 (inspectGLB), geometría/recursos/escena del donante (port JS de
// localGLB*) y presupuesto agregado de texturas (inspectTextures). Después usa la MISMA canalización que el catálogo
// (parseVerified: cancelación, temporizador y liberación de GPU) y solo MIDE la malla: no compara con medidas de catálogo
// ni certifica escala física. La autoridad de la medida del mueble sigue siendo el objeto canónico.
import {inspectGLB, inspectTextures, loadVerifiedBytes, LIMITS} from '../../../js/asset-loader.mjs';
import {validateLocalGLBGeometry} from './js/localGLBGeometry.mjs';

const SHA256 = /^[a-f0-9]{64}$/;
const hex = async buffer => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), b => b.toString(16).padStart(2, '0')).join('');
// Normalización explícita y declarada: glTF se expresa en metros (especificación) y +Y arriba; no se gira.
export const PRIVATE_NORMALIZATION = Object.freeze({unitToMeter: 1, rotationDeg: Object.freeze([0, 0, 0]), source: 'gltf-meters-assumed'});

export async function verifyPrivateBytes(buffer, {sha256, byteLength} = {}) {
  if (!(buffer instanceof ArrayBuffer)) throw Error('Solo se aceptan bytes verificados (ni URL, ni Blob, ni vistas).');
  if (!SHA256.test(sha256 || '') || !Number.isSafeInteger(byteLength)) throw Error('Faltan la huella o la longitud declaradas.');
  if (buffer.byteLength !== byteLength) throw Error('La longitud no coincide con la declarada.');
  if (buffer.byteLength === 0 || buffer.byteLength > LIMITS.bytes) throw Error('El GLB supera los límites del perfil F3 o está vacío.');
  if (await hex(buffer) !== sha256) throw Error('La huella SHA-256 no coincide: el contenido cambió.');
  const document = inspectGLB(buffer);
  const binary = new Uint8Array(buffer, 28 + new DataView(buffer).getUint32(12, true));
  const {scene} = validateLocalGLBGeometry({document, binary});
  return {resources: inspectTextures(buffer), geometry: scene.scenes[scene.activeScene]};
}

export async function loadPrivateModel(buffer, declared, options = {}) {
  // Codex P1 finding: everything that can be checked without the bytes' content is checked BEFORE the copy; the copy that
  // reaches decoding is then hashed and inspected again (verifyPrivateBytes).
  if (!(buffer instanceof ArrayBuffer)) throw Error('Solo se aceptan bytes verificados (ni URL, ni Blob, ni vistas).');
  if (!SHA256.test(declared?.sha256 || '') || !Number.isSafeInteger(declared?.byteLength)) throw Error('Faltan la huella o la longitud declaradas.');
  if (buffer.byteLength === 0 || buffer.byteLength > LIMITS.bytes) throw Error('El GLB supera los límites del perfil F3 o está vacío.');
  if (buffer.byteLength !== declared.byteLength) throw Error('La longitud no coincide con la declarada.');
  const result = await loadVerifiedBytes(buffer, {...options, expectedBytes: declared.byteLength, normalization: PRIVATE_NORMALIZATION, verify: bytes => verifyPrivateBytes(bytes, declared)});
  const {dimensionsMm, ...rest} = result;
  // Tres medidas distintas que nunca se confunden: la MALLA (aquí), la normalización (declarada) y las cotas canónicas
  // del mueble (en el proyecto, no aquí).
  return {...rest, meshDimensionsMm: dimensionsMm, normalization: PRIVATE_NORMALIZATION, physicalScale: 'not-certified'};
}
