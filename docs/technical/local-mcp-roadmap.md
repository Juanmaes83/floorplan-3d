# Roadmap del MCP local de Rubik


> **Estado vigente, 18-10-2026:** los tres cortes de la Etapa 1 están integrados: [#40](https://github.com/Juanmaes83/floorplan-3d/pull/40) (relaciones por estancia, merge `19f2f44`), [#41](https://github.com/Juanmaes83/floorplan-3d/pull/41) (diagnóstico y medidas 2D, `9c9e155`) y [#43](https://github.com/Juanmaes83/floorplan-3d/pull/43) (obstáculos del segmento mínimo y cadena de puertas, `6728e16`). Se probaron sucesivamente sobre el `master` posterior a #55 y el árbol de cada merge remoto coincidió con el probado: [evidencia](../qa/local-mcp-stage1-integration-2026-10-18.md). **Etapa 1 aún incompleta:** una cadena de puertas y una recta libre no prueban ruta transitable ni anchura; faltan desvíos, giros, extremos de muro, hojas y empotramientos. CI no ejecutó pruebas. Las Etapas 2–4 siguen propuestas.

> **Cuarto corte, 18-10-2026, PR en borrador pendiente de auditoría:** `check_route_2d` comprueba un recorrido 2D con desvíos para un disco de diámetro explícito entre dos puntos explícitos. Positivo = polilínea verificada con distancias exactas; bloqueo = separación demostrada por celdas certificadas; el resto queda como incertidumbre o límite de cálculo. [Contrato](local-mcp-route-2d.md) · [QA](../qa/local-mcp-route-2d-2026-10-18.md). Con él, la Etapa 1 cubre en el **modelo 2D** relaciones, diagnóstico, medidas, obstáculos y recorrido con anchura. **No se declara cerrada:** falta validarla con proyectos reales de escala confirmada, y la hoja de puerta, la altura y la maniobra no circular siguen fuera del modelo.

Actualizado: 13-10-2026. Recuperado de PR #32, HEAD `918c134b85eee3f50f95cd20689a2592464c0bde`, y reconciliado sobre `master` `88b0cb568e9824533764518ec42e235e9c2774a9`. La base y evidencia originales del 07-10-2026 pertenecen al merge #31 `88aef0bfeea8abb67865c3d2a33a484c909511ea`. [Cierre y aportes preservados](../qa/documentation-reconciliation-2026-10-13.md).

**Estado actual en `master`:** MCP local v0.1.3 de solo lectura, con relaciones por estancia, diagnóstico controlado, medidas 2D y análisis limitado del segmento mínimo entre dos muebles. La descripción de v0.1.0 y de las fases propuestas más abajo conserva el contexto de su publicación original; el alcance y los límites de cada corte nuevo están en sus documentos específicos.

## Objetivo

Evolucionar el servidor local de Rubik desde la consulta segura de un JSON exportado hasta un flujo que pueda **diagnosticar, proponer cambios, simularlos y producir una variante revisable**, manteniendo el proyecto original protegido y las conclusiones limitadas a la evidencia disponible.

Pascal es la referencia de alcance para herramientas de escenas, medidas, verificación, cambios agrupados, recursos y flujos guiados. Su servidor opera sobre `@pascal-app/core` y su propio grafo de nodos; no se puede conectar directamente al contrato Rubik. La adaptación debe reutilizar `FloorPlanProjectV1`, `js/project-core.js`, `js/layout-review.js` y la biblioteca local de variantes, sin copiar supuestos de geometría ni alterar el contrato por conveniencia.

## Estado actual verificado

La PR [#31](https://github.com/Juanmaes83/floorplan-3d/pull/31) se fusionó el 07-10-2026 en `master` mediante `88aef0bfeea8abb67865c3d2a33a484c909511ea`. La primera entrega es `@rubik-sota/floorplan-mcp@0.1.0`, local por stdio, de solo lectura y conectada a un archivo explícito exportado desde Rubik.

Herramientas existentes:

- `get_project_summary`: metadatos, hash, escala, recuentos y superficie aproximada.
- `list_project_elements`: inventario paginado de habitaciones, muros, huecos y muebles, con filtros.
- `get_project_element`: consulta directa por ID.
- `review_layout`: solapes, barridos de puertas y holguras; estas últimas requieren umbral explícito.

La implementación revalida el JSON en cada llamada, devuelve SHA-256, limita campos/tamaño y excluye imágenes incrustadas y rutas locales. No abre puertos ni conexiones de red; no lee la sesión activa del editor y no crea, mueve, borra, guarda ni exporta proyectos. Véase [README del servidor](../../tools/rubik-mcp/README.md) y la [PR #31](https://github.com/Juanmaes83/floorplan-3d/pull/31).

### Evidencia de uso

El 07-10-2026, Juanma conectó el servidor con Claude Code en Windows y consultó un JSON de prueba. La auditoría reportada ejecutó resumen, inventario paginado de las cuatro categorías, consultas por ID, revisión sin umbral y escenario de prueba con 600 mm. Las respuestas conservaron el mismo SHA-256 en 47 llamadas y no modificaron el archivo.

La prueba local en Windows mostró `npm run check` correcto y 5/6 tests: el caso restante no pudo crear un enlace simbólico por `EPERM` de Windows. La CI de la PR #31 pasó 6/6 en Linux, incluido el test de symlink. Este resultado local se registra como una limitación de la fixture/plataforma; no como fallo de una aserción funcional.

Hallazgos para investigar antes de ampliar la confianza del diagnóstico:

- El filtro `roomId` no devolvió muebles ni muros para una habitación que sí contiene elementos según la inspección espacial del informe. Debe aclararse si es un defecto del filtro, una limitación del modelo o una asociación que se debe derivar.
- En la revisión experimental con 600 mm aparecieron 40 pares por debajo del umbral; 600 mm fue solo un valor de prueba. El análisis humano identificó cuatro pares aparentemente separados por muros. No se deben etiquetar automáticamente como falsos positivos sin reproducir la geometría y el algoritmo.
- Las asociaciones por habitación y varias medidas del informe fueron deducidas a partir de coordenadas; no son relaciones almacenadas ni evidencia directa del MCP.
- La puerta `opn_door-3` frente a `obj_template-016` produjo un hallazgo geométrico útil, sujeto a escala estimada y al modelo 2D simplificado de puertas.

## Fases propuestas

Estas cuatro fases quedan registradas para planificación. **Esta actualización documental no autoriza por sí sola escrituras en proyectos ni un cambio de `FloorPlanProjectV1`.** Cada fase de producto debe ejecutarse en rama/PR separada, con pruebas y revisión de Juanma.

### Etapa 1 — Diagnóstico fiable y relaciones espaciales

Ampliar el diagnóstico solo después de resolver las limitaciones observadas.

- Añadir un informe de validación del proyecto que agrupe errores del contrato, referencias rotas, geometría inválida y elementos incompletos, reutilizando el validador canónico.
- Añadir medidas entre elementos con puntos de referencia y unidades explícitos; distinguir distancia entre huellas, centros y límites, sin confundirlas.
- Hacer fiables las consultas por habitación. Preferir asociaciones derivadas de polígonos cuando no existan en el JSON, identificar elementos ambiguos y devolver el método/evidencia de asignación.
- Mejorar holguras con obstáculos: separar elementos por muro, estancia y relación de empotramiento. No descartar un par atravesado por un muro sin comprobar geometría de extremo, huecos y conectividad.
- Mantener umbral explícito y estados de evidencia. Ningún valor orientativo se convierte en defecto sin decisión de producto.
- Aceptación: pruebas de habitaciones cóncavas, muros en el trayecto, puertas/huecos, muebles girados, empotrados, ambigüedad, escala estimada y proyectos inválidos.

#### Primer corte de Etapa 1 — relaciones por estancia, rama independiente

- Base `master` comprobada: `3fdbc0f34db9b545e5a2d4b037a66bcf841e23e4`; especificación y reproducción `ea3c227`; implementación de relaciones `1693ea0`; SHA completo probado con SDK actualizado `82b59cd952feab091875c9b91991394118093428`. Antes del cambio, el ejemplo contractual con `roomId:"rom_living"` devolvía 0 estancias, 0 muros, 0 huecos y 2 muebles. Después devuelve 1, 6, 3 y 2, respectivamente. La causa era la comparación literal de un `roomId` que solo es opcional en muebles; muros y huecos no lo guardan.
- `list_project_elements` y `get_project_element` añaden una relación geométrica mínima con IDs, método, estado y evidencia de área/contacto. La huella girada del mueble se cruza con polígonos de estancia, incluida concavidad; el muro usa banda de eje/grosor y el hueco solo su subtramo del `wallId`. Un mueble que cruza, toca un límite, queda parcialmente fuera o contradice su `roomId` guardado indica ambigüedad. Muros y huecos compartidos conservan todas las estancias implicadas; fuera de todas quedan sin atribución. [Reglas y fixture reproducible](local-mcp-spatial-relations.md).
- `roomId` filtra estancias por ID propio y los otros elementos por cualquier estancia derivada, incluidos compartidos/ambiguos, antes de paginar. No cambia el JSON, el editor, el contrato, las rutas de entrada, los límites de 15 MiB/750 KiB/100 por página ni la política de solo lectura.
- Comprobación local en Windows, Node `v24.14.1`, npm `11.14.1`: `npm ci`; en `tools/rubik-mcp`, `npm test` **11 pass, 0 fail, 1 skip** y `npm run check` PASS; desde la raíz, `node --test tests/project.test.cjs tests/tracing.test.cjs tests/layout-review.test.cjs tests/room-layout.test.cjs` **88 pass, 0 fail, 0 skip**. El skip es solo la creación de un symlink, que este Windows niega con `EPERM`; la prueba de JSON inválido se separó y pasó. El protocolo stdio real pasó y los tests compararon SHA-256 y bytes originales antes/después de las consultas. `npm audit` detectó [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h) en el SDK anterior `1.30.0`; el lock fija `1.32.1` y el audit posterior reportó 0 vulnerabilidades. La alerta afecta al cliente OAuth, que este servidor stdio no utiliza.
- **Pendiente en Etapa 1:** informe agrupado de validación y referencias, medidas entre elementos, holguras con obstáculos/conectividad y verificación adicional de proyectos inválidos, empotramientos y escala estimada para esas herramientas. Esta relación 2D no resuelve topología física cuando los polígonos de estancias se solapan o no corresponden a las caras de los muros; informa candidatos/ausencia sin inventar una estancia. CI remota y revisión humana se registran aparte de las pruebas locales.

#### Segundo corte de Etapa 1 — diagnóstico y medidas, PR apilada sobre #40

- Base comprobada: PR #40 `bf5fa9f4ea9f85d33e371c2220e6381dc61d2129`. `diagnose_project` permite informar un JSON inválido manteniendo el lector seguro y el rechazo de todas las consultas ordinarias. El validador canónico solo informa el primer error: la respuesta lo clasifica como formato, contrato, referencia o geometría, y marca expresamente las comprobaciones no realizadas. Sobre JSON válido agrupa escala no confirmada, procedencia, puertas sin `swing` y relaciones ambiguas/sin atribución. Máximo 100 hallazgos visibles, con total/truncamiento. No se declara una lista exhaustiva de errores.
- `measure_elements` compara dos IDs en `reference_points` (centros de muebles o puntos medios de ejes de muros/huecos) o `regions` (distancia mínima entre huellas, bandas, subtramos y polígonos 2D). Devuelve mm, puntos justificativos, hash, confianza de escala y estado de relación. Las estancias carecen de centro de referencia único; un proyecto inválido o geometría no medible se rechaza. La distancia 2D entre regiones no es holgura libre ni dictamen normativo. [Reglas, ejemplos y tercer corte](local-mcp-diagnostics-measures.md).
- Fixture sintético: separación centro/huella 4000/3450 mm, objeto en concavidad exterior a 750 mm de la estancia, mueble girado frente a muro a 561,091 mm, contacto y solape a 0 mm, muro/hueco, escala estimada, ID ausente, referencia rota, geometría inválida, protocolo stdio y bytes/hash inmutados. Los comandos, versiones, SHA final y resultados locales/CI se consignan en la PR apilada tras la publicación.
- **Pendiente tras #41:** holguras con umbral explícito, muros activos y huecos verdaderos, extremos, empotramientos y conectividad entre estancias. El corte parcial apilado descrito más abajo aborda el segmento mínimo y las conexiones documentadas; la ruta utilizable sigue pendiente. No se modifica `review_layout`.

#### Cuarto corte de Etapa 1 — recorrido 2D con desvíos y anchura, rama independiente desde `master` `d9cd11b`

- **Herramienta:** `check_route_2d` (`tools/rubik-mcp/src/route.cjs`), de solo lectura, con el lector seguro común (archivo explícito, sin symlinks, 15 MiB / 750 KiB, validación canónica y SHA-256 por consulta).
- **Petición:** `start` y `end` explícitos en mm del plano y `widthMm` obligatorio. No hay ancho por defecto.
- **Contrato geométrico:** un disco de diámetro `widthMm`, con contacto admitido (tolerancia de 10⁻⁶ mm).
  - El dominio está formado por las estancias, más los huecos de paso con antepecho 0 compartidos por dos estancias y las bandas de muros demolidos compartidas por dos estancias.
  - Son obstáculos los muros activos, las ventanas, los huecos no transitables y los muebles. Alfombras y splits no cuentan como obstáculo.
- **Garantías:**
  - Todo positivo es una polilínea verificada por fuerza bruta con distancias segmento–segmento exactas.
  - Todo bloqueo se apoya en celdas bloqueadas con cota de Lipschitz y en la convexidad de la distancia, incluida la cota por pares que cierra pasillos estrechos.
  - Lo indecidible por debajo de 0,25 mm de celda queda como `evidencia_insuficiente`.
  - Agotar cualquier presupuesto da `límite_de_cálculo`.
- **Razones de bloqueo:** son huecos que separan de verdad la región alcanzable desde el inicio, con su medida exacta y los elementos que lo forman, o puertas y ventanas no transitables.
- **Pruebas:**
  - una matriz con medidas conocidas;
  - un verificador independiente de cada tramo y giro;
  - un contraste aleatorio con fuerza bruta;
  - protocolo stdio, determinismo, bytes y hash intactos y ausencia de filtraciones.
- **Pendiente para declarar cerrada la Etapa 1:**
  - validación con proyectos reales y escala `real`;
  - decisión de producto sobre hoja de puerta, marco y altura;
  - revisión de Juanma/Codex.

### Etapa 2 — Propuestas de distribución explicables

Añadir una capacidad de solo lectura que genere **candidatos de cambio**, no modificaciones.

Cada propuesta debe incluir IDs, ubicación actual, ubicación candidata, objetivo, evidencia, efectos esperados, conflictos que podrían aparecer, incertidumbre y datos que faltan. Debe separar hechos calculados de preferencias inferidas y permitir objetivos del usuario (por ejemplo, despejar el barrido de una puerta) sin inventar normas ni umbrales.

Inspiración Pascal: flujos desde brief y de iteración sobre feedback. Adaptación Rubik: propuestas sobre elementos de `FloorPlanProjectV1`, con salida estructurada y comprensible.

### Etapa 3 — Simulación aislada antes/después

Crear una simulación en memoria, sobre una copia desechable de los datos, sin escribir al archivo de entrada ni a la biblioteca local.

- Aplicar el conjunto candidato en un orden determinista y validar cada operación.
- Comparar antes/después: solapes, barridos, holguras con el mismo umbral explícito, superficies, recuentos y elementos afectados.
- Informar cambios que no pueden simularse y resultados parciales; no presentar la ausencia de conflictos como cumplimiento normativo.
- Exigir hash de origen y devolverlo junto a la simulación para asegurar que la propuesta corresponde al archivo leído.
- Aceptación: aborto completo ante una operación inválida, ninguna mutación persistida, resultados reproducibles y pruebas de regresión geométrica.

### Etapa 4 — Crear una variante revisable

Tras aprobar una simulación, crear un artefacto separado que Rubik pueda revisar; nunca sobrescribir el JSON original.

- Escritura desactivada por defecto y separada de las herramientas de solo lectura.
- Requerir confirmación explícita del usuario, hash de origen coincidente y validación completa de la variante.
- Guardar el JSON de variante en destino controlado, con escritura atómica, nombre sin colisiones y protección contra rutas arbitrarias/enlaces simbólicos.
- Incluir un informe/manifest separado con hash de origen, hash nuevo, operaciones, resultados antes/después y límites. No añadir `variantOf` a `FloorPlanProjectV1`; hoy ese vínculo vive en la biblioteca del navegador y no viaja en el JSON.
- Permitir importar el JSON generado en Rubik para la revisión humana. La integración que conserve además el vínculo nativo de variante requiere una conexión explícita con la biblioteca local del editor; no se debe fingir que escribir un archivo ya crea esa relación.
- Aceptación: original idéntico byte a byte, nueva variante válida/importable, cancelación segura, colisiones de nombre, hash obsoleto, fallo de disco y ausencia de efectos parciales.

## Capacidades Pascal: adaptación y límites

Según la auditoría original del 07-10-2026, la guía de Pascal entonces consultada describe herramientas de escena, consulta y medida, validación/verificación, colisiones, creación de habitaciones/muros/huecos, colocación/amueblado, cambios agrupados con dry-run, undo/redo, recursos y prompts. También documenta límites relevantes: `export_glb` no está implementado; las herramientas de visión dependen de sampling del host; y el modo headless no regenera toda la geometría derivada. Fuentes: [MCP README de Pascal](https://github.com/pascalorg/editor/blob/main/packages/mcp/README.md) y [repositorio Pascal](https://github.com/pascalorg/editor).

| Capacidad de referencia | Tratamiento Rubik |
| --- | --- |
| Resumen, consulta por ID y búsqueda de nodos | Ya existe parcialmente; ampliar filtros/relaciones en Etapa 1. |
| Medición, validación y verificación práctica | Adaptar a `FloorPlanProjectV1` y a geometría probada de Rubik en Etapa 1. |
| `check_collisions` y comprobación de límites | Reforzar en Etapas 1–3; no importar la aproximación geométrica de Pascal sin evaluación. |
| `apply_patch`, cambios de escena y undo/redo | Adaptar como propuestas/simulación primero; escritura solo bajo Etapa 4 y sobre una variante. |
| Crear habitación, puertas, ventanas y amueblar | Posible evolución posterior, después de asegurar los invariantes de Rubik; no copiar nodos Pascal. |
| Recursos, catálogo y prompts de agente | Añadir cuando cada flujo tenga utilidad y esquema probado; no son prioridad por sí mismos. |
| Análisis de imagen de plano/fotografía | Evaluar después de Etapa 1 y con límites de privacidad/confianza; no declarar exactitud arquitectónica. |
| Niveles, escaleras, cubiertas, sistemas BIM y GLB | Fuera del alcance actual: Rubik aún no tiene el modelo de producto/contrato que permita implementarlos responsablemente. |

## Orden de ejecución y puertas de revisión

**Seguimiento de PR apiladas, aún sin merge:** #40 deriva relaciones espaciales; #41 añade diagnóstico y medidas. El tercer corte parcial en `feat/rubik-mcp-clearance-connectivity` inspecciona un segmento mínimo y una cadena de puertas documentada, sin afirmar transitabilidad. Su contrato y límites están en [obstáculos y conectividad](local-mcp-clearance-connectivity.md). La Etapa 1 sigue pendiente de corredores con anchura, desvíos, extremos y empotramientos comprobados; el estado integrado de este roadmap no cambia hasta revisar y fusionar las PR en orden.

1. Completar Etapa 1 y comprobarla con el JSON de prueba y fixtures sintéticos controlados.
2. Prototipar propuestas de Etapa 2, sin escritura.
3. Implementar Etapa 3 y demostrar igualdad del archivo de origen antes/después.
4. Diseñar y probar Etapa 4 como salida segura, importable y revisable; aprobación humana antes de integrar.

Cada etapa debe actualizar este documento tras su merge, conservar resultados reales de CI y diferenciar revisión visual, prueba local y evidencia automatizada. No fusionar ni desplegar por el hecho de que el servidor haya devuelto una respuesta válida.
