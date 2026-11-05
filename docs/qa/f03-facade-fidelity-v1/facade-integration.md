# F03 — Integración modular de fachada

## Alcance y autoridad

`F03/facade-material@1` es una receta `VISUAL_ONLY`, desactivada por defecto. No escribe `FloorPlanProjectV1`, no cambia IDs, cotas, huecos ni clasificación exterior y no añade desplazamiento. La decisión contiene proyecto, perfil, material, repetición y fuerza normal; el resolvedor rechaza claves, versiones y calibraciones desconocidas.

La selección exige simultáneamente: proyecto idéntico, muro clasificado `facade` por `FloorPlanExterior.derive`, categoría `wall`, asignación persistida y preset semánticamente compatible. Los muros interiores, sin asignación, de otro material o con clasificación indeterminada quedan fuera. En el fixture real sólo `wal_ref-w18` cumple la compatibilidad de `white_stucco` con `surface-white-plaster-02`.

## Convivencia con F02

F03 no importa ni modifica el núcleo/adaptador F02. Antes de aplicar, `index.html` entrega a F03 el conjunto de mallas de fachada realmente poseídas por los bindings F02. Esas mallas se excluyen por identidad (`f02-owned-surface`), no por una lista de IDs ni por descartar muros completos. F03 no dispone materiales, texturas o geometrías de `SurfaceRenderer` o F02.

El control visual `F02-M1` compara jambas, marcos, vidrio y alféizar con F02 activado en B y C. El smoke conserva las 12 ventanas compatibles activas. Esto prueba coexistencia en el fixture; no autoriza cambios futuros sin repetir la regresión.

## Recursos y reversibilidad

- Un material compartido y tres texturas por variante/perfil; no hay una copia por muro.
- Cada archivo se valida por MIME, longitud, SHA-256 y dimensiones antes de llegar al material.
- Albedo usa `SRGBColorSpace`; normal y rugosidad usan `NoColorSpace`.
- `MeshStandardMaterial` mate, `metalness=0`, sin clearcoat ni displacement.
- Las UV métricas se recalculan en una geometría clonada; posiciones, índices y normales permanecen idénticos.
- OFF, rebuild, salida y pérdida de contexto restauran las referencias originales y liberan sólo recursos propios. Las cargas se cancelan por `AbortController` y por época.
- Un fallo deja el acabado original y expone `status=fallback` y el error.

## Calibración cromática

La primera captura sin calibración aclaró demasiado el yeso y fue rechazada. El pipeline calcula ahora un tinte por material: media RGB lineal del albedo original multiplicada por su `mapTint`, dividida por la media lineal del nuevo albedo HERO. El resultado se publica como `integration.tintLinear` en el manifiesto y se aplica al material, no al proyecto ni a la exposición.

Esta corrección conserva la media cromática del acabado asignado; no convierte los materiales en equivalentes. `white_rough_plaster` y `rough_plaster_03` requieren `allowExperimentalVariant:true` y no se seleccionan automáticamente.

## Perfiles y escala

`capture` y `presentation` usan HERO 1024; `mobile`, `walk` y `editor` usan balanced 512. `repeatMm=2000` y `normalStrength=0.65` son calibración visual experimental, no dimensiones certificadas por la fuente. El pipeline no altera los 18 WebP al calcular el tinte.

## Reproducción

```bash
node --test tests/facade-fidelity.test.cjs tests/visual-families.test.cjs
NODE_PATH=<herramientas-qa> CHROME=<Chrome> node --test tests/facade-fidelity-smoke.browser.test.cjs
NODE_PATH=<herramientas-qa> CHROME=<Chrome> node --test tests/facade-fidelity-visual.browser.test.cjs
```

Las capturas usan el fixture VQ01 real, A/B/C con F02 OFF/OFF/ON y F03 OFF/OFF/ON. La vista general, detalle, plano medio, ambas oblicuas, fachada compatible completa y móvil emulado mantienen la misma cámara, luz, exposición, proyecto y perfil entre comparadores. La revisión visual humana permanece pendiente.
