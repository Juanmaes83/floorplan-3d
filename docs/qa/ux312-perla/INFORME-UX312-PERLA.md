# UX-312 / PERLA · Informe de entrega (Claude Code 1)

Fecha: 23/11/2026. Producto `Juanmaes83/floorplan-3d`, rama `claude/vibrant-clarke-woev1u`.

**Estado: candidata para revisión.** La aprobación visual, la fusión y Production quedan pendientes de autorización del
propietario. Esta rama no toca `master` ni ramas de otros agentes.

## Identificación

| Dato | Valor |
|---|---|
| Encargo | Laboratorio `rubik-sculpt-simulator-lab`, `codex/bpdp-premium-video-qa` @ `52b06bd3`, `QA-CODEX/UX-312/` |
| Base #321 | `5e641f9b3a21d59c4de1c1d8f09cea753b026ae3` (master `6ca70a5b`) |
| Composición | #321 + candidata BP-DP `f68fcd65` (`86d14fec`, árbol `ea4ac2f5`) + `codex/bpdp-integracion-perla` @ `52271b4d` (conexión de Blueprint y Despiece a Home y Entregar, sin cambios) |
| HEAD entregado | ver «Publicación» al final (SHA, árbol y Preview) |

Commits de este corte: `3dc6db8e` editor en dos filas y lámina SVG · `dedde718` composición con Codex · `dcfb2af1`
Entregar · `f0272d0a` Home · `085c3342` y `cfddc59d` correcciones encontradas al validar · commit final con este informe.

## Resultados por requisito

Comprobado con **Playwright CLI 0.1.24 sobre Chromium 153** (render por CPU, SwiftShader), servido en loopback. Scripts
en `scripts/`, resultados en `resultados/`, capturas en `capturas/`.

### Editor en dos filas (V4)

| Requisito | Resultado | Evidencia |
|---|---|---|
| Fila 1: Inicio, selector de proyecto, «Crear copia»; áreas centradas y con más peso; utilidades compactas | CONSEGUIDO | `perla-editor-escritorio`, funcional 46/46 |
| Fila 2: Subir plano ▾, Archivo ▾, Plano 2D / Escena 3D, paso real de la guía, «Tareas del proyecto», «Presentar vivienda», acción principal | CONSEGUIDO | La acción principal es la de la tarea actual (`guidePrimary`): mismo texto, estado y efecto |
| Jerarquía: primaria vino `#783B4B` con sombra suave y halo de foco `#F4E8EC`; segundo nivel verde petróleo `#1F5A66`; laterales `#FAF7F8`; lienzo neutro | CONSEGUIDO (medido) | Colores leídos del DOM: `rgb(120,59,75)`, `rgb(31,90,102)`, `rgb(250,247,248)`, `rgb(238,240,240)` |
| Lienzo: Cotas, Estancias, Muebles, Mostrar ▾; zoom, Ajustar, 1:60 / 1:100, barra de escala; norte; paneles | CONSEGUIDO | En 3D la barra de escena va abajo a la izquierda y deja libres la navegación 3D, el minimapa y las capas (`perla-3d-1536`) |
| Inspector: Estancias · Propiedades · Informe; Propiedades al seleccionar; Asistente al pie | CONSEGUIDO | Flechas entre pestañas; con selección se ve el panel vigente entero |
| «Retirar tabique» = modo `demolish` | CONSEGUIDO | |
| Conservar todas las funciones | CONSEGUIDO con dos decisiones abiertas (ver «Decisiones») | Inventario 263 → 274 controles, **0 perdidos** (`inventario-antes/despues.json`); controles del modo guiado ocultos igual que en la base, con su equivalente en la paleta; en el editor completo vuelven a la vista en una tercera fila |
| Destino y efecto real de cada acción | CONSEGUIDO | `funcional-escritorio.json`: 46/46 (áreas, biblioteca, búsqueda, Mi estudio, ayuda, legal, importar, JSON y PNG descargados, guía a demanda con Escape y retorno del foco, 3D, presentación, zoom, escala, capas, plegar paneles, Inspector, Asistente, copia del ejemplo) |
| Móvil vertical y horizontal, toque, zoom 200 %, teclado | CONSEGUIDO | `funcional-movil-teclado.json`: 35/35 (sin desplazamiento horizontal, objetivos ≥ 36 px, Construir / Inspector / Asistente con el dedo, orden de Tab y anillo de foco en las 19 paradas de la cabecera) |
| ES / EN / ZH; nunca chino en ES/EN | CONSEGUIDO | Funcional (tres idiomas) y `no-chinese-display` |

### Entregar

| Requisito | Resultado | Evidencia |
|---|---|---|
| Fichas compactas en el índice: título, estado y acción; descripción al pasar el cursor; «Ver detalles» con teclado y toque; la cuadrícula no se mueve | CONSEGUIDO | `perla-entregar-detalle`; posición de la ficha vecina idéntica antes y después |
| «Ver todos los documentos y entregables»: catálogo completo | CONSEGUIDO | 24 salidas y 7 herramientas o accesos, con recuento separado (`catalogo-entregar.json`) |
| Formato, estado, requisitos y acción por salida; requisito a la vista cuando bloquea | CONSEGUIDO | Render IA sin vistas: bloqueada con su requisito; con las vistas preparadas se desbloquea y abre sin generar |
| Rutas directas: informe de orientación, vídeo del recorrido, enlace para el cliente, dossier económico con sus formatos, imágenes, exportaciones de trabajo | CONSEGUIDO | Cada acción usa el MISMO generador de su tarjeta o de E3 |
| Lámina E3 en SVG | CONSEGUIDO | E3 y la tarjeta D2 de la Home decían «PDF · PNG»; el generador descarga SVG. Descarga comprobada |
| Vuelta al origen | CONSEGUIDO | En las 22 rutas probadas, al cerrar: foco en su ficha, catálogo abierto, área Entregar (`funcional-entregar.json`) |
| Blueprint 3D y Despiece 3D: dos visores junto a Presentación 3D, dos láminas en Documentación, dos vídeos en Presentaciones | CONSEGUIDO (composición con Codex) | Las cuatro rutas abren el visor sobre la revisión activa y vuelven a su ficha. Vídeos y cancelación: prueba de Codex `bpdp-routes` (ver Regresión) |

### Home

| Requisito | Resultado | Evidencia |
|---|---|---|
| Diez tarjetas en «Descubre RUBIK en acción», dos columnas en escritorio y una en móvil | CONSEGUIDO | `funcional-home.json` 25/25; diez portadas distintas cargadas |
| Portadas que explican su función | CONSEGUIDO con dos límites | Ver «Límites». Procedencia de cada imagen en `assets/welcome/PROCEDENCIA.md` |
| Acciones: recorrer, ver vídeo, ver comparativa, probar la consulta, ver estilos sin generar, ver una entrega sin publicar | CONSEGUIDO | `?demo=recorrido` llega al paseo con joystick y minimapa; `?demo=asistente` muestra «Hay 13 estancias en 1 planta» con su fuente; las muestras abren archivos reales y devuelven el foco |
| Retrato del oficio junto al resumen, cambiado a la vez que resumen, guía y soluciones; Constructora completada | CONSEGUIDO | Seis profesiones con seis retratos y seis resúmenes distintos (`despues-home-profesion-*`) |
| «Módulos para tu trabajo» compactos con «Ver detalles» | CONSEGUIDO | Teclado en escritorio, toque en móvil, sin mover la rejilla |

## Inventario de salidas comprobadas

| Salida | Formato real | Qué se obtuvo |
|---|---|---|
| Ficha de superficies | PDF (impresión) | Diálogo `surfaceSheetDialog` |
| Lámina profesional | SVG | `rubik-sota-sheet-prj_reference-home.svg` |
| Dossier del proyecto | PDF (impresión) | Diálogo `dossierDialog` |
| Informe de orientación y emplazamiento | PDF (impresión) | Diálogo `siteReportDialog` (mismo informe que Analizar) |
| Plano 2D | PNG | `rubik-sota-floor-plan.png` (se exporta en 2D y vuelve a la vista que había) |
| Material board | PNG | Diálogo `moodboardDialog` |
| Presentación 3D / vídeo del recorrido | 3D · MP4 | `presentationConfig`; MP4 real H.264 1280 × 720 grabado y descargado (muestra de la Home) |
| Archivo para el cliente | HTML | `rubik-sota-proyecto-de-ejemplo-para-el-cliente.html` |
| Enlace para el cliente | URL | Diálogo `shareLinkDialog` con confirmación; no se publicó nada |
| Proyecto editable | JSON | `rubik-sota-floor-plan.json` |
| DXF de la planta activa | DXF | `Proyecto de ejemplo.dxf` |
| Escena para Blender | ZIP · GLB | Diálogo `sceneExportDialog` |
| Blueprint 3D / Despiece 3D (visor y lámina) | 3D · PNG A3 200 ppp | Visor `bpdp-host` sobre la revisión activa |
| Render IA | PNG | Abre su diálogo con una vista preparada; no se generó ni se gastó nada |

Huellas SHA-256 en `salidas/SHA256SUMS.txt`.

## Regresión

<<REGRESION>>

## Decisiones abiertas (propietario y Codex)

1. **«Unir RoomPlan» visible sin desplegar (OP-04).** La V4 lo coloca en «Subir plano ▾»; una decisión anterior lo
   quería en la barra visible (`tests/upload.browser.test.cjs`). No he cambiado esa prueba: decide el propietario.
2. **Guía a demanda.** Como en la V4, la guía es el panel «Tareas del proyecto» y la fila 2 resume el paso. Las pruebas
   que usaban la barra de guía siempre visible abren antes ese panel (nota en cada archivo).

## Límites y pendientes

- **Render IA · estilos:** no existe ningún ejemplo de variantes generado y acreditado. Generarlo consume créditos del
  servicio: pendiente de autorización o de ejemplos aportados. La portada muestra la vista de origen real y huecos.
- **Vídeo cinematográfico:** MP4 real, pero grabado con render por CPU (~1,5 fps): se ven plano y entrada en una
  estancia, no el movimiento continuo. Pendiente regrabar en un equipo con GPU.
- **Retratos:** Constructora generada con el conector de Canva autorizado para estos retratos. Los seis retratos
  disponibles son vistas previas de 199 × 150; el retrato grande necesita los originales.
- **GPU física, Firefox y WebKit:** NOT_RUN aquí.
- **Escala 1:100 en papel:** pendiente de medir la impresión (protocolo en el laboratorio).
- **Preview:** la rama estaba excluida de Vercel desde la consolidación del 16/11. Para la URL pedida se quita solo
  esa exclusión en el commit final; desde entonces cada envío a esta rama crea una Preview. Ninguna Production.

## Coordinación

- **Codex:** composición sin cambios de `codex/bpdp-integracion-perla` @ `52271b4d` (su nota pedía recomponer al publicar
  Claude un HEAD nuevo). Su E3 ya corregía la lámina a SVG y añadía las cuatro salidas BP-DP. Único cambio sobre su
  conexión: el botón «Abrir Blueprint/Despiece» deja de ser `.primary` para igualar la jerarquía de Entregar
  (`tests/visual-studio`). Las correcciones de cancelación, WebGL y norte del laboratorio
  (`codex/bpdp-cancel-webgl-norte` @ `c124fe45`) ya venían en su composición.
- **Claude Code 2:** el runtime BP-DP del producto procede de `claude/bpdp-premium-v2` @ `3dbcd926` más esas
  correcciones; no hay cambios suyos posteriores en el laboratorio.

## Publicación

<<PUBLICACION>>
