# Evidencia agrupada de continuidad · 20/11/2026

Base operativa de RUBIK: `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `dec6d20694e083cb615f42eae60bb74fd3209523`. Los resultados acreditados conservan su entorno.

## Seguridad · A0 real + S8

La composición local parte de [OP‑07 v4](https://github.com/Juanmaes83/floorplan-3d/commit/3afb9e18c84d6d640eeced7203a4169aebb367d6) y [A0 #273](https://github.com/Juanmaes83/floorplan-3d/pull/273) en `112eaf520157fb3f25a227b3c25fc48041220019`. El parche adjunto produce el árbol `b16a0067e802991faebe40bfc6e0df7e6aeea567`. A0 envuelve S8 en el origen normal. En F0.2b se conserva la barrera de época en la transacción junto al gate geométrico. Chromium pasó 7/7 comprobaciones dirigidas con A0 real y el manifiesto conserva 173 archivos cubiertos. #273–#279 continúan congeladas. OP‑07 espera el nuevo SHA de CC2 para validar el delta de vigencia de intenciones. [Parche](op07-a0-composition.patch.gz) · [TAP](op07-a0-composition-smoke.tap)

## Simulator D · QA de captura

Rama publicada `codex/simulator-d-qa`, [commit exacto](https://github.com/Juanmaes83/floorplan-3d/commit/eae7d5f366ba7e24de9e04d38addd216a70a3d76) `eae7d5f366ba7e24de9e04d38addd216a70a3d76`, padre único `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `c5735a4b81cdb346d3186c3ceeef251bfcd2ef0d`.

WebKit 26.6 Linux / Playwright 1.63. Preflight WebGL2 comprobó los píxeles del framebuffer y de la captura. El ensayo previo comparó base y candidato con 21 lecturas del framebuffer por lado y cuatro poses distintas. Las cuatro capturas del lienzo tuvieron contenido y coincidieron byte a byte por instante entre árboles. El aviso de ResizeObserver apareció en ambos árboles en ejecuciones distintas, incluido el arranque del candidato. [Preflight](webkit-linux-preflight.json) · [Primer fallo en la base](simulator-d-webkit-linux-attempt-1.json) · [Comparación original](simulator-d-webkit-linux-comparison.json)

Los seis arranques con el trazador de CC2 y los ocho arranques del contraste siguiente terminaron sin ese aviso. El último contraste hizo tres arranques instrumentados y un control sin sonda por árbol. La sonda usa entradas de ResizeObserver y mutaciones de atributos, sin lecturas síncronas de geometría. [Resumen de las primeras trazas](ro-resumen.json) · [Resultado con instrumentación ligera](ro-light-result.json) · [Sonda](ro-light.init.js.txt) · [Arnés](ro-light.cjs.txt)

La nueva comparación completa, sin sonda, pasó todas las aserciones en WebKit Linux. Cada árbol produjo cuatro poses en movimiento y cuatro capturas con contenido. Los cuatro PNG del lienzo coincidieron por instante, hubo 21 lecturas de framebuffer por árbol y no hubo errores de página ni peticiones externas. Ambos visores volvieron a reposo. [Informe del nuevo contraste](simulator-d-webkit-linux-revalidation.json) · [Arnés compartido](simulator-d-webkit-linux-comparison.cjs.txt) · [Captura visible de base](d-linux-base-visible-comparison.png) · [Captura visible del candidato](d-linux-candidate-visible-comparison.png)

La causa del aviso permanece abierta. Mantener el gate de errores de página y las aserciones de movimiento, lectura, contenido y equivalencia, con el alcance declarado en `EQUIVALENCIA.md`.

## Cierre CC1 y cortes independientes

La [ficha ampliada del inventario](../../INVENTARIO-SIMULATOR-C-A-D.md) conserva los objetos de A y C‑bis y la evidencia del [cierre CC1](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/HANDOFF-SIMULATOR.md), árbol `3ca58d263fcc09f58a063c5da76318c2147c74e1`.

A está publicado en `codex/simulator-a-evolucion`, [commit exacto](https://github.com/Juanmaes83/floorplan-3d/commit/1ba63cd038b1c781519ecaeba2f0ca2e30746cf6) `1ba63cd038b1c781519ecaeba2f0ca2e30746cf6`, árbol `43152470cb9db02dbbcbba276dfaf6be800c4564`, padre único `8e917e1a70f499a6b8dc68850c8413b7d06c5682`. Su integración es independiente de activar OP‑07. Cuando exista geometría con forma, el código conserva el sólido y omite la fábrica ilustrativa. Antes de fusionar siguen aplicando los gates residuales y la aceptación visual.

## OP‑04 UX · #271

HEAD `60116e8bed31146dd764fd04937165d91be833e8`, árbol `ab11ff5929e526f2c57d943a09ec5b47d4c97aa1`, padres `b052387b86646a3a2ebe9d9f087d44b1f077a2bb` y `8e917e1a70f499a6b8dc68850c8413b7d06c5682`. Conserva los cinco commits originales. En `guide-core.js` se combinaron los alias de unión y Plantas en chino. Los cambios concurrentes en `index.html` y `guide-ui.js` se reconciliaron sin conflicto. Pasaron 21 pruebas dirigidas en Chromium y Node. El objeto de fusión remoto verifica el mismo árbol. Se conserva la aceptación parcial del propietario. Quedan la CI del nuevo SHA, la aceptación UX residual en la Preview exacta y la autorización de fusión. [TAP](op04-ux-271.tap) · [#271](https://github.com/Juanmaes83/floorplan-3d/pull/271) · [Preview exacta](https://floorplan-3d-c3venlbyu-juanma-espinosas-projects.vercel.app/)

## Coordinación OP‑11

El propietario y ChatGPT ejecutan SOURCE de OP‑11. Codex conserva la responsabilidad de integración y consulta el [mandato y matriz de cortes](https://github.com/Juanmaes83/floorplan-3d/tree/16d9cecb145957a07577de4ec112cae9b7c93ee8/docs/sculpt/op05-op11) solo como referencia. Ningún cambio operativo de OP‑11 forma parte de este lote. El piloto se documenta por origen, licencia, hashes y alcance. La evidencia de OP‑05 conserva su alcance propio.
