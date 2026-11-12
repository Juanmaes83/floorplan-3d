# MCP Etapa 2 — endurecimiento de las propuestas explicables (sin escritura)

**Fecha:** 12/11/2026 · **Rama:** `lab/mcp-stage2-hardening`, apilada sobre #197 (`lab/mcp-stage2-empirical-validation@0ce3c44`), que a su vez se apila sobre #196.
**Estado:** COMPLETA PARA AUDITORÍA. **No integrada.** HOLD para merge, Production y Etapas 3 y 4.

- El MCP sigue siendo **de solo lectura**: no tiene herramienta de escritura, no aplica propuestas y no hace acciones automáticas.
- La validación real con un proyecto autorizado y escala comprobada **sigue pendiente**. Este trabajo **no la sustituye**: todo es sintético.
- El límite de 250 verificaciones sigue siendo **de laboratorio** y no se ha convertido en política del producto.

## C1 · Auditoría de #196 y #197 frente al MCP de `master`

| Aspecto | Resultado |
|---|---|
| Base | #196 y #197 parten de `75615fd`. `master@eae8cf6` **no ha cambiado `tools/rubik-mcp` desde entonces**, así que no hay conflictos. Se verificó fusionando con `master@eae8cf6`: 134/134. |
| Capacidades duplicadas | **Ninguna.** `propose_layout` reutiliza `FloorPlanPlacement` (búsqueda) y `layout-review` (verificación) del producto; no hay un segundo motor. |
| Diferencias reales | Nueva herramienta `propose_layout` (RubikLayoutProposalV1); F1, F2 y F3 corregidos en #197 (`77ca084`). |
| Contratos | Compatibles: entrada `FloorPlanProjectV1` de solo lectura; salida con `applied:false`, `source.sha256`, `currentPose`/`suggestedPose`, `expectedEffects`, `uncertainty` y `notEvaluated`. |
| Procedencia, antes/después y no mutación | Ya existían en #196: `source` (sha256, versión, confianza de escala), poses y efectos, y trampas antiescritura en las pruebas. **No se duplican.** |
| **H1 · bloqueo de cabeza de línea** | Medido con un proyecto sintético de unos 100 muebles en el caso de las 250 verificaciones: un `get_project_summary` enviado durante `propose_layout` **esperaba 5,5 s** (la propuesta tardaba 6,1 s). |
| **H2 · cancelación sin efecto** | Una petición cancelada (`notifications/cancelled`) **se calculaba entera y se respondía**. El SDK solo suprime la respuesta si la cancelación llega antes de que termine el manejador, y con un manejador síncrono eso es imposible. |
| **H3 · entradas sin límite** | `query` de 4 MiB y `roomId` de 100 000 caracteres aceptados. |
| Robustez existente (correcta) | Recuperación tras una línea no JSON, herramienta desconocida y argumentos inválidos con error explicado, stdout limpio (solo JSON-RPC), archivo intacto. |
| **Dependencias** | `npm audit --omit=dev`: 3 avisos. **zod 4.5.4, alto y directo** (memoria con colecciones grandes con restricciones); no es explotable aquí porque las entradas no tienen colecciones. `body-parser` (alto) y `fast-uri` (moderado) son transitivos del transporte HTTP del SDK, que el servidor stdio no usa. |
| Coste | Igual que en #197: unos 6 s y 25,7 ms por verificación completa con 100 muebles, en el peor caso de laboratorio. |

**Causa raíz de H1 y H2:** los cálculos puros pesados se ejecutaban en el mismo hilo que el canal stdio.

## C2 · Endurecimiento (`8dd4139` y siguiente)

1. **Aislamiento** (`src/isolate.cjs`, `src/isolate-worker.cjs`). `propose_layout`, `check_route_2d` y `review_layout` se ejecutan en un *worker thread*:
   - **Cancelación real:** la señal de la petición termina el *worker* y el SDK no responde a la petición cancelada.
   - **Límite de tiempo:** `RUBIK_MCP_HEAVY_TIMEOUT_MS`, 30 s por defecto, entre 100 y 120 000. Un valor inválido detiene el servidor al arrancar, sin aplicar un valor por defecto en silencio. El mensaje aclara que agotar el tiempo **no es una conclusión sobre el proyecto**.
   - **Concurrencia:** como máximo 2 cálculos a la vez. El tercero recibe una negativa explicada y no se calcula nada.
   - **Memoria:** 512 MB de heap por *worker*.
   - El archivo **sigue leyéndose y validándose en el hilo principal** con el lector sin cambios (sin enlaces simbólicos, inodo comprobado, hasta 15 MiB). El *worker* recibe un clon del proyecto validado y llama a **las mismas funciones puras**.
2. **Bloqueo del *worker*** (`src/lockdown.cjs`). Las trampas de las pruebas no alcanzan a un *worker*, porque carga sus propios módulos. Por eso el *worker* bloquea, antes de calcular, la escritura de archivos, los procesos hijos, la red (net, http, https, dgram, fetch, WebSocket) y `open` con escritura.
3. **Entradas acotadas:** `query` hasta 200 caracteres y `roomId` hasta 160.
4. Versión del servidor: **0.1.5**.

### Antes y después (misma sonda, protocolo stdio real)

| Medida | Antes (#197) | Después |
|---|---|---|
| Resumen durante una propuesta pesada | 5488 ms | **12 ms** |
| Respuesta a una petición cancelada | Sí, tras 5,4 s de cálculo | **No**. Siguiente llamada respondida en 11 ms |
| Tercer cálculo pesado simultáneo | Encolado (bloqueo) | **Negativa explicada al instante** |
| `query` de 4 MiB | Aceptada | **Rechazada** con un error de validación |
| Coste añadido por cálculo pesado | — | Unos +0,3 s (arranque del *worker* y clonado) |
| Las 38 propuestas de la validación stdio de #197 | — | **Respuestas idénticas.** Solo cambian datos de entorno: `modifiedAt`, `mtime`, versión del servidor y de Node, marca de tiempo. |

## C3 · Pruebas reproducibles (resultados reales, local)

```
tools/rubik-mcp  npm run check  → PASS
tools/rubik-mcp  npm test       → 134/134
  (128 de #196/#197 + 6 nuevas en test/hardening.test.mjs:
   - igualdad exacta aislado = en proceso en TODOS los fixtures de propuesta, más ruta y revisión;
   - límite de concurrencia, señal abortada y límite de tiempo;
   - worker bloqueado: escritura, spawn, http, net y fetch → bloqueados; lectura de código permitida; nada escrito;
   - stdio real: sin bloqueo, sin respuesta tras cancelar, huecos liberados, negativa por límite, stdout limpio,
     archivo idéntico (sha256 y mtime);
   - stdio real: límite de tiempo por entorno, cadenas acotadas, recuperación tras basura y llamadas inválidas;
   - configuración inválida → el servidor se detiene con un mensaje claro)
validation/run-stdio.mjs (#197)  → 38/38 con el mismo estado y código; respuestas idénticas a la evidencia de #197
Fusionado con master@eae8cf6     → 133/133 (antes de añadir lockdown) y 134/134 en la rama final
```

**Controles positivos y negativos:** las propuestas revisables, sin cambio, pendientes y bloqueadas de #196 se mantienen; las nuevas pruebas comprueban tanto lo que se acepta como lo que se rechaza.

**Falsos positivos y límites:**
- Agotar el tiempo o las 250 verificaciones **no demuestra** que no haya sitio.
- D1–D3 siguen en las autoridades del producto.

## Recomendación pendiente de decisión: zod 4.6.7

Probado en una copia temporal, **sin incorporarlo en esta rama**:

- zod 4.6.7 tiene licencia MIT, del mismo proyecto.
- `npm test`: 133/133 efectivas. Una prueba más falló solo porque la copia temporal no incluía `docs/contracts/examples`.
- `npm audit` baja de 3 a 2 avisos.

Recomiendo aplicarlo cuando se integre el MCP. La decisión corresponde al propietario o a ChatGPT, porque supone incorporar código externo.

## Qué NO se ha hecho (por diseño)

- Etapas 3 y 4.
- Escrituras, aplicar propuestas o acciones automáticas.
- Datos reales.
- Cambiar el límite de 250.
- Actualizar dependencias.
- Modificar las ramas de #196 y #197, que son de otra sesión: esta entrega se apila encima.

## Riesgos y decisiones

- **Validación real (Etapas 1 y 2):** sigue siendo deuda técnica. Necesita un proyecto autorizado con escala comprobada.
- **zod:** aplicar o no la actualización.
- **Integración:** si se integra el MCP, decidir si los cálculos aislados y su límite de tiempo por defecto (30 s) son adecuados para el uso real.
