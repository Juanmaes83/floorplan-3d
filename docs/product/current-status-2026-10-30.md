# Estado operativo de producto e integración — actualizado 31-10-2026

**Fuente operativa de verdad para el trabajo actual.**  
**HEAD funcional con C4 integrado:** `a6a44cd296b1c4c01a1ce272d19f51b4f188c9f0`.  
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
- FT3D-2a — motor reusable de Presentation Story y «Ver la historia completa».

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

La auditoría del ciclo de vida considera cubierto el mínimo de entrada/salida reusable mediante `enterScene()` + `finishStory()`/`closeStory()`.

CI remoto de #155: **success** en todos los workflows requeridos.

**FT3D-2 está INTEGRADO, VALIDADO TÉCNICAMENTE y FUNCIONALMENTE COMPLETO CON 2a. No se requiere FT3D-2b.**

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
| Archivo cliente offline | **INTEGRADO** | cierre humano/documental |
| Render IA | **INTEGRADO EN CÓDIGO / VALIDACIÓN EXTERNA PENDIENTE** | OpenAI real cuando haya créditos + `OPENAI_API_KEY`; no hay defecto de código demostrado |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO Y VALIDADO REAL** | cierre documental/humano |
| «Envíanos tu plano» | **INTEGRADO** | validar proceso humano real |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO EN CÓDIGO / VALIDACIÓN EXTERNA PENDIENTE** | proveedor OpenAI real + revisión de calidad cuando haya créditos + `OPENAI_API_KEY`; no hay defecto de código demostrado |
| Presentación avanzada | **EN PROGRESO** | FT3D-1 y FT3D-2 integrados; FT3D-3..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea el cierre de B |

### Validación real B4 — Vercel Blob

**31-10-2026 — VALIDADO REAL en producción.**

Configuración/QA realizado:

- almacén Vercel Blob `floorplan-3d-share` creado y conectado al proyecto `floorplan-3d`;
- región Blob `fra1`, acceso público según contrato B4;
- `BLOB_READ_WRITE_TOKEN` inyectado por Vercel como variable protegida de entorno;
- `RUBIK_RENDER_TOKEN` configurado como secreto del servidor;
- redeploy de producción del `master` canónico en estado `READY`;
- `POST /api/share` real → **200**;
- Blob publicado real → **200** con `text/html` correcto;
- `GET /api/view?f=...` → **200** y contenido esperado;
- código de acceso incorrecto → **401 / token**;
- no fue necesario modificar código B4.

**Conclusión:** B4 está integrado y validado externamente. Ya no es gate pendiente.

### Bloqueo externo temporal B2 / B8

B2 y B8 comparten `api/render.js` y requieren `OPENAI_API_KEY` + saldo/créditos de API de OpenAI para una validación real.

**Estado 31-10-2026:** la cuenta de proveedor todavía no puede financiarse/configurarse de forma operativa; esta dependencia externa se retomará cuando haya créditos disponibles. No se ha identificado ningún defecto funcional nuevo en el código de B2/B8.

**Decisión operativa:** B2/B8 permanecen abiertos como validación externa pendiente, pero **no bloquean avanzar con FT3D-3..7 mientras se resuelve la dependencia del proveedor**. Cuando OpenAI esté disponible, la validación B2/B8 se reanuda sin reimplementar código salvo defecto demostrado.

### Decisión formal de producto — 360

**Decisión de Juanma, 31-10-2026:** no desarrollar ahora un tour 360 específico.

Presentation Story/FT3D tiene prioridad. 360 sólo se reabrirá si aparece un caso de uso independiente que justifique su coste.

**Consecuencia:** 360 no bloquea Fase B.

### Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO Y VALIDADO** | C1 |
| Presupuesto operativo | **INTEGRADO Y VALIDADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO Y VALIDADO** | C3 |
| Dossier económico | **INTEGRADO Y VALIDADO** | C4 |

**Fase C está funcionalmente COMPLETA: 4/4.**

C4 quedó integrado mediante PR **#156** en `a6a44cd296b1c4c01a1ce272d19f51b4f188c9f0`.

C4 implementa:

- `Dossier económico` en `ENTREGAR`;
- variantes Profesional y Cliente;
- autoridad de presentación = `FloorPlanBudgetPresentation.buildReport()`;
- sin recálculo ni persistencia económica duplicada;
- origen de precio `Sin precio / Referencia / Propio` separado de `Pendiente / Revisado`;
- IVA `null` distinto de 0 % y total bruto sólo definitivo cuando el report lo permite;
- capítulos, partidas, subtotales, totales y warnings desde el report canónico;
- integración A4 y B1;
- print/PDF, CSV, JSON y BC3 reutilizando autoridades existentes;
- estado real del presupuesto en `ENTREGAR`, eliminando las frases históricas falsas de “no disponible”.

QA remoto de PR #156: **success** en Guided experience, Project-First regressions, Point 6 solar, Multiformat guided import, Point 8C-C, Point 8C-D e Integrated browser regressions.

QA local reportado por Claude: C4 19/19 unitarias, C4 browser 2/2, A4 2/2, B1 2/2, client-review 5/5, Project-First 5/5, budget-ui 4/4. Los únicos problemas observados se reprodujeron también en master base y permanecen como deuda conocida, no como regresión C4.

Contrato canónico conservado:

`docs/product/c4-economic-dossier-contract-2026-10-31.md`

---

## 3. Programa Flat-to-3D / Presentation Story

| Fase | Estado actual |
|---|---|
| FT3D-0 — investigación/contrato | **CASI CUBIERTO**, cierre formal pendiente |
| FT3D-1 — plano → 3D → primera estancia | **INTEGRADO Y VALIDADO TÉCNICAMENTE**; aceptación humana final pendiente |
| FT3D-2 — motor reusable Story | **INTEGRADO, VALIDADO Y COMPLETO CON 2a** |
| FT3D-3 — sección dinámica | **SIGUIENTE CORTE AUTORIZADO** |
| FT3D-4 — alzado/fachada narrativa | **PENDIENTE** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

No se autoriza FT3D-2b: no existe gap demostrado que lo necesite.

---

## 4. Orden operativo autorizado

1. **FT3D-3 — sección dinámica**.
2. FT3D-4 — alzado/fachada.
3. FT3D-5 — axonometría/exploded.
4. FT3D-6 — plantillas.
5. FT3D-7 — salidas/compartición.
6. **En paralelo / cuando se desbloquee OpenAI:** validaciones reales B2 / B8.
7. Auditoría global.
8. Cierres canónicos A / B / C / FT3D.
9. Limpieza GitHub y reconciliación administrativa de PR/ramas históricas.
10. Protección de `master`.

**B4 ya está validado real.**  
**B2/B8 siguen siendo gates de cierre de B, pero quedan temporalmente aparcados por dependencia externa y no bloquean FT3D.**  
**360 no forma parte de esta secuencia:** está formalmente diferido y no bloquea ningún cierre actual.

---

## 5. Vercel / validaciones externas

Proyecto Vercel conectado: `floorplan-3d` (`prj_x19F1PyprdHvDRbAv3lJW5GXlL0k`).

### B4

**VALIDADO REAL** en producción el 31-10-2026 mediante Vercel Blob y endpoints `/api/share` + `/api/view`.

### B2 / B8

Pendientes de validación real por dependencia externa de OpenAI:

- falta disponibilidad operativa de créditos/saldo API;
- después se configurará `OPENAI_API_KEY` como secreto Vercel;
- `RUBIK_RENDER_TOKEN` ya está preparado;
- la prueba deberá cubrir B2 render real y B8 cambios controlados de acabados/calidad.

No pegar claves ni secretos en documentación, GitHub o conversaciones.

---

## 6. Fuera del cierre actual

- Tour 360 específico: diferido por decisión formal de producto del 31-10-2026.
- Punto 10 — instalaciones ligeras: posterior.
- Fase D — reconocimiento automático, LiDAR, CAD/BIM/API, equipos, portal avanzado, white-label: posterior.
- 8B-C cubiertas inclinadas: diferido.
- FT3D-8 timeline de construcción: futura familia temporal separada.

---

## 7. Deuda e incidencias conocidas

- **R10 framing:** intermitencia de temporización CSS bajo carga; no es regresión FT3D.
- **professional-workspace bajo carga:** timeout aislado observado/reproducido en baseline; vigilar pero no atribuir automáticamente a trabajo nuevo.
- **render-budget bajo carga:** cancelación/timeout observada también en master base durante QA C4; no atribuida a C4.
- **Branch protection:** `master` sigue sin protección; valorar al final de la consolidación.
- **PR históricas #133–#149:** limpieza administrativa pendiente.

---

## 8. Regla de control para agentes

1. Verificar HEAD de `master` antes de actuar.
2. Reconciliar trabajo existente; no reimplementarlo.
3. Toda integración es aditiva.
4. Separar implementado / integrado / validado / cerrado / diferido.
5. Tras cada misión: auditar → CI → integrar → actualizar documentación → recalcular pendientes → autorizar siguiente corte.
6. Mantener: **más contexto, no más falsa certeza**.

### Próximo trabajo autorizado

**FT3D-3 — sección dinámica.**

B2/B8 permanecen pendientes de validación real con OpenAI y se retomarán cuando la dependencia externa de créditos/credencial esté disponible. No reimplementar B2/B8 mientras no exista un defecto demostrado por la validación real.
