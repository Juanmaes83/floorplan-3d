# RUBIK SOTA · Evidencia nueva de seguridad y continuidad

## OP-07 v4 · NO-GO

SHA `3afb9e18c84d6d640eeced7203a4169aebb367d6`, árbol `0e816dd54fe74637a4ccd977ac018b7901d76713`. Origen F0.2b de loopback, Chromium `153.0.8010.12` en Windows, Playwright 1.63. La sonda ejecuta el editor, la biblioteca y la autoridad IndexedDB originales. Todas las entradas son sintéticas. La activación positiva usa exclusivamente el sustituto A0 de la propia suite. El control sin A0 bloquea crear la curva con `activation-pending` y conserva revisión 1 y documentos.

| Preparación y guardado final | Revisión antes → después | Resultado |
| --- | --- | --- |
| Ambas claves migradas. Curvar, confirmar, enderezar explícitamente, confirmar, curvar de nuevo, confirmar y perder la curva de forma genérica | 4 → 5 | Guardó la pérdida. Cambió la huella de biblioteca |
| Solo biblioteca. Misma secuencia con confirmaciones separadas | 4 → 4 | `guard-refused`. Biblioteca y revisión intactas |
| Ambas claves migradas. Variante activa con id de proyecto distinto. Curva inicial confirmada. Enderezar, curvar de nuevo y perder genéricamente en el mismo lote | 2 → 3 | Guardó la pérdida de la variante |
| Solo biblioteca. Mismo lote de la variante | 2 → 3 | Guardó la pérdida de la variante |

El muro es `wal_ref-w18`. El lote ejecuta los tres cambios síncronos antes de una única llamada a `session.flush()` y registra revisión 2 tras cada paso. El original de biblioteca conserva su muro. Cuando existe la clave histórica, su huella permanece idéntica. En el lote, la pérdida observada queda en la entrada variante. Las aserciones exigen rechazo y conservación byte a byte de la revisión confirmada. El resultado rojo es esperado para la reproducción. [Sonda](op07-v4-intent.cjs.txt) · [Resultado con huellas](op07-v4-intent.json)

**Causa acotada.** La fachada de `index.html:1143–1151` canaliza el guardado al documento biblioteca. La retención global de pasos en `js/persistence-editor.js:29–43` espera confirmación en ambos documentos existentes incluso si el guardado solo escribe la biblioteca. La reintroducción de la curva por edición ordinaria tampoco revoca el permiso de enderezar durante la composición de un lote. Son dos condiciones independientes. El cierre requiere que el permiso caduque para cada documento que ya confirmó su operación y cuando se reintroduce la forma, conservando ámbito por proyecto.

**A0 + S8.** La simulación sin actualizar referencias contra `112eaf520157fb3f25a227b3c25fc48041220019` devuelve conflicto en el bootstrap de `js/persistence-editor.js` y en `tests/regression-partitions.json`. En origen normal, A0 protege los escritores por época y S8 instala su fachada que valida pérdidas de geometría. La convivencia real necesita ambas comprobaciones en el mismo camino de escritura, junto con el gate transaccional de F0.2b, y la unión de los registros de pruebas. El sustituto utilizado en la sonda solo sirve para aislar el residual de intenciones. [Conflictos exactos](op07-a0-conflictos.txt)

## Simulator D · NO-GO WebKit

SHA local `eae7d5f366ba7e24de9e04d38addd216a70a3d76`, único padre `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `c5735a4b81cdb346d3186c3ceeef251bfcd2ef0d`. Se conservaron las fuentes vigentes de 09557c4, procedencia MIT y pruebas del laboratorio. El diff contiene 11 archivos exclusivamente en `scripts/capture/simulator-d/`; el frontend y los workflows coinciden con master. La reproducción usa el ejemplo y el vuelo a `rom_kid`, cuatro capturas en 0,0–0,3 s a 10 fps. La sonda exige variación de pose, fotogramas distintos y contenido WebGL no vacío. Mantiene el ámbito `canvas3d`.

| Motor Windows, Playwright 1.63 | Poses distintas | PNG distintos | Colores por PNG | Resultado |
| --- | ---: | ---: | --- | --- |
| WebKit 26.6 sin interfaz | 4/4 | 1/4 | 1, 1, 1, 1 | [Falla movimiento y captura](simulator-d-webkit-headless.json) |
| WebKit 26.6 con interfaz | 4/4 | 1/4 | 1, 1, 1, 1 | [Falla movimiento y captura](simulator-d-webkit-headed.json) |
| Firefox 155 sin interfaz | 4/4 | 4/4 | 2922, 2902, 3025, 3086 | [Control aprobado](simulator-d-firefox-headless.json) |

Cero errores de página y peticiones externas en las tres ejecuciones. View3D vuelve a reposo. El contraste acota el fallo a la salida capturada en este WebKit Windows. La causa del compositor no está determinada. El siguiente contraste requiere otro WebKit con salida WebGL real, preferentemente Playwright en macOS. Mantener la garantía byte a byte dentro del entorno acreditado en `EQUIVALENCIA.md`. [Sonda](simulator-d-gate.cjs.txt) · [Manifiesto de blobs donantes](simulator-d-source-exact.json)

## Production y auditoría retrospectiva

Se verificó la nueva evidencia de distribución G-02 en Vercel. `index.html`, el exportador y el recurso de escritura coinciden byte a byte con `8e917e1a70f499a6b8dc68850c8413b7d06c5682`. El recorrido funcional reutiliza su comprobación previa en checkout. [Huellas de los recursos](../production-g02-assets.json)


## Reproducción y continuidad

- OP‑07. Con Playwright 1.63 y Chromium instalado, copiar la sonda como `op07-v4-intent.cjs`, fijar `RUBIK_OP07_ROOT` al checkout aislado del SHA indicado y `RUBIK_OP07_OUT` a una ruta de JSON. En Windows, fijar `CHROME` con la ruta que devuelve el binario Chromium de Playwright. Ejecutar `node op07-v4-intent.cjs`. El código de salida 1 y las tres pérdidas son el resultado acreditado.
- D. Con Playwright 1.63, copiar la sonda como `simulator-d-gate.cjs`, fijar `RUBIK_D_ROOT` al checkout aislado del candidato y `RUBIK_EVIDENCE` a un directorio de resultados. Ejecutar `node simulator-d-gate.cjs` con los pares `headless webkit`, `headed webkit` y `headless firefox`. El candidato se conserva local y su publicación sigue pendiente. El manifiesto permite identificar los diez archivos exactos y la procedencia.
- Validación siguiente. Claude Code 2 continúa el cierre OP‑07 con las dos correcciones de vigencia. La comprobación conjunta necesita preservar A0 real y el gate S8. Codex mantiene Simulator D pendiente del gate WebKit y comprueba ambas aserciones en otro entorno WebKit cuando esté disponible. [Protocolo §4.3](https://github.com/Juanmaes83/floorplan-3d/blob/4df6e26cdcd30321a5c312a827fe399a05abd2e5/docs/agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md#43-publicaci%C3%B3n-obligatoria-trazabilidad-y-auditor%C3%ADa-completa-de-entregas)
