# OP-05 · P1/P2 — HANDOFF de laboratorio (20/11/2026)

> **Autorización:** P1 y P2, solo laboratorio. **C1 NO-GO**: sin persistencia GLB, ni provisional.
> - Sin visor, sin interfaz, sin proyectos reales, sin migración ni activación.
> - P3 y P4 se validarán juntos y **no han empezado**.
> - Prioridad P0: cualquier reproducción nueva de Codex sobre OP-07 o A0 pasa por delante.

## 1. Identidad

| Qué | Valor |
|---|---|
| Repositorio / rama | `Juanmaes83/floorplan-3d` · `claude/op05-lab-p1p2` (propia, aislada; publicar no dispara ningún flujo de CI: comprobado con los YAML de `.github/workflows`) |
| Base | master `8e917e1a70f499a6b8dc68850c8413b7d06c5682` |
| Laboratorio de origen | `codex/sculpt-op05-lab@a722f9dd` (`labs/sculpt/op-05` importado sin cambios en el primer commit; la rama de Codex no se toca) |
| Donante | openPlan3D `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`, MIT (`upstream/LICENSE`) |
| Procedencia | [`P1P2-PROVENANCE.json`](P1P2-PROVENANCE.json): SHA-256 de originales, port, archivos nuevos y `js/asset-loader.mjs` en la base y en la candidata |
| HEAD y árbol | Los da la publicación verificada en remoto; no se escriben aquí (§4.3) |

**Commits:**
1. Laboratorio importado.
2. P1 (`cee856c5`).
3. P2 (`71f084f8`).
4. `AGENTS.md`/`CLAUDE.md` del mandato §4.3 (copia exacta de la rama `docs/mandato-publicacion-agentes-20261120`).
5. Este HANDOFF.

## 2. Qué contiene

### P1 · Port JS y cargador de bytes privados

| Archivo | Qué hace |
|---|---|
| `labs/sculpt/op-05/js/{localGLBGeometry,localGLBAccessors,localGLBScene,localGLBResources,rasterHeader}.mjs` | Port **mecánico** de las cinco dependencias necesarias (y solo esas). Generado por `js/port.cjs` con `stripTypeScriptTypes` (modo strip) más especificadores `.mjs`, sin edición manual. Cada archivo lleva procedencia MIT y el SHA-256 de su original. `port.cjs --check` demuestra que coinciden |
| `js/asset-loader.mjs` | Separación mínima, sin cambiar el catálogo (ver abajo) |
| `labs/sculpt/op-05/private-loader.mjs` | `verifyPrivateBytes()` y `loadPrivateModel()` (ver abajo) |

Separación mínima en `js/asset-loader.mjs`:
- `pipeline()` es la única canalización, con temporizador, cancelación y limpieza de bitmaps, texturas y GPU.
- `parseVerified()` procesa bytes **ya autorizados**.
- `measure()` mide la malla con una normalización explícita.
- `normalize()` mantiene **exactamente** la tolerancia de 20 mm del catálogo.
- `load()` del catálogo conserva su comportamiento: `assets/f3` del mismo origen, documento de permiso y SHA-256.
- `loadVerifiedBytes()` solo acepta `ArrayBuffer` y una verificación obligatoria. **No está conectado al visor.**

`private-loader.mjs`:
- `verifyPrivateBytes()` comprueba, en orden: longitud declarada, límite F3 (8 MiB), SHA-256, `inspectGLB`, `validateLocalGLBGeometry` (port) e `inspectTextures`, todo antes de decodificar.
- `loadPrivateModel()` devuelve `meshDimensionsMm`, `normalization` (declarada: glTF en metros, sin giro) y `physicalScale:'not-certified'`.
- Distingue tres medidas: las de la **malla**, la **normalización** y las **cotas canónicas** del mueble, que siguen en el objeto y no aquí.

### P2 · Núcleo puro `labs/sculpt/op-05/private-model-core.mjs`

- Extensión `x-op05-private-model` = `{version:1, models:[descriptor], items:[{objectId, modelId, sha256}]}`. Sigue el precedente MUE-01 y no cambia el contrato base, la versión ni OP-07.
- `newModelId()`: **opaco** (`pmd_` + 128 bits aleatorios), sin relación con el SHA-256.
- Descriptor: `modelId`, `sha256`, `byteLength` (≤ 8 MiB), `mediaType:'model/gltf-binary'`, `title`, `profileId:'f3-v1'`, `rights{basis, attribution, license, evidenceSha256, scope:'project-private'}`. Validación estricta: rechaza claves desconocidas.
- `attach`, `detach`, `read`, `resolve`, `minimize` y `genericObjects`:
  - siempre devuelven un proyecto **nuevo**;
  - deduplican **sin ampliar derechos** (los mismos bytes con otra ficha son un conflicto);
  - aíslan por proyecto;
  - usan la representación genérica por defecto;
  - `minimize()` **falla cerrado**: un destino desconocido es un error, y `private-expediente` responde «no disponible» (F0.2c/F0.3).

## 3. Pruebas (Chromium 1243 y Node 22.23, Linux, este contenedor)

| Suite | Resultado | Qué acredita |
|---|---|---|
| `labs/sculpt/op-05/admission.test.mjs` (existente, sobre la base nueva) | **5/5** | El laboratorio de Codex sigue válido sobre `8e917e1a` (`node --experimental-strip-types --test`) |
| `labs/sculpt/op-05/p1.test.mjs` (nuevo) | **7/7** | Ver detalle debajo |
| `labs/sculpt/op-05/p2.test.mjs` (nuevo) | **8/8** | Ver detalle debajo |
| Suite pura completa del repositorio | **1534 pruebas, 0 fallos** (2 omitidas) | Sin regresiones |
| `assets.browser` + `catalog-placement.browser` | **27/27** | Comportamiento F3 y de catálogo conservado |

Detalle de `p1.test.mjs`:
- port idéntico a la transformación de los originales;
- **paridad** TS↔JS en la base y en cinco negativos: URI externa, índice inválido, ciclo de nodos, accesor inexistente y amplificación;
- rechazo de URL, Blob, verificación ausente, longitud, huella y límite;
- medida de malla y escala no certificada;
- cancelación antes y durante la carga, y por temporizador;
- liberación de cada geometría;
- catálogo: `normalize` mantiene los 20 mm y `measure` no los aplica.

Detalle de `p2.test.mjs`:
- inmutabilidad y objeto canónico intacto;
- `Core.validate` normal y estricto;
- id opaco;
- deduplicación y conflicto de derechos;
- validación estricta;
- resolución y genérico con su razón;
- aislamiento por proyecto;
- **ninguna salida compartida contiene id, huellas, derechos ni título**;
- destino desconocido → error;
- convivencia con MUE-01 (sin cambiarla) y con otras extensiones.

**No repetido:** las 73 pruebas del donante, porque los módulos portados se comparan por paridad con sus originales.

## 4. Límites honestos

- La paridad se prueba con la base F3 y cinco negativos, no con todo el corpus del donante.
- El banco F3 no tiene texturas, así que la decodificación JPEG del camino privado no se ha ejercitado. Reutiliza el mismo `parseVerified` del catálogo, cubierto por `assets.browser`.
- El port depende de `stripTypeScriptTypes`, experimental en Node 22. El resultado está fijado en el repositorio y `--check` detecta cualquier cambio.
- `admission.mjs` (de Codex) sigue usando el id `model-<sha256>`. P2 lo sustituye por el id opaco **sin modificar** el archivo de Codex; P3 debe usar P2.
- Escala física: **no certificada**. El mueble se dibuja con sus cotas canónicas.

## 5. Regla HOME / PLATAFORMA / ENTREGABLES y diez puntos

1. **Capacidad:** validar y cargar en memoria un GLB propio sin URL y describirlo de forma privada. *Interna.*
2. **Área:** Amueblar (futuro). Hoy, solo laboratorio.
3. **Recorrido:** ninguno todavía. El recorrido propuesto (Amueblar → mueble → «Modelo 3D» → «Importar GLB…») es de P5.
4. **Tipo:** QA / experimental de laboratorio.
5. **Reutiliza:** `inspectGLB`, `inspectTextures`, `normalize`/`measure`, `dispose`, el perfil F3, el patrón de extensión de MUE-01, `Core.validate` y el port del donante.
6. **Perla / UX-FIRST:** sin interfaz. Los mensajes de error están redactados para la persona: causa y qué revisar.
7. **Dependencias:** P3 y P4 juntos; F0.2c/F0.3 para la persistencia (C1 NO-GO); A0 para la activación.
8. **Pruebas:** §3.
9. **Evidencia:** este HANDOFF, `P1P2-PROVENANCE.json` y el commit publicado. No hay Preview porque no hay superficie visible.
10. **Para Production falta:** P4 (privacidad efectiva en Blender, Presentación, imagen, vídeo y exportación) junto con P3, después P5, P6/P7 (F0.2c/F0.3) y P8 (activación con A0).

- **HOME:** valor profesional alto. **No anunciar.**
- **PLATAFORMA:** sin acceso. No existe «Mis modelos».
- **ENTREGABLES:** ningún consumidor conectado. `minimize()` ofrece la política que P4 deberá conectar a Blender, Presentación, imágenes, vídeo y exportación.

## 6. Rollback

- Todo está en una rama de laboratorio y nada está integrado. El rollback es no usarla.
- El único archivo de producto modificado, `js/asset-loader.mjs`, vuelve a su versión de la base con `git checkout 8e917e1a -- js/asset-loader.mjs`. Su SHA-256 base está en la procedencia.

## 7. Siguiente actuación

| Quién | Qué |
|---|---|
| ChatGPT / Codex | Auditar esta candidata |
| Propietario | Autorizar P3+P4 conjuntos en laboratorio |
| Claude Code | Detenido hasta entonces (P0 de OP-07/A0 aparte) |
