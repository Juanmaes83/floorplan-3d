# Estado operativo de producto e integración — actualizado 31-10-2026

**Fuente operativa de verdad para el trabajo actual.**  
**HEAD funcional con FT3D-3 integrado:** `18295e620ba0c19fff4e005449d763bf90342e92`.  
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
- **FT3D-3 — sección dinámica**.

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

Aporta:

- narrativa `section-open` integrada en el Story engine existente;
- descriptor puro `presentation-section-core.js` sin DOM, Three.js ni persistencia;
- selección determinista de sección por eje y candidatos 50/40/60;
- clipping vertical real sobre el edificio, sin recortar terreno/contexto/UI;
- caras de corte visuales derivadas del modelo, respetando huecos conocidos;
- cámara reversible overview → corte → frontal → apertura → overview seccionado;
- opt-in «Incluir sección dinámica», OFF por defecto y no persistido;
- minimapa con línea y dirección del corte;
- multipiso dentro del contrato actual de 2 niveles, sin inventar sección apilada;
- reduced motion, cancelación/restauración y continuidad hacia room-descent;
- QA unitario, navegador, móvil, multipiso, unsupported y vídeo ida/vuelta.

QA final reportado sobre `18295e6`:

- unitarias: **657 bien, 0 fallos, 2 omitidos**;
- `presentation-section`: **7/7**;
- `presentation-story`: **8/8**;
- professional-workspace **17/17**;
- project-first **5/5**;
- building-presentation **7/7**;
- capture-3d **3/3**;
- tour-video **2/2**;
- presentation-overview **4/4**;
- presentation-focus **2/2**;
- `presentation`: 54 comprobaciones válidas, 0 fallos de aserción, 4 cancelaciones por timeout bajo carga;
- CI remoto del PR #157: **7/7 workflows success**.

Comparación exacta contra `master@d476d20` confirmó que los seis casos problemáticos ya existían en baseline y no son regresiones FT3D-3:

- R10 framing a 1440;
- minimapa M13 a 1440;
- P13 a 1440;
- P15 diez ciclos/memoria;
- caso 31 Escape/Atrás;
- P05 a 1440.

Evidencia visual final generada sobre `18295e6`: checkpoints p=0/.25/.35/.50/.65/.75/1, estancia posterior, salida/restauración, 390×844, 844×390, ambas plantas, unsupported, vídeo forward y reverse. No se observó clipping residual, terreno recortado, corte invertido ni salto nuevo de cámara/FOV atribuible a FT3D-3.

Riesgo visual no bloqueante: en multipiso las otras plantas visibles se recortan con el mismo plano pero sólo la planta narrada recibe caras de corte. Una sección apilada conjunta pertenece a FT3D-5.

**Estado FT3D-3: INTEGRADO Y VALIDADO.**

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
| Presentación avanzada | **EN PROGRESO** | FT3D-1, 2 y 3 integrados; FT3D-4..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea el cierre de B |

### Validación real B4 — Vercel Blob

**31-10-2026 — VALIDADO REAL en producción.**

Se validó almacén Vercel Blob público conectado al proyecto, variables protegidas, redeploy READY, `POST /api/share` → 200, Blob → 200, `/api/view` → 200 y código incorrecto → 401. No fue necesario modificar código B4.

### Bloqueo externo temporal B2 / B8

B2 y B8 requieren `OPENAI_API_KEY` + créditos API para validación real. La dependencia externa queda aparcada hasta que pueda financiarse/configurarse el proveedor. No hay defecto funcional nuevo demostrado y no bloquea FT3D-4..7.

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
| FT3D-4 — alzado/fachada narrativa | **SIGUIENTE CORTE AUTORIZADO PARA ESPECIFICACIÓN** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

No se autoriza FT3D-2b: no existe gap demostrado que lo necesite.

---

## 4. Orden operativo autorizado

1. **FT3D-4 — alzado/fachada narrativa: especificar contrato exacto antes de implementación.**
2. FT3D-5 — axonometría/exploded.
3. FT3D-6 — plantillas.
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

- **R10 framing:** intermitencia/temporización bajo carga; reproducida en baseline y no regresión FT3D-3.
- **timeouts 1440 / software rendering:** minimapa M13, P13, P15, caso 31 y P05 reproducidos en `master@d476d20`; vigilar como deuda de QA/rendimiento, no atribuir a FT3D-3.
- **professional-workspace bajo carga:** timeout aislado histórico reproducido en baseline.
- **render-budget bajo carga:** cancelación/timeout histórico reproducido en baseline.
- **Branch protection:** `master` sigue sin protección; resolver al final de la consolidación.
- **PR históricas #133–#149:** limpieza administrativa pendiente.

---

## 7. Regla de control para agentes

1. Verificar HEAD de `master` antes de actuar.
2. Reconciliar trabajo existente; no reimplementarlo.
3. Toda integración es aditiva.
4. Separar implementado / integrado / validado / cerrado / diferido.
5. Tras cada misión: auditar → CI → integrar → actualizar documentación → recalcular pendientes → autorizar siguiente corte.
6. Mantener: **más contexto, no más falsa certeza**.

### Próximo trabajo autorizado

**FT3D-4 — alzado/fachada narrativa: preparar primero contrato exacto de alcance, reutilización del Story engine, cámaras, interacción, accesibilidad, multipiso, fallbacks, QA y DONE; después pasarlo a Claude para implementación.**

B2/B8 permanecen pendientes de validación real con OpenAI y se retomarán cuando la dependencia externa esté disponible. No reimplementarlos mientras no exista un defecto demostrado por la validación real.
