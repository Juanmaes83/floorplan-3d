# Punto 9 — UX profesional y descubribilidad de capacidades 5–8

**Fecha:** 28-10-2026  
**Estado:** **Punto 9 — candidato en revisión**
**Naturaleza:** frontend, arquitectura de información y usabilidad.  
**Alcance estricto:** reorganizar, jerarquizar y hacer descubribles capacidades existentes sin cambiar su contenido funcional.

## 0. Decisión de producto

Punto 9 se redefine como un corte de **UX — Reorganización profesional y descubribilidad de los Puntos 5–8** y pasa a ser el siguiente trabajo aprobado antes de cualquier nueva capacidad funcional.

No se elimina ninguna función. No se cambia ningún motor, contrato, schema, provider, cálculo, dato persistido ni semántica de negocio. El objetivo es cambiar la **cara, jerarquía, navegación, agrupación, estados y descubribilidad** de lo que ya existe.

El antiguo siguiente corte, **Instalaciones ligeras**, pasa a ser **Punto 10**.

## 1. Pregunta rectora

En cada pantalla y en cada estado, Rubik debe responder con claridad:

> **¿Qué debe entender y hacer aquí el usuario?**

La pregunta se aplica tanto a quien usa Rubik por primera vez como al profesional que prepara una entrega.

Reglas UX heredadas y reafirmadas:

- una acción dominante por estado;
- el texto dice qué ocurrirá;
- lo esencial debe ser accesible y descubrible;
- acción y selección no compiten visualmente;
- consolidar significa **reubicar o agrupar**, no quitar funciones;
- las vías rápidas existentes pueden mantenerse como atajos si desembocan en una casa conceptual clara;
- el usuario no necesita conocer el roadmap ni los números internos de desarrollo.

## 2. Hallazgo que origina este corte

Durante la revisión humana del Punto 5, la **Ficha de superficies** existía, funcionaba y tenía valor profesional, pero no resultaba localizable sin conocer su ruta dentro de `Tareas y ayuda → Entregar al cliente`.

Eso demuestra un problema de arquitectura de información: Rubik ya tiene más valor funcional del que comunica su navegación actual.

El riesgo aumenta desde los Puntos 5–8, donde conviven capacidades de superficies, orientación, Solar, presupuesto, exterior, parcela, ortofoto, terreno, presentación, lámina, observaciones y exportaciones en accesos distintos.

## 3. Principio de organización

Rubik no se organizará por “Punto 5”, “Punto 6”, “Punto 7” o “Punto 8”. Esos números son internos.

La organización principal será por **intención del usuario**:

```text
DISEÑAR
ANALIZAR
PRESUPUESTAR
ENTREGAR
MI ESTUDIO
```

`Mi estudio` es configuración profesional transversal y no pertenece a un proyecto concreto. Las otras cuatro áreas sí forman parte del trabajo del proyecto.

## 4. DISEÑAR

Pregunta del usuario:

> ¿Qué quiero modificar en la vivienda?

Conserva la lógica ya conocida:

- Construir: estancias, muros, puertas, ventanas, huecos, plantas, escaleras y medidas de construcción;
- Amueblar: mobiliario, objetos, materiales y acabados;
- Propiedades: edición contextual del elemento seleccionado.

No se pretende rediseñar los motores ni cambiar el comportamiento de selección/edición.

## 5. ANALIZAR

Pregunta del usuario:

> ¿Qué sé de esta vivienda y de su contexto?

Debe convertirse en una casa única para capacidades de lectura y contexto.

### 5.1 Medidas y superficies

Agrupa:

- escala;
- calibración;
- superficie útil;
- estancias incluidas/excluidas;
- pavimentos;
- estado de certeza de las medidas.

Ejemplo de estado:

```text
87,18 m² · Estimado
Escala sin calibración confirmada
```

Acciones contextuales posibles:

- Revisar superficies;
- Calibrar.

### 5.2 Orientación y sol

Agrupa:

- norte;
- ubicación;
- zona horaria;
- fecha/hora;
- Solar.

Ejemplos de estado:

```text
Norte sin configurar
```

o:

```text
Norte 37° · ubicación definida
```

### 5.3 Emplazamiento

Agrupa el contexto territorial:

- parcela;
- colocación explícita del edificio;
- ortofoto;
- terreno;
- capas territoriales.

El usuario no debe necesitar conocer términos internos como `GeoProvider`.

Ejemplo de resumen:

```text
Parcela: disponible
Edificio: colocado
Ortofoto: cargada
Terreno: cargado
```

### 5.4 Exterior

Agrupa capacidades de 8A/8B:

- fachadas;
- cubierta;
- petos;
- volúmenes exteriores;
- vista exterior 3D.

## 6. PRESUPUESTAR

Pregunta del usuario:

> ¿Cuánto supone lo que he diseñado y de dónde salen estos precios?

Debe ser una sección propia y comprensible, no una colección de contratos técnicos.

Cabecera de estado sugerida:

```text
12 partidas
9 con precio
3 pendientes
7 revisadas
```

El total sólo se presenta cuando el contrato actual permite calcularlo sin falsa certeza.

## 7. Modelo mental de cantidades y precios

La UI distinguirá siempre cuatro conceptos:

### 7.1 Cantidad automática

Rubik la obtiene de la geometría cuando puede demostrarla.

Etiqueta de usuario sugerida:

```text
Calculado desde el proyecto
```

### 7.2 Precio de referencia

Procede de una fuente/importación soportada.

Debe presentarse como **referencia**, no como precio definitivo.

### 7.3 Precio propio

Lo introduce el profesional de forma explícita mediante las capacidades manuales existentes.

Debe conservar su procedencia humana.

### 7.4 Precio revisado

Es una decisión profesional explícita sobre el precio usado para el presupuesto.

No significa que Rubik garantice el coste real.

## 8. Fuentes de precios

Dentro de Presupuestar debe existir una casa conceptual para fuentes:

- Tarifa propia;
- Importar BC3;
- fuentes de referencia realmente disponibles.

No se expondrá infraestructura técnica como si fuese una capacidad operativa.

En particular, BCCA no debe mostrarse como fuente conectada/automática mientras el modo gestionado por Rubik no esté realmente habilitado y demostrado.

## 9. ENTREGAR

Pregunta del usuario:

> ¿Qué voy a mostrar o entregar a mi cliente?

`Entregar al cliente` deja de ser una fila secundaria al final de un panel y se convierte en un **workspace de entrega** claramente identificable.

Debe mostrar estado, no sólo botones.

## 10. Tarjeta — Ficha de superficies

Ejemplo:

```text
Ficha de superficies
87,18 m² · Estimado
11 estancias incluidas
2 zonas fuera del cómputo

[Ver ficha]
```

Si las medidas están calibradas, el estado debe comunicarlo de forma explícita.

## 11. Tarjeta — Lámina profesional

Ejemplo:

```text
Lámina profesional
Lista
Escala 1:100
Marca: Estudio X

[Abrir lámina]
```

## 12. Tarjeta — Presentación 3D

Ejemplo:

```text
Presentación 3D
Planta única
11 espacios disponibles
Exterior disponible

[Preparar presentación]
```

La acción debe explicar que se prepara una entrega, no parecer un salto técnico de vista.

## 13. Tarjeta — Presupuesto

Entregar no duplica Presupuestar; resume su estado y enlaza a él.

Ejemplo:

```text
Presupuesto
12 partidas
9 con precio
3 pendientes
7 revisadas

[Revisar presupuesto]
```

## 14. Tarjeta — Imágenes

Agrupa salidas visuales compatibles:

- plano 2D;
- vista 3D;
- exterior.

Ejemplo:

```text
Imágenes
2D · 3D · Exterior

[Generar imágenes]
```

## 15. Tarjeta — Observaciones del cliente

Ejemplos:

```text
2 observaciones pendientes
[Gestionar]
```

o:

```text
Sin observaciones
```

## 16. Identidad de la entrega

La marca profesional debe ser visible en el centro de entrega.

Ejemplo:

```text
Identidad de la entrega
Estudio Arquitectura X
Logo configurado
contacto@example.com

[Cambiar para esta entrega]
[Configurar Mi estudio]
```

Se separan dos niveles:

- **Mi estudio**: configuración profesional persistente;
- **Esta entrega**: override opcional del proyecto/entrega.

## 17. MI ESTUDIO

`Mi estudio` no pertenece al plano y debe ser una configuración profesional transversal.

### Identidad

- nombre comercial;
- nombre del profesional;
- logo;
- email;
- teléfono;
- web;
- otros datos profesionales que ya soporte el producto.

### Entregas

- mostrar logo;
- datos de contacto;
- preferencias de presentación/entrega;
- valores predeterminados compatibles con capacidades existentes.

### Presupuesto

- identidad de tarifa propia;
- preferencias profesionales existentes que corresponda exponer.

No se crean nuevas capacidades de negocio en este corte.

## 18. Recorrido del proyecto

La guía debe evolucionar hacia una secuencia mental sencilla:

```text
1 Preparar
2 Diseñar
3 Amueblar
4 Revisar
5 Entregar
```

`Presupuestar` es un área principal, pero **no una etapa obligatoria** para todos los perfiles.

Ejemplos:

```text
Inmobiliaria:
Preparar → Diseñar → Revisar → Entregar

Reformas:
Preparar → Diseñar → Revisar → Presupuestar → Entregar
```

## 19. Cambio de estado al llegar a Entregar

Cuando el usuario llega al paso 5, debe entender que deja la fase de edición y entra en preparación de resultados.

CTA sugerido:

```text
Preparar entrega
```

La experiencia objetivo es:

```text
Editor
  ↓
Centro de entrega
```

No se obliga a resolverlo como un diálogo modal; la implementación decidirá el patrón visual concreto manteniendo los contratos actuales.

## 20. Cabecera y navegación principal

Dirección conceptual de escritorio:

```text
← Inicio     Proyecto de ejemplo

Diseñar   Analizar   Presupuestar   Entregar

             Plano 2D | Escena 3D

                         Deshacer  Rehacer
                         Mi estudio / perfil
```

No se aprueba todavía una composición pixel-perfect; sí se aprueba la jerarquía mental.

No se crearán botones independientes de primer nivel para cada capacidad (`Solar`, `Terreno`, `Ficha`, `Presupuesto`, etc.), porque volvería a dispersar el producto.

## 21. Atajos existentes

No se eliminan las rutas rápidas que funcionen.

Ejemplos:

- `Norte sin configurar` puede seguir visible, pero lleva a `Analizar → Orientación y sol`;
- `Presentar mi vivienda` puede mantenerse como atajo, pero desemboca en `Entregar → Presentación 3D`;
- una partida sin precio puede ofrecer `Añadir precio`, pero desemboca en `Presupuestar`.

Toda vía secundaria debe apuntar a una casa conceptual estable.

## 22. Inventario objetivo de capacidades 5–8

| Capacidad existente | Casa UX objetivo |
|---|---|
| Ficha de superficies | Entregar |
| Superficie útil | Analizar → Medidas y superficies |
| Pavimentos | Analizar → Medidas y superficies |
| Lámina | Entregar |
| Marca profesional | Mi estudio + visible en Entregar |
| Observaciones cliente | Entregar |
| Presentación | Entregar |
| PNG / imágenes | Entregar |
| Norte | Analizar → Orientación y sol |
| Ubicación | Analizar → Orientación y sol |
| Solar | Analizar → Orientación y sol |
| Cantidades | Presupuestar |
| Precio propio | Presupuestar → Fuentes / partida |
| Precio referencia | Presupuestar → Fuentes / partida |
| BC3 | Presupuestar → Importar / Fuentes |
| Informe presupuesto | Presupuestar + acceso desde Entregar |
| CSV presupuesto | Presupuestar / Entregar según contexto |
| Fachadas | Analizar → Exterior |
| Cubierta | Analizar → Exterior |
| Petos/volúmenes | Analizar → Exterior |
| Parcela | Analizar → Emplazamiento |
| Colocación territorial | Analizar → Emplazamiento |
| Ortofoto | Analizar → Emplazamiento |
| Terreno | Analizar → Emplazamiento |
| Capas territoriales | Analizar → Emplazamiento |
| Exterior contextual | Analizar → Exterior / Emplazamiento |
| Salidas finales | Entregar |

## 23. Criterios de aceptación UX

### 23.1 Descubribilidad de entrega

A una persona que no conoce el roadmap se le pide:

> “Prepara la documentación que enviarías al cliente.”

PASS si puede localizar sin ayuda externa, desde una única entrada principal evidente:

- ficha de superficies;
- lámina;
- presentación;
- imágenes;
- presupuesto;
- observaciones.

### 23.2 Orientación

Pregunta:

> “¿Dónde cambiarías la orientación de la vivienda?”

Ruta esperada:

```text
Analizar → Orientación y sol
```

### 23.3 Precios propios

Pregunta:

> “¿Dónde pondrías tus propios precios?”

Ruta esperada:

```text
Presupuestar
```

### 23.4 Parcela y terreno

Pregunta:

> “¿Dónde colocarías la parcela y el terreno?”

Ruta esperada:

```text
Analizar → Emplazamiento
```

### 23.5 Marca profesional

Pregunta:

> “¿Dónde pondrías el logo y los datos de tu empresa?”

Ruta esperada:

```text
Mi estudio
```

## Arquitectura final resumida

```text
RUBIK SOTA
│
├── DISEÑAR
│   ├── Construir
│   ├── Amueblar
│   └── Propiedades
│
├── ANALIZAR
│   ├── Medidas y superficies
│   ├── Orientación y sol
│   ├── Emplazamiento
│   │   ├── Parcela
│   │   ├── Colocación
│   │   ├── Ortofoto
│   │   └── Terreno
│   └── Exterior
│       ├── Fachadas
│       ├── Cubierta
│       ├── Petos
│       └── Volúmenes
│
├── PRESUPUESTAR
│   ├── Resumen
│   ├── Partidas
│   ├── Cantidades
│   ├── Precios
│   │   ├── Referencia
│   │   ├── Propio
│   │   └── Revisado
│   ├── Fuentes
│   │   ├── Tarifa propia
│   │   └── Importar BC3
│   └── Exportar presupuesto
│
├── ENTREGAR
│   ├── Ficha de superficies
│   ├── Lámina profesional
│   ├── Presentación 3D
│   ├── Presupuesto
│   ├── Imágenes
│   ├── Observaciones
│   └── Exportaciones
│
└── MI ESTUDIO
    ├── Identidad
    ├── Logo
    ├── Contacto
    ├── Entregas
    └── Preferencias profesionales
```

## Límites estrictos de implementación

Punto 9 **NO** autoriza cambios en:

- geometría;
- ProjectV1 / BuildingV1 / Budget / Presentation schemas;
- contratos GeoProvider / CostProvider;
- cálculo de superficies;
- cálculo de cantidades;
- cálculo de presupuesto;
- Solar;
- orientación persistida;
- parcela / ortofoto / terrain semantics;
- licencias/provenance;
- importación/exportación de datos;
- red/proveedores;
- lógica de Walk/Presentation;
- nuevas capacidades funcionales.

Punto 9 sí autoriza, cuando se implemente:

- navegación;
- agrupación;
- jerarquía visual;
- etiquetas y microcopy compatibles con los contratos existentes;
- tarjetas/resúmenes de estado derivados de datos ya disponibles;
- rutas principales y atajos;
- responsive/discoverability;
- accesibilidad de los nuevos recorridos;
- consolidación de entradas existentes sin eliminar la funcionalidad subyacente.

## Regla de no eliminación

> **Ninguna función existente se elimina por este corte.**

Una ruta puede reubicarse, agruparse o dejar de ser principal, pero la capacidad debe seguir siendo alcanzable. Cualquier retirada futura requerirá una decisión separada y evidencia de que no rompe flujos válidos.

## Secuencia recomendada de implementación futura

1. auditoría DOM/rutas actuales de capacidades 5–8;
2. mapa `actual → objetivo` de cada control;
3. prototipo de navegación sin cambiar lógica funcional;
4. estados resumidos por área;
5. Centro de Entrega;
6. Mi estudio;
7. Presupuestar como workspace comprensible;
8. Analizar como casa de superficie/orientación/emplazamiento/exterior;
9. responsive;
10. accesibilidad;
11. regresión de todas las rutas antiguas;
12. pruebas humanas de descubribilidad con los criterios de §23.

## Cierre de especificación

Punto 9 queda **CANDIDATO EN REVISIÓN**, implementado como reorganización frontend/UX sobre las capacidades ya cerradas de Puntos 1–8. No se declara cerrado antes de review, CI y merge.

El siguiente punto funcional después de este corte será:

> **Punto 10 — Instalaciones ligeras**.

## Implementación candidata — 28-10-2026

Base real comprobada con fetch: `origin/master@414a07772495e7e0caa77c0be33b0ad2e2838d1b`. Rama `feat/point-9-ux-professional-discoverability`. Se usó un worktree independiente; no se descartó el trabajo previo de Casa Serra. No se modifica el cierre canónico de Punto8 ni se activa Punto10.

### Arquitectura implementada y pregunta humana

La barra `Áreas de trabajo` añade cuatro intenciones de proyecto y una configuración transversal. Las cinco están a la vista sin scroll horizontal en 1440×900, 1280×800, 390×844 y 844×390. Es una navegación sobria de texto, no cinco acciones primarias. La selección usa grafito; sólo la siguiente acción recomendada usa petróleo.

Analizar, Presupuestar, Entregar y Mi estudio tienen un workspace desplazable bajo la navegación. El editor conserva sus columnas, selección y controles; queda inerte mientras el workspace ocupa su lugar. «Volver al plano» o Escape regresan y devuelven el foco. Los diálogos siguen siendo los existentes y al cerrar regresan a su tarjeta de origen. Presentación oculta/suspende el workspace y la navegación de edición; al salir se recupera el área anterior. No se altera su motor.

| Área | Qué debe entender | Qué puede hacer / acción dominante | Estado antes y después | Cómo vuelve / atajo conservado |
|---|---|---|---|---|
| Diseñar | Aquí se modifica la vivienda y la selección manda | Construir/amueblar/propiedades existentes; la acción de guía sigue siendo dominante | Modelo, selección, guía y paneles existentes | Botón Diseñar o Volver al plano; paleta y barra móvil intactas |
| Analizar | Aquí se leen medidas y contexto antes de decidir | Revisar superficies es la acción inicial; orientación, emplazamiento y exterior son secundarias | Área y certeza, escala, norte/ubicación, metadata frente a runtime y cubierta demostrable | Cierre del diálogo → tarjeta; Norte, Solar y Contexto territorial siguen abriendo sus herramientas |
| Presupuestar | Cantidad, referencia, precio propio y revisión tienen significados distintos | Consultar superficies; información de disponibilidad de las operaciones financieras | Sin presupuesto abierto en esta interfaz; sin totales inventados | Volver al plano o Entregar; no se añade persistencia financiera |
| Entregar | Ahora se prepara lo que recibirá el cliente | Ver ficha es la acción inicial; lámina, presentación, imágenes, observaciones y presupuesto son secundarias | Superficie/certeza/inclusión, número de estancias, identidad, observaciones y disponibilidad real | Cerrar herramienta → tarjeta; antiguos botones de guía/Archivo/Presentar siguen operativos |
| Mi estudio | La identidad se reutiliza en este navegador | Configurar Mi estudio abre el gestor existente | Nombre/logo/contacto existentes; perfiles reutilizables y selección por proyecto | Cerrar gestor → área; Tu marca y Firmar con conservados |

### Inventario final de rutas

| Capacidad | Ruta principal nueva | Control/implementación existente conservado |
|---|---|---|
| Ficha de superficies | Entregar → Ver ficha; Analizar → Revisar superficies | `openSurfaceSheet`, `FloorPlanSurfaceSheet.open`, atajo Tareas y ayuda |
| Superficie útil / exclusiones / pavimentos | Analizar → Medidas y superficies → Estancias y pavimentos | Vista general de Propiedades, grupo `areas`, selección contextual de estancia |
| Escala / calibración | Analizar → Abrir herramientas de calibración | `traceBtn`, panel/herramientas de plano propio |
| Lámina | Entregar → Abrir lámina | `openSheet`, `sheetScale`, `FloorPlanSheet.open` |
| Marca / contacto / logo | Mi estudio → Configurar; identidad visible al entrar en Entregar | `brandManage`, `FloorPlanBrandUI.open`, `profileSelect`, sidecars actuales |
| Identidad para esta entrega | Entregar → Cambiar identidad de esta entrega | Desplaza y enfoca el selector Firmar con existente; no nueva autoridad |
| Observaciones | Entregar → Gestionar observaciones | `reviewNotesBtn`, `FloorPlanReviewUI.open`, respuestas/decisiones actuales |
| Presentación | Entregar → Preparar presentación | `presentationBtn`, `guidePresent`, `FloorPlanPresentation.open` |
| PNG 2D / 3D / exterior | Entregar → Generar imágenes | `exportPng`; vista 3D/Exterior y Captura3D en Archivo; delivery/share internos intactos |
| Norte / ubicación / zona / Solar | Analizar → Orientación y sol | `solarNorth`, `solarOpen`, `solarOpen3d`, `FloorPlanSolarUI.open` |
| Parcela / placement / ortofoto / terreno | Analizar → Emplazamiento | `territoryOpen`, `FloorPlanTerritoryUI.open`; las cuatro secciones originales |
| Capas / exterior contextual | Emplazamiento y Exterior → vista existente | `territoryLayers`, control Exterior y herramienta exterior de Presentation |
| Fachadas / cubierta | Analizar → Exterior → Revisar exterior3D | `roofToggle`; disponibilidad del derivado ya existente |
| Petos / volúmenes / acabados | Analizar → Revisar petos y propiedades; Diseñar | `roof-parapet`, propiedades y estancias declaradas; sin inferir nueva geometría |
| Presupuesto / cantidades / tipos de precio | Presupuestar; resumen enlazado desde Entregar | Estado de disponibilidad honesto, sin nuevo editor ni presupuesto implícito |
| Tarifa propia / BC3 / fuentes / reporte / CSV | Presupuestar → Fuentes y exportación | Módulos de integración existentes; sin accesos operativos ficticios en el navegador |
| JSON / ZIP editable | Archivo y Entregar → Proyecto editable | `exportJson`, exportadores actuales; no nuevos formatos |
| Plantas / escaleras / objetos / huecos | Diseñar | Paleta, Plantas, Propiedades y barra móvil existentes |

Los atajos no se interceptan ni se retrasan: abren la función original. Los diálogos de ficha, lámina, presentación, observaciones, Solar, territorio y marca añaden una vía visible «Ir a [área]» para volver a su casa conceptual. Archivo conserva las operaciones existentes como atajos, pero deja de ser la vía necesaria de descubrimiento.

### Recorrido de guía

La presentación visual evoluciona a **Preparar → Diseñar → Amueblar → Revisar → Entregar**. Los dos estados previos de preparación se agrupan visualmente. Tareas, evidencia, guardado y lógica de progreso siguen siendo los existentes. Entregar abre el workspace y no añade una obligación de presupuesto. Tareas y ayuda añade «Preparar entrega» manteniendo todos sus atajos anteriores.

El test de guía conserva la comprobación de una única fase activa, su correspondencia con la tarea mostrada y el atajo Presentar. Su índice esperado se adapta al agrupamiento visual aprobado y añade comprobación del label; no se eliminan asserts para ocultar fallos.

### Estados y certeza

- Superficies usan únicamente `FloorPlanSurfaceMetrics.home`, también para Building; las excluidas no se suman y los cómputos parciales lo dicen.
- Norte y ubicación leen la autoridad actual `site`; no hay otra orientación ni otra persistencia.
- Ortofoto/terreno distinguen **fuente guardada** de **cargada en esta sesión** leyendo el runtime actual, sin fetch.
- Exterior muestra fachadas derivadas y disponibilidad de la cubierta. Una cubierta no demostrable mantiene su aviso existente, sin repararla.
- Observaciones resumen el sidecar actual: pendientes importadas y borradores redactados son estados distintos.
- La identidad se muestra arriba de Entregar; el selector y gestor actuales controlan la selección por proyecto. No se añaden preferencias globales ni datos de marca al proyecto.
- Precio referencia ≠ definitivo; propio = entrada profesional; revisado = decisión profesional, no certificación. No hay BCCA conectada/gestionada ni precios desconocidos convertidos a cero.

### Límite demostrado de Presupuestar / desviación respecto al concepto

En esta base, 7A–7D están cerrados como módulos puros: cantidades, Budget, fuentes manuales/BC3 y presentación/reporte/CSV. `index.html` no carga un editor, importador BC3 ni un presupuesto de proyecto. El documento de cierre de7D excluye expresamente una UI completa de edición.

Por ello esta implementación ofrece **casa conceptual, semántica y disponibilidad**, pero no inventa contadores de partidas, totales, precios, importador BC3, gestor de tarifa ni botones de exportación sin datos. Presupuesto en Entregar conduce a esa misma área. No se guarda un presupuesto en Project/Building ni se construye un nuevo editor financiero. La limitación está visible y se registra para revisión; no se afirma que el recorrido permita editar precios desde el navegador.

Mi estudio expone sólo campos soportados: nombre comercial, responsable, logo, email, teléfono, web y lema. No crea una cuenta, sincronización, tarifa editable o preferencias nuevas. La firma por proyecto no se presenta como una identidad global aplicada automáticamente a todos los proyectos.

### Validación Playwright / Chromium y revisión visual

Inventario local previo: `output/playwright/point-9/inventory.md`. Baseline antes de cambiar la UI: **30 PNG** en `before/`, con bienvenida, editor guiado/completo, tareas, ficha, Archivo, Solar, contexto, 3D y configuración de presentación, a 1440×900,390×844,844×390. Presupuesto no tenía UI que capturar; se registra en el reporte.

AFTER: capturas equivalentes y las nuevas áreas en `output/playwright/point-9/after/`, incluyendo1280×800. Evidencias locales deliberadas, **no versionadas automáticamente**. Script reproducible `scripts/qa/ux/point-9.cjs before|after`; tests `tests/professional-workspace.browser.test.cjs`. Navegación con click/tap/teclado y scroll; sin forceclick, sin cerrar diálogos por evaluate ni mutar proyectos por evaluate para saltarse acciones. Lecturas técnicas sólo para verificar identidad, estado y no mutación.

Pruebas humanas **simuladas**, no investigación con participantes: A entrega, B orientación, C presupuesto/disponibilidad/semántica, D emplazamiento y E identidad pasan en los cuatro viewports. Una prueba adicional crea identidad con campos reales, selecciona firma, añade observación, abre exterior y Presentation, vuelve, recarga y verifica identidad reutilizable y modelo intacto. El límite financiero de C queda explícito, sin afirmar edición de precios.

Hallazgos visuales:

- Mejora: Ficha y Entregar son localizables sin Archivo ni conocer roadmap; las áreas principales caben sin scroll horizontal crítico.
- Mejora: estado de certeza, ausencia de norte, disponibilidad de contexto y marca se entienden antes de actuar.
- Mejora: acción inicial en petróleo frente a selección grafito; vuelta y foco consistentes.
- Se consolidó la navegación, no los motores ni los datos. Permanecen paleta, propiedades, atajos de guía/Archivo, 2D/3D y exportadores.
- Se corrigieron durante validación la superposición de barra sobre Archivo, el dock apaisado bajo la nueva barra y la suspensión del workspace durante Presentation.
- Imperfecto: en móvil hay scroll vertical en Entregar; las herramientas antiguas conservan sus propias composiciones y la cabecera secundaria aún permite scroll. Ningún área principal depende de ese scroll horizontal. Presupuestar explica una limitación operativa real. No hay resultados con personas ni medición de rendimiento en hardware móvil físico.

### Resultados locales finales

- Tests específicos nuevos: **5/5 PASS**, cuatro viewports + persistencia/atajos/Presentation.
- Regresiones UI guía/paneles/ficha/lámina/marca/observaciones: **58 casos**;55PASS en ejecución inicial y3casos afectados corregidos/verificados dirigidamente (dos correspondencias de fase y dock apaisado).
- Solar/parcela/ortofoto/terreno/integración/exterior: **27 casos**;24PASS inicialmente y3casos de menú escritorio corregidos/verificados dirigidamente.
- Presentación/framing/Building/capture/delivery/share y tests nuevos: **33 casos**;32PASS inicialmente, el test nuevo de observaciones esperaba antes del evento nativo de cierre; corregido para esperar el resumen y PASS en suite específica final. No se cambió el motor de observaciones.
- Core de guía/marca/observaciones:21PASS. SurfaceCore:6PASS. No se repiten suites matemáticas cerradas.
- Syntax JS nuevos/modificados y scripts inline index: PASS; `git diff --check`: PASS.

Los grupos contienen solapamientos; no se suman como casos únicos. Los fallos detectados durante implementación se explican arriba y sus casos finales están verdes, sin debilitar tests. No se afirma una ejecución de toda la suite histórica del repositorio ni se reabre su baseline Walk.

Sin cambios en schemas, contratos, motores, geometría, precios canónicos, persistencia, fuentes, políticas de licencia/exportación, CRS, Solar o lógica Walk/Presentation. Sin retirada de funcionalidades. Un commit funcional y un push tras validar localmente; después de abrir PR sólo confirmación y como máximo una observación inicial de CI. Sin merge, reruns ni polling de CI/Vercel.

## Segunda revisión visual humana

### Revisión humana escritorio — segunda pasada

**Punto 9 — CANDIDATO EN REVISIÓN. Punto 10 sin activar.** Refinamiento de la arquitectura aprobada en PR #133; esta sección sustituye las decisiones visuales afectadas de la primera pasada. Base de PR: `414a07772495e7e0caa77c0be33b0ad2e2838d1b`. HEAD previo local y remoto comprobado: `264480d6cc52df49678b849fd9f6ca292eab21d2`. La rama remota no había avanzado al comenzar esta pasada. Se conservaron las evidencias locales previas; no había código local sin publicar.

Se resuelven **16 hallazgos** exclusivamente mediante presentación, microcopy y lectura del estado existente. No se añade una nueva autoridad de disponibilidad territorial: los controles leen los objetos que el renderer ya expone, mientras sus preferencias de visibilidad y transformaciones permanecen intactas.

| Hallazgo / problema | Cambio | Criterio de aceptación | Resultado |
|---|---|---|---|
| H1. Cabecera 3D compite con las áreas del producto | Etiquetas Vista y Explorar; controles originales conservados; Presentar pasa a acceso secundario; selección de vista independiente de las áreas | Distinguir área, vista, exploración y acceso rápido; seguir pudiendo usar 2D, 3D, Vista aérea, Recorrer y Exterior | PASS |
| H2. Trazado 2D expuesto en 3D | CSS oculta herramientas de trazado, creación de estancia y formulario de geometría 2D en 3D. La paleta ofrece su entrada existente al plano 2D | No ofrecer Muro/Puerta/Ventana/Estancia en 3D; restaurar herramientas y formulario al volver a 2D sin cambiar su estado | PASS |
| H3. Capas marcadas sin contexto disponible | Estado por capa: Visible / Oculto si existe representación; Sin configurar / No cargado / Sin colocación en otro caso. Checkbox no disponible oculto, desmarcado y deshabilitado | Ninguna capa inexistente parece activa; las disponibles conservan su control real de visibilidad | PASS |
| H4. Revisar superficies domina Analizar arbitrariamente | Las cuatro tarjetas usan acciones secundarias consistentes | Orientación sin configurar no queda visualmente subordinada a una CTA dominante de superficies; no se inventa algoritmo de prioridad | PASS |
| H5. Presupuestar parece un error de desarrollo | «Edición de presupuesto todavía no disponible» y explicación de esta versión de Rubik | Entender que la edición operativa aún no está disponible y que se pueden consultar superficies/preparar otras salidas | PASS |
| H6. Ayuda financiera domina la pantalla | Las cuatro semánticas se conservan en una leyenda desplegable, cerrada inicialmente | Disponibilidad y acciones existentes antes que documentación; automática/referencia/propio/revisado siguen consultables | PASS |
| H7. Ficha domina los entregables sin justificación | Mismo nivel de CTA en las tarjetas de Entregar; no se añade flujo global ficticio | Ficha, lámina, presentación, imágenes, presupuesto/estado y observaciones se reconocen como opciones equivalentes | PASS |
| H8. Identidad duplicada | Se retira el resumen y su acción duplicada; la tarjeta conserva selector y gestor existentes | Un único lugar en Entregar para ver y configurar la identidad | PASS |
| H9. Copia editable mezclada con entregables | Proyecto editable pasa a «Más opciones · Guardar y exportar» fuera de la cuadrícula cliente | Distinguir resultados para el cliente de la copia de trabajo del profesional; exportador intacto | PASS |
| H10. Mi estudio pasa desapercibido | Indicador sobrio de configuración y título «Logo, datos e identidad profesional»; nombre accesible estable | Encontrar configuración profesional sin convertirla en acción principal | PASS |
| H11. Lenguaje exterior interno | Fachadas detectadas a partir del plano; cubierta «no disponible con la geometría actual» | Comprender resultado y limitación sin presentar certeza adicional | PASS |
| H12. Texto truncado y scroll horizontal en propiedades | Wrap en botones, resúmenes, avisos y contexto; hijos flex/grid encogibles; anchura limitada al panel | Cero desbordamientos horizontales críticos, incluidos botones de revisión de muros, en 1440×900 y 1280×800 | PASS |
| H13. Anchura útil de áreas profesionales | Contenido centrado con anchura útil de 1100 px en escritorio | Tarjetas legibles dentro del rango 1050–1150 px; sin dashboard denso ni desbordamiento móvil | PASS |
| H14. Retorno no usa la arquitectura aprobada | «← Volver a Diseñar» | Volver al editor conservando la vista y el comportamiento de foco anterior | PASS |
| H15. Recorrido parece otra navegación de producto | «Recorrido del proyecto · Paso N de 5 · etapa», stepper de menor énfasis; progreso y tareas conservados | Distinguir el área Diseñar de la etapa Revisar. En pantallas bajas las pestañas de paleta dejan de ser fijas para no tapar acciones | PASS |
| H16. Preservar recorrido validado | Navegación y diálogos originales, foco y retorno comprobados | Diseñar → 3D → Analizar → Entregar → Ficha → Entregar → Diseñar, sin perder la vista ni alterar el proyecto | PASS |

### Capturas before/after y revisión

Evidencia local reproducible: `node scripts/qa/ux/point-9-review.cjs before|after`. Para repetir el baseline debe usarse el HEAD previo indicado, sin sobrescribirlo con el resultado de esta pasada.

- **BEFORE: 40 PNG** en `output/playwright/point-9/review-2/before/`, capturados antes de modificar la interfaz del producto.
- **AFTER: 56 PNG** en `output/playwright/point-9/review-2/after/`: las diez escenas equivalentes por viewport más revisión de muros con wrap, leyenda desplegada, identidad y copia interna.
- Viewports: **1440×900, 1280×800, 390×844 y 844×390**.
- Escenas: Diseñar guiado 2D, trazado y panel derecho 2D, Diseñar 3D, panel derecho 3D, capas, Analizar, Presupuestar, Entregar, Mi estudio y ficha. Reportes de captura sin errores de página.
- Revisión visual de capturas reales de escritorio y móvil, con atención a los dieciséis hallazgos y a la convivencia de cabecera, áreas y recorrido. Evidencias deliberadamente locales, no versionadas automáticamente.

### Validación local de esta pasada

- `tests/professional-workspace.browser.test.cjs`: **9/9 PASS**. Conserva las cinco pruebas originales y añade cuatro recorridos de revisión contextual, uno por viewport. Verifica herramientas 2D ocultas/restauradas, estados territoriales, Visible/Oculto real del edificio, panel sin overflow ni texto recortado, jerarquía, copia separada, leyenda, Mi estudio, conservación del proyecto y retorno de ficha. Se mantiene la prueba real de Presentación, observaciones, marca, lámina e imagen descargada.
- Regresiones existentes de guía/navegación, paneles, ficha, lámina, marca, observaciones, Solar, parcela, ortofoto y terreno: **72 casos, 71 PASS iniciales**; el único caso afectado de paleta apaisada se corrigió con pestañas no fijas en pantallas bajas y pasó dirigido **1/1**. No se modificaron sus asserts. No quedan fallos pendientes en estos casos.
- Exterior y contexto configurado, capas, Presentación, exportación y offline: **3/3 PASS** mediante los casos existentes `Exterior remains reversible…` y `8C-E explicit building placement…` en ambos tamaños móviles. No se reabre la suite histórica Walk ni su baseline.
- Fallos transitorios de desarrollo documentados: el indicador visual de Mi estudio alteraba su nombre accesible; corregido con nombre explícito sin debilitar los selectores. La nueva prueba de Walk asumía que Escape abandonaba el modo; se corrigió para usar el retorno existente Vista aérea, sin modificar Walk.
- `node --check` de JS/CJS nuevos o modificados, parseo de scripts inline de `index.html` y `git diff --check`: **PASS**.

### Límites y publicación

La revisión automatizada simula interacciones humanas; no es una nueva sesión con participantes. Continúan el scroll vertical móvil y los controles secundarios de cabecera desplazables. No se crea editor financiero, importador BC3 ni conexión BCCA; la leyenda no afirma disponibilidad operativa. Ningún cambio de schema, contrato, motor, geometría, cálculo, persistencia, precio, provider, CRS, Solar, política de exportación o licencia. Ninguna función retirada: los controles contextuales se conservan para la vista apropiada.

Entrega de esta pasada: un único commit adicional y un único push a la misma rama de PR #133 tras validar localmente. Sin nueva PR, sin merge ni cierre de Punto 9; Punto 10 no se activa. Tras publicar, una sola confirmación de PR y, como máximo, una lectura inicial de checks; sin esperar CI/Vercel, polling ni reruns manuales.

## Tercera revisión visual humana — navegación global

**Punto 9 — CANDIDATO EN REVISIÓN. Punto 10 sin activar.** Micro-pasada final sobre la misma rama de PR #133, partiendo del HEAD remoto comprobado `351ec01eef307c37ab930ab91d6910e6238c0996`. Se conservaron las evidencias locales previas; no había código sin publicar.

1. **Bug visible/inert.** Al abrir un área profesional seguían viéndose controles de cabecera que no respondían. Inicio, Proyectos e Idioma también quedaban bloqueados.
2. **Causa.** `setInert` incluía el `header` completo, aunque la nueva área comenzaba visualmente debajo de él.
3. **Solución.** Inicio, Proyectos, Idioma y pantalla completa se identifican como controles globales y conservan sus handlers originales. En áreas profesionales los demás controles de cabecera se ocultan temporalmente con CSS. Canvas, columnas y guía continúan protegidos con inert; el fondo del editor queda oculto mientras lo cubre el workspace. La suspensión del workspace durante Presentación conserva visible la escena de cliente. Al volver a Diseñar reaparecen los controles contextuales sin ejecutar `setView`, cambiar cámara, selección, paneles, capas o proyecto. Los cierres de Inicio/Proyectos refrescan el resumen del área sin robar el foco al control global. El cambio de idioma tampoco roba ese foco.
4. **Mi estudio.** «Para este proyecto» contiene la selección «Firmar con», aplicada sólo al proyecto actual. «Perfiles profesionales» explica los datos reutilizables y abre el gestor existente mediante «Gestionar identidades». Desaparece el texto circular «Configurar Mi estudio» dentro de esa misma área. Entregar conserva su tarjeta de identidad y acceso al gestor. No hay nuevos perfiles de producto, almacenamiento ni cuentas.
5. **Emplazamiento.** «Configurar emplazamiento» sustituye a «Abrir contexto territorial» y llama exactamente a `FloorPlanTerritoryUI.open`. No se modifica la herramienta ni sus datos.
6. **Fuentes de precios.** El texto principal dice que las tarifas propias y la importación de precios aún no están disponibles en esta versión. Los detalles BC3/BCCA y el límite de informe/CSV se conservan en «Detalles técnicos sobre fuentes», cerrado inicialmente y operable por teclado. No se añade importador ni conexión BCCA.
7. **Tests.** Los nueve recorridos existentes del workspace pasan con selectores adaptados exclusivamente a los textos aprobados, sin eliminar asserts. Se añaden cuatro casos reales, uno por viewport, para Inicio/Proyectos/Idioma, ausencia de controles contextuales visibles, ausencia de controles de cabecera visibles con inert, navegación entre áreas, Mi estudio no circular, emplazamiento, detalles de fuentes, Tab/Shift+Tab/Enter/Escape, foco, `aria-current` y `aria-expanded`. El retorno compara exactamente proyecto, vista, selección, paneles, capas y Exterior; la pose de cámara usa tolerancia absoluta `1e-10` para diferencias de coma flotante. La primera ejecución detectó una diferencia de aproximadamente `1e-15` en ese assert nuevo; no se tocó el motor ni se relajaron tests anteriores. Ejecución dirigida final de los casos nuevos: **4/4 PASS**. Regresiones existentes relacionadas de guía/navegación, marca, observaciones y foco en Presentación: **24/24 PASS**, sin FAIL/SKIP. Se conservan las pruebas de ficha, lámina, presentación real, imágenes descargadas e identidad. `node --check` y `git diff --check`: **PASS**. No se ejecuta la suite histórica ni se reabre Walk.
8. **Evidencia visual.** **20 BEFORE / 24 AFTER PNG** en `output/playwright/point-9/review-3/{before,after}`. Viewports: **1440×900, 1280×800, 390×844 y 844×390**. Escenas equivalentes: Mi estudio desde 3D, Analizar desde 3D, Presupuestar, Entregar y retorno a Diseñar; AFTER añade los detalles técnicos desplegados. Capturas revisadas, reportes sin errores de página y helper local conservado en `review-3/capture.cjs`. No se versionan automáticamente capturas, logs ni helper local. En teléfono la cabecera global puede ocupar dos líneas para mantener sus controles visibles y utilizables.

La semántica territorial aprobada H3 y la ocultación de herramientas 2D en 3D se verifican con los tests existentes; no se modifica su implementación. Esta pasada cambia exclusivamente `professional-workspace-ui.js`, `professional-workspace.css`, sus tests y esta documentación. Sin cambios de schemas, motores, contratos, persistencia, proveedores, políticas, precios o cantidades. Ninguna capacidad retirada.

Publicación: **un commit adicional y un push** a la misma PR #133 tras validar localmente. Punto 9 permanece candidato hasta revisión humana final. Después de actualizar la PR: una confirmación y como máximo una lectura inicial de checks; sin esperar, polling, reruns ni merge. **STOP**.

## Dirección visual y capa emocional — cuaderno de proyecto

**Estado: CANDIDATO EN REVISIÓN.** Continuación posterior a la tercera pasada publicada, sobre la misma rama de #133. HEAD previo local y remoto comprobado: `f9f82827035bf97b47484baa7ddc939901a0d40f`. Punto 10 no se activa.

### Auditoría y dirección

El baseline confirmó una sucesión de tarjetas blancas casi idénticas, cifras con el mismo peso que sus explicaciones y ausencia visual de la vivienda al salir de Diseñar. La ficha existente ya ofrece una referencia útil: documento, papel, dato y precisión. La nueva dirección extiende esa continuidad al workspace, sin convertir la herramienta en una web comercial.

**Cuaderno de proyecto:** una mesa de trabajo de arquitectura, cálida y sobria. La personalidad procede de la composición, la vivienda real, la firma y la jerarquía; no de una ilustración de stock ni de efectos decorativos. Principios:

- El proyecto y sus datos verificables son el contenido protagonista.
- La cifra, su unidad y su certeza tienen pesos visuales distintos, conservando todo el significado original.
- Divisores y secciones sustituyen a cajas repetidas; se reserva la superficie de papel para documentación y firma.
- Acción petróleo y selección grafito continúan separadas. Todos los símbolos acompañan texto.
- No se reduce la capacidad del editor ni se añaden salidas, fuentes o preferencias.

### Sistema visual

| Elemento | Decisión y razón |
|---|---|
| Paleta/tokens | Papel `#f6f2e9`, hoja `#fffcf6`, piedra `#e9e2d5`, tinta `#2d332f`, texto secundario `#626457`, reglas `#cbc2b3`, arcilla `#875936`, petróleo `#205b60`. Tokens `--rubik-*` centralizados; los roles del cromo se mapean dentro de `.app` y del workspace |
| Tipografía | Sans del sistema para controles y lectura. Georgia local para títulos de área, cifra protagonista y firma; sin descarga de fuentes. Escala aproximada 10–14 px metadata/texto, 19 px módulos, 28–36 px títulos y 44–56 px cifra. Números tabulares |
| Materialidad | Papel mate y tonos piedra; reglas finas, radios de 2–4 px y ausencia de sombras en los módulos. El papel documental tiene un canto petróleo; la firma, un canto arcilla. No textura raster, gradiente ni efecto de cristal |
| Iconografía | Once símbolos SVG lineales originales de 24 unidades, trazo uniforme, sin paquetes externos. Medición, sol, emplazamiento, exterior, documento, lámina, presentación, presupuesto, imagen, observaciones e identidad. `aria-hidden` cuando acompañan un título; el texto conserva la función |
| Estados | La certeza conserva literalmente estimado/medido/no disponible y cómputo incompleto. La etiqueta de certeza se separa de la cifra. Pendiente, no cargado y no configurado siguen expresados en palabras. No se convierte ninguna ausencia de datos en cero ni en un estado favorable |
| Botones/links/foco | Mismos controles y handlers; CTA de entregables al mismo nivel. Contorno legible, altura táctil mínima conservada y foco de 3 px. Los cambios de selección son inmediatos para evitar contraste bajo durante una mezcla de colores |
| Microinteracciones | 160 ms sólo en hover/contorno de controles y superficies. Sin desplazamiento de tarjetas ni movimiento teatral. `prefers-reduced-motion: reduce` elimina animaciones/transiciones de esta capa |
| Contraste | Texto secundario/papel ≈5,40:1; arcilla/papel ≈5,35:1; blanco/petróleo ≈7,70:1; blanco/grafito >11:1; borde de control/hoja ≈3,26:1. Test WCAG AA sobre colores y fondos efectivamente renderizados en los módulos nuevos |

### Composición por área

**Analizar.** Lectura de proyecto en lugar de dashboard: cifra útil protagonista con certeza, cuatro módulos separados por reglas y símbolos de reconocimiento. Un plano esquemático y el nombre mantienen presente la vivienda; orientación, emplazamiento y exterior conservan los mismos estados y acciones.

**Entregar.** Secuencia editorial: Documentación → La vivienda, para tu cliente → Seguimiento del proyecto → La firma del profesional. Ficha y lámina se presentan como documentos sobre papel; presentación e imágenes forman una familia visual. Presupuesto y observaciones mantienen su disponibilidad real. La identidad sigue en un solo lugar y la copia editable permanece en Más opciones. Se conserva el orden lógico de lectura y teclado dentro de cada grupo.

**Mi estudio.** Firma profesional con nombre, responsable, lema, contacto y logo del snapshot ya seleccionado. Sin perfil aparece una invitación explícita, nunca una empresa ficticia. «Para este proyecto» conserva el selector y una miniatura de la planta; «Perfiles profesionales» conserva el gestor reutilizable. El logo sólo se muestra si es el PNG local ya validado por el sistema existente.

**Presupuestar.** Módulo sobrio con regla y símbolo, sin rellenarlo con importes o partidas inexistentes. Se conservan la indisponibilidad operativa, el acceso a superficies y las dos explicaciones desplegables. BC3/BCCA continúan en el detalle secundario.

**Diseñar 2D/3D y ficha.** Sólo se armonizan los tonos del cromo, contornos y navegación; no se añaden paneles ni se cambia la escena. El plano conserva su espacio y protagonismo. La ficha documental y sus salidas permanecen intactas; es una referencia de continuidad, no una nueva plantilla de exportación.

### Contexto del proyecto y límites técnicos

La miniatura SVG dibuja los polígonos de estancias y muros y usa los bounds que `FloorPlanApp.geometry` ya expone. Es una representación esquemática de la **planta activa**, no una nueva fuente geométrica ni una axonometría inventada. Nombre y número de espacios leen el proyecto activo; las superficies siguen procediendo de `FloorPlanSurfaceMetrics`. No hay cálculo canónico nuevo, escritura del modelo, exportación de la miniatura, persistencia ni peticiones de red. No se incluyen imágenes de origen ni datos externos. La firma lee `FloorPlanBrandUI.snapshot`, sin crear otra autoridad de identidad.

### Responsive, accesibilidad y validación

- **1440×900, 1280×800, 390×844 y 844×390:** revisados. Dos columnas en escritorio y una en teléfono; contexto compacto en apaisado, nombres largos con wrap, controles globales accesibles y scroll vertical cuando hace falta. Sin overflow horizontal crítico.
- Navegación global, áreas, teclado, foco de retorno y diálogos se conservan. Los SVG de contexto tienen nombre accesible y no añaden paradas de Tab. Estado no dependiente del color.
- Suite final `professional-workspace.browser.test.cjs`: **17/17 PASS**, incluidos los trece casos previos y cuatro casos visuales nuevos. Los nuevos verifican geometría de miniatura contra los datos existentes, no mutación, ausencia de requests remotos, contraste real, foco por Tab/Shift+Tab, movimiento reducido, agrupación de entregables, disponibilidad honesta y firma con datos sintéticos introducidos mediante la UI existente.
- Regresiones dirigidas de guía/navegación, ficha, lámina, marca, observaciones, Solar y parcela: **56/56 PASS**, 0 FAIL/SKIP. Se conservan 2D/3D, Vista aérea/Recorrer/Exterior, capas y Presentación mediante los recorridos existentes. No se ejecuta Walk histórico ni toda la suite del repositorio.
- Durante desarrollo se ajustó el encuadre de la comparación de cámara para esperar dos frames de resize antes de leerla; no se eliminó ningún assert ni se cambió el renderer. El test de foco visual usa Tab real para activar `focus-visible`. La captura de firma espera el evento nativo `close` y su frame de render antes de seleccionar y desplazar el perfil; evita leer un nodo reemplazado por el retorno del diálogo. La ejecución completa final está verde.
- `node --check` de JS/CJS modificados/nuevos y `git diff --check`: **PASS**.

### BEFORE/AFTER y revisión visual propia

Baseline **28 PNG** antes de modificar el producto, más **30 PNG AFTER** (las siete pantallas por cuatro viewports y dos firmas con perfil sintético). Capturas y reportes sin errores en `output/playwright/point-9/visual/{before,after}`. Helper versionado: `scripts/qa/ux/point-9-visual.cjs before|after`; para reproducir BEFORE usar el HEAD previo. Siete galerías locales en `visual/review` comparan lado a lado todas las pantallas y tamaños; se abrieron todas y se revisaron además vistas de escritorio, móvil y firma a mayor tamaño. Sin basar el juicio únicamente en pixel diff.

Conclusión de diseño propia: menos monotonía de cajas, mayor jerarquía del dato, continuidad visible con documentación arquitectónica y presencia real del proyecto. Entregar se lee por familias de resultados y Mi estudio permite imaginar la firma del profesional. Se corrigieron localmente la posición inicial de identidad y la transición de selección antes de cerrar la revisión. No se añadieron fotografías, recursos remotos, paquetes, mega cabeceras ni decoración sin función.

**Limitaciones:** juicio visual propio, no una sesión con participantes ni aprobación estética final. La miniatura es esquemática y sólo de la planta activa; no sustituye a la vista principal. La firma muestra el perfil seleccionado, no una nueva preferencia global. Continúan el scroll vertical móvil, la cabecera contextual desplazable de Diseñar y la edición de presupuesto no operativa. No se hacen afirmaciones de rendimiento en hardware móvil físico. Evidencias locales preservadas, sin versionar automáticamente imágenes o logs.

Publicación de este corte visual: un commit funcional y un push a #133 tras completar revisión visual y validación local. Sin nueva rama/PR, merge, cierre canónico de Punto 9 ni activación de Punto 10. Una confirmación posterior de PR y, como máximo, una lectura inicial de checks; sin esperar CI, polling ni reruns. **STOP tras informe**.
