# CAT-01 + FOT-01 visual · «Entregar → Estudio de imágenes» (corte C3)

**Estado: MOCK_VALIDADO_PARCIAL.**
- El recorrido completo funciona con una **simulación local rotulada**.
- La generación real sigue **BLOQUEADA (STOP_GASTO)**: `photo-reform/1` está cerrado y falta un tope aprobado y un almacén persistente.
- No se afirma `CAT-G1/G2 PASS real`.

## Recorrido (`js/visual-reform-ui.js`)

1. **Imagen de partida.** Se valida como en FOT-01: tipo real, tamaño, dimensiones y decodificación. Se crea una copia sin metadatos. Nada se guarda.
2. **Receta `PromptRecipeV1`.**
   - Se elige una de las 6 recetas versionadas, con su zona y su intensidad (Fiel, Equilibrado o Creativo, según la receta), y 1 o 3 opciones.
   - La receta limita qué se puede cambiar y qué familias del catálogo valen como referencia.
3. **Zona revisable.**
   - Rectángulos dibujados con ratón o dedo (*pointer events*), o atajos accesibles por teclado.
   - Cada zona aparece en una lista y se puede borrar.
   - Se envía al servidor normalizada (0–1, 4 decimales).
4. **Conservar y cambiar.**
   - **Siempre se conservan**, bloqueados: encuadre, muros, ventanas, puertas, huecos e instalaciones.
   - Son opcionales: posición del mobiliario, suelo y techo. No se puede conservar la zona que se cambia.
5. **Referencias.**
   - De 1 a 3 productos de «Mis catálogos» (CAT-02) de las familias de la receta y con licencia `reference-image`.
   - Cada imagen se verifica con su SHA-256 antes de usarla.
6. **Coste.**
   - Real: **BLOQUEADA (STOP_GASTO)**.
   - Simulación: «no aplica» (nunca 0 ficticio).
   - Hace falta consentimiento.
7. **Resultados.** Las opciones aparecen rotuladas como **SIMULACIÓN**. Se comparan con un deslizador.
8. **Revisión de fidelidad** (`RubikVisualReform.review`).
   - Una medida automática de los píxeles que han cambiado **fuera de la zona**. La tolerancia depende de la intensidad: 1 %, 2 % o 4 %.
   - Además, la persona revisa huecos y geometría.
   - **RECHAZADA** si cambia fuera de la zona, si se borran o alteran huecos, o si la geometría cambia.
   - El parecido con el producto se registra, pero **nunca certifica el SKU**.
9. **Decisión y ficha** (`rubik-visual-result-sheet/1`).
   - La ficha queda congelada y con huella. Recoge:
     - la fuente (huella, tamaño, metadatos eliminados);
     - la receta con la huella del texto;
     - la solicitud cerrada;
     - las referencias (catálogo, revisión, SKU, licencia);
     - el resultado (tipo, coste o su estado);
     - la revisión y la decisión.
   - Siempre `projectChanged:false` y `skuCertified:false`.
   - **Una simulación nunca es entregable** («Descargar imagen» desactivado).

## Servidor (`api/photo-reform.js`, modo `catalog`)

Comparte el validador y las recetas con el navegador (`js/visual-reform-core.js`):
- El **texto lo compone el servidor** desde la receta, con tokens cerrados. Ningún texto del catálogo (nombres, SKU, descripciones) llega al proveedor.
- Las imágenes de referencia van **ligadas por SHA-256 y orden** a la confirmación de gasto.
- El servidor dibuja la **máscara PNG** del tamaño de la foto: transparente = la zona.
- 3 opciones cuentan 3 imágenes contra el tope total de 4.

## Pruebas

| Fichero | Pruebas | Qué cubre |
|---|---|---|
| `tests/visual-reform-core.test.cjs` | 7 | 6 recetas e invariantes; solicitud cerrada; **escape e inyección de instrucciones** (cadenas hostiles en cada campo y más de 40 combinaciones de receta, zona e intensidad sin texto inyectado); medida dentro y fuera de la zona; revisión; ficha. |
| `tests/photo-reform-api.test.cjs` | 14 en total; 4 nuevas de CAT-01 | Receta en el servidor; máscara con la zona transparente; referencia distinta, en otro orden o en otro número; WebP; inyección; tope de 3+3 imágenes; cadena completa cliente → servidor → proveedor falso. |
| `tests/visual-studio.browser.test.cjs` | 2 | Editor real. Escritorio: zona con ratón, referencias, STOP_GASTO, 3 opciones, ACEPTABLE, **RECHAZADA por deriva que borra una ventana**, RECHAZADA por huecos, cancelación a mitad, error del proveedor. Teléfono 390×844 EN. |
| `scripts/qa/record-cat-ia-v1.cjs` | — | Grabador: vídeo de escritorio, vídeo de móvil y vídeo de errores y cancelación, con aserción y captura por cada caso negativo. **No hay vídeo de proveedor real**: no se ha generado ninguna imagen real. |
