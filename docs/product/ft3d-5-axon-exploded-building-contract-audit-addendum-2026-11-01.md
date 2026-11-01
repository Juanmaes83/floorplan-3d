# FT3D-5 — Adenda de auditoría V2 — cierre de 55 puntos

**Fecha:** 01-11-2026.

**Contrato principal consolidado:** `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md`.

**Base auditada:** `master@f74c4ee6bca58077a1135d4db2466e4332d0d5e7`.

**Estado:** **REGISTRO DE AUDITORÍA CERRADO — 55/55 puntos incorporados al contrato V2.**

Esta adenda ya no compite con el contrato principal. Su función es dejar trazabilidad del pre-flight realizado antes de gastar créditos en la implementación pesada.

Jerarquía:

```text
1. contrato FT3D-5 V2 consolidado
2. esta adenda como evidencia de auditoría / trazabilidad
3. prompt de implementación para workflow y autorización
```

Si una frase de esta adenda pareciera contradecir el contrato V2, prevalece el contrato V2.

---

## A. Resultado global

Los 55 problemas detectados se clasificaron y cerraron así:

- arquitectura/lifecycle: corregidos;
- ownership: corregido;
- Story dispatches: auditables obligatorios;
- descriptor/coordenadas: normalizados;
- gap/overlap: corregido;
- UI/reduced/accessibility: completado;
- QA/baseline/evidencia: completado;
- dependencies/offline: cerrado;
- rollback/memory/rebuild: añadido;
- p0/p1 exactos con `active→all`: resuelto contractualmente.

No queda ninguna de las 55 observaciones como decisión abierta para Claude.

---

## B. Registro 55/55

| # | Problema auditado | Cierre en contrato V2 |
|---:|---|---|
| 1 | El contrato antiguo decía “pendiente de autorización” mientras el prompt autorizaba | §44: contrato técnicamente cerrado; el prompt explícito constituye autorización de ejecución |
| 2 | No había precedencia contrato/adenda | Cabecera V2: contrato principal consolidado prevalece; adenda queda como trazabilidad |
| 3 | El prompt podía duplicar/redefinir arquitectura | Cabecera + §44: prompt sólo workflow/autorización, no arquitectura |
| 4 | Faltaba preflight de branch/working tree | Debe exigirse en Prompt V2; contrato §40 fija disciplina de rama |
| 5 | Dependencias/lockfiles podían cambiarse | §31 y §40: prohibido salvo imposibilidad previamente demostrada |
| 6 | `current/active` mezclados | §3.3: runtime técnico exacto `active | all` |
| 7 | `active→all` rompía p0/p1 | §15: máscara `baseVisibleLevelIds` y visibilidad exacta en p0/p1 |
| 8 | Handles podían resolverse antes de rebuild | §15.2: rebuild primero, handles frescos después |
| 9 | Coordenadas `x/y/z` ambiguas | §7: plan Y separado de vertical Y; nombres explícitos |
| 10 | Sin contrato Building-mm → Three-m | §7.2: core en mm, renderer convierte una vez a world-space |
| 11 | `stateAt()` no tenía shape formal | §17: contrato serializable de cámara, deltas y visibilidades |
| 12 | Near/far/maxDistance no definidos | §18.3: cálculo temporal + restauración exacta |
| 13 | Resize no tenía arquitectura | §18.4: recrear sólo narrativa pura con mismo descriptor/p |
| 14 | Ownership activo incompleto | §13: matriz obligatoria |
| 15 | Losa activa superior podía quedarse flotando | §13: losa real activa incluida aunque viva en `levelsG` |
| 16 | `contactG` sin política | §13: ocultar durante FT3D-5, guardar/restaurar |
| 17 | `ground` sin política | §13: global; exploded lo oculta cuando pueda falsear lectura |
| 18 | Riesgo de segunda infraestructura de restore | §27: extender lifecycle existente |
| 19 | Riesgo de convertir Begin/End en async | §3.2: contrato síncrono preservado |
| 20 | Dispatches hard-codeados no auditados | §22: búsqueda y clasificación obligatoria |
| 21 | Story controls podían no existir si sólo FT3D-5 | §22 punto 1 |
| 22 | Reduced holds sólo section/elevation | §21 + §22: holds FT3D-5 y generalización mínima |
| 23 | `finishStory(0)` hard-codeado | §22 punto 4 |
| 24 | `enterScene()` sin payload FT3D-5 | §23 |
| 25 | `openStory()` sin validación FT3D-5 | §22 punto 2 |
| 26 | Sin captions/ARIA FT3D-5 | §32 |
| 27 | Sin ES/EN/ZH explícito | §25 + §32 |
| 28 | Sin acción standalone | §25.3: una acción contextual reutiliza la misma scene |
| 29 | `disposeStory()` no limpiaría FT3D-5 | §22 punto 7 + §25.4 |
| 30 | `descriptor.supported` ambiguo | §8.1 |
| 31 | Valores exploded unsupported no definidos | §8.2 |
| 32 | Precedencia de reasons ausente | §9 |
| 33 | Sort sin desempate explícito | §9: order → sourceIndex → levelId |
| 34 | Gap nominal podía dejar plantas solapadas | §12: `baseVisualGapMm` + `visualClearanceMm` + extra overlap-safe |
| 35 | No estaba claro si usar niveles del Building o PresentationPlan | §5: todos los niveles estructurales de `presentationSources()` |
| 36 | Anchor si overview corresponde a nivel excluido | §5.1: primer overview cuyo level está incluido |
| 37 | Partial sin UI/QA suficiente | §25.2 + §36 |
| 38 | Reabrir diálogo podía duplicar controles/listeners | §25.4 + §36 |
| 39 | Sin leak/memory QA | §30 + §36 |
| 40 | “No rebuild por frame” sin prueba | §29 + §36 |
| 41 | Offline/B1 no obligado | §31 + §36/§37 |
| 42 | Orden de script nuevo no fijado | §31: core antes de UI + browser smoke |
| 43 | Contadores 40+/50+ podían incentivar asserts triviales | §§35–36: matriz de comportamientos > contador |
| 44 | Claude podía aumentar timeouts | §37/§40: prohibido |
| 45 | Final Playwright debía ser retries=0 | §36 |
| 46 | Chromium podía instalarse silenciosamente | §31/§36: usar existente, reportar versión |
| 47 | Sin evidence manifest ligado al SHA | §38.3 |
| 48 | Evidencia antigua tras cambios de HEAD | §38.3 + §42 blocking |
| 49 | Sin baseline crítico previo | §37: corrida pre-baseline mínima |
| 50 | Sin QA furniture OFF/toggles | §26 + §36 |
| 51 | Reparenting temporal quedaba abierto | §13: prohibido todo reparenting del active level |
| 52 | Residue inspector insuficiente | §28: categorías explícitas |
| 53 | Begin failure podía dejar `all`/estado alterado | §16: Begin transaccional + rollback |
| 54 | Faltaba test del fallo durante Begin | §16 + §36 caso 40 |
| 55 | Faltaba test p0/p1 antes de End con visibilidad exacta | §15 + §36 casos 25–26 |

**Cierre: 55/55 incorporados.**

---

## C. Decisiones técnicas especialmente críticas

### C1. `active→all` no cambia el significado de p0/p1

`levelView='all'` puede ser necesario para construir la jerarquía completa, pero no puede cambiar visualmente el overview de entrada.

La implementación debe distinguir:

- infraestructura interna de escena;
- visibilidad narrativa.

Por eso se captura `baseVisibleLevelIds`, se reconstruye `all`, se resuelven handles frescos y se reaplica la visibilidad base antes de `stateAt(0)`.

p0 y p1 se prueban **antes de End**.

### C2. Descriptor y PresentationPlan son autoridades distintas

- descriptor FT3D-5 = todos los niveles estructurales válidos de `presentationSources()`;
- PresentationPlan = anchor/player;
- room selection no decide qué plantas existen para la lectura global.

### C3. Gap visual overlap-safe

Se conserva el gap nominal del contrato inicial:

```text
baseVisualGapMm = clamp(round(nominalStoreyMm * 0.45), 800, 1600)
```

pero se añade:

```text
visualClearanceMm = clamp(round(baseVisualGapMm * 0.25), 200, 400)
```

El `explodedExtraYmm` real de Presentation puede crecer si los bounds se solapan, exclusivamente para garantizar legibilidad visual. No se muestra como cota.

### C4. No reparenting

El active level se controla mediante handles sobre objetos existentes. No se crea un parent temporal ni se mueven assets individualmente.

### C5. Begin transaccional

El cambio temporal a `all` no puede dejar residuos aunque la preparación falle.

### C6. Dispatch audit

El cambio no se considera implementado hasta revisar todas las listas/switches hard-codeados del Story actual. No basta añadir `NARRATIVES` y `SCENE_MS`.

---

## D. Ownership consolidado

| Categoría | Elementos | Política |
|---|---|---|
| nivel secundario | group dentro de `levelsG` | handle único del grupo |
| nivel activo | `archFloor`, `archUp`, `furnG`, `lampG`, losa real activa | misma delta, sin reparenting |
| assets | hijos del furniture group | heredan transform padre |
| connector | stairs | compact: conservar; exploded: ocultar |
| global context | `ground`, territory | no mover; exploded puede ocultar |
| global derived | `roofG`, `exteriorG` | no mover; ocultar durante separación si procede |
| presentation temporal | `contactG`, `revealG`, outlines/routes | limpiar/ocultar/restore, nunca mover como planta |
| labels/UI | `labelG`, minimapa | lifecycle actual; sin gap falso |

---

## E. Dispatch audit checklist para la implementación

Antes de modificar Story/UI, localizar:

```text
plan-reveal
room-descent
section-open
elevation-open
SCENE_MS
NARRATIVES
fullStory
storyControls
holdsOf
hasSection
finishStory
openStory
enterScene
sceneEnd
sceneHome
drawStory
disposeStory
presentationStoryBegin
presentationStoryApply
presentationStoryEnd
```

El handoff de implementación debe indicar qué lugares fueron modificados y cuáles se dejaron intactos deliberadamente.

---

## F. QA final reforzada

La implementación deberá demostrar, además del contrato:

- Chromium existente, `retries=0` en corrida crítica;
- sin subida de timeouts;
- baseline crítico previo;
- p0/p1 antes de End;
- rollback de Begin fallido;
- active upper floor;
- losa activa;
- furniture OFF;
- contact/ground/context/roof restore;
- memory/rebuild accounting;
- config open/close repetido;
- offline/B1;
- screenshots/vídeos regenerados en HEAD final;
- evidence manifest local con SHA y Chromium;
- reverse real, no vídeo invertido.

---

## G. Estado

No quedan mejoras de esta auditoría para delegar a Claude como decisiones abiertas. Claude debe **implementar**, no reinterpretar.

**ESTADO: FT3D-5 AUDITORÍA V2 CERRADA — 55/55 CORRECCIONES INCORPORADAS AL CONTRATO CONSOLIDADO**
