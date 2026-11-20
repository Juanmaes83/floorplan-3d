# OP-07 v5 + A0 real · comprobación dirigida para Codex (20/11/2026)

Fuente de la composición: parche de Codex `seguimiento-cc1-d-linux/op07-a0-composition.patch.gz` (`codex/continuidad-p0-op02@4367cb6e`, preparado sobre v4). SHA-256 del parche descomprimido: `27a4a9f43e565fbe3a19254973f792ebafa812dea7bfcdad4ad5bfe464723bd0`.

- **Aplicación:** `git apply --3way` sobre `claude/op07-serie-v5@420ac75f`: **limpia** (13 archivos). No se publica el código compuesto; el candidato conjunto es de Codex.
- **A0 real presente:** `FloorPlanSchemaEpoch` es el módulo real `js/schema-epoch.js` (claves `CURRENT, KEY, SEEN, CHANNEL, parse, read`), que sustituye al sustituto inyectado. `wallFeaturesActive()=true`, sin bloqueos.
- **Pruebas dirigidas** (Chromium 1243, Linux): `op07-s8b-intent`, `op07-s8-activation`, `op07-s7-persistence`, `a0-writer-fence` y `a0-browser-residuals` → **34/36** ([TAP](v5-a0-real-dirigidas.tap)). Puras `op07-s8b-revival`, `op07-s8-codex-probes` y `op07-s7-save-gate` → **18/18**.
- **Los 2 FAIL son controles de las pruebas, no defectos:** «falla cerrado sin A0» (S8) y «sin A0 no se crea nada» (v5). Ambos simulan la ausencia de A0 con la opción `a0:'none'`, que solo omite el sustituto. Con A0 real cargado por `<script>`, A0 está presente y el editor se activa, que es lo correcto.
  - **Propuesta para el candidato conjunto:** simular la ausencia de A0 bloqueando la petición de `js/schema-epoch.js` (`context.route`) en esos dos controles. **No relajar** las aserciones.
- **Las regresiones v5** (escenarios exactos de la sonda, inclinación y concurrencia) **pasan con A0 real**.
