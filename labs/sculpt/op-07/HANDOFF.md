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
