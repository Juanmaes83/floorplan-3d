# Estado operativo de producto e integración — 30-10-2026

**Fuente operativa de verdad para el trabajo actual.**  
**Base verificada:** `master@f10b3a0d261b73bbb46e3de98d7111dad45f1a09`.  
Verificar siempre el HEAD real de `master` antes de ejecutar trabajo.

Este documento distingue:

- **implementado:** existe código probado en rama/PR;
- **integrado:** el contenido está en `master`;
- **validado:** ha superado el QA requerido para el alcance;
- **cerrado:** integración + validación + revisión humana/documentación final cuando corresponda.

---

## 1. Estado real de `master`

En `master@f10b3a0d...` están integrados:

- Puntos 1–8 previamente cerrados, incluido 8C territorial;
- Punto 9 — UX profesional y descubribilidad;
- Project-First Fase A, cortes A1–A4;
- Fase B, cortes B1–B8;
- Fase C, cortes C1–C3;
- programa de conocimiento Flat-to-3D de PR #144;
- **FT3D-1a — «Empezar desde el plano»**, integrado mediante PR #153.

La PR #153 quedó marcada por GitHub como merged en `f10b3a0d...`.

### QA de FT3D-1a integrado

Validación local previa a integración:

- unitarias: 611/611;
- FT3D-1a browser: 4/4;
- overview: 4/4;
- foco: 2/2;
- captura 3D: 3/3;
- building presentation: 7/7;
- tour video: 2/2;
- professional workspace: 17/17.

El caso R10 de framing mostró inestabilidad bajo carga y se reprodujo también sobre el `master` previo sin FT3D; queda clasificado como baseline preexistente, no regresión FT3D.

En CI remoto de PR #153 pasaron:

- `presentation-story`;
- `recorder-focus-and-labels` tras corregir un assert histórico obsoleto de B3;
- Guided experience;
- Project-First regressions;
- Point 6 solar and compatibility;
- Multiformat guided import;
- Point 8C-C;
- Point 8C-D.

La corrección del smoke de recorder no modifica producto: el test antiguo exigía que no existiera ningún texto «grabar/grabación/record», pero B3 añadió legítimamente el botón «Grabar vídeo». El test ahora comprueba que no quede abierto el diálogo de vídeo ni estado de grabación residual.

### Garantía aditiva de FT3D-1a

- opción desactivada por defecto;
- sin schema ni persistencia nueva;
- la Presentación existente conserva su comportamiento cuando FT3D está desactivado;
- mismo proyecto/geometría durante la transición;
- progreso determinista y reversible;
- `p=1` llega a la vista general existente;
- `renderSuspended` de Punto 9 y `storyRun` de FT3D conviven;
- reduced motion, móvil y dos plantas cubiertos por test.

**FT3D-1a está INTEGRADO y VALIDADO técnicamente.** No cierra por sí solo FT3D-1: falta FT3D-1b y revisión humana de la continuidad completa plano → vista general → primera estancia.

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
| Presentación avanzada | **EN PROGRESO** | programa FT3D |
| 360 | **NO IMPLEMENTADO / DECISIÓN PENDIENTE** | implementar o diferir explícitamente |

**Fase B no debe declararse cerrada todavía.** La recomendación es que FT3D satisfaga/evolucione la parte «presentación avanzada» y que 360 se implemente sólo si aporta valor independiente; en caso contrario, diferirlo expresamente.

### Fase C — valor económico

El roadmap estratégico tiene cuatro resultados económicos.

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 recomendado |

**Fase C está en 3/4.** El siguiente corte lógico es C4 — dossier económico, reutilizando cantidades, presupuesto, procedencia/precios y las salidas de Entregar sin crear una segunda autoridad económica.

La base BCCA gestionada sigue fuera de alcance mientras no exista gate legal/técnico resuelto. C3 trabaja honestamente con BC3 aportado por el profesional.

---

## 3. Programa Flat-to-3D / Presentation Story

Referencia: `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`.

| Fase | Estado actual |
|---|---|
| FT3D-0 — investigación/contrato | **CASI CUBIERTO**, cierre formal pendiente |
| FT3D-1 — plano → 3D → primera estancia | **PARCIALMENTE INTEGRADO**: 1a integrado; 1b implementado no integrado |
| FT3D-2 — motor reusable Story | **2a IMPLEMENTADO, NO INTEGRADO** |
| FT3D-3 — sección dinámica | **PENDIENTE** |
| FT3D-4 — alzado/fachada narrativa | **PENDIENTE** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

### FT3D-1a — INTEGRADO

PR de integración: #153.  
SHA canónico actual: `f10b3a0d261b73bbb46e3de98d7111dad45f1a09`.

Experiencia:

```text
plano 2D
→ muros/mobiliario ganan altura
→ lente/perspectiva se abre
→ vista general existente
→ Presentación existente
```

La revisión técnica del artefacto CI confirmó continuidad visual razonable en p=0, estados intermedios, p=1 y móvil. La revisión humana de FT3D-1 completa se hará después de incorporar 1b.

### FT3D-1b — SIGUIENTE CORTE A INTEGRAR

PR #151 / rama histórica `feat/ft3d-1b-room-descent`.

Ya está implementado sobre la cadena FT3D anterior y añade:

```text
vista general
→ descenso continuo
→ primera estancia seleccionada
```

Debe transportarse ahora sobre `master@f10b3a0d...`, reutilizando el trabajo existente. No debe reimplementarse 1a ni empezar desde cero.

### FT3D-2a — PROTEGIDO, NO INTEGRADO

Backup:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

Incluye el primer motor/reproductor de Story y convierte 1a/1b en escenas reutilizables. **No hacer cherry-pick ciego.** Primero consolidar 1b; después reconciliar 2a sobre el nuevo master y comparar con los mínimos de FT3D-2.

---

## 4. Orden operativo desde este estado

1. **FT3D-1b** — reconciliar sobre `master@f10b3a0d...`, QA y revisión.
2. **FT3D-2a** — reconciliar después de 1a+1b.
3. Decidir si FT3D-2 necesita corte adicional para completar mínimos.
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

## 6. Regla para agentes

1. Verificar HEAD de `master` antes de actuar.
2. No reimplementar trabajo existente: transportar/reconciliar cortes ya hechos.
3. Toda integración es aditiva: no eliminar funciones, rutas, modos, exports ni fallbacks existentes.
4. No avanzar un hijo FT3D hasta consolidar su padre.
5. Separar implementado / integrado / validado / cerrado.
6. No usar el estado «merged» de PR históricas como única autoridad cuando su contenido ya fue consolidado por otra vía.
7. Mantener la regla de producto: **más contexto, no más falsa certeza**.

### Próximo agente autorizado

El siguiente trabajo de Claude Code debe ser únicamente **FT3D-1b sobre el `master` actual**. FT3D-2a permanece congelado hasta terminar 1b.
