# Estado operativo de producto e integración — actualizado 01-11-2026

**Fuente operativa de verdad para el trabajo actual.**  
**HEAD funcional con FT3D-4 integrado:** `e716ba920e26485ae112b8f12b342534dff34030`.  
Verificar siempre el HEAD real de `master` antes de ejecutar trabajo.

Estados usados:

- **implementado:** existe código probado en rama/PR/backup;
- **integrado:** el contenido está en `master`;
- **validado:** ha superado el QA requerido para el alcance;
- **cerrado:** integración + validación + revisión humana/documentación final cuando corresponda;
- **diferido:** capacidad conscientemente fuera del cierre actual; no bloquea el bloque al que pertenecía.

---

## 1. Estado real de `master`

Están integrados:

- Puntos 1–8 previamente cerrados, incluido 8C territorial;
- Punto 9 — UX profesional y descubribilidad;
- Project-First Fase A, cortes A1–A4;
- Fase B, cortes B1–B8;
- Fase C, cortes **C1–C4**;
- programa de conocimiento Flat-to-3D;
- FT3D-1a — «Empezar desde el plano»;
- FT3D-1b — «Entrar en la estancia»;
- FT3D-2a — motor reusable de Presentation Story y «Ver la historia completa»;
- FT3D-3 — sección dinámica;
- **FT3D-4 — alzado/fachada narrativa**.

### FT3D-1

Secuencia integrada:

```text
plano 2D
→ volumen 3D
→ vista general
→ descenso continuo
→ primera estancia
→ Presentación existente
```

**Estado:** INTEGRADO y VALIDADO TÉCNICAMENTE. Falta aceptación humana final/cierre documental, no otro corte funcional.

### FT3D-2

PR de integración: **#155**.  
Commit integrado: `042c256b5898b04b89749cdc1ab8b5ce9d29da10`.

2a aporta secuencia reusable de escenas, progreso global, anterior/siguiente, reproducción/pausa, captions, cámaras deterministas, historia completa, orden/selección desde el plan y restauración/salida al flujo existente.

**FT3D-2 está INTEGRADO, VALIDADO TÉCNICAMENTE y FUNCIONALMENTE COMPLETO CON 2a. No se requiere FT3D-2b.**

### FT3D-3 — sección dinámica

PR de integración: **#157**.  
Base: `d476d20c00f5be96f715d37fdf32b12d7a85be34`.  
Commit integrado por fast-forward seguro: `18295e620ba0c19fff4e005449d763bf90342e92`.

Aporta `section-open`, descriptor puro de sección, clipping vertical real, caras de corte derivadas del modelo, cámara reversible, opt-in runtime, minimapa, multipiso actual, reduced motion y restauración completa.

QA final: unitarias **657 bien / 0 fallos / 2 omitidos**, `presentation-section` **7/7**, `presentation-story` **8/8**, regresiones principales verdes y deuda histórica reproducida en baseline exacto. CI remoto PR #157: **7/7 success**.

**Estado FT3D-3: INTEGRADO Y VALIDADO.**

### FT3D-4 — alzado / fachada narrativa

Contrato canónico: `docs/product/ft3d-4-elevation-facade-contract-2026-10-31.md`.  
PR de integración: **#158**.  
Base: `806e8558a6459fe74ac55c8f7d0ab2d387eac5c8`.  
HEAD integrado por fast-forward seguro: `e716ba920e26485ae112b8f12b342534dff34030`.

Aporta:

- núcleo puro `FloorPlanPresentationElevation.derive()` apoyado en la autoridad `FloorPlanExterior.derive()`;
- selección determinista de candidatos por sectores de 45°, sin inventar «fachada principal»;
- narrativa `elevation-open` dentro del Story engine existente;
- secuencia overview → frontal → materiales/luz → perspectiva exterior → overview;
- cámara frontal con PerspectiveCamera y FOV estrecho de 4°, sin crear alzado técnico certificado;
- cardinalidad sólo cuando existe `site.northOffsetDeg`;
- Solar orientativo opcional mediante la API Solar existente, con snapshot runtime;
- contexto exterior como enhancement opcional, oculto durante la lectura frontal y recuperado en perspectiva;
- multipiso actual de hasta dos plantas, sin exploded ni desplazamiento artificial de niveles;
- selector runtime de fachada, OFF por defecto, sin schema ni persistencia nueva;
- minimapa con fachada seleccionada y dirección de observación;
- reduced motion, accesibilidad, cancelación y restauración completa;
- continuidad hacia `room-descent` y JSON editable idéntico antes/después.

QA final sobre `e716ba9`:

- unitarias canónicas: **690 bien, 0 fallos, 2 omitidos**;
- `presentation-elevation.browser`: **10/10** en una sola pasada sobre el HEAD final;
- 15 suites de regresión ejecutadas;
- sin regresión nueva atribuible a FT3D-4;
- M09 de recuperación HDR reproducido también en la base exacta `806e855`;
- R10, M13, P13, P15 y P05 se mantienen como deuda previa conocida y no fueron reintroducidos por FT3D-4;
- evidencia final: **34 capturas + contact sheet**, 390×844, 844×390, multipiso, Solar, contexto, unsupported y fachada alternativa;
- vídeos forward/reverse 1440×900 a 24 fps revisados mediante diferencias y hojas de contacto;
- CI remoto PR #158: **7/7 workflows success**.

Riesgos no bloqueantes registrados:

- la fachada automática del proyecto de referencia es la más larga pero casi ciega; cumple la regla contractual `longitud → huecos → orden`, aunque puede revisarse después como decisión UX de producto;
- en 844×390 el caption Solar largo puede requerir desplazamiento dentro de la tarjeta; no hay overflow horizontal y los controles permanecen operables;
- durante entrada/salida multipiso las plantas superiores usan escala vertical temporal, pero en las fases estables conservan sus offsets reales y no existe exploded.

**Estado FT3D-4: INTEGRADO Y VALIDADO.**

---

## 2. Roadmap estratégico A / B / C

### Fase A

A1–A4 cubren el alcance aprobado: previews reales, Analizar visual, contexto permanente, dossier, galería automática, informe solar/emplazamiento y estilos profesionales.

**Estado:** implementación completa.  
**Pendiente de cierre:** revisión humana final, documento de cierre y limpieza administrativa de PR/ramas. Las vistas guardadas manualmente siguen como mejora posterior y no bloquean el mínimo aprobado.

### Fase B

B1–B8 están integrados.

| Capacidad | Estado | Pendiente de cierre |
|---|---|---|
| Archivo cliente offline | **INTEGRADO** | cierre documental/humano |
| Render IA | **INTEGRADO EN CÓDIGO / VALIDACIÓN EXTERNA PENDIENTE** | OpenAI real cuando haya créditos + `OPENAI_API_KEY` |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO Y VALIDADO REAL** | cierre documental/humano |
| «Envíanos tu plano» | **INTEGRADO** | validar proceso humano real |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO EN CÓDIGO / VALIDACIÓN EXTERNA PENDIENTE** | proveedor OpenAI real + revisión de calidad cuando haya créditos + `OPENAI_API_KEY` |
| Presentación avanzada | **EN PROGRESO** | FT3D-1..4 integrados; FT3D-5..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea Fase B |

### Validación real B4 — Vercel Blob

**31-10-2026 — VALIDADO REAL en producción.**

Se validó almacén Vercel Blob público conectado al proyecto, variables protegidas, redeploy READY, `POST /api/share` → 200, Blob → 200, `/api/view` → 200 y código incorrecto → 401. No fue necesario modificar código B4.

### Bloqueo externo temporal B2 / B8

B2 y B8 requieren `OPENAI_API_KEY` + créditos API para validación real. La dependencia externa queda aparcada hasta que pueda financiarse/configurarse el proveedor. No hay defecto funcional nuevo demostrado y no bloquea FT3D-5..7.

### Decisión formal de producto — 360

**Decisión de Juanma, 31-10-2026:** no desarrollar ahora un tour 360 específico. Sólo se reabrirá si aparece un caso de uso independiente que justifique su coste.

### Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO Y VALIDADO** | C1 |
| Presupuesto operativo | **INTEGRADO Y VALIDADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO Y VALIDADO** | C3 |
| Dossier económico | **INTEGRADO Y VALIDADO** | C4 |

**Fase C está funcionalmente COMPLETA: 4/4.**

C4 quedó integrado mediante PR **#156** y usa `FloorPlanBudgetPresentation.buildReport()` como autoridad, sin recálculo/persistencia duplicada, con variantes Profesional/Cliente, origen de precio separado de revisión, IVA `null` distinto de 0 %, integración A4/B1 y salidas print/PDF/CSV/JSON/BC3.

Contrato canónico: `docs/product/c4-economic-dossier-contract-2026-10-31.md`.

---

## 3. Programa Flat-to-3D / Presentation Story

| Fase | Estado actual |
|---|---|
| FT3D-0 — investigación/contrato | **CASI CUBIERTO**, cierre formal pendiente |
| FT3D-1 — plano → 3D → primera estancia | **INTEGRADO Y VALIDADO TÉCNICAMENTE**; aceptación humana final pendiente |
| FT3D-2 — motor reusable Story | **INTEGRADO, VALIDADO Y COMPLETO CON 2a** |
| FT3D-3 — sección dinámica | **INTEGRADO Y VALIDADO** |
| FT3D-4 — alzado/fachada narrativa | **INTEGRADO Y VALIDADO** |
| FT3D-5 — axonometría/exploded | **SIGUIENTE CORTE AUTORIZADO PARA ESPECIFICACIÓN** |
| FT3D-6 — plantillas por perfil | **DRAFT DISEÑADO Y APROBADO; PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

FT3D-6 tiene draft documental en la rama `docs/ft3d-6-profile-templates-contract`, HEAD `388c03b67b98fccef85e310dd2e7665514111b3d`. No implementar todavía: debe reconciliarse con las APIs reales de FT3D-5 antes de convertirse en contrato canónico.

No se autoriza FT3D-2b: no existe gap demostrado que lo necesite.

---

## 4. Orden operativo autorizado

1. **FT3D-5 — axonometría / exploded: preparar contrato exacto antes de implementación.**
2. Reconciliar el draft FT3D-6 contra las APIs reales de FT3D-4/5 y convertirlo en contrato canónico.
3. FT3D-6 — plantillas por perfil; preferencia por presets + resolver puro + UI ligera si la arquitectura real lo permite.
4. FT3D-7 — salidas/compartición.
5. **En paralelo / cuando se desbloquee OpenAI:** validaciones reales B2 / B8.
6. Auditoría global.
7. Cierres canónicos A / B / C / FT3D.
8. Limpieza GitHub y reconciliación administrativa de PR/ramas históricas.
9. Protección de `master`.

**B4 ya está validado real.**  
**B2/B8 siguen siendo gates de cierre de B, pero no bloquean FT3D.**  
**360 está formalmente diferido y fuera de esta secuencia.**

---

## 5. Fuera del cierre actual

- Tour 360 específico: diferido.
- Punto 10 — instalaciones ligeras: posterior.
- Fase D — reconocimiento automático, LiDAR, CAD/BIM/API, equipos, portal avanzado, white-label: posterior.
- 8B-C cubiertas inclinadas: diferido.
- FT3D-8 timeline de construcción: futura familia temporal separada.

---

## 6. Deuda e incidencias conocidas

- **R10 framing:** intermitencia/temporización bajo carga; reproducida en baseline y no regresión FT3D-3/4.
- **timeouts 1440 / software rendering:** minimapa M13, P13, P15 y P05 permanecen como deuda de QA/rendimiento previamente reproducida; no atribuirlos a FT3D-4 sin evidencia nueva.
- **M09 recuperación HDR:** fallo reproducido en `master@806e855` durante QA FT3D-4; deuda previa, no regresión FT3D-4.
- **Caso 31 Escape/Atrás:** timeout histórico ya reproducido en baseline durante FT3D-3.
- **professional-workspace bajo carga:** timeout aislado histórico reproducido en baseline.
- **render-budget bajo carga:** cancelación/timeout histórico reproducido en baseline.
- **Branch protection:** `master` sigue sin protección; resolver al final de la consolidación.
- **PR históricas #133–#149:** limpieza administrativa pendiente.
- **UX fachada automática:** valorar más adelante si el criterio de default debe ponderar mejor la legibilidad/huecos; no reabrir FT3D-4 por ello sin decisión de producto.

---

## 7. Regla de control para agentes

1. Verificar HEAD de `master` antes de actuar.
2. Reconciliar trabajo existente; no reimplementarlo.
3. Toda integración es aditiva.
4. Separar implementado / integrado / validado / cerrado / diferido.
5. Tras cada misión: auditar → CI → integrar → actualizar documentación → recalcular pendientes → autorizar siguiente corte.
6. Mantener: **más contexto, no más falsa certeza**.

### Próximo trabajo autorizado

**FT3D-5 — axonometría / exploded del edificio: preparar primero el contrato exacto de alcance, geometría, separación de niveles, cámaras, Story, multipiso, interacción, accesibilidad, fallbacks, QA visual/browser, regresiones y DONE; después autorizar implementación.**

B2/B8 permanecen pendientes de validación real con OpenAI y se retomarán cuando la dependencia externa esté disponible. No reimplementarlos mientras no exista un defecto demostrado por la validación real.
