# §7.4 · Otra pieza tapizada en una escena realmente distinta (f4, edificio de dos plantas)

- **Origen:** `f4-building`, otro proyecto (edificio de dos plantas con escalera; sofá **gris** en la estancia «Estar»),
  exportado desde la interfaz real con *Entregar → Escena para Blender* (`scene-capture.cjs --via ui`), con la **misma receta
  automática v3** (sin ajustes por escena): 10 piezas tapizadas del sofá resueltas como `tapiceria-tejido`.
- **Toma:** `--profile entrega1440 --shot interior --room rom_op10-009` (2560×1440, 32 muestras), **605,8 s** el fotograma.
- [`f4-edificio-estar-1440p.jpg`](f4-edificio-estar-1440p.jpg) · recorte 1:1 [`f4-sofa-gris-1a1.png`](f4-sofa-gris-1a1.png) ·
  informe [`f4-rodaje-report.json`](f4-rodaje-report.json).
- **Límite de encuadre:** el primer plano automático (`--shot primerplano --target sofa`) no encontró punto de vista libre
  (el sofá queda encajado junto a la escalera) y la cámara interior automática mira hacia la escalera: el sofá sale en una
  esquina. La lectura del tejido (trama por cojín y brazo, otro color) se ve en el recorte 1:1. Mejorar la cámara automática
  para piezas arrinconadas es una mejora aparte del kit, no de la receta.
