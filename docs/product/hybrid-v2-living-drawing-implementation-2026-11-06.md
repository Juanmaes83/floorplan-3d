# Hybrid V2 «Dibujo vivo» — implementación C0–C5 (rama aislada)

Fecha: 06-11-2026 · Rama: `feat/hybrid-v2-living-drawing` · PR en borrador solo para CI:
[Juanmaes83/floorplan-3d#170](https://github.com/Juanmaes83/floorplan-3d/pull/170) (no se fusiona; sin despliegue a producción).
Propuesta, storyboard y decisiones D1–D5: `docs/product/hybrid-v2-living-drawing-proposal-2026-11-05.md` en la rama
`claude/bold-allen-ug56ci`.

## 1. Qué es

Opción **«Dibujo vivo · lámina a grafito»** en «Presentar mi vivienda», desactivada por defecto y sin memoria. Con ella:

1. La presentación abre la vivienda como **un dibujo arquitectónico a grafito del mismo modelo**: papel, aristas finas, segundo trazo, sombreado y poché.
2. En la primera estancia el realismo nace en los **muebles protagonistas**, con manchas independientes y asíncronas. Nunca es un barrido lineal. Después llegan el suelo, los paneles de muro y por último el techo. **Dibujo y realidad conviven en la misma estancia.**
3. **Antes de que la estancia termine**, la cámara viaja hacia la siguiente, que sigue dibujada, y el proceso vuelve a empezar.
4. Al terminar, la presentación sigue como siempre. El proyecto (JSON, materiales del cliente) no cambia en ningún momento.

Se aplican las decisiones D1–D5:

| Decisión | Cómo se aplica |
|---|---|
| D1 | Protagonistas por clase de estancia. TV, puerta y planta nunca son las primeras ni dominan. La cámara evita quedar detrás de piezas altas u oscuras. |
| D2 | Contorno de grafito fino, sin línea de color. El frente es `fwidth` en grafito y los muros llegan por paneles de 0,9 m. |
| D3 | Ambientación opcional, rotulada y separada del proyecto (§4). |
| D4 | Autoplay con pausa, avance y retroceso exactos. Entre 5 y 8 s por estancia, y la cámara sale al 70–80 % del tiempo. |
| D5 | Rama aislada. Sin merge ni despliegue. |

## 2. Arquitectura

| Pieza | Archivo | Papel |
|---|---|---|
| C0 núcleo puro | `js/presentation-living-drawing-core.js` | Clasifica estancias, elige protagonistas (D1), genera momentos deterministas irregulares (primera mancha a 0,9 s, huecos ≥ 0,45 s, nunca dos huecos iguales seguidos), calcula la duración de cada estancia y el momento de salida, el estado puro en `t` y la ambientación sugerida. |
| C1–C2 capa | `js/presentation-living-drawing.js` | Pase AUX (posición e identidad por píxel; materiales sustituidos solo durante ese pase y restaurados en `finally`), compuesto a grafito, pase real copiado a textura y llegada por píxel desde las semillas. Mapa de estancias acotado (≤ 2048 px por lado, y nunca por encima del máximo de la GPU). Cada estancia queda completa antes de su final (`b9b0ace`, conservado y cubierto por tests). |
| C3–C4 narrativa | `js/presentation-story-core.js` (`living-drawing`) | Cámara pura en tiempo: Hermite cúbica C¹. Encuadre centrado en la región libre de la tarjeta, comprobado con una proyección real. Para cada estancia se puntúan varios puntos de vista y gana el que no tiene piezas altas u oscuras en primer plano. Los tránsitos largos van en arco por encima del dibujo. Con reduced motion la cámara se detiene en cada estancia, ya completa. |
| View3D | `index.html` | `beginLiving`/`endLiving` transaccionales: corte a 1,2 m, FOV 48, la capa vive solo durante la escena. Getters de auditoría solo de lectura: `presentationLivingDrawingInfo`, `presentationAmbienceInfo`, `presentationRendererState`, `presentationMaterialSignature`. |
| UI | `js/presentation-ui.js` | Opciones, apertura automática de la escena, botón «Ver dibujo vivo», rótulos en vivo (`aria-live`) y pasos con reduced motion. |

Código de terceros: ninguno nuevo. Usa three.js (ya presente) y texturas del catálogo propio, todas CC0 y verificadas por SHA-256 y tamaño.

## 3. Ciclo de vida y seguridad

- **Desactivado = master:** sin la opción no se crea ningún estado del dibujo y el render es el de siempre (test «OFF»).
- **Transaccional:**
  - si algo falla después de bajar los muros o arrancar la capa, todo se deshace antes de propagar el error;
  - un navegador sin render targets de coma flotante cae al render normal y la presentación continúa (test «fallback»).
- **Liberación:** al terminar la escena, cerrar la presentación, perder el contexto o salir del 3D, la capa, la ambientación y los recursos de GPU se liberan.
  - En 5 ciclos de apertura y cierre, geometrías y texturas se mantienen idénticas.
- **Proyecto intacto:** el JSON del proyecto y los materiales del cliente quedan idénticos en todos los tests.

## 4. D3 — Ambientación sugerida (opcional)

- **Activación:** subopción «Ambientación sugerida del catálogo (opcional)». Está desactivada y deshabilitada mientras «Dibujo vivo» no esté marcado.
- **Alcance:** solo durante la escena y **solo suelos**:
  - en estancias cuyo suelo no lleva ya un acabado de catálogo elegido por el cliente, que nunca se tapa;
  - acabados del catálogo verificados (roble, mármol, baldosa de gran formato).
- **Rótulo** en vivo: «Ambientación sugerida · no forma parte del proyecto».
- **Reversible:** cada malla recupera su material propio. Los acabados sugeridos viven en un `SurfaceRenderer` privado que se libera entero.
- **Paredes:** no se cambian, porque todos los muros comparten un único material y aplicarlo por estancia exigiría alterar la geometría. Las sugerencias de pared se registran como `walls-not-applied`.

## 5. Compatibilidad con Section → visita y Hybrid V1

Conflictos textuales al combinar ramas: todos aditivos (registro de narrativas, campos de `storyRun`, reinicios de estado en `disposeStory`).

- **Section:** 9 bloques.
- **Hybrid V1:** 2 bloques. El del bucle de render no es excluyente: V1 sincroniza su material antes de renderizar y después se renderiza con la capa de dibujo si está activa.

Se resolvieron en una integración local de QA (`qa/hv2-integration-section-v1-2026-11-05`, sin publicar) que conserva las dos funcionalidades completas.

Evidencia: `tests/presentation-scenes-integration.browser.test.cjs`. En esta rama se omite sola; en la integración ejecuta, dos veces seguidas en la misma presentación:

> dibujo vivo + ambientación → historia completa (Section → visita validada) → fachada híbrida → dibujo vivo otra vez

Tras cada escena, en la vista general, comprueba que:
- no queda capa, ambientación, plano de recorte, material ni contorno híbrido;
- el multiconjunto de firmas de material es idéntico;
- el estado del renderizador y la lente son iguales;
- la memoria de la segunda ronda es igual a la de la primera;
- el JSON del proyecto es idéntico y no hay errores de página.

Resultado: ver §7.

## 6. Defectos conocidos corregidos en esta fase

| Defecto | Corrección |
|---|---|
| La estancia quedaba bajo la tarjeta, en escritorio y en móvil (signos invertidos) | Signos corregidos; test de proyección que falla con los antiguos. |
| Con reduced motion, el final de una estancia mostraba ya la siguiente | La frontera pertenece a la estancia que termina. |
| TV y nevera dominaban el primer plano y los tránsitos | Punto de vista con penalización de obstáculos y arco en los tránsitos largos. |
| Protagonistas que volvían a dibujo tras completarse la estancia | Llegada de objeto entero. |
| Memoria de la máscara en planos enormes; último fotograma a lápiz | `b9b0ace`, conservado y extraído como funciones puras con tests. |
| Captura PNG durante la escena | Los botones de captura están deshabilitados mientras la escena está abierta. |

## 7. Pruebas, CI y rendimiento

(se completa con los datos medidos en el SHA final; ver §9)

## 8. Limitaciones y defectos abiertos

- **GPU real y dispositivos físicos: no probados.** Aquí solo hay SwiftShader (CPU), así que fluidez y coste real en GPU quedan pendientes de medir en un portátil y un móvil reales.
- **Materiales del ejemplo pálidos:** el realismo es fiel al proyecto, y en el proyecto de ejemplo (salvia, lino, roble claro) el contraste con el grafito es sutil. La ambientación D3 lo realza, pero es opcional y va rotulada.
- **Paredes:** sin ambientación por estancia (§4).
- **Nevera en la propia cocina:** al llegar a la cocina sigue en primer plano lateral. Pertenece a la propia estancia, pero un encuadre algo más alto la reduciría.
- **Un solo nivel:** cada escena recorre las estancias de un nivel. Una vivienda de dos plantas recorre la planta de la vista general elegida.

## 9. Evidencias

Ver `docs/qa/hybrid-v2/2026-11-06/README.md`.
