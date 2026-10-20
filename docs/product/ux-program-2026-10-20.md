# Programa de experiencia de usuario por fases (20-10-2026)

**Autorización:** Juanma autoriza el 20-10-2026 un programa **general de UI/UX por fases**, inspirado en la claridad de LoRA LAB.

- **No es una copia.** Ni marca, ni código, ni funciones no comprobadas.
- **No aprueba nuevas capacidades de producto** de la [matriz LoRA LAB](https://github.com/Juanmaes83/floorplan-3d/blob/docs/loralab-study-gate/docs/technical/loralab-visual-matrix-2026-10-20.md) (#48). Cada una necesita su decisión, su contrato y su PR (§9).
- **Público:**
  - prioritario: inmobiliarias, promotoras y estudios de arquitectura (D-01);
  - secundario: reformas e interiorismo.

**Objetivo.** La persona entiende de inmediato cómo empezar, construir, amueblar, revisar y presentar una vivienda:

- a la izquierda elige una acción por intención;
- en el centro trabaja sobre el plano;
- a la derecha ve las propiedades de lo que ha seleccionado.

## 1. Punto de partida: lo que #62 ya resolvió

No se rehace ni se declara pendiente:

- **Cabecera común de los paneles.** «Volver» va primero y en la misma posición, con la cadena mueble → estancia → vista general, hueco → estancia y edición → herramientas.
- **Grupos plegables** por familia de propiedades y acciones fijas al pie.
- **En escritorio, la columna de propiedades se abre al seleccionar.**
- **Barra superior por tareas,** con «Mostrar ▾» y «Archivo».
- **«Generar»:**
  - tres entradas primero;
  - qué se obtiene y sus límites;
  - foco en el título;
  - guía compacta.
- **Castellano** sin IDs ni claves internas.
- **Mensajes de calibración** con cifras.
- **Huecos en contexto (#60):**
  - seleccionar y editar;
  - añadir desde la estancia, con banner y «Cancelar».

## 2. Línea base medida (`master` `bd153c7`)

Medida en Chromium 141 con render por software, sin GPU. Scripts en el repositorio y resultados en [`docs/qa/artifacts/ux-program/baseline/`](../qa/artifacts/ux-program/baseline/).

| Medida | Resultado |
| --- | --- |
| Tarea de #48: desde un proyecto abierto, estancia con nombre, puerta de 900 mm, ventana, suelo y acabado de pared (`scripts/qa/openings/room-task.cjs`, 1440×900, ratón) | **22 acciones**: estancia 6, huecos 8, acabados 8; **2 cambios de modo**. Persiste tras recargar; sin errores |
| Acciones hasta ver y editar propiedades (`scripts/qa/ux/access.cjs`) | 1440×900: estancia 1, mueble 1, hueco 1. 390×844 y 844×390: estancia **2** y mueble **2** («Propiedades» en la barra inferior); hueco 1 |
| Columna izquierda | Sólo amueblar: buscador, filtros y catálogo. **Construir está repartido**: «+ Estancia», «Plano propio», «Plantas…», «Seleccionar / Medir / Modificar muros» en la barra superior, y «Añadir puerta / ventana» en el panel de la estancia |
| Recorridos de bienvenida y selección (`scripts/qa/ux/flows.cjs`) | Sin texto en chino, IDs internos ni desplazamiento horizontal. Acción extra para ver la estancia sólo en teléfono |

## 3. Mapa de pantallas y estados

| Pantalla o estado | Hoy | Fase que lo mejora |
| --- | --- | --- |
| Bienvenida («Generar»): subir plano, crear desde cero, probar el ejemplo | Ordenada en #62 | F3: progreso, errores recuperables, revisión y siguiente paso visibles |
| Guía (distribuir → amueblar → revisar y guardar) | Compacta en móvil (#62) | F3 |
| Editor 2D, columna izquierda | Sólo catálogo de muebles | **F1: paleta «Construir / Amueblar»** |
| Selección en el plano | Estancia, mueble, hueco y muro con tiradores | F2: estado seleccionado coherente |
| Propiedades: estancia, mueble, hueco, planta | Patrón de #62. La planta está en el diálogo «Plantas…». Colores con `input type=color` | **F2: inspector contextual con muestras** |
| Modos sobre el plano: añadir hueco, dibujar muro, medir, modificar muros | Banner del hueco (#60). El muro se dibuja desde «Plano propio» | F1: banner visible al dibujar muros. F2: patrón común de banner |
| Móvil | Cajones laterales; «Propiedades» en la barra inferior | **F2: hoja inferior compacta con lo esencial** |
| 3D | Controles en la barra superior: vista, cortes, noche, sol | F3: controles agrupados junto a la escena |
| Presentación | «Presentar mi vivienda»; dos plantas en #65 (PR aparte) | F3, sin duplicar #65 |

## 4. Mapa de controles

Clasificación:

- **A** ya existe y está en su sitio;
- **B** existe pero está disperso;
- **C** necesita una mejora de interfaz sin cambiar el contrato;
- **D** necesita una capacidad de producto nueva (§9).

| Control | En Rubik hoy | Clase | Fase |
| --- | --- | --- | --- |
| Seleccionar / Medir / Modificar muros | Barra superior | B | F1 (también en la paleta, sincronizado) |
| Nueva estancia con nombre | «+ Estancia» con nombre libre | B y C | F1: nombres de ejemplo que sólo rellenan el nombre |
| Dibujar muro | «Plano propio → Muro», sin aviso visible fuera del panel | B y C | F1: acción en la paleta, con banner y «Terminar» |
| Puertas y ventanas (4 tipos del contrato) | Panel de estancia (puerta y ventana) y «Plano propio» | B | F1: los 4 tipos, añadidos a la estancia de la selección |
| Preajustes de ventana por medidas | — | C | Propuesto para F2, con límites validados |
| Escalera recta | Dentro de «Plantas…» | B | F1: acceso desde la paleta |
| Plantas | «Plantas…» y la barra de plantas | A y B | F2: propiedades de planta en el inspector |
| Catálogo de muebles | Columna izquierda | A | F1: pasa a la pestaña «Amueblar» |
| Propiedades de estancia, mueble y hueco | Patrón de #62 | A | F2: lo esencial primero; avanzado plegado |
| Color y acabados con muestras | `input type=color`; biblioteca de acabados en un diálogo | C | F2 |
| Hoja de propiedades en móvil | Cajón lateral y «Propiedades» | C | F2 |
| Controles 3D (vista, cortes, noche, sol, captura) | Barra superior | B y C | F3 |
| Tipo de muro, orientación solar, catálogo exterior, tipos de puerta nuevos, tercera planta, escaleras en L/U/caracol, cubierta y fachada, cortinas, presupuesto | — | D | §9, fuera de estas PR |

## 5. Componentes reutilizables

1. **Paleta de creación** (F1). Pestañas con `role=tablist` y foco itinerante con las flechas. Grupos con título breve en mayúsculas pequeñas y una ayuda de una línea. Las **acciones** son losetas con icono y texto, nunca sólo icono; las **sugerencias** son fichas; al pie, un consejo.
2. **Línea de contexto** (F1). Dice a qué afecta la siguiente acción, por ejemplo «Se añadirá a «Cocina»», con `aria-live`.
3. **Banner de modo** (#60 y F1). Encima del plano: qué ocurre, el paso siguiente y un botón de salida («Cancelar» / «Terminar»). **Ningún modo de toque queda activo sin un banner visible.**
4. **Inspector** (F2). Cabecera de #62, un grupo «Esencial» abierto, grupos avanzados plegados y acciones al pie.
5. **Muestras** (F2). Botones con color o textura, nombre accesible y estado `aria-pressed`. Sólo materiales que ya existen.
6. **Hoja inferior en móvil** (F2). Una altura compacta con lo esencial y una expandida; «Ver en el plano» y salida claras; el plano sigue visible.
7. **Barra de escena 3D** (F3). Vista, cortes, luz y captura agrupados junto al lienzo, con un único estado.

## 6. Interacción, foco y estados

**Teclado:**

- Pestañas: ←/→, Inicio/Fin.
- Losetas y fichas: botones normales (Intro/Espacio).
- Banner: el foco va a su acción de salida.
- Esc cancela un modo, igual que el banner.

**Foco y legibilidad:**

- Foco visible de 3 px.
- Contraste de texto ≥ 4,5:1. El naranja de marca sobre blanco da 4,3:1, así que los botones primarios usan `#9c4f28` (5,9:1) y la ayuda, `#655d52` (6,4:1).

**Estados:**

- **Vacío:** un proyecto sin estancias abre «Construir».
- **Sin estancia para el hueco:** la paleta dice qué tocar y **no** entra en ningún modo.
- **3D:** «Construir» explica que se construye en 2D y ofrece «Ir al plano 2D».
- **Errores de colocación:** los del banner de #60, junto a la causa.

**Táctil:**

- Objetivos de 44 px o más.
- Una acción de la paleta cierra el cajón para mostrar el plano.

## 7. Secuencia de PR y puertas de decisión

| Fase | PR | Contenido | Puerta |
| --- | --- | --- | --- |
| 0 | Junto a F1 | Esta especificación, la línea base y la nota de roadmap | Revisión de Juanma |
| 1 | `feat/ux-build-palette` | Paleta «Construir / Amueblar» | Revisión visual de Juanma, auditoría de Codex y merge |
| 2 | Aparte, tras F1 | Inspector contextual, muestras y hoja inferior en móvil | Igual |
| 3 | Aparte, tras F2 | «Generar», guía y controles 3D; se reconcilia con #65 | Igual |
| 4 | Sin PR de producto | Tabla priorizada (§9) | Decisión de alcance por capacidad |

Cada PR incluye:

- el antes y el después de la tarea de §2, con la misma definición de acción;
- capturas en 1440×900, 390×844 y 844×390;
- pruebas Playwright de los flujos reales;
- la regresión afectada comparada con `master`;
- una vista previa (preview) del SHA exacto.

Si una mejora no reduce acciones, se dice y se explica qué aporta. No se atribuye menos error ni preferencia de los usuarios sin sesiones con D-01.

## 8. Fuera de este programa

Rediseño de marca, cambio de tecnología y nuevas capacidades de producto (§9).

## 9. Propuestas de producto posteriores (fase 4), priorizadas y sin aprobar

| Prioridad | Capacidad | Beneficio para D-01 | Evidencia LoRA LAB | Contrato | Esfuerzo | QA necesaria |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tipo de muro (carga / tabique) al dibujarlo y al editarlo | Plano más fiable para estudios y reformas; «Modificar muros» lo respeta | Visible (C1) | Ya existe `structure`; sólo interfaz y validación | S | Edición, deshacer, lámina y JSON/ZIP |
| 2 | Orientación: norte, mes y latitud, con barra de 0 a 24 h | Argumento de venta (luz real), como simulación orientativa | Visible e inferida (C3, V2) | Datos de presentación | S–M | 3D, presentación y rendimiento |
| 3 | Catálogo interior ampliado: iluminación, decoración, infantil y ocio | Presentar viviendas amuebladas más completas | Recorrido en V2 y V3 | No, si son genéricos | M | Licencias, 2D/3D y búsqueda |
| 4 | Huecos con geometría propia (doble, pivotante, garaje) y color de marcos | Puertas reales en promociones | Visible (C1, C2) | **Sí** | M–L | 2D, 3D, recorrido y revisión de puertas |
| 5 | Presupuesto de acabados en € | Estimación orientativa para reformas | Visible (C2) | Datos de precios; decisión D-05 | M | Fuente, moneda y avisos |
| 6 | Tercera planta | Viviendas de 3 alturas | Visible y ejecutada en la plantilla | **Sí** (`LIMITS.levels`) | L | Edificio completo |
| 7 | Escaleras en L, U y caracol | Dúplex reales | Visible e inferida | **Sí** | L | Huecos, BW5 y 3D |
| 8 | Exterior: terreno, fachada y cubierta | Viviendas unifamiliares | Visible e inferida | **Sí** | L | 3D y móvil |
| 9 | Cortinas | Presentación nocturna | Visible | **Sí** | M | 3D y recorrido |

**Ninguna de estas capacidades entra en las PR de UX** por aparecer en LoRA LAB.
