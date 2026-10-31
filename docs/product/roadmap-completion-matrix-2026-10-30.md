# Matriz de cierre del roadmap — actualizado 31-10-2026

**Base funcional consolidada:** C4 integrado en `a6a44cd296b1c4c01a1ce272d19f51b4f188c9f0`.  
**Estado de control actual:** Fase C completa 4/4; FT3D-2 cerrado funcionalmente con 2a; B4 validado real; B2/B8 pendientes por dependencia externa de OpenAI; siguiente corte autorizado = FT3D-3.  
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
| Render IA | **INTEGRADO / VALIDACIÓN EXTERNA PENDIENTE** | OpenAI real cuando haya créditos + `OPENAI_API_KEY` |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO Y VALIDADO REAL** | cierre documental/humano |
| Servicio «Envíanos tu plano» | **INTEGRADO** | validar proceso humano |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO / VALIDACIÓN EXTERNA PENDIENTE** | OpenAI real + revisión de calidad cuando haya créditos + `OPENAI_API_KEY` |
| Presentación avanzada | **EN PROGRESO** | FT3D-1 y FT3D-2 integrados; FT3D-3..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea Fase B |

## B4 — validación real cerrada

**31-10-2026 — VALIDADO REAL en producción con Vercel.**

Se comprobó:

- almacén Blob real conectado al proyecto;
- despliegue de producción `READY` sobre el `master` canónico;
- `POST /api/share` → **200**;
- Blob publicado → **200** y contenido correcto;
- `/api/view?f=...` → **200** y contenido correcto;
- código incorrecto → **401 / token**;
- no fue necesario cambiar el código B4.

B4 deja de ser gate pendiente.

## B2 / B8 — dependencia externa aparcada

B2 y B8 comparten la validación real con OpenAI mediante `api/render.js`.

**31-10-2026:** la cuenta de proveedor no dispone todavía de créditos/saldo operativo y `OPENAI_API_KEY` no está configurada. Esta situación es una **dependencia externa temporal**, no un defecto demostrado del producto.

Decisión operativa:

- mantener B2/B8 como **VALIDACIÓN EXTERNA PENDIENTE**;
- no reimplementar código mientras la validación real no demuestre un defecto;
- reanudar las pruebas cuando haya créditos y se configure `OPENAI_API_KEY` como secreto Vercel;
- **no bloquear FT3D-3..7 por esta dependencia externa**;
- B2/B8 siguen siendo requisitos para el cierre final de Fase B.

## Decisión formal 360

**31-10-2026 — decisión de Juanma:** no desarrollar ahora un tour 360 específico.

Presentation Story/FT3D tiene prioridad. 360 sólo se reabrirá si aparece un caso de uso propio que justifique su coste.

Para cerrar Fase B quedan como gates reales:

- validación real B2/B8 con OpenAI/proveedor cuando se desbloquee la dependencia externa;
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
| FT3D-3 | **SIGUIENTE CORTE AUTORIZADO** | — | sección dinámica |
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
B4 validado real
        ↓
B2 / B8 aparcados temporalmente por dependencia externa OpenAI
        ↓
FT3D-3 sección   ← AHORA
        ↓
FT3D-4 fachada
        ↓
FT3D-5 axonometría
        ↓
FT3D-6 plantillas
        ↓
FT3D-7 outputs/share
        ↓
reanudar B2 / B8 cuando OpenAI esté disponible (si aún siguen pendientes)
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
- B tenga B2/B8 validados, B4 ya validado real, presentación avanzada cubierta por FT3D y cierres humanos/documentales; 360 no es requisito;
- C mantenga C1–C4 integrados y validados;
- FT3D-1..7 estén integrados y validados;
- no existan regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- PR/ramas antiguas estén reconciliadas y limpiadas sin pérdida de trabajo.
