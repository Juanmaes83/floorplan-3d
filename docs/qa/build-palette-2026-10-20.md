# QA — Paleta «Construir / Amueblar» (fase 1 del programa UX, 20-10-2026)

| Dato | Valor |
| --- | --- |
| Rama | `feat/ux-build-palette`, desde `master` `bd153c7` |
| Especificación | [Programa UX](../product/ux-program-2026-10-20.md) |
| Entorno | Chromium 141.0.7390.37 de Playwright 1.56.1 y Node 22.22.0, con render por software (SwiftShader, sin GPU). Teléfono emulado (`isMobile`, `hasTouch`), **no** físico |
| CI | **No ejecutada** |

## 1. Alcance

La columna izquierda pasa a tener dos pestañas: **Construir** y **Amueblar**. «Amueblar» es la biblioteca de siempre, sin cambios. «Construir» reúne en grupos acciones que **ya existían**:

| Grupo | Acción | Implementación reutilizada |
| --- | --- | --- |
| Herramientas | Seleccionar, Medir, Modificar muros | `setTool()`; sincronizado con la barra superior (`aria-pressed`) |
| Estancias | «Nueva estancia», 6 nombres de ejemplo y «Más nombres» (8) | `FloorPlanRoomUI.createRoom({name})`. El ejemplo sólo rellena el nombre (único: «Cocina 2») y **no guarda ningún tipo** |
| Puertas y ventanas | Puerta abatible, puerta corredera, ventana, hueco de paso (los 4 tipos del contrato) | `FloorPlanOpeningUI.startAdd(roomId, kind)` de #60. Va a la estancia de la selección (estancia, mueble o hueco). **Sin estancia, avisa y no entra en ningún modo** |
| Muros y trazado | «Dibujar muro», «Plano propio» | `FloorPlanTraceUI.start('wall')` con un **banner nuevo «Dibujando muros» y el botón «Terminar»**. «Plano propio» abre el panel existente |
| Plantas y escalera | «Plantas…» y «Escalera recta» | `FloorPlanBuildingUI.open()`. Con dos plantas lleva al formulario de escalera; con una, explica que antes hay que añadir la segunda |
| En 3D | Nota «Se construye en el plano 2D» y botón «Ir al plano 2D» | `setView('2d')` |

**Cambios de soporte:**

- `createRoom(opts)` acepta un nombre inicial.
- `FloorPlanOpenings.add` crea los 4 tipos de hueco; la apertura (`swing`) sólo se guarda en la puerta abatible. El contrato ya admitía los 4 tipos.
- El banner del hueco nombra el tipo, por ejemplo «Añadir ventana a «Cocina»».
- `FloorPlanTraceUI.mode()` pasa a ser público, de sólo lectura.
- En escritorio la columna izquierda pasa de 236 a 256 px.

**No incluido:** exterior, escaleras en U o en L, tercera planta, geometrías de puerta nuevas, tipos de estancia ni preajustes de ventana. No cambia `FloorPlanProjectV1`.

## 2. Tarea medida antes y después

Misma definición de acción: clic, toque, rellenar un campo o elegir una opción. Un cambio de modo es un control que cambia lo que hará el siguiente toque en el plano. Medida a 1440×900, con ratón. Script: `scripts/qa/openings/room-task.cjs`.

| | `master` `bd153c7` | Rama |
| --- | --- | --- |
| Estancia con nombre | 6 («+ Estancia», escribir el nombre…) | 6 («Más nombres», ejemplo…) |
| Puerta de 900 mm y ventana | 8 (incluye «← Estancia» para volver al panel) | **7** (las dos desde la paleta) |
| Suelo y acabado de pared | 8 | 8 |
| **Total** | **22 acciones, 2 cambios de modo** | **21 acciones, 2 cambios de modo** |

**Lectura honesta:**

- La paleta ahorra **una acción** en esta tarea. No se afirma que acelere el trabajo en general.
- Lo que aporta es otra cosa:
  - construir está en un solo sitio y no repartido entre la barra superior y los paneles;
  - se ven los 4 tipos de hueco (antes sólo puerta y ventana desde la estancia);
  - dibujar muros tiene un banner y una salida visibles;
  - se ve a qué estancia irá el siguiente hueco.
- No hay sesiones con usuarios D-01, así que no se atribuye preferencia ni menos errores.

## 3. Pruebas

Ver §6 para los resultados en el SHA final.

| Archivo | Cubre |
| --- | --- |
| `tests/build-palette.browser.test.cjs` (1440×900, 390×844, 844×390) | Pestaña inicial: ejemplo → Amueblar, proyecto vacío → Construir. Pestañas ARIA con flechas. Sólo los 4 tipos y nada de Exterior, U o 3F. Contraste del botón principal ≥ 4,5:1 también con el ratón encima. Herramientas sincronizadas; en móvil el cajón se cierra. Nombre de ejemplo y nombre repetido, sin tipo guardado. Hueco sin estancia: aviso y sin modo. Los 4 tipos, cada uno con su título de banner; apertura sólo en la abatible; deshacer y rehacer. Banner de muro: «Terminar» devuelve a navegar y el toque siguiente selecciona. Nota de escalera y diálogo de plantas. 3D → «Ir al plano 2D» (three.js local). Recarga, sin desplazamiento horizontal y sin errores de consola ni `pageerror` |
| `tests/opening-edit.test.cjs` | `add` crea cada tipo del contrato desde la estancia; `swing` sólo en la puerta abatible |

## 4. Defectos encontrados y corregidos durante la QA

| # | Defecto | Corrección |
| --- | --- | --- |
| 1 | La función de pestañas se llamaba `select` y tapaba la global `select(sel)` | Renombrada a `selectTab` |
| 2 | Un proyecto nuevo y vacío abría «Amueblar», lo que obligaba a un clic más | Al cambiar de proyecto sin estancias se abre «Construir» |
| 3 | En escritorio «Seleccionar» se partía en «Selecciona r» y los huecos quedaban bajo el pliegue | Columna de 256 px, herramientas en 3 columnas, 6 ejemplos más «Más nombres» |
| 4 | Con otro hueco seleccionado, añadir desde la paleta dejaba visible el panel del hueco anterior | Se selecciona la estancia antes de `startAdd` |
| 5 | Contraste: el naranja de marca da 4,3:1 y el texto gris 3,8:1 | `#9c4f28` (5,9:1) y `#655d52` (6,4:1) |
| 6 | **Con el ratón encima, o tras un toque en esa zona, la regla genérica `.btn:hover` pintaba de beige «Nueva estancia» con texto blanco, ilegible.** Visto en la captura a 844×390 y reproducido con `getComputedStyle` | Regla específica `.btn.palette-primary:hover` (hover `#86421f`) y aserción de contraste en la prueba |

## 5. Revisión visual

Capturas en [`artifacts/ux-program/palette/`](artifacts/ux-program/palette/), con la línea base en [`artifacts/ux-program/baseline/`](artifacts/ux-program/baseline/).

- **1440×900:**
  - Construir se lee de arriba abajo: herramientas, estancias, huecos, muros y plantas.
  - Los cuatro huecos quedan en pantalla sin desplazar.
  - El plano pierde 20 px de ancho.
- **390×844:** cajón de 320 px. «Nueva estancia» y los 4 huecos se ven sin desplazar; «Plantas y escalera» requiere desplazar; al elegir, el cajón se cierra y queda el banner sobre el plano.
- **844×390:** el cajón tiene desplazamiento vertical. El banner de muros no tapa la barra.
- **Previo y ajeno a esta PR:** en teléfono, el botón flotante «← Inicio» tapa parte de la cabecera («Crear y amueblar»). No se corrige aquí; queda para la fase 2 o 3.

## 6. Resultados en el SHA final

PENDIENTE

## 7. Límites

- Sin GPU representativa, sin teléfono físico y sin CI.
- La tarea se mide con un script y no con personas.
- La reducción es de 1 acción en una sola tarea.
- La paleta añade 20 px a la columna izquierda en escritorio.
