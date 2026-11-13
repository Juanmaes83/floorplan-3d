# R03 · Revisión humana definitiva del editor de armarios (antes del GO de activación)

**Rama de revisión:** `review/r03-editor-in-rubik-20261113` (#215, **NO FUSIONAR**), sobre `master@2a76cd6` (#214 integrado SIN activación).
**Qué se revisa:** solo el **parche de `index.html`** de esta rama (`git diff`: +14 −4 líneas, en seis puntos, §3 de `docs/technical/r03-professional-20261113.md`). Todo lo demás ya está en `master`.
**Qué NO autoriza esta revisión:** fabricación, presupuesto, CAT-03, uso comercial ni GOV-05.
- El interior es **paramétrico experimental**: medidas supuestas, no de fabricante.
- Activar el editor exige un GO **aparte**, que además haga desaparecer a propósito las dos pruebas de bloqueo del gate `pure`.

## 1. Preparación

1. Abrir la **Preview de esta rama** al SHA indicado en #215. Es una Preview protegida; ChatGPT facilita el acceso.
2. Comprobar que es el proyecto de ejemplo de RUBIK: piso «Rubik Sota», con datos sintéticos.
3. Hay que probar en **escritorio** y en **móvil**:

| Dispositivo | Cómo se ve el editor |
|---|---|
| Escritorio, ratón y teclado | Diálogo centrado |
| Móvil vertical | Hoja a pantalla completa, con «Cerrar» arriba a la derecha |

## 2. Prueba C — pasos exactos

Cada paso indica qué hacer y qué debe verse. Si algo no coincide, se anota el número del paso y el dispositivo.

| # | Acción | Debe verse (escritorio y móvil) |
|---|---|---|
| 1 | En el plano, tocar la **cama** del dormitorio principal | En «Propiedades» **no** aparece «Interior del armario…» |
| 2 | Tocar el **armario** de 2400 × 600 mm del dormitorio principal | Aparece **«Interior del armario…»**, junto a Girar, Duplicar y Eliminar |
| 3 | Pulsar «Interior del armario…» | Título «Interior · Armario ropero … · 2400 × 600 mm» y aviso fijo «Interior paramétrico experimental: medidas supuestas, no de fabricante…» |
| 4 | Pulsar **«Dividir módulo»** | El módulo 1 se parte en dos (en el ejemplo, 577,5 → 279,75 + 279,75 mm) y aparece un aviso **verde**: «Módulo dividido.» |
| 5 | **Escritorio:** pulsar **Escape** | El diálogo **no se cierra**. Aviso rojo: «Hay cambios sin guardar. Pulsa Escape otra vez para cerrar sin guardarlos.» |
| 5m | **Móvil:** tocar **«Cerrar»** | **No se cierra.** Aviso rojo: «… Pulsa «Cerrar» otra vez …» |
| 6 | Escape (o «Cerrar») **otra vez** | Se cierra **sin guardar**. El foco vuelve a «Interior del armario…». El proyecto no ha cambiado: «Deshacer» de RUBIK no tiene ningún paso nuevo |
| 7 | Abrir de nuevo y pulsar «Dividir módulo» **varias veces seguidas** | Llega un momento en que se rechaza: aviso **rojo** «Módulo 1: cada módulo necesita al menos 150 mm de anchura libre…» y **los módulos no cambian** |
| 8 | Con el aviso rojo, pulsar Escape | **No se cierra**: siguen pendientes las divisiones válidas de antes |
| 9 | Pulsar **«Añadir balda»** y después **Ctrl+Z** (solo escritorio) | La balda desaparece: deshace **dentro** del armario. El proyecto de RUBIK no se toca |
| 10 | Escribir la altura de una balda a **20 mm** de la otra y pulsar Intro | Aviso rojo con «60 mm». El campo vuelve a su valor y nada cambia |
| 11 | En «Alto cajón», escribir **400**; luego pulsar **«+»** (un cajón más) hasta que se rechace | En el último «+», aviso rojo con los números («… cajones de 400 mm … no caben» o «… 60 mm libres … sobre los cajones») y nada cambia |
| 12 | Pulsar **«Restablecer»** | Vuelve exactamente a como estaba al abrir |
| 13 | Dividir una vez y pulsar **«Guardar interior»** | Aviso verde «Interior guardado en el proyecto. Se puede deshacer con «Deshacer» de RUBIK.» |
| 14 | Pulsar Escape (o «Cerrar») | Se cierra **a la primera**: no hay cambios pendientes |
| 15 | Ir a **Escena 3D** | El armario muestra su interior: módulos, barras, baldas y cajones, con la altura del mueble (2200 mm) |
| 16 | En RUBIK, **Deshacer** (Ctrl+Z o el botón) | El interior guardado desaparece (vuelve al armario genérico) |
| 17 | **Rehacer** (Ctrl+Shift+Z o el botón) | El interior vuelve |
| 18 | **Recargar la página** | El interior sigue ahí |
| 19 | **Duplicar** el armario | La copia tiene el mismo interior |
| 20 | **Eliminar** la copia | Desaparece con su interior; el original sigue igual |
| 21 | En móvil vertical y horizontal | No hay desplazamiento horizontal. La cabecera y el aviso se ven completos. Los botones se pueden pulsar |

**Resultado esperado:** los 21 pasos coinciden en escritorio y en móvil. Para el GO, anotar en #215: dispositivo, navegador y «C superada / no superada (pasos …)».

## 3. Resultados automáticos al SHA de esta revisión (local, Chromium con SwiftShader)

Tras fusionar `master@2a76cd6` en la rama de revisión, sin conflictos.

| Suite | Resultado |
|---|---|
| `r03-editor-in-rubik` (navegador) | **7/7**: 1440×900, 390×844 y 844×390; prueba C ×2; división y cierre ×2 |
| `r03-editor` (laboratorio, navegador) | 16/16 |
| Puras R03 (`integration-core`, `contract`, `editor`, `audit`, `bridge`) | 46 pasan, **2 fallan a propósito** |

Las dos que fallan a propósito son las pruebas de bloqueo:
- `A4 … nothing in RUBIK loads`;
- `I0: no schema expansion or editor binding is implicitly authorized`.

Las dos comprueban que `index.html` **no** carga R03. **No se relajan.**

**Qué cubre la suite dentro de RUBIK**, con aserciones, no a ojo:
- guardar = **un** paso del deshacer de RUBIK;
- Escape y «Cerrar» con y sin cambios;
- Ctrl+Z del diálogo deshace la edición del armario y nunca el proyecto;
- división válida frente a rechazada (`dirty`);
- deshacer y rehacer de RUBIK;
- 3D: altura del mueble y más de 10 piezas;
- recargar conserva el interior;
- duplicar con interior y borrar sin huérfanos;
- el foco vuelve al botón;
- sin desplazamiento horizontal;
- 0 errores.

**Lo que la automatización no sustituye:**
- la **lectura humana** de los avisos;
- la **comodidad táctil** en un teléfono real;
- el **juicio visual** del 3D en una GPU real (aquí es SwiftShader).

## 4. Para activar (decisión del propietario, NO incluida aquí)

1. GO R03 de activación sobre el SHA concreto de esta rama, tras la prueba C humana.
2. Decidir cómo se integra el parche de `index.html`: por cirugía de ChatGPT o integrando esta rama. Las pruebas de bloqueo se actualizarían **en ese mismo corte autorizado** y nunca antes.
3. GOV-05 (derechos del donante) sigue registrado como riesgo residual: es una puerta aparte.
