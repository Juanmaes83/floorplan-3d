# Ficha de cirugía pendiente — recuperación del 3D en el editor (`index.html`, reservado)

**Estado:** propuesta. **No aplicada**: `index.html` está reservado y esta PR no lo toca.

## Lo que hay hoy (leído, no modificado)

| Lugar | Comportamiento |
|---|---|
| `index.html` ~L2589 (`webglcontextlost`) | `preventDefault`, `contextLost=true`, `abort3D()` y evento `floorplan-3d-context-lost`. |
| `index.html` ~L2294 (listener del evento) | Vuelve a 2D, cierra la Presentación y avisa: «recarga la página para intentar abrir 3D de nuevo». |
| `index.html` ~L4328 (`glLost()`) | El bucle no pinta mientras el contexto está perdido. |
| `tests/presentation.browser.test.cjs` (R2 P11) | Ya prueba la caída segura a 2D en 4 tamaños. |

**Límite:**
- `contextLost` nunca vuelve a `false`. Aunque el navegador devuelva el contexto (`webglcontextrestored`), el 3D no se puede reabrir sin recargar la página.
- No hay degradación ante pérdidas repetidas.
- No hay DPR adaptativo: el DPR es fijo, `min(devicePixelRatio, 2)`.

## Cirugía propuesta (para quien integre)

1. **Recuperación.** Añadir `renderer.domElement.addEventListener('webglcontextrestored', …)` y en él:
   - poner `contextLost=false`;
   - poner `sigArch=sigFurn=sigLabels=''`, para que la siguiente entrada en 3D lo reconstruya todo;
   - avisar «La vista 3D vuelve a estar disponible».

   No hay que reentrar en 3D automáticamente: el usuario ya está en 2D y decide él.
2. **Pérdidas repetidas.** Reutilizar `createContextMonitor()` de `js/gl-quality-core.js`, que es el mismo núcleo que esta PR usa en la Evolución. Con `degrade=true`, aplicar `renderer.setPixelRatio(1)`, `renderer.shadowMap.enabled=false` y `needsUpdate` en los materiales, y mostrar un aviso.
3. **DPR adaptativo.**
   - En `loop()`, alimentar `createGovernor({deviceRatio:devicePixelRatio}).sample(dt)` solo cuando `!renderSuspended && !glLost()` y el tamaño lo gobierne el editor.
   - Ceder el control durante `shot()` y `deliveryShot()`, que ya fijan `setPixelRatio(1)` y restauran `prevRatio`.
   - Reaplicar el nivel después.
4. **Pruebas que añadir:**
   - en R2 P11, `restoreContext()` y volver a entrar en 3D con la escena dibujada;
   - dos pérdidas seguidas, con DPR 1 y sin sombras;
   - DPR 2 con presupuesto forzado, con descenso por escalones.

**Riesgo:**
- `abort3D()` libera el renderer territorial y otros recursos; reabrir debe recrearlos. La Presentación y el modo paseo ya tienen su propio camino de entrada.
- Toca el núcleo del editor, así que necesita la regresión completa de Presentación (R2), Territorio y Entrega.
