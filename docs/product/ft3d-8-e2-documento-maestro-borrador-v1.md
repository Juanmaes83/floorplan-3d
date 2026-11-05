# RUBIK SOTA — FT3D-8 · Documento Maestro de Integración E2

**Versión:** 1.0 — BORRADOR PARA REVISIÓN DEL PROPIETARIO  
**Fecha de corte documental:** 5 de noviembre de 2026  
**Estado:** PROPUESTO; estructura de 16 capítulos aprobada, **contenido pendiente de aprobación**  
**Destino propuesto tras aprobación:** `docs/product/ft3d-8-e2-documento-maestro.md`, en rama documental aislada  
**Ámbito:** S2 BCCA gestionada, S3 Catastro directo, S4 integración comercial y aceptación integral FT3D-8 para E2  
**Regla de autorización:** aprobar este documento **no** autoriza merges, producción, publicación de clientes, gasto externo ni cambios en ramas ajenas.

## Ficha ejecutiva y modo de empleo

**Resultado que debe conseguirse:** desde una vivienda o edificio realmente guardado en RUBIK, el profesional identifica la parcela cuando procede, selecciona un presupuesto trazable, crea y guarda un plan de obra vinculado a tareas, elementos y partidas, reproduce una evolución 4D comprensible y prepara una entrega histórica con su marca. El cliente ve una versión de solo lectura, fiel al proyecto, sin datos inventados y con acceso expresamente autorizado.

**Dos misiones de desarrollo, con controles internos:** (M1) S2 + S3, servicios y datos; (M2) S4, producto integrado. Pueden contener tantas iteraciones, commits y pruebas como necesiten. No son una garantía de “dos respuestas” ni levantan gates legales o de integración.

**Cómo utilizar el documento:** cada requisito `FT8-...` tiene autoridad, trabajo pendiente, evidencia y aceptación. Si la rama o el contrato han cambiado, **volver a verificarlos antes de editar**. Los anexos enlazados son evidencia y detalle técnico; este documento fija el alcance, las decisiones aprobadas y el orden de ejecución, pero **no sustituye el código ni sus esquemas versionados**.

**Semáforo de evidencia:** `INTEGRADO_MASTER` ≠ `IMPLEMENTADO_RAMA` ≠ `CI_VERDE` ≠ `VALIDADO_VISUAL` ≠ `AUTORIZADO_COMERCIAL` ≠ `PENDIENTE`. No elevar estados por inferencia. Los casos sintéticos prueban contratos; no acreditan el flujo con la biblioteca real ni una sesión de cliente.

---

# BLOQUE I — Dirección y estado comprobado

## 1. Misión, alcance, límites y definición de terminado

### 1.1 Decisión estratégica

**FT3D-8 es requisito obligatorio de la primera entrega comercial E2**, por decisión posterior del propietario. Los roadmaps históricos que lo sitúan en E3 no reflejan esta decisión vigente: conservarlos como historia, pero reconciliar su planificación antes de declarar E2 listo. No se incorporan automáticamente las demás líneas premium de E3.

### 1.2 Alcance afirmativo

- **S2:** consultar y seleccionar precios de referencia de BCCA por una vía gestionada **solo cuando el permiso de uso aplicable esté formalizado**, junto al flujo BC3 aportado y tarifas propias; conservar fuente, edición, unidad, precio y revisión.
- **S3:** consulta catastral por referencia, recepción/validación de parcela y GML cuando el servicio oficial lo permita, CRS, colocación explícita y política de exportación por origen.
- **S4:** conectar el expediente, el presupuesto, el plan, el visor, el vídeo, Mi estudio y Entregar en las pantallas reales con persistencia y revisiones, sin paquetes JSON manuales.
- **E2:** prueba completa con un proyecto guardado y una entrega consultada por una sesión de cliente autorizada, tras aprobar política de acceso y publicación.

### 1.3 Fuera del alcance

BIM completo, levantamiento topográfico certificado, movimientos de tierras o medios auxiliares inventados, seguimiento de obra ejecutada, certificación económica, automatización IA, ampliaciones generativas, reescritura de C1–C4, nuevo encoder, nuevo sistema de marca o de enlaces, y cualquier otra familia de producto no aprobada. Son también ajenos los trabajos de Section, Hybrid y ramas de terceros salvo el contrato mínimo de compatibilidad acordado.

### 1.4 Cuatro definiciones de «terminado»

1. **Motor probado:** validadores y pruebas técnicas con entradas reales del contrato.
2. **Integrado:** uso en la aplicación principal, con lectura y escritura autorizada en biblioteca/presupuesto/plan.
3. **Utilizable:** profesional y cliente entienden, navegan, corrigen incidencias y completan sus tareas.
4. **Comercial E2:** permisos, privacidad, seguridad, sesiones, compatibilidad y auditoría de la entrega aprobados. CI verde o Preview READY **no son** por sí solos cierre comercial.

**Regla P0:** ningún dato de otra vivienda, de una revisión distinta o no verificado aparece como perteneciente al expediente actual; ningún importe parcial se rotula como coste total de la obra.

## 2. Registro de decisiones y autoridad

| ID | Decisión / propuesta | Estado vigente | Condición o próxima acción |
|---|---|---|---|
| DEC-01 | FT3D-8 obligatorio para E2 | **DECIDIDO** | Reconciliar roadmaps global y FT3D-8 |
| DEC-02 | Reusar C1–C4, BC3, GML, plan, 4D, vídeo, marca y enlaces | **DECIDIDO** | Prohibida duplicación funcional |
| DEC-03 | Dos misiones M1 S2+S3 y M2 S4 | **ESTRATEGIA APROBADA PARA PLANIFICACIÓN** | No implica integración automática |
| DEC-04 | BCCA: confirmación comercial por consulta | **DECLARADO** | Documentar alcance legal antes de `rubik-managed=VERIFIED` |
| DEC-05 | Acceso del cliente | **APLAZADO CON GATE** | Decidir antes de pruebas reales de publicación |
| DEC-06 | Presupuesto total del edificio: opción 3 con partidas comunes únicas | **PROPUESTA RECOMENDADA** | Aprobar contrato contable/versionado antes de modificar C1–C4 |
| DEC-07 | Incluir `subject.revision` opcional en presupuesto | **PROPUESTA RECOMENDADA** | Verificar evolución de esquema y retrocompatibilidad |
| DEC-08 | Territorio exportable: texto/atribución por defecto, geometría solo con permiso comprobado | **POLÍTICA CONSERVADORA ACTUAL** | Revisar por proveedor, capa y canal |
| DEC-09 | Lectura directa de biblioteca y presupuestos por planta | **OBJETIVO S4, IMPLEMENTACIÓN NO AUTORIZADA AÚN** | Coordinar `index.html`, `budget-ui`, biblioteca |
| DEC-10 | No merge, Production, pagos ni publicación real sin autorización | **DECIDIDO** | Gates externos a cada misión |
| DEC-11 | Asistente IA congelado | **DECIDIDO** | Fuera de FT3D-8 |
| DEC-12 | Revisión humana Gate D | **PENDIENTE** | Corregir GD-UX-01 y verificar encuadre/video, luego aceptar |

**Precedencia documental:** (a) órdenes expresas vigentes del propietario; (b) contratos/esquemas efectivamente implementados y validados en el SHA elegido; (c) este documento para alcance y aceptación; (d) propuestas y roadmaps históricos para contexto. Si (a) requiere cambios incompatibles con (b), crear una propuesta de migración, no reinterpretar el código silenciosamente.

## 3. Inventario técnico y línea de base reproducible

### 3.1 Corte remoto observado

| Referencia | Situación al redactar |
|---|---|
| `master` | `0f9c6ead9732901681498efec326d1ca92e42ffe` |
| Rama Gate D | `feat/ft3d-8-ux4d-gate-d-2026-11-05` |
| HEAD Gate D | `0fe6453b275b535e2a7dc37f854754c4285fedb5` |
| CI HEAD Gate D | ejecución `42109440298`, verde (verificar de nuevo antes de usar) |
| PR Entregas | [#166](https://github.com/Juanmaes83/floorplan-3d/pull/166), `draft`, abierta, HEAD `cef06ff` |
| Roadmaps originales | rama `docs/rubik-evolution-preparation-2026-11-04`, HEAD observado `747569e` |

Los datos de rama, CI y PR son una **fotografía temporal**, no una garantía futura. Tras nuevo trabajo, la autoridad será el SHA de la nueva rama y su evidencia.

### 3.2 Autoridades a reutilizar

| Dato/capacidad | Autoridad existente (archivo/componente) | Estado y limitación |
|---|---|---|
| Geometría del proyecto | `FloorPlanCore.geometry`, `FloorPlanBuilding`; visor principal | Existe; mallas reutilizables por elemento necesitan contrato con Kimi |
| Biblioteca de proyectos | `js/project-library.js`, editor `index.html` | Existe; FT3D-8 aún no lee directamente la entrada activa |
| Cantidades/precios/impuestos | `js/budget-core.js`, `js/budget-ui.js`, `js/budget-presentation.js` | C1–C4; presupuesto común de edificio no producido por UI |
| Origen de precios | `js/cost-provider.js`, `js/budget-cost-bridge.js`, `js/cost-provider-bcca-es.js` | Adaptador BCCA disponible, catálogo gestionado bloqueado |
| BC3 aportado | Importador BC3 existente y bridge | No duplicar parser; conserva fuente de partidas |
| Parcela/GML | `js/geo-provider.js`, `js/catastro-parcel-provider.js`, `js/geo-site-adapter.js` | GML local; falta flujo de consulta directa comprobado |
| Colocación/capas | `js/territory-integration-core.js`, `js/territory-placement-ui.js`, `js/pnoa-orthophoto-provider.js`, `js/ign-mdt05-terrain-provider.js` | Colocación explícita; PNOA/MDT05 son contexto con licencias y disponibilidad |
| Política de exportación | `js/territory-export-policy.js` | `restricted/unknown` no deben exportarse como geometría |
| Plan y dependencias | `js/construction-schedule-core.js`, `js/construction-gantt-adapter.js` | Motor y Gantt; faltan edición/persistencia profesional en Presupuestar |
| Dossier y correspondencia | `js/construction-dossier-core.js` | Paquete `construction-dossier` 0.1.0; evaluación de documentos y huellas |
| Elementos/tiempo | `js/construction-project-adapter.js`, `js/construction-visual-state.js` | Reglas visuales implementadas; evitar mallas paralelas permanentes |
| UX/4D de Gate D | `js/construction-lab-presenter.js`, `labs/ft3d-8/ux-shell.js`, `labs/ft3d-8/ux.css` | Implementado en rama; altura de escritorio GD-UX-01 pendiente de aceptación |
| Vídeo y cliente local | `js/construction-delivery-core.js`, `js/construction-mp4-muxer.js`, `labs/ft3d-8/delivery-ui.js` | MP4/HTML/manifiesto; publicación real no comprobada |
| Marca | `js/brand-core.js`, `js/brand-ui.js` | Reutilizar snapshot activo; no recrear gestor |
| Enlaces y vista compartida | `api/share.js`, `api/view.js`, PR #166 | Validaciones en mock; necesita política de acceso y prueba remota autorizada |

**Obligación inicial de cada agente:** inspeccionar el código actual, documentar función/API exacta, versiones y tests; esta tabla es inventario orientativo verificado por rutas, **no autorización para llamar métodos supuestos**.

### 3.3 S1 y Gate D: no rehacer

S1 aporta identidades, paquetes, correspondencia `match/mismatch/obsolete/absent/unverifiable`, invalidaciones, tres coberturas y pruebas negativas. Gate D aporta UX, tarjeta dinámica, Gantt/escena y vídeo contextual. **Mantener** los tests de fidelidad, expediente, 4D, entrega y vídeo. **Pendiente de UX:** GD-UX-01 (los componentes esenciales deben ser visibles simultáneamente en escritorio sin scroll de página habitual), pruebas en viewports bajos y confirmación visual del propietario. No equiparar “Gate D documentado” a “Gate D aceptado”.

---

# BLOQUE II — Producto y experiencia

## 4. Recorridos de usuario y resultado comercial

### 4.1 Preparación profesional

**Abrir vivienda guardada → identificar revisión → asociar parcela si procede → seleccionar presupuesto → crear/revisar plan → vincular tareas/elementos/partidas → reproducir → previsualizar → generar entrega.** El usuario trabaja desde la aplicación real; los documentos JSON son herramientas de intercambio y diagnóstico, **no** un requisito operativo.

En cada paso la interfaz debe comunicar: objetivo, dato seleccionado, comprobaciones realizadas, errores que bloquean, siguiente acción y cómo corregirlos. **No forzar pasos opcionales:** puede verse el modelo sin parcela o presupuesto; se impide únicamente lo que realmente carece de base.

### 4.2 Presentación profesional

Visor protagonista, control temporal, fase, Gantt, tareas simultáneas, plazos y presupuesto atribuible visibles como conjunto coherente. Detalles técnicos bajo demanda, bloqueos relevantes siempre visibles. El profesional puede pausar, retroceder, consultar partidas y volver sin perder fecha, selección o cámara cuando sea posible.

### 4.3 Consulta del cliente

El cliente abre **la versión congelada** que se haya autorizado: proyecto/estudio, evolución, tareas, fechas, importes compartidos y limitaciones. Sin IDs, fixtures, hashes o edición profesional por defecto. No confundir simulación planificada con ejecución certificada. Acceso denegado o revocado debe tener una respuesta comprensible, sin filtrar detalles privados.

### 4.4 Matriz de experiencia

| Contexto | Acción principal | Estado feliz | Estado incompleto y recuperación | Evidencia |
|---|---|---|---|---|
| Proyecto | «Continuar con este proyecto» | sujeto/revisión visibles | sin proyecto: abrir biblioteca | UX-01 |
| Parcela | «Consultar / importar GML» | referencia, CRS y colocación correctos | sin acceso: GML manual, sin borrado | UX-02 |
| Presupuesto | «Elegir partidas» | fuente y coste mostrados | precio desconocido: sin total ficticio | UX-03 |
| Plan | «Revisar planificación» | tareas guardadas y validables | tarea incompatible: explicación y corrección | UX-04 |
| Evolución | «Reproducir» | escena/Gantt/tarjeta sincronizados | sin geometría: tarea textual | UX-05 |
| Entrega | «Previsualizar / generar» | snapshot coherente y descarga | bloqueos/estado parcial explicados | UX-06 |
| Cliente | «Ver evolución» | lectura autorizada | sin permiso/revocado: acceso denegado | UX-07 |

## 5. Contrato UX/4D y lenguaje del producto

**La reproducción visual es la estrella.** Conservar el lenguaje Perla, composición aprobada como dirección, resumen progresivo y detalle profesional accesible. Adaptar pantalla útil: vista principal de escena, controles, tarjeta y Gantt simultáneos en escritorio común; desplazamiento interno solo para listas largas; no reducir tipografía a niveles ilegibles ni ocultar avisos P0.

**Autoridad temporal única:** para el instante `t`, la fase, tareas activas (pueden ser varias), estado de elementos, cursor Gantt, tarjeta, fechas e importes proceden de la misma evaluación. El MP4 no es interactivo: adapta rótulos, banda temporal y mini-Gantt sin pretender clicabilidad. Al seleccionar tarea del Gantt, mostrar su instante/elementos y al retroceder restaurar el estado previo.

**Honestidad:** maquinaria/andamios/vallados solo como recursos ilustrativos asociados expresamente al plan; no atribuirlos a la geometría de la vivienda. Terreno topográfico, cubierta real o certificación no se inventan. Distinguir «completado según plan», «en curso según plan», «pendiente» de avance real ejecutado.

**Glosario al usuario:** «precio desconocido», «presupuesto parcial», «plan desactualizado», «revisión declarada», «parcela no colocada», «obra prevista (simulación)». No mostrar por defecto `binding`, `fixture`, hashes o errores internos; sí conservar diagnóstico consultable. Cada error debe explicar qué ocurre, por qué importa y qué puede hacer el usuario.

**FT8-UX-01:** el profesional llega desde una vivienda guardada a «Ver evolución» sin paquetes manuales. Aceptación: navegador, identidad de proyecto y revisión comprobadas.  
**FT8-UX-02:** estado incompleto usable sin datos falsos. Aceptación: pruebas sin parcela, sin plan, sin precio.  
**FT8-UX-03:** escritorio con visor, controles, tarjeta y Gantt visibles en viewports 1280×720, 1366×768, 1440×900, 1920×1080, sin scroll global necesario para correlacionarlos; accesibilidad con zoom. Aceptación: capturas viewport (no página completa), bounding boxes y revisión humana.  
**FT8-UX-04:** móvil 390×844 y tamaño de texto ampliado sin scroll horizontal, botones táctiles útiles y alternativa textual. Aceptación: prueba móvil y teclado.  
**FT8-UX-05:** vídeo y pantalla presentan los mismos instantes/actividades/costes cuando hay datos. Aceptación: fotogramas comparados, MP4 descargado y reproducido.  
**FT8-UX-06:** el usuario puede comprender y corregir bloqueos sin códigos técnicos. Aceptación: pruebas de tareas + revisión humana sin métricas inventadas.

---

# BLOQUE III — Especificación implementable S2, S3, S4

## 6. S2 · BCCA gestionada, procedencia y cambios económicos

**Objetivo:** consultar referencias del banco de costes y aplicarlas voluntariamente en Presupuestar, conservando procedencia, unidad y revisión profesional. La vía `user-supplied` BC3 ya existe y debe mantenerse incluso sin permisos para catálogo gestionado.

### Requisitos

| ID | Autoridad/entrada | Resultado funcional exigido | Prueba / aceptación |
|---|---|---|---|
| FT8-S2-01 | `cost-provider-bcca-es.js`, BC3 y proveedor de costes | Consultar catálogo autorizado por código, texto y familia, con edición/región identificables | Buscar referencias conocidas; no mezclar ediciones ni regiones |
| FT8-S2-02 | `CostQuote` / puente presupuestario | Mostrar código, descripción, unidad, moneda, precio, edición, fecha y fuente junto a la partida | Inspección UI y trazabilidad en documento guardado |
| FT8-S2-03 | C1–C4 | Comparar precio de referencia, tarifa propia y precio seleccionado sin aplicarlos automáticamente | Cambiar selección mantiene valores previos hasta confirmación explícita |
| FT8-S2-04 | C1–C4 + versión de catálogo | Actualización propuesta por diferencias, con vista previa, decisión profesional y revisión | Presupuesto histórico conserva idénticos importes/huellas tras actualizar catálogo |
| FT8-S2-05 | Contratos de unidades | Verificar equivalencia estricta de unidad/cantidad/moneda; rechazar conversiones sin desglose | Casos kg/m², ud/m² y moneda distinta se rechazan o requieren resolución documentada |
| FT8-S2-06 | Provenance, revisión, licencia | Preservar `providerId`, código, edición, región, licencia, atribución, `asOf` y revisión | Exportar/reabrir, comparar procedencia por partida |
| FT8-S2-07 | Gate legal vigente | Mantener `rubik-managed` desactivado mientras documentación insuficiente | Test fail-closed: `UNKNOWN/RESTRICTED` no distribuye/aloja catálogo |
| FT8-S2-08 | UI Presupuestar | Mensajes claros para sin fuente, sin precio, no autorizado, actualización disponible | Pruebas de estados y teclado, sin cambiar valores automáticamente |
| FT8-S2-09 | Catálogo/caché | Límites, rendimiento y caducidad de datos gestionados si se autorizan | Pruebas con catálogo representativo y recuperación tras fallo, sin descargas masivas no autorizadas |

### Contrato legal previo a activación

Registrar la evidencia primaria o escrita que delimite titularidad, organismo/contacto, edición, consulta, adaptación, caché, alojamiento, redistribución, embedding, actualización y atribución. La comunicación comercial declarada por el propietario **no equivale** a derechos de redistribución ya verificados. Mantener el registro `docs/legal/bcca-es-reuse-gate-2026-10-27.md` como antecedente y añadir adenda fechada; no sobrescribirlo ni inventar enlaces. Si falta documentación, entregar interfaz y adaptador probado **sin activar catálogo gestionado**.

**Gate S2:** un precio usado puede rastrearse a la referencia y la revisión, sin modificación silenciosa ni afirmaciones legales no acreditadas. La operación BCCA gestionada solo alcanza `AUTORIZADO_COMERCIAL` tras el gate documental.

## 7. S3 · Catastro directo, GML y capas territoriales

**Objetivo:** consultar por referencia catastral, obtener la parcela correcta si el servicio oficial lo permite, asociarla y colocarla de forma explícita. GML local se mantiene como alternativa robusta.

### Requisitos

| ID | Autoridad/entrada | Resultado funcional exigido | Prueba / aceptación |
|---|---|---|---|
| FT8-S3-01 | Proveedor Catastro + documentación oficial vigente | Consulta por referencia con formato/servicio verificados, HTTPS, límites y condiciones | Respuesta oficial controlada; registrar cobertura y limitaciones; no simular conexión como real |
| FT8-S3-02 | `catastro-parcel-provider.js` y `geo-site-adapter.js` | Conversión a parcela canónica con CRS, referencia, fuente y huella verificables | GML válido y referencia correcta; rechazo de CRS no admitido |
| FT8-S3-03 | `site.parcel` / `building.site` | Asociación a proyecto seleccionado sin sustituir datos en conflicto | Referencia de otra vivienda no altera parcela ni expediente previos |
| FT8-S3-04 | `buildingPlacement`, norte, offsets | Profesional elige/valida colocación; preservar transformaciones exactas | Ida/vuelta, punto ancla y revisión con tolerancias del contrato S1 |
| FT8-S3-05 | Red y resiliencia | Estados claro: consulta, éxito, vacío, error, timeout, desconexión, alternativa GML | Simular fallo/red lenta/cancelación sin pérdida de estado |
| FT8-S3-06 | PNOA y MDT05 | Capas opcionales solo cuando existan fuentes, red, créditos y licencia | Contexto disponible/no disponible visible; sin obligar a cargarlo ni inferir excavación |
| FT8-S3-07 | Política de exportación territorial | Comprobación por canal y licencia; `restricted/unknown` no se exporta como geometría | Inspeccionar MP4/HTML/snapshot y rechazar capas restringidas |
| FT8-S3-08 | Interfaz de parcela | Buscar, validar, revisar, colocar, guardar y sustituir con confirmación | Prueba de usuario con referencia válida e inválida |

**Condiciones territoriales:** Catastro no es levantamiento topográfico certificado. CRS, zona de cobertura, respuesta WFS/INSPIRE, restricciones de regiones y licencias se verifican con fuentes oficiales **en el momento de implementar**. No afirmar cobertura general ni compatibilidad universal. La exportación por defecto conserva referencia/atribución textual cuando procede, pero nunca exporta geometría restringida por mera disponibilidad interna.

**Gate S3:** parcela verificada y asociada, colocación conservada, respuesta errónea reversible, políticas por canal ensayadas, y alternativa GML manual funcional. Si falla el servicio, **no** se da por implementada la consulta directa productiva.

## 8. S4 · Conectar FT3D-8 con la aplicación comercial

**Mayor complejidad del programa.** Este capítulo define los consumidores, operaciones y resultados de S4, no presupone acceso a ramas ajenas. El punto de entrada debe ser **el proyecto guardado**, no una selección de archivos sintéticos.

### S4-A · Proyecto y expediente persistente

**FT8-S4-01** — Leer `project | building`, planta activa, `savedAt`, ID y revisión de la biblioteca/editor mediante un contrato de solo lectura aprobado. **Aceptación:** abrir vivienda guardada, cambiar a otra, comprobar que no sobreviven parcelas, costes, tareas, selecciones ni marca del sujeto anterior.

**FT8-S4-02** — Resolver el presupuesto seleccionado del proyecto/plantas sin suponer coincidencia por nombre. **Aceptación:** dos presupuestos del mismo proyecto requieren selección explícita; presupuesto de otro proyecto se rechaza.

**FT8-S4-03** — Persistir plan, vínculo y referencias al expediente junto al sujeto, sin reescribir innecesariamente la geometría ni presupuestos. **Aceptación:** guardar, cerrar, reabrir, modificar, deshacer cuando exista soporte y restaurar plan correcto.

### S4-B · Presupuesto de edificio y revisiones

**FT8-S4-04** — Producir un presupuesto de edificio verificable, con totales por planta, partidas comunes únicas, IVA y reglas de no duplicación. **Gate previo:** aprobación del contrato de opción 3 y compatibilidad de presupuestos anteriores. **Aceptación:** edificio de dos plantas, partidas comunes solo una vez, ninguna suma ingenua de totales y mensajes de cobertura parcial.

**FT8-S4-05** — Asociar revisión de proyecto al presupuesto mediante extensión versionada/compatible **si se aprueba**; mientras tanto identificar emparejamiento no verificable. **Aceptación:** formato anterior legible, revisión cambiada marcada obsoleta y presupuesto histórico intacto.

### S4-C · Planificación profesional editable

**FT8-S4-06** — En Presupuestar → Plan de obra, crear, duplicar, editar, guardar e importar planes; tareas con título/WBS, fechas, duraciones, hitos, dependencias FS/SS/FF/SF y desfases cuando el motor los soporte. **Aceptación:** acciones persistentes, validación visible de errores, sin mover fechas automáticamente.

**FT8-S4-07** — Vincular tareas a elementos del proyecto con roles permitidos; no inventar cimentaciones/estructura/cubierta que el modelo no contiene. **Aceptación:** elemento eliminado o cambiado invalida vínculo; tarea sin 3D sigue visible en plan/tarjeta.

**FT8-S4-08** — Vincular partidas a tareas mediante porcentajes explícitos, con asignado/restante/no asignado, sin exceder importe, sin imputación diaria ficticia. **Aceptación:** presupuesto parcial, precio desconocido, tareas simultáneas y sin doble contabilización.

**FT8-S4-09** — Revisiones de plan y vínculo; distinguir borrador, revisado/declarado y autenticado (si en el futuro se implementa identidad real). **Aceptación:** jamás se muestra «aprobado por usuario autenticado» por un nombre libre en JSON.

### S4-D · Experiencia de evolución dentro de RUBIK

**FT8-S4-10** — Reutilizar el contrato de mallas por elemento de Kimi o acordar alternativa equivalente, sin mantener dos montajes divergentes de forma indefinida. **Aceptación:** comparación de cajas/elementos/materiales y fidelidad final frente al visor oficial, también después de cambios de geometría.

**FT8-S4-11** — Abrir Evolución desde proyecto/plan persistidos conservando el presentador Gate D, Gantt, tarjeta y vídeo contextual; no duplicar estado ni mensajes. **Aceptación:** reproducir, pausar, scrub, retroceder y seleccionar tarea con coherencia escena-fecha-tarea-importe y viewport escritorio/móvil.

**FT8-S4-12** — Manejar estados sin plan, sin precio, sin parcela o sin geometría representable sin bloquear capacidades independientes. **Aceptación:** mensajes orientados a soluciones y sin coste/obra inventados.

### S4-E · Marca y entrega

**FT8-S4-13** — Leer `FloorPlanBrandUI` / snapshot autorizado de Mi estudio; congelar marca en la entrega. **Aceptación:** cambiar logo/perfil después no modifica una entrega previa.

**FT8-S4-14** — Integrar un tipo «Evolución de obra» en Entregar, reutilizando PR #166, MP4, HTML, manifiesto FT3D-8 y controles existentes; vista previa, personalización, generación y resultado. **Aceptación:** navegador de cliente recibe el snapshot correcto, con opción CON/SIN vídeo inequívoca, sin JS ni datos editables innecesarios.

**FT8-S4-15** — Garantizar inmutabilidad por huellas: proyecto, geometría, parcela permitida, presupuesto, plan, vínculo y marca. **Aceptación:** cambiar fecha, precio, muro o marca invalida la entrega preparada y exige nueva versión, mientras historial anterior queda intacto.

### S4-F · Acceso de cliente y publicación

**FT8-S4-16** — Diseñar permisos, revocación, expiración/cachés, aislamiento de snapshot, consentimientos y límites de almacenamiento **según decisión posterior del propietario**. **Aceptación:** acceso permitido/denegado/revocado ensayado, sin fuga entre clientes.

**FT8-S4-17** — Probar publicación remota solo tras autorización expresa, con datos sintéticos no privados, verificando experiencia en sesión cliente ajena a la cuenta creadora y posterior retirada. **Aceptación:** URL real comprobada, revocación efectiva y ausencia de contenido restringido. `READY` de Vercel o mocks no acreditan este punto.

**FT8-S4-18** — Conservar la entrega descargable/local como vía utilizable independiente cuando no exista autorización de enlace. **Aceptación:** vídeo/HTML se genera, descarga, abre y reproduce sin activar publicación.

**Gate S4:** recorrido completo desde la biblioteca hasta Entregar, con edición y persistencia de plan, modelo fiel, costes trazables, snapshot congelado y UI coherente. `S4 funcional` no implica `publicación comercial aprobada` hasta terminar S4-F.

## 9. Contrato único de identidades, autoridades y revisiones

### 9.1 Estructura lógica

```text
Biblioteca [project.id / building.id, revisión del sujeto]
  ├─ geometría y planta(s) [revisión geométrica]
  ├─ parcela y colocación [fuente, licencia, revisión]
  ├─ presupuestos seleccionados [budget.id, fuente, edición, revisión]
  ├─ plan de obra [schedule.id, revisión]
  │    ├─ task ↔ elementKey + role
  │    └─ budgetItemId ↔ taskId + asignación explícita
  └─ Mi estudio [snapshot de marca]
                 ↓ FloorPlanConstructionDossier.evaluate
       correspondencias + conflictos + coberturas + huellas
                 ↓ una evaluación temporal FT3D-8
       escena / Gantt / tarjeta / vídeo / HTML
                 ↓ snapshot de entrega inmutable (dlv_)
           descarga o publicación autorizada
```

### 9.2 Reglas normativas

- Geometría: únicamente autoridades del editor; medidas/cantidades: motor de mediciones y C1–C4; precio/IVA/totales: `FloorPlanBudget.calculateBudget`; fechas/dependencias: FT3D-8; asignaciones: porcentajes explícitos del plan; parcela: `site.parcel`/`building.site`; colocación: `buildingPlacement` y norte; marca: `FloorPlanBrand.snapshot`.
- `match`, `mismatch`, `obsolete`, `absent`, `unverifiable` siguen diferenciados. `unverifiable` no equivale a match.
- La edición en pantalla crea o guarda una nueva revisión donde corresponda; los materiales generados anteriores no se reescriben.
- No inferir ID de proyecto por nombre, ruta o pestaña; no confiar en `localStorage` compartido entre dominios de Preview y Production.
- Resolución de conflicto: no fusionar datos discrepantes ni sobrescribir sin acción explícita del profesional. Si es grave, entrega limitada a nivel interno según evaluador actual.
- Los niveles de revisión del contrato S1 (`internal`, `orientative`, `declared-plan`, `evidenced-plan`; `accredited` reservado) prevalecen sobre textos de propuestas anteriores que hablan de `professional/approved-plan` sin equivalente de esquema.
- `rubik-sota.construction-dossier` **0.1.0** y manifiesto de entrega FT3D-8 **0.2.0** son puntos de partida observados; **no imponer** la propuesta histórica `construction-delivery 0.1.0` como implementación vigente.

### 9.3 Invariantes de regresión

1. Cambio de proyecto: cero contaminación de datos y vistas.
2. Cambio de muro/hueco: vínculos revisados y entrega preparada invalidada.
3. Cambio de presupuesto/partida: plan/entrega marcados obsoletos; históricos intactos.
4. Cambio de fechas: todas las presentaciones nuevas usan la revisión actual; vídeos antiguos conservan la anterior.
5. Cambio de parcela/colocación: no mover automáticamente la vivienda ni exportar capa prohibida.
6. Cambio de marca: snapshot previo preservado.
7. Ningún precio desconocido se convierte en cero; ningún precio parcial se presenta como presupuesto total.

## 10. Versionado, persistencia, compatibilidad, rendimiento y reversión

- **Contratos actuales:** proyecto y edificio del editor (múltiples versiones), C1–C4 (presupuestos 1.0/1.1 leídos), plan FT3D-8 0.1/0.2, dossier 0.1 y manifiesto de entrega 0.2, según documentación S1. **Confirmar las versiones en código antes de crear migraciones.**
- Nuevos campos opcionales requieren tolerancia a ausencia, lectura de documentos antiguos, rechazo seguro de versiones desconocidas y pruebas de reabrir sin pérdida de datos. No migración destructiva silenciosa.
- Guardado de planes/vínculos mediante almacenamiento acordado con la biblioteca (clave propia si procede), con tratamiento de cuotas, colisiones y cierres inesperados.
- Presupuestos por edificio: comparar resultados antes/después, importes por planta, comunes e IVA; rechazar mezcla incompatible.
- Bibliotecas de cientos de elementos: comprobar tiempo de apertura, scrubbing, memoria, tamaño de snapshot/vídeo y caída de rendimiento; no establecer cifras prometidas sin medición.
- Exportaciones: archivo reproducible, cancelación, reintento, formatos y fallbacks. H.264 WebCodecs indexado probado en Chromium no implica paridad automática en Safari/Firefox o móvil.
- **Rollback:** feature flags y commits aislados; posibilidad de desactivar entradas nuevas sin romper proyectos; no escribir esquemas nuevos sobre documentos antiguos hasta validar compatibilidad; detallar reversión de PR y migraciones.

---

# BLOQUE IV — Restricciones transversales y ejecución

## 11. Legal, privacidad, seguridad y permisos

| Riesgo | Política obligatoria | Evidencia de cierre |
|---|---|---|
| BCCA | `rubik-managed` desactivado si permiso insuficiente | Adenda, fuente escrita, revisión legal responsable y test del gate |
| Geometría catastral | No exportar si `restricted/unknown`; diferenciar visualización interna | Inspección binaria/contenido de vídeo/HTML y política por canal |
| PNOA/MDT05 | Solicitud opcional, atribución y licencia por capa; sin certificación topográfica | Registro de capas y pruebas de exclusión |
| Datos de cliente | Aislar proyectos/snapshots; pruebas con fixtures, no archivos privados | Pruebas de no contaminación y sesión sin credenciales creadoras |
| Enlaces | Modelo de acceso por aprobar; revoke/expiry/cache antes de publicar | Ensayo remoto autorizado y revocación efectiva |
| Vídeo y HTML | Confirmación de inclusión/exclusión y revisión congelada | Descarga, reproducción y comparación de manifiesto |
| Aprobación de plan | Declaración no es identidad autenticada | UI y tests sin falso «aprobado» |
| Costes | Precio de referencia ≠ oferta, previsto ≠ ejecutado, parcial ≠ total | Texto y pruebas de cobertura |

**Punto de parada obligatorio:** cualquier acceso real a un catálogo cuya licencia no esté confirmada, publicación remota de datos de cliente, ampliación de permisos, servicio de pago o integración en Production debe esperar autorización explícita. No basta el silencio del propietario.

## 12. Responsables, archivos compartidos e integración con otros agentes

| Ámbito | Responsable a coordinar | Regla |
|---|---|---|
| FT3D-8 (S2/S3, núcleo de planes/dossier) | Claude Code encargado | Editar solo rama propia y archivos permitidos |
| Presupuestar, budget UI, biblioteca y entrada principal | Propietario del módulo + dirección | Contrato primero; modificar código compartido solo con mandato coordinado |
| Entregar, PR #166, `api/share.js`, `api/view.js` | Claude original / propietario de Entregas | No duplicar publicación ni sobrescribir su rama |
| Visor, materiales y mallas por elemento | Kimi / propietario del visor | Contrato reutilizable, prueba de fidelidad, no copiar montajes |
| Sistema Perla / Mi estudio | Componentes existentes | Consumir tokens y snapshots; no crear identidad paralela |
| Decisiones de producto, licencia, publicación y merge | Propietario | Autorización escrita y trazable |
| Supervisión documental y auditoría | ChatGPT | Verificar evidencia y registrar contradicciones |

Antes de cualquier integración, preparar **tabla de conflictos de archivos y contratos**, comparar SHA base y PR, y decidir orden de integración. No fusionar ramas en master en el marco de las misiones M1/M2. Una Preview por rama no autoriza publicación comercial.

## 13. Programa de ejecución autónoma: dos misiones, múltiples cortes

### M1 — S2 + S3: datos y servicios (rama aislada)

**Entrada:** este documento aprobado, adaptadores reales verificados, evidencias legales y oficiales disponibles. **Cortes internos:** (M1-0) auditoría de contratos y servicios; (M1-1) BCCA UI/quotes/revisiones; (M1-2) Catastro referencia/GML/CRS; (M1-3) permisos/fallbacks; (M1-4) pruebas/QA/documentación.

**Salida:** BCCA funcional en modo autorizado o expresamente bloqueado por permisos (sin fingir finalización comercial); Catastro directo probado contra fuente oficial o limitación documentada, GML manual robusto; matrices de pruebas y riesgos. No hacer merge a master ni Production.

### M2 — S4: producto comercial (rama de integración autorizada)

**Entrada:** M1 documentado, corrección y aceptación Gate D, contrato de mallas/PR #166 coordinados, decisiones de presupuesto de edificio y revisión. **Cortes internos:** (M2-0) mapa de productores/consumidores + conflictos; (M2-1) biblioteca y persistencia; (M2-2) presupuesto global + plan editor; (M2-3) visor 4D, Perla y marca; (M2-4) Entregar, snapshot y cliente; (M2-5) QA integral y demo E2.

**Salida:** experiencia end-to-end real en Preview sin JSON manual; estado de enlace remoto sujeto a aprobación de acceso y publicación. La aplicación principal no debe tocarse hasta contar con el acuerdo de responsables y autorización de integración apropiada.

### Entrega de cada misión

SHA/branch, alcance implementado y no implementado, lista de archivos, contratos/versiones, pruebas y CI por SHA, screenshots desktop/móvil, vídeo y MP4 cuando corresponda, performance medido (no estimado), licencias, riesgos, decisiones pendientes y pasos de rollback. Evitar pedir aprobación tras checkpoints internos menores, pero detenerse ante los gates externos expresos.

---

# BLOQUE V — QA, gates y seguimiento

## 14. Matriz integral de pruebas de aceptación

| ID | Caso | Resultado exigido | Nivel |
|---|---|---|---|
| QA-01 | Vivienda A guardada, con plan y presupuesto | Flujo directo biblioteca→evolución→entrega, misma identidad | P0 |
| QA-02 | Vivienda distinta con documento incompatible | Rechazo, cero datos residuales | P0 |
| QA-03 | Reforma: existentes/nuevos/demolidos | Estado visual y temporal coherente | P0 |
| QA-04 | Edificio dos plantas con comunes e impuestos | Total fiable, desglose y sin doble contabilización | P0 si se aprueba opción 3 |
| QA-05 | Presupuesto parcial, `null`, unidad incorrecta | Ningún cero ficticio, cobertura visible, conversión rechazada | P0 |
| QA-06 | BCCA nueva edición | Precios previos intactos hasta decisión profesional | P0 |
| QA-07 | BCCA sin permiso gestionado | Bloqueo legal efectivo; BC3 usuario sigue funcionando | P0 |
| QA-08 | Catastro consulta válida | Parcela correcta, referencia/CRS/fuente y vínculo persistidos | P0 |
| QA-09 | Catastro caída, GML inválido o distinto | Fallback, rechazo seguro y colocación anterior preservada | P0 |
| QA-10 | Cambiar proyecto y revisión guardada | Correspondencias obsoletas, entrega anterior intacta | P0 |
| QA-11 | Crear/guardar/reabrir plan, vínculos y tareas | Edición desde Presupuestar sin importación JSON manual | P0 |
| QA-12 | Tareas simultáneas y sin geometría | Gantt/tarjeta/escena/importe en el mismo día; límites honestos | P0 |
| QA-13 | Reproducción, pausa, scrub y retroceso | Estado determinista y reversible | P0 |
| QA-14 | MP4 descargado, reproducido y comparado | Texto/fecha/fases/coste contextual como el estado interactivo | P0 |
| QA-15 | Mi estudio y snapshot histórico | Logo/cambios posteriores no alteran entrega antigua | P0 |
| QA-16 | Entrega HTML con y sin vídeo | Estado explícito, identidad coherente, sin editable/privado extra | P0 |
| QA-17 | Política territorial por canal | Sin parcela restringida ni ráster no autorizado en exportación | P0 |
| QA-18 | Cliente autorizado / no autorizado / enlace revocado | Seguridad efectiva en sesión distinta | P0 antes de publicación |
| QA-19 | 1280×720, 1366×768, 1440×900, 1920×1080 | Escena + controles + tarjeta + Gantt a la vista, sin scroll global habitual | P0 para UX escritorio |
| QA-20 | 390×844, teclado, zoom y movimiento reducido | Interfaz usable, controles accesibles, sin scroll horizontal accidental | P0/P1 según hallazgo |
| QA-21 | Safari/Firefox/móvil real (matriz acordada) | Vídeo y HTML compatibles o fallback/limitación visible | P1 requerido antes de anunciar soporte |
| QA-22 | Volumen de proyecto y presupuesto | Medición de rendimiento/memoria, límites y degradación informados | P1 |
| QA-23 | Regresión C1–C4, BC3, editor, Entregas y Story | Sin cambios involuntarios en los motores compartidos | P0 |
| QA-24 | Restauración, revisiones y rollback | Versiones antiguas legibles; no corrupción de documentos | P0 |

**Evidencias por prueba:** archivo/snapshot sintético versionado, instrucciones reproducibles, artefacto de CI vinculado a SHA, resultado esperado/obtenido, captura o vídeo si corresponde, clasificación `PASS/FAIL/BLOCKED/NOT_RUN`, explicación de `NOT_RUN`. El QA automatizado no equivale a aprobación UX del propietario ni a comprobación en dispositivo físico.

## 15. Gates de salida E2 y definición de cierre

| Gate | Criterio | No permite concluir |
|---|---|---|
| G-TECH | Contratos, pruebas puras, browser, regresiones y migraciones correctas | No certifica UX ni derechos |
| G-UX | Revisión visual real, escritorio/móvil, tareas comprensibles y evolución protagonista | No autoriza publicación |
| G-LEGAL | BCCA, territorio, contenidos y política de cliente documentados | No se infiere por CI |
| G-SEC | Sesiones, aislamiento, acceso/revocación y ausencia de datos restringidos | No se infiere de Preview READY |
| G-INT | Proyecto guardado→presupuesto→plan→evolución→MP4/HTML→cliente, mismo expediente | No fusiona automáticamente |
| G-OWNER | Aprobación final explícita del propietario para integración y después, separadamente, Production | No puede autootorgarse |

**Cierre FT3D-8 E2:** todos los requisitos P0 aplicables pasan y están respaldados por evidencia, los pendientes externos se resuelven o quedan explícitamente fuera del alcance E2 por una decisión nueva del propietario. No declarar `E2 READY` si BCCA gestionada o publicación al cliente siguen bloqueadas mientras se mantengan como requisitos obligatorios.

## 16. Registro de incidencias, decisiones y evidencias (vivo)

### 16.1 Plantilla de fila

`ID | requisito | evidencia/SHA | estado [propuesto, implementado, probado, bloqueado, aprobado] | responsable | riesgo | siguiente acción | decisión necesaria | fecha`.

### 16.2 Pendientes iniciales que no pueden perderse

| ID | Responsable | Situación | Acción antes del cierre |
|---|---|---|---|
| OPEN-01 | Claude Code Gate D + propietario | GD-UX-01: composición vertical de escritorio sin aceptación | Corregir, probar viewports bajos, revisión visual |
| OPEN-02 | Responsable Gate D | Grúa parcialmente fuera de encuadre en MP4 de prueba | Revisar y registrar resolución o limitación aceptada |
| OPEN-03 | Propietario | Opción 3 presupuesto global edificio sin aprobación formal de contrato | Aprobar diseño y migración o registrar alcance alternativo E2 |
| OPEN-04 | Propietario / economía | `subject.revision` opcional propuesto | Aprobar o conservar `unverifiable` con límites explícitos |
| OPEN-05 | Responsable BCCA + propietario | Autorización comercial declarada pero alcance escrito pendiente | Adenda y validación antes de catálogo gestionado |
| OPEN-06 | Responsable Catastro | Servicio por referencia, CORS/CRS/licencia no verificados operativamente | Prueba oficial, error y fallback |
| OPEN-07 | Claude original + propietario | PR #166 draft / integración Entregar pendiente | Contrato nuevo de entrega y revisión de conflictos |
| OPEN-08 | Kimi + propietario | Contrato de mallas compartidas pendiente | Diseño/read-only, fidelidad y pruebas |
| OPEN-09 | Propietario | Modelo de acceso de cliente no decidido | Decidir antes de pruebas de publicación real |
| OPEN-10 | Responsable integración | Proyecto activo/planes/presupuestos persistidos no cableados a FT3D-8 | Implementar S4-A/B/C y probar dos proyectos |
| OPEN-11 | Documentación | Roadmap global coloca FT3D-8 en E3 | Actualizar matriz E2 y añadir adenda sin borrar historia |
| OPEN-12 | QA/seguridad | MP4 fuera de Chromium, dispositivo físico, publicación remota sin validar | Matriz de compatibilidad y prueba autorizada |

### 16.3 Política de actualización

No reescribir un hecho histórico: añadir adenda de fecha/autor/commit que lo corrige. Cuando Claude finalice un corte, actualizar únicamente los estados respaldados por pruebas y proporcionar enlace a los artefactos. Cada nuevo SHA obliga a verificar que sus evidencias siguen correspondiendo a ese código.

---

# Anexo A — Fuentes de referencia y evidencia

1. [Roadmap FT3D-8 S2–S4](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ft3d-8-siguiente-mision-presupuesto-catastro-comercial-2026-11-05.md).
2. [Roadmap operativo global — reconciliación pendiente E2/E3](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/rubik-roadmap-operativo-reconciliado-2026-11-05.md).
3. [S1-B contrato expediente](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8-ux4d-gate-d-2026-11-05/docs/product/ft3d-8-s1b-contrato-expediente-2026-11-05.md).
4. [S1-E plan de integración](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8-ux4d-gate-d-2026-11-05/docs/product/ft3d-8-s1e-plan-integracion-futura-2026-11-05.md).
5. [S1-F matriz 38 puntos](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8-ux4d-gate-d-2026-11-05/docs/product/ft3d-8-s1f-matriz-38-correcciones-2026-11-05.md).
6. [Gate D informe final, no aceptación humana](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8-ux4d-gate-d-2026-11-05/docs/product/ft3d-8-ux4d-gate-d-informe-final-2026-11-05.md).
7. [Propuesta de integración profesional (no implementada)](https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8-ux4d-gate-d-2026-11-05/docs/product/ft3d-8-integracion-profesional-2026-11-05.md).
8. [Auditoría de permisos BCCA](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/legal/bcca-es-reuse-gate-2026-10-27.md).
9. [PR #166 — Delivery 3D V1](https://github.com/Juanmaes83/floorplan-3d/pull/166).
10. [CI Gate D del SHA `0fe6453`](https://github.com/Juanmaes83/floorplan-3d/actions/runs/42109440298).

# Anexo B — Matriz de trazabilidad resumida por capacidad

| Familia | Requisitos | Autoridad principal | Gate |
|---|---|---|---|
| UX y visual 4D | FT8-UX-01…06; FT8-S4-10…12 | Gate D, Schedule, Visual State, Perla | G-UX/G-INT |
| BCCA/BC3 | FT8-S2-01…09 | Cost Provider, BC3 bridge, C1–C4 | G-TECH/G-LEGAL |
| Catastro/territorio | FT8-S3-01…08 | Catastro Provider, Site/Placement/Export Policy | G-TECH/G-LEGAL |
| Biblioteca/presupuesto | FT8-S4-01…05 | Library, C1–C4, Dossier | G-TECH/G-INT |
| Plan profesional | FT8-S4-06…09 | FT3D-8 Schedule/Binding | G-TECH/G-INT |
| Entregas y cliente | FT8-S4-13…18 | Brand, Delivery, PR #166, share/view | G-SEC/G-INT/G-OWNER |

**Fin del borrador v1.0. Pendiente de revisión y aprobación del propietario. No guardar en GitHub antes de esa aprobación.**
