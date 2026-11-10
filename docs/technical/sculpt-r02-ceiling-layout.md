# SCULPT-R02-A — Techos interiores, equipos altos y colocación 2D/3D (laboratorio)

**Fecha:** 10/11/2026 · **Rama:** `lab/sculpt-r02-ceiling-layout` (desde `master@75615fd`) · **Laboratorio:** `labs/sculpt/r02-ceiling/` (fuera de Vercel)
**Estado:** **laboratorio funcional, pendiente de revisión humana. NO integrado en RUBIK. NO validado para diseño técnico reglamentario.**
**Registro:** la ficha R02 vive en el catálogo SCULPT (PR #192, alias G4/G5) subordinado al catálogo maestro (relación parcial con LUZ-01 y OBR-04, **sin ID maestro exacto: decisión del propietario**). Este documento no crea cartera ni ola.

## 1. Objetivo y límites
Recuperar del donante la capacidad de **colocar y ver elementos de techo y altos** separada del mobiliario de suelo, esculpirla como evidencia aislada para los contratos de RUBIK y compararla con lo que RUBIK ya hace.

| Cuestión | ¿Qué hay realmente en el donante? | Tratamiento |
|---|---|---|
| **A. Distribución sobre techo** | **Sí.** Capa `layer:'ceiling'`, biblioteca de 6 elementos, descuelgue (`ceilingDrop`), caída de cortina (`curtainLength`), regla de altura libre, colocación respecto a muros, cota en 3D | Recuperada y esculpida |
| **B. Geometría interior de techo** | **Solo un plano**: altura libre única por proyecto = `height − floorFinish` medida desde el suelo acabado. Sin techo por estancia, sin desniveles, sin pendientes, sin espesores | Se recupera la referencia vertical, generalizada a RUBIK (§6) |
| **C. Falso techo paramétrico** | **No existe** | Fuera de alcance |
| **D. Instalaciones MEP** | **No en R02-A.** El padre `88323f3` ya traía una lista de «puntos» (power, light, water…) y «presets» de dispositivos: es un inventario de puntos, no cálculo ni diseño | Fuera de alcance: no se copia ni se valora como MEP |

## 2. Donante, delta y derechos
Detalle: `labs/sculpt/r02-ceiling/PROVENANCE.md`.
- **PR y commit:** wy51ai/floorplan-3d#17 · `zhuzhuyumeng/floorplan-3d:feat/ceiling-layout` · commit `324eb64cf9b26f6d4df8323c2dec4591fa4691e3` (árbol `81e330c7…`).
- **Padre:** `88323f3cc4ab5960570560192dee3d6163186a94`.
- **Diferencial comprobado (8 archivos, +190 / −55):**

  | Archivo | Qué aporta |
  |---|---|
  | `index.html` | Modo de techo, catálogo, 2D, 3D, `commit` con colocación |
  | `js/project-model.js` | Validaciones y colocación respecto a muros |
  | `js/ai-layout.js` | Usa la colocación y conserva la capa de techo |
  | `js/project-ui.js`, `project.css` | Ajustes de interfaz |
  | Tres archivos de prueba | Las pruebas del donante |

- **No es diferencial**, porque ya venía en el padre: IA de pago, mobiliario y reconocimiento. Los archivos de reconocimiento son **idénticos a R01** y no se duplican.
- **Autoría:** olifod, con el trailer `Co-authored-by: Cursor`.
- **Licencia:** MIT © wuyi en el árbol. **GOV-05 abierto**: falta base para reutilizar las contribuciones (incluida la coautoría de IA) y el aviso MIT en RUBIK.
- **SOURCE EXACT solo en local:** contiene la misma imagen de vivienda de terceros que R01. Se reconstruye y verifica de forma segura con `fetch-source-exact.sh` (manifiesto de 41 archivos).

## 3. Baseline del donante (antes de esculpir)
| Capacidad | Prueba original | Resultado | Dependencias | Limitaciones |
|---|---|---|---|---|
| Modelo y validaciones (todas las del proyecto) | `tests/model.test.cjs` | **18/18** en `324eb64` (17/17 en el padre; la nueva es la de colocación) | Ninguna (Node 22, sin instalar) | Unitarias |
| Colocación respecto a muros, girada, con contacto permitido y salida de huecos estrechos | `model.test.cjs:84-94`, sin cambios, contra el extracto A del taller | **1/1** | — | Muros alineados a los ejes |
| Capa de techo: aislamiento, edición de descuelgue, persistencia tras recargar, 3D | `tests/ceiling.spec.cjs` | **✓** (13,1 s) | `@playwright/test@1.63.0` con `--ignore-scripts`; three r160 desde `vendor/three` de RUBIK | El navegador local, no Chrome de macOS |
| Colocación al arrastrar y redimensionar, y deshacer | `tests/furniture-placement.spec.cjs` | **✓** (6,6 s) | Ídem | Ídem |
| Peticiones externas durante el E2E | Arnés de bloqueo | **0** | — | three servido en local |

Las tres pruebas se ejecutan también en la CI (jobs `source-exact` y `donor-e2e`), sobre una reconstrucción del snapshot fuera del checkout.

## 4. Familia funcional, dependencias y CLASSIFY
```text
CEILING_LIB (B) ──► creación con valores por defecto (E) ──► validación por elemento (C) ──► regla de altura libre (D)
      │                                                                                        │
      ▼                                                                                        ▼
footprint · overlap (heredados de 88323f3) ──► furniturePlacement ──► resolveFurniturePlacement      3D: arriba = H − descuelgue,
      (A: imprescindibles, sin otras dependencias)                                                    abajo = arriba − h, cortina debajo (F)
```
| Pieza | Decisión | Por qué | Capacidad conservada o perdida |
|---|---|---|---|
| `footprint`, `overlap` (heredados) | **KEEP** (extracto A literal) | Imprescindibles para la colocación y sin más dependencias | Se conservan |
| `furniturePlacement` | **KEEP** | Prueba de muros exacta con la huella girada; el contacto está permitido | Se conserva |
| `resolveFurniturePlacement` | **KEEP + GENERALISE** (C3a, C3b) | Útil, pero puede sacar el elemento de la estancia y devuelve mm no enteros | La sugerencia se marca si sale de la estancia y se redondea a mm enteros revalidados |
| `CEILING_LIB` | **KEEP** como valores por defecto del donante | Tamaños genéricos, no productos medidos | `sizeSource: 'donor-catalog'` |
| Regla D (altura libre) | **GENERALISE** | Misma suma, con la referencia vertical explícita | Paridad probada con la línea literal |
| Fórmula 3D F | **GENERALISE** | Mismas cotas, en mm y con referencia declarada | Paridad probada |
| Valores por defecto E (descuelgue 200 del AC; cortina = altura libre − h − 20) | **OPTIONALISE** (`useDonorDefaults`, apagado por defecto) | Son supuestos del donante | Si se usan, quedan marcados como `donor-default` |
| Altura del donante «`height` = 层高» | **REPLACE** | RUBIK no tiene un `height`/`floorFinish` de proyecto | `ceiling` declarado, derivado de la planta superior o desconocido |
| Muros como rectángulos del donante | **GENERALISE** | Los muros de RUBIK son ejes con grosor y pueden ir en diagonal | Rectángulo exacto si el muro va alineado a los ejes; cuadrilátero orientado (SAT) si no. La recolocación solo funciona con muros alineados, y si no se marca `unsupported-wall-orientation` |
| Modo, filtro y panel del editor (`index.html`, `project-ui.js`, `project.css`) | **REMOVE** del laboratorio | No crear un segundo editor | Comportamiento descrito; no copiado |
| Persistencia (`localStorage`, `commit` del donante) | **REPLACE** | Autoridad única: `FloorPlanProjectV1` | La serialización es solo de la evidencia |
| Mallas 3D del donante (lámpara, calefactor, cortina) | **REMOVE** (por ahora) | El 3D de RUBIK es la autoridad; el laboratorio usa cajas | Forma visual detallada pendiente (posible R02-B) |
| `ai-layout.js` (cambio de 3 líneas) y la capa de IA | **REMOVE** | IA de pago, fuera de R02-A | — |
| Reconocimiento (`recognition-*`) | **REMOVE** (duplicado de R01) | Mismos blobs | — |
| Puntos y dispositivos del padre (`KINDS`, `PRESETS`) | **Bloqueado / fuera de alcance** | No es R02-A y no es diseño MEP | Hallazgo documentado |

## 5. Comparación con RUBIK actual (`master@75615fd`)
| Capacidad | RUBIK hoy | Donante R02-A | Delta útil | Conflicto o dependencia |
|---|---|---|---|---|
| Capa de techo separada de la de suelo | **No existe.** Un plafón sería un objeto de suelo: `FloorPlanPlacement.problems` lo bloquea sobre una cama (`furniture:obj_bed`) | Sí | **Nuevo** | Requiere decidir dónde vive la capa en `FloorPlanProjectV1` (sin decisión: no se toca el esquema) |
| Altura libre o plano de techo | No definida. `walls[].heightMm` y `defaults.wallHeightMm`; en edificio se deduce de la planta superior | Un valor por proyecto | **Nuevo**, con referencia explícita | Sin `floorFinish` en RUBIK; la planta superior sin dato queda `unknown` |
| Cota de montaje del objeto | `elevationMm` existe en el esquema pero **no se usa en el código**; el AC mural se dibuja **siempre a 2,2 m** | Descuelgue + altura | **Superior** | Integrar exigiría tocar el 3D: fuera de este corte |
| Comprobación de altura libre | Declarada **NO comprobada** (`NOT_CHECKED` de `furniture-placement.js`) | Regla D | **Nuevo** | — |
| Cortina con caída | No existe | Sí | **Nuevo** | — |
| Colocación en planta | **Superior en RUBIK:** estancia completa, muros, barrido de puertas, escalera y otros muebles; búsqueda determinista | Solo muros (rectángulos), con recolocación simple | **Ninguno** para el suelo: RUBIK manda | La recolocación del donante solo sirve de referencia |
| Interferencias 3D entre equipos | No | No (el donante no cruza alturas) | **Nuevo en el adaptador**: solape en planta frente a solape 3D | — |
| Holgura sobre mobiliario de suelo | No | No | **Nuevo en el adaptador** (`floorClearance`) | Si el objeto no tiene altura conocida, queda `object-height-unknown` |
| Iluminación visual | Sí (render y presentación) | Emisivo simple | Ninguno | No es cálculo lumínico |
| Cubierta exterior (`roof-core.js`) | Sí | No | — | **No es un techo interior**: no se mezcla |
| Historial / deshacer | Canónico | Propio | — | No se importa |

## 6. Contrato de laboratorio `CeilingLayoutEvidenceV1`
`labs/sculpt/r02-ceiling/ceiling-layout-evidence-core.js` (`RubikCeilingLayoutEvidence`). Nombre sin colisiones en RUBIK.

- **Entrada:** el `project` en modo de solo lectura (o `building` + `levelId`), `ceiling` (declaración opcional `{clearHeightMm, reference: 'finished-floor'|'level-floor', source}`), `requests` y `options.useDonorDefaults`.
- **Salida, por propuesta:**
  - id, nivel, estancia y tipo/clase;
  - posición, tamaño (con su origen) y rotación;
  - `mount`: estado, referencia, descuelgue y su origen, cota superior e inferior, cortina y su origen, punto más bajo, `fitsClearHeight`;
  - `plan`: contacto con muro y sugerencia (estado, posición en mm enteros, posición del donante y mensaje del donante);
  - interferencias, `floorClearance` y avisos;
  - `review: 'unreviewed'` y `status: 'proposed-not-applied'`.
- **Cabecera de la evidencia:** `canonical: false`, `applied: false`, marco de coordenadas, `vertical`, procedencia y límites permanentes. Los límites son: no integrado, no MEP, sin lux, sin climatización, no reglamentario y sin geometría de falso techo.
- **Coordenadas:**
  - mm; origen arriba a la izquierda, `y` hacia abajo, rotación en grados en sentido horario (igual en RUBIK y en el `footprint` del donante).
  - Vertical: desde el suelo indicado en `reference`.
  - El donante mide desde el suelo acabado, con un plano de techo en `height − floorFinish`.
  - RUBIK no tiene suelo acabado. Por eso, la altura derivada de la planta superior se etiqueta `level-floor` y no se mezcla con `finished-floor`. Una declaración que contradice a la derivada da `contradictory`, y entonces no se calcula ninguna cota.
- **Seguridad:** no recibe permiso de escritura y no hay función `apply`. `previewDiff` solo enumera lo que *se añadiría*, con estado `not-applied`. `validate` rechaza confianzas, lux, vatios, circuitos o certificaciones y cualquier `applied: true`. `serialize`/`parse` hacen ida y vuelta validada.
- **Cancelación:** el cálculo es síncrono y puro, así que **no se afirma que haya cancelación interrumpible**.

## 7. Escenarios y pruebas
`fixtures/ceiling-scenarios.js`: 12 escenarios generados por código, con ids fijos. Ninguno es un plano real.

`tests/sculpt-r02-ceiling-layout.test.cjs`: **18/18**.

| Caso | Resultado medido |
|---|---|
| Plafón centrado | 2600 → 2500, cabe, en su sitio |
| Colgante con descuelgue sobre una cama de 500 | 2600 → 2000; holgura de 1500 sobre la cama; RUBIK hoy: bloqueado por `obj_bed` |
| Riel + cortina de 2400 | Base 2520, punto más bajo 120. Con 2600: −80, `exceeds-clear-height`; el donante tampoco cabe |
| AC mural con descuelgue de 200 | 2400 → 2100; RUBIK hoy, a 2200 fijo |
| No cabe (aseo de 1000×800) | Solapa muros; el donante lo saca del hueco («这里放不下啦») a `y = −170`, fuera de la estancia → `suggestion-leaves-room` |
| Girado 45° junto a un muro | Detecta solape con la huella girada; el donante devuelve 318,198…; el adaptador da 319 revalidado |
| Estancia en L | Dentro: `rom_l`; en el entrante, `outside-rooms` |
| Dos equipos | Colgante y plafón: `overlap-3d`. Colgante corto y calefactor a 1200: `plan-overlap-vertically-clear` |
| Dos plantas | Baja: altura derivada 2750 (3000 − 250 − 0, `level-floor`). Alta: `unknown`. Declarar 2400 en la alta funciona. Declarar 2600 en la baja da `contradictory` |
| Altura desconocida | Ninguna cota. La altura de los muros, 2600, se muestra solo como contexto |
| Capa de suelo | Armario de 2200 bajo un colgante (punto más bajo 2000): `clash −200`. Mesa sin altura: `object-height-unknown`. Objetos sin modificar |
| Muro diagonal | Solape detectado; la recolocación no se finge (`unsupported-wall-orientation`) |
| Negativos | NaN, infinito, tamaño negativo, ids repetidos, fuera de rango, tipo desconocido, descuelgue negativo, cortina en un elemento que no es cortina, referencia vertical incompatible, altura no entera, planta inexistente, proyecto inválido, evidencia manipulada tras serializar: todos con su código |
| Paridad con el donante | **18 propuestas con cota calculada: fórmula F y regla D literal idénticas** |
| Guardas | Sin proveedores de IA, sin código de R01, ningún archivo del producto carga el laboratorio, sin imágenes del donante |

## 8. Laboratorio visual, métricas y capturas
`labs/sculpt/r02-ceiling/index.html` tiene el aviso fijo «LABORATORIO SCULPT-R02-A — NO INTEGRADO EN RUBIK — NO VALIDADO PARA DISEÑO TÉCNICO REGLAMENTARIO» y estas vistas:

| Vista | Contenido |
|---|---|
| A · Donante | Huellas, recolocación y mensajes |
| B · Interpretación para RUBIK | Las propuestas de la evidencia |
| Sección vertical | Alturas frente al plano de techo |
| 3D | Three r160 **de `vendor/three` de RUBIK** |
| C · Comparador | Posición, tamaño, alturas, cabida, paridad F/D, suelo e interferencias, RUBIK hoy y avisos |

**Para revisarla en local:**

```bash
python3 -m http.server 8000
```

Después, abrir `http://127.0.0.1:8000/labs/sculpt/r02-ceiling/index.html?scenario=floor-layer`. Vercel excluye `labs/`, así que la Preview devuelve 404 a propósito.

**QA de navegador** (Chromium headless con SwiftShader):
- 1440×900, 1280×800, 390×844 y 844×390: sin desplazamiento horizontal; tamaño mínimo de texto, 12 px.
- 0 errores de página o consola, 0 respuestas ≥ 400, **0 peticiones externas**.
- **Rendimiento orientativo:** los 12 escenarios renderizados (SVG + 3D) con una mediana de 2,9 ms y un máximo de 4,4 ms. Heap de JS: 18 MB (`performance.memory`).
- **Capturas** en `docs/qa/artifacts/sculpt-r02a/`:
  - `lab-floor-layer-{1440x900,1280x800,390x844,844x390}.png`;
  - `scenario-*-1440x900.png` (6 escenarios).

## 9. Ciclos de pulido
| Ciclo | Observado | Cambio mínimo | Antes → después | Decisión |
|---|---|---|---|---|
| C1 capas | En RUBIK, un equipo de techo sería un objeto de suelo que choca con la cama | Capa separada en la evidencia; el suelo es de solo lectura y se mide la holgura | RUBIK hoy: `furniture:obj_bed`. Evidencia: holgura 1500, proyecto idéntico byte a byte | KEEP |
| C2 alturas | El donante supone 100 de alto, 0 de descuelgue y 2000 de cortina cuando falta el dato | Dato ausente → `unknown`; valores por defecto solo como opción y etiquetados | Con altura desconocida, antes había una cota inventada y ahora `unknown` | KEEP |
| C3a | La recolocación del donante saca el riel de la estancia (`y = −170`) | Se comprueba la estancia de la sugerencia | Antes: sugerencia «válida». Ahora: `suggestion-leaves-room` | KEEP |
| C3b | La sugerencia trae 318,198… mm | Redondeo y revalidación con `furniturePlacement` | 318,198 → 319, sin solape | KEEP |
| C3c | Muros de RUBIK en diagonal | Cuadrilátero orientado + SAT; la recolocación solo con muros alineados | Solape detectado; `unsupported-wall-orientation` en lugar de una sugerencia falsa | KEEP (límite documentado) |
| C4 visual | La cámara 3D quedaba dentro de las estancias pequeñas; los estados salían en inglés | Encuadre por tamaño y altura; etiquetas en español | Antes: muros llenando el cuadro. Después: estancia completa | KEEP |
| C5 serialización | — | `serialize`/`parse` con `validate` | Ida y vuelta idéntica; manipular la evidencia da `invalid-evidence` | KEEP |
| C6 propuestas | — | Sin `apply` ni `cancel`; `previewDiff` con `not-applied` | — | KEEP |
| C7 comparación | — | Comparador donante, adaptador y RUBIK hoy | Paridad F/D 18/18; delta medido (§5) | KEEP |

## 10. Conservado, excluido y pendiente
- **Conservado:** catálogo, capa, descuelgue, caída de cortina, regla de altura libre, cota 3D, colocación respecto a muros (huella girada y contacto permitido) y recolocación del donante.
- **Generalizado:**
  - referencia vertical explícita;
  - muros de RUBIK con eje, grosor y diagonales;
  - mm enteros;
  - sugerencia que comprueba la estancia;
  - interferencias 3D y holgura con el suelo, que el donante no tenía.
- **Excluido:** editor, persistencia, mallas 3D detalladas, IA de pago, reconocimiento (R01) y puntos y dispositivos del padre.
- **Pendiente:**
  - decidir dónde vive la capa de techo en `FloorPlanProjectV1`;
  - qué hacer con `elevationMm`, que no se usa;
  - si RUBIK necesita un suelo acabado o una altura libre por estancia;
  - formas 3D detalladas (R02-B o cirugía).

## 11. Riesgos
- GOV-05 sin resolver (contribuciones con coautoría de IA).
- Los tamaños del catálogo son del donante, no productos medidos.
- La recolocación del donante solo funciona con muros alineados y no conoce las estancias (corregido en la evidencia, no en el algoritmo).
- Cuando una planta no tiene planta superior, la altura será a menudo `unknown` hasta que alguien la declare.
- Ninguna medida es reglamentaria.

## 12. Decisiones pendientes de Juanma
1. Revisar el laboratorio en local o mediante las capturas.
2. Decidir si existe un ID maestro para la capa de techo (G4) o si sigue como investigación (relación parcial con LUZ-01 y OBR-04).
3. Decidir el modelo de datos de techo para una cirugía futura: capa en `objects` con `elevationMm` o una colección nueva, y altura libre por planta o por estancia.
4. GOV-05.
5. Autorizar o no R02-B (formas 3D y colocación asistida no IA de `ai-layout.js`) o una integración. **No se ha implementado nada de esto.**

### Propuesta mínima para la ficha R02 del catálogo (#192 §3, «Estado real»)
No se aplica desde esta rama:

> «R02-A — laboratorio funcional, pendiente de revisión humana (PR <número>, SHA <final>): capa de techo, descuelgue, cortinas, regla de altura libre y cota 3D recuperadas con paridad; sin MEP, sin falsos techos, sin integración.»

## 13. Dictamen
**GO — LABORATORIO FUNCIONAL, PENDIENTE DE REVISIÓN HUMANA.**
- Hay un delta real y medido frente a RUBIK: capa de techo, altura libre, montaje vertical, cortinas, interferencias 3D y holgura con el suelo.
- La paridad con el donante está probada.
- Hay cero escritura en el proyecto y los límites son explícitos.

Esto **no** es «apto para integrar»: integrar exige las decisiones 2–5 y una cirugía autorizada.
