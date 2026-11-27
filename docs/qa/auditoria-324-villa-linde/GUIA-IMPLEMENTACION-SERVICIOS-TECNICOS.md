# RUBIK SOTA · Guía de ejecución para los nuevos servicios técnicos

**27 de noviembre de 2026 · Encargo de producto para ingeniería y QA**

El objetivo es que un profesional use el proyecto que ya tiene en RUBIK para **explicar un inmueble, comparar una reforma y preparar una revisión técnica**. La entrega debe ahorrar búsqueda y reintroducción de datos. Cada dato publicado debe poder rastrearse hasta la geometría, la fuente externa, el profesional que lo aportó o el método que lo calculó.

| Orden | Entregable | Usuario principal | Primera entrega comprobable |
|---|---|---|---|
| 1 | **Ficha de inmueble, parcela y orientación** | Inmobiliaria | PDF Cliente de un inmueble con plano, procedencia de superficies y contexto de parcela. |
| 2 | **Comparativa de reforma de envolvente** | Reformas, interiorismo y arquitectura | Estado actual frente a dos alternativas, con alcance por planta, presupuesto y prestaciones comparables. |
| 3 | **Revisión previa de habitabilidad** | Arquitectura e inmobiliaria | Informe orientativo por estancia para una actuación y un municipio definidos. |
| Piloto posterior | **Archivo de trabajo para el certificador** | Técnico de certificación | Archivo que abre en la versión objetivo de CE3X y cuyos datos se pueden comprobar y recalcular. |

**Estado.** Guía de implementación pendiente de encargo. El producto vive en `Juanmaes83/floorplan-3d`. Al redactar, `master` estaba en `dacb5d395abf32449102d73ffd03200e6c09c019` y la PR #324 seguía en borrador en `39ea4bf0b61b095d4240c57abff96f4ebb3c1735`. Verifica ambas referencias al comenzar. La aprobación de los planos de Villa Linde aporta un caso de prueba, y los permisos de implementación, fusión, activación y consumo se rigen por el protocolo del repositorio. [AGENTS.md](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/AGENTS.md) · [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324)

## 1. Arranque y dependencias

1. Lee `AGENTS.md`, el protocolo de coordinación y el handoff del destino. Comprueba el SHA base, las PR abiertas y quién mantiene las superficies que vas a tocar. Trabaja en una rama y un worktree propios cuando el propietario encargue el corte.
2. Localiza en el navegador **Analizar → Emplazamiento**, **Orientación y sol**, **Comprobar el plano**, **Entregar → D3**, **Presupuestar** y, si ya está integrado en tu base, **P10**. Anota qué ruta funciona y qué versión la contiene. El árbol `master@dacb5d39` contiene D3 y los núcleos de análisis. La referencia de StoryLayersV1/P10 de esta guía se comprueba en #324.
3. Reproduce con una vivienda de una planta, un edificio pequeño de dos y **Villa Linde aprobada**. Para los entregables de varias plantas, verifica antes V01 y V02 de la auditoría. Si siguen abiertos, puedes avanzar con los casos de una planta, el contrato de datos y los pilotos. Deja la aprobación multiplanta pendiente de esa corrección.
4. Empieza por el primer entregable, pasa desde un proyecto abierto hasta un archivo descargado y comprueba ese archivo. Continúa con las pruebas de fallo y con el siguiente bloque autorizado. Un motor que calcula sin entrada normal en la aplicación queda en estado de piloto.

[Modelo de Villa Linde](villa-linde/aceptacion/villa-linde-aprobada.json) · [Caso mínimo de dos plantas](edificio-dos-plantas.json) · [Control de alcance con título neutro](villa-linde/aceptacion/villa-linde-control-alcance.json) · [Hallazgos V01–V09](README.md)

## 2. Qué reutilizar y dónde tocar

Los nombres de rutas y accesos son puntos de partida. Comprueba sus consumidores antes de cambiar contratos o desplazar acciones.

| Responsabilidad | Código que inspeccionar | Integración esperada |
|---|---|---|
| Identidad, plantas y unidades | `js/project-core.js`, `js/building-core.js`, `js/building-ui.js`, `js/surface-core.js` | Obtener la revisión, planta activa, geometría, superficies computables y estado de escala. Usar el edificio cuando el informe cubra ambas plantas. |
| Catastro, parcela y permiso de exportación | `js/catastro-wfs-provider.js`, `js/catastro-parcel-provider.js`, `js/territory-ui.js`, `js/parcel-site-adapter.js`, `js/territory-export-policy.js` | Reutilizar consulta por referencia, GML, procedencia y comprobación de si una capa se puede exportar. |
| Fachadas, ventanas, orientación y sol | `js/exterior-core.js`, `js/roof-core.js`, `js/site-preview-ui.js`, `js/solar-core.js`, `js/plan-sun-drone-core.js` | Reutilizar detección y resultados disponibles. El recorrido solar y el estudio de sol directo en ventanas tienen métodos propios. Etiquetarlos con el método y su alcance de obstáculos. |
| Comprobaciones de plano | `js/plan-validation-core.js`, `js/plan-analysis-ui.js`, `js/r02a-ceiling-contract.js` | Reutilizar las mediciones verificables. Los umbrales orientativos del núcleo actual sirven para comprobar el plano. Aplicar reglas normativas desde una fuente versionada y un ámbito explícito. |
| Cantidades y precios | `js/quantity-schedule-core.js`, `js/budget-core.js`, `js/budget-ui.js`, `js/economic-dossier-core.js`, `js/revision-budget-core.js` | Obtener cantidades medidas, precios revisados, faltantes y trazabilidad por planta o revisión. |
| Entrega y antes/después | `js/project-dossier-ui.js`, `js/dossier-client-ui.js`, `js/client-share-ui.js`, `js/story-layers-ui.js` y `js/story-proposal-core.js` en la candidata | Reutilizar D3 y la composición Cliente. Cuando P10 esté disponible, usar su comparación por revisión y variante. ENT‑05 designa fichas de imagen trazables en la [matriz de RUBIK](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/docs/product/MATRIZ-TRAZABILIDAD-v1.12.md). |

### Contrato mínimo de datos

Cada resultado conserva **proyecto o edificio, revisión, planta, objeto o estancia, valor, unidad, método, fuente y estado**. En fuentes externas registra la fecha y las condiciones de atribución cuando apliquen. En normas guarda también jurisdicción, edición, artículo y supuesto de aplicación. Distingue **calculado**, **declarado** y **pendiente**, incluyendo qué dato falta y cómo se puede obtener. Guarda el alcance junto al valor aunque el proyecto se llame simplemente «Villa Linde».

Vista en pantalla, PDF y datos exportados deben leer **el mismo resultado**. Al cambiar geometría, parcela, orientación o variante, vuelve a calcular o presenta la revisión anterior como desactualizada. Prueba el aislamiento entre proyectos, las cancelaciones y el cambio de planta con una consulta pendiente. Mantén los datos privados fuera de la salida Cliente y aplica la política territorial antes de incorporar mapas u ortofotos.

## 3. Ficha de inmueble · primera entrega

**Meta.** Una inmobiliaria prepara una ficha de visita sin copiar referencias, perseguir capturas ni confundir superficie útil con superficie catastral.

- **Dónde vive.** Preparación en **Analizar → Emplazamiento / Orientación y sol**. Vista previa e impresión desde **Entregar → Dossier del proyecto**, aprovechando el diálogo y el estilo Cliente. Revisa primero el apéndice de emplazamiento que D3 ya prepara. El piloto puede arrancar desde D3 sin añadir otra tarjeta.
- **Cómo conectarlo.** Reutiliza la parcela confirmada y su fuente. Usa la autoridad de superficies para el área útil del modelo. Si existe una superficie catastral del inmueble con fuente explícita, muéstrala aparte, con su definición. El área del polígono parcelario se rotula como superficie de parcela. Vincula el plano a la planta y la rosa al norte configurado. Muestra la huella colocada solo cuando exista esa colocación. En el primer corte, aprovecha consulta por referencia y GML. Buscar por dirección es una ampliación si las pruebas con inmobiliarias la justifican.
- **Qué recibe el cliente.** PDF con portada, plano amueblado, superficies por planta y ficha territorial con fuente y fecha disponibles. El HTML P7 se valida si comparte esa composición. Si una capa solo puede visualizarse, prepara el PDF con el resto del contenido y explica la disponibilidad de esa capa en la vista profesional.
- **Aceptación.** Probar caso con referencia, caso sin parcela, error de fuente, norte vacío y capa no exportable. Con dos plantas, el PDF coincide con el desglose y ninguna portada rotula «Planta única». La consulta de una parcela pública usada como sonda en Villa Linde permanece separada del hogar. Tras descargar, verificar el PDF y demostrar el recorrido con una inmobiliaria.

[Servicios Catastro–Registro](https://www.catastro.hacienda.gob.es/es-ES/CoordinacionCatastroRegistro.html) · [Política de exportación territorial de RUBIK](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/territory-export-policy.js)

## 4. Reforma comparada · servicio premium

**Meta.** El cliente entiende qué gana con ventanas nuevas, con aislamiento o con ambas intervenciones. El reformista puede justificar una propuesta con las partidas y prestaciones de la misma revisión.

- **Dónde vive.** Preparación de alternativas en **Diseñar**, lectura técnica en **Analizar**, precios en **Presupuestar** y comparación en **Entregar → P10** cuando StoryLayers esté disponible en la base. La propuesta de cliente usa imágenes del modelo y las prestaciones del caso comprobado.
- **Cómo conectarlo.** Primero contrasta un caso pequeño con [EnvolventeCTE](https://github.com/pachi/envolventecte), fijando un commit, licencias de dependencias y datos, método y tolerancia antes de aceptar cifras. El adaptador toma de RUBIK geometría y orientación que puedan justificarse. Pide al profesional los límites térmicos, zona climática, características de elementos opacos y huecos y sombreamiento cuando lo requiera el indicador. Para el MVP selecciona indicadores con entradas completas, por ejemplo transmitancia de los elementos intervenidos. El control solar o el indicador global se habilitan cuando se acrediten sus entradas. No uses las horas de sol como irradiación, ni el color de un acabado como propiedad térmica.
- **Qué se entrega.** Estado original, alternativa ventanas y alternativa ventanas más aislamiento. Cada opción registra elementos afectados, imagen comparada, cantidades, subtotal o importe por planta y estado de revisión. Los indicadores incluyen unidades, método, versión y datos aportados. Una alternativa con datos incompletos conserva sus cambios visibles y muestra las prestaciones por verificar.
- **Aceptación.** Para un caso de referencia, entradas y resultados coinciden con EnvolventeCTE dentro de la tolerancia documentada antes de ejecutar la comparación. Cambiar solo una ventana no modifica los demás datos. Probar una cubierta indeterminada como en Villa Linde, un precio pendiente y variantes en dos plantas cuando el alcance económico esté corregido. Comparar el archivo final con la pantalla y rastrear una partida hasta nivel, cantidad y precio.
- **Extensión posterior.** CteEPBD aporta balance de energía primaria y emisiones al disponer de demanda, consumos o componentes energéticos. La cuantificación de ahorros, amortización o letra requiere su propio método, entradas y validación. Si se propone un archivo `.cex`, demostrar con un técnico que abre en la versión admitida, que las entradas corresponden al proyecto y que se puede recalcular. El procedimiento oficial del CEE conserva sus pasos y responsables.

[DB‑HE](https://www.codigotecnico.org/DocumentosCTE/AhorroEnergia) · [Procedimientos reconocidos](https://www.miteco.gob.es/es/energia/eficiencia/certificacion-energetica/documentos-reconocidos.html) · [Real Decreto 390/2021](https://www.boe.es/buscar/act.php?id=BOE-A-2021-9176)

## 5. Revisión previa de habitabilidad · piloto profesional

**Meta.** Una inmobiliaria o un arquitecto identifica qué comprobar antes de comprometer un cambio de uso o preparar una revisión de ocupación.

- **Dónde vive.** **Analizar → Comprobar el plano**, con detalle por planta y estancia y retorno al elemento de origen. El informe descargado desde **Entregar** reutiliza el mismo resultado. Define primero **un municipio y un único supuesto de actuación** con el profesional del piloto.
- **Cómo conectarlo.** Mapear qué datos son fiables antes de escribir reglas. Empezar por superficies, huecos y alturas libres **declaradas** con fuente. Verificar qué ancho exige la regla antes de utilizar el nominal del hueco. Luz y ventilación requieren sus propias definiciones y geometría, como superficie de iluminación o área practicable, según el supuesto. El área de una ventana dibujada puede resultar insuficiente. El Decreto valenciano 80/2023 fue derogado. El paquete de reglas se valida con el texto aplicable y su fecha. Normatia se evalúa, si interesa, para consulta con citas y fuera del cálculo geométrico.
- **Qué se entrega.** Por cada regla, mostrar ámbito, fuente, medida, unidad, resultado y siguiente comprobación. Estados visibles **comprobado**, **requiere revisión**, **faltan datos** y **fuera de alcance**. El resultado de cada regla se aplica a la evidencia comprobada, sin un semáforo que declare la vivienda apta en conjunto.
- **Aceptación.** El técnico valida jurisdicción, actuación, casos de borde y definición de las medidas. Si faltan altura libre real, área practicable o el dato territorial aplicable, el informe lo muestra pendiente. Probar una regla vigente, otra excluida por fecha, una medida justo en el umbral y un caso fuera de municipio. El PDF identifica artículo, edición y estancia igual que la pantalla. La revisión orienta la visita y deja los trámites administrativos en su proceso correspondiente.

[Ley 5/2025 y derogación del Decreto 80/2023](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-11959#dd) · [Comprobaciones geométricas actuales de RUBIK](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d395abf32449102d73ffd03200e6c09c019/js/plan-validation-core.js)

## 6. Decisión sobre los repositorios

| Tipo de reutilización | Repositorios y uso |
|---|---|
| **Piloto técnico prioritario** | [EnvolventeCTE](https://github.com/pachi/envolventecte), MIT según `LICENSE.txt`. Contraste de indicadores y evaluación de un adaptador con las entradas completas. |
| **Interoperabilidad y visualización** | [hulc2envolventecte](https://github.com/pachi/hulc2envolventecte), MIT, documenta HULC → EnvolventeCTE. [visorepbd](https://github.com/energiacte/visorepbd), MIT, sirve de referencia para uso en navegador. [CE3X-MCP-Server](https://github.com/jmcaamanog/CE3X-MCP-Server), MIT, candidato a piloto de intercambio con la herramienta de certificación. |
| **Cálculo avanzado** | [CteEPBD](https://github.com/energiacte/cteepbd), MIT, para balance a partir de componentes energéticos. [pyBuildingEnergy](https://github.com/EURAC-EEBgroup/pyBuildingEnergy), BSD-3-Clause, para explorar simulación horaria con datos de clima y uso. |
| **Servicios externos opcionales** | [Normatia](https://github.com/normatia/normatia), MIT en el cliente y autenticación en el servicio. [Catastro GPS MCP](https://github.com/TheHiddenPandaDev/catastro_gps_mcp), MIT en el conector, API con clave y cuotas. Evaluar solo si un caso requiere sus fuentes o cobertura y el uso está autorizado. |
| **Referencias de Catastro** | [dxf2gmlcatastro](https://github.com/sigdeletras/dxf2gmlcatastro), [Spanish Inspire Catastral Downloader](https://github.com/sigdeletras/Spanish_Inspire_Catastral_Downloader) y [catastro-lib-python](https://github.com/sperea/catastro-lib-python), GPL-3.0. Consultar formatos y servicios oficiales a través del adaptador existente. Si se encarga un GML técnico, contrastar su geometría georreferenciada y validarla con el proceso oficial aplicable. El DXF de una planta interior tiene otro alcance. |

## 7. Pruebas, revisión y cierre

| Puerta de aceptación | Evidencia que debe quedar publicada |
|---|---|
| **Dato y cálculo** | Casos de una y dos plantas, Villa Linde, entradas completas e incompletas, unidades, límites y redondeos. Incluye un caso de referencia externo cuando se use un motor donante. |
| **Recorrido y archivo** | Grabación continua desde el punto de entrada hasta la descarga. Capturas de los puntos decisivos. Adjunta PDF, HTML, ZIP o JSON generado y verifica su contenido, procedencia y revisión. |
| **Resiliencia y UX** | Error de fuente, cancelación, reintento, cambio de proyecto y de revisión. Chromium de escritorio, móvil de 390 × 844, teclado, foco y ausencia de cortes. Reutiliza el sistema visual vigente de acciones, diálogos y «Volver». Verifica ES/EN/ZH y la guarda de idioma de RUBIK. |
| **Regresión** | Ejecuta las suites afectadas en el árbol exacto. Usa como referencia `parcel.browser.test.cjs`, `solar-core.test.cjs`, `site-analyze.browser.test.cjs`, `project-dossier.browser.test.cjs`, `building.browser.test.cjs` y, según alcance, `economic-dossier.browser.test.cjs`, `story-proposal.browser.test.cjs` y `no-chinese-display.browser.test.cjs`. Toma la instalación y configuración de los workflows vigentes. |
| **Valor comercial** | Mide en el piloto el tiempo hasta una entrega que acepte el profesional, los datos que reintroduce, correcciones necesarias y qué entregable estaría dispuesto a contratar. Registra resultados observados antes de fijar promesas de ahorro, cupos o precios. |

**Rutina de ejecución.** Trabaja por entregable. Si falla, reproduce en el mismo SHA, aísla si falla el modelo, la fuente, el cálculo, la interfaz o la exportación, corrige y vuelve a ejecutar el caso y sus regresiones. Si un permiso, una regla o un dato imprescindible queda fuera de tu alcance, documenta el bloqueo con evidencia y sigue con los casos independientes. Conserva un checkpoint con qué se ejecutó y cómo retomarlo. Entrega el cambio con SHA, ruta visible, Preview si aplica, artefactos y CI consultada. El responsable técnico y el propietario validan el resultado antes del paso a producción.

### Encargo breve para iniciar un corte autorizado

> Implementa el primer entregable autorizado de esta guía en RUBIK. Verifica el estado del producto y sus dependencias. Reutiliza las autoridades de datos y los recorridos existentes. Haz que el resultado se pueda producir desde la interfaz y que un profesional pueda verificar el archivo descargado. Ejecuta los casos válidos, incompletos y de fallo. Si un caso no pasa, diagnostícalo y vuelve a probar. Continúa las comprobaciones independientes si queda un bloqueo que requiere decisión. Publica resultado, código, evidencia y estado por SHA.
