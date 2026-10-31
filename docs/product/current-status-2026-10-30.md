# Estado operativo de producto e integración — actualizado 31-10-2026

**Fuente operativa de verdad para el trabajo actual.**  
**Base verificada antes de esta actualización documental:** `master@579189df39513aca44e0a86b44ef4392f38173d2`.  
Verificar siempre el HEAD real de `master` antes de ejecutar trabajo.

Este documento distingue:

- **implementado:** existe código probado en rama/PR;
- **integrado:** el contenido está en `master`;
- **validado:** ha superado el QA requerido para el alcance;
- **cerrado:** integración + validación + revisión humana/documentación final cuando corresponda.

---

## 1. Estado real de `master`

En `master@579189df...` están integrados:

- Puntos 1–8 previamente cerrados, incluido 8C territorial;
- Punto 9 — UX profesional y descubribilidad;
- Project-First Fase A, cortes A1–A4;
- Fase B, cortes B1–B8;
- Fase C, cortes C1–C3;
- programa de conocimiento Flat-to-3D de PR #144;
- FT3D-1a — «Empezar desde el plano»;
- **FT3D-1b — «Entrar en la estancia»**.

### FT3D-1a + 1b — estado consolidado

Secuencia funcional integrada:

```text
plano 2D
→ muros/mobiliario ganan altura
→ lente/perspectiva se abre
→ vista general existente
→ descenso continuo
→ primera estancia seleccionada
→ Presentación existente
```

Garantías preservadas:

- FT3D sigue siendo opcional y aditivo;
- sin schema ni persistencia nueva;
- con FT3D desactivado, la Presentación conserva su comportamiento previo;
- misma geometría/proyecto durante las narrativas;
- progreso determinista y reversible;
- reduced motion cubierto;
- móvil y dos plantas cubiertos;
- B3 «Grabar vídeo» convive con Story;
- building presentation, capturas, workspace profesional y navegación existente permanecen disponibles.

### QA consolidado de FT3D-1b antes de integración

Validación local sobre el `master` consolidado:

- unitarias: 614/614;
- FT3D 1a+1b browser: 6/6;
- overview: 4/4;
- foco: 2/2;
- captura 3D: 3/3;
- building presentation: 7/7;
- tour video: 2/2;
- professional workspace: 17/17;
- framing: 10/11; R10 se reprodujo también en el `master` base y sigue clasificado como baseline intermitente de transición CSS, no regresión FT3D.

En CI remoto de PR #154 pasaron:

- `presentation-story`;
- `recorder-focus-and-labels`;
- Guided experience;
- Project-First regressions;
- Point 6 solar and compatibility;
- Multiformat guided import;
- Point 8C-C;
- Point 8C-D.

El vídeo determinista fotograma a fotograma de 1a+1b mostró la continuidad editor 2D → plano → vista general → descenso → estancia, manteniendo disponible B3 «Grabar vídeo».

**FT3D-1 está INTEGRADO y VALIDADO TÉCNICAMENTE.** Para cierre canónico queda una aceptación humana final de la experiencia completa y su registro documental de cierre; no queda otro corte funcional obligatorio dentro de FT3D-1.

---

## 2. Roadmap estratégico A / B / C

### Fase A — hacer visible el valor existente

A1–A4 cubren funcionalmente el alcance aprobado de Fase A.

| Objetivo | Estado |
|---|---|
| Entregar con previews reales | **INTEGRADO** |
| Analizar visual | **INTEGRADO** |
| Dossier profesional automático | **INTEGRADO** |
| Contexto visual permanente | **INTEGRADO** |
| Galería de vistas automáticas | **INTEGRADO** |
| Informe emplazamiento + solar | **INTEGRADO** |
| Estilos profesionales | **INTEGRADO** |

**Fase A: implementación completa.** Para cierre canónico faltan revisión humana final, documento de cierre y limpieza administrativa de ramas/PR antiguas. Las vistas guardadas manualmente siguen como mejora posterior y no bloquean el mínimo aprobado.

### Fase B — hacer Rubik compartible y deseable

B1–B8 están integrados en `master`.

| Capacidad | Estado | Pendiente de cierre |
|---|---|---|
| Archivo cliente offline | **INTEGRADO** | cierre humano/documental |
| Render IA | **INTEGRADO EN CÓDIGO** | prueba real con OpenAI configurado |
| Vídeo de recorrido | **INTEGRADO** | revisión representativa final cuando proceda |
| Share link alojado | **INTEGRADO EN CÓDIGO** | prueba real con Vercel Blob |
| «Envíanos tu plano» | **INTEGRADO** | validar proceso humano real |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO EN CÓDIGO** | prueba/calidad con proveedor real |
| Presentación avanzada | **PARCIALMENTE CUBIERTA** | FT3D-1 integrado; FT3D-2..7 pendientes |
| 360 | **NO IMPLEMENTADO / DECISIÓN PENDIENTE** | implementar o diferir explícitamente |

**Fase B no debe declararse cerrada todavía.** Recomendación: FT3D debe satisfacer/evolucionar la parte «presentación avanzada»; 360 sólo debe implementarse si aporta valor propio, o diferirse expresamente.

### Fase C — valor económico

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 recomendado |

**Fase C está en 3/4.** Falta C4 — dossier económico, reutilizando cantidades, presupuesto, procedencia/precios y las salidas de Entregar sin crear una segunda autoridad económica.

La base BCCA gestionada sigue fuera de alcance mientras no exista gate legal/técnico resuelto. C3 trabaja honestamente con BC3 aportado por el profesional.

---

## 3. Programa Flat-to-3D / Presentation Story

Referencia: `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`.

| Fase | Estado actual |
|---|---|
| FT3D-0 — investigación/contrato | **CASI CUBIERTO**, cierre formal pendiente |
| FT3D-1 — plano → 3D → primera estancia | **INTEGRADO Y VALIDADO TÉCNICAMENTE**; aceptación humana final pendiente |
| FT3D-2 — motor reusable Story | **2a IMPLEMENTADO, NO INTEGRADO** |
| FT3D-3 — sección dinámica | **PENDIENTE** |
| FT3D-4 — alzado/fachada narrativa | **PENDIENTE** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

### FT3D-2a — siguiente candidato, aún congelado

Backup protegido:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

Incluye el primer motor/reproductor común de Story y reestructura 1a/1b como escenas reutilizables. **No hacer cherry-pick ciego.** Antes de autorizar a Claude hay que auditar el diff de 2a contra la cadena histórica y decidir qué partes siguen siendo necesarias sobre el `master` actual con 1a+1b ya consolidados.

---

## 4. Orden operativo desde este estado

1. **Auditar FT3D-2a** contra el `master` actual y definir transporte/reconciliación mínima.
2. Reconciliar **FT3D-2a** sin reintroducir versiones antiguas de 1a/1b.
3. Decidir si FT3D-2 necesita un corte adicional para completar sus mínimos.
4. **C4 — dossier económico**.
5. Validaciones reales B2/B4/B8.
6. Decisión explícita sobre 360.
7. FT3D-3 — sección dinámica.
8. FT3D-4 — alzado/fachada.
9. FT3D-5 — axonometría/exploded.
10. FT3D-6 — plantillas.
11. FT3D-7 — salidas/compartición.
12. Auditoría global y cierres A/B/C/FT3D.

C4 puede trabajarse en paralelo sólo si está completamente aislado de Presentación; mientras se consolida FT3D, se prioriza no crear cruces innecesarios.

---

## 5. Qué no forma parte del cierre actual

- Punto 10 — instalaciones ligeras: posterior.
- Fase D estratégica — reconocimiento automático, LiDAR, CAD/BIM/API, equipos, portal avanzado, white-label: posterior.
- 8B-C cubiertas inclinadas: diferido por alcance, no reabre Punto 8.
- FT3D-8 timeline de construcción: familia futura separada; no bloquea el cierre del núcleo de Presentation Story.

---

## 6. Deuda e incidencias conocidas

- **R10 framing:** intermitencia al medir el ancho del editor durante una transición CSS bajo carga. Reproducido sobre master sin 1b; no es regresión FT3D. Debe estabilizarse más adelante como deuda de test/temporización.
- **Branch protection:** `master` sigue sin protección de rama. Valorar protección cuando termine la consolidación para evitar escrituras accidentales.
- **PR históricas #133–#149:** su contenido fue consolidado por commits de integración; la limpieza administrativa/closure queda pendiente.

---

## 7. Regla de control para agentes

1. Verificar HEAD de `master` antes de actuar.
2. No reimplementar trabajo existente: transportar/reconciliar cortes ya hechos.
3. Toda integración es aditiva: no eliminar funciones, rutas, modos, exports ni fallbacks existentes.
4. No avanzar un hijo FT3D hasta consolidar su padre.
5. Separar implementado / integrado / validado / cerrado.
6. No usar el estado `merged` de PR históricas como única autoridad cuando su contenido ya fue consolidado por otra vía.
7. Mantener la regla de producto: **más contexto, no más falsa certeza**.
8. Tras cada misión de Claude: auditar → CI → integrar → actualizar documentación → recalcular pendientes → autorizar el siguiente corte.

### Próximo trabajo potencial de Claude

**Todavía no autorizado hasta terminar la auditoría de FT3D-2a.** El candidato es FT3D-2a, pero ChatGPT debe definir primero el transporte seguro sobre el master consolidado con 1a+1b.
