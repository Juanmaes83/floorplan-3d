# OP-10 · 05 · Pulido visual (OBSERVE → CHANGE → BUILD → CAPTURE → CRITIQUE → CORRECT)

Escena: F5, el ejemplo con 46 muebles procedimentales y un banco de catálogo autorizado. Escena observada `2a5c640f…`, idéntica byte a byte entre ejecuciones independientes. Encuadres: axonometría de conjunto, salón (21,5 m²), cocina (6,0 m²) y dormitorio principal (12,4 m²).

**Regla:** la geometría y los materiales capturados no se tocan. Lo añadido vive en la colección `OP10_derived` y en la lista `derived` de cada `render-report.json`: cámaras, sol, cielo o exterior, luz de estancia, exposición y color de suelo desde el material del proyecto. No se inventan muebles, materiales, huecos ni medidas.

Hojas antes/después: `evidence/render/fase1-geometria.png`, `fase2-materiales-luz.png` y `fase3-encuadre.png`.

| Fase · ciclo | Observación (CRITIQUE) | Cambio (CORRECT) | Decisión |
|---|---|---|---|
| 1 · v1 | La cámara del dormitorio quedó **dentro del armario** (rayos a 0,11–0,24 m): media imagen negra con 100 % de «presencia» | Ojos a ≥ 0,4 m de toda superficie (16 rayos), nada bajo los pies y penalización por superficies a < 1 m; candidatos al 70/50/30 % hacia vértices y puntos medios | **REJECT** v1 |
| 1 · v2 | Geometría legible en las cuatro vistas; interiores oscuros (esperado en esta fase) | — | **KEEP** |
| 2 · v1 | Suelos blancos: en el visor llevan textura y el color que queda es el multiplicador blanco. Sobreexposición. Fondo de la axonometría azul oscuro (el cielo bajo el horizonte) | Color del suelo desde el material **del proyecto** de su estancia (`floorMaterialId → appearance.color`, 13 mallas, correspondencia por ID); −0,4 EV; luz de estancia 20·√área W; estudio gris para la axonometría | **ADJUST** |
| 2 · v2 | Cantos de muro oscuros (como en el visor), suelos de madera, colores reales del mobiliario | — | **KEEP** |
| 3 · v1 | Perspectiva de dos puntos correcta, pero por las ventanas se ve **un horizonte que parece el mar**: contexto inventado | Exterior neutro y luminoso sin horizonte en los interiores; el sol conserva su dirección | **REJECT** v1 |
| 3 · v2 | Imágenes de presentación sin contexto inventado: salón con la corredera al balcón, cocina en L, dormitorio con poyete y armario | — | **KEEP** |

## Hallazgo que NO se maquilla

Los armarios muestran una **tapa negra** en la axonometría. Causa: el cuerpo (`obj_template-004:485`) y la tapa (`…:507`) tienen la cara superior a la misma cota, 2,20 m. Son caras coincidentes: el visor las resuelve con el buffer de profundidad, pero en trazado de rayos se sombrean mutuamente. Corregirlo en el render alteraría la geometría capturada, así que se deja visible y pasa a la cirugía del visor (C3, `docs/08`).

## Límites declarados de las imágenes

- Representan la escena **observada**, no una visualización de proyecto aceptada.
- Las texturas no se copian. Los suelos usan el color de su material de proyecto y el resto de superficies el color observado.
- Iluminación derivada: un sol, exterior neutro y un área por estancia. No son aparatos del proyecto.
- Cámaras derivadas del polígono canónico. CAM01 (cámara guardada) e IMG07 (sol del visor) quedan para la integración futura.
- 960×600 con 32 muestras: calidad de revisión, no de entrega final.
