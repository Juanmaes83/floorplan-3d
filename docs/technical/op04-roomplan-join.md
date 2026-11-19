# OP-04 · Unión RoomPlan por puertas

## SOURCE, ISOLATE y CLASSIFY

[Escultura archivada y baseline original](https://github.com/Juanmaes83/floorplan-3d/blob/f027be8f0ddb8fca5acfe510a568ea8850b5742b/labs/sculpt/op-04/README.md). Se reutilizan `doorJoin` de `scanAlignment.ts`, el punto interior de `roomNesting.ts` y el remapeo de `roomplanMerge.ts` de `openPlan3D@771c9e1`. [Atribución MIT](../licenses/op04-openplan3d-MIT.txt).

## SCULPT y NORMALIZE

El menú del editor ofrece **Unir escaneo RoomPlan**. Abre un JSON local, aplica el importador RoomPlan existente y pide identificar la misma puerta en la planta abierta y el escaneo. La propuesta conserva una vista previa de ambos grupos y el desfase de ancho. El lado libre se obtiene del polígono canónico de la estancia. El corte exige una sola estancia de anclaje por puerta para evitar elegir lado en un caso ambiguo.

El donante proporciona la rotación rígida y la separación entre ejes igual al grosor medio de ambos muros. Se transforma el escaneo completo como un conjunto con un único sistema de coordenadas. Se conserva el orden de extremos, los offsets de huecos, las relaciones de materiales y estancias, las poses de objetos canónicos y los extremos de medición. Los identificadores en colisión se remapean y el proyecto abierto conserva su identidad. La confirmación usa el historial y el guardado del editor, con un solo paso de deshacer y rehacer. La procedencia se guarda en `x-op04-roomplan` sin el nombre del archivo ni el JSON original.

La aplicación exige una planta de destino con escala estimada sin calibración o verificación. Las demás pueden mostrar la propuesta con la confirmación deshabilitada. Los archivos con varias plantas deben exportarse por planta. La interfaz avisa sobre objetos detectados y huecos que el conversor existente deja fuera. Los dos muros de las puertas se preservan como registros separados. La unión geométrica mantiene escala unitaria y su resultado sigue siendo estimado.

## TEST y PREVIEW

El banco del donante sigue vinculado al SHA archivado. Las pruebas de RUBIK cubren puntos y referencias, giro del escaneo, colisiones, geometría ambigua, escala pendiente y calibración verificada. El ensayo de Chromium usa JSON sintético con el flujo de importación real. Comprueba que vista previa y cancelación conservan el proyecto, que la confirmación conserva la entrada de biblioteca y que deshacer, rehacer y reabrir restituyen exactamente los estados esperados.

```text
node --test tests/scan-alignment.test.cjs
node --test --test-name-pattern="OP-04 previews" tests/upload.browser.test.cjs
```

Los checks del candidato usan el workflow de importación multiformato. La validación de esta entrega usa geometría sintética. La unión sintética fue aceptada visualmente: 11,31 → 22,62 m², puertas de 900 mm y diferencia de ancho de 0 mm. La validación con capturas reales sigue pendiente. Después de una integración autorizada, revertir su commit retira la acción. Las uniones ya guardadas conservan geometría canónica legible y la extensión de procedencia.

## Residual del asistente guiado

El asistente guiado aún no ofrece ayuda contextual al seleccionar las puertas y revisar la propuesta de unión. Seguimiento independiente de la corrección visual de la previsualización.
