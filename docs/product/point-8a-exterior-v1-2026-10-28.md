# Punto 8A — Exterior V1 — CERRADO

**Implementación:** PR #121  
**HEAD validado de la PR:** `264d4ac399591e80bf8aa05a9296d306468dc2bf`  
**Squash en `master`:** `10872796080a5b731290d45f1a3d6770dd00f7bf`

## Objetivo y autoridad

8A aporta una primera lectura exterior sin crear otro modelo del edificio. La autoridad sigue siendo `FloorPlanProjectV1`: ejes/grosor/altura de `walls`, huecos ligados por `wallId`, polígonos y `family` de `rooms`, y materiales ya asignados. En edificio, cada `FloorPlanBuildingV1.levels[].project` se deriva por separado y el renderer aplica `elevationMm`, `offsetMm` y el marco de la planta activa.

No se infiere soporte estructural ni continuidad de cargas entre huellas diferentes.

## Derivación

`FloorPlanExterior.derive(project)` es pura y no persiste superficies. Para cada muro activo examina tres puntos del eje y la ocupación de estancias interiores a ambos lados, más allá de la mitad del grosor. Una cara ocupada y la otra libre en los tres puntos permite etiquetar fachada; ambas ocupadas indican interior. Sin evidencia consistente devuelve `unavailable`/estado parcial.

Una declaración `partition` o `low` impide promover a fachada un muro por una estancia dibujada de forma incompleta. El fix final de #121 también impide exponer openings de esos muros vetados como huecos de fachada.

Los huecos de fachadas son referencias a los `openings` originales, nunca copias geométricas.

## Materiales, terrazas y presentación

La vista 3D sigue creando sólidos y recortes desde la geometría existente. Un `surfaceMaterialId` existente tiene prioridad; sin asignación, la fachada recibe un acabado visual neutro. `terrace` y `balcony` explícitos mantienen su suelo/material existente y no generan techo, peto ni barandilla inferidos.

No se añadieron campos al schema, migraciones ni cambios de JSON/ZIP.

## Pruebas y cierre

La PR finalizó con:

- 8 tests específicos de 8A;
- suite no-browser: **472 PASS, 0 FAIL, 2 SKIP** opcionales de Blender;
- Chromium sin errores/avisos en la comprobación del exterior;
- Guided, Integrated browser, Multiformat, Solar y Vercel verdes sobre el HEAD final antes del merge.

La clasificación es deliberadamente conservadora y puede quedar parcial cuando los polígonos de estancia no permiten demostrar la cara exterior.

## Límites cerrados

8A no define:

- cubierta;
- petos;
- plataformas independientes no declaradas;
- estructura;
- parcela/terreno;
- proveedores territoriales reales.

8B consume esta clasificación como evidencia, pero añade sus propias comprobaciones de huella antes de afirmar una cubierta. La auditoría final de 8B (#126) reforzó precisamente esa frontera para evitar que un ciclo cerrado de fachada insuficiente se convierta en falsa certeza volumétrica.

8A funciona offline y no depende de Catastro/IGN/CNIG/PNOA.
