# Rubik — Multi-Agent Operating Protocol

**Estado:** operativo desde 2026-11-02.  
**Ámbito:** coordinación de trabajo paralelo entre cuentas/agentes (ChatGPT/Codex, Claude Code y otras herramientas) sobre `Juanmaes83/floorplan-3d`.  
**Principio rector:** **el repositorio y sus checkpoints remotos son la memoria compartida; los chats no lo son.**

## 1. Objetivo

Rubik puede avanzar con varias cuentas y agentes en paralelo siempre que cada avance sea recuperable, trazable y no dependa de memoria conversacional privada. Este protocolo permite cambiar de agente por límites de créditos, contexto o especialidad sin perder control del trabajo.

No asigna una herramienta de forma permanente a una clase de tarea. La asignación se decide por misión según fortalezas, disponibilidad y riesgo.

## 2. Autoridades

1. `master` integrado y verificado es la autoridad de producto.
2. Una rama remota con SHA registrado es la autoridad de un workstream en progreso.
3. La documentación canónica/operativa del repo prevalece sobre recuerdos de un chat.
4. Un artefacto local no subido es **trabajo no compartido** y no puede asumirse disponible para otro agente.
5. `pushed` no significa `approved`, `review-ready` ni `mergeable`.

## 3. Un workstream, una rama, un worktree

Cada misión con escritura debe tener:

- `workstream_id` estable;
- branch propia;
- worktree propio cuando haya concurrencia local;
- baseline SHA explícito;
- propietario operativo actual (`agent/tool/account`);
- estado y siguiente acción documentados.

### Regla de exclusión de escritura

**Dos agentes no editan simultáneamente la misma rama/worktree o la misma autoridad mutable sin coordinación explícita.**

Sí se permite:

- investigación paralela de sólo lectura;
- revisión adversarial de una rama ajena;
- comparación independiente de soluciones;
- trabajo simultáneo en ramas/worktrees distintos.

No se permite:

- dos agentes haciendo commits concurrentes sobre la misma branch;
- asumir que una rama local de otro agente está actualizada;
- reescribir/fuercear una rama compartida sin lease y autorización;
- resolver conflictos silenciosamente descartando trabajo ajeno.

## 4. Checkpoints remotos obligatorios

Un workstream largo debe crear checkpoints coherentes con esta secuencia:

```text
trabajo coherente
→ validación mínima aplicable
→ commit descriptivo
→ push remoto
→ registrar SHA + estado + siguiente acción
```

No hace falta esperar al PR final. Es preferible un checkpoint recuperable antes de:

- pausa por créditos;
- cambio de agente/cuenta;
- sesión larga susceptible de compactación;
- operación de riesgo;
- cambio de fase;
- handoff voluntario.

### Qué puede ser un checkpoint WIP

Puede contener trabajo incompleto siempre que:

- compile/parsee cuando proceda o el defecto esté explícitamente documentado;
- no se presente como validado;
- `ACTIVE-WORKSTREAMS.md` indique claramente `WIP`;
- el commit no mezcle cambios ajenos;
- incluya suficiente contexto para continuar.

## 5. Handoff obligatorio

Antes de transferir un workstream a otra cuenta/agente, registrar como mínimo:

- workstream ID;
- propietario saliente y herramienta;
- baseline SHA;
- branch;
- HEAD SHA remoto;
- worktree/path si es relevante localmente;
- estado: WIP / BLOCKED / READY_FOR_REVIEW / etc.;
- qué se hizo;
- qué se verificó y con qué evidencia;
- qué falta;
- blockers/known unknowns;
- archivos principales tocados;
- outputs/evidence externos;
- qué **no debe rehacerse**;
- siguiente acción exacta;
- si es seguro reanudar;
- si existe algún proceso local todavía activo.

Usar `docs/ops/HANDOFF-TEMPLATE.md`.

## 6. ACTIVE-WORKSTREAMS como tablero compartido

`docs/ops/ACTIVE-WORKSTREAMS.md` es el índice humano de trabajo concurrente. Debe mantenerse pequeño y accionable.

Cada entrada indica:

- ID;
- propósito;
- baseline;
- branch y remote HEAD;
- owner actual;
- status;
- último checkpoint;
- siguiente acción;
- riesgos de concurrencia;
- enlaces a documentación/evidencia específica.

Cuando un workstream termina o se integra, se marca `CLOSED/MERGED` y puede moverse a histórico más adelante; nunca se elimina de forma que se pierda trazabilidad.

## 7. Estados operativos normalizados

Usar preferentemente:

- `PLANNED`
- `IN_PROGRESS`
- `PAUSED_EXTERNAL`
- `BLOCKED`
- `WIP_PUSHED`
- `READY_FOR_REVIEW`
- `APPROVED`
- `MERGED`
- `CLOSED`
- `ABANDONED_WITH_REASON`

No confundir `WIP_PUSHED` con `READY_FOR_REVIEW`.

## 8. Selección de herramienta por misión

Orientación actual, no regla rígida:

### Codex Terminal

Adecuado para:

- auditorías deterministas;
- scripts y validators;
- tests;
- `agent-browser` / Playwright / Chromium;
- manifests y evidencia reproducible;
- operaciones de repo de larga duración.

### Codex Desktop

Adecuado para:

- implementación supervisada;
- trabajo de PR;
- revisión interactiva de cambios;
- tareas de ingeniería donde la interfaz Desktop aporte control.

### Claude Code

Adecuado para:

- segunda implementación independiente;
- revisión arquitectónica/código;
- refactors acotados;
- análisis adversarial de una solución;
- workstreams paralelos en worktree propio.

### Segunda cuenta ChatGPT/Codex

Adecuada para:

- otro workstream independiente;
- revisión adversarial;
- investigación paralela;
- continuación de una rama ya pusheada mediante handoff explícito.

La herramienta se elige por la tarea real, no por marca fija.

## 9. Navegadores y procesos locales

Se pueden usar navegadores/contextos distintos en paralelo (por ejemplo Chrome y Edge/otro navegador) y también Codex Desktop + Codex Terminal simultáneamente, siempre que:

- cada proceso tenga un workstream claro;
- no controlen la misma sesión/browser profile mutable sin coordinación;
- no escriban sobre el mismo worktree;
- los puertos/perfiles temporales no colisionen;
- se documenten procesos auxiliares que deban permanecer abiertos.

Un browser/context dedicado a captura automática no debe manipularse manualmente durante la captura salvo instrucción explícita del agente propietario.

## 10. Investigación paralela vs implementación paralela

### Permitido y útil

Dos agentes pueden investigar el mismo problema independientemente para contrastar:

- arquitectura;
- diagnóstico;
- source mapping;
- QA;
- riesgos;
- producto.

Los resultados se comparan antes de decidir.

### Implementación

Si dos implementaciones alternativas se desean de forma deliberada, deben vivir en ramas distintas. Nunca se mezclan antes de una comparación explícita.

## 11. Reanudación tras créditos/contexto/sesión

Cuando una sesión se interrumpe:

1. No asumir que el agente terminó el último paso.
2. Leer `ACTIVE-WORKSTREAMS.md` y el handoff/run-state específico.
3. Verificar branch/HEAD remoto.
4. Verificar `git status` del worktree antes de editar.
5. Si hay cambios locales no pusheados del agente anterior, no sobrescribirlos; primero inventariarlos y crear checkpoint seguro si es posible.
6. Reanudar desde el último checkpoint demostrado, no desde memoria de chat.

Para misiones largas con estado machine-readable, el `run-state.json` específico del workstream prevalece sobre una descripción informal.

## 12. Reglas de integración y merge

Ningún agente debe interpretar un checkpoint remoto como permiso de merge.

Antes de merge se exige, según el contrato de la misión:

- HEAD exacto conocido;
- diff revisado;
- QA/checks requeridos;
- evidencia humana cuando corresponda;
- ausencia de drift relevante;
- autorización de merge explícita cuando la misión la requiera.

El merge debe protegerse por SHA esperado cuando la herramienta lo permita.

## 13. Documentación al cerrar una misión

Una misión no está operativamente cerrada hasta que:

1. código/documentación está en el estado declarado;
2. QA/evidencia está registrada;
3. branch/PR/SHA están documentados;
4. current status refleja el resultado;
5. pendientes reales se recalculan;
6. `ACTIVE-WORKSTREAMS.md` se actualiza;
7. el siguiente agente puede entender qué hacer sin leer chats privados.

## 14. Seguridad y secretos

Nunca commit/push:

- tokens;
- API keys;
- credenciales;
- cookies/sesiones;
- archivos de secretos;
- información privada innecesaria.

Los handoffs describen que una dependencia secreta existe, no su valor.

## 15. Regla final

> **Paralelizar capacidad, no confusión.**

El objetivo de usar varias cuentas/agentes no es multiplicar ramas sin control, sino mantener varios workstreams independientes, recuperables y verificables que puedan intercambiarse entre agentes sin perder contexto ni autoridad.