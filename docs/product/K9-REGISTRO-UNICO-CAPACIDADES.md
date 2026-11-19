# K9 · Registro único de capacidades

**Corte:** K9 del [Plan Maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) §6.3 (GOV-03). **Base:** `master@02712b51`. **Estado:** pendiente de integración; no acredita nada nuevo en la [matriz](MATRIZ-TRAZABILIDAD-v1.12.md) hasta que se integre.

## Qué cambia

`js/capability-registry.js` pasa a ser la única fuente de capacidades para tres consumidores:

| Consumidor | Antes | Con K9 |
|---|---|---|
| Home (`js/guide-ui.js`) | Leía `state` escrito a mano en cada entrada | Lee el mismo `state`, ahora derivado del nivel y su evidencia. Sin cambios visibles |
| Asistente (`js/assistant-runtime-core.js`) | Decidía por su cuenta el estado de «Reformar desde foto» y «Mis catálogos» según los módulos cargados | Exige además el nivel del registro; si no recibe registro, usa el del producto |
| Matriz v1.12 | Sin relación comprobada con el registro | Cada entrada cita sus filas; una prueba impide que el registro anuncie más que la matriz |

## Niveles

| Nivel | Significado | Estado en la Home | Estado en «Nuevos servicios IA» | Evidencia exigida al cargar |
|---|---|---|---|---|
| `planned` | Planificado o bloqueado | En preparación | En preparación | — |
| `developed` | En una PR, no integrado | No se muestra | No se muestra | PR y SHA |
| `integrated` | En master | En validación | En preparación | Módulos y pruebas |
| `validated` | En master y validado | En validación | En preparación | Módulos, pruebas y validación con SHA |
| `pilot` | Usable en este navegador | En validación | Piloto | Módulos, pruebas y límites |
| `simulation` | Demostración rotulada | En validación | Simulación | Módulos, pruebas y límites |
| `production` | Activo en Production | Disponible | Disponible | Despliegue, SHA, fecha y comprobación; sin bloqueos |

`assertEntry()` rechaza al cargar cualquier entrada que anuncie más de lo que su evidencia permite. Un registro incoherente no arranca.

## Duplicidades eliminadas

- **Render IA:** se declaraba dos veces, en las capacidades de la Home y en los servicios IA. Ahora es una sola capacidad: el servicio comparte nivel, módulos, pruebas y evidencia de Production con la tarjeta. El despliegue (`DEPLOYMENT`) se declara una vez.
- **Asistente:** ya no fija niveles propios.

## Bloqueos que se conservan

`BLOCKED_BY` guarda lo que impide activar cada servicio IA. Mientras un bloqueo siga ahí, el registro no permite subir ese servicio a `production`.

| Servicio | Bloqueado por |
|---|---|
| Estudio de imágenes, Reformar desde fotografía, Imágenes reales desde tu foto | GOV-05, GOV-06a, IMG-04 |
| Asistente conversacional con IA | GOV-06a, AG-0, GOV-05 |
| Mis catálogos y sus usos en Presupuestar y en el Asistente | GOV-06a |

Render IA sigue siendo el único servicio IA activo, con su código de acceso y su consumo de créditos.

## Pendientes de integración

`PENDING` registra los cortes con PR para que nadie los declare en otro sitio. Nunca se anuncian.

| Entrada | PR | SHA |
|---|---|---|
| `room-type` (K4: UX-24 y UX-26) | #280 | `070dbe8a` |
| `persistence-v2` (cadena F0) | #273 → #279 | Cabeza de la cadena: `c0092777` |

Cuando las pruebas de un pendiente aparecen en master, la prueba de coherencia falla hasta que su entrada sube de nivel con evidencia.

## Pruebas

- `tests/capability-registry.test.cjs`: 8 pruebas existentes, sin cambios.
- `tests/capability-registry-k9.test.cjs`: 7 pruebas nuevas, que comprueban:
  - estado derivado del nivel;
  - rechazos de `assertEntry`;
  - árbol de Production, verificado con `git cat-file` cuando el clon contiene el SHA desplegado;
  - una sola Render IA;
  - un Asistente sin estados propios;
  - pendientes nunca anunciados;
  - compatibilidad con la matriz y bloqueos conservados.

## Límites

- El nivel `validated` existe, pero hoy ninguna entrada lo usa: no hay validaciones independientes con SHA registradas.
- La comprobación del árbol de Production se omite, con aviso, en clones superficiales que no contienen `40b4ae5`.
- K9 no cambia la Home ni promociona nada a Production.
