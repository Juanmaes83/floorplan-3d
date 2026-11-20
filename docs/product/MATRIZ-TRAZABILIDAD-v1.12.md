# RUBIK SOTA — Matriz de trazabilidad reconciliada v1.12

**Corte auditado:** `master@7dccf7a6095e6700b2a6b81161f4172b53c340fb` (18/11/2026), con las PR abiertas #251–#260 consultadas en sus SHA del mismo día. **Autor:** Claude Code, por mandato del propietario. **Estado:** propuesta documental; no autoriza integración, despliegue, activación ni gasto.

**Actualización de integración:** las filas de ENT-04 y el seguimiento de §6 reflejan [#259 en `master@163df68`](https://github.com/Juanmaes83/floorplan-3d/commit/163df68e83a80ddf11a008d573ee257d51c1821f).

**Qué es.** La fuente canónica del **estado vigente** de cada uno de los 98 identificadores del [catálogo maestro](rubik-catalogo-maestro-mejoras-2026-11-09.md), de su programa estratégico y de su trabajo residual. El catálogo sigue siendo la autoridad de nombres, alias y olas. El [plan maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) agrupa este residual en cortes. Las evidencias de esta auditoría están en el [registro de evidencias](../auditorias/reconciliacion-maestra-2026-11-18/REGISTRO-EVIDENCIAS.md).

**Columna «Antes».** Es la letra de la columna Estado del catálogo v1.11. Varias filas ya estaban adelantadas por el [Estado maestro](ESTADO-MAESTRO-RUBIK-SOTA.md) del 17/11; esta matriz las reconcilia en un solo sitio.

## 1. Claves

**Estados reconciliados**

| Código | Estado |
|---|---|
| `RV` | Resuelto y validado |
| `RL` | Integrado con límites de alcance |
| `SU` | Objetivo superado por otra solución |
| `PI` | Implementado, pendiente de integración |
| `PV` | Implementado, pendiente de validación |
| `EX` | Experimental o laboratorio |
| `SI` | Simulado |
| `DE` | Implementado y desactivado |
| `PA` | Parcialmente desarrollado |
| `IR` | Infraestructura reutilizable, sin función específica |
| `ND` | No desarrollado |
| `DX` | Depende de una decisión externa |
| `RD` | Redundante o candidato a descarte |

**Clases de evidencia**

| Clave | Significado |
|---|---|
| [I] | Código inspeccionado por Claude en `master@7dccf7a` o en el SHA citado, el 18/11 |
| [E] | Prueba ejecutada por Claude el 18/11 sobre `7dccf7a`, en Windows con Node 24 (ver registro de evidencias) |
| [T] | Prueba localizada, no ejecutada en esta auditoría |
| [CI] | Resultado de CI consultado en GitHub |
| [H] | Evidencia histórica: acta, PR o Estado maestro con su SHA |
| [P] | Comunicado por el propietario |
| [V] | Afirmación pendiente de verificación |

**Tipos de residual:** NUE desarrollo nuevo · CON conexión de componentes · AMP ampliación · UI interfaz · COR corrección · VT validación técnica · VP validación profesional · AO activación operativa · DC decisión comercial · DJ decisión jurídica · INV investigación.

**Programas:** **P1** Studio Presentation E2–E7 · **P2** Servicios IA · **P3** Identidad, seguridad y cuotas · **P4** Beta comercial · **P5** Fidelidad y bibliotecas · **P6** Interoperabilidad y precisión · **P7** Generación y asistentes avanzados · **P8** Experiencias premium.

**Hitos:** A producto actual consolidado · B primera versión comercial · C plataforma profesional avanzada · D ecosistema premium. Definición en el plan maestro.

## 2. Recuento

| Estado | IDs |
|---|---|
| `RV` Resuelto y validado | 20 |
| `RL` Integrado con límites de alcance | 13 |
| `SU` Objetivo superado por otra solución | 2 |
| `PV` Implementado, pendiente de validación | 2 |
| `EX` Experimental o laboratorio | 5 |
| `SI` Simulado | 6 |
| `PA` Parcialmente desarrollado | 22 |
| `IR` Infraestructura reutilizable, sin función específica | 7 |
| `ND` No desarrollado | 17 |
| `DX` Depende de una decisión externa | 3 |
| `RD` Redundante o candidato a descarte | 1 |
| **Total** | **98** |

| Programa principal | IDs |
|---|---|
| P1 Studio Presentation E2–E7 | 10 |
| P2 Servicios IA | 26 |
| P3 Identidad, seguridad y cuotas | 6 |
| P4 Beta comercial | 23 |
| P5 Fidelidad y bibliotecas | 10 |
| P6 Interoperabilidad y precisión | 8 |
| P7 Generación y asistentes avanzados | 8 |
| P8 Experiencias premium | 7 |
| **Total** | **98** |

| Hito de cierre | IDs |
|---|---|
| A | 22 |
| B | 24 |
| C | 37 |
| D | 15 |
| **Total** | **98** |

Los seis descartes X-01 a X-06 siguen fuera del recuento, sin cambios (§5).

## 3. Matriz por identificador


### A · Gobierno, higiene y seguridad comercial

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| GOV-01a | Fusionar Render IA D1 | E | `RV` | [H] #180, #181, #182 fusionadas; [acta D1](../render-ai/d1-acta-de-cierre-2026-11-09.md) | Fusión con CI verde | P2 | — | — | Cerrado | A |
| GOV-01b | Configurar entorno de Render IA | E | `RV` | [H] acta D1; [H] Estado maestro 17/11: `RUBIK_RENDER_ENABLED=1` en metadatos del despliegue | Variables en Production y Preview | P2 | — | — | Cerrado | A |
| GOV-01c | Promote de Render IA | E | `RV` | [H] acta D1, `dpl_5oHs…` | Activo en Production desde el 09/11 | P2 | — | — | Cerrado | A |
| GOV-09a | Acreditar el modelo antes del Promote | — (superada) | `SU` | [H] catálogo v1.3: desviación cronológica | Sustituida por GOV-09b | P2 | — | — | Cerrado por sustitución | A |
| GOV-09b | Confirmar modelo en el registro de Production | E | `RV` | [H] log `rubik-render` del 09/11 | Una ejecución real | P2 | — | — | Cerrado | A |
| GOV-02 | Cerrar o archivar PR obsoletas | N | `RV` | [H] [archivo de 21 PR](../auditorias/archivo-21-pr-2026-11-17.md): 0 PR obsoletas abiertas el 17/11; [I] las 9 abiertas el 18/11 son trabajo activo | Higiene puntual cumplida; pasa a regla del protocolo | P4 | — (regla permanente del protocolo) | — | Cerrado | A |
| GOV-03 | Registro único de capacidades | P | `PA` | [I] `js/capability-registry.js`; [E] `tests/capability-registry.test.cjs` 8/8; sello `VERIFIED_AT=40b4ae5` servido por la URL pública; [V] corte K9 en la rama `claude/k9-capability-registry` (pendiente de integración: no cambia este estado), ver [K9](K9-REGISTRO-UNICO-CAPACIDADES.md) | En master solo lo usa la Home; K9 conecta Home, Asistente y matriz | P4 | CON: que la Home, el Asistente y la matriz lean el mismo registro; sello por despliegue | — | Cada capacidad anunciada tiene estado, SHA y prueba en un solo registro | B |
| GOV-04 | Documentación de la rama de preparación a master | R | `RV` | [H] #192, #241, #243 fusionadas | Documentos de gobierno en master | P4 | — | — | Cerrado | A |
| GOV-05 | Revisión jurídica y privacidad | R (borrador) | `DX` | [H] #161 conservada como material de partida | Ninguna revisión profesional | P3 | DJ: contratar asesor; condiciones, retención, licencias, consentimientos de imagen y personas | Propietario | Dictamen firmado y textos legales publicados | B |
| GOV-06a | Autenticación y cuotas por profesional | N | `PA` | [I] master: `api/_share-auth.js` (código compartido), `api/_spend-ledger.js` (libro atómico); [H] #258 `56e6777`: `api/_beta-controls.js` con identidad por tester (huella SHA-256), cuotas y tope común solo en Preview | No hay cuentas, sesiones, roles ni CSRF | P3 | AMP: de tester en variable de entorno a cuenta de profesional; sesiones, roles, CSRF, cuota durable | GOV-05 | Cuenta individual con cuota y gasto propios en Production, con pruebas adversarias | B |
| GOV-06b | Plataforma multiusuario avanzada | N | `ND` | [I] sin equipos, roles ni organizaciones en `api/` ni `js/` | — | P3 | NUE | GOV-06a | Equipos y organizaciones con permisos probados | D |
| GOV-07 | Hardware real y resiliencia WebGL | N | `PA` | [I] `js/gl-quality-core.js`; [E] `tests/gov07-quality-core.test.cjs`; [H] #208/#213 | Software resiliente; sin matriz física | P4 | VT: banco iOS, Android y GPU de escritorio | Dispositivos | Matriz física firmada para los recorridos de la beta | B |
| GOV-08 | Publicación segura de enlaces de cliente | P | `RL` | [H] #187, #188, #195, #244; [H] evidencia aislada 30/30 y 7/7; [E] `tests/gov08-*` (4 archivos) | S1, S2, S3 y aislamiento; Blob público mantiene acceso directo hasta retirada | P3 | AMP: S4 cuotas y S5 almacén privado con enlaces opacos | GOV-06a | S4 y S5 integrados con prueba aislada | B |

### B · Home y descubrimiento

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| HOM-01 | Home por profesión | E | `RV` | [H] #184; aprobación visual del propietario [P] | En la URL pública | P4 | — | — | Cerrado | A |
| HOM-02 | Perfil Constructora | E | `RV` | [H] #185 | En la URL pública | P4 | — | — | Cerrado | A |
| HOM-03 | «Nuevos servicios IA» en la Home | N | `RV` | [H] #236 vía #241; [T] `tests/welcome-ai-services.browser.test.cjs` | Cuatro estados honestos | P4 | — | GOV-03 | Cerrado; se actualiza con cada activación | A |
| HOM-04 | Demostraciones guiadas en la Home | E | `RL` | [H] #242; [E] `tests/construction-demo-core.test.cjs` | Revisión visual humana final pendiente; la demo 4D no muestra cubierta | P4 | VP: revisión visual del propietario | — | Revisión visual aprobada | A |

### C · Entregas y experiencia del cliente

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| ENT-01 | Visita 3D del cliente | R | `RL` | [I] `js/client-delivery-core.js`, `api/delivery.js`; [E] `tests/client-delivery-core.test.cjs`, `tests/ent01-*`; [P] aceptación manual | Una planta; aceptación manual sin URL registrada | P1 | AMP: varias plantas; recorrido compartido | GOV-08 S4/S5 | Visita multiplanta con enlace caducable y prueba pública dirigida | B |
| ENT-02 | Seguridad del enlace de cliente | P | `RL` | [H] #244; [E] `tests/gov08-s3-expiry.test.cjs` | Revocación, caducidad y limpieza manual; sin Cron | P3 | AMP: S4/S5 (comparte corte con GOV-08) | GOV-06a | Igual que GOV-08 | B |
| ENT-03 | Story y plantillas hacia el cliente | N | `EX` | [H] laboratorio `8c532634`: 21 recetas, 6 perfiles y 43 fuentes; adaptador F0 acreditado 11/11. El selector productivo espera D4 | Solo laboratorio; herramientas Node fuera del producto | P1 | CON: E3, recetas sobre la interfaz y el modelo existentes | ENT-04 (E2) | E3 integrado con aceptación visual | B |
| ENT-04 | Dossier antes/después con presupuesto rotulado | P | `RL` | [H] #251 (E2) integrado por #259 en `master@163df68`; [CI] [regresión posterior a la integración](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44366171976) | Comparador desde Variantes y acceso desde Entregar. E2 incluye coherencia económica, vigencia y orden de cambio interna | P1 | VP: validar el recorrido profesional en el entorno autorizado cuando se programe | — | Evidencia de aceptación y revisión profesional del recorrido de entrega | B |
| ENT-05 | Fichas de imagen trazables | N | `PA` | [I] `js/ai-render-ui.js` guarda vista original, estilo, acabados, modelo, uso y fecha; `js/delivery-image.js` compone la banda con marca | No persiste la imagen ni la cámara; sin libro FF&E | P1 | AMP: E4, persistir imagen enviada, cámara y revisión (comparte corte con IMG-12) | IMG-12 | Ficha exportable con origen, revisión, materiales y leyenda IA | C |
| ENT-06 | Lotes de entrega con coste y cancelación | N | `ND` | [I] sin lotes en `api/render.js` | — | P1 | NUE sobre IMG-04 y ENT-05 (E6) | IMG-04, GOV-06a | Lote con coste previo, cancelación y ZIP | C |
| ENT-07 | Portal profesional y white-label | N | `ND` | [I] solo marca del estudio en entregables (`js/brand-core.js`, [E] `tests/brand-core.test.cjs`); sin portal, equipos ni dominio propio | La marca en documentos ya existe y no cuenta como portal | P3 | NUE (E7) | GOV-06b, GOV-05 | Portal con aceptación y firma | D |

### D · Imágenes IA

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| IMG-01 | Textos completos en la exportación | E | `RV` | [H] #181 | Revisión humana con acabados pendiente | P2 | VP menor | — | Cerrado con revisión residual | A |
| IMG-02 | Consumo, coste y registro por imagen | E | `RV` | [I] `api/render.js` líneas de uso y coste; [E] `tests/ai-render-api.test.cjs` 14/14 | Coste estimado `null` sin tarifas | P2 | — | — | Cerrado | A |
| IMG-03 | Calidad explícita y coste previsto | N | `ND` | [I] `api/render.js` fija `size=1536x1024` y no admite calidad | — | P2 | AMP: lista cerrada de calidad y coste previsto con `js/render-cost-core.js` | ECO-01 | Tres calidades con coste previsto mostrado antes de generar | C |
| IMG-04 | Confirmación de gasto y lotes | P | `PA` | [I] master: límites por instancia en memoria; [H] #258: presupuesto común y reservas atómicas en Redis, solo Preview | Sin tope global en Production | P2 | CON: integrar #258 y ampliar el libro común a `api/render.js` | GOV-06a, #258 | Tope global y confirmación previa en Production | B |
| IMG-05 | Catálogo amplio de suelos | P (6) | `PA` | [I] `js/ai-render-ui.js:14`: 6 claves cerradas (roble claro, nogal, microcemento, mármol, terrazo, gran formato), conectadas al diálogo de Render IA; [E] `tests/ai-render-api.test.cjs` 14/14 | Sin espiga, porcelánico ni piedra. La lista del render es independiente de la biblioteca de superficies del editor (`js/surface-catalog.js`) | P5 | AMP + CON: derivar la lista del render de la biblioteca de superficies con licencias (BIB-01), en lugar de mantener otra lista | BIB-01 | Una sola biblioteca de suelos con licencia, usada por editor y render | C |
| IMG-06 | Paredes y techos | P (5) | `PA` | [I] `js/ai-render-ui.js:15`: 5 claves de pared (blanco mate, blanco cálido, salvia, estuco arena, gris azulado), conectadas al diálogo; sin clave de techo; [H] #255 añade estucos F03 solo como detalle 3D | Sin techos, panelado ni pared de acento | P5 | AMP + CON, mismo corte que IMG-05 | BIB-01 | Igual que IMG-05, con techos | C |
| IMG-07 | Iluminación del render IA | N | `IR` | [I] el 3D ya tiene día/noche y hora (`index.html`, `opt.night`, `opt.hour`); el prompt de `api/render.js` no tiene clave de luz | La iluminación existe en 3D, no en el render IA | P2 | CON: capturar la vista con la hora elegida y añadir una clave cerrada de luz | IMG-03 | Tres ambientes de luz con prueba simulada y una real autorizada | C |
| IMG-08 | Estilos | P (4) | `PA` | [I] lista cerrada en `js/ai-render-ui.js` | 4 estilos | P2 | AMP | — | Estilos ampliados con revisión visual | C |
| IMG-09 | Decoración visual | N | `ND` | [I] sin parámetro en `api/render.js` | — | P2 | AMP de la receta visual | IMG-10 | — | C |
| IMG-10 | Intensidad de cambio | N | `SI` | [H] Estado maestro 17/11: «Estudio de imágenes» en simulación; [I] `js/visual-reform-core.js` | Simulación local rotulada | P2 | AO: proveedor real tras P3 | GOV-05, IMG-04 | Ejecución real autorizada y conciliada | C |
| IMG-11 | Presets por estancia | N | `SI` | [I] `js/visual-reform-core.js:42-48`: 6 recetas `PromptRecipeV1` (cocina fiel al catálogo, baño con producto fiel, escaparate de mobiliario, acabado, iluminación, piso piloto de promotora), con zonas e intensidades; solo las usa el «Estudio de imágenes» simulado. [I] Render IA D1 no tiene presets por estancia | Cubre cocina y baño como recetas de producto, en simulación. No cubre salón ni dormitorio, ni el Render IA real | P2 | AMP: reutilizar `PromptRecipeV1` como presets del Render IA y añadir salón y dormitorio | IMG-10, activación de P2 | Presets por estancia en el render real, con prueba simulada y una real autorizada | C |
| IMG-12 | Variantes, comparador y favoritos | P | `PA` | [I] alternativas en sesión en `js/ai-render-ui.js` (`results` en memoria) | Se pierden al cerrar | P2 | AMP: persistir resultado, vista de origen y revisión (E4) | IMG-04 | Variantes persistidas y comparables | C |
| IMG-13 | Biblioteca visual del estudio | N | `PA` | [I] `js/catalog-product-core.js` exige licencia y prueba de permiso; `js/visual-reference-core.js` guarda solo metadatos | Local por navegador; sin estudio autenticado | P5 | CON con CAT-02 y GOV-06a | GOV-06a, GOV-05 | Biblioteca compartida por estudio con licencias | C |
| IMG-14 | Edición por zona | N | `SI` | [H] Estado maestro 17/11 | Simulación | P2 | AO | GOV-05, IMG-04 | Ejecución real autorizada | C |
| IMG-15 | Referencia estética propia | N | `SI` | [H] Estado maestro 17/11 | Simulación | P2 | AO | GOV-05 | Ejecución real autorizada | C |
| IMG-16 | Coherencia entre vistas | N | `ND` | [I] sin receta fijada por proyecto | — | P2 | NUE pequeño sobre IMG-08 e IMG-12 | IMG-12 | Receta guardada en el proyecto y reaplicada | C |
| IMG-22 | Panel de consumo IA | N | `IR` | [I] registro por llamada en `api/render.js`; `js/render-cost-core.js` no se carga; [H] #258 libro común | Datos en logs, sin panel | P2 | CON+UI sobre el libro común | IMG-04 | Panel con coste por imagen y lote | C |
| CAM-01 | Cámara posicionable desde el plano 2D | N | `IR` | [I] `js/nav3d-ui.js` dibuja la cámara con su cono en el minimapa; `presentationPose()` en `index.html`; el render IA parte de vistas del proyecto | Hoy el plano muestra la cámara, pero no la coloca | P2 | CON: invertir el minimapa para fijar la pose y guardarla como vista | — | Colocar, guardar y renderizar una vista desde el 2D | C |

### E · Personas y escenas habitadas

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| PER-01 | Personas genéricas | N | `ND` | [I] los prompts de `api/render.js` y `api/photo-reform.js` prohíben añadir personas | Prohibido por diseño | P8 | NUE + DC | IMG-12, ECO-01, GOV-05 | — | D |
| PER-02 | Personas reales con consentimiento | N | `DX` | [H] catálogo K2 | — | P8 | DJ + NUE | GOV-05, GOV-06a, PER-01 | — | D |
| PER-03 | Narrativas «Así se vive» | N | `ND` | — | — | P8 | NUE | PER-01, ENT-05 | — | D |

### F · Fotografías del cliente

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| FOT-01 | Reforma sobre la foto del cliente | N | `SI` | [I] master: `api/photo-reform.js` cerrado por defecto; [E] `tests/photo-reform-api.test.cjs`, `tests/photo-reform-provider.test.cjs`; [H] #258 conecta proveedor real desactivado | Simulación rotulada; proveedor real no activado | P2 | VT+AO: #258, Preview aislado, ejecución real autorizada | GOV-05, IMG-04, GOV-06a | Prueba real con consentimiento, coste conciliado y aceptación | B |
| FOT-02 | Foto a espacio métrico editable | N | `ND` | — | — | P6 | INV | Validación métrica | — | D |
| MUE-01 | «Trae tu mueble» simple | N | `RV` | [I] `js/own-furniture-core.js`; [T] `tests/photo-project*.cjs`; [H] #227 vía #228; [E, CI] [#270, P0 H-1](https://github.com/Juanmaes83/floorplan-3d/pull/270) en `cff21adc` | Volumen genérico; la foto es solo referencia | P5 | — | — | Cerrado | A |
| MUE-02 | Foto a mueble 3D reconstruido | N | `ND` | — | — | P8 | INV | MUE-01, presupuesto IA | — | D |

### G · Catálogos y bibliotecas

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| CAT-01 | Catálogo del profesional como referencia del render | N | `SI` | [H] Estado maestro 17/11; [H] #258 lo conecta a `photo-reform/1` real, desactivado | Simulación | P2 | VT+AO (mismo corte que FOT-01) | GOV-05, K11 | Igual que FOT-01 | B |
| CAT-02 | Catálogos con fichas, SKU y medidas | N | `EX` | [I] `js/catalog-ui.js`, `js/catalog-product-core.js`; [E] `tests/catalog-product-core.test.cjs` 13/13 | Piloto local por navegador | P5 | CON con GOV-06a; VP con un estudio real | GOV-06a, GOV-05 | Catálogo de un estudio real con licencias registradas | B |
| CAT-03 | Productos 3D colocables y presupuestados | P | `PA` | [I] `js/catalog-placement-*`, `js/catalog-budget-core.js`, `js/cat04-ui.js`; [E] `tests/cat04-*` y `tests/catalog-budget-core.test.cjs` | Piloto C1–C4 con dos GLB propios | P5 | AMP: productos validados a escala comercial | CAT-02 | Productos reales de un fabricante con permiso | C |
| BIB-01 | Biblioteca propia con licencias | N | `PA` | [I] `assets/materials/licenses/` (Poly Haven CC0); [H] #255 añade F03 con `source-audit.json` | Materiales; no muebles | P5 | CON: integrar #255 y unificar el registro de licencias | #255 | Registro de licencias por activo, comprobado en CI | B |

### H · 360 y vídeo

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| VID-01 | Animación determinista | P | `PA` | [I] `js/tour-recorder.js`, `js/tour-video-ui.js`, `js/construction-mp4-muxer.js` | Recorrido y MP4 4D; no anima imágenes aprobadas | P1 | AMP sobre imágenes de ENT-05 | ENT-05 | Vídeo desde imágenes aprobadas | C |
| PAN-01 | Panorama conceptual | N | `ND` | [I] `index.html` solo usa equirectangulares como entorno 3D | — | P8 | NUE + DC | IMG-03 | — | D |
| PAN-02 | 360 del modelo 3D real | N | `ND` | [I] la escena 3D propia ya existe; no hay exportación cúbica ni equirectangular | — | P8 | AMP: capturar 6 caras desde la escena y componer. Sin IA ni coste por imagen | — | Panorama del modelo real, rotulado | C |
| VID-02 | Vídeo generativo | N | `ND` | — | — | P8 | NUE + DC | Presupuesto por segundo | — | D |

### I · Editor y experiencia 3D

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| UX-07 | Comparador antes/después | P | `RV` | [I] `js/revision-compare-core.js`; [H] #221 | Solo lectura desde Variantes | P1 | — | — | Cerrado | A |
| UX-22 | Minimapa en el paseo | P | `RV` | [I] `js/nav3d-ui.js`; [E] `tests/nav3d-core.test.cjs` | Sin móvil físico | P4 | — | GOV-07 | Cerrado | A |
| UX-23 | Accesos por estancia | P | `RV` | [H] #225 vía #228 | — | P4 | — | — | Cerrado | A |
| UX-25 | Abrir o cerrar todas las puertas | P | `RV` | [H] #225 vía #228 | — | P4 | — | — | Cerrado | A |
| UX-09 | Maqueta blanca | P | `PA` | [H] Estado maestro: avanza dentro de NAV3D sin pruebas con su ID | — | P4 | VT: prueba con el ID | — | Prueba propia en CI | B |
| UX-05 | Selector agrupado de modos | P | `PA` | [H] igual que UX-09 | — | P4 | VT + UI | — | Prueba propia en CI | B |
| UX-03 | Panel contextual con KPI | P | `RL` | [I] `index.html:1758-1780`: panel de muro (longitud, grosor, estado) y de estancia (superficie, perímetro, ancho, fondo, área de pared, huecos); panel de mueble en `index.html:1803`; [T] `tests/panel-pattern.browser.test.cjs` | Conectado al editor. El área de pared supone 2,8 m de altura y no descuenta huecos, aunque `js/quantity-core.js` sí lo calcula | P4 | COR + CON: tomar el área de pared de `quantity-core` y la altura real de la planta | — | El panel y el presupuesto dan la misma superficie de pared | B |
| UX-08 | Cotas en vivo | N | `RV` | [I] `js/live-dimensions-*`; [H] #224 | — | P4 | — | — | Cerrado | A |
| UX-04 | Ayudas y atajos | P | `RL` | [I] ayuda por herramienta en `index.html:1939` (`syncModeHint`), atajos de teclado en el panel de ayuda (`index.html:1643`), toasts con medidas al añadir muebles (`index.html:1917`) | Conectado. Los toasts con cifras no son sistemáticos | P4 | UI menor: toasts con el cambio en cada edición geométrica | — | Cada edición geométrica informa del cambio | C |
| PRE-01 | Preflight de integridad | N | `RL` | [CI] ProposalV1 de K13 en [#287](https://github.com/Juanmaes83/floorplan-3d/pull/287), `master@1daa7460`, con adaptadores para Asistente, MCP y Comparar | Pendientes de acreditar los consumidores futuros | P7 | CON: un único contrato de propuesta y vigencia | — | Toda propuesta muestra impacto y se aplica en un paso deshacible | C |
| UX-11 | Acabado de pared desde el 3D | P | `PA` | [I] el acabado de paredes se elige por estancia desde el panel (`index.html:1791`, `FloorPlanSurfaceUI.open`); la selección 3D (`index.html:4138`) devuelve estancia, puerta o mueble, nunca un muro | Sin entrada desde el 3D; sin acabado por pared individual | P4 | CON: selección 3D de muro hacia el diálogo existente; AMP de modelo para la pared de acento | UX-03 | Doble clic en una pared del 3D abre su acabado, con deshacer | C |
| UX-12 | Amueblar por estancia | N | `EX` | [I] `js/smart-furnishing-core.js`; [T] `tests/smart-furnishing*` | Experimental; biblioteca sin licencias amplias | P7 | VP + AMP con BIB-01 | BIB-01 | Aceptación visual con profesionales | C |
| UX-13 | Recetas de estilo | P | `EX` | [H] #226 vía #228 | Experimental | P7 | VP | UX-12 | Igual que UX-12 | C |
| UX-24 | Sugerir el tipo de estancia | N | `PV` | [I] K4 (#280, `070dbe8a`, árbol `6dddcd91`): heurística única en `js/project-core.js` (`suggestRoomFamily`), usada por NAV3D y Dibujo vivo; sugerencia aceptable en el panel de estancia; [T] `tests/k4-room-type.test.cjs`, `tests/k4-room-type.browser.test.cjs` | Integrado; sin validación independiente ni Production | P4 | VAL: validación independiente y despliegue | — | Sugerencia aceptable con deshacer y una sola heurística | B |
| UX-10 | Píldora de inspección | P | `IR` | [I] el editor no muestra información bajo el cursor: `pointermove` de `index.html:2083` solo gestiona desplazamiento y pellizco; el mapa de entrega pone el nombre de estancia como tooltip (`js/delivery-client.js:149`) | Los datos existen en los paneles de UX-03 | P4 | UI: mostrar al pasar el cursor los datos que ya calcula el panel | UX-03 | Píldora con los datos del panel, sin seleccionar | C |
| UX-26 | Intercambiar usos de estancias | N | `PV` | [I] K4 (#280): `swapRoomUses` en `js/project-core.js` y «Intercambiar uso» en el panel de estancia, un solo paso con deshacer; [T] mismas pruebas que UX-24 | Integrado; solo nombre y tipo, sin validación independiente ni Production | P4 | VAL: validación independiente y despliegue | UX-24 | Acción única con deshacer | C |
| UX-21 | Panel de sol | P | `PA` | [I] `js/solar-ui.js`, `js/solar-core.js` | — | P5 | UI | — | — | C |
| LUZ-01 | Iluminación ambiental | N | `IR` | [I] modo noche, hora y grupos de luminarias en `index.html`; puntos de techo en R02-A (`js/r02a-ceiling-*`) | Sin plan de iluminación | P5 | CON: luminarias R02-A + modo noche. Sin lux (K9) | R02-A | Plan visual rotulado «sin cálculo» | D |
| UX-14 | Move Rooms topológico | N | `ND` | — | — | P7 | INV | Solver | — | D |

### J · Obra y 4D

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| OBR-01 | Pendientes de FT3D-8 | P | `RV` | [H] #207; [T] `tests/obr01/` | — | P1 | — | — | Cerrado | A |
| OBR-02 | Fantasma de la siguiente tarea | P | `RV` | [H] #219; [E] `tests/obr02-obr03-*.test.cjs` | Solo con plan de la misma revisión | P1 | — | — | Cerrado | A |
| OBR-03 | % del plan y coste planificado | P | `RV` | [H] #219; [E] igual | Rotulado como planificado | P1 | — | — | Cerrado | A |
| OBR-04 | Muros de carga declarados y pasos libres | P | `PA` | [I] capa 2D «Muros de carga» (`index.html:593`) y declaración de estructura (`index.html:1757`, `Core.declareWallStructure`); sin capa de pasos libres; [I] `tools/rubik-mcp/src/route.cjs` y `layout-review` ya calculan recorridos y holguras | Muros de carga sí; pasos libres no | P5 | CON: capa de pasos libres a partir de `route.cjs` y `layout-review`, rotulada como geometría del modelo | — | Capa de pasos libres con la anchura limitante | C |
| OBR-05 | Exportar a MS Project o GanttProject | N | `IR` | [I] `js/construction-plan-ui.js:119` exporta el plan en JSON propio; `js/construction-schedule-core.js` | Formato propio | P6 | AMP: adaptador MSPDI XML sobre el mismo `serialize` | — | Archivo que abren MS Project y GanttProject, con prueba de ida | C |

### K · Interoperabilidad y fidelidad del plano

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| G-06 | Medir sobre el plano importado | P | `PA` | [I] herramienta Medir (M) con ajuste a muros y bloqueo de eje (`index.html:850`, `:1939`), utilizable sobre la imagen calibrada; [I] `tools/rubik-mcp/src/measure.cjs` mide entre elementos | Solo distancia. Sin área ni conteo | P6 | AMP: área y conteo sobre `tracing-core` | — | Medir área y contar sobre el plano calibrado | C |
| G-01 | Auditoría del plano importado | N | `EX` | [H] R01 #191 y #205, archivadas sin integrar | Laboratorio no validado | P6 | VT: F2 con 20 planos reales autorizados | GOV-05 | F2 superado | C |
| G-08 | Alinear dos planos | N | `SU` | [I] una reforma hecha como variante comparte marco de coordenadas con el original (`js/project-library.js`, `js/revision-compare-core.js`); `building-core.alignment()` ya alinea plantas | Superado para proyectos nativos; queda el caso de dos planos externos | P6 | AMP pequeño: segundo plano externo como calco con registro de dos puntos | — | Calco de un segundo plano registrado sobre una planta | C |
| G-02 | Exportación DXF profesional | N | `RL` | [H] [#265](https://github.com/Juanmaes83/floorplan-3d/pull/265) en master; [T] `tests/g02-dxf.browser.test.cjs`; [H] [descarga de planta activa 1/1](../integration/op07-a0-2026-11-20/README.md#dxf-de-planta-activa--residual-independiente) en el corte `adb86034` | Archivo → Exportar planta activa en DXF. DXF 2D con capas y cotas. Reimportación con escala estimada y reconocimiento heurístico de huecos | P6 | VP: apertura en dos CAD y revisión del nombre exportado en el entorno afectado | — | DXF con capas, cotas y leyenda existente/demoler, abierto en dos CAD | C |
| G-07 | Exportación IMDF | N | `RD` | — | Valor ★★ para un público de mapas de interior, no de reforma | P6 | DC: proponer descarte o aplazamiento | G-02 | Decisión del propietario | D |
| G-04 | Foto, LiDAR o IFC a espacio métrico | N | `ND` | [I] IFC se importa; foto y LiDAR no | — | P6 | INV | — | — | D |

### L · Asistente RUBIK

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| AG-0 | Contratos, permisos, telemetría y costes | N | `PA` | [I] `js/assistant-contracts.js`, `docs/contracts/assistant-v1/`; [E] `tests/assistant-ai-v2.test.cjs` 21/21 en copia LF | Faltan sesiones, tenant, roles y CSRF | P2 | AMP desde P3 | GOV-06a | Contrato con identidad real | B |
| AG-1 | Asistente de consulta | R | `RL` | [I] `js/assistant-session-core.js`; 7 de 12 herramientas en uso; [I] `api/assistant.js` responde `503 provider_disabled` | Consulta guiada sin LLM; generativo desactivado | P2 | AO: Prueba C con GO de gasto; VT: pruebas propias de 3 herramientas sin probar | GOV-06a, Prueba C | Prueba C superada con modelo real y tope | B |
| AG-2 | Propuestas revisables con diff | N | `RL` | [I] `js/assistant-proposals-core.js`, 2 operaciones | Material de suelo y mover objeto | P7 | AMP | AG-1 | Más operaciones con diff | C |
| AG-3 | Aplicar con confirmación y deshacer | N | `RL` | [H] acta AG-0…AG-5 | Solo local | P7 | AMP | AG-2, GOV-06a | Aplicación remota con sesión | C |
| AG-4 | Orquestar renders | N | `PA` | [H] Estado maestro: prepara el render sin gasto | Sin lote con coste | P2 | CON con IMG-04 | IMG-04 | Lote orquestado con coste previo | C |
| AG-5 | Capacidades avanzadas | N | `ND` | [H] #254 (MCP Etapa 2) propone posiciones de un mueble; no cierra AG-5 | — | P7 | INV | MUE-02, GEN-01 | — | D |
| AST-01 | Onboarding con tarjetas | N | `RL` | [I] `js/guide-core.js:47` (tarjeta «Subir un plano»: PDF, imagen, DXF, IFC, RoomPlan, JSON o ZIP) y `js/journey-core.js` (siguiente acción desde el estado real); [E] `tests/guide.test.cjs` 15/15, `tests/journey-core.test.cjs` 8/8. [I] no hay tarjeta de número de plantas: las plantas se añaden en `js/building-ui.js` | Guía, importación y siguiente acción; sin tarjeta de plantas | P4 | UI: tarjeta que abra «Añadir planta» de `building-ui` | — | Tarjeta de plantas conectada | B |

### M · Generación automática

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| GEN-01 | Generación paramétrica de distribuciones | N | `IR` | [I] piezas reutilizables: semilla y ranking en `js/smart-furnishing-core.js`, revisión en `js/layout-review.js`, propuesta acotada de MCP en #254, `js/room-layout.js` (diseño rectangular conservador) | No genera tabiquería ni estancias | P7 | NUE (el motor de distribución) + CON (reutiliza revisión, propuesta y deshacer) | PRE-01, criterios profesionales | Distribuciones válidas para el validador canónico, con ranking explicado | D |

### N · Economía y comercialización

| ID | Mejora | Antes | v1.12 | Evidencia, código, PR y pruebas | Alcance acreditado y límites | Prog. | Residual | Depende de | Criterio de cierre | Hito |
|---|---|---|---|---|---|---|---|---|---|---|
| ECO-01 | Medición de coste por imagen y lote | P | `PA` | [I] `js/render-cost-core.js` no se carga en `index.html`; [E] su prueba pasa | Núcleo puro | P2 | CON: cargarlo y alimentarlo con el libro común | IMG-04 | Coste por imagen aceptada medido en la beta | B |
| ECO-02 | Paquetes y precios comerciales | N | `DX` | [H] catálogo K6 | Hipótesis de 19 a 249 € | P4 | DC | ECO-01, ECO-03 | Precios validados con la beta | B |
| ECO-03 | Piloto con 5 profesionales | N | `ND` | — | — | P4 | VP + AO | Hito B técnico | Informe del piloto con tiempos, bloqueos y coste | B |

## 4. Reclasificaciones respecto a v1.11

Cambian de letra todas las filas cuyo estado de v1.11 era N, P, R o E y ahora tienen un estado reconciliado distinto. Las más relevantes, con su motivo:

| ID | v1.11 | v1.12 | Motivo |
|---|---|---|---|
| GOV-02 | N | `RV` | Las PR obsoletas se archivaron el 17/11; la higiene pasa al protocolo |
| GOV-04 | R | `RV` | La documentación está en master |
| HOM-03 | N | `RV` | Integrada en #241 |
| UX-08 | N | `RV` | Integrada en #224 |
| MUE-01 | N | `RV` | Integrada en #228 |
| UX-22, UX-23, UX-25 | P | `RV` | NAV3D integrado en #228; [CI] [OP-02 #266](https://github.com/Juanmaes83/floorplan-3d/pull/266) acredita las regresiones de navegación y el render bajo demanda en `02712b5` |
| UX-07, OBR-01/02/03 | P | `RV` | Integrados con pruebas |
| AST-01 | N | `RL` | Guía, importación y siguiente acción integradas; falta la tarjeta de plantas (verificado el 18/11) |
| UX-03, UX-04 | P | `RL` | Paneles con indicadores, ayuda por herramienta y atajos conectados (verificado el 18/11) |
| IMG-11 | N | `SI` | Recetas de cocina y baño solo en el «Estudio de imágenes» simulado (verificado el 18/11) |
| G-08 | N | `SU` | Las variantes nativas ya comparten marco con el original; solo queda el caso de dos planos externos |
| GOV-09a | — | `SU` | Sustituida por GOV-09b, como ya decía v1.3 |
| ENT-04 | P | `RL` | E2 integrado en master mediante #259 |
| AG-1, AG-2, AG-3 | R / N | `RL` | Consulta sin LLM, dos operaciones y aplicación local integradas |
| ENT-01, ENT-02, GOV-08 | R / P | `RL` | Integradas con alcance acotado |
| FOT-01, CAT-01, IMG-10, IMG-14, IMG-15 | N | `SI` | Simulación integrada y rotulada; proveedor real cerrado |
| CAT-02, UX-12, UX-13, ENT-03, G-01 | N / P | `EX` | Piloto, experimental o laboratorio |
| IMG-07, IMG-22, CAM-01, UX-24, UX-26, LUZ-01, PRE-01, OBR-05, GEN-01, UX-10 | N | `IR` | Hay infraestructura concreta reutilizable; la función no existe |
| GOV-06a, IMG-13, BIB-01, ENT-05, AG-0, AG-4 | N | `PA` | Hay una parte específica integrada |
| GOV-05, PER-02, ECO-02 | R / N | `DX` | Dependen de una decisión jurídica o comercial |
| G-07 | N | `RD` | Valor bajo para el público objetivo; se propone aplazar o descartar |

## 5. Descartes históricos (fuera del recuento)

| ID | Propuesta | Estado |
|---|---|---|
| X-01 | Semáforo y telemetría decorativa | Descartado; sin cambios en v1.12 |
| X-02 | Grúas y atrezo animado | Descartado; sin cambios en v1.12 |
| X-03 | Instalaciones MEP automáticas con normas chinas | Descartado; sin cambios en v1.12 |
| X-04 | Migrar la CI a Obscura | Descartado; sin cambios en v1.12 |
| X-05 | OSIRIS, GenCAD, CivilCraft, GeoModel3D, addons de Blender | Descartado; sin cambios en v1.12 |
| X-06 | Plazos de los PDF | Descartado; sin cambios en v1.12 |

## 6. Seguimiento propio fuera de los 98

No son IDs del catálogo y no alteran el recuento. Se siguen en el plan maestro.

| Código de trabajo | Qué es | Dónde | Relación |
|---|---|---|---|
| H01, H02 | Correcciones del dossier económico | #252 y #253, integradas por #259 | ENT-04 |
| UX-BETA-001 | Guardar proyecto JSON desde la cabecera | #257 (issue #256), integrado por #259 y verificado en Chromium | Beta |
| MCP Etapa 2 | Propuestas de posición de un mueble, solo lectura, por stdio | #254, integrado por #259 con GO funcional digital y escala estimada | PRE-01, GEN-01; AG-5 sigue abierto |
| VQ-01, F02, F03 | Detalle arquitectónico, carpinterías y fachadas | #255, integrado por #259; histórico de superficies 8/8 | BIB-01, IMG-05/06 |
| CI inteligente | Deduplicación certificada del CAT-IA | #260 | Gobierno de CI |
| Beta IA privada | Identidad de tester, cuotas y libro común | #258, integrado por #259; la activación y la prueba con proveedor siguen pendientes | GOV-06a, IMG-04, FOT-01, CAT-01 |
| CON-03 | Importación de presupuesto | master (#241) | Sin ID; decisión pendiente |
| «CAT-04» | Producto de catálogo a partida C1–C4 | master (#237) | Avance parcial de CAT-03 |
| R01, R02-A, R03 | Piedras SCULPT | R02-A y R03 en master; R01 en laboratorio | G-01, LUZ-01, CAT-03 |

## 7. Cómo se actualiza esta matriz

Tras cada integración en master, el agente que integra cambia solo las filas demostradas por esa integración, con su PR, su SHA y su clase de evidencia. Una PR cerrada sin fusionar no cambia ninguna fila. Un despliegue no cambia el estado de una fila; la activación en Production se anota en la columna de evidencia. El protocolo completo está en el [protocolo de coordinación](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md).
