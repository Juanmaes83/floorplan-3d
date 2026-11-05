# CORRECCIÓN DE RESPONSABLE — AG-1 ASISTENTE IA
**5 de noviembre de 2026 · Este documento sustituye el encargo erróneo anterior.**

**CORRECCIÓN EXPRESA DEL PROPIETARIO:** **AG-1 / Asistente IA lo desarrolla ChatGPT con GitHub junto al propietario**, siguiendo la metodología de pruebas y control económico usada en B2/B8. **NO se asigna el Asistente IA a la segunda cuenta de Claude Code.**

**Claude Code 2 trabaja exclusivamente FT3D-8V**, con onboarding autocontenido y referencias de repositorios en:
https://github.com/Juanmaes83/floorplan-3d/blob/feat/ft3d-8v-schedule-core-2026-11-05/docs/product/claude-code-2-ft3d8v-onboarding-y-encargo-2026-11-05.md

**Rama Asistente IA reservada a ChatGPT:** `feat/agent-ai-ag1-readonly-2026-11-05`.

## Nuestro alcance AG-1

Construir herramientas deterministas de consulta sobre la autoridad de RUBIK, antes de introducir un proveedor LLM, interfaz de conversación o ediciones. El modelo de proyecto y el presupuesto siguen siendo propiedad de los núcleos existentes. Añadir permisos, autenticación, restricciones de coste y registro seguro en etapas posteriores.

**Primeras herramientas:** `get_project_summary`, `list_rooms`, `get_room`, `get_quantities`, `get_budget_summary`; examinar contrato de `layout-review` antes de añadir `get_layout_review`. Permitir solo lectura, IDs existentes, estado de datos desconocidos y uso de motores C1–C4. No invocar OpenAI sin permiso, no reutilizar la clave de imágenes, no mutar geometría ni presupuesto.

**Referencias:**
- [Plan IA y asistente](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ia-imagenes-asistente-plan-maestro-2026-11-05.md)
- [Auditoría B2/B8 y agente](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ai-agent-b2-b8-technical-audit-2026-11-04.md)
- [Gates de desarrollo AG](https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/evolution-preparation-gates-2026-11-04.md)

**Reglas:** sin merge, sin producción, sin despliegue, sin llamadas de API, sin editar archivos que utilizan Claude original, Claude Code 2 ni Kimi. La primera fase será módulo puro con CI, como B2/B8; después se evaluarán opciones OpenAI con control de coste y aprobación explícita.

**No utilizar las instrucciones originales de este archivo que asignaban AG-1 a Claude Code 2: quedan anuladas.**
