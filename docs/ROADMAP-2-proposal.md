# Roadmap 2 — propuesta de evolución de Rubik Sota

> **Estado: propuesta para revisión; no aprobada como alcance, prioridad comercial ni compromiso de fechas.**  
> Preparada el 01-10-2026 sobre \`master\` en \`6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f\`. No sustituye \`docs/ROADMAP.md\`, no cierra F3 ni cambia el contrato vigente. F3 sigue siendo la fase activa hasta terminar y aprobar su entrega de catálogo externo.

## 1. Propósito y principios

Este documento ordena las mejoras que pueden convertir Rubik Sota en un flujo coherente: partir de una vivienda, obtener geometría editable, dimensionar estancias, decorarla con materiales y objetos, y reutilizar el resultado en herramientas del ecosistema. No afirma que esos conectores existan ya ni que el mercado esté validado.

Principios para decidir:

1. **Una fuente de verdad:** \`FloorPlanProjectV1\` mantiene geometría y unidades en milímetros. Imágenes, escenas Blender/Unreal, productos CRM y vistas panorámicas son derivados con referencias estables.
2. **La geometría debe seguir siendo coherente:** un cambio de ancho/profundidad es una operación sobre muros y relaciones, no solo cambiar un número de etiqueta.
3. **No abrir formatos sin control:** un adaptador convierte y valida activos al perfil que Rubik soporta. No se confía en una extensión, manifest o nombre de fichero.
4. **Privacidad por defecto:** la app actual funciona principalmente en navegador y guarda proyectos localmente. Un proveedor cloud o backend es una decisión explícita, con coste, retención y borrado definidos.
5. **No inferir prioridad de mercado:** cliente final, inmobiliarias, interiorismo/decoración y reformas son segmentos distintos. D-01 sigue abierta; CRM, normativa y capacidades B2B deben validarse con el segmento elegido.
6. **Revisión fase a fase:** cada entrega tiene PR, pruebas, preview del SHA exacto cuando cambie la interfaz, revisión humana, aprobación, merge y actualización documental antes de iniciar una fase dependiente.

## 2. Punto de partida comprobado

| Área | Estado real que condiciona este plan |
|---|---|
| Planos e imágenes | F1b ya importa PNG/JPG/WebP estáticos, calibra con dos puntos y una segunda cota, y permite trazar/editar muros, huecos y habitaciones. No hay que volver a construir ese flujo desde cero. El límite actual documentado es 15 MiB y 8000 px por lado. |
| Proyectos | F1a/F1b permiten varios proyectos locales, persistencia e intercambio JSON/ZIP. No hay sincronización multi-dispositivo ni servidor de proyecto. |
| Medidas | \`FloorPlanProjectV1\` usa mm, IDs estables, muros, huecos, polígonos de habitación y objetos con dimensiones. Las habitaciones guardan polígonos explícitos; no son automáticamente una derivación topológica de los muros. Cambiar una dimensión puede afectar varios elementos y requiere una transacción coherente. |
| F2 | Asistencia local experimental. Cinco sesiones de base, conjunto fijo de veinte planos y umbrales acordados siguen pendientes; no bloquean estas propuestas, pero F2 no debe anunciarse como precisión validada. |
| F3 | Entrega inicial integrada: catálogo genérico dimensionado, referencia de asset, muestra sintética y fallback. Catálogo externo todavía pendiente. La auditoría histórica encontró muchos GLB con Draco/texturas y extensiones; su inventario debe repetirse desde el estado actual de Asset Lab antes de elegir candidatos. |
| Render web | Three.js está fijado en el proyecto. El cargador F3 actual impone límites y rechaza texturas/extensiones; esa política es deliberada para estabilidad y seguridad del runtime, no prueba de que los ficheros sean imposibles de convertir. |
| Ecosistema | La auditoría documentó Asset Lab, Room Designer, CRM, Immersphere SaaS, Blender MCP y LAB Astra. Son fuentes potenciales; la auditoría no demuestra integración de extremo a extremo. La evidencia de cada repo está fijada por SHA en [la auditoría de ecosistema](product/ecosystem-integration-audit.md). |
| Presentación | La auditoría describe hotspots de Immersphere como posiciones visuales/porcentuales. No equivalen a coordenadas espaciales enlazadas con geometría Rubik. |
| Roadmap vigente | F0–F3 y sus cierres siguen en [docs/ROADMAP.md](ROADMAP.md). Este Roadmap 2 es un horizonte propuesto posterior, no una renumeración retroactiva. |

## 3. Secuencia propuesta

Ordena entregas por combinación de valor visible, esfuerzo y dependencias. Las tallas son **estimaciones técnicas preliminares** (S/M/L), no compromisos. El impacto es una hipótesis de producto que requiere pruebas con usuarios.

| Orden | Entrega propuesta | Impacto potencial | Esfuerzo / incertidumbre | Dependencia y decisión |
|---|---|---|---|---|
| 0 | Cerrar F3 inicial y un piloto acotado de assets | Alto en calidad visual de la propuesta | M / media | Fase activa. Elegir pocos modelos; verificar bytes, hash, dimensiones con fuente, licencia/permiso y móvil. No ampliar el contrato salvo necesidad demostrada. |
| 1 | Crear plano y editar dimensiones de estancias | Muy alto: mejora el trabajo central para todos los segmentos | M–L / alta en topología | Mantener imagen/calibración/trazado. MVP en habitaciones ortogonales explícitamente soportadas; no deformar silenciosamente habitaciones irregulares. Requiere definir reglas de adyacencia y huecos. |
| 2 | Biblioteca visual de materiales de suelo y acabados | Alto y visible | S–M / media | Empezar por presets existentes y muestras visuales locales; medir tamaño y carga móvil. No requiere catálogo externo ni cambiar el schema por anticipado. |
| 3 | Importador normalizador de modelos GLB de Asset Lab | Alto para ampliar mobiliario real | M / media-alta | Completa el canal F3. Requiere perfil aprobado, herramientas reproducibles, procedencia y pruebas del resultado convertido. No relajar el loader de producción para todos los formatos. |
| 4 | Adaptador Room Designer → CRM | Alto solo si el segmento comercial lo justifica | M / alta por contratos/identidad | D-01 y contrato de datos. Resolver \`lineItems\`→\`products\`, cantidades, IDs, versiones, reintentos e idempotencia; prototipo con datos sintéticos primero. |
| 5 | Exportación determinista Rubik → Blender | Alto para contenido y producción avanzada | M–L / media | Definir ejes, unidades, jerarquía e IDs; probar vivienda asimétrica. Salida portable glTF/GLB como primera prueba, no automatizar aún todo Astra/Seedance. |
| 6 | Entrada CAD vectorial: DXF piloto, luego decisión DWG | Alto para profesionales; menor para consumidor | L / alta | Elegir entidades, unidades, capas y supuestos. DXF primero con importación local si una biblioteca adecuada supera revisión de licencia. DWG necesita gate de proveedor/convertidor, privacidad y coste; no se reduce a renderizar una imagen. |
| 7 | Presentación conectada con panoramas/hotspots Immersphere | Alto para promoción inmobiliaria | L / alta | Depende de proyecto/objeto IDs y exportación espacial. Definir relación panorama-cámara-transformación-objeto; primer intercambio estático y reversible. No llamar “hotspot anclado” a una coordenada de pantalla. |
| 8 | Perfil orientativo de reglas constructivas por jurisdicción | Potencialmente alto para profesionales, riesgo alto | L / muy alta | Solo tras escoger país/uso y asesoría competente. Empezar con reglas estructuradas, versionadas y citadas; nunca prometer certificación o cumplimiento automático. |

### 3.1 Orden recomendado en la práctica

- **Terminar primero la F3 ya abierta.** No mezclar este documento con su PR de implementación. Un pipeline de conversión validado puede formar parte del cierre F3 si ya está dentro del alcance aprobado de la PR; de lo contrario, se planifica como entrega separada.
- **Después, hacer un pequeño descubrimiento de usuario** para D-01: observar tareas de cliente final, agente, interiorista y reforma con el prototipo actual. El resultado debe elegir un usuario/flujo inicial o conservar explícitamente la decisión abierta.
- **Construir la edición dimensional como primera gran mejora de producto**, tras especificar y probar la geometría. Debe preservar la importación raster y añadir creación/edición clara; no sustituir trazado manual por automatización F2 no validada.
- **Mejorar materiales y canal de assets en entregas delimitadas**, con preview antes/después y presupuesto móvil medido.
- **Abrir CRM, Blender/CAD e Immersphere según el segmento elegido**; son conectores diferentes, no una única “integración del ecosistema”.
- **Dejar normativa al final** y solo con una jurisdicción elegida y contenido/licencias resueltos.

## 4. Especificación de las mejoras principales

### 4.1 Dimensiones de estancias y “nuevo plano”

**Problema a resolver:** hoy una imagen puede importarse y trazarse, pero la interfaz no ofrece un editor dimensional directo y obvio para crear o modificar cualquier vivienda. El campo de ancho/profundidad de un mueble no resuelve el tamaño de la estancia.

**Propuesta de alcance inicial:**

- Presentar un flujo “Nuevo proyecto” con dos rutas visibles: empezar vacío/crear estancias y crear desde imagen PNG/JPG/WebP. Cada selección crea un proyecto independiente; nunca reemplaza el proyecto activo sin confirmación.
- Permitir seleccionar una estancia y editar dimensiones en milímetros o metros, con modo de edición inequívoco y valores calculados/confirmados claramente diferenciados.
- Primera versión limitada a polígonos ortogonales válidos. Para una estancia irregular, mostrar qué dimensión no se puede aplicar directamente y conservar edición por vértices; no convertirla silenciosamente en un rectángulo.
- Al confirmar, calcular un plan de cambio sobre los muros que definen el recinto y ejecutar atómicamente: muros compartidos, esquinas, estancias vecinas, huecos asociados, cotas/medidas, muebles y vista 3D. Si no existe una solución sin romper restricciones, no aplicar y explicar el conflicto.
- IDs estables: conservarlos cuando la entidad siga teniendo identidad; documentar cuáles se crean/eliminan al dividir o fusionar muros. Undo/redo y export/import deben conservar la edición.
- No recalibrar la imagen ni cambiar su referencia por una edición dimensional manual. Registrar la discrepancia como edición de geometría, no como nueva medición de origen.
- Preview táctil mobile-first: formularios cortos, controles accesibles, teclado numérico y visualización del plano suficiente mientras se edita.

**Gate de aceptación antes de codificar:** tabla de casos con habitación aislada, pared compartida, pared con puerta/ventana, habitación irregular, recinto con muebles, undo/redo, carga JSON y cancelación. Acordar qué significa “mantener huecos” cuando un muro se mueve: conservar coordenada relativa, distancia a extremo o distancia global; no adivinar.

### 4.2 Conectores de modelos y texturas

**Sí se puede crear un conector**, pero el objetivo no debe ser “que ningún asset sea rechazado”. Conviene separar:

1. **Adaptador de entrada**: lee el origen y produce un paquete Rubik aprobado, registrando SHA-256, fuente, versión, permiso, medidas declaradas y medibles, herramientas y transformaciones.
2. **Normalizador/validador fuera del runtime**: valida GLB/glTF, recursos embebidos, dimensiones, materiales, malla y límites; decodifica o convierte únicamente extensiones elegidas y probadas.
3. **Perfil de salida acotado**: por ejemplo GLB 2.0 autocontenido, lista allowlist de extensiones necesarias o ninguna extensión requerida, texturas embebidas y límites explícitos.
4. **Loader web**: solo carga el perfil producido, con tope de bytes, polígonos/recursos, manejo de memoria y fallback.

Three.js documenta soporte para Draco, meshopt, KTX2/BasisU y extensiones materiales mediante loaders/configuración explícitos; cada decoder añade código, compatibilidad, superficie de fallo y coste de descarga. La lista soportada por la versión fijada en Rubik debe verificarse, no copiar la lista de la documentación actual sin pinning. El pipeline debe registrar versiones y ser repetible. No aceptar URI externas por defecto ni bajar modelos/texturas al navegar sin consentimiento.

**Prueba de conector:** un asset compatible existente y otro con Draco/textura; comparación visual origen→normalizado; dimensiones contrastadas con dato fiable; errores útiles para recurso externo, extensión desconocida, archivo corrupto y presupuesto excedido; carga en móvil y fallback genérico. Solo añadir extensiones al perfil si una necesidad real no se resuelve con conversión.

### 4.3 Materiales con presupuesto visual y móvil

- **Nivel 1:** biblioteca de materiales de suelo/acabados basada en los presets existentes: nombre, muestra, color/mapa, categoría y licencia/origen. Separar muestras de catálogo de una textura de alta resolución.
- **Nivel 2:** materiales PBR en muebles/GLB importados: base color, roughness, normal/occlusion cuando corresponda, gestión de color y formatos de textura comprimidos si el dispositivo lo permite.
- Cada asset declara presupuesto de descarga, dimensiones de textura, memoria estimada y alternativa de menor calidad. Cargar bajo demanda, liberar texturas al cambiar de escena y mantener fallback.
- La métrica de aceptación debe medir bytes descargados, tiempo de disponibilidad, memoria aproximada y estabilidad en el dispositivo objetivo; no fijar números de producto sin baseline.
- No asociar precios de catálogo a materiales hasta decidir moneda, origen, actualización y términos.

## 5. Contratos de intercambio que cada “conector” debe probar

| Conector | Transformación a validar | Prueba de ida y vuelta / fallo |
|---|---|---|
| Asset Lab → Rubik | manifest y GLB → asset normalizado y \`assetRef\` | mismo hash de entrada; dimensiones con fuente; ID estable; texturas/extensiones esperadas; fallback y rechazo explicable. |
| Room Designer → CRM | \`lineItems\` → \`products\`/adaptador de CRM | cantidades, SKU/identidad, moneda si aplica, reimportación repetida sin duplicados, proyecto asociado y errores parciales recuperables. Datos ficticios; no exportar PII en telemetría. |
| Rubik → Blender → Unreal | proyecto mm → escena 3D y glTF/GLB | escala, orientación, muros/huecos, objetos, IDs/nombres y materiales; habitación no simétrica que revele rotaciones/ejes. Capturar versión de Blender/Unreal y ajustes de importación. |
| Rubik/Immersphere | IDs y coordenadas 3D ↔ panorama/cámara/hotspot | navegación de un punto a otro y hotspot que sigue el objeto; al mover objeto/cámara, vínculo correcto o error visible. El % de pantalla no es posición 3D. |
| DXF/DWG → Rubik | entidades vectoriales → geometría candidata | unidades, origen, capas, arcos/líneas, bloques y cotas contrastados; vista previa antes de importar; elementos no interpretados quedan disponibles, no desaparecen. |

Los conectores deben tener versiones de entrada/salida, fixtures sintéticos no personales, IDs idempotentes, reporte de elementos ignorados, límites de tamaño y una manera de cancelar/revertir. “Repo enlazado”, exportación que descarga o screenshot correcto no demuestra una integración bidireccional.

## 6. CAD y elección DXF/DWG

**DXF piloto primero:** facilita probar una entrada vectorial con entidades y capas sin prometer que cada línea representa un muro. La primera entrega debería importar a una capa de referencia, ofrecer selección de capas/unidades y permitir convertir entidades elegidas en geometría Rubik. Mantener cotas originales y marcarlas como referencia hasta validar.

**DWG después de evaluar dos rutas:**

- conversión local con software/licencia y compatibilidad verificadas;
- servicio oficial de conversión, como Autodesk Platform Services Model Derivative, que documenta traducción DWG/DXF, extracción de propiedades/geometría y operaciones cloud.

La ruta cloud requiere presupuesto actual por tipo/volumen de trabajo, autenticación protegida en backend, región, retención/eliminación, consentimiento y análisis de planos sensibles. Nunca poner un secreto APS en el frontend. La disponibilidad de traducción no convierte automáticamente líneas/capas en puertas o muros semánticos. No se aprueba en este roadmap ni un proveedor ni el envío remoto de archivos.

## 7. Reglas constructivas: alcance responsable

Un perfil inicial debe identificar jurisdicción, edición, fecha de vigencia, autoridad que adoptó el código, enmiendas locales, fuente de cada regla y restricciones de uso del texto. El ICC advierte que jurisdicciones pueden modificar IBC/IRC al adoptarlos; España tiene el CTE con documentos oficiales y texto consolidado. No son paquetes intercambiables.

Si se justifica, empezar por verificaciones geométricas limitadas y explicables (p. ej. un ancho de paso definido por el perfil), no por “cumplimiento del edificio”. Mostrar resultado como aviso orientativo con referencia y versión. Conservar decisión humana profesional. Antes de publicar: dictamen de licencias, asesoría competente, revisión de vigencia y responsable de actualizar reglas cuando cambie la norma.

## 8. Decisiones que debe tomar Juanma

Estas decisiones siguen abiertas hasta aprobarlas expresamente:

1. **Usuario/segmento inicial (D-01):** consumidor, inmobiliaria, interiorismo/decoración o reformas.
2. **Objetivo de edición dimensional:** creación desde cero, editar planos trazados, o ambos en MVP; política para muros compartidos y estancias no ortogonales.
3. **Presupuesto móvil objetivo:** dispositivos y mediciones (descarga, memoria, latencia); obtener baseline antes de fijar límites.
4. **Catálogo:** alcance de autorización de publicación/hosting por asset, marca/atribución, y criterio para dimensiones verificables. La autorización general de Juanma para el repo Asset Lab se registra; no inventa dimensiones ni procedencia física faltante.
5. **CRM:** cuándo se selecciona como prioridad y cuál es el contrato canónico entre Room Designer y CRM.
6. **CAD:** si el perfil inicial necesita DXF; proveedor/ruta y política de privacidad si se aborda DWG.
7. **Geografía normativa:** España/CTE, jurisdicciones estadounidenses/IRC-IBC u otra; propósito educativo, diseño preliminar o profesional.
8. **Cuenta y datos:** si el producto permanece local/offline o incorpora backend, sincronización, almacenamiento o servicios cloud.

No hace falta resolver todas hoy para cerrar F3 o comenzar el diseño técnico de la edición dimensional. Sí son gates antes de comprometer las integraciones respectivas.

## 9. Qué queda fuera por ahora

- Convertir Rubik en una app Unreal o reescribir Three.js. La meta es interoperar con una escena/exportación, no duplicar el editor.
- Interpretar cualquier plano automáticamente o anunciar precisión profesional basada en F2.
- Aceptar todas las extensiones de glTF o texturas remotas en runtime.
- Ecommerce, precios de IKEA, compras, disponibilidad de stock, CRM multi-tenant o sincronización cloud sin segmento, fuente y decisión de privacidad.
- Hotspots espaciales sin calibración cámara/panorama.
- Certificación de cumplimiento normativo.
- Cambiar \`FloorPlanProjectV1\` anticipadamente. Cada cambio de contrato requiere necesidad de interoperabilidad reproducida y compatibilidad de migración.
- Fechas o puntuaciones de mercado/esfuerzo sin evidencia.

## 10. Definición de terminado por entrega

Antes de aprobar cada fase:

- Requisitos y límites publicados; estado “comprobado / parcial / propuesta / pendiente” explícito.
- Pruebas automatizadas de dominio y fallos, fixtures sintéticos; no incluir planos reales/personales en repositorio.
- Revisión visual humana de la preview exacta en móvil y escritorio cuando cambie interfaz. Registrar URL, SHA y acceso.
- Si es conector: prueba real de ida y vuelta, IDs, unidades, datos, duplicados, cancelación y errores; versión de formatos/herramientas y cómo reproducir.
- Actualizar documento técnico y [roadmap canónico](ROADMAP.md) después de la aprobación/merge. No cambiar el estado canónico a propuesta aprobada por esta página.
- Merge solo después de aprobación explícita de Juanma; limpiar rama/preview al completar y dejar el siguiente paso verificable.

## 11. Fuentes técnicas oficiales consultadas

Consulta: **01-10-2026**. Las fuentes verifican capacidades del formato/plataforma, no interoperabilidad del proyecto.

- [Three.js — GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): formatos y extensiones soportadas; decoders requeridos para Draco, KTX2 y meshopt. La documentación viva debe contrastarse con Three.js 0.160.0 fijado en Rubik antes de implementar.
- [Three.js — DRACOLoader](https://threejs.org/docs/pages/DRACOLoader.html) y [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html): decodificación y transcoding explícitos.
- [Autodesk APS — formatos soportados por Model Derivative](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/supported-translations/): lista de traducciones, incluidos DWG/DXF. Confirmar en API/plan vigente antes de comprometer cobertura.
- [Autodesk APS — overview de Model Derivative](https://aps.autodesk.com/developer/overview/model-derivative-api): conversión/extracción para visualizar y consultar datos; no semántica de muros Rubik.
- [Autodesk APS — pricing](https://aps.autodesk.com/topics/pricing): página oficial; la estructura y tarifas aplicables deben cotizarse/verificarse en el momento de seleccionar un flujo. No reutilizar cifras de blogs históricos como precio actual.
- [Blender 5.3 Manual — glTF 2.0](https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html): importación/exportación y alcance de materiales glTF.
- [Epic — Datasmith software/file types](https://dev.epicgames.com/documentation/unreal-engine/datasmith-supported-software-and-file-types): formatos y flujos admitidos; la tabla de versión/plataforma debe verificarse para la instalación elegida.
- [Epic — glTF support in Unreal](https://dev.epicgames.com/documentation/unreal-engine/gltf-file-format-support-in-unreal-engine): Unreal documenta glTF 2.0, con límites de correspondencia respecto al modelo de características de cada motor.
- [Epic — Datasmith import options](https://dev.epicgames.com/documentation/en-us/unreal-engine/datasmith-import-options?application_version=4.27): describe conversión de metros de glTF a centímetros de Unreal en esa versión específica. Verificar en la versión del piloto.
- [ICC — IBC](https://www.iccsafe.org/products-and-services/i-codes/ibc/) y [IRC](https://www.iccsafe.org/products-and-services/i-codes/2018-i-codes/irc/): códigos modelo y posibles enmiendas jurisdiccionales.
- [ICC — prefacio IBC 2021](https://codes.iccsafe.org/content/IBC2021P2/preface): reconocimiento de copyright y marco de adopción; revisar licencia/permiso de texto antes de reproducir contenido.
- [CTE — documentos oficiales](https://www.codigotecnico.org/DocumentosCTE/DocumentosCTE) y [BOE — Real Decreto 314/2006, texto consolidado](https://www.boe.es/buscar/act.php?id=BOE-A-2006-5515): referencia española. La normativa concreta aplicable depende de uso, ubicación y versión vigente.

## 12. Historial y estado

- 01-10-2026: primera propuesta; contrastada con \`README.md\`, \`docs/ROADMAP.md\`, \`docs/DEVELOPMENT-WORKFLOW.md\`, contrato/schema F1, documentos F1–F3 y auditoría del ecosistema. Sin cambios al producto, schema ni fases canónicas.
- Estado de esta página: **lista para revisión humana; no aprobada ni fusionada**.
