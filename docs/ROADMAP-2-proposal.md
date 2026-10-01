# Roadmap 2 — propuesta de evolución de Rubik Sota

> **Estado: propuesta para revisión; no aprobada como alcance, prioridad comercial ni compromiso de fechas.**
> Reconciliada el 01-10-2026 contra `master` remoto `fa79d07243672076df506aae0f50ec84fca82b5d`, tras PR #19. PR #15 fusionada el 01-10-2026 (`4ab39025379cbbb8873dd344183967aafa0a1bdc`); esta propuesta continúa sin aprobación global, prioridades comerciales ni fechas. La fotografía inicial sobre `6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f` queda sustituida. El contrato de proyecto ahora es 1.4.0 por la extensión opcional de materiales de pared/repetición de #19. El piloto #17, biblioteca acotada #19 y entrega dimensional #18 están integrados.

## 1. Propósito y principios

Este documento ordena las mejoras que pueden convertir Rubik Sota en un flujo coherente: partir de una vivienda, obtener geometría editable, dimensionar estancias, decorarla con materiales y objetos, y reutilizar el resultado en herramientas del ecosistema. No afirma que esos conectores existan ya ni que el mercado esté validado.

Principios para decidir:

1. **Una fuente de verdad:** `FloorPlanProjectV1` mantiene geometría y unidades en milímetros. Imágenes, escenas Blender/Unreal, productos CRM y vistas panorámicas son derivados con referencias estables.
2. **La geometría debe seguir siendo coherente:** un cambio de ancho/profundidad es una operación sobre muros y relaciones, no solo cambiar un número de etiqueta.
3. **No abrir formatos sin control:** un adaptador convierte y valida activos al perfil que Rubik soporta. No se confía en una extensión, manifest o nombre de fichero.
4. **Privacidad por defecto:** la app actual funciona principalmente en navegador y guarda proyectos localmente. Un proveedor cloud o backend es una decisión explícita, con coste, retención y borrado definidos.
5. **No inferir prioridad de mercado:** cliente final, inmobiliarias, interiorismo/decoración y reformas son segmentos distintos. D-01 sigue abierta; CRM, normativa y capacidades B2B deben validarse con el segmento elegido.
6. **Revisión fase a fase:** cada entrega tiene PR, pruebas, preview del SHA exacto cuando cambie la interfaz, revisión humana, aprobación, merge y actualización documental antes de iniciar una fase dependiente.

## 2. Punto de partida reconciliado

Fuente: README, [roadmap canónico](ROADMAP.md), workflow e informes vigentes de
master. La aprobación de #17/#18 y READY son registros de sus cierres, no QA
repetida en esta tarea documental. GitHub HTML consultado el 01-10-2026 confirma
#15 estaba abierta y #18 fusionada durante aquella comprobación documental; #15 quedó fusionada después. No se ejecutaron tests, app ni nueva preview visual en aquella revisión.
El segmento comercial sigue abierto y completar software no aprueba todo F0.

| Área | Estado real que condiciona este plan |
|---|---|
| Planos e imágenes | F1b ya importa PNG/JPG/WebP estáticos, calibra con dos puntos y una segunda cota, y permite trazar/editar muros, huecos y habitaciones. No hay que volver a construir ese flujo desde cero. El límite actual documentado es 15 MiB y 8000 px por lado. |
| Proyectos | F1a/F1b permiten varios proyectos locales, persistencia y JSON/ZIP. [PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18), aprobada e integrada, añadió inicio independiente vacío/imagen y creación de habitaciones dimensionadas. Sin sync multi-dispositivo ni servidor de proyecto. |
| Medidas | `FloorPlanProjectV1` 1.4.0 mantiene mm/IDs y polígonos explícitos independientes de los ejes de muro; #19 añadió asignación opcional de acabados a paredes y repetición por material. #18 edita rectángulos ortogonales con muros inequívocos: lado fijo, impactos, preview y operación reversible. No solver universal ni edición numérica general irregular. [Reglas y cierre](technical/home-room-dimensions.md). |
| F2 | Asistencia local experimental. Cinco sesiones de base, conjunto fijo de veinte planos y umbrales acordados siguen pendientes; no bloquean estas propuestas, pero F2 no debe anunciarse como precisión validada. |
| F3 | PR #12 inicial, piloto externo #17 y biblioteca de superficies #19 integrados: dos modelos externos con texturas y búsqueda; 50 mapas CC0-1.0 para suelos/paredes, con persistencia, comparación y fallback. La extensión opcional `FloorPlanProjectV1` 1.4.0 registra acabados murales y repetición. [Informe #19](technical/surface-material-library.md). No es un catálogo comercial general; nuevos modelos requieren inventario, medidas, permiso y perfil por recurso. El rendimiento móvil físico sigue sin medirse. |
| Render web | Three.js 0.160.0 fijado. F3 admite PNG/JPEG embebidos bajo validación; rechaza extensiones/recursos fuera del perfil. No soporte general de Draco, KTX2, meshopt, WebP ni URI remotas. La política del runtime no implica imposibilidad de convertir un asset offline. |
| Ecosistema | La auditoría documentó Asset Lab, Room Designer, CRM, Immersphere SaaS, Blender MCP y LAB Astra. Son fuentes potenciales; la auditoría no demuestra integración de extremo a extremo. La evidencia de cada repo está fijada por SHA en [la auditoría de ecosistema](product/ecosystem-integration-audit.md). |
| Presentación | La auditoría describe hotspots de Immersphere como posiciones visuales/porcentuales. No equivalen a coordenadas espaciales enlazadas con geometría Rubik. |
| Roadmap vigente | F0–F3 y sus cierres siguen en [docs/ROADMAP.md](ROADMAP.md). Este Roadmap 2 es un horizonte propuesto posterior, no una renumeración retroactiva. |

## 3. Secuencia propuesta

Los órdenes 0/1 son antecedentes completados; 2–8 son propuestas futuras, **no números de fase aprobados**. Ordena las candidatas por combinación de valor visible, esfuerzo y dependencias. Las tallas son **estimaciones técnicas preliminares** (S/M/L), no compromisos. El impacto es una hipótesis de producto que requiere pruebas con usuarios.

| Orden | Entrega propuesta | Impacto potencial | Esfuerzo / incertidumbre | Dependencia y decisión |
|---|---|---|---|---|
| 0 · antecedente | F3 inicial y piloto acotado completados | Valor visual revisado; mercado no validado | Estimación histórica M | #12/#17 aprobadas e integradas; piloto de dos IKEA cerrado. No reabrir ni declarar una biblioteca general completada. |
| 1 · antecedente | Crear vivienda y editar dimensiones integrado | Flujo revisado; impacto comercial no medido | Estimación histórica M–L | #18 aprobada/fusionada; rectángulos con cuatro muros inequívocos. Un solver general o ampliación irregular requeriría otra propuesta. |
| 2 · entrega integrada | Biblioteca visual acotada de superficies para suelos y paredes | Mejora visual implementada y aprobada; impacto de producto/mercado aún no medido | Entrega implementada; rendimiento físico pendiente | PR #19 fusionada (`fa79d07243672076df506aae0f50ec84fca82b5d`): 50 mapas locales CC0-1.0, diez por familia, búsqueda/comparación, aplicación, repetición, persistencia y fallback. Sin precios. Validación en Chromium/SwiftShader; móvil físico pendiente. [Informe](technical/surface-material-library.md). |
| 3 | Importador normalizador de modelos GLB de Asset Lab | Alto para ampliar mobiliario real | M / media-alta | Amplía el canal del piloto F3 cerrado mediante otra entrega, no reabre #17. Requiere perfil aprobado, herramientas reproducibles, procedencia y pruebas del resultado convertido. No relajar el loader de producción para todos los formatos. |
| 4 | Adaptador Room Designer → CRM | Alto solo si el segmento comercial lo justifica | M / alta por contratos/identidad | D-01 y contrato de datos. Resolver `lineItems`→`products`, cantidades, IDs, versiones, reintentos e idempotencia; prototipo con datos sintéticos primero. |
| 5 | Exportación determinista Rubik → Blender | Alto para contenido y producción avanzada | M–L / media | Definir ejes, unidades, jerarquía e IDs; probar vivienda asimétrica. Salida portable glTF/GLB como primera prueba, no automatizar aún todo Astra/Seedance. |
| 6 | Entrada CAD vectorial: DXF piloto, luego decisión DWG | Alto para profesionales; menor para consumidor | L / alta | Elegir entidades, unidades, capas y supuestos. DXF primero con importación local si una biblioteca adecuada supera revisión de licencia. DWG necesita gate de proveedor/convertidor, privacidad y coste; no se reduce a renderizar una imagen. |
| 7 | Presentación conectada con panoramas/hotspots Immersphere | Alto para promoción inmobiliaria | L / alta | Depende de proyecto/objeto IDs y exportación espacial. Definir relación panorama-cámara-transformación-objeto; primer intercambio estático y reversible. No llamar “hotspot anclado” a una coordenada de pantalla. |
| 8 | Perfil orientativo de reglas constructivas por jurisdicción | Potencialmente alto para profesionales, riesgo alto | L / muy alta | Solo tras escoger país/uso y asesoría competente. Empezar con reglas estructuradas, versionadas y citadas; nunca prometer certificación o cumplimiento automático. |

### 3.1 Orden recomendado después de #18

- **Conservar lo integrado:** #17 y #18 aprobadas; no volver a implementar ni
  reabrir esas entregas. F2 sigue experimental: cinco sesiones, veinte planos y
  umbrales pendientes sin bloquear nuevas implementaciones autorizadas.
- **Organización reconciliada:** F0 #3 y propuesta #15 fusionadas en master; no aprobación global de fases o decisiones abiertas.
- **Suelos/acabados:** biblioteca visual acotada de 50 mapas implementada, revisada y fusionada por PR #19; no equivale a aprobar una biblioteca general, calendario ni las siguientes propuestas. Impacto comercial y rendimiento en móvil físico no medidos.
- **Investigar D-01:** observar tareas de cliente, agente, interiorista/reforma;
  elegir un segmento o mantenerlo explícitamente abierto, sin inferirlo de CRM.
- **Después, pipeline controlado de modelos/texturas**, con versiones/permisos,
  dimensiones, perfil probado y comparación antes/después; no loader universal.
- **CRM, Blender/Unreal, CAD e Immersphere** según segmento y gates propios:
  contratos, identidad, unidades, ida/vuelta, privacidad y coste. Son conectores
  diferentes y no se afirman implementados por enlazar repos o formatos.
- **Normativa** solo tras decidir jurisdicción/uso, fuentes/licencias y asesoría.

## 4. Especificación de las mejoras principales

### 4.1 Nuevo proyecto y dimensiones: entrega ya integrada, límites actuales

[PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18) aprobada por Juanma el
01-10-2026 y fusionada mediante squash `10e9f96b417f866d45088fede039786180ddce95`.
SHA revisado: `c7d1b81e1f6456a9485c88f88723a6fd0fd7fe66`.
[Informe, evidencia, fallos iniciales y cierre](technical/home-room-dimensions.md).
El registro de cierre identifica Vercel READY y preview protegida/temporal;
no se vuelve a certificar aquí acceso o rendimiento de esa preview.

- «Nuevo proyecto»: vacío o imagen PNG/JPEG/WebP estático, proyectos independientes;
  conserva raster F1b, calibración, trazado, almacenamiento e intercambio JSON/ZIP.
- Crear/nombre de estancias con dimensiones interiores enteras en **mm**,
  posición X/Y o unión compatible a derecha/debajo. La unión reutiliza un muro
  completo y no cambia silenciosamente la estancia vecina.
- Edición directa limitada a **cuatro vértices rectangulares ortogonales y cuatro
  muros completos inequívocos**; una dimensión por operación y lado fijo explícito.
  La propuesta genérica original de editar cualquier polígono ortogonal o usar
  metros no se presenta como implementación actual.
- Preview e impactos antes de confirmar; cancelación intacta, guardar atómico,
  undo/redo, IDs estables y sincronización 2D/3D. No modifica la escala de la imagen.
- Huecos en muro desplazado: consentimiento explícito, medidas/posición relativa
  conservadas; en un muro de longitud variable mantiene posición física mediante
  offset si cabe. Fuera de límites se rechaza, no se encoge ni elimina.
- Muros compartidos modificados, relaciones ambiguas, cotas afectadas y muebles
  fuera/colisionando bloquean el cambio con motivo y alternativa manual. Mover
  un muro exterior puede funcionar manteniendo fijo el lado compartido compatible.
- Formas irregulares/diagonales/fragmentadas mantienen selección y edición manual
  de vértices. No solver universal ni deformación automática de toda una vivienda.

Las aspiraciones originales (edición numérica más general, dividir/fusionar muros,
varias plantas, recalcular adyacencias) quedan **ampliaciones no aprobadas**.
Necesitarían casos explícitos, política de anclajes/cotas y pruebas antes de abrir
otra implementación; no justifican cambiar FloorPlanProjectV1 anticipadamente.

### 4.2 Conectores de modelos y texturas

**Propuesta técnica de pipeline/conector, aún no implementada de forma general:** el objetivo es un perfil controlado, no “que ningún asset sea rechazado”. Conviene separar:

1. **Adaptador de entrada**: lee el origen y produce un paquete Rubik aprobado, registrando SHA-256, fuente, versión, permiso, medidas declaradas y medibles, herramientas y transformaciones.
2. **Normalizador/validador fuera del runtime**: valida GLB/glTF, recursos embebidos, dimensiones, materiales, malla y límites; decodifica o convierte únicamente extensiones elegidas y probadas.
3. **Perfil de salida acotado**: por ejemplo GLB 2.0 autocontenido, lista allowlist de extensiones necesarias o ninguna extensión requerida, texturas embebidas y límites explícitos.
4. **Loader web**: solo carga el perfil producido, con tope de bytes, polígonos/recursos, manejo de memoria y fallback.

Three.js documenta soporte para Draco, meshopt, KTX2/BasisU y extensiones materiales mediante loaders/configuración explícitos; cada decoder añade código, compatibilidad, superficie de fallo y coste de descarga. La lista soportada por la versión fijada en Rubik debe verificarse, no copiar la lista de la documentación actual sin pinning. El pipeline debe registrar versiones y ser repetible. No aceptar URI externas por defecto ni bajar modelos/texturas al navegar sin consentimiento.

**Prueba de conector:** un asset compatible existente y otro con Draco/textura; comparación visual origen→normalizado; dimensiones contrastadas con dato fiable; errores útiles para recurso externo, extensión desconocida, archivo corrupto y presupuesto excedido; carga en móvil y fallback genérico. Solo añadir extensiones al perfil si una necesidad real no se resuelve con conversión.

### 4.3 Materiales con presupuesto visual y móvil

**Próxima candidata propuesta, pendiente de aprobación; no iniciada.** Empezar
por nivel 1 de suelos/acabados y acordar exclusiones. Nivel 2/PBR es posterior,
no se incorpora automáticamente al mismo alcance.

- **Nivel 1:** biblioteca de materiales de suelo/acabados basada en los presets existentes: nombre, muestra, color/mapa, categoría y licencia/origen. Separar muestras de catálogo de una textura de alta resolución.
- **Nivel 2:** materiales PBR en muebles/GLB importados: base color, roughness, normal/occlusion cuando corresponda, gestión de color y formatos de textura comprimidos si el dispositivo lo permite.
- Cada asset declara presupuesto de descarga, dimensiones de textura, memoria estimada y alternativa de menor calidad. Cargar bajo demanda, liberar texturas al cambiar de escena y mantener fallback.
- La métrica de aceptación debe medir bytes descargados, tiempo de disponibilidad, memoria aproximada y estabilidad en el dispositivo objetivo; no fijar números de producto sin baseline.
- No asociar precios de catálogo a materiales hasta decidir moneda, origen, actualización y términos.

## 5. Contratos de intercambio que cada “conector” debe probar

| Conector | Transformación a validar | Prueba de ida y vuelta / fallo |
|---|---|---|
| Asset Lab → Rubik | manifest y GLB → asset normalizado y `assetRef` | mismo hash de entrada; dimensiones con fuente; ID estable; texturas/extensiones esperadas; fallback y rechazo explicable. |
| Room Designer → CRM | `lineItems` → `products`/adaptador de CRM | cantidades, SKU/identidad, moneda si aplica, reimportación repetida sin duplicados, proyecto asociado y errores parciales recuperables. Datos ficticios; no exportar PII en telemetría. |
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
2. **Próxima candidata y futuras ampliaciones:** aprobar el alcance de suelos/acabados; decidir si más adelante se amplía la geometría más allá de #18. El alcance rectangular integrado ya está aprobado, no vuelve a plantearse como pendiente.
3. **Presupuesto móvil objetivo:** dispositivos y mediciones (descarga, memoria, latencia); obtener baseline antes de fijar límites.
4. **Catálogo futuro:** perfil de conversión, nuevos candidatos/usos, marca/atribución y dimensiones verificables. La [confirmación del propietario](../assets/f3/ASSET-LAB-PROVENANCE.txt) cubre el piloto incorporado/Git/preview; no licencia universal ni partnership IKEA. F1a tiene [confirmación acotada de código](technical/F1a.md), no LICENSE inventado.
5. **CRM:** cuándo se selecciona como prioridad y cuál es el contrato canónico entre Room Designer y CRM.
6. **CAD:** si el perfil inicial necesita DXF; proveedor/ruta y política de privacidad si se aborda DWG.
7. **Geografía normativa:** España/CTE, jurisdicciones estadounidenses/IRC-IBC u otra; propósito educativo, diseño preliminar o profesional.
8. **Cuenta y datos:** si el producto permanece local/offline o incorpora backend, sincronización, almacenamiento o servicios cloud.

F3 y #18 ya están cerradas dentro de su alcance. Las decisiones restantes no se resuelven por esos merges; son gates para comprometer las candidatas e integraciones respectivas. Juanma decide prioridades y política; equipo técnico aporta perfiles y mediciones; normativa/derechos amplios requieren asesoría competente.

## 9. Qué queda fuera por ahora

- Convertir Rubik en una app Unreal o reescribir Three.js. La meta es interoperar con una escena/exportación, no duplicar el editor.
- Interpretar cualquier plano automáticamente o anunciar precisión profesional basada en F2.
- Aceptar todas las extensiones de glTF o texturas remotas en runtime.
- Ecommerce, precios de IKEA, compras, disponibilidad de stock, CRM multi-tenant o sincronización cloud sin segmento, fuente y decisión de privacidad.
- Hotspots espaciales sin calibración cámara/panorama.
- Certificación de cumplimiento normativo.
- Cambiar `FloorPlanProjectV1` anticipadamente. Cada cambio de contrato requiere necesidad de interoperabilidad reproducida y compatibilidad de migración.
- Fechas o puntuaciones de mercado/esfuerzo sin evidencia.

## 10. Definición de terminado por entrega

Antes de aprobar cada fase:

- Requisitos y límites publicados; estado “comprobado / parcial / propuesta / pendiente” explícito.
- Pruebas automatizadas de dominio y fallos, fixtures sintéticos; no incluir planos reales/personales en repositorio.
- Revisión visual humana de la preview exacta en móvil y escritorio cuando cambie interfaz. Registrar URL, SHA y acceso.
- Si es conector: prueba real de ida y vuelta, IDs, unidades, datos, duplicados, cancelación y errores; versión de formatos/herramientas y cómo reproducir.
- Actualizar documento técnico y [roadmap canónico](ROADMAP.md) después de la aprobación/merge. No cambiar el estado canónico a propuesta aprobada por esta página.
- Merge solo después de aprobación explícita de Juanma; limpiar rama/preview al completar y dejar el siguiente paso verificable.

## 11. Fuentes técnicas oficiales: registro histórico y enlaces

Registro de consulta **original**: 01-10-2026, propuesta `eebbfd9`. Las atribuciones siguientes son evidencia documental del antecedente, no una integración ejecutada ni una nueva revisión técnica en esta reconciliación. La comprobación HTTP de enlaces se registra debajo; HTTP 200 por sí solo no renueva contenidos/versiones, precios o permisos.

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

### 11.1 Comprobación de enlaces, 01-10-2026

Método: curl HEAD con redirecciones y TLS verificado, timeout 15 s, herramientas
existentes. Sin instalación, cambios de red ni elusión. **HTTP 200 acredita acceso
al enlace, no inspección funcional o renovación del contenido técnico.** Para
las fuentes oficiales bloqueadas el origen no llegó a responder: el proxy negó
CONNECT con 403 (curl 56, código de origen 000). No demuestra inexistencia de la
fuente o de la capacidad; los contenidos/versiones/importes/licencias no se
revalidaron y deben consultarse antes de diseñar cada integración.

| URL exacta | Resultado del mecanismo en esta ejecución |
| --- | --- |
| https://aps.autodesk.com/developer/overview/model-derivative-api | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/supported-translations/ | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://aps.autodesk.com/topics/pricing | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://codes.iccsafe.org/content/IBC2021P2/preface | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://dev.epicgames.com/documentation/en-us/unreal-engine/datasmith-import-options?application_version=4.27 | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://dev.epicgames.com/documentation/unreal-engine/datasmith-supported-software-and-file-types | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://dev.epicgames.com/documentation/unreal-engine/gltf-file-format-support-in-unreal-engine | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://github.com/Juanmaes83/floorplan-3d/pull/17 | HTTP 200; contenido técnico no reaudita en esta comprobación |
| https://github.com/Juanmaes83/floorplan-3d/pull/18 | HTTP 200; contenido técnico no reaudita en esta comprobación |
| https://threejs.org/docs/pages/DRACOLoader.html | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://threejs.org/docs/pages/GLTFLoader.html | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://threejs.org/docs/pages/KTX2Loader.html | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://www.boe.es/buscar/act.php?id=BOE-A-2006-5515 | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://www.codigotecnico.org/DocumentosCTE/DocumentosCTE | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://www.iccsafe.org/products-and-services/i-codes/2018-i-codes/irc/ | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |
| https://www.iccsafe.org/products-and-services/i-codes/ibc/ | Bloqueado: CONNECT 403; curl 56; origen sin respuesta |

## 12. Historial y estado

- 01-10-2026: primera propuesta; contrastada con `README.md`, `docs/ROADMAP.md`, `docs/DEVELOPMENT-WORKFLOW.md`, contrato/schema F1, documentos F1–F3 y auditoría del ecosistema. Sin cambios al producto, schema ni fases canónicas.
- 01-10-2026: reconciliación en la misma rama `docs/roadmap-2-evolution`, cabeza anterior `eebbfd911cd02021a8ad3093ddc6d0548dd3be96`, integrando master `133f6f47fc5f16764cb290f95e49414932b27a09` por merge sin reescritura. #17/#18 cerradas para sus alcances; suelos/acabados próxima candidata sin iniciar. Documento único de #15; roadmap canónico, código, contrato y assets intactos frente a master.
- F0 se reconcilió antes en la PR #3, rama publicada @ `cb822eb98d8185e2cb4496420c206168927da99d`; checkout limpio antes de pasar a #15. No se copia esa documentación a esta PR ni se fusiona #3.
- Estado de esta página: **lista para revisión humana; no aprobada ni fusionada**.

### 12.1 Validaciones y límites de publicación

- `python3 /tmp/reconcile-doc-validator.py docs/ROADMAP-2-proposal.md`: Markdown (tablas/cercas), enlaces internos/anchors y referencias correctos; helper temporal fuera del repo, sin dependencias/documentos nuevos versionados.
- `git diff --name-status origin/master`: solo `docs/ROADMAP-2-proposal.md`.
- `git diff --exit-code origin/master -- docs/ROADMAP.md index.html js assets docs/contracts`: sin diferencias; roadmap canónico y producto conservados.
- `git diff --check` y `git diff --cached --check`: correctos. Integración de master en esta rama sin conflictos documentales ni de producto; sin reescritura ni force push.
- REST GET de PR #15 devuelve `Forbidden`; estado de mergeabilidad GitHub no verificado. Master integrado permite confirmar ausencia de conflictos localmente, no políticas/checks/aprobaciones remotos.
- No se ejecutan suites, anexos de QA ni app; no se crea preview visual ni se certifica CI/READY. Conteos y cierres del producto siguen atribuidos a sus informes originales.
- REST PATCH para actualizar título/descripción de #15 también devolvió `Forbidden`; metadatos no editados desde Codex. El push publica la revisión en los archivos de la PR existente.
- Estado de aquella revisión: PR #15 permanecía pendiente y Codex no la fusionó. Estado actual comprobado el 01-10-2026: #15 fusionada en `4ab39025379cbbb8873dd344183967aafa0a1bdc` y #3 en `5e5e0dc42b8669e7afcb121851f2901d2930a260`. La biblioteca está autorizada de forma acotada; el resto sigue siendo propuesta.

La entrega actual de biblioteca se documenta en [el informe específico](technical/surface-material-library.md); no inicia los conectores ni aprueba el conjunto del Roadmap 2.
