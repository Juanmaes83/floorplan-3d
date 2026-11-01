# Matriz de cierre del roadmap — actualizado 01-11-2026

**Base funcional consolidada:** FT3D-4 integrado en `e716ba920e26485ae112b8f12b342534dff34030`.  
**Estado de control actual:** Fase C completa 4/4; FT3D-1/2/3/4 integrados; B4 validado real; B2/B8 pendientes por dependencia externa de OpenAI; siguiente corte autorizado = **FT3D-5**.  
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
| Presentación avanzada | **EN PROGRESO** | FT3D-1..4 integrados; FT3D-5..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea Fase B |

## B4 — validación real cerrada

**31-10-2026 — VALIDADO REAL en producción con Vercel.** Se comprobó almacenamiento Blob real, deploy READY, `/api/share` y `/api/view` operativos y rechazo correcto de credencial inválida.

## B2 / B8 — dependencia externa aparcada

B2 y B8 siguen en **VALIDACIÓN EXTERNA PENDIENTE** hasta disponer de créditos OpenAI y `OPENAI_API_KEY` configurada como secreto Vercel. No reimplementar mientras no exista un defecto demostrado. Esta dependencia no bloquea FT3D-5..7.

## Decisión formal 360

**31-10-2026 — decisión de Juanma:** no desarrollar ahora un tour 360 específico. Sólo se reabrirá si aparece un caso de uso propio que justifique su coste.

Para cerrar Fase B quedan como gates reales:

- validación real B2/B8 con OpenAI cuando se desbloquee;
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

C4 quedó integrado mediante PR **#156** y mantiene `FloorPlanBudgetPresentation.buildReport()` como autoridad de presentación económica, sin recálculo ni persistencia duplicada.

---

# Flat-to-3D / Presentation Story

| Fase | Estado | Qué existe | Qué falta |
|---|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación + pruebas técnicas | cierre formal / presupuesto de rendimiento |
| FT3D-1 | **INTEGRADO Y VALIDADO TÉCNICAMENTE** | 1a + 1b en master | aceptación humana final / cierre documental |
| FT3D-2 | **INTEGRADO, VALIDADO Y COMPLETO** | 2a en `042c256b...`; PR #155 verde | nada funcional; no se requiere 2b |
| FT3D-3 | **INTEGRADO Y VALIDADO** | PR #157; `section-open`, clipping real, caps, minimapa, multipiso, reduced motion, QA final | nada funcional; sólo riesgo visual no bloqueante multipiso sin caps en plantas no narradas |
| FT3D-4 | **INTEGRADO Y VALIDADO** | PR #158; `elevation-open`, core puro de fachadas, selector, frontal FOV 4°, Solar/contexto opcionales, multipiso, minimapa, mobile, QA final | nada funcional; sólo observaciones UX no bloqueantes |
| FT3D-5 | **SIGUIENTE CORTE AUTORIZADO PARA ESPECIFICACIÓN** | Story engine + infraestructura building ya disponibles | axonometría / edificio explotado |
| FT3D-6 | **DRAFT DISEÑADO Y APROBADO** | contrato draft en rama documental, catálogo declarativo + resolver conceptual | reconciliar tras FT3D-5 y convertir en contrato canónico antes de implementar |
| FT3D-7 | **PENDIENTE COMO FASE** | B1/B3/B4 reutilizables | Story + outputs/share/vídeo |
| FT3D-8 | **DIFERIDO / FUTURO** | — | contrato temporal explícito |

### Cierre FT3D-3

- Base: `d476d20c00f5be96f715d37fdf32b12d7a85be34`.
- HEAD integrado: `18295e620ba0c19fff4e005449d763bf90342e92`.
- PR: **#157**.
- Integración: fast-forward seguro de `master`, sin force.
- CI remoto: **7/7 workflows success**.
- Unitarias: **657 bien, 0 fallos, 2 omitidos**.
- Browser: `presentation-section` **7/7**, `presentation-story` **8/8**.
- Baseline confirmado para R10 framing, minimapa M13 1440, P13, P15, caso 31 y P05.
- Evidencia final: checkpoints, móvil, multipiso, unsupported y vídeos forward/reverse sobre el HEAD final.

**Decisión:** FT3D-3 queda **INTEGRADO Y VALIDADO**. No reabrir salvo regresión demostrada.

### Cierre FT3D-4

- Contrato: `docs/product/ft3d-4-elevation-facade-contract-2026-10-31.md`.
- Base: `806e8558a6459fe74ac55c8f7d0ab2d387eac5c8`.
- HEAD integrado: `e716ba920e26485ae112b8f12b342534dff34030`.
- PR: **#158**.
- Integración: fast-forward seguro de `master` con `force=false` y lease sobre la base exacta.
- CI remoto: **7/7 workflows success**.
- Unitarias canónicas: **690 bien, 0 fallos, 2 omitidos**.
- Browser FT3D-4: `presentation-elevation` **10/10** en una sola pasada sobre HEAD final.
- Regresiones: 15 suites ejecutadas, sin regresión nueva atribuible a FT3D-4.
- M09 recuperación HDR reproducido contra `806e855`; R10/M13/P13/P15/P05 permanecen como deuda previa conocida.
- Evidencia: **34 capturas + contact sheet**, mobile portrait/landscape, multipiso, Solar, contexto, unsupported y fachada alternativa.
- Vídeos: forward/reverse 1440×900 a 24 fps revisados mediante diferencias y hojas de contacto.
- Restore: JSON editable idéntico, Solar/contexto/levelView/minimapa/cámara recuperados.

Observaciones no bloqueantes:

- la fachada automática del fixture resulta casi ciega porque la regla contractual prioriza longitud;
- el caption Solar largo puede requerir scroll en 844×390;
- la aparición/desaparición multipiso usa escala vertical temporal, sin exploded ni cambio de offsets en las fases estables.

**Decisión:** FT3D-4 queda **INTEGRADO Y VALIDADO**. No reabrir salvo regresión demostrada o decisión explícita de producto sobre el criterio de fachada automática.

### FT3D-6 — diseño adelantado, no implementación

Rama documental: `docs/ft3d-6-profile-templates-contract`.  
HEAD draft revisado: `388c03b67b98fccef85e310dd2e7665514111b3d`.

El draft define cinco perfiles (Inmobiliaria, Promotora, Arquitectura, Reformas, Interiorismo), familias `scene/enhancement/resource/structure`, `required` separado de `minimumStory`, degradación honesta, multipiso, mobile, reduced motion y QA futuro.

**Estado:** draft aprobado como diseño; NO integrar como contrato canónico ni implementar hasta reconciliarlo con las APIs reales de FT3D-5.

---

# Orden operativo autorizado

```text
Fase C 4/4 integrada
        ↓
B4 validado real
        ↓
B2 / B8 aparcados temporalmente por dependencia externa OpenAI
        ↓
FT3D-1 / 2 / 3 / 4 integrados y validados
        ↓
FT3D-5 axonometría/exploded   ← AHORA: primero especificación/contrato
        ↓
reconciliar draft FT3D-6
        ↓
FT3D-6 plantillas
        ↓
FT3D-7 outputs/share
        ↓
reanudar B2 / B8 cuando OpenAI esté disponible
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

- R10 framing: inestabilidad de temporización bajo carga, reproducida en baseline.
- Minimapa M13 1440, P13, P15, caso 31 y P05: cancelaciones/timeouts de QA previos; no atribuir a FT3D-4 sin evidencia nueva.
- M09 recuperación HDR: reproducido en la base exacta `806e855` durante FT3D-4.
- professional-workspace: timeout aislado histórico reproducido en baseline bajo carga.
- render-budget: cancelación/timeout histórico reproducido en master base durante QA C4.
- Criterio UX de fachada automática: revisar sólo como decisión de producto, no como regresión FT3D-4.
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
