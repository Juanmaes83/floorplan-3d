# OP-05 · P3/P4 — HANDOFF de laboratorio (20/11/2026)

> **Estado:** candidata de laboratorio, detenida antes de P5.
> - **C1 NO-GO:** no hay persistencia de GLB, descriptores ni referencias de OP-05.
> - No está integrada, disponible ni activada.
> - Pendiente de auditoría de ChatGPT y validación de Codex.

## 1. Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/op05-lab-p3p4`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Origen | P1/P2 `56c9f203` → diagnóstico `70ff5106` → este corte. La rama `claude/op05-lab-p1p2` no se ha tocado |
| Base de producto | master `8e917e1a` (la de P1/P2). El diagnóstico se leyó sobre `130ba24d` |
| Autorización | GO del propietario tras el cierre P0 de OP-07 v5 y la revisión de P1/P2 de Codex (`rubik-sculpt-simulator-lab@7fbbad55`, `CIERRE-P0-V5-Y-RELEVO-OP05`) |

**Commits:**

| Commit | Corte |
|---|---|
| `4ec0dac4` | Hallazgos de Codex sobre P1/P2 |
| `8df345fe` | P3/P4 |
| siguiente | Este HANDOFF y las evidencias |

## 2. Hallazgos de Codex sobre P1/P2 (resueltos antes de conectar el visor)

1. **P1:** tipo, límite F3 (8 MiB) y longitud declarada se validan **antes de copiar** (`loadPrivateModel`, y `loadVerifiedBytes` con `expectedBytes`). La copia que llega a decodificación se vuelve a hashear e inspeccionar.
2. **P2:** el texto se acota en **bruto** y se conserva el valor recortado. El título también queda acotado.

`labs/sculpt/op-05/p12-findings.test.mjs` es la sonda de Codex con el resultado invertido. Sobre `56c9f203` da **0/2**; aquí da **2/2**.

## 3. P3 · Resolución privada en el visor

- **`index.html`**, en `loadFurnitureAsset`: una rama privada **antes** de `assetRef`.
  - Reutiliza la cola `assetQueue` (máximo 2 cargas a la vez), `assetGeneration`, `cancelFurnitureAssets` y `buildFurn` (que también libera la escena privada).
  - Reutiliza `parseVerified`/`loadPrivateModel` de P1, sin un segundo GLTFLoader.
  - El modelo se coloca con las **cotas canónicas** del objeto. Escala física: **no certificada**.
  - Una carga tardía (otra generación, otro grupo u **otro proyecto**) se libera y nunca entra en la escena.
- **Proveedor de laboratorio** `labs/sculpt/op-05/private-view-lab.mjs`, solo en memoria; el producto nunca lo carga:
  - Una concesión está ligada a `(project.id, modelId)` y exige que ese proyecto tenga la referencia y la ficha con derechos del núcleo P2. **El SHA-256 no concede acceso.**
  - La extensión P2 vive en una **capa en memoria por `project.id`** y nunca entra en el documento del editor. Así, `save()`, la biblioteca, F0 y las exportaciones no pueden persistirla ni llevarla consigo (C1 por construcción).

## 4. P4 · Privacidad efectiva: guarda genérica en tres capas, que falla cerrado

1. **API de salida del visor** (`shot`, `deliveryShot`, `presentationCapture`, `captureScene`): mientras corren, el modelo privado se **retira** de la escena. Cubre las llamadas asíncronas, concurrentes, con error o canceladas (contador y `finally`).
2. **Cada `renderer.render`:** el privado solo se dibuja si no hay salida en curso ni una pista grabada viva.
3. **Lectores de píxeles del canvas:**
   - `captureStream` repinta en genérico antes de entregar la pista y bloquea el privado mientras siga viva;
   - `toDataURL`, `toBlob` y `readPixels` **lanzan un error** si el privado está presente, de modo que un consumidor desconocido nunca recibe sus píxeles.
- **Coste cero sin el módulo de laboratorio:** el producto se comporta como la base.
- **Capturas:** una salida nunca se prepara con el privado visible, así que no hay imágenes ni vídeos privados que reutilizar.
- **Documentos:** la referencia nunca está en el proyecto (§3). Para un proyecto compuesto, `minimize()` de P2 sigue fallando cerrado por destino y rechazando `private-expediente`.

## 5. Pruebas (Chromium 1243 y Node 22.23, Linux, este contenedor)

| Prueba | Resultado | Qué acredita |
|---|---|---|
| `tests/op05-p3p4.browser.test.cjs` · P3 visor | PASS | Modelo sintético (pirámide magenta, **textura JPEG decodificada**) visible en el visor de laboratorio; proyecto intacto; nada persistido; OP-02 en reposo (0 fotogramas) |
| · P3 negativos | PASS | Longitud incorrecta rechazada; sin concesión → `not-granted-for-this-project`; otro proyecto → genérico; bytes alterados → genérico «huella» |
| · P3 cancelación y generación | PASS | Dos reconstrucciones seguidas sin duplicados; mover y rotar conserva la representación; desactivar → genérico |
| · P4 salidas reales | PASS | **Imagen descargada** de `shot`, `deliveryShot`, **GLB de `captureScene`** (mallas del objeto idénticas al genérico), salidas concurrentes y canceladas, **fotogramas de la pista grabada** (`MediaStreamTrackProcessor` sobre la misma pista que el `MediaRecorder`), **JSON exportado** y almacenamiento sin nada de OP-05; lector desconocido → error. Marcadores: píxeles magenta (resistentes a JPEG) y geometría |
| P4 con la guarda **desactivada** | **FAIL esperado** | La prueba discrimina |
| `p1`, `p2`, `p12-findings` y `admission` (laboratorio) | 22/22 | P1/P2 conservados con los dos hallazgos |
| Suite pura completa | 1534 pruebas, 0 fallos (tras retirar de `index.html` la mención a `labs/`; los guardas de gobierno R02-A/R03 la detectaron) | Sin regresiones |
| Consumidores: assets, catalog-placement, scene-export, project-views, presentation, presentation-batch, tour-recorder, tour-video, client-share, delivery-image, op02-render-demand | Equivalente a la base | El único FAIL estable (R3 M11 a 1440×900) **también falla en la base** `56c9f203` con la misma carga. Por separado pasa |

**Límites:**
- Solo Chromium en Linux; faltan Firefox, WebKit y dispositivos.
- Este Chromium sin interfaz no decodifica WebM, así que los fotogramas grabados se leen de la pista del grabador y no del archivo.
- Las capturas de presentación por lotes (`presentation-ui`) se basan en `View3D.shot`, que la guarda cubre, pero no tienen una prueba específica con un modelo privado.

## 6. Evidencias visuales

En `labs/sculpt/op-05/evidence-p3p4/`:
- `00-generico-visor.webp`: el visor sin modelo privado;
- `01-privado-visor-laboratorio.webp`: la pirámide magenta en el visor de laboratorio;
- `02-salida-deliveryShot-generica.webp`: la salida real del mismo instante, solo con el genérico.

## 7. Superficies (protocolo §4.1)

- **HOME:** sin anuncio.
- **PLATAFORMA:** sin acceso. P5 (Amueblar → importar) no está autorizado.
- **ENTREGABLES:** todas las salidas comprobadas llevan la representación genérica.
- **Consumidores:**
  - Blender, imágenes, presentación, vídeo, cliente (`client-delivery` ya elimina las extensiones) y JSON: **genéricos y probados**.
  - DXF, presupuesto y láminas: usan el objeto canónico, sin la extensión.
  - Studio y FF&E: consumidores futuros.
- **Contrato mínimo para Codex y CC1:** un consumidor que no esté en el modo privado del visor nunca recibe geometría ni píxeles privados.

## 8. Rollback

- Rama de laboratorio: basta con no usarla.
- Revertir `8df345fe` deja P1/P2 con los dos hallazgos corregidos; revertir también `4ec0dac4` vuelve a `56c9f203`.

## 9. Dictamen de seguridad

En el alcance probado (Chromium Linux) no se observa ninguna fuga visual, geométrica, binaria ni documental. Los negativos discriminan y lo desconocido falla cerrado.

**NO-GO** para P5, P6/P7 (F0.2c/F0.3), P8 (A0) y producto.

Siguiente actuación: auditoría de ChatGPT y validación de Codex.
