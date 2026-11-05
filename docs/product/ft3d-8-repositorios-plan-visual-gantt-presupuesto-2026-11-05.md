# FT3D-8 — Repositorios reutilizables y diseño del módulo «Obra en el tiempo»
**RUBIK SOTA · Investigación comparativa · 05/11/2026 · V1 (sin implementación)**

**Estado:** INVESTIGACIÓN / DOCUMENTACIÓN. **NO MERGE · NO DEPLOY · NO COSTE API · NO MODIFICACIÓN DE PRODUCTO.** Esperar a Claude Code y Kimi Code y la autorización expresa del propietario.
**Complementa:** [FT3D-8: planificación visual, cronograma y presupuesto](ft3d-8-planificacion-visual-obra-presupuesto-cronograma-2026-11-05.md); [programa FT3D original](flat-to-3d-presentation-knowledge-programme-2026-10-30.md), [reconciliación D16/D17/D18](ft3d-donor-global-reconciliation-2026-11-01.md), [plan económico](ia-costes-protocolo-unitario-lotes-2026-11-05.md).

## 0. Cambio de prioridad solicitado por el propietario

**Prioridad máxima: experiencia visual.** Que el profesional/cliente vea **inicio → desarrollo → final** de una obra o reforma en la misma vivienda o proyecto de RUBIK, con montaje, apariciones, desapariciones, movimiento de cámara y momentos «cinematográficos» ilustrativos. **No se exige simulación constructiva milimétrica de cada golpe de excavadora, grúa o pieza móvil**; sí mantener la identidad general de la vivienda, dimensiones arquitectónicas y huecos canónicos sin suplantarlos con una casa de demostración.

**Pero el cronograma, las tareas, las fechas y el presupuesto SÍ deben ser reales y trazables**, introducidos o confirmados por profesional a partir de datos del proyecto y los módulos económicos C1–C4. Nunca atribuir automáticamente el progreso visual a obra ejecutada, presupuesto gastado, certificación, plazo garantizado o camino crítico.

**Conclusión:** El primer piloto comercial útil NO debe ser FT3D-8A puramente ilustrativo aislado ni FT3D-8B convertido en planificador ERP completo; debe ser **FT3D-8V — Vista sincronizada: visualización ilustrativa + planificación verificada**. La capa visual puede ser aproximada; **la capa de datos no**. FT3D-8C, seguimiento de ejecución, queda posterior.

### Propuesta concreta de experiencia

```
ENTREGAR → Presentación → Evolución de la obra
┌──────────────────────────────────────────────────────────────┐
│ Proyecto 3D REAL de Rubik · Cámara / Play / Vista / Velocidad │
│ WK 00 → entorno inicial; WK 03 → cimentación; ... → final     │
│ Animación ilustrativa: destacar, subir, revelar, instalar     │
├──────────────────────────────────────────────────────────────┤
│ GANTT REAL — semanas y fechas cargadas/aprobadas              │
│ Preparación       ███                                        │
│ Albañilería        █████                                     │
│ Instalaciones         ████                                   │
│ Acabados                 █████                               │
│  │ cursor sincronizado con 3D │ hitos │ tareas │ costes €     │
└──────────────────────────────────────────────────────────────┘
Datos auditables por tarea: fechas + fuente + partida/s C1–C4 +
importe aprobado o «no asignado». UI y 3D consumen el mismo tiempo.
```

La experiencia debe ofrecer `INICIO`, `OBRA EN CURSO`, `FINAL` y `SCRUB LIBRE`, más vista por hito/oficio y exportación de un breve vídeo determinista opcional. Mantener plan humano real visible; las piezas animadas pueden ser ilustrativas si se identifican como tales.

## 1. Repositorios investigados y contrastados (05/11/2026)

Se han consultado README/código/licencias y metadatos de GitHub. Las características descritas son las declaradas en sus repositorios y, donde se indica, comprobadas en archivos fuente. **No hemos ejecutado ni instalado los proyectos de terceros ni medido su rendimiento en RUBIK**.

| Nº | Repositorio y código | Función relevante | Licencia fuente verificada | Compatibilidad y disposición |
| --- | --- | --- | --- | --- |
| **1** | [Sam1983Aing/flat-to-3d](https://github.com/Sam1983Aing/flat-to-3d), especialmente [05-schedule-build](https://github.com/Sam1983Aing/flat-to-3d/tree/main/05-schedule-build) y [04-build-time-lapse](https://github.com/Sam1983Aing/flat-to-3d/tree/main/04-build-time-lapse) | Modelo 3D cambia por semanas; Gantt sincronizado, grúa/piezas, secuencia reversible; múltiples vistas | **MIT**, copyright Samnang Aing (2026) | **REFERENCIA VISUAL Nº 1.** JS + Three.js cercano a RUBIK. Adaptar mecanismos a geometría propia y atribuir licencia al reutilizar código |
| **2** | [frappe/gantt](https://github.com/frappe/gantt) | Gantt SVG ligero, tareas, fechas, dependencias, arrastre, zoom, vistas y localización | **MIT** (archivo `license.txt`) | **CANDIDATO PRINCIPAL para UI del cronograma**, JavaScript ESM/UMD. Costes se obtienen de RUBIK; no asume motor económico propio |
| **3** | [jsGanttImproved/jsgantt-improved](https://github.com/jsGanttImproved/jsgantt-improved) | Gantt JS con columnas de costes, grupos, hitos, dependencias, previsto/ejecutado, formatos varios | **Revisar antes de copiar:** archivo `LICENSE` incluye condiciones de estilo BSD de autores y código previo; `package.json` declara `ISC`, GitHub API `NOASSERTION`. No afirmar licencia única resuelta | **Alternativa para interfaz rica de datos/costes**. Puede ser más densa que el dock visual deseado; auditar el conflicto documental de licencias |
| **4** | [iman48HK/4DBIM](https://github.com/iman48HK/4DBIM) | Simulación 4D: tareas ↔ elementos, `simulation.ts` puro, `mapping.ts`, visibilidad/colores 3D, importación de cronogramas | **MIT** (LICENSE), dependencias sujetas a sus propias licencias | **REFERENCIA DE ARQUITECTURA 4D.** Usa Next.js/React/IFC/Fragments; NO trasplantar app ni motor BIM para V1 |
| **5** | [ZeaInc/4d-schedule-viewer](https://github.com/ZeaInc/4d-schedule-viewer) | Tareas de Microsoft Project vinculadas mediante reglas de búsqueda a elementos de modelos BIM; mostrar/ocultar/resaltar | **MIT** del repositorio; revisar licencias de Zea Engine y dependencias | **REFERENCIA DE MAPEADO** tarea ↔ elementos. Demostración antigua, requiere stack Zea distinto |
| **6** | [svar-widgets/react-gantt](https://github.com/svar-widgets/react-gantt) | Gantt avanzado, edición, jerarquía, escalas y miles de tareas | **MIT en núcleo**; muchas funciones PRO requieren licencia comercial | **ALTERNATIVA si RUBIK adopta React en un módulo.** Hoy añade stack; CPM/baselines/cálculo avanzado NO se deben atribuir a versión libre |
| **7 (contexto)** | [ibuilder/massing](https://github.com/ibuilder/massing) | Plataforma BIM/4D/5D/estimación/contabilidad mucho más amplia | **MIT** del repositorio; comprobar dependencias | **NO INTRODUCIR** para FT3D-8V: reimplementaría/reemplazaría demasiadas responsabilidades existentes; estudiar solo contratos/ideas |

**Estado de repositorios (metadatos consultados 2026-11-05):**
- Donante Sam: activo, subido 28/10/2026, licencia MIT, 7 demos, incluye código y prompts.
- `iman48HK/4DBIM`: creado en agosto 2026, pocos proyectos/estrellas reportados; no afirmar madurez de producción pese al README.
- `ZeaInc/4d-schedule-viewer`: último push registrado en 2024, por lo que es inspiración, no dependencia recomendada.
- `frappe/gantt`: mantenido, repo activo durante 2026, sin dependencia React para embed en RUBIK.
- `jsGanttImproved`: última actividad 2026, pero licencia con metadatos no uniformes.
- `SVAR`: documentación distingue versión gratuita de capacidades PRO (critical path, baselines, auto-scheduling y calendarios por recurso).

### Mecanismos de código fuente especialmente interesantes

**Sam / 05:**
- `house.js`: `PHASES` es tabla única del ejemplo (10 fases, semana 0–14), `add(obj,phase,order,how)` y `update(week)` gobiernan aparición de piezas.
- `view.js`: cámara, selector de modos `dir=a/b/c`, UI temporal, controles y recorrido interior.
- `05-schedule-build/PROMPT.md` describe la coreografía, sincronía y visual.
- `04-build-time-lapse/js/world.js`: semanas de aparición/salida de piezas y materiales de transiciones; referencia separada de 38 semanas en su `programme.js`.
- **No copiar** sus 14 semanas, vivienda, fechas, duraciones, grupos de madera/obra ni la promesa «14 weeks» como verdad de un cliente RUBIK.

**4DBIM (código verificado):**
- `src/lib/schedule/simulation.ts`: evalúa los estados 4D como buckets `notStarted/inProgress/completed/delayed/visible/hidden/ghost` **sin importar Three.js**, lo que favorece un adaptador independiente.
- `src/lib/schedule/mapping.ts`: mapeo `element ↔ task` manual o por reglas/ID.
- `src/lib/bim/four-d-controller.ts`: aplica visibilidad/colores y programa cambios visuales; el mecanismo concreto depende de IFC/Fragments.
- **Para RUBIK:** adaptar patrón `estado puro → descriptor visual → Story/View3D`, no dependencias IFC.

**Frappe Gantt (README y package):** `frappe-gantt`, paquete ESM con UMD y CSS, MIT. Puede representar el plan; no produce presupuestos ni verifica ejecución. El presupuesto se proporciona desde C1–C4 y una tabla de vínculo trazable.

**jsGanttImproved (README y LICENSE):** dispone de columnas de coste y plan/ejecutado; los importes que visualiza se proporcionan por profesionales y Rubik, no calculados por el gráfico. Resolver licencia antes de integrar.

## 2. Selección de stack RECOMENDADA para el primer piloto

**Stack propuesto por encaje y riesgo, no software instalado:**
- **Geometría 3D**: renderer actual de RUBIK, `FloorPlanProjectV1`, `FloorPlanBuildingV1` y assets de demostración que tengan derechos.
- **Narrativa y scrub**: `presentation-story-core.js` / `presentation-ui.js`, FT3D-1..6, con restauración al cerrar.
- **Estética y técnicas de construcción:** Donante `05-schedule-build` y `04-build-time-lapse` (MIT). Priorizar 3–5 acciones reconocibles por fase antes de una física de grúas completa.
- **Gantt real:** **Frappe Gantt** como candidato A. Alternativa B **jsGanttImproved** si el diseño necesita costes editables directamente en el Gantt, tras revisar licencias. Alternativa C **dock SVG propio** inspirado en donante si se requieren muy pocas tareas y fidelidad editorial superior; el coste de mantenimiento debe estimarse.
- **Estado 4D puro y vínculo tarea ↔ elemento:** patrón `iman48HK/4DBIM`, reescrito/adaptado sobre IDs propios.
- **Presupuesto:** C1–C4 de RUBIK, sus referencias BC3 y fuentes existentes; nunca segundo motor ni importación de estimaciones externas por defecto.
- **Exportación:** capacidades actuales de Story/B3 y captura determinista compatible, no suponer conversión automática a vídeo a partir de renders IA.

**Por qué NO usar directamente una app 4DBIM:** convertiría RUBIK en React/Next.js/IFC/Fragments sin necesidad. El modelo autoritativo de RUBIK no es IFC; adopción solo si existe proyecto futuro de interoperabilidad BIM separada.

## 3. Contrato del piloto FT3D-8V: visibilidad flexible + datos reales

**Rama lógica única:**
```
ConstructionScheduleV1 (datos validados del profesional)
  tasks: taskId | wbs | start/end | dependencies | status | source
  budgetLinks: taskId -> C1/C2/C3/C4 budgetLineIds, amounts/provenance
  elementLinks: taskId -> project/building elementIds OR visual groups
                |
               dateAt(t) (autoridad temporal única)
                |
      +---------+------------------+
      |                            |
  Gantt real + cifras         VisualStateAt(date)
  Fecha/fase/tarea/coste      mismo edificio Rubik
      |                      inicio/desarrollo/final
      +----------> ficha y vídeo revisado
```

**No se debe deducir ningún calendario del importe total ni asociar cantidades a partidas sin validación.** Si una tarea carece de vínculo geométrico, Gantt y presupuesto siguen mostrándola como **tarea real sin representación 3D**; usar resaltado genérico ilustrativo solo si es honesto. Una tarea sin presupuesto asociado muestra `SIN COSTE ASIGNADO`, no `0 €`.

### Tabla de tareas (propuesta, sin inventar valores)
Cada tarea tiene ID/WBS, nombre, fecha comienzo/fin, calendario, dependencia revisada, presupuesto asociado y estado de validación. Duración puede derivarse de fechas confirmadas. La tarea puede vincular varias partidas y elementos; los importes deben asignarse explícitamente con suma total invariante para evitar doble cómputo. Documentar propietario de los datos, versión y fecha de revisión.

### Doble capa de certeza

**Capa visual ilustrativa:** grúa, excavadora, movimiento de placas, vallas, andamios, material de revestimiento apareciendo, iluminación, progresión suavizada. Permitida cuando aporta comprensión. No afirmar que maquinaria, pasos de montaje o tiempos de movimiento son exactos.

**Capa profesional verificada:** inicio/fin, secuencia, tareas/WBS, dependencias cuando existan, presupuesto/partidas C1–C4 y totales verificados. Mostrar explícitamente `PLANIFICADO`, `REVISADO`, `SIN VERIFICAR`; nunca inventar estado `EJECUTADO`.

**Regla temporal:** las animaciones pueden durar 2–5 segundos por transición para fluidez, aunque la tarea abarque semanas; no sustituir las fechas reales por una duración estética. Scrub atrás restaura el estado anterior; no mutar proyecto geométrico.

## 4. Diseño UX, localización y monetización

**Ubicación recomendada:** `Entregar → Presentación → Evolución de obra`, coordinada con #166 y Story. **Entrada de datos profesional futura:** `Presupuestar → Plan de obra`. No crear otro editor de fases dentro de Render IA.

**Navegación inicial:** `Inicio` → `Excavación / estructura / cerramientos` → `Instalaciones/acabados` → `Entrega`. En pantalla una vivienda real, timeline con cursor, tarea activa, fechas y coste de la fase si está vinculado. Controles autoplay, slider, velocidad, cámara, pausa, reduced-motion y vista resumen.

**Cliente:** vídeo/reproducción con marca de `Mi estudio`, descripción de tarea, calendario previsto y presupuesto validado/estimado según fuente; no publicar partes de coste interno o precios de compra si son privados.

**Valor comercial:** servicio premium «Así se desarrollará tu obra» para reformistas, estudios, constructoras, inmobiliarias de promoción, fabricantes de cocinas con instalación. No fijar precio aún. Medir tiempo profesional para definir fases, QA de enlaces/partidas, reproducción móvil y valor cliente. **No requiere OpenAI por cada frame**, lo cual evita costes variables de imagen/video, pero no elimina costes de cómputo, trabajo y almacenamiento.

## 5. Gates de QA (sin ejecutar ahora)

| Gate | Qué demostrar |
| --- | --- |
| V-01 | Con un plan aprobado de fixture, la misma fecha mueve Gantt y 3D de manera reproducible |
| V-02 | Modelo inicial, intermedio y final reconocibles; animación convincente; cámara sin perder referencia |
| V-03 | Cambiar fecha/semana en ambas direcciones restaura geometría/materiales/visibilidad |
| V-04 | C1–C4 y plan aportan cifras y fuentes; suma de asignaciones a fases = presupuesto vinculado, sin duplicaciones |
| V-05 | Tareas sin geometría/coste permanecen visibles y etiquetadas; no inventar correspondencia |
| V-06 | 0 mutaciones a `FloorPlanProjectV1`; salida/undo/restauración verificados |
| V-07 | Controles móvil, teclado, reduced-motion, i18n y rendimiento medido |
| V-08 | Captura/clip por tres checkpoints, presupuesto y fechas de versión, etiqueta de ilustración |
| V-09 | Licencias y atribuciones comprobadas antes de incorporar código externo/activos |
| V-10 | Claude/Kimi finalizados, PR revisadas y autorización expresa de integración |

## 6. Orden de desarrollo posterior recomendado (NO AUTORIZADO)

1. **Prototipo documental y diseño visual:** un fixture propio con 5 tareas/3 grandes estados 3D, Gantt, presupuesto vinculado y fecha única; requisitos legales.
2. **Corte P1 (visual):** aparición/desaparición/secciones/fases de la vivienda Rubik sin nuevas cantidades ni capturas IA. Un único timeline reversible; preservar Story.
3. **Corte P2 (realidad del cronograma):** cargar datos planificados con origen, fechas, dependencias y vínculo a partidas presupuestadas; validación de coste y edición profesional. Presentación solo si datos reales disponibles.
4. **Corte P3 (experiencia de venta):** mecanismos ilustrativos de grúa/maquinaria, animaciones cuidadas, vistas por oficio, filtros, fichas y vídeo con marca.
5. **P4 futuro:** revisión de tareas y programación, avance real acreditado, certificaciones y planificación recursos, si existe caso de negocio y datos.

El **primer piloto comercial significativo debe incluir P1 + P2 conjuntamente** (visual flexible y cronograma/presupuesto reales). No lanzar como servicio de planificación una animación P1 aislada con Gantt de fantasía. Los efectos extra P3 son mejoras premium.

## 7. Decisiones pendientes del propietario

1. Público primer piloto: constructora de obra nueva, empresa de reforma, instalador de cocinas u otro.
2. Grado de complejidad visual deseado (5 fases reconocibles vs 10–15 tareas, grúa real vs revelado ilustrativo).
3. ¿El profesional editará el Gantt en RUBIK o importará uno ya aprobado CSV/JSON? Costes y seguridad cambian.
4. ¿Qué partidas C1–C4 se mostrarán al cliente y cuáles serán privadas?
5. ¿El presupuesto visible será total, por fase o acumulado? Mostrar origen/fecha/revisión.
6. Elegir entre Frappe Gantt, jsGanttImproved auditado, dock SVG propio tras prototipo.
7. Datos de prueba mínimos: proyecto simple 1 nivel y reforma de cocina con fechas/precios deliberadamente creados y marcados fixtures.
8. Definir gate comercial para E2/E3: **FT3D-8V no se incorpora a E2 automáticamente**; aprobación explícita después del cierre Claude/Kimi.

## 8. Evidencias y repositorios oficiales

- [Sam1983Aing/flat-to-3d](https://github.com/Sam1983Aing/flat-to-3d): [licencia MIT](https://github.com/Sam1983Aing/flat-to-3d/blob/main/LICENSE), [Schedule Build](https://github.com/Sam1983Aing/flat-to-3d/tree/main/05-schedule-build), [Time-Lapse](https://github.com/Sam1983Aing/flat-to-3d/tree/main/04-build-time-lapse).
- [frappe/gantt](https://github.com/frappe/gantt), [licencia](https://github.com/frappe/gantt/blob/master/license.txt), [demo/doc](https://docs.frappe.io/gantt/introduction).
- [jsGanttImproved/jsgantt-improved](https://github.com/jsGanttImproved/jsgantt-improved), [licencia textual](https://github.com/jsGanttImproved/jsgantt-improved/blob/master/LICENSE), [demo](https://jsganttimproved.github.io/jsgantt-improved/demo.html).
- [iman48HK/4DBIM](https://github.com/iman48HK/4DBIM), [core pure simulation](https://github.com/iman48HK/4DBIM/blob/master/src/lib/schedule/simulation.ts), [mapping](https://github.com/iman48HK/4DBIM/blob/master/src/lib/schedule/mapping.ts).
- [ZeaInc/4d-schedule-viewer](https://github.com/ZeaInc/4d-schedule-viewer).
- [svar-widgets/react-gantt](https://github.com/svar-widgets/react-gantt) (núcleo MIT, PRO comercial).
- [ibuilder/massing](https://github.com/ibuilder/massing) (gran plataforma, solo contexto).
- [Auditoría propia FT3D-8](ft3d-8-planificacion-visual-obra-presupuesto-cronograma-2026-11-05.md).
- [Código RUBIK autoridad](https://github.com/Juanmaes83/floorplan-3d): `FloorPlanProjectV1`, `FloorPlanBuildingV1`, `js/presentation-story-core.js`, `js/presentation-ui.js`, C1–C4.

**Conclusión:** repositorios reales identificados y comparados. **La recomendación de reutilizar patrones no es autorización de importar código ni de desarrollar antes de acabar Claude/Kimi.**
