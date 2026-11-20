# OP-07 · Muros curvos e inclinados — expediente de integración (serie v4, 20/11/2026)

> Este documento sustituye a la versión v3 (que queda en el historial de git).
> - Estado: **GO para preparar la integración; NO-GO para activar en Production.**
> - Sin PR productiva, sin fusión y sin migración real.
> - Codex integra y el propietario autoriza.

## 0. Fuente verificable

| Qué | Ref |
|---|---|
| Master de base | `adb86034` (OP-10 #290 fusionada; acwall `eb0a7ee9` y Entregar `56f099dd` incluidos) |
| Serie (commits) | rama `claude/op07-serie-v4` @ `3afb9e18`. Las v3 (`3833838e`) y v2 (`04b8e6f2`) se conservan |
| Parches | `patches/0001…0012` + `MANIFEST.sha256` |
| Reproducir | `node labs/sculpt/op-07/integration/apply-and-test.cjs origin/master [--browser] [--full]` (75/75 sobre `adb86034`) |
| Sondas de Codex | `docs/integration/op07-a0-2026-11-20` @ `2d0cc645`, convertidas en negativos: `tests/op07-s8-codex-probes.test.cjs` |

## 1. Cortes, SHA, estado y GO/NO-GO

Escala del protocolo §4.1: DESARROLLADO → VALIDADO → INTEGRADO → CONECTADO → DISPONIBLE → ACEPTADO. Ningún corte está en master.

| # | Corte | SHA | Estado | Cirugía | Activación |
|---|---|---|---|---|---|
| 1 | S1 Contrato 2.0 y autoridad de versiones | `e5fdea24` | VALIDADO | GO condicionado | NO-GO |
| 2 | S2 Geometría y plano (incluye la corrección de huecos en muro recto inclinado) | `6a54f453` | VALIDADO | GO condicionado | NO-GO |
| 3 | S3 Mediciones | `51c12353` | VALIDADO | GO condicionado | NO-GO |
| 4 | S6 DXF | `594c7e7c` | VALIDADO (ezdxf) | GO técnico; NO-GO para «CAD validado» | NO-GO |
| 5 | S4 3D | `3c605885` | VALIDADO | GO condicionado | NO-GO |
| 6 | S5 Edición | `87a00449` | VALIDADO | GO condicionado | NO-GO |
| 7 | S3b Estancias (incluye la cadena tras dividir) | `ed263a37` | VALIDADO | GO condicionado | NO-GO |
| 8 | S5b Edición visual | `55359f3b` | VALIDADO (Chromium Linux) | GO condicionado | NO-GO. Residual de Windows abierto (§5) |
| 9 | S4b 3D estanco | `66dd8bb1` | VALIDADO | GO condicionado | NO-GO |
| 10 | S7 Guardado protegido F0.2b | `544b501a` | VALIDADO | GO condicionado | NO-GO |
| 11 | OP-10 · `scene-fidelity` y f7 (solo los 3 archivos de `972ac0b9` + la opción de estado en la captura) | `87a60c18` | VALIDADO (bpy 5.2.1) | GO condicionado | — |
| 12 | **S8 Activación efectiva** | `3afb9e18` | VALIDADO | **GO: obligatorio con la serie** | Define la activación |

**Condición de los GO:**
- ratificación de producto (D-OP07-4, 1 mm/1024, D-OP07-2);
- Firefox, WebKit y dispositivos;
- aceptación visual.

**Integrar la serie entera es seguro precisamente porque S8 la deja inactiva.**

## 2. Seguridad (P0 de la auditoría): qué estaba mal en v3 y qué lo impide ahora

| Riesgo confirmado por Codex | Corrección en v4 | Negativo que lo acredita |
|---|---|---|
| **Intención entre proyectos** («mixed»): el enderezado en A legitimaba la pérdida en B con la misma ID de muro | Cada intención lleva `projectId`. `composeIntent` **lanza** si se mezclan proyectos. `saveGate` aplica `intents[project.id]`, y una intención sin proyecto no autoriza nada. El editor acumula por proyecto | Sonda «mixed», plantas de un edificio, variantes (`op07-s8-*.test.cjs`) |
| **Intención en el tiempo** («stale»): enderezar, deshacer y perder la curva pasaba | Una restauración (deshacer, rehacer, recuperación) **revoca** los permisos acumulados sobre todo lo que cambia, y luego aporta su propio diff con las mismas barreras | Sonda «stale» (falla sin la corrección y pasa con ella), «dividir, deshacer la división y borrar», «restored» con escritor antiguo y sin activación |
| **Gate de activación**: «Forma del muro» guardaba un 2.0 en `localStorage` sin F0.2b ni A0 | **S8** (abajo): la puerta S7 también está en el escritor `localStorage`. Integrado no es activo, y activo exige A0 y un escritor protegido | Sonda «defaultCoreCanCreate» y `op07-s8-activation.browser`: F0.2b y `localStorage`, lectura compatible, fallo cerrado sin A0 y en demo aislada |
| Lotes antes del guardado y concurrencia | Un paso solo se olvida cuando está confirmado en **todos** los documentos gestionados (clave de proyecto y biblioteca). En conflicto, el lote sigue pendiente y la autoridad no cambia | S7 navegador (rechazo atómico, misma revisión), S8 (intercalados en dos proyectos) |

### S8 · tres estados separados (efectivos, no documentales)

| Estado | Cómo se llega | Qué permite |
|---|---|---|
| **Lectura compatible** | Siempre, una vez integrado | Abrir, dibujar, medir, presupuestar y exportar (DXF y Blender) un 2.0 que ya exista |
| **Integrado** (por defecto) | `OP07_RELEASE = 'integrated'` en `project-core.js` | Sin punto de curvatura ni «Forma del muro». `setWallCurve`, `setWallEndHeight` y `splitWall` responden `activation-pending`. `raiseVersion` nunca crea un 2.x. Ningún escritor (F0.2b ni `localStorage`) confirma un proyecto 2.x nuevo o modificado, incluidos importar y restaurar. El cambio queda en la pestaña y se explica |
| **Activo** | Cambiar `OP07_RELEASE` (código autorizado). Además, en la página: A0 cargado (`FloorPlanSchemaEpoch`) **y** un escritor protegido registrado | Todo. Si falta A0 o el escritor, falla cerrado (`activationBlockers()`) |

- Un host desplegado no puede activarse desde la página: `RUBIK_OP07_STATE` solo se lee en Node, `127.0.0.1`, `localhost` o `f0-2b.localhost`.
- Las pruebas activas declaran un **sustituto de A0 etiquetado** (`tests/op07/browser-state.cjs`), porque A0 no está en master. La convivencia real se acreditará al integrar A0.

## 3. Superficies (regla HOME / PLATAFORMA / ENTREGABLES)

**HOME.**
- Candidato de alto valor para arquitectura, reformas e interiorismo: curvas y pendientes reales sin trucos.
- Hoy: **sin entrada** («preparation» en K9).
- Solo aparecerá cuando esté DISPONIBLE y autorizado.
- No se ha añadido ninguna tarjeta.

**PLATAFORMA.**
- Recorrido: *Diseñar → Seleccionar un muro → panel del muro → «Forma del muro»* (flecha, altura final, Enderezar, Nivelar, Dividir) o *arrastrar el punto de curvatura en el plano*.
- Acreditado en el estado activo de pruebas:
  - escritorio 1440×900;
  - 844×390 y 390×844 (S4);
  - ratón y teclado reales (S5b);
  - botones de 44 px;
  - un arrastre equivale a un paso de historial y un guardado;
  - los rechazos explican la causa, el estado de los datos y el siguiente paso (Perla).
- En el estado integrado no hay entrada (S8).
- Pendiente: Firefox, WebKit, dispositivos físicos, auditoría de accesibilidad (lector de pantalla) y el residual de Windows (§5).

**ENTREGABLES.**

| Consumidor | Estado con un 2.0 | Evidencia |
|---|---|---|
| Plano 2D | **Conectado y probado** | S2 (plano v1 idéntico byte a byte), capturas 01–07 |
| Superficies / suelo (`surface-core`, Q.room) | **Conectado y probado** | S3b, `op07-s3b-split` |
| Presupuesto (líneas de suelo, pintura y caras) | **Conectado y probado** | S3/S3b (v1 byte a byte; curva por el anillo) |
| Panel de estancia UX-03 | **Conectado y probado** | S3b y `ux03-wall-faces` |
| DXF (G-02) | **Conectado y probado** (lector independiente) | `g02-dxf-curved*`; CAD comercial pendiente |
| Blender (OP-10, Entregar → Escena) | **Conectado y probado** | f1–f7 con bpy 5.2.1; `scene-export` (Entregar real) 6/7, y el fallo también ocurre en master |
| Visor 3D / Recorrer / Presentación | Conectado (mismo visor) | S4/S4b; **Presentación no tiene prueba propia con un 2.0** |
| Dossier / expediente (`expediente-core`), Studio, FF&E | **Futuro: no acreditado** | Sin pruebas con un 2.0. No se debe anunciar |

## 4. Validación de la serie v4 (Chromium, Linux, bpy 5.2.1)

- **Suite pura completa:** 1609 pruebas, 0 fallos.
- **Navegador:** 54/56. Cubre OP-07 ×6, persistencia, edificios, UX-03, K4, `scene-export` (acwall C3 y la exportación real desde Entregar), presupuesto y G-02. Los 2 fallos **también ocurren en master `adb86034` en este entorno**:
  - «G-02 downloads only the active building level». Codex lo vio pasar en Windows, así que depende del entorno.
  - «GLB retrasado 6 s… exportaciones sucesivas deterministas».
- **Blender:** f1–f7 idénticos a la referencia. f7: 49/48 comprobaciones de contrato, 0 fallos, reapertura PASS (`blender/evidence-v4/`). La corrección de suspensión del visor de master no se toca.
- **Capturas:**
  - `integration/visual/06-ventana-muro-inclinado-{2d,3d}.webp`: la ventana mide su anchura real;
  - `07-union-muro-curvo-dividido-{2d,3d}.webp`: unión continua de las dos piezas.

## 5. Residuales y A0 (sin atribuir causas no demostradas)

- **Manipulador al enderezar (Codex, Chromium Windows):** **no reproducido** en Chromium Linux. Probé la hipótesis de que faltaba capturar el puntero con un panel superpuesto, pero la prueba no discriminaba, así que **revertí** el cambio y no queda nada en la serie. Petición a Codex: la secuencia de `pointermove`/`pointerup` y `ui.tool` de la ejecución que falla.
- **A0:** analicé las 12 trazas de Codex (WebKit escritorio, móvil e histórico `8a2730ee`, y Firefox; R1-T02/T02b/T04 con F0.2b activo):
  - 0 errores de ResizeObserver;
  - 0 cambios síncronos de tamaño;
  - ningún callback dentro de un rAF;
  - entre 9 y 11 entregas por vista;
  - ninguna truncada.
  - **El fallo histórico no se reprodujo y las trazas no identifican ninguna causa.**
  - Recomendación: mantener A0 congelado y el trazador en un trabajo WebKit que guarde la traza si falla. No hay corrección sin traza. No se propaga a #274–#279.

## 6. Plan de integración (Codex)

1. Rama `codex/…` desde el master vigente: `git am --3way patches/0001…0012`. Si algo no aplica, se regenera desde `claude/op07-serie-v4` y no se toca a mano.
2. Pruebas:
   - `apply-and-test.cjs <base> --browser --full`;
   - Firefox y WebKit de `op07-*` y `persistence`;
   - `scene-run.cjs` (f1–f7);
   - G-02 CAD;
   - `integration/s7-legacy-reader.cjs`.
3. **Integrar inactivo** (`OP07_RELEASE='integrated'`).
4. La activación es un commit separado, solo con:
   - A0 integrado y con WebKit estable;
   - 7 días de convivencia de A0;
   - aceptación visual y CAD;
   - autorización expresa.

## 7. Rollback (nunca abrir un 2.0 como recto en silencio)

- **Activación:** volver a `OP07_RELEASE='integrated'`. Los 2.0 existentes siguen legibles (lectura compatible) y no se confirma ningún cambio sobre ellos.
- **Código:** revertir la serie. Un 2.0 guardado se rechaza al cargar (el lector v1 no arranca y la colección queda byte a byte igual: `s7-legacy-reader.cjs`). La copia de emergencia conserva el 2.0 completo.
- **Datos:** no hay migración. Un 2.0 solo existe si se curvó o inclinó un muro con la función activa.
- **Prohibido:** degradar un 2.0 a 1.x por código, o guardar una vista `legacyView`.

## 8. Puertas pendientes

| Puerta | Responsable |
|---|---|
| A0: WebKit estable, integración y 7 días de convivencia | Codex / propietario |
| Firefox, WebKit y dispositivos de la serie v4; residual del manipulador en Windows | Codex |
| Accesibilidad (lector de pantalla) de «Forma del muro» | Codex / ChatGPT |
| Aceptación visual; DXF en dos CAD comerciales | Propietario / arquitecto |
| Presentación, dossier, Studio y FF&E con un 2.0 | Futuro (sin acreditar) |
| G-02 y GLB determinista: fallan en master en este entorno | Corte aparte |
