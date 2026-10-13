# Casa Serra → Floorplan: protocolo de aceptación

Fecha: 13-10-2026. **Estado: plan de pruebas; implementación y pruebas de producto NO EJECUTADAS.**

Alcance: [especificación](../technical/casa-serra-integration.md). Las entregas CS-1/CS-2/CS-3 se comprueban por separado y se revisan con el workflow vigente.

## 1. Evidencia disponible de esta preparación

- Se leyeron documentos/código en Floorplan `88b0cb568e9824533764518ec42e235e9c2774a9`.
- Se leyeron los nueve módulos Casa Serra fijados a `b47b775fae642439e8d42d6201ab5d1677d67f99`.
- LAB PR #4 confirma merge/aprobación v03 hacia su rama operativa. Se leyó el informe; no se ejecutó Blender ni se regeneró un render.
- Se descargaron por el lector autenticado y decodificaron con Pillow seis mapas JPEG de dos candidatos, sin modificar originales. Hashes, tamaños, dimensiones y modo RGB: [auditoría](artifacts/casa-serra/source-map-audit.json).
- Resultado de esa comprobación de recursos: 6/6 decodificaciones correctas; 794430 bytes. No valida normal +Y, correspondencia UV con la biblioteca ni aspecto PBR integrado.
- La navegación anterior por Casa Serra activó imagen/vídeo alternativos en el navegador cloud; no acredita rendimiento de su renderer en vivo.
- La preparación es documental: los resultados históricos de #24/#29/#34 y LAB v03 se atribuyen a sus informes, no se presentan como pruebas repetidas aquí.

## 2. Fixtures previstos

| Fixture | Qué expone |
| --- | --- |
| Ejemplo actual | Integración visual reconocible y transición existente |
| Proyecto vacío | Requisito de geometría y navegación a Distribuir |
| Asimétrico del exportador | Ejes, rotaciones, IDs y origen compartido |
| Polígono cóncavo + muro diagonal | Punto de enfoque, encuadre y clasificación de entidades |
| Dos estancias desconectadas / sin hueco | Ruta no disponible y alternativa aérea |
| Habitaciones pequeñas y pared alta | Cámara/clip plane/colisión |
| Variante y duplicado con documento parecido | Metadata separada por entrada local, invalidación y retorno |
| Modelo autorizado fallido / ausente | Sustituto genérico y aviso sin mutar assetRef |
| Oak / marble candidatos | Color, normal, AO/roughness, UV y presupuesto visual |

Utilizar fuentes sintéticas/no personales. Las pruebas no deben depender de un plano real para verificar el código. La evaluación de usuarios/dispositivos reales se registra aparte.

## 3. CS-1: casos obligatorios

| ID | Acción | Resultado requerido | Estado |
| --- | --- | --- | --- |
| P01 | Buscar «presentar mi vivienda», «tour», «presentación en 3D» | Acción correcta; no cambiar objetivo ni confundir con abrir solo 3D | Pendiente |
| P02 | Abrir desde Revisar y guardar y editor completo | Misma configuración/estado; accesible con guía cerrada | Pendiente |
| P03 | Iniciar en proyecto vacío | Explicación y acción para crear distribución; documento intacto | Pendiente |
| P04 | Seleccionar y reordenar estancias; cancelar | Orden coherente; cancelar no cambia proyecto ni abre 3D | Pendiente |
| P05 | Reproducir vista general y paradas | IDs/datos del proyecto; encuadre correcto en cada viewport | Pendiente |
| P06 | Anterior/Siguiente, salto directo y pausa | Estado e indicador consistentes; límites primero/último | Pendiente |
| P07 | Escape, cerrar y Atrás durante carga/transición | Operaciones canceladas; retorno/foco; ninguna reapertura tardía | Pendiente |
| P08 | Iniciar en 2D y en 3D, incluyendo recorrido/pointer lock | Restauración de vista y configuración; pointer lock solo por gesto | Pendiente |
| P09 | Cambiar proyecto/variante o geometría | Detener/reconciliar; plan obsoleto no usa poses anteriores | Pendiente |
| P10 | Recargar y recuperar plan con roomId eliminado | Aviso y plan regenerable; no fallo ni datos cruzados | Pendiente |
| P11 | Asset 404/corrupto y pérdida de contexto | Aviso/fallback vigente; documento 2D recuperable | Pendiente |
| P12 | Visitar todas las paradas | Progreso del tour separado; objetivo no recibe evidencia falsa | Pendiente |
| P13 | Exportar PNG durante presentación | PNG real y dimensiones correctas; captura serializada; buffer recuperado | Pendiente |
| P14 | Resize/orientación y movimiento reducido | No estirar; aspectos actuales; alternativa sin movimiento obligatorio | Pendiente |
| P15 | Repetir entrada/salida diez veces | Sin crecimiento persistente de recursos propios/listeners/RAF | Pendiente |
| P16 | Nombres con caracteres HTML y longitud grande | Texto seguro y layout accesible sin desbordamiento | Pendiente |

Antes/después, comparar JSON completo, hash canónico, biblioteca/variantes, historial, selección, escala y asignaciones. Solo metadata propia de presentación y evidencia real de carga 3D pueden cambiar según especificación. Comparar cámara/target/FOV/luces/corte/puertas visuales y buffer; tras resize, usar las dimensiones actuales esperadas.

## 4. CS-2: materiales y rendimiento

- Decodificación e integridad por mapa; firma/formato, dimensiones, bytes y hashes.
- Color sRGB para albedo y datos lineales para normal/ARM. Verificar eje Y de normal y patrón de iluminación.
- Correspondencia UV/crop/orientación de los tres canales. Compartir assetId no prueba alineación.
- Repetición en mm coherente y sin cambiar la estancia vecina.
- Preservación de los 50 IDs/asignaciones y apertura de JSON/ZIP anteriores.
- Carga bajo demanda; cancelación y dispose; fallo individual recupera albedo aprobado.
- Capturas iguales en geometría/cámara/luz para comparar calidad básica/mejorada.
- Regresión de catálogos/perfiles y exportador offline si se amplían canales. No asumir compatibilidad por la prueba diagnóstica PBR histórica.
- Medir bytes, tiempos, recursos activos, estimación de texturas/mipmaps y comportamiento tras cerrar.
- Baseline contra el master usado; registrar navegador/GPU/modelo real si existe. No presentar SwiftShader o emulación como rendimiento de teléfono.

Los límites propuestos de mapas son guards de admisión. Umbrales de rendimiento/producto se concretarán con la primera medición, antes de afirmar mejora o compatibilidad física.

## 5. CS-3: efectos y recorrido interior

- Muros compartidos, suelos cóncavos, diagonales, instancias GLB y objetos sin material candidato.
- Activar/desactivar dibujo→material sin cambiar geometría, asignaciones, callbacks o UV originales.
- Fallos de shader/compilación/capabilities: renderer base disponible.
- Revisar interpolación completa, no solo waypoints: spline sin colisiones y sin salto de escala.
- Adyacencia a través de huecos transitables, puertas cerradas, muebles en pasos y estancias desconectadas.
- Si no existe ruta comprobada, utilizar la alternativa declarada; no atravesar paredes.
- Sidecar de cámaras: IDs/revisión, mismo centro del paquete #24, metros/glTF; rechazo de fuente obsoleta. Una ida y vuelta nueva con LAB requiere su evidencia propia.
- El recorrido opcional nunca ejecuta generación de vídeo o cambios en un repo externo.

## 6. Regresiones y herramientas

Suites existentes relevantes, a seleccionar y ejecutar al implementar:
- `tests/guide.test.cjs`, `tests/guide.browser.test.cjs`, `tests/guide-navigation.browser.test.cjs`.
- `tests/capture-3d.browser.test.cjs`, `tests/browser.test.cjs`.
- `tests/surfaces.test.cjs`, `tests/surfaces.browser.test.cjs`.
- `tests/assets.test.cjs`, `tests/assets.browser.test.cjs`.
- `tests/variants*.test.cjs`, `tests/room-layout*.test.cjs` y `tests/interop.test.cjs` según los cambios.
- Nuevas pruebas propuestas: lógica pura de presentación, ciclo/restauración y navegador con captura real.

Ejecutar pruebas locales y checks exigidos por el repositorio. Registrar omitidas/fallidas con motivos y comparar fallos preexistentes con la misma base. No instalar otro framework o copiar números históricos como nuevos resultados.

## 7. Revisión visual humana

Viewports mínimos: 1440×900, 390×844 y 844×390.

Registrar:
1. Rama, SHA de código probado y SHA final.
2. URL directa de preview y deployment READY con el SHA final.
3. Protección/acceso real de la persona revisora.
4. Capturas de configuración, vista general, ficha/parada, indicador y vuelta al editor.
5. PNG descargado y lectura de dimensiones/contenido.
6. Estado de la guía antes/después y original intacto.
7. Calidad básica/mejorada y degradación.
8. Feedback de Juanma y correcciones en la misma PR.

Una pantalla de carga o un READY no sustituyen la revisión. No avanzar a la entrega dependiente hasta el cierre correspondiente.

## 8. Qué falta para estar listo para probar el producto

Implementar CS-1 y sus pruebas automatizadas, generar preview exacta y ejecutar la matriz anterior. CS-2/CS-3 siguen en planificación hasta su entrega. Esta documentación deja casos y resultados esperados preparados; no ofrece hoy un modo presentación funcional ni una preview nueva de producto.

## 9. Verificación de la preparación documental

- `python3 scripts/check-documents.py docs/technical/casa-serra-integration.md docs/qa/casa-serra-integration-plan.md`: tablas, cercas, rutas y anclas correctas en los dos documentos nuevos.
- Validador temporal sobre README, roadmap canónico, Roadmap 2, especificación y protocolo: 81 enlaces internos comprobados contra el árbol Git fijado y los archivos nuevos; tablas/cercas/ancla histórica F3 correctas.
- `git diff --check` y `git diff --cached --check`: correctos tras quitar líneas vacías finales añadidas en los tres documentos existentes.
- La primera comprobación del ancla histórica F3 requirió materializar su documento en el snapshot de lectura; el archivo y ancla existen en el repositorio fijado. No era un fallo de enlace del producto.
- El staging local contiene un snapshot documental parcial para estos controles; no se presenta como checkout completo de producto. Los archivos remotos se publican sobre el árbol base completo, conservando código/assets.
- No se ejecutaron suites de producto, Blender, normalizador ni rendering de las mejoras futuras. Sus matrices permanecen pendientes.
