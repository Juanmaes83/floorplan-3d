# F0: registro de decisiones

**Fecha:** 30-09-2026 · **Estado general:** ninguna decisión está aprobada. Todas las «recomendaciones» son **provisionales** hasta que Juanma las marque como aprobadas en este fichero o en el PR.

**Estados posibles:** `Abierta` (sin recomendación firme), `Recomendada` (propuesta técnica a la espera de visto bueno), `Aprobada` (solo la puede poner Juanma), `Aplazada` (se decide más tarde sin bloquear F1).

Evidencia: [`F0-product-audit.md`](F0-product-audit.md) (§ indicados) y [`FloorPlanProjectV1.md`](../contracts/FloorPlanProjectV1.md).

## Tabla de decisiones

| ID | Decisión | Opciones | Recomendación provisional | Impacto | Responsable | Estado | Fase límite |
|---|---|---|---|---|---|---|---|
| D-00 | Versión de referencia para pruebas | (a) `master` @ `a03136c`; (b) PR #1 @ `540b825`; (c) esperar al merge de #1 | **(b)** para la QA de F0 y F1; **(c)** en cuanto #1 se mergee. `a03136c` sigue siendo la línea base | Todas las capturas y comparaciones | **Juanma** | Recomendada | Inicio de F1 |
| D-01 | Usuario inicial y problema prioritario | Propietario o comprador; **agente inmobiliario (operador)**; interiorista; reformas; equipo interno como servicio | Agente u operador inmobiliario: «de plano en imagen a propuesta 2D/3D orientativa y editable». Plan B: equipo interno como operador (§2.3) | Define el flujo de F1, el dispositivo principal y los mensajes | **Juanma** | Recomendada, **no validada** | Inicio de F1 |
| D-02 | Formatos de entrada iniciales | PNG/JPG; + PDF (render en el navegador con pdf.js); + DWG/DXF; + foto de móvil | **Solo PNG/JPG en F1**. PDF solo cuando se mida la fiabilidad de su conversión. DWG/DXF fuera de alcance | Contrato (`mediaType`), dependencias, QA | Equipo técnico (visto bueno de Juanma) | Recomendada | Inicio de F1 |
| D-03 | Dimensión conocida y método de calibración | (a) dos puntos + longitud; (b) escala impresa 1:N; (c) dos cotas (X e Y) | **(a) obligatoria** para `confidence:"real"`, más una **segunda cota de verificación** recomendada. (b) solo como `estimated` | Precisión, UX del flujo y contrato (`scale`) | Equipo técnico | Recomendada | F1 |
| D-04 | Precisión mínima y cuándo pedir corrección humana | Umbral fijo (1 %, 2 %, 5 %); sin umbral hasta medir; por tipo de plano | **No prometer ninguna cifra hasta medirla en F1.** Umbral provisional: si la cota de verificación difiere **> 2 %**, no se permite `real` y se pide recalibrar. Siempre se muestra «medidas orientativas» | Mensaje comercial y riesgo de reclamación | **Juanma** (promesa comercial), con datos de F1 | Abierta | Fin de F1 |
| D-05 | Moneda y fuente de precios | Ocultar precios; EUR con tarifa propia; EUR con fuente de terceros verificable; mantener ¥ | **Sin precios en F1–F3.** Ocultar la «estimación de pavimentos en ¥» en la UI en español (hoy visible, audit. §1.3). El contrato V1 no guarda precios | Confianza del usuario y posible publicidad engañosa | **Juanma** | Recomendada | F1 (ocultar ¥); precios aplazados |
| D-06 | Hosting de app, imágenes y proyectos | GitHub Pages; Vercel; otro; imágenes y proyectos solo locales; backend propio | **App estática** en Vercel o Pages (ver D-07). **Imágenes y proyectos solo en el navegador** (IndexedDB/localStorage) y en ficheros exportados durante F1–F2 | Privacidad, coste, dependencia de terceros | **Juanma** | Abierta | Inicio de F1 |
| D-07 | Preview por PR ligada al SHA | (a) proyecto **Vercel** conectado al repo (preview por commit; puede requerir Deployment Protection); (b) **GitHub Actions + Pages** (el fork es público; Pages está desactivado); (c) githack (terceros, con página intermedia); (d) servidor local + capturas | **(a)**, con el mismo patrón que otros proyectos Rubik en Vercel, o (b) si se quiere evitar otra cuenta. **(c)** como provisional para revisar, sin depender de ella. Crear el proyecto o activar Pages es una acción externa: **no se ha hecho** | Bloquea la QA 3D reproducible por PR | **Juanma** (autorizar alta de proyecto o Pages) | Abierta, **bloqueante F0** | Antes del primer PR de F1 |
| D-08 | Procesamiento local frente a servidor; privacidad y acceso a planos | Todo local; subida a servidor propio; servicio de terceros (incl. IA en la nube) | **Todo local en F1** (ningún plano sale del navegador). Cualquier subida (F2 asistida, F8 Immersphere) exige antes base legal, aviso de privacidad y un encargado del tratamiento definidos. Los planos y `originalFileName` pueden contener dirección y datos personales | Legal (protección de datos), confianza | **Juanma** (con asesoría legal si hay subida) | Abierta | Antes de cualquier subida (F2) |
| D-09 | Retención, exportación y borrado | Guardado local sin caducidad; caducidad automática; exportación JSON; paquete `.zip` (JSON + imágenes) | Local sin caducidad y **borrado explícito** por proyecto con confirmación. Exportar `FloorPlanProjectV1` como `.zip` (`project.json` + `images/`). Nada se retiene en servidor | Portabilidad, derecho de supresión | Equipo técnico (formato); **Juanma** (política) | Recomendada | F1 |
| D-10 | Límites iniciales de tamaño y resolución | Por bytes, por píxeles, por nº de elementos | **≤ 15 MB** por imagen, **≤ 8000 px** de lado mayor (se reescala al importar con aviso), ≤ 20 imágenes, ≤ 2000 muros y ≤ 5000 objetos por proyecto (ya en el esquema). Revisar con medidas en móvil | Rendimiento y memoria en móvil | Equipo técnico | Recomendada | F1 |
| D-11 | Licencias y uso de assets de terceros (IKEA y otros) | Esperar permiso firmado; solo demo interna sin publicar; usar solo muebles genéricos o propios | **Solo genéricos** hasta que exista un documento de permiso verificable **por asset o marca**. Hoy **0 de 134** tienen licencia verificada (audit. §4.2). No usar nombres, SKU, imágenes ni precios de IKEA en experiencias públicas | Legal (propiedad intelectual y marca) | **Juanma** (con asesoría legal) | Abierta, bloquea F3 | Inicio de F3 |
| D-12 | Licencia del código base (`wy51ai/floorplan-3d` sin LICENSE) | Pedir licencia al autor; reescribir las partes necesarias; limitar a demo interna | **Resolver antes de cualquier uso público o comercial.** Mientras tanto, tratarlo como demo interna. No es una decisión técnica | Legal: sin licencia, el reuso no está autorizado por defecto [I] | **Juanma** | Abierta, **bloqueante para publicar** | Antes de publicar |
| D-13 | Numeración y alcance de fases (PR #2 F1–F9 frente a este plan F1–F3) | Mantener PR #2; adoptar [`F1-F3-plan.md`](F1-F3-plan.md); fusionar | Adoptar F1–F3 de este plan para el trabajo inmediato y actualizar el roadmap del PR #2 **después** de su revisión, sin tocarlo ahora (correspondencias en el plan) | Coherencia documental | **Juanma** | Abierta | Inicio de F1 |
| D-14 | Idiomas soportados | es + en + zh; es + en; solo es | Mantener los tres mientras no suponga coste; priorizar es en QA | Coste de traducción de textos nuevos | Juanma | Aplazada | F3 |
| D-15 | Texto de aviso «visualización orientativa, no documentación técnica» | Texto propio; revisado por asesoría | Texto provisional en F1 y revisión legal antes de publicar | Riesgo de reclamación | Juanma | Aplazada | Antes de publicar |
| D-16 | Varias plantas por proyecto | Un proyecto por planta; `levels[]` en v1.x | Un proyecto por planta en V1 | Contrato | Equipo técnico | Aplazada | F2 |

## Agrupación solicitada

### A. Recomendadas por el equipo técnico (visto bueno ligero de Juanma)
D-02, D-03, D-09 (formato), D-10, D-16.

### B. Requieren aprobación de Juanma (negocio, privacidad, legal)
D-00, D-01, D-04, D-05, D-06, **D-07**, D-08, D-09 (política), **D-11**, **D-12**, D-13.

### C. Se pueden aplazar sin bloquear F1
D-04 (el umbral definitivo sale de F1, que lo mide), D-05 (precios; ocultar ¥ sí va en F1), D-11 (bloquea F3, no F1), D-12 (bloquea la publicación, no el trabajo interno), D-14, D-15, D-16.

### Bloquean el arranque de F1
D-00, D-01, D-06 y **D-07** (sin preview verificable no hay QA 3D por PR). D-08 solo bloquea si F1 incluyera alguna subida, y la recomendación es que no la incluya.
