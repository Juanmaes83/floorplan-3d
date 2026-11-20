# K13 · ProposalV1

**Corte:** K13 del [Plan Maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) §6.3. **Base:** `master@02712b51`. **Estado:** pendiente de integración. No amplía PRE-01 ni GEN-01 y no cambia ninguna fila de la [matriz](MATRIZ-TRAZABILIDAD-v1.12.md).

## Qué es

`js/proposal-core.js` es un contrato común de propuesta y vigencia. No es un motor: los tres que existen siguen calculando lo mismo y conservan su huella, sus garantías y su contrato público.

| Familia | Motor (sin cambios) | Base de vigencia | Código público de obsolescencia | ¿Se aplica? |
|---|---|---|---|---|
| Asistente (AG-2/AG-3) | `js/assistant-proposals-core.js` | `revision`: FNV-1a de 64 bits, `rv1-…` | `revision_mismatch` | Sí, con confirmación por acción y deshacer |
| MCP `propose_layout` | `tools/rubik-mcp/src/proposal.cjs` | `file-sha256`: SHA-256 del archivo leído | `stale-source` | Nunca (`applied:false`) |
| E2 Comparador | `comparar/comparar.js` | `stored-sha256`: SHA-256 de lo guardado | `stale` (aviso y descargas desactivadas) | No es una propuesta: solo vigencia. Nunca modifica proyectos |

## Lo común

- **`checkFresh(base, actual)`:** la única comprobación de vigencia de las tres familias. Internamente devuelve `stale_base`; cada familia conserva su código como alias de compatibilidad (decisión 2 de #282). Una base mal formada nunca es vigente.
- **`fromAssistant` y `fromLayout`:** vistas ProposalV1 de una propuesta ya calculada. Son adaptadores finos y congelados que no recalculan ni modifican nada. Se exponen como `RubikAssistantProposals.toProposalV1` y `proposal.cjs.toProposalV1`.
- **`validate`:** invariantes que siempre se cumplen.
  - Una candidata del MCP no es aplicable, ni está confirmada ni aplicada.
  - Una propuesta del Asistente exige confirmación por acción y deshacer.
  - La base debe corresponder al tipo de propuesta.
- **`canApply`:** solo decide, no aplica. Siempre rechaza al MCP; para el Asistente exige que la propuesta esté pendiente y la base vigente. Quien aplica sigue siendo `RubikAssistantProposals.apply` (AG-3).

## Garantías comprobadas

Las comprueba `tests/proposal-core.test.cjs`, 7 pruebas:
- **Compatibilidad:** `AssistantProposalV1` conserva sus claves y valida con `assistant-contracts`; `RubikLayoutProposalV1` conserva `applied:false`.
- **Propuestas obsoletas:** las tres familias rechazan una base cambiada con su código de siempre.
- **Cambios concurrentes:** dos propuestas sobre la misma base; aplicar la primera deja obsoleta la segunda, que no la sobrescribe. En el MCP, una candidata calculada sobre otros bytes queda bloqueada.
- **Reversión:**
  - aplicar no muta la entrada;
  - tras deshacer, la revisión vuelve a ser la original y la propuesta puede aplicarse de nuevo;
  - sobre el estado ya aplicado no se aplica dos veces.
- **Algoritmos:** la FNV-1a coincide con la implementación de referencia y la huella de E2 se calcula igual que antes.
- **Pureza y escritura:**
  - `proposal-core` es puro, sin red, almacenamiento ni DOM;
  - el MCP no escribe;
  - E2 sigue siendo de solo lectura y no usa propuestas.

## Límites

- No hay operaciones nuevas en el Asistente ni metas nuevas en el MCP: PRE-01 y GEN-01 quedan fuera de este corte.
- La vista ProposalV1 aún no se muestra en ninguna interfaz; la usarán PRE-01 y GEN-01 cuando se autoricen.
