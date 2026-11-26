# Tapicería v3 · revisión visual (26/11/2026)

**Motivo:** el propietario rechazó el sofá de `f2-rot30` (v1). Con la ampliación aparecía una trama fina, pero a distancia normal
los cojines seguían pareciendo lisos y uniformes. **El MP4 completo sigue en espera** hasta la aprobación visual de este corte.

**Kit:** `scripts/interop/blender-rodaje.py` en `claude/rodaje-cierre-1440` (ver el SHA del informe del corte). Es el mismo
archivo que viaja en el ZIP de *Entregar → Escena para Blender* como `rubik_blender_rodaje.py`. La receta v3 es la de
serie; la v1 se conserva con `--recetas v1` solo para reproducir este antes/después.

## Diagnóstico (medido, no supuesto)

| Causa | Evidencia | Efecto en v1 |
|---|---|---|
| La rotación del proyecto llega **horneada en los vértices** y la textura se proyectaba en ejes del mundo | Todas las piezas del sofá de f2 miden −30° por la normal de sus caras verticales; rotación de objeto 0 | Trama en diagonal respecto al cojín; en las caras verticales, la caja mezclaba dos proyecciones y la emborronaba |
| Las mallas **no tienen UV** | `uv_layers = 0` en todas las piezas | El mapa de normales en espacio tangente apenas actúa: diferencia media de 2,9/255 entre fuerza 2,6 y 0 en el mismo recorte |
| A 3 m, el hilo de lino (~1 mm) queda **bajo el píxel** | 1 px ≈ 2–3 mm a esa distancia en 1440p | Sin otra señal, la tela se promedia a un color liso |

## Receta v3 (se aplica sola por familia y pieza; no hay ajustes por escena)

- **Marco propio de cada pieza** (orientación en planta, módulo 90°, de sus caras verticales) y proyección **triplanar con la
  normal girada**. La trama sigue cada cojín, respaldo y brazo, tanto a −30° (f2) como a 0° (f5).
- **Escaneo de lino `rough_linen` (CC0) a escala física**: 0,2707 m por tesela. No se agranda el hilo.
- **Vetas de hilo (slub, ~1,2 mm × 4 cm)** y **mezcla de hebras (heather, ~5 mm × 9 cm)** según urdimbre y trama de
  cada cara. Son simétricas (claras y oscuras) y no forman manchas. Es lo que deja reconocer el tejido a distancia normal.
- **Relieve** a partir de la altura del propio escaneo (2,2 mm de recorrido de bump), en lugar del mapa de normales sin UV.
- **Respuesta de tela:** reflectancia especular baja (0,25), rugosidad ≥ 0,72 (sin aspecto plástico) y brillo rasante
  (sheen 1,0, rugosidad 0,35).
- **Piezas y uniones:** un matiz propio y muy leve por pieza (±3 %), cantos convexos algo más claros (curvatura de la
  malla) y oscurecimiento de contacto entre cojines.
- **Familias:**
  - Tapicería interior → v3.
  - Textil exterior (sillones del balcón) → versión más mate.
  - Cuero → solo con material explícito del profesional, que siempre prevalece. RUBIK no distingue el cuero por tipo y
    color.
  - Si RUBIK solo conoce tipo y color, el informe lo registra como **aproximación visual**.

## Evidencia (misma cámara, luz, exposición y resolución; izquierda v1, derecha v3)

| Qué | Archivo | Lectura |
|---|---|---|
| Plano general del salón, f2-rot30 (1440p completo) | [`f2-rot30-general-v1.jpg`](f2-rot30-general-v1.jpg) · [`f2-rot30-general-v3.jpg`](f2-rot30-general-v3.jpg) | En v3, sofá y sillón se reconocen como tapizados |
| Sofá en el plano general, recorte 1:1 nativo | [`f2-sofa-general-1a1.png`](f2-sofa-general-1a1.png) | Respaldo, asiento, brazo y cojín leen tela a la distancia del plano general |
| Detalle del sofá, recorte 1:1 nativo 1440p | [`f2-detalle-sofa-1a1.png`](f2-detalle-sofa-1a1.png) | Urdimbre y trama visibles y orientadas por pieza; sin muaré ni suciedad |
| Otra pieza tapizada: sillón, f2 (−30°), 1:1 | [`f2-sillon-1a1.png`](f2-sillon-1a1.png) | La misma receta, sin tocar nada, en otra forma |
| Segundo proyecto f5-furniture (0°): general y sillón 1:1 | [`f5-furniture-general-v1.jpg`](f5-furniture-general-v1.jpg) · [`f5-furniture-general-v3.jpg`](f5-furniture-general-v3.jpg) · [`f5-sillon-1a1.png`](f5-sillon-1a1.png) | Misma lectura con la pieza sin girar |
| Informe de asignación (receta, pieza, recurso, escala, marco, proyección, fuente, límites) | [`f2-rot30-informe-tapiceria.json`](f2-rot30-informe-tapiceria.json) · [`f5-furniture-informe-tapiceria.json`](f5-furniture-informe-tapiceria.json) | f2: 15 objetos tapizados, 160 piezas (84 tapicería, 62 tapicería sencilla, 14 textil exterior) |
| Comprobador reproducible | [`tapiceria-check-9de9.json`](tapiceria-check-9de9.json) | 9/9 (ver abajo) |

`f5-furniture` es la vivienda de referencia **sin girar**, exportada desde la interfaz real con `scene-capture.cjs --via ui`.
Demuestra que la receta no depende de la orientación. La «otra pieza» de forma distinta es el sillón.

## Comprobaciones (`scripts/interop/rodaje-tapiceria-check.py`, sin render)

`python3 scripts/interop/rodaje-tapiceria-check.py KIT-DIR SALIDA --blender blender`, sobre el ZIP de f5:

- A (ZIP actual): llega sola a todas las piezas tapizadas, con escaneo, escala, marco y límites declarados.
  Distingue interior y exterior. Geometría intacta.
- B (ZIP anterior sin `rubik-materiales.json`): misma resolución.
- E (textura de tejido ausente): reserva procedimental legible, sustitución declarada por pieza y veredicto
  «Acabado pendiente de revisión». Este último corrige un fallo hallado en este corte: antes decía «listo».
- D (cuero explícito en un sofá): prevalece en ese sofá y solo en él.

Material Tokens (`rodaje-materiales-check.py`, f3): 14/14.

## Coste por fotograma (CPU de 4 núcleos, Cycles, OIDN, semilla fija)

| Toma | v1 | v3 |
|---|---|---|
| f2 general 1440p (32 muestras) | 612 s | 683 s (+12 %) |
| f5 general 1440p | 509 s | 589 s (+16 %) |
| Recorte 1:1 del sofá (960×560 px de 1440p) | 165 s | 167 s |

## Límites declarados

- **El modelo exportado no trae costuras, vivos ni pespuntes.** Cantos y uniones se leen por la forma redondeada, el
  contacto y el brillo rasante; ninguna receta puede dibujar una costura que la malla no tiene. Si se quiere esa lectura, el
  cambio pendiente está en el **modelo de mobiliario** de RUBIK (un vivo o una costura en la geometría o en un mapa del
  catálogo), no en el kit.
- **Luz sin cambios** en este corte, para evaluar el material por sí mismo.
- Alfombra y madera conservan su proyección anterior en este corte (ya revisadas). Pasarlas al marco por pieza sería
  coherente, pero se presentará como comparación aparte.
- El primer plano automático del sillón (`--shot primerplano --target armchair`) no encontró un punto de vista libre en
  ninguno de los dos proyectos. Por eso el sillón se muestra en recorte 1:1 del plano general (misma cámara, luz y
  exposición).
- Tramo en movimiento: ver la sección siguiente, cuando termine su render.
