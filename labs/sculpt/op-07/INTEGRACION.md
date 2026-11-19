# OP-07 · Preparación técnica para la integración (S1–S6)

**Estado (19/11/2026):** seis parches preparados, probados y **no aplicados** al producto. Se aplican sobre master `02712b51` (árbol de la serie aplicada `a75d6ca5`) y sus pruebas pasan. Siguen sin autorización: F0.2b no está integrada y la cirugía no tiene autorización expresa ([PLAN-CIRUGIA.md](PLAN-CIRUGIA.md)). No se abre ninguna PR productiva.

Punto de partida, sin rehacerlo: el núcleo `wall-geometry-core.js` (34 pruebas) y las decisiones D-OP07-1, D-OP07-2 y D-OP07-3 ([DECISIONES.md](DECISIONES.md)). El núcleo se promueve a `js/wall-geometry-core.js` sin cambiar su código: solo cambian la cabecera y el nombre global, y la huella del cuerpo se comprueba en S1. No hay un segundo motor geométrico: `project-core`, `quantity-core`, el renderer y G-02 lo llaman.

## 1. Cómo verificarlo

```sh
node labs/sculpt/op-07/integration/apply-and-test.cjs                    # aplica S1–S6 en un worktree temporal: 28 pruebas
node labs/sculpt/op-07/integration/apply-and-test.cjs origin/master --full   # + suite pura del repositorio
CHROME=… THREE_LOCAL_DIR=$PWD/vendor/three node labs/sculpt/op-07/integration/apply-and-test.cjs origin/master --browser
node labs/sculpt/op-07/integration/evaluate-resolution.cjs                # tabla de RESOLUCION.md
```

Las huellas de los parches están en `patches/MANIFEST.sha256`. El orden de aplicación es **S1 → S2 → S3 → S6 → S4 → S5**. S6 solo depende de S2, por eso va antes que el 3D.

## 2. Cortes

| Corte | Parche | Archivos | Qué cambia | Puerta cumplida (con pruebas) |
|---|---|---|---|---|
| **S1 · Contrato** | `S1-contrato.patch` | `js/wall-geometry-core.js` (nuevo), `project-schema.js`, `project-core.js`, `building-core.js`, esquema y contrato en `docs/contracts/`, 3 páginas que cargan el núcleo | `curve` y `heightEndMm` opcionales desde 1.13.0. Reglas del núcleo (radio mínimo, curva que se pliega, altura final). Aberturas medidas sobre la trayectoria y bajo el borde más bajo. `Core.guardSave`, `featuresOf`, `WALL_FEATURES`. `WALL_PATH` es la resolución única. | 7 pruebas: proyectos antiguos idénticos, 1.12 rechaza los campos, reglas de muro y abertura, edificio estricto, guardado protegido (escritor antiguo, vista degradada, pérdidas por contenido, abertura perdida), huella del núcleo |
| **S2 · Geometría y plano** | `S2-geometria-plano.patch` | `project-core.js` | Un rectángulo por faceta, macizo donde no hay abertura, con alturas en sus extremos. Símbolo de la abertura en la cuerda de sus bordes reales. `wallOutline`. | 5 pruebas: plano de ejemplo **byte a byte igual que master** (huella), el resto del plano intacto con un muro curvo, cobertura exacta, desviación ≤ tolerancia, contorno cerrado |
| **S3 · Mediciones** | `S3-mediciones.patch` | `quantity-core.js` | Muro curvo o inclinado: longitud de trayectoria y caras izquierda y derecha propias (D-OP07-2, suman 2 × eje), mochetas aparte, trapecios. Estancias junto a un muro inclinado: trapecio. Junto a un muro curvo: incompleto y **nombrado** (`pendingCurvedWalls`), nunca medido por su cuerda. | 6 pruebas: `Q.level`, `Q.home` y líneas de presupuesto **byte a byte iguales que master**, caras y mochetas, trapecio, sin recorte silencioso, pintura que solo cambia por el muro curvo, convivencia con UX-03 |
| **S6 · DXF** | `S6-dxf.patch` | `dxf-export.js`, `project-core.js` | Piezas visibles por faceta y una huella de 4 vértices por faceta. El lector DXF de RUBIK (`plan-intake`) solo acepta 4 vértices, así que un contorno curvo completo le haría rechazar el archivo. | 2 pruebas: DXF del ejemplo **byte a byte igual que master**; relectura con `dxfFromText`, con la longitud reconstruida dentro del redondeo |
| **S4 · 3D** | `S4-3d.patch` | `project-core.js` (`pieceMesh`), `index.html` (`wallBox`, `View3D.wallsInspect`) | Cada pieza de un muro curvo o inclinado es una caja con pendiente del núcleo (`slopedPiece`), con UV continuas a lo largo del muro. Los dinteles siguen la pendiente. Los muros rectos siguen siendo cajas. | 3 pruebas puras y 3 de navegador (1440×900, 844×390 y 390×844), sin errores ni red externa |
| **S5 · Edición** | `S5-edicion.patch` | `project-core.js` | `setWallCurve`, `setWallEndHeight` y `splitWall` son operaciones puras con el resultado del editor (`{ok, project, explanation, intent}`). Pasan por `FloorPlanApp.applyExtension`: validación, deshacer y rehacer, y guardado (sin un segundo editor, como R03). Una división que cruza una abertura se rechaza y la nombra. | 5 pruebas puras y 1 de navegador: curvar, dividir, deshacer, rehacer, rechazo atómico |

**Suite completa con S1–S6 aplicados:**

| Suite | Resultado |
|---|---|
| Pura | 1484/1484 (1486 pruebas, 0 fallos) |
| Navegador relacionado: OP-07 S4 y S5, G-02, edificio, cantidades, patrón de panel | 23/24 |

El único fallo es «G-02 downloads only the active building level» (nombre del archivo descargado) y **ya existe en master** sin los parches: lo comprobé en una copia limpia de `02712b51`.

**Cambios en pruebas existentes:** tres pruebas usaban 1.13.0 como «versión futura desconocida» (`building.test`, `building-project-1-6.test` y `r03-cabinet-contract.test`). Pasan a 1.14.0 con la misma garantía, y ninguna aserción se relaja.

## 3. Convivencia

Simulación de fusión con `git merge-tree` desde la serie aplicada:

| Rama | Resultado |
|---|---|
| UX-03 (`claude/ux03-wall-area`) | Limpia |
| UX-03 sobre K4 | Limpia, y los parches se aplican y pasan |
| K4 (`claude/k4-room-type`) | Limpia |
| K9 (`claude/k9-capability-registry`, incluye K4) | Limpia, y los parches se aplican y pasan |
| AST-01 | Limpia |
| A0 (`claude/a0-writer-fence` @ `112eaf52`) | Limpia, y los parches se aplican y pasan |
| Cadena F0 (`claude/f0-3-actions`) | Limpia |
| K13 | Limpia |
| OP-10 (`claude/sculpt-op10-blender`) | Limpia |

- **UX-03:** su panel lee `Q.room(...).wallFaces`. Junto a un muro inclinado ve el trapecio real. Junto a un muro curvo ve «X m del contorno no tienen muro» y nunca una cifra por la cuerda.
- **OP-02 (render a demanda, ya en master):** la prueba 3D de S4 pasa sobre master con OP-02.
- **OP-10 (captura Blender):** no comparte archivos con OP-07, porque su rama solo toca `labs/`. Pero su comparador (`labs/sculpt/op-10/src/compare.cjs`) mide grosor y longitud sobre la cuerda y la altura con `heightMm`. Con un muro curvo o inclinado daría falsos fallos de fidelidad. **Requisito para la cirugía de OP-10:** usar el marco por faceta de `js/wall-geometry-core.js` y la altura máxima de la pieza (`heightStart` y `heightEnd` de S2). No he modificado su laboratorio.

## 4. Resolución: tolerancia de 1 mm y techo de 1024 facetas (evaluado, no decidido)

Tabla completa en [integration/RESOLUCION.md](integration/RESOLUCION.md), en el mismo formato que DECISIONES.md §2.

| Caso | 16 facetas fijas | Tolerancia 1 mm |
|---|---|---|
| Típico | Desviación 2,93 mm | 28 facetas, 0,96 mm |
| Fachada de 200 m | Desviación 117 mm | 174 facetas, 0,99 mm |
| Muro de 2 km en el límite de coordenadas | Desviación 1 953 mm | 708 facetas, 1,00 mm |

- **El techo de 1024 nunca actúa con 1 mm dentro del contrato:** haría falta |P0 − 2·P1 + P2| > 4 194 m, y las coordenadas están limitadas a ±1 000 m.
- **Coste:** de 0,009 a 0,1 ms por trayectoria.
- **Contrapartida medida:** cada faceta es una pieza de plano y una malla 3D. Un muro curvo típico pasa de 16 a 28–40 mallas.
- `Core.WALL_PATH = {toleranceMm: 1}` está en un solo sitio. Cambiarlo, o volver a 16 fijas con `null`, no toca otro código.

## 5. Decisiones que necesitan al responsable de producto antes de autorizar S1

1. **D-OP07-4 · versión del contrato.** `FloorPlanProjectV1.md` §3 dice que una minor «solo añade campos que se puedan ignorar sin perder información». `curve` y `heightEndMm` **no son ignorables**: hoy, un lector 1.12 acepta un 1.13 (conserva campos desconocidos) y vería un muro recto.
   - **Opción A, la preparada en S1:** minor 1.13.0. La protección frente a lectores antiguos depende de la barrera de época de A0 (#273) y de `Core.guardSave` en el camino de escritura de F0.2b. Las dos son precondiciones del plan.
   - **Opción B:** major 2.0 solo para los documentos que usan los campos. Master ya rechaza 2.x sin modificar nada, y comprobé que, si la colección no carga, el editor no la sobrescribe. Pero exige centralizar antes las **19** elevaciones `'1.N.0'` y las **11** comparaciones de minor del código, porque si no una edición normal rebajaría la versión y la validación fallaría.
2. **Tolerancia global** (§4): 1 mm propuesto.

## 6. Residuales honestos, fuera de estos parches

- **Estancia que sigue la curva (regla 7 del contrato).** El polígono de la estancia no se recalcula al curvar un muro. El suelo termina en la cuerda (se ve en `integration/visual/03-curvo-inclinado-3d.webp`) y S3 deja la cara de esa estancia incompleta y nombrada. Requiere decidir si el editor reescribe el polígono con las facetas (S5b) o si superficies y caras se derivan del anillo del núcleo (`roomRing` / `interiorArea`, S3b).
- **Manipulador en pantalla del punto de control (S5).** Las operaciones, el deshacer y el rechazo están hechos y probados. Falta el arrastre visual en el plano, que es interfaz pura sobre `setWallCurve`.
- **Costuras entre facetas en 3D:** se ven líneas verticales leves entre piezas con normales planas. Fusionar las piezas de un mismo muro en una malla con normales suavizadas es pulido de S4.
- **F0.2b:** `Core.guardSave` está listo, pero conectarlo al camino de escritura es de F0.2b (Codex). Requisitos para conectarlo:
  - llamarlo con el documento anterior confirmado y el siguiente;
  - pasar `intent` desde la operación que la produjo (`splitWall` y `setWallCurve` ya lo devuelven);
  - rechazar el guardado si `ok:false`.
- **Firefox y WebKit:** no disponibles en este entorno. Las pruebas de navegador son de Chromium.

## 7. Comparativas visuales (editor real, parches aplicados)

En `integration/visual/` (se reproducen con `capture-visual.cjs`): el mismo ejemplo con el muro inferior del salón recto, curvo y curvo inclinado (2,8 → 2,2 m), con una ventana y una puerta reales, en 2D y 3D.

## 8. Cuando Codex confirme F0.2b

Se presentarán para autorización los seis cortes de §2, en ese orden y como PR draft independientes desde el master vigente. Para S1 se pedirá además D-OP07-4 y la tolerancia. Los parches se regeneran sobre el master de ese momento con `apply-and-test.cjs`. Si algo ha cambiado, se rehacen allí y no se tocan a mano.
