# Punto 8C-E — integración territorial final

Estado: **8C-E candidato en revisión**. No cierra canónicamente 8C-E ni Punto 8.

Base: `master` `51a3a07b16da8876ab32189b8db9db18eb182c12` (8C-D cerrado).
Rama: `feat/point-8c-e-territorial-integration`.

## Colocación explícita y autoridad espacial

Project 1.12 / Building 1.5 añaden `site.buildingPlacement`. Building mantiene esta autoridad exclusivamente en la raíz. La lectura no migra proyectos antiguos; escribir placement eleva la versión; retirarlo no la reduce.

El usuario selecciona un punto parcel-local y lo vincula al ancla indicada del modelo. No hay detección de edificio ni geolocalización automática. `northOffsetDeg` sigue siendo la única autoridad de norte: no existe una segunda rotación de placement.

Cadena: CRS fuente → `parcel.frame` → parcel-local → placement + norte existente → modelo → renderer existente. Para puntos de modelo M, ancla A y ancla parcel-local P:

```text
parcelLocal = P + R(-northOffsetDeg) × (M − A)
model       = A + R(+northOffsetDeg) × (parcelLocal − P)
renderer XZ = (model − level.offsetMm − geometry.center) / 1000
renderer Y  = terrainElevationM − modelZeroElevationM − level.elevationMm / 1000
```

Los CRS fuente nunca se entregan directamente a Three.js. La geometría editable, offsets de plantas y Solar no se rotan ni desplazan. Tests cubren norte 0°, 90°, 37°, inversa y offsets/elevación distintos de cero. `exportLevel` resta offset al ancla del modelo y suma elevación a modelZero, conservando la misma posición física.

La cota vertical es opcional y explícita: introducida por el usuario o derivada mediante una acción expresa sobre el terreno disponible, con referencia a su snapshot. No existe alineación automática de planta cero. Quitar terreno no borra la cota elegida.

## Runtime, capas y limpieza

Parcela, ortofoto, terreno y norte se renderizan en un grupo de contexto independiente. El edificio conserva sus transformaciones. El contexto no participa en picking ni en colliders de Walk. El terreno necesita grid de sesión y cota vertical; sin ambos se omite. La ortofoto puede mostrarse plana si no hay terreno alineado. Los UV usan los límites fuente, sin estirar fuera del dominio; las caras fuera del dominio se omiten.

Blob/URL y grid son de sesión; JSON/ZIP guardan únicamente snapshots y placement. No se recuperan assets remotamente al cargar. Cambio de propietario, parcela o snapshot incompatible invalida assets. Sustitución/eliminación revoca URL; reconstrucción/salida dispone geometrías, materiales y texturas; las cargas de textura antiguas quedan invalidadas por generación.

## Presentación móvil

El botón de fondo `#presentationBtn` abre `#presentationConfig`; el CTA real dentro del diálogo es **Iniciar presentación**, que ejecuta el flujo existente y cierra el diálogo mediante su callback. El test usa ese CTA acotado al diálogo, scroll normal y tap real.

Diagnóstico: con el layout móvil ampliado por la escena 3D, el centrado nativo del diálogo lo situaba fuera del viewport visual. El locator correcto seguía sin poder iniciar. Corrección mínima de producto: posición fija con inset explícito, altura limitada al viewport dinámico y scroll del propio diálogo. Sin force click, cierre por JavaScript, cambio de z-index, supresión de pointer events ni aumento de timeout.

Secuencia validada: 390×844 aislado PASS; 844×390 aislado PASS; suite integrada completa 2/2 PASS. El test recorre configuración → CTA → contexto exterior → habitación → salida. Comprueba restauración de cámara, target, quaternion, opciones, capas, reveal/sección y Solar/luz. El stop de contexto no altera los stops de habitaciones. La presentación exterior puede mostrar todas las plantas temporalmente y restaura la vista anterior.

La inspección de capturas detectó además que el límite de distancia de OrbitControls recortaba el encuadre territorial calculado. La vista de contexto amplía temporalmente ese límite y el far plane; los restaura al volver a habitación o editor. La prueba contrasta distancia real contra encuadre calculado, compara la misma habitación/región con y sin contexto y restaura una vista exterior tras visitar otra, incluyendo cubierta y límites. No cambia el algoritmo de framing de habitaciones.

## Salidas y licencia

Decisión exclusivamente desde el snapshot, sin ramas por provider: `not-applicable` exportable; `verified` con atribución no vacía exportable; `restricted` y `unknown` no se autoexportan. Mostrar una fuente internamente no autoriza exportarla. Los créditos se deduplican exactamente y ordenan de forma estable.

Captura y delivery filtran temporalmente el grupo y restauran visibilidad en finally. Sus imágenes incorporan un pie con créditos conservando tamaño y proporción mediante contain. Share usa el renderer de delivery existente. GLB/Blender conservan su perfil geométrico local, sin contexto territorial. Vídeo omite contexto de forma conservadora y restaura capas, dado que su contrato actual no incorpora estos créditos. Matriz y límites en [auditoría candidata](point-8-final-audit-candidate-2026-10-28.md).

## Evidencias locales

- Integración/core/Project/Building: 66/66 PASS; incluye 11 casos territoriales, equivalencia GLB con/sin site y recursos Three reales.
- Parcel/orthophoto/terrain/exterior/roof/volumes/Solar core: 66/66 PASS.
- JSON Schema territorial nuevo: 2/2 PASS; conjunto independiente completo: 25/25 PASS con `PYTHONUTF8=1` y `PYTHONIOENCODING=utf-8`. El primer intento con cp1252 del entorno Windows produjo errores de decodificación; no se modificaron los tests para ocultarlos.
- Node no-browser completo: 569 casos, 567 PASS, 0 FAIL, 2 SKIP (Blender/bpy no configurado). Los tests de Project y territorial se repitieron tras acotar el gate de versión a la raíz del schema: 51/51 PASS.
- Terrain browser: 2/2 PASS. Suite integrada final: 3/3 PASS (dos móviles y Walk comparativo).
- Walk comparativo nuevo: con/sin contexto conserva exactamente origen, altura de cámara 1.6m y puertas; ambos mueven realmente con W. El contexto usa placement no cero, norte37 y terrain visible. Esto no convierte la antigua suite de door traversal en PASS.
- Privacidad F2: 4/4 PASS.
- Building Presentation: 7 casos PASS en la regresión específica.
- Walk controls: timeout de `#walkOverlay` oculto reproducido también al servir `master` exacto, mediante copia diagnóstica temporal con timeout reducido (10s). No se corrige Walk ni se presenta esa suite como verde. Journey y el resto de validaciones se registran en el resumen final.

Resultado browser amplio: 104 PASS / 1 FAIL previo de aspect ratio, reproducido también mediante la prueba original aislada sobre master limpio. Regresión Walk/Journey/Building Presentation: 24 PASS / 10 FAIL Walk. Contraste completo terminado: los diez nombres, mensajes de error y ubicaciones de fallo coinciden exactamente con master limpio; 0 fallos nuevos. El usuario autorizó expresamente publicar con ese baseline documentado. ZIP por lotes afectado: 1 PASS. Comandos, hashes de tests y limitaciones en [validación local](../qa/point-8c-e-local-validation-2026-10-28.md).

Capturas deliberadas en `output/playwright/point-8c-e/`: colocación, controles de capas, contexto y presentación exterior para 390×844 y 844×390, inspeccionadas visualmente. Campos y guardado son accesibles con scroll en el diálogo; capas accesibles y créditos legibles. Datos y atribuciones exclusivamente sintéticos; no se incorporan descargas oficiales. Chromium usa SwiftShader, sin afirmación de rendimiento en hardware móvil físico.

## Límites y estado de entrega

Sin nuevos providers, red al cargar, detección automática de edificio, topografía/catastro certificados, geotecnia ni cambio de Solar/Walk. No hay cierre canónico ni merge. La excepción expresa del usuario permite publicar tras comprobar que los diez fallos Walk coinciden con master limpio, que los tests específicos y las regresiones afectadas que pasan en master quedan verdes y que no hay fallos nuevos. El baseline se informa, sin presentarlo como verde. CI y revisión de merge corresponden a una sesión posterior a la apertura de PR, sin polling en esta sesión.
