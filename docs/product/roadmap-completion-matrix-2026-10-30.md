# Matriz de cierre del roadmap — 30-10-2026

**Base observada:** `master@de75f3019a4becfeeb8cb01e2d0118d79e8ba615`  
**Propósito:** responder de forma operativa qué partes de A/B/C y del programa Flat-to-3D están integradas, cuáles están implementadas pero pendientes de validación/cierre y qué cortes faltan realmente.

Este documento no sustituye la estrategia de `rubik-competitive-benchmark-roadmap-2026-10-29.md`; la traduce a una matriz de ejecución y cierre.

## Convenciones

- **INTEGRADO:** el contenido está en `master`.
- **VALIDACIÓN PENDIENTE:** está en `master`, pero falta una prueba externa/humana necesaria para cerrar el alcance.
- **IMPLEMENTADO, NO INTEGRADO:** existe código en rama/PR/backup, pero no está en `master`.
- **PENDIENTE:** todavía no existe un corte funcional integrado.
- **DIFERIDO:** queda fuera del cierre actual por decisión de alcance.

---

# Fase A — estado de cierre

La Fase A estratégica está cubierta por A1–A4.

| Objetivo | Estado | Nota de cierre |
|---|---|---|
| Entregar con previews reales | **INTEGRADO** | A1+A2; vistas reales automáticas incluidas |
| Analizar visual | **INTEGRADO** | A1+A3 |
| Contexto visual permanente | **INTEGRADO** | A1 |
| Dossier automático | **INTEGRADO** | A4 |
| Galería de vistas | **INTEGRADO EN ALCANCE AUTOMÁTICO** | vistas manuales guardadas no forman parte del mínimo cerrado |
| Informe solar/emplazamiento | **INTEGRADO** | A3, orientativo y con fuentes/límites |
| Estilos profesionales | **INTEGRADO** | A4, aplicados al dossier |

## ¿Está A terminada?

**Sí en implementación.**

Para marcarla **CERRADA CANÓNICAMENTE** faltan únicamente:

1. revisión humana final sobre el `master` consolidado;
2. documentación de cierre con SHA final;
3. limpieza/reconciliación administrativa de PR/ramas A1–A4.

No hace falta otro corte funcional obligatorio para completar A.

---

# Fase B — estado de cierre

La cadena B1–B8 está integrada, pero el roadmap estratégico agrupa las capacidades de otra manera.

| Objetivo estratégico | Estado | Implementación relacionada | Qué falta |
|---|---|---|---|
| Servicio «Envíanos tu plano» | **INTEGRADO** | B5 | validación operativa real, no nuevo motor |
| Share cliente offline | **INTEGRADO** | B1 | cierre humano/documental |
| Share link alojado | **INTEGRADO / VALIDACIÓN PENDIENTE** | B4 | prueba real de Vercel Blob |
| Render IA | **INTEGRADO / VALIDACIÓN PENDIENTE** | B2 | prueba real con OpenAI configurado |
| Vídeo de recorrido | **INTEGRADO** | B3 | revisión final en entorno representativo si se exige |
| Comentarios anclados | **INTEGRADO** | B6 | cierre documental/humano |
| Moodboard / material board | **INTEGRADO** | B7 | cierre documental/humano |
| Alternativas IA de materiales/estilo | **INTEGRADO / VALIDACIÓN PENDIENTE** | B8 | calidad real con proveedor configurado |
| Presentación avanzada | **EN CURSO** | FT3D | 1a/1b/2a y fases posteriores |
| 360 | **PENDIENTE O A DIFERIR EXPLÍCITAMENTE** | ninguno | decisión de alcance |

## ¿Está B terminada?

**No todavía como fase estratégica cerrada.**

La implementación B1–B8 sí está incorporada, pero para cerrar B hay que resolver dos grupos:

### Validaciones externas

- B2/B8 con OpenAI real;
- B4 con Vercel Blob real.

### Alcance «presentación avanzada / 360»

El roadmap estratégico incluyó `360/presentación avanzada`. FT3D está cubriendo la parte de **presentación avanzada** con una dirección mucho más potente que un simple 360. Para cerrar B hay que decidir una de estas dos opciones:

- **Opción recomendada:** declarar FT3D como cumplimiento/evolución de «presentación avanzada» y **diferir 360** explícitamente;
- implementar además un corte 360 específico.

No recomiendo bloquear todo B por 360 si FT3D cumple mejor el objetivo de producto.

---

# Fase C — estado de cierre

El roadmap estratégico define cuatro resultados económicos.

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 recomendado |

## ¿Cuántos cortes de C tenemos realmente?

Tenemos **C1 + C2 + C3 integrados**.

Por tanto, el estado real de C es:

> **3 de 4 objetivos estratégicos implementados.**

## Corte que falta para cerrar C

### C4 — Dossier económico

Objetivo recomendado:

- incorporar resumen económico al flujo `ENTREGAR` / dossier;
- reutilizar `FloorPlanQuantities`, presupuesto C2 y procedencia/precios C3;
- mostrar total sólo cuando sea demostrable;
- distinguir sin precio / sin revisar / referencia / propio / revisado;
- incluir IVA sólo cuando esté definido;
- mostrar fuentes/trazabilidad;
- exportar una salida cliente/profesional coherente sin duplicar el presupuesto como nueva autoridad.

**C4 debería ser el último corte funcional obligatorio de Fase C.**

Después: QA + revisión humana + cierre documental.

---

# Flat-to-3D / Presentation Story — estado de cierre

El programa FT3D es más amplio que los cortes actualmente implementados.

| Fase | Estado | Qué existe hoy | Qué falta para cerrar |
|---|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación, auditoría de renderer/cámaras, dolly zoom y prueba 1a | registrar cierre formal y presupuesto final de rendimiento |
| FT3D-1 | **IMPLEMENTACIÓN PARCIAL / EN INTEGRACIÓN** | 1a implementado; 1b implementado | integrar 1a; integrar 1b; QA consolidado; revisión humana |
| FT3D-2 | **PRIMER CORTE IMPLEMENTADO, NO INTEGRADO** | 2a `d300db8...` | reconciliar tras 1a+1b y comprobar mínimos restantes |
| FT3D-3 | **PENDIENTE** | — | sección dinámica |
| FT3D-4 | **PENDIENTE** | — | alzado/fachada narrativa |
| FT3D-5 | **PENDIENTE** | — | axonometría/edificio explotado |
| FT3D-6 | **PENDIENTE** | — | plantillas por perfil |
| FT3D-7 | **PENDIENTE COMO FASE** | existen B1/B3/B4 reutilizables | integrar Story con capturas, paquete, share/vídeo según política |
| FT3D-8 | **DIFERIDO / FAMILIA FUTURA** | — | requiere modelo temporal explícito y nueva aprobación |

## Qué tenemos implementado ya de FT3D

### 1a — Plano → vivienda

Implementado en #150 y actualmente en reconciliación sobre `master` consolidado.

### 1b — Vista general → primera estancia

Implementado en #151. No está integrado todavía.

### 2a — motor/reproductor de historias

Implementado y protegido en:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

No debe integrarse hasta que 1a+1b estén consolidados.

## Qué falta para poder decir «FT3D completo»

Si por «completo» entendemos el **programa de presentación arquitectónica** y no la futura planificación temporal de obra, faltan estos hitos:

1. integrar y aprobar FT3D-1a;
2. integrar y aprobar FT3D-1b;
3. reconciliar FT3D-2a;
4. completar cualquier requisito mínimo de FT3D-2 que 2a aún no cubra;
5. FT3D-3 — sección dinámica;
6. FT3D-4 — alzado/fachada narrativa;
7. FT3D-5 — axonometría / edificio explotado;
8. FT3D-6 — plantillas por perfil;
9. FT3D-7 — salidas/compartición del Story;
10. auditoría global de rendimiento, accesibilidad, reversibilidad, móvil, multipiso y no-regresión;
11. cierre documental final.

**FT3D-8 no bloquea ese cierre**, porque el programa lo separa como futura familia temporal de obra.

---

# Orden recomendado desde hoy

```text
MASTER CONSOLIDADO
        ↓
FT3D-1a
        ↓
FT3D-1b
        ↓
FT3D-2a
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

C4 puede adelantarse o retrasarse respecto a FT3D-2a si se trabaja en una rama completamente independiente, pero no debe interferir con Presentación mientras siga la reconciliación FT3D.

---

# Definición de «todo terminado» para el bloque actual

El bloque A/B/C/FT3D puede declararse cerrado cuando:

- A esté documentada como cerrada tras revisión del master consolidado;
- B tenga sus validaciones externas resueltas y 360 implementado o diferido explícitamente;
- C tenga C4 dossier económico;
- FT3D-1..7 estén integrados y validados;
- no haya regresiones nuevas respecto a las capacidades previas;
- la integración siga siendo aditiva;
- roadmap y current-status reflejen el HEAD real;
- PR y ramas antiguas estén reconciliadas/limpiadas sin perder trabajo.
