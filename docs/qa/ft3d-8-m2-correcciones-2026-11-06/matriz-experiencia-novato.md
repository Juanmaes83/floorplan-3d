# Matriz de experiencia — usuario novato (nueva matriz, misión 2)

**Método.** Se entra en RUBIK sin ningún dato, como quien lo abre por primera vez, y se completa el proceso de obra **solo con lo que se ve en pantalla**:
1. ejemplo y copia propia;
2. Presupuestar;
3. Plan de obra;
4. Evolución 4D;
5. Entregar.

En cada pantalla se anota si se entiende qué hacer después. El recorrido está automatizado y grabado:
- test: `tests/qa-m2-novato.browser.test.cjs`;
- vídeo: V5 en `ronda-3/evidencias/v5-novato.webm`.

**Criterios** de cada pantalla:
- (C) **claro**: se entiende qué es y qué hacer;
- (V) **visual**: jerarquía y estado visibles;
- (O) **ordenado**: los pasos van en el orden del trabajo;
- (G) **guiado**: hay un siguiente paso explícito;
- (S) **sin errores**.

## Hallazgos de la auditoría de novato y estado

| ID | Pantalla | Hallazgo (antes, sobre `49e8feb`) | Criterio | Corrección (en `1620ba6`) | Prueba de cierre | Estado |
|---|---|---|---|---|---|---|
| N-01 | Presupuestar | Las tarjetas (Cantidades, Presupuesto, Fuentes, Plan de obra, Precios) se mostraban como una lista plana, sin orden ni siguiente paso. | O, G | Bloque **«Recorrido de obra»** con 5 pasos numerados, el estado real de cada uno y **una sola acción principal** en el siguiente paso. | N.3, N.5, N.9, N.13, N.14 | Corregido |
| N-02 | Presupuestar | «Precios de referencia» aparecía después de «Plan de obra», aunque los precios van antes. | O | El recorrido ordena el trabajo: precios → plan → vínculos → evolución → entrega. Las tarjetas se mantienen como detalle. | N.3 | Corregido |
| N-03 | Presupuestar y Entregar | La Evolución 4D y Entregar no se anunciaban hasta que existía un plan. | G | Los pasos 4 y 5 son visibles desde el principio, con el motivo («Disponible cuando el plan tenga tareas»). | N.3 | Corregido |
| N-04 | Plan › tarea | La casilla «Hito» quedaba descolocada y lejos de su texto, por una regla global `dialog input{width:100%}`. | V | Casillas a tamaño real (20 px), junto a su texto, solo en los diálogos de obra. | captura `v5-04` | Corregido |
| N-05 | Plan › elementos | Las casillas de la lista de elementos se estiraban y se separaban del texto. | V | La misma corrección; además, el selector de papel tiene ancho propio. | captura `v5-04` | Corregido |
| N-06 | Plan › elementos | «Muro de 0,54 m · existente»: no se sabe qué muro es. | C | Cada muro y hueco lleva el nombre de las estancias que toca: «Muro de 5,38 m · Salón», «Muro · Cocina / Pasillo»; los de fachada, «fachada». | N.7 (filtro «salon») | Corregido |
| N-07 | Plan › elementos | Hay que recorrer 70 muros sin ninguna búsqueda. | C, G | Buscador «Buscar: estancia o tipo (p. ej. cocina, ventana, suelo)», sin distinguir acentos. | N.6, N.7 | Corregido |
| N-08 | Plan › tarea | «RUBIK no tiene un tipo «hito» aparte»: texto técnico. | C | Ahora dice: «Es un hito: un momento de un solo día, como «Fin de obra»». | — | Corregido |
| N-09 | Recorrido | «Mira la obra día a día» nunca se marcaba como hecho, así que el recorrido nunca terminaba. | G | Se marca hecho al abrir la Evolución del proyecto o si ya hay una entrega. Al final: **5 de 5 pasos**. | N.14 | Corregido |
| N-10 | Entregar | Al pie aparecían créditos técnicos («Geometría: FloorPlanCore.geometry…»). | C | Ocultos dentro de RUBIK; el laboratorio los conserva. | N.10b | Corregido |
| N-11 | Entrega al cliente | Jerga interna: «(C1-C4)», «no verificable por C1-C4» y textos sin tildes. | C | Texto llano: «Importes presupuestados sin IVA…», «No se puede comprobar que el presupuesto corresponda a esta versión del proyecto» y «Simulación… evolución». | N.10b, D-12 | Corregido |
| N-12 | Recorrido ↔ Entregar | El recorrido decía «documento HTML» y Entregar, «presentación para el cliente». | C | Se usa el término de la UI en los dos sitios: «vídeo y presentación para el cliente». | N.11 | Corregido |
| N-13 | Recorrido | Al cerrar un diálogo abierto desde el recorrido, el recorrido no se actualizaba. | G | Al cerrar se redibuja el recorrido y el foco va al **nuevo siguiente paso**. | N.5, N.9 | Corregido |
| N-14 | Recorrido | El plan guardado en forma compacta (0.1.0) se leía como si no tuviera vínculos. | S | Se lee en forma completa (`canonical`), igual que el editor. | N.9 | Corregido |
| N-15 | Evolución | Al abrirla, el foco se quedaba detrás, en la página oculta, y Escape cerraba el espacio de trabajo invisible. | S | El foco entra en la Evolución («← Volver a RUBIK») y el espacio de trabajo ignora Escape mientras la Evolución está abierta. | EX-11-k.4 | Corregido |
| N-16 | Plan | Con cambios sin guardar, «Eliminar plan» y «Duplicar plan» desaparecían o quedaban inactivos sin explicación. | C | Se muestran deshabilitados y con el motivo: «Guarda o descarta los cambios antes de…». | V4.11 | Corregido |
| N-17 | Móvil | El recorrido en un teléfono de 390 px. | V | Cabe sin desbordar y con botones de al menos 44 px. | N.M1, N.M2 | Comprobado |

## Lo que el novato consigue, de principio a fin (V5)

| Paso | Qué hace | Qué le guía | Comprobación |
|---|---|---|---|
| 0 | Portada | «Probar el ejemplo» | N.1 |
| 1 | Copia propia | «Crear mi copia» | N.2 |
| 2 | Presupuestar | Recorrido de obra: «Siguiente: pon precio a las partidas» | N.3 |
| 3 | Pone los 11 precios | «Total», sin «parcial», cuando no falta ninguno | N.4, N.5 |
| 4 | Plan de obra | «Crea el plan de obra», tarea a tarea, con el buscador | N.6–N.8 |
| 5 | Guarda el plan | Recorrido: plan y vínculos «hecho» | N.9 |
| 6 | Evolución 4D | «Ver evolución 4D»; reproducir y pausar | N.10 |
| 7 | Entregar | Acción principal «Generar vídeo y presentación», sin jerga técnica | N.10b, N.11 |
| 8 | Descarga | La presentación para el cliente queda lista y se descarga | N.12 |
| 9 | Fin | 5 de 5 pasos hechos y ningún siguiente paso pendiente | N.13, N.14 |

## Fuera de alcance o pendiente (no se oculta)
- **El recorrido guiado general** (Preparar → Diseñar → Amueblar → Revisar → Entregar) no incluye todavía la obra. Hoy se llega por «Presupuestar», donde está el nuevo Recorrido de obra. Unir los dos recorridos es una **decisión de producto del propietario**, que tocaría el núcleo de la guía compartida (`guide-core`).
- **Las fechas de los campos** (`dd/mm/aaaa` o `mm/dd/yyyy`) siguen la configuración del navegador, no la de la página.
- **El importe asignado «(incompleto)»** en la Evolución aparece cuando quedan partidas sin repartir entre tareas. Es la regla de M2; no se ha cambiado el texto.
