# F0, OP-03 y OP-02 · Revisión de consolidación del 18/11/2026

Base efectiva comprobada `master@163df68e83a80ddf11a008d573ee257d51c1821f`. La simulación de compatibilidad ya acreditada sigue correspondiendo a estos SHA. Se reutiliza la evidencia enlazada y se conserva la secuencia F0 → OP-03 → OP-02. [Simulación de árboles y cadena previa](https://github.com/Juanmaes83/floorplan-3d/blob/50a4bab0026d08e8c30f4c18b3dca86448973c31/labs/sculpt/op-02/README.md#cadena-f0) · [Compatibilidad con OP-02](https://github.com/Juanmaes83/floorplan-3d/blob/d27baca152e62abd5e54e89058f36d39141498f9/labs/sculpt/op-02/README.md).

| Corte | HEAD | Estado observado |
|---|---|---|
| [#262 · F0.1](https://github.com/Juanmaes83/floorplan-3d/pull/262/checks) | `69ae552` | 26 checks correctos y 1 omisión. Primer borrador de la cadena. |
| [#263 · F0.2a](https://github.com/Juanmaes83/floorplan-3d/pull/263/checks) | `6be42e5` | 25 checks correctos y 1 omisión. Base #262. |
| [#264 · F0.3](https://github.com/Juanmaes83/floorplan-3d/pull/264/checks) | `748e43d` | 24 checks correctos y 1 omisión. Base #263. |
| [#265 · OP-03 / G-02](https://github.com/Juanmaes83/floorplan-3d/pull/265/checks) | `b9f4b3c` | Suite DXF y auditoría CAD acreditadas. CI general en curso al registrar esta revisión. |
| [#266 · OP-02](https://github.com/Juanmaes83/floorplan-3d/pull/266/checks) | `d27baca` | Preview lista para revisión humana. El workflow propio tiene un timeout y la CI general sigue en curso al registrar esta revisión. |

## #266 · Comprobación dirigida del fallo

El job de GitHub Actions dio **3/4**. Agotó 30 segundos en `tests/op02-render-demand.browser.test.cjs:41` al esperar el reposo inmediatamente después del arrastre orbital. El mismo fallo volvió a ocurrir en GitHub Actions al ejecutar solo ese caso y usar el mismo HEAD, runner y herramientas. [Job original](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44385562732/job/135089035644) · [Reproducción aislada](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44388944968/job/135101007284).

Se ejecutó únicamente el caso afectado sobre `d27baca152e62abd5e54e89058f36d39141498f9`. Pasó **1/1 en Windows** (32,04 s) y **1/1 en Docker Linux sin red** (34,67 s de prueba completa). Linux usó Node 22.13.0, Playwright 1.62.1, Chromium 1234 y SwiftShader. El código se montó en solo lectura. La prueba sí acreditó cambio de cámara y ausencia de nuevos renders tras el reposo, además de luz, maqueta blanca, puertas y suspensión. El resultado complementa el check original de GitHub, cuyo estado sigue siendo fallo. Los benchmarks y las tres pruebas ya aprobadas en ese job se reutilizaron.

```text
node --test --test-name-pattern="OP-02 sleeps after orbit" tests/op02-render-demand.browser.test.cjs
```

La ejecución instrumentada amplió la observación a 75 s en una copia temporal de la prueba. A los 30 s acumuló 31 renders y a los 75 s, 78. En todas las muestras quedaba un frame pendiente, la cámara seguía desplazándose cada vez menos y no había animación, vuelo ni recursos pendientes. La traza apunta a amortiguación de órbita por frame, a aproximadamente 1 FPS en ese runner. `master` y #266 comparten `OrbitControls`, con factor `0.05` por actualización, y llaman a `orbit.update()` una vez por frame de órbita. La inspección de `master` explica el mecanismo compartido. La captura instrumentada se hizo sobre el HEAD de #266. No llegó a observarse el reposo en ese perfil, así que elevar el timeout a 75 s tampoco cierra el check. [Traza de GitHub Actions](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44389372598/job/135102509264).

**GO para revisión humana, integración en HOLD.** Revisar en la Preview el despertar y reposo del visor, en especial tras orbitar y entrar o salir del paseo. Para cerrar CI, queda por decidir si el perfil sintético de navegador debe controlar el coste de cada frame o si se abre un corte de comportamiento para amortiguar por tiempo también en hardware lento. Este último cambia la respuesta de cámara y requiere validación dirigida de navegación. Los checks generales se revisarán sobre el SHA efectivo. [Preview protegida de #266](https://vercel.com/juanma-espinosas-projects/floorplan-3d/C1kYM9Wry6Mcpxjr5yMeGLwXgrfz) · [Comparativa ya acreditada](https://github.com/Juanmaes83/floorplan-3d/blob/d27baca152e62abd5e54e89058f36d39141498f9/labs/sculpt/op-02/README.md).
