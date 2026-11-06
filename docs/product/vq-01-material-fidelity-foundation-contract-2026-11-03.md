# VQ-01 — Material Fidelity Foundation — contrato canónico de implementación V1

**Fecha:** 2026-11-03.  
**Repositorio:** `Juanmaes83/floorplan-3d`.  
**Baseline funcional obligatorio:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.  
**Branch de implementación:** `feat/vq-01-material-fidelity-foundation`.  
**Worktree autorizado:** `C:\Users\temp123\floorplan-3d-vq-01`.  
**Writer de implementación:** Codex, un único writer.  
**Supervisión/arquitectura:** ChatGPT.  
**Gate visual/producto:** Juanma.  
**Hybrid congelado:** `feat/hybrid-registered-elevation-v1@07ae6f9969cae9df746443e97410e40cee2e932a`.  
**Estado:** **CANONICAL IMPLEMENTATION CONTRACT V1 — READY_FOR_CP1 — MERGE NOT AUTHORIZED**.

> Este contrato autoriza exclusivamente el primer vertical slice CP1 definido aquí. No autoriza merge, CP2, ampliación de cantera, cambios en Hybrid ni expansión automática de arquitectura/materiales fuera del alcance explícito.

---

## 1. Propósito y pregunta de producto

VQ-01 existe para responder una pregunta de producto, no una pregunta de cantera:

> **¿Puede Rubik, usando sus propias autoridades y mecanismos ya probados, verse claramente mejor como vivienda real sin cambiar cámara, geometría, iluminación, environment ni composición?**

El primer slice debe demostrar una mejora visual atribuible principalmente a **materialidad, escala física y respuesta de material**.

No se busca transplantar tres aplicaciones donor completas. Las piedras aportan evidencia y mecanismos; Rubik conserva una sola autoridad.

Principios obligatorios:

> **Rubik commands. Donor informs.**

> **Más contexto, no más falsa certeza.**

> **Capability proven ≠ transplant mandatory.**

> **Automated green ≠ visual acceptance.**

> **Si B no mejora claramente A, se detiene y se diagnostica antes de añadir complejidad o abrir cantera.**

---

## 2. Jerarquía y autoridad

Para VQ-01 CP1, la precedencia es:

```text
master@0f9c6ead... / producto integrado
        ↓
Project / Surface / Render / Presentation authorities existentes
        ↓
docs/product/post-audit-operating-authority-2026-11-02.md
        ↓
ESTE CONTRATO VQ-01 V1
        ↓
feat/vq-01-material-fidelity-foundation checkpoints
        ↓
QA automatizado + A/B humano
```

Este contrato:

- convierte CP0 + CP0.1 en decisiones ejecutables para el primer slice;
- sustituye, para VQ-01, la lectura operativa antigua `BLOCKED_AFTER_CP0` una vez publicado este contrato;
- no reescribe ni invalida la historia del handoff CP0;
- no convierte evidencia donor en autoridad de producto;
- no cambia la autoridad global de `master` para producto ya integrado;
- no convierte la branch VQ en permiso de merge.

Fuentes de decisión:

- `docs/ops/handoffs/vq-01-material-fidelity-foundation-cp0-2026-11-03.md`;
- handoff CP0.1 / READY_FOR_CP1 publicado junto a este contrato;
- `docs/product/post-audit-operating-authority-2026-11-02.md`;
- código real de `master@0f9c6ead...`, en particular `js/surface-catalog.js`, `js/surface-renderer.mjs` y sus bindings existentes;
- tres piedras probadas CL/CS/LT con las identidades fijadas en §3.

---

## 3. Piedras autorizadas y papel exacto

No se abre otra cantera para CP1.

| Piedra | Donor fijado | Estado | Aporta a CP1 | No aporta a CP1 |
|---|---|---|---|---|
| `CL-STONE-01` | `Juanmaes83/casa-larga@dee30681d465664a0aa714499cca7a15611f6eac` | `CAPABILITY_PROVEN` | patrones `MeshStandardMaterial`/`MeshPhysicalMaterial`, respuesta física, roughness/normal, escala material y referencias de vidrio | experiencia donor, cámara, dossier, full post, full sky, registered reveal, `onBeforeCompile` donor |
| `CS-STONE-01` | `Juanmaes83/casa-serra@b47b775fae642439e8d42d6201ab5d1677d67f99` | `CAPABILITY_PROVEN` | semántica PBR probada `diff + normal + ARM`; `ARM.R=AO`, `ARM.G=roughness`, `ARM.B=UNKNOWN`; contraste/oracle de material | nuevos bytes donor no autorizados, experience donor, metalness inferida de B, reveal donor |
| `LT-STONE-01` | `Juanmaes83/lintel-flat-2d@c6029d9bb0647483709a502daedc24c1dd7bc029` | `CAPABILITY_PROVEN` | escala física/`uvMetres`, coordenadas y matemática transferible traducida a autoridad Rubik | shaders procedurales timber/plaster/concrete, room/drawable/RU, reveal, environment y cadenas `onBeforeCompile` |

Regla: una piedra puede seguir siendo valiosa aunque su código no entre en CP1. `CAPABILITY_PROVEN` demuestra que el mecanismo existe; no obliga a transplantarlo.

---

## 4. Autoridad material Rubik para CP1

La ruta autorizada es:

```text
FloorPlanProject
      ↓
FloorPlanSurfaces / SurfaceCatalog
      ↓
SurfaceRenderer
      ↓
inputs Rubik verificados + escala/orientación Rubik
      ↓
bindings existentes de meshes
      ↓
geometría + luces + environment existentes
      ↓
pixels
```

Decisiones obligatorias:

1. `FloorPlanProject` sigue siendo autoridad de asignaciones; **no hay schema nuevo**.
2. Los IDs de superficies existentes siguen siendo autoridad; **no hay namespace/material system donor paralelo**.
3. `SurfaceRenderer` es owner/disposer de cualquier **nuevo recurso VQ asociado a superficies** que CP1 necesite.
4. Verificación de path/bytes/SHA/dimensiones antes de publicar textura GPU se mantiene obligatoria.
5. La escala se expresa en el contrato físico Rubik existente (`repeatMm`; mundo 3D mapeado a metros) y cualquier matemática Lintel se traduce a esa autoridad, no se importa como autoridad paralela.
6. Los caches legacy (`floorMats`, `matCache`) no se refactorizan globalmente en CP1.
7. `glassMat` y los materiales metal/frame existentes pueden recibir **ajustes acotados de parámetros sobre sus rutas Rubik actuales** para el A/B. Esa excepción no crea un tercer sistema ni autoriza migrar todos los materiales legacy.
8. No se introduce `onBeforeCompile` en CP1.

---

## 5. Primer transplant CP1 — alcance exacto

CP1 es un vertical slice visual pequeño. Debe hacer visibles las cuatro familias siguientes en el mismo fixture A/B.

### 5.1 STONE / MARBLE — obligatorio

**Superficie objetivo principal:** `surface-marble-01` ya integrada en Rubik.

Autorizado:

- reutilizar sus bytes locales ya integrados y verificados;
- calibrar escala/repetición física con evidencia explícita y valores trazables;
- ajustar parámetros Standard/Physical necesarios para que roughness y normal existentes respondan de forma físicamente más legible;
- introducir metadata/parametrización Rubik mínima si es imprescindible para expresar esos parámetros de forma determinista y testeable, sin cambiar Project JSON.

No autorizado:

- copiar nuevos JPEG/ARM/normal de Casa Serra;
- AO binding;
- usar `ARM.B` como metalness;
- shader donor o `onBeforeCompile`;
- cambiar iluminación/environment para favorecer el resultado.

### 5.2 TIMBER / WOOD — obligatorio

**Superficie objetivo principal:** `surface-oak-wood-planks` ya integrada en Rubik.

Autorizado:

- reutilizar sus bytes locales ya integrados;
- corregir/calibrar escala y repetición dentro de la autoridad Rubik;
- ajustar respuesta de roughness/normal ya disponible de forma bounded y determinista;
- aplicar patrones físicos de CL únicamente como comportamiento Rubik.

No autorizado:

- shader procedural timber de Lintel;
- asumir para oak la convención normal demostrada sólo para marble;
- nuevos bytes Casa Serra;
- modificar geometría para ocultar problemas de material.

### 5.3 PLASTER / CONCRETE — obligatorio

**Candidatos Rubik del fixture:** `surface-white-plaster-02` para yeso y `surface-brushed-concrete` para hormigón, salvo que el fixture CP0.1 ya haya fijado otro ID existente; cualquier sustitución debe quedar declarada en el fixture antes de generar B y debe existir también en A.

Autorizado:

- utilizar assets baseColor Rubik ya integrados;
- aplicar escala física y parámetros Standard/Physical Rubik de forma acotada;
- diferenciar materialmente yeso y hormigón mediante roughness/respuesta física sin inventar canales de textura ausentes;
- usar matemática de escala/coordenadas derivada de LT únicamente después de traducirla a `repeatMm`/autoridad Rubik.

No autorizado:

- shaders procedurales Lintel;
- normals/roughness donor nuevos;
- displacement/parallax no existente;
- representar detalle que los datos/materiales no contienen.

### 5.4 GLASS / METAL — obligatorio

**Ruta:** materiales Rubik existentes de vidrio y metal/frame, sin nueva autoridad de catálogo en CP1.

Autorizado:

- ajustar de forma acotada parámetros físicos ya soportados por Three/Rubik —por ejemplo roughness, metalness donde semánticamente corresponda, transmission/opacity/IOR/thickness sólo si la ruta existente realmente los soporta—;
- conservar el lifecycle y sharing existentes;
- registrar los parámetros A/B para que el resultado sea reproducible.

No autorizado:

- nuevo renderer de vidrio/metal;
- nuevo sistema de environment/reflections;
- postprocesado para simular calidad;
- shader hooks donor;
- convertir `ARM.B` de Casa Serra en metalness.

### 5.5 Fuera del primer slice

Textil queda **fuera de CP1**. Puede evaluarse después del primer A/B si existe un gap concreto.

---

## 6. Decisiones CP0.1 aceptadas como autoridad CP1

Las siguientes conclusiones quedan **ACEPTADAS** y son obligatorias para CP1:

1. **No new CS asset copy.** Los nuevos bytes Casa Serra permanecen deferred mientras el publisher→donor byte/transformation chain no esté demostrado y no exista autorización específica.
2. **Normal convention = asset-specific.** La evidencia de marble no se generaliza a oak ni a otras familias.
3. El pipeline `createImageBitmap(..., {imageOrientation:'flipY'})` + `THREE.Texture(ImageBitmap)` debe tratarse según el comportamiento real probado de ImageBitmap/Three; no se añade un segundo flip por intuición.
4. `ARM.R` se reconoce semánticamente como AO pero queda **UNBOUND en CP1**.
5. `ARM.G` sólo representa roughness donde la cadena concreta esté probada.
6. `ARM.B` sigue **UNKNOWN** y **MUST NOT** convertirse en metalness.
7. `SurfaceRenderer` es el owner/disposer de nuevos recursos VQ de superficies.
8. El split legacy de caches existe pero es `SAFE_BOUNDED` para el primer slice; no exige refactor total pre-A/B.
9. Playwright/browser QA se restaura mediante tooling externo; no se añade package/lock sólo para resolver CP0.1.
10. Lintel procedural y registered reveal quedan deferred y no bloquean CP1.
11. Three.js permanece en el runtime aprobado actual; no hay modernización en este workstream.
12. Hybrid permanece congelado/read-only y no es dependencia de CP1.

---

## 7. Propuestas CP0.1 que NO se canonizan todavía

CP0.1 produjo opciones útiles, pero este contrato **no** las convierte automáticamente en arquitectura Rubik.

Quedan como **TECHNICAL OPTIONS / FUTURE REVIEW**, no autorizadas en CP1 salvo una revisión explícita del contrato:

- taxonomía global `BASE / PBR1K / HIGH / DELIVERY`;
- eliminación general de la regla histórica 512 px / 512 KiB;
- autorización general de 1K/2K o `HIGH`/`DELIVERY`;
- KTX2;
- migración completa del schema de provenance del catálogo;
- framework general de canales opcionales independientes;
- AO binding;
- metalness derivada de canales donor;
- cambio general del control UI de detalle para depender de cualquier canal enhanced;
- refactor completo de `SurfaceRenderer`/`floorMats`/`matCache`;
- adopción de nuevos assets Casa Serra por inferencia de similitud con publisher;
- cualquier nuevo hook `onBeforeCompile`.

### 7.1 Regla de mínima modificación

CP1 puede hacer **sólo la extensión mínima de catalog/renderer necesaria para expresar de forma Rubik los parámetros del slice**. Si para obtener el A/B Codex concluye que necesita una de las opciones generales anteriores, debe detenerse y elevar `CONTRACT_DELTA_REQUIRED`; no debe convertirla silenciosamente en arquitectura.

La política PBR histórica puede resultar insuficiente para VQ-01 completo, pero **no hace falta resolver toda la política global antes de demostrar el primer A/B**.

---

## 8. Fixture A/B canónico

### 8.1 Identidad A

`A` es el producto exacto:

`master@0f9c6ead9732901681498efec326d1ca92e42ffe`

sin cherry-picks de Hybrid, sin Three upgrade y sin cambios VQ.

### 8.2 Identidad B

`B` es:

`A + únicamente los cambios CP1 autorizados por este contrato`

en `feat/vq-01-material-fidelity-foundation`.

### 8.3 Fixture preexistente de CP0.1

CP0.1 produjo un baseline externo reproducible con:

- Project JSON SHA-256: `9e0cf855bbc37576351f40aa109aebe253d4cb92ec620510b33975fdf61d0946`;
- viewport: `1440 × 900`;
- DPR: `1`;
- canvas 3D observado: `884 × 498`;
- misma cámara/posición/FOV entre runs;
- mismos valores de luz/environment/stage entre runs;
- mismas asignaciones pilot;
- dos runs con identidad de Project reproducida;
- baseline browser sin errores de página/consola reportados.

Los valores numéricos completos de cámara/luz/stage/timing quedaron en el manifest local de CP0.1 y **no se inventan en este contrato**.

### 8.4 Durabilización obligatoria antes de mutar B

La **primera acción de CP1** será promover el fixture reproducible a una representación trackeada en la branch VQ (fixture/manifest/test equivalente) **antes del primer cambio visual de materiales**.

Ese registro debe fijar como mínimo:

- baseline A SHA exacto;
- Project fixture y su SHA-256;
- material assignments exactas;
- cámara position/target/FOV o equivalente real;
- presentation state/stop exacto;
- stage/canvas size;
- viewport `1440×900` y DPR `1`;
- luz/intensidades/direcciones relevantes;
- environment/look existente;
- calidad de material (`base/enhanced`) usada;
- capture timing/readiness condition;
- IDs de superficies y `repeatMm`;
- métricas de material/renderer disponibles;
- forma de registrar page/console/WebGL/shader errors.

Antes de implementar el cambio visual, Codex debe ejecutar ese fixture contra A y demostrar que reproduce el baseline. Si no puede, CP1 se marca `BLOCKED_FIXTURE_DRIFT` y no se ajustan materiales a ojo sobre un baseline distinto.

### 8.5 Invariantes A/B

Entre A y B permanecen iguales:

- Project/house fixture;
- geometría;
- cámara/FOV;
- presentation stop/state;
- lighting;
- environment;
- viewport y DPR;
- capture timing/readiness;
- material assignments nominales de las superficies comparadas.

Lo que puede cambiar en B es exclusivamente la implementación/parametrización material autorizada por CP1.

El fixture no puede modificarse después para favorecer B. Cualquier cambio posterior requiere registrar razón y volver a producir A con el mismo fixture revisado antes de comparar.

---

## 9. QA técnico obligatorio antes del gate humano

B no llega a revisión visual hasta cumplir:

1. tests unitarios de surfaces/catalog/renderer afectados: PASS;
2. browser material-detail/surface paths relevantes: PASS;
3. no nuevos page errors, console errors, WebGL errors o shader errors;
4. no Project schema mutation;
5. no dependencia runtime donor;
6. no Hybrid diff/dependency;
7. no crecimiento de recursos no acotado tras apply/change/restore/context-loss paths cubiertos;
8. fallback de assets verificados conserva comportamiento seguro;
9. A/B fixture reproducible con SHAs y parámetros registrados;
10. cambios limitados al contrato CP1.

Una regresión de lifecycle/GPU, persistencia, schema o autoridad invalida B aunque la captura parezca mejor.

---

## 10. Gate visual humano

El gate lo emite Juanma viendo **A y B bajo el mismo fixture**, preferiblemente lado a lado y sin necesidad de conocer qué donor originó cada mecanismo.

### 10.1 Pregunta primaria

> **¿B se percibe claramente como una vivienda/materialidad mejor que A, de forma suficientemente evidente para justificar seguir construyendo VQ-01?**

Veredictos permitidos:

- `PASS`
- `FAIL`
- `INCONCLUSIVE`

### 10.2 Criterios por familia

Para `PASS` global se exige:

- **STONE / MARBLE: PASS** — escala creíble, veta/material legible, roughness/relieve coherente; no aspecto de color plano/plástico ni tiling dominante.
- **TIMBER / WOOD: PASS** — se lee como madera a escala arquitectónica, con respuesta material diferenciada; sin escala/grano obviamente incorrectos.
- **PLASTER / CONCRETE: al menos uno PASS y el otro NO_REGRESSION** — debe existir diferenciación física legible sin fingir detalle ausente.
- **GLASS / METAL: al menos NO_REGRESSION** y, para justificar expansión específica de esa familia, `PASS` visible.
- **OVERALL HOUSING MATERIALITY: PASS** — el conjunto debe verse claramente mejor, no sólo una muestra aislada.

Por tanto, no basta con que mármol mejore mientras el resto empeora.

### 10.3 Auto-fail visual/técnico

Cualquiera de estos invalida el candidato:

- escala física manifiestamente incorrecta;
- estiramiento/tiling/repetición distractora nueva;
- normal invertida o relieve visual incoherente;
- plasticidad/sobrebrillo severo no justificado;
- `ARM.B` usado como metalness;
- vidrio con artifacts graves de opacity/sorting;
- seams/flicker/shimmer/noise nuevos relevantes;
- cambio de cámara/luz/environment/composición para hacer B parecer mejor;
- error WebGL/shader/console nuevo;
- leak/regresión lifecycle relevante;
- sistema material paralelo o schema de Project nuevo;
- regresión clara de legibilidad/estabilidad respecto de A.

### 10.4 Resultado

- `PASS` → se autoriza **revisión de expansión VQ-01**, no expansión automática ni merge.
- `FAIL` → detener, diagnosticar causalidad y corregir dentro del alcance sólo si la evidencia lo justifica.
- `INCONCLUSIVE` → tratar como NO PASS; no añadir donors ni complejidad hasta entender por qué la comparación no decide.

Ningún `FAIL/INCONCLUSIVE` abre cantera automáticamente. Sólo un gap concreto puede originar una misión de gap-fill separada y explícitamente autorizada.

---

## 11. Fuera de scope / congelado durante CP1

Queda explícitamente congelado:

- `feat/hybrid-registered-elevation-v1@07ae6f9969cae9df746443e97410e40cee2e932a`;
- registered reveal / RU;
- Lintel procedural shaders;
- donor Story/camera/dossier/experience;
- cámara/composición responsive — VQ-05;
- luz/sombra/environment replacement — VQ-02;
- detalle arquitectónico/geometry/bevel — VQ-03;
- final post/shading pipeline — VQ-04;
- Three.js r160→r185 o cualquier modernization;
- nueva cantera masiva;
- nuevos assets CS no probados/autorizados;
- AO binding;
- KTX2;
- textil;
- merge de Hybrid o VQ-01.

---

## 12. Concurrencia y writer lease

Durante CP1:

- Codex es el único writer de `feat/vq-01-material-fidelity-foundation` / `C:\Users\temp123\floorplan-3d-vq-01`;
- ChatGPT puede revisar repo/evidencia y modificar únicamente la rama documental correspondiente salvo nueva coordinación;
- Claude/otros agentes no escriben VQ ni Hybrid;
- Hybrid y stones se consultan read-only;
- cualquier provenance reconciliation adicional vive en misión separada y no modifica silently el producto.

Antes de la primera escritura CP1 Codex debe verificar:

```text
pwd == C:\Users\temp123\floorplan-3d-vq-01
branch == feat/vq-01-material-fidelity-foundation
HEAD == 0f9c6ead9732901681498efec326d1ca92e42ffe
origin branch == 0f9c6ead9732901681498efec326d1ca92e42ffe
git status == clean
```

Si alguno difiere, detenerse y reconciliar antes de escribir.

---

## 13. Checkpoints CP1

CP1 debe ser recuperable y revisable. Secuencia mínima:

```text
CP1-A  durable A/B fixture + baseline reproduction
  ↓
CP1-B  bounded material implementation
  ↓
CP1-C  automated QA + candidate B captures/manifests
  ↓
READY_FOR_HUMAN_AB
  ↓
Juanma PASS / FAIL / INCONCLUSIVE
```

Cada checkpoint remoto registra SHA, tests, cambios, pendientes y si existe evidencia local no compartida.

No es necesario meter artifacts pesados en Git si no corresponde, pero la evidencia decisiva debe tener identidad/hash y una ubicación compartible/durable antes de integración final.

---

## 14. Autorización explícita

Con CP0.1 cerrado y este contrato publicado:

> **READY_FOR_CP1**

Codex queda autorizado a iniciar **únicamente CP1-A y, si CP1-A reproduce A sin drift, CP1-B/CP1-C dentro de este contrato**.

Esta autorización no equivale a:

- `READY_FOR_MERGE`;
- aprobación visual;
- permiso para tocar Hybrid;
- permiso para abrir otra cantera;
- permiso para ampliar la policy PBR global;
- permiso para modernizar Three;
- permiso para iniciar CP2.

El siguiente gate de producto es **READY_FOR_HUMAN_AB**, seguido del veredicto de Juanma.

---

## 15. Regla de salida

VQ-01 CP1 es exitoso sólo si produce evidencia causal útil:

```text
A = Rubik actual
B = mismo Rubik + bounded VQ-01 material slice

si B claramente > A
    → expandir sólo con autorización explícita
si B <= A o es inconcluso
    → diagnosticar antes de acumular mecanismos
```

El objetivo no es demostrar que las piedras eran interesantes. El objetivo es demostrar que **Rubik se ha vuelto visualmente mejor sin dejar de ser Rubik**.
