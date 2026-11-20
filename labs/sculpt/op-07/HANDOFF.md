# OP-07 · HANDOFF para continuar en otra sesión (20/11/2026, serie v4: 12 parches sobre `adb86034`)

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

## Bloque 4b · S7 guardado protegido en F0.2b (parche 0010) — 20/11/2026
- **Capacidad:** ninguna escritura confirma la pérdida no pedida de una curva, una pendiente, un muro con forma o un hueco suyo, ni un documento 2.0 escrito por quien no conoce esos rasgos.
- **Área:** persistencia del editor (F0.2b).
- **Tipo:** automática. Solo es visible al rechazar: aviso del editor y estado «Guardado local» en error, con la causa, el estado de los datos («Lo guardado no ha cambiado y tu cambio sigue en esta pestaña») y el siguiente paso («Deshazlo (Ctrl+Z) o usa Forma del muro»). No añade controles.
- **Reutiliza:** `Core.guardSave` (el núcleo con `WALL_PATH`), la sesión F0.2b, su cola y su estado, el `notify` existente y el historial del editor. No hay una segunda persistencia.
- **Diseño:**
  - `persistence-store`: puerta opcional `{check, committed}` evaluada antes del `commit`, en la misma cola. Si rechaza, no se escribe nada y el lote sigue pendiente (sin divergencia). Mantiene una copia confirmada propia y la recuperación (`adoptConflict`) pasa por la misma puerta.
  - `persistence-editor`: la intención es de cada paso (`Core.editIntent`), se compone desde la última revisión confirmada (`Core.composeIntent`) y se descarta al confirmarse.
  - `index.html`: `stepIntent` por paso sustituye al global `lastEditIntent`. `commit`, deshacer y rehacer anotan su paso.
- **Decisión de alcance (para validar por Codex/ChatGPT):** `detectLoss` rechazaba cualquier muro desaparecido sin intención, y eso habría bloqueado borrados v1 normales. `Core.saveGate` aplica pérdida y reglas solo a muros con curva o pendiente y a sus huecos, con el mismo alcance que `validate()`. Un documento v1 nunca se rechaza aquí.
- **Pruebas:**
  - 7 puras (`tests/op07-s7-save-gate.test.cjs`).
  - 1 de navegador con F0.2b real (`tests/op07-s7-persistence.browser.test.cjs`, registrada en `regression-partitions.json`): rechazo atómico (misma revisión, autoridad curva, cambio en la pestaña, estado y aviso), deshacer, dividir, deshacer y rehacer, copia de emergencia y reapertura del 2.0.
  - Lector antiguo: `integration/s7-legacy-reader.cjs` con master `bf131c30`, que rechaza el 2.0, no arranca y deja la colección byte a byte igual.
- **Suites:** pura completa 1587 (1584 ok, 0 fallos, el resto omitidas). Navegador (persistencia, edificios, OP-07 ×5, UX-03, K4, presupuesto): 42/42 en Chromium. `apply-and-test.cjs`: todas las pruebas de OP-07.
- **Límites:**
  - Una recuperación de conflicto (`adoptConflict`) es una restauración: su diff entero se da por intencionado. Un RUBIK v1 no puede producir un 2.0 degradado porque no lo carga.
  - Firefox y WebKit no están probados aquí.
- **Estado:** DESARROLLADO y VALIDADO (Chromium). Para INTEGRADO y CONECTADO falta la cirugía de Codex sobre F0.2b con autorización.

## Bloque 5 · DXF — 20/11/2026
- **Paso de CI G-02 con la serie aplicada:**
  - `tests/g02-dxf.test.cjs` 6/6.
  - `tests/g02-dxf-cad.py` con **ezdxf 1.4.4** (la versión fijada en CI): AC1021, mm, auditoría 0 errores y 0 reparaciones.
  - El DXF del ejemplo v1 es **idéntico byte a byte** al de master `bf131c30` (`cmp`).
- **Muro curvo e inclinado (2.0):** `integration/g02-dxf-curved.cjs` genera el DXF del ejemplo con ventana y puerta; `integration/g02-dxf-curved-cad.py` lo lee con ezdxf 1.4.4. Resultado:
  - auditoría 0/0;
  - 94 huellas de 4 vértices cerradas;
  - **área leída 20,1863 m², igual a la del núcleo**;
  - el muro curvo son 25 facetas que cubren exactamente grueso × trayectoria (5553,2 mm);
  - puertas y ventanas presentes.
  - Se mide por área porque una faceta (unos 222 mm) puede ser más corta que el grueso (240 mm) y el eje por lados cortos sería ambiguo.
- **Honestidad:** es un lector independiente, **no** la aceptación en dos CAD comerciales. Esa aceptación (arquitecto: AutoCAD/BricsCAD o equivalente, con unidades, cotas, huecos y longitudes) sigue PENDIENTE y no se atribuye a la relectura con `plan-intake` ni a ezdxf.
- **Fallo previo, no de OP-07:** «G-02 downloads only the active building level» también falla en master `bf131c30`, con la misma aserción: `file.name.endsWith(level.name+'.dxf')`, el nombre del archivo descargado. Es un corte separado, si se autoriza.

## Bloque 6 · Blender (OP-10 candidata `6d3e5260`, intacta): `scene-fidelity` con el núcleo y escenario `f7-curved` — 20/11/2026
- **Rama de laboratorio** `claude/op07-blender-v3@972ac0b9`: `6d3e5260` fusionada con la serie v3. El único conflicto era `index.html`: los scripts de OP-10 pasan dentro del `<template>` del editor de F0.2b.
- **Delta independiente** (`labs/sculpt/op-07/blender/0001-…patch`, un commit):
  - `scripts/interop/scene-fidelity.cjs`:
    - los muros con forma se miden con `js/wall-geometry-core.js` y `Core.WALL_PATH`: grosor y centrado respecto al eje facetado, longitud por trayectoria, altura máxima, altura en cada extremo, ningún vértice por encima de la línea inclinada y base;
    - el rayo del hueco y la identidad de sus mallas siguen la trayectoria y la normal de **su** faceta;
    - el suelo esperado es `Core.roomRing`.
    - Los muros rectos sin pendiente siguen el camino anterior.
  - `tests/fixtures/scene-blender/build.cjs` y `scene-run.cjs`: escenario **f7-curved**. Es la vivienda F1 con el muro sur curvado (con puerta) y dividido en dos piezas, y el muro este inclinado de 2,8 a 2,3 m (con ventana), todo con las operaciones reales del núcleo.
- **Defecto REAL encontrado por el comparador y corregido en S2:**
  - En un muro **recto con pendiente**, `openingHost` devolvía el muro entero. La ventana y la puerta se construían (en el plano y en 3D) con la longitud de **todo el muro** desde su offset: mallas de la ventana de unos 4,24 m en vez de 1,2 m.
  - Corrección: `wallRect(host, offset, isCurved ? cuerda : o.widthMm)`.
  - Prueba de regresión nueva en `tests/op07-s2-geometry.test.cjs` (anchura y centro de la ventana y la puerta, y la hoja de la puerta).
- **Resultados con bpy 5.2.1 LTS**, recorrido real A (proyecto) → B (visor) → C (Blender) → reapertura del `.blend`:
  - **f7-curved:** A↔B 49 comprobaciones de contrato, 0 fallos; C↔A 48, 0 fallos; C↔B desviación máxima 0 mm (1273 vértices); 0 mallas sin identificar; C3 = 0; reapertura PASS.
  - **f1–f6:** resúmenes **idénticos** a los de la candidata intacta `6d3e5260` en esta misma máquina (`evidence-f7/candidate-6d3e5260-summary.jsonl` frente a `scene-run-summary.jsonl`). No hay regresión en OP-10.
- **Evidencia:** `labs/sculpt/op-07/blender/evidence-f7/` (fidelity-AB.json, project.json y los resúmenes).
- **Delta acwall de Codex:** no lo he podido cotejar. El conector de GitHub falla en esta sesión (proxy 403) y no hay una rama con ese nombre en el transporte git. Pendiente de que Codex indique la ref.
- **Nota operativa:** las capturas de f2, f5 y f6 ocupan unos 185 MB y llenaron el disco de este contenedor. Se borran después de extraer la evidencia.

## Serie v4 (20/11/2026, tarde) — `claude/op07-serie-v4@3afb9e18`, 12 parches sobre master `adb86034`
- Inventario, seguridad, superficies, GO/NO-GO, plan y rollback en **[INTEGRACION.md](INTEGRACION.md)**: es la fuente única.
- Corregido tras la auditoría de Codex (`2d0cc645`):
  - intenciones por `projectId` (mezclar proyectos lanza un error);
  - revocación al restaurar;
  - **S8**: integrar ≠ activar; «activo» exige A0 y un escritor protegido; puerta también en `localStorage`.
  - Las sondas de Codex son ahora negativos.
- El delta de Blender pasa a ser el parche 0011, sobre OP-10 efectivo: f1–f7 idénticos y f7 sin fallos.
- **Pendiente:**
  1. Codex: Firefox/WebKit/dispositivos de la v4 y la traza del residual del manipulador en Windows (no reproducido aquí; mi hipótesis se revirtió por no estar demostrada).
  2. A0: las 12 trazas no identifican causa (§5). Sigue congelado.
  3. Aceptación visual y CAD.
  4. OP-05: solo el diagnóstico, después de este cierre.

## A0
`claude/a0-writer-fence@112eaf52` pendiente de Firefox/WebKit por Codex (#273). No propagar a #274–#279.

## Reglas
Codex integra; sin PR productivas, sin master, sin migraciones; cirugía condicionada a F0.2b, aceptación visual y autorización.
