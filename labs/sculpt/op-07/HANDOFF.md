# OP-07 · HANDOFF para continuar en otra sesión (20/11/2026)

## Estado
Serie de **9 parches** en `labs/sculpt/op-07/patches/` (orden numérico), generada desde la rama LOCAL `op07-v2`
(`04b8e6f2`) sobre master `02712b51`. Verificar: `node labs/sculpt/op-07/integration/apply-and-test.cjs [--browser] [--full]`.
Suite pura con la serie aplicada: **1501/1501**. Navegador OP-07 (S4, S4b, S5, S5b): **8/8** en Chromium.

| # | Corte | Hecho |
|---|---|---|
| 1 | S1 Contrato **2.0** (D-OP07-4 opción B) | v2 solo para documentos con `curve`/`heightEndMm`; autoridad única `Core.parseVersion/versionAtLeast/raiseVersion` (14 sitios migrados, prueba que impide nuevos); v1 intacto; `building-core` acepta 2.0.0; centinelas de pruebas viejas 2.0→3.0 |
| 2 | S2 Plano | piezas por faceta (tolerancia 1 mm, 1024 facetas aprobadas, `Core.WALL_PATH`) |
| 3 | S3 Mediciones | caras izquierda/derecha, mochetas, trapecios; v1 byte a byte |
| 4 | S6 DXF | huella por faceta legible por plan-intake; DXF v1 byte a byte |
| 5 | S4 3D | piezas con pendiente |
| 6 | S5 Edición | `setWallCurve/setWallEndHeight/splitWall` atómicas |
| 7 | **S3b** Estancias | `Core.roomRing`: anillo canónico (polígono + cara facetada del muro curvo). Suelo, perímetro, caras, plano, 3D y presupuesto desde el anillo; contrastado con `interiorArea` del núcleo; cóncavo/convexo, ambos lados, UX-03 |
| 8 | **S5b** Edición visual | punto de curvatura en el plano (un arrastre = 1 historial + 1 escritura), panel «Forma del muro» (flecha, altura final, enderezar, nivelar, dividir), pruebas con ratón/teclado reales |
| 9 | **S4b** 3D | juntas compartidas (`Core.jointAt`) → malla estanca (diferencia 0), normales suaves solo en caras curvas, sin caras internas, dinteles/antepechos por faceta, rodapié y aristas de Recorrer; OP-02: 0 fotogramas en reposo; reconstrucción ~+5 % |

Antes de S4b había 4,28 mm de costura por junta; ahora 0.

## Bloque 1 · Serie rebasada sobre master `bf131c30` (SMART: K4, K9, UX-03, AST-01, K13) — 20/11/2026
- Fuente: rama `claude/op07-serie-v3` (la anterior, `claude/op07-serie-local@04b8e6f2` sobre `02712b51`, se conserva intacta como referencia verificada).
- S1 dejó de aplicarse sobre el master nuevo. Hubo tres conflictos y una regresión latente:
  - **K4** (`index.html`, panel de estancia) añadió 3 elevaciones manuales `'1.6.0'`. Ahora pasan por `Core.raiseVersion`.
  - **UX-03** (CSS y `bindWallPanel`): se conserva entero y S5b añade `bindWallShape(id)`.
  - **RoomPlan** (`js/scan-alignment.js:117`, nuevo en master) comparaba solo la minor. Con un destino 2.0 y un escaneo 1.x **habría rebajado** el documento a 1.x, y la validación lo habría rechazado. Ahora usa `C.raiseVersion(next, scan.schemaVersion)`. La prueba de guarda de S1 lo detectaba.
  - `tests/browser.test.cjs` usaba `2.0.0` como versión mayor desconocida. Pasa a `3.0.0` con la misma garantía (rechazo atómico) y sin relajar ninguna aserción. Antes no se ejecutaba porque faltaba `CHROME`.
- Resultados:
  - Suite «pura» (con `CHROME`): master 1525/1527 (0 fallos, 2 omitidas); con la serie 1572 pruebas, 0 fallos.
  - `apply-and-test.cjs`: 45/45.
  - Navegador, OP-07 junto con K4, UX-03 y AST-01: 17/17 en Chromium.
- A0 · WebKit: este contenedor no tiene WebKit ni Firefox (solo Chromium). La reproducción del residual ResizeObserver es de Codex, con la instrumentación de `labs/sculpt/op-07/a0/` (bloque 2).

## Bloque 3 · `roomRing` tras dividir un muro curvo: defecto CONFIRMADO y corregido en S3b — 20/11/2026
- **Reproducción:** caja de dos estancias con el muro central curvado y dividido por la mitad.
  - Antes de dividir el suelo medía 27,07 m² y 20,39 m². Tras dividir medía **23,80 / 23,80 m²**, el rectángulo de la cuerda, sin que nadie cambiara la geometría.
  - El presupuesto también volvía a la cuerda. Las caras de pared quedaban «pendientes».
  - Pasaba igual con la curva convexa y con la cóncava.
- **Causa:** `roomRing` contrastaba la arista guardada con la cuerda de cada muro curvo por separado. Las cuerdas de las piezas son diagonales y la arista dibujada contra la cuerda original no coincide con ninguna.
- **Corrección** (solo `roomRing` en `js/project-core.js`, sin una segunda geometría):
  - Las unidades son cadenas de muros curvos unidos por sus extremos y del mismo grueso, en cualquier orientación. Primero se prueban los muros sueltos, así que nada cambia si no hay una división.
  - La cara es `offsetMiter` del eje concatenado del núcleo. Cada faceta se atribuye a su muro, con su índice propio, y `curvedRoomFace` la consume igual que antes.
- **Pruebas** (`tests/op07-s3b-split.test.cjs`, 7):
  - convexo y cóncavo, con estancias a los dos lados;
  - la regresión de los 23,80 m²;
  - huecos en cada pieza con pendiente, y tres piezas (dos juntas);
  - una pieza invertida;
  - presupuesto y superficie con una sola cifra;
  - atomicidad, deshacer y rehacer;
  - negativos: una estancia redibujada contra una pieza sigue solo esa pieza; con gruesos distintos no hay cadena y la cara queda pendiente y nombrada; un v1 sigue con el mismo polígono.
- **Resultado:** suelo ±0,0002 m² y perímetro ±5 mm.
  - Las caras difieren, como mucho, en la **cuña de cada junta** (t/2·θ, < 1 cm). Es la convención por muro de D-OP07-2, en la que cada pieza termina perpendicular a su última faceta.
  - Una cara gana lo que pierde la otra y la suma sigue siendo 2 × eje. No es un defecto del anillo y no se ha cambiado.
- Pruebas puras de OP-07 + UX-03 + K4: 59/59. Navegador OP-07 + UX-03 + K4: 13/13. `apply-and-test.cjs`: 52/52.
- **Regla de integración (A4):**
  - Capacidad interna (cálculo del anillo).
  - Consumidores reales: suelo de Q.room/Surface.level (plano y suelo 3D), perímetro, caras del panel «Paredes de la estancia» (UX-03) y la línea de suelo del presupuesto.
  - Recorrido: dibujar y curvar un muro → panel «Forma del muro» → Dividir. El panel de la estancia mantiene sus cifras. Estado: DESARROLLADO y VALIDADO.

## Bloque 4a · `guardSave` con la política de trayectoria (`WALL_PATH`) — 20/11/2026
- **Defecto confirmado:** `guardSave` validaba las aberturas con 16 facetas y `validate()` lo hace con 1 mm. Una ventana que termina entre 6884 mm (16 facetas) y 6886,3 mm (1 mm) se aceptaba en `validate` y **se rechazaba al guardar**: un proyecto válido no se podía guardar.
- **Corrección (S1):**
  - `Walls.guardSave({…, opts})` pasa `opts` a `validateOpening`.
  - `Core.guardSave` le da `WALL_PATH`.
  - Es el **único delta** sobre el núcleo del laboratorio. La prueba de huella deshace ese delta declarado y sigue exigiendo la huella ORIGINAL (`14c8a601…`, y `9ba83648…` en la etapa S1). La aserción no se relaja.
- **Prueba negativa nueva (S1):** guardSave acepta lo que acepta validate y sigue rechazando la abertura que de verdad se sale del muro.
- `quantity-core.js:141` también llama `validateOpening(w,o)` sin `opts`, pero solo en muros **rectos** con pendiente, cuya trayectoria es la cuerda y no depende de las facetas. No hay defecto.

## Pendiente (en este orden)
1. **Blender (OP-10 candidata `claude/compassionate-galileo-mlgigy@6d3e5260`, congelada, NO modificar).**
   Trabajo en rama local `op07-blender-lab` (worktree `/home/user/op07b`) = 6d3e5260 + `op07-v2`, fusión limpia.
   Delta pendiente en `scripts/interop/scene-fidelity.cjs`: para muros con forma usar `js/wall-geometry-core.js`
   (grosor/longitud por faceta, altura = máx(heightMm, heightEndMm) y por extremos, rayo del hueco por la normal de la
   faceta), y suelo esperado = `Core.roomRing(...).points`. Añadir escenario `f7-curved` a
   `tests/fixtures/scene-blender/build.cjs` y `scene-run.cjs`. `bpy==5.2.1` se instalaba en `/tmp/claude-0/bpyenv`
   (puede no existir en la nueva sesión: `python3 -m venv V && V/bin/pip install bpy==5.2.1`). Entregar el delta como
   parche en `labs/sculpt/op-07/blender/`.
2. **Persistencia (S7):** conectar `Core.guardSave(prev confirmado, siguiente, intent)` al camino de escritura F0.2b
   (`js/persistence-editor.js`) en copia aislada; `FloorPlanApp.lastEditIntent` ya lo rellenan S5b. Probar: lector v1
   (master) no sobrescribe un 2.0, importación, reapertura, deshacer, recuperación, edificios, exportación.
3. **DXF:** unidades/huecos/longitud/relectura ya probados (S6); falta validación CAD externa (`tests/g02-dxf-cad.py`)
   y documentar el fallo preexistente «G-02 downloads only the active building level» (falla en master sin OP-07).
4. Previews actualizadas (`integration/capture-visual.cjs`), actualizar `INTEGRACION.md` con S3b/S4b/S5b, push.

## A0
`claude/a0-writer-fence@112eaf52` pendiente de Firefox/WebKit por Codex (#273). No propagar a #274–#279.

## Reglas
Codex integra; sin PR productivas, sin master, sin migraciones; cirugía condicionada a F0.2b, aceptación visual y autorización.
