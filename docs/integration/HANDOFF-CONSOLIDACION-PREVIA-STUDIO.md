# Handoff de consolidación previa a Studio Presentation E2

## Punto de partida y dictamen

La base de origen es `master@8525025a1470d48d52d8e365070e5a0acf116134`. Production estaba READY sobre ese SHA según la verificación del propietario. La rama candidata es `codex/consolidacion-base`. El SHA que contiene este documento es el SHA a validar. Los resultados de un SHA anterior tienen valor histórico.

**NO-GO para integrar, promover o empezar E2 mientras falte la regresión de este SHA o la validación independiente y autorización del propietario.** La ronda histórica de `d943117` cerró 36/37 workflows correctos. El fallo de CAT-IA V1 permanece en ese resultado. El job programado/manual del observador se omite en PR por diseño. El gate valida el observador y se evalúa junto con las regresiones de producto.

## Orden de integración propuesto

| Orden | PR de origen | SHA exacto | Alcance |
| --- | --- | --- | --- |
| 1 | [#246](https://github.com/Juanmaes83/floorplan-3d/pull/246) | `c7e8702dd0604d2eecc7fbe3bbc655bbb84a5c4d` | Cierre documental, 13 checks correctos al verificarlo. Conserva su handoff y la evidencia original sin editar. |
| 2 | [#248](https://github.com/Juanmaes83/floorplan-3d/pull/248) | `cd53378333a06897f9cba8f22b077751a1cc51e5` | Dibujo vivo. |
| 3 | [#249](https://github.com/Juanmaes83/floorplan-3d/pull/249) | `529015a9b6942e495e6f5353fd32a80ecde2223b` | Carga de cohortes de Asset Lab. |
| 4 | [#247](https://github.com/Juanmaes83/floorplan-3d/pull/247) | `7c8491f6f8cde1a2960e5067590857d41357c646` | CI en observación. Aplicado el diff neto, que incluye el cambio de nombre del handoff compartido originalmente con #246. |

La rama combina estos cambios mediante cherry-picks de documentación y de producto, y un commit que aplica el diff final de CI. Los orígenes siguen abiertos. Leer el [handoff documental de #246](HANDOFF-CODEX-RUBIK-SOTA.md) y el [handoff propio de #247](HANDOFF-CI-OBSERVACION.md). Los cambios de `index.html` de #249 son independientes de la corrección de `js/home-demos.js` de #248. El log histórico de #246 conserva sus bytes originales, incluidas once líneas con espacios finales que reporta `git diff --check`.

## Evidencia dirigida

- **Dibujo vivo.** En local sobre master, al ejecutar fin → Cómo hacerlo → Volver → Volver a ver, el estado al pulsar fue `moving=true, disabled=true, hidden=false, current=overview`. Al asentarse la cámara, el botón estaba habilitado y `story=null`. El clic previo había quedado sin efecto. La corrección espera el control habilitado y visible dentro de los 30 s existentes. La prueba mantiene la transición abierta hasta después del clic, verifica que el motor vuelve a dibujar y conserva las comprobaciones de integridad del proyecto y ausencia de peticiones externas. `node --test tests/home-demos.browser.test.cjs` obtuvo 3/3 en local.
- **Asset Lab.** [El job remoto original](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44139463167/job/134291781657) registró `Loading aborted` en NORDLI a 1440×900, después de cinco modelos listos. En local se instrumentó el módulo mediante una ruta de Playwright para registrar inicio, decode, parse, normalización, deadline y aborto externo. El CDP `Emulation.setCPUThrottlingRate` se aplicó después de preparar el editor y antes de importar la escena. Con 4× y 12× la base pasó. Con 18× los seis modelos iniciaron juntos, expiró su deadline de 8 s antes del decode y no se registró cancelación de generación. El callback de NORDLI se ejecutó a 10.071 ms debido a la saturación. La CI histórica carece de traza de origen del aborto, por lo que el patrón es reproducible y la atribución exacta de aquel evento queda sin traza.
- **Asset Lab corregido.** Con 18× pasaron los seis modelos, incluido NORDLI a 1.292 ms desde su entrada en carga. Límite de dos cargas simultáneas en el editor. Cada carga conserva sus 8 s. Las solicitudes en cola cuentan como pendientes y se descartan al invalidar la generación. Las seis pruebas dirigidas pasaron, incluidas las tres resoluciones, integridad, decodificación cancelada y éxito obsoleto. Reproducción `node --test --test-name-pattern="next Asset Lab cohort|F3 missing reference|F3 cancellation during image decoding|F3 loader rejects" tests/assets.browser.test.cjs`. Las pruebas de navegador locales usaron Windows, Node 22.13.0, Playwright 1.62.1 y Chromium. Asset Lab usó three 0.160.0 oficial como fixture npm local para el CDN.
- **Observador.** 32/32 tests de Node locales y preservación estructural de los 36 workflows originales. Plan, medición y runs deben compartir SHA exacto. El snapshot consulta el último intento por run y expone fallos, cancelaciones y otros estados. El orquestador comprueba el ref antes y después de cada dispatch. Cero trabajos omitidos y cero ahorro atribuido. La cobertura del observador sigue sin certificar suites por un estado verde de workflow.

## Qué falta para GO

1. Obtener el SHA inmutable con `git ls-remote origin refs/heads/codex/consolidacion-base`. Consultar `gh pr checks` y `gh run list --commit SHA --limit 100` para ese SHA. Cubrir los 37 workflows efectivos, despachando solo los todavía ausentes que admitan dispatch. Para cada run revisar SHA, conclusión y jobs funcionales esperados. Registrar cualquier skip esperado con causa, y todo fallo o cancelación con su enlace.
2. Confirmar explícitamente CAT-IA V1 browser, la regresión de navegador a la que pertenece Dibujo vivo, y el observador. La validación independiente debe revisar el comportamiento y las pruebas de las dos PR de producto. Si la identidad o los checks quedan incompletos, mantener NO-GO.
3. Solicitar al propietario autorización para integrar. Después de cualquier integración autorizada, verificar las regresiones sobre el SHA efectivo de master antes de cualquier promoción y antes de dar paso a E2.

## Rollback y referencia Studio

Antes de integrar, dejar la rama candidata sin promover y conservar master como base. Después de una integración autorizada, revertir el commit efectivo de la PR afectada. En candidato, los cambios de Dibujo vivo, Asset Lab y CI están separados. Revertir #247 recupera las definiciones originales, conserva la documentación de #246 y desactiva el nuevo observador. Si alguna vez se autoriza una promoción y hace falta restaurar Production, el punto anterior registrado es el deployment `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA` sobre `8525025`; confirmar con el propietario antes de ejecutar ese rollback.

Lectura para el siguiente agente. [Cierre Studio Presentation v1.4 ampliada en ca9fcc1](https://github.com/Juanmaes83/floorplan-3d/blob/ca9fcc19df0adc2f1e89ed71b122f4d9e1f53ace/labs/studio-presentation/reports/19-CIERRE-v1.4-AMPLIADA.md) y [mapa de impacto en ese mismo SHA](https://github.com/Juanmaes83/floorplan-3d/blob/ca9fcc19df0adc2f1e89ed71b122f4d9e1f53ace/labs/studio-presentation/evidence/impacto/mapa.json). Esta consolidación se limita a producto existente, documentación y observación de CI. E2–E7 siguen fuera de alcance.
