# RUBIK SOTA — Protocolo permanente de coordinación multiagente

**Vigente desde:** 18/11/2026, como propuesta del [plan maestro v1.12](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) pendiente de aceptación del propietario. Sustituye a las reglas dispersas en los handoff, que se conservan como históricos.

## 1. Roles

| Rol | Responsabilidad | No hace |
|---|---|---|
| **Propietario** | Dirección estratégica, prioridades, decisiones, aceptación y autorizaciones | — |
| **ChatGPT** | Supervisión transversal, auditoría independiente, diagnóstico, coherencia, riesgos y coordinación | Cambiar ramas o estados |
| **Claude Code** | Arquitectura, desarrollo, investigación y validación de sus cortes | Tocar ramas de Codex o la candidata sin acuerdo |
| **Codex** | Ingeniería, desarrollo, consolidación, integración y validación de sus cortes | Tocar ramas de Claude o laboratorios sin acuerdo |

## 2. Autorizaciones separadas

Cada una se concede por separado y por SHA. Ninguna implica otra.

| Autorización | Quién la da | Ejemplo |
|---|---|---|
| Desarrollo de un corte | Propietario | «GO K4» |
| Integración en master | Propietario, sobre un SHA concreto | «Fusionar #259 en `abc1234`» |
| Despliegue o promoción | Propietario | «Promover `dpl_…`» |
| Activación de un servicio | Propietario | «Activar el Asistente en Preview aislado» |
| Consumo económico | Propietario, con tope | «Prueba C con tope de N USD» |

## 3. Antes de empezar un corte

1. Consultar master y las PR abiertas en GitHub, no en un documento.
2. Buscar en la [matriz](../product/MATRIZ-TRAZABILIDAD-v1.12.md) y en el código si la función ya existe.
3. Comprobar que ningún otro agente tiene una rama sobre el mismo alcance.
4. Registrar en la PR: responsable, alcance, dependencias y SHA de partida.
5. Usar una rama y un worktree propios. Comprobar antes que el nombre no existe en el remoto.

## 4. Durante el corte

- Nada de operaciones destructivas sobre ramas o directorios de otro agente.
- No crear motores paralelos. Si un componente no sirve, justificarlo por escrito en la PR.
- Evidencia con su clase: [I] código inspeccionado, [E] prueba ejecutada, [T] prueba localizada, [CI] CI consultada, [H] histórica, [P] propietario, [V] pendiente.
- Una prueba localizada no se presenta como ejecutada. Un resultado de Preview no se atribuye a Production.

## 4.1. Integración funcional, UX/UI y QA

Toda implementación registra estos diez puntos en su handoff y en la PR. La PR puede enlazar la evidencia del handoff.

1. **Capacidad.** Qué incorpora o mejora y cuál es el alcance del cambio.
2. **Destino.** Área de RUBIK y superficie concreta que la consume.
3. **Acceso.** Ruta paso a paso en la interfaz. Para procesos internos, describir el disparador, sus consumidores y el resultado observable.
4. **Visibilidad.** Indicar si es una función visible, automática, interna, experimental o de QA.
5. **Reutilización.** Componentes, contratos y autoridades existentes que usa.
6. **Experiencia.** Cómo respeta Perla, UX-FIRST y los estándares visuales. Una acción bloqueada explica la causa, el siguiente paso, una alternativa segura y el estado de los datos.
7. **Condiciones.** Dependencias, permisos, límites, activaciones y entornos aplicables.
8. **Validación.** Pruebas funcionales, visuales, de accesibilidad, de seguridad y de regresión. Distinguir las ejecutadas de las pendientes e indicar cuándo una dimensión no aplica.
9. **Evidencia.** Preview, capturas, vídeo cuando corresponda, ruta de navegación, SHA y árbol acreditado. Vincular cada evidencia a su entorno y alcance.
10. **Production.** Gate pendiente, commit efectivo, despliegue, activación autorizada y verificación de acceso o consumo real.

Una mejora visible alcanza el cierre funcional cuando se puede encontrar y utilizar desde el frontend mediante una ruta coherente y verificada. Las mejoras internas acreditan sus consumidores, funcionamiento e impacto sin añadir una interfaz artificial. Reutilizar menús, acciones, catálogos, inspectores y autoridades antes de introducir otros.

**DESARROLLADO → VALIDADO → INTEGRADO → CONECTADO → DISPONIBLE → ACEPTADO**

| Estado | Evidencia |
| --- | --- |
| DESARROLLADO | Artefacto y alcance identificados por SHA. |
| VALIDADO | Pruebas y límites acreditados sobre el árbol y entorno indicados. |
| INTEGRADO | Commit incorporado a la rama destino y árbol verificado. |
| CONECTADO | Ruta de frontend o consumidor efectivo comprobado de extremo a extremo. |
| DISPONIBLE | Production sirve el SHA verificado y la capacidad es accesible con sus permisos y activación aplicables. |
| ACEPTADO | Conformidad del propietario para el alcance, la evidencia y el entorno registrados. Una aceptación de Preview se conserva como tal. |

Claude Code define el destino y el recorrido durante la escultura y el pulido. Codex garantiza la conexión real, la regresión y la comprobación tras integrar. ChatGPT audita coherencia, accesibilidad, seguridad, descubribilidad y disponibilidad efectiva. El propietario conserva la aceptación y las autorizaciones por SHA.

## 5. Tras cada integración en master

El agente que integra actualiza, en la misma PR o en una documental inmediata:

| Documento | Qué se cambia |
|---|---|
| [Matriz v1.12](../product/MATRIZ-TRAZABILIDAD-v1.12.md) | Solo las filas que la integración demuestra, con PR, SHA y clase de evidencia |
| [Estado maestro](../product/ESTADO-MAESTRO-RUBIK-SOTA.md) | Línea de corte con el nuevo master y lo desplegado |
| `js/capability-registry.js` | Solo si cambia lo activado en Production, y con autorización |
| [Plan maestro](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) | El estado del corte en §6.3 |

El [catálogo](../product/rubik-catalogo-maestro-mejoras-2026-11-09.md) solo cambia para dar de alta, fusionar o descartar un ID, con decisión del propietario.

## 6. Reglas de los documentos

- No se borran decisiones ni se reescriben hechos pasados. Se añade una entrada fechada.
- Un dato vive en un solo documento; los demás enlazan.
- Precedencia: decisión del propietario > código de master > PR y actas con SHA > documentos anteriores.

## 7. Cierre de un corte

1. Volver a consultar master y las PR relevantes.
2. Si otro agente avanzó, reconciliar o declarar los cambios como posteriores al corte.
3. `git diff --check` limpio.
4. PR en borrador con rama, SHA y enlaces de evidencia. No fusionar sin autorización.
