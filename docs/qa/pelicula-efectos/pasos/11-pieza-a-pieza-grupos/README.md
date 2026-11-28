# Paso 11 · Pieza a pieza · montaje por grupos · código `6e5c32ce` · clip ligero continuo

- Orden: guion `guion-pieza-a-pieza.json`, 640×360, 4 muestras, **fotogramas 168–479 continuos** (de «Llegan los muros» al mobiliario,
  13 s a 24 fps). **Código de salida 0**, 312 fotogramas. Piezas reales de la revisión del ejemplo (70 muros, 26 huecos y
  carpinterías, 47 muebles, 13 estancias; conteos del propio ZIP en `rodaje-report.json`).
- Puesta en escena (solo Pieza a pieza; Maqueta abierta no cambia):
  1. **Qué grupo llega**: rótulo fijo en pantalla «Llegan los muros · 70 piezas», «Llegan huecos y carpinterías · 26 piezas»,
     «Llega el mobiliario · 47 piezas».
  2. **Dónde encaja**: al empezar el grupo aparece, en naranja translúcido, el volumen real de cada pieza en su sitio final
     (huecos dentro del muro, muebles sobre su suelo); las piezas caen y encajan en él.
  3. **Qué cambia al quedar montado**: el volumen naranja desaparece cuando la pieza encaja y el rótulo pasa a «… encajados».
  4. Cámara en órbita alta continua; nunca entra. Maqueta abierta, en cambio, baja y termina dentro del salón.
- **Qué revisar**: `clip-muros-a-mobiliario-13s.mp4` (y `hoja-contactos.jpg`): ¿se distingue qué grupo llega, dónde encaja y el
  cambio al quedar montado? ¿Se diferencia de Maqueta abierta?
- Defectos vistos: en el cambio de rótulo, el texto se ve encogido durante unos 8 fotogramas (aparece y desaparece escalando);
  corregir con un fundido de opacidad antes del render largo. El naranja de los muebles queda algo pálido sobre suelos claros.
