# Paso 10 · Rótulos de la planta a tamaño real de reproducción (2560×1440) · mínimo 0,24

Mismo encuadre (fotograma 24 de Maqueta abierta, planta cenital), kit de rodaje, 2560×1440, 8 muestras, código de salida 0 en ambos.
- **Antes** (`antes-2560x1440.jpg`, código `3716f325`): mínimo 0,24, rótulo en el centroide.
- **Después** (`despues-2560x1440.jpg`, código de este commit): dos ajustes acotados:
  1. **Contraste**: el texto ya no refleja el cielo (reflejo especular 0, base casi negra). Medido sobre el recorte 1:1
     (percentil 90 placa / percentil 2 tinta): «Baño de invitados» 1,95 → **2,82**:1; «Balcón-lavadero» 2,09 → **3,29**:1.
     La medida subestima: el núcleo del trazo ya es casi negro, el resto es suavizado de un trazo fino.
  2. **Posición**: la placa se coloca donde cabe entera dentro de la estancia (el centroide si cabe). En el pasillo (en L) la placa
     tocaba el muro derecho; ahora queda dentro del pasillo.
- Sin abreviaturas: no hicieron falta.
- Probado y descartado: engrosar el trazo (`offset` de la curva de texto) no cambia el resultado con esta fuente; retirado.

## Qué revisar (sin ampliar)
`comparativa-1a1-antes-arriba.png`: recorte **1:1** del fotograma de 1440p, arriba antes, abajo después.
- Cocina y Comedor se leen por separado.
- Ningún texto ni placa invade muros: Pasillo ya no toca el muro.
- Baño en suite, Baño de invitados, Pasillo, Balcón-lavadero y Balcón de estar se leen al tamaño real.
Límite: la fuente del kit es de trazo fino; si se quiere más peso en secundarios hace falta una fuente con negrita (cambio de recurso).
- Nota de trazabilidad: `despues-2560x1440.jpg` se renderizó con `offset` 0,012 aún presente; con 0,03 los valores medidos fueron idénticos (sin efecto), por eso se retiró. El código publicado es el mismo menos esa línea.
