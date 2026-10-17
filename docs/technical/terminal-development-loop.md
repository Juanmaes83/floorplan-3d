# Floor Plan — desarrollo continuo en terminal

Fecha: 14-10-2026. Destinatario: Codex CLI en el equipo de Juanma.

## 1. Objetivo y autorización vigente

Juanma solicita implementar las mejoras de la auditoría Casa Serra / Casa Larga en una rama, siguiendo un roadmap y repitiendo implementación, pruebas y revisión visual mediante Chromium/Playwright. Solicita continuidad durante su viaje y recuperación del trabajo cuando vuelva a disponer de créditos.

Esta instrucción autoriza desarrollo, pruebas locales, commits, publicación de la rama y una PR de revisión. Autoriza avanzar entre incrementos dentro de esa rama cuando su aceptación automatizada y revisión visual por el agente estén comprobadas. Para esta misión sustituye la espera de aprobación humana entre incrementos de desarrollo que figura en el workflow histórico. La revisión humana se mantiene pendiente para la entrega y el merge; no registrar aprobación humana ni fases integradas que no existan.

No fusionar #38, #36 ni la PR nueva, ni promover manualmente producción. Mantener cualquier decisión posterior de Juanma como instrucción prioritaria. No cambiar facturación ni contratar servicios para ejecutar esta misión.

## 2. Fuentes obligatorias

- [Auditoría Markdown](../research/Auditoria_Casa_Serra_Casa_Larga_Floor_Plan.md).
- [Auditoría Word](../research/Auditoria_Casa_Serra_Casa_Larga_Floor_Plan.docx).
- [Preparación técnica CS-1/CS-2/CS-3](casa-serra-integration.md).
- [Protocolo de aceptación](../qa/casa-serra-integration-plan.md).
- [Workflow](../DEVELOPMENT-WORKFLOW.md), contrato FloorPlanProjectV1, roadmap canónico y Roadmap 2.
- [Informe local de #38](https://github.com/Juanmaes83/floorplan-3d/blob/a1341eeef82c651914da08ff78328e668091ea78/docs/qa/pr38-local-final-2026-10-13.md), workflows, logs y capturas asociados. Tras copiar las fuentes a la nueva rama, el informe también estará en `docs/qa/pr38-local-final-2026-10-13.md`.

Word y Markdown son dos formatos del mismo informe; no representan alcances distintos. Usar Markdown para trabajar y Word para contrastar el documento entregado. Conservar los snapshots históricos de la auditoría y registrar las actualizaciones en el seguimiento nuevo.

## 3. Estado inicial contrastado

- Repo: `Juanmaes83/floorplan-3d`.
- #38: abierta, en borrador; rama `feat/multiformat-guided-import`; HEAD observado `a1341eeef82c651914da08ff78328e668091ea78`.
- #38 documenta resultados locales: multiformato 176/0/1, guía 165/0/1, navegador 26/26 y 45/45. Las omisiones corresponden a Blender externo; móvil probado mediante emulación/SwiftShader.
- Preview #38: `https://floorplan-3d-g9sp4ez7b-juanma-espinosas-projects.vercel.app/`; status Vercel del SHA indica despliegue completado. El informe registra revisión visual local y de preview.
- Actions #38: runs `38472637063` y `38472637134`, sin runner y `steps: []`; anotación: cuenta bloqueada por facturación. No es CI aprobada.
- #36: rama documental `docs/casa-serra-floorplan-integration`; los dos informes se publicaron en `b889bbbe5ee3397c7934ee7359b2a0c852f0ba1c`. Sigue en borrador y sin fusionar.

Volver a comprobar remoto al iniciar: estos SHAs son referencias observadas, no instrucciones para sobrescribir avances posteriores.

## 4. Preparación de la rama y aislamiento

1. Inspeccionar `git status`, ramas, worktrees, remotos, PRs y AGENTS.md aplicables. Preservar trabajo existente.
2. Si #38 sigue sin integrar y mantiene el HEAD probado, crear un worktree aislado con rama `feat/casa-serra-larga-improvements` desde `a1341ee`. Así contiene las correcciones verificadas y no altera la rama de #38.
3. Si #38 ya está fusionada, partir del master que la contiene. Si avanzó sin fusionar, identificar los cambios y su evidencia antes de elegir base. No usar un checkout antiguo de `3e1e1dd` como baseline probado.
4. Copiar de la rama documental las rutas necesarias de las dos auditorías, especificación, protocolo y este runbook, conservando contenido y procedencia. Evitar fusionar completa #36: sus roadmaps parten de otra base y contienen estados históricos que requieren reconciliación.
5. Si ya existe la rama de esta misión, reutilizarla tras comprobar propiedad, historia y checkpoint. No crear ramas duplicadas ni hacer reset/force push.
6. Publicar una PR en borrador. Si la base #38 sigue abierta, dirigir inicialmente la PR a `feat/multiformat-guided-import` para mostrar solo las mejoras nuevas. Explicar la dependencia. Retargetear a `master` cuando corresponda y volver a comprobar el diff; no fusionar automáticamente.
7. Registrar los SHAs de base, fuentes y primer baseline local. Reutilizar Node/Playwright/Chromium compatibles del trabajo de terminal anterior y los comandos reales del repo.

## 5. Roadmap de implementación

Crear `docs/qa/casa-serra-larga-progress.md` y su seguimiento estructurado antes de modificar la aplicación. Cada fila necesita estado, alcance concreto, dependencia, aceptación, SHA probado y evidencia. Estados: pendiente, en curso, verificado localmente, bloqueado, diferido con motivo. Añadir por separado revisión humana, CI y merge.

| Incremento | Capacidades de la auditoría | Resultado y gate para continuar |
| --- | --- | --- |
| R0 Preparación | Baseline y continuidad | Rama aislada, fuentes presentes, regresiones de #38 comprobadas y mecanismo de reanudación listo |
| R1 CS-1 mínimo | M01–M04; mínimos M05/M06/M19 | Vista general + una estancia real; controles manuales y ficha; cancelación y retorno exacto; escritorio y móvil |
| R2 CS-1 completo | M01–M06/M19 | Selección/orden de estancias, cámara derivada, accesibilidad, carga cancelable y degradación; matriz P01–P16 del protocolo |
| R3 Entregables | M07/M11/M13 | Lámina con anotaciones, capturas por estancias y orientación mediante minimapa; exportación real y estado restaurado |
| R4 CS-2 | M08/M09 y control M05/M06 | Piloto PBR acotado, UV/color/canales coherentes, presets/HDRI reversibles; comparación visual y presupuesto medido |
| R5 CS-3 visual | M10/M15 | Revelado por IDs y piloto de sombras/efectos; geometría irregular, fallback y restauración sin mutación |
| R6 CS-3 recorrido | M18 | Ruta interior comprobada contra obstáculos; diagonales, puertas, pasos y muebles; alternativa aérea cuando no existe ruta segura |
| R7 Comparación y optimización | M12/M16 | Variantes con referencia común; batching solo si la medición justifica mejora y se conservan IDs/selección/exportación |
| R8 Mejoras selectivas | M14/M17/M20 | Reflejo selectivo, detalles genéricos y presentación portable, cada uno con piloto independiente, caso de uso y presupuesto |
| R9 Cierre de desarrollo | Todas las capacidades anteriores | Regresiones finales, evidencias por SHA, preview exacta revisada y matriz de pendientes; PR preparada para Juanma |

M19 se trabaja transversalmente: créditos de código, técnicas y recursos realmente incorporados. Adaptar conceptos de Casa Larga mediante implementación propia mientras no conste la base de autorización para reutilizar literalmente su código. La autorización de Casa Serra ya está documentada. No extender CC0 de texturas al código de las demos.

El objetivo es implementar las capacidades autorizadas cuyo valor y aceptación se puedan demostrar. Un piloto sin beneficio medido, sin recursos disponibles o sin condición previa se registra como bloqueado/diferido y se continúa con otra tarea independiente. No afirmar que se implementaron las 20 si alguna queda pendiente. El cierre debe explicar cada una.

## 6. Loop obligatorio por tarea

1. Leer el seguimiento y elegir la siguiente tarea con dependencias satisfechas.
2. Escribir el criterio de aceptación observable antes de implementar. Comparar con el baseline pertinente.
3. Implementar un cambio acotado usando los módulos existentes; añadir solo pruebas útiles para contratos, geometría, cancelación o regresiones reales.
4. Ejecutar sintaxis y suites afectadas. Ante fallo, reproducir, corregir y repetir las comprobaciones afectadas. No rebajar umbrales ni omitir casos para obtener verde.
5. Arrancar la aplicación y comprobarla con Chromium/Playwright. Inspeccionar las capturas con la capacidad de lectura de imágenes del agente; guardar PNG sin abrirlas no constituye revisión visual.
6. Revisar escritorio 1440×900, móvil vertical 390×844 y horizontal 844×390. Añadir 360×800 para la ruta de importación de imagen y resize durante presentación.
7. Recorrer entrada, configuración, reproducción, cambio de estancia, captura, cierre, Escape/Atrás, cambio de proyecto/variante y recuperación. Comprobar console/pageerror, controles visibles, canvas dentro del viewport, texto legible, ausencia de desbordamiento y vuelta intacta al editor.
8. Para capturas/exportaciones: leer el archivo descargado, validar dimensiones/contenido y reimportar cuando el formato lo permita. Un evento download no demuestra bytes válidos.
9. Comparar JSON canónico, IDs, biblioteca/variantes, historial, calibración y selección antes/después; verificar cámara/luces/corte/buffer restaurados según el viewport actual.
10. Cuando se cumpla la aceptación, actualizar seguimiento y evidencia, hacer un commit coherente y publicar por push normal. Registrar el SHA de código probado y, si el último commit es solo documental, demostrar que el código coincide.
11. Revisar la preview exacta cuando esté disponible; READY no sustituye comprobar su interfaz. Repetir la revisión afectada después de cambios. Si está protegida, usar el acceso autorizado existente; no desactivar protección.
12. Elegir el siguiente incremento sin pedir confirmación por decisiones rutinarias. Si se repite el mismo bloqueo durante tres intentos sin evidencia nueva, registrar diagnóstico y alternativa y continuar con trabajo independiente.

No ejecutar todas las suites después de cada ajuste trivial. Ejecutar las afectadas por cada cambio y las regresiones completas al cerrar un incremento material y al finalizar. El seguimiento debe permitir distinguir qué comprobación corresponde a qué código.

## 7. Invariantes de implementación

- FloorPlanProjectV1 y unidades canónicas siguen siendo la fuente del proyecto; la presentación utiliza sidecar por entrada local, projectId y revisión visual.
- Ejes: X=(x−cx)/1000, Y=altura/1000, Z=(y−cy)/1000. Comprobar con fixture asimétrico; regenerar poses si cambia el centro.
- API explícita de View3D para capturar/restaurar y cancelar operaciones; no utilizar getters de diagnóstico como setters ni globals de debug como interfaz de producto.
- Conservar edición, importación, navegación, guardado, variantes y exportador actuales. No completar tareas de la guía por visitar una parada.
- Un renderer/Three del runtime actual. No trasplantar la casa fija, el postprocesador completo ni las cámaras de las demos.
- Respetar movimiento reducido, teclado y touch. Context loss/fallo de assets debe permitir recuperar el documento.
- PBR/capturas/animaciones: identidad, UV, color, buffers, dispose y cancelación comprobados. No liberar recursos compartidos de la biblioteca.
- RoomPlan real, rendimiento en teléfonos físicos y validación empírica F2 siguen separados de la emulación; no inventar esos resultados.
- La evolución MCP, CRM, Astra/vídeo y otras fases del Roadmap 2 quedan fuera de esta misión.

## 8. Checkpoints y recuperación

Guardar progreso después de cada tarea y antes de pruebas largas, publicación o cambio de incremento. Esto reduce la pérdida si el corte por créditos es abrupto: no depender de poder escribir un resumen después de agotarlos.

El checkpoint debe contener:

- Repo/worktree/rama; base y HEAD; diff pendiente que pertenece a la misión.
- Incremento y capacidad en curso; último paso acabado y siguiente acción ejecutable.
- Comandos y resultados; SHA probado; logs, capturas y preview exacta.
- Pruebas pendientes y motivo; estado real de CI y revisión humana.
- Bloqueos y diagnósticos; intentos realizados; condiciones para retomarlos.
- Estado de continuidad: trabajando, esperando límite temporal, bloqueado, detenido por usuario o desarrollo terminado.

Mantener `docs/qa/casa-serra-larga-progress.md` en los commits del proyecto y un checkpoint JSON local para el supervisor. No publicar datos de autenticación, rutas sensibles ni logs privados completos.

Al reanudar: comprobar Git y procesos activos, leer ambos checkpoints, validar el último commit y recuperar cambios propios sin borrar trabajo. No reiniciar el roadmap, no repetir entregas cerradas sin motivo y no iniciar un segundo agente escritor sobre el mismo worktree.

## 9. Continuidad cuando se recuperen los créditos

Este archivo es un contrato de trabajo; por sí solo no inicia procesos en el PC. Codex CLI admite sesiones reanudables y, en versiones compatibles, Goals para continuar entre turnos. Un límite de presupuesto puede detener un Goal. La documentación consultada no garantiza un despertar automático cuando se recarguen créditos.

Por eso la primera tarea del Codex de terminal es configurar y probar la continuidad local antes del desarrollo prolongado:

1. Comprobar `codex --version` y la ayuda instalada de `exec`, `exec resume` y los mecanismos disponibles de Goal. No asumir flags o funcionalidades de otra versión ni cambiar de modelo/proveedor para esquivar un límite.
2. Preparar un supervisor local PowerShell, fuera de los archivos publicados de la aplicación. Debe conducir un único worker no interactivo en el worktree aislado, con ID de sesión fijo y checkpoint. Usar los comandos documentados y validar su sintaxis con la ayuda de la versión instalada.
3. Preferir `codex exec --json` para obtener el ID de sesión y detectar el resultado; reanudar con `codex exec resume <SESSION_ID>`. Evitar `--last`: puede seleccionar otra tarea si hay varias sesiones. Si una interrupción perdió el ID, resolverlo desde el registro local; no adivinar.
4. Mantener la autenticación y permisos ya autorizados. No usar bypass de sandbox/aprobaciones, no cambiar permisos globales y no añadir una API key de pago como fallback. Si un permiso requiere intervención humana, registrar el bloqueo y no intentar eludirlo.
5. Si aparece un límite de uso/cuota temporal explícito, guardar el diagnóstico fuera del repo y esperar el tiempo de reset comunicado. Si no se comunica, reintentar como máximo una vez por hora. Un error de autenticación, autorización, facturación o código no se trata como una cuota temporal recuperable.
6. Espera inicial máxima para reanudación automática: 72 horas, configurable por Juanma. Número de relanzamientos y tiempo quedan registrados; detener al vencer el plazo. No comprar créditos ni modificar el presupuesto de un Goal automáticamente.
7. Mientras se ejecuta normalmente, retomar la siguiente tarea solo después de que termine el worker anterior. No hacer polling que genere sesiones duplicadas ni nuevos procesos si el worker sigue activo.
8. Probar primero un fixture de supervisor sin llamadas al modelo: límite temporal → espera simulada → reanudación con mismo ID; doble arranque bloqueado; STOP respetado; error de autenticación detenido; DONE sin reintentos. Después verificar con una única tarea pequeña real y comprobar checkpoint/ID.
9. Proveer una parada explícita mediante archivo STOP y explicar el comando de arranque y cómo comprobar PID/log. Dejar el supervisor en una consola o proceso persistente local identificado. No registrar una tarea de inicio de sesión ni modificar suspensión/energía global sin instrucción adicional.
10. Confirmar en el informe si se configuró, se probó y está ejecutándose. Si no se puede poner en marcha, decirlo y dejar reanudación manual concreta, sin prometer automatismo.

El PC debe permanecer encendido, con conexión y proceso disponible; no hay ejecución local mientras esté apagado o suspendido. GitHub Actions bloqueado por facturación tampoco puede hospedar este loop.

Documentación oficial consultada:

- [Goals](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex): continuación entre turnos, lifecycle y parada por presupuesto; confirmar soporte en la instalación.
- [Modo no interactivo](https://learn.chatgpt.com/docs/non-interactive-mode): `exec --json`, eventos de sesión y `exec resume <SESSION_ID>`.

Reanudación manual de emergencia: seleccionar la sesión de esta misión con `codex resume` o usar su ID conocido; indicar «Lee terminal-development-loop.md y el checkpoint; continúa desde la siguiente tarea pendiente». No usar la sesión de #38 para seguir escribiendo en su rama.

## 10. Tratamiento de CI, preview y cierre

El bloqueo de Actions no impide este desarrollo en rama con evidencia local. Mantenerlo registrado y distinguir CI no ejecutada de tests locales aprobados. No relanzar workflows repetidamente mientras persista la misma causa de facturación. Si la causa ya está resuelta, ejecutar los checks requeridos para el SHA correspondiente.

Al finalizar, dejar:

- PR en borrador, rama publicada y estado del checkout descrito.
- Matriz M01–M20 con aceptación y evidencia o motivo de pendiente/diferido.
- Informe de regresiones finales y capturas visuales revisadas por viewport.
- Preview exacta y estado de acceso, si está disponible.
- Cambios de roadmap vigentes y snapshots históricos diferenciados.
- Riesgos/limitaciones comprobados y lista breve de lo que requiere Juanma.
- Supervisor detenido al terminar el alcance; sin loop indefinido ni trabajo adicional inventado.

No declarar «todo terminado» mientras falte una aceptación del alcance. Puede declararse «desarrollo listo para revisión» con CI o pruebas físicas pendientes, identificadas de forma explícita. La revisión humana, merge y cierre de #38/#36/nueva PR permanecen separados.

## 11. Instrucción de arranque para pegar en Codex de terminal

> Ejecuta la misión Floor Plan de `docs/technical/terminal-development-loop.md`. Recupera ese archivo y los dos informes desde la rama `docs/casa-serra-floorplan-integration` del repo `Juanmaes83/floorplan-3d` sin sobrescribir mis checkouts. Estoy de viaje: autorizo implementar y avanzar por todos los incrementos del roadmap en una rama aislada, verificando cada uno con pruebas y revisión visual real de capturas Chromium/Playwright. Usa como base las correcciones verificadas de #38, actualmente `a1341ee`, o el master que las contenga si ya se integraron. Configura y prueba primero el supervisor local de continuidad y checkpoints para reanudar con la misma sesión cuando vuelva a haber cuota, con espera acotada a 72 horas. Si algo bloquea una capacidad, documenta la causa y avanza con otra independiente. Mantén una única rama/worker, commits por incrementos y PR en borrador. No fusionar, promover producción ni modificar facturación. No detenerte al terminar un plan o una tarea si quedan tareas autorizadas ejecutables. Al terminar, deja evidencia, preview exacta, matriz M01–M20 y pendientes humanos; detén el supervisor. Comienza ahora con la preparación y el primer incremento implementable.
