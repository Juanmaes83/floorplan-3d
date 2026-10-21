# Experiencia profesional premium: diagnóstico, diseño comparado y cortes (20-10-2026)

**Objetivo.** Que Rubik se vea y se use como una herramienta profesional de arquitectura, sobria y minimalista. Y que una inmobiliaria, una promotora, un estudio, una empresa de reformas o un decorador entregue a su cliente una presentación cuidada con su identidad profesional.

**Pregunta rectora.** En cada pantalla y en cada estado: «¿Qué debe entender y hacer aquí el usuario?». Se responde dos veces: para quien usa Rubik por primera vez y para el profesional que prepara una entrega.

**Reglas de Juanma para este programa:**
- No se elimina ningún botón ni ninguna función: consolidar es reubicar o agrupar, conservando las vías necesarias.
- Las mejoras no pueden empeorar la plataforma.
- Sin regresiones.
- Frontend responsive.

## 0. Estado real y coordinación

| Elemento | Estado (20-10-2026) |
| --- | --- |
| `master` | `bd153c7` |
| #66 (fase 0 y paleta «Construir / Amueblar») | Borrador. Juanma la revisó el 20-10-2026: corregir `Fin` y el hueco compartido, mantener los nombres, aceptar provisionalmente los 256 px y aprobar la especificación como guía de las fases 2 y 3. **Sin fusionar.** |
| #65 (dos plantas en una presentación y un lote) | Borrador, sin revisión humana. **No se presupone fusionada.** La marca se diseña para no crear un segundo sistema de presentación (§5). |
| #48 (estudio LoRA LAB y referencias) | Borrador. Referencias C1–C4 y V3 en `docs/qa/artifacts/loralab/references-2026-10-19/`. |
| #64, #61, #36 | Borradores documentales; no se tocan. |
| Esta rama | `feat/premium-ux-system`, **apilada sobre #66** porque parte de la paleta vigente. Si #66 cambia, esta rama incorpora sus cambios por merge. |

**Fuentes leídas:** `docs/ROADMAP.md`, `docs/ROADMAP-2-proposal.md`, `docs/product/F0-decisions.md` (D-01, D-05, D-08, D-09), `docs/product/editor-ux-pattern-2026-10-19.md` y su QA, el estudio #48 y la matriz visual, los contratos `FloorPlanProjectV1` y `FloorPlanBuildingV1`, `presentation.json` y el código real de bienvenida, editor, 3D, presentación, lámina y exportación.

**Sobre LoRA LAB** (lo visto, ejecutado o inferido está en la matriz de #48):
- **Se aprovecha:** el orden por intención (pestañas Construir / Amueblar, que ya están en #66), la columna derecha contextual y el contexto visual de la escena 3D.
- **No se copian** sus colores ni su marca.

## 1. Diagnóstico

**Método.** `scripts/qa/ux/journey.cjs` recorre los estados reales a 1440×900, 390×844 y 844×390:
- bienvenida;
- editor guiado;
- editor completo sin selección y con una estancia seleccionada;
- menú «Archivo»;
- 3D;
- configuración de la presentación;
- edificio con un aviso pendiente.

Para cada estado guarda una captura y el inventario de controles visibles: región, énfasis dominante y tamaño táctil. Las capturas del estado actual están en `docs/qa/artifacts/premium-ux/current/`.

### 1.1 Recorrido: qué debe entender y hacer, y dónde se desorienta

| Paso | Qué debe entender y hacer | Qué ve hoy (evidencia) | Punto de desorientación |
| --- | --- | --- | --- |
| Llegada | Elegir cómo empezar | Bienvenida con tres entradas, aviso de medidas orientativas y buscador (#62) | Bien resuelta. El tono cálido no transmite todavía «herramienta profesional» (observación visual) |
| Subir o crear | Cargar su plano o empezar vacío | Diálogo de importación o proyecto vacío con «Crear primera estancia» | — |
| Calibrar y construir | Fijar la escala y crear estancias y huecos | Paleta «Construir» (#66) y banners de modo | En el teléfono, la paleta sólo se abre desde la cabecera, que se desplaza en horizontal (D1) |
| Editar propiedades | Saber qué modifica y cómo volver | Panel con «Volver» y grupos (#62) | El naranja indica a la vez acción, selección y estado activo (D3) |
| Resolver avisos | Saber qué falta y por qué | Aviso discontinuo rojo «2 conflictos… Revisar» | «Presentar mi vivienda» sigue siendo la llamada más visible aunque la presentación está bloqueada (D5) |
| Explorar en 3D | Orientarse y comparar | Escena sobre un plano color crema, sin contexto | La vivienda flota sin suelo ni horizonte (observación; §4) |
| Preparar la presentación | Elegir vistas y orden | Diálogo «Presentar mi vivienda» | Correcto. No hay portada, autoría ni cierre para el cliente (§5) |
| Exportar y entregar | Saber qué recibe el cliente | Lámina SVG, PNG 2D/3D y lote ZIP | **Ninguna entrega lleva identidad profesional ni datos de contacto** (código: `js/sheet-ui.js`, `presentation-ui.js`) |
| Volver más tarde | Encontrar su proyecto | «Proyectos» y biblioteca local | En el teléfono, «Proyectos» queda fuera de la pantalla (D1) |

### 1.2 Hallazgos demostrados por código o medición

| # | Hallazgo | Evidencia |
| --- | --- | --- |
| D1 | **En el teléfono, 38 de los 41 controles de la cabecera están fuera de la pantalla.** La cabecera es una franja con desplazamiento horizontal de 2914 px (`overflow-x:auto`). Sin desplazarla no se ven 2D/3D, Deshacer, «Archivo», «Crear y amueblar», «Propiedades», «Proyectos» ni «Presentar». A 844×390 quedan fuera 27 | Medición con `getBoundingClientRect` en `bd153c7`+#66 |
| D2 | **Varias llamadas dominantes a la vez.** En el editor completo de escritorio aparecen 3 controles rellenos de color o de oscuro: «Subir plano», «Plano 2D» y «Seleccionar», más «Amueblar» en la paleta. «Presentar mi vivienda», que es el siguiente paso del profesional, sólo tiene contorno | Inventario: `dominant` = 3 en j03, j04, j06 y j08 |
| D3 | **Un mismo color con 6 significados.** El naranja `#b5653a` marca la acción principal («Subir plano»), la vista activa (2D/3D), la pestaña activa, los paneles abiertos, las capas activas y la cifra de superficie útil. Así, una selección parece una acción | `index.html`: `.btn.primary`, `.seg .pill`, `.btn.chip.on` y `.palette-tab[aria-selected]` |
| D4 | **Contraste por debajo de AA** en tres roles: texto secundario `#8a8174` 3,78:1, naranja con texto blanco 4,3:1 y ficha activa (naranja sobre melocotón) 3,44:1 | Cálculo WCAG |
| D5 | La entrada «Presentar» se ve igual cuando la distribución está pendiente. El bloqueo sólo aparece al pulsarla (`FloorPlanBuildingUI.gate`) | Captura j08 |
| D6 | Texto en inglés en la interfaz española: «Keyboard Shortcuts» en el panel de vista general | `index.html:1422`: falta en `ES_TEXT` |
| D7 | Hay 285 colores hexadecimales distintos en `index.html` y solo 98 usos de `var(--…)`. El cromo de la interfaz no tiene un sistema de roles | Recuento |
| D8 | El 3D tiene el fondo y el suelo planos (`0xf7f4ee` y `0xf2eee7`). La escena se ve como una maqueta sobre papel | `index.html:2320` y `:3421` |
| D9 | **Ninguna entrega al cliente lleva identidad profesional**: ni la lámina, ni los PNG 2D/3D, ni el ZIP. Tampoco la atribución de Rubik | Código citado en §5 |

### 1.3 Inventario de acciones repetidas

**Criterio:** se consolida sólo lo que confunde, sin eliminar ninguna vía.

| Función | Vías actuales | Diagnóstico | Propuesta |
| --- | --- | --- | --- |
| Subir plano | Cabecera (dominante), «Archivo → Subir plano o proyecto», bienvenida y buscador | Necesarias para empezar. En el editor, no debe ser la llamada dominante | Se conservan todas. **La de la cabecera pasa a secundaria** |
| Importar JSON y Subir plano | «Archivo → Importar proyecto JSON» y «Subir plano», que también acepta JSON/ZIP | Se solapan, pero la importación crea un proyecto nuevo y lo explica | Se conservan. Revisar más adelante los textos de ayuda (fuera de este corte) |
| Herramientas Seleccionar, Medir y Modificar muros | Barra superior y paleta «Construir» (#66) | Duplicado intencionado y sincronizado. En el teléfono, la de la cabecera queda fuera de la pantalla, así que la paleta es la vía real | Se mantienen. Una sola apariencia de «activo» |
| Nueva estancia | «+ Estancia», paleta y estado vacío | El estado vacío y la paleta guían; la cabecera es atajo | Se mantienen |
| Vaciar distribución | «Archivo → Vaciar» y «Vaciar distribución» en la vista general | **Misma función con dos nombres** | Un solo nombre: «Vaciar distribución» |
| 2D/3D | Cabecera, «Abrir 3D» de la guía e «Ir al plano 2D» de la paleta | En el teléfono, la de la cabecera queda fuera de la pantalla (D1) | 2D/3D siempre visible en el teléfono (barra inferior) |
| Crear y amueblar / Propiedades | Cabecera y la barra de selección (`#fab`) en el teléfono | Sin selección, en el teléfono no hay una vía visible | Barra inferior en el teléfono |
| Presentar | Cabecera y guía (etapa 5) | Correcto; la guía oculta la de la cabecera | Se mantiene. Es la acción principal del editor completo |

### 1.4 Observaciones visuales e hipótesis

**Observaciones** (capturas, no medidas):
- La paleta crema y naranja se lee doméstica y cálida, no de arquitectura.
- La tipografía mezcla una serif grande en la bienvenida con una sans en el editor; la serif aporta carácter editorial.

**Hipótesis** (requieren personas D-01; §7):
- Un profesional confiará más en una interfaz neutra con un solo acento.
- Una entrega con su logo y su contacto aumentará la percepción de trabajo preparado.
- Un contexto 3D suave hará la escena más comprensible.
- **Ninguna de estas hipótesis se presenta como resultado.**

## 2. Principios visuales y de interacción

1. **Una acción dominante por estado.** El relleno de color se reserva a la acción principal. Las demás son secundarias (contorno) o terciarias (texto).
2. **Acción y selección nunca comparten color.**
   - Acción: acento petróleo.
   - Selección: grafito, con forma propia (pastilla oscura, subrayado o ✓).
   - El significado no depende sólo del color: `aria-pressed`, `aria-selected`, ✓ o subrayado.
3. **Roles semánticos con token propio:** superficie, tinta, acción, selección, foco, información, aviso, error, éxito y destructivo. Todo el cromo usa roles, no hexadecimales.
4. **Contraste AA en todos los estados:** normal, hover, foco, pulsado, seleccionado, deshabilitado y error. El foco es un anillo de 3 px que no depende del fondo.
5. **El plano y el contenido son protagonistas.** Las maderas, los colores de muebles y los materiales son contenido, no interfaz; no se recolorean.
6. **En el teléfono, lo esencial siempre está al alcance del pulgar.** Nada esencial queda sólo dentro de una franja con desplazamiento horizontal.
7. **El texto dice lo que ocurrirá:** verbos claros, sin claves internas ni promesas de certificación.

## 3. Direcciones visuales comparadas

**Cómo se compararon.** Las tres direcciones se probaron sobre **los mismos estados reales**, con una hoja de prototipo inyectada sin cambiar el producto: `THEME_CSS=… journey.cjs`.

- **Estados:** bienvenida, editor con estancia seleccionada, estado con aviso, 3D y configuración de la presentación.
- **Archivos:** capturas lado a lado en `docs/qa/artifacts/premium-ux/directions/`; hojas de prototipo en `docs/qa/artifacts/premium-ux/directions/*.css`.

| Dirección | Base | Acción principal | Selección |
| --- | --- | --- | --- |
| **A · Perla** | Neutros gris perla (`#eceeee` app, `#ffffff` paneles), tinta grafito `#1f2326` | Petróleo `#1f5a66` | Grafito `#2b3034` |
| **B · Grafito** | Cabecera oscura `#232527`, lienzo claro | Verde abeto `#2e6b52` | Claro sobre oscuro |
| **C · Papel técnico** | Blanco cálido `#f6f5f2`, líneas finas | Azul tinta `#24476b` | El mismo azul |

**Contraste WCAG medido:**

| | Actual | A | B | C |
| --- | --- | --- | --- | --- |
| Texto principal / panel | 14,4 | 15,8 | 16,3 | 14,8 |
| Texto secundario / panel | **3,78** | 6,21 | 6,60 | 6,18 |
| Blanco sobre acción | **4,30** | 7,74 | 6,29 | 9,60 |
| Activo suave | **3,44** | 6,45 | 5,20 | 8,07 |
| Acción frente al fondo | 3,75 | 6,65 | 5,17 | 8,80 |

**Comparación razonada:**

| Criterio | A · Perla | B · Grafito | C · Papel técnico |
| --- | --- | --- | --- |
| Legibilidad | Alta | Alta en el lienzo; la cabecera oscura cansa en sesiones largas | Alta |
| Jerarquía | **Clara**: acción petróleo frente a selección grafito | Clara, pero la cabecera oscura compite con el plano | **Débil**: acción y selección comparten azul (incumple el principio 2) |
| Confianza profesional | Sobria y arquitectónica | Muy «CAD» y técnica, menos cercana para inmobiliarias | Técnica y limpia |
| Aprendizaje | Bueno: un único color que buscar | Bueno | Peor: un activo parece un botón que pulsar |
| Continuidad con las entregas | Los neutros encajan con láminas y portadas sobre blanco | Las entregas sobre blanco rompen con la cabecera oscura | Buena |
| Viabilidad técnica | **Alta**: el cromo ya es claro y los blancos incrustados siguen siendo coherentes | **Baja**: con la cabecera oscura, «Inicio», «Archivo», «EN» y «Pantalla completa» quedan **invisibles** porque usan `#fff` incrustado (visto en la captura). Exige rehacer casi todos los controles | Alta |

**Elegida: A · Perla.** Es la única que cumple a la vez el principio 2 y una viabilidad alta. El terracota de Rubik se conserva sólo como **rastro de marca**: logotipo de la bienvenida, flecha de «Entrada» y contenido del plano. No es un color de interfaz.

**Cambios de mayor impacto por iniciativa propia** (más allá del color):
1. **Barra inferior en el teléfono (D1).** Lleva «Crear y amueblar», 2D/3D y «Propiedades»: se reubican los mismos botones.
2. **Una sola llamada dominante (D2).** «Presentar mi vivienda» en el editor; «Subir plano» pasa a secundaria.
3. **Aviso que bloquea con anticipación (D5).** La entrada de la presentación muestra su estado pendiente.
4. **Nombre único para «Vaciar distribución»** y traducción de los atajos (D6).
5. **Contexto 3D suave y entrega con marca** (§4 y §5).

## 4. Entorno visual 3D (corte B)

**Qué aporta el verde de LoRA LAB** (visible en C3 y V3): separa la vivienda del vacío y da sensación de escala y de exterior. **Riesgo:** en un piso urbano sugiere un jardín que no existe.

**Comparación prevista** en la misma escena, de día y de noche:

| Entorno | Suelo | Fondo | Para |
| --- | --- | --- | --- |
| Estudio (neutro) | Perla mate | Degradado perla | Por defecto: piso, plantas interiores y entregas sobrias |
| Jardín suave | Verde desaturado, con transición a perla | Cielo claro | Viviendas unifamiliares y presentaciones comerciales |
| Ciudad | Gris pavimento | Gris cálido | Edificios en ciudad |

**Decisión de diseño:**
- El contexto es **seleccionable**, con «Estudio» por defecto.
- Se guarda como preferencia de presentación del navegador. No va en el proyecto, porque no forma parte del modelo.
- Las capturas y la presentación usan el entorno elegido, así que el editor y la entrega no divergen.
- **Aviso fijo junto al selector:** «Fondo decorativo: no representa terreno, jardín ni entorno urbano reales».

**Medición:**
- renderer y tiempo de fotograma (SwiftShader frente a GPU real; la GPU real la pide Juanma);
- legibilidad de muros y muebles;
- capturas comparables.

## 5. «Tu Marca Profesional» (corte C)

**Pregunta de diseño.** «Si este profesional entrega la presentación, ¿parece un trabajo preparado y firmado por él? ¿Sabe el cliente de quién procede y cuál es el siguiente paso?»

**Hechos del contrato** (código citado):
- `FloorPlanProjectV1` rechaza cualquier campo desconocido; sólo admite `extensions.x-*`, que es experimental (`js/project-schema.js:8,315-320`).
- `FloorPlanBuildingV1` rechaza dentro de `extensions` claves como «building» o «floor» (`js/building-core.js:14,27-36`).
- Los ZIP sólo admiten rutas de una lista cerrada (`js/project-package.js:7`, `js/building-core.js:264`).
- **Ninguna entrega lleva hoy autoría ni marca.**
- Deben seguir visibles:
  - la autoría de la plataforma y la cláusula de no reventa (`index.html:576-579`);
  - las atribuciones de terceros («sin afiliación»);
  - «medidas orientativas / verifica in situ».

**Decisión, aprobada por Juanma el 20-10-2026:**
- **Perfiles de marca locales del navegador**, como el vínculo de variantes de D-C1. Hay varios perfiles reutilizables, porque una persona puede trabajar para varias empresas.
- **Cada proyecto puede elegir su perfil.** La elección y los datos propios del proyecto (título e introducción para el cliente) se guardan en un registro local ligado a la entrada de la biblioteca.
- **La marca se incrusta como instantánea** en lo que recibe el cliente. Editar el perfil después no cambia las entregas ya generadas.
- **No cambia ningún contrato ni la lista de rutas de los ZIP.** El JSON y el ZIP editables no llevan datos de marca, así que no hay filtraciones al exportar el proyecto.

**Experiencia:**
- **Configurar:** «Tu marca» en el menú del proyecto. Campos:
  - nombre comercial (obligatorio);
  - persona responsable;
  - teléfono, correo y web;
  - logo PNG/JPG/WebP de 512 KB como máximo, redimensionado a 600 px;
  - lema breve.
- **Validar:**
  - el logo se descodifica como imagen y se vuelve a codificar en PNG, así que no puede llevar contenido activo;
  - se rechaza SVG;
  - la web debe ser `https?://`;
  - se comprueban el correo y el teléfono;
  - hay longitudes máximas.
- **Previsualizar:** la portada y el pie de la lámina, con el perfil activo.
- **Aplicar:** en la configuración de «Presentar mi vivienda» y de la lámina, «Firmar con: [perfil] / Sin marca».
- **Retirar:** «Sin marca» deja la entrega completa de hoy.

**Entregas:**

| Entrega | Con marca | Sin marca |
| --- | --- | --- |
| Lámina | Banda de título con el logo, el nombre comercial, el título del proyecto y el contacto. Pie: «Preparado por … con Rubik Sota · Cotas orientativas; verifica in situ» | Igual que hoy |
| Presentación en pantalla | Portada con el logo, el título y la introducción; en cada vista, el nombre comercial discreto; cierre con el contacto («Siguiente paso: contacta con …») | Igual que hoy |
| Vistas PNG del lote | Franja inferior con el logo, el nombre comercial y el título | Sin franja |
| Lote ZIP | Las vistas firmadas y la lámina | Igual que hoy |

**Coordinación con #65.**
- La portada y el cierre se aplican sobre el recorrido de vistas, sin crear otro sistema de presentación.
- Mientras #65 esté abierta, el corte C se aplica a la presentación de una planta y a la lámina. Al integrar #65, sus vistas por planta reciben la misma franja.
- Esto se documenta como dependencia.

**Atribución.** La marca del profesional nunca sustituye la autoría de la plataforma ni las licencias de terceros. El pie dice «Preparado por [profesional] con Rubik Sota» y conserva los avisos. No se afirma certificación ni precisión técnica (D-01).

## 6. Cortes de implementación

| Corte | Tarea de usuario completa | Criterios de aceptación | Dependencias | Prueba visual |
| --- | --- | --- | --- | --- |
| **A. Sistema visual y jerarquía de acciones** | «Entiendo qué es pulsable, qué está seleccionado y cuál es el siguiente paso; en el teléfono encuentro 2D/3D, la paleta y las propiedades sin desplazar la cabecera» | Roles semánticos en `:root`. AA en todos los estados. Una sola acción dominante por estado en el editor. Acción ≠ selección. Barra inferior en el teléfono con los mismos botones. Inventario de capacidades: los 41 controles de la cabecera y la paleta existen y son alcanzables. «Atajos de teclado» traducido. Mismo nombre para «Vaciar distribución». Sin regresiones frente a la base | #66 (apilada) | `journey.cjs` antes y después en las 3 medidas |
| **B. Entorno 3D** | «Veo la vivienda en un contexto agradable y elijo el adecuado para mi cliente» | 3 entornos, de día y de noche. «Estudio» por defecto. Aviso de fondo decorativo. Captura y presentación coherentes. Rendimiento registrado | A | Capturas 3D lado a lado y PNG exportado |
| **C. Tu Marca Profesional** | «Entrego a mi cliente una lámina y una presentación firmadas con mi marca» | Perfiles locales (crear, editar, borrar, varios). Selección por proyecto. Instantánea en la lámina, la presentación y el PNG. Validación de logo, web, correo y teléfono. Sin marca = entrega actual. Sin datos de marca en JSON ni ZIP editables. Proyectos antiguos sin cambios | A; #65 para las vistas por planta | Contenido real de SVG, PNG y ZIP, con y sin marca |

Cada corte se publica como PR en borrador con:
- preview del SHA exacto;
- capturas antes y después;
- pruebas que fallan con el comportamiento anterior;
- regresión comparada con la base.

## 7. Validación con personas D-01 (protocolo preparado; sin resultados)

**Participantes:** de 3 a 5 personas de inmobiliarias, promotoras o estudios. Navegador propio, en escritorio y en teléfono.

**Tareas:**
1. «Abre el proyecto de ejemplo y añade una ventana al dormitorio principal».
2. «Prepara una presentación de la vivienda para un cliente con 3 estancias».
3. «Entrega a tu cliente una lámina con tu marca» (a partir del corte C).

**Hoja de observación** (por tarea):
- qué identifican como siguiente paso;
- dónde retroceden;
- controles que ignoran o no encuentran;
- errores;
- tiempo empleado;
- frase literal de duda;
- valoración de 1 a 5 de «parece un trabajo profesional», sólo como opinión.

**Sin participantes no hay resultados.** Las hipótesis de §1.4 siguen abiertas.
