# FT3D-5 — Adenda de auditoría final de ownership

**Fecha:** 01-11-2026.

**Contrato principal:** `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md`.

**Base auditada:** `master@f74c4ee6bca58077a1135d4db2466e4332d0d5e7`.

**Estado:** **ADENDA VINCULANTE DEL CONTRATO FT3D-5**.

Esta adenda no cambia el alcance ni las decisiones de producto del contrato principal. Cierra cuatro detalles de ownership comprobados en el renderer real después de redactar el contrato. En caso de ambigüedad, estas reglas prevalecen hasta que ambos textos se consoliden tras la implementación.

---

## A1. `levelView` temporal: el único rebuild permitido y el orden obligatorio

`View3D.setLevelContext(ctx, view)` llama a `sync()` cuando cambia `levelView`; por tanto, pasar temporalmente de `active/current` a `all` puede reconstruir la jerarquía 3D una vez.

Esto **sí está permitido en preflight/Begin**, pero nunca por frame.

Orden obligatorio para `axon-open` y `exploded-levels-open`:

```text
1. guardar levelView previo
2. si hace falta, cambiar temporalmente a all
3. dejar que sync/buildLevels termine
4. sólo DESPUÉS resolver PresentationLevelHandle y guardar transforms base
5. ejecutar Story sin rebuilds por frame
6. al terminar, restaurar transforms/visibilidades de la jerarquía vigente
7. restaurar levelView previo
8. si restaurar levelView provoca sync, no reutilizar handles anteriores después de ese sync
9. limpiar runtime handles
```

Prohibido:

- resolver handles antes de un `sync()` que vaya a reemplazar sus objetos;
- conservar referencias Three obsoletas tras reconstruir niveles;
- alternar `active/all` durante `presentationStoryApply`;
- reconstruir niveles por cada cambio de `p`.

El rebuild único de entrada/salida es infraestructura existente, no una mutación del proyecto ni una excepción al requisito de runtime barato por frame.

---

## A2. Cubierta, volúmenes exteriores, labels y minimapa

La auditoría del renderer confirma que `roofG` y `exteriorG` son grupos globales derivados, separados de los grupos de nivel. Además, la política actual de Presentation ya controla su visibilidad mediante `syncRoofVisibility()`.

Reglas FT3D-5 V1:

### Cubierta y exterior derivados

- **NO** forman parte de `PresentationLevelHandle`.
- **NO** se desplazan con una planta.
- FT3D-5 no crea, duplica ni reparenta cubiertas o volúmenes exteriores.
- Durante `axon-open` / `exploded-levels-open` se conserva la política actual de Presentation: si el flujo vigente los oculta, permanecen ocultos.
- Si una variante territorial existente los hace visibles, FT3D-5 debe guardar/restaurar su visibilidad exacta y nunca tratarlos como parte de una planta sin una autoridad explícita.
- El toggle `Exterior`/roof del usuario se restaura exactamente; FT3D-5 no cambia su persistencia ni su significado.

### Labels

Presentation ya oculta labels durante su lifecycle. FT3D-5:

- no introduce labels 3D nuevos;
- no desplaza `labelG` como si perteneciera a una planta;
- mantiene el comportamiento actual y restaura el estado mediante el lifecycle existente.

### Minimapa

FT3D-5 no añade marcas nuevas al minimapa en V1.

- no hay icono “axon”;
- no hay líneas de separación;
- no se representa el gap visual como dato de plano;
- el minimapa existente continúa con su semántica actual.

Esto evita presentar el despiece visual como geometría real del proyecto.

---

## A3. Assets autorizados y mobiliario asíncrono

Los modelos autorizados cargados por `AssetLoader` se insertan como hijos del grupo de mobiliario existente. Para el nivel activo, el ownership sigue siendo `furnG`; para niveles secundarios, el ownership es el grupo de mobiliario que ya pertenece al `THREE.Group` de esa planta.

Reglas:

- mover el **grupo padre** mueve también cualquier asset ya cargado;
- FT3D-5 no espera a que termine una descarga para empezar una scene;
- FT3D-5 no dispara `refreshAssets`, `buildFurn` ni nuevas peticiones de red;
- una carga que termine durante la scene debe heredar el transform de su padre actual, no recibir un delta especial propio;
- no aplicar transform dos veces a un asset hijo;
- no mutar `assetRef`, dimensiones, posición local ni rotación local del mueble;
- al restaurar el padre, el asset vuelve con él sin tratamiento especial.

QA adicional obligatoria cuando haya fixture disponible:

1. asset autorizado ya cargado antes de exploded → acompaña a su planta;
2. asset que finaliza carga durante la scene → aparece en la posición transformada del padre, sin salto global;
3. fin/cancelación → posición del padre y del asset restauradas;
4. FT3D-5 no añade requests de asset por sí mismo.

---

## A4. Nivel activo: grupos temporales que NO deben desplazarse accidentalmente

El nivel activo no está encapsulado en un grupo único. El handle debe incluir únicamente objetos cuya posición sea realmente parte de la planta construida.

Incluidos, cuando existan y pertenezcan al nivel activo:

- `archFloor`;
- `archUp`;
- `furnG`;
- `lampG`;
- losa activa ya existente aunque viva dentro de `levelsG`;
- otros grupos geométricos de nivel que la implementación demuestre equivalentes mediante inspección del renderer.

No incluir automáticamente:

- `ground`;
- `territoryRenderer.group`;
- `roofG`;
- `exteriorG`;
- `labelG`;
- grupos de UI/debug;
- `revealG`;
- outlines temporales de rooms;
- escaleras/conectores.

Si un grupo temporal de Presentation (`revealG`, outline, contacto u otro) pudiera estar activo al comenzar FT3D-5, la implementación debe **limpiarlo por el lifecycle existente o guardar/restaurar su estado**, pero nunca desplazarlo ciegamente como geometría de planta.

Las escaleras mantienen la política del contrato principal: compact = estado actual; exploded hold = ocultas; restauración exacta.

---

## A5. Gap visual: decisión V1 y condición de validación

Se mantiene la fórmula del contrato principal:

```text
gapMm = clamp(round(nominalStoreyMm * 0.45), 800, 1600)
```

La fórmula se congela para obtener determinismo; **no es una cota arquitectónica**.

La cámara debe adaptarse al `explodedEnvelope`, no reducir el gap dinámicamente para “hacerlo caber”.

Si la QA visual representativa demuestra que esta separación produce lectura sistemáticamente mala —plantas indistinguibles o separación desproporcionada—, eso se considera una **revisión del contrato antes de integrar**, no una heurística libre dentro del renderer.

Claude no queda autorizado a cambiar 0.45, 800 o 1600 por preferencia visual sin documentar la desviación en el handoff.

---

## A6. Criterios DONE añadidos

Además del contrato principal, FT3D-5 no está DONE hasta demostrar:

- handles resueltos después del posible rebuild `current → all`;
- ninguna referencia Three obsoleta reutilizada tras restaurar `levelView`;
- roof/exterior globales no se desplazan como plantas;
- minimapa no expone el gap como geometría real;
- assets autorizados acompañan al grupo padre sin transform doble;
- grupos temporales/UI no reciben deltas de planta por accidente;
- cero rebuild por frame;
- cero request de red iniciado por FT3D-5.

**ESTADO: ADENDA DE OWNERSHIP FT3D-5 CERRADA — VINCULANTE PARA LA IMPLEMENTACIÓN**
