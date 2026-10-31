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
| Render IA | **INTEGRADO EN CÓDIGO** | prueba real con OpenAI |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO EN CÓDIGO** | prueba real con Vercel Blob |
| «Envíanos tu plano» | **INTEGRADO** | validar proceso humano real |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO EN CÓDIGO** | prueba/calidad con proveedor real |
| Presentación avanzada | **EN PROGRESO** | FT3D-1 y FT3D-2 integrados; FT3D-3..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea el cierre de B |

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
| FT3D-3 — sección dinámica | **PENDIENTE** |
| FT3D-4 — alzado/fachada narrativa | **PENDIENTE** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

No se autoriza FT3D-2b: no existe gap demostrado que lo necesite.

---

## 4. Orden operativo autorizado

1. **Validaciones reales B2 / B4 / B8**.
2. FT3D-3 — sección dinámica.
3. FT3D-4 — alzado/fachada.
4. FT3D-5 — axonometría/exploded.
5. FT3D-6 — plantillas.
6. FT3D-7 — salidas/compartición.
7. Auditoría global.
8. Cierres canónicos A / B / C / FT3D.
9. Limpieza GitHub y reconciliación administrativa de PR/ramas históricas.
10. Protección de `master`.

**360 no forma parte de esta secuencia:** está formalmente diferido y no bloquea ningún cierre actual.

---

## 5. Vercel / validaciones externas

El conector Vercel está accesible para el proyecto `floorplan-3d` (`prj_x19F1PyprdHvDRbAv3lJW5GXlL0k`).

Se utilizará en las validaciones B para comprobar B4 / Vercel Blob y el entorno real correspondiente.

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

**Validaciones reales B2 / B4 / B8.** No iniciar FT3D-3 hasta cerrar la ronda de validación y decidir si B2/B4/B8 necesitan correcciones de código o sólo configuración/QA externo.
