# OP-10 · 06 · Estado de escena y compatibilidad con OP-02

## Regla: no se captura una escena transitoria

`src/capture-browser.cjs` solo captura cuando se cumplen a la vez:

1. **Red quieta:** ninguna petición de recurso (GLB/imagen) en curso.
2. **Ningún recurso en `loading`** según `View3D.assetMetrics` (estados del propio visor: `generic`, `loading`, `ready`, `error`).
3. **Puertas en reposo:** cada puerta en su ángulo objetivo (`View3D.walkDoors`).
4. **Firma idéntica durante 30 fotogramas:** UUID de malla y de geometría, matriz de mundo e instancias de todas las mallas visibles.
5. Render no suspendido.

Si no se alcanza en 120 s, **se rechaza** la captura («Scene did not stabilise…»). El sondeo usa `requestAnimationFrame` temporal y no dibuja: no hay segundo bucle de render y termina con la captura.

## Pruebas [E]

| Transición | Medida (`tests/stability.browser.cjs`, F4) | Resultado |
|---|---|---|
| Entrada en 3D (crecimiento) | La firma cambia en 3 fotogramas; último cambio en el fotograma 6 | Detectada; la ventana de 30 fotogramas la cubre |
| «Ver todas» las plantas (reconstrucción) | Cambio en el fotograma 1 | Detectada |
| Reposo | 0 cambios en 120 fotogramas | Estable |
| Carga asíncrona: GLB del banco de catálogo retrasado 6 s (F3) | La captura esperó 6.063 ms (2.285 ms sin retraso), banco `ready` | **Mismos bytes** que la captura sin retraso: no se exportó el sustituto provisional |
| Cutaways y secciones de presentación | Excluidos por política (`presentationSection`, `sectionCap`, `presentationOutline`) y contados | Declarado |
| Cambio de planta | Vista activa (1 planta) y apilada (2 plantas) son capturas distintas con su `scope` | Ver fidelidad F4 |

Las animaciones de puertas no aparecen en los fixtures en reposo (todas asentadas); la regla las cubre por `walkDoors`. No se ha forzado una puerta en movimiento [V].

## OP-02 (render bajo demanda) · ensayo separado

Sin modificar la rama de Codex: `git worktree add --detach` de `codex/sculpt-op02-render-demand@edfbf66b`, servida con `OP10_APP_ROOT`, worktree eliminado al terminar.

| Fixture | Escena capturada | Estabilización |
|---|---|---|
| F3 | **Bytes idénticos** a master | 0,67 s (master 2,3 s) |
| F1 | **Bytes idénticos** a master | 0,68 s |

Con OP-02 la escena queda en reposo sin redibujar, así que la firma se estabiliza antes. La regla funciona porque se apoya en el estado de la escena, no en que haya fotogramas dibujados. Compatibilidad acreditada para estos dos fixtures. Las transiciones bajo OP-02 no se han medido [V].
