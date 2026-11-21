# RUBIK SOTA — Corte operativo verificado V5 (21/11/2026)

> **Vigencia y precedencia.** Corte de lectura **21/11/2026, 03:35–03:37 (Europa/Madrid)**. Esta es la **fotografía operativa más reciente** de la presente propuesta documental. Prevalece sobre afirmaciones temporales de V4 y sobre párrafos históricos de los documentos anteriores, **solo en los extremos contrastados aquí**. Reconsultar GitHub, CI y Vercel antes de cada decisión; los checks cambian durante la sesión. La V4 del 20/11 se conserva como histórico. **No autoriza** merge, despliegue, migración, activación, gasto ni aceptación profesional.

## 1. Procedencia, autoridad y alcance

- **Producto:** [`Juanmaes83/floorplan-3d`](https://github.com/Juanmaes83/floorplan-3d), rama `master`; GitHub REST autenticado, ramas, PR y sus check-runs del HEAD exacto. **Vercel Production** verificada mediante despliegues autenticados, con coincidencia SHA/master. **Laboratorio:** [`Juanmaes83/rubik-sculpt-simulator-lab`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab), handoff de HERO FINAL publicado.
- **Fuente de continuidad previa:** inventario V4 del 20/11, y los **7 commits documentales** de `codex/continuidad-post297@ab467df33c93298a81a2afeb6c679f4d0b88f8df`, en ese momento **7 por delante y 0 por detrás** de `master`; se preservan por ascendencia, sin modificar la rama ajena.
- **Verificado directamente:** identidades, PR, check-runs, Production y estados de rama. **Reportado por Codex/CC1:** pruebas locales dirigidas y visuales, identificadas como tales. **No realizado aquí:** nueva ejecución de suites de producto, revisión humana de vídeo, navegador físico, certificación o pruebas de seguridad externas.
- **Jerarquía:** código/contratos de producto + GitHub real + Production real → este corte temporal → handoffs de agente por SHA → V4/V3 y planes históricos. El plan y matriz v1.12 conservan sus **98 IDs / 23 piedras**; sus cifras históricas no se recalculan a partir del número de PR.

## 2. Producto y Production: identidad exacta

| Comprobación | Resultado |
|---|---|
| `master` | `cf0b50128603c6064ce45837e749772ab32df23e` |
| Árbol de `master` | `2f8d5f21d8fc912a08d7f681f2c1e545f104bd89` |
| Último merge | [#297 R03 + localización ES/EN/ZH](https://github.com/Juanmaes83/floorplan-3d/pull/297), merge `cf0b5012...` |
| Penúltimo merge | [#295 Simulator A](https://github.com/Juanmaes83/floorplan-3d/pull/295), merge `a6a0494b6f15ed60db542ef6c95530ae3c2c0ca2` |
| Production | `dpl_FtYL4vQ45xRE6Cn2GzQNe2zt1rAd` **READY**, rama `master`, SHA `cf0b5012...` exacto; [Inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/FtYL4vQ45xRE6Cn2GzQNe2zt1rAd) |
| CI posfusión #295 | **8 workflows push / 8 success** verificados por API de runs del SHA `a6a0494b...` |
| CI posfusión #297 | **0 runs para SHA `cf0b5012...`** en consulta API de Actions; estado Vercel success **no sustituye** CI posfusión. No afirmar posfusión verde |
| Abiertas | **13 PR** en total; ninguna de #298–#301 fusionada al corte |

**La reparación Redis de #295 y el cierre R03 de #297 ya no son tareas de integración pendientes.** Simulator A está en el producto; OP-07 irregular sigue desactivado. R03 añade holguras de solo lectura y editor localizado; no certifica fabricación ni altera los nombres originales guardados.

## 3. CI del HEAD publicado: lectura directa, sin mezclar Vercel y Actions

Los valores siguientes proceden de `GET /commits/{SHA}/check-runs?per_page=100`. GitHub expone además un **status context Vercel** separado; por eso los totales mostrados en la UI pueden superar en 1 los check-runs aquí contados. **No usar la aprobación de Vercel para rellenar un check de Actions.**

| PR / HEAD corto | Actions OK | Actions en curso | Actions pendientes | Fallos | Omisiones | Estado Vercel | Gate |
|---|---:|---:|---:|---:|---:|---|---|
| [#298 R02-A](https://github.com/Juanmaes83/floorplan-3d/pull/298) `f3a6d231` | **91** | **1** | 0 | 0 | 1 | success | **CI no completa** |
| [#299 Studio E3](https://github.com/Juanmaes83/floorplan-3d/pull/299) `33aee9dc` | **0 de producto** | 0 | 0 | 0 | 0 | success (único check-run visible) | **CI no acreditada** |
| [#300 idioma transversal](https://github.com/Juanmaes83/floorplan-3d/pull/300) `56c48411` | **85** | **7** | 0 | 0 | 1 | success | **CI no completa** |
| [#301 cámara/foco](https://github.com/Juanmaes83/floorplan-3d/pull/301) `0d80abe6` | **91** | 0 | 0 | **1** | 1 | success | **NO-GO** |
| [#296 corrección fuente caché](https://github.com/Juanmaes83/floorplan-3d/pull/296) `0dd5e0af` | 28 | 0 | 0 | 0 | 1 | separado | No fusionar en producto aparte |
| [#271 UX Perla](https://github.com/Juanmaes83/floorplan-3d/pull/271) `60116e8b` | 90 | 0 | 0 | **2** | 1 | separado | NO-GO / base antigua |

**Evolución respecto al informe Codex 03:31:** #298 pasó de 2 a 1 en curso y #300 pasó de 78 a 85 OK y de 15 a 7 en curso, en las consultas directas posteriores. #299 solo cuenta evidencia Vercel. Las cifras quedan congeladas en este corte, no son un monitor automático.

**#301 — fallo demostrado, causa NO demostrada.** El workflow [CAT-IA, job browser](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44852929212/job/136688285130) terminó rojo en `tests/professional-workspace.browser.test.cjs`, caso `Point9 saved studio identity, legacy shortcuts, guide delivery and exterior route`: `locator.click: Timeout 10000ms exceeded`, esperando `#welcomeContinue` tras recarga; **23 PASS / 1 FAIL** en esa suite. La ejecución aislada local en master y #301 que comunica Codex **no prueba** que el fallo remoto sea flake; analizar estado de bienvenida, secuencia, test y posible regresión sin relajar aserciones ni reintentar a ciegas. El workflow de Presentación verde no borra este fallo.

**#299:** dos elementos favorables de Vercel en la vista agregada, pero ningún workflow de producto en Actions para el HEAD exacto, sin aceptar CI verde. La Preview READY y las pruebas locales E3 7/7, 15/15 y contratos comunicados por Codex no sustituyen Actions ni aceptación visual.

**#300:** Codex comunica 49/49 pruebas locales sobre `56c48411`; el corte CC2 comunicó 41/41 en origen. No confundir ninguna con toda la CI remota. La PR combina Home, navegación, Construir, Amueblar y Propiedades; otras superficies siguen fuera, por lo que **RUBIK entera NO está traducida**. Política transversal: no mostrar chino en ES/EN, mantener el nombre canónico guardado y usar `FloorPlanDisplayName`/embudo `nm()` sin almacenes paralelos.

## 4. Candidatas abiertas y límites de integración

| PR | Identidad / árbol declarado | Qué está preparado; qué falta |
|---|---|---|
| [#298 R02-A](https://github.com/Juanmaes83/floorplan-3d/pull/298) | HEAD `f3a6d2314c334ab7964310bfe21efbd59803eee2`; base `cf0b5012...`; árbol `4bc68adf1c507ffb6e7107293d3e7bef5a965818` | Techos ES/EN/ZH y aviso de paso libre **experimental / informativo / no normativo / sin bloqueo**. Incluye por ascendencia el único arreglo de caché de #296. Esperar CI completa, permiso por objeto exacto y validación adicional |
| [#299 STUDIO E3](https://github.com/Juanmaes83/floorplan-3d/pull/299) | HEAD `33aee9dca8b0f826dd0189b4bc79fe4b1f08434e`; base `cf0b5012...`; árbol `6235e55dc506cdbf5c2d86ec2521b7c69fc6a68c` | Diez fichas delegadas, Preview lista; pendiente CI remota, aceptación visual y permiso. Firma Blender de ejemplo separada de OP-10 |
| [#300 idioma](https://github.com/Juanmaes83/floorplan-3d/pull/300) | HEAD `56c48411a2b8e75c65de5366bb7c8de52dc4fc47`; base `cf0b5012...`; árbol `112ebed01b10eefbb15cbad4c32b028921fa669d` | Cortes CC2 integrados **en esta PR**, no republicarlos. CI parcial, Preview/aceptación de HEAD consolidado y permiso pendientes |
| [#301 Presentación](https://github.com/Juanmaes83/floorplan-3d/pull/301) | HEAD `0d80abe638fff4cbaf2a7830ecb6a4be2f0f68f8`; base `cf0b5012...`; árbol `e6fdd77146bf92b184a3faca71c7a28bc0cf5549` | Espera estabilización del visor 3D y restaura foco; fallo CAT-IA remoto sin causa raíz confirmada |
| [#296 caché fuente](https://github.com/Juanmaes83/floorplan-3d/pull/296) | HEAD `0dd5e0afcbc6eaf808bf8f0abeb3be2a93a9b081`, **base `claude/r02a-aceptacion`, NO master** | No duplicar en producción: corrección transportada por #298. Mantener como evidencia de origen/revisión |
| [#271 Perla](https://github.com/Juanmaes83/floorplan-3d/pull/271) | HEAD `60116e8bed31146dd764fd04937165d91be833e8`; base antigua `8e917e1a...` | Reconciliar con master, dos jobs rojos, aceptación de UX y tests; NO-GO |

**Restricción R02-A:** altura 2100 mm y banda 220 mm sobre `FloorPlanPresentationRoute.plan` no constituyen recorrido de personas reglamentario. No bloquear ni certificar, no modificar guardado/undo o contrato `x-r02a-ceiling`; GOV-05 sigue abierto.

**Las otras 7 PR abiertas permanecen congeladas:** [#267 OP-07](https://github.com/Juanmaes83/floorplan-3d/pull/267), [#273 A0](https://github.com/Juanmaes83/floorplan-3d/pull/273), [#274 F0.2c](https://github.com/Juanmaes83/floorplan-3d/pull/274), [#276 backup](https://github.com/Juanmaes83/floorplan-3d/pull/276), [#277 migración](https://github.com/Juanmaes83/floorplan-3d/pull/277), [#278 UI F0.3](https://github.com/Juanmaes83/floorplan-3d/pull/278) y [#279 acciones F0.3](https://github.com/Juanmaes83/floorplan-3d/pull/279). Ningún verde de una PR distinta levanta estos HOLD. R1 exige carrera real de escritores, WebKit y pruebas 7 días antes de migrar.

## 5. Entregas publicadas sin fusión / no confundir con master

- **HERO FINAL A+B+C, CC1:** [`claude/hero-final-candidata@a8c1e379b46fc8ba6e2ba0ba1519bc08ce80b620`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/a8c1e379b46fc8ba6e2ba0ba1519bc08ce80b620); [handoff exacto](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/a8c1e379b46fc8ba6e2ba0ba1519bc08ce80b620/COMPONENTES/A-construccion-procedural/final-hero/HANDOFF-HERO-FINAL.md). **A 13/13, B 11/11, C 3/3** comunicados en copia de `master@cf0b5012`. Vídeos reales; cierre parcial honesto; STUDIO en Mi estudio, Home y Entregar, `FloorPlanBrand` y compositor único. Handoff prepara parches diferenciados para master y escenario #299. **No integrado:** Codex debe ejecutar QA sobre árbol reconciliado, validar con #299/#300/#301 según orden real, CI, ES/EN, FF/WebKit, dispositivos y aceptación visual. Chromium/SwiftShader y móvil emulado no acreditan hardware real.
- **Continuidad Codex:** rama `codex/continuidad-post297@ab467df33c93298a81a2afeb6c679f4d0b88f8df`, 7 commits documentales por delante, todavía fuera de master. Los párrafos antiguos sobre bloqueo/HTTP 422 de Actions **son expedientes históricos**: el corte actual muestra nuevas ejecuciones. Mantener los siete commits en la candidata documental, no modificarlos ni reescribir su historia.
- **OP-05 GLB privados P1–P4:** evidencia LAB y compatibilidad posterior a #294, **sin PR productiva ni merge acreditados aquí**; preservar privacidad, tiempos F3 público/privado, descargas GLB/MP4 y WebKit; **C1 NO-GO, P5–P8 inactivos**.
- **OP-11 lote 02:** seis modelos en laboratorio según V4; licencias, revisión visual, F3, navegadores y autorización de lote independientes pendientes.
- **Simulator D, Studio F03 V2 y OP-04 Perla:** cola propia, no absorber en otro corte ni afirmar cierre.
- **R01 y GOV-05:** HOLD / expediente jurídico pendiente. **Simulator F:** HOLD. No abrir motores duplicados ni nuevos servicios/costes por inferencia.
- **Localización CC2:** el corte publicado está incorporado al HEAD `56c48411` de **#300**. No relanzar la publicación ni tratar la evidencia de la rama fuente como Production.

## 6. Decisiones y orden técnico sin crear nuevas olas

1. **#298:** confirmar fin de todos los checks exigidos sobre el SHA exacto; revisar árbol, Preview y límites orientativos. Solicitar **autorización independiente de fusión**; después, solo si se autoriza, merge commit, CI posfusión, Production y rollback documentado.
2. **#301:** diagnosticar el único fallo CAT-IA de `#welcomeContinue` contra master y su secuencia de estado. Publicar nueva identidad solo si hay cambio causal o evidencia suficiente; exigir CI completa verde antes de solicitar fusión.
3. **#299:** acreditar Actions para el HEAD, compatibilidad con #298 si este se integra antes y aceptación visual. Vercel READY no es CI.
4. **#300:** terminar sus checks, verificar Preview sobre HEAD consolidado, idioma completo en el **alcance de esa PR** y compatibilidad con cámara #301. No fusionar por cifras parciales.
5. **Documentación:** preservar los siete commits de Codex y añadir este delta actual, marcado por fecha; actualizar los índices/estado/handoff para remitir aquí. No cambiar la clasificación histórica de 98 IDs sin auditoría fila a fila.
6. **HERO FINAL A+B+C:** preparar una sola candidata después de los gates pertinentes, reconciliando los cambios de STUDIO E3, idioma y presentación. Reutilizar motores y recursos; pedir aceptación humana final.
7. **OP-05, OP-11 lote 02, OP-04 #271, Simulator D, F03 V2:** cola visible e independiente. **A0/F0, R01, OP-07, GOV-05, OP-05 C1** siguen con sus NO-GO.
8. **Cada corte:** HEAD, padre/base, árbol, checks obligatorios exactos, aceptación/mandato, merge, CI posfusión, Production SHA y rollback. No reintentos sin causa ni cambios furtivos entre frentes.

## 7. Dictamen

**Avance demostrado:** #295 y #297 están fusionadas y desplegadas; Actions volvió a ejecutarse; #298 y #300 avanzan, aunque no están completamente verdes; #301 mantiene un fallo real; #299 no dispone de CI de Actions; HERO A+B+C muestra una candidata conjunta en laboratorio (no integración). **Bloqueo central:** terminar y reconciliar gates actuales sin extender alcance ni ignorar los límites de seguridad y aceptación.

> **Este documento es una actualización documental, no una liberación de producto.** Su fecha y hashes impiden confundirlo con estados posteriores.