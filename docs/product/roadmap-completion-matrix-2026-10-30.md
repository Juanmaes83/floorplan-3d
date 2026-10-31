# Matriz de cierre del roadmap — actualizado 31-10-2026

**Base funcional consolidada:** FT3D-1 integrado en `579189df39513aca44e0a86b44ef4392f38173d2`.  
**Estado de control actual:** FT3D-2a auditado y autorizado para reconciliación controlada.  
**Decisión de producto:** 360 diferido formalmente; no bloquea Fase B.

## Convenciones

- **INTEGRADO:** contenido en `master`.
- **VALIDACIÓN PENDIENTE:** integrado, pero falta prueba externa/humana necesaria para cierre.
- **IMPLEMENTADO, NO INTEGRADO:** existe código en rama/PR/backup.
- **AUTORIZADO PARA RECONCILIACIÓN:** auditado y con rama de integración preparada, pero aún no integrado.
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
| Presentación avanzada | **PARCIALMENTE CUBIERTA** | FT3D-1 integrado; FT3D-2..7 pendientes |
| 360 | **DIFERIDO POR ALCANCE** | no bloquea Fase B |

## Decisión formal 360

**31-10-2026 — decisión de Juanma:** no desarrollar ahora un tour 360 específico.

Motivo: Presentation Story/FT3D ofrece una evolución de presentación más potente y prioritaria. El 360 queda conservado como posibilidad futura, pero sólo se reabrirá si aparece un caso de uso propio que justifique su coste.

**Consecuencia:** para cerrar Fase B ya no hace falta implementar 360. Quedan como gates reales:

- validación real de B2/B8 con OpenAI/proveedor;
- validación real de B4 con Vercel Blob;
- completar la parte de presentación avanzada mediante FT3D;
- cierres humanos/documentales aplicables.

---

# Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 |

**C está en 3/4.** Falta C4 — dossier económico reutilizando C1+C2+C3 y `ENTREGAR`.

---

# Flat-to-3D / Presentation Story

| Fase | Estado | Qué existe | Qué falta |
|---|---|---|---|
| FT3D-0 | **CASI CUBIERTO** | investigación + pruebas técnicas 1a/1b | cierre formal / presupuesto de rendimiento |
| FT3D-1 | **INTEGRADO Y VALIDADO TÉCNICAMENTE** | 1a + 1b en master | aceptación humana final / cierre documental |
| FT3D-2 | **2a AUTORIZADO PARA RECONCILIACIÓN** | `d300db8...` + rama de integración | transportar, QA, CI y verificar callbacks |
| FT3D-3 | **PENDIENTE** | — | sección dinámica |
| FT3D-4 | **PENDIENTE** | — | alzado/fachada narrativa |
| FT3D-5 | **PENDIENTE** | — | axonometría / edificio explotado |
| FT3D-6 | **PENDIENTE** | — | plantillas por perfil |
| FT3D-7 | **PENDIENTE COMO FASE** | B1/B3/B4 reutilizables | Story + outputs/share/vídeo |
| FT3D-8 | **DIFERIDO / FUTURO** | — | contrato temporal explícito |

## FT3D-1

Secuencia consolidada:

```text
plano 2D
→ volumen 3D
→ vista general
→ descenso continuo
→ primera estancia
→ Presentación existente
```

QA local 1b: 614/614 unitarias, FT3D browser 6/6, overview 4/4, foco 2/2, captura 3D 3/3, building presentation 7/7, vídeo 2/2, professional workspace 17/17.

CI remoto #154: `presentation-story`, `recorder-focus-and-labels`, Guided, Project-First, Solar, Multiformat, 8C-C y 8C-D: **success**.

R10 framing sigue clasificado como baseline intermitente, no regresión FT3D.

## FT3D-2a — auditoría completada

Fuente protegida:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

Parent histórico: `964026362ec939982f69081dc2dfbb522230ba3f`.

Rama preparada:

`integration/ft3d-2a-on-consolidated-master`

Checkpoint:

`checkpoint/post-ft3d-1-pre-ft3d-2-2026-10-31`

2a cubre los mínimos de FT3D-2 de esta manera:

| Mínimo FT3D-2 | Estado en 2a |
|---|---|
| Secuencia de escenas | **CUBIERTO** |
| Control por progreso | **CUBIERTO** |
| Siguiente/anterior | **CUBIERTO** |
| Reproducción automática opcional | **CUBIERTO** |
| Callbacks de entrada/salida | **VERIFICAR TRAS INTEGRAR** |
| Captions | **CUBIERTO** |
| Restauración de estado | **CUBIERTO POR ARQUITECTURA; REVALIDAR** |
| Cámaras deterministas | **CUBIERTO** (`fromStop/fromRegion`) |
| Orden/selección manual sin editar geometría | **CUBIERTO** mediante el plan de Presentación |

El PASS técnico —segunda narrativa sin duplicar el motor— está demostrado conceptualmente por 2a. Tras integrarlo se decidirá si FT3D-2 se cierra con 2a o requiere un 2b mínimo. **No se autoriza construir 2b durante esta misión.**

---

# Orden operativo autorizado

```text
FT3D-1 integrado
        ↓
FT3D-2a reconciliación controlada   ← AHORA
        ↓
auditoría ChatGPT + CI
        ↓
¿FT3D-2 cerrado o 2b mínimo?
        ↓
C4 dossier económico
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

**360 queda fuera de esta secuencia por decisión formal; no bloquea Fase B ni el cierre actual.**

---

# Deuda conocida que no debe confundirse con cortes funcionales

- R10 framing: inestabilidad de temporización CSS bajo carga.
- Branch protection de `master`: valorar al final de la consolidación.
- PR históricas #133–#149: limpieza administrativa pendiente.
- 8B-C cubiertas inclinadas: diferido.
- **360:** diferido por alcance; reevaluable sólo si aporta valor independiente.
- Punto 10 y Fase D: posteriores.
- FT3D-8: familia futura separada.

---

# Definición de «todo terminado» para el bloque actual

El bloque A/B/C/FT3D puede declararse cerrado cuando:

- A esté cerrada documentalmente tras revisión final;
- B tenga validaciones externas B2/B4/B8 resueltas, presentación avanzada cubierta por FT3D y cierres humanos/documentales aplicables; **360 no es requisito**;
- C tenga C4;
- FT3D-1..7 estén integrados y validados;
- no existan regresiones nuevas;
- la integración siga siendo aditiva;
- roadmap/current-status reflejen el HEAD real;
- las PR/ramas antiguas estén reconciliadas y limpiadas sin pérdida de trabajo.
