# RUBIK SOTA | MISIÓN PRESUPUESTAR 360

**Calculadoras de materiales, catálogos profesionales y precios integrados**  
**Documento maestro de misión, contratos y recuperación · v1.1 corregida · 23 de noviembre de 2026**  
**ESTADO: PENDIENTE / APARCADO — NO INICIAR DESARROLLO SIN NUEVO GO DEL PROPIETARIO**

**Proyecto:** RUBIK SOTA · `Juanmaes83/floorplan-3d`  
**Base original del documento:** `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b` (22/11/2026).  
**Última comparación de solo lectura:** `master@79214e14ed160dc5c85b13facaadbf4340eb8b8a` (23/11/2026, comprobación de esta revisión); desde la base original: dos commits, un único archivo modificado (`tests/qa-m2-novato.browser.test.cjs`), sin cambios en motores económicos dentro de esa comparación. **Este SHA no debe tratarse como HEAD futuro: reconfirmar al retomar.**  
**Naturaleza:** expediente estratégico y técnico **archivado para reanudación futura**. **No autoriza código, PR productiva, merge, publicación, gasto, migración, activación, pruebas con clientes ni acceso a datos reales.** Cualquier GO futuro será explícito, por corte, rama, SHA y alcance.  
**Responsables del gobierno:** propietario (decisión y autorizaciones); ChatGPT (auditoría y continuidad); Claude Code/Codex u otro agente designado (ejecución futura, exclusivamente en cortes autorizados). **No hay agente ejecutor asignado ni trabajo programado por este documento.**  
**Nota de nomenclatura:** las fases **P1–P4 de esta misión** son internas a PRESUPUESTAR 360 y **no sustituyen** los programas P1–P8 ni los IDs del plan maestro RUBIK SOTA.

---

## 00. Estado de conservación, decisión y resumen ejecutivo

> **PENDIENTE — ESTACIONADO SIN EJECUCIÓN.** Esta v1.1 conserva el encargo completo P1–P4 y sus criterios de aceptación para retomarlo sin repetir trabajos ni poner en riesgo RUBIK. La auditoría es de lectura de código y contratos; **no acredita pruebas nuevas, aceptación comercial ni implementación de las calculadoras**.
>
> **GO vigente:** ninguno para desarrollar esta misión. **NO-GO por defecto:** cambios productivos, merges, Production, migraciones, clientes reales, proveedores conectados y costes.

**Para retomar:** leer primero la sección 13 («Handoff de reanudación») y comprobar `AGENTS.md`, el HEAD real de `master`, PR abiertas, dueño de cada archivo y los gates M01/M02/A0/UX-312. El orden recomendado será **P0 → P2-A aislado**, mientras **P1-A** puede limitarse a diseño en paralelo sin tocar archivos compartidos.

### 00.1. Diferencia entre misión y autorización

- **Alcance preservado:** P1 navegación, P2 recetas y tres calculadoras, P3 catálogos e importadores, P4 cinco sistemas. Ninguno se elimina.
- **Estrategia:** aprovechar el cálculo de cantidades, Budget, CAT-IA, CostProvider, BC3, dossiers y plan de obra existentes.
- **No implementación actual:** el documento no asigna una tarea en marcha ni es un prompt de escritura inmediata.
- **Primera autorización futura sugerida:** inventario P0 de solo lectura; después, si se aprueba, P2-A exclusivamente en laboratorio, sin persistencia, interfaz productiva ni tarifas reales.

### 00.2. Resumen ejecutivo y decisión

**Misión.** Convertir **PRESUPUESTAR** en el centro profesional desde el que se consultan cantidades del proyecto, se calculan consumos y unidades de compra, se seleccionan materiales y productos desde catálogos propios o autorizados, se contrastan precios de materiales y se genera un presupuesto verificable, conservando todas las autoridades económicas existentes.

**Decisión recomendada para cuando se reactive: GO específico para especificación, diseño y pilotos aislados; NO-GO automático para integración productiva.** No se pretende copiar Baukit ni crear once calculadoras desconectadas. Se aprovecha la claridad de sus flujos de consumo y compra para transformar la infraestructura ya desarrollada de RUBIK en una experiencia comercial coherente y útil para arquitectos, interioristas, reformistas y constructoras.

**Regla central no negociable:** un proyecto, una fuente demostrable de cantidades por alcance, **un presupuesto canónico por sujeto/alcance compatible con el modelo vigente** y una sola autoridad de importes: `FloorPlanBudget.calculateBudget()`. No afirmar que ya existe una agregación canónica y validada de presupuestos para todo un edificio multinivel. Las calculadoras producen **propuestas no monetarias o partidas candidatas**; los precios solo pasan a activos por decisión explícita del profesional y mediante los flujos existentes. No habrá motores paralelos de presupuesto, resultados inventados ni publicación automática de precios importados.

**Cuatro fases aprobables de forma independiente:**

1. **P1 · Unificar PRESUPUESTAR:** reunir en una experiencia coherente cantidades, calculadoras, catálogos, fuentes de precios y presupuesto, preservando las rutas actuales.
2. **P2 · Motor de recetas + piloto:** pavimentos, pintura y alicatados; medición real o manual identificada → consumo técnico → unidades de compra → partida propuesta → confirmación.
3. **P3 · Catálogos y precios del profesional:** incorporar materiales, rendimientos, envases y formatos; importadores supervisados de CSV, XLS/XLSX y PDF; continuidad y privacidad reales como prerrequisito para uso comercial.
4. **P4 · Sistemas constructivos:** pladur, falsos techos, aislamiento, bloques y cubiertas; ampliar después según cobertura geométrica, datos técnicos, ensayos y demanda de profesionales.

### Resultado esperado para el profesional

Desde **PRESUPUESTAR**, sin abandonar el proyecto, el profesional puede: (a) conocer qué está medido y qué no; (b) seleccionar una calculadora o un producto autorizado; (c) utilizar un rendimiento técnico con fuente y revisión; (d) obtener cantidades y compra en paquetes/envases completos; (e) comparar tarifas y proveedores; (f) confirmar lo que entra en el presupuesto; y (g) generar un dossier económico consistente para el cliente.

**No se promete:** precios de mercado en tiempo real, automatización infalible de PDFs, un presupuesto certificado, cumplimiento normativo automático, compatibilidad universal de fabricantes ni biblioteca multiempresa operativa sin sus gates. **La lista de compra de materiales NO es el presupuesto completo de una reforma**: suministro, instalación, mano de obra, preparación, demolición, transporte y demás conceptos deben conservar identidades y alcances económicos independientes y verificables.

---

## 01. Estado real de RUBIK: reutilizar antes que construir

Esta misión se apoya en la lectura de código de `master` y el estado de la documentación vigente. **“Integrado” describe código presente; no equivale necesariamente a un servicio comercial validado en Production.**

| Capacidad | Autoridad / componente existente | Situación y frontera |
|:---|:---|:---|
| Superficies, perímetros, muros, huecos, pavimentos | `js/quantity-core.js`, `js/surface-core.js`, `js/quantity-schedule-core.js` | Motor de cantidades; estados `measured`, `estimated`, `unavailable`; la UI actual atiende la planta activa. |
| Partidas desde geometría | `js/budget-draft-core.js` | Suelo, rodapié, pintura, tabiquería nueva/demolición y carpinterías. Reconciliación con precios y revisiones previas. |
| Presupuesto, merma, IVA y revisión | `js/budget-core.js`, `js/budget-ui.js` | Única autoridad monetaria. Precio desconocido ≠ cero; presupuesto incompleto se declara como tal. |
| Fuentes de costes y procedencia | `js/cost-provider.js`, `js/budget-cost-bridge.js`, `js/cost-catalog-core.js` | Contratos normalizados y aplicación expresa. Coincidencia de unidades estricta; sin conversiones ficticias. |
| BC3, tarifas y BCCA aportada por profesional | `js/bc3-budget-core.js`, `js/reference-prices-ui.js` | Carga de BC3 en el navegador, búsqueda, columnas, comparación y revisión. BCCA gestionada por RUBIK continúa bloqueada por gate legal. |
| Catálogos de productos, colecciones e imágenes | `js/catalog-product-core.js`, `js/catalog-ui.js` | CAT-02, piloto local: fichas, SKU, marca, colección, variante, medidas, precio, fuente, fecha, licencia e imágenes; entrada JSON estructurado. |
| SKU de objeto 3D → partida | `js/catalog-placement-core.js`, `js/catalog-budget-core.js`, `js/cat04-ui.js` | CAT-03/CAT-04; productos colocados y vinculados; la partida usa Presupuestar. Dos GLB propios sintéticos, no catálogo real desplegado. |
| Dossier económico y exportación | `js/budget-presentation.js`, `js/economic-dossier-ui.js`, `js/bc3-budget-core.js` | CSV, JSON, BC3, presentación profesional y para cliente; no recalcula importes. |
| Plan de obra, expediente y asistentes | `js/construction-context.js`, `js/construction-dossier-core.js`, asistente | Lectores subordinados del presupuesto; no deben ver importes diferentes. |

**Límites demostrados que la misión debe atender:**

- **Efecto de lectura no pura:** `js/budget-ui.js` ejecuta `load()` y, en su `open()`, puede llamar a `save()` cuando no hay error de catálogo ni identidad insegura. Abrir un diálogo de presupuesto puede regenerar/escribir; **P1 no puede asumir lectura sin efectos** ni usar `FloorPlanBudgetUI.open()` para alimentar tarjetas de resumen.
- **Posible pérdida de partidas por regeneración:** `js/budget-draft-core.js` construye su lista desde `lines(project)` y `extraLines`. Una partida anterior que deje de estar en esas entradas no queda garantizada por el mero hecho de estar guardada; CAT-04 tiene una protección explícita de continuidad en `budget-ui.js` que **NO se hereda automáticamente por las recetas nuevas**. Requiere gate de preservación independiente, incluido fallo de adaptador o ficha.
- **Alcance económico:** una lista de envases de **suministro** no equivale a una partida de **suministro + instalación**; sin separar coberturas económicas el sistema puede duplicar importes aunque no duplique cantidades.
- **Procedencia de medición manual:** `budget-core.js` admite `manualQuantity(..., status: "measured")`; el campo `measured` por sí solo no prueba calibración geométrica ni certificación. Siempre mostrar `source.type` y naturaleza del dato.
- **Identidad y almacenamiento:** `budget-ui.js` guarda documentos por `project.id`; el código contiene protección contra identidades duplicadas, pero no significa multi-tenencia autenticada. `catalog-ui.js` utiliza `window.localStorage` local; ni los perfiles de estudio ni A0 acreditan aislamiento privado comercial.


- El acceso hoy está repartido entre **Presupuesto**, **Precios de referencia**, **Cantidades** y **Mis catálogos**. Integrar entradas y contexto es P1; no trasladar datos sin necesidad.
- CAT-IA importa **JSON de colección**, no cualquier archivo PDF/Excel. Los BC3 son un flujo distinto; tampoco constituyen por sí solos una biblioteca comercial de fichas con imágenes.
- `catalog-placement-core.js` rechaza el tipo `material` como objeto 3D. Es correcto: un bote o una caja se **consume**, no se coloca como un sofá. Falta el vínculo **material + receta + alcance medido**.
- CAT-04 resuelve conteos de objetos; no se permite transformar una cantidad de objetos en m² o metros lineales sin medición verificable.
- `budget-draft-core.js` genera su conjunto de partidas y acepta líneas adicionales mediante `extraLines`; una nueva integración debe garantizar la conservación de esas líneas al reabrir, exportar o cambiar geometría.
- La biblioteca de catálogos es **local por navegador**. GOV-06a/M02 y M01 (persistencia, restauración, aislamiento) impiden prometer aún almacenamiento privado multiempresa y sincronizado.
- El expediente de edificio conserva presupuestos por planta; no afirmar suma canónica de edificio completo hasta resolver y probar esa operación.

**Acta de base:** GitHub `master` original y comparación de solo lectura de portada; CAT-04 PR #237 fusionada el 16/11/2026; documentación `docs/cat-ia/*`, `docs/product/point-7*`, matriz v1.12 y continuidad operativa 22/11.

---

## 02. Principios de arquitectura y de producto

### 02.1. Mapa de autoridad

```text
FloorPlanProjectV1 / geometría + sujeto/alcance identificado
       (AUTENTICACIÓN / AISLAMIENTO COMERCIAL: NO ACREDITADOS)
          │
          ├── FloorPlanQuantities → medición con estado y procedencia
          │              │
          │              └── Recetas de consumo (NUEVO; puro, determinista)
          │                      └── propuesta: consumo + envases + trazabilidad
          │
          ├── CAT-IA → fichas comerciales, SKU, imagen, ficha técnica, versión
          │              └── oferta / referencia de precio, NUNCA aplicada sola
          │
          └── CostProvider / BC3 / tarifa / referencia BCCA legalmente aportada
                         │
            decisión explícita y reconciliación segura
                         ▼
             FloorPlanBudgetV1 (ÚNICO DOCUMENTO)
                         ▼
             FloorPlanBudget.calculateBudget()
                         ▼
       Presupuestar / Dossier / Entrega / Plan / Asistente
```

**No modificar al comienzo:** `quantity-core.js`, `budget-core.js`, `budget-draft-core.js`, `budget-ui.js`, `cost-provider.js`, `reference-prices-ui.js`, `catalog-product-core.js`, formatos de proyecto, persistencia ni la semántica CAT-IA. Las adaptaciones se construirán alrededor de sus contratos públicos y se propondrán de forma aditiva, con revisión de consumidores antes de una modificación de esquema.

### 02.2. Modelo de datos propuesto (no existe aún)

La salida de una receta podrá versionarse como `rubik-consumption-estimate/1`. Debe declarar: identidad de proyecto/alcance, revisión o huella geométrica, origen de cada medición (`quantity-engine` o manual claramente rotulada), fórmula y versión, producto/variante/catalogo cuando proceda, unidades técnicas, parámetros, pérdidas, unidades comerciales, reglas de redondeo, incertidumbres, documentos de origen, autor/fecha de aprobación y estado (`draft`, `requires-data`, `ready-for-review`, `applied`, `stale`).

**Separación obligatoria:** la receta calcula **cantidades y paquetes**; CAT-IA o CostProvider aporta **precios referenciales**; Budget Core calcula **importes presupuestarios solo tras aplicación autorizada**. El resumen de compra de una receta puede mencionar cobertura y envases, pero no calcular un segundo importe o total alternativo. Una estimación puede existir con coste desconocido. Una imagen nunca permite inferir un precio de forma automática.

**Unidades y empaquetado:** `FloorPlanBudget.UNITS` admite `m2`, `m` y `unit`; litros, sacos, cajas o rollos se expresarán como cantidades físicas trazadas dentro de la receta y, solo si se presupuestan como envases completos, como `unit` con identidad comercial y contenido acreditados. Cuando una propuesta calcula, por ejemplo, 9 cajas, puede proponer 9 `unit` identificadas como «caja de X m²», con precio por caja y **merma económica del 0 %** si la merma ya está incluida en el número de cajas. No introducir silenciosamente una nueva unidad monetaria sin compatibilidad, pruebas y autorización. No convertir `€/m²` en `€/caja` si falta la cobertura verificable; la equivalencia exige unidad, ficha y factor de conversión explícitos. Una partida existente en m² no se sustituye ni suma silenciosamente a otra de cajas: **evitar doble cómputo**.

**Reconciliación:** las partidas candidatas llevan identidad estable por proyecto, alcance, concepto económico (suministro / mano de obra / instalación / otros), receta y SKU/insumo; las revisiones de receta, geometría y catálogo viajan como metadatos separados. Cambios de cantidades o fichas invalidan la aceptación aplicable; nunca pisan precios revisados. La aplicación debe reutilizar `FloorPlanBudgetDraft` y los flujos `previewApply/apply` cuando corresponda; si estos contratos no bastan, proponer primero un adaptador con pruebas, no un motor alternativo.

### 02.3. Seguridad profesional y legal

No se incorporarán catálogos de terceros ni fotografías de productos sin derechos y procedencia acreditados; las afiliaciones comerciales requieren pruebas. Los descuentos, condiciones comerciales y precios importados no se publicarán a terceros por el hecho de estar en una tarifa local. Las bases oficiales gestionadas por RUBIK siguen supeditadas a gate legal. Importar una tarifa no implica autorización para redistribuirla. P3 con clientes reales requiere identidades, permisos, separación por organización, copias restaurables, borrado/exportación controlados y almacenamiento privado verificado.

---

## 03. Experiencia objetivo dentro de PRESUPUESTAR (P1)

### Propósito

Convertir los accesos dispersos en **una mesa de trabajo económica única**, conservando “Mi estudio” como acceso alternativo y biblioteca de identidad, no como segundo almacén.

### Recorrido UX propuesto

1. **Resumen del proyecto.** Superficies, planta activa, número de partidas, datos incompletos, precios por revisar y última revisión; no mezclar presupuesto de planta con edificio completo.
2. **Mediciones.** Reutilizar “Cantidades del proyecto”: estancias, pavimentos, muros y estado de precisión; acceso al plano y a la calibración si falta geometría.
3. **Calculadoras.** Biblioteca de recetas según datos disponibles, con indicador “medición disponible / requiere datos / no aplicable”. El piloto P2 aparece aquí cuando supere su gate.
4. **Catálogos y precios.** Mismo CAT-IA y las mismas fuentes BC3, tarifa del estudio, BCCA aportada y precios de ficha; acciones para importar, buscar, comparar, comprobar origen y revisar. No duplicar la biblioteca.
5. **Presupuesto.** Documento canónico por proyecto, partidas existentes, propuestas pendientes, importes conocidos/parciales, IVA, revisión, exportaciones.
6. **Entrega.** Ir al dossier económico ya existente sin volver a computar cantidades ni totales.

### Límites P1

**Incluido:** navegación, nomenclatura, acceso contextual, resumen de datos y estados **obtenidos sin mutación**, responsive móvil, foco/accesibilidad, retorno al proyecto y coherencia con Perla/UX-FIRST. **El diseño no debe abrir `FloorPlanBudgetUI.open()` con el solo propósito de consultar**, debido a sus escrituras posibles. Una lectura de resumen debe demostrar ausencia de escrituras de proyecto, presupuesto, tarifa y catálogo en el escenario y entorno aprobados. **Excluido:** nuevos cálculos, importadores universales, cambio de almacenamiento, nuevas fuentes de precios, modificación de fórmulas monetarias y publicación.

**Criterios P1:** todos los recorridos existentes son accesibles desde PRESUPUESTAR; **la navegación y los resúmenes de solo consulta no escriben ni regeneran presupuesto**; “Mi estudio” sigue funcionando; mismo presupuesto e idénticos importes antes/después; abrir-cerrar-reabrir no borra referencias ni revisiones; móvil de 390 px, escritorio de 1440 px y apaisado de 844 px sin acciones ocultas; navegación teclado y lector de pantalla verificadas; textos ES/EN correctos y regla vigente sobre nombres chinos respetada.

**Entregables P1:** inventario de rutas actuales, arquitectura de navegación y propuesta compatible con PERLA, prototipo visual con datos sintéticos, PR Draft solo cuando exista GO de implementación en rama aislada, evidencia desktop/móvil y matriz de no regresión y no escritura. **Gate P1:** aceptación visual humana y evidencia funcional de los enlaces, sin merge automático.

---

## 04. Motor de recetas y tres calculadoras piloto (P2)

### Propósito y contrato

Crear un **motor puro, explicable, versionado y no monetario** de consumo técnico y compra comercial. Debe funcionar sin conexión y sin proveedor externo, recibir cantidades y datos de producto autorizados, y devolver resultados reproducibles con fórmula visible. Reutiliza el motor de cantidades, pero **no calcula importes** ni escribe un presupuesto hasta una decisión expresa.

**Flujo obligatorio:** seleccionar alcance de **suministro y zona** → leer medición (o introducir manual con etiqueta) → introducir/seleccionar material con datos técnicos → calcular consumo → calcular unidades enteras de compra → mostrar variables, incertidumbre, desperdicio y supuestos → presentar propuesta y conflictos → resolver solapes con partidas existentes → confirmar incorporación al presupuesto mediante el contrato vigente → marcar revisión profesional. **P2-A solo llega a propuesta de solo lectura; confirmar y persistir corresponde a P2-B, con GO separado.**

### Calculadora A · Pavimentos

**Entrada:** área de pavimento por estancia/material (m² y estado), producto, formato comercial, m² útiles por caja, merma de instalación aprobada, eventual patrón de colocación cuando proceda.  
**Fórmulas generales:** área con merma = área medida × (1 + merma/100); cajas = `ceil(área con merma / cobertura neta verificada por caja)`.  
**Salida de receta:** m² netos, m² con merma, cajas completas, m² adquiridos, sobrante y estado de disponibilidad de referencia de precio (**sin calcular un importe presupuestario paralelo**); rodapiés/base aislante/film **solo** como partidas separadas cuando exista fórmula y datos.  
**No aceptable:** deducir cobertura por caja desde una foto, cobrar simultáneamente superficie con merma y cajas completas por el mismo suministro o cambiar por defecto el pavimento existente en Budget.

### Calculadora B · Pintura

**Entrada:** superficie neta de pared verificable, manos, rendimiento real por mano (m²/l) y condiciones de fabricante, merma, capacidad del envase, imprimación solo si está especificada.  
**Fórmulas generales:** litros base = superficie × manos / rendimiento, siempre que esa definición coincida con la ficha técnica; litros a comprar = litros base × (1 + merma/100); envases = `ceil(litros a comprar / litros por envase)` para un formato homogéneo.  
**Salida de receta:** litros, envases, sobrante, fuente de rendimiento, superficie y manos declaradas, estado de referencia de precio; **sin segundo total monetario**.  
**No aceptable:** asumir que todas las pinturas cubren lo mismo, usar muro bruto sin descontar huecos cuando la medición real está disponible, inventar imprimación o aplicar dos veces la merma.

### Calculadora C · Alicatados

**Entrada:** superficie verificada de suelo o paramento, formato/paquete, modulación, merma; adhesivo y rejuntado solo con consumo del fabricante y variables necesarias (tamaño, soporte, llana, juntas, profundidad cuando corresponda).  
**Salida de receta:** cajas o piezas de baldosa y, cuando exista dato suficiente, sacos de adhesivo y unidades de rejuntado como **insumos independientes**; cada uno lleva unidad, cobertura, origen y estado de referencia de precio, pero el importe solo nace en Budget tras confirmación.  
**No aceptable:** inferir el área a alicatar de una estancia completa sin que el profesional haya especificado paredes/alturas; asumir rendimientos universales para adhesivo/juntas; tratar cantidad desconocida como cero.

### Matriz mínima de pruebas P2

| Caso | Resultado exigible |
|:---|:---|
| Geometría calibrada / no calibrada | Se muestra `measured` o `estimated` según motor; ninguna certeza añadida. |
| Sin superficie / sin rendimiento / sin cobertura por caja | `requires-data` o `unavailable`; sin unidades ni importes falsos. |
| Diferencia entre precio por m², por caja y por unidad | No se aplica sin equivalencia contractual y revisión. |
| Recuento entero de envases | `ceil` estable, incluidos bordes exactos y decimales. |
| Merma incorporada a unidades comerciales | La partida de envases no vuelve a añadir el mismo porcentaje. |
| Dos propuestas sobre el mismo alcance/material | Aviso y bloqueo de doble suministro salvo decisión explícita y documentada. |
| Cambio de plano, tarifa, SKU o ficha técnica | Propuesta marcada `stale`, nunca actualizada o aplicada en silencio. |
| Reapertura, importación, duplicación, undo/redo | La decisión y la procedencia sobreviven o el sistema conserva el documento anterior sin pérdida. |
| Presupuesto y dossier | Importe idéntico a `calculateBudget()`, sin segundo total de la calculadora. |
| Partida mixta existente | Suministro vs. instalación/mano de obra separados; bloqueo o conciliación explícita antes de añadir cajas. |
| Reapertura sin módulo de receta / fallo de catálogo | No se borra ni pierde precio, IVA, merma o revisión de partida ya aplicada; si no hay garantía, `BLOCKED`. |
| Consulta sin escrituras | Abrir resumen y previsualizar propuesta no llaman a `save()` ni mutan almacenamiento. |
| Cambio de fuente o alcance tras revisión | La propuesta aplicada pierde vigencia hasta revisión; se distingue de cambio meramente visual. |
| CI y navegador | Suites puras y E2E, ES/EN, 1440×900, 390×844, 844×390; 0 regresiones no explicadas. |

**Entregables P2-A:** contrato de receta, fixtures sintéticos, fórmulas con variables y unidad, tres núcleos no monetarios, casos negativos, pruebas puras y resultados reproducibles, sin almacenamiento ni integración de UI. **Entregables P2-B (solo con GO posterior):** adaptador de partidas, vista previa y resolución de conflictos, tests de persistencia/reapertura/importación, regresiones y Preview aislada para revisión humana. **Gate P2 completo:** cada calculadora llega a un presupuesto sintético real de RUBIK sin discrepancia, doble cómputo, pérdida de partidas ni precio aplicado automáticamente.

---

## 05. Gestión de catálogos y precios del profesional (P3)

### Propósito

Permitir que, **desde PRESUPUESTAR**, un profesional seleccione o incorpore su catálogo de productos, sus tarifas y sus documentos de precios; todo ello podrá reutilizarse desde “Mi estudio”, sin crear una segunda biblioteca ni romper CAT-IA.

### 05.1. Dos dominios distintos que deben estar relacionados

**Catálogo comercial CAT-IA:** SKU, variante, fabricante, colección, tipo de producto, imágenes con permisos, dimensiones, ficha técnica, disponibilidad, precio, moneda, unidad, fecha, versión, identidad de estudio y permiso.  
**Fuente económica / tarifa:** concepto o SKU, descripción, unidad, precio, impuesto cuando proceda, proveedor, vigencia, región, columna, moneda y procedencia; puede ser BC3 o fichero importado.  
**Relación:** un producto puede apuntar a una o varias referencias económicas compatibles, pero no se fusionan ni sobrescriben automáticamente. Una tarifa no se transforma en una ficha comercial con imagen, marca o características inventadas.

### 05.2. Importadores por madurez

**Seguridad adicional para P3-B:** CSV: separadores/decimales, codificación e inyección de fórmulas en celdas exportadas; XLS/XLSX: fórmulas no evaluadas, macros/enlaces externos, hojas ocultas, fechas y celdas combinadas; PDF: tablas fragmentadas, texto extraíble incorrecto, anotaciones/enlaces y extracción ambigua. Aplicar límites de tamaño, filas, columnas y descompresión; ninguna ejecución de macros, vínculos remotos o contenido activo; los originales se conservan solo si el contrato de permisos y retención está acreditado. Una importación produce candidatos revisables, **nunca altera por sí sola una ficha, presupuesto o precio activo**.


| Fuente | Estado hoy | Nuevo tratamiento necesario |
|:---|:---|:---|
| BC3 / FIEBDC-3 | Implementado como entrada local de precio | Acceso unificado y posible conservación privada solo tras gates; no clonar parser. |
| JSON CAT-IA | Implementado para colección propia | Reutilizar validadores, límites, licencias, revisión y huellas. |
| CSV | Nuevo | Mapeo explícito de columnas y unidades, decimal regional, codificación y vista previa. |
| XLS / XLSX | Nuevo | Selección de hoja, columnas, fórmulas/valores, celdas combinadas, duplicados y vista previa. |
| PDF con lista de precios | Nuevo, alto riesgo | Extracción supervisada; tablas ambiguas quedan sin validar; original y huella conservados según permisos. |
| PDF comercial con fotos y referencias | Nuevo, alto riesgo | No inferir SKU, marca, rendimiento o derechos solo por imagen; asociar imágenes únicamente con correspondencia verificable. |

**Flujo de incorporación supervisada:** seleccionar fuente → verificar formato/seguridad/tamaño → extraer sin publicar → mapear columnas y unidades → clasificar `producto`, `material`, `tarifa` o `documento pendiente` → señalar incertidumbres → previsualizar altas/modificaciones/rechazos → comprobar licencia, identidad, precios y fecha → aprobar manualmente → versionar y almacenar según permisos → ofrecer referencias no aplicadas en presupuesto.

### 05.3. Ampliación mínima de ficha para materiales

Se propone un anexo versionado o nuevo contrato subordinado al producto, nunca insertar campos sin migración: forma de venta (`caja`, `bote`, `saco`, `rollo`, `panel`, `pieza`), contenido verificable (m²/caja, l/bote, kg/saco, piezas/paquete), rendimiento técnico con unidad y condiciones de medición, restricciones, fuente, versión de ficha, fecha, derechos de uso, merma recomendada **solo si está documentada**, variantes y proveedor. **Una misma propiedad de producto debe mantenerse en su autoridad comercial; la receta solo referencia su versión.**

### 05.4. Privacidad, persistencia y modelos de tenencia

La entrada actual de CAT-IA usa `localStorage`, con perfil de estudio **no equivalente a un permiso multiempresa**. Hasta cerrar y demostrar M01, M02/GOV-06a y las capacidades de backup/recuperación, P3 se limita a fixtures y documentos sintéticos/autorizados en un piloto aislado. Para uso comercial serán requisitos: autenticación, separación org/profesional/proyecto, cifrado y permisos según arquitectura aprobada, versionado, límites, eliminación/exportación, restauración ensayada y registro de derechos. No subir datos a un LLM por defecto ni entregar archivos de clientes a otros estudios.

### 05.5. Estados de precio y decisión profesional

**Modelo de tarifa y precio:** mantener separadas la lista comercial del fabricante/proveedor, el descuento o condición privada negociada, la referencia orientativa y el precio aplicado/revisado en Budget. No inferir que un precio de catálogo incluye transporte, montaje, impuestos o instalación. La vigencia de cada condición se evaluará contra su propia edición, proveedor, región, unidad y fecha.


`desconocido` → `referencia encontrada` → `seleccionada para contraste` → `vista previa` → `aplicada sin revisar` → `revisada`; cuando cambie la fuente, `desactualizada` y nueva confirmación. **Precio de referencia no es presupuesto aceptado; fecha desconocida no se inventa; precio ausente no es 0; una partida aprobada no se sustituye de forma silenciosa.** BCCA gestionada sigue cerrada sin permiso acreditado.

**Entregables P3:** especificación de esquema material y trazabilidad, importadores separados por formato, batería de documentos sintéticos con adversariales, UX de carga y revisión, evidencia legal/seguridad, matriz de persistencia y restauración. **Gate P3 comercial:** identidad de estudio real, datos privados protegidos, prueba de recuperación y aceptación expresa del propietario; antes solo piloto local aislado.

---

## 06. Sistemas constructivos y ampliación progresiva (P4)

**Objetivo:** reutilizar el mismo motor de recetas con nuevos sistemas constructivos, **sin ampliar la autoridad de geometría ni dar por conocido el detalle constructivo**; las fórmulas y la compra comercial son independientes de la certificación normativa o estructural.

| Sistema | Medición y entradas | Consumo que puede proponerse | Gate específico |
|:---|:---|:---|:---|
| Pladur / tabiquería seca | Superficie neta, número de caras y placas, alturas, huecos, modulación y perfilería | Placas, perfiles, montantes, aislamiento, tornillos, cintas y pasta | Reglas verificadas por sistema/fabricante; no inferir soluciones constructivas genéricas. |
| Falso techo | Área y perímetro verificables, tipología, modulación y puntos de suspensión | Placas, perfiles, cuelgues y accesorios | Geometría y separación de apoyos validada; sin pretender cálculo estructural. |
| Aislamiento de fachadas/interiores | Superficie y espesor, formato, tipo de fijación y base | Paneles/rollos, anclajes, adhesivos o mallas cuando aplique | Fuente técnica, superficie neta y advertencia de idoneidad/normativa. |
| Bloques / ladrillos | Muros y huecos, módulo, juntas y espesor | Piezas, mortero, mermas | Consumo específico, geometría comprobada y límites estructurales. |
| Cubiertas | Geometría de cubierta disponible, pendientes, encuentros y materiales | Área de cobertura, tejas/paneles, solapes, remates | No confundir envolvente/huella con superficie ejecutable; no emitir cantidades si faltan pendientes o detalles. |

**Evolución posterior (no incluida en la primera aceptación de P4):** hormigón de cimentación, carpinterías técnicas, instalaciones, superficies bajo cubierta con criterios de cada país y calculadoras públicas independientes orientadas a SEO/GEO/captación. Cada ampliación requiere tesis de demanda, modelo de datos suficiente y revisión de la precisión.

**Entregables P4:** fichas de sistema, fórmulas versionadas y con bibliografía técnica, corpus de casos y límites, pruebas comparadas con cálculo humano, interfaz coherente, aceptación profesional antes de etiquetar “disponible”.

---

## 07. Modelo de experiencia: de la medición a la entrega

### Pantalla propuesta de PRESUPUESTAR

**Pestañas o subáreas propuestas (NO diseño aprobado):** Resumen | Cantidades | Calculadoras | Catálogos y tarifas | Presupuesto | Dossier. Son superficies UI del **mismo flujo**, no servicios autónomos. “Mi estudio” ofrece otro acceso a la misma biblioteca; “Entregar” consume el mismo presupuesto, nunca una copia calculada.

### Materiales de compra frente a presupuesto de obra

El mismo proyecto puede necesitar dos representaciones económicas **relacionadas, no intercambiables**:

1. **Lista de compra:** material, envase/formato, cobertura, unidades enteras, sobrante, fabricante/fuente, precio de referencia si está disponible. Su cantidad puede calcularse antes de existir un presupuesto revisado.
2. **Presupuesto profesional:** partidas de suministro, instalación/mano de obra, retirada/preparación, medios, transporte y demás conceptos que realmente correspondan. El total procede exclusivamente de `FloorPlanBudget.calculateBudget()`.

Antes de aplicar una propuesta, comprobar alcance espacial, material, trabajo incluido, unidad, revisión y partidas existentes. Una partida de «pavimento instalado» no es automáticamente equivalente a «cajas de pavimento». Si no puede separarse el suministro sin modificar un presupuesto revisado, **bloquear y pedir decisión profesional**, sin inventar un descuento ni sustraer importes a ojo.

### Escenario de aceptación realista (datos sintéticos)

**Reforma de salón, pavimento:** 21,4 m² de suelo verificados por `FloorPlanQuantities`; material de prueba con 2,20 m² útiles por caja; merma de prueba 7 %. Consumo 22,898 m²; necesidad 11 cajas; compra 24,20 m², sobrante comercial 1,302 m² respecto al requerimiento con merma. **Estos valores son exclusivamente un fixture para validar fórmulas, no una oferta ni un precio de mercado.**

El profesional ve la superficie medida y su estado, elige producto con ficha y cobertura verificadas, inspecciona la fórmula y el redondeo, recibe 11 cajas como propuesta, elige o introduce un **precio por caja** con procedencia, confirma el cambio y revisa la partida; el dossier presenta el mismo importe que Budget. Si la ficha carece de cobertura, no aparece “11 cajas”; si la propuesta colisiona con una partida de pavimento que ya representa el mismo suministro, la interfaz exige resolver el duplicado.

### Trazabilidad en cada cifra visible

Mostrar **dato → fuente → fórmula → versión → fecha → quién lo revisó → estado**. Un resumen adecuado distingue: “medido”, “calculado según ficha”, “estimado con parámetros declarados”, “precio de referencia”, “precio propio”, “pendiente de revisar”, “sin datos” y “fuente desactualizada”. Nunca presentar una cantidad parcial como completa.

---

## 08. Plan de cortes, coordinación y autorizaciones

**Misión estacionada: no iniciar ninguna PR ni tarea productiva ahora.** Al reactivarla, no sustituir el roadmap maestro ni abrir cuatro PR productivas simultáneas. Cada fase dispone de *preflight* con repositorio, `master` y PR activos; existe un laboratorio o rama propia por corte, y se publica como Draft con evidencias y sin merge automático. Se preservan A0, persistencia, SCULPT, las ramas de Claude Code/Codex y los cambios de otros agentes.

| Corte operativo | Tipo de trabajo | Dependencias y condición de salida |
|:---|:---|:---|
| **P0 · Inventario congelado** | Auditoría/contrato, sin editar producción | Releer `AGENTS.md`, continuidad, consumidores, PR y contratos; reconciliar con SHA vigente; mapa de qué operaciones son de lectura o escritura y propietario de cada archivo. |
| **P1-A · Flujo UX** | Navegación/descubribilidad, sin fórmulas | Prototipo y retorno seguro, escritorio/móvil, accesibilidad, no regresiones económicas. |
| **P2-A · Core recetas** | Módulo puro aislado, **primera implementación sugerida tras GO** | Contrato versionado, fixtures propios, unidades/estados/merma, material vs. instalación, pruebas de borde; sin DOM, almacenamiento, Budget ni catálogos de clientes. |
| **P2-B · Tres calculadoras** | Integración solo tras GO y P2-A | Adapter de propuesta y UI en Draft, conservación de `extraLines` y confirmaciones; pruebas E2E de doble suministro, presupuesto intacto, lectura sin escrituras y aceptación humana. |
| **P3-A · Material técnico** | Contrato CAT-IA subordinado, Draft | Revisión de licencias y compatibilidad; no cambiar productos existentes silenciosamente. |
| **P3-B · Importadores supervisados** | CSV/Excel/PDF por cortes independientes | Errores negativos, revisión de columnas, no LLM automático, límites de seguridad. |
| **P3-C · Biblioteca comercial privada** | Integración condicionada | Bloqueado hasta gates M01/M02/GOV-06a, aislamiento, restauración y autorización. |
| **P4-A–E · Sistemas** | Una familia por corte independiente | Dataset profesional autorizado, fórmulas de fabricante y regresión por sistema. |

**Paralelización segura:** una vez reactivada la misión, mientras P1-A **documenta** UX coordinado con PERLA, P2-A puede investigar fórmulas en un laboratorio sin modificar archivos compartidos. P3-A puede inventariar esquemas como documentación. **Prohibido** desarrollar a la vez integraciones divergentes de `budget-ui.js`, `budget-draft-core.js`, `reference-prices-ui.js`, `catalog-product-core.js`, `catalog-ui.js`, `index.html` o sus tests de navegador sin designar propietario de integración y contrato común. **UX-312/PERLA tiene prioridad sobre navegación compartida; A0/M01 tiene prioridad sobre persistencia; Codex conserva su propia misión.** P4 comienza con datos de P2 validados, no antes.

**Aprobaciones separadas:** 1) misión y alcance; 2) cada implementación/corte; 3) PR y SHA exacto para fusionar; 4) despliegue/activación; 5) acceso a datos reales y cualquier gasto. Un GO de diseño no cubre ninguno de los puntos siguientes.

---

## 09. Gates de calidad y contrato de aceptación

Para declarar una fase **ACCEPTADA**, presentar una matriz con evidencia concreta, SHA y entorno para los siguientes ejes. Ningún “PASS” histórico acredita otro SHA ni un despliegue posterior.

| Gate | Criterio verificable | Bloquea si… |
|:---|:---|:---|
| **G1 · Autoridad única** | Cantidades provienen de motor original o manual declarado; importe de `calculateBudget()`; dossier y asistente leen el mismo valor. | Existe fórmula monetaria paralela o dos totales incompatibles. |
| **G2 · Integridad** | Abrir, guardar, reabrir, exportar/importar, duplicar y deshacer conservan partidas confirmadas, revisiones, impuestos y referencias. | Una línea desaparece o cambia de unidad/valor sin aviso. |
| **G3 · No invención** | Sin dato se indica desconocido; coberturas y precios exigen fuente, unidad, fecha y condiciones. | Aparece precio/cantidad inventada, 0 falsamente conocido o precisión no acreditada. |
| **G4 · No duplicidad** | Merma única y detección de suministros repetidos en la misma zona. | Se suman m² y cajas del mismo material sin decisión expresa. |
| **G5 · Licencia y privacidad** | Fichas, imágenes y tarifas con derechos; no se mezclan estudios; servicios sin autorización bloqueados. | Reutilización/almacenamiento no autorizado o exposición entre clientes. |
| **G6 · UX y accesibilidad** | Rutas reales, móvil/escritorio, estados claros, navegación teclado y revisión visual humana. | Función inaccesible, interfaz degradada o promesa no verificable. |
| **G7 · CI y regresión** | Unit, integración, navegador y QA negativo en el commit exacto; evidencias reproducibles. | Falla un gate crítico o la prueba carece de procedencia. |
| **G8 · Operación** | Preview autenticada o pública según contrato, permiso de publicación, persistencia/restauración, rollback y coste. | No hay autorización expresa o siguen abiertos los prerequisitos M01/M02. |
| **G9 · Lectura no mutante** | La consulta, previsualización y navegación no escriben presupuesto, catálogo, proyecto ni tarifa; sonda por navegador y test de retorno. | Una lectura ejecuta `save()` o actualiza precios/revisiones sin decisión. |
| **G10 · Concepto económico único** | Material/compra e instalación/mano de obra se identifican y concilian frente a partidas mixtas. | La misma compra se suma dentro de una partida instalada y de una caja propuesta. |
| **G11 · Regeneración reversible** | Una receta aplicada persiste tras regeneración, fallo de adaptador, cambio de geometría, importación y recuperación; o se declara HOLD antes de escribir. | Una línea de `extraLines` desaparece o pierde precio/IVA/revisión al omitir el adaptador. |
| **G12 · Vigencia fuerte** | Revisión/huella de proyecto, receta, producto y tarifa; propuestas obsoletas quedan bloqueadas en confirmación y generación de documento. | Se aplica una propuesta calculada con datos que cambiaron desde la vista previa. |

### Pruebas negativas imprescindibles

Lectura que escribe inesperadamente; adaptador de receta ausente; presupuesto regenerado sin `extraLines`; partida mixta suministro+instalación; fecha o revisión alterada entre preview y aplicar; SKU repetido entre estudios; PDF ambiguo; Excel con fórmula no evaluada; CSV con separadores decimales inconsistentes; archivo sobredimensionado o dañado; referencia/licencia vencida; IVA incompatible; precio desactualizado; unidad `€/m²` aplicada a `ud`; m² negativos o cero; obra sin escala calibrada; volumen/cubierta sin geometría suficiente; doble merma; duplicado entre receta y partida existente; dos proyectos con identidad cruzada; importación cancelada; falta de `RubikCat04`; fallo al persistir; cambio de hoja o SKU durante confirmación; lectura del dossier con el presupuesto parcial; móvil sin acceso al botón de confirmación.

### Evidencia exigida por corte

Repo, rama, SHA completo, árbol y base; alcance exacto y módulos editados; relación de tests con número y resultado; artefactos de CI; enlace Preview del SHA si corresponde; capturas y vídeo desktop/móvil cuando proceda; matriz de incidencias y riesgos; estado de licencias; decisiones humanas; criterio de rollback y siguiente paso. Sin publicación verificable en GitHub, un corte autorizado **no se declara entregado**.

---

## 10. Riesgos priorizados y límites de negocio

| Riesgo / severidad | Consecuencia | Control y responsable de cierre |
|:---|:---|:---|
| **R1 · Pérdida de presupuesto / CRÍTICO** | Desaparecen precios confirmados o partidas importadas. | Adaptadores aditivos, snapshot, test reabrir/undo/import; ingeniería + gate independiente. |
| **R2 · Doble cómputo / CRÍTICO** | Mermas, área y envases se cobran dos veces. | Identidad de suministro y alcance; control de conflicto antes de aplicar. |
| **R3 · Catálogo privado sin aislamiento / CRÍTICO** | Fuga de precios/documentos de clientes. | P3 comercial bloqueado por M01/M02/GOV-06a y auditoría de permisos. |
| **R4 · Unidades y rendimientos erróneos / ALTO** | Cantidades de compra inservibles. | Conversión documentada, fichas de fabricante y pruebas frontera. |
| **R5 · Precio inventado o antiguo / ALTO** | Presupuesto engañoso. | Procedencia, fecha, estado, comparador y revisión manual. |
| **R6 · PDFs/Excel mal interpretados / ALTO** | Importación corrupta o falsa. | Vista previa, mapping, validación, rechazo controlado, no ingestión silenciosa. |
| **R7 · Choque multiagente / ALTO** | Regresiones en Budget, CAT-IA o UX compartida. | Un responsable por archivo compartido, ramas aisladas y protocolo vigente. |
| **R8 · Superficie/altura no demostrable / ALTO** | Estimación imprecisa anunciada como medida. | Estados `estimated`/`unavailable`, ajuste manual rotulado y no aplicación automática. |
| **R9 · Cumplimiento normativo ficticio / ALTO** | Riesgo profesional y legal. | No presentar recetas como cálculo estructural o certificado normativo. |
| **R10 · Alcance desbordado / MEDIO** | Retrasa M01/A0 y otros cierres. | Tres recetas piloto, gates secuenciales, fase P4 separada. |
| **R11 · Lectura con escritura / CRÍTICO** | Abrir o resumir Presupuestar modifica documentos sin intención. | P0 mapa de efectos y G9 sonda de no escritura en P1. |
| **R12 · Línea aplicada desaparece / CRÍTICO** | Regeneración sin adaptador borra receta o revisión económica. | G11 continuidad tras `extraLines` ausente y guardado fallido; rollback probado. |
| **R13 · Suministro vs. instalación / CRÍTICO** | Duplica parte de una partida mixta del presupuesto. | Alcance económico versionado y aprobación explícita; G10. |
| **R14 · Datos caducados durante confirmación / ALTO** | Se aplica receta con ficha o plano modificado. | Huellas independientes, invalidación y comprobación en momento de aplicar; G12. |

**Dependencias vivas:** M01 recuperación integral aún no acreditada; A0 #310 con gate de concurrencia WebKit/Firefox abierto; M02/GOV-06a sin biblioteca privada comercial cerrada; aprobaciones de licencias; trabajos activos en PR Draft; aceptación humana. Estos bloqueos no impiden investigación, prototipos o pruebas aisladas sintéticas.

---

## 11. Entregables finales y definición de éxito

**Al terminar P1:** todas las capacidades económicas existentes se descubren y navegan de forma coherente desde PRESUPUESTAR sin cambios en importes, documentos ni rutas antiguas.  
**Al terminar P2:** tres calculadoras trazables generan propuestas de compra y partidas verificables; no hay fórmulas monetarias alternativas, dobles cobros ni aplicación automática.  
**Al terminar P3 técnico:** el sistema admite materiales con rendimiento y formatos comerciales; los importadores convierten documentos en propuestas supervisadas y versionadas. **La biblioteca privada comercial no se anuncia completa** hasta cerrar seguridad y restauración.  
**Al terminar P4:** los cinco sistemas priorizados pueden calcular materiales bajo supuestos verificables, con límites expresos y aceptación profesional independiente por sistema.

**Indicadores de resultado a instrumentar (no inventar objetivos ni porcentajes antes del piloto):** tiempo hasta primera estimación útil; proporción de partidas con origen verificado; incidencias de unidad/merma/doble cobro; tasa de importación aceptada/rechazada; porcentaje de presupuestos completos y revisados; coherencia presupuesto-dossier; tareas terminadas en móvil; satisfacción de profesionales piloto. Medir con fixtures primero y con un piloto real autorizado después.

**Decisiones que necesita el propietario, por este orden:** aprobación de la misión; prioridad del piloto P1/P2 frente a los gates M01/A0 en curso; aceptación de la nomenclatura UX; confirmación de mercados prioritarios y especialidades para futuras recetas; autorización separada de pruebas con catálogos reales; GO específico de cada PR, merge y despliegue.

**Estado de esta versión v1.1:** **misión aparcada**, sin ejecución P0–P4 autorizada ni test nueva atribuible a la misión. Este documento puede almacenarse como archivo documental en una rama aparte, **sin cambiar `master` ni Production**. Ninguna futura aprobación de PR o piloto se infiere de este archivo.

---

## 12. Fuentes canónicas y trazabilidad documental

### Código y contratos RUBIK (comprobados en `master`)

- [Repositorio](https://github.com/Juanmaes83/floorplan-3d)
- [Instrucciones de agentes](https://github.com/Juanmaes83/floorplan-3d/blob/master/AGENTS.md)
- [Coordinación multiagente](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md)
- [Continuidad vigente](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/integration/CONTINUIDAD-OPERATIVA-VIGENTE.md)
- [Matriz de trazabilidad](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/MATRIZ-TRAZABILIDAD-v1.12.md)
- [Quantity Engine](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/quantity-core.js)
- [Budget Core](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/budget-core.js)
- [Draft](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/budget-draft-core.js)
- [Budget UI](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/budget-ui.js)
- [CostCatalog](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/cost-catalog-core.js)
- [Reference Prices UI](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/reference-prices-ui.js)
- [CAT-IA contratos](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/cat-ia/01-contratos-v1.md)
- [CAT-IA → Budget](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/catalog-budget-core.js)
- [CAT-04 · PR #237](https://github.com/Juanmaes83/floorplan-3d/pull/237)
- [Catálogo UI](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/catalog-ui.js)
- [Dossier económico](https://github.com/Juanmaes83/floorplan-3d/blob/master/js/economic-dossier-ui.js)

### Referencia de producto externa (inspiración, no fuente de precios españoles)

- [Baukit, inicio](https://baukit.app/en)
- [Baukit, calculadoras y guías](https://baukit.app/en/guide)
- [Baukit, calculadora de pintura](https://baukit.app/en/calculator/paint)
- [Baukit, calculadora de baldosas](https://baukit.app/en/calculator/tiles)

**Control de cambios:** v1.0 (22/11/2026), misión integrada P1–P4 a partir de auditoría dirigida de código y documentación. **v1.1 (23/11/2026):** corrección por auditoría de `budget-ui`/`budget-draft-core`/CAT-IA, consulta sin escrituras, continuidad `extraLines`, material vs. instalación, procedencia de cantidad manual, aislamiento, vigencia y gates de reanudación. Releer la referencia de `master`, PR abiertas y gates antes de ejecutar cualquier corte; esta misión no congela el repositorio ni autoriza trabajo productivo.


---

## 13. Handoff operativo para retomar la misión dentro de unos días

> **PALABRA DE RECUPERACIÓN:** `REANUDAR PRESUPUESTAR 360 V1.1`. No usar este handoff como autorización. El propietario debe aprobar el siguiente corte y su alcance.

### 13.1. Estado que debe encontrarse al reabrir

| Elemento | Estado conservado al 23/11/2026 | Qué comprobar de nuevo |
|:---|:---|:---|
| Misión P1–P4 | Especificada y corregida, **pendiente** | Si existe una nueva versión/documento o decisión que la sustituya |
| P0 inventario | Propuesto; **no ejecutado como corte** | `master`, contratos, PR, consumidores y responsables |
| P1 UX | Diseño condicionado por PERLA | Rama/HEAD de Claude Code 1 y superficies compartidas |
| P2-A recetas | **No implementado** | Código ya creado por otros agentes y pruebas disponibles |
| P2-B integración Budget | **No implementado** | Estado de `extraLines`, guarda, precio y revisión |
| P3 privado | **NO-GO comercial** | M01/M02/GOV-06a, A0, restauración, licencias |
| P4 sistemas | **No implementado** | Resultado y validación profesional de P2 |
| A0 #310 | NO-GO histórico | Estado vigente y autoridad de persistencia |
| M07 #317 / M13 #316 / Simulator B #313 | PR abiertas en el corte consultado | Estado real, merges y conflictos antes de trabajar |
| `master` | `79214e14ed160dc5c85b13facaadbf4340eb8b8a` auditado | HEAD real y diff contra SHA auditado |

### 13.2. Protocolo de reanudación — no omitir

1. **Leer esta v1.1 completa** y la v1.0 de origen solo para trazabilidad; no reabrir la discusión estratégica desde cero.
2. **Consultar GitHub de nuevo:** `master`, PR abiertas/draft/merged, ramas, `AGENTS.md`, protocolo multiagente, continuidad y pruebas. El SHA de este documento es evidencia histórica, no condición para un checkout futuro.
3. **Preparar informe DELTA:** qué cambió desde `79214e14...`, qué contratos nuevos afectan a Budget/CAT/Quantity y qué gates están abiertos.
4. **Coordinar propietarios de las superficies compartidas:** PERLA/UX, A0/persistencia, CAT-IA, Budget, dossier, tests. Evitar cambios a la vez sobre el mismo archivo.
5. **Decidir alcance del primer GO:** recomendación P0 (solo lectura) y, después, **P2-A motor puro en laboratorio**. No iniciar P2-B, P3 ni P4 sin gates y autorizaciones independientes.
6. **Congelar fixtures y probar casos negativos:** falta de escala, fuente caducada, importador ausente, partida con precio revisado, unidad conflictiva, merma doble, partida mixta suministro-instalación, lectura que escribe y colisión entre IDs.
7. **Exigir informe y evidencia exactos:** rama exclusiva, commit/árbol/base, diffs, PASS/FAIL/BLOCKED/NOT_RUN, Preview de laboratorio si procede y revisión visual humana. Sin publicación verificable no hay corte entregado.

### 13.3. Primera misión autorizable, solo cuando el propietario lo indique

**P0 + P2-A, no más.** P0 verifica contratos; P2-A produce tres calculadoras puras —pavimentos, pintura y alicatados— con datos sintéticos y capacidad de explicar consumo y envases. Debe mantenerse **fuera de producción, sin cambiar presupuestos, catálogos, modelos, UI ni persistencia**, ni reclamar acceso a clientes o a productos reales. P2-B vendrá después y tendrá su propio gate de integridad.

### 13.4. Definición de «listo para reactivar»

Se considera preparada la misión cuando existe este expediente v1.1, el propietario puede recuperar las fuentes y entiende los límites del primer corte. **No significa que se haya resuelto A0, ni que las calculadoras existan, ni que Budget ya conserve de manera segura nuevas partidas.**

### 13.5. Registro de decisiones reservadas al propietario

- Cuándo reactivar y qué agente será responsable.
- GO P0 de solo lectura y, por separado, GO P2-A.
- Si la experiencia P1 se alinea con el diseño definitivo de PERLA.
- Si los primeros profesionales piloto utilizarán únicamente materiales o también partidas de instalación.
- Qué proveedores, mercados y catálogos reales están permitidos legalmente.
- Autorizaciones separadas de integración, PR, merge, Production y acceso a datos reales.

## 14. Apéndice de auditoría · Cambios críticos de v1.0 a v1.1

| Corrección | Fundamento comprobado | Resultado contractual |
|:---|:---|:---|
| Lecturas con efecto | `js/budget-ui.js`: `open()` puede ejecutar `save()` | P1 solo consulta con sonda de no escritura (G9) |
| Continuidad de líneas extra | `js/budget-draft-core.js`: `all=[...lines(),...extraLines]`; CAT-04 tiene excepción propia en UI | P2 no aplica propuestas sin prueba de regeneración, fallo de adaptador e importación (G11) |
| Fuente manual ≠ calibración | `js/budget-core.js`: `manualQuantity()` puede asignar `measured` | Exigir `source.type` y mostrar procedencia |
| Unidad comercial ≠ unidad geométrica | `FloorPlanBudget.UNITS`: `m2`, `m`, `unit` | Recetas calculan litros/cajas; Budget recibe unidad comercial compatible y acreditada |
| Material ≠ obra completa | Distinción de producto necesaria; no acreditada como contrato actual | Suministro e instalación con alcances explícitos (G10) |
| Contexto comercial no autenticado | CAT-IA local, perfiles de estudio no son control de acceso | P3 privado NO-GO hasta M01/M02/GOV-06a |
| Revisión temporal | Cambio de plano/ficha/tarifa tras el cálculo | Bloqueo de propuestas obsoletas en confirmación (G12) |
| Conflictos de agentes | PERLA, A0, Codex, PR abiertas | Solo laboratorio y cortes autorizados sin editar archivos compartidos |

**Rastreo:** base original `c355bdf8e5716a634a6c9835df4aec3c3b86ba3b`; corte leído `79214e14ed160dc5c85b13facaadbf4340eb8b8a` (dos commits, solo prueba de QA Evolución modificada). **Este documento es una foto auditada y debe actualizarse por DELTA al reabrir, nunca reinterpretarse como estado en tiempo real.**