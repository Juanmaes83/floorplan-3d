# Punto 9 — UX profesional y descubribilidad de capacidades 5–8

**Fecha:** 28-10-2026  
**Estado:** **APROBADO / SIGUIENTE**  
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

Punto 9 queda **APROBADO COMO SIGUIENTE CORTE** y debe implementarse como reorganización frontend/UX sobre las capacidades ya cerradas de Puntos 1–8.

El siguiente punto funcional después de este corte será:

> **Punto 10 — Instalaciones ligeras**.
