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

## 8. Regla permanente de integración funcional, UX/UI y QA (propietario, 20/11/2026)

Toda implementación declara obligatoriamente, en su PR, handoff o expediente de corte:

1. Qué capacidad incorpora o mejora.
2. En qué área de RUBIK queda integrada.
3. Cómo encuentra el usuario la funcionalidad, paso a paso.
4. Si es visible, automática, interna, experimental o de QA.
5. Qué componentes existentes reutiliza.
6. Cómo respeta Perla, UX-FIRST y los estándares visuales de RUBIK.
7. Qué dependencias, permisos y limitaciones tiene.
8. Qué pruebas funcionales, visuales, de accesibilidad, seguridad y regresión acreditan su funcionamiento.
9. Qué evidencia permite comprobarla: Preview, capturas, vídeo, ruta de navegación y SHA.
10. Qué falta para que esté realmente disponible en Production.

- Una mejora **visible** no se considera funcionalmente cerrada sin un acceso coherente y verificable desde el frontend.
- Una mejora **interna** no requiere interfaz artificial, pero acredita sus consumidores, su funcionamiento y su impacto.
- No se crean menús, botones, catálogos, inspectores ni autoridades paralelas innecesarias.
- Responsabilidades:
  - Claude Code diseña y documenta el destino funcional durante la escultura y el pulido.
  - Codex garantiza la conexión real durante la cirugía y la integración.
  - ChatGPT audita la coherencia, la accesibilidad, la seguridad, la descubribilidad y la disponibilidad efectiva.
- El estado se declara siempre con esta escala, sin saltar peldaños: **DESARROLLADO → VALIDADO → INTEGRADO → CONECTADO → DISPONIBLE → ACEPTADO**.
  - Desarrollado: existe en una rama.
  - Validado: pasa sus pruebas y tiene evidencia.
  - Integrado: está en master.
  - Conectado: un consumidor real lo usa en master.
  - Disponible: se puede usar en Production.
  - Aceptado: el propietario lo acepta.
