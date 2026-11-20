# A0 · instrumentación del residual WebKit (#273) para Codex

Este contenedor solo tiene Chromium, sin WebKit ni Firefox, así que **la reproducción es de Codex**. Claude corrige en cuanto haya una traza. Esto no se propaga a #274–#279 ni cambia el HEAD de A0 (`112eaf52`).

## Uso (WebKit persistente, mismo HEAD y la base SMART)
1. Inyectar el trazador antes de navegar: `await context.addInitScript({path:'labs/sculpt/op-07/a0/ro-trace.init.js'})`.
2. Marcar las fases del recorrido con `page.evaluate(l=>__roTrace.mark(l),'R1-T02b:announce')`.
3. Al terminar, y siempre en el `finally`, guardar `await page.evaluate(()=>__roTrace.dump())` como JSON con nombre de prueba, perfil y tamaño (1440×900, 390×844).
4. Ejecutar R1-T02, R1-T02b y R1-T04 de `tests/a0-writer-fence.browser.test.cjs` y los 13 casos de `tests/a0-browser-residuals.browser.test.cjs` con F0.2b activo e inactivo.

## Qué responder con la traza
- `errors[].context` son los 40 eventos previos a cada error: qué observador (`src`), sobre qué elemento, en qué fotograma y si corría dentro de un rAF (`inRaf`).
- `ro-exit.changedSync` no vacío indica que un callback cambió en la misma entrega el tamaño de un elemento observado. Es la causa clásica del bucle.
- Si `changedSync` está vacío y aun así hay error: buscar en `kind:'style'` una escritura de estilo (variables `--headerEnd`/`--fabTop`, `class`) entre `ro-enter` y el error. Con eso se separa una escritura diferida que llega antes de la notificación de una cascada de diseño de WebKit.
- Compararlo con la misma traza en Chromium (aquí da 0 errores) y en Firefox (21/21).

Nada se filtra: el trazador no usa `preventDefault` ni silencia excepciones. Las aserciones de las pruebas no cambian.
