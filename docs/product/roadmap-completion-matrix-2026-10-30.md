# Matriz de cierre del roadmap — 30-10-2026

**Base observada:** `master@de75f3019a4becfeeb8cb01e2d0118d79e8ba615`  
**Propósito:** responder qué partes de A/B/C y del programa Flat-to-3D están integradas, cuáles están implementadas pero pendientes de validación/cierre y qué cortes faltan realmente.

Este documento no sustituye la estrategia de `rubik-competitive-benchmark-roadmap-2026-10-29.md`; la traduce a una matriz operativa.

## Convenciones

- **INTEGRADO:** contenido en `master`.
- **VALIDACIÓN PENDIENTE:** integrado o reconciliado, pero falta un gate técnico/externo/humano necesario.
- **IMPLEMENTADO, NO INTEGRADO:** existe en rama/PR/backup, pero no está en `master`.
- **PENDIENTE:** todavía no existe el corte funcional.
- **DIFERIDO:** fuera del cierre actual por alcance.

---

# Resumen ejecutivo

| Bloque | Estado | Qué falta para cierre |
|---|---|---|
| Fase A | **IMPLEMENTACIÓN COMPLETA E INTEGRADA** | revisión humana final + documentación/limpieza |
| Fase B | **B1–B8 INTEGRADOS; CIERRE PENDIENTE** | OpenAI real B2/B8, Vercel Blob B4, decisión 360/presentación avanzada |
| Fase C | **3/4 OBJETIVOS INTEGRADOS** | C4 dossier económico |
| FT3D-1a | **RECONCILIADO, NO INTEGRADO** | PR #153 CI + revisión visual/humana + integración |
| FT3D-1b | **IMPLEMENTADO, NO INTEGRADO** | reconciliar después de 1a |
| FT3D-2a | **IMPLEMENTADO, PROTEGIDO, NO INTEGRADO** | reconciliar después de 1a+1b |
| FT3D-3..7 | **PENDIENTE** | implementar por fases |
| FT3D-8 | **DIFERIDO / FAMILIA FUTURA** | no bloquea el cierre del núcleo Presentation Story |

---

# Fase A — cierre

| Objetivo | Estado | Corte |
|---|---|---|
| Entregar con previews reales | **INTEGRADO** | A1+A2 |
| Analizar visual | **INTEGRADO** | A1+A3 |
| Contexto visual permanente | **INTEGRADO** | A1 |
| Dossier automático | **INTEGRADO** | A4 |
| Galería de vistas | **INTEGRADO EN ALCANCE AUTOMÁTICO** | A2 |
| Informe solar/emplazamiento | **INTEGRADO** | A3 |
| Estilos profesionales | **INTEGRADO** | A4 |

**Conclusión:** A no necesita otro corte funcional obligatorio. Para marcarla **CERRADA CANÓNICAMENTE** faltan revisión humana del master consolidado, documento de cierre y limpieza administrativa de A1–A4.

---

# Fase B — cierre

| Objetivo | Estado | Corte(s) | Pendiente |
|---|---|---|---|
| Archivo cliente offline | **INTEGRADO** | B1 | cierre humano/documental |
| Render IA | **INTEGRADO / VALIDACIÓN PENDIENTE** | B2 | prueba real OpenAI |
| Vídeo de recorrido | **INTEGRADO** | B3 | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO / VALIDACIÓN PENDIENTE** | B4 | prueba real Vercel Blob |
| «Envíanos tu plano» | **INTEGRADO** | B5 | validación operativa real |
| Comentarios anclados | **INTEGRADO** | B6 | cierre humano/documental |
| Moodboard/material board | **INTEGRADO** | B7 | cierre humano/documental |
| Alternativas IA | **INTEGRADO / VALIDACIÓN PENDIENTE** | B8 | calidad real con proveedor |
| Presentación avanzada | **EN CURSO** | FT3D | cerrar núcleo Presentation Story |
| 360 | **PENDIENTE O A DIFERIR** | — | decisión explícita |

**Conclusión:** B1–B8 están incorporados, pero B no está cerrada estratégicamente. La recomendación es que FT3D satisfaga/evolucione «presentación avanzada» y que 360 se implemente sólo si aporta valor suficiente; si no, diferirlo expresamente.

---

# Fase C — cierre

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 recomendado |

**Estado real:** **3 de 4 objetivos estratégicos implementados e integrados.**

### C4 recomendado — Dossier económico

Debe reutilizar cantidades, presupuesto y trazabilidad ya existentes para una salida en `ENTREGAR`/Dossier sin crear otra autoridad financiera. Debe distinguir total demostrable, partidas sin precio, referencia/propio/revisado, IVA y fuentes.

Después de C4: QA + revisión humana + cierre documental de C.

---

# Flat-to-3D / Presentation Story

| Fase | Estado | Situación actual |
|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación + prueba real 1a; cierre formal pendiente |
| FT3D-1 | **EN PROCESO** | 1a reconciliado; 1b implementado |
| FT3D-2 | **PRIMER CORTE IMPLEMENTADO** | 2a protegido en `d300db8...` |
| FT3D-3 | **PENDIENTE** | sección dinámica |
| FT3D-4 | **PENDIENTE** | alzado/fachada narrativa |
| FT3D-5 | **PENDIENTE** | axonometría/edificio explotado |
| FT3D-6 | **PENDIENTE** | plantillas por perfil |
| FT3D-7 | **PENDIENTE COMO FASE** | salidas/share Story; reutilizar B1/B3/B4 |
| FT3D-8 | **DIFERIDO** | timeline de obra requiere contrato temporal nuevo |

## FT3D-1a — gate actual

Rama reconciliada:

`integration/ft3d-1a-on-consolidated-master@9a21b2587139e4ef3ea377f7b71cca0bd541147e`

PR de integración:

`#153` → `master@de75f301...`

Auditoría de estructura:

- 2 commits ahead / 0 behind;
- mismo alcance de 8 archivos de #150;
- base consolidada preservada;
- sin conflictos de cherry-pick;
- sin adaptación funcional adicional;
- `renderSuspended` y `storyRun` coexisten;
- workflow de master preservado + job `presentation-story` añadido.

QA local reportado:

| Suite | Resultado |
|---|---:|
| Unitarias repo | **611/611** |
| FT3D-1a browser | **4/4** |
| Vista general | **4/4** |
| Foco | **2/2** |
| Captura 3D | **3/3** |
| Building presentation | **7/7** |
| Tour video | **2/2** |
| Professional workspace | **17/17** |
| Encuadre | **10/11**; R10 reproducido también en master bajo carga |

Para integrar 1a faltan únicamente:

1. CI de #153, especialmente `presentation-story`;
2. revisión humana/visual del preview;
3. promoción final a `master` tras auditoría del resultado.

## FT3D-1b

PR #151, implementado y probado sobre la base anterior. Debe reconciliarse **después** de integrar 1a; no se debe reimplementar.

## FT3D-2a

Protegido en:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

Debe reconciliarse después de 1a+1b. Entonces se comparará contra el mínimo FT3D-2 para decidir si basta 2a o hace falta un corte 2b.

## Qué falta para declarar «FT3D Presentation Story completo»

1. integrar/aprobar 1a;
2. integrar/aprobar 1b y cerrar FT3D-1;
3. reconciliar 2a y completar FT3D-2 si faltan mínimos;
4. FT3D-3 sección dinámica;
5. FT3D-4 alzado/fachada;
6. FT3D-5 axonometría/exploded;
7. FT3D-6 plantillas por perfil;
8. FT3D-7 salidas/compartición;
9. auditoría global de rendimiento, accesibilidad, móvil, multipiso, reversibilidad y no-regresión;
10. cierre documental.

**FT3D-8 no bloquea este cierre.**

---

# Orden operativo vigente

```text
master de75f301
        ↓
FT3D-1a · PR #153 · CI + revisión
        ↓
integrar 1a
        ↓
reconciliar/integrar 1b
        ↓
reconciliar/integrar 2a
        ↓
C4 dossier económico
        ↓
validaciones externas B2/B4/B8
        ↓
decisión explícita sobre 360
        ↓
FT3D-3
        ↓
FT3D-4
        ↓
FT3D-5
        ↓
FT3D-6
        ↓
FT3D-7
        ↓
auditoría y cierres A/B/C/FT3D
```

C4 puede moverse en el calendario si se mantiene totalmente aislado de la reconciliación de Presentación.

---

# Definición de «todo terminado» para el bloque actual

A/B/C/FT3D queda cerrado cuando:

- A esté documentada como cerrada tras revisión del master consolidado;
- B tenga validaciones externas resueltas y 360 implementado o diferido explícitamente;
- C tenga C4 dossier económico;
- FT3D-1..7 estén integrados y validados;
- no haya regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- PR/ramas antiguas estén reconciliadas o limpiadas sin pérdida de trabajo.
