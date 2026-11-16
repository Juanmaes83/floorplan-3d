# HOM-03 · Auditoría previa de la Home y matriz «Existe / Debe mejorar / Evidencia / Beneficio / Riesgo»

**Fecha:** 15-11-2026. **Responsable:** Claude Code 1. **Rama:** `feat/hom-03-home-value-20261115`.
**Base:** `master@b9f761326a554e0a7a58d0b88e823771e36b5a7c` (#234).
**Estado:** entregable previo a cualquier cambio de código. **NO MERGE · NO PRODUCTION · STOP_GASTO.**

## 0. Hecho de partida que condiciona toda la sección «Nuevos servicios IA»

Según la API de Vercel, consultada el 15-11-2026, Production **no** sirve master.

| Qué | Valor verificado |
|---|---|
| Dominio público de Production (el único del proyecto) | `floorplan-3d-alpha.vercel.app` |
| Despliegue al que apunta | `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` = **master@8df49ed** (HOM-02, Promote del 09-11-2026) |
| Despliegue de master@b9f7613 (#234) | `dpl_FRge5f6aRhaHN9vWcJuDSgym16Rh`, READY, objetivo Production, **sin dominio público** (`autoAssignCustomDomains: false`, sin Promote) |

**Consecuencia.** Nada fusionado después de HOM-02 está en el dominio público:
- R03 (armarios), R02-A (techos), UX-07/ENT-04, UX-08, NAV3D, UX-12/13 (#228);
- Asistente V2 y CAT-IA (#234).

Según la definición de la misión, ninguno está «disponible realmente en Production».

**Configuración efectiva en Production.** Se consultaron solo los metadatos de las variables, sin descifrar ningún valor ni cambiar nada:
- `RUBIK_RENDER_ENABLED=1` (texto plano, Production y Preview), con `OPENAI_API_KEY` y `RUBIK_RENDER_TOKEN` presentes en Production.
- **No existen** `RUBIK_ASSISTANT_ENABLED` ni `RUBIK_PHOTO_REFORM_ENABLED`.

Por tanto:

| Servicio | Endpoint | Respuesta en Production |
|---|---|---|
| Render IA | `/api/render` | Activo (verificado en el dominio público el 09-11: `401 token` sin código; hoy no se puede repetir desde este contenedor, cuyo proxy rechaza `*.vercel.app`) |
| Asistente | `/api/assistant` | `503 provider_disabled` (y sin sesiones sería `501`) |
| Foto-reforma | `/api/photo-reform` | `disabled`; además, el código bloquea Production (`VERCEL_ENV==='production'` → `production-blocked`) |

## 1. Clasificación verificada de los servicios (código + contrato + pruebas + configuración efectiva)

| Servicio | Estado real | Por qué (evidencia) | Dónde se abre de verdad |
|---|---|---|---|
| **Render IA** (B2/B8) | **Disponible realmente** | `api/render.js` llama al proveedor solo con `RUBIK_RENDER_ENABLED==='1'` + clave + código; las tres están en Production. Está en 8df49ed y se acreditó el 09-11 (acta HOM-01/02). Pruebas: `ai-render-api.test.cjs`, `ai-render.browser.test.cjs`. **Consume créditos.** | Entregar → «Generar imágenes» → vista 3D → «Render IA» (`#welcomeRenderAI` ya lo presenta) |
| **Asistente RUBIK V2** | **Piloto local** | Consulta **determinista sin modelo de lenguaje** (`assistant-intents-core.js`: intenciones cerradas). Propuestas reversibles (`applyAssistant`). Conversación en `localStorage`. Sin sesiones, tenant ni cuotas (GOV-06a). Pruebas: `assistant-ai-v2.test.cjs` (21) y `.browser` (5). | Botón «Asistente» de la barra profesional (`RubikAssistantUI.open`) |
| **Mis catálogos** (CAT-02) | **Piloto local** | `catalog-ui.js`: fichas en este navegador; el selector de estudio «NO es control de acceso» (GOV-06a). Prueba: `catalog-ia.browser.test.cjs`. | Mi estudio → «Mis catálogos» (`RubikCatalogUI.open`) |
| **Producto de mi estudio** (CAT-03) | **Piloto local** | `catalog-placement-ui.js`: medidas verificadas, GLB validado o volumen genérico rotulado. **No alimenta Presupuestar C1–C4** (auditoría de #234). Prueba: `catalog-placement.browser.test.cjs`. | Diseñar → Amueblar (requiere fichas en Mis catálogos) |
| **Estudio de imágenes** (CAT-01 + FOT visual) | **Simulación** | `visual-reform-ui.js`: «SIMULACIÓN · no generada por IA»; la generación real está cerrada (STOP_GASTO, photo-reform/1). No se descarga ni se entrega. Prueba: `visual-studio.browser.test.cjs`. | Entregar → Imágenes → «Estudio de imágenes» (`RubikVisualStudio.open`) |
| **Reformar desde fotografía** (FOT-01) | **Simulación** | `photo-reform-ui.js`: adaptador SIMULADO local; el proveedor real está bloqueado (GOV-05/IMG-04). En el servidor, `photo-reform.js` está cerrado y bloqueado en Production. Pruebas: `photo-project.browser.test.cjs`, `photo-reform-api.test.cjs`. | Entregar → Imágenes → «Reformar desde fotografía» (`RubikPhotoReform.open`) |
| Asistente conversacional con LLM | **En preparación** | No hay proveedor, modelo, credencial de texto ni tope; falta GOV-06a. | — (sin CTA) |
| Generación real de imágenes desde foto | **En preparación** | photo-reform/1 está cerrado; GOV-05 e IMG-04 siguen pendientes. | — (sin CTA) |
| SKU en Presupuestar · el Asistente consulta los catálogos | **CAT-04, en curso en paralelo** | Ni el C1–C4 ni el asistente están conectados (`CatalogForAssistantV1` no existe). | **No se muestra.** Textos preparados detrás de una puerta `gate:'CAT-04'` |
| Mueble 3D desde foto, generar u optimizar distribución (AG-5) | **En preparación** | Rechazado por el asistente; MUE-02/GEN-01 no están aprobados. | — (sin CTA) |

**Notas.**
- «Amueblar esta estancia» (UX-12/13) y «Traer mi mueble» (MUE-01) **no son IA**: son reglas deterministas y un volumen con medidas. No se presentan como servicios IA.
- El «piloto local» funciona en el mismo despliegue que sirva la Home. Aun así, no se rotula como «Disponible», porque no tiene infraestructura multiusuario, garantías comerciales ni acreditación en Production.

## 2. Matriz de la Home

| # | Pieza | Existe | Debe mejorar | Evidencia de código | Beneficio profesional | Riesgo |
|---|---|---|---|---|---|---|
| 1 | Cabecera (hero) neutra y de los 6 perfiles, con 2 CTA | Sí (HOM-01/02, aprobada por el propietario) | **No tocar** el texto neutro (la prueba fija «¿Qué quieres hacer?»). El antetítulo neutro «Para inmobiliarias, promotoras y estudios» omite reformas, interiorismo y constructoras → **decisión aparte D1** | `guide-ui.js` `audienceHero`, `renderHero`; `welcome-capabilities.browser` | Cada profesión ve su resultado | Bajo. Cambiar textos aprobados sin GO |
| 2 | Tres entradas: subir, desde cero, ejemplo | Sí | No | `welcome-entries`; `welcome-generar.browser` | Arranque inmediato | — |
| 3 | «¿En qué trabajas?» con 6 perfiles y preferencia en `localStorage` | Sí | No | `audiences`, `audienceKey`; `professional-entry.browser` | Personalización sin tocar el proyecto | — |
| 4 | «Lo que puedes hacer hoy»: 3–4 capacidades del registro | Sí | Mantener el `ORDER` aprobado. Proponer «Amueblar esta estancia» para Interiorismo → **decisión aparte D2** (exige Promote previo) | `capability-registry.js` `ORDER`, `forAudience`; `capability-registry.test` | Lo que sirve hoy, con límites | Medio si se añadiera algo que no esté en Production |
| 5 | Banda Render IA | Sí, y es **lo único disponible realmente** | No duplicarla. La nueva sección **remite** a ella | `#welcomeRenderAI`; la prueba exige «orientativa», «código de acceso» y «créditos de IA» | Imagen fotorrealista orientativa | **Alto (negocio): la Home empuja un servicio de pago con STOP_GASTO activo.** Lo decide el propietario: **D3** |
| 6 | **«Nuevos servicios IA»** | **No existe** | **Crear**: 4 estados separados y verificados, CTA solo a funciones reales y rótulos de simulación inequívocos | Faltan estados `pilot` y `simulation` en el registro; faltan `access` para el asistente, los catálogos y los estudios | Entender qué es real, qué es piloto y qué es demostración, y probarlo sin equivocarse | **Alto si se mezclan estados.** Una simulación no puede parecer generación real, ni una consulta determinista un LLM |
| 7 | Registro GOV-03 | Sí (4 pruebas) | Añadir los servicios con su **SHA de verificación propio** (`b9f7613`) y una evidencia de Production solo para los disponibles. Prueba nueva: una «disponible» sin acreditación falla; una simulación debe rotularse; la puerta CAT-04 no se renderiza | `capability-registry.js` (`VERIFIED_AT` único = `5fb7a5c`) | Una sola fuente verificable | Bajo |
| 8 | «Recórrela en 3D» y «Soluciones» | Sí | No | `welcomeWalk`, `welcomeSolutions` | — | — |
| 9 | Pie («se guarda en este navegador») | Sí | No | `welcome-foot` | Transparencia | — |
| 10 | Accesibilidad e i18n | ES/EN/ZH con `tx`; foco visible; `aria-pressed` | La nueva sección debe ser igual: `h2` con id, lista semántica, estado textual (no solo color) y teclado | — | — | Medio en móvil (390 px): 4 columnas → una sola |
| 11 | #166 (visita 3D del cliente) | **Draft con conflictos, fuera de master** | **No anunciar** | PR #166 `mergeable_state: dirty` | — | Alto si se anunciara |
| 12 | Capacidades del editor posteriores a HOM-02 (R03, R02-A, UX-07/08, NAV3D, UX-12/13) | En master, **no en Production** | No se anuncian como disponibles. **D2** tras el Promote | Alias de Vercel (§0) | — | Alto si se anunciaran hoy |

## 3. Decisiones que quedan fuera de esta PR (las toma el propietario)

- **D1.** Antetítulo neutro más inclusivo («Para estudios, inmobiliarias, promotoras, reformas, interiorismo y obra»). Cambia un texto aprobado.
- **D2.** Tras un Promote de master, decidir si «Amueblar esta estancia», «Interior del armario» (R03) o «Comparar con el original» (UX-07) entran en «Lo que puedes hacer hoy» de algún perfil. Hoy no están en Production.
- **D3.** Con STOP_GASTO activo, Render IA sigue activado en Production (`RUBIK_RENDER_ENABLED=1`) y la Home lo presenta como «Ya disponible». Hay que decidir si se mantiene, si se rotula «temporalmente sin nuevas imágenes» o si se apaga el interruptor. No se cambia aquí: no toco secretos ni configuración.
- **D4.** Cuándo hacer el Promote de b9f7613 (o del master que incluya HOM-03 y CAT-04). Hasta entonces, el dominio público **no** muestra esta sección.

## 4. Diseño elegido (siguiente paso, dentro del perímetro autorizado)

- **Una sola sección nueva** `#welcomeAIServices`, después de la banda Render IA y antes de «Recórrela en 3D». Se conserva el orden de lectura que exige la prueba.
- **Cuatro grupos con rótulo textual:**
  - «Disponible»: Render IA, con un enlace **a la banda existente**, sin un segundo CTA de pago;
  - «Piloto en este navegador»;
  - «Simulación (sin IA real)»;
  - «En preparación» (sin botón).
- **Cada tarjeta incluye:**
  - qué es;
  - qué **no** es (por ejemplo: «sin modelo de lenguaje», «no genera imágenes con IA»);
  - el límite;
  - un CTA que abre la función real.
- **Origen de los datos:** el registro (`AI_SERVICES`), nunca textos sueltos en la UI.
- **CAT-04:** dos entradas con `gate:'CAT-04'`, filtradas siempre. Una prueba garantiza que no se renderizan.
- **Perímetro:** no se tocan motores, APIs, catálogo, fotos ni `ORDER`.
