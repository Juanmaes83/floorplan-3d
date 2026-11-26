# Previews para la prueba humana del propietario · 26/11/2026

Claude prepara las candidatas; **el despliegue lo hace Codex o el propietario** (Claude no despliega). Sitio estático: se
sirve la raíz del repositorio tal cual (`index.html`), sin compilación, como cualquier Preview de RUBIK.

| Preview | Rama | SHA exacto a desplegar | Configuración |
|---|---|---|---|
| **Muros §7.1 con OP-07 activo** | `claude/preview-muros-op07-activo` | ver el commit de este documento (cabeza de la rama) | Ninguna variable. La activación va en una sola línea: `js/project-core.js:29` `OP07_RELEASE = 'active'`. **Solo Preview: no fusionar.** El producto está en `claude/muros-forma-descubrible` `8537ccca` con OP-07 en `integrated` |
| **StoryLayers §7.2 · §7.3 · §8.3** | `claude/storylayers-v1` | `3d0f27b986dba5cd06cb9c9f4bfb394946621403` | Ninguna. Todo ocurre en el navegador; no hay llamadas externas |

## Pasos de despliegue (cualquiera de los dos)
1. Desplegar el SHA indicado como **Preview** (no Production), con la protección de despliegue habitual.
2. Comprobar que la URL sirve ese SHA (p. ej. ver `js/project-core.js` línea 29 en la de Muros).
3. Enviar al propietario la URL junto con el SHA y el estado de activación.

## Qué probar (sin instrucciones externas)
- **Muros:** abrir el plano de ejemplo → «Dibujar muro» (dos toques, «Terminar») → seleccionar el muro → «Forma del muro»:
  Curvo → arrastrar el punto del centro → «Abrir 3D» → volver → Enderezar → Ctrl+Z / Ctrl+Shift+Z → recargar: la forma se conserva.
  En móvil, igual: la barra de selección no tapa el asa.
- **StoryLayers:** Entregar → P10 «Historia del cambio» → Crear variante → cambiar algo en Diseñar → «Volver a la historia» →
  escribir la propuesta, «Ayuda para redactar una nota», cargar una ficha de cliente JSON (sintética) → Guardar revisión →
  Previsualizar como cliente → Descargar para el cliente → abrir el ZIP.

## Desviación declarada de la rama de Preview de Muros
Con `OP07_RELEASE='active'` fijado, dos pruebas que exigen el estado *integrado* (`op07-s8-activation` 3 y 4) dejan de
aplicar en esa rama; el resto pasa (`op07-s10` 2/2). En la rama de producto (`8537ccca`) pasan todas: 16/16 con S5b, S8 y S9.
