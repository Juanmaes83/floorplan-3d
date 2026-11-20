# R01 · Cierre documental: GOV-05, protocolo F2 y reutilización de K13/ProposalV1 (20/11/2026)

> **Integración: HOLD.** Este documento prepara las decisiones y **no cambia código**.
> - Laboratorio recuperado en esta misma rama: `labs/sculpt/r01-recognition/` y `HANDOFF-R01.md`.
> - Nada de esto es asesoramiento jurídico.

## 1. GOV-05 · expediente de licencias y atribuciones

### Hechos comprobados (de `labs/sculpt/r01-recognition/PROVENANCE.md`)

| Pieza | Origen exacto | Licencia en ese árbol |
|---|---|---|
| Código de reconocimiento (`recognition-core.js`, `ocr-postprocess-rules.js`) | olifod, `1d235fc0a3c45783e1e1fa129944f8f34d97d297` (PR wy51ai/floorplan-3d#18). Idéntico byte a byte en `zhuzhuyumeng/floorplan-3d@88323f3` (master del donante) | `LICENSE` MIT © 2026 wuyi en la raíz |
| Base común de RUBIK | wy51ai/floorplan-3d `730ec092` (wuyi) | MIT © 2026 wuyi (añadido el 01/10/2026, `fbcb8d5`) |
| OCR declarado por el donante | `tesseract.js@6.0.1` (Apache-2.0, con script de instalación) y `@tesseract.js-data/chi_sim` | **No se instala ni se copia** |

### Estado de cada cuestión

| N.º | Cuestión | Estado | Cierre propuesto | Quién |
|---|---|---|---|---|
| 1 | ¿Basta el MIT del árbol para las contribuciones de olifod? | Abierta. Riesgo residual: la PR no está fusionada como tal, el autor no añadió aviso propio y su identidad git es local | **Pedir confirmación escrita a olifod** antes de cualquier integración, citando el commit y los dos SHA-256. Sin respuesta, R01 sigue en laboratorio | Propietario |
| 2 | Aviso MIT de wuyi en RUBIK | **Abierta, también para RUBIK** (no solo para R01). Hoy solo figura en los avisos de los donantes de R02-A y R03 (`docs/licenses/r02a-donor-MIT.txt`, `docs/licenses/r03-donor-MIT.txt`). La raíz de RUBIK, derivada de wy51ai, no lo conserva | Añadir `docs/licenses/wy51ai-base-MIT.txt` con el texto exacto y citarlo desde la licencia o el aviso del producto | Propietario autoriza; cualquier agente lo aplica como cambio solo documental |
| 3 | OCR | Abierta | **No usar tesseract.js del donante.** Seleccionar un OCR local ES/EN sin APIs de pago, examinar su instalación y su licencia, y sin datos `chi_sim` (regla: sin chino en ES/EN) | Decisión de producto |
| 4 | Imagen del donante | Cerrada | No se redistribuye | — |
| 5 | Coautoría de IA | Abierta | Declarar en el handoff la coautoría de IA de los cortes de laboratorio, como en R02-A | Documento |

**GOV-05 se considera cerrado cuando:**
- el punto 1 tenga la confirmación del autor, o la decisión expresa de asumir el riesgo;
- y los puntos 2, 3 y 5 estén aplicados.

## 2. Protocolo F2 (reutiliza lo que ya hay en master)

| Paso | Herramienta existente | Regla |
|---|---|---|
| Inventario | `scripts/f2-readiness.py` y `docs/qa/f2-evaluation.template.json` | **5 sesiones** de base y **≥ 20 planos** reales, con mínimos por tipo y mobiliario. Autorización por plano. **Congelación** del conjunto antes de medir |
| Datos | Fuera del repositorio | Los planos **nunca** se suben al repositorio público. Solo se publican métricas y huellas |
| Escala | `f2-bridge.js` (R01) | Solo una calibración explícita y **congelada** `{mmPerPx, source, frozen:true}`. Sin calibración, el caso se rechaza; nunca hay valor por defecto. Las escalas leídas por OCR no se usan |
| Medición | `scripts/f2-wall-evaluation.py` (aprobado el 30/09/2026) | Precisión y exhaustividad por longitud de ejes de muro, con **tolerancia explícita obligatoria**. R01 y el detector de RUBIK se miden con la **misma** regla |
| Exportación de RUBIK | `scripts/f2-raw-export-to-evaluation.py` | Las sugerencias crudas de RUBIK, convertidas al mismo formato |
| Fallos | Puente R01 | Los análisis fallidos **se conservan** (`analysis_status:'failed'`). Ningún caso se filtra |
| Alcance | — | Solo muros. Huecos, estancias y OCR **no tienen evaluador aprobado** y no se miden con este |
| Tiempo y correcciones | Protocolo de las 5 sesiones | Manual frente a asistido; el comparador geométrico no lo cubre |

**Decisión previa del propietario:** la tolerancia y los umbrales del producto. Los 40 mm de las pruebas sintéticas no lo son.

**Criterio de salida:** R01 aporta solo si mejora al detector de RUBIK por tipo de plano, sin empeorar ninguno, con la tolerancia aprobada.

## 3. Propuesta de reutilización de K13/ProposalV1 (`js/proposal-core.js`)

R01 **no** crea un contrato de propuesta propio. Se añadiría una familia más a ProposalV1, en dos fases.

**Fase A · candidata no aplicable** (el modelo del MCP, `layout-candidate`):
```text
'recognition-candidate': { base:'file-sha256', applicable:false, confirmation:'none', undo:false, origin:'RecognitionEvidenceV1' }
```
- `base`: el **SHA-256 de los píxeles** que ya exige `RecognitionEvidenceV1` (`source.image.pixels.sha256`).
- La vigencia la comprueba el `checkFresh` común: si la imagen cambia, `stale_base`.
- Nunca aplica nada. Solo muestra lo detectado para revisión humana.

**Fase B · aplicación por acción** (el modelo del Asistente, `assistant-change`): solo con autorización expresa del contrato del «corte 3».
- `base` = la revisión `rv1-…` del proyecto en el momento de proponer.
- Confirmación **por acción**, un paso del deshacer y diff por id.
- Usa la operación atómica del Asistente; **ningún motor nuevo**.

**Invariantes que `validate` ya impone y que R01 heredaría:** una candidata no aplicable nunca está aplicada; una aplicable exige confirmación y deshacer.

**Prueba de aceptación propuesta:** las mismas que `proposal-core`, más:
- la imagen cambiada da `stale_base`;
- la candidata de fase A nunca se aplica.

## 4. Qué sigue en HOLD y por qué

| Pieza | Motivo |
|---|---|
| Integración de R01 en el producto | GOV-05 (§1) y F2 real (§2) |
| Fase B de ProposalV1 | Contrato del corte 3 no autorizado |
| OCR | Selección pendiente (§1, punto 3) |
