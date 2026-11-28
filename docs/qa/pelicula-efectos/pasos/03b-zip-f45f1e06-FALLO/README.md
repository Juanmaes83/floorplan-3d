# Paso 3b · Prueba ZIP · SHA probado `f45f1e06` · **FALLA (segundo hallazgo real)**

- Código de salida 1 (`prueba.log`). Paso 1 completo en verde, **incluido el kit** (corrección a4719374 verificada).
- Falla en el paso 2: ZIP B (elegido Pieza a pieza · entrega1440, sin editar) lleva el guion de A (maqueta-abierta · revision).
  Ver `B-pieza-entrega1440.guion-inicio.txt` y `comprobaciones.json`.
- Causa: al reabrir «Escena para Blender» con el proyecto sin cambios, el diálogo seguía en `ready` y devolvía el paquete ya preparado.
- Corrección: `c25428f3` (no se reutiliza un paquete si hay elección pendiente o si ya lleva guion). Repetición: paso 3c.
