# Rubik Sota Floor Plan Designer — Roadmap de producto e integración Immersphere

**Estado:** propuesta para revisión · **Actualizado:** 30 de septiembre de 2026  
**Repositorio responsable:** [Juanmaes83/floorplan-3d](https://github.com/Juanmaes83/floorplan-3d)

Este documento es la fuente de alcance y criterios para evolucionar el planificador. Las fases aún no están implementadas. Cada fase se desarrolla en PRs acotados, se valida técnica y visualmente y se marca como completada después del merge aprobado.

## 1. Visión

Evolucionar el editor actual para que un comprador, propietario, agente o promotora pueda abrir una vivienda, subir su plano 2D, ajustar su escala, personalizar la distribución, amueblarla, revisar el resultado en 3D desde móvil o escritorio y compartir una propuesta que pueda atender el equipo comercial.

La promesa: **“Convierte el plano de esta vivienda en una propuesta que puedes explorar y personalizar.”** El producto ayuda a visualizar y decidir; no sustituye planos de ejecución, mediciones profesionales ni certificaciones técnicas.

## 2. Por qué merece la pena

- **Mejora la experiencia de venta:** el cliente entiende la distribución y puede probar alternativas antes de visitar o de que la vivienda esté construida.
- **Diferencia Immersphere:** un tour enseña el espacio; el planificador permite configurar la vivienda.
- **Conecta interacción con intención:** la distribución y productos seleccionados pueden dar contexto a una solicitud comercial.
- **Reutiliza trabajo existente:** Immersphere Asset Lab ya contempla catálogos y Room Designer Lite; Immersphere Pro cubre propiedades, tours y captación; el CRM documenta la importación manual de propuestas visuales.
- **Valida antes de añadir infraestructura:** primero un flujo independiente y exportable; después persistencia e integración donde el uso lo justifique.

## 3. Responsabilidades por proyecto

| Repo / producto | Responsabilidad |
|---|---|
| [floorplan-3d](https://github.com/Juanmaes83/floorplan-3d) | Geometría del plano, distribución 2D, materiales y escena 3D. |
| [immersphere-asset-lab](https://github.com/Juanmaes83/immersphere-asset-lab) | Catálogo, colecciones, previews, referencias de modelo y permisos de uso. |
| [immersphere-pro](https://github.com/Juanmaes83/immersphere-pro) | Propiedad, publicación, tenant, experiencia del tour y futura persistencia segura del proyecto. |
| [immersphere-pro-crm-leads](https://github.com/Juanmaes83/immersphere-pro-crm-leads) | Recepción de propuestas, oportunidades y seguimiento comercial. |
| [IMMERSPHERE-PRO-INMOBILIARIAS](https://github.com/Juanmaes83/IMMERSPHERE-PRO-INMOBILIARIAS) | Presentación y venta de servicios a inmobiliarias, promotoras, constructoras e interioristas. |

Los repositorios mantienen responsabilidades separadas. Se conectan con contratos de datos versionados y referencias a propiedad, proyecto, productos y lead; no se fusionan físicamente.

## 4. Estado de partida

- La aplicación es estática y está concentrada en `index.html`; dibuja el plano con SVG y usa Three.js para 3D.
- Ya tiene una vivienda de referencia, catálogo genérico, edición 2D, materiales, mediciones, guardado local y exportación/importación JSON.
- No es todavía un gestor de múltiples viviendas ni permite convertir una imagen arbitraria de plano en geometría editable.
- No está conectada al catálogo de Asset Lab ni carga sus modelos GLB.
- Room Designer Lite resuelve inspiración rápida con plantillas y previews 2.5D; su documentación indica que no carga GLB en escena ni trabaja con escala física real. Es complementario: **Room Designer Lite para explorar; Floor Plan Designer para diseñar desde medidas**.
- Asset Lab exige licencia y permisos registrados por asset, y excluye los GLB pesados de Git.
- El CRM ya describe una importación manual de propuestas visuales JSON.
- El PR #1 de español y marca sigue abierto y en borrador. Este roadmap se propone como PR documental independiente.

## 5. Flujo de producto objetivo

```text
Ficha de vivienda / promoción
→ abrir plano o subir imagen 2D
→ calibrar escala y revisar geometría
→ distribuir estancias, muebles y acabados
→ recorrer en 3D
→ guardar, exportar o compartir
→ Immersphere: propiedad y experiencia publicada
→ CRM: propuesta, lead y seguimiento
```

La lectura automática del plano no es requisito para el primer MVP. Primero debe existir un flujo fiable de subir, calibrar, trazar y corregir. Después automatizamos los pasos donde las pruebas demuestren que ahorran trabajo.

## 6. Fases y criterios de salida

| Fase | Resultado | Prioridad / estado |
|---|---|---|
| F0. Contrato y auditoría | Alcance, esquema de proyecto, límites técnicos, catálogo/licencias y preview verificable. | P0 · este documento |
| F1. Base estable mobile-first | Interacción táctil, responsive y 2D/3D comprobables. | P0 · pendiente |
| F2. Proyectos múltiples | Crear, guardar, duplicar e importar/exportar proyectos versionados. | P0 · pendiente |
| F3. Subir y trazar plano 2D | Calibrar imagen de cualquier vivienda y corregir geometría editable. | P0 · pendiente |
| F4. Detección asistida | Proponer geometría con incertidumbre visible y revisión humana. | P1 · pendiente |
| F5. Escena 3D desde geometría | Mantener sincronizadas distribución 2D y escena 3D. | P1 · pendiente |
| F6. Catálogo Asset Lab | Selección de productos y carga controlada de modelos autorizados. | P1 · pendiente |
| F7. CRM | Exportar una propuesta compatible con el flujo JSON existente del CRM. | P1 · pendiente |
| F8. Immersphere Pro | Vincular proyecto a propiedad/tenant, publicar y capturar consultas. | P2 · pendiente |
| F9. Analítica y oferta | Medir uso y conversión, pilotar y definir empaquetado comercial. | P2 · pendiente |

### F0 — Contrato de producto y auditoría

- Confirmar la versión de español/marca y la referencia para pruebas.
- Inventariar datos guardados, geometría, límites y funcionamiento 3D.
- Definir `FloorPlanProjectV1`: versión de schema, IDs estables, unidades mm, escala, habitaciones, muros, huecos, materiales, objetos y referencia a imagen fuente.
- Auditar qué manifests, previews y GLB existen realmente en Asset Lab; no inferir disponibilidad del fichero a partir de una lista de catálogo.
- Fijar las decisiones pendientes: formatos iniciales, moneda/precios, hosting, privacidad y retención.
- Documentar comandos, pruebas y un preview reproducible por PR.

**Salida:** plan técnico acotado para F1–F3, esquema revisable y URL fiable para revisar cada cambio. Un proxy que no renderice Three.js no es QA 3D.

### F1 — Base estable y mobile-first

- Probar los flujos en 360, 390 y 430 px, tablet y escritorio.
- Replantear controles táctiles: paneles plegables, acciones alcanzables, gestos de zoom/pan, targets cómodos y sin scroll horizontal.
- Verificar selección, edición, guardado, sincronía 2D/3D, carga Three.js y fallback si no hay WebGL.
- Medir rendimiento inicial en un móvil de gama media antes de optimizar.
- Mantener la modalidad independiente; no imponer login ni backend al MVP.

**Salida:** completar flujos principales con ratón y táctil; capturas de QA; errores bloqueantes corregidos y preview del PR.

### F2 — Varios proyectos y viviendas

- Nuevo proyecto, abrir, duplicar, renombrar, eliminar con recuperación y restaurar ejemplo.
- Soportar varias viviendas/variantes con guardado local antes del backend.
- Versionar JSON y migrar datos antiguos.
- Guardar geometría, mobiliario, acabados, escala y origen; no incrustar binarios pesados.

**Salida:** varios proyectos sobreviven recargas y la importación/exportación valida versiones sin romper datos.

### F3 — Subir y trazar planos 2D (MVP para viviendas distintas)

1. Empezar con PNG/JPG; PDF se añade después si la conversión en navegador es fiable.
2. Recortar, rotar y colocar imagen de fondo.
3. Calibrar escala con cota conocida o distancia introducida por el usuario.
4. Trazar y editar paredes, habitaciones, puertas y ventanas.
5. Corregir geometría antes de generar escena 3D.
6. Guardar referencia y trazado en el proyecto; permitir quitar la imagen.

**Salida:** una persona puede pasar distintos planos residenciales de imagen a geometría editable a escala, corregirlos y decorarlos. Probar distintas resoluciones, orientaciones y calidades.

Un plano escaneado puede no tener escala o estar deformado. El sistema debe pedir calibración y revisión; no inventar medidas exactas.

### F4 — Detección asistida

- Proponer muros, habitaciones, puertas/ventanas, etiquetas y cotas como sugerencias editables.
- Mostrar incertidumbre; no convertir automáticamente detecciones dudosas en geometría confirmada.
- Medir precisión y correcciones en una muestra representativa antes de ofrecer la función.
- Registrar coste, latencia y ahorro frente al trazado manual; conservar el flujo manual.

**Salida:** mejora demostrable del tiempo de preparación y tasa de error aceptada para el piloto; ninguna geometría incierta se publica sin revisión.

### F5 — Escena 3D desde el plano

- Generar paredes y aperturas desde el modelo geométrico calibrado.
- Mantener el proyecto como fuente de verdad para 2D y 3D.
- Sincronizar posición, dimensiones y rotación de objetos.
- Cargar por visibilidad; optimizar para móvil y dar fallback sin WebGL.
- Identificar la salida como visualización, no como documentación de obra.

**Salida:** cambios de geometría/muebles se reflejan en las dos vistas y un conjunto de viviendas de prueba funciona en navegadores soportados.

### F6 — Asset Lab e IKEA

Contrato mínimo de asset: `assetId`, nombre, marca, categoría, colección, SKU si existe, dimensiones mm, preview, referencia GLB optimizada, peso, licencia, usos permitidos, atribución y vencimiento del permiso.

1. Consumir el manifest de Asset Lab mediante adaptador; no mantener catálogos duplicados.
2. Integrar primero previews y dimensiones para la planta 2D.
3. Probar GLB bajo demanda, optimización/LOD y límites de rendimiento.
4. Reemplazar mueble genérico por producto sin perder posición, medidas ni estancia.
5. Guardar referencias al asset, no copiar GLB en cada proyecto.

**Puerta de licencia:** los scripts de descarga no acreditan derechos de uso comercial. Un producto IKEA solo se muestra en una experiencia pública/comercial cuando la licencia cubra ese uso y el uso de marca necesario. Sin permiso confirmado, usar un mueble genérico u otro asset autorizado.

**Salida:** catálogo sincronizado, ficha y licencia aprobadas para cada asset publicado; prueba de carga/fallback móvil.

### F7 — Propuesta y CRM

- Exportar PNG y `FloorPlanProjectV1` validado.
- Crear adaptador a la propuesta visual que el CRM ya importa.
- Incluir productos/cantidades, estancia, medidas, acabados, imagen, referencia vivienda/proyecto y presupuesto solo cuando los precios estén verificados.
- Validar importación sin perder datos existentes; acciones comerciales siguen manuales.

**Salida:** exportación del editor → importación en CRM → propuesta utilizable en ficha de lead, con prueba de ida y vuelta.

### F8 — Immersphere Pro

- Abrir el editor desde una propiedad/promoción con ruta o embed controlado.
- Vincular proyecto con `tenantId`, `propertyId` y versión de plano; validar permisos en servidor.
- Separar modo público (crear/ver propuesta) de gestión interna.
- Persistir proyectos/medios con servicios aprobados por Immersphere; no subir planos privados a otro servicio sin decisión y aviso de privacidad.
- Capturar lead solo tras acción explícita y vincularlo con propiedad/propuesta.
- Mantener tour y planificador como experiencias complementarias.

**Salida:** propiedad abre su plano, guarda una propuesta con permisos correctos y vincula la consulta al lead; pruebas de aislamiento entre tenants.

### F9 — Analítica y validación

Medir, con consentimiento, apertura, inicio, guardado, exportación/compartición y consulta. Pilotar con inmobiliarias/promotoras. Establecer objetivos tras obtener línea base para finalización, uso móvil, conversión y selección de catálogo. Decidir si es módulo de Immersphere Pro, servicio premium o herramienta de captación.

**Salida:** decisión comercial basada en piloto y documentación actualizada con resultados.

## 7. Contratos entre repositorios

### `FloorPlanProjectV1`

Schema independiente de la UI y versionado. Contiene IDs, nombre, unidades, escala, referencia al plano fuente, habitaciones, muros, huecos, materiales y elementos con posición/rotación/dimensiones. `assetId` es opcional. Imágenes y GLB se referencian por ID/URL autorizados; no se embeben en JSON.

### `VisualProposalV1`

Adaptador para CRM con referencias `projectId`/`propertyId`, estancia, productos/cantidades, presupuesto solo verificado, export visual y contacto únicamente tras acción explícita. Desacoplado del schema interno CRM.

**Fuente de verdad:** Floor Plan Designer = geometría; Asset Lab = catálogo/licencia; Immersphere Pro = propiedad/publicación/almacenamiento; CRM = oportunidad/seguimiento; Inmobiliarias = captación comercial.

## 8. Flujo de trabajo con Claude Code

1. Elegimos una fase y un PR acotado; no pedimos integrar todo el ecosistema en una sola tarea.
2. Claude Code trabaja en el repositorio correcto y una rama nueva; entrega pruebas, resumen, riesgos y preview visual cuando hay cambios UI.
3. Juanma y Codex revisamos alcance, diff, criterios, licencias, documentación y QA.
4. Corregimos hallazgos; verificamos CI y el preview ligado al commit.
5. El PR se mergea una vez aprobado; no se usa producción como entorno de revisión.
6. Tras mergear, actualizamos este roadmap con PR/commit, pruebas, limitaciones y siguiente fase.

### Definition of Done por fase

- PR acotado al repo responsable; criterios de aceptación comprobados.
- Pruebas útiles y reproducibles; preview humana del commit exacto para UI.
- QA móvil/escritorio según alcance.
- Sin secretos, GLB no autorizado ni binarios pesados en Git.
- README/roadmap actualizado y fase marcada completada solo tras revisión y merge.
- Riesgos y limitaciones reales documentados.

## 9. Riesgos y decisiones pendientes

| Riesgo/decisión | Control |
|---|---|
| Lectura errónea de plano | Calibración y revisión; IA como sugerencia. |
| Uso de modelos/marca IKEA | Permisos documentados por asset; bloquear publicación sin autorización. |
| Rendimiento GLB en móvil | Previews primero; carga selectiva, compresión y medición. |
| Planos privados | MVP local; decidir almacenamiento/consentimiento antes de subir a backend. |
| Precios actuales en yuanes | No mostrar estimación a clientes hasta verificar mercado, importes y moneda. |
| Confusión con plano de obra | Presentarlo como visualización orientativa, no documentación técnica. |
| Acoplar repos | Contratos y adaptadores; cambios en el repo responsable. |
| Automatizar antes de validar | Probar trazado manual, JSON y CRM existente primero. |

## 10. Siguiente orden de trabajo

1. Revisar este roadmap.
2. Completar el PR de español/marca y obtener preview que permita verificar 2D **y** 3D desde el commit exacto.
3. Pedir a Claude Code una auditoría breve de F1 y `FloorPlanProjectV1`, sin refactor amplio.
4. Implementar F1 mobile-first; fijar QA repetible.
5. Completar F2 y F3 con una vivienda distinta de la plantilla.
6. Solo con ese flujo sólido, abordar detección asistida, escena 3D y catálogo.
7. Conectar primero la propuesta JSON al CRM; después propiedad/leads en Immersphere Pro.
8. Pilotar y decidir el modelo comercial con datos.

**No basta con que la aplicación abra un plano. El concepto está listo para validación cuando alguien puede abrir una vivienda distinta, calibrar su plano, personalizarla desde móvil, revisarla en 3D y compartir una propuesta que el equipo comercial pueda seguir.**
