# R01 · Recuperación del reconocimiento de planos y del puente a F2 (20/11/2026)

> **Estado:** laboratorio recuperado y reproducible sobre master actual. **Integración: HOLD.**
> - GOV-05 sigue abierto (aportación de olifod, aviso MIT de wuyi, dependencias OCR).
> - El contrato de propuesta revisable no está autorizado.
> - F2 no se ejecuta ni se simula. Todo es sintético.

## Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/r01-recuperacion`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Base | master `4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` |
| Origen | `lab/sculpt-r01-f2-readiness@2dca1c54` (contiene `lab/sculpt-r01-recognition@2158fd19`). Archivos copiados **sin cambios**, salvo la guarda descrita abajo |
| No recuperado | `.github/workflows/sculpt-r01-lab.yml` (no se modifican workflows) y las capturas de `docs/qa/artifacts` |

## Componentes acreditados que se recuperan

| Componente | Archivo | Reutiliza |
|---|---|---|
| `RecognitionEvidenceV1`: contrato puro de evidencia con hash de píxeles obligatorio, escala solo como candidata y límites permanentes | `labs/sculpt/r01-recognition/recognition-evidence-core.js` | |
| Comparador con `rasterWallBands`/`detectPlan` de RUBIK | `recognition-compare-core.js` | El detector propio de RUBIK |
| **Puente a F2**: registros para el comparador aprobado de muros (30/09/2026), calibración congelada obligatoria y ninguna métrica propia | `f2-bridge.js` | `scripts/f2-wall-evaluation.py` y `docs/qa/f2-evaluation.template.json` de master |
| Cancelación real en un Web Worker, con recuperación tras cancelar, agotar el tiempo o rechazar una imagen | `recognition-runner.js`, `recognition-worker.js` | |
| Taller del donante (port de reconocimiento, reglas OCR) | `workshop/` | **Sujeto a GOV-05**: solo laboratorio |

**K13/ProposalV1** (`js/proposal-core.js`):
- R01 no implementa propuestas. Cuando se autorice el contrato, la detección debe entrar como una familia más de ProposalV1, con `base` y `checkFresh` y confirmación por acción.
- No crea un contrato propio. No se adelanta en este corte.

## Pruebas (Chromium 1243 y Node 22.23, Linux)

| Prueba | Resultado |
|---|---|
| `tests/sculpt-r01-recognition.test.cjs` | **17/17** (sobre master sin ajuste: 16/17, ver guarda) |
| `tests/sculpt-r01-f2-bridge.test.cjs` | **5/5** |
| `tests/sculpt-r01-cancel.browser.test.cjs` | **4/4**: cancelación inmediata, página sensible durante el cálculo, recuperación con evidencia idéntica al hilo principal, botones del laboratorio sin peticiones externas |

**Guarda reconciliada sin rebajarla.**
- **Antes:** prohibía cualquier `labs/sculpt` en el producto. Master ya lo cita en comentarios de procedencia de **otros** laboratorios: `css/r03-cabinet-editor.css`, `js/scene-capture-core.js` y `js/storage-persistence.js`.
- **Ahora:** busca **R01 en concreto** (`labs/sculpt/r01`, `r01-recognition`, `RubikRecognitionEvidence`, `RubikRecognitionCompare`, `RubikR01F2Bridge`, `recognition-worker`).
- **Discrimina:** con una referencia a `labs/sculpt/r01-recognition/…` en `index.html` falla; sin ella pasa.

## Resultados del laboratorio (sintéticos, del acta)

Precisión y exhaustividad por longitud de muros, tolerancia de prueba de 40 mm (no es la del producto):
- R01 iguala a RUBIK en la mayoría de los planos;
- mejora claramente en `grey-walls-black-text`: RUBIK no detecta nada (0,000) y R01 llega a 1,000;
- empeora ligeramente en `dimension-lines`: 0,929 frente a 0,967.

**No hay evaluador aprobado** para huecos, estancias ni OCR.

## Qué falta para cualquier integración (del acta, no se simula)

1. Inventario F2 real: 5 sesiones de base y ≥ 20 planos autorizados y congelados.
2. Tolerancia y umbrales del producto.
3. **GOV-05** cerrado.
4. Contrato de propuesta (corte 3) sobre K13/ProposalV1, autorizado.
5. Medición física en móvil.

## Siguiente actuación

| Quién | Qué |
|---|---|
| Codex | Reproducir las tres suites |
| Propietario | GOV-05 y F2 real |
