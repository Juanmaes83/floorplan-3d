# ASISTENTE GENERATIVO — ACTA DE VALIDACIÓN (sin gasto)

**PR:** [Juanmaes83/floorplan-3d#238](https://github.com/Juanmaes83/floorplan-3d/pull/238) (Draft). Desde el 2026-11-16 reconciliada con `master@46174d6`, que ya contiene #237: ver doc 07.
**MAXIMA SEGURIDAD · STOP_GASTO · NO MERGE · NO PRODUCTION.**

El SHA, la CI y el Preview del HEAD definitivo se registran en la descripción de #238 cuando termina su CI.
- **Gasto:** 0.
- **Proveedor:** ninguno activado; la pasarela sigue cerrada por defecto.
- **Datos:** sintéticos.

## 1. Correcciones de esta entrega (revisión del propietario en #238, 16:55 y 17:03)

| Hallazgo | Corrección | Evidencia |
|---|---|---|
| **Aislamiento.** El historial del modo generativo era global en la pestaña: al cambiar de proyecto o estudio podía enviarse el contexto de A con B, y el consentimiento no estaba ligado al ámbito | **Ámbito = estudio + proyecto.** Historial, resultados de herramientas, propuestas, rutas y consentimiento pertenecen a un ámbito. Al cambiar, se aplica el aislamiento descrito justo debajo de esta tabla | `tests/assistant-gen.browser.test.cjs` «aislamiento»: proyecto A → B → C y estudio → estudio |
| | | **Antes de corregir, la fuga estaba presente:** `LEAK_INTO_B=true`. Las preguntas y datos de A viajaban en B y el consentimiento de A se reutilizaba. La prueba completa falla sobre el código anterior («pending proposal of A invalidated») |
| | | **Después:** `LEAK_INTO_B=false` y 6/6 |
| **Privacidad.** La interfaz y el doc 03 prometían «Nunca fotos ni datos de contacto», pero la pregunta libre puede contener datos pegados | Texto honesto en ES/EN/ZH (ver «Privacidad» bajo esta tabla) | Prueba de navegador «privacidad» (ES/EN/ZH) y prueba pura de `redactQuestion` |
| **Hallazgo propio.** El aviso de privacidad y las casillas no cambiaban al cambiar de idioma | `labels()` las vuelve a escribir | La misma prueba de navegador, en EN y ZH |
| **Hallazgo propio.** Un teléfono de 9 dígitos seguidos (formato español) no se ocultaba | Patrón corregido | Prueba pura |
| **Intermitencia en CI** de `cat04.browser` en #238 | Tras borrar un objeto, la prueba esperaba solo al modelo y calculaba el clic sobre el plano sin redibujar (el vídeo de CI muestra que el clic seleccionó la estancia). Ahora espera también al dibujo y a dos fotogramas. No se reintenta ni se elimina ninguna comprobación | `record-cat04.cjs` guarda los fallos en su manifiesto; local 4/4 en 2 ejecuciones tras el ajuste (y 3/3 antes de él) |

**Aislamiento al cambiar de ámbito.** El cambio se detecta por el evento `floorplan-project-switched`, que emiten `switchProject` e `importProject`. También se comprueba al abrir el panel, al cambiar de modo y **antes de cada envío**. Entonces:

- se corta la petición en curso (`abort`);
- se borra el historial;
- se invalidan la propuesta pendiente y el deshacer del proyecto anterior;
- se quitan las rutas ofrecidas;
- se desmarca y borra el consentimiento.

Una respuesta que llega de otro ámbito **se descarta**: no se muestra, no se guarda y no entra en el historial. El registro visible es el del proyecto abierto.

**Qué comprueba la prueba de aislamiento:**

- en B no viaja ninguna pregunta, herramienta (`callA*`), dato ni respuesta de A, tampoco después de cerrar y reabrir el panel;
- sin consentimiento nuevo no sale ninguna petición;
- la respuesta tardía de B no aparece en C y no se envía ningún paso más;
- al cambiar de estudio también se exige consentimiento y no viaja nada;
- la consulta guiada sigue funcionando.

**Privacidad.** La interfaz ya no promete que nunca salgan datos personales:

- dice que RUBIK no adjunta fotos ni contactos y que la pregunta se envía tal como se escribe;
- se ocultan los correos, teléfonos, enlaces y `data:` que RUBIK **reconoce**, antes de enviar (`redactQuestion`), y se avisa de qué se ocultó;
- **no** se detectan nombres ni direcciones (límite documentado y comprobado en una prueba);
- avisa de no pegar datos personales y de usar solo proyectos sintéticos;
- `store:false` no equivale a retención cero.

## 2. Pruebas ejecutadas (locales; la CI del HEAD se registra en #238)

| Grupo | Resultado |
|---|---|
| Todas las suites puras del repositorio | **1323 pasan / 0 fallan** (2 omitidas de Blender, preexistentes) |
| `assistant-agent-core` (con privacidad y oráculos de cifras) / `assistant-gen-api` / `assistant-gen-eval` / `assistant-ai-v2` / `cat04-assistant` | 41/41 |
| `spend-ledger` sobre un Redis 7 real local (con la herramienta de conciliación sin red) | 5/5 |
| Navegador: `assistant-ai-v2` (consulta guiada, sin cambios), `smart-furnishing`, `assistant-gen` (6, con aislamiento y privacidad), `catalog-placement`, `building` y `ux07-activation` (variantes y `switchProject`), `gov08-s2-focus` | **27/27** |
| `cat04.browser` | 4/4 en 2 ejecuciones tras el ajuste |
| `record-assistant` (vídeo de la consulta guiada) | exit 0 |

**Ningún proveedor se activa.** Las pruebas de la pasarela cubren las puertas cerradas por defecto. La función desplegada no tiene almacén sin las variables del propietario. El arnés real se niega a ejecutarse sin GO, en CI o con un endpoint que no sea de Preview. Las pruebas de navegador usan un **doble rotulado** de `/api/assistant`, y la vigilancia de red confirma **0 peticiones externas**.

## 3. Estado A / B / C

- **A — verificado sin gasto:**
  - agente, pasarela y cota por bytes con disyuntor;
  - comprobación parcial de cifras;
  - almacén atómico y libro común (Redis real local) con conciliación;
  - **aislamiento por estudio y proyecto**;
  - **privacidad honesta con ocultación**;
  - interfaz ES/EN/ZH;
  - arnés del protocolo C (simuladores: la referencia pasa 30/30 y el defectuoso se detecta en 30/30).
- **B — preparado, pendiente de autorización:** proveedor real, almacén Upstash en Preview, Render IA en el libro (PR aparte) y aprobación del consentimiento. Propuesta definitiva en el doc 06.
- **C — verificado con un modelo real:** **nada**. Los simuladores **no** demuestran comprensión generativa.

## 4. Dictamen

**Listo para que el propietario decida la prueba C en Preview** (doc 06), una vez la CI completa del HEAD de #238 esté en verde. **No es GO de fusión ni de Production.** Production sigue bloqueada por **GOV-06a**.
