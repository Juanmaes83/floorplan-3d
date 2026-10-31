# Matriz de cierre del roadmap — actualizado 31-10-2026

**Base funcional consolidada:** FT3D-2 integrado en `042c256b5898b04b89749cdc1ab8b5ce9d29da10`.  
**Estado de control actual:** FT3D-2 cerrado funcionalmente con 2a; C4 especificado y autorizado para implementación.  
**Decisión de producto:** 360 diferido formalmente; no bloquea Fase B.

## Convenciones

- **INTEGRADO:** contenido en `master`.
- **VALIDADO:** ha superado el QA requerido para el alcance.
- **VALIDACIÓN PENDIENTE:** integrado, pero falta prueba externa/humana necesaria para cierre.
- **ESPECIFICADO / AUTORIZADO:** contrato cerrado, implementación aún no integrada.
- **PENDIENTE:** todavía no existe el corte funcional.
- **DIFERIDO:** fuera del cierre actual por decisión de alcance; no bloquea el bloque correspondiente.

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

**A está completa en implementación.** Para cierre canónico faltan revisión humana final, documento de cierre y limpieza administrativa de PR/ramas A1–A4.

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
| Presentación avanzada | **EN PROGRESO** | FT3D-1 y FT3D-2 integrados; FT3D-3..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea Fase B |

## Decisión formal 360

**31-10-2026 — decisión de Juanma:** no desarrollar ahora un tour 360 específico.

Presentation Story/FT3D tiene prioridad. 360 sólo se reabrirá si aparece un caso de uso propio que justifique su coste.

Para cerrar Fase B quedan como gates reales:

- validación real B2/B8 con OpenAI/proveedor;
- validación real B4 con Vercel Blob;
- completar presentación avanzada mediante FT3D;
- cierres humanos/documentales aplicables.

---

# Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **ESPECIFICADO / AUTORIZADO** | C4 |

**C está en 3/4 integrada.** C4 ya tiene contrato canónico:

`docs/product/c4-economic-dossier-contract-2026-10-31.md`

El contrato fija:

- edición en `PRESUPUESTAR`, entrega en `ENTREGAR`;
- autoridad de presentación = `FloorPlanBudgetPresentation.buildReport()`;
- sin recálculo ni persistencia duplicada;
- origen de precio `Sin precio / Referencia / Propio` separado del estado `Pendiente / Revisado`;
- IVA `null` distinto de 0 %;
- capítulos, subtotales, totales y warnings exclusivamente desde el report canónico;
- variante profesional y cliente;
- integración aditiva con dossier A4 y B1;
- reutilización de print/PDF, CSV, JSON y BC3 existentes;
- criterios de aceptación, casos límite, QA y DONE explícitos.

Cuando C4 se implemente, valide e integre, Fase C podrá pasar a **4/4**.

---

# Flat-to-3D / Presentation Story

| Fase | Estado | Qué existe | Qué falta |
|---|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación + pruebas técnicas | cierre formal / presupuesto de rendimiento |
| FT3D-1 | **INTEGRADO Y VALIDADO TÉCNICAMENTE** | 1a + 1b en master | aceptación humana final / cierre documental |
| FT3D-2 | **INTEGRADO, VALIDADO Y COMPLETO** | 2a en `042c256b...`; PR #155 verde | nada funcional; no se requiere 2b |
| FT3D-3 | **PENDIENTE** | — | sección dinámica |
| FT3D-4 | **PENDIENTE** | — | alzado/fachada narrativa |
| FT3D-5 | **PENDIENTE** | — | axonometría / edificio explotado |
| FT3D-6 | **PENDIENTE** | — | plantillas por perfil |
| FT3D-7 | **PENDIENTE COMO FASE** | B1/B3/B4 reutilizables | Story + outputs/share/vídeo |
| FT3D-8 | **DIFERIDO / FUTURO** | — | contrato temporal explícito |

## FT3D-2 — cierre técnico

PR #155 integró un solo commit, 8 archivos, +347/-63 y CI remoto completamente verde.

Mínimos FT3D-2:

| Mínimo | Estado |
|---|---|
| Secuencia de escenas | **CUBIERTO** |
| Control por progreso | **CUBIERTO** |
| Siguiente/anterior | **CUBIERTO** |
| Reproducción automática / pausa | **CUBIERTO** |
| Entrada/salida reusable | **CUBIERTO** por `enterScene()` + `finishStory()`/`closeStory()` |
| Captions/contador | **CUBIERTO** |
| Restauración de estado | **CUBIERTO Y VALIDADO** |
| Cámaras deterministas | **CUBIERTO** (`fromStop/fromRegion`) |
| Orden/selección sin editar geometría | **CUBIERTO** por plan de Presentación |

**Decisión:** no crear FT3D-2b. No existe un gap funcional demostrado.

Checkpoint de control:

`checkpoint/post-ft3d-2-pre-c4-2026-10-31`

---

# Orden operativo autorizado

```text
FT3D-2 integrado y cerrado funcionalmente
        ↓
C4 dossier económico   ← AHORA
        ↓
auditoría ChatGPT + CI + integración
        ↓
Fase C 4/4 si pasa gates
        ↓
validaciones B2/B4/B8
        ↓
FT3D-3 sección
        ↓
FT3D-4 fachada
        ↓
FT3D-5 axonometría
        ↓
FT3D-6 plantillas
        ↓
FT3D-7 outputs/share
        ↓
auditoría y cierres A/B/C/FT3D
```

**360 queda fuera de esta secuencia por decisión formal.**

---

# Deuda conocida que no debe confundirse con cortes funcionales

- R10 framing: inestabilidad de temporización CSS bajo carga.
- professional-workspace: timeout aislado reproducido en baseline bajo carga.
- Branch protection de `master`: valorar al final de la consolidación.
- PR históricas #133–#149: limpieza administrativa pendiente.
- 8B-C cubiertas inclinadas: diferido.
- 360: diferido por alcance.
- Punto 10 y Fase D: posteriores.
- FT3D-8: familia futura separada.

---

# Definición de «todo terminado» para el bloque actual

El bloque A/B/C/FT3D puede declararse cerrado cuando:

- A esté cerrada documentalmente tras revisión final;
- B tenga B2/B4/B8 validados, presentación avanzada cubierta por FT3D y cierres humanos/documentales; 360 no es requisito;
- C tenga C4 integrado y validado;
- FT3D-1..7 estén integrados y validados;
- no existan regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- PR/ramas antiguas estén reconciliadas y limpiadas sin pérdida de trabajo.
