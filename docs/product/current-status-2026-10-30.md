# Estado operativo de producto e integración — 30-10-2026

**Estado:** fotografía operativa durante la consolidación de ramas.  
**Base verificada:** `master@de75f3019a4becfeeb8cb01e2d0118d79e8ba615`.  
**Sustituye como referencia operativa temporal** a `current-status-2026-10-28.md` para trabajo nuevo, sin borrar el valor histórico de ese documento.  
**Regla:** verificar siempre el HEAD real de `master` antes de actuar.

Este documento separa cuatro conceptos que no deben confundirse:

- **implementado:** existe código probado en una rama o PR;
- **integrado:** el contenido ya está en `master`;
- **validado:** ha superado la validación técnica/externa requerida para su alcance;
- **cerrado:** integración + validación + revisión humana/documentación final cuando corresponda.

La cadena de PR #133–#149 sigue apareciendo abierta en GitHub porque su contenido fue consolidado secuencialmente en `master` mediante commits de integración. Por tanto, el estado de producto se lee desde `master`, no desde el campo `merged` de esas PR. La limpieza administrativa de PR/ramas queda pendiente hasta terminar la consolidación.

---

## 1. Estado real de `master`

En `master@de75f301...` están ya integrados:

- Puntos 1–8 previamente cerrados, incluido 8C territorial;
- Punto 9 — UX profesional y descubribilidad;
- Project-First Fase A completa en su alcance A1–A4;
- Fase B, cortes B1–B8;
- Fase C, cortes C1–C3;
- documento de transferencia de conocimiento FT3D de PR #144.

No está todavía integrado en `master` ningún corte funcional FT3D.

Trabajo FT3D actual:

- **FT3D-1a reconciliado** sobre `master` consolidado en `integration/ft3d-1a-on-consolidated-master@9a21b2587139e4ef3ea377f7b71cca0bd541147e`;
- PR de integración **#153** abierta en draft contra `master` para ejecutar CI y revisión antes de integrar;
- PR #151: FT3D-1b implementado pero todavía apilado sobre 1a;
- `backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`: FT3D-2a protegido, no integrado.

### FT3D-1a — resultado de reconciliación

Claude reaplicó mediante cherry-pick los dos commits funcionales originales de #150 sobre `master@de75f301...`.

Resultado auditado:

- rama remota: `integration/ft3d-1a-on-consolidated-master`;
- HEAD: `9a21b2587139e4ef3ea377f7b71cca0bd541147e`;
- comparación con `master`: **2 commits ahead / 0 behind**;
- base de merge exacta: `de75f301...`;
- mismos 8 archivos funcionales de #150;
- sin pérdida de código del master consolidado;
- `renderSuspended` de Punto 9 y la guarda de cámara `storyRun` conviven;
- workflow existente preservado y job `presentation-story` añadido.

QA local reportado sobre la rama reconciliada:

- unitarias: **611/611**;
- FT3D-1a browser: **4/4**;
- vista general: **4/4**;
- foco: **2/2**;
- captura 3D: **3/3**;
- presentación de edificio: **7/7**;
- vídeo del recorrido: **2/2**;
- workspace profesional: **17/17**;
- encuadre: **10/11**, con R10 confirmado intermitente también en `master` bajo carga y por tanto tratado como baseline preexistente, no regresión de FT3D.

Pendiente antes de integrar FT3D-1a:

1. CI de PR #153, especialmente `presentation-story`;
2. revisión humana/visual del preview;
3. revisión final de integración antes de mover `master`.

---

## 2. Roadmap estratégico A / B / C — estado actual

Referencia estratégica: `rubik-competitive-benchmark-roadmap-2026-10-29.md`.

### Fase A — hacer visible el valor existente

La Fase A definida en §7 / §17 está **implementada e integrada en el alcance acordado** mediante A1–A4.

| Objetivo estratégico | Estado real | Corte |
|---|---|---|
| 7.1 Entregar con previews reales | **INTEGRADO** | A1 + A2 |
| 7.2 Analizar visual | **INTEGRADO** | A1 + A3 |
| 7.3 Dossier profesional automático | **INTEGRADO** | A4 |
| 7.4 Contexto visual permanente | **INTEGRADO** | A1 |
| 7.5 Galería de vistas | **INTEGRADO EN ALCANCE AUTOMÁTICO**; vistas guardadas manualmente siguen diferidas | A2 |
| 7.6 Informe emplazamiento + solar | **INTEGRADO** como análisis contextual orientativo | A3 |
| 7.7 Estilos profesionales | **INTEGRADO** en dossier | A4 |

**Lectura de cierre:** la implementación de Fase A puede considerarse completa en el alcance acordado. Falta el cierre canónico final: revisión humana sobre la base consolidada, actualización documental y limpieza de PR/ramas. Las vistas guardadas manualmente no bloquean este cierre porque A2 adoptó expresamente vistas automáticas como primer alcance.

### Fase B — hacer Rubik compartible y deseable

La cadena técnica B1–B8 está **integrada en `master`**, pero la Fase B estratégica todavía no debe declararse completamente cerrada.

| Capacidad | Estado real | Corte(s) | Pendiente para cierre |
|---|---|---|---|
| Servicio «Envíanos tu plano» | **INTEGRADO** | B5 | validación operativa del proceso humano real |
| Archivo para el cliente offline | **INTEGRADO** | B1 | cierre documental/humano |
| Share link cliente alojado | **INTEGRADO EN CÓDIGO** | B4 | prueba real con Vercel Blob y configuración `BLOB_READ_WRITE_TOKEN` |
| Render IA | **INTEGRADO EN CÓDIGO** | B2 | primera prueba real con OpenAI y `OPENAI_API_KEY` / `RUBIK_RENDER_TOKEN` |
| Vídeo de recorrido | **INTEGRADO** | B3 | revisión final en navegador/GPU representativos cuando proceda |
| Comentarios anclados | **INTEGRADO** | B6 | cierre documental/humano |
| Material board / moodboard | **INTEGRADO** | B7 | cierre documental/humano |
| Alternativas IA de materiales/estilo | **INTEGRADO EN CÓDIGO** | B8 | validación real de calidad con proveedor configurado |
| 360 / presentación avanzada del roadmap estratégico | **PARCIAL** | B3 + programa FT3D | vídeo existe; 360 no está implementado y Presentation Story sigue en integración |

**Conclusión B:** todos los cortes B1–B8 están incorporados, pero el objetivo estratégico de Fase B no está completamente cerrado mientras queden la validación real de servicios externos y la decisión sobre el hueco «360 / presentación avanzada». FT3D puede cubrir la parte de presentación avanzada; 360 debe implementarse o diferirse explícitamente para cerrar B sin ambigüedad.

### Fase C — convertir datos en valor económico

El roadmap estratégico §17 define cuatro objetivos. Actualmente hay **tres de cuatro implementados e integrados**.

| Objetivo estratégico | Estado real | Corte |
|---|---|---|
| Schedules / cantidades | **INTEGRADO** | C1 / PR #147 |
| Presupuesto operativo | **INTEGRADO** | C2 / PR #148 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 / PR #149 |
| Dossier económico | **NO IMPLEMENTADO** | pendiente |

Por tanto, Fase C no está en «2»: está en **3/4 capacidades estratégicas**. El siguiente corte lógico para completar C es un **C4 — dossier económico**, reutilizando cantidades, presupuesto, fuentes/trazabilidad y las salidas de Entregar/Dossier ya existentes.

La base BCCA gestionada por Rubik sigue fuera de alcance mientras su gate legal/técnico no esté resuelto; C3 funciona con BC3 aportado por el profesional y no necesita fingir una base oficial conectada.

---

## 3. Programa Flat-to-3D / Presentation Story — estado actual

Referencia: `flat-to-3d-presentation-knowledge-programme-2026-10-30.md`.

| Fase | Objetivo | Estado actual |
|---|---|---|
| FT3D-0 | investigación, cámaras, dolly zoom, progreso reversible | **CUBIERTO EN GRAN PARTE** por el documento, auditoría técnica y prueba real de 1a; cierre formal pendiente |
| FT3D-1 | plano vivo → 3D → primera estancia | **EN PROCESO**: 1a reconciliado y en gate CI/revisión; 1b implementado en #151 pero no integrado |
| FT3D-2 | motor reusable Presentation Story | **PRIMER CORTE IMPLEMENTADO, NO INTEGRADO**: FT3D-2a en backup `d300db8...` |
| FT3D-3 | sección dinámica | **NO IMPLEMENTADO** |
| FT3D-4 | alzado / fachada narrativa | **NO IMPLEMENTADO** |
| FT3D-5 | axonometría / edificio explotado | **NO IMPLEMENTADO** |
| FT3D-6 | plantillas por perfil | **NO IMPLEMENTADO** |
| FT3D-7 | salidas y compartición de Story | **NO IMPLEMENTADO COMO FASE FT3D**; puede reutilizar B1/B3/B4 cuando llegue |
| FT3D-8 | timeline de construcción | **FUTURO / FAMILIA SEPARADA**; requiere contrato temporal nuevo y aprobación específica |

### FT3D-1 — cortes actuales

- **FT3D-1a «Empezar desde el plano»**: reconciliado sobre el `master` consolidado en PR #153. Código local auditado; pendiente CI y revisión humana/visual antes de integrar.
- **FT3D-1b «Entrar en la estancia»**: implementado en #151 y validado sobre su base anterior; debe reconciliarse después de integrar 1a.
- **Cierre de FT3D-1**: requiere 1a + 1b en `master`, QA sobre la base consolidada y revisión humana de la continuidad visual completa.

### FT3D-2 — motor de historias

Existe el commit protegido `d300db8...` con el primer motor común de secuencias y reproductor. No debe incorporarse por cherry-pick ciego: primero deben quedar integrados 1a y 1b, después reconciliar 2a contra ese `master`.

Tras integrar 2a hay que comparar sus capacidades con el mínimo de FT3D-2 (secuencia, progreso, anterior/siguiente, autoplay, callbacks, captions, restauración, cámaras deterministas y edición de orden/selección). Sólo entonces se decidirá si FT3D-2 puede cerrarse o necesita un corte adicional.

### Qué falta para declarar completo el programa FT3D de presentación

Para el **núcleo de presentación Flat-to-3D**, el objetivo razonable de cierre es FT3D-0 a FT3D-7:

1. aprobar e integrar FT3D-1a;
2. integrar FT3D-1b y cerrar FT3D-1 con revisión humana;
3. reconciliar FT3D-2a y completar cualquier mínimo faltante de FT3D-2;
4. implementar FT3D-3 — sección dinámica;
5. implementar FT3D-4 — alzado/fachada narrativa;
6. implementar FT3D-5 — axonometría/edificio explotado;
7. implementar FT3D-6 — plantillas por perfil;
8. implementar FT3D-7 — salidas/compartición de Story reutilizando las capacidades existentes de Entregar;
9. auditoría global, rendimiento, accesibilidad, regresión y cierre documental.

**FT3D-8 no debe bloquear el cierre del núcleo de presentación.** El propio programa lo define como una familia futura separada que exige nuevas semánticas temporales.

---

## 4. Qué falta por integrar ahora mismo

Orden operativo vigente:

1. **FT3D-1a** — PR #153 reconciliada; pendiente CI + revisión humana/visual + promoción a `master`.
2. **FT3D-1b** — reconciliar sobre el nuevo `master` con 1a.
3. **FT3D-2a** — recuperar desde el backup y reconciliar después de 1a+1b.
4. **C4 dossier económico** — último objetivo no implementado de Fase C.
5. **Fase B: cierre del hueco 360/presentación avanzada** — decidir si FT3D satisface la parte «presentación avanzada» y si 360 se implementa o se difiere explícitamente.
6. **Validaciones externas de B2/B4/B8** — OpenAI real y Vercel Blob real cuando estén configurados.
7. **FT3D-3 a FT3D-7** — programa de presentación pendiente.
8. **Cierre documental y limpieza GitHub** — reconciliar PR abiertas #133–#153 con el `master` real, actualizar roadmap/estado y limpiar ramas sólo cuando sea seguro.

---

## 5. Qué NO debe confundirse con trabajo pendiente de esta integración

- **Punto 10 — instalaciones ligeras** sigue aprobado como desarrollo posterior; no forma parte del cierre A/B/C/FT3D actual.
- **Fase D** del roadmap estratégico (reconocimiento automático, LiDAR, CAD/BIM, API, equipos, portal avanzado, white-label) es posterior y no bloquea el cierre de A/B/C.
- **8B-C cubiertas inclinadas** continúa diferido por alcance y no reabre Punto 8.
- **FT3D-8 timeline de construcción** es una familia futura separada.

---

## 6. Criterio operativo para agentes

Antes de trabajar:

1. leer este estado y verificar el HEAD real de `master`;
2. distinguir «implementado», «integrado», «validado» y «cerrado»;
3. no eliminar capacidades existentes: toda integración FT3D y Project-First es aditiva;
4. no continuar una fase dependiente mientras su padre se esté reconciliando o validando;
5. no usar PR abiertas como autoridad si su contenido ya fue consolidado en `master`;
6. mantener la regla de producto: **más contexto, no más falsa certeza**.

### Estado durante el gate actual

Claude Code vuelve a estar pausado. `master` debe permanecer en `de75f301...` mientras PR #153 ejecuta CI y se realiza la revisión humana/visual de FT3D-1a. No iniciar FT3D-1b ni FT3D-2a hasta aprobar e integrar 1a.
