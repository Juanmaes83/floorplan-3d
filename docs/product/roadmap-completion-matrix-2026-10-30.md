# Matriz de cierre del roadmap — actualizado 31-10-2026

**Base funcional consolidada:** C4 integrado en `a6a44cd296b1c4c01a1ce272d19f51b4f188c9f0`.  
**Estado de control actual:** Fase C completa 4/4; FT3D-2 cerrado funcionalmente con 2a; próximo bloque = validaciones reales B2/B4/B8.  
**Decisión de producto:** 360 diferido formalmente; no bloquea Fase B.

## Convenciones

- **INTEGRADO:** contenido en `master`.
- **VALIDADO:** ha superado el QA requerido para el alcance.
- **VALIDACIÓN PENDIENTE:** integrado, pero falta prueba externa/humana necesaria para cierre.
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
| Cantidades / schedules | **INTEGRADO Y VALIDADO** | C1 |
| Presupuesto operativo | **INTEGRADO Y VALIDADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO Y VALIDADO** | C3 |
| Dossier económico | **INTEGRADO Y VALIDADO** | C4 |

**C está funcionalmente completa: 4/4.**

C4 quedó integrado mediante PR **#156** en `a6a44cd296b1c4c01a1ce272d19f51b4f188c9f0` y pasó CI remoto completo.

C4 cubre:

- `Dossier económico` en `ENTREGAR`;
- variantes Profesional / Cliente;
- autoridad de presentación en `FloorPlanBudgetPresentation.buildReport()`;
- no recálculo ni persistencia duplicada;
- origen de precio separado del estado de revisión;
- IVA `null` distinto de 0 % y totales no definitivos cuando corresponde;
- capítulos/partidas/subtotales/totales/warnings desde la autoridad canónica;
- integración A4/B1;
- print/PDF + CSV + JSON + BC3 existentes;
- corrección de los textos históricos falsos de presupuesto en `ENTREGAR`.

Contrato canónico:

`docs/product/c4-economic-dossier-contract-2026-10-31.md`

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

**Decisión FT3D-2:** no crear 2b. No existe un gap funcional demostrado.

---

# Orden operativo autorizado

```text
Fase C 4/4 integrada
        ↓
validaciones reales B2 / B4 / B8   ← AHORA
        ↓
correcciones sólo si la validación demuestra un defecto real
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
auditoría global
        ↓
cierres A / B / C / FT3D
        ↓
limpieza GitHub
        ↓
protección de master
```

**360 queda fuera de esta secuencia por decisión formal.**

---

# Deuda conocida que no debe confundirse con cortes funcionales

- R10 framing: inestabilidad de temporización CSS bajo carga.
- professional-workspace: timeout aislado reproducido en baseline bajo carga.
- render-budget: cancelación/timeout observada también en master base durante QA C4.
- Branch protection de `master`: pendiente al final de la consolidación.
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
- C mantenga C1–C4 integrados y validados;
- FT3D-1..7 estén integrados y validados;
- no existan regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- PR/ramas antiguas estén reconciliadas y limpiadas sin pérdida de trabajo.
