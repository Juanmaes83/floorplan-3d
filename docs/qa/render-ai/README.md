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
