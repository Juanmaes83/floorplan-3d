# QA — Corte A: sistema visual «Perla», jerarquía de acciones y barra del teléfono (20-10-2026)

| | |
| --- | --- |
| Rama | `feat/premium-ux-system`, apilada sobre #66 (`feat/ux-build-palette` `5967fa2`) |
| Diseño | [Diagnóstico, direcciones comparadas y cortes](../product/premium-ux-design-2026-10-20.md) |
| Entorno | Chromium 141.0.7390.37 (Playwright 1.56.1) y Node 22.22.0, con SwiftShader (sin GPU). Teléfono emulado, **no** físico |
| CI | **No ejecutada** |

## 1. Problema y resultado para el usuario

| Problema medido (§1.2 del diseño) | Resultado |
| --- | --- |
| D1. En el teléfono, 38 de los 41 controles de la cabecera estaban fuera de la pantalla; 2D/3D, la paleta y las propiedades sólo aparecían desplazando la cabecera | «Crear y amueblar», 2D/3D y «Propiedades» están siempre a la vista, en la **barra inferior** (vertical) o en una **columna a la derecha** (horizontal). Son los mismos botones, con los mismos ids y manejadores. El plano termina antes de la barra y nunca queda debajo |
| D2. Tres controles rellenos a la vez compiten por la atención | **Una sola acción dominante por estado:** «Nueva estancia» en un proyecto vacío; «Presentar mi vivienda» cuando hay algo que presentar; ninguna mientras la distribución del edificio está pendiente. «Subir plano» sigue en la cabecera como secundaria |
| D3. El naranja tenía 6 significados | Acción en petróleo `#1f5a66` y selección en grafito `#2b3034`, con señal de forma: pastilla, subrayado, anillo o ✓ |
| D4. Contraste por debajo de AA | Texto secundario 6,21:1; acción 7,74:1; activo 6,45:1 |
| D5. «Presentar» se veía igual con la distribución pendiente | La entrada dice «· pendiente», usa borde discontinuo de aviso y su descripción accesible explica por qué y qué hacer |
| D6. «Keyboard Shortcuts» en la interfaz española | «Atajos de teclado» |
| Duplicado «Vaciar» / «Vaciar distribución» | Un solo nombre: «Vaciar distribución» |
| Defecto previo: el «← Inicio» fijo tapaba el control al desplazar la cabecera del teléfono | `scroll-padding` lo evita; la prueba lo demuestra con el código anterior |

**No cambia** ningún contrato, flujo, atajo ni capacidad. Ningún control se elimina.

## 2. Alternativas consideradas

- **Direcciones B (Grafito) y C (Papel técnico):** descartadas en el diseño (§3), con capturas lado a lado.
- **Menú «Más» que oculte acciones en el teléfono:** descartado. Ocultaría capacidad y obligaría a abrir un menú para tareas frecuentes.
- **Duplicar los botones esenciales:** descartado; son dos vías con el mismo nombre.
- **Mover los mismos nodos a una barra:** elegido. Con `display:contents`, en escritorio la cabecera queda igual.
- **Barra horizontal también en el teléfono apaisado:** probada y descartada. A 844×390 tapaba el muro inferior de la estancia y el toque para colocar un hueco caía en la barra, como detectó `build-palette`. La columna lateral conserva la altura, que es lo escaso en esa posición.

## 3. Pruebas nuevas

`tests/premium-shell.browser.test.cjs`, en 1440×900, 390×844 y 844×390, comprueba:

- **Inventario de capacidades:** los 72 controles de la cabecera y de la columna izquierda registrados antes del corte (`tests/fixtures/capability-inventory.json`, generado sobre `5967fa2`):
  - existen;
  - una persona puede alcanzarlos: tras abrir su cajón, pestaña o menú y desplazarlos a la vista, son visibles y nada los tapa (comprobado con `elementFromPoint`);
  - los controles de 3D se comprueban en 3D.
- **Teléfono:** «Crear y amueblar», 2D/3D y «Propiedades» están dentro de la pantalla sin desplazar la cabecera, miden 40 px o más de alto y abren la paleta.
- **Jerarquía:**
  - con estancias, sólo «Presentar mi vivienda» lleva el color de acción;
  - en un proyecto vacío, sólo «Nueva estancia»;
  - con la distribución pendiente, ninguna; la entrada dice «pendiente» y lleva su `aria-description`.
- **Selección y contraste:** 2D/3D, la herramienta activa y el panel activo no usan el color de acción. El contraste es de 4,5:1 o más en la acción, la herramienta activa, la ayuda de la paleta y el texto secundario.
- **Textos y foco:** «Atajos de teclado» y «Vaciar distribución»; anillo de foco de teclado de 3 px.
- **Sin** desplazamiento horizontal y **sin** errores de consola ni `pageerror`.

**Demostrado con el código anterior (`5967fa2`):**
- 1440×900 falla la jerarquía, porque había varios controles con relleno dominante;
- 390×844 y 844×390 fallan el inventario: «Subir plano» y «Vista aérea» quedan tapados por «← Inicio».

## 4. Defectos encontrados y corregidos durante el corte

| # | Defecto | Corrección |
| --- | --- | --- |
| A1 | Mi primera señal de «hay más a la derecha» era una `mask-image` en la cabecera, que también recortaba la barra fija (descendiente) y la dejaba invisible | Degradado *sticky* con pseudoelemento, sin máscara |
| A2 | La prueba de contraste leía el token como hexadecimal (`NaN`) | Se lee el color calculado |
| A3 | En horizontal, la barra tapaba las últimas opciones de «Archivo» y del menú «Mostrar» | Los menús abiertos se apilan por encima de la barra y terminan antes de ella |
| A4 | **Regresión detectada por `build-palette`:** a 844×390 la barra tapaba el muro inferior y el toque de colocación caía en ella | El plano termina antes de la barra; en horizontal la barra es una columna lateral |
| A5 | En horizontal, el panel de propiedades cerrado asomaba por detrás de la columna | El margen sólo se aplica con el panel abierto |
| A6 | En el teléfono, la barra de selección tapaba la escala | Resuelto por A4: ya no hay solape |

## 5. Regresión

PENDIENTE: suites completas en el SHA final, comparadas con la base `5967fa2` en las mismas condiciones.

## 6. Límites y decisiones abiertas

- **Sin GPU real ni teléfono físico.** La barra se ha comprobado con emulación táctil; la comodidad real con el pulgar requiere un teléfono.
- **Desktop:** la cabecera mantiene las 3 filas aprobadas en #62; sólo cambia la jerarquía visual.
- **Colores incrustados que quedan:**
  - el contenido del plano (maderas, muebles, selección naranja en el plano) no se recolorea, porque es contenido;
  - algunos fondos de componentes antiguos siguen siendo cálidos y se irán migrando;
  - la lámina y las exportaciones usan su propia paleta (se trata en C).
- **Preferencia y mejora:** no se han medido con personas D-01 (protocolo en el diseño, §7).
