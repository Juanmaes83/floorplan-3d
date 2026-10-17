# R7 M16 — piloto de agrupación de primitivas

SHA de código: `e66d85e` (corrige el alcance visual del primer piloto `fb025b3`). Capturas Chromium/SwiftShader, 1440×900, vista isométrica del ejemplo, misma cámara, luz y proyecto. Los PNG `example-full.png`, `example-restored.png`, `example-hidden-furniture.png` y `example-batched.png` se abrieron e inspeccionaron visualmente.

| Medida | Sin agrupar | Muebles ocultos | Agrupado |
| --- | ---: | ---: | ---: |
| Llamadas de dibujo | 1729 | 657 | 1620 |
| Geometrías | 1298 | 1298 | 1189 |
| Triángulos | 199934 | 4954 | 199934 |
| Texturas | 8 | 8 | 8 |

Se agrupan 172 primitivas en 63 `InstancedMesh`, siempre dentro del grupo del mueble que conserva su ID. El ahorro medido es de 109 llamadas y 109 geometrías (6,3 % de las llamadas de la escena completa); el tiempo mediano de frame se mantiene aproximadamente en 16,5–16,8 ms con vsync y SwiftShader, por lo que no se afirma una mejora de FPS en dispositivos reales. Los modelos autorizados externos quedan fuera. El modo sin agrupar es un fallback reversible; la capacidad WebGL y los errores de construcción dejan las mallas originales. Tres ciclos de cambio mantienen 1190 geometrías tras seleccionar un mueble y liberan 189 lotes explícitamente. `draw-call-pilot.json` contiene los datos completos.

La revisión visual detectó que agrupar cajas grandes cambiaba superficies visibles pese a reducir más llamadas. La implementación final limita cajas a volumen ≤0,001 m³ y admite cilindros/esferas opacos de escala positiva. En la comparación automatizada, el cambio de visibilidad y vuelta al mismo renderer sin agrupar afectó 2040 píxeles con diferencia RGB >20; la toma agrupada afectó 2057 píxeles: **17 píxeles adicionales** sobre 1440×900. La selección por clic, los IDs de lotes, la cámara y el JSON del proyecto permanecieron intactos en el piloto. Las pruebas de exportación, modelos ausentes, pérdida de contexto y presentación se repiten en la suite amplia.
