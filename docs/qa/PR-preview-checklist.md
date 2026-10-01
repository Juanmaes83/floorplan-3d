# Checklist de revisión visual por PR (2D + 3D)

**Aplica a:** todo PR de `Juanmaes83/floorplan-3d` que toque `index.html` o cualquier recurso que se vea en pantalla.
**Principio:** la QA 3D exige ver una **escena Three.js renderizada e interactiva** del **SHA revisado**. Una respuesta HTTP 200, un proxy, HTML visible o la mera presencia de un `<canvas>` **no bastan**. Ejemplo real de F0: `rawcdn.githack.com` devuelve HTTP 200 a un navegador, pero con una página intermedia («External Content Notice»), no con la app.

## 1. Infraestructura actual y comandos documentados

Revisión documental del 01-10-2026 contra master
`133f6f47fc5f16764cb290f95e49414932b27a09`; estado según README, informes y
[workflow](../DEVELOPMENT-WORKFLOW.md). App estática, módulos en `js/`, pruebas
Node/Python y fixtures en `tests/`. No hay package.json/build ni workflow de
pruebas GitHub Actions; Vercel y sus comentarios son servicios separados.
**No se ejecutan estas suites en la reconciliación documental #3/#15.**

| Uso para una futura PR de producto | Comando / regla | Evidencia y límites |
| --- | --- | --- |
| Servir localmente | Reutilizar servidor activo; si no existe y hace falta, `python3 -m http.server 8000 --bind 127.0.0.1` en raíz. | La ejecución local no es una preview pública. No crear worktree salvo autorización. |
| Sintaxis | `node --check` de módulos/scripts realmente modificados; extraer correctamente scripts inline y excluir importmap y tags src (§6). | Es sintaxis, no QA de render. |
| Regresiones | `node --test --test-concurrency=1 tests/*.test.cjs` y validadores Python pertinentes documentados. | Usar herramientas ya instaladas; registrar conteos, fallos, omitidas y comandos reales. No instalar paquetes como parte de esta checklist. |
| Contrato | `python3 tests/schema.test.py` en una PR que lo afecte. | Valida schema canónico/embebido y duplicados. No autoriza cambios contractuales. |
| Solo documentación | Diff contra master, enlaces internos/referencias, Markdown y `git diff --check`. | No repetir producto ni crear preview visual nueva por esta tarea documental. |

Las pruebas de navegador actuales usan Playwright y Chromium existentes. Los
informes describen un transporte de módulos Three.js con curl HTTPS verificado
si Chromium rechaza la CA del entorno: conserva TLS; **no demuestra carga directa
del CDN en Chromium**. Si CDN o WebGL fallan, registrar petición/HTTP/TLS/error y
verificar que 2D continúa, sin declarar 3D comprobado por una captura anterior.
No desactivar verificación, cambiar permisos/red ni sustituir Three.js por un mock
para afirmar que la escena real se renderizó.

## 2. Preview, SHA y acceso

Vercel ya está conectado según cierres #17/#18. No se necesita dar de alta otro
hosting ni activar Pages. Previews anteriores protegidas y enlaces temporales
constan en los informes; **no se vuelven a certificar en esta ejecución**.
Una PR visual sigue el workflow, aprobación explícita y merge posterior.

Para cada PR de producto, registrar por separado:

```text
SHA local/remoto revisado: <40 hex>
SHA del deployment:       <40 hex y método de comprobación>
URL exacta / alias:       <indicar si inmutable o mutable>
Estado Vercel:            READY | fallido | pendiente | no verificado
Acceso invitado:          sin autenticar verificado | autenticado | no verificado
Prueba en navegador:      pasos ejecutados, resultados y errores
Revisión humana:          pendiente | aprobación explícita de Juanma + fecha
```

- Puede registrarse una URL encontrada como **referencia no verificada**, con
  fuente y error exacto; no presentarla como preview accesible ni del SHA exacto.
- READY/commit se contrastan con evidencia del proveedor o deployment público
  ligado al SHA. Un alias de rama mutable, HTTP 200 o Vercel Preview Comments
  no demuestra el deployment final ni la escena Three.js.
- Comprobar acceso desde sesión nueva sin autenticar. Si requiere Vercel
  Authentication, identificarlo y facilitar acceso temporal autorizado cuando
  exista; guardar caducidad, no publicar token/cookie/enlace sensible en Git.
- Bloqueo CONNECT/curl o ERR_TUNNEL de Playwright es una limitación del mecanismo
  y entorno; no prueba inexistencia de información ni del deployment.
- Preview local/capturas pueden acreditar ejecución local y SHA probado,
  dejando pendiente el acceso remoto. No reemplazan la revisión requerida.
- Githack y Pages del upstream del informe F0 son **antecedentes históricos**,
  no el circuito vigente de revisión ni prueba de las ramas actuales.
- No hay merge o despliegue manual a producción automático por estar verde.
  Una PR solo documental como #3/#15 requiere revisión documental, no nueva QA UI.

## 3. Viewports obligatorios

| Nombre | Tamaño | Tipo | Cambio de tamaño que hay que probar |
|---|---|---|---|
| Escritorio | 1440×900 | Ratón y teclado | → 1024×768 |
| Móvil vertical | 390×844, DPR 2 | Táctil (`isMobile`, `hasTouch`) | → 844×390 (horizontal) |
| Opcional | 768×1024 | Táctil (tablet) | → 1024×768 |

## 4. Checklist humana (copiar en el PR y marcar)

**Identificación**

- [ ] SHA, URL y estado de acceso rellenados según §2.
- [ ] El proyecto de referencia cargado es: `plantilla por defecto` | `<fichero FloorPlanProjectV1 adjunto>`, con el `localStorage` limpio (ventana privada).

**2D (en cada viewport)**

- [ ] Se ve el plano completo tras «Ajustar»; cotas, nombres de estancia y muebles legibles.
- [ ] Seleccionar, mover, rotar y redimensionar un mueble funciona (con ratón o un dedo).
- [ ] Zoom (rueda o pinza) y desplazamiento funcionan.
- [ ] Deshacer y rehacer revierten el último cambio.

**3D del mismo proyecto (en cada viewport)**

- [ ] Al pulsar «Escena 3D» se ven muros, suelos con material y muebles del **mismo** proyecto que en 2D (mismo nº y posición aproximada de muebles).
- [ ] Arrastrar (ratón o un dedo) **gira la cámara** y la imagen cambia.
- [ ] Zoom (rueda o pinza) funciona; «Isométrica» y «Superior» mueven la cámara.
- [ ] «Recorrer»: WASD en escritorio o joystick en táctil; una puerta se abre al pulsarla.
- [ ] Un cambio hecho en 3D (mover un mueble) aparece en 2D al volver.
- [ ] **Cambio de tamaño / orientación:** el canvas se adapta sin deformarse. Anota tamaño útil y ratio: canvas ≥60 % del alto disponible del escenario en ambos móviles.
- [ ] Volver a 2D funciona (botón o `T`).

**Errores y recursos**

- [ ] Consola/red sin errores nuevos respecto al SHA base; registrar y explicar errores, sin asumir que solo falla favicon.
- [ ] Sin peticiones fallidas a `cdn.jsdelivr.net/npm/three@0.160.0`.
- [ ] (Si el PR toca el 3D) El 3D sigue funcionando después de entrar y salir 5 veces, sin avisos de contexto WebGL perdido.
- [ ] (Si el PR toca el arranque) Con WebGL desactivado aparece un mensaje y el 2D sigue operativo. F0 lo detectó; PR #5 lo corrigió. Verificar la regresión, no asumir el fallo histórico.

**Evidencia adjunta**

- [ ] Capturas: 2D, 3D, 3D tras girar y 3D tras cambiar de tamaño, en escritorio y móvil (8 en total).
- [ ] Transcripts/metrics de tests actuales, si se ejecutaron. Anexo qa3d solo como antecedente; no afirmar nueva ejecución.
- [ ] Nota de la GPU usada. Con **SwiftShader** (headless), el render y la interacción quedan verificados, pero **el rendimiento no**. El rendimiento se prueba en un dispositivo real e indicando el modelo.

## 5. Qué cuenta como QA 3D válida

| Evidencia | ¿Suficiente? |
|---|---|
| HTTP 200 de la URL | No |
| HTML o texto de la página visible | No |
| Existe un `<canvas>` | No |
| Captura del 3D **y** captura tras interactuar donde la escena cambia, del SHA revisado | **Sí** (mínimo) |
| Informe `qa3d` con `context: webgl2`, `uniqueColors` alto (en F0 hay > 290), `orbit.meanAbsLumDiff > 5` y el tamaño tras el resize | Sí, como apoyo automatizado |

## 6. Validación de sintaxis (reproducible)

```bash
node -e '
const fs=require("fs"),h=fs.readFileSync("index.html","utf8"),re=/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;let m,i=0;
while((m=re.exec(h))){const a=m[1]||"";if(/importmap|\bsrc=/.test(a))continue;
fs.writeFileSync(`/tmp/fp-js-${i}.${/type="module"/.test(a)?"mjs":"cjs"}`,m[2]);i++}'
for f in /tmp/fp-js-*; do node --check "$f" && echo "OK $f"; done
```

## 7. Cobertura según el cambio de producto

Usar tests existentes y herramientas instaladas; no crear worktrees/ramas ni
instalar navegadores/dependencias para esta revisión documental.
Para futuros cambios visuales, completar §3–§5 y añadir lo que afecte la PR:

- Proyectos independientes, vacío/imagen, cancelación, persistencia y JSON/ZIP.
- Rectángulos compatibles, lado fijo, preview/confirmar, undo/redo, rechazos
  de vecinos/cotas/muebles; huecos con consentimiento. No prometer formas generales.
- F1b: calibración, segunda cota, trazado y borrado compartido de imágenes.
- F3: búsqueda SONGESAND/puf STOCKHOLM, permiso/hash/medidas/formato/tamaño,
  carga texturizada, atribución, motivo concreto de fallo y fallback.
- Verificación local en cada viewport y revisión humana del deployment exacto.
  SwiftShader es software; no registra rendimiento ni calidad en teléfono físico.

El anexo siguiente conserva el script de F0 @ `825ddf6` (Windows,
playwright-core 1.47, QA del 30-09-2026). Sus esperas/selectores y métricas son
históricos; no se ejecutó de nuevo ni reemplaza las regresiones actuales. Las
instrucciones antiguas de instalar paquetes y crear worktree se retiraron.

## Anexo: `qa3d.mjs` (versión usada en F0)

```js
// QA 2D/3D reproducible para floorplan-3d. Uso: node qa3d.mjs <url> <etiqueta> <dirSalida>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [url, label, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const VIEWPORTS = [
  { name: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, resizeTo: { width: 1024, height: 768 } },
  { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, resizeTo: { width: 844, height: 390 } },
];

// Estadística de píxeles del canvas WebGL (preserveDrawingBuffer:true en la app)
const canvasStats = () => {
  const c = document.querySelector('#view3d canvas');
  if (!c) return { canvas: false };
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  let gpu = null;
  if (gl) { const e = gl.getExtension('WEBGL_debug_renderer_info'); gpu = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }
  const t = document.createElement('canvas'); t.width = 96; t.height = 96;
  const g = t.getContext('2d'); g.drawImage(c, 0, 0, 96, 96);
  const d = g.getImageData(0, 0, 96, 96).data;
  const colors = new Set(); let sum = 0, sum2 = 0; const lum = [];
  for (let i = 0; i < d.length; i += 4) { colors.add((d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3)); const l = (d[i] + d[i + 1] + d[i + 2]) / 3; lum.push(l); sum += l; sum2 += l * l; }
  const n = lum.length, mean = sum / n;
  return { canvas: true, context: gl ? (gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl') : null, gpu,
    cssSize: [c.clientWidth, c.clientHeight], bufferSize: [c.width, c.height],
    uniqueColors: colors.size, lumStd: Math.sqrt(sum2 / n - mean * mean), lum };
};
const diff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
const strip = s => { const { lum, ...r } = s; return r; };

const report = { url, label, date: new Date().toISOString(), runs: [] };
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  const run = { viewport: vp.name, consoleErrors: [], pageErrors: [], failedRequests: [], steps: {} };
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') run.consoleErrors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => run.pageErrors.push(String(e)));
  page.on('requestfailed', r => run.failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  const resp = await page.goto(url, { waitUntil: 'networkidle' });
  run.httpStatus = resp.status();
  // githack muestra una página intermedia a navegadores: la HTTP 200 inicial NO es la app
  run.interstitial = /External Content Notice/.test(await page.title());
  if (run.interstitial) { await page.getByText('Open the page').click(); await page.waitForLoadState('networkidle'); }
  await page.waitForTimeout(800);

  run.steps.plan2d = await page.evaluate(() => ({
    title: document.title, lang: document.documentElement.lang,
    brand: document.querySelector('.brand')?.textContent?.trim() || null,
    svgPlan: !!document.querySelector('svg#plan'),
    furnitureNodes: document.querySelectorAll('#gFurn [data-fid]').length,
    roomNodes: document.querySelectorAll('[data-room]').length,
    view3dReady: !!window.View3D,
    storageKeys: Object.keys(localStorage),
  }));
  await page.screenshot({ path: path.join(outDir, `${label}-${vp.name}-2d.png`) });

  // Cambiar a 3D con el control real de la UI y esperar la animación de entrada (~2.2 s)
  const btn3d = page.locator('#viewSeg .btn[data-view="3d"]');
  if (vp.hasTouch) await btn3d.tap(); else await btn3d.click();
  await page.waitForFunction(() => document.querySelector('#stage')?.classList.contains('is3d') && !document.querySelector('#stage')?.classList.contains('animating'), null, { timeout: 15000 }).catch(e => run.steps.enter3dError = String(e));
  await page.waitForTimeout(600);
  const s1 = await page.evaluate(canvasStats);
  run.steps.scene3d = strip(s1);
  await page.screenshot({ path: path.join(outDir, `${label}-${vp.name}-3d.png`) });

  // Interacción de cámara: arrastre con ratón o con un dedo (CDP touch)
  const box = await page.locator('#view3d canvas').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  if (vp.hasTouch) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + i * 12, y: cy + i * 3 }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(cx, cy); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(cx + i * 20, cy + i * 4); await page.waitForTimeout(16); }
    await page.mouse.up();
  }
  await page.waitForTimeout(1200);
  const s2 = await page.evaluate(canvasStats);
  run.steps.orbit = { meanAbsLumDiff: +diff(s1.lum, s2.lum).toFixed(2), after: strip(s2) };
  await page.screenshot({ path: path.join(outDir, `${label}-${vp.name}-3d-orbit.png`) });

  // Cambio de tamaño / orientación
  await page.setViewportSize(vp.resizeTo);
  await page.waitForTimeout(1200);
  const s3 = await page.evaluate(canvasStats);
  run.steps.resize = { to: vp.resizeTo, after: strip(s3) };
  await page.screenshot({ path: path.join(outDir, `${label}-${vp.name}-3d-resized.png`) });

  // Volver a 2D
  await page.setViewportSize(vp.viewport);
  await page.keyboard.press('t');
  await page.waitForFunction(() => !document.querySelector('#stage')?.classList.contains('is3d'), null, { timeout: 10000 }).catch(e => run.steps.exit3dError = String(e));
  run.steps.back2d = await page.evaluate(() => ({ is3d: document.querySelector('#stage').classList.contains('is3d') }));

  report.runs.push(run);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, `${label}-report.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
```

## Validación de esta reconciliación

Base master `133f6f47fc5f16764cb290f95e49414932b27a09`. Revisión de Markdown,
enlaces internos/referencias y diff de la PR; sin ejecutar suites, navegador,
preview visual ni anexos de producto. La auditoría reconciliada registra la
publicación y los enlaces externos no reconsultados o bloqueados.
