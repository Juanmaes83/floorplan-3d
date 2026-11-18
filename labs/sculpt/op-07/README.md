# SCULPT OP-07 · Muros curvos e inclinados, división y perfiles (laboratorio)

**Estado:** laboratorio aislado, pulido tras aprobarse D-OP07-1/2/3 ([DECISIONES.md](DECISIONES.md)). No toca producción, el contrato canónico, `index.html`, `project-core`, `quantity-core`, `building-core`, persistencia, APIs ni workflows. Fuera del despliegue (`labs/` está en `.vercelignore`).

**Fila de cartera:** OP-07 en [sculpt-openplan3d-roomgpt-2026-11-18.md](../../../docs/product/sculpt-openplan3d-roomgpt-2026-11-18.md) (en #261): «Acreditar el delta sobre la geometría canónica y validar los consumidores antes de ampliar el contrato».

## 1. SOURCE EXACT

| Campo | Valor |
|---|---|
| Donante | `Juanmaes83/openPlan3D` @ `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` |
| Licencia | MIT, © 2026 theLodgeStudio, copiada en `source/LICENSE` |
| Huellas | `MANIFEST.sha256`, SHA-256 de los bytes del commit (`git show`), no del checkout con CRLF |

Se reutiliza la copia fiel existente (rama `sculpt/openplan3d-fuente`, `labs/sculpt/openplan3d-771c9e1/`).
- **Ya estaban, con el mismo hash:** `wallProfiles.ts`, `wallPlanGeometry.ts`, `splitWallGeometry.ts`, `roomDetection.ts`, `interiorArea.ts`, `roomNesting.ts` y `models/types.ts`. No se duplican; el manifiesto los marca `(snapshot sculpt/openplan3d-fuente)`.
- **Ampliación mínima, en `source/`:**
  - `slopedWallGeometry.ts`;
  - las 10 suites originales de muros, aberturas en curva, estancias curvas, alturas, área interior, división, límites, selección y UV.

## 2. BASELINE (donante, sin modificar)

Se ejecutó en una copia aislada con `npm ci --ignore-scripts` y `svelte-kit sync`. El comando fue `vitest run` sobre:
- `wall-profiles`, `curved-wall-openings`, `curved-rooms`, `wall-heights`, `interior-area`;
- `wall-room-split`, `wall-plan-bounds`, `curved-wall-hit`, `room-drag-curve`, `wall-texture-uvs`.

**Resultado: 10 suites, 68/68.**

Golden: `tests/golden-generator.donor.test.ts` ejecuta las funciones del donante sobre 4 muros (recto, curvo, inclinado, curvo e inclinado) y 2 estancias (rectangular y con un lado curvo). La salida es `tests/golden-771c9e1.json`, en centímetros.

## 3. CLASSIFY

| Bloque del donante | Decisión | Motivo |
|---|---|---|
| Trayectoria cuadrática facetada (16 tramos), muestreo, distancia ↔ parámetro | **Adoptar** | Es la misma geometría para plano, 3D, selección, áreas y aberturas |
| Límites exactos de la curva, etiqueta de cota | **Adoptar** | Encuadre y cota correctos en curvas |
| División exacta de Bézier (de Casteljau) | **Adoptar y ampliar** | RUBIK divide por distancia en mm y reparte alturas y aberturas |
| Perfil con aberturas: unión de huecos y reparto por tramos, dintel nivelado en pendiente | **Adoptar** | Resuelve solapes y aberturas en las juntas de la curva |
| Recorte silencioso de aberturas bajo una coronación inclinada | **Solo para dibujar** | El validador canónico de RUBIK rechaza las que no caben. El laboratorio lo informa con `validateOpening` |
| Área interior por barrido, descontando las huellas de muro | **Adoptar** | Exacta para polígonos facetados. Hoy RUBIK mide con otra regla de caras |
| Pieza 3D inclinada y UV por longitud | **Adoptar sin Three.js** | Devuelve arrays; el motor 3D vigente decide cómo usarlos |
| Posición de abertura 0–1 en parámetro cuadrático | **Descartar** | RUBIK usa `offsetMm`, una distancia física; se elimina la deriva parámetro-distancia |
| Svelte, stores, Firebase, catálogo | **Descartar** | Fuera de alcance; no se crea un segundo editor ni modelo |

## 4. ESCULPIR y PULIR

`wall-geometry-core.js` es un UMD sin dependencias:
- unidades en milímetros;
- nombres de campo de RUBIK;
- cada función cita su origen;
- cabecera de atribución MIT.

**Añadidos de RUBIK:**
- `paramAt` (inversa de `distanceAt`);
- `splitAt`, que divide por distancia y conserva alturas y aberturas;
- `validateOpening`;
- `faceAreas` y `faceLengths` (cara exterior e interior de una curva);
- `legacyView`, una degradación visible para consumidores antiguos;
- `facets`, para la exportación.

## 5. VALIDACIÓN

```bash
node --test labs/sculpt/op-07/tests/op07.test.cjs labs/sculpt/op-07/tests/op07-polish.test.cjs   # 34/34, local, sin CI
```

| Grupo | Qué acredita |
|---|---|
| Paridad con el donante (×4 muros) | Longitud, muestras, alturas, distancia, límites, cota y división, con tolerancia 1e-9 relativa tras ×10. Caras cortadas alrededor de una puerta y una ventana, pieza a pieza |
| Paridad con el donante, aberturas recortadas | Mismos huecos que `openingOnWall` en un muro inclinado |
| Paridad con el donante, estancias | Mismos puntos de anillo (4 y 19), área de eje (12 y 13,59 m²), área interior (10,9725 y 12,5474 m²) y techo |
| Paridad con RUBIK, muro recto | `quantity-core.wall`: mismas longitud, área bruta y área neta. Mismas piezas en planta que `project-core.geometry` |
| Contrato intacto | `project-core.validate` sigue rechazando `curve` y `heightEndMm`: OP-07 no cambia producción |
| Delta RUBIK | Validación de aberturas, `offsetMm` medido sobre la curva, división por distancia, caras distintas en curva, trapecio en pendiente, pieza 3D y degradación visible |

Pulido (`op07-polish.test.cjs`, 15 casos): superficies por cara, precisión y conservación, protección de guardado. Ver [DECISIONES.md](DECISIONES.md), [CONTRATO-PROPUESTA.md](CONTRATO-PROPUESTA.md) y [PLAN-CIRUGIA.md](PLAN-CIRUGIA.md).
