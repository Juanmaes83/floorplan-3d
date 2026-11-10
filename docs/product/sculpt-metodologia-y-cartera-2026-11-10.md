# RUBIK SOTA — SCULPT: metodología transversal y cartera de piedras

**Fecha:** 10/11/2026 · **Estado:** INVENTARIO Y RECONCILIACIÓN DOCUMENTAL, PROPUESTA PARA REVISIÓN.  
**Autoridad de prioridades y decisiones:** [Catálogo maestro único de mejoras](rubik-catalogo-maestro-mejoras-2026-11-09.md), incluidas sus olas 0–5.  
**Autoridad técnica histórica:** [Roadmap canónico](../ROADMAP.md).  
**Alcance de este documento:** investigación y método. **No autoriza** clonación, integración, gasto, merge, publicación, accesos de terceros o cambios de prioridad.

> **Regla de gobierno:** SCULPT es un método de reutilización y ejecución de mejoras ya catalogadas, **no un nuevo roadmap ni una nueva ola**. Las piedras R01–R03 son alias de investigación, no IDs maestros. Ante una ausencia de equivalencia, registrar **PENDIENTE DE DECISIÓN**, nunca inventar otra mejora ni cambiar la ola existente.

## 1. Qué sabemos, qué no sabemos y de dónde procede

Se identifican **3 familias donantes principales con PR y SHA contrastados** y **13 áreas de oportunidad G0–G12** en la investigación del ecosistema. Las 13 áreas no son 13 módulos implementados, ni autorizaciones, ni pruebas de calidad. No consta en este repositorio un baseline SCULPT-R01 ejecutado ni una validación profesional de los donantes. Los informes adjuntos a conversaciones externas no equivalen a archivos presentes en GitHub: no declarar leído ni completo lo que no esté accesible.

Fuentes metodológicas comprobables, cuya autoridad permanece en sus repositorios de origen:

1. [20 · SCULPT Methodology (RUBIK FUNDING OS)](https://github.com/Juanmaes83/SUBVENCIONES-PYMES/blob/main/docs/20-SCULPT-METHODOLOGY.md). Documenta SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE; antecedente declarado SCULPT-T1 BDNS REAL.
2. [28 · Cross-repo cloning with GitHub Actions (VECINIA)](https://github.com/Juanmaes83/VECINIA-WORLDS/blob/main/docs/28-CROSS-REPO-CLONING-WITH-GITHUB-ACTIONS.md). Distingue snapshot fiel y adaptación; registra SHA, ficheros críticos y procedencia; documenta rechazo de blob SHA cruzado y carrera de push.
3. [Sculpture → Surgery (VECINIA / Costa Blanca)](https://github.com/Juanmaes83/VECINIA-WORLDS/blob/main/docs/ROADMAP_SCULPTURE_TO_SURGERY_AVATAR_NAVIGATION.md). Escultura por cortes verificables y cirugía posterior con una sola autoridad de navegación/cámara/estado.
4. Antecedente local en RUBIK: [pipeline F3 / Asset Lab](../../scripts/f3-pipeline/integrate.mjs), con hash, inventario, permisos y salida normalizada. Es aplicación de principios de trazabilidad, no prueba de que todo SCULPT esté ya integrado.
5. [F2 — protocolo de entrada](../qa/F2-entry-protocol.md), [F2 — prototipo de muros](../technical/F2-wall-assist.md) y [contratos y roadmap técnicos](../ROADMAP.md) son autoridades para el reconocimiento y su validación, no se sustituyen.

Cuando las fuentes difieran, aplicar la precedencia del catálogo maestro: decisión del propietario > código vigente comprobado > documentación reciente > antecedentes. Registrar conflictos, no resolverlos por suposición.

## 2. Método reproducible: CLONAR → ESCULPIR → PULIR → CIRUGÍA

**SCULPT canónico:** SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE.

**Cinco decisiones obligatorias en CLASSIFY:**

| Decisión | Criterio |
|---|---|
| KEEP | Preservar algoritmo, controles y pruebas que aportan una capacidad útil comprobada. |
| GENERALISE | Eliminar acoplamiento al producto donante conservando comportamiento. |
| OPTIONALISE | Mantener función valiosa fuera del núcleo o sin convertirla en requisito. |
| REPLACE | Sustituir contrato, persistencia o fuente de verdad incompatible sin fingir equivalencia. |
| REMOVE | Excluir de la adaptación marca, deuda o duplicidad; nunca borrar el snapshot fiel. |

**Escultura:** conservar una copia upstream exacta, con repositorio, ruta, commit, licencia y hashes; recuperar el subsistema completo necesario; ejecutar el baseline original; practicar modificaciones pequeñas y reversibles en un espacio de trabajo distinto.

**Pulido:** OBSERVE → CHANGE → BUILD → CAPTURE → CRITIQUE → CORRECT, con capturas, métricas, fallos y decisión KEEP / ADJUST / REJECT por ciclo. Tests verdes no acreditan por sí solos calidad visual ni exactitud arquitectónica.

**Cirugía:** solo tras validar la escultura; unificar contratos, eliminar escritores duplicados, preservar comportamiento y probar cruces de estado. Nunca crear un segundo editor, proyecto, motor 3D ni persistencia alternativa.

**Transferencia entre repositorios:** cuando el trabajo se autorice, preferir clonación reproducible de la familia completa, snapshot inmutable y adaptación separada, con hashes y verificación de permisos. Una clonación correcta NO equivale a integración correcta. El código y los recursos externos no deben publicarse hasta comprobar licencia, atribución y privacidad. No reutilizar directamente blob SHA entre repositorios como método de clonación.

## 3. Registro de piedras con donante identificado

| Alias | Fuente verificable y SHA del HEAD donante | Capacidad por comprobar | Encaje actual / ola heredada | Estado real |
|---|---|---|---|---|
| **R01** | [wy51ai/floorplan-3d PR #18](https://github.com/wy51ai/floorplan-3d/pull/18), rama del contribuidor `zhuzhuyumeng/floorplan-3d:feat/floorplan-recognition`, `1d235fc0a3c45783e1e1fa129944f8f34d97d297` | Reconocimiento de plano raster, muros/huecos/estancias, OCR y posprocesado, orientación, escala, worker, pruebas | **F2 experimental** y **G-01, ola 4**; también investigación para G-06, ola 2; ninguna validación F2 se concede por clonar | **Identificada / código inspeccionado en origen; baseline no ejecutada aquí** |
| **R02** | [wy51ai/floorplan-3d PR #17](https://github.com/wy51ai/floorplan-3d/pull/17), `zhuzhuyumeng/floorplan-3d:feat/ceiling-layout`, `324eb64cf9b26f6d4df8323c2dec4591fa4691e3` | Principalmente distribución de techo y luminarias/equipos; examinar la familia real y sus pruebas. **No está demostrada aquí una red completa de electricidad/agua/datos ni cumplimiento normativo español.** | Cercanía con **LUZ-01 (ola 5)** y **OBR-04 (ola 3)** solo como referencias parciales; geometría de techo/MEP sin encaje maestro exacto: **decisión pendiente** | **Identificada, alcance técnico por acotar; no clonada** |
| **R03** | [wy51ai/floorplan-3d PR #11](https://github.com/wy51ai/floorplan-3d/pull/11), `caikaidev/floorplan-3d:codex/walkthrough-cabinet-interiors`, `2495d8e0bf7d3846d2da827121c15e3e83d752bd` | Modelado de armarios, compartimentos, puertas, cajones y geometría paramétrica a verificar; distinguir runtime propio de Three.js vendorizado | Relación parcial con **CAT-03 (ola 5)** y biblioteca **F3** existente; el editor paramétrico de armarios no equivale automáticamente a CAT-03: **decisión pendiente** | **Identificada, PR original cerrada sin merge; derechos del contribuidor y dependencias pendientes** |

**Detalle R01 conocido por lectura del origen:** `js/recognition-core.js`, `js/recognition-service.js`, `js/recognition-worker.js`, `js/ocr-postprocess-rules.js`, `js/recognition-ui.js`, `js/project-model.js`, `js/project-ui.js` y las pruebas de reconocimiento y navegador. La PR #18 incluye 21 archivos; las rutas y dependencias definitivas se fijarán mediante SOURCE/ISOLATE. La ejecución OCR vista en el origen utiliza Tesseract y `chi_sim`, lo cual no prueba rendimiento en planos españoles.

**R02:** PR #17 incluye 39 archivos y varias capacidades acumuladas; **no** atribuir a la capa de techos todas las funciones de reconocimiento o IA contenidas en el diff. Separar capacidad nueva y dependencia heredada antes de clonar.

**R03:** PR #11 incluye 18 archivos, entre ellos un árbol grande de Three.js vendorizado. **No** duplicar Three.js en RUBIK por defecto ni asumir permiso de todo archivo por existir una licencia upstream MIT. Inspeccionar licencia del contribuidor, procedencia, avisos y dependencias. La PR está cerrada sin fusionar; eso no demuestra que no funcione, pero tampoco que haya sido aceptada.

**Estado de licencias:** `wy51ai/floorplan-3d` muestra licencia MIT en el origen para su código, pero la titularidad y permisos de nuevas contribuciones, assets, OCR y dependencias deben verificarse por archivo/familia antes de publicarlos. No consta una revisión jurídica concluida. No atribuir a RUBIK una licencia nueva ni declarar permiso amplio automático.

## 4. Trece áreas de oportunidad: correspondencia con una sola cartera

Los G0–G12 de la auditoría de donantes son **alias de investigación**; no se mezclan con los G-01/G-06 existentes (con guion), con los gates históricos ni con los códigos del roadmap maestro.

| Alias | Área | Relación con catálogo maestro o capacidad existente | Ola o decisión; condición |
|---|---|---|---|
| **G0** | Derechos, licencias y trazabilidad | GOV-05; BIB-01 y CAT-01 para activos de catálogo | Transversal; GOV-05 en 1, BIB-01 en 2. Sin autorización de copiar por registrar. |
| **G1** | Banco comparativo de planos | F2 (protocolo y comparador existentes); G-01 | G-01 en 4; laboratorio sintético independiente posible, sin validar F2. |
| **G2** | OCR auxiliar | R01 → F2 / G-01 | G-01 en 4; OCR opcional no reescribe geometría ni declara cotas fiables. |
| **G3** | Auditoría de cotas y escala | G-06 (medición) y G-01 (fidelidad al original) | G-06 en 2; G-01 en 4, por cortes separados. |
| **G4** | Geometría y distribución de techos interiores | R02, referencia parcial LUZ-01; IMG-06 cubre acabados, **no** modelado de techos | **Sin ID exacto; decisión pendiente.** No declarar LUZ-01 equivalente. |
| **G5** | Instalaciones técnicas / MEP | R02 en investigación; **X-03 descarta automatizar MEP con normativa china** | **Sin ID aprobado; reapertura expresa de decisión si procede.** No generar instalaciones certificadas. |
| **G6** | Estancias irregulares y edición topológica | Editor actual; UX-14 trata Move Rooms, no equivale a todos los casos irregulares | **Sin ID exacto; decisión pendiente**; no anunciar UX-14 como resuelta. |
| **G7** | Pilares, conductos y elementos constructivos | Referencia parcial OBR-04 (muros de carga declarados); no corresponde a todos los elementos | **Sin ID exacto; decisión pendiente**. |
| **G8** | Showroom, materiales y estilos | IMG-08/09, UX-13, CAT-01, biblioteca F3 | Hereda olas 2–3 por cada mejora; no duplicar Presentation/Render IA. |
| **G9** | Presupuestos y entregables | C1–C4/BC3/FT3D-8 ya existen; OBR-05 y ENT-04 son mejoras específicas | Conservación y pulido; OBR-05 en 4, ENT-04 en 2. |
| **G10** | Armarios paramétricos | R03, relación parcial CAT-03 / catálogo F3 | CAT-03 en 5 solo para su alcance; **parametrización requiere decisión propia**. |
| **G11** | Agentes que proponen sin escribir | AG-1/AG-2 y MCP local existente | Ambos en 4 con dependencias AG-0/GOV-06a; humano confirma diffs. |
| **G12** | Escenas grandes, garajes y rendimiento | GOV-07 (hardware real); otros requisitos sin ID exacto | GOV-07 en 1; resto pendiente de investigación y decisión. |

**Regla de correspondencia:** una referencia parcial no implica equivalencia, implementación aprobada ni cambio de prioridad. El trabajo de laboratorio no convierte por sí mismo una mejora de ola 4/5 en mejora autorizada de ola 1. No modificar las filas, estados ni casillas existentes hasta verificación y decisión específicas.

## 5. Cómo encaja SCULPT en las olas ya existentes

Las **olas 0–5** y los cortes 2a–2f permanecen como están en el catálogo maestro. SCULPT no introduce una `Ola SCULPT` ni sustituye la prioridad operativa de **GOV-08, ENT-01/ENT-02 y la seguridad de publicación de enlaces**.

- Las mejoras de **F2/G-01** pueden investigar R01 en laboratorio aislado sin declarar validación ni interferir con la seguridad comercial de ola 1.
- Las capacidades de techo e instalaciones **R02** no entran en una ola por proximidad semántica: requieren decidir la mejora funcional y, en su caso, su ID.
- Los armarios **R03** complementan F3 / catálogo, pero su aprobación como módulo paramétrico no está implícita en CAT-03.
- El resto de G0–G12 se ejecuta **bajo el ID existente** o se mantiene en espera de clasificación/decisión del propietario.
- Si aparecen más donantes, registrar procedencia y comparación con estas tres piedras antes de asignar un nuevo alias.

La cartera de mejoras vive en un único lugar: el catálogo maestro. Este documento conserva detalle metodológico y evidencia, pero **no fija una prioridad alternativa**.

## 6. Gates para una piedra, sin confundir investigación e integración

| Gate | Salida exigible | Bloqueo |
|---|---|---|
| **SOURCE** | Fuente, SHA, licencia, atribuciones, riesgos, GO/HOLD/NO GO | Permisos o procedencia desconocidos: no copiar/publicar. |
| **ISOLATE** | Snapshot exacto verificable y separado; familia funcional completa; baseline ejecutada o motivo del bloqueo | No confundir lectura con prueba. |
| **CLASSIFY / SCULPT** | KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE por archivo; cambios pequeños y reversibles | No perder capacidades del donante sin evidencia. |
| **NORMALIZE** | Adapter hacia contrato RUBIK sin segundo escritor ni segundo proyecto | No sobrescribir geometría ni reinterpretar escala estimada como real. |
| **TEST** | Original y adaptación, casos sintéticos, regresiones, privacidad, fallos; registro por SHA | No declarar exactitud profesional sin datos reales. |
| **PREVIEW** | Vista o laboratorio seguro, verificable; si no puede publicarse, evidencia local y bloqueo documentado | No subir datos de clientes ni código de derechos no aclarados. |
| **HUMAN REVIEW** | Revisión y aprobación específica del propietario del corte | Tests verdes ≠ aprobación visual. |
| **MERGE / PRODUCTION** | Dos autorizaciones separadas; integración en master y Promote oficial son operaciones distintas | Ninguna autorización implícita. |

Para el reconocimiento de planos, [F2](../qa/F2-entry-protocol.md) exige **5 sesiones manuales medidas** y **al menos 20 planos distintos autorizados con referencias** para validar resultados reales. La PR #9 del prototipo experimental no cerró ese gate. Tests sintéticos y mejoras aparentes no satisfacen el protocolo.

## 7. Próxima decisión humana y registro de evidencia

**No hay aprobación de implementación por incluir esta documentación en GitHub.** Para abrir un primer taller R01 se requiere orden expresa que delimite:

1. Si se autoriza un laboratorio **R01 solo aislado** (sin nuevo runtime publicado, sin escritura en proyectos).
2. Procedencia y licencias de las piezas y pruebas exactas a trasladar.
3. Qué fixtures **sintéticos o públicos con permiso** usar; los planos reales se custodian y evalúan localmente con F2.
4. Criterios de aceptación del primer comparador: entrada idéntica, detector RUBIK vs donante, propuestas revisables, no mutación, deshacer intacto.
5. Qué evidencia subir a una PR draft y qué material permanecerá local.
6. Autorizaciones independientes para integrar la adaptación, fusionarla y publicar.

**Campos que debe aportar cada futura piedra:** alias, ID maestro/pendiente, fuente/SHA/ruta, hashes, licencia, capacidad completa, dependencias, autoridad del dato, estado (identificada → clonada → baseline → adaptada → probada → revisada → integrada), tests reales, Preview, riesgos, decisión humana, PR y SHA de integración. Ninguno de esos estados se infiere de la mera existencia de esta ficha.

**Control de actualización:** cualquier ampliación de cartera debe modificar primero el catálogo maestro o aportar un enlace subordinado; no crear otro roadmap, ni reescribir las olas, ni convertir hipótesis en hechos.

## 8. Inventario ampliado de donantes y oportunidades (revisión 10/11/2026)

**Corrección de alcance:** R01–R03 son las **tres primeras piedras priorizadas**, no todas las piedras posibles. La revisión ha encontrado **8 PR registradas en el upstream** (solo #7 fusionada), **12 repositorios externos accesibles** (incluidos forks vinculados a las PR) y **2 forks propios cuyos HEAD coinciden exactamente con sus padres**. Estas cifras cuentan fuentes, NO piedras independientes ni módulos aprobados. Los 13 alias G0–G12 mantienen su significado y correspondencia en §4. Nada aquí crea otra ola ni autoriza copiar código.

### 8.1 Las ocho PR de wy51ai/floorplan-3d

| PR | Fuente y SHA del HEAD | Capacidad encontrada | Situación frente a RUBIK |
|---|---|---|---|
| [#4](https://github.com/wy51ai/floorplan-3d/pull/4) | `231be5373714bab24becb6fba8847c52c2054ff0` | Chino tradicional y términos de Taiwán | Cerrada sin merge; localización futura, no piedra prioritaria. |
| [#7](https://github.com/wy51ai/floorplan-3d/pull/7) | `jinniw43805`, `e5c444995a5a80b68c66a9ff934c8fee7247b258` | UI chino tradicional | Única fusionada; no contar como PR donante pendiente. |
| [#8](https://github.com/wy51ai/floorplan-3d/pull/8) | `jinniw43805`, `3140735d1a375571359c8b02ac902c620c79cff6` | Importar layout completo, editar/dibujar muros, snapping, estancias en L, undo y persistencia; todo en un diff de `index.html` | **Candidata adicional importante** para editor/F2; su importación reemplaza geometría: NO copiar el writer destructivo. |
| [#9](https://github.com/wy51ai/floorplan-3d/pull/9) | `broxlighters`, `508c773659db2a145fe4fbeacf682514070c81e5` | Ocho muebles de taller, maquetismo, exhibición y cocina con encimera de acero | F3/BIB-01, activos y geometría; pruebas offline declaradas, sin recorrido real de navegador en la PR. |
| [#11](https://github.com/wy51ai/floorplan-3d/pull/11) | `caikaidev`, `2495d8e0bf7d3846d2da827121c15e3e83d752bd` | Armarios paramétricos y Three.js vendorizado | **R03**; cerrada sin fusionar, derechos y dependencias por investigar. |
| [#15](https://github.com/wy51ai/floorplan-3d/pull/15) | `tiggerhat`, `cdd5b9181ba60043137413fb25a12abae7cc0b61` | Pilares, conductos, patinillos de agua y electricidad/datos, ventilación, dimensiones y colisiones 2D/3D | **Candidata adicional importante** de elementos constructivos; no es cálculo ni certificación MEP. |
| [#17](https://github.com/wy51ai/floorplan-3d/pull/17) | `zhuzhuyumeng`, `324eb64cf9b26f6d4df8323c2dec4591fa4691e3` | Techos y equipos, diseño asistido por IA, modelos de mobiliario y núcleo de reconocimiento/OCR compartido | **R02 es solo parte**. Separar `ai-layout.js` y `furniture-*` en inventario, no duplicar reconocimiento. |
| [#18](https://github.com/wy51ai/floorplan-3d/pull/18) | `zhuzhuyumeng`, `1d235fc0a3c45783e1e1fa129944f8f34d97d297` | Motor raster/OCR, worker, reglas y pruebas | **R01**, parcialmente duplicada por #17. |

**Solapamiento certificado por hash Git** entre los HEAD de #17 y #18: `js/recognition-core.js` = `d635e751abc5ed00a611491bc954c2fe184a952c`, `js/recognition-service.js` = `e905116d745588b9fee6f6cbc12b71a351d67362` y `js/ocr-postprocess-rules.js` = `c716eeef05ffbef6a6b088e130914d51328c010f`. Estos tres archivos son idénticos, no dos motores independientes. En cambio, `js/project-model.js` tiene hashes distintos y debe compararse antes de normalizar.

### 8.2 Doce repositorios externos verificados (no doce piedras)

| Repositorio | Referencia verificable | Diferencial o límite de la evidencia |
|---|---|---|
| [zhuzhuyumeng/floorplan-3d](https://github.com/zhuzhuyumeng/floorplan-3d) | `master@88323f3cc4ab5960570560192dee3d6163186a94` | Fork oficial del original; procedencia de #17/#18. |
| [jinniw43805/floorplan-3d](https://github.com/jinniw43805/floorplan-3d) | PR #8, SHA arriba | Fork oficial; importación/edición y localización. |
| [broxlighters/floorplan-3d](https://github.com/broxlighters/floorplan-3d) | PR #9, SHA arriba | Fork oficial; mobiliario de taller. |
| [caikaidev/floorplan-3d](https://github.com/caikaidev/floorplan-3d) | PR #11, SHA arriba | Fork oficial; armarios. |
| [tiggerhat/floorplan-3d](https://github.com/tiggerhat/floorplan-3d) | PR #15, SHA arriba | Fork oficial; elementos constructivos. |
| [wholeai/floorplan-3d-go](https://github.com/wholeai/floorplan-3d-go) | `main@a9a226a7688c3f8eb2b9d3106387fea77b1d1f0a` | Derivado Go/SQLite; README describe 10 estilos, showroom, 16 familias de materiales, cantidades, presupuesto, PDF y variantes. RUBIK ya tiene parte: evaluar **delta**, no migrar a Go. |
| [faye25tom/floorplan-3d-ai](https://github.com/faye25tom/floorplan-3d-ai) | `master@a575a3c330a5a54b5abad156eabbe517639d889b` | Derivado independiente; README describe reconocimiento LLM multimodal, editor modular, 4 presets y autoamueblado. Verificar código, precisión, costes, privacidad y no exponer claves en cliente. |
| [TomNick777/home-design](https://github.com/TomNick777/home-design) | `master@6b1106e86062adcc3bb64956bd1a5836451fb7cb` | Caso secundario; estado del proyecto indica migración posterior a plantilla `house-plan-designer`. No atribuir el código actual íntegramente al original. |
| [jinbao7788/my-floorplan](https://github.com/jinbao7788/my-floorplan) | `main@b78a2ece2d94b90beae003f82da36e173973aeb8` | Adaptación doméstica; diferencial funcional no evaluado. |
| [masonycw/floorplan-3d](https://github.com/masonycw/floorplan-3d) | `master@622b48518aa47cb4034e95132eb993cceb29dbd5` | Variante de diseño y mobiliario; diferencial no medido. |
| [hongyangchun/floorplan-3d](https://github.com/hongyangchun/floorplan-3d) | `main@d540dd868042d8deff32627e9d108c9741409464` | Derivado con despliegue Cloudflare; valor funcional no medido. |
| [shaoq9371-glitch/3d66-modeling](https://github.com/shaoq9371-glitch/3d66-modeling) | `main@db032cd39a238524837ec5436bf1052a49217c67` | Derivado independiente con `server/cad.py` y `src/scene.js`; documentación declara DXF con `ezdxf`, unidades y capas. Comparar con importador DXF de RUBIK. |

**Nombres todavía no localizados:** `Falix23/floorplan-3d` y `BysunLin/floorplan-3d` devolvieron 404 con esas rutas exactas y no se localizaron por la búsqueda de repositorios. No afirmar que se han inspeccionado, ni inventar SHA o clasificar su funcionalidad. Mantener referencia **pendiente de URL correcta/visibilidad**.

### 8.3 Dos forks propios que ya tenemos

| Repositorio propio | Padre verificado | SHA comparado |
|---|---|---|
| [Juanmaes83/floorplan-3d-ai](https://github.com/Juanmaes83/floorplan-3d-ai) | `faye25tom/floorplan-3d-ai` | `master@a575a3c330a5a54b5abad156eabbe517639d889b`, **igual al HEAD del padre** |
| [Juanmaes83/floorplan-3d-go](https://github.com/Juanmaes83/floorplan-3d-go) | `wholeai/floorplan-3d-go` | `main@a9a226a7688c3f8eb2b9d3106387fea77b1d1f0a`, **igual al HEAD del padre** |

Aprovechar copias propias; no son dos familias extra. Igualdad de SHA de HEAD significa mismo commit actual, no demuestra capacidades adicionales desarrolladas en los forks.

### 8.4 Once familias adicionales observadas: candidatas, NO aprobadas

| Familia para investigar | Fuente | Encaje tentativo en el catálogo maestro | Gate pendiente |
|---|---|---|---|
| Muros y estancias irregulares, snapping, undo | PR #8 | F2, G-01; UX-14 solo parcial | Comparar contra editor, ID y preflight canónicos. |
| Pilares, conductos y patinillos | PR #15 | OBR-04 parcial; G7 investigación | No simular MEP normativo; geometría 2D/3D. |
| Muebles de taller y encimeras | PR #9 | F3/BIB-01 y CAT-03 parcial | Licencias, dimensiones, performance y catálogo. |
| Distribución IA y propuestas | PR #17, `js/ai-layout.js` | AG-2, GEN-01 parciales | Distinguir algoritmo de API y costes. |
| Catálogo y colocación asistida | PR #17, `js/furniture-*` | UX-12, F3, CAT-03 parciales | Deduplicación y pruebas. |
| Reconocimiento multimodal | faye25tom y fork propio | R01/G-01 y AG-1 parciales | Seguridad, privacidad, tasa de errores, coste. |
| Autoamueblado y presets | faye25tom y fork propio | UX-12/UX-13 | Benchmark y geometría canónica. |
| Estilos y showroom | wholeai y fork propio | IMG-08/UX-13 y Presentation existente | Retener visores, cámara y estados de RUBIK. |
| Cómputos de materiales, presupuesto, informes PDF | wholeai y fork propio | C1–C4/BC3, ENT-04 | Comparar outputs; nunca duplicar presupuesto. |
| CAD por capas y unidades | 3d66 | Importador DXF actual; G-01/G-02 parcial | Comparativa sobre fixtures autorizados. |
| Plantillas residenciales y migración de motores | TomNick777 | Editor, F2, GEN-01 parcialmente | Verificar origen del template y permisos. |

**No sumar** las 11 filas y las 3 piedras como 14 módulos independientes: varias comparten motores con otras o ya existen en RUBIK. Identificar un donante es SOURCE; solo después de ISOLATE + baseline + CLASSIFY se puede formalizar otra piedra.

**Orden de investigación tentativo, NO de implementación:** R01 y las diferencias reales de #8/#15; después las neuronas no duplicadas de #17 y faye25tom; después wholeai como benchmark de estilos, cantidades y documentación; #9 como assets; otras fuentes como referencias secundarias. Se conservan sin alteración las olas 0–5, sus IDs, la seguridad GOV-08/ENT y las autorizaciones humanas.

**Anti-duplicación y derechos:** comparar hashes, preservar origen exacto y permisos, examinar código real y no solo README, no importar aplicaciones completas, no activar proveedores pagos y no añadir escritores alternativos al `FloorPlanProjectV1`, `FloorPlanBuildingV1`, F3, C1–C4/BC3 o FT3D-8. **Toda futura piedra requiere PR/CI/Preview y aprobación por corte.**
