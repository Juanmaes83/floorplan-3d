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

## 4.2. Auditoría retrospectiva de capacidades

Cubrir todas las versiones hasta el master efectivo. Cruzar el catálogo de 98 mejoras, la matriz v1.12, el plan maestro, las 23 piedras SCULPT y K9/GOV‑03 con el historial, los módulos, las rutas, los contratos y la evidencia. Revisar HOM‑01–04, Entregar y Studio Presentation con Perla, UX-FIRST y los estándares QA. Referenciar una capacidad en su autoridad vigente y registrar las relaciones sin duplicar el catálogo.

Por capacidad auditar Home, Plataforma y Entregables. Justificar las superficies que no aplican. Registrar referencia canónica, problema, estado técnico y funcional, profesiones, recorrido o consumidor real, presencia o propuesta en Home, entregables, autoridades reutilizadas, QA, evidencia por SHA y entorno, dependencias, permisos y propuesta de cierre. Separar los estados de §4.1 y distinguir Preview de Production.

Verificar descubribilidad, promesas, acceso por frontend, accesibilidad, calidad visual y resultados útiles. Para Home seleccionar beneficios profesionales demostrados por perfil. Para Entregar y Studio aprovechar los grupos y compositores existentes y comprobar revisión, privacidad, marca, licencias y trazabilidad. Distinguir investigación, simulación, funciones experimentales, proveedores reales y garantías certificadas según evidencia.

Priorizar por seguridad, madurez, proximidad al cierre, dependencias, valor profesional, valor percibido y esfuerzo. El inventario y diagnóstico pueden avanzar en paralelo como trabajo de solo lectura. Antes de acreditar disponibilidad, consultar el master y Production efectivos. Los cambios de producto requieren cortes separados y autorización. Mantener OP‑10 → Simulator E → Simulator D.

## 4.3. Publicación obligatoria, trazabilidad y auditoría completa de entregas

**Mandato permanente del propietario · 20/11/2026.** Aplica a Codex, Claude Code y ChatGPT, tanto a RUBIK como a sus laboratorios. Complementa las autorizaciones separadas de §2 y la metodología de §§3–4.2.

- Cada diagnóstico, escultura, corrección, prueba, documento y handoff que constituya una entrega de trabajo debe quedar en GitHub, en su repositorio y rama propios autorizados. Guardar commits parciales coherentes al cerrar un corte significativo, antes de cambiar de tarea o perder la sesión. Publicar los entregables y evidencias necesarios para reproducir y continuar el trabajo; no declarar cerrada una entrega que solo existe localmente.
- Al informar de una entrega, indicar repositorio, rama remota, SHA completo del commit, SHA del árbol, base exacta, enlaces directos a los archivos y handoff, pruebas ejecutadas y sus resultados/entornos, evidencia disponible, límites, dependencias, bloqueos, decisiones pendientes y siguiente actuación con responsable. El SHA y árbol de la publicación se verifican después del commit; no exigir que un archivo contenga el hash del propio commit que lo incorpora.
- Antes de emitir un dictamen, decidir una arquitectura o preparar un mandato, ChatGPT comprueba master, #275/#289 o sus sucesores, código real, exportaciones de funciones, consumidores, contratos, pruebas y evidencia del corte. Si falta un documento, parche, prueba o cambio local material para la decisión, pedirlo al propietario/agente antes de ratificar. Separar lo comprobado, lo comunicado, las hipótesis y las propuestas. Evitar investigaciones duplicadas y no delegar una búsqueda que pueda resolverse directamente.
- Publicar en una rama/laboratorio autorizado es distinto de integrar, abrir una PR productiva, fusionar, desplegar, activar, migrar o incurrir en gasto. No tocar ramas ajenas, no forzar actualizaciones, no publicar credenciales, datos privados de usuarios ni recursos sin permiso; usar datos sintéticos o evidencia minimizada cuando corresponda. Respetar la coordinación de CI: agrupar cambios documentales y, si un corte tiene prohibición de disparar CI, emplear el laboratorio autorizado o acordar una vía segura con Codex antes de publicar. No desactivar ni relajar gates para cumplir esta regla.
- Si GitHub o el entorno impiden publicar, comunicar inmediatamente el bloqueo y entregar al propietario un respaldo exacto (archivos o parche, manifiesto y hashes cuando proceda). Mantener la entrega como pendiente de publicación hasta comprobar el remoto. No confundir un commit local con disponibilidad remota.
- Antes de cerrar o transferir el corte, verificar que el commit, handoff y evidencias relevantes son accesibles al siguiente agente. Codex agrupa el delta de continuidad en #275 y #289 o sus sucesores, sin duplicar contenido canónico. Los archivos de arranque de agentes remiten a este protocolo; una instrucción de arranque no concede nuevas autorizaciones.

**Sin publicación verificable, no hay entrega cerrada.**

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
