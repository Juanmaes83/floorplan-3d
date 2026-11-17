# 11 · Propuesta E2–E7, corregida (v1.3 §7 y v1.4 §9). No autoriza nada.

**Estado:** propuesta. E2 requiere:

- el GO explícito y separado del propietario;
- una base consolidada acordada con Codex.

No se toca el producto, master, Production ni las ramas de Codex.

**Base leída:** `master@8525025a1470d48d52d8e365070e5a0acf116134` (#243, #244 y #245 fusionadas). La lectura se hizo con `git show` y un worktree aparte, sin escribir nada.

**Corrección.** La versión anterior de este informe, del commit `73784ba`, afirmaba que había que «activar ENT-04 cargando `before-after-dossier-core` y `revision-budget-core` en `index.html`». **Es falso.** El código lo refuta (abajo). Se conserva en el historial de Git. Este informe la sustituye.

## 1. Lo que ya existe en master (comprobado en el código)

| Pieza | Evidencia | Consecuencia para E2 |
|---|---|---|
| Acceso «Comparar con el original» | `index.html:2516–2520`: abre `comparar/?` + `FloorPlanVariantsCompare.handoff({beforeId,afterId})` + `anchor` | **No hay que cargar ningún motor en la página principal.** |
| Ruta del comparador | `comparar/index.html` carga, en orden: `revision-compare-core`, `revision-budget-core`, `before-after-dossier-core`, `variants-compare-adapter` y `comparar.js` | ENT-04 está activo en su ruta. Duplicarlo sería un error. |
| `comparar/comparar.js` | Lee biblioteca y presupuestos del mismo origen. Muestra cortina y lados, cambios y presupuesto. Explica los límites de plantas. Genera un borrador HTML con manifiesto y lo verifica. | Es la base de E2. |
| Pruebas catalogadas | `tests/ux07-activation.browser.test.cjs` (7 casos: editor → variantes → comparar, estados, ausentes, ajenos, integridad, edificio, negativos) | Cobertura diseñada. **No se ha reejecutado en esta sesión**: que esté catalogada no es un PASS nuevo. |

## 2. Diagnóstico reproducido (sin tocar el producto)

Fuente: `diagnostico/e2-diagnostico.cjs` sobre master, con fixtures sintéticas del producto. Resultado en `evidence/e2/diagnostico.json`.

| ID | Hallazgo reproducido | Gravedad |
|---|---|---|
| A25-1 | Presupuesto de «después» hecho sobre la revisión anterior. La nota afirma que «se ha comprobado que coinciden» y a continuación dice que no coinciden. El bloque muestra base, IVA y total como si fueran vigentes. | Alta: cifra desfasada presentada como actual |
| A25-2 | Con la comparación en estado `incoherent` (no se calcula la diferencia), el HTML descargable muestra igualmente el total individual de «después», que es de otra revisión. | Alta |
| A25-3 | Solo «antes» tiene presupuesto. La pantalla dice «Comparación no disponible», el núcleo rechaza antes-sin-después y `comparar.js` lo descarta en silencio: el borrador dice «Sin presupuesto». | Media: ausencia falsa |
| A25-4 | Solo «después» tiene presupuesto: el borrador muestra el presupuesto completo. Asimetría con A25-3. | Media |
| A26 / H03-1 | Tras cambiar variante y presupuesto en otra pestaña, el comparador abierto prepara el borrador con los datos retenidos al abrir, y «Verificar» lo da por bueno (`verify()` recibe `state.prepared`, no una lectura nueva). | Alta: obsolescencia no detectada |
| A26 / H03-2 | Si el presupuesto guardado cambia durante la preparación, el borrador sale con el estado leído al cargar, sin invalidar ni pedir reconfirmación. | Alta |
| D02 | El comparador no escribe en el almacenamiento: solo cambia lo que escribe la otra pestaña. | Correcto |
| H01 / H02 | El inventario del dossier no declara la página económica; la cabecera económica lee `brand.name`. Comprobado con y sin presupuesto y con y sin marca (`evidence/e2/h01-h02.json`). | Media: independientes de ENT-04 |
| Identidad de la fixture | La revisión `rv1-0f3e96422fd20e08` coincide con `RubikAssistantDomainTools.revision`. La huella FT3D-8 coincide con su función canónica (`evidence/e2/identidad-fixture.json`). | Correcto |

## 3. E2 corregido: corte mínimo propuesto (ENT-04)

**Objetivo:** que «Entregar» lleve al comparador existente y que este no presente datos desfasados como vigentes.

| Paso | Cambio | Archivos | Prueba |
|---|---|---|---|
| E2.1 | Entrada desde «Entregar» al comparador **existente**: el mismo `handoff`, con estados «sin original», «sin variante» y «selección no elegible» explicados | `js/professional-workspace-ui.js` (entrada), `index.html` (sin motores nuevos) | Navegador: Entregar → comparar con cada estado |
| E2.2 | A25: rótulos y omisiones inequívocos, sin recalcular el motor. <br>• Bloque individual frente a comparativo, con su revisión. <br>• En `incoherent` o en una sola cara, ninguna cifra de otra revisión en el HTML descargable. <br>• Solo-antes y solo-después simétricos. <br>• La nota de revisión no afirma coincidencia si no la hay (DEC-07). | `comparar/comparar.js` (`build`, `budgetBlock`, `html`) | Los 4 casos A25 como pruebas de regresión, en pantalla y en HTML |
| E2.3 | A26: obsolescencia. <br>• Antes de preparar, descargar y verificar, se relee el almacenamiento y se compara con el estado retenido. <br>• Si difiere: «El original o la variante han cambiado desde que abriste el comparador» y se pide reconfirmar. <br>• `verify()` distingue «borrador íntegro» de «coincide con lo guardado ahora». <br>• Nunca se guarda al pulsar Comparar. | `comparar/comparar.js` | Otra pestaña, carrera durante un `await` y descarga posterior; almacenamiento byte a byte igual antes y después |
| E2.4 | Texto de contexto: «Se compara lo guardado en este navegador», más el límite de varias plantas | `comparar/` | Revisión visual en 1440, 820 y 390 |
| Aparte | H01 y H02, fuera de ENT-04 y como correcciones independientes | `project-dossier-ui.js` | Las 4 combinaciones de `h01-h02` |

**Fuera de E2:**

- PDF avanzado;
- multimedia y ZIP;
- portal y publicación;
- el exportador del laboratorio y sus binarios;
- un núcleo `FloorPlanDelivery` paralelo.

No se sustituyen B1, Story, C4 ni la visita.

**Compatibilidad.** Los manifiestos 1.0 y 1.1 del dossier antes/después siguen verificando.

**Rollback.** Revertir los commits de E2.2 y E2.3 deja el comparador como está hoy. No hay migración de datos.

**Suites que deben pasar:**

- `ux07-activation`;
- las de dossier y biblioteca;
- los nuevos casos A25 y A26.

## 4. Cortes posteriores (roadmap maestro; sin IDs ni olas nuevos)

| Corte | Qué | Condiciones |
|---|---|---|
| E3 · ENT-03 | Compositor y marca: modalidades y recetas (v1.4 RP01–RP21) sobre la interfaz existente; tokens de color y tipografía (H07) con migración compatible | GO; modelo común verificado; revisión humana |
| E4 | Architecture Book y FF&E (ENT-05); Render IA trazable (IMG-12: persistir la imagen exacta enviada, la cámara y la revisión); exportación de Dibujo vivo | Sin IA de pago sin GO |
| E5 | PDF avanzado: anexos largos y tablas complejas; evaluar Typst con el mismo contrato (ADR aparte) | Un único motor mantenible |
| E6 · ENT-02/ENT-06 | Paquete del cliente y dossier del propietario; envío remoto | GOV-08 completo (S3 ≠ S4/S5, GOV-06a), GOV-05, DEC-05, IMG-04/IMG-12 |
| E7 · ENT-07 | Portal, aceptación y firma, posventa | GOV-06b y revisión jurídica |

**Pilares por delta de producto:**

- **FT3D-8:** entrega desde la biblioteca con el aviso de revisión del plan (E3/E6).
- **Dibujo vivo:** exportación de la apertura (E4/E5).
- **Render IA:** persistencia de la vista de origen (E4).
- **Visita:** enlace solo tras GOV-08 y DEC-05 (E6).

## 5. Decisiones del propietario pendientes

1. GO de E2 y base consolidada (con Codex).
2. ¿H01 y H02 van dentro del corte E2 o aparte?
3. DEC-05 (publicación remota de la obra).
4. H08: exposición de las referencias VIS en el Git público (`reports/13`).
