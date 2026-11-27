# §10 · Render AI · presentar el valor de «Reformar desde fotografía» (FOT-01)

**Rama:** `claude/entregar-asistencia` (documento de análisis y propuesta; sin código todavía). Base `cd694e88`.

## Qué hay hoy (comprobado en el código)
- Flujo **FOT-01** `js/photo-reform-ui.js` + `photo-reform-core.js` + `photo-reform-provider.js`: foto → validación (formato
  real, ≤ 10 MB, lado menor ≥ 320 px, sin metadatos) → **intención cerrada** → qué se enviaría → consentimiento → alternativas.
- **Proveedor real bloqueado** en este despliegue (`config()`: `configured:false`, `authorized:false`, gobierno GOV-05/IMG-04
  pendiente). Las alternativas salen del **adaptador SIMULADO** local (sin red ni coste), rotuladas «SIMULACIÓN · no generada
  por IA» también dentro de la imagen; no se descargan; nada se guarda.
- Intenciones disponibles: **Cambiar el suelo** (roble claro, nogal, microcemento, porcelánico gris), **Pintar las paredes**
  (blanco mate, blanco cálido, verde salvia, arena), **Más luz y orden**, **Ambiente cálido**.
- Entradas actuales: Entregar → Imágenes («Reformar desde fotografía») y el menú de proyecto (§9).

## Propuesta (sin inventar capacidades)
Una entrada comercial «Reformar desde fotografía» en Entregar → Imágenes con **dos casos**, cada uno con su ejemplo propio de
antes/después y una acción que abre FOT-01 con la intención ya elegida:
| Caso | Mensaje | Ejemplo propio (antes → después) | Acción al flujo real | Rótulo |
|---|---|---|---|---|
| **Inmobiliaria** | «Muestra cómo se vería el salón despejado» | captura 3D de RUBIK del salón del ejemplo **con muebles → sin muebles** (capa Muebles), no una foto generada | «Probar con tu foto» → FOT-01, intención **Más luz y orden** | «Ejemplo hecho con el 3D de RUBIK» + al iniciar: «Hoy las alternativas son una SIMULACIÓN» |
| **Interiorismo y reformas** | «Enseña una alternativa sobre la foto real» | render de RUBIK de la misma estancia con **dos acabados** (p. ej. suelo roble claro → microcemento, Material Tokens) | «Probar con tu foto» → FOT-01, intención **Cambiar el suelo / Pintar las paredes** | igual |
Cada ejemplo identifica: **original** (rotulado), **alternativa ilustrativa** (rotulada) y **qué revisar con el cliente**
(luz, amplitud, acabado; no medidas ni coste). En móvil, antes/después apilados con deslizador accesible.
Aceptación: escritorio y móvil; la persona entiende el trabajo de cada caso, distingue original y propuesta y ve el
siguiente paso en la misma pantalla; los textos solo describen lo disponible en la versión revisada.

## Decisiones del propietario
1. **«Despejar» (Room Declutter):** FOT-01 no tiene una intención de retirar muebles. Opción A (sin cambio de alcance): usar
   «Más luz y orden» y decirlo así. Opción B: añadir la intención «Despejar la estancia» al contrato cerrado de FOT-01 (afecta a
   gobierno GOV-05/IMG-04 y al proveedor cuando se autorice).
2. Confirmar que los ejemplos se hagan con capturas/renders de RUBIK (propios, sin licencias de terceros) y no con fotos externas.

## Implementación (27/11) · decisión del propietario aplicada
Inmobiliaria abre **«Más luz y orden»** y lo dice tal cual; interiorismo y reformas abre **«Cambiar el suelo · Roble claro»**.
- `js/photo-reform-ui.js`: `open({intent, finish, case})` abre FOT-01 con la intención y el acabado ya elegidos (la persona puede
  cambiarlos). En **Entregar → Imágenes**, el desplegable «Reformar desde fotografía · dos casos con ejemplo» muestra cada caso
  con su par original / alternativa ilustrativa (rotulados), la marca «Ejemplo hecho con el 3D de RUBIK, no con una foto
  procesada», qué hace la intención con la foto de la persona, qué revisar con el cliente (no medidas ni coste) y «Probar con tu
  foto». Bajo el botón: «hoy las alternativas son una SIMULACIÓN rotulada (no generada por IA) y no se envía nada».
- Ejemplos propios: vistas reales del 3D de RUBIK del salón del proyecto de ejemplo (`assets/photo-reform/`): original; salón
  sin muebles; suelo porcelánico 80×80 → madera de roble del catálogo del proyecto (`mat_tile800` → `mat_wood`).
- **Entrada real:** Entregar → tarjeta P2 «Imágenes» → su ficha muestra «Reformar desde fotografía · dos casos con ejemplo» (la
  ficha copia el bloque entero con `data-panel-extra`; sus botones funcionan por delegación). En la tarjeta compacta no se veía
  ninguna entrada a FOT-01: el estándar PERLA oculta el contenido de las tarjetas salvo su acción principal.
- **Ejemplos propios** (`assets/photo-reform/*.webp`), vistas reales de la parada «Salón» del 3D de RUBIK, generadas con
  `tests/zz-fot01-ejemplos.browser.test.cjs` por las vías normales de la app (retirar = `select` + `deleteSel` de los 8 muebles
  del salón; suelo = `mutate` con `mat_tile800` → `mat_wood`).
- **Prueba** `tests/fot01-casos.browser.test.cjs` 2/2 (1440×900 y 390×844): imágenes cargadas, rótulos «Original» /
  «Alternativa ilustrativa», marca del ejemplo, «SIMULACIÓN rotulada», inmobiliaria dice «no retira muebles», cada acción abre
  FOT-01 con `light` o con `floor` + `light-oak`; sin chino ni errores.
- **Evidencia:** `fot01/video/fot01-casos-{escritorio,movil}.mp4` y capturas `fot01/*.png`.
