# SCULPT-R01 — cancelación real y preparación para F2 (segundo corte del laboratorio)

**Fecha:** 12/11/2026 · **Rama:** `lab/sculpt-r01-f2-readiness`, apilada sobre #191 (`lab/sculpt-r01-recognition@2158fd1`).
**Estado:** laboratorio **más robusto y preparado para F2**. **Integración: HOLD**, igual que antes. F2 no se ha ejecutado ni se simula. Todo es sintético.

## D1 · Auditoría y benchmark (lo que ya existía, verificado)

El primer corte (#191) ya documenta la arqueología, el CLASSIFY por capacidad y el benchmark sintético de 6 estilos (§C–F de `sculpt-r01-recognition.md`). Este corte **no lo repite**. Lo vuelve a medir con la **regla aprobada** de RUBIK, a través del puente D3:

| Plano (sintético, 40 mm de tolerancia de prueba) | R01 precisión / exhaustividad | RUBIK precisión / exhaustividad |
|---|---|---|
| black-walls | 0,967 / 1,000 | 0,967 / 1,000 |
| grey-walls | 0,967 / 1,000 | 0,967 / 1,000 |
| grey-walls-fills | 0,967 / 1,000 | 0,967 / 1,000 |
| dimension-lines | **0,929** / 1,000 | 0,967 / 1,000 |
| grey-walls-black-text | 0,967 / 1,000 | **— / 0,000** |
| low-resolution | 0,987 / 1,000 | 0,955 / 1,000 |

- Las mismas conclusiones del primer corte, ahora con el comparador aprobado:
  - R01 recupera los muros grises junto a texto negro, donde RUBIK no ve nada;
  - R01 pierde precisión con texto y cotas dentro de las estancias.
- **Tolerancia:** 40 mm es un parámetro de esta prueba para estos planos dibujados. **No es la tolerancia del producto**, que sigue pendiente.

## D2 · Pulido seguro: cancelación real

El primer corte dejaba registrado: «no existe cancelación interrumpible». **Ahora existe**, en el navegador:

- **`recognition-worker.js`** es un *worker* clásico. Ejecuta el **mismo** `RubikRecognitionEvidence.analyse` que la página, sin red ni almacenamiento.
- **`recognition-runner.js`** (`RubikRecognitionRunner.run(image, options, {timeoutMs})` → `{promise, cancel}`):
  - un *worker* nuevo por análisis;
  - `cancel()` llama a `terminate()` y la promesa se rechaza con `cancelled`, sin evidencia parcial;
  - con `timeoutMs`, se rechaza con `timeout` (que no es una conclusión sobre el plano);
  - los píxeles se **copian** antes de transferirlos, así que la imagen de quien llama nunca se desconecta ni se modifica.
- **Recuperación:** tras una cancelación, un tiempo agotado o una imagen rechazada, el siguiente análisis funciona y da **la misma evidencia** que en primer plano, con el hash de píxeles validado.
- **Mediciones** (Chromium, plano sintético de 1920×1440):

  | | Ejecución directa | Con *worker* |
  |---|---|---|
  | Duración | 1,13 s | 1,23 s |
  | Mayor pausa de la página durante el análisis | **1468 ms** | **12 ms** |
  | Rechazo tras cancelar | — | menos de 50 ms |

- La página del laboratorio tiene los botones «Analizar en segundo plano» y «Cancelar», con un indicador de fotogramas que demuestra que la página sigue viva.
- `RubikRecognitionEvidence` sigue **sin** API de cancelación. La prueba C9 del primer corte se mantiene. La cancelación vive en el ejecutor, no en el contrato de evidencia.

**Prioridades de D2 revisadas, sin cambios necesarios porque ya se cumplían en #191:**
- no se modifica geometría automáticamente;
- recuperación tras error;
- incertidumbre explicada (`limits`, `review: 'unreviewed'`, `kindBasis`);
- rechazo de referencias insuficientes (sin escala, `scale.status: 'unknown'`);
- conservación de la imagen y su hash (`pixels.sha256` obligatorio, `file.status` declarado o verificado);
- integridad de IDs.

**«Propuestas revisables» no se implementa en este corte.** El contrato observación → propuesta → preflight → diff por ID → confirmación → operación atómica → deshacer sigue **pendiente de autorización** (punto 5 del acta de #191). Una detección **nunca** se convierte en geometría confirmada.

## D3 · Preparación del gate F2

### Qué existe ya en `master` (y se reutiliza, no se duplica)

| Pieza | Para qué |
|---|---|
| `scripts/f2-readiness.py`, `docs/qa/f2-evaluation.template.json` | Inventario anónimo: 5 sesiones de base y ≥ 20 planos, con mínimos por tipo y mobiliario, autorizaciones y congelación |
| `scripts/f2-wall-evaluation.py` | **Comparador aprobado** (30/09/2026): precisión y exhaustividad por longitud de ejes de muro, con tolerancia explícita obligatoria |
| `scripts/f2-raw-export-to-evaluation.py` | Conversión de las sugerencias crudas exportadas por RUBIK |

### Lo nuevo: el puente R01 → comparador aprobado (`labs/sculpt/r01-recognition/f2-bridge.js`)

- Convierte la evidencia de R01 (píxeles) y la salida del detector actual de RUBIK en casos `record_version 1`, en el marco `image-aligned-mm`.
- **Escala:** solo una calibración **congelada y con fuente**. Sin ella se rechaza. Las pistas de escala del OCR **no se usan nunca**.
- **No filtra casos:** un análisis fallido queda como `failed` y una referencia ausente como `missing`.
- El comparador **rechaza campos extra**, por ejemplo una «confianza», así que el puente no puede colar datos.
- **Prueba de extremo a extremo:** 6 planos × 2 detectores pasan por el comparador **sin modificarlo**. Resultado: `f2_validated: false` y `data_kind: synthetic`.

### Protocolo de ejecución para R01 (privado, en local, por Juanma)

1. **Inventario.** Registrar en una copia privada de la plantilla las 5 sesiones de base y ≥ 20 planos **autorizados**. Mínimos: digital, scan y photo; con y sin mobiliario. Ejecutar `f2-readiness.py` hasta que marque la completitud. Congelar la revisión `eval_NNN`.
2. **Antes de mirar resultados**, fijar por escrito:
   - la **tolerancia en mm**;
   - el **SHA del detector** (R01 del taller y RUBIK);
   - la calibración de cada plano, con su cota de calibración separada de las de validación.
3. **Para cada plano:**
   - calibrarlo en RUBIK con una cota conocida (escala real);
   - congelar `mmPerPx` y su fuente;
   - ejecutar R01 (con la página del laboratorio en local o con `analyse` en Node) y pasar la evidencia por `f2-bridge`;
   - exportar las sugerencias crudas de RUBIK (flujo ya existente).
4. **Referencias.** Anotación manual de los ejes de muro, revisada por una persona, en el mismo marco y **nunca** a partir de la salida de un detector.
5. **Evaluar** los dos registros con `f2-wall-evaluation.py --tolerance-mm <decidida>`. Informar por tipo, con todos los fallos y sin promediar casos incompatibles.
6. **Decidir con los datos:** si R01 aporta, y en qué tipos. Cualquier integración seguirá necesitando GOV-05 y el contrato de propuesta.

### Métricas

| Métrica | Estado |
|---|---|
| Precisión y exhaustividad por longitud de muros | **Método aprobado.** Disponible para R01 gracias al puente |
| Huecos, estancias, etiquetas OCR | **Sin evaluador aprobado.** No se mide con el comparador de muros (`NOT_EVALUATED` del puente). Requiere una decisión y un método |
| Tiempo y correcciones (manual frente a asistido) | Protocolo de cinco sesiones; el comparador geométrico no lo cubre |
| Latencia y memoria en móvil | Pendiente de medición física. Lo de aquí es Chromium de escritorio |

### Qué falta exactamente para F2 (no se simula)

1. **0 planos reales autorizados** y 0 sesiones: los aporta Juanma, en privado y fuera del repositorio.
2. **Referencias manuales revisadas** para cada plano.
3. **Tolerancia del producto** y umbrales: pendientes de decisión.
4. **Motor OCR local** sin elegir: la asociación de etiquetas no se ha probado con un OCR real.
5. **GOV-05** de R01: aportación de olifod, aviso MIT de wuyi, dependencias OCR.
6. **Evaluadores** de huecos y estancias: no existen.
7. **Contrato de propuesta** (corte 3): pendiente de autorización.
8. **Rendimiento en móvil real:** sin medir.

## Pruebas (resultados reales, en local)

```
tests/sculpt-r01-recognition.test.cjs     17/17  (primer corte, sin cambios)
tests/sculpt-r01-f2-bridge.test.cjs        5/5   (comparador aprobado sin modificar; escala nunca supuesta; sin filtrado)
tests/sculpt-r01-cancel.browser.test.cjs   4/4   (cancelar, respuesta, recuperación = evidencia idéntica, botones)
```

Workflow `SCULPT-R01 lab`: ahora también se ejecuta en PR contra `lab/sculpt-r01-recognition`. Se añaden el paso del puente y el trabajo `cancel-browser`.
