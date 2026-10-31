# Estado operativo de producto e integración — actualizado 31-10-2026

**Fuente operativa de verdad para el trabajo actual.**  
**HEAD funcional consolidado de FT3D-1:** `579189df39513aca44e0a86b44ef4392f38173d2`.  
**HEAD documental vigente al autorizar FT3D-2a:** `master@41539c03b6749fdb261d1b72a5b5cc89d3245e5f`.  
Verificar siempre el HEAD real de `master` antes de ejecutar trabajo.

Estados usados:

- **implementado:** existe código probado en rama/PR/backup;
- **integrado:** el contenido está en `master`;
- **validado:** ha superado el QA requerido para el alcance;
- **cerrado:** integración + validación + revisión humana/documentación final cuando corresponda.

---

## 1. Estado real de `master`

Están integrados:

- Puntos 1–8 previamente cerrados, incluido 8C territorial;
- Punto 9 — UX profesional y descubribilidad;
- Project-First Fase A, cortes A1–A4;
- Fase B, cortes B1–B8;
- Fase C, cortes C1–C3;
- programa de conocimiento Flat-to-3D de PR #144;
- FT3D-1a — «Empezar desde el plano»;
- FT3D-1b — «Entrar en la estancia».

### FT3D-1 — estado consolidado

Secuencia integrada:

```text
plano 2D
→ volumen 3D
→ vista general
→ descenso continuo
→ primera estancia
→ Presentación existente
```

Garantías:

- FT3D es opcional y aditivo;
- sin schema ni persistencia nueva;
- con FT3D desactivado, la Presentación conserva su comportamiento previo;
- misma geometría/proyecto durante las narrativas;
- progreso determinista y reversible;
- reduced motion, móvil y dos plantas cubiertos;
- B3 «Grabar vídeo» convive con Story;
- building presentation, capturas, workspace profesional y navegación existente siguen disponibles.

QA local de 1b sobre master consolidado:

- unitarias 614/614;
- FT3D browser 6/6;
- overview 4/4;
- foco 2/2;
- captura 3D 3/3;
- building presentation 7/7;
- tour video 2/2;
- professional workspace 17/17;
- framing 10/11; R10 reproducido también en master base y clasificado como baseline intermitente de transición CSS.

CI remoto de PR #154: **success** en `presentation-story`, `recorder-focus-and-labels`, Guided experience, Project-First regressions, Point 6 solar, Multiformat guided import, Point 8C-C y Point 8C-D.

**FT3D-1 está INTEGRADO y VALIDADO TÉCNICAMENTE.** Falta únicamente aceptación humana final de la experiencia completa y registro formal de cierre; no falta otro corte funcional obligatorio dentro de FT3D-1.

---

## 2. Roadmap estratégico A / B / C

### Fase A

A1–A4 cubren el alcance aprobado: previews reales, Analizar visual, contexto permanente, dossier, galería automática, informe solar/emplazamiento y estilos profesionales.

**Estado:** implementación completa.  
**Pendiente de cierre:** revisión humana final, documento de cierre y limpieza administrativa de PR/ramas. Las vistas guardadas manualmente siguen como mejora posterior y no bloquean el mínimo aprobado.

### Fase B

B1–B8 están integrados.

| Capacidad | Estado | Pendiente de cierre |
|---|---|---|
| Archivo cliente offline | **INTEGRADO** | cierre humano/documental |
| Render IA | **INTEGRADO EN CÓDIGO** | prueba real con OpenAI |
| Vídeo de recorrido | **INTEGRADO** | revisión final representativa si se exige |
| Share link alojado | **INTEGRADO EN CÓDIGO** | prueba real con Vercel Blob |
| «Envíanos tu plano» | **INTEGRADO** | validar proceso humano real |
| Comentarios anclados | **INTEGRADO** | cierre humano/documental |
| Moodboard | **INTEGRADO** | cierre humano/documental |
| Alternativas IA | **INTEGRADO EN CÓDIGO** | prueba/calidad con proveedor real |
| Presentación avanzada | **PARCIALMENTE CUBIERTA** | FT3D-1 integrado; FT3D-2..7 pendientes |
| 360 | **NO IMPLEMENTADO / DECISIÓN PENDIENTE** | implementar o diferir explícitamente |

**Fase B no está cerrada.** Recomendación: FT3D satisface/evoluciona «presentación avanzada»; 360 sólo debe implementarse si aporta valor propio o diferirse expresamente.

### Fase C

| Objetivo | Estado | Corte |
|---|---|---|
| Cantidades / schedules | **INTEGRADO** | C1 |
| Presupuesto operativo | **INTEGRADO** | C2 |
| BC3 / tarifas / fuentes | **INTEGRADO** | C3 |
| Dossier económico | **PENDIENTE** | C4 |

**Fase C está en 3/4.** Falta C4 — dossier económico, reutilizando cantidades, presupuesto, procedencia/precios y `ENTREGAR`, sin crear una segunda autoridad económica.

---

## 3. Programa Flat-to-3D / Presentation Story

| Fase | Estado actual |
|---|---|
| FT3D-0 — investigación/contrato | **CASI CUBIERTO**, cierre formal pendiente |
| FT3D-1 — plano → 3D → primera estancia | **INTEGRADO Y VALIDADO TÉCNICAMENTE**; aceptación humana final pendiente |
| FT3D-2 — motor reusable Story | **2a IMPLEMENTADO Y AUTORIZADO PARA RECONCILIACIÓN** |
| FT3D-3 — sección dinámica | **PENDIENTE** |
| FT3D-4 — alzado/fachada narrativa | **PENDIENTE** |
| FT3D-5 — axonometría/exploded | **PENDIENTE** |
| FT3D-6 — plantillas por perfil | **PENDIENTE** |
| FT3D-7 — salidas/compartición Story | **PENDIENTE COMO FASE** |
| FT3D-8 — timeline construcción | **FUTURO / FAMILIA SEPARADA** |

### FT3D-2a — auditoría previa completada

Backup fuente:

`backup/ft3d-2a-pre-integration@d300db8c7756235409cc3a3386d45574a848ed2d`

Parent histórico exacto: `964026362ec939982f69081dc2dfbb522230ba3f` (FT3D-1b original).

2a añade 347 líneas y elimina 63 en 8 archivos. Su función es convertir 1a y 1b en escenas de un reproductor reusable y añadir «Ver la historia completa».

Capacidades verificadas contra el mínimo de FT3D-2:

- secuencia de escenas: **sí** (`sequence(weights)`);
- control por progreso global: **sí**;
- siguiente/anterior: **sí**;
- reproducción automática / pausa: **sí**;
- captions y contador: **sí**;
- restauración de estado: **heredada y probada en 1a/1b; debe revalidarse tras transporte**;
- cámaras deterministas: **sí**, incluido `fromStop/fromRegion`;
- orden/selección manual sin tocar geometría: **sí, derivado del plan configurado de Presentación**;
- callbacks/entrada-salida reutilizables: **debe verificarse explícitamente tras integración** para decidir si el motor cumple completamente este mínimo o necesita un 2b pequeño.

**PASS técnico esperado:** 2a ya demuestra una segunda narrativa sin duplicar el motor de transición. No se autoriza ningún desarrollo 2b durante la reconciliación de 2a.

### Protección y rama de trabajo

Checkpoint:

`checkpoint/post-ft3d-1-pre-ft3d-2-2026-10-31`

Rama autorizada:

`integration/ft3d-2a-on-consolidated-master`

La rama debe partir del HEAD documental vigente y transportar únicamente el commit `d300db8...` como primer intento. No reimplementar 1a/1b y no reemplazar archivos completos por versiones históricas.

---

## 4. Orden operativo autorizado

1. **FT3D-2a** — reconciliar en `integration/ft3d-2a-on-consolidated-master`.
2. QA local + vídeo determinista + comparación del diff con `9640263..d300db8`.
3. Claude pausa.
4. ChatGPT audita, abre gate CI, integra si procede y verifica el mínimo de FT3D-2.
5. Decidir si FT3D-2 queda cerrado con 2a o requiere un **2b mínimo**; no asumirlo antes de la auditoría.
6. **C4 — dossier económico**.
7. Validaciones reales B2/B4/B8.
8. Decisión explícita sobre 360.
9. FT3D-3 — sección dinámica.
10. FT3D-4 — alzado/fachada.
11. FT3D-5 — axonometría/exploded.
12. FT3D-6 — plantillas.
13. FT3D-7 — salidas/compartición.
14. Auditoría global y cierres A/B/C/FT3D.

---

## 5. Fuera del cierre actual

- Punto 10 — instalaciones ligeras: posterior.
- Fase D — reconocimiento automático, LiDAR, CAD/BIM/API, equipos, portal avanzado, white-label: posterior.
- 8B-C cubiertas inclinadas: diferido.
- FT3D-8 timeline de construcción: futura familia temporal separada.

---

## 6. Deuda e incidencias conocidas

- **R10 framing:** intermitencia de temporización CSS bajo carga; no es regresión FT3D.
- **Branch protection:** `master` sigue sin protección; valorar al final de la consolidación.
- **PR históricas #133–#149:** limpieza administrativa pendiente.

---

## 7. Regla de control para agentes

1. Verificar HEAD de `master` antes de actuar.
2. Reconciliar trabajo existente; no reimplementarlo.
3. Toda integración es aditiva.
4. No avanzar un hijo FT3D hasta consolidar su padre.
5. Separar implementado / integrado / validado / cerrado.
6. Tras cada misión de Claude: auditar → CI → integrar → actualizar documentación → recalcular pendientes → autorizar el siguiente corte.
7. Mantener: **más contexto, no más falsa certeza**.

### Próximo trabajo autorizado de Claude

**Únicamente FT3D-2a**, sobre `integration/ft3d-2a-on-consolidated-master`, siguiendo el transporte controlado del commit `d300db8...`. No iniciar FT3D-2b, FT3D-3 ni C4 durante esta misión.
