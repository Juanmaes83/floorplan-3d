# Reconciliación documental — 02-11-2026

**Ámbito:** comprobar si la documentación operativa de Rubik describe correctamente el estado real después de FT3D-5, canonización/implementación FT3D-6 y merge de PR #159; registrar además el nuevo protocolo multiagente y reconciliar las ampliaciones de comprensión producto/donor contra autoridades existentes antes de documentarlas.

**Baseline funcional revisado:** `0f9c6ead9732901681498efec326d1ca92e42ffe` (merge de PR #159). El HEAD vivo de `master` debe verificarse siempre; un commit exclusivamente documental posterior no cambia por sí mismo este baseline funcional.

## 1. Resultado ejecutivo

La documentación técnica de contratos/Cuts/evidencia reciente existe, pero la **capa de estado operativo quedó retrasada** respecto al código integrado.

Hallazgos principales:

1. `docs/product/current-status-2026-10-30.md` se presentaba como fuente operativa actualizada 01-11, pero todavía fijaba FT3D-4 como HEAD funcional, FT3D-5 como siguiente corte y FT3D-6 como draft pendiente. **STALE para operaciones actuales; aviso SUPERSEDED ya aplicado preservando el cuerpo histórico.**
2. `docs/product/roadmap-completion-matrix-2026-10-30.md` repetía el mismo estado FT3D-1..4 / FT3D-5 siguiente / FT3D-6 draft. **STALE para operaciones actuales; aviso SUPERSEDED ya aplicado preservando el cuerpo histórico.**
3. `docs/qa/ft3d-6-implementation-2026-11-01.md` conserva correctamente el protocolo histórico pre-freeze, pero su encabezado todavía dice `Implementation is in progress. No final validation, preview approval or merge is claimed.` Después de PR #159 esa frase ya no describe el estado vigente. **HISTORICAL LEDGER que necesita nota de cierre, no reescritura de la historia.**
4. `docs/ROADMAP.md` contiene muchas secciones fechadas históricas. No debe reescribirse masivamente; necesita un puntero claro a la fuente operativa vigente para evitar que un agente tome un bloque viejo como estado actual.
5. `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md` es explícitamente una propuesta/transferencia de conocimiento y declara que no cambia el roadmap por sí sola. Su contenido conceptual sigue siendo útil; **no es un current-status y no requiere reescritura como tal**.
6. `docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md` ya fue promovido a contrato canónico pese al nombre histórico `working-contract`; conserva correctamente la autoridad contractual de implementación. El hecho posterior de que FT3D-6 ya esté implementado/mergeado se registra en estado/QA, no alterando retroactivamente las condiciones históricas del contrato.
7. Durante la primera revisión no se localizó todavía en remoto una rama `audit/donor-runtime...`; el trabajo de auditoría iniciado en Codex Terminal debe crear un checkpoint remoto antes de transferirse a otra cuenta/agente. Tras una pausa externa por créditos, el usuario confirmó el 02-11 que Codex **reanudó y vuelve a ejecutar** la misión; no interferir con ese worktree activo.
8. La primera versión de esta reconciliación trataba `0f9c6ead...` como si debiera ser el HEAD permanente de `master`. Se corrigió: es el **baseline funcional de producto FT3D-6**; commits documentales posteriores pueden avanzar `master` sin introducir cambios funcionales.
9. La revisión del workspace actual de `Entregar` demostró que Delivery es una capa de producto existente y más amplia que la observada en una rama antigua: superficies, lámina, Presentation, imágenes, vídeo, dossier, dossier económico, cliente/review/share, identidad, paquetes editables y AI image augmentation deben buscarse antes de declarar outputs/capabilities ausentes.
10. Las nuevas capturas donor/reference no deben crear documentación paralela sin reconciliación. Se auditó primero la documentación existente y se comprobó que Story, sección, UX principal y construcción/timeline ya tienen autoridades previas que deben preservarse.

## 2. Estado real comprobado

### Baseline funcional

`0f9c6ead9732901681498efec326d1ca92e42ffe`

Ese commit es el merge de PR #159 FT3D-6. El HEAD vivo de `master` debe comprobarse aparte en cada misión.

### FT3D-5

- código probado: `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`;
- run acreditado: **710 PASS / 0 FAIL / 2 SKIP**;
- integración/reconciliación: `18848fbf3308ef8c2c8841edf626221f74922d23`;
- contratos/addendum presentes en master.

### FT3D-6

- contrato canónico presente en master;
- implementation head: `0313ac14b17cedb998981e2c832b8175f9b9c03f`;
- PR #159 mergeada;
- merge/baseline funcional: `0f9c6ead9732901681498efec326d1ca92e42ffe`;
- 57/57 tests nuevos PASS;
- Python 56/56 PASS;
- suite Node final registrada: 1251 PASS / 31 fallos conocidos reconciliados / 2 SKIP;
- **ocho workflows PR-localizados del exact head completados con `success`**, incluidos `FT3D-6 templates and review evidence` e `Integrated browser regressions`;
- revisión visual humana aprobada.

## 3. Disposición por documento

| Documento | Situación | Disposición |
|---|---|---|
| `docs/product/current-status-2026-10-30.md` | estado operativo obsoleto | **SUPERSEDED** por `current-status-2026-11-02.md`; aviso aplicado; cuerpo histórico conservado |
| `docs/product/roadmap-completion-matrix-2026-10-30.md` | matriz operativa obsoleta | **SUPERSEDED** por `roadmap-completion-matrix-2026-11-02.md`; aviso aplicado; cuerpo histórico conservado |
| `docs/qa/ft3d-6-implementation-2026-11-01.md` | ledger histórico válido, encabezado ya no vigente | conservar cuerpo; queda pendiente una nota post-merge mediante edición segura |
| `docs/ROADMAP.md` | canónico/histórico mixto | queda pendiente un puntero a current status/matriz 02-11; no reescribir secciones históricas |
| `flat-to-3d-presentation-knowledge-programme-2026-10-30.md` | knowledge transfer + definición previa de FT3D-8 futuro | mantener; contexto/autoridad de programa, no current-status |
| `ft3d-2a-story-engine-2026-10-30.md` | Story/progreso/captions/reverse existentes | mantener como autoridad histórica/técnica; no crear player paralelo por las nuevas capturas |
| `ft3d-3-dynamic-section-contract-2026-10-31.md` | autoridad de sección visual/reversible/no destructiva | mantener; nuevas observaciones narrativas de Open Section no autorizan otro motor de sección |
| `point-9-ux-professional-discoverability-2026-10-28.md` | autoridad de IA/UX principal | mantener `DISEÑAR / ANALIZAR / PRESUPUESTAR / ENTREGAR / MI ESTUDIO`; usar jerarquías donor sólo como aprendizaje semántico |
| `ft3d-5-*` contratos | vigentes para alcance FT3D-5 | mantener |
| `ft3d-6-profile-templates-working-contract-2026-11-01.md` | contrato canónico pese a filename histórico | mantener; estado de implementación se refleja fuera del contrato |
| `ft3d-donor-global-reconciliation-2026-11-01.md` | reconciliación donor canónica existente | mantener como autoridad de conocimiento, no autorización automática; D16–D18 gobiernan construcción/time donor |

## 4. Nuevas autoridades creadas / ampliadas en esta reconciliación

### Estado

- `docs/product/current-status-2026-11-02.md`
- `docs/product/roadmap-completion-matrix-2026-11-02.md`

### Multiagente

- `docs/ops/MULTI-AGENT-OPERATING-PROTOCOL.md`
- `docs/ops/ACTIVE-WORKSTREAMS.md`
- `docs/ops/HANDOFF-TEMPLATE.md`

Estas piezas hacen explícito que:

- el repo/remote es memoria compartida;
- `master` integrado y los contratos canónicos conservan su autoridad de producto/alcance;
- una rama remota + SHA es checkpoint compartido del workstream, no permiso de merge;
- cada workstream tiene branch/worktree/owner;
- un checkpoint WIP puede subirse sin presentarse como aprobado;
- el handoff debe incluir SHA y siguiente acción;
- un `run-state.json` debe estar ligado a su checkpoint y no puede pisar evidencia posterior;
- ChatGPT/Codex/Claude pueden trabajar en paralelo sólo con aislamiento y ownership claros;
- dos agentes pueden investigar lo mismo, pero no escribir simultáneamente la misma autoridad mutable sin coordinación;
- secretos/credenciales no se committean ni se incluyen en handoffs.

### Arquitectura / Delivery / experiencia

- `docs/product/project-experience-delivery-architecture-2026-11-02.md` — mapa actual `Project/Building truth → Design/Analyze/Budget/Experience → Delivery → Client`, con límites de autoridad semántica;
- `docs/product/current-delivery-capabilities-2026-11-02.md` — inventario factual de la capa actual `Entregar` y downstreams;
- `docs/product/donor-to-rubik-integration-policy-2026-11-02.md` — política de aterrizaje donor sobre capacidades existentes antes de declarar gaps;
- `docs/product/presentation-experience-principles-2026-11-02.md` — principios derivados de producto actual + evidencia visual suplementaria;
- `docs/product/evidence/donor-visual-observations-2026-11-02/manifest.md` — índice de evidencia humana; paths/hashes quedan `PENDING_UPLOAD` hasta que el usuario suba los screenshots;
- `docs/product/construction-programme-domain-addendum-2026-11-02.md` — **addendum**, no fase/schema: profundiza fronteras de dominio ya existentes en FT3D-8 + Global D16–D18.

### Principios nuevos preservados sin cambiar roadmap

La documentación ampliada registra como hipótesis/principios a contrastar con el audit runtime:

1. contextual professional cards pueden formar parte de la experiencia espacial;
2. technical/material/realistic representation puede coexistir registrada sobre el mismo proyecto;
3. timeline/programme debe ser semántico, no decorativo;
4. un estado semántico puede tener varias representaciones coordinadas (`programme / sheet / camera`);
5. una narrativa puede volver a una representación técnica enriquecida después de visitar el espacio;
6. `PROJECT-DERIVED FACTS` y `PROFESSIONAL-AUTHORED NARRATIVE` deben permanecer distinguibles;
7. `FINAL PROJECT / BUILDING TRUTH ≠ CONSTRUCTION PROGRAMME STATE ≠ TEMPORARY SITE STATE`;
8. `ARCH // 12` se conserva como universo visual complementario y **no amplía** el audit 14/14 sin misión explícita.

## 5. Cambio de orden operativo

El orden histórico:

`FT3D-5 → reconciliar FT3D-6 → implementar FT3D-6 → FT3D-7`

ha sido superado.

Orden vigente:

```text
FT3D-5 integrado
→ FT3D-6 integrado
→ donor runtime audit 7×14
→ reconciliación runtime/source/Cuts/Rubik
→ revisión humana de servicios/gaps/bridges/reuse
→ autorizar implementaciones concretas
→ FT3D-7 cuando corresponda
→ FT3D-8 permanece separado
```

La auditoría donor estudia 14 referencias; **no autoriza 14 features**.

Las observaciones suplementarias no cambian este orden y no mueven FT3D-8 fuera de su estado futuro/separado.

## 6. Correcciones históricas

De las cuatro correcciones identificadas, **2/4 ya están aplicadas** de forma segura:

1. ✅ aviso `SUPERSEDED FOR CURRENT OPERATIONS` en `current-status-2026-10-30.md`;
2. ✅ aviso `SUPERSEDED FOR CURRENT OPERATIONS` en `roadmap-completion-matrix-2026-10-30.md`;
3. ⏳ puntero actual en la cabecera de `docs/ROADMAP.md`;
4. ⏳ nota post-merge en `docs/qa/ft3d-6-implementation-2026-11-01.md`.

Los dos documentos restantes son largos y de alto valor histórico. El conector de edición disponible reemplaza archivos completos y no ofrece un patch parcial. No se reconstruyen manualmente sólo para insertar unas líneas: las dos inserciones deben aplicarse mediante edición/patch local seguro y después verificarse con diff exacto para demostrar que el resto quedó intacto.

No borrar ni reescribir retrospectivamente resultados históricos.

## 7. Riesgo operativo prioritario detectado

El donor runtime audit iniciado en Codex Terminal no tenía checkpoint remoto localizable durante la última comprobación previa a su reanudación. Mientras no se confirme uno:

- segunda cuenta ChatGPT no puede reanudarlo con autoridad remota;
- Claude Code no debe intentar continuarlo editando otro supuesto estado;
- una pérdida del worktree local podría perder progreso.

El usuario confirmó que Codex Terminal **está de nuevo ejecutando** la misión. Por tanto la acción segura actual es **no interferir**. Al primer cierre/checkpoint coherente: inventariar estado local → commit → push → registrar branch/SHA/handoff.

## 8. Método usado para la ampliación visual/documental

Antes de aplicar las últimas observaciones se auditó la documentación vigente para evitar duplicación o contradicción.

Se comprobó específicamente:

- FT3D-8 ya existía en el programa Flat-to-3D como familia temporal futura/separada;
- Global D16–D18 ya cubría tiempo por elemento, varias vistas/tiempos y programa↔3D, con límites y `DEFER`;
- Story ya poseía progreso determinista, escenas/captions, scrub/reverse y lifecycle;
- FT3D-3 ya poseía una autoridad de sección única/reversible/no destructiva;
- Point 9 ya definía la casa UX principal y la lógica de tarjetas/estado en Entregar.

Aplicación resultante:

- **ampliar**, no reemplazar, los principios de Presentation;
- **ampliar**, no reconstruir, el mapa de arquitectura;
- **ampliar** la política donor→Rubik con reglas de multi-reading/enriched-return/temp-state;
- **ampliar** el manifest visual con VIS-004…VIS-008;
- crear sólo un `construction-programme-domain-addendum`, explícitamente subordinado a FT3D-8 + D16–D18;
- no tocar producto, schemas ni roadmap de fases.

## 9. Conclusión

El problema inicial no era ausencia de conocimiento técnico: los contratos, Cuts, Global Reconciliation y ledger FT3D-6 existen. El problema era que **las fuentes de estado y coordinación no habían alcanzado al producto real**, y después que la evidencia visual suplementaria podía inducir duplicación si se documentaba sin auditar las autoridades previas.

La estrategia vigente queda ahora reforzada:

`auditar autoridad → preservar historia → añadir evidencia → ampliar principios/fronteras → reconciliar con runtime → sólo después decidir producto`.

La revisión sustantiva de PR #160 sigue siendo favorable. Faltan las dos inserciones históricas mediante edición segura y volver a revisar el diff/HEAD/checks antes de declarar el PR merge-ready.

**Estado de esta rama documental:** WIP remoto revisado; no autorizado para merge todavía.
