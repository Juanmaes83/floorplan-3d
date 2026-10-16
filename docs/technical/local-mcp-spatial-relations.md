# MCP local — relaciones espaciales por estancia (primer corte de Etapa 1)

Base de trabajo: `master` `3fdbc0f34db9b545e5a2d4b037a66bcf841e23e4`. Este corte conserva `FloorPlanProjectV1`, el editor y el JSON exportado. El servidor sigue leyendo únicamente el archivo seleccionado al arrancar.

## Reproducción previa

Con `docs/contracts/examples/floorplan-project-v1.example.json`, `list_project_elements({roomId:"rom_living"})` devuelve respectivamente **0 rooms, 0 walls, 0 openings y 2 objects**. El filtro actual compara solo `item.roomId`; el contrato guarda ese campo opcionalmente en muebles, nunca en estancias, muros o huecos. En `Core.initial()`, `rom_master` tiene 0 de 46 muebles con `roomId` guardado y ningún muro/hueco con ese campo. Esta es una carencia de asociación derivada, no evidencia de que los elementos estén fuera de la estancia.

## Semántica de la respuesta

Las consultas existentes conservan argumentos, paginación, búsqueda y campos anteriores. Cada elemento público añade `relation`, con `roomIds` **derivados de geometría**, `status`, `method` y evidencia breve por estancia en mm/mm². `storedRoomId` aparece solo si el mueble lo trae en el JSON y no sustituye la relación calculada. No se devuelven imágenes, rutas ni el documento completo.

- `unique`: una sola estancia queda sustentada por geometría suficiente.
- `shared`: un muro o hueco toca tramos de al menos dos estancias; ambas aparecen en `roomIds`.
- `ambiguous`: la huella del mueble cruza varias estancias, queda parcialmente fuera, solo toca un límite o contradice su `roomId` almacenado. `roomIds` contiene candidatos geométricos, no una elección forzada.
- `unattributed`: ninguna estancia queda sustentada. `roomIds` vacío; un `roomId` guardado no convierte por sí solo el caso en atribución geométrica.

`roomId` filtra las estancias por su propio ID. Para muebles, muros y huecos incluye cualquier elemento cuyo `relation.roomIds` derivado contenga el ID pedido, incluso compartidos o ambiguos; un elemento compartido aparece en las páginas de ambas estancias con el mismo ID original. Un ID inexistente da una página vacía. Búsqueda textual y `roomId` se combinan antes de `offset`/`limit`; `total` cuenta los elementos filtrados. `get_project_element` presenta la misma relación sin añadir una herramienta nueva.

## Reglas geométricas

El contrato usa milímetros en planta, x a la derecha, y hacia abajo y giro horario. Los polígonos de estancia representan caras interiores; el muro guarda su **eje** y grosor simétrico, y el hueco su subtramo sobre ese eje. Esas piezas son independientes y no forman un grafo topológico persistido.

1. **Mueble:** se calcula la huella rectangular girada desde `position`, `size` y `rotationDeg` con la regla existente de `js/tracing-core.js`. Se triangula el polígono simple de cada estancia para medir intersección de área incluso si es cóncavo. Una sola área positiva que cubra la huella completa permite `unique`; varias áreas positivas o una parte fuera producen `ambiguous`. El mero contacto de borde da candidatos ambiguos, nunca una estancia inequívoca. La comparación de cobertura tolera solo 1 mm² o error numérico relativo `1e-8`; no se adopta un umbral arquitectónico.
2. **Muro:** se usa la banda de `thicknessMm` alrededor del eje, con la misma proyección de `js/project-core.js`. Una estancia se relaciona si su interior corta la banda con área positiva o si un tramo de su cara interior coincide con la banda de forma paralela durante más de 1 mm. Un contacto puntual en una esquina no basta. Así se capturan muros compartidos cuyo eje queda en el hueco entre polígonos de caras interiores. `structure:"exterior"` es una etiqueta guardada; no decide la estancia.
3. **Hueco:** se aplica la regla del muro únicamente al subtramo `[offsetMm, offsetMm + widthMm]` del `wallId` guardado. La relación del muro completo no se copia al hueco, porque un muro largo puede lindar con distintas estancias en tramos distintos. `wallId` prueba el vínculo estructural, no una estancia única.

Las cifras se obtienen de geometría 2D del JSON validado. No certifican pertenencia legal, altura, accesibilidad ni exactitud física de una escala estimada. Polígonos solapados, geometría fuera de todas las estancias y discrepancias con `storedRoomId` quedan visibles como incertidumbre. Los demás objetivos de Etapa 1 —validación diagnóstica, medidas entre elementos y holguras con obstáculos— siguen pendientes.
