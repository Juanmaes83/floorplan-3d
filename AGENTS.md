# Instrucciones de arranque · RUBIK SOTA

Aplicables a todos los agentes que trabajen en este repositorio. Leer antes de iniciar o retomar un corte:

- [Protocolo permanente de coordinación multiagente](docs/agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md), especialmente §§2, 3, 4.1–4.3 y 7.
- [Handoff maestro](docs/integration/HANDOFF-MAESTRO-RUBIK-SOTA.md), comenzando por las últimas actualizaciones; contrastar con el remoto efectivo y la continuidad #275/#289 o sus sucesores.

Si la rama de trabajo es anterior a esos documentos, consultar sus versiones remotas vigentes o solicitar la referencia al propietario; no usar una versión obsoleta como autoridad. No iniciar trabajos nuevos por estas instrucciones.

**Mandato permanente del propietario (20/11/2026):** sin publicación verificable en GitHub no hay entrega cerrada. Publicar los deltas autorizados, documentos, pruebas y handoff en la rama/laboratorio propio; informar de repositorio, rama, commit SHA completo, árbol, base, enlaces, pruebas, límites y siguiente acción. Antes de tomar una decisión técnica, comprobar código, consumidores y evidencia; si falta información material, solicitarla. En caso de bloqueo de publicación, entregar respaldo exacto y declarar la entrega pendiente. No equivale a permiso para PR productiva, fusión, activación, migración, gasto o despliegue. Proteger datos y licencias; coordinar CI y no modificar ramas ajenas.

**Regla permanente del propietario (20/11/2026) · idioma visible:** en español o inglés **nunca** se muestra texto en chino, ni en la interfaz ni en evidencias, capturas o entregables.
- Los datos guardados pueden conservar nombres en chino (el proyecto de ejemplo los tiene); todo nombre que se MUESTRA pasa por `window.FloorPlanDisplayName(name, type)` (`index.html`), que traduce y, si falta la traducción, usa el tipo del catálogo o un genérico.
- Ningún módulo muestra `object.name` o `room.name` en bruto.
- La guarda `tests/no-chinese-display.browser.test.cjs` recorre la interfaz real en ES y EN y falla ante cualquier carácter CJK visible. Única excepción explícita: el selector de idioma («中文»), pendiente de confirmación del propietario.
- Antes de entregar una captura, revisarla con este criterio.
