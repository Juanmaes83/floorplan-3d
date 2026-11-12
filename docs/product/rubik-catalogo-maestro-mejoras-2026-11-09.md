# RUBIK SOTA — Catálogo maestro único de mejoras (para revisar y decidir)

**Fecha:** 09/11/2026 · **Versión:** 1.10 (ficha R03 sincronizada con la PR #194, 11/11/2026; v1.9: ficha R02 sincronizada con la PR #193, 11/11/2026; v1.8: cinco referencias F12 registradas el 11/11/2026: cuatro verificadas y una URL no localizada; F11 y ficha R01 preservadas; ver §7–8) · **Estado:** PROPUESTO para decisión del propietario. **Nada de este documento autoriza** implementación, merge, gasto de API ni cambios en Production.
**Referencia histórica verificada el 09/11/2026 (versión 1.4):** `master@8df49ed` (= `5fb7a5c` + PR #183, #184 y #185); Production `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` sobre `8df49ed`, con Home de seis perfiles y Render IA D1 (ver `docs/product/hom-01/cierre-hom-01-02-publicacion-2026-11-09.md` y `docs/render-ai/d1-acta-de-cierre-2026-11-09.md`). **No es el último despliegue.**

**Corte verificado el 12/11/2026 para el gate documental de #192:** `master@75615fdc6c96e7c43e52b13a24950b9652706f7d`, y [Production Vercel `dpl_9s9H2dUnxXb3UYK7yFovoYTPtFtj` en estado READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/9s9H2dUnxXb3UYK7yFovoYTPtFtj), asociada al mismo SHA. Comprobar una publicación en Vercel no acredita por sí solo seguridad, validez profesional ni aceptación comercial. #192 sigue siendo documentación propuesta sin autorización de merge o Promote.

> **Actualización posterior al corte de auditoría, 12/11/2026:** [R03-I0 #198](https://github.com/Juanmaes83/floorplan-3d/pull/198) fusionó únicamente el motor puro en `master@0680afa1fc1da3f2c7412ec5b38a24a404031ad6`; [#199](https://github.com/Juanmaes83/floorplan-3d/pull/199) fusionó después el acta de cierre y dejó el **`master` vigente en `de028ad082bfe1f40e0c1ae93fcf54825a00e2d6`**. [Production Vercel `dpl_BTA5VnQyLzMtDSjAmM7KXedXDhBn` READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/BTA5VnQyLzMtDSjAmM7KXedXDhBn), asociada a ese SHA. **Solo está integrado el núcleo paramétrico puro**, sin UI, interiores guardados, render 3D de interiores ni disponibilidad comercial. SCULPT-R03 #194 permanece Draft/HOLD. Este catálogo conserva v1.10, sus 97 IDs, olas y estados de capacidad; la referencia `master@75615fd` citada antes es fotografía del gate inicial, no HEAD vigente. #192 continúa Draft y necesita CI y decisión de merge propias.

> **Estado único de auditoría al 12/11/2026:** [Auditoría consolidada de piedras, olas, PR y gates](../qa/rubik-estado-unico-piedras-olas-2026-11-12.md), incorporada a esta rama Draft por autorización expresa del propietario. Contrasta `master`, #191–#197, GOV-08/ENT-01, ECO-01 y MCP Etapa 2; fija la aceptación provisional de 250 verificaciones exclusivamente para laboratorio y registra como deuda la validación real. **Es un acta de coordinación/revisión, no una autorización de merge, integración, despliegue ni nueva ola.**

## 0. Para qué sirve y cómo usarlo

Es **el único sitio** donde están juntas todas las mejoras propuestas para RUBIK. Cada una tiene:
- un **ID maestro**;
- los **IDs que tenía en sus documentos de origen**, para no perder trazabilidad;
- su **estado real** verificado en el código;
- **valor, dificultad y dependencias**;
- su **ola** de implantación;
- una casilla para tu **decisión**.

**Reglas de unificación:**

| Regla | En la práctica |
|---|---|
| **Aditivo** | Ningún documento anterior se borra ni se reescribe. Este catálogo los **enlaza**. Si dos fuentes proponen lo mismo, se fusionan en un ID maestro con todos sus alias. |
| **Lo contrario se revisa** | Cuando dos fuentes se contradicen, la mejora se marca ⚠ y el conflicto se explica en la **sección 4**. No se elige en silencio. |
| **Precedencia** | Decisión posterior del propietario > código verificado en master > documentos de 05–09/11 > documentos y PDF anteriores. |
| **No duplicar** | Lo que ya existe está en la **sección 2** y no vuelve a la cola. |
| **Honestidad de datos** | Ninguna mejora puede mostrar cifras, estados o certificaciones que no salgan de datos reales del proyecto. |

**Tres autoridades que no se mezclan:**

| Fuente | Responde a |
|---|---|
| Este catálogo | Qué queremos estudiar, priorizar o descartar |
| GitHub (master y PR) | Qué está implementado o pendiente de integrar. El estado de cada fila se vuelve a comprobar tras cada merge. |
| QA, permisos y despliegue | Qué se puede ofrecer de verdad a profesionales y clientes |

Aprobar una ola **no** aprueba el catálogo entero. Se resuelven los conflictos que afectan a las dos olas siguientes; el resto conserva su casilla pendiente.

**Leyenda.**
- **Estado:** **E** existe en master · **P** parcial · **R** en rama o PR · **N** no existe.
- **Valor:** ★ a ★★★★★.
- **Dificultad:** B baja · M media · A alta · MA muy alta. Es relativa a lo que ya existe; no son fechas.
- **Ola:** orden propuesto (sección 5).
- **Decisión:** ☐ por decidir · ✔ sí · ✖ no · ⏸ aplazar.

---

## 1. Fuentes consolidadas

| # | Documento | Dónde | Aporta |
|---|---|---|---|
| F1 | Plan maestro IA: imágenes, personalización, escenas habitadas y asistente | rama `docs/rubik-evolution-preparation-2026-11-04`, `docs/product/ia-imagenes-asistente-plan-maestro-2026-11-05.md` | IMG-01 a IMG-22 y AG-0 a AG-5 |
| F2 | CAT-IA: catálogos comerciales y personalización por fabricante | misma rama, `cat-ia-catalogos-comerciales-personalizacion-fabricante-2026-11-05.md` | CAT-IA-1/2/3 y gates CAT-G0 a CAT-G10 |
| F3 | Foto→reforma, panorama 360, vídeo y paquetes premium | misma rama, `ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md` | FOT-01/02, PAN-01/02, VID-01/02, precios orientativos y G1–G10 |
| F4 | Protocolo de costes IA (unitario y lotes) | misma rama, `ia-costes-protocolo-unitario-lotes-2026-11-05.md` | Medición de coste y aceptación |
| F5 | HOME-UX-E2 | misma rama, `home-ux-e2-roadmap-2026-11-06.md` | H0–H4, panel KPI, preflight, HUX-IDEA-01 a 07 y HUX-QA |
| F6 | Preparación de capacidades W1–W9 | misma rama, `evolution-preparation-gates-2026-11-04.md` | Home, Entregas, legal, B2/B8, asistente, DXF, edición conversacional, foto→mueble, generación paramétrica |
| F7 | Roadmap operativo reconciliado y traspaso maestro V2 | misma rama, `rubik-roadmap-operativo-reconciliado-…`, `rubik-traspaso-maestro-v2-…` | Gates G0–G9 de E2, FT3D-7, estado de agentes |
| F8 | Auditoría verificada de oportunidades (09/11) | rama `docs/auditoria-oportunidades-2026-11-09`, `auditoria-oportunidades-ux-servicios-2026-11-09.md` | UX-01 a UX-21, V-, C-, G-, A-, fuentes externas |
| F9 | Fichas de los 4 PDF (Maket, ERECTION.OS, Makio, Floorcraft) | misma rama, `auditoria-4-pdf-referencias-ui-ux-2026-11-09.md` | M1–M12, E1–E9, K1–K9, F1–F12, UX-22 a 26, V-11 |
| F10 | Render IA D1 | PR #180 (fusionada), #181 y #182 | IMG-01, IMG-02 y parte de IMG-04 |
| F11 | SCULPT: métodos y donantes del ecosistema Floorplan 3D (investigación, no ejecución) | [Anexo técnico subordinado](sculpt-metodologia-y-cartera-2026-11-10.md) · fuentes de FUNDING OS y VECINIA | R01–R03 priorizadas; 8 PR de upstream, 12 repos externos, 2 forks propios, 11 familias candidatas y G0–G12; no concede autorización |
| F12 | Cinco referencias nuevas para SCULPT: Pascal, OpenConstructionERP, BIMwright, Model MCP y Architectural Concept Design (URL no localizada) | [Mismo anexo SCULPT, §8.5–8.7](sculpt-metodologia-y-cartera-2026-11-10.md#85-cinco-fuentes-adicionales-de-arquitectura-mcp-auditoría-y-presupuestos-verificación-11112026) | 4 repos adicionales verificados (16 en total junto con los 12 de F11), 1 URL en radar; 7 líneas solapadas con IDs existentes (AG-2/3, PRE-01, G-01, G-04, C1–C4/BC3, ENT); sin nueva ola ni autorización |

---

## 2. Lo que YA existe: no se vuelve a programar

Editor 2D/3D, estancias, muros con estado y **tipo declarado**, huecos y mobiliario. Además:
- **Importación:** PDF, DXF, IFC e imagen, con calibración y «Distancia conocida».
- **Edificio:** multiplanta, exterior y solar, emplazamiento, Catastro y terreno.
- **Herramientas:** medición (M), deshacer y rehacer.
- **Puertas:** se abren y cierran en el 3D y en el paseo.
- **Presentación:** minimapa, paradas por estancia, Story, sección, alzados, axonometría y despiece, plantillas profesionales, Dibujo vivo, «Entrar en la estancia».
- **Comparación:** variantes con métricas.
- **Proyecto:** vistas automáticas, dossier y análisis.
- **Entrega y cliente:** archivo de cliente, vídeo del recorrido, enlace de cliente, «Envíanos tu plano», comentarios anclados, moodboard y marca del estudio.
- **Render IA (B2/B8):** estilos y acabados de listas cerradas; acceso y límites de gasto (#180).
- **Economía:** cantidades, presupuesto C1–C4, BC3, dossier económico, precios de referencia.
- **Obra (FT3D-8):** plan de obra, Gantt, Evolución 4D con velocidades y fantasmas, MP4.
- **Herramientas internas:** MCP local de lectura (`tools/rubik-mcp`).

---

## 3. Catálogo maestro

### A · Gobierno, higiene y seguridad comercial

| ID | Mejora | Alias de origen | Estado | Valor | Dif. | Depende de | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| GOV-01a | Render IA D1: **fusionar** #180, #182 y #181 con CI verde sobre el commit exacto | V-01, G6, W4, IMG-01/02 | **E**: #180, #182 y #181 fusionadas (master `5fb7a5c`) | ★★★★★ | B | — | 0 | ✔ hecho el 09/11 |
| GOV-01b | Render IA D1: **configurar el entorno** de Production (`RUBIK_RENDER_ENABLED=1` y, opcionalmente, las tarifas) | — | **E** (09/11: `RUBIK_RENDER_ENABLED=1` en Production y Preview; `RUBIK_RENDER_MODEL=gpt-image-2.5-sunburst` creado en Production porque no existía) | ★★★★★ | B (lo hace el propietario) | GOV-01a | 0 | ☐ |
| GOV-01c | Render IA D1: **activar en Production (Promote)** y verificar después | — | **E** (09/11: despliegue final `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi`, master `5fb7a5c`, tras `dpl_fzFZ…` y `dpl_E8B2…`) | ★★★★★ | B | GOV-01b, GOV-09a + autorización expresa | 0 | ☐ |
| GOV-09a | **Antes del Promote:** acreditar el modelo configurado (valor de `RUBIK_RENDER_MODEL` en Vercel; si no existe, el código usa `gpt-image-1`) y su compatibilidad con **una sola prueba autorizada en un entorno de prueba** (Preview con `RUBIK_RENDER_ENABLED=1`), con coste visible gracias a #182 | K4 | ⚠ **No realizada antes del Promote** (desviación cronológica). La compatibilidad se acreditó después, en Production (GOV-09b). | ★★★★★ | B | GOV-01a, autorización de gasto de prueba | 0 | — (superada por GOV-09b) |
| GOV-09b | **Después del Promote:** confirmar en el registro de Production (`rubik-render`) que el modelo y el estado coinciden con lo acreditado en GOV-09a | K4 | **E**: log `rubik-render` del 09/11 13:55 UTC: `gpt-image-2.5-sunburst`, ok, 1.996 tokens | ★★★ | B | GOV-01c | 0 | ✔ hecho el 09/11 |
| GOV-02 | Cerrar o archivar PR obsoletas cuyo contenido ya está en master (#133–#151, #90) | F7 «50 PR», F8 C10 | N | ★★★ | B | — | 0 | ☐ |
| GOV-03 | Registro único de capacidades «Disponible / En validación / En preparación», con SHA y prueba | UX-02, HUX-QA-01, F1 §7 | **P** (mínimo: `js/capability-registry.js` y su prueba, en master `8df49ed` y en Production; solo la Home lo usa) | ★★★★ | B-M | — | 0 | ☐ |
| GOV-04 | Decidir qué documentos de la rama de preparación pasan a master como documentación | F8 D7 | R | ★★ | B | — | 0 | ☐ |
| GOV-05 | Revisión legal y privacidad: condiciones, retención, licencias, consentimientos de imágenes y personas | W3, G8, PR #161 | R (borrador) | ★★★★★ | M (externa) | Profesional jurídico | 1 | ☐ |
| GOV-06a | **Autenticación y cuotas mínimas por profesional** para los servicios IA de pago (sustituir el código compartido; cuota y gasto por cuenta) | F1 §1, IMG-04 | N | ★★★★★ | A | GOV-05 | 2 | ☐ |
| GOV-06b | Plataforma multiusuario avanzada: equipos, roles, organizaciones, portal | C-03, ENT-07 | N | ★★★ | MA | GOV-06a | 5 | ☐ |
| GOV-07 | Pruebas en hardware real (iOS, Android, GPU de escritorio), DPR adaptativo y contexto WebGL | G4 | N | ★★★★ | M | — | 1 | ☐ |
| GOV-08 | **Publicación de enlaces de cliente segura en conjunto** (`api/share.js`, que guarda en Vercel Blob). **Hecho comprobado el 09/11:** al rotar el código de Production para el render, **publicar enlaces de cliente también pasó a depender del código nuevo**; hoy no son independientes. Lo principal: (1) dejar de depender del **código compartido** del render (permiso de publicación propio, por profesional cuando exista GOV-06a); (2) **revocación individual sencilla** de cada enlace desde RUBIK, hoy solo posible borrando a mano en el panel de Vercel Blob; (3) caducidad opcional; (4) tamaño y cuota de almacenamiento; (5) registro de qué se publicó y cuándo. Además, comparación del código en tiempo constante (hoy usa `!==`), un detalle menor frente a lo anterior. **No** reutilizar el interruptor del Render IA. | F10, ENT-02 | P | ★★★★★ | M | GOV-06a para (1) por profesional | 1 | ☐ |

### B · Home y descubrimiento

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| HOM-01 | Home por profesión: hero, prueba visual real, 3–4 ventajas con acceso real, CTA | HOME-UX-E2 H1, W1, G7, UX-01, M1 | **E** (PR #184, merge `e2dfe42`; en Production `dpl_5abs…`) | ★★★★★ | M | GOV-03 | 1 | ✔ revisión visual aprobada y publicada el 09/11 |
| HOM-02 | 6.º perfil **Constructora / jefe de obra** (bloqueo «hasta S4» ya superado) | HUX-DEC-04 | **E** (PR #185, merge `8df49ed`; en Production `dpl_5abs…`) | ★★★★ | B | HOM-01 | 1 | ✔ revisión visual aprobada y publicada el 09/11 |
| HOM-03 | Sección «Nuevos servicios IA» en la Home, **solo** con lo que esté **activo en Production** | F7 §3.4 E | N | ★★★ | B | GOV-01c, GOV-09b, GOV-03 | 2 | ☐ |

### C · Entregas y experiencia del cliente final

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| ENT-01 | Visita 3D del cliente desde «Entregar» (PR #166): ponerla al día con master y revisarla | C-01, W2, G1 | R | ★★★★★ | A | — | 1 | ☐ |
| ENT-02 | Seguridad del enlace de cliente: caducidad, revocación, aislamiento y borrado | G2 | P | ★★★★★ | A | ENT-01, GOV-05 | 1 | ☐ |
| ENT-03 | Story y plantillas profesionales también hacia el cliente | FT3D-7, G3 | N | ★★★★ | A | ENT-01 | 2 | ☐ |
| ENT-04 | Dossier comercial antes/después, con presupuesto rotulado (parcial o completo) | C-02 | P | ★★★★★ | M | UX-07 | 2 | ☐ |
| ENT-05 | Fichas de imagen: original, final, materiales, versión y leyenda IA | IMG-17, CAT-G4 | N | ★★★★ | M | IMG-12, ENT-01 | 3 | ☐ |
| ENT-06 | Lotes de entrega: 5 vistas × alternativas, dossier y ZIP, con coste y cancelación | IMG-18 | N | ★★★★ | M | IMG-04, IMG-12 | 3 | ☐ |
| ENT-07 | Portal multiusuario, equipos y white-label | C-03 | N | ★★★ | MA | GOV-06b | 5 | ☐ |

### D · Estudio de imágenes IA (Render IA ampliado)

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| IMG-01 | Textos completos en la exportación | IMG-01 | **E** (#181 en master; CI en verde). Revisión humana con acabados pendiente: la prueba real no los usó. | ★★★★ | B | — | 0 | ✔ hecho (revisión residual) |
| IMG-02 | Consumo, coste estimado y registro por imagen | IMG-02 | **E** (#182 en master; consumo real 1.996 tokens registrado; coste estimado sin tarifas → null) | ★★★★★ | B | — | 0 | ✔ hecho |
| IMG-03 | Calidad explícita: Borrador / Presentación / Máxima, con coste previsto | IMG-03 | N | ★★★★ | M | IMG-02 | 2 | ☐ |
| IMG-04 | Confirmación de gasto antes de generar, y lotes con cancelación. Hoy hay límites de servidor por hora y día **en memoria de cada instancia**: un freno, no un tope global. | IMG-04, #180 | P | ★★★★★ | M | IMG-02; las cuotas por profesional, de GOV-06a | 2 | ☐ |
| IMG-05 | Catálogo amplio de suelos (maderas, espiga, porcelánicos, piedra, terrazo, microcemento) | IMG-05 | P (6 suelos) | ★★★★ | B-M | V-10 | 2 | ☐ |
| IMG-06 | Paredes y techos: color, estuco, panelado, pared de acento | IMG-06 | P (5 paredes) | ★★★★ | B-M | — | 2 | ☐ |
| IMG-07 | Iluminación de la escena: mañana, tarde, noche y temperatura | IMG-07, K4 | N | ★★★★ | M | — | 2 | ☐ |
| IMG-08 | Estilos: mediterráneo, japandi, orgánico, industrial suave… | IMG-08, F8 | P (4 estilos) | ★★★★ | B | — | 2 | ☐ |
| IMG-09 | Decoración visual: textiles, lámparas, cuadros y plantas | IMG-09 | N | ★★★★ | M | IMG-10 | 3 | ☐ |
| IMG-10 | Intensidad de cambio: Fiel / Equilibrado / Creativo, con aviso de riesgo | IMG-10 | N | ★★★★ | M | — | 2 | ☐ |
| IMG-11 | Presets por estancia: salón, cocina, baño, dormitorio… | IMG-11 | N | ★★★ | B-M | — | 2 | ☐ |
| IMG-12 | Variantes 2–5, comparador, favoritos y volver a la anterior ⚠ | IMG-12, M9 | P (alternativas en sesión) | ★★★★★ | M | IMG-04 | 2 | ☐ |
| IMG-13 | Biblioteca visual del estudio: muestras con metadatos y licencia | IMG-13, HUX-IDEA-01, V-10 | N | ★★★★ | M | GOV-05 | 3 | ☐ |
| IMG-14 | Edición por zona o máscara (solo una pared o solo el suelo) | IMG-14 | N | ★★★★ | A | IMG-10 | 4 | ☐ |
| IMG-15 | Referencia estética propia (foto de interior o moodboard) | IMG-15 | N | ★★★★ | M | GOV-05 | 3 | ☐ |
| IMG-16 | Coherencia entre vistas: receta de estilo fijada por proyecto | IMG-16 | N | ★★★★ | A | IMG-08, IMG-12 | 3 | ☐ |
| IMG-22 | Panel de consumo IA: aceptación, coste por imagen y por lote | IMG-22 | N (datos en logs tras #182) | ★★★ | M | IMG-02 | 3 | ☐ |
| CAM-01 | Cámara colocable en el 2D con cono de visión, para encuadrar el render | UX-16, M6 | N | ★★★★ | M | — | 2 | ☐ |

### E · Personas y escenas habitadas

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| PER-01 | **Personas genéricas** (0, 1, 2 o grupo, con actividad), con aviso «personas generadas». Complemento visual: **va detrás** de la fiabilidad, la trazabilidad y el coste de las imágenes (IMG-12, ECO-01). | IMG-19, V-07, F3 «escena habitada» | N | ★★★ | M | IMG-12, ECO-01, GOV-05 | 3 (final) | ☐ |
| PER-02 | **Fotos reales del cliente** (o de su familia) disfrutando del espacio ⚠. **Requisitos reforzados:** base legal y permisos acreditados de cada persona, **exclusión o régimen específico para menores**, evaluación de impacto en protección de datos, almacenamiento aislado, conservación limitada, revocación y **borrado verificable**. Una casilla de consentimiento no basta. | IMG-20, G9 | N | ★★★★★ | MA | GOV-05, GOV-06a, PER-01 | 4 | ☐ |
| PER-03 | Narrativa «Así se vive»: escenas del día, mascota, trabajo, descanso | IMG-21 | N | ★★★ | M | PER-01, ENT-05 | 4 | ☐ |

### F · Fotografías del cliente

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| FOT-01 | **Reforma sobre la foto del cliente**: antes/después, 1–3 propuestas e imagen ilustrativa no medible | FOT-01, V-03 | N | ★★★★★ | A | IMG-02, IMG-04, GOV-05 | 3 | ☐ |
| FOT-02 | Foto → espacio editable con medidas (ingeniería inversa) | FOT-02, G-04 | N | ★★★ | MA | Validación métrica | 5 | ☐ |
| MUE-01 | «Trae tu mueble» simple: foto + medidas → volumen genérico con imagen | V-11, M5 | N | ★★★★ | M | — | 3 | ☐ |
| MUE-02 | Foto → mueble 3D reconstruido | W8, V-06, M5 completo | N | ★★★ | MA | MUE-01, presupuesto IA | 5 | ☐ |

### G · Catálogos comerciales y bibliotecas

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| CAT-01 | **El profesional sube su catálogo** (cocinas, baños, muebles, pavimentos) como referencias visuales para el render | CAT-IA-1, V-04 | N | ★★★★★ | A | FOT-01 o IMG-15, GOV-05 | 3 | ☐ |
| CAT-02 | Catálogos con fichas, SKU y dimensiones verificadas | CAT-IA-2, V-05 | N | ★★★★ | A | CAT-01 | 4 | ☐ |
| CAT-03 | Productos 3D validados colocables y presupuestados en C1–C4 | CAT-IA-3 | N | ★★★★ | MA | CAT-02 | 5 | ☐ |
| BIB-01 | Biblioteca propia de materiales y muebles: MaterialCraft, Poly Haven CC0, ABO CC BY | V-10 | N | ★★★★ | M | Registro de licencias | 2 | ☐ |

### H · 360° y vídeo

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| VID-01 | Animación determinista desde imágenes aprobadas (pan, zoom, antes/después) | VID-01, V-09 | P (vídeo de recorrido, MP4 4D) | ★★★ | M | IMG-12 | 3 | ☐ |
| PAN-01 | Panorama 360 conceptual (aspiracional, rotulado) ⚠ | PAN-01, V-08 | N | ★★★ | A | IMG-03 | 4 | ☐ |
| PAN-02 | 360 coherente a partir del modelo 3D real | PAN-02 | N | ★★★ | MA | PAN-01 | 5 | ☐ |
| VID-02 | Vídeo generativo corto | VID-02 | N | ★★ | A | Presupuesto por segundo | 5 | ☐ |

### I · Editor y experiencia 3D

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| UX-07 | **Comparador antes/después con cortina** (revisiones, variantes, 2D↔3D) | UX-07, M4 | P | ★★★★★ | M | — | 2 | ☐ |
| UX-22 | Minimapa también durante el paseo | M7 | P | ★★★★ | B | — | 2 | ☐ |
| UX-23 | Barra de accesos por estancia en el 3D normal | K1 | P | ★★★★ | B-M | — | 2 | ☐ |
| UX-25 | «Abrir/cerrar todas las puertas» | K3 | P | ★★ | B | — | 2 | ☐ |
| UX-09 | Maqueta blanca ↔ acabados, y ocultar muebles | K2, UX-09 | P | ★★★★ | B | — | 2 | ☐ |
| UX-05 | Selector agrupado de modos, plantas, cortes y casa de muñecas | UX-05, HUX-IDEA-04, M8, F10, K8 | P | ★★★★ | B-M | — | 2 | ☐ |
| UX-03 | Panel contextual con KPI de la selección (estancia, muro, mueble) | UX-03, HOME H2 (§7), F5, K7 | P | ★★★★ | M | — | 2 | ☐ |
| UX-08 | Cotas en vivo al mover muebles | UX-08, M10 | N | ★★★★ | M | — | 2 | ☐ |
| UX-04 | Ayudas por herramienta, atajos y toasts con cifras (solo delta) | UX-04, F2–F4 | P | ★★★ | B | — | 2 | ☐ |
| PRE-01 | Preflight de integridad antes de aplicar cambios: impacto y vuelta atrás | HOME H3 (§8) | N | ★★★★ | A | — | 3 | ☐ |
| UX-11 | Cambiar el acabado de una pared desde el 3D (doble clic) | UX-11, K6 | P | ★★★★ | M | UX-03 | 3 | ☐ |
| UX-12 | **Amueblar por estancia** con densidad y semilla reproducible | UX-12, HUX-IDEA-03, F7, M11 | N | ★★★★★ | M-A | BIB-01 | 3 | ☐ |
| UX-13 | Recetas de estilo por estancia y para el proyecto completo | UX-13, HUX-IDEA-02, HUX-IDEA-07, F8 | P | ★★★★ | A | UX-12 | 3 | ☐ |
| UX-24 | Sugerir el tipo de estancia, que el profesional acepta | HUX-IDEA-06, F6 | N | ★★★ | M | — | 3 | ☐ |
| UX-10 | Píldora de inspección bajo el cursor | K5, UX-10 | P | ★★ | M | UX-03 | 4 | ☐ |
| UX-26 | Intercambiar solo el uso de dos estancias | M3 (mínimo) | N | ★★ | B | — | 4 | ☐ |
| UX-21 | Panel de sol (hora y mes), temperatura de luz y persianas | K4, UX-21 | P (solar) | ★★★ | M-A | — | 4 | ☐ |
| LUZ-01 | Plan de iluminación visual, solo ambiente y sin lux ⚠ | HUX-IDEA-05, F9 | N | ★★ | A | — | 5 | ☐ |
| UX-14 | Move Rooms topológico real | UX-14, M3 | N | ★★★ | MA | Solver | 5 | ☐ |

### J · Obra y 4D (pulir FT3D-8, no rehacerlo)

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| OBR-01 | Cerrar pendientes de FT3D-8: EX-05.3, EX-11-k.6, QA-22, EX-09.10 | FT3D-8 | P | ★★★★ | M | — | 1 | ☐ |
| OBR-02 | Vista previa en fantasma de la siguiente tarea real | E2, UX-19 | P | ★★★ | B-M | — | 2 | ☐ |
| OBR-03 | Anillo «% del plan» y coste planificado a la fecha, rotulado como planificado | E3, UX-20 | P | ★★★★ | M | C1–C4 vinculado | 2 | ☐ |
| OBR-04 | Capa «Muros de carga (declarados)» y «Pasos libres» | E4 | P | ★★★ | M | — | 3 | ☐ |
| OBR-05 | Exportar el plan de obra en un formato que lea GanttProject o MS Project | §4.2 F8 | N | ★★ | B-M | — | 4 | ☐ |

### K · Interoperabilidad y fidelidad del plano

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| G-06 | Medir sobre el plano importado (distancia, área y conteo) | G-06 (Open PDF Studio) | P (medición en el editor) | ★★★★ | M | — | 2 | ☐ |
| G-01 | Auditoría del plano importado frente al original (muros, huecos, cadenas de cota) | G-01, wallaudit | N | ★★★★★ | M-A | — | 4 | ☐ |
| G-08 | Alinear el plano de reforma sobre el original (dos planos) | align2 (house-plan-designer) | N | ★★★★ | M | G-01 | 4 | ☐ |
| G-02 | Exportación DXF 2D con capas, cotas reales y leyenda existente/demoler | G-02, W6 | N | ★★★★★ | M-A | — | 4 | ☐ |
| G-07 | Exportación IMDF (mapas de interiores) | G-07 | N | ★★ | M | G-02 | 5 | ☐ |
| G-04 | Foto/LiDAR/IFC → espacio métrico | G-04 | N | ★★★ | MA | — | 5 | ☐ |

### L · Asistente IA RUBIK

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| AG-0 | Contrato de mensajes, permisos, telemetría y costes (sin API) | AG-0 | N | ★★★ | M | — | 3 | ☐ |
| AG-1 | Asistente de **consulta**: estancias, medidas, revisión, presupuesto (sin escribir) | AG-1, A-01, W5 | R (rama: herramientas de dominio) + MCP local E | ★★★★★ | A | AG-0, GOV-06a | 4 | ☐ |
| AG-2 | Propuestas revisables con diff (material, mueble) | AG-2, W7, A-02 | N | ★★★★ | A | AG-1 | 4 | ☐ |
| AG-3 | Aplicar con confirmación y deshacer | AG-3 | N | ★★★★ | A | AG-2 | 5 | ☐ |
| AG-4 | Orquestar renders: elegir vistas, lote y coste | AG-4 | N | ★★★★ | A | AG-1, IMG-04 | 5 | ☐ |
| AG-5 | Capacidades avanzadas: foto→mueble, optimizar distribución | AG-5 | N | ★★ | MA | MUE-02, GEN-01 | 5 | ☐ |
| AST-01 | Onboarding con tarjetas (nº de plantas, abrir importación); **guía, no genera** | M2 (versión honesta) | N | ★★★ | M | HOM-01 | 3 | ☐ |

### M · Generación automática

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| GEN-01 | Generador paramétrico de distribuciones con restricciones y ranking | W9, G-03, M2 | N | ★★★ | MA | Criterios y pruebas | 5 | ☐ |

### N · Economía y comercialización

| ID | Mejora | Alias | Estado | Valor | Dif. | Depende | Ola | Decisión |
|---|---|---|---|---|---|---|---|---|
| ECO-01 | Protocolo de medición: coste por intento, por imagen aceptada y por lote | F4, IMG-22 | P (#182 da datos) | ★★★★★ | B-M | IMG-02 | 2 | ☐ |
| ECO-02 | Paquetes y precios de prueba (tabla orientativa de F3, de 19 a 249 €) ⚠ | F3 §6, CAT §6 | N | ★★★★ | — (decisión) | ECO-01 | 3 | ☐ |
| ECO-03 | Piloto con 5 profesionales: tiempos, bloqueos, aceptación y coste | F8 §8 | N | ★★★★★ | M | Ola 2 | 3 | ☐ |

### O · Descartado (se conserva como registro)

| ID | Propuesta | Por qué no |
|---|---|---|
| X-01 | Semáforo «NOMINAL», «VERIFIED», «60 FPS», telemetría decorativa (ERECTION.OS) | Muestra estados sin datos |
| X-02 | Grúas y atrezo animado que «construye» | Marketing sin datos; ya hay atrezo ilustrativo rotulado |
| X-03 | Instalaciones automáticas (MEP) con normas chinas (house-plan-designer, ERECTION.OS) | No existen en el modelo; en España rigen REBT y CTE |
| X-04 | Migrar la CI a Obscura | No consta soporte WebGL |
| X-05 | OSIRIS, GenCAD como motor de planos, CivilCraft, GeoModel3D, addons de Blender | Fuera de dominio |
| X-06 | Plazos de los PDF («2 días», «4–6 horas») | No sirven como presupuesto |

---

## 4. Conflictos detectados entre fuentes (⚠) y propuesta de resolución

| # | Conflicto | Fuentes | Propuesta (aditiva) | Decides tú |
|---|---|---|---|---|
| K1 | **Prompt libre** («describe los cambios») frente a **listas cerradas** de estilos y acabados | Maket M9 / F1, B2/B8, #180 | Mantener listas cerradas como modo por defecto. Un campo libre **solo** en el modo avanzado, con autenticación (GOV-06a), moderación y límite de gasto. No se elimina ninguna de las dos ideas: se ordenan. | ☐ |
| K2 | **Personas reales del cliente** (PER-02) frente a privacidad y protección de datos | F1 IMG-20, F3 G9 | Primero PER-01 (genéricas). PER-02 solo después del visto bueno legal (GOV-05): consentimiento escrito y revocable, borrado efectivo, almacenamiento aislado y aviso de imagen generada. | ☐ |
| K3 | **360**: «diferido» (31/10) frente a «reabierto como estudio» (05/11) | F7, F3 | Se mantiene como **estudio**: PAN-01 conceptual rotulado en la ola 4, y PAN-02 diferido. No se implementa sin tu OK. | ☐ |
| K4 | **Modelo de imagen**: master usa `gpt-image-1` por defecto, salvo que `RUBIK_RENDER_MODEL` diga otro. La rama de compatibilidad lo cambia. El propietario informa de que el render funcionó hace días. | F1 §1, rama `7e738ec`, código de master | **No deducir el modelo ni del código ni de una prueba histórica.** Antes de decidir, acreditar el valor configurado en Vercel y que funciona hoy (GOV-09a, antes del Promote). Después, mantener o cambiar comparando coste y calidad con IMG-02. La PR-2 queda en espera de ese dato. | ☐ |
| K5 | **Perfil Constructora**: «solo con S4 integrado» frente a S4 ya en master | F5 HUX-DEC-04 | Desbloqueado (HOM-02), sin prometer obra real. | ☐ |
| K6 | **Precios de paquetes** (F3) frente a «no fijar tarifa sin datos» (F1 §5) | F3, F1 | Los precios de F3 son **hipótesis de experimento**. Se validan con ECO-01 y ECO-03 antes de publicarse. | ☐ |
| K7 | **Move Rooms**: «intercambiar metadatos y reamueblar» frente a la integridad geométrica | Maket M3, F8 | UX-26 (solo el uso, con aviso) como paso mínimo; UX-14 real diferido. | ☐ |
| K8 | **Minimapa en el paseo** (UX-22) frente al minimapa de la entrega cliente de #166 | F9, PR #166 | Un único componente: hacer UX-22 **reutilizando** el de #166 si se integra antes, o el de la Presentación. | ☐ |
| K9 | **Plan de iluminación con lux** frente a «no prometer cálculo lumínico» | Floorcraft F9, F1 IMG-07 | Solo ambiente visual (IMG-07 en imágenes, LUZ-01 sin cifras). Lux, únicamente con un método validado. | ☐ |
| K10 | **Coste en la app** (#182, tarifa configurable) frente a «coste facturado» (F1 IMG-02) | F10, F1 | La app muestra el **estimado**. El facturado se concilia con la factura del proveedor en ECO-01. Las dos cifras se rotulan distinto. | ☐ |
| K11 | **Catálogos de fabricantes** frente a licencias e imágenes de marca | F2 CAT-IA, F8 | CAT-01 solo con permiso escrito del fabricante o material propio del profesional. Se registra la licencia de cada recurso. | ☐ |

---

## 5. Orden propuesto (olas)

El orden sigue tres criterios: **(1)** cerrar lo que ya está casi hecho, **(2)** que el profesional descubra y venda lo que ya existe, y **(3)** añadir servicios nuevos sobre bases medidas y legales.

| Ola | Objetivo | Mejoras | Condición para pasar a la siguiente |
|---|---|---|---|
| **0 · Cerrar y ordenar** | Nada nuevo; terminar lo empezado | GOV-01a, GOV-01b, GOV-09a, GOV-01c, GOV-09b, IMG-01, IMG-02, GOV-02, GOV-03, GOV-04 | Render IA D1 en Production con límites, modelo acreditado y registro de capacidades creado |
| **1 · Vender lo que ya existe** | Que cada profesional entienda RUBIK y pueda entregar al cliente con seguridad | HOM-01, HOM-02, ENT-01, ENT-02, OBR-01, GOV-05, GOV-07, GOV-08 | Home revisada por ti, #166 integrada y segura, legal iniciado |
| **2 · Mejoras rápidas y medición** | Mejor experiencia con bajo riesgo, y saber cuánto cuesta cada imagen | Ver cortes 2a–2f más abajo, más GOV-06a, que se prepara en esta ola | Coste por imagen aceptada conocido; revisión visual |
| **3 · Nuevos servicios que se pueden cobrar** | Diferenciación comercial | **FOT-01, CAT-01**, UX-12, UX-13, UX-11, UX-24, PRE-01, IMG-09, IMG-13, IMG-15, IMG-16, IMG-22, ENT-05, ENT-06, MUE-01, VID-01, OBR-04, AST-01, AG-0, ECO-02, ECO-03 y, al final, PER-01 | Piloto con profesionales; precios validados; legal aprobado |
| **4 · Interoperabilidad, asistente y personalización avanzada** | Confianza técnica y productividad | G-01, G-08, G-02, AG-1, AG-2, **PER-02**, PER-03, CAT-02, IMG-14, PAN-01, UX-10, UX-21, UX-26, OBR-05 | Lectura fiable del asistente; consentimiento operativo |
| **5 · Investigación y gran escala** | Solo con decisión expresa y presupuesto | AG-3, AG-4, AG-5, CAT-03, FOT-02, MUE-02, PAN-02, VID-02, GEN-01, UX-14, LUZ-01, G-04, G-07, ENT-07, GOV-06b | — |

**Las olas son grupos de decisión, no lotes de trabajo.** Cada ola se ejecuta en **cortes pequeños**, cada uno con su propia PR, responsable, pruebas, Preview y aceptación independiente. Un corte no espera a otro si no depende de él. Propuesta para la ola 2, la más cargada:

| Corte | Contenido | Por qué juntos | Aceptación |
|---|---|---|---|
| 2a · Navegación 3D | UX-22, UX-23, UX-25, UX-05, UX-09 | Todos tocan los controles del visor 3D | Revisión visual escritorio y móvil, regresión de Presentación |
| 2b · Comparar | UX-07, ENT-04 | La misma cortina y las mismas capturas | Comparación de 2 revisiones; presupuesto rotulado parcial o completo |
| 2c · Editor | UX-03, UX-08, UX-04, G-06 | Panel, cotas y medición sobre el plano | Cifras de la geometría canónica y deshacer intacto |
| 2d · Imágenes | IMG-03, IMG-05 a IMG-08, IMG-10, IMG-11, IMG-12, CAM-01 | Sobre `api/render.js` + #180/#182 | Coste previsto visible, pruebas simuladas y presupuesto de prueba autorizado |
| 2e · Obra | OBR-02, OBR-03 | Evolución 4D de FT3D-8 | Datos solo del plan y C1–C4 vinculados |
| 2f · Base comercial | BIB-01, ECO-01, HOM-03, ENT-03 | Licencias, medición de coste y contenido de la Home | Registro de licencias; coste por imagen aceptada calculado |

**Lo que respondo a tu pregunta, en una línea:** las tres ideas que recordabas están todas.
- **Personas del cliente disfrutando del espacio:** PER-01, después PER-02.
- **Estilos y muebles con IA:** IMG-08, IMG-09, UX-12 y UX-13.
- **Que el profesional suba sus catálogos:** CAT-01, después CAT-02 y CAT-03.

Las tres van en las olas 3–4, porque dependen de medir el coste (ECO-01) y del visto bueno legal (GOV-05).

---

## 6. Hoja de decisión rápida (para el propietario)

Marca en la sección 3 cada fila con ✔, ✖ o ⏸. Las decisiones que desbloquean más trabajo son:

1. **K1 a K11** (sección 4): una respuesta por conflicto.
2. **Ola 0:** GOV-02 (cerrar PR obsoletas) y GOV-03 (registro de capacidades).
3. **Ola 1:** encargar HOM-01 + HOM-02 y la puesta al día de ENT-01 (#166).
4. **Presupuesto de pruebas IA** mensual, para las olas 2–3.
5. **Abogado o asesor** para GOV-05, que es imprescindible antes de PER-02, FOT-01 y CAT-01.

---

## 7. Registro de cambios

| Versión | Cambio | Origen |
|---|---|---|
| 1.0 | Primera consolidación | Propietario, 09/11 |
| 1.1 | (1) GOV-01 separado en **merge, configuración del entorno y Promote** (GOV-01a/b/c), porque la CI en verde no autoriza las tres. (2) GOV-06 dividido en **06a**, autenticación y cuotas mínimas para servicios de pago (ola 2), y **06b**, multiusuario avanzado (ola 5); dependencias corregidas en IMG-04, AG-1, PER-02 y ENT-07. (3) GOV-08 redefinido como **controles propios de publicación** en `api/share.js`, que guarda en Vercel Blob; se añade la comparación del código en tiempo constante. (4) K4 y nuevo **GOV-09**: acreditar el modelo realmente configurado en lugar de deducirlo. (5) Olas convertidas en **grupos de decisión** y ola 2 dividida en **cortes 2a–2f**. Además: PER-01 pasa detrás de la fiabilidad y el coste de las imágenes; PER-02, requisitos reforzados (menores, evaluación de impacto, borrado verificable); se explicitan los límites en memoria por instancia y la distinción entre coste estimado y facturado. | Revisión externa aportada por el propietario, 09/11 |
| 1.2 | (1) HOM-03 ya no depende del antiguo GOV-01, sino de GOV-01c, GOV-09b y GOV-03, y solo anuncia lo **activo en Production**. (2) GOV-09 dividido: **GOV-09a**, acreditar el modelo y su compatibilidad con una prueba autorizada **antes** del Promote (GOV-01c pasa a depender de ella), y **GOV-09b**, confirmarlo en el registro **después**. (3) GOV-08 reordenado: lo principal es el código compartido, el permiso de publicación propio y la **revocación individual** de enlaces; la comparación en tiempo constante es un detalle menor. | Segunda revisión externa aportada por el propietario, 09/11 |
| 1.3 | Estados factuales tras el cierre de Render IA D1: Production en `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi` (`5fb7a5c`); IMG-01 e IMG-02 pasan a **E**; GOV-09b hecho con el log real; GOV-09a registrada como **desviación cronológica** (no se hizo antes del Promote). Las casillas de decisión del propietario **no se modifican**. Acta: `docs/render-ai/d1-acta-de-cierre-2026-11-09.md`. | Orden maestra del propietario, 09/11 |
| 1.4 | Estados factuales tras publicar la Home: HOM-01 (#184) y HOM-02 (#185) pasan a **E** y están en Production `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` (`master@8df49ed`), con la revisión visual aprobada por el propietario. GOV-03 pasa a **P** (registro mínimo). HOM-03, GOV-08, ENT-01 y ENT-02 **no cambian**: siguen pendientes de decisión. | Integración autorizada por el propietario, 09/11 |
| 1.10 | Sincroniza la ficha R03 con la evidencia de la [PR #194](https://github.com/Juanmaes83/floorplan-3d/pull/194) (`fc5a422`): R03 es un laboratorio técnicamente completado, pendiente de aceptación humana y sin integración; GOV-05 documentado solo para R03. Sin cambiar olas, IDs, prioridades, estados de otras mejoras, R01/R02, F11/F12, G0–G12 ni el inventario | Claude Code, por orden del propietario, 11/11 |
| 1.9 | Sincroniza la ficha R02 con la evidencia de la [PR #193](https://github.com/Juanmaes83/floorplan-3d/pull/193) (`7d8a626`): R02-A es un laboratorio funcional, no integrado, pendiente de aceptación humana. Sin cambiar olas, IDs, estados de otras mejoras, R01/R03, F11/F12 ni el inventario | Claude Code, por orden del propietario, 11/11 |
| 1.8 | Se añade **F12** con cinco referencias adicionales de arquitectura/MCP/ERP: cuatro repositorios verificados, una fuente 404 y siete familias de investigación relacionadas con mejoras existentes; detalle y SHAs en el mismo anexo SCULPT §8.5–8.7. Sin reordenar olas, crear IDs, alterar decisiones ni tocar producto. | Auditoría de GitHub y solicitud expresa del propietario, 11/11/2026 |
| 1.7 | Sincroniza la ficha R01 con la evidencia de la [PR #191](https://github.com/Juanmaes83/floorplan-3d/pull/191) (`2158fd1`): laboratorio funcional NO VALIDADO, integración bloqueada. Sin cambiar olas, IDs, estados de otras mejoras, R02/R03 ni el inventario | Claude Code, por orden del propietario, 10/11 |
| 1.6 | Amplía el inventario: 3 piedras priorizadas, 8 PR upstream, 12 repos externos confirmados, 2 forks propios y 11 familias adicionales; documenta solapamientos por hash y referencias sin verificar. Sin cambiar olas, estados ni decisiones de producto. | Investigación verificada en GitHub y revisión del propietario, 10/11/2026 |
| 1.5 | Se incorpora SCULPT como **método transversal** y registro de tres piedras y trece áreas G0–G12, todas reconciliadas con IDs y olas existentes o marcadas pendientes; sin modificar decisiones, estados, gates ni prioridades. Anexo técnico subordinado y enlace en roadmap histórico. | Autorización expresa del propietario para documentación, 10/11/2026 |

## 8. SCULPT — registro subordinado de piedras y oportunidades (propuesta documental de 10/11/2026)

**Ampliación v1.8 (F12, 11/11/2026):** [anexo SCULPT §8.5–8.7](sculpt-metodologia-y-cartera-2026-11-10.md) documenta cuatro repositorios externos adicionales verificados y una URL de vídeo no localizada, con 7 familias transversales solapadas con los IDs ya existentes. Los doce repositorios de F11 siguen como conjunto inicial; 12 + 4 = 16 fuentes externas verificadas, **no** 16 piedras. Nada aprobado para integrar.

**Ampliación v1.6:** R01–R03 son las primeras piedras priorizadas, no el inventario total. El [anexo §8](sculpt-metodologia-y-cartera-2026-11-10.md#8-inventario-ampliado-de-donantes-y-oportunidades-revisión-10112026) registra ocho PR upstream, doce repos externos verificables, dos forks propios y once familias candidatas a deduplicar antes de formalizar piedras. **Ninguna nueva ola ni autorización.**

**Una sola autoridad de decisiones:** las olas 0–5, los cortes 2a–2f, los IDs de mejora y las casillas del propietario de las secciones 3–6 **no se modifican** por incorporar SCULPT. La metodología es transversal, **no una nueva ola**. Su detalle técnico, riesgos, fuentes y mapeo G0–G12 constan en [SCULPT — metodología y cartera de piedras](sculpt-metodologia-y-cartera-2026-11-10.md).

| Alias de piedra | Fuente exacta de investigación | Relación con mejora maestra y ola ya existente | Estado de evidencia / autorización |
|---|---|---|---|
| **R01 · Reconocimiento y OCR** | [Donante PR #18](https://github.com/wy51ai/floorplan-3d/pull/18), SHA `1d235fc0a3c45783e1e1fa129944f8f34d97d297` | Protocolo **F2** (experimental) y **G-01 / ola 4**; posible corte distinto de **G-06 / ola 2** | **Laboratorio funcional, NO VALIDADO sobre planos reales** ([PR #191](https://github.com/Juanmaes83/floorplan-3d/pull/191), `2158fd1`); integración **BLOQUEADA** (F2 y GOV-05 pendientes); **no aprobada para integrar**. |
| **R02 · Techos y puntos técnicos** | [Donante PR #17](https://github.com/wy51ai/floorplan-3d/pull/17), SHA `324eb64cf9b26f6d4df8323c2dec4591fa4691e3` | Coincidencia **parcial** con LUZ-01 / ola 5 y OBR-04 / ola 3; modelado MEP/techo sin ID exacto | **R02-A: laboratorio funcional, NO integrado, pendiente de aceptación humana** ([PR #193](https://github.com/Juanmaes83/floorplan-3d/pull/193), `7d8a626`); integración **HOLD** (GOV-05, modelo de datos e ID pendientes; sin MEP ni validación reglamentaria); **sin autorización** para integrar. |
| **R03 · Armarios paramétricos** | [Donante PR #11](https://github.com/wy51ai/floorplan-3d/pull/11), SHA `2495d8e0bf7d3846d2da827121c15e3e83d752bd` | F3 existente y relación **parcial** con CAT-03 / ola 5; módulo paramétrico requiere decisión | **R03: laboratorio técnicamente completado, pendiente de aceptación humana, sin integración** ([PR #194](https://github.com/Juanmaes83/floorplan-3d/pull/194), `fc5a422`); GOV-05 documentado solo para el alcance R03 (MIT + D.6); integración **HOLD** (contrato del interior, decisión 3D e ID pendientes); **no completa CAT-03**; **sin autorización** para integrar. |

La investigación describe **13 áreas G0–G12, no 13 piedras clonadas**. Sus correspondencias no inventan mejoras: G0 → GOV-05/BIB-01; G1–G3 → F2, G-01, G-06; G4/G5 → R02 con encaje incompleto y X-03 descartada para MEP automático; G6/G7 → editor/OBR-04 parcialmente, decisión pendiente; G8 → IMG-08/09, UX-13, CAT-01; G9 → C1–C4/FT3D-8, OBR-05 y ENT-04; G10 → R03/CAT-03 parcialmente; G11 → AG-1/AG-2; G12 → GOV-07 parcialmente. **Ver matriz exacta y límites en el anexo**, que no puede reasignar ninguna ola.

**Gates:** origen/licencia → copia fiel → baseline → CLASSIFY → escultura → normalización → TEST → PREVIEW → revisión humana → merge y publicación como autorizaciones separadas. **El laboratorio R01, R02 o R03 no queda aprobado por esta documentación.** Se respetan los cinco casos y veinte planos autorizados de F2 para cualquier afirmación de precisión real. Los asuntos prioritarios de seguridad de enlaces/ENT/GOV-08 conservan su orden.

**Estado:** propuesta documental en rama aislada; sin modificaciones de código ni de Production.
