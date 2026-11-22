# M07 · Revisión visual de los 4 materiales F03 V2

**Decisión pendiente del propietario:** el núcleo marca los cuatro como `VISUAL_PENDING_HUMAN`. La mejora sigue **apagada por defecto**. Esta revisión decide si cada material puede usarse cuando la persona la active.

## Qué se revisa

Los cuatro materiales son los **mismos activos Poly Haven (CC0-1.0)** que la entrada del catálogo de RUBIK. V2 añade los mapas de **relieve (normal)** y **rugosidad**, que hoy no se usan en fachada, a resolución HERO 1024 en escritorio y equilibrada 512 en móvil.

| Material | Acabado del catálogo | Autoría | Descarga HERO / equilibrado |
|---|---|---|---|
| Revoco pintado | `surface-painted-plaster-wall` | Amal Kumar | 2,15 / 0,41 MB |
| Revoco de arcilla texturado | `surface-patterned-clay-plaster` | Amal Kumar | 1,99 / 0,46 MB |
| Hormigón visto | `surface-brushed-concrete-03` | Amal Kumar | 2,96 / 0,67 MB |
| Revestimiento de madera | `surface-wood-planks-grey` | Rob Tuytel | 2,17 / 0,51 MB |

## Material de revisión

1. **`revision-materiales.jpg`:** el albedo actual del catálogo junto a los tres mapas V2 de cada material. Muestra que el color de base es el mismo activo y lo que aporta V2 (relieve y rugosidad).
2. **Láminas con la misma cámara, luz y geometría**, en `laminas/`, comparando sin detalle, detalle de master y detalle con V2:

   | Material | Lámina de detalle | Vistas de conjunto |
   |---|---|---|
   | Revoco de arcilla | `e7-detalle-arcilla.jpg` | `e5-oblicua-sur-rasante.jpg` |
   | Revoco pintado | `e8-detalle-revoco.jpg` | `e1` a `e4` |
   | Hormigón visto | `e9-detalle-hormigon.jpg` | `e6-esquina-mirador.jpg` |
   | Madera | `e10-detalle-madera.jpg` | `e11-exterior-general.jpg` |

   Para el móvil: `movil-390x844.jpg` y `movil-844x390.jpg`.
3. **En la Preview de #317:**
   1. importar `tests/fixtures/f03v2/vivienda-ejemplo-fachadas.json`;
   2. Escena 3D → «Detalle arquitectónico» → «Fachadas ▾» → activar;
   3. recorrer cada fachada a altura humana con el control «Sol» en distintas horas.

## Criterios por material (marcar en cada uno)

| Criterio | Pregunta |
|---|---|
| Identidad | ¿Se reconoce el mismo acabado que la persona eligió en la Biblioteca de acabados? |
| Escala | ¿El tamaño del grano, de las tablas o del dibujo es creíble en un muro de 2,5–3 m? |
| Repetición | A distancia de fachada completa, ¿se ve un mosaico repetitivo molesto? |
| Relieve | Con luz rasante, ¿el relieve es verosímil y no exagerado? Intensidad del normal: 0,65 |
| Color | ¿El color se mantiene igual que el del catálogo, sin virar ni oscurecerse? |
| Encuentros | En esquinas y junto a carpinterías, ¿hay costuras o estiramientos visibles? (Los encuentros constructivos son F05 y quedan fuera) |
| Móvil | ¿La versión equilibrada 512 sigue aportando frente a master? |

## Decisión

| Material | Aprobado | Aprobado con ajuste (indicar) | Rechazado: se conserva el acabado base |
|---|---|---|---|
| Revoco pintado | ☐ | ☐ | ☐ |
| Revoco de arcilla texturado | ☐ | ☐ | ☐ |
| Hormigón visto | ☐ | ☐ | ☐ |
| Revestimiento de madera | ☐ | ☐ | ☐ |

**Qué pasa con un material rechazado:**
- se retira de `assets/materials/f03/v2-manifest.json`;
- sus muros se muestran como «Sin material de fachada fiel: se conserva», lo que ya está probado como respaldo en F3-06;
- los demás siguen disponibles.

**Ajustes posibles sin tocar el código:** la intensidad del normal y la resolución de cada perfil, en la receta V2 del núcleo.
