# Handoff · Tres efectos de película (Pieza a pieza · Maqueta abierta · Desde el paisaje) · fuera de #324

**Encargo:** [`075f8e53` · PELICULA-PROPUESTA-HOME-ENTREGAR.md](https://github.com/Juanmaes83/floorplan-3d/blob/075f8e538f9d2aa7486be29dbf6d6fb76e3e3f32/docs/qa/auditoria-324-villa-linde/PELICULA-PROPUESTA-HOME-ENTREGAR.md)
**Rama:** `claude/pelicula-efectos` · **base de partida:** `master` `dacb5d395abf32449102d73ffd03200e6c09c019` (comprobada el 27/11, 21:58).
**Incorporación:** después de la regresión final de #324 y del render nocturno v1.1 del piloto (una tanda pesada cada vez).

## Contraste con el código (27/11)
| Pieza | En `master` (`dacb5d39`) | En ramas pendientes |
|---|---|---|
| ZIP «Escena para Blender» (`scene.glb` + `manifest.json`, roles `room/wall/opening/object/ceiling/fixture/roof/exterior/stair`) | **Sí** (Entregar → Documentación; `js/scene-delivery-core.js`, `scene-capture-core.js`) | — |
| Importación/render Blender (`blender-scene-import.py`, `blender-scene-render.py`, `blender-kit/`) | **Sí** | — |
| Kit de rodaje (`blender-rodaje.py`, recetas, tapicería, contacto) y `pelicula-timeline.py` | **No** | `claude/rodaje-cierre-1440` (v1.1 en `230c7316`) |
| Home «Descubre RUBIK en acción» y muestras | **Sí** (`js/home-en-accion.js`; «Dibujo vivo» vía `js/home-demos.js`) | — |
| Entregar · bloque de vídeo («Vídeo del recorrido», Vídeo Blueprint 3D P8, Vídeo Despiece 3D P9) | **Sí** (`js/perla-entregar-ui.js`); «Dibujo vivo» es una opción de P1 | — |
| Terreno/entorno en el ZIP | **No** (`scene-capture` exporta volúmenes exteriores, cubierta y escalera; no terreno ni agua) | — |

## Dependencias
1. Kit de rodaje y cronología: se reutilizan desde `claude/rodaje-cierre-1440` (se traerá solo lo necesario, con su revisión).
2. Corrección del piloto v1.1 (luz, entrada, ritmo, acabado): es la base de **Maqueta abierta**.
3. **Desde el paisaje** necesita un proyecto con entorno representado y un acceso real; hoy el ZIP no exporta terreno.
   Se usará el que exista (volúmenes exteriores, terraza, cubierta); lo que falte se explica en la interfaz y en el informe.
4. Donante MIT `2d3463e4` (`houses/{courtyard,apartment,villa}/film.py`): solo ideas de puesta en escena y cámara;
   sin modelos, materiales, planos, escenarios ni música.

## Evidencia comprometida (por efecto, por separado)
- MP4 continuo **> 20,0 s** medido sobre el archivo publicado + informe JSON (duración, resolución, fps, SHA-256, commit,
  proyecto/huella, plantas, ZIP, perfil, marcas de inicio/transformación/llegada, omisiones y aproximaciones).
- Hoja de contactos con las marcas de tiempo de los cuatro controles del piloto (luz, orientación, ritmo, rótulos/vidrio).
- Grabaciones de producto en escritorio y móvil: Home (tres ejemplos) y Entregar → Vídeo (vista previa, estimación,
  confirmación, MP4 + informe, cancelación, fallo de preparación).
- Casos: una planta, dos plantas, cambio de revisión, requisito ausente; regresión P1, Dibujo vivo, P4, P8, P9, ZIP Blender; ES/EN sin chino.

## Precisiones del propietario (27/11, noche) · interpretación aprobada
- **Pieza a pieza** muestra el **montaje del modelo con los datos reales de RUBIK** (piezas del ZIP de la revisión elegida),
  no una construcción inventada ni piezas del donante.
- **Desde el paisaje:** primero se identifica un proyecto con **entorno representable y acceso real**. Si hace falta ampliar la
  exportación (terreno, agua, vegetación…), es una **decisión del propietario**: se le plantea antes de implementar.
- **Maqueta abierta** parte del piloto v1.1 como base de trabajo; el piloto v1.1 tiene **su propia revisión**, separada.
- **Aceptación:** viendo **tres MP4 independientes de más de 20 s** cada uno.

## Qué veremos en cada efecto
| Efecto | Inicio | Transición | Final |
|---|---|---|---|
| Pieza a pieza | Planta de RUBIK rotulada (o croquis alineado si existe), identificada con el proyecto y la revisión | Los grupos de piezas reales del modelo (suelos, muros, huecos y carpinterías, mobiliario) entran por sistemas y encajan sobre su huella; el plano sigue visible bajo el montaje | La vivienda montada, con la cámara mostrando a la vez el volumen y la huella de origen de las piezas |
| Maqueta abierta | Planta legible con la estancia de destino localizable | La planta gana volumen; la maqueta abierta, sin techo, muestra cómo se conectan las estancias; descenso con referencias visibles | Interior de esa misma estancia, encuadre estable y luz continua; se puede señalar en la planta dónde terminó |
| Desde el paisaje | La vivienda en el entorno representado del proyecto | Aproximación a escala comprensible, el acceso y el paso por un hueco real | Interior que conserva la relación con el exterior y el acceso; terraza, agua o luz exterior solo si existen en los datos |

## «Desde el paisaje» · proyecto con entorno (búsqueda 27/11, 22:05) → DECISIÓN DEL PROPIETARIO
- RUBIK **sí representa entorno** en la app: terreno IGN MDT05 (`js/ign-mdt05-terrain-provider.js`, `terrain-core.js`), ortofoto
  PNOA (`pnoa-orthophoto-provider.js`), parcela de Catastro (`catastro-parcel-provider.js`), sol (`solar-core.js`), con
  política de licencias y atribución (`territory-export-policy.js`).
- El **ZIP de Blender no lo exporta**: `scene-capture-core.js` solo asigna roles de vivienda (estancias, muros, huecos, objetos,
  techo, luminarias, cubierta, volúmenes exteriores, escalera). Ningún fixture del repositorio trae terreno ni parcela
  georreferenciada; el ejemplo y los proyectos de prueba no están situados.
- **Acceso real:** sí existe en los datos (puerta de entrada en muro exterior; huecos de fachada).
- **Conclusión:** sin ampliar la exportación, «Desde el paisaje» solo podría usar volúmenes exteriores (terrazas, balcones) y un
  fondo neutro: no cumpliría «situar la vivienda en el entorno representado». Se plantea al propietario:
  (A) ampliar el ZIP con terreno MDT05 + ortofoto PNOA de la parcela (con atribución CC BY 4.0 en el informe y en el vídeo) y
  elegir un proyecto situado; o (B) limitar la primera entrega a exteriores del propio modelo y declararlo.

### Decisión del propietario (27/11, noche) · opción A autorizada
- **Autorizado** ampliar la exportación «Escena para Blender» para el ensayo de «Desde el paisaje», en `claude/pelicula-efectos`,
  fuera de #324. Claude elige o prepara un proyecto de demostración con **emplazamiento confirmado, terreno y un acceso real**.
- Objetivo: que el cliente sitúe la vivienda, reconozca su acceso durante el acercamiento y entienda la continuidad hasta el interior.
- Terreno y ortofoto **del emplazamiento**, alineados con la posición, escala y orientación del proyecto. Cada capa se verifica
  con la política existente (`territory-export-policy.js`); fuente y atribución en el informe **y** en el vídeo.
- Si falta un dato imprescindible: explicar cuál y dejar el estado visible en Entregar.
- Aceptación: MP4 continuo > 20 s + informe + evidencia de que emplazamiento y acceso coinciden con el proyecto en RUBIK;
  y prueba de que la exportación habitual sigue igual con un proyecto **sin** emplazamiento.
- Red: añadidos al entorno `servicios.idee.es` y `www.catastro.hacienda.gob.es` (antes, 403 del proxy).
- Cola: Maqueta abierta y Pieza a pieza avanzan en paralelo; la preparación de este caso no las bloquea.

## Emplazamiento · servicios reales probados en Chromium desde la interfaz (27/11, 22:10)
Sonda `emplazamiento/sonda-territorio-real.cjs`: ejemplo → Analizar · Contexto territorial → fuente «Catastro · consulta por
referencia catastral» → `3662001TF3136S` → Guardar → Cargar terreno → Cargar ortofoto. 0 errores de página.
| Capa | Servicio | Resultado | Licencia (política RUBIK) |
|---|---|---|---|
| Parcela | `ovc.catastro.meh.es/INSPIRE/wfsCP.aspx` (GetParcel, EPSG::25830) | **200 XML**; parcela válida en la tarjeta: referencia, EPSG:25830, fuente, fecha, atribución y polígono | **restricted** → solo para comprobar el emplazamiento en RUBIK; **fuera del ZIP y del vídeo** |
| Terreno | `servicios.idee.es/wcs-inspire/mdt` (MDT05, 5 m) | **corregido** (ver abajo): disponible, cotas 139–189 m | CC BY 4.0 · verificada → exportable con atribución |
| Ortofoto | `www.ign.es/wms-inspire/pnoa-ma` | **200 JPEG**, disponible en sesión | IGN/CNIG compatible CC BY 4.0 · verificada → exportable con atribución «Sistema Cartográfico Nacional» |
Capturas: `emplazamiento/territorio-3662001TF3136S-parcela.png`, `…-terreno-ortofoto.png`.

**Fallo real corregido (también en master):** `js/ign-mdt05-terrain-provider.js` pedía al WCS el recuadro exacto de la parcela; si
no cae en la malla de 5 m, el IGN remuestrea y responde con `dx 5,0016 / dy 4,94` en vez de `cellsize 5`, y RUBIK lo rechazaba
(«invalid-terrain-response»). Ahora el recuadro se amplía a la malla nativa (contiene el pedido). Prueba nueva en
`tests/terrain-provider.test.cjs` (6/6) y terrain-core 9/9 en conjunto. Candidata a llevarse a master por separado.
Red del entorno: `ovc.catastro.meh.es`, `servicios.idee.es`, `www.ign.es` y `www.catastro.hacienda.gob.es` permitidos.

**Proyecto de demostración:** `3662001TF3136S` es la referencia pública de verificación del proveedor; sirve de prueba técnica,
no como emplazamiento del vídeo. Pendiente: elegir/preparar el proyecto de demostración con emplazamiento confirmado.

## Estado
- 27/11 21:58 · rama creada y plan registrado. Sin código todavía.
- 27/11 · interpretación aprobada; precisiones registradas. Siguiente: identificar el proyecto con entorno para «Desde el paisaje».
