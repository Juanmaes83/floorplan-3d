# CC2 · Construir, Amueblar y Propiedades en ES/EN/ZH · Segundo corte de localización

**Fecha:** 21/11/2026 · **Rama:** `claude/cc2-construir-amueblar-propiedades` · **Base:** HEAD del corte anterior `06c16e765475dd1f20f89231bcb4aa2585fb30ee` (árbol `20865e1f85c29baf0e5300bebcb801f59ed53483`), que contiene el evento `rubik:languagechange`.
**Estado:** véase §H. No es PR productiva, no se fusiona, no se despliega, no se activa nada. R01 HOLD, F0/A0 congeladas, OP-07 inactivo, GOV-05 abierto: sin cambios. R03 y el panel R02-A «Techo y elementos altos» siguen cerrados en desarrollo y no se tocan.

El SHA y el árbol de la publicación se comunican en el informe de entrega (un archivo no puede contener el hash de su propio commit).

## A. Qué funciona ahora en los tres idiomas

El usuario puede trabajar en **Construir**, **Amueblar** y el **panel de propiedades**, cambiar de idioma en cualquier momento (cabecera, Home) con la paleta, el panel o la selección abiertos, y seguir con las mismas herramientas, proyecto y datos.

| Área | Qué se localiza |
|---|---|
| **Construir** (`build-palette.js`) | Pestañas, herramientas (Seleccionar / Medir / Modificar muros = «Demolish» en EN, como la cabecera), Estancias y los 14 nombres de ejemplo, Puertas y ventanas, Muros y trazado, Plantas y escalera, nota de 3D, consejo, avisos de contexto («Se añadirá a …»), banner de «Dibujar muro», `aria-label` y `title`. La paleta se reconstruye al cambiar el idioma conservando pestaña, «Más nombres» abierto y foco |
| **Amueblar** | Buscador (etiquetas, placeholder, filtros, contador, estado del catálogo, vacío), familias, tarjetas («Genérico» / «Modelo 3D autorizado»), nombres de los 25 modelos autorizados, «Traer mi mueble» (tarjeta, diálogo completo, errores, panel de foto) y «Producto de mi estudio». La búsqueda conserva la consulta al cambiar de idioma |
| **Propiedades** | Vista general (áreas, peto declarado, huecos solapados), muro (tipo declarado y procedencia), estancia (datos, sugerencia de tipo, intercambiar uso, puertas y ventanas, dimensiones, suelo y paredes), mueble (medidas, modelo 3D, cómo moverlo), **hueco** (`opening-ui.js`: posición y medidas, apertura, revisión, vista previa, errores y notas del núcleo), barra de selección inferior |
| **Amueblamiento inteligente** | «Amueblar esta estancia»: usos, densidad, recetas, propuesta, descartes, qué se comprueba, avisos y errores. Si hay una propuesta abierta se regenera con los mismos datos (misma semilla) al cambiar de idioma |
| **Diálogos** | Nueva estancia (con vista previa «antes → después»), Dimensiones, Nuevo proyecto, **Biblioteca de acabados** (suelo y pared; 50 acabados y 5 familias), «Traer mi mueble» |
| **Nombres** | 31 piezas del amueblamiento, 25 modelos y 50 acabados se muestran en el idioma de la sesión; **el dato guardado no se reescribe** |

## B. Problemas resueltos (causas, no síntomas)

1. **Paleta y paneles solo en español** (~48 + ~100 textos por idioma, más diálogos): causa, módulos escritos ES-first sin `LANG`. Ahora cada uno usa `LANG` (el sistema existente) y se reconstruye con el evento global.
2. **El panel de huecos mostraba mensajes del núcleo en español** (`opening-edit`, `room-layout`, `own-furniture-core`, `smart-furnishing-core`): el contrato conserva sus mensajes; la **capa de presentación** los traduce (`loc`/`human`/glosario) sin tocar el núcleo ni sus pruebas.
3. **Nombres de piezas y acabados escritos en español por RUBIK**: `nm` (el embudo único existente) consulta un diccionario de presentación `NAMES_FROM_ES`. El dato queda como está; solo cambia lo que se ve.
4. **Los ejemplos de nombre de estancia** (Salón, Cocina…): la clave `data-room-name` sigue en español (estable); la estancia nueva se nombra con el rótulo que la persona vio y eligió (dato propio, no se traduce después).
5. **Resultados con texto congelado**: la propuesta del amueblamiento llevaba el nombre de la estancia de cuando se generó; ahora se regenera al cambiar de idioma.
6. **Tarjeta «Producto de mi estudio»** y buscador se construían una sola vez: ahora siguen al idioma.
7. Atributos de accesibilidad (`aria-label`, `title`, `placeholder`, banners, diálogos) alineados con el texto visible en los tres idiomas.

## C. Rama, HEAD y árbol

En el informe de entrega (se verifican tras el push).

## D. Pruebas y evidencias

**Bloqueante nueva:** `tests/language-build-furnish-properties.browser.test.cjs` (registrada en `tests/regression-partitions.json`). Con el producto real, en 1440×900 y 390×844:

* **Paleta** (Construir y Amueblar): ES→EN→ZH→ES abierta; lo visible equivale **exactamente** a cargar en ese idioma; ninguna línea de EN/ZH distinta de la de ES salvo marcas y nombres propios; sin chino en ES/EN; proyecto y almacenamiento intactos.
* **Propiedades**: vista general, estancia, mueble, muro, hueco, hueco con cambio de tipo (vista previa y notas), hueco con error, propuesta del amueblamiento y su rechazo: paridad en vivo vs. carga limpia y sin restos de otro idioma.
* **Herramientas y atajos**: botones y atajos V / M / X en los tres idiomas; el nombre de estancia creado queda como lo eligió la persona y **no se reescribe** al cambiar de idioma.
* **Diálogos**: nueva estancia (con vista previa), dimensiones, nuevo proyecto, acabados de suelo y de pared, «Traer mi mueble» con errores: sin restos de otro idioma, **Escape** cierra sin cambiar el proyecto.
* **Buscador**: consulta conservada, nombres por idioma, el dato del catálogo intacto.

**La prueba nueva (41 casos) pasa 41/41.** Cuatro defectos reales que detectó durante el desarrollo y quedaron corregidos: resultado del amueblamiento con el nombre de la estancia congelado, vista previa de «Nueva estancia» mostrando nombres **en chino en ES/EN**, «Touch Controls» sin traducir en ES (móvil) y la tarjeta «Producto de mi estudio» que no seguía al idioma.

**Regresión sobre este árbol (Chromium 1243), todas verdes:** `browser-test-coverage` 1, `furniture-search` 3, `opening-edit` 10, `room-layout` 16, `smart-furnishing` 18, `surface-core` 6, `build-palette` 3, `room-layout.browser` 5, `opening-contextual` 9, `surfaces.browser` 8, `smart-furnishing.browser` 4, `wall-structure` 2, `k4-room-type` 3, `ui-language` 3, `build-measure-search` 3, `catalog-placement` 2, `p0-mue01-gc` 6, `ux03-wall-faces` 2, `ux08-live-dimensions` 3, `furniture-overlaps` 7, `assets.browser` 29, `ast01-levels-card` 4, `surface-sheet` 6, `language-home-navigation` 7, `guide.browser` 5, `professional-workspace` 17, `journey-orientation` 14, `upload` 9. Una ejecución de `opening-contextual` falló una vez mientras corrían otras suites en paralelo (carga de CPU) y pasó 9/9 en tres repeticiones; se deja constancia, no se ha reproducido.

**Compatibilidad (copia local sin publicar):** mi diff sobre #297 (`57b44558`) + resolución indicada en §G: `language-build-furnish-properties` **41/41**, `no-chinese-display` (#297) **4/4**, `language-home-navigation` y `ui-language` verdes.

**No ejecutado:** Firefox/WebKit, lector de pantalla real, Preview/Production, la suite completa de la CI.

Evidencias (1440×900 y 390×844): `docs/qa/artifacts/idioma-construir-amueblar-propiedades-2026-11-21/`.

## E. Funcionalidades conservadas

Herramientas, atajos (V, M, X, Esc…), historial, proyecto, geometría, persistencia, nombres originales, búsqueda, colocación, diálogos y vistas previas funcionan igual en ES: el texto español es **idéntico** al anterior (las pruebas existentes de estas áreas, listadas en §D, siguen verdes). No se cambia ningún contrato ni el modelo.

## F. Pendientes reales (fuera de este corte)

| Pendiente | Estado |
|---|---|
| Panel «Techo y elementos altos» (R02-A) y su capa en el lienzo | Cerrado en desarrollo: lo traslada `claude/r02a-idioma` (#296). No se duplica |
| Armarios R03 («Interior del armario…») | R03 / #297: no se toca |
| `aria-label` de licencias de modelos externos («Kenney — …», «Rubik Sota — MIT») | Nombres propios y licencias: no se traducen |
| Atribución completa de modelos de Asset Lab | Se traduce la cláusula fija («Uso autorizado por …»); el resto es dato del catálogo |
| Mensajes de error del núcleo no previstos (p. ej. validación del esquema) | Se muestran como los emite el núcleo (español) |
| Otras superficies heredadas (Plano propio / `tracing-ui`, Plantas / `building-ui`, importación / `plan-intake-ui`, Presupuestar y Entregar, `persistence-editor` —F0 congelada—) | Siguientes cortes; inventario por superficie en `residuales-por-superficie.json` del corte anterior |
| Firefox / WebKit, lector de pantalla real, Preview | No ejecutados |

## G. Handoff de integración para Codex

* **Orden recomendado:** #297 → corte «Home y navegación» (`claude/adoring-davinci-ko2xyr`, ya transferido) → este corte. Este corte parte del anterior (usa `rubik:languagechange`).
* **Conflicto previsto con #297 (único, trivial):** en `index.html`, **la línea de `nm`**: #297 la reescribe como `nmRaw` + `nm` (política «sin chino en ES/EN»). Resolución verificada: conservar el `nm` de #297 y poner en `nmRaw` los diccionarios nuevos:

  ```js
  const nmRaw = s => LANG === 'en' ? (NAMES_EN[s] ?? NAMES_FROM_ES[s]?.[0] ?? s) : LANG === 'es' ? (NAMES_ES[s] ?? s) : (NAMES_FROM_ES[s]?.[1] ?? s);
  ```
  y mantener el bloque `NAMES_FROM_ES` de este corte. Con esa resolución (copia local sin publicar) pasan las dos pruebas nuevas, `no-chinese-display` (#297) y `ui-language`.
* **R02-A / #296:** sin solapamiento de archivos (`r02a-ceiling-*.js`). El panel R02-A queda excluido de la prueba de este corte (selector `.r02a-ceiling`); al integrar #296 se puede quitar la exclusión.
* **STUDIO E3:** su cambio en `professional-workspace-ui.js` no se toca en este corte.
* **Contrato para quien añada texto a estas áreas:** `LANG`/`L3` o el `tx` local; los nombres visibles por `nm()`; los mensajes del núcleo por su capa de presentación. La prueba nueva falla si una superficie vuelve a mezclar idiomas.
* **CI:** la prueba nueva está en `blocking` de `tests/regression-partitions.json` (al final de la lista, para no chocar con las dos líneas que #297 añade al principio).

## H. Estado

**LISTO PARA CODEX**, con los límites de §F (R02-A y R03 fuera por mandato; otras superficies heredadas en cortes posteriores; sin Firefox/WebKit ni CI completa).
