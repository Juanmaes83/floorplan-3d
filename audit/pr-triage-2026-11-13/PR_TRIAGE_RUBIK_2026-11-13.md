# Triaje de las 67 PR abiertas de RUBIK SOTA (13/11/2026)

**Base auditada:** `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`, que ya contiene #213, #214 y #218. Las 67 PR abiertas se leyeron por su `HEAD` real (`refs/pull/N/head`) el 13/11/2026.
**Alcance:** auditoría de **solo lectura**.
- No se ha cerrado, fusionado ni comentado ninguna PR.
- No se ha tocado ninguna rama, y `master` no cambia.
- Las ramas en curso #215, #219 y #220 no se han modificado.

**Ficheros** (copia persistente en la rama `claude/bold-allen-ug56ci`, carpeta `audit/pr-triage-2026-11-13/`):
- `PR_TRIAGE_RUBIK_2026-11-13.csv`: una fila por PR, con métricas, evidencia, acción, riesgos y comentario de cierre.
- Este documento.
- Los scripts reproducibles, en §9.

## Estado de ejecución (última comprobación: 2026-11-13T14:55:34Z, `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`)

### L1 · Ejecutado: #212 y #216 cerradas sin fusionar

| PR | HEAD | ¿Ancestro de master? | Estado verificado | Comentario de cierre | Rama |
|---|---|---|---|---|---|
| [#216](https://github.com/Juanmaes83/floorplan-3d/pull/216) | [`8e2a13fe6fec`](https://github.com/Juanmaes83/floorplan-3d/commit/8e2a13fe6fece79a5e9d1b0e92babf2627a54fc2) | Sí (`merge-base --is-ancestor`) | `closed`, `merged: false`, 2026-11-13T14:49:40Z | [comentario](https://github.com/Juanmaes83/floorplan-3d/pull/216#issuecomment-6856406796) | `lab/ux07-variants-adapter-20261113` conservada en [`8e2a13fe6fec`](https://github.com/Juanmaes83/floorplan-3d/commit/8e2a13fe6fece79a5e9d1b0e92babf2627a54fc2) |
| [#212](https://github.com/Juanmaes83/floorplan-3d/pull/212) | [`fe300727035d`](https://github.com/Juanmaes83/floorplan-3d/commit/fe300727035d2d13cad8da24b0e265e0c41d2eaf) | Sí (`merge-base --is-ancestor`) | `closed`, `merged: false`, 2026-11-13T14:49:52Z | [comentario](https://github.com/Juanmaes83/floorplan-3d/pull/212#issuecomment-6856409658) | `lab/ux07-ent04-budget-coherence-20261112` conservada en [`fe300727035d`](https://github.com/Juanmaes83/floorplan-3d/commit/fe300727035d2d13cad8da24b0e265e0c41d2eaf) |

**Comprobaciones previas:**
1. #218 está `merged` (2026-11-13T10:54:38Z, HEAD `2afe74552b7a`).
2. Los HEAD de #212 y #216 son los mismos del triaje y ambos son ancestros de `master@f5c08c7efc0a`.
3. Dependencias de pila: Única PR con base en esas ramas: #216 (base lab/ux07-ent04-budget-coherence-20261112), cerrada primero. Ninguna PR abierta tiene base en lab/ux07-variants-adapter-20261113. Se cerró primero #216 y después #212. No se ha borrado ninguna rama.

**Después del cierre:**
- `master` antes: `f5c08c7efc0aabb0204246da311504fe3b778ee8`; después: `f5c08c7efc0aabb0204246da311504fe3b778ee8`. Sin cambios.
- No se ha hecho ningún *merge* ni ningún despliegue por esta operación.
- PR abiertas: 67 → **65**.

**Cambio externo detectado:** #219 (Claude B) tiene un HEAD nuevo, `a9d953fadee58ebd4a6e972a412a609553edaad3`; en el triaje era `b942a6d`. #210 y #211 siguen siendo ancestros de ese HEAD. No se ha tocado. Ninguna otra PR ha cambiado.

### Recomprobación final (2026-11-13T16:44Z): `master` ha avanzado a `10e025b5922b`

- **Causa:** Merge de #219 (OBR-02/03) en master el 2026-11-13T14:57:59Z; no es una acción de esta operación.
- **#210 y #211:** GitHub las marca `merged` (2026-11-13T14:58:01Z y 2026-11-13T14:58:02Z), porque sus HEAD están contenidos en #219. Es lo que preveía el lote L4.
- **Nueva:** #221, [DRAFT] integración controlada de #220 sobre master@10e025b (otra sesión); no tocada.
- **PR abiertas ahora: 63.**
- **L1:** Los HEAD de #212 y #216 siguen siendo ancestros de 10e025b; las dos siguen cerradas sin fusionar y sus ramas no han cambiado.
- **L2 y L3:** Ningún archivo del delta propio de las 38 PR de L2 y L3 cambia entre f5c08c7 y 10e025b (solape vacío). Todos los sucesores (L2), f3d7678 (L3) y #218 son ancestros de 10e025b. Las pruebas de L3 se ejecutaron sobre f5c08c7 y ninguna de esas suites ni de sus archivos cambia en 10e025b.

### L2 · Preparado, NO ejecutado (18 PR, pila #133–#151)

Método: el delta propio de cada PR frente a la PR de debajo en su pila se compara con su commit sucesor en master (`l2.py`, que también escribe `l2.tsv` y `l2-detail.txt`). Todos los sucesores son ancestros de `master@f5c08c7efc0a`.

| PR | HEAD (PR) | Sucesor en master | Equivalencia acreditada | Commits posteriores en master sobre esos archivos | Riesgo | Decisión |
|---|---|---|---|---|---|---|
| [#151](https://github.com/Juanmaes83/floorplan-3d/pull/151) | [`964026362ec9`](https://github.com/Juanmaes83/floorplan-3d/commit/964026362ec939982f69081dc2dfbb522230ba3f) | [`579189df3951`](https://github.com/Juanmaes83/floorplan-3d/commit/579189df39513aca44e0a86b44ef4392f38173d2) | `git patch-id --stable` idéntico: `e060547fac01bf321d0eb01a925f9b0efbd43d3d`, delta propio `ac83460a1de8..964026362ec9` frente a `579189df3951^..579189df3951` | 58 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#150](https://github.com/Juanmaes83/floorplan-3d/pull/150) | [`ac83460a1de8`](https://github.com/Juanmaes83/floorplan-3d/commit/ac83460a1de8ba78eddf8127f229dca26b6ea9ac) | [`b44d40d9309d`](https://github.com/Juanmaes83/floorplan-3d/commit/b44d40d9309df3b483e59d8416f86fae666be8e7) + [`9a21b2587139`](https://github.com/Juanmaes83/floorplan-3d/commit/9a21b2587139e4ef3ea377f7b71cca0bd541147e) | Contenido en dos commits consecutivos de master, `b44d40d9309d` y `9a21b2587139`. 6 de sus 8 archivos tienen blob idéntico en `9a21b2587139`. En `index.html` y `.github/workflows/integration-browser.yml`, las líneas `+` y `−` son idénticas; solo cambia el contexto. Las 676 líneas añadidas están todas en el sucesor y no hay ninguna de más. | 58 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#149](https://github.com/Juanmaes83/floorplan-3d/pull/149) | [`f398f82f9e0f`](https://github.com/Juanmaes83/floorplan-3d/commit/f398f82f9e0f2dd3dfd38d0171c8ec96ae93573c) | [`de75f3019a4b`](https://github.com/Juanmaes83/floorplan-3d/commit/de75f3019a4becfeeb8cb01e2d0118d79e8ba615) | `git patch-id --stable` idéntico: `c72ef2bb191aa1772f881715a880d509ec6f6b2e`, delta propio `27629a51b30c..f398f82f9e0f` frente a `de75f3019a4b^..de75f3019a4b` | 53 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#148](https://github.com/Juanmaes83/floorplan-3d/pull/148) | [`27629a51b30c`](https://github.com/Juanmaes83/floorplan-3d/commit/27629a51b30cc71bdca4114be75b299ae2a9eaa6) | [`c317d9eca72f`](https://github.com/Juanmaes83/floorplan-3d/commit/c317d9eca72fde7ffa1825331b2f40ab526da616) | `git patch-id --stable` idéntico: `8b7153e42fc9a8742e645b1acaf77650b5ebd5b4`, delta propio `782b98530025..27629a51b30c` frente a `c317d9eca72f^..c317d9eca72f` | 54 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#147](https://github.com/Juanmaes83/floorplan-3d/pull/147) | [`782b98530025`](https://github.com/Juanmaes83/floorplan-3d/commit/782b98530025088200f8ed57b303fcc660806bdb) | [`902bc44232e7`](https://github.com/Juanmaes83/floorplan-3d/commit/902bc44232e7f957658d46dde2d1f4764bca54e4) | `git patch-id --stable` idéntico: `a9dedfcb11c22cca1f180a800660a3904b460594`, delta propio `d676ba3eeacf..782b98530025` frente a `902bc44232e7^..902bc44232e7` | 54 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#146](https://github.com/Juanmaes83/floorplan-3d/pull/146) | [`d676ba3eeacf`](https://github.com/Juanmaes83/floorplan-3d/commit/d676ba3eeacff527e8f4de07a463297e825d6b8d) | [`c86d4962a996`](https://github.com/Juanmaes83/floorplan-3d/commit/c86d4962a9966f6016260194b5408c7bd0aff4c8) | `git patch-id --stable` idéntico: `fdc6f9ecac49ecf8289f698155bed4c28179140c`, delta propio `799e647d6ca6..d676ba3eeacf` frente a `c86d4962a996^..c86d4962a996` | 9 | Bajo para cerrar. **MUY ALTO si se reabre y se fusiona o se recupera su código**: También toca `api/render.js` en una versión anterior a los límites D1 (`14419c2`, `7ac9b34`). | **APTA** |
| [#145](https://github.com/Juanmaes83/floorplan-3d/pull/145) | [`799e647d6ca6`](https://github.com/Juanmaes83/floorplan-3d/commit/799e647d6ca6beabec4a84b521f720951d2e0cb8) | [`3495c4637b07`](https://github.com/Juanmaes83/floorplan-3d/commit/3495c4637b07130a6f89263cf2ee2ff3d897f1de) | `git patch-id --stable` idéntico: `edfc8b23721bc4d4f4efa1fcecb96b494424b53f`, delta propio `dc2886c766df..799e647d6ca6` frente a `3495c4637b07^..3495c4637b07` | 56 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#143](https://github.com/Juanmaes83/floorplan-3d/pull/143) | [`dc2886c766df`](https://github.com/Juanmaes83/floorplan-3d/commit/dc2886c766df841197d27e249f70c8ca8fa5a513) | [`9cc460b7ba65`](https://github.com/Juanmaes83/floorplan-3d/commit/9cc460b7ba65e0af40ca358e0575ffee44c02e18) | `git patch-id --stable` idéntico: `ad045b45d58fad1cbcc0660524f11f797f0d4bdf`, delta propio `59419664bb0e..dc2886c766df` frente a `9cc460b7ba65^..9cc460b7ba65` | 57 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#142](https://github.com/Juanmaes83/floorplan-3d/pull/142) | [`59419664bb0e`](https://github.com/Juanmaes83/floorplan-3d/commit/59419664bb0e6e970c3592ad11d6a72716629926) | [`06abd54bdfdf`](https://github.com/Juanmaes83/floorplan-3d/commit/06abd54bdfdf355ba8fb7bb417a008d4d4c4ffa3) | `git patch-id --stable` idéntico: `a24544ce9208410f2598a047202150b5ff43e76a`, delta propio `7c42bacaec1b..59419664bb0e` frente a `06abd54bdfdf^..06abd54bdfdf` | 61 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#141](https://github.com/Juanmaes83/floorplan-3d/pull/141) | [`7c42bacaec1b`](https://github.com/Juanmaes83/floorplan-3d/commit/7c42bacaec1bc67bd912a8eee84a3ac736f8f2eb) | [`77fa7618828c`](https://github.com/Juanmaes83/floorplan-3d/commit/77fa7618828cd0c1ab03c15dfee9309634c610e6) | `git patch-id --stable` idéntico: `467d8182cd2d8baf9704084e9db99888f028332e`, delta propio `0788363725c0..7c42bacaec1b` frente a `77fa7618828c^..77fa7618828c` | 60 | Bajo para cerrar. **MUY ALTO si se reabre y se fusiona o se recupera su código**: Su `api/share.js` acepta el código del Render IA (`RUBIK_RENDER_TOKEN`) para publicar. Master exige `RUBIK_SHARE_TOKEN` desde GOV-08 S1 (#187, `2373977`), con la retirada S2 (#188) y el aislamiento del visor (#195) encima. | **APTA** |
| [#140](https://github.com/Juanmaes83/floorplan-3d/pull/140) | [`0788363725c0`](https://github.com/Juanmaes83/floorplan-3d/commit/0788363725c0a14621a4b65964edc5355f5df114) | [`96b44ee93359`](https://github.com/Juanmaes83/floorplan-3d/commit/96b44ee9335979cbbfbc3cec6c5d420a9c0894e5) | `git patch-id --stable` idéntico: `a49ad9e79adc7f824fa4ca197d6c5f195afb3f6f`, delta propio `ce2cbc7d1bbc..0788363725c0` frente a `96b44ee93359^..96b44ee93359` | 60 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#139](https://github.com/Juanmaes83/floorplan-3d/pull/139) | [`ce2cbc7d1bbc`](https://github.com/Juanmaes83/floorplan-3d/commit/ce2cbc7d1bbcb92acc4dd209cd251dc6ca8531d4) | [`5f899575d72d`](https://github.com/Juanmaes83/floorplan-3d/commit/5f899575d72da20129e06036c730888a6481abf3) | `git patch-id --stable` idéntico: `f3cf572017a644f3b6eaed0f9870c44de91b9dae`, delta propio `3da88dac1cc4..ce2cbc7d1bbc` frente a `5f899575d72d^..5f899575d72d` | 62 | Bajo para cerrar. **MUY ALTO si se reabre y se fusiona o se recupera su código**: Su versión de `api/render.js` no tiene los límites de acceso y gasto del Render IA (D1 PR-1 `14419c2`, D1 IMG-02 `7ac9b34`): en master el archivo tiene `RUBIK_RENDER_MAX_PER_HOUR/_PER_DAY`, uso y coste estimado; en la PR, no. | **APTA** |
| [#138](https://github.com/Juanmaes83/floorplan-3d/pull/138) | [`3da88dac1cc4`](https://github.com/Juanmaes83/floorplan-3d/commit/3da88dac1cc46cdaaf342ca07848fe87e0d57519) | [`f58546807719`](https://github.com/Juanmaes83/floorplan-3d/commit/f585468077191b2d0599abd8faac3b7ab60eaadc) | `git patch-id --stable` idéntico: `4c164432f9a4cc90bc27fc2575354c368784c877`, delta propio `51ab83fe70ac..3da88dac1cc4` frente a `f58546807719^..f58546807719` | 59 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#137](https://github.com/Juanmaes83/floorplan-3d/pull/137) | [`51ab83fe70ac`](https://github.com/Juanmaes83/floorplan-3d/commit/51ab83fe70ac0a54739f3a608b34605cf78aaef6) | [`2edfb98f9442`](https://github.com/Juanmaes83/floorplan-3d/commit/2edfb98f9442aae394ca778a0b16fd4b6c5fdf6b) | `git patch-id --stable` idéntico: `bf2ad09c4192c5a89473413d5f2b4ee738afae37`, delta propio `2a034f870cf2..51ab83fe70ac` frente a `2edfb98f9442^..2edfb98f9442` | 63 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#136](https://github.com/Juanmaes83/floorplan-3d/pull/136) | [`2a034f870cf2`](https://github.com/Juanmaes83/floorplan-3d/commit/2a034f870cf2563aae567d2decd0dfa926172cd0) | [`bf147e1e75c3`](https://github.com/Juanmaes83/floorplan-3d/commit/bf147e1e75c3e050ba1c5c76d3348531eccc770c) | `git patch-id --stable` idéntico: `18f2a3e7b9a0b79e9b64404d4cb780c8d48857cf`, delta propio `6c8aa88b92fd..2a034f870cf2` frente a `bf147e1e75c3^..bf147e1e75c3` | 64 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#135](https://github.com/Juanmaes83/floorplan-3d/pull/135) | [`6c8aa88b92fd`](https://github.com/Juanmaes83/floorplan-3d/commit/6c8aa88b92fdfa918ef00e7a267ec3dc9cf56934) | [`ba60b94eac98`](https://github.com/Juanmaes83/floorplan-3d/commit/ba60b94eac98416bb4ffac59ffb1012f30f61b57) | `git patch-id --stable` idéntico: `714326e6e415bd3640d5bb42597fd99d91f89466`, delta propio `b34b45d9b11c..6c8aa88b92fd` frente a `ba60b94eac98^..ba60b94eac98` | 66 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#134](https://github.com/Juanmaes83/floorplan-3d/pull/134) | [`b34b45d9b11c`](https://github.com/Juanmaes83/floorplan-3d/commit/b34b45d9b11c6a02e4d442f71f7de272000bcf34) | [`a88c72436bd7`](https://github.com/Juanmaes83/floorplan-3d/commit/a88c72436bd76385c882f18f122c4fa041d35f38) | Los 11 archivos del delta propio tienen **el mismo blob** en `b34b45d9b11c` y en `a88c72436bd7`. El patch-id difiere (`c19194bd3961` frente a `f3f4cc3cd1e1`) solo porque `docs/product/rubik-competitive-benchmark-roadmap-2026-10-29.md` no existía en la base de #133, pero sí en master antes de `a88c72436bd7` (lo añadió `7e5dd25`). | 67 | Bajo para cerrar: la rama se conserva. | **APTA** |
| [#133](https://github.com/Juanmaes83/floorplan-3d/pull/133) | [`164312a7208f`](https://github.com/Juanmaes83/floorplan-3d/commit/164312a7208ff1c3dd0504cefe9def10929dfce0) | [`64111795eb9c`](https://github.com/Juanmaes83/floorplan-3d/commit/64111795eb9cdec49fc65ff64e38e008b831cf27) | `git patch-id --stable` idéntico: `a3539920d7d743c18de77026c2f65ba60c4e77e9`, delta propio `414a07772495..164312a7208f` frente a `64111795eb9c^..64111795eb9c` | 64 | Bajo para cerrar: la rama se conserva. | **APTA** |

**Seguridad (#139, #141 y #146):** cerrarlas no reintroduce nada, pero **ninguna debe reabrirse, fusionarse ni servir para recuperar código**:
- **#141:** su `api/share.js` acepta `RUBIK_RENDER_TOKEN` para publicar. Master exige `RUBIK_SHARE_TOKEN` desde GOV-08 S1 (#187).
- **#139 y #146:** su `api/render.js` no tiene los límites de acceso y gasto D1 (`14419c2`, `7ac9b34`).

El aviso va en el comentario de cierre de cada una. **Ninguna PR de L2 se ha cerrado.**

**Orden propuesto, si se autoriza:** de la cima de cada pila hacia abajo, sin borrar ramas:
- #151 → #150;
- #149 → #148 → #147 → #146 → #145 → #143 → #142 → #141 → #140 → #139 → #138 → #137 → #136 → #135 → #134 → #133.

### L3 · Preparado, NO ejecutado (20 PR históricas)

Método:
1. Líneas añadidas **y borradas** de cada PR, buscadas en el squash `f3d7678` (#96), con `l3.py`.
2. Blob por archivo, comparado con el squash y con master.
3. Similitud (`difflib`) de cada línea residual con la línea más parecida del mismo archivo, con `l3-residual.py`.
4. **Ejecución en el `master` actual de las pruebas que añadió o modificó cada PR** (`run-one.sh`). Se usan las versiones de master; la columna «idéntica» indica si la prueba de master es la misma que la de la PR.

`f3d7678` es ancestro de master.

| PR | HEAD (PR) | Grupo | Evidencia | Pruebas sobre master | Decisión |
|---|---|---|---|---|---|
| [#90](https://github.com/Juanmaes83/floorplan-3d/pull/90) | [`794f13f77e92`](https://github.com/Juanmaes83/floorplan-3d/commit/794f13f77e92462cb1b052a3fe11a4206f5c4cc6) | Diferencia residual justificada | 321/322 líneas añadidas (> 25 car.) y 22/22 borradas están en el squash `f3d7678` (#96). 2/3 archivos tienen blob idéntico al del squash y 2/3 al de master. La línea restante, la lista de exportaciones de View3D, está en #96 en su versión combinada con #81 (similitud 1,00). | `walk-controls.browser.test.cjs`: 8 ok · idéntica<br>`walk.browser.test.cjs`: 2 ok · idéntica | **APTA** |
| [#88](https://github.com/Juanmaes83/floorplan-3d/pull/88) | [`1abdc467fb52`](https://github.com/Juanmaes83/floorplan-3d/commit/1abdc467fb521c7a044e50d2df38376794834c24) | Coincidencia exacta (líneas) | 77/77 líneas añadidas (> 25 car.) y 5/5 borradas están en el squash `f3d7678` (#96). 1/2 archivos tienen blob idéntico al del squash y 0/2 al de master. | `presentation-overview.browser.test.cjs`: 4 ok | **APTA** |
| [#87](https://github.com/Juanmaes83/floorplan-3d/pull/87) | [`72a38577a10b`](https://github.com/Juanmaes83/floorplan-3d/commit/72a38577a10bd2b3dba94713749f4720ce9ce7f1) | Coincidencia exacta (líneas) | 232/232 líneas añadidas (> 25 car.) y 23/23 borradas están en el squash `f3d7678` (#96). 6/7 archivos tienen blob idéntico al del squash y 6/7 al de master. | `furniture-overlaps.browser.test.cjs`: 7 ok · idéntica<br>`furniture-placement.test.cjs`: 10 ok · idéntica<br>`stair-conflicts.browser.test.cjs`: 4 ok · idéntica | **APTA** |
| [#86](https://github.com/Juanmaes83/floorplan-3d/pull/86) | [`01fc51f836c5`](https://github.com/Juanmaes83/floorplan-3d/commit/01fc51f836c59f2d3102f8fe8447ee5c4265a102) | Coincidencia exacta (líneas) | 138/138 líneas añadidas (> 25 car.) y 6/14 borradas están en el squash `f3d7678` (#96). 5/6 archivos tienen blob idéntico al del squash y 3/6 al de master. Sus 8 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master. | `guide-navigation.browser.test.cjs`: 14 ok<br>`journey-orientation.browser.test.cjs`: 11 ok / 6 aserciones fallidas · idéntica | **REVISAR** |
| [#85](https://github.com/Juanmaes83/floorplan-3d/pull/85) | [`e55bf0075b5c`](https://github.com/Juanmaes83/floorplan-3d/commit/e55bf0075b5c5baeea732dbf835e40850020fe98) | Coincidencia exacta (líneas) | 78/78 líneas añadidas (> 25 car.) y 6/6 borradas están en el squash `f3d7678` (#96). 2/6 archivos tienen blob idéntico al del squash y 2/6 al de master. | `panel-pattern.browser.test.cjs`: 12 ok · idéntica<br>`presentation-framing.browser.test.cjs`: 11 ok | **APTA** |
| [#84](https://github.com/Juanmaes83/floorplan-3d/pull/84) | [`f4eb5fa72a0e`](https://github.com/Juanmaes83/floorplan-3d/commit/f4eb5fa72a0e1d2a1ee1da6bd055769d1a82c880) | Coincidencia exacta (líneas) | 38/38 líneas añadidas (> 25 car.) y 12/12 borradas están en el squash `f3d7678` (#96). 0/3 archivos tienen blob idéntico al del squash y 0/3 al de master. | `presentation-framing.browser.test.cjs`: 11 ok | **APTA** |
| [#83](https://github.com/Juanmaes83/floorplan-3d/pull/83) | [`84e6abdc1f4f`](https://github.com/Juanmaes83/floorplan-3d/commit/84e6abdc1f4f5491d42165e9ddd8d5925ae73e32) | Coincidencia exacta (líneas) | 42/42 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 1/1 archivos tienen blob idéntico al del squash y 1/1 al de master. | Sin pruebas (documentación) | **APTA** |
| [#82](https://github.com/Juanmaes83/floorplan-3d/pull/82) | [`baec518dd6ab`](https://github.com/Juanmaes83/floorplan-3d/commit/baec518dd6abdcb1377283927a2cdef6ef902a6f) | Coincidencia exacta (líneas) | 77/77 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 1/1 archivos tienen blob idéntico al del squash y 1/1 al de master. | Sin pruebas (documentación) | **APTA** |
| [#81](https://github.com/Juanmaes83/floorplan-3d/pull/81) | [`5578aab12a0a`](https://github.com/Juanmaes83/floorplan-3d/commit/5578aab12a0aced3990eef9b576290012bc6e339) | Diferencia residual justificada | 371/372 líneas añadidas (> 25 car.) y 1/14 borradas están en el squash `f3d7678` (#96). 54/56 archivos tienen blob idéntico al del squash y 51/56 al de master. Sus 13 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master. La línea restante, la lista de exportaciones de View3D, está combinada con #90 (similitud 1,00). Sus 13 líneas borradas fuera del squash son del diálogo de #78 y no están en master. | `delivery-image.browser.test.cjs`: 4 ok<br>`delivery-image.test.cjs`: 5 ok<br>`share-image.browser.test.cjs`: 3 ok · idéntica | **APTA** |
| [#80](https://github.com/Juanmaes83/floorplan-3d/pull/80) | [`8e5cf9a010bb`](https://github.com/Juanmaes83/floorplan-3d/commit/8e5cf9a010bbadb3536822b2ac88f02105fa19af) | Coincidencia exacta (líneas) | 384/384 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 12/13 archivos tienen blob idéntico al del squash y 11/13 al de master. | Sin pruebas (documentación) | **APTA** |
| [#79](https://github.com/Juanmaes83/floorplan-3d/pull/79) | [`97c8578a6417`](https://github.com/Juanmaes83/floorplan-3d/commit/97c8578a6417524f81793eea4c2de31417a61154) | Diferencia residual justificada | 360/363 líneas añadidas (> 25 car.) y 10/10 borradas están en el squash `f3d7678` (#96). 44/49 archivos tienen blob idéntico al del squash y 44/49 al de master. Las 3 líneas restantes son `clear()`/`open()` de la lámina y una prueba de red, combinadas con #72 y #73 (similitud 0,93–0,97). | `browser.test.cjs`: 39 ok · repetida en solitario<br>`first-paint-language.browser.test.cjs`: 1 ok · idéntica<br>`presentation.browser.test.cjs`: 57 ok / 1 cortes por tiempo · repetida en solitario<br>`selection-scale.browser.test.cjs`: 3 ok · idéntica<br>`sheet.browser.test.cjs`: 9 ok · idéntica | **APTA (con cortes por tiempo del entorno)** |
| [#78](https://github.com/Juanmaes83/floorplan-3d/pull/78) | [`bcf2ec6c03eb`](https://github.com/Juanmaes83/floorplan-3d/commit/bcf2ec6c03ebd0fa910567636217194ca44cb959) | Sustitución funcional | 139/152 líneas añadidas (> 25 car.) y 12/12 borradas están en el squash `f3d7678` (#96). 1/5 archivos tienen blob idéntico al del squash y 1/5 al de master. «Compartir imagen» existe en master (`presentationShare`, `canShare`, `wa.me`), con la versión que amplió #81 (formatos y contacto). | `presentation-framing.browser.test.cjs`: 11 ok<br>`share-image.browser.test.cjs`: 3 ok | **APTA** |
| [#76](https://github.com/Juanmaes83/floorplan-3d/pull/76) | [`f800c7d5b970`](https://github.com/Juanmaes83/floorplan-3d/commit/f800c7d5b97080e0ea488e38c89a83bb9564da4e) | Coincidencia exacta (líneas) | 106/106 líneas añadidas (> 25 car.) y 0/3 borradas están en el squash `f3d7678` (#96). 1/4 archivos tienen blob idéntico al del squash y 0/4 al de master. Sus 3 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master. | `browser.test.cjs`: 39 ok · repetida en solitario<br>`professional-entry.browser.test.cjs`: 11 ok | **APTA** |
| [#75](https://github.com/Juanmaes83/floorplan-3d/pull/75) | [`dd2e81a74c66`](https://github.com/Juanmaes83/floorplan-3d/commit/dd2e81a74c664f5d4a6536b9942616d3f21bb431) | Coincidencia exacta (líneas) | 348/348 líneas añadidas (> 25 car.) y 13/13 borradas están en el squash `f3d7678` (#96). 4/7 archivos tienen blob idéntico al del squash y 1/7 al de master. | `client-review.browser.test.cjs`: 5 ok · idéntica<br>`presentation-framing.browser.test.cjs`: 11 ok<br>`review-notes-core.test.cjs`: 3 ok | **APTA** |
| [#74](https://github.com/Juanmaes83/floorplan-3d/pull/74) | [`a815498c9c23`](https://github.com/Juanmaes83/floorplan-3d/commit/a815498c9c2333b6c557bf7a14bf3f7d8d6276f6) | Coincidencia exacta (líneas) | 133/133 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 3/5 archivos tienen blob idéntico al del squash y 3/5 al de master. | `provenance-core.test.cjs`: 4 ok · idéntica<br>`provenance.browser.test.cjs`: 4 ok · idéntica | **APTA** |
| [#73](https://github.com/Juanmaes83/floorplan-3d/pull/73) | [`213b6ecad994`](https://github.com/Juanmaes83/floorplan-3d/commit/213b6ecad99452761e6851224c4a976b44db7595) | Diferencia residual justificada | 321/325 líneas añadidas (> 25 car.) y 26/26 borradas están en el squash `f3d7678` (#96). 7/12 archivos tienen blob idéntico al del squash y 7/12 al de master. Las 4 líneas restantes son pruebas de red y de la bienvenida, reescritas en el propio #96 (similitud 0,88–0,90). | `browser.test.cjs`: 39 ok · repetida en solitario<br>`professional-entry.browser.test.cjs`: 11 ok | **APTA** |
| [#72](https://github.com/Juanmaes83/floorplan-3d/pull/72) | [`bb4639c0d8ba`](https://github.com/Juanmaes83/floorplan-3d/commit/bb4639c0d8ba1c86c33ffb4613ebac22eb5bb66a) | Diferencia residual justificada | 133/135 líneas añadidas (> 25 car.) y 10/10 borradas están en el squash `f3d7678` (#96). 6/8 archivos tienen blob idéntico al del squash y 6/8 al de master. Las 2 líneas restantes son `clear()`/`open()` de la lámina, combinadas con #79 (similitud 0,93–0,94). | `sheet-scale.browser.test.cjs`: 4 ok · idéntica | **APTA** |
| [#71](https://github.com/Juanmaes83/floorplan-3d/pull/71) | [`aba44e387d9b`](https://github.com/Juanmaes83/floorplan-3d/commit/aba44e387d9bd57b54fbd915a638347de0c83267) | Diferencia residual justificada | 6927/6935 líneas añadidas (> 25 car.) y 58/58 borradas están en el squash `f3d7678` (#96). 86/96 archivos tienen blob idéntico al del squash y 85/96 al de master. De las 8 líneas restantes, 5 son textos que #96 cambió: la acción `copy` pasó de «Crear mi vivienda desde el ejemplo» a «Crear mi copia» (`js/journey-core.js`, similitud 0,97), y 3 son tablas del documento. Las otras 2 son de la fila «Ver todas las herramientas» y del aviso del ejemplo, que en master distingue si el ejemplo se ha cambiado (similitud 0,64 y 0,37: evolución, no pérdida). | `build-palette.browser.test.cjs`: 3 ok<br>`journey-core.test.cjs`: 8 ok · idéntica<br>`journey-orientation.browser.test.cjs`: 11 ok / 6 aserciones fallidas<br>`presentation.browser.test.cjs`: 57 ok / 1 cortes por tiempo · repetida en solitario | **REVISAR** |
| [#70](https://github.com/Juanmaes83/floorplan-3d/pull/70) | [`f28442e8c518`](https://github.com/Juanmaes83/floorplan-3d/commit/f28442e8c5182c968ace0c48d4e8fbac5a33bdc5) | Sustitución funcional | 58/79 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 0/5 archivos tienen blob idéntico al del squash y 0/5 al de master. El selector de perfil (`welcomeAudience`) está en master; #73 («Entrada profesional: #70 + respuesta del perfil») reescribió su texto y el documento de propuesta. | `professional-entry.browser.test.cjs`: 11 ok | **APTA** |
| [#36](https://github.com/Juanmaes83/floorplan-3d/pull/36) | [`d7f0972149b5`](https://github.com/Juanmaes83/floorplan-3d/commit/d7f0972149b5605f6092290c5f7c4adcbc5f9029) | Sustitución funcional | 0/614 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 5/9 archivos tienen blob idéntico al del squash y 5/9 al de master. Los 9 archivos existen en master, 5 de ellos idénticos. No pasaron los avisos de Casa Serra de README, ROADMAP y ROADMAP-2 (§13); la autorización y la licencia constan en `docs/technical/casa-serra-integration.md`. | Sin pruebas (documentación) | **APTA** |

**Resumen por grupo:**

- **Diferencia residual justificada:** #90, #81, #79, #73, #72, #71
- **Coincidencia exacta (líneas):** #88, #87, #86, #85, #84, #83, #82, #80, #76, #75, #74
- **Sustitución funcional:** #78, #70, #36

**Por qué #71 y #86 quedan en REVISAR:** su suite `journey-orientation.browser.test.cjs` (la de master es idéntica a la de #86) da en `master@f5c08c7` 11 casos en verde y 6 fallos de aserción. Los 6 comprueban rótulos y jerarquía visual que master cambió **a propósito después**:
- la pestaña «Distribuir» pasó a «Diseñar» con HOM-01 (`5b5c874`, 09/11);
- el botón de la guía (`guidePrimary`) ya no es el único con estilo dominante;
- la guía de móvil mide 176 px y la prueba exige 170 o menos.

Lo que esta suite comprueba sigue funcionando: el siguiente paso al subir una imagen, el regreso a una tarea ya hecha, el conflicto en dúplex, el ejemplo y la cabecera guiada en 2D, 3D y con dos plantas. **Ningún workflow de CI ejecuta esta suite**, así que es deuda de pruebas de `master`, no código perdido de las PR.

Cerrar #71 o #86 no cambia nada de esto. Lo que conviene decidir aparte es si se actualiza o se retira esa suite de `master`. Por prudencia no las marco APTA hasta que el propietario lo vea.

**Cortes por tiempo:** en la tanda paralela (2 suites 3D a la vez, Chromium con SwiftShader), `browser.test.cjs` y `presentation.browser.test.cjs` tuvieron cancelaciones por tiempo, **sin ningún fallo de aserción**. `presentation.browser` se cortó además a los 40 minutos.
Se repitieron en solitario: el resultado figura en la tabla («repetida en solitario»).


**Aviso:** una coincidencia de líneas del 98–100 % no se ha tomado como prueba de equivalencia funcional. La decisión APTA exige además:
- que las líneas residuales estén explicadas una a una;
- que las pruebas propias de la PR sigan existiendo y pasen hoy en master.

Donde una suite falla, la decisión es REVISAR, con la causa abajo.

**Orden propuesto, si se autoriza:** primero las apiladas (#86 → #76 → #73 → #71; #81 → #78), después el resto. Sin borrar ramas. **Ninguna PR de L3 se ha cerrado.**


## 0. Resultado del triaje original (67 PR, antes de L1)

| Categoría | N.º | Qué significa aquí |
|---|---|---|
| **A · INTEGRADA** | 37 | El contenido está en master, con prueba: ascendencia, `patch-id` idéntico o ≥ 98 % de líneas en un commit de master identificado |
| **B · SUSTITUIDA** | 9 | Hay una sucesora identificada, con prueba (ascendencia, rescate documentado o reescritura medida) |
| **C · INTEGRABLE** | 2 | Diferencia real que aplica limpia: #219 y #220, ambas de agentes activos y **no tocadas** |
| **D · BLOQUEADA** | 10 | Espera una decisión humana o externa concreta (gate) |
| **E · EXPERIMENTAL/DOCUMENTAL/HISTÓRICA** | 9 | Documentos sin incorporar (GOV-04) y la evidencia R03 v1 |
| **F · INDETERMINADA** | 0 | Ninguna: cada PR tiene al menos una prueba mecánica más un vínculo documental |

**Deuda que se puede retirar ya, con prueba y sin decisiones de producto: 40 PR** (lotes L1, L2 y L3).
- Otras 6 dependen de un hecho concreto: fusionar #219, o que el propietario decida R02-A, VQ-01 o ENT-01.
- Otras 9 son documentos o evidencias que el propietario debe decidir si se incorporan (GOV-04).

Hallazgo importante sobre las 39 PR históricas (#70–#90, #133–#151):
- **35** no se pueden fusionar hoy sin hacer daño: su parche no aplica sobre master en ningún sentido (`git apply --check`, directo e inverso).
- Las otras 4 son documentos: #82 y #83 ya están idénticos en master; #77 y #89 aplican limpios.

En tres casos, fusionar **desharía controles de seguridad ya integrados**:
- **#141** volvería a aceptar el código del Render IA para publicar enlaces, deshaciendo GOV-08 S1 (#187).
- **#139** dejaría `api/render.js` sin los límites de acceso y gasto de D1.
- **#166** quitaría `RUBIK_SHARE_TOKEN` y reescribiría `api/share.js`, `api/unshare.js` y `api/view.js`, deshaciendo GOV-08 S1 y S2.

## 1. Método (reproducible) y límites

Se calculó para cada PR con `audit.py`, frente a `origin/master@f5c08c7`:

1. **Ascendencia:** `git merge-base --is-ancestor HEAD master`.
2. **Delta propio:** `merge-base(HEAD, base)`, donde la base es el HEAD de la PR inferior en las pilas (por ejemplo, #151 sobre #150). Si no, `master`.
3. **`git patch-id --stable`** de cada commit propio, comparado con los 574 commits sin *merge* de master.
4. **`git apply --check`** del delta propio sobre un *worktree* desacoplado de master, en sentido inverso (¿ya está aplicado?) y directo (¿aplica hoy?).
5. **Estado de cada archivo tocado en master:** idéntico (mismo blob), distinto o ausente. También se busca si el blob existe en otra ruta.
6. **Líneas añadidas significativas** (> 25 caracteres, sin espacios en los extremos) que están en el **mismo archivo** de master y en cualquier archivo.
7. **Referencias `#N`** en el log de master.

Después, `succ.py` comparó el delta propio de cada PR con el commit sucesor candidato: `patch-id` del delta completo y % de líneas añadidas presentes en el diff de ese commit. Los candidatos son:
- **#133–#151:** los commits `integration: … sobre master consolidado` del 30/10, con correspondencia 1:1.
- **#70–#90 y #36:** el *squash* `f3d7678` (#96).

**Límites:**
- `patch-id` idéntico prueba que el **cambio textual** es el mismo, no que el comportamiento actual de master coincida. Master siguió evolucionando después.
- El % de líneas es una **heurística**: una línea presente no prueba la misma semántica, y una ausente puede haberse reescrito a propósito. Por eso todos los casos por debajo del 100 % se revisaron a mano y se explican en la evidencia (#70, #72, #73, #78, #79, #81, #90, #134, #36).
- Las *squash merges* rompen la ascendencia. #96 es la prueba: ninguna de las PR #70–#90 es ancestro de master y, aun así, su contenido está.
- La ausencia de conflictos entre #219, #220 y #215 (`git merge-tree`) es **solo textual**: no sustituye a las pruebas.
- **CI:** se consultó solo en las PR activas (#211, #215, #217, #219 y, antes en la sesión, #220). En #203 también se consultó: 13/13 en verde. Para el resto de laboratorios se cita el estado único del 12/11, sin reconsultar. Las históricas no se consultaron: su CI es de octubre y no sirve como evidencia sobre el master actual.
- No se verificó el comportamiento en navegador de ninguna PR histórica: la equivalencia aquí es de **contenido**, no funcional.

## 2. Tabla por impacto y esfuerzo

| # | Acción | PR | Impacto en la deuda | Esfuerzo | Riesgo | Prueba |
|---|---|---|---|---|---|---|
| 1 | Cerrar el lote L2 (Punto 9, Project-First, Fases B y C, FT3D-1a/1b) | 18 | **Alto** | Mínimo: un comentario y cerrar | Bajo | `patch-id` idéntico en 16; 100 % de líneas en #150; código idéntico en #134 |
| 2 | Cerrar el lote L3 (programa de entrega de octubre, absorbido por #96, y #36) | 20 | **Alto** | Mínimo | Bajo | 98–100 % de líneas en `f3d7678` en 17; sucesora explícita en #70, #78 y #36 |
| 3 | Cerrar el lote L1 (#212, #216) | 2 | Bajo | Mínimo | Nulo | Ascendencia |
| 4 | Integrar #219 (Claude B), y después cerrar #210 y #211 | 1 + 2 | Medio | Medio: CI y GO | Medio | Ascendencia (#210 ⊂ #211 ⊂ #219) |
| 5 | Integrar #220 (UX-07, activación) | 1 | Medio (producto) | Revisión del propietario | Bajo-medio | CI 57/57; *merge-tree* limpio con #219 y #215 |
| 6 | Decisión GOV-04 sobre documentos | 8 | Medio | Decisión de 15 minutos por documento | Bajo | Solo documentación; todos aplican limpio |
| 7 | Decisión VQ-01/F03 | 4 (#164, #165, #167, #169) | Medio | Decisión visual | Alto si se fusiona | Ascendencia #165 ⊂ #167 ⊂ #169 |
| 8 | Confirmar ENT-01 por #189/#200/#201 y retirar #166 | 1 | Bajo (pero aclara ENT-01) | Decisión y una línea en el catálogo | **Muy alto si se fusiona** | Rescate documentado en 44ca9f3 |
| 9 | Adoptar #203 como R02-A canónico y cerrar #193 | 1 | Bajo | Hoja de decisión R02-A | Bajo | 87 % del JS de #193 en #203 |
| 10 | GO R03 (#215), y después cerrar #194 | 1 + 1 | Medio | Prueba C humana | Alto sin GO | Guía de revisión en #215 |
| 11 | Laboratorios D (R01, MCP, R02-A R1): mantener | 7 | — | — | — | Gates del estado único |

## 3. Lista 1 · PR cerrables documentalmente, con prueba (40)

**Cómo cerrarlas:**
- **No borrar ramas** hasta cerrar todo el lote: borrar la rama base de una PR apilada hace que GitHub cierre o rebase las hijas.
- Cerrar de la **cima de cada pila hacia abajo**:
  - #151 → #150;
  - #149 → #148 → #147 → #146 → #145 → #143 → #142 → #141 → #140 → #139 → #138 → #137 → #136 → #135 → #134 → #133;
  - #86 → #76 → #73 → #71;
  - #81 → #78.
- Cerrar no destruye nada: la PR se puede reabrir y la rama queda.

| PR | Cat. | Lote | Sucesor en master | Prueba principal |
|---|---|---|---|---|
| #216 | A | L1 | #218 (fusionada) | HEAD 8e2a13f es ancestro de master@f5c08c7 (`git merge-base --is-ancestor`); entró con #218 (f5c08c7). |
| #212 | A | L1 | #218 (fusionada) | HEAD fe30072 es ancestro de master@f5c08c7 (`git merge-base --is-ancestor`); entró con #218 (f5c08c7), junto con #209 y #216. |
| #151 | A | L2 | master 579189d | Delta propio (merge-base ac83460 con su base feat/ft3d-1a-plan-reveal) con `git patch-id --stable` IDÉNTICO al commit de master 579189d («integration: FT3D-1b»). 326/326 líneas añadidas presentes. |
| #150 | A | L2 | master b44d40d+9a21b25 | Patch-id no comparable con un solo commit: su contenido entró en dos commits de master, b44d40d y 9a21b25 (FT3D-1a). El 100 % de sus 676 líneas añadidas está en esos dos commits; 1 de sus 2 commits tiene patch-id idéntico en master. |
| #149 | A | L2 | master de75f30 | Delta propio (merge-base 27629a5 con su base feat/budget-c2) con `git patch-id --stable` IDÉNTICO al commit de master de75f30 («integration: Fase C C3»). 159/159 líneas añadidas presentes. |
| #148 | A | L2 | master c317d9e | Delta propio (merge-base 782b985 con su base feat/quantities-c1) con `git patch-id --stable` IDÉNTICO al commit de master c317d9e («integration: Fase C C2»). 205/205 líneas añadidas presentes. |
| #147 | A | L2 | master 902bc44 | Delta propio (merge-base d676ba3 con su base feat/ai-alternatives-b8) con `git patch-id --stable` IDÉNTICO al commit de master 902bc44 («integration: Fase C C1»). 140/140 líneas añadidas presentes. |
| #146 | A | L2 | master c86d496 | Delta propio (merge-base 799e647 con su base feat/moodboard-b7) con `git patch-id --stable` IDÉNTICO al commit de master c86d496 («integration: Fase B B8»). 65/65 líneas añadidas presentes. |
| #145 | A | L2 | master 3495c46 | Delta propio (merge-base dc2886c con su base feat/anchored-comments-b6) con `git patch-id --stable` IDÉNTICO al commit de master 3495c46 («integration: Fase B B7»). 137/137 líneas añadidas presentes. |
| #143 | A | L2 | master 9cc460b | Delta propio (merge-base 5941966 con su base feat/plan-service-b5) con `git patch-id --stable` IDÉNTICO al commit de master 9cc460b («integration: Fase B B6»). 184/184 líneas añadidas presentes. |
| #142 | A | L2 | master 06abd54 | Delta propio (merge-base 7c42bac con su base feat/share-link-b4) con `git patch-id --stable` IDÉNTICO al commit de master 06abd54 («integration: Fase B B5»). 152/152 líneas añadidas presentes. |
| #141 | A | L2 | master 77fa761 | Delta propio (merge-base 0788363 con su base feat/tour-video-b3) con `git patch-id --stable` IDÉNTICO al commit de master 77fa761 («integration: Fase B B4»). 253/253 líneas añadidas presentes. |
| #140 | A | L2 | master 96b44ee | Delta propio (merge-base ce2cbc7 con su base feat/ai-render-b2) con `git patch-id --stable` IDÉNTICO al commit de master 96b44ee («integration: Fase B B3»). 119/119 líneas añadidas presentes. |
| #139 | A | L2 | master 5f89957 | Delta propio (merge-base 3da88da con su base feat/client-share-b1) con `git patch-id --stable` IDÉNTICO al commit de master 5f89957 («integration: Fase B B2»). 247/247 líneas añadidas presentes. |
| #138 | A | L2 | master f585468 | Delta propio (merge-base 51ab83f con su base feat/project-first-dossier-a4) con `git patch-id --stable` IDÉNTICO al commit de master f585468 («integration: Fase B B1»). 166/166 líneas añadidas presentes. |
| #137 | A | L2 | master 2edfb98 | Delta propio (merge-base 2a034f8 con su base feat/project-first-analyze-a3) con `git patch-id --stable` IDÉNTICO al commit de master 2edfb98 («integration: Project-First A4»). 244/244 líneas añadidas presentes. |
| #136 | A | L2 | master bf147e1 | Delta propio (merge-base 6c8aa88 con su base feat/project-first-views-a2) con `git patch-id --stable` IDÉNTICO al commit de master bf147e1 («integration: Project-First A3»). 346/346 líneas añadidas presentes. |
| #135 | A | L2 | master ba60b94 | Delta propio (merge-base b34b45d con su base feat/project-first-experience-a1) con `git patch-id --stable` IDÉNTICO al commit de master ba60b94 («integration: Project-First A2»). 222/222 líneas añadidas presentes. |
| #134 | A | L2 | master a88c724 | Los 11 archivos coinciden. Los 10 archivos de código y pruebas tienen las mismas líneas que a88c724 («integration: Project-First A1»). El patch-id difiere solo por `docs/product/rubik-competitive-benchmark-roadmap-2026-10-29.md`: la PR añadía 1206 líneas y a88c724, 110. Hoy master tiene en ese archivo 810 de las 820 líneas de la PR. |
| #133 | A | L2 | master 6411179 | Delta propio (merge-base 414a077 con su base master) con `git patch-id --stable` IDÉNTICO al commit de master 6411179 («integration: Punto 9»). 478/478 líneas añadidas presentes. |
| #90 | A | L3 | #96 (f3d7678, fusionada) | 316/317 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 3/3 archivos coinciden. Todos sus archivos existen hoy en master. La única línea restante es la lista de exportaciones de View3D, combinada con la de #81. |
| #88 | A | L3 | #96 (f3d7678, fusionada) | 77/77 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 2/2 archivos coinciden. Todos sus archivos existen hoy en master. |
| #87 | A | L3 | #96 (f3d7678, fusionada) | 227/227 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 7/7 archivos coinciden. Todos sus archivos existen hoy en master. |
| #86 | A | L3 | #96 (f3d7678, fusionada) | 130/130 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 6/6 archivos coinciden. Todos sus archivos existen hoy en master. |
| #85 | A | L3 | #96 (f3d7678, fusionada) | 72/72 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 6/6 archivos coinciden. Todos sus archivos existen hoy en master. |
| #84 | A | L3 | #96 (f3d7678, fusionada) | 38/38 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 3/3 archivos coinciden. Todos sus archivos existen hoy en master. |
| #83 | A | L3 | #96 (f3d7678, fusionada) | 42/42 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 1/1 archivos coinciden. Todos sus archivos existen hoy en master. Además, el parche se revierte limpio sobre master (`git apply -R --check`): el documento está idéntico. |
| #82 | A | L3 | #96 (f3d7678, fusionada) | 77/77 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 1/1 archivos coinciden. Todos sus archivos existen hoy en master. Además, el parche se revierte limpio sobre master (`git apply -R --check`): el documento está idéntico. |
| #81 | A | L3 | #96 (f3d7678, fusionada) | 340/341 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 9/9 archivos coinciden. Todos sus archivos existen hoy en master. La única línea restante es la lista de exportaciones de View3D, combinada con la de #90. |
| #80 | A | L3 | #96 (f3d7678, fusionada) | 373/373 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 13/13 archivos coinciden. Todos sus archivos existen hoy en master. |
| #79 | A | L3 | #96 (f3d7678, fusionada) | 347/350 (99%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 22/22 archivos coinciden. Todos sus archivos existen hoy en master. Las 3 líneas restantes son `clear()`/`open()` de la lámina y una prueba de red, que se combinaron con #72 y #73. |
| #78 | B | L3 | #81 → #96 (f3d7678) | 139/152 (91 %) de sus líneas en #96. El diálogo «Compartir imagen» (`presentationShare`, `canShare`, `wa.me`) existe en master, en la versión reescrita por #81 (apilada sobre #78, 100 % en #96). La tarjeta de aprobación `docs/qa/share-image-approval-2026-10-23.md` está en master. |
| #76 | A | L3 | #96 (f3d7678, fusionada) | 105/105 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 4/4 archivos coinciden. Todos sus archivos existen hoy en master. |
| #75 | A | L3 | #96 (f3d7678, fusionada) | 346/346 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 7/7 archivos coinciden. Todos sus archivos existen hoy en master. |
| #74 | A | L3 | #96 (f3d7678, fusionada) | 132/132 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 5/5 archivos coinciden. Todos sus archivos existen hoy en master. |
| #73 | A | L3 | #96 (f3d7678, fusionada) | 312/316 (99%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 6/6 archivos coinciden. Todos sus archivos existen hoy en master. Las 4 líneas restantes (textos de bienvenida y pruebas de red) se reescribieron en el propio #96. |
| #72 | A | L3 | #96 (f3d7678, fusionada) | 123/125 (98%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 7/7 archivos coinciden. Todos sus archivos existen hoy en master. Las 2 líneas restantes son `clear()`/`open()` de la lámina, que también tocaba #79: #96 trae la versión combinada. |
| #71 | A | L3 | #96 (f3d7678, fusionada) | 2262/2270 (100%) de las líneas añadidas (>25 car.) de su delta propio están en el squash f3d7678 (#96, «Integración funcional de Rubik Sota»), y 27/27 archivos coinciden. Todos sus archivos existen hoy en master. |
| #70 | B | L3 | #73 → #96 (f3d7678) | 57/78 (73 %) de sus líneas en #96. Su sucesora explícita es #73 («Entrada profesional: #70 + respuesta del perfil»), que está al 99 % en #96. El selector de perfil `welcomeAudience` existe en master (`js/guide-ui.js`). Lo que no está es el texto original del documento de propuesta del 21/10, que #73 y #96 reescribieron. |
| #36 | B | L3 | master 5c24490 + 61efd05 | Los 9 archivos existen en master: 5 idénticos y 4 distintos. 562/614 líneas (92 %) están en el mismo archivo de master. Entró por 5c24490 («docs: establish Casa Serra roadmap and verified R0 baseline», 14/10, del propietario) y por 61efd05. No pasaron las secciones «Casa Serra» de README, ROADMAP y ROADMAP-2; la autorización y la licencia sí constan en `docs/technical/casa-serra-integration.md`. |

## 4. Lista 2 · Diferencias reales fáciles de integrar

| PR | Qué aporta | Estado | Siguiente paso |
|---|---|---|---|
| #219 | OBR-02/03 sobre master@f5c08c7: solo `evolucion/*` y 44 archivos nuevos. Contiene #210 y #211 | En curso a las 13:22 UTC: 7 en verde, 9 en curso y 1 fallo (cross-browser firefox webgl) en b942a6d. Lo resuelve Claude B. | **No tocar (Claude B).** CI en verde y GO del propietario |
| #220 | UX-07: «Comparar con el original» en Variantes, ruta de solo lectura | 57/57 en verde (6fba873) | **No tocar (Claude A).** Revisión del propietario |
| #48, #77, #89, #160, #162, #164 | Documentos sin equivalente en master; aplican limpio | Solo documentación | Decisión GOV-04: incorporar en **una** PR documental o archivar |

No se ha encontrado **ninguna** diferencia de código fácil de rescatar en las 39 PR históricas (#70–#90, #133–#151). Su código está en master; lo que falta son textos de documentos reescritos después, o versiones intermedias sustituidas.

## 5. Lista 3 · Bloqueadas por decisión humana o externa

| PR | Gate | Quién decide | Evidencia |
|---|---|---|---|
| #217 | Mantener con #203. | Propietario | R02-A R1: puente puro con el editor, laboratorio apilado sobre #203. |
| #215 | NO tocar. Prueba C humana y GO de activación R03; GOV-05 sigue como riesgo. | Propietario | R03 dentro del editor: parche de `index.html` (+14 −4). Espera la prueba C humana y el GO R03. Las 2 pruebas de bloqueo de `pure` fallan a propósito. |
| #205 | Mantener con #191. | Propietario | Corte 2 de R01, apilado sobre #191 (HEAD de #191 ⊂ #205). |
| #204 | Mantener con #196 y #197. | Propietario | Endurecimiento de MCP Etapa 2, apilado sobre #197 (ascendencia comprobada). |
| #203 | Mantener. Hoja de decisión R02-A. | Propietario | R02-A normalizado («laboratorio, NO fusionar»). Sustituye a #193. Pendientes: la hoja de decisión R02-A (5 decisiones) y la revisión humana. |
| #197 | Mantener con #196. | Propietario | Validación de MCP Etapa 2, apilada sobre #196 (ascendencia comprobada). 197 archivos exclusivos (vídeos y auditoría). Aceptación PROVISIONAL de las 250 verificaciones, solo para laboratorio. |
| #196 | Mantener. Gate: dato real autorizado. | Propietario | MCP Etapa 2: `propose_layout`. Estado único: «HOLD merge y Etapas 3–4»; falta dato real autorizado y escala confirmada. |
| #191 | Mantener. Gate F2 (datos reales autorizados). | Propietario | R01: laboratorio de reconocimiento, NO VALIDADO. 1 % de sus líneas JS en master. Estado único del 12/11: falta validación F2 con planos reales autorizados y escala. |
| #169 | Decisión del propietario: rehacer F03 desde master o archivar. | Propietario | VQ-01 / F03 fachadas: 57 commits y 167 archivos exclusivos (materiales y workflows). No aplica sobre master. Contiene #165 y #167. Según la auditoría de oportunidades del 09/11 (§193), el propietario debe decidir su destino. |
| #161 | Mantener abierta hasta la revisión jurídica externa. | Externo (jurídico) | Borrador legal (1 documento). El catálogo GOV-05 lo cita: «PR #161, R (borrador)», y requiere un profesional jurídico. |

## 6. Lista 4 · Se quedan como laboratorio o evidencia

| PR | Motivo para mantener | Cuándo se podría cerrar |
|---|---|---|
| #191 → #205 (R01) | Única evidencia R01; F2 sin datos reales | Si el propietario descarta R01, o cuando haya un corte F2 integrado |
| #196 → #197 → #204 (MCP Etapa 2) | Etapa 2 con HOLD; 250 verificaciones provisionales | Tras validar con dato real autorizado e integrar, o al descartarla |
| #203 → #217 (R02-A) | Laboratorio R02-A canónico; hoja de decisión pendiente | Tras la decisión R02-A |
| #194 (R03 v1) | Evidencia del taller del donante | Tras el GO R03 (#215) |
| #169 (VQ-01/F03) | Única copia de los activos F03 | Tras la decisión VQ-01 |

## 7. Dependencias y orden más seguro de las próximas integraciones

```
master@f5c08c7
 ├─ #219 OBR-02/03 (Claude B) ── contiene #211 ⊃ #210
 ├─ #220 UX-07 activación (Claude A)
 ├─ #215 R03 en el editor (prueba C + GO) ── requiere #198/#214 (ya en master)
 ├─ #203 R02-A ── #217 R02-A R1        (sustituye a #193)
 ├─ #196 MCP ── #197 ── #204
 ├─ #191 R01 ── #205
 └─ #169 VQ-01 ⊃ #167 ⊃ #165          (acta #164)
```

**Comprobación de conflictos** (`git merge-tree`, en seco, sobre master): las combinaciones de dos (#219+#220, #219+#215, #220+#215) y la de las tres (#219, después #220, después #215) se fusionan **sin conflictos textuales**. Los archivos modificados no se solapan salvo `index.html`, que tocan #220 y #215 en zonas distintas.

**Orden recomendado:**
1. **#219.** Es la más madura en su carril y solo toca `evolucion/`. Cuando esté en verde y tenga GO: fusionar, y después cerrar #210 y #211 (lote L4).
2. **#220.** Es independiente de #219. Tras fusionarla, volver a pasar `variants*`, `premium-shell` y `ux07-*` sobre el master resultante.
3. **#215**, solo tras la prueba C humana y el GO R03. En ese mismo corte se actualizan las 2 pruebas de bloqueo de `pure`. Tras fusionar, cerrar #194.
4. Después, una sola cosa a la vez: decisión R02-A (#203 → #217; cerrar #193), decisión VQ-01 (#169) y validación real de MCP.

**Lo que no se debe hacer:** fusionar en bloque laboratorios D, o reactivar #166 (ENT-01) en lugar de #189/#200/#201.

## 8. Plan de cierre por lotes y comentario de sustitución

Cada PR tiene su comentario literal en la columna `comentario_cierre` del CSV, listo para pegar y con el pie de atribución.

| Lote | PR | Condición para ejecutarlo | Plantilla del comentario |
|---|---|---|---|
| L1 | #216, #212 | Ninguna | «Cierre documental (GOV-02). Esta PR ya está en `master`: su HEAD es ancestro de `master@f5c08c7`…» |
| L2 | #151, #150, #149, #148, #147, #146, #145, #143, #142, #141, #140, #139, #138, #137, #136, #135, #134, #133 | Ninguna. Cerrar de la cima hacia abajo, sin borrar ramas | «…su delta propio tiene el mismo `git patch-id --stable` que el commit `<sha>` de `master` («integration: …»)…». En #139 y #141 se añade la advertencia de seguridad |
| L3 | #90, #88, #87, #86, #85, #84, #83, #82, #81, #80, #79, #78, #76, #75, #74, #73, #72, #71, #70, #36 | Ninguna. Apiladas primero | «…entró en `master` con el squash `f3d7678` (#96): X de sus Y líneas…», o la sucesora explícita (#70 → #73; #78 → #81; #36 → 5c24490) |
| L4 | #211, #210, #193, #167, #166, #165 | #210 y #211: tras fusionar #219. #193: tras adoptar #203. #165 y #167: con la decisión VQ-01. #166: con la confirmación de ENT-01 | Sustitución o consolidación, citando la sucesora y su SHA |
| L5 | #194, #164, #162, #160, #89, #77, #64, #61, #48 | Decisión GOV-04. #61 y #64 se pueden archivar ya si el propietario lo acepta. #194, tras el GO R03 | «Cierre como histórica…», o incorporar el documento en una única PR documental |

**Comentarios literales por PR**, agrupados en el orden de ejecución:


### L1

**#216**

> PUBLICADO el 2026-11-13 con el texto autorizado por el propietario: https://github.com/Juanmaes83/floorplan-3d/pull/216#issuecomment-6856406796

**#212**

> PUBLICADO el 2026-11-13 con el texto autorizado por el propietario: https://github.com/Juanmaes83/floorplan-3d/pull/212#issuecomment-6856409658


### L2

**#151**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con FT3D-1b: commit sucesor `579189df39513aca44e0a86b44ef4392f38173d2`.
> - HEAD de esta PR: `964026362ec939982f69081dc2dfbb522230ba3f`
> - Delta propio desde `ac83460a1de8ba78eddf8127f229dca26b6ea9ac`
> - Prueba: `git patch-id --stable` idéntico: `e060547fac01bf321d0eb01a925f9b0efbd43d3d`, delta propio `ac83460a1de8..964026362ec9` frente a `579189df3951^..579189df3951`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#150**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con FT3D-1a: commits sucesores `b44d40d9309df3b483e59d8416f86fae666be8e7` + `9a21b2587139e4ef3ea377f7b71cca0bd541147e`.
> - HEAD de esta PR: `ac83460a1de8ba78eddf8127f229dca26b6ea9ac`
> - Delta propio desde `a318cffa0909292e907fd4e45907bbf0f4f93e15`
> - Prueba: Contenido en dos commits consecutivos de master, `b44d40d9309d` y `9a21b2587139`. 6 de sus 8 archivos tienen blob idéntico en `9a21b2587139`. En `index.html` y `.github/workflows/integration-browser.yml`, las líneas `+` y `−` son idénticas; solo cambia el contexto. Las 676 líneas añadidas están todas en el sucesor y no hay ninguna de más.
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#149**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase C C3: commit sucesor `de75f3019a4becfeeb8cb01e2d0118d79e8ba615`.
> - HEAD de esta PR: `f398f82f9e0f2dd3dfd38d0171c8ec96ae93573c`
> - Delta propio desde `27629a51b30cc71bdca4114be75b299ae2a9eaa6`
> - Prueba: `git patch-id --stable` idéntico: `c72ef2bb191aa1772f881715a880d509ec6f6b2e`, delta propio `27629a51b30c..f398f82f9e0f` frente a `de75f3019a4b^..de75f3019a4b`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#148**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase C C2: commit sucesor `c317d9eca72fde7ffa1825331b2f40ab526da616`.
> - HEAD de esta PR: `27629a51b30cc71bdca4114be75b299ae2a9eaa6`
> - Delta propio desde `782b98530025088200f8ed57b303fcc660806bdb`
> - Prueba: `git patch-id --stable` idéntico: `8b7153e42fc9a8742e645b1acaf77650b5ebd5b4`, delta propio `782b98530025..27629a51b30c` frente a `c317d9eca72f^..c317d9eca72f`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#147**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase C C1: commit sucesor `902bc44232e7f957658d46dde2d1f4764bca54e4`.
> - HEAD de esta PR: `782b98530025088200f8ed57b303fcc660806bdb`
> - Delta propio desde `d676ba3eeacff527e8f4de07a463297e825d6b8d`
> - Prueba: `git patch-id --stable` idéntico: `a9dedfcb11c22cca1f180a800660a3904b460594`, delta propio `d676ba3eeacf..782b98530025` frente a `902bc44232e7^..902bc44232e7`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#146**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B8: commit sucesor `c86d4962a9966f6016260194b5408c7bd0aff4c8`.
> - HEAD de esta PR: `d676ba3eeacff527e8f4de07a463297e825d6b8d`
> - Delta propio desde `799e647d6ca6beabec4a84b521f720951d2e0cb8`
> - Prueba: `git patch-id --stable` idéntico: `fdc6f9ecac49ecf8289f698155bed4c28179140c`, delta propio `799e647d6ca6..d676ba3eeacf` frente a `c86d4962a996^..c86d4962a996`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada. **Aviso de seguridad:** no debe recuperarse su versión de `api/render.js`. También toca `api/render.js` en una versión anterior a los límites D1 (`14419c2`, `7ac9b34`).
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#145**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B7: commit sucesor `3495c4637b07130a6f89263cf2ee2ff3d897f1de`.
> - HEAD de esta PR: `799e647d6ca6beabec4a84b521f720951d2e0cb8`
> - Delta propio desde `dc2886c766df841197d27e249f70c8ca8fa5a513`
> - Prueba: `git patch-id --stable` idéntico: `edfc8b23721bc4d4f4efa1fcecb96b494424b53f`, delta propio `dc2886c766df..799e647d6ca6` frente a `3495c4637b07^..3495c4637b07`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#143**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B6: commit sucesor `9cc460b7ba65e0af40ca358e0575ffee44c02e18`.
> - HEAD de esta PR: `dc2886c766df841197d27e249f70c8ca8fa5a513`
> - Delta propio desde `59419664bb0e6e970c3592ad11d6a72716629926`
> - Prueba: `git patch-id --stable` idéntico: `ad045b45d58fad1cbcc0660524f11f797f0d4bdf`, delta propio `59419664bb0e..dc2886c766df` frente a `9cc460b7ba65^..9cc460b7ba65`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#142**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B5: commit sucesor `06abd54bdfdf355ba8fb7bb417a008d4d4c4ffa3`.
> - HEAD de esta PR: `59419664bb0e6e970c3592ad11d6a72716629926`
> - Delta propio desde `7c42bacaec1bc67bd912a8eee84a3ac736f8f2eb`
> - Prueba: `git patch-id --stable` idéntico: `a24544ce9208410f2598a047202150b5ff43e76a`, delta propio `7c42bacaec1b..59419664bb0e` frente a `06abd54bdfdf^..06abd54bdfdf`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#141**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B4: commit sucesor `77fa7618828cd0c1ab03c15dfee9309634c610e6`.
> - HEAD de esta PR: `7c42bacaec1bc67bd912a8eee84a3ac736f8f2eb`
> - Delta propio desde `0788363725c0a14621a4b65964edc5355f5df114`
> - Prueba: `git patch-id --stable` idéntico: `467d8182cd2d8baf9704084e9db99888f028332e`, delta propio `0788363725c0..7c42bacaec1b` frente a `77fa7618828c^..77fa7618828c`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada. **Aviso de seguridad:** no debe recuperarse su versión de `api/share.js`, `api/view.js`. Su `api/share.js` acepta el código del Render IA (`RUBIK_RENDER_TOKEN`) para publicar. Master exige `RUBIK_SHARE_TOKEN` desde GOV-08 S1 (#187, `2373977`), con la retirada S2 (#188) y el aislamiento del visor (#195) encima.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#140**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B3: commit sucesor `96b44ee9335979cbbfbc3cec6c5d420a9c0894e5`.
> - HEAD de esta PR: `0788363725c0a14621a4b65964edc5355f5df114`
> - Delta propio desde `ce2cbc7d1bbcb92acc4dd209cd251dc6ca8531d4`
> - Prueba: `git patch-id --stable` idéntico: `a49ad9e79adc7f824fa4ca197d6c5f195afb3f6f`, delta propio `ce2cbc7d1bbc..0788363725c0` frente a `96b44ee93359^..96b44ee93359`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#139**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B2: commit sucesor `5f899575d72da20129e06036c730888a6481abf3`.
> - HEAD de esta PR: `ce2cbc7d1bbcb92acc4dd209cd251dc6ca8531d4`
> - Delta propio desde `3da88dac1cc46cdaaf342ca07848fe87e0d57519`
> - Prueba: `git patch-id --stable` idéntico: `f3cf572017a644f3b6eaed0f9870c44de91b9dae`, delta propio `3da88dac1cc4..ce2cbc7d1bbc` frente a `5f899575d72d^..5f899575d72d`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada. **Aviso de seguridad:** no debe recuperarse su versión de `api/render.js`. Su versión de `api/render.js` no tiene los límites de acceso y gasto del Render IA (D1 PR-1 `14419c2`, D1 IMG-02 `7ac9b34`): en master el archivo tiene `RUBIK_RENDER_MAX_PER_HOUR/_PER_DAY`, uso y coste estimado; en la PR, no.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#138**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Fase B B1: commit sucesor `f585468077191b2d0599abd8faac3b7ab60eaadc`.
> - HEAD de esta PR: `3da88dac1cc46cdaaf342ca07848fe87e0d57519`
> - Delta propio desde `51ab83fe70ac0a54739f3a608b34605cf78aaef6`
> - Prueba: `git patch-id --stable` idéntico: `4c164432f9a4cc90bc27fc2575354c368784c877`, delta propio `51ab83fe70ac..3da88dac1cc4` frente a `f58546807719^..f58546807719`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#137**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Project-First A4: commit sucesor `2edfb98f9442aae394ca778a0b16fd4b6c5fdf6b`.
> - HEAD de esta PR: `51ab83fe70ac0a54739f3a608b34605cf78aaef6`
> - Delta propio desde `2a034f870cf2563aae567d2decd0dfa926172cd0`
> - Prueba: `git patch-id --stable` idéntico: `bf2ad09c4192c5a89473413d5f2b4ee738afae37`, delta propio `2a034f870cf2..51ab83fe70ac` frente a `2edfb98f9442^..2edfb98f9442`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#136**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Project-First A3: commit sucesor `bf147e1e75c3e050ba1c5c76d3348531eccc770c`.
> - HEAD de esta PR: `2a034f870cf2563aae567d2decd0dfa926172cd0`
> - Delta propio desde `6c8aa88b92fdfa918ef00e7a267ec3dc9cf56934`
> - Prueba: `git patch-id --stable` idéntico: `18f2a3e7b9a0b79e9b64404d4cb780c8d48857cf`, delta propio `6c8aa88b92fd..2a034f870cf2` frente a `bf147e1e75c3^..bf147e1e75c3`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#135**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Project-First A2: commit sucesor `ba60b94eac98416bb4ffac59ffb1012f30f61b57`.
> - HEAD de esta PR: `6c8aa88b92fdfa918ef00e7a267ec3dc9cf56934`
> - Delta propio desde `b34b45d9b11c6a02e4d442f71f7de272000bcf34`
> - Prueba: `git patch-id --stable` idéntico: `714326e6e415bd3640d5bb42597fd99d91f89466`, delta propio `b34b45d9b11c..6c8aa88b92fd` frente a `ba60b94eac98^..ba60b94eac98`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#134**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Project-First A1: commit sucesor `a88c72436bd76385c882f18f122c4fa041d35f38`.
> - HEAD de esta PR: `b34b45d9b11c6a02e4d442f71f7de272000bcf34`
> - Delta propio desde `164312a7208ff1c3dd0504cefe9def10929dfce0`
> - Prueba: Los 11 archivos del delta propio tienen **el mismo blob** en `b34b45d9b11c` y en `a88c72436bd7`. El patch-id difiere (`c19194bd3961` frente a `f3f4cc3cd1e1`) solo porque `docs/product/rubik-competitive-benchmark-roadmap-2026-10-29.md` no existía en la base de #133, pero sí en master antes de `a88c72436bd7` (lo añadió `7e5dd25`).
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#133**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> El contenido de esta PR ya está en `master` con Punto 9: commit sucesor `64111795eb9cdec49fc65ff64e38e008b831cf27`.
> - HEAD de esta PR: `164312a7208ff1c3dd0504cefe9def10929dfce0`
> - Delta propio desde `414a07772495e7e0caa77c0be33b0ad2e2838d1b`
> - Prueba: `git patch-id --stable` idéntico: `a3539920d7d743c18de77026c2f65ba60c4e77e9`, delta propio `414a07772495..164312a7208f` frente a `64111795eb9c^..64111795eb9c`
> 
> No se fusiona: master ha evolucionado después y el parche ya no aplica. Cerrarla no recupera ni activa nada.
> 
> La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_


### L3

**#90**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `794f13f77e92462cb1b052a3fe11a4206f5c4cc6`
> - Evidencia: 321/322 líneas añadidas (> 25 car.) y 22/22 borradas están en el squash `f3d7678` (#96). 2/3 archivos tienen blob idéntico al del squash y 2/3 al de master. La línea restante, la lista de exportaciones de View3D, está en #96 en su versión combinada con #81 (similitud 1,00).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#88**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `1abdc467fb521c7a044e50d2df38376794834c24`
> - Evidencia: 77/77 líneas añadidas (> 25 car.) y 5/5 borradas están en el squash `f3d7678` (#96). 1/2 archivos tienen blob idéntico al del squash y 0/2 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 1/1 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#87**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `72a38577a10bd2b3dba94713749f4720ce9ce7f1`
> - Evidencia: 232/232 líneas añadidas (> 25 car.) y 23/23 borradas están en el squash `f3d7678` (#96). 6/7 archivos tienen blob idéntico al del squash y 6/7 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 3/3 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#86**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `01fc51f836c59f2d3102f8fe8447ee5c4265a102`
> - Evidencia: 138/138 líneas añadidas (> 25 car.) y 6/14 borradas están en el squash `f3d7678` (#96). 5/6 archivos tienen blob idéntico al del squash y 3/6 al de master. Sus 8 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 1/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#85**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `e55bf0075b5c5baeea732dbf835e40850020fe98`
> - Evidencia: 78/78 líneas añadidas (> 25 car.) y 6/6 borradas están en el squash `f3d7678` (#96). 2/6 archivos tienen blob idéntico al del squash y 2/6 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#84**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `f4eb5fa72a0e1d2a1ee1da6bd055769d1a82c880`
> - Evidencia: 38/38 líneas añadidas (> 25 car.) y 12/12 borradas están en el squash `f3d7678` (#96). 0/3 archivos tienen blob idéntico al del squash y 0/3 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 1/1 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#83**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `84e6abdc1f4f5491d42165e9ddd8d5925ae73e32`
> - Evidencia: 42/42 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 1/1 archivos tienen blob idéntico al del squash y 1/1 al de master.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#82**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `baec518dd6abdcb1377283927a2cdef6ef902a6f`
> - Evidencia: 77/77 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 1/1 archivos tienen blob idéntico al del squash y 1/1 al de master.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#81**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `5578aab12a0aced3990eef9b576290012bc6e339`
> - Evidencia: 371/372 líneas añadidas (> 25 car.) y 1/14 borradas están en el squash `f3d7678` (#96). 54/56 archivos tienen blob idéntico al del squash y 51/56 al de master. Sus 13 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master. La línea restante, la lista de exportaciones de View3D, está combinada con #90 (similitud 1,00). Sus 13 líneas borradas fuera del squash son del diálogo de #78 y no están en master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 3/3 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#80**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `8e5cf9a010bbadb3536822b2ac88f02105fa19af`
> - Evidencia: 384/384 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 12/13 archivos tienen blob idéntico al del squash y 11/13 al de master.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#79**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `97c8578a6417524f81793eea4c2de31417a61154`
> - Evidencia: 360/363 líneas añadidas (> 25 car.) y 10/10 borradas están en el squash `f3d7678` (#96). 44/49 archivos tienen blob idéntico al del squash y 44/49 al de master. Las 3 líneas restantes son `clear()`/`open()` de la lámina y una prueba de red, combinadas con #72 y #73 (similitud 0,93–0,97).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 4/5 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#78**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR fue sustituida por #81 → #96 y su contenido está en master.
> - HEAD de esta PR: `bcf2ec6c03ebd0fa910567636217194ca44cb959`
> - Evidencia: 139/152 líneas añadidas (> 25 car.) y 12/12 borradas están en el squash `f3d7678` (#96). 1/5 archivos tienen blob idéntico al del squash y 1/5 al de master. «Compartir imagen» existe en master (`presentationShare`, `canShare`, `wa.me`), con la versión que amplió #81 (formatos y contacto).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#76**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `f800c7d5b97080e0ea488e38c89a83bb9564da4e`
> - Evidencia: 106/106 líneas añadidas (> 25 car.) y 0/3 borradas están en el squash `f3d7678` (#96). 1/4 archivos tienen blob idéntico al del squash y 0/4 al de master. Sus 3 líneas borradas fuera del squash son líneas de su PR base que nunca llegaron a master; comprobado que hoy no están en master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#75**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `dd2e81a74c664f5d4a6536b9942616d3f21bb431`
> - Evidencia: 348/348 líneas añadidas (> 25 car.) y 13/13 borradas están en el squash `f3d7678` (#96). 4/7 archivos tienen blob idéntico al del squash y 1/7 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 3/3 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#74**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `a815498c9c2333b6c557bf7a14bf3f7d8d6276f6`
> - Evidencia: 133/133 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 3/5 archivos tienen blob idéntico al del squash y 3/5 al de master.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#73**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `213b6ecad99452761e6851224c4a976b44db7595`
> - Evidencia: 321/325 líneas añadidas (> 25 car.) y 26/26 borradas están en el squash `f3d7678` (#96). 7/12 archivos tienen blob idéntico al del squash y 7/12 al de master. Las 4 líneas restantes son pruebas de red y de la bienvenida, reescritas en el propio #96 (similitud 0,88–0,90).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/2 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#72**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `bb4639c0d8ba1c86c33ffb4613ebac22eb5bb66a`
> - Evidencia: 133/135 líneas añadidas (> 25 car.) y 10/10 borradas están en el squash `f3d7678` (#96). 6/8 archivos tienen blob idéntico al del squash y 6/8 al de master. Las 2 líneas restantes son `clear()`/`open()` de la lámina, combinadas con #79 (similitud 0,93–0,94).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 1/1 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#71**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR entró en `master` con el squash `f3d7678` (#96, «Integración funcional de Rubik Sota»). Su contenido está en master.
> - HEAD de esta PR: `aba44e387d9bd57b54fbd915a638347de0c83267`
> - Evidencia: 6927/6935 líneas añadidas (> 25 car.) y 58/58 borradas están en el squash `f3d7678` (#96). 86/96 archivos tienen blob idéntico al del squash y 85/96 al de master. De las 8 líneas restantes, 5 son textos que #96 cambió: la acción `copy` pasó de «Crear mi vivienda desde el ejemplo» a «Crear mi copia» (`js/journey-core.js`, similitud 0,97), y 3 son tablas del documento. Las otras 2 son de la fila «Ver todas las herramientas» y del aviso del ejemplo, que en master distingue si el ejemplo se ha cambiado (similitud 0,64 y 0,37: evolución, no pérdida).
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 2/4 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#70**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR fue sustituida por #73 → #96 y su contenido está en master.
> - HEAD de esta PR: `f28442e8c5182c968ace0c48d4e8fbac5a33bdc5`
> - Evidencia: 58/79 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 0/5 archivos tienen blob idéntico al del squash y 0/5 al de master. El selector de perfil (`welcomeAudience`) está en master; #73 («Entrada profesional: #70 + respuesta del perfil») reescribió su texto y el documento de propuesta.
> - Pruebas de esta PR ejecutadas sobre `master@f5c08c7efc0a`: 1/1 suites en verde.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#36**

> Cierre documental (GOV-02), verificado el 2026-11-13 sobre `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`.
> 
> Esta PR fue sustituida por `5c24490` + `61efd05` y su contenido está en master.
> - HEAD de esta PR: `d7f0972149b5605f6092290c5f7c4adcbc5f9029`
> - Evidencia: 0/614 líneas añadidas (> 25 car.) y 0/0 borradas están en el squash `f3d7678` (#96). 5/9 archivos tienen blob idéntico al del squash y 5/9 al de master. Los 9 archivos existen en master, 5 de ellos idénticos. No pasaron los avisos de Casa Serra de README, ROADMAP y ROADMAP-2 (§13); la autorización y la licencia constan en `docs/technical/casa-serra-integration.md`.
> 
> No se fusiona: el parche ya no aplica sobre master. Cerrarla no recupera ni activa nada. La rama y su historial se conservan.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_


### L4

**#211**

> Cierre por sustitución (GOV-02), **tras la fusión de #219**. Esta PR está contenida en #219: su HEAD `55c9bb0` es ancestro de `b942a6d`. La reconciliación final de OBR-02/03 sobre master se hizo en #219. Se cierra sin fusionar y la rama se conserva.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#210**

> Cierre por sustitución (GOV-02), **tras la fusión de #219**. Esta PR está contenida en #219: su HEAD `5cb4a32` es ancestro de `b942a6d`. La reconciliación final de OBR-02/03 sobre master se hizo en #219. Se cierra sin fusionar y la rama se conserva.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#193**

> Cierre por sustitución (GOV-02). Esta PR fue normalizada en #203 («SCULPT-R02-A normalizado»), que conserva el núcleo (el 87 % de las líneas JS de esta PR está en #203) sobre el master actual. Se cierra sin fusionar; la rama y sus capturas se conservan como evidencia del laboratorio original.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#167**

> Cierre por consolidación (GOV-02). Esta PR está contenida en #169: su HEAD `fe876c1` es ancestro de `ce70f85`. La decisión sobre la línea VQ-01/F03 se toma sobre #169. Se cierra sin fusionar y la rama se conserva.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#166**

> Cierre por sustitución parcial (GOV-02). Lo útil de esta PR se rescató selectivamente sobre `master`: contrato #189, API segura #200 y visor/minimapa #201 («Rescate selectivo del visor/minimapa de #166»). Lo que no se rescató, la publicación al cliente, quedó fuera a propósito, a la espera de GOV-08 y una autorización aparte. Fusionar esta PR desharía la separación de permisos GOV-08 S1. Se cierra sin fusionar y la rama se conserva como referencia.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#165**

> Cierre por consolidación (GOV-02). Esta PR está contenida en #169: su HEAD `894607b` es ancestro de `ce70f85`. La decisión sobre la línea VQ-01/F03 se toma sobre #169. Se cierra sin fusionar y la rama se conserva.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_


### L5

**#194**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#164**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#162**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#160**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#89**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#77**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.

**#64**

> Cierre como histórica (GOV-02/GOV-04). Documento de trabajo de su fecha, superado por el estado documental actual de `master`. Se cierra sin fusionar y la rama se conserva para consulta.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#61**

> Cierre como histórica (GOV-02/GOV-04). Documento de trabajo de su fecha, superado por el estado documental actual de `master`. Se cierra sin fusionar y la rama se conserva para consulta.
> 
> ---
> _Generated by [Claude Code](https://claude.ai/code)_

**#48**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.


## 9. Inventario completo (67)

| PR | Título | Cat. | Lote | Anc. | patch-id | % líneas en master | apply −R / + | Exclusivos | Acción |
|---|---|---|---|---|---|---|---|---|---|
| #220 | [DRAFT · ACTIVACIÓN PROPUESTA] UX-07 «Comparar con el original» en Var | C | Integración 2 | no | 0/2 | 0% | F / T | 14 | NO tocar (Claude A). Revisión del propietario y GO de activación. |
| #219 | OBR-02/03 · reconciliación final de #211 sobre master@f5c08c7 + cierre | C | Integración 1 | no | 0/16 | 0% | F / T | 44 | NO tocar (Claude B). Esperar CI verde y GO del propietario. Después, cerrar #210 y #211. |
| #217 | [DRAFT][R02-A R1] Puente puro de techos con el editor (laboratorio) | D | Decisión humana | no | 0/1 | 0% | F / F | 3 | Mantener con #203. |
| #216 | UX-07 · Adaptador mínimo Variantes → comparador (puro) y apertura en s | A | L1 | sí | 1/1 | 100% | T / F | 0 | Cerrar sin fusionar (ya en master). |
| #215 | [REVISIÓN · NO FUSIONAR] R03 dentro del editor real: conexión propuest | D | Integración 3 (tras GO) | no | 0/7 | 0% | F / T | 16 | NO tocar. Prueba C humana y GO de activación R03; GOV-05 sigue como riesgo. |
| #212 | ENT-04 fase 2 · Coherencia entre revisiones y presupuestos (laboratori | A | L1 | sí | 4/4 | 100% | F / F | 0 | Cerrar sin fusionar (ya en master). |
| #211 | Integración OBR-02/OBR-03 (#210) sobre master con OBR-01 (#207) | B | L4 (tras #219) | no | 0/14 | 0% | F / T | 44 | NO tocar ahora. Cerrar cuando #219 se fusione. |
| #210 | OBR-02 + OBR-03 · Evolución 4D: siguiente tarea en fantasma, anillo «% | B | L4 (tras #219) | no | 0/5 | 0% | F / F | 15 | NO tocar ahora. Cerrar cuando #219 se fusione. |
| #205 | [DRAFT][SCULPT-R01 · corte 2] cancelación real y puente al evaluador F | D | Decisión humana | no | 0/1 | 0% | F / F | 8 | Mantener con #191. |
| #204 | [DRAFT][MCP ETAPA 2 · ENDURECIMIENTO] (apilada sobre #197) | D | Decisión humana | no | 0/3 | 1% | F / F | 5 | Mantener con #196 y #197. |
| #203 | SCULPT-R02-A normalizado · techos y equipos altos (laboratorio, NO fus | D | Decisión humana | no | 1/5 | 0% | F / F | 27 | Mantener. Hoja de decisión R02-A. |
| #197 | [DRAFT][MCP ETAPA 2 · VALIDACIÓN] stdio real, Playwright, vídeos y aud | D | Decisión humana | no | 0/3 | 0% | F / T | 197 | Mantener con #196. |
| #196 | [DRAFT][MCP ETAPA 2] Propuestas explicables de distribución sin escrit | D | Decisión humana | no | 0/3 | 0% | F / T | 5 | Mantener. Gate: dato real autorizado. |
| #194 | [LAB] SCULPT-R03 · armarios paramétricos | E | L5 (tras GO R03) | no | 0/4 | 0% | F / T | 38 | Mantener como evidencia hasta el GO R03 (#215). Después, cerrar como histórica. |
| #193 | SCULPT-R02-A — LABORATORIO DE TECHOS Y EQUIPOS. NO INTEGRADO. | B | L4 (decisión R02-A) | no | 0/7 | 0% | F / T | 27 | Cerrar cuando el propietario adopte #203 como laboratorio R02-A canónico (hoja de decisión R02-A). |
| #191 | lab(sculpt-r01): reconocimiento raster del donante R01 — laboratorio N | D | Decisión humana | no | 0/10 | 0% | F / T | 18 | Mantener. Gate F2 (datos reales autorizados). |
| #169 | F03: fidelidad material reversible de fachadas | D | Decisión humana | no | 0/57 | 0% | F / F | 167 | Decisión del propietario: rehacer F03 desde master o archivar. |
| #167 | Rubik Hero Architectural Fidelity V2 | B | L4 (decisión VQ-01) | no | 0/44 | 0% | F / F | 58 | Cerrar a favor de #169 cuando el propietario decida VQ-01/F03 (auditoría de oportunidades 09/11, §193). |
| #166 | Delivery 3D Client Experience V1 — visita 3D desde «Entregar» (borrado | B | L4 (decisión ENT-01) | no | 0/11 | 27% | F / F | 36 | Cerrar cuando el propietario confirme que ENT-01 sigue por #189/#200/#201. Actualizar la ficha ENT-01 del catálogo, que aún dice «PR #166: ponerla al día». |
| #165 | VQ-01 CP2 — VISUAL_PARTIAL_ACCEPT_FOUNDATION · draft, NO MERGE | B | L4 (decisión VQ-01) | no | 0/21 | 0% | F / F | 19 | Cerrar a favor de #169 cuando el propietario decida VQ-01/F03 (auditoría de oportunidades 09/11, §193). |
| #164 | docs: cierre CP2 con aceptación parcial humana + roadmap Visual Famili | E | L5 (GOV-04) | no | 0/7 | 0% | F / T | 3 | Decidir junto con VQ-01 (#169). |
| #162 | docs(research): trazabilidad visual VECINIA y registro de 3 referencia | E | L5 (GOV-04) | no | 0/1 | 0% | F / T | 1 | GOV-04: incorporar o archivar. |
| #161 | docs(legal): propuesta de protección contra ingeniería inversa y extra | D | Decisión externa | no | 0/2 | 0% | F / T | 1 | Mantener abierta hasta la revisión jurídica externa. |
| #160 | docs: reconcile current status and add multi-agent operating protocol | E | L5 (GOV-04) | no | 0/45 | 0% | F / T | 58 | GOV-04: decidir si `docs/ops/` pasa a master. |
| #151 | FT3D-1b «Entrar en la estancia»: descenso continuo y reversible | A | L2 | no | 1/1 | 88% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #150 | FT3D-1a «Empezar desde el plano»: capítulo opcional de la Presentación | A | L2 | no | 1/2 | 91% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #149 | Fase C · C3: precios de referencia desde un BC3 propio y exportación B | A | L2 | no | 1/1 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #148 | Fase C · C2: presupuesto operativo | A | L2 | no | 0/2 | 94% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #147 | Fase C · C1: cantidades del proyecto con estado y CSV | A | L2 | no | 1/1 | 99% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #146 | Fase B · B8: alternativas de materiales y estilo con IA | A | L2 | no | 1/1 | 92% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #145 | Fase B · B7: material board | A | L2 | no | 1/1 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #143 | Fase B · B6: comentarios anclados | A | L2 | no | 1/1 | 99% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #142 | Fase B · B5: «Envíanos tu plano» | A | L2 | no | 1/1 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #141 | Fase B · B4: enlace para el cliente (Vercel Blob) con vídeo | A | L2 | no | 1/1 | 82% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #140 | Fase B · B3: vídeo del recorrido con vista previa y descarga | A | L2 | no | 1/1 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #139 | feat(product): Render IA desde vistas reales (Fase B · B2) | A | L2 | no | 0/2 | 89% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #138 | feat(product): archivo autocontenido para el cliente (Fase B · B1) | A | L2 | no | 0/2 | 93% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #137 | feat(product): dossier profesional automático con estilos (A4) | A | L2 | no | 0/2 | 96% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #136 | feat(product): Analizar visual e informe de orientación y emplazamient | A | L2 | no | 0/2 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #135 | feat(product): vistas automáticas reales del proyecto (A2) | A | L2 | no | 0/2 | 100% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #134 | feat(product): iniciar Project-First Experience (A1) | A | L2 | no | 0/2 | 99% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #133 | feat(ux): Punto 9 — reorganización profesional y descubribilidad | A | L2 | no | 0/7 | 96% | F / F | 0 | Cerrar sin fusionar, de la cima de la pila hacia abajo, sin borrar ramas. |
| #90 | fix(walk): real movement from the entrance, doors with E/tap, clear en | A | L3 | no | 0/9 | 100% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #89 | docs(product): recorrido protagonista, revisión profesional y vídeo en | E | L5 (GOV-04) | no | 0/1 | 0% | F / T | 1 | GOV-04: incorporar o archivar. |
| #88 | Presentación: la vista general cabe entera junto a la tarjeta (hallazg | A | L3 | no | 0/1 | 90% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #87 | Muebles: añadir o duplicar nunca los superpone sin avisar (hallazgo 12 | A | L3 | no | 0/4 | 100% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #86 | Guía: etapa coherente con la tarjeta (apilada sobre #76) | A | L3 | no | 0/9 | 96% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #85 | Editor de escritorio: columnas abiertas por defecto y respeto de la el | A | L3 | no | 0/5 | 99% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #84 | Tarjeta de presentación: navegación del cliente primero | A | L3 | no | 0/1 | 95% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #83 | docs(product): vídeo del recorrido descargable y compartible — estudio | A | L3 | no | 0/1 | 100% | T / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #82 | docs(product): «Puntos de interés» — estudio | A | L3 | no | 0/2 | 100% | T / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #81 | Imagen de entrega profesional (apilada sobre #78) | A | L3 | no | 0/11 | 95% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #80 | docs(product): programa de creación y entrega profesional | A | L3 | no | 0/13 | 78% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #79 | Corrige defectos que ya fallan en master (F1b, F2, P07, P13) | A | L3 | no | 0/8 | 96% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #78 | «Compartir imagen» desde la presentación (resultado 3) | B | L3 | no | 0/9 | 90% | F / F | 0 | Cerrar sin fusionar, después de #81. |
| #77 | docs(product): estudiar exterior, mobiliario 3D, visita, ubicación y v | E | L5 (GOV-04) | no | 0/1 | 0% | F / T | 1 | GOV-04: incorporar o archivar. |
| #76 | Bienvenida: «Recórrela en 3D» y «Soluciones» (resultado 1) | A | L3 | no | 0/4 | 96% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #75 | Observaciones del cliente por archivo, sin servidor | A | L3 | no | 0/8 | 93% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #74 | «Del plano a la vivienda»: procedencia y precisión | A | L3 | no | 0/3 | 100% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #73 | Entrada profesional: #70 + respuesta del perfil (apilada sobre #71) | A | L3 | no | 0/9 | 97% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #72 | Lámina a escala 1:50/1:100/1:200 (resultado 4) | A | L3 | no | 0/3 | 99% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #71 | Orientación del recorrido: la guía propone la siguiente acción real | A | L3 | no | 0/28 | 100% | F / F | 0 | Cerrar sin fusionar, apiladas primero (#86→#76→#73→#71; #81→#78). |
| #70 | Entrada profesional opcional y plan de entrega al cliente | B | L3 | no | 0/2 | 71% | F / F | 0 | Cerrar sin fusionar. |
| #64 | docs: reconcile MCP route audit and UX roadmap status | E | L5 (GOV-04) | no | 0/3 | 0% | F / T | 0 | Archivar (cerrar como histórica). |
| #61 | docs: handoff completo para continuar Floorplan | E | L5 (GOV-04) | no | 0/2 | 0% | F / T | 1 | Archivar (cerrar como histórica). |
| #48 | docs: estudio LoRA LAB para el gate de Roadmap 2 §3.4 | E | L5 (GOV-04) | no | 0/17 | 0% | F / T | 19 | Decidir GOV-04: incorporar `docs/technical/loralab-study-*` o archivar. |
| #36 | docs: preparar integración visual de Casa Serra en Floorplan | B | L3 | no | 0/3 | 92% | F / F | 0 | Cerrar sin fusionar. |

*La columna «patch-id» compara cada commit propio con los commits sin *merge* de master. En #133–#151 la coincidencia con el commit `integration:` se calcula sobre el delta completo (`succ-133.tsv`), y es la que se usa como prueba.*

### Reproducir

```bash
cd floorplan-3d
git fetch origin '+refs/pull/*/head:refs/remotes/pr/*' '+master:refs/remotes/origin/master'
git worktree add --detach /tmp/mw origin/master
python3 -I audit.py . prs.tsv /tmp/mw > metrics.tsv
python3 -I succ.py . metrics.tsv 133=6411179 134=a88c724 … 151=579189d > succ-133.tsv
python3 -I succ.py . metrics.tsv 70=f3d7678 71=f3d7678 … 36=f3d7678 > succ-96.tsv
python3 -I classify.py && python3 -I build_md.py
```

