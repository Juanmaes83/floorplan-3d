# F3 — búsqueda local de muebles (01-10-2026)

## Estado y base comprobados

Mejora UX sobre `feat/f3-textured-external-catalog`, sin nueva rama/worktree.
Checkout inicial limpio; HEAD local/remoto `742b8df371458149af5482e217267274c22679b4`.
Master remoto consultado `6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f`.
El historial F3 existente se conserva. La consulta pública de PR abiertas mostró
#1/#2/#3/#15/#16; #15 es Roadmap 2 y #16 descubrimiento de edición de estancias,
ambas documentales, sin esta rama. Durante las pruebas master avanzó a
`194e457846b420c48a2cfd85eb69845e616d1a9e`, merge de #16: añade únicamente
`docs/product/room-dimension-editing-discovery.md`, sin solapamiento con estos cambios.
La rama F3 remota no avanzó por otra edición. No se mezclan esas propuestas ni se
cambia la base/historial de esta rama.

**Implementación publicada para revisión; entrega pendiente de preview verificable,
revisión humana y merge. F3 permanece abierta.** F2 conserva cinco sesiones y veinte
planos pendientes. No cambia el contrato/schema 1.3.0, geometría ni importación.

## Inventario y etiquetas reales

Única fuente de genéricos: `js/generic-catalog.js`, 60 entradas, con nombres españoles
existentes en `NAMES_ES` de index. Conservamos dimensiones, tipos y orden originales.
IDs de exploración `ci:ii` preservados; no son nuevos IDs persistidos del proyecto.

| Estancia exacta de la interfaz | Genéricos |
| --- | ---: |
| Dormitorio | 12 |
| Salón | 14 |
| Cocina y comedor | 11 |
| Baño | 8 |
| Electrodomésticos | 9 |
| Estudio y ocio | 6 |

La estancia describe uso habitual; la familia describe tipo de objeto. Las diez
familias se derivan de los tipos presentes; no aparecen filtros vacíos:

| Familia | Genéricos | Tipos existentes |
| --- | ---: | --- |
| Asientos | 10 | chair, sofa, cornersofa, armchair, beanbag, barstool, officechair |
| Camas | 4 | bed, crib |
| Mesas | 8 | nightstand, desk, coffeetable, sidetable, table, roundtable |
| Almacenaje | 10 | wardrobe, dresser, bookshelf, tvstand, shoecab, cabinet |
| Iluminación | 1 | floorlamp |
| Decoración y plantas | 4 | baycushion, rug, plant |
| Electrodomésticos | 13 | stove, fridge, washer, waterheater, tv, aircon, acwall, dishwasher, ovencol, dryer, purifier |
| Sanitarios | 6 | ksink, toilet, vanity, shower, bathtub |
| Superficies de cocina | 2 | island, counter |
| Ocio | 2 | piano, treadmill |

Se mantienen ubicaciones que cruzan familias: lavadora/termo en Baño y frigorífico
en Cocina y comedor; no se trasladan silenciosamente al grupo Electrodomésticos.
La cómoda genérica llamada «Tocador» conserva nombre/tipo/dimensiones existentes.

Los modelos se obtienen **solo de `FloorPlanAssetUI.entries`**, después de que
`FloorPlanAssets.adapt` acepte el catálogo cargado. Tres entradas actuales:

| Entrada | Etiqueta | Estancia / familia | Soporte genérico persistido |
| --- | --- | --- | --- |
| Banco sintético de prueba | Modelo 3D autorizado, atribución Rubik Sota/MIT | Estudio y ocio / Asientos | chair |
| IKEA SONGESAND — cómoda blanca | Modelo 3D autorizado, atribución IKEA y autorización de Juanma | Dormitorio / Almacenaje | dresser |
| IKEA STOCKHOLM 2025 — puf Alhamn beige | Modelo 3D autorizado, atribución IKEA y autorización de Juanma | Salón / Asientos | beanbag |

El mapeo explícito de los tres IDs es metadata UX/fallback, no una segunda lista de
productos disponibles ni de dimensiones. No convierte el banco sintético en una
silla comercial. Los IDs desconocidos no se anuncian hasta tener mapeo explícito.
Las medidas provienen del catálogo validado, nunca de etiquetas/sinónimos; el
[origen, autorización, medidas y texturas](F3-initial.md#piloto-externo-texturizado-01-10-2026)
se mantienen sin modificaciones.

## Comportamiento

Buscar muebles aparece arriba de la biblioteca, con Borrar y Todos. La consulta
ignora mayúsculas/tildes/espacios repetidos y combina palabras mediante AND. Busca
nombre visible/español, tipo persistido, familia y sinónimos explícitos; ejemplos:
`sofa`/`sofá`, `nevera` → fridge, `lampara` → floorlamp, `pouf` → puf. No consulta
nombres privados del proyecto; no hay fetch, analytics ni envío de la búsqueda.

Estancia y familia son selects semánticos combinables. Todos limpia consulta y
ambos filtros; Borrar conserva filtros y devuelve foco al buscador. Sin coincidencias
muestra mensaje y acción para limpiar todo. Los resultados se muestran directamente
bajo las agrupaciones existentes, sin acordeones que abrir. Hay contador live/polite,
foco visible y activación de fichas con Enter/Espacio, tap o arrastre existente.

Fichas diferenciadas por texto «Genérico» o «Modelo 3D autorizado», además de familia,
nombre y ancho × alto × fondo en mm. El asset muestra atribución real. El icono es el
soporte genérico; no una fotografía ni garantía visual del modelo comercial.

Genérico: misma función de inserción, mismos valores predeterminados. Modelo: crea
un objeto nuevo de su tipo fallback con dimensiones del catálogo y `assetRef` en la
misma operación de historial. Esta elección expresa del resultado no redimensiona
ningún objeto previo. Propiedades conserva la asociación F3 previa, que no altera
medidas del objeto seleccionado. Undo/redo, guardado, recarga y 2D/3D siguen el flujo
existente. El buscador no almacena consultas ni filtros en proyectos.

Durante carga del catálogo permanecen los 60 genéricos y aparece estado de carga.
Si un catálogo falla se conserva el otro y se informa; entradas excluidas no aparecen.
«Modelo autorizado» acredita aceptación del catálogo, no un GLB ya renderizado:
el texto indica que su carga se verifica al abrir 3D. Hash, permiso, bytes, dimensiones,
formatos, timeout/cancelación y límites de textura siguen en el cargador F3. Si falla
el GLB, estado comprensible y soporte genérico conservan tamaño, posición e identidad.

En móvil se usa el drawer existente, con dos columnas de fichas y filtros en selects
para no introducir otra fila de chips desbordante. Tap cierra el drawer para colocar/
editar; abrirlo de nuevo conserva búsqueda. Las fichas permiten scroll vertical y
arrastre al plano. Los controles no añaden espacio fuera del drawer ni reducen el
canvas al cerrarlo. No se cambian dependencias, assets, servidores ni permisos de red.

## Verificación y fallos registrados

Pruebas unitarias derivan 60+3 entradas, rechazan IDs duplicados/tipo desconocido,
validan términos/familias no vacíos y dimensiones por referencia al catálogo. Cubren
nombre exacto/parcial, tildes/case/espacios, sinónimo/tipo, filtros combinados y vacío.

Navegador cubre teclado desktop y tacto 390×844/844×390; contador/limpieza/foco,
genérico bed con dimensiones originales, inserción de ambos IKEA con medidas y
assetRef, renderizado, recarga y vuelta 2D/3D. Prueba aparte catálogo pendiente,
entrada QA excluida, catálogo 404 y GLB 404 con fallback intacto. Observa GET sin
cuerpo ni query; la consulta privada no se transmite. No se debilitan los controles F3.

Primer ensayo dirigido: **1/4 pasa, 3 fallan**. La prueba esperaba una sola coincidencia
para «pouf», pero la búsqueda devolvía correctamente el genérico y el autorizado.
Se corrigió la expectativa y la selección por la etiqueta/ID de asset; no se ocultó
el genérico. Repetición de los tres recorridos: **3/3**, cero fallos/skips.
La suite completa posterior valida también las nuevas capturas y métricas.

Validaciones ejecutadas adicionales: `python3 tests/schema.test.py` **10/10**;
`python3 tests/f2_readiness.test.py` **12/12**;
`python3 tests/f2_wall_evaluation.test.py` **16/16**;
`python3 tests/f2_raw_export.test.py` **3/3**;
`python3 scripts/generate-f3-bench.py --check` y
`python3 scripts/prepare-f3-pouf.py --check`: PASS, sin cambiar assets.
`node --check` sobre furniture-search.js, asset-ui.js, furniture-search.test.cjs y
assets.browser.test.cjs: PASS; scripts de index extraídos a
`/tmp/search-inline-14.mjs` y `/tmp/search-inline-17.mjs`: PASS, importmap como JSON.
Comprobación stdlib de enlaces relativos/fences Markdown y `git diff --check`: PASS.

Las primeras capturas se tomaron durante la animación del drawer y mostraban la
biblioteca parcialmente fuera de pantalla. Se añade una espera hasta que su borde
izquierdo llegue a cero; no se confunde ese artefacto temporal de captura con una
validación visual completa. Los resultados finales se registran debajo.

## Revisión visual para Juanma

1. En escritorio, abrir Biblioteca: escribir `SOFÁ`, `sofa`, `nevera` y `lampara`.
   Comprobar etiquetas, medidas, contador y foco al borrar.
2. Buscar `silla`, filtrar Cocina y comedor + Asientos: aparece la silla de comedor.
   Pulsar Todos. Buscar un término inexistente y limpiar desde el mensaje vacío.
3. Insertar una cama genérica; comprobar 1800×1100×2000 mm en propiedades.
4. Buscar SONGESAND, insertar su ficha autorizada y comprobar 820×810×500 mm,
   atribución y asociación. Repetir con `pouf`: distinguir genérico del IKEA
   690×400×650 mm. Abrir 3D, regresar a 2D y recargar; conservar muebles y referencias.
5. Repetir en 390×844 y 844×390: abrir/cerrar Biblioteca y Propiedades, colocar,
   seleccionar y editar sin quedar atrapado en el drawer. Probar scroll/arrastre.
6. Verificar estos pasos en la **preview del SHA final**, cuando su URL y deployment
   estén confirmados. Las capturas locales no sustituyen esa revisión ni la aprobación.

## Resultados finales y evidencia publicada

`node --test --test-concurrency=1 tests/*.test.cjs`: **134/134**, 0 fallos,
0 cancelados, 0 skipped; 466565.21831 ms. Incluye catálogo/búsqueda, assets,
proyecto/F1a, biblioteca local, tracing/F1b, F2 y navegador completo.
Ejecución sobre código `ab61ea366044151c6df870647c59cc8bb2d07fec`.
Después se ajusta la espera de animación de captura y se compacta la disposición de
controles en horizontal (<500 px de alto), conservando targets táctiles de 44 px.
La captura estable detectó que los controles dejaban el primer resultado casi fuera
de pantalla; se coloca Todos/contador junto al campo. Se repite la suite de búsqueda
y assets/navegador sobre ese ajuste final; no se atribuye la suite completa anterior
a los bytes CSS posteriores.

[Log completo Node](../qa/artifacts/furniture-search/node-regressions.txt) ·
[Python/generadores](../qa/artifacts/furniture-search/python-results.json).
Capturas y métricas por viewport en [furniture-search](../qa/artifacts/furniture-search/):
conteos, referencias y medidas de fixtures sintéticos, peticiones GET sin cuerpos/query
y errores de página. No contienen consultas ni planos privados de personas usuarias.
Estas son **pruebas locales con Chromium/SwiftShader por software**, no rendimiento
físico ni una navegación en la preview Vercel. Se mantienen los presupuestos F3.

## Publicación y bloqueo concreto de preview

El commit de código `ab61ea366044151c6df870647c59cc8bb2d07fec` se publicó con
`git push origin HEAD`, sin force. La rama conserva los tres commits previos del
piloto. El ajuste posterior de CSS solo compacta controles en pantallas horizontales;
los commits documentales no cambian la aplicación ni assets.
[Rama](https://github.com/Juanmaes83/floorplan-3d/tree/feat/f3-textured-external-catalog) ·
[Preparar PR hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/f3-textured-external-catalog?expand=1).

La creación de PR por REST falló de nuevo con
`Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
No se intentó GraphQL. Las consultas de `/commits/ab61ea366044151c6df870647c59cc8bb2d07fec/status`
y `/deployments?sha=ab61ea366044151c6df870647c59cc8bb2d07fec` también devolvieron
`Forbidden`. La página pública de ese commit es accesible pero no proporciona
una URL verificable de Vercel. No hay conector/CLI Vercel disponible y no se instala.
Se solicitó el enlace real para intentar verificarlo desde este entorno.

**Preview del SHA final pendiente:** URL, READY, SHA desplegado y condición de
acceso/autenticación no comprobados. CI remota no verificada; las pruebas anteriores
son ejecución local. No se presenta una preview antigua ni una URL deducida como
vigente, ni un check de comentarios como prueba de funcionamiento.

**La mejora no se declara terminada.** Implementación y regresiones locales disponibles
para revisión; faltan PR/preview comprobable, revisión visual humana y aprobación.
Sin merge ni despliegue manual a producción. Abrir el compare y comprobar el deployment
Vercel asociado al HEAD de esta rama antes de seguir los pasos de revisión anteriores.

## Comprobación final del ajuste horizontal

`node --test --test-concurrency=1 tests/furniture-search.test.cjs tests/assets.test.cjs tests/assets.browser.test.cjs`: **24/24**, 0 fallos/cancelados/skips,
172939.736522 ms, sobre `eb6559c4c922b59aaef9e8298ee828d4140cf711`.
[Log final](../qa/artifacts/furniture-search/final-assets-regressions.txt).
Incluye la suite completa de assets y los cuatro nuevos recorridos de búsqueda,
además de las pruebas unitarias. El código final difiere del de la suite 134/134
únicamente en las siete líneas de CSS del ajuste horizontal. Los commits posteriores
solo incorporan esta documentación y evidencia.

Capturas finales identificadas por ese SHA:
[escritorio](../qa/artifacts/furniture-search/1440x900-authorized.png),
[vertical](../qa/artifacts/furniture-search/390x844-authorized.png),
[horizontal](../qa/artifacts/furniture-search/844x390-authorized.png).
Cada viewport incluye también búsqueda genérica (`lampara`) y métricas JSON.
En horizontal las fichas/atribución completas se consultan desplazando la biblioteca;
los controles mantienen 44 px y el primer resultado ya es visible sin desplazarla.
Cero errores de página en esos recorridos; peticiones GET sin cuerpo ni consulta.
Se preservan las capturas históricas del piloto previo en f3-textures.
La preview exacta del HEAD publicado sigue siendo una comprobación independiente
y pendiente; no se declara terminada la entrega ni cerrada F3.
