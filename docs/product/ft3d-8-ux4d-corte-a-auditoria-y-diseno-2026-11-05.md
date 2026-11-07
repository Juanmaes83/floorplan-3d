# FT3D-8 · UX/4D — Corte A: auditoría de capacidades, recorridos y diseño

**Rama:** `feat/ft3d-8-ux4d-gate-d-2026-11-05`, creada desde la cabeza remota de S1 `eebe64e`, que es
`38a7777` más la Etapa 0 (`05a8c4d`) y la corrección «sin IVA» (`eebe64e`). Las dos tienen la CI en verde
(ejecuciones 19 y 20). master sigue en `0f9c6ea`.
**Complementa:** [`ft3d-8-ux4d-etapa0-diagnostico-y-propuesta-2026-11-05.md`](./ft3d-8-ux4d-etapa0-diagnostico-y-propuesta-2026-11-05.md),
que contiene las mediciones, el contrato 4D, el mapa de correspondencias y los bocetos. Aquí no se repite.

**Limitación de la auditoría:** el vídeo `AUDITORIA VISUAL .mp4` **no está** en el repositorio ni en este
entorno. Se usa la descripción de su comportamiento que hace el encargo (terreno, medios auxiliares durante su fase,
estructura, cerramientos, carpintería, simultaneidad, Gantt acompañando y tarjeta cambiante). La comparación
fotograma a fotograma queda pendiente de que el vídeo se añada (por ejemplo, a `docs/research/`).

## 1. Matriz de capacidades

Tipos: **F** = fallo confirmado · **L** = limitación documentada · **UX** = mejora de experiencia · **OF** = otra fase.

| Capacidad | Existe | Funciona | Problema UX/4D | Tipo | Cambio en esta misión | Responsable |
|---|---|---|---|---|---|---|
| Visor 3D (`project-scene.js`) | Sí | Sí: fidelidad IoU 0,948–0,967 | Empieza en y = 845 de 900 px; 46 % del alto; HUD técnico superpuesto | UX | Visor arriba y grande; HUD técnico al nivel C | CC2 (lab) |
| Estado inicial (obra nueva) | Sí | Sí: 0 de 18 elementos, correcto según el plan | Se percibe como aplicación vacía: sin huella, explicación ni botón | F (comunicación) | Huella real en discontinua, «Antes del comienzo de la obra» y «Reproducir evolución» | CC2 |
| Reproducción y navegación temporal | Sí | Sí: reversible (prueba S1) | Controles correctos pero sin jerarquía | UX | Barra compacta con «Reproducir» destacado | CC2 |
| Gantt (`gantt-view.js`) | Sí | Sí: cursor y filas activas | Texto de 10–12 px; pulsar una tarea no hace nada | F (interacción) | Selección de tarea → fecha, tarjeta y resaltado 3D; texto de 13–14 px | CC2 |
| Elemento 3D → tareas | No | — | No se puede preguntar «qué trabajo afecta a esto» | UX | Pulsar un elemento lista sus tareas (`frameAt.layers`) | CC2 |
| Tareas simultáneas | Sí | Sí: `stateAt` devuelve un conjunto y la tarjeta lista todas | La simultaneidad no se nombra | UX | «Hay 2 trabajos previstos a la vez» | CC2 |
| Periodo sin tareas | Parcial | La tarjeta queda vacía | No se explica | F (comunicación) | «No hay trabajos programados durante este periodo» y «Ir a la siguiente actividad» | CC2 |
| Tarjeta contextual (`fidelity-app.renderCard`) | Sí | Sí | Densa, «75 % plan» ambiguo, coste sin cobertura | UX | Dos niveles: resumen y detalle; «% del plazo»; «asignado sin IVA» con cobertura | CC2 |
| Fases | No en el contrato | — | El plan no tiene fases: «fase» = tarea | L | Agrupación de presentación por la tarea o tareas activas, rotulada; sin modificar el plan (D-UX-2) | CC2; contrato de fases: propietario |
| Presupuesto contextual | Sí (`budgetReport`) | Sí: sin doble conteo (prueba C6) | Rotulado «total» siendo neto (**corregido** en `eebe64e`); cobertura solo en «Cobertura» | F (corregido) / UX | Cobertura parcial también en la tarjeta | CC2 |
| Expediente S1 (`dossier-ui.js`) | Sí | Sí: casos A–J | Seis tarjetas extensas encima del visor | UX | Resumen compacto con acción principal; las seis tarjetas, bajo demanda | CC2 |
| Lenguaje | Parcial | Expediente comprensible; HUD y cobertura técnicos | Códigos en inglés en el HUD | F | Mensajes en castellano; los códigos, solo en diagnóstico | CC2 |
| Modo cliente | Sí (toggle) | Solo oculta paneles | No es una experiencia de presentación | UX | Modo presentación: visor casi a pantalla completa, tarjeta mínima, sin diagnóstico | CC2 |
| Vídeo MP4 (`delivery-ui.record`) | Sí | Sí: H.264 indexado y reproducción verificada | Rótulos densos; importes ya «sin IVA» | UX | Rótulos en zonas seguras (fase, fecha y hasta 2 trabajos) | CC2 |
| Entrega (`delivery-ui.js`) | Sí | Sí: marca, vídeo, HTML, historial y publicación con mocks | Cinco pasos con muchos campos a la vez | UX | Previsualizar → Personalizar → Generar → Resultado | CC2; integración en Entregar: Claude original (S4) |
| Recursos ilustrativos (grúa, maquinaria) | No | — | El vídeo de referencia los muestra | OF | No se implementan: sin biblioteca con licencia ni contrato (D-UX-3) | Propietario |
| Terreno real | Parcial (MDT05 en el editor) | Solo en el editor; no forma parte del expediente | — | L | Base neutra rotulada «ilustrativa» | — |
| Mallas por elemento compartidas | No | — | El laboratorio replica el montaje | OF | Sin cambios | Kimi |
| Biblioteca real, Mi estudio, Entregar | No en el laboratorio | — | — | OF (S4) | Sin cambios | Claude original y propietario |

## 2. Recorridos detallados

### A · Profesional preparando el proyecto
| Paso | Ve al entrar | Acción principal | Después | Errores posibles → solución | Volver | Se conserva |
|---|---|---|---|---|---|---|
| Abrir el proyecto | Pestaña **Proyecto**: nombre, «Listo para ver su evolución» o lo que falta, 5 líneas de estado | **Ver evolución** (o «Resolver»: lleva a la primera incidencia) | Pestaña Evolución en el instante inicial | Presupuesto o plan de otra vivienda → «Carga el de este proyecto» [Cargar documentos] | Pestaña Proyecto | Fecha, tarea, cámara |
| Comprobar datos | «Ver expediente completo»: las 6 tarjetas S1 | — | — | Cada incidencia con «qué pasa · por qué · qué hacer» | Cerrar el panel | Todo |
| Revisar la planificación | Gantt en Evolución; detalle de tarea en la tarjeta | Pulsar una tarea | Cursor, tarjeta y resaltado 3D | Tarea sin 3D → «planificado, sin representación 3D» | «Volver a la vista general» | Fecha |
| Explorar la evolución | Visor, transporte y tarjeta | **Reproducir** | Avance con tarjeta y Gantt sincronizados | Periodo sin tareas → mensaje e «Ir a la siguiente actividad» | Pausa o retroceso | — |
| Revisar costes | Resumen en la tarjeta: «asignado sin IVA» y cobertura | «Ver tareas y partidas» | Detalle: partidas, IVA y procedencia | Presupuesto parcial → qué falta | Cerrar el detalle | Fecha y tarea |
| Preparar la entrega | Pestaña **Entrega** | **Previsualizar** | Resumen de lo que recibirá el cliente | Expediente incompatible → bloqueo explicado, sin botón de generar | Pestaña Evolución | Marca y opciones |

### B · Profesional presentando al cliente
Desde Evolución, «Modo presentación»: visor casi a pantalla completa, transporte, tarjeta mínima (momento, trabajos y
plazo) e importe solo si el profesional lo autoriza. Pausar, seleccionar una tarea, vista general y volver a
«Análisis» sin perder la fecha.

### C · Cliente final
Recibe el MP4 o el HTML: título y marca del estudio, vídeo con rótulos de fase, fecha y trabajos, tabla de fases con
fechas, importes autorizados «sin IVA» y el aviso «animación del plan previsto, no obra ejecutada». Sin IDs, huellas
ni códigos.

## 3. Comparación de distribuciones (escritorio 1440 × 900)

| Criterio | 1 · Visor + panel lateral | 2 · Visor + tarjeta inferior | 3 · Visor con línea de tiempo integrada y detalle en cajón |
|---|---|---|---|
| Protagonismo de la escena | Alto: el visor ocupa ≈ 75 % del ancho y ≈ 60 % del alto | Medio: la tarjeta resta alto a una escena ya apaisada | Muy alto, pero el Gantt queda reducido a una línea |
| Comprensión inmediata | Tarjeta siempre visible junto a la escena | Lectura vertical, más recorrido de ojos | Hay que abrir el cajón para entender el momento |
| Uso del espacio | Aprovecha el ancho sobrante de pantallas 16:9 | Desperdicia ancho y aprieta el alto | Óptimo para presentar, pobre para analizar |
| Interacción con el Gantt | Gantt completo debajo, con tarjeta y visor a la vez | Compite en alto con la tarjeta | Gantt solo bajo demanda |
| Móvil | Se apila: visor → transporte → tarjeta → Gantt | Igual | Igual |
| Complejidad | Baja (rejilla de 2 columnas) | Baja | Media |

**Recomendación:** opción 1 para Análisis (profesional) y opción 3 para el modo presentación y cliente (visor
dominante y tarjeta mínima flotante). En móvil, las tres se apilan en el mismo orden. Se implementa así en el Corte B,
**pendiente de aprobación**; el cambio entre distribuciones queda aislado en CSS.

> **Actualización (decisión del propietario, Gate D).** El propietario aportó tres capturas de la demo «La obra, día a
> día» como referencia obligatoria de composición. La distribución implementada pasa a ser esa: visor a todo el ancho
> con el título y el sello del momento superpuestos, barra de reproducción debajo, y tarjeta grafito (izquierda) junto
> al Gantt con leyenda (derecha). Es la opción 1 girada: tarjeta y Gantt comparten fila bajo el visor. En
> «Presentación» se oculta lo profesional y el visor gana alto. La correspondencia con la referencia, elemento a
> elemento, está en `ft3d-8-ux4d-gate-d-matriz-equivalencias-2026-11-05.md`.

## 4. Sistema Perla
El laboratorio cargará `css/design-system.css`, los tokens reales de RUBIK (acción petróleo `#1f5a66`, selección
grafito `#2b3034`, foco `#1f6f8b`, superficies `#eceeee` y `#ffffff`, AA ≥ 4,5:1), en lugar de repetir valores.
Sus selectores son del editor (`#uploadPlanBtn`, `.guide-*`, `body.guided`) o roles con `:where()`, por lo que no
alteran el laboratorio. La marca del estudio sigue limitada a la entrega.

## 5. Matriz de responsabilidades
| Ámbito | Archivos | Quién | En esta misión |
|---|---|---|---|
| Laboratorio FT3D-8 | `labs/ft3d-8/**` | Claude Code 2 | Se modifica |
| Núcleos FT3D-8 | `js/construction-*.js` | Claude Code 2 | Solo presentación (presenter, overlay, entrega); sin tocar cálculos |
| Motores RUBIK | `budget-core`, `project-core`, `building-core`, `quantity-*`, territorio | Propietario o Claude original | Solo lectura |
| Visor compartido y mallas | `index.html`, visor del editor | Kimi | Sin cambios; el contrato de mallas queda como dependencia |
| Entregar, Mi estudio, `api/*` | `js/delivery-*.js`, `api/share.js` | Claude original (PR Juanmaes83/floorplan-3d#166) | Sin cambios |
| Diseño y aceptación | — | Propietario | Aprueba la distribución, D-UX-1 a D-UX-5 y Gate D |

## 6. Orden de los cortes
B (experiencia principal) → C (4D bidireccional y tarjeta) → D (vídeo) → E (entrega) → F (QA, evidencias y
demostración). Cada corte se sube con su prueba y sus capturas. Ninguno toca archivos compartidos.
