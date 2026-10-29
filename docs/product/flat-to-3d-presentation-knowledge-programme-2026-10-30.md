# Programa de transferencia de conocimiento Flat-to-3D para Rubik Sota

**Fecha:** 30-10-2026  
**Estado:** propuesta documental para revisión de Juanma; **no cambia por sí sola el roadmap canónico ni aprueba implementación**.  
**Ámbito:** presentación arquitectónica interactiva, narrativa 2D→3D, secciones, alzados, axonometrías, recorrido y posibles extensiones temporales de obra.  
**Repositorio objetivo:** `Juanmaes83/floorplan-3d`.  
**Fuente externa principal estudiada:** vídeo `https://www.youtube.com/watch?v=UTCPqJZFg04` y código/documentación publicados por Samnang Aing en `Sam1983Aing/flat-to-3d` y `Sam1983Aing/casa-serra`.  
**Licencia de la referencia de código:** el repositorio `flat-to-3d` declara MIT; cualquier reutilización concreta deberá conservar las obligaciones de licencia y atribución aplicables.

---

## 0. Por qué existe este documento

Codex, Claude u otros agentes que trabajen sobre Rubik pueden leer el repositorio pero no deben depender de poder ver o interpretar el vídeo de referencia. Este documento transfiere el conocimiento útil del vídeo y de su código asociado a una especificación autocontenida para Rubik.

No pretende copiar una demo concreta. Pretende extraer los principios que hacen funcionar esas experiencias y convertirlos en capacidades reutilizables sobre **cualquier proyecto Rubik compatible**.

La idea rectora es:

> **Una vivienda debe poder pasar de representación arquitectónica a experiencia espacial sin cambiar de objeto: plano, sección, alzado, axonometría y recorrido son distintas lecturas del mismo modelo.**

El objetivo de producto no es añadir “efectos bonitos”. El objetivo es aumentar de forma radical la capacidad de **explicar, presentar y entregar una vivienda** utilizando la geometría, materiales, niveles, orientación, exterior y contexto que Rubik ya conoce.

---

# 1. Resultado final que perseguimos

## 1.1 Objetivo principal

Rubik debe poder transformar un proyecto ya preparado en una **narrativa arquitectónica interactiva y coherente** que el profesional pueda mostrar a un cliente.

La experiencia ideal parte de una representación familiar y legible —por ejemplo un plano— y evoluciona de forma continua hacia una experiencia tridimensional:

```text
PLANO / DIBUJO ARQUITECTÓNICO
        ↓
EL MISMO MODELO EMPIEZA A REVELAR PROFUNDIDAD
        ↓
VOLUMEN / MATERIALES / LUZ
        ↓
CÁMARA A ESCALA HUMANA
        ↓
RECORRIDO POR LA VIVIENDA
        ↓
EXTERIOR / CONTEXTO / CIERRE DE PRESENTACIÓN
```

No debe sentirse como “cerrar 2D y abrir 3D”. Debe sentirse como **descubrir que el dibujo ya era la vivienda**.

## 1.2 Experiencia esperada para el cliente

El cliente debe poder entender una vivienda sin necesitar conocimientos de CAD/BIM ni saber navegar un editor 3D.

La presentación debe:

- comenzar con una representación reconocible;
- explicar progresivamente la geometría;
- mantener continuidad espacial entre vistas;
- evitar saltos de cámara difíciles de interpretar;
- utilizar texto sólo cuando añade contexto;
- llevar al espectador desde escala de documento hasta escala humana;
- permitir volver atrás o repetir sin estados irreversibles;
- distinguir claramente representación, dato, estimación y realidad física cuando proceda;
- conservar el principio de Rubik: **más contexto, no más falsa certeza**.

## 1.3 Experiencia esperada para el profesional

El profesional no debe programar una animación ni construir una escena desde cero.

Debe poder elegir un proyecto y preparar una presentación mediante decisiones de alto nivel, por ejemplo:

```text
Tipo de presentación: Arquitectura
Inicio: Plano general
Mostrar: Axonometría + sección + exterior
Recorrido: Salón → cocina → dormitorio → terraza
Orientación solar: 21 junio, 18:00
Identidad: Mi estudio
```

Rubik debe derivar automáticamente todo lo que pueda demostrar desde el proyecto existente y pedir intervención sólo cuando una decisión sea realmente subjetiva.

---

# 2. Conocimiento técnico esencial de la referencia

## 2.1 El dibujo 2D puede ser el modelo 3D

El principio más importante observado en las demos es que, en varios casos, la representación aparentemente plana **no es una imagen 2D separada**. Es el modelo 3D real visto con una cámara de perspectiva con campo de visión extremadamente estrecho y gran distancia.

Cuando el campo de visión es muy pequeño, la convergencia de perspectiva casi desaparece y la escena se lee como axonometría, alzado o sección técnica. Al abrir progresivamente la lente y acercar la cámara, aparece la profundidad sin cambiar de geometría.

Patrón conceptual:

```text
MISMO MODELO
   │
   ├─ lente muy larga / FOV mínimo → parece dibujo plano
   │
   └─ lente normal / cámara cercana → se lee como espacio 3D
```

La transición se puede resolver mediante **dolly zoom**: variar simultáneamente distancia y FOV para conservar el tamaño aparente del encuadre mientras cambia la perspectiva.

### Aplicación Rubik

Rubik debe preferir, cuando sea viable, una **representación derivada del modelo** frente a crear una segunda escena visual desconectada.

Eso reduce inconsistencias entre:

- plano y 3D;
- sección y 3D;
- alzado y 3D;
- edificio y presentación;
- estados de materiales;
- huecos, puertas y ventanas;
- plantas y exterior.

---

## 2.2 La cámara es parte del producto, no un detalle técnico

En las referencias, gran parte de la calidad de la experiencia procede de una cámara diseñada con intención arquitectónica.

Patrones relevantes:

- cámara nivelada a altura de ojo para interiores;
- recorridos suaves por spline o por paradas;
- lentes largas para representación técnica;
- apertura gradual de lente para revelar profundidad;
- encuadres que conservan un plano de referencia estable;
- transición de escala documento → edificio → persona;
- minimizar orbitados arbitrarios que desorienten al usuario.

### Regla para Rubik

Una presentación profesional no debe reutilizar sin más la cámara libre del editor.

Debe existir una capa de **dirección de cámara** que conozca:

- objetivo visual;
- elemento o estancia protagonista;
- altura de ojo;
- FOV;
- clipping/corte;
- duración o progreso;
- orientación de entrada y salida;
- relación con la escena anterior y siguiente.

---

## 2.3 Una sección puede ser un corte real del edificio

Las demos `Section Sweep` y `Open Section` utilizan un plano de corte sobre el modelo 3D.

La sección se obtiene esencialmente mediante:

- plano de clipping;
- tratamiento visual de las superficies cortadas;
- cámara casi ortográfica mediante FOV muy pequeño;
- apertura progresiva de lente;
- conservación del tamaño del plano de corte durante la transición;
- revelado de habitaciones situadas detrás del corte.

### Aplicación Rubik

Rubik puede convertir una sección en una salida de presentación nativa:

```text
Sección técnica
   ↓
Sección con profundidad
   ↓
Materiales y luz
   ↓
Visita de las estancias visibles
```

El corte debe derivarse de la geometría que Rubik realmente conoce. Si una topología no permite generar un corte fiable, la presentación debe degradar de forma explícita en lugar de inventarlo.

---

## 2.4 Un alzado puede transformarse en fachada real

`Sunlit Elevation` demuestra otra variante del mismo principio:

```text
ALZADO APARENTEMENTE PLANO
        ↓
PROFUNDIDAD DE FACHADA
        ↓
MATERIALES
        ↓
LUZ / SOMBRAS
        ↓
PERSPECTIVA
        ↓
ENTRADA AL EDIFICIO
```

La referencia calcula incluso el rayado de sombra a partir de sombras reales del modelo.

### Aplicación Rubik

Rubik ya dispone de capacidades de fachada/exterior, norte, ubicación y Solar. Por tanto, una futura presentación de alzado puede combinar capacidades existentes sin fingir análisis nuevo.

Ejemplo de experiencia:

```text
Alzado sur
21 junio · 18:00
        ↓
Sombras derivadas de la configuración solar
        ↓
Materiales de fachada
        ↓
Apertura de perspectiva
        ↓
Exterior 3D
```

La presentación nunca debe convertir una simulación visual en certificación energética o solar profesional.

---

## 2.5 La axonometría explotada explica cómo está construido u organizado el edificio

`Exploded House` separa grupos/layers del edificio y los hace aterrizar en orden.

Para Rubik la oportunidad principal no es imitar el estilo gráfico, sino aprovechar **niveles y grupos semánticos existentes**.

Una vivienda multipiso podría presentarse así:

```text
Cubierta
   ↑
Planta primera
   ↑
Planta baja
   ↑
Parcela / terreno
```

O con subgrupos demostrables:

```text
Cubierta
Muros exteriores
Huecos
Plantas
Mobiliario
Contexto
```

No se debe inventar una secuencia constructiva real si el proyecto sólo conoce agrupación geométrica.

---

## 2.6 La transición dibujo → material puede ser espacial

Varias demos utilizan un “sweep” o frente de revelado que atraviesa el espacio y cambia la representación de dibujo a material real.

Este patrón es útil porque el usuario comprende que las dos representaciones pertenecen al mismo objeto.

Aplicaciones posibles:

- línea → material;
- blanco/maqueta → acabado;
- sección técnica → sección material;
- alzado dibujado → fachada;
- plano monocromo → habitación amueblada.

La transición debe ser reversible y determinista para que scroll hacia atrás o navegación atrás reconstruya exactamente el estado anterior.

---

## 2.7 El scroll puede representar progreso, pero no debe ser obligatorio

La referencia usa scroll como controlador continuo de la narrativa.

Principio transferible:

```text
progreso 0.00 → estado inicial
progreso 0.35 → transición
progreso 0.70 → recorrido
progreso 1.00 → estado final
```

En Rubik, el motor no debe estar acoplado exclusivamente al scroll. Debe poder recibir un `progress` normalizado controlado por:

- scroll;
- botones siguiente/anterior;
- reproducción automática;
- scrubber/timeline;
- exportación fotograma a fotograma en el futuro.

Esto permite accesibilidad, móvil, captura y futura producción de vídeo.

---

# 3. Las siete referencias y su valor para Rubik

| Referencia | Conocimiento transferible | Prioridad Rubik | Requiere nuevo modelo de datos |
|---|---|---:|---:|
| Exploded House | axonometría, capas, ensamblaje, dolly zoom, entrada al edificio | Alta | No para niveles/grupos existentes |
| Section Sweep | sección real, clipping, dibujo→material, entrada por el corte | Muy alta | No inicialmente |
| Open Section | sección multipiso, visitas por nivel, corte estable | Muy alta | No inicialmente |
| Build Time-Lapse | estados del edificio según tiempo/semana | Futura | **Sí** |
| Schedule Build | Gantt y modelo controlados por la misma línea temporal | Futura estratégica | **Sí** |
| Card Model | transición de escala maqueta→1:1 | Baja/marketing | No necesariamente |
| Sunlit Elevation | alzado→fachada→sol→recorrido | Muy alta | No para primera versión |

Conclusión: **las técnicas 1, 2, 3 y 7 son directamente compatibles con el modelo actual de Rubik; 4 y 5 representan una familia funcional nueva de planificación temporal y no deben introducirse accidentalmente como simples animaciones.**

---

# 4. Encaje con la arquitectura de producto de Rubik

La organización aprobada de Rubik se basa en:

```text
DISEÑAR
ANALIZAR
PRESUPUESTAR
ENTREGAR
MI ESTUDIO
```

La transferencia Flat-to-3D pertenece principalmente a **ENTREGAR**, reutilizando información de **DISEÑAR** y **ANALIZAR**.

No debe crear una sexta casa conceptual denominada “Animaciones” o similar.

Ruta conceptual:

```text
ENTREGAR
└── Presentación
    ├── Preparar presentación
    ├── Elegir narrativa
    ├── Revisar escenas
    ├── Reproducir
    └── Generar salidas compatibles
```

Las capacidades de representación también pueden servir dentro de ANALIZAR cuando su propósito sea inspección profesional —por ejemplo una sección—, pero la **narrativa dirigida al cliente** vive en ENTREGAR.

---

# 5. Arquitectura objetivo: Presentation Story

## 5.1 Concepto

Se propone estudiar una capa denominada provisionalmente **Presentation Story**.

No es un segundo edificio ni una copia de `FloorPlanProjectV1`. Es una descripción de cómo presentar el estado actual del proyecto.

Modelo conceptual:

```text
FloorPlanProject / FloorPlanBuilding
        │
        ├── geometría
        ├── materiales
        ├── niveles
        ├── exterior
        ├── orientación / solar
        └── contexto
                │
                ▼
        Presentation Story
                │
        ┌───────┼─────────┐
        │       │         │
      plano   sección   alzado
        │       │         │
        └───────┼─────────┘
                ▼
              3D
                ▼
            recorrido
```

## 5.2 Qué describe una escena

Una escena narrativa debería poder expresar, según el corte aprobado:

```text
id
kind
label
camera
focusTarget
level / room
projection or FOV
clipping planes
visible groups
representation mode
materials mode
lighting state
solar state
transition in/out
caption
progress range
```

No se aprueba aquí ningún schema persistente concreto. Primero debe demostrarse que puede funcionar como estado derivado/runtime sobre los contratos actuales.

## 5.3 Tipos de escena candidatos

- `plan`
- `plan-rise`
- `axon`
- `exploded-levels`
- `section`
- `section-perspective`
- `elevation`
- `exterior`
- `room`
- `walk`
- `solar`
- `site`
- `closing`

Los nombres son conceptuales. No fijan API.

---

# 6. Experiencias objetivo por perfil

## 6.1 Inmobiliaria

Objetivo: que un comprador entienda rápidamente distribución y sensación espacial.

Narrativa candidata:

```text
Plano general
→ paredes ganan altura
→ vista 3D general
→ salón
→ cocina
→ dormitorio principal
→ terraza/exterior
→ cierre con identidad del profesional
```

Debe ser corta, clara y visual.

## 6.2 Promotora

Objetivo: explicar vivienda, edificio y relación con emplazamiento.

```text
Parcela / implantación
→ exterior
→ axonometría del edificio
→ plantas
→ vivienda tipo
→ estancias principales
→ materiales
→ cierre
```

## 6.3 Estudio de arquitectura

Objetivo: explicar una propuesta sin pretender sustituir documentación técnica.

```text
Plano
→ axonometría
→ sección
→ niveles
→ fachada/alzado
→ comportamiento solar contextual
→ recorrido espacial
→ exterior / parcela
```

## 6.4 Reformas e interiorismo

Objetivo: explicar intervención y acabados.

Primera versión posible sin modelo temporal de obra:

```text
Plano
→ estancia
→ distribución
→ mobiliario
→ acabados/materiales
→ recorrido
→ presupuesto resumido / entrega
```

Una comparación “antes/después” sólo debe añadirse si Rubik dispone de dos estados explícitos y no mediante inferencia inventada.

---

# 7. Programa de implementación por fases

Este programa **no modifica automáticamente la numeración canónica**. Antes de implementar cada corte debe revisarse `current-status` y el roadmap vigente. Si Punto 9 continúa siendo el trabajo aprobado, las mejoras puramente de organización/descubribilidad pueden integrarse allí; los motores nuevos deben recibir aprobación separada.

## Fase FT3D-0 — Investigación y contrato de experiencia

**Objetivo:** convertir este conocimiento en una prueba técnica mínima sin tocar contratos persistentes.

Entregables:

- inventario de cámaras/renderers actuales;
- mapa de reutilización de `FloorPlanPresentationCore`, `View3D`, Building UI, exterior y Solar;
- prueba de dolly zoom sobre un proyecto Rubik real;
- prueba de cámara técnica con FOV estrecho;
- prueba reversible controlada por `progress` 0..1;
- definición de presupuesto de rendimiento.

**PASS de experiencia:** un proyecto existente puede verse primero como representación casi plana y abrirse a perspectiva sin salto perceptible ni reconstruir otra vivienda.

**No incluir:** nuevos schemas, timeline de obra, Gantt, nueva navegación global.

---

## Fase FT3D-1 — Plano vivo → 3D → primera estancia

**Objetivo:** implementar la idea fundamental del vídeo con máximo valor y mínimo alcance.

Experiencia esperada:

```text
Plano legible
→ paredes/volumen se revelan
→ cámara desciende
→ perspectiva aparece de forma continua
→ llegada a la primera estancia elegida
```

Requisitos:

- mismo proyecto/edificio durante toda la transición;
- reversibilidad completa;
- conservar materiales y mobiliario existentes;
- fallback cuando WebGL/rendimiento no sea suficiente;
- no escribir geometría durante la reproducción;
- salida limpia devuelve exactamente al editor previo.

**PASS humano:** el usuario describe la experiencia como “el plano se convierte en la vivienda”, no como “cambia de pantalla”.

---

## Fase FT3D-2 — Motor reusable de Presentation Story

**Objetivo:** dejar de codificar una secuencia fija y disponer de escenas y transiciones reutilizables.

Capacidades mínimas:

- secuencia de escenas;
- control por progreso;
- siguiente/anterior;
- reproducción automática opcional;
- callbacks de entrada/salida;
- captions;
- restauración de estado;
- generación determinista de cámaras cuando sea posible;
- edición manual de orden/selección sin editar geometría.

**PASS técnico:** una segunda narrativa se puede montar sin duplicar el motor de transición.

---

## Fase FT3D-3 — Sección dinámica

**Objetivo:** convertir geometría existente en una sección presentable que pueda abrirse a profundidad.

Experiencia:

```text
Sección frontal legible
→ mantener tamaño del corte
→ abrir perspectiva
→ revelar espacios detrás
→ visitar una o más estancias
```

Requisitos:

- plano de corte explícito;
- superficie de corte visualmente diferenciada;
- degradación honesta en geometrías no soportadas;
- compatibilidad multipiso dentro de límites vigentes;
- no atribuir escala técnica certificada si no está demostrada.

**Valor:** muy alto para arquitectura, promotoras y viviendas multipiso.

---

## Fase FT3D-4 — Alzado / fachada narrativa

**Objetivo:** utilizar exterior, materiales, orientación y Solar en una presentación de fachada.

Experiencia:

```text
Alzado
→ profundidad
→ materiales
→ estado solar contextual
→ perspectiva exterior
→ entrada o transición a interior
```

Requisitos:

- derivar fachadas de la autoridad existente;
- respetar norte y contexto configurados;
- distinguir fecha/hora de presentación de cualquier cálculo normativo;
- no inventar materiales ausentes.

---

## Fase FT3D-5 — Axonometría y edificio explotado

**Objetivo:** explicar niveles y composición espacial de edificios complejos.

Primera versión:

- separar niveles por su orden/elevación;
- mostrar cubierta/contexto sólo si existen y son demostrables;
- animar ensamblaje/desensamblaje reversible;
- seleccionar un nivel y continuar hacia su presentación.

No asumir secuencia constructiva real.

---

## Fase FT3D-6 — Plantillas de narrativa por perfil

**Objetivo:** que el profesional obtenga valor sin diseñar manualmente cada historia.

Plantillas iniciales candidatas:

- Inmobiliaria;
- Promotora;
- Arquitectura;
- Reforma/interiorismo;
- Personalizada.

Cada plantilla debe ser un conjunto de decisiones de presentación, no una copia del proyecto.

El profesional debe poder eliminar escenas, reordenarlas y cambiar estancias principales.

---

## Fase FT3D-7 — Salidas y compartición

**Objetivo:** reutilizar Presentation Story en salidas profesionales.

Orden recomendado:

1. reproducción dentro de Rubik;
2. capturas estáticas reproducibles;
3. lote de presentación con metadatos de escena;
4. enlace/experiencia alojada sólo cuando la política de hosting/privacidad lo permita;
5. vídeo/exportación temporal si existe un pipeline demostrado.

No asumir que una presentación interactiva puede compartirse públicamente hasta resolver explícitamente hosting, persistencia y privacidad.

---

## Fase FT3D-8 — Timeline de construcción (familia futura separada)

**Estado conceptual:** no confundir con las fases anteriores.

Las demos `Build Time-Lapse` y `Schedule Build` aportan un conocimiento distinto: **el tiempo se convierte en una dimensión del modelo**.

Patrón:

```text
fase / fecha / semana
        ↓
qué elementos existen
        ↓
estado 3D
        ↓
Gantt / timeline
```

Para hacerlo correctamente Rubik necesitaría un contrato explícito para fases, fechas, dependencias o agrupación temporal. No debe inferirse desde la geometría.

Aplicaciones futuras:

- planificación visual de obra;
- reforma por fases;
- comunicación promotora;
- secuencia de ejecución;
- seguimiento comparativo si existe dato real.

No implementar hasta aprobación de producto y contrato específico.

---

# 8. Principios técnicos obligatorios

## 8.1 Una autoridad geométrica

Presentation Story nunca debe convertirse en una segunda fuente de verdad del edificio.

Debe consumir:

- `FloorPlanProjectV1`;
- `FloorPlanBuildingV1`;
- derivaciones existentes de exterior/contexto;
- materiales y recursos autorizados.

Las mallas o estados de animación derivados son runtime/cache, no autoridad del proyecto.

## 8.2 Determinismo y reversibilidad

Dado el mismo proyecto y el mismo progreso, la presentación debe producir el mismo estado visible.

Retroceder debe reconstruir correctamente el estado anterior.

Evitar animaciones acumulativas del tipo “sumar transformación a lo ya transformado”. Preferir funciones de estado puro:

```text
renderState = f(project, story, progress)
```

## 8.3 No mutar el proyecto para presentar

Reproducir una historia no debe:

- mover muebles permanentemente;
- cambiar materiales persistidos;
- alterar plantas activas sin restaurarlas;
- modificar orientación;
- guardar clipping como geometría;
- cambiar el edificio.

Cualquier estado temporal debe restaurarse al salir.

## 8.4 Progressive enhancement

El resultado debe degradar según capacidad:

```text
interactivo completo
→ transición simplificada
→ presentación 3D por paradas
→ capturas estáticas
```

Nunca bloquear una entrega profesional sólo porque el dispositivo no soporte el efecto más avanzado.

## 8.5 Rendimiento móvil

Cada fase debe medir:

- tiempo hasta primera escena útil;
- FPS durante transición;
- memoria aproximada cuando sea posible;
- DPR adaptativo;
- carga de modelos GLB;
- impacto de ortofoto/terrain;
- comportamiento en horizontal/vertical.

Las referencias externas están principalmente optimizadas para laptop; Rubik no debe copiar esa limitación sin medirla.

## 8.6 Accesibilidad y control

Scroll no puede ser la única interacción.

Debe existir al menos:

- siguiente;
- anterior;
- salir;
- pausa cuando haya autoplay;
- estado de foco claro;
- soporte de `prefers-reduced-motion` con versión reducida.

---

# 9. Lenguaje visual: qué aprender y qué no copiar literalmente

## Aprender

- continuidad entre dibujo y espacio;
- representación técnica como estado del mismo modelo;
- cámara arquitectónica;
- revelado progresivo;
- narrativa espacial;
- transiciones reversibles;
- uso de clipping;
- escala humana;
- relación entre sol, fachada y percepción;
- una sola fuente de datos conduciendo múltiples representaciones.

## No copiar automáticamente

- tipografía concreta;
- paleta gráfica;
- estilo de “papel/plotter”;
- textos de las demos;
- orden exacto de habitaciones;
- decisiones de arquitectura ficticia;
- cada shader si no mejora la claridad de Rubik;
- dependencia obligatoria de scroll;
- escenas construidas a mano para una única casa.

Rubik debe conservar identidad propia y convertir los patrones en sistema general.

---

# 10. Criterios de aceptación transversales

Una fase Flat-to-3D sólo puede considerarse buena si cumple simultáneamente producto, fidelidad y operación.

## 10.1 Comprensión

Una persona no familiarizada con Rubik debe entender qué está viendo y dónde se encuentra dentro de la vivienda.

## 10.2 Continuidad

No debe existir un cambio perceptible de “modelo A” a “modelo B” cuando la intención es representar el mismo edificio.

## 10.3 Fidelidad

Puertas, ventanas, muros, muebles, materiales y niveles visibles deben corresponder al proyecto actual.

## 10.4 Restauración

Salir de presentación devuelve:

- planta activa;
- cámara/editor;
- selección;
- historial compatible;
- proyecto sin mutaciones derivadas de la reproducción.

## 10.5 Honestidad

Una sección visual no implica plano de ejecución. Una sombra solar no implica certificación. Un exploded view no implica secuencia constructiva. Una presentación no debe elevar la certeza del dato.

## 10.6 Rendimiento

La experiencia debe tener presupuesto y evidencia en hardware representativo antes de declararse lista para público profesional.

---

# 11. QA recomendado por fase

Cada entrega debería incluir al menos:

- fixture simple de una planta;
- fixture multipiso cuando aplique;
- proyecto con mobiliario GLB;
- proyecto con materiales de superficie;
- caso con exterior;
- caso con datos parciales/no disponibles;
- prueba ida/vuelta del progreso;
- prueba de salida/restauración;
- prueba de resize;
- prueba móvil;
- `prefers-reduced-motion`;
- comparación visual de puntos clave;
- regresión de las Presentaciones existentes.

Para técnicas de cámara, guardar checkpoints reproducibles, por ejemplo:

```text
progress = 0.00
progress = 0.25
progress = 0.50
progress = 0.75
progress = 1.00
```

Esto facilita detectar saltos y regresiones sin depender de observar una animación completa.

---

# 12. Riesgos principales

## R1 — Convertir un efecto específico en arquitectura global

Mitigación: primero demostrar la primitiva reusable; después generalizar.

## R2 — Duplicar el renderer o el edificio

Mitigación: Presentation Story consume los motores existentes; no crea una segunda autoridad.

## R3 — Hacer una demo espectacular sólo para el proyecto de ejemplo

Mitigación: aceptación mínima en varios fixtures/proyectos reales compatibles antes del cierre.

## R4 — Dañar rendimiento móvil

Mitigación: progressive enhancement, DPR adaptativo y gates de rendimiento.

## R5 — Confundir narrativa con análisis técnico

Mitigación: mantener etiquetas y límites de certeza heredados de Rubik.

## R6 — Meter timeline de obra sin contrato

Mitigación: FT3D-8 permanece separado hasta que producto y datos lo aprueben.

## R7 — Sobrecargar Punto 9

Mitigación: Punto 9 puede hacer descubrible `Entregar → Presentación`, pero nuevos motores de sección, cámara narrativa o timeline requieren su propio corte aprobado si exceden frontend/usabilidad.

---

# 13. Orden recomendado de valor

Si hubiera que aplicar el conocimiento de forma incremental, el orden recomendado es:

```text
1. Plano vivo → 3D → primera estancia
2. Presentation Story reusable
3. Sección dinámica
4. Alzado/fachada + Solar
5. Axonometría / edificio explotado
6. Plantillas por perfil
7. Salidas/compartición
8. Timeline de construcción, como programa separado
```

Motivo: los primeros siete pasos reutilizan en gran medida conocimiento que Rubik ya posee. El octavo exige introducir una nueva dimensión semántica —tiempo/fases— y debe evaluarse como producto independiente.

---

# 14. Definición de éxito del programa completo

El programa habrá cumplido su objetivo cuando ocurra lo siguiente:

> Un profesional abre un proyecto Rubik ya diseñado, pulsa **Preparar presentación**, elige una narrativa adecuada a su trabajo y obtiene una experiencia en la que el cliente comienza entendiendo el plano, descubre el edificio en profundidad, recorre sus espacios y termina comprendiendo la vivienda y su contexto, sin que el profesional haya tenido que reconstruir la escena ni programar animaciones.

Y técnicamente:

> **Plano, sección, alzado, axonometría, exterior y recorrido proceden de una misma autoridad geométrica y se diferencian principalmente por cámara, clipping, representación, luz, visibilidad y narrativa.**

Ese es el conocimiento central que debe preservarse aunque cambie la implementación concreta.

---

# 15. Instrucciones para futuros agentes

Antes de implementar una tarea basada en este documento:

1. leer el `current-status` más reciente y verificar el HEAD real de `master`;
2. leer `docs/ROADMAP.md` y la especificación del punto actualmente aprobado;
3. leer `docs/product/building-presentation-2026-10-19.md` y documentación posterior de Presentación;
4. no considerar este documento aprobación automática de una fase;
5. escoger **un solo corte** FT3D y mantenerlo acotado;
6. reutilizar renderer, datos y contratos existentes antes de crear infraestructura paralela;
7. documentar explícitamente qué patrón de la referencia se está aplicando y cómo se adapta a Rubik;
8. incluir QA, preview y revisión humana según `docs/DEVELOPMENT-WORKFLOW.md`;
9. actualizar roadmap/estado canónico sólo después de aprobación y merge;
10. conservar la regla: **más capacidad de comunicar, sin más falsa certeza**.

---

# 16. Referencias externas de conocimiento

Material utilizado para esta transferencia:

- vídeo proporcionado por Juanma: `https://www.youtube.com/watch?v=UTCPqJZFg04`;
- `https://github.com/Sam1983Aing/flat-to-3d`;
- `01-exploded-house` — axonometría, dolly zoom y capas;
- `02-section-sweep` — sección, shader de dibujo, sweep y recorrido;
- `03-open-section` — clipping, tamaño estable del corte y visita por niveles;
- `04-build-time-lapse` — piezas asociadas a semanas/fases;
- `05-schedule-build` — una tabla temporal gobierna Gantt y modelo;
- `06-card-model` — continuidad de geometría entre escalas;
- `07-sunlit-elevation` — alzado, sombras, materiales y entrada al edificio;
- `https://github.com/Sam1983Aing/casa-serra` — idea original plano→casa y prompt de arranque.

Estas referencias explican mecanismos e inspiración. **La autoridad de producto y de implementación de Rubik sigue estando en este repositorio y en sus documentos canónicos.**
