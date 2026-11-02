# Reconciliación documental — 02-11-2026

**Ámbito:** comprobar si la documentación operativa de Rubik describe correctamente el estado real después de FT3D-5, canonización/implementación FT3D-6 y merge de PR #159; registrar además el nuevo protocolo multiagente.

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
7. Durante esta revisión no se localizó todavía en remoto una rama `audit/donor-runtime...`; el trabajo de auditoría iniciado en Codex Terminal debe crear un checkpoint remoto antes de transferirse a otra cuenta/agente.
8. La primera versión de esta reconciliación trataba `0f9c6ead...` como si debiera ser el HEAD permanente de `master`. Se corrigió: es el **baseline funcional de producto FT3D-6**; commits documentales posteriores pueden avanzar `master` sin introducir cambios funcionales.

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
| `flat-to-3d-presentation-knowledge-programme-2026-10-30.md` | knowledge transfer, no status | mantener; usar como contexto, no como autoridad de estado |
| `ft3d-5-*` contratos | vigentes para alcance FT3D-5 | mantener |
| `ft3d-6-profile-templates-working-contract-2026-11-01.md` | contrato canónico pese a filename histórico | mantener; estado de implementación se refleja fuera del contrato |
| `ft3d-donor-global-reconciliation-2026-11-01.md` | reconciliación donor canónica existente | mantener como autoridad de conocimiento, no como autorización automática de implementación |

## 4. Nuevas autoridades creadas en esta reconciliación

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

## 6. Correcciones históricas

De las cuatro correcciones identificadas, **2/4 ya están aplicadas** de forma segura:

1. ✅ aviso `SUPERSEDED FOR CURRENT OPERATIONS` en `current-status-2026-10-30.md`;
2. ✅ aviso `SUPERSEDED FOR CURRENT OPERATIONS` en `roadmap-completion-matrix-2026-10-30.md`;
3. ⏳ puntero actual en la cabecera de `docs/ROADMAP.md`;
4. ⏳ nota post-merge en `docs/qa/ft3d-6-implementation-2026-11-01.md`.

Los dos documentos restantes son largos y de alto valor histórico. El conector de edición disponible reemplaza archivos completos y no ofrece un patch parcial. No se reconstruyen manualmente sólo para insertar unas líneas: las dos inserciones deben aplicarse mediante edición/patch local seguro y después verificarse con diff exacto para demostrar que el resto quedó intacto.

No borrar ni reescribir retrospectivamente resultados históricos.

## 7. Riesgo operativo prioritario detectado

El donor runtime audit iniciado en Codex Terminal todavía no tenía checkpoint remoto localizable durante esta revisión. Mientras siga así:

- segunda cuenta ChatGPT no puede reanudarlo con autoridad remota;
- Claude Code no debe intentar continuarlo editando otro supuesto estado;
- una pérdida del worktree local podría perder progreso.

**Acción prioritaria al volver la sesión:** inventariar estado local → commit coherente → push → registrar branch/SHA/handoff → continuar.

No interrumpir ni reescribir el worktree mientras tenga procesos locales pendientes.

## 8. Conclusión

El problema no era ausencia de conocimiento técnico: los contratos, Cuts, Global Reconciliation y ledger FT3D-6 existen. El problema era que **las fuentes de estado y coordinación no habían alcanzado al producto real**.

La revisión sustantiva de PR #160 es favorable, con las correcciones de autoridad/baseline ya incorporadas. Falta completar dos inserciones históricas mediante edición segura y volver a revisar el diff/HEAD/checks antes de declarar el PR merge-ready.

**Estado de esta rama documental:** WIP remoto revisado; no autorizado para merge todavía.
