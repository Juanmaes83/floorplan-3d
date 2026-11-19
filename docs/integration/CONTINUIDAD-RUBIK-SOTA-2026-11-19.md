# RUBIK SOTA — Continuidad maestra de ejecución · 19/11/2026

**LEER PRIMERO AL RECUPERAR CONTEXTO.** Corte 19/11/2026, posterior al cierre técnico de OP-10 y al candidato local final F0.2b. Auditoría ChatGPT por encargo del propietario. Base de producto comprobada: master `dd528119bdfd80733c4faf5bb56a594190fea5ac`, árbol `f62e9492de0ee616c8edd1966703238d57702a63`. Rama documental independiente `docs/continuidad-rubik-2026-11-19`: no altera master, no autoriza merge, promoción, activación ni gasto. Sustituye como entrada operativa al handoff 18/11; conserva los históricos. El catálogo y las olas del plan v1.12 siguen vigentes.

## 0. Protocolo de reanudación

1. Leer este documento y [protocolo multiagente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md). Consultar en vivo master, PR, HEAD, árboles, CI paginada, revisiones, workflows, aceptación y diferencias. Las cifras de este corte no son estado en tiempo real.
2. Leer el HANDOFF fijado del corte activo, no reabrir laboratorios congelados ni repetir evidencias. Una autoridad de geometría, una de persistencia, un contrato de cada tipo.
3. Propietario decide, ChatGPT audita, Codex ingeniería/integración, Claude escultura/pulido. Escrituras en rama/worktree propio. Desarrollo, integración, promoción, activación y gasto son autorizaciones distintas. No cambiar workflows, rama ajena, servicios ni datos reales sin mandato.
4. Registrar cada nuevo corte aquí con fecha, SHA/árbol, evidencia, delta, estado, bloqueos, responsable y próximo paso. Preservar histórico, enlazar fuentes estables y verificar remoto antes de afirmar avance.
5. Mensaje de recuperación: «Lee docs/integration/CONTINUIDAD-RUBIK-SOTA-2026-11-19.md de docs/continuidad-rubik-2026-11-19, consulta GitHub y entrega el delta y próximo paso autorizado; no reabras congelados ni cambies master».

## 1. Estados operativos (independientes de despliegue/comercialización)

| Estado | Significado |
|---|---|
| INTEGRADO | Alcanzable en master, no implica desplegado/activado |
| INTEGRADO LIMITADO | Alcance experimental/parcial o validación profesional pendiente |
| PENDIENTE INTEGRACIÓN | Construido; faltan gates/aceptación/autorización |
| EN ESTABILIZACIÓN | Código en rama y regresiones/pruebas pendientes |
| PRECONGELACIÓN | Cierre técnico entregado, aceptación/registro pendiente; mantener inmóvil |
| CONGELADO | SHA protegido por mandato; no commits, regeneraciones, pruebas, PR ni cirugía sin nuevo GO |
| PARCIAL | Existe una parte útil, residual sin terminar |
| NO DESARROLLADO | No consta implementación específica |
| INFRAESTRUCTURA | Núcleo reutilizable sin función final |
| SIMULADO / DESACTIVADO | Recorrido simulado o prestación real cerrada |
| BLOQUEADO | Dependencia/decisión/licencia/aceptación pendiente |

Clases: [I] inspección de repositorio, [CI] GitHub consultado, [E] ejecución por agente identificado, [H] histórico, [P] propietario, [V] por verificar. Diferenciar pruebas ejecutadas por Codex/Claude de inspección independiente ChatGPT; CI verde no sustituye aprobación humana.

## 2. Integrado: master y producto

Merges consultados en GitHub el 19/11:

| PR | Corte | Merge SHA | Estado |
|---|---|---|---|
| [#259](https://github.com/Juanmaes83/floorplan-3d/pull/259) | E2, H01/H02, MCP2, VQ/F02/F03, Guardar JSON, beta IA privada | 163df68e83a80ddf11a008d573ee257d51c1821f | INTEGRADO; beta cerrada |
| [#261](https://github.com/Juanmaes83/floorplan-3d/pull/261) | v1.12, 98 IDs, 8 programas | 67367c6b4abf2d429a5979da3f0cbf1c58721b68 | INTEGRADO documental |
| [#262](https://github.com/Juanmaes83/floorplan-3d/pull/262) | F0.1 expediente portable | af6577aad2e7af56bd34c1b3901025553a2819f4 | INTEGRADO |
| [#263](https://github.com/Juanmaes83/floorplan-3d/pull/263) | F0.2a motor IndexedDB | 455309069ea52ac8c6c4b887209277cc1169900d | INTEGRADO, consumidores aún no conectados globalmente |
| [#264](https://github.com/Juanmaes83/floorplan-3d/pull/264) | Permiso persistente y GC seguro | 7bd414f697796360520f8b6294208d32a9d706b3 | INTEGRADO parcial F0.3 |
| [#265](https://github.com/Juanmaes83/floorplan-3d/pull/265) | OP-03 / G-02 DXF R2007 mm, planta activa | 4c62c1fcbee4dcb7871508b2d2361778fc6e277a | INTEGRADO LIMITADO, dos CAD/arquitecto pendientes |
| [#260](https://github.com/Juanmaes83/floorplan-3d/pull/260) | CI deduplicación certificada | dd528119bdfd80733c4faf5bb56a594190fea5ac | INTEGRADO; observación, sin omisión automática nivel 3 |

Producto existente: editor 2D/3D, muros/huecos/muebles, edificios y escaleras básicas, Presentación/NAV3D, variantes, comparación, mediciones, presupuesto C1–C4 y BC3, obra y Evolución 4D, entrega con caducidad/revocación, Home/demos, JSON y expediente. E2 integrado no equivale a E3. Asistente V2 guiado y confirmación controlada; V3 generativo desactivado. Render IA D1 tiene activación histórica de pago; FOT-01/CAT-01 y beta IA privada no activadas públicamente. GOV-08 S1–S3 integrados limitados: S4/S5 pendientes. Ver [Estado maestro](../product/ESTADO-MAESTRO-RUBIK-SOTA.md) para detalle histórico.

Despliegues **última evidencia histórica, no reconsultados en este corte**: Alpha 8525025 / dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA; Demo 7dccf7a / dpl_64ndSF5qoDKDtey7XXwEYRAzYDTF; Beta 01 sin identificación. No promocionar; master es posterior a esos SHA. Separar integración, despliegue, activación, validación y comercialización.

## 3. F0 — ruta crítica

| Corte | Estado | Siguiente |
|---|---|---|
| F0.1 | INTEGRADO | Expediente hashes, no firma; conservar recuperación |
| F0.2a | INTEGRADO | Autoridad IndexedDB y revisión/tx |
| F0.2b | EN ESTABILIZACIÓN, candidato final local | Publicación única coordinada y CI nuevo SHA; NO-GO merge/activación |
| F0.2c | NO DESARROLLADO como corte | Imágenes/adjuntos/recursos y diario misma transacción; OP02/04/DXF compatibilidad, referencias privadas |
| F0.3 | PARCIAL (#264) | Estado, recuperación/historial/permiso, Safari real/iOS/Android/desalojo |
| F1 | BLOQUEADO/DISEÑO | D3-a–e proveedor/identidad/región/cuotas, privacidad y gasto; modo local permanente |

F0.2b solo autoridad en origen aislado f0-2b.localhost; editor normal no activa autoridad. Cinco documentos: proyecto, biblioteca, presupuesto, observaciones/revisión, obra. Migración transaccional, confirmación, conflictos, espejo separado, recuperación, E2/Evolución. Lectura confirmada sin migración ni escritura. Revisión local ≠ contentId portable ≠ hash de entrega; imágenes por nivel + ID exacto. Marca, tarifa y catálogo autoridades separadas. Respetar CAM-01/IMG-07. [Contrato F0](../contracts/persistencia-v1.md), [verificación #269](https://github.com/Juanmaes83/floorplan-3d/blob/79cd98f6fffc4b978aee4ba6692f9f5c6554916d/docs/integration/F0-2B-VERIFICACION.md).

### 3.1 Codex: último candidato (local, no publicado)

PR [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269) draft, rama codex/f0-2b-consumers. Remoto **79cd98f6fffc4b978aee4ba6692f9f5c6554916d**, árbol ab3908a8a1f48d86776e21fd3899d057725d67d3. Reparación bootstrap defer antes de plantilla; ocho módulos R03 finales, gate intacto. Ancestro local fe492e1d73a3d289dea608207610b2eba54c4326, árbol ffaa403c44244b2d491a420eb9dd7fdec609f0de. **Último candidato local comunicado por Codex [E]: 956bce96b1d50edb60a8b8aaa3b742f3678261bb**, árbol **1c07fd979b854ad5252e70444bca0c2db381fa9d**; seis archivos +48/−11. GitHub responde 422 al SHA local; no auditable aún. El patch del equipo local no es un enlace accesible para ChatGPT.

| Residual corregido según Codex | Evidencia comunicada |
|---|---|
| Persistence | Cierre contexto durante recarga; esperar documento nuevo y verificar revisión, timeout 120s intacto; 21/21 Linux y tres repeticiones |
| Project-First/shared-regression | Montaje del panel antes de registrar resumen presupuesto; 7/7 más control F0, shared 40/40 |
| FT3D-8 E2/CAT-IA/M2 Gate D | app no declarado en Plan de obra, conectar FloorPlanApp; examen 20/20, V4 2/2, V5 2/2, M2/S4 14/14 |
| Presentation axon/historical A | Guía ofrecía botón principal «Presentar mi vivienda»; prueba solo buscaba dos entradas. Incluir botón visible con nombre exacto, verificar diálogo y restauración, mismos timeouts. Caso completo pasó en master con prueba original, en candidato corregido y en árbol combinado |

41 contratos CI comprobados según Codex, ampliación aditiva #268 preservada. Simulación acumulada master → #266 → #268 → #269 local: árbol **ee70331c65407a458ad782840349696c55887b32**, sin conflicto y patch-id coincidente. No es merge real. Ancestro fe492e1d conserva sus resultados; no confundir sus pruebas con CI del HEAD final.

**Dictamen:** GO técnico para un único push coordinado de 956bce96 a su rama, condicionado a permiso del propietario y HEAD padre esperado. NO-GO para fusionar/activar. Tras push verificar SHA, árbol, diff, CI íntegra y contratos; no ampliar alcance, no relanzar/cancelar CI, no alterar gates. Aceptación/compatibilidad conjunta y autorización separada para merge.

### 3.2 CI verificada de los HEAD remotos (19/11, corte cerrado anterior al nuevo push)

| Ref | Aprobados | Ejecutando | Cola | Omitidos | Fallidos |
|---|---:|---:|---:|---:|---:|
| master | 4 | 0 | 0 | 1 | 0 |
| #266 | 90 | 0 | 0 | 1 | 0 |
| #268 | 90 | 0 | 0 | 1 | 0 |
| #267 | 19 | 0 | 0 | 1 | 0 |
| #269 79cd98f6 | 89 | 0 | 0 | 1 | 8 |
| Total | 292 | 0 | 0 | 5 | 8 |

98 checks #269 completos, omitido full-regression; los cinco refs omiten ese nombre. Fallos del remoto: [persistence](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358160/job/135401024290), [project-first](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358373/job/135401125375), [shared](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358321/job/135403101947), [exam](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358321/job/135403101873), [M2](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358321/job/135403101887), [CAT-IA](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358455/job/135401126753), [axon](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358541/job/135401142397), [historical A](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358376/job/135406121882). Últimos [Presentation 58/58](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358541/job/135401142569) y [historical B](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358376/job/135406121857) verdes según Codex y conclusión global consultada. Ocho fallos cubiertos según pruebas locales, no todavía por CI del nuevo SHA.

## 4. SCULPT — inventario completo de las 17 piedras

Denominaciones del [registro OP/RG](../product/sculpt-openplan3d-roomgpt-2026-11-18.md) y [cartera](../product/sculpt-metodologia-y-cartera-2026-11-10.md), sin crear IDs ni olas.

| Piedra | Estado ejecutivo | Alcance / residual |
|---|---|---|
| R01 raster | LAB HISTÓRICO/PARCIAL | F2 cinco sesiones/20 planos históricas; entrada y profesional pendientes |
| R02 techos | A INTEGRADO EXPERIMENTAL; B NO INICIADO | Medidas/privacidad/aceptación reales |
| R03 armarios | INTEGRADO EXPERIMENTAL | Preservar ocho módulos y hooks; validación real |
| OP-01 persistencia | PARCIAL/EN ESTABILIZACIÓN | F0.1/2a integrados, 2b local final, 2c/3 residuales |
| OP-02 rendimiento | PENDIENTE INTEGRACIÓN | #266 verde, aceptación pendiente |
| OP-03 DXF | INTEGRADO LIMITADO | #265, CAD/profesional pendiente |
| OP-04 escaneos | PENDIENTE INTEGRACIÓN | #268 verde, escaneos reales pendientes |
| OP-05 GLB propios | CONGELADO | F0.2c/F3/licencia/hardware |
| OP-06 edición múltiple | NO DESARROLLADO como corte | Contrastar editor, no GO |
| OP-07 curvos/inclinados | CONGELADO | #267 solo lab; cirugía S1–S6 |
| OP-08 escaleras/edificios | PARCIAL producto, corte NO DESARROLLADO | Escaleras básicas existentes; contrastar ampliación |
| OP-09 plantillas | NO DESARROLLADO como corte | Contrastar Arranque |
| OP-10 Blender | PRECONGELACIÓN/CIERRE TÉCNICO | Inmóvil; escultura GO, no entrega |
| OP-11 ambientación | NO DESARROLLADO como corte | Licenciar recurso a recurso |
| OP-12 MCP vivo | INVESTIGADO/NO DESARROLLADO | Después F0 y MCP3/4, no escritor paralelo |
| RG-01 reforma foto | PARCIAL/SIMULADO/DESACTIVADO | FOT-01/E2/controles privados; delta UX |
| RG-02 visual/estilos | PARCIAL/SIMULADO | IMG-08/11 limitados; delta de listas y recetas |

## 5. PR pendientes: autorización estricta

| PR | HEAD exacto | Estado |
|---|---|---|
| [#266](https://github.com/Juanmaes83/floorplan-3d/pull/266) OP-02 | edfbf66beb93d2943d3421a2ab35a13299a5c9dc | draft; 90+1 omitido. Renderer bajo demanda, invalidación, damping temporal, walk; 12 pruebas reposo según evidencia, falta visual y dispositivo físico |
| [#268](https://github.com/Juanmaes83/floorplan-3d/pull/268) OP-04 | d8ca06dadf6de4c121c8f499a89d0c405a67cc60 | draft; 90+1 omitido. Unión rígida por puertas, sin escala/SLAM, preview y undo; aceptación/escaneos reales |

Autorización del propietario 19/11: solo secuencia #266 → #268 y HEAD exactos contra master dd528119bdfd80733c4faf5bb56a594190fea5ac o resultado de la primera fusión verificada. NO-GO mientras falte aceptación, compatibilidad exacta, revisión/protección o garantía base/árbol. #266 base histórica 163df68, #268 base actual. Codex simuló OP02 solo árbol 0ff75783bd0bbe16a200ead239989938644d6c50; OP04 solo 604cdf4593aacfd90d826be0f7a3f0c98a8bbdf3; secuencial d5978840bea9b652f4e6d9fb04cfac47675736bf. No merge efectuado. Ambos y #269 tocan index.html. Revalidar base efectiva y pruebas; merge commit con expected_head_sha sin saltar protección o aprobación. Si no se garantiza base/árbol, no fusionar. Verificar padres/árbol y CI postmerge antes de la segunda. Rollback propuesto, no ejecutado sin mandato. E3, OP05, OP07, OP10 y #269 fuera de esa autorización. Vigilancia horaria acordada (no es permiso de integración general).

## 6. Laboratorios inmóviles: SHA, evidencia, bloqueos

### E3 · CONGELADO
Rama lab/studio-presentation-e0e1, SHA 8c53263423359e4fa71fc25494c7a3b6ee1f7fd1, árbol 1bbe949e09eb056ce483a00993b4b8aa8d35fc2f. [HANDOFF](https://github.com/Juanmaes83/floorplan-3d/blob/8c53263423359e4fa71fc25494c7a3b6ee1f7fd1/labs/studio-presentation/HANDOFF.md), [informe 21 §4](https://github.com/Juanmaes83/floorplan-3d/blob/8c53263423359e4fa71fc25494c7a3b6ee1f7fd1/labs/studio-presentation/reports/21-E3-CONTINUIDAD-F0.md). Conservar informe 21, evidence/f0/f0-adaptador-qa.json, HANDOFF y D08 aceptado; no regenerar. RP07 117/117, F0 adaptador 11/11 históricos. Producción NO-GO D4, F0.2b, contrato con Codex, licencia N04, escala física, Safari real, dispositivos, H08. E3 solo lectura; revisión confirmada y contentId separados; no reabrir para coordinar. E2 integrado; E4–E7 pendientes/parciales según matriz.

### OP-07 · CONGELADO
[#267](https://github.com/Juanmaes83/floorplan-3d/pull/267) draft, rama sculpt/op-07-muros-curvos, SHA f48614f22e34478f0f15d4d39327b8b0f0e8a259. [Plan cirugía](https://github.com/Juanmaes83/floorplan-3d/blob/f48614f22e34478f0f15d4d39327b8b0f0e8a259/labs/sculpt/op-07/PLAN-CIRUGIA.md). Donante 68/68, paridad 19+15 comunicada. Bézier cuadrático, dos caras, unión huecos, teselación objetivo ≤1 mm cap 1024 (no certificación de obra). S1 contrato → S2 plano → S3 cantidades → S4 3D → S5 edición → S6 DXF tras F0.2b y autorización; guardas legacyView/assertSavable/detectLoss/featuresOf/writerFeatures/guardSave. No nuevo merge ni cirugía.

### OP-05 · CONGELADO
Rama codex/sculpt-op05-lab, SHA a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6, árbol f52f7b75db574f4d6cf7ea81fbf6357ee08f3e03. [README](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/README.md). Admisión GLB privado, hash/derechos/F3, privateModelRef separado de assetRef, ZIP por hash, no exportación pública involuntaria. F0.2b/c, F3, derechos, hardware antes de cirugía independiente. No reabrir.

### OP-10 · PRECONGELACIÓN, inmóvil
Rama claude/sculpt-op10-blender, SHA 611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f, árbol 3a44bb0436386539fab666dc0f74721cdd296160. [HANDOFF](https://github.com/Juanmaes83/floorplan-3d/blob/611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f/labs/sculpt/op-10/HANDOFF.md), [PROCEDENCIA](https://github.com/Juanmaes83/floorplan-3d/blob/611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f/labs/sculpt/op-10/evidence/PROCEDENCIA.md), [renders](https://github.com/Juanmaes83/floorplan-3d/tree/611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f/labs/sculpt/op-10/evidence/render). Sin PR. Auditoría: 10/10 blobs exactos MIT, 114 archivos +20.088 líneas, ninguno fuera lab. 7 escenarios sintéticos, 2.038 checks A↔B y A↔C sin fallo, C↔B 0 mm registrado, 7/7 reaperturas PASS 8/8; 13/13 núcleo, donante 6/6 unitarias y 4/4 browser reportados. No repetición independiente; ejecución 759d9bb7, documentación posterior, trazabilidad por artefacto. 3 hojas y 4 renders revisados por ChatGPT; GO escultura, GO revisión de lab, NO-GO comercial. Propietario dijo OK a la recomendación y pidió documentación; no consta checklist humano completo ni mensaje de freeze a Claude. Mantener inmóvil; registrar aceptación sin regenerar.
C2 etiquetas openingId/fixture, C3 eliminar caras coincidentes de armarios en visor antes de C4; C1 unificar piloto, C4 captura solo lectura, C5 exportar, C6 E3/F0, C7 CAM-01/IMG-07. Coordinar index.html OP02/F0. No maquillar Blender. CPU 13–38s a 960×600 32 muestras; sin texturas, luz/cámara derivadas declaradas. Pendiente revisión humana .blend, Firefox/WebKit, profesional y visual; no GPU/servidor/vídeo. observedProject no es revisión confirmada F0; fixtureContentId no es expediente real. Sin cirugía hasta mandato separado.

## 7. Los 98 IDs: inventario exhaustivo, base y delta

Reproducción del agrupamiento de las 98 filas de [matriz v1.12 a master auditado](https://github.com/Juanmaes83/floorplan-3d/blob/dd528119bdfd80733c4faf5bb56a594190fea5ac/docs/product/MATRIZ-TRAZABILIDAD-v1.12.md). No nueva auditoría de los 98 ni recuento formal actualizado; el delta operativo debajo prevalece sobre el corte histórico. Cada fila original tiene residual, programa, dependencias, evidencia y cierre.

| Estado v1.12 histórico | Nº | IDs |
|---|---:|---|
| RV | 20 | GOV-01a, GOV-01b, GOV-01c, GOV-09b, GOV-02, GOV-04, HOM-01, HOM-02, HOM-03, IMG-01, IMG-02, MUE-01, UX-07, UX-22, UX-23, UX-25, UX-08, OBR-01, OBR-02, OBR-03 |
| SU | 2 | GOV-09a, G-08 |
| PA | 22 | GOV-03, GOV-06a, GOV-07, ENT-05, IMG-04, IMG-05, IMG-06, IMG-08, IMG-12, IMG-13, CAT-03, BIB-01, VID-01, UX-09, UX-05, UX-11, UX-21, OBR-04, G-06, AG-0, AG-4, ECO-01 |
| DX | 3 | GOV-05, PER-02, ECO-02 |
| ND | 18 | GOV-06b, ENT-06, ENT-07, IMG-03, IMG-09, IMG-16, PER-01, PER-03, FOT-02, MUE-02, PAN-01, PAN-02, VID-02, UX-14, G-02, G-04, AG-5, ECO-03 |
| RL | 11 | GOV-08, HOM-04, ENT-01, ENT-02, ENT-04, UX-03, UX-04, AG-1, AG-2, AG-3, AST-01 |
| EX | 5 | ENT-03, CAT-02, UX-12, UX-13, G-01 |
| IR | 10 | IMG-07, IMG-22, CAM-01, PRE-01, UX-24, UX-10, UX-26, LUZ-01, OBR-05, GEN-01 |
| SI | 6 | IMG-10, IMG-11, IMG-14, IMG-15, FOT-01, CAT-01 |
| RD | 1 | G-07 |
| Total | 98 | X-01 a X-06 fuera del recuento |

Delta: G-02 pasa de ND a DXF integrado limitado #265 (reconciliar RL en siguiente actualización formal; validación en dos CAD/arquitecto pendiente). ENT-03 EX, E3 congelado; ENT-04 RL E2 integrado. CAT-03 PA, OP-05 lab sin integración. IMG-03 ND para calidad/coste IA; OP-10 es local y no lo cierra. IMG-07/CAM-01 IR, OP-10 no implementa sus contratos. G-08 SU para nativo, planos externos residual. FOT-01/CAT-01 SI con infraestructura privada desactivada; IMG-04 PA libro común no conectado en Production. GOV-03/06a/07 PA; GOV-08 RL; GOV-05 DX; GOV-06b ND. AG-1/2/3 RL dentro de su alcance; OP-12 no implementado. No sumar 98 IDs, 17 piedras y fases F0: son vistas que se solapan. No publicar porcentaje global ficticio.

## 8. Retomada ordenada y dependencias

1. Autorizar push exacto 956bce96 de Codex (recomendación técnica, no acción ejecutada); revisar nuevo HEAD/CI completa. No más encargos hasta consolidar.
2. Aceptaciones visuales/real OP02/04; integración secuencial solo si se cumplen §5. #269 requiere GO separado; revalidar conjunto actualizado.
3. F0.2c → F0.3 y QA físico/recuperación; activación real separada. No iniciar cirugías hasta gates específicos.
4. OP07, OP05, E3, OP10 tienen escultura preparada; ordenar cirugías por dependencias, riesgo y mandato. OP12 después F0 y MCP3/4. MCP propio stdio copia única JSON, lectura + propuesta acotada applied:false; etapa3 simulación aislada, etapa4 variante confirmada sin cambiar original. Donante bridge dev local no se trasplanta como escritor. [Roadmap MCP](../technical/local-mcp-roadmap.md).
5. Ocho programas P1 Studio E2–E7, P2 IA, P3 identidad, P4 comercial, P5 fidelidad, P6 interoperabilidad, P7 asistentes, P8 premium. [Plan v1.12 §6–9](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) conserva olas y dependencias. Prioridades: GOV-06a identidad/cuota, GOV-05 jurídica, GOV-08 S4/S5, IMG-04/ECO-01 ledger, ProposalV1/vigencia PRE-01, persistencia IMG-12, F1 y piloto cinco profesionales antes de fijar precios. No nuevos servicios ni IA de pago sin permiso.
6. Decisiones: D1 jurídica, D2 gasto beta, D3-a–e proveedor/identidad/demo/Beta01/cuotas (arquitectura F0 aprobada por etapas), D4 E3, D5 precios, D7 promoción, D8 G-08 nativo, D9 IMDF/G-07, D10 PAN-02 antes de PAN-01, D11 CON-03, D12 cinco profesionales. D6 #259 cerrada. No confundir D08 laboratorio E3 con D8 maestro. No sobreescribir decisión reciente del propietario.

## 9. SOURCE DISCOVERY (ampliación de SCULPT)

GitHub/API primero, scraping de fuentes accesibles autorizadas con crawl4ai, crawlee, Scrapling, scrapy, Scrapegraph-ai si aporta valor. No eludir permisos, no usar credenciales ajenas ni asumir derechos; registrar fuente exacta, licencia, SHA/blob, baseline, limitación y clasificación KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE. Bloqueado → alternativa interna o implementación mínima. OP10 web MIT 771c9e1ad30bd1c3cc7584d6eca74deb2e14943d; worker iOS privado no accesible/licencia no acreditada, sustituido por pipeline RUBIK + importador mínimo. OP10 no requiere más investigación del worker. Cartera Blender autorizada para evaluación respetando licencias: mcp-for-blender, blender-mcp, blender-control, blender-skills, blender-skills-94-specialist-Blender-skills-for-Cursor-Claude-Code-Kiro-Codex, threejs-blendertools, blender-tools, blender-to-web; no instalar todos, sin ejecución remota arbitraria ni coste, no duplicar renderer. [SOURCE EXACT OP10](https://github.com/Juanmaes83/floorplan-3d/blob/611b2f1d1dda473a4d95f7f6153960cd2ac2ad8f/labs/sculpt/op-10/docs/01-source-exact.md). SCULPT: SOURCE DISCOVERY → SOURCE EXACT → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE; pulido OBSERVE/CHANGE/BUILD/CAPTURE/CRITIQUE/CORRECT.

## 10. Registro de actualización

19/11: #259–265 verificados, #266/268 pendientes, #267 y E3/OP05 congelados, OP10 cierre técnico inmóvil, #269 79cd98f6 CI 89/8/1; candidato 956bce96 local (no publicado). Revisión de renders por ChatGPT, sin ejecutar Blender. No cambio de master, no merge/deploy, ningún gate modificado. Actualizar tras nuevo SHA de Codex y después de cada aceptación/fusión. Si se pierde contexto, volver a §0.
