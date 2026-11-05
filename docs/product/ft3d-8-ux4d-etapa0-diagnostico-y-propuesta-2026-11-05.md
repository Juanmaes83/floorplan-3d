# FT3D-8 · UX/4D — Etapa 0: diagnóstico medido y propuesta para aprobar

**Responde a:** «Auditoría crítica del prompt UX/4D» (60 errores de especificación).
**Base:** `38a7777` (S1), rama `feat/ft3d-8-s1-real-project-integration-2026-11-05`.
**Naturaleza:** solo diagnóstico y diseño. No modifica el laboratorio. La implementación (etapas 1–5) necesita
la aprobación de este documento.
**Evidencias:** `docs/product/ft3d-8-ux4d-etapa0/` (capturas y `medidas.json`, generados con Chromium sobre el
expediente A).

## 0. Lo que cambia respecto a la auditoría

La auditoría señala riesgos del **encargo**. Aquí se ha comprobado cada riesgo P0 contra el laboratorio real. Hay
tres resultados posibles: **confirmado** (el defecto existe en el código), **ya resuelto** (S1 lo cubre y hay que
conservarlo) o **pendiente de diseño** (no es un defecto, pero falta una decisión). Así la implementación ataca
problemas medidos y no supuestos.

## 1. Mediciones (1440 × 900 y 390 × 844, expediente A)

| Medida | Escritorio | Móvil | Lectura |
|---|---|---|---|
| Posición del visor 3D | empieza en y = 845 px; la pantalla mide 900 px | empieza en y = 2064 px | Al abrir se ven **55 px** del visor en escritorio; en móvil hay que bajar **2,4 pantallas** |
| Altura del visor | 414 px (46 % de la pantalla) | 439 px | El visor no es protagonista |
| Panel del expediente encima | 738 px | 1759 px | Ocupa la primera pantalla entera |
| Altura total de la página | 2800 px | 5754 px | 3,1 y 6,8 pantallas |
| Texto visible | 8814 caracteres | 8604 | Carga cognitiva alta |
| Botones visibles | 26 | 26 | Ninguno destacado como acción principal |
| Elementos presentes antes de la obra | 0 de 18 | 0 de 18 | Escena **vacía** al empezar (obra nueva) |
| Superficie no vacía del visor: inicio / mitad / final | 21 % / 25 % / 25 % | 47 % / 55 % / 56 % | En escritorio, el texto del HUD y el suelo ya suman el 21 %: la vivienda ocupa muy poco |
| Texto del Gantt | 12 px en tareas, 10 px en semanas | igual | Pequeño; títulos truncados («CIMENTACION (SIN GEOME…») |

Capturas: `desktop-01-al-abrir.png`, `mobile-01-al-abrir.png`, `desktop-escena-inicio.png`,
`desktop-escena-mitad.png`, `desktop-escena-final.png` y `desktop-02-evolucion-tareas-simultaneas.png`.

## 2. Verificación de los riesgos P0 contra el código

| Error de la auditoría | Resultado | Evidencia |
|---|---|---|
| 13 · Prioridad espacial del visor | **Confirmado** | §1: el visor queda debajo del panel del expediente; 55 px visibles al abrir |
| 14 · Escena aparentemente vacía | **Confirmado. Causa identificada: no es un fallo de render** | En obra nueva, el día anterior al plan ningún elemento tiene tarea iniciada (`frameAt`: 0 presentes). No hay terreno ni base visual, mensaje ni botón de reproducir. WebGL, cámara y carga funcionan: a mitad y al final la vivienda aparece |
| 15 · Estado inicial | **Confirmado** | El sello dice «INICIO · ESTADO PREVIO» y no hay más. Falta «Antes de comenzar la obra», la fecha de inicio y «Reproducir evolución» |
| 17 · Lenguaje interno | **Confirmado** | En el HUD sobre la escena: `REV 322e951f3c7a`, `escala verified`, `PLAN plan-approved`, `Bloqueos: approval-not-authenticated` y categorías en inglés (`foundation, excavation, structural-frame…`) |
| 11 · Acción principal | **Confirmado** | 26 botones con el mismo peso; «Ver evolución» está en el paso 5 del expediente, sin destacar |
| 10 · Repetición | **Confirmado** | Proyecto, plan y presupuesto aparecen en 4 sitios: pasos del expediente, HUD, «Cobertura y evidencias» y pasos 1–2 de la entrega |
| 29 · Simultaneidad | **Ya resuelto: conservar** | `stateAt` devuelve el conjunto de tareas activas. El 12/10/2027 la tarjeta muestra «Tabiquería» y «Cubierta» y el Gantt resalta las dos filas (`desktop-02…png`) |
| 30 · Fecha frente a correspondencia | **Parcial** | Fecha, cursor, tareas activas y tarjeta coinciden (pruebas S1). Falta que la escena **destaque** los elementos de la tarea consultada |
| 31 · Interacción bidireccional | **Confirmado** | Pulsar el nombre de una tarea no hace nada (la fecha no cambia y no hay selección). Pulsar la barra solo mueve la fecha. No se resaltan elementos y no hay selección desde el 3D |
| 28 · Progreso dentro de una tarea | **Confirmado (riesgo de interpretación)** | `visualProgress` es la fracción de **tiempo** transcurrido y el muro crece en altura en esa proporción. La tarjeta dice «75 % plan», que puede leerse como «75 % construido» |
| 33 · Fases | **Pendiente de diseño** | El plan FT3D-8 no tiene campo de fase: hoy «fase» es la tarea (WBS). No hay agrupación derivada |
| 34 · Previsto frente a ejecutado | **Ya resuelto en textos; revisar vocabulario** | «Simulación planificada e ilustrativa», «no certifica obra», «EN OBRA (SEGÚN PLAN)». Cambiar «% plan» por «% del plazo» |
| 38–39 · Importe de fase, IVA | **Confirmado: defecto en lo ya entregado** | El importe asignado es **neto** (`allocatedNet`), pero se rotula «total» en la tarjeta, «Total presupuestado asignado al plan» en el rótulo del vídeo e «Importe» en la tabla del HTML del cliente, sin decir «sin IVA». Se corrige como mejora aparte (§9) |
| 40 · Doble contabilización | **Ya resuelto: conservar** | Repartos en céntimos sobre C1–C4; prueba C6: ninguna partida se asigna por encima de su subtotal |
| 41 · Presupuesto parcial | **Parcial** | La nota «no equivale a la obra presupuestada» solo está en «Cobertura»; no aparece en la tarjeta ni en el vídeo |
| 44 · Interactivo frente a MP4 frente a HTML | **Ya separado técnicamente** | Laboratorio interactivo; HTML de solo lectura (sin Gantt interactivo); MP4 con rótulos. Falta definir cómo se ve cada uno (§7) |
| 48 · Coherencia histórica | **Ya resuelto: conservar** | Manifiesto 0.2.0 congelado con expediente, revisiones, marca y vídeo; historial de solo lectura |
| 49 · Territorio por canal | **Ya resuelto: conservar** | `exportPolicy` por canal; el HTML no lleva coordenadas (prueba de navegador) |
| 58 · Cambio de proyecto | **Ya resuelto; ampliar** | Prueba S1 con el input real de archivos. Falta repetirla con la **reproducción en marcha y una tarea seleccionada** |
| 27 · Recursos ilustrativos (grúas, maquinaria) | **Pendiente de decisión** | No existe ninguno ni hay contrato o biblioteca con licencia. §6.4 propone el contrato |
| 23 · Móvil | **Confirmado** | Visor a 2,4 pantallas; Gantt de 390 px con texto de 12 px |

## 3. Recorridos (tres contextos, mismos datos y motores)

| Contexto | Quién | Objetivo | Acción principal | Resultado visible |
|---|---|---|---|---|
| **Preparación** | Profesional, a solas | Comprobar y corregir el expediente | «Resolver incompatibilidades» o «Ver evolución», según el estado | Expediente listo, o una lista de lo que falta con su acción |
| **Presentación** | Profesional con el cliente delante | Enseñar la evolución | «Reproducir evolución» | Visor a pantalla casi completa, tarjeta compacta y línea de tiempo |
| **Consulta del cliente** | Cliente, después | Entender su vivienda sin ayuda | «Ver la evolución de tu vivienda» (HTML/MP4) | Vídeo con rótulos y fases, fechas e importes autorizados |

El recorrido de preparación es **Proyecto → Evolución → Entrega**, con navegación ligera de tres pestañas y no un
asistente rígido. La acción principal la decide el estado real:

| Estado del expediente | Acción principal | Secundarias |
|---|---|---|
| Hay incompatibilidades (errores) | Resolver incompatibilidades (lleva a la primera) | Ver evolución (si el plan es válido) |
| Sin plan | Añadir un plan de obra | Ver la vivienda en 3D |
| Coherente, sin entrega preparada | **Ver evolución** | Revisar presupuesto, revisar plan |
| Evolución vista | Preparar entrega | Volver a reproducir |
| Entrega generada | Previsualizar para el cliente | Descargar vídeo o presentación |

Cada incidencia lleva **qué pasa → por qué importa → qué hacer → botón**. Por ejemplo: «Este presupuesto pertenece
a otra vivienda» → «No se pueden mostrar sus importes» → «Carga el presupuesto de este proyecto» → [Cargar
presupuesto]. Si en S1 no hay forma de corregirlo dentro del laboratorio, se dice cómo hacerlo en RUBIK.

## 4. Arquitectura de información (tres niveles y un único lugar para cada dato)

| Dato | Siempre visible | Bajo demanda | Diagnóstico | Único lugar principal |
|---|---|---|---|---|
| Proyecto y estado del expediente | nombre, estado (Listo / Falta X / Incompatible) | plantas, escala, revisión legible | IDs, huellas, esquemas | Cabecera del expediente |
| Momento actual | fecha, semana, tareas activas, sello del plan | — | — | Tarjeta de evolución |
| Tareas | activas ahora | todas, con dependencias | IDs de tarea | Gantt |
| Presupuesto | importe asignado sin IVA del momento o «no disponible», más la cobertura si es parcial | partidas, IVA, total, procedencia | IDs de partida, huellas | Tarjeta (resumen) y panel de presupuesto (detalle) |
| Bloqueos | siempre, en la cabecera, con su acción | causa ampliada | códigos | Cabecera del expediente |
| Parcela | referencia y estado | comprobaciones numéricas, licencia | CRS, marco | Panel de ubicación |
| Limitaciones (no modelado) | una línea discreta en el visor: «Esta tarea no tiene representación 3D» | lista completa | categorías técnicas | Visor y tarjeta |

El HUD técnico que hoy cubre la escena pasa al nivel de diagnóstico. Sobre la escena solo quedan el nombre, el
sello del momento y, si la hay, una limitación relevante.

## 5. Bocetos (para aprobar la dirección; no son diseño final)

### 5.1 Escritorio · Evolución (pantalla principal)
```
┌ RUBIK · FIXTURE A · Vivienda una planta ─ [Proyecto] [Evolución●] [Entrega] ───── ● Listo para presentar ┐
│ ┌──────────────────────────────── VISOR 3D (≈ 70 % del alto) ────────────────────┐ ┌ TARJETA ─────────┐ │
│ │                                                                                │ │ SEM 06 · 12 oct  │ │
│ │                        vivienda encuadrada al centro,                          │ │ Trabajos ahora:  │ │
│ │                    sin texto técnico superpuesto                               │ │ ▸ Tabiquería     │ │
│ │                                                                                │ │   4–15 oct       │ │
│ │  [EN OBRA · SEGÚN PLAN]                                       [ISO][ALZ][PLA]  │ │ ▸ Cubierta       │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │   11–22 oct      │ │
│ [⏮][‹][▶ Reproducir][›][⏭] ──────────●────────────── 12 oct 2027  ×1 ×2 ×4        │ Asignado sin IVA │ │
│ ┌ GANTT (≥ 14 px, filas activas resaltadas, la tarea pulsada destaca sus elementos)┐│ 1.922,72 €       │ │
│ │ 01 Cimentación ■■■        (sin 3D)                                               ││ partidas parcial.│ │
│ │ 02 Muros        ■■■■■■■                                                          ││ [Ver detalle ▾]  │ │
│ │ 03 Tabiquería       ▓▓▓▓│░░   ← activa                                           │└──────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Objetivo medible: el visor empieza por encima de y = 120 px y ocupa al menos el 60 % del alto en 1440 × 900; el
modelo encuadrado ocupa al menos el 35 % del visor al final del plan.

### 5.2 Estado inicial (obra nueva, antes del plan)
```
┌ VISOR ────────────────────────────────────────────────────────────┐
│     ┌───────── contorno del solar o base neutra («ilustrativa») ──┐│
│     │        huella de la vivienda en línea discontinua           ││
│     └─────────────────────────────────────────────────────────────┘│
│   Antes de comenzar la obra · inicio previsto lun 6 sep 2027        │
│   7 tareas · 12 semanas                     [ ▶ Reproducir evolución ]│
└────────────────────────────────────────────────────────────────────┘
```
La huella procede de la geometría real (el contorno de los muros, sin volumen). La base es neutra y se rotula como
ilustrativa: nunca terreno ni topografía.

### 5.3 Móvil · Evolución
```
┌ FIXTURE A ────────── ● Listo ┐
│ [Proyecto][Evolución●][Entrega]│
│ ┌ VISOR (≈ 55 % del alto) ──┐ │
│ │      vivienda             │ │
│ └───────────────────────────┘ │
│ [‹] [▶] [›] ────●──── 12 oct  │
│ ┌ SEM 06 · 2 trabajos ───── ▾┐ │
│ │ Tabiquería · Cubierta      │ │
│ │ Asignado sin IVA 1.922,72 €│ │
│ └────────────────────────────┘ │
│ [Ver plan completo]  → panel  │
└───────────────────────────────┘
```

### 5.4 Entrega (cuatro estados)
`Previsualizar` (lo que verá el cliente, con un resumen de contenido y advertencias) → `Personalizar` (marca,
título, qué importes; campos avanzados plegados) → `Generar` (progreso; no se puede pulsar dos veces) →
`Resultado` («Tu presentación está preparada»: reproducir, descargar vídeo, descargar presentación, preparar otra
versión). Sin enlace público mientras no esté autorizado (S4).

## 6. Contrato de correspondencia 4D

### 6.1 Una sola fecha `t` y una sola evaluación
`t` → `Schedule.stateAt` (tareas activas, conjunto) → `Visual.frameAt` (estado por elemento) → `budgetReport` (importe
por tarea) → tarjeta (`Presenter.taskCard`), Gantt (cursor y filas activas), escena y rótulo del vídeo
(`Delivery.overlay`). **Todo eso ya existe y debe seguir siendo la única evaluación**: el rediseño no crea otra.

### 6.2 Mapa de correspondencias del expediente A (generado de los datos reales)

| Tarea (WBS) | Fechas del plan | Depende de | Elementos del modelo por rol | Partidas asignadas (reparto) | Importe asignado sin IVA |
|---|---|---|---|---|---|
| 01 Cimentación | 2027-09-06 → 2027-09-17 | — | **sin geometría en RUBIK** | — | sin partidas |
| 02 Muros de fachada | 2027-09-20 → 2027-10-08 | cimentación | 4 structure | partition-new 75 % | 5.768,17 € |
| 03 Tabiquería interior | 2027-10-04 → 2027-10-15 | muros (SS+10d) | 2 structure | partition-new 25 % | 1.922,72 € |
| 04 Cubierta (envolvente derivada) | 2027-10-11 → 2027-10-22 | muros | 1 envelope | — | sin partidas |
| 05 Carpinterías | 2027-10-25 → 2027-11-05 | cubierta, tabiques | 8 build | opening:door, window, sliding-door 100 % | 5.050,00 € |
| 06 Pintura y revestimientos | 2027-11-08 → 2027-11-19 | carpintería | 6 finish | paint 100 % | 2.566,74 € |
| 07 Pavimentos | 2027-11-15 → 2027-11-26 | acabados (SS+5d) | 3 build | floor:oak, floor:tile, skirting 100 % | 4.410,01 € |

Suma asignada = 19.717,64 € sin IVA = neto del presupuesto: ninguna partida se cuenta dos veces. La cimentación
aparece en el plan y en la tarjeta («sin representación 3D»), pero nunca en la escena.

### 6.3 Estados visuales por rol (los existentes de `ROLE_BEHAVIOUR`, sin cambios)

| Rol | Comportamiento | Qué se ve | Rótulo |
|---|---|---|---|
| site, build, structure, envelope, services | aparece | el elemento crece durante su tarea | «animación ilustrativa del plazo», no avance físico |
| finish, cladding | capa | tono crudo → material real | «acabado aplicado según plan» |
| temporary | transitorio | solo durante la tarea | — |
| demolition | retirada | rojo → desaparece | «en demolición» |
| tarea sin elementos | ninguno | nada en 3D; la tarjeta dice «sin representación 3D» | — |

Propuesta de vocabulario: «75 % plan» → «**75 % del plazo**»; «EN OBRA (SEGÚN PLAN)» se mantiene.

### 6.4 Recursos ilustrativos (grúas, maquinaria, señalización): contrato propuesto, **no implementado**
Se activarían solo si se cumplen todas estas condiciones:
1. Hay una tarea con rol `site` o `temporary` que los justifica. La relación es explícita en el plan, nunca
   deducida del título.
2. El recurso procede de una biblioteca con licencia verificada.
3. Se rotula «representación orientativa».
4. Su posición se declara como ilustrativa, fuera de la huella, y no se presenta como decisión constructiva.
5. Si el canal no lo permite, el vídeo y el HTML no lo llevan.

Sin la decisión D-UX-3, las tareas sin geometría siguen como hoy: visibles en el plan y la tarjeta, sin objetos
inventados.

### 6.5 Interacción bidireccional propuesta
- **Pulsar una tarea en el Gantt** (nombre o barra): el cursor va al punto medio de la tarea; la fila queda
  seleccionada; la tarjeta muestra esa tarea; sus elementos se **destacan** con un contorno, sin cambiar geometría ni
  material; aparece «Volver a la reproducción general».
- **Pulsar un elemento 3D:** se listan sus tareas (las de `frameAt.layers`).
- **Tarea sin geometría:** se selecciona en el Gantt y la tarjeta muestra «sin representación 3D»; no hay selección
  falsa en la escena.
- **Periodo sin tareas:** «No hay trabajos programados para este periodo · [Ir a la siguiente actividad]».

## 7. Tres productos con la misma historia
| | Laboratorio interactivo | HTML del cliente | MP4 |
|---|---|---|---|
| Interacción | completa (Gantt, selección, detalle) | reproducir el vídeo y leer fases, fechas e importes autorizados | ninguna |
| Información | todo, por niveles | resumen comercial y advertencias | rótulo de fase, fecha, hasta 2 tareas e importe sin IVA si se autoriza, en zonas seguras (márgenes del 5 %) |
| Revisiones | actuales | congeladas (manifiesto) | congeladas (manifiesto) |

Prueba de paridad: para 6 instantes, la tarjeta del laboratorio, el rótulo del fotograma del MP4 y las fases del HTML
dicen lo mismo.

## 8. Plan por cortes (cada uno con evidencia propia; ningún archivo compartido)
| Etapa | Contenido | Archivos | Criterio de salida medible |
|---|---|---|---|
| 1 · Escena protagonista | visor arriba y grande; estado inicial con huella y «Reproducir»; HUD técnico al diagnóstico; tres pestañas; acción principal según el estado | `labs/ft3d-8/*` | Visor por encima de y = 120 px y ≥ 60 % del alto; modelo ≥ 35 % del visor; ≤ 8 botones primarios visibles; 0 códigos internos fuera del diagnóstico; móvil: visor en la primera pantalla |
| 2 · Correspondencia 4D | selección de tareas en el Gantt, resaltado de elementos, elemento → tareas, periodos sin tareas, «% del plazo», Gantt de 14 px | `labs/ft3d-8/*`, `js/construction-lab-presenter.js` | Prueba de navegador con 8 instantes (antes, primera tarea, dos simultáneas, fin de tarea, cambio de tarea, carpintería, final, retroceso): escena, cursor, filas, tarjeta e importes coinciden |
| 3 · Vídeo | rótulos en zonas seguras e importes «sin IVA» | `js/construction-delivery-core.js`, `labs/ft3d-8/delivery-ui.js` | Fotogramas en 6 instantes = estado interactivo; texto ≥ 22 px a 720p |
| 4 · Entrega | previsualizar → personalizar → generar → resultado | `labs/ft3d-8/*` | Prueba de tarea: preparar una entrega sin abrir el diagnóstico |
| 5 · Aceptación | regresión (265 pruebas puras y 20 de Chromium), cambio de proyecto con reproducción activa, revisión humana | — | Revisión del propietario sobre el SHA final |

**Propiedad:** todos los archivos son de FT3D-8. Las etapas 1–5 no necesitan tocar `index.html`, el visor
compartido, Entregar ni los motores. La integración en Entregar, Mi estudio y la biblioteca es S4 y se coordina con
Claude original; el contrato de mallas por elemento, con Kimi.

## 9. Mejora inmediata que sí corresponde hacer ya (una sola)
**Rotular el importe asignado como «sin IVA»** en la tarjeta, el rótulo del vídeo y el HTML del cliente. Es un
defecto real en lo ya entregado (§2, errores 38–39): un cliente puede leer como total con IVA un importe neto. Se
entrega aparte, con su prueba.

## 10. Pruebas de tareas reales (aceptación de experiencia, sin inventar porcentajes)
Con una persona que no conozca el laboratorio, observar y anotar dónde duda:
1. Encontrar y reproducir la evolución.
2. Decir qué trabajos ocurren el 12/10/2027.
3. Decir cuánto está asignado a esa semana y si incluye IVA.
4. Detectar que el presupuesto del caso E no es de esa vivienda y saber qué hacer.
5. Preparar una entrega y decir qué recibirá el cliente.
6. Abrir el vídeo descargado y reconocer las fases.

## 11. Decisiones del propietario
| # | Decisión | Recomendación |
|---|---|---|
| D-UX-1 | Distribución: visor con panel lateral, con tarjeta inferior o con línea de tiempo integrada | Panel lateral en escritorio y tarjeta inferior plegable en móvil (§5) |
| D-UX-2 | Agrupación de fases cuando el plan no la define | Agrupación de presentación derivada del primer nivel de WBS, rotulada como tal; sin modificar el plan |
| D-UX-3 | Recursos ilustrativos (grúas y maquinaria) | Aplazar hasta tener biblioteca con licencia y la regla §6.4 aprobada |
| D-UX-4 | Base visual del estado inicial | Huella real en discontinua sobre una base neutra rotulada «ilustrativa» |
| D-UX-5 | Importe en el resumen | «Asignado sin IVA» con la cobertura; el IVA y el total en el detalle |
