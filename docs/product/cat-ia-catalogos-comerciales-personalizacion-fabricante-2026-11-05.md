# CAT-IA — Catálogos comerciales y personalización visual por fabricante
**RUBIK SOTA / FLOOR PLAN 3D CARACOLA · Documento de producto y contrato preparatorio v1 · 05/11/2026**

**Estado:** PROPUESTA DOCUMENTADA. No implementada; sin aprobación de lanzamiento. **DOCUMENTACIÓN ÚNICAMENTE: NO MERGE, NO DEPLOY, NO API DE PAGO.**
**Prioridad propuesta:** junto a **FOT-01 «Reforma IA desde fotografía»** y a la ampliación de B2/B8. Su ejecución depende de decisiones de producto y de cerrar las tareas en curso de Claude Code y Kimi Code.
**Repositorio:** `Juanmaes83/floorplan-3d`; **rama:** `docs/rubik-evolution-preparation-2026-11-04`.
**Documentos relacionados:** [Plan maestro IA](ia-imagenes-asistente-plan-maestro-2026-11-05.md) · [Foto→reforma y servicios premium](ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md) · [Protocolo económico](ia-costes-protocolo-unitario-lotes-2026-11-05.md) · [Roadmap operativo reconciliado](rubik-roadmap-operativo-reconciliado-2026-11-05.md).

## 0. Decisión de producto y justificación

**CAT-IA** es la línea que permite al profesional personalizar **propuestas visuales, documentación comercial y, en una etapa posterior, proyectos 3D y presupuestos**, con productos, familias, colecciones, materiales, acabados y electrodomésticos identificados de fabricantes o marcas autorizadas.

RUBIK pasaría de «mostrar una estancia bonita» a «mostrar la estancia del cliente con los productos que comercializa una empresa, en una propuesta que el cliente pueda evaluar». **No vendemos solo imágenes: ayudamos al profesional a presentar y vender un proyecto o colección** con identidad propia, trazabilidad y revisión.

**Ejemplo director:** una empresa de cocinas recibe la fotografía de la cocina del cliente. Selecciona su marca en Mi estudio, importa imágenes autorizadas de muebles de roble, encimera porcelánica, horno y frigorífico, configura tres propuestas visuales y elige la más fiel. Después comprueba referencias, dimensiones y precios, emite una ficha con su marca y añade un presupuesto respaldado por el motor de cantidades/precios existente. El cliente recibe **un antes/después y una propuesta comercial concreta**, no un render aislado.

**Aclaración de alcance:** la representación visual de un producto **no garantiza** equivalencia exacta con el producto físico. Una imagen de un electrodoméstico puede parecerse, pero no demuestra SKU, medidas, instalación, disponibilidad o precio. CAT-IA separará explícitamente representación estética, producto identificado y geometría colocada/verificada.

### Clientes profesionales y usos

| Perfil | Producto/servicio | Valor concreto |
| --- | --- | --- |
| Fabricantes y distribuidores de cocinas | módulos, puertas, frentes, tiradores, encimeras, hornos, frigoríficos, campanas, fregaderos | probar variantes y vender cocinas con referencias reales |
| Estudios de interiorismo/decoración | textiles, paletas, mesas, sofás, iluminación, objetos, colecciones | moodboard que puede convertirse en propuesta ilustrada |
| Tiendas/fabricantes de mobiliario | sofás, camas, mesas, sillas, armarios, sistemas modulares | visualizar colecciones dentro de la vivienda del comprador |
| Empresas de baños/sanitarios | mueble lavabo, grifería, mamparas, bañeras, revestimientos | contrastar líneas comerciales y cambios de acabado |
| Pavimentos y revestimientos | porcelánicos, parquet, piedra, pinturas, mosaicos | comparar formato, junta, acabado, color y ambiente |
| Carpinterías y cerramientos | puertas, frentes, ventanas, armarios | presentación visual; la colocación certificable requiere medidas/validación |
| Reformistas, promotoras e inmobiliarias | materiales, paquetes de calidades, mobiliario, home staging | oferta visual por niveles y comparación económica |
| Cliente final mediado por profesional | referencias propias de preferencias o muebles existentes | contribuir al diseño sin operar un CAD |

**Terceros y marcas:** no implica convenio con fabricantes, ni adhesión, afiliación o licencia universal. Toda marca, logo, imagen, modelo y ficha de producto necesita derechos comprobados para su uso concreto.

## 1. Auditoría de reutilización — qué YA existe y qué NO

| Componente real en `master` | Uso permitido en CAT-IA | Lo que todavía falta |
| --- | --- | --- |
| `js/brand-core.js`, `js/brand-ui.js`, `js/professional-workspace-ui.js` | «Mi estudio»: perfiles, logo, firma de entregas y selección por proyecto, guardados actualmente en navegador | catálogo comercial multi-producto, gestión de licencias/tenencia, almacenamiento de activos, permisos por empresa |
| `js/generic-catalog.js`, `js/furniture-search.js`, `js/furniture-placement.js` | familias existentes: asientos, camas, mesas, almacenaje, cocina, sanitarios, iluminación, electrodomésticos | identificación comercial SKU, relaciones modelo/variante, catálogo propio del fabricante |
| `js/asset-catalog.js`, `assets/f3/catalog.manifest.json` | validación de permisos, dimensiones verificables y asociación a objetos 3D según su alcance | carga profesional de modelos, compatibilidad, geometría/collision y QA comercial |
| `js/surface-catalog.js`, `assets/materials/catalog.json` | superficies reales con muestras, aplicaciones y procedencia/licencia | referencias de marcas comerciales, escalas reales de producto, variantes y stock |
| `js/moodboard-core.js` | moodboard derivado de materiales y muebles actualmente asignados al proyecto | moodboard de inspiración no asignado, selección de catálogo y propuesta versionada |
| `api/render.js`, `js/ai-render-ui.js` | B2/B8: petición de imagen editada, lista cerrada de acabados, comparación y descarga | imágenes de referencia adicionales y consentidas, más de una variante, conservación por región y telemetría de coste |
| C1–C4 y `Entregar` | cantidades/presupuestos/dosier y exportación profesional existentes | vínculo verificable entre productos concretos, partidas y especificaciones; fichas comerciales |
| PR #166 Entregas (no fusionada) | futuro destino de fichas, colecciones y galería/cliente | reconciliación de UX con Claude antes de integrar |
| Asistente IA propuesto | pedir productos, comparar variantes y preparar fichas de forma conversacional | aún no hay asistente LLM de edición comercial con permisos |

**Conclusión:** reutilizar los contratos existentes y no convertir los prompts o catálogos visuales en autoridades geométricas/económicas. Ningún corte CAT-IA modifica `FloorPlanProjectV1` por generar una imagen.

## 2. Arquitectura de experiencia: «Mi estudio» → «Estudio de imágenes» → «Entregar»

```
Mi estudio (marca / firma ya existentes)
  └── Mis catálogos [NUEVO; gestión profesional]
       ├── Colecciones y familias
       ├── Productos y variantes / SKU
       ├── Materiales, texturas y acabados
       ├── Referencias fotográficas autorizadas
       ├── Fichas y dimensiones verificadas
       ├── Modelos 3D validados [ETAPA 3]
       └── Plantillas de propuesta comercial

Entregar → Estudio de imágenes
  ├── Fuente A: vista 3D real de RUBIK (B2/B8)
  └── Fuente B: foto aportada con permiso (FOT-01)
       └── seleccionar productos/colecciones → conservar/cambiar
            └── variaciones con coste previsto y permiso → QA humano
                 └── elegir imagen → ficha comercial

Entregar → Propuesta al cliente
   ├── antes/después, renders, variantes, etiquetas de IA
   ├── lista de productos identificados y referencias comprobadas
   ├── presupuesto C1–C4 si existen medidas y precios fiables [ETAPA 3]
   └── marca profesional, versión, condiciones y descarga
```

**Frontera UX:** Mi estudio administra **recursos propios del profesional**, Entregar prepara **resultados por proyecto/cliente** y Diseñar administra **geometría canónica**. No crear un segundo editor ni un segundo presupuesto. La Home V2 puede describir CAT-IA como «Próximamente» hasta tener evidencia de disponibilidad.

## 3. Las tres etapas acordadas: CAT-IA-1 / CAT-IA-2 / CAT-IA-3

### CAT-IA-1 — Referencias de productos en imágenes (primera entrega, prioridad junto a FOT-01)

**Qué:** permitir seleccionar/subir fotografías de productos y muestras autorizadas, asociarlas a la vista original del proyecto o foto de cliente y producir **propuestas visuales orientativas**. No crear fichas como si el modelo generado fuera exacto ni modificar automáticamente objetos del proyecto.

**Dónde:**
- `Entregar → Estudio de imágenes → Referencias de producto`, enlazado desde FOT-01 y B2/B8.
- `Mi estudio → Mis catálogos → Referencias visuales` para guardar una colección ligera **solo después** de definir almacenamiento y permisos; piloto preferentemente temporal.
- Backend: una extensión controlada de la edición de imágenes actual, sin reimplementar proveedor ni añadir prompts arbitrarios sin validación.

**Flujo:** imagen fuente → elegir superficie/zona u objeto a cambiar → asociar 1–3 imágenes de producto o material **con licencia y consentimiento** → introducir acabado/variante y alcance Fiel/Equilibrado/Creativo → ver coste del pedido (1 o 3 salidas) → confirmar → comparar antes/alternativas → revisión profesional → descargar ficha orientativa.

**Límites:** pedir un horno de una marca **no prueba** que el render lo haya reproducido exactamente. No atribuir SKUs, precios o dimensiones no aportados; no suponer que «tres referencias» se trasladan perfectamente. Conservar foto original, contornos de huecos, módulos e instalaciones según instrucciones y revisión; no prometer obra viable. Colocar etiqueta visible «Propuesta visual generada por IA; producto y medidas por confirmar».

**Aceptación de corte:** desde una fotografía consentida de cocina real o un plano de prueba se producen 3 alternativas autorizadas con gasto previo confirmado y registro unitario; pasan revisión de fidelidad de muros/huecos, nivel de correspondencia perceptiva de los objetos y exportación completa; no modifica proyecto ni revela datos personales. Si el usuario decide no generar, gasto API cero.

**Dependencias:** IMG-01 exportación corregida, IMG-02 telemetría, IMG-03 calidad, IMG-04 presupuesto previo, IMG-12 variantes, IMG-15 referencias; FOT-01. Si faltan esos gates, no prometer CAT-IA-1 como disponible.

### CAT-IA-2 — Catálogos comerciales con fichas y dimensiones verificadas

**Qué:** un catálogo profesional versionado por estudio/fabricante con productos y variantes reales (colección, SKU, acabados y referencias oficiales). Vínculos entre imágenes visuales y productos verificados; exportación de fichas comerciales y listas de selección. **No editar aún geometría por SKU.**

**Dónde:**
- `Mi estudio → Mis catálogos → Productos / Colecciones / Materiales / Plantillas`.
- `Entregar → Galería/Ficha de imagen → Productos asociados` y catálogo elegido para propuesta comercial, coordinando PR #166.
- `Presupuestar`: consultar fichas/ precios verificables sin convertirlos automáticamente en partidas calculadas si faltan datos.

**Campos propuestos para `CatalogProductV1` (contrato NUEVO, sin implementar):**
```json
{
  "catalogId": "studio-cocinas-ejemplo",
  "catalogRevision": "2026-11-05",
  "productId": "horno-ejemplo-001",
  "manufacturer": "Fabricante autorizado",
  "brand": "Marca comercial autorizada",
  "collection": "Coleccion",
  "sku": "REF-EXAMPLE-001",
  "variantId": "inox",
  "family": "electrodomesticos",
  "displayName": "Horno integrado",
  "dimensionsMm": {"width": 600, "height": 600, "depth": 550},
  "dimensionsProvenance": "ficha oficial revisada",
  "technicalSheet": {"url": null, "version": null, "verifiedAt": null},
  "imageRefs": [{"assetId":"img-001","usageRights":"documentados","source":null}],
  "commercial": {"currency":"EUR","netUnitPrice":null,"vatRate":null,"priceSource":null,"verifiedAt":null},
  "availability": {"status":"desconocida","verifiedAt":null},
  "license": {"scope":"por validar","proofRef":null,"expiresAt":null},
  "model3dRef": null,
  "reviewStatus": "DRAFT"
}
```
*Ejemplo de forma, no datos reales de fabricante. Si falta una medida, debe ser `null`/«no verificada», no cero ni una conjetura. Ningún dato del ejemplo es un producto ofrecido.*

**Modelo de persistencia:** los perfiles actuales de marca viven en navegador. Para catálogos multiempresa, primero definir cuentas, roles, almacén privado y publicación; no meter por defecto fotografías comerciales/privadas en el JSON geométrico ni suponer que LocalStorage sirve como catálogo empresarial. Idempotencia y control de versiones: guardar selección congelada en la ficha entregada, sin que cambios de catálogo alteren PDFs anteriores.

**Aceptación de corte:** importación manual de colección de prueba con al menos 5 fichas (incluyendo mueble, electrodoméstico y material); cada referencia con ID/SKU único, imagen autorizada, medidas verificadas o marcadas desconocidas, precio con origen/fecha o ausente, control de versión, exportación de ficha y no afiliación engañosa. Nada se considera «en stock» sin fuente actual.

**Dependencias:** permisos/licencia, decisión de almacenamiento, gestión de equipo, contratos de producto, UI de catálogo, validación externa de fichas comerciales, coordinación legal #161 y Entregas #166.

### CAT-IA-3 — Integración de productos 3D validados y presupuestos existentes

**Qué:** vincular un SKU comercial a un objeto 3D **solo cuando** exista modelo apto y permitido, con dimensiones reales comprobadas; utilizar el proyecto canónico y el motor económico ya integrado para preparar cantidades y presupuestos.

**Dónde:**
- `Diseñar → Catálogo de objetos → Producto de mi estudio`: crear/seleccionar una representación 3D si supera el pipeline de activos.
- `Presupuestar → Partidas/Costes`: relacionar `assetRef`, selección de producto y precios de fuentes verificadas con las cantidades del proyecto.
- `Entregar → Ficha / Presupuesto / Galería`: resumen comercial del proyecto aprobado.

**Autoridades:**
- `js/asset-catalog.js` y contratos de modelo/permiso/glTF: validan activos en el alcance existente; extender de forma compatible, no saltarse las comprobaciones.
- `FloorPlanProjectV1`: dimensiones, posición y colisiones; ninguna foto modifica el plano.
- Núcleos C1–C4: cantidades, costes, precios de origen conocido, presupuesto y dossier; **nunca** calcular costes de obra desde el número de píxeles de una imagen.
- Presupuesto de cocina a medida: longitud de módulos, herrajes, instalación, encimeras, recortes, acabados y servicios pueden requerir mediciones y partidas específicas validadas; no inferirlas de la referencia visual.

**Aceptación de corte:** al menos 1 mueble y 1 electrodoméstico de prueba con modelos 3D legalmente utilizables, escala y dimensiones verificadas, persistencia/undo/regresión sin daños, colisión/plausibilidad comprobada, selección comercial SKU con precio revisado y exportación trazable. Si faltan modelos 3D, ofrecer representación genérica claramente marcada sin prometer exactitud.

**Dependencias:** decisión de proveedor/modelos 3D, pipeline de geometría, dimensiones validadas, licencias, presupuesto/BC3 existentes, QA de edición/deshacer, seguridad de importaciones.

## 4. Familias, recetas especializadas y biblioteca de instrucciones

**Nuevas familias comerciales:** `cocinas`, `electrodomesticos`, `encimeras`, `mobiliario`, `dormitorios`, `banos`, `sanitarios`, `pavimentos`, `revestimientos`, `iluminacion`, `carpinterias`, `decoracion`, `textiles`. Reutilizar familias de `js/furniture-search.js` y `js/surface-catalog.js`, ampliando solo si se necesita.

**Biblioteca `PromptRecipeV1` propuesta (no implementada):**
- `kitchen-catalog-faithful`: conserva puertas, huecos, instalación visible y volúmenes grandes, aplica referencias de cocina y electrodomésticos visualmente; marca discrepancias.
- `bath-product-fidelity`: sanitarios y zonas húmedas, sin inventar instalaciones; advertencia de viabilidad.
- `furniture-showcase`: integra mueble/colección sin escalar objetos de forma absurda.
- `finish-material-match`: pavimentos y revestimientos con área de intervención, patrón/rotación/fuga visual.
- `lighting-catalog`: luminarias y ambiente sin afirmar niveles de iluminancia calculados.
- `developer-showroom`: paquetes de calidades, comparador y presupuesto orientativo controlado.

**Separar en el contrato:** receta de representación, tipo de zona, referencias autorizadas, invariantes geométricos, productos vinculados, `recipeVersion`, controles de calidad, nivel de fidelidad, coste y versión de catálogo. El profesional elige en UI; las instrucciones completas de servidor quedan versionadas, revisables y restringidas. Prompts/skills de repositorios externos son **materia de auditoría**, no algo que se ejecuta automáticamente: comprobar derechos, términos, seguridad e instrucciones incrustadas en recursos.

**No aceptar** ejecución arbitraria de código de terceros, prompts que pretendan saltarse validadores, descargas no autorizadas de catálogos o datos de clientes en logs.

## 5. Seguridad, licencias y relación con empresas fabricantes

- **Derechos de imagen/producto:** imagen subida, logo, ficha técnica, fotografía de producto, textura y modelo 3D con permiso explícito de reproducción, transformación mediante IA, uso comercial y redistribución cuando corresponda. Una web pública no implica licencia.
- **Origen:** `owner / source URL / import timestamp / allowed scope / expiry / proofRef / version / brandAssociation`.
- **Marcas:** permitir mencionar modelos reales en propuestas de venta cuando sea lícito, pero evitar sugerir acuerdos o ser «distribuidor autorizado» sin acreditación; distinguir proveedor oficial, producto de catálogo aportado por profesional y referencia del cliente.
- **Fotos de clientes:** consentimiento para procesarlas, evitar EXIF y metadatos innecesarios, retención mínima, control de acceso y borrado. Separar materiales públicos de fotografías de vivienda/ocupantes; no mezclar bibliotecas de distintos estudios.
- **Datos de precio:** fecha, moneda, IVA, origen, tarifa profesional vs PVP, posible instalación, disponibilidad y caducidad; no mezclar estimación IA con presupuesto aceptado. Tarifas reservadas al estudio no salen en vistas públicas si no se autoriza.
- **No manipulación:** no generar logotipos falsos ni atribuir características a un electrodoméstico sin ficha; no etiquetar equivalencia SKU de una imagen sin control humano.
- **Control empresarial:** futuro login/organización, roles (administrador, comercial, diseñador, revisor), permisos de biblioteca y exportación, aislamiento por cliente, auditoría de acceso y baja de catálogos. La estructura actual del navegador no acredita estas capacidades.
- **Legal:** coordinar PR #161 y contratos de licencias; no afirmar que su borrador ya esté vigente.

## 6. Economía: coste real, propuesta comercial y precios premium

**Lo que se mide:** la venta de una propuesta no equivale al coste de una llamada a la API. Registrar por producto/encargo, separadamente:

| Concepto | Métrica |
| --- | --- |
| Referencias de entrada | número, tipo, tamaño, proveedor/modelo y tokens si disponibles |
| Generación | modelo efectivo, calidad, dimensiones, número de salidas, coste API, latencia y errores |
| Iteraciones | variantes, reintentos, descartes, tiempo del profesional, % aceptadas |
| Biblioteca | almacenamiento privado, distribución, licencia, actualización de fichas |
| Producto validado | esfuerzo de identificar SKU, dimensiones/precios, aprovisionamiento del modelo 3D |
| Entrega | composición de ficha, revisión, presupuesto y atención comercial |
| Comercial | coste total/entrega aceptada; precio neto propuesto, margen, IVA y tasa de conversión |

**SKU de pruebas internas propuestos:**
- `CAT-VIS-01`: foto cocina + 1 referencia de mueble + 1 alternativa.
- `CAT-VIS-03`: foto cocina + 3 referencias de producto (mueble, encimera, electrodoméstico) + 3 alternativas.
- `CAT-COL-05`: colección de 5 productos, fichas verificadas, 3 imágenes de referencia.
- `CAT-3D-02`: dos objetos 3D validados colocados y vinculados a cantidades.
- `CAT-PRO-01`: ficha comercial + presupuesto revisado y marca profesional.

**Regla financiera:** medir `coste_por_resultado_aceptado = (API de todos los intentos + funciones/almacenamiento + revisión profesional + gestión de producto) / nº entregas aprobadas`. Establecer precio premium por valor de negocio y disposición a pagar, no por aumentar artificialmente gasto API. No fijar tarifas públicas hasta disponer de datos de coste/aceptación y una política de revisiones.

**Piloto inicial:** un solo estudio de cocinas ficticio, cinco fichas de producto ficticias con imágenes de prueba autorizadas, una foto de estancia de fixture sin datos personales, tres alternativas como máximo y tope de gasto autorizado. Cero llamadas de proveedor hasta aprobar costes y seguridad.

## 7. QA y criterios de aceptación transversales

| Gate | Condición demostrable antes de declarar terminado |
| --- | --- |
| CAT-G0 | especificación y derechos aprobados; sin duplicar B2/B8, FOT-01, Entregas o presupuestos |
| CAT-G1 | una imagen original + referencias autorizadas → propuesta visual descargable, preservación de geometría observable y coste trazado |
| CAT-G2 | lote de 3 propuestas con confirmación de gasto, tasa de aceptación y variantes comparables |
| CAT-G3 | colección con fichas y dimensiones/SKU reales o estados `no verificado`; sin inventar disponibilidad |
| CAT-G4 | ficha exportada con marca, referencias, aviso IA, fuente y versión sin truncamientos |
| CAT-G5 | objeto 3D con medidas y derechos verificados, colocado en proyecto sin alterar otras entidades; Undo/Redo QA |
| CAT-G6 | presupuesto reutiliza C1–C4, coteja cantidades y fuente/fecha del precio, no infiere costes de imagen |
| CAT-G7 | consentimiento y almacenamiento seguro, acceso aislado, eliminación efectiva de fotos privadas |
| CAT-G8 | QA móvil, ES/EN/ZH, accesibilidad, offline donde corresponda, rendimiento con catálogo razonable |
| CAT-G9 | compatibilidad GitHub/ramas Claude/Kimi; revisión humana y autorización expresa antes de merge |
| CAT-G10 | análisis de precio/valor y coste por entregable aceptado antes de comercializar |

**Casos negativos:** SKU contradictorio; imagen sin permiso; referencia de horno cuyo tamaño no cabe; foto con EXIF privado; cambio visual que elimina ventana; precio sin fecha; fabricante sin afiliación; repetición de marcas entre estudios; modelo 3D con unidad desconocida; lote sin presupuesto; ancho/alto del electrodoméstico incongruente.

## 8. Hoja de ruta y coordinación

| Orden documental | Dependencias | Acción posterior (NO AUTORIZADA todavía) |
| --- | --- | --- |
| CAT-0, ahora | plan maestro y reconciliación 05/11 | aprobar alcance, contratos, públicos, derechos y costes sin tocar runtime |
| CAT-IA-1 | cierre de IMG-01/02/03/04, FOT-01, referencias seguras | piloto visual para cocinas/baños, comparación por cliente |
| CAT-IA-2 | CAT-IA-1 y política de biblioteca empresarial | catálogos profesionales, SKU y fichas comerciales con dimensiones |
| CAT-IA-3 | CAT-IA-2, assets/3D y motores canónicos C1–C4 | modelos colocables con QA y presupuesto trazable |

**Prioridad relativa:** CAT-IA-1 se estudia **junto a FOT-01**, antes de 360° y vídeo generativo en la propuesta comercial; CAT-IA-2 y -3 se escalonan después de demostrar uso, calidad y economía. Es una hipótesis para coordinación global, no revoca decisiones vigentes ni modifica tareas activas.

**Integración por agentes:** esperar a que **Claude Code** termine Entregas (PR #166 y su trabajo posterior) y **Kimi Code** su QA/fidelidad visual. Su trabajo no se cancela ni sobreescribe. Vincular CAT-IA a la futura experiencia de Entregas solo después de una auditoría combinada, revisión del propietario y autorización de merge.

## 9. Decisiones del propietario (sin bloquear el presente documento)

1. Prioridad comercial inicial: ¿cocinas + baños, o cocinas + mobiliario?
2. Biblioteca por estudio y por proyecto: ¿qué se guarda, dónde, durante cuánto tiempo y quién accede?
3. ¿Las marcas aportan archivos con licencia por contrato o solo se permite material autorizado aportado por el profesional?
4. Profundidad de producto en etapa 2: SKU/dimensiones/precio; ¿también stock y disponibilidad o diferirlo?
5. Validación de precios: PVP, tarifa profesional, instalación y descuentos; normas de visibilidad al cliente.
6. ¿Qué significa «propuesta lista para enviar»: imagen + ficha, pack con 3 variantes o presupuesto profesional?
7. Modelo comercial: suscripción por empresa, créditos por renders, puesta en marcha de catálogo y/o packs por propuesta.
8. Política de derechos y tratamiento de fotos aportadas por clientes; revisión legal antes de pilotos reales.
9. Qué operaciones CAT-IA podrá solicitar el futuro asistente: lectura/catálogo primero, generación con gasto confirmado después.

## 10. Referencias del repositorio

- [Plan maestro IA](ia-imagenes-asistente-plan-maestro-2026-11-05.md)
- [Foto→reforma y precios premium](ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md)
- [Costes y ensayos](ia-costes-protocolo-unitario-lotes-2026-11-05.md)
- [Home V2](home-v2-content-audit-2026-11-04.md)
- [Roadmap operativo reconciliado](rubik-roadmap-operativo-reconciliado-2026-11-05.md)
- [Traspaso a ventana madre V2](rubik-traspaso-maestro-v2-2026-11-05.md)
- Código: `js/brand-core.js`, `js/brand-ui.js`, `js/professional-workspace-ui.js`, `js/asset-catalog.js`, `js/furniture-search.js`, `js/generic-catalog.js`, `js/surface-catalog.js`, `js/moodboard-core.js`, `js/ai-render-ui.js`, `api/render.js`.
- PR [#161 legal](https://github.com/Juanmaes83/floorplan-3d/pull/161), [#166 Entregas](https://github.com/Juanmaes83/floorplan-3d/pull/166).

**Cierre:** CAT-IA añade una oportunidad comercial real y tres etapas bien delimitadas al plan, pero **no está implementado ni aprobado para lanzamiento**. El próximo paso autorizado es coordinación documental, nunca fusión o despliegue automático.
