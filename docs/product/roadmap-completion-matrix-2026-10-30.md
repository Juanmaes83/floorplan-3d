# Matriz de cierre del roadmap — actualizado 31-10-2026

**Base funcional observada antes de esta actualización documental:** `master@579189df39513aca44e0a86b44ef4392f38173d2`  
**Propósito:** responder qué partes de A/B/C y Flat-to-3D están integradas, cuáles requieren validación y qué cortes faltan para declarar el bloque terminado.

## Convenciones

- **INTEGRADO:** contenido en `master`.
- **VALIDACIÓN PENDIENTE:** integrado, pero falta prueba externa/humana necesaria para cierre.
- **IMPLEMENTADO, NO INTEGRADO:** existe código en rama/PR/backup.
- **PENDIENTE:** no existe todavía el corte funcional.
- **DIFERIDO:** fuera del cierre actual por decisión de alcance.

---

# Fase A

| Objetivo | Estado |
|---|---|
| Entregar con previews reales | **INTEGRADO** |
| Analizar visual | **INTEGRADO** |
| Contexto visual permanente | **INTEGRADO** |
| Dossier automático | **INTEGRADO** |
| Galería de vistas automáticas | **INTEGRADO** |
| Informe solar/emplazamiento | **INTEGRADO** |
| Estilos profesionales | **INTEGRADO** |

## ¿Está A terminada?

**Sí en implementación.**

Para marcar A **CERRADA CANÓNICAMENTE** faltan:

1. revisión humana final del `master` consolidado;
2. documento de cierre con SHA final;
3. limpieza/reconciliación de PR/ramas A1–A4.

No hace falta otro corte funcional obligatorio.

---

# Fase B

| Objetivo estratégico | Estado | Qué falta |
|---|---|---|
| Archivo cliente offline | **INTEGRADO** | cierre documental/humano |
| Render IA | **INTEGRADO / VALIDACIÓN PENDIENTE** | OpenAI real |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO / VALIDACIÓN PENDIENTE** | Vercel Blob real |
| Servicio «Envíanos tu plano» | **INTEGRADO** | validar proceso humano |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO / VALIDACIÓN PENDIENTE** | proveedor real / calidad |
| Presentación avanzada | **PARCIALMENTE CUBIERTA** | FT3D-1 integrado; FT3D-2..7 pendientes |
| 360 | **PENDIENTE O DIFERIBLE** | decisión de alcance |

## ¿Está B terminada?

**No como fase estratégica cerrada.**

B1–B8 están incorporados, pero faltan:

- validación real de B2/B8 con OpenAI;
- validación real de B4 con Vercel Blob;
- resolver el objetivo `360 / presentación avanzada`.

Recomendación: FT3D debe contar como evolución de **presentación avanzada**. 360 sólo debería implementarse si aporta valor propio; si no, debe diferirse explícitamente para cerrar B sin ambigüedad.

---

# Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 recomendado |

## Estado real

**3 de 4 objetivos estratégicos implementados.**

### C4 recomendado — Dossier económico

Debe reutilizar las autoridades actuales, no crear otra:

- cantidades C1;
- presupuesto C2;
- procedencia/precios/BC3 C3;
- flujo `ENTREGAR` y dossier profesional existente.

Debe distinguir claramente:

- sin precio;
- referencia no revisada;
- precio propio;
- precio revisado;
- IVA definido/no definido;
- fuentes y trazabilidad.

Después de C4: QA + revisión humana + cierre documental.

---

# Flat-to-3D / Presentation Story

| Fase | Estado | Qué existe | Qué falta |
|---|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación + pruebas técnicas de 1a/1b | cierre formal/presupuesto rendimiento |
| FT3D-1 | **INTEGRADO Y VALIDADO TÉCNICAMENTE** | 1a + 1b en master | aceptación humana final / cierre documental |
| FT3D-2 | **2a IMPLEMENTADO, NO INTEGRADO** | backup `d300db8...` | auditar y reconciliar + comprobar mínimos restantes |
| FT3D-3 | **PENDIENTE** | — | sección dinámica |
| FT3D-4 | **PENDIENTE** | — | alzado/fachada narrativa |
| FT3D-5 | **PENDIENTE** | — | axonometría / edificio explotado |
| FT3D-6 | **PENDIENTE** | — | plantillas por perfil |
| FT3D-7 | **PENDIENTE COMO FASE** | B1/B3/B4 reutilizables | Story + outputs/share/vídeo |
| FT3D-8 | **DIFERIDO / FUTURO** | — | contrato temporal explícito |

## FT3D-1 — estado

**INTEGRADO y validado técnicamente.**

Secuencia consolidada:

```text
plano 2D
→ volumen 3D
→ vista general
→ descenso continuo
→ primera estancia
→ Presentación existente
```

QA local de 1b sobre el master consolidado:

- 614/614 unitarias;
- 6/6 FT3D browser;
- overview 4/4;
- foco 2/2;
- captura 3D 3/3;
- building presentation 7/7;
- vídeo 2/2;
- professional workspace 17/17.

CI remoto de integración #154:

- `presentation-story`: **success**;
- `recorder-focus-and-labels`: **success**;
- Guided, Project-First, Solar, Multiformat, 8C-C y 8C-D: **success**.

R10 de framing sigue siendo baseline intermitente reproducible también en el master base y no bloquea FT3D-1.

Para cierre canónico de FT3D-1 falta únicamente aceptación humana final de la experiencia completa y registro de cierre; no falta otro corte funcional dentro de esta fase.

## FT3D-2a — siguiente candidato

Protegido en:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

No debe integrarse por cherry-pick ciego. 2a fue construido antes de la consolidación final de 1a+1b y reestructura esas narrativas como escenas de un reproductor común.

**Gate actual:** ChatGPT debe auditar primero el diff de 2a y definir el transporte mínimo sobre el master actual. Hasta terminar esa auditoría, Claude no está autorizado a tocar 2a.

---

# Qué falta para «FT3D completo»

Si «completo» significa el programa de **presentación arquitectónica** y no la futura planificación temporal de obra:

1. auditar/reconciliar FT3D-2a;
2. completar cualquier mínimo faltante de FT3D-2;
3. FT3D-3 — sección dinámica;
4. FT3D-4 — alzado/fachada;
5. FT3D-5 — axonometría/exploded;
6. FT3D-6 — plantillas por perfil;
7. FT3D-7 — salidas/compartición;
8. auditoría global de rendimiento, accesibilidad, reversibilidad, móvil, multipiso y no-regresión;
9. cierre documental final.

**FT3D-8 no bloquea ese cierre.**

---

# Orden recomendado desde el estado actual

```text
master con FT3D-1 completo técnicamente
        ↓
auditoría FT3D-2a
        ↓
reconciliación FT3D-2a
        ↓
¿hace falta FT3D-2b?
        ↓
C4 dossier económico
        ↓
validaciones B2/B4/B8
        ↓
decisión sobre 360
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

---

# Deuda conocida que no debe confundirse con cortes funcionales

- R10 framing: inestabilidad de temporización CSS bajo carga; deuda de test/transition.
- Branch protection de `master`: pendiente valorar al final de la consolidación.
- PR históricas #133–#149: limpieza administrativa pendiente tras estabilización.
- 8B-C cubiertas inclinadas: diferido.
- Punto 10 y Fase D: posteriores al cierre actual.

---

# Definición de «todo terminado» para el bloque actual

El bloque A/B/C/FT3D puede declararse cerrado cuando:

- A esté cerrada documentalmente tras revisión final;
- B tenga validaciones externas resueltas y 360 implementado o diferido explícitamente;
- C tenga C4;
- FT3D-1..7 estén integrados y validados;
- no existan regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- las PR/ramas antiguas estén reconciliadas y limpiadas sin pérdida de trabajo.
