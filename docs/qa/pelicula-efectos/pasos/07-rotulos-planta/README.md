# Paso 7 · Rótulos de la planta en el kit de rodaje (hallazgo de los pasos 5 y 6)

- Antes (`antes-previa.png`, kit de d46eb6be): el rótulo de «Cocina» (estancia de 2,18 m) medía ~2,7 m: invadía el muro y este tapaba la «a»
  («Cocin■Comedor»). Causa: el tamaño usaba `ancho/max(4,letras)·2,0`, sin relación con el ancho real de la placa (`size·letras·0,62 + 0,16`).
- Corrección: el tamaño se limita para que la placa quepa en el ancho de la estancia con 0,1 m por lado.
- Intermedio (`intermedio-min034.png`, mínimo 0,34): Cocina y Comedor correctos, pero «Balcón-lavadero» y «Baño de invitados» aún invadían el muro.
- Después (`despues-min024.png`, mínimo 0,24; render de un fotograma, código de salida 0, `render.log`): ningún rótulo invade muros.
  **Coste**: los rótulos de estancias pequeñas (baños, pasillo, balcones) quedan pequeños; a 2560×1440 ≈ 16 px de alto.
- **Decisión de Juanma**: aceptar mínimo 0,24 (todo dentro, pequeños legibles solo en entrega) o mínimo 0,34 (más grandes, dos rótulos rozan muro)
  u ocultar los que no quepan a 0,34 (como ya se hace con estancias < 2,5 m²).
