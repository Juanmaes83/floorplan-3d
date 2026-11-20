# OP-10 · Ruta de Entregar y restauración del visor

Candidata `56f099dd8c653aa7a27fd771a16654df214cdee3`, base `bf131c304391eb393412c12e6fb8c1f94e22a1a3` y árbol `1393aef8c7f09491f52130d60ae0838b0d2421b3`. [PR #290](https://github.com/Juanmaes83/floorplan-3d/pull/290)

**Recorrido verificado:** abrir una vivienda → Escena 3D → Entregar → Documentación → Escena para Blender → Preparar escena → Descargar ZIP.

| Caso | Resultado y evidencia |
| --- | --- |
| Preparación correcta | ZIP descargado, suspensión restaurada, proyecto y almacenamiento intactos. [Móvil, 390×844](movil-descarga.png) |
| Cancelación | Escape mientras se prepara. Estado cancelado, suspensión restaurada y ningún ZIP generado. [Cancelación](cancelacion.png) |
| Error | Proyecto sintético vacío. Código EMPTY, causa y acción visible, suspensión restaurada. [Escena vacía](escena-vacia.png) |
| Timeout | Código UNSTABLE, recuperación visible y suspensión restaurada. La sonda reduce el plazo y exige el número de fotogramas de estabilización solo durante esa ejecución del capturador. [Timeout](timeout.png) |

Las cuatro capturas usan proyectos sintéticos con Chromium 1.62.1 de Playwright en Windows. Los tres casos sin ZIP dejan el render bajo demanda en reposo con 0 fotogramas adicionales durante 450 ms. Las cuatro pruebas conservan proyecto y almacenamiento y registran 0 peticiones externas. [Resultados](restauracion.json)

El workflow OP-10 pasó 26 pruebas puras y las 7 de navegador en el mismo SHA. Incluye los bytes idénticos del GLB al retrasar su carga 6 s y la regresión C3 de `acwall`. [Gate CI](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44717087140/job/136223127874)

La prueba en la Preview exacta recorrió Entregar por teclado, preparó la escena y descargó el ZIP. Confirmó 0 fotogramas adicionales en 500 ms, la identidad `observed-only`, el visor suspendido e integridad de proyecto y almacenamiento. [Preview de Vercel](https://floorplan-3d-mejaqdg9a-juanma-espinosas-projects.vercel.app/) · [Captura](preview-descarga.png) · [Resultados](preview.json)

## Relevo

La autorización del propietario para publicar, fusionar y desplegar corresponde al HEAD, la base y el árbol de arriba. El objeto de merge consultado es `25959327f3aea0af730f3a86acf39b562c00349b` y el CI general seguía abierto al cierre de este relevo.

1. Consultar [checks de #290](https://github.com/Juanmaes83/floorplan-3d/pull/290/checks), master y el objeto de merge. Conservar el HEAD y comprobar los padres `bf131c30` y `56f099dd`, el árbol autorizado y los gates completos. La CI específica de Blender y CI Impact Observation ya han pasado.
2. Si toda la CI queda en verde, fusionar por merge commit bajo la autorización vigente. Ante cualquier fallo o discrepancia, detener la operación. Conservar la igualdad byte a byte del GLB, sin relanzar matrices.
3. Verificar SHA, árbol, CI posfusión, Production READY y el recorrido frontend hasta descargar el ZIP con un proyecto sintético. Actualizar el resultado en #275 y enlazarlo desde #289. C6 y Studio E3 quedan sin activar.
4. Después, Simulator E y D requieren autorizaciones separadas. E conserva el HEAD `a5d4ccdef8b7be45fb1e456126fe3145009d7e19` y el árbol provisional `dec6d20694e083cb615f42eae60bb74fd3209523` sobre la candidata corregida. D conserva el gate de captura WebKit. A0 sigue congelada, D4 independiente y C/A pendientes de aceptación visual.

## Fusión y comprobación en Production

GitHub incorporó OP‑10 mediante el commit de merge `adb86034d76e7ddd2033fcadf571a4358c5d25e0`, con padres `bf131c304391eb393412c12e6fb8c1f94e22a1a3` y `56f099dd8c653aa7a27fd771a16654df214cdee3`. Árbol verificado `1393aef8c7f09491f52130d60ae0838b0d2421b3`. CI de la PR: 93 aprobados y una omisión prevista.

[Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/CmeZpDHXWmSrv5vh1dzKCPwidJCa) para el SHA de merge. El navegador autenticado recorrió Entregar y descargó el ZIP con un proyecto sintético. Conservó proyecto y almacenamiento, restituyó la suspensión, registró 0 fotogramas adicionales en 500 ms, 0 peticiones externas, 0 errores y la condición `observed-only`. [Captura](production-descarga.png) · [Resultado](production.json)

CI posfusión 5/5 workflows. [CI Impact Observation](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44721203415) confirmó los 42 contratos originales.
