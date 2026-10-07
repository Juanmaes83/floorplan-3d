# Roadmap del MCP local de Rubik

Actualizado: 07-10-2026. Base documental comprobada: `master` en `88aef0bfeea8abb67865c3d2a33a484c909511ea` (merge de la PR #31).

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

La guía vigente de Pascal describe herramientas de escena, consulta y medida, validación/verificación, colisiones, creación de habitaciones/muros/huecos, colocación/amueblado, cambios agrupados con dry-run, undo/redo, recursos y prompts. También documenta límites relevantes: `export_glb` no está implementado; las herramientas de visión dependen de sampling del host; y el modo headless no regenera toda la geometría derivada. Fuentes: [MCP README de Pascal](https://github.com/pascalorg/editor/blob/main/packages/mcp/README.md) y [repositorio Pascal](https://github.com/pascalorg/editor).

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

1. Completar Etapa 1 y comprobarla con el JSON de prueba y fixtures sintéticos controlados.
2. Prototipar propuestas de Etapa 2, sin escritura.
3. Implementar Etapa 3 y demostrar igualdad del archivo de origen antes/después.
4. Diseñar y probar Etapa 4 como salida segura, importable y revisable; aprobación humana antes de integrar.

Cada etapa debe actualizar este documento tras su merge, conservar resultados reales de CI y diferenciar revisión visual, prueba local y evidencia automatizada. No fusionar ni desplegar por el hecho de que el servidor haya devuelto una respuesta válida.
