# §2.1 · Auditoría de persistencia, identidad y diseño de memoria

Base: `347b6136` (rama `claude/visualizacion-home`), encargo `73252084`. Rama de trabajo aislada: `claude/asistente-unificado`.

## Lo que existe realmente

| Elemento | Dónde | Alcance |
|---|---|---|
| Registro del Asistente de texto | `js/assistant-ui.js`, clave `rubik-assistant-v1` (localStorage) | Este navegador; sin persona ni consentimiento |
| Biblioteca de proyectos | `js/persistence-store.js` (IndexedDB `rubik-sota-persistence-v1`) | Este navegador |
| «Memoria» del Mentor del laboratorio | `labs/asesor-rubik/skills.js`, en memoria de la página | Se pierde al recargar |
| Identidad de probadores | `api/_beta-controls.js` (lista en servidor, solo Preview, cerrada por defecto) | Servidor; no hay sesión de usuario en el navegador |
| Asesor por voz (Nuance) | `api/advisor-session.js`, cerrado por defecto | Sin memoria propia en RUBIK |

**Conclusión:** no hay identidad verificable en el navegador ni almacén seguro compartido entre canales. Por tanto, y según el §2.1, la memoria es una **comodidad local del dispositivo**, opcional, visible y consentida. **No es privacidad ni aislamiento seguro entre personas**: quien use el mismo navegador puede verla. No se afirma memoria compartida.

## Diseño implementado (`js/assistant-unified.js`)

- **Configuración única** de seis perfiles: criterios comunes, enfoque, tono, skills comunes y específicas. La consumen el Asesor de Home (`labs/asesor-rubik/profiles.js` ya delega en ella), el texto y la voz/avatar simulados.
- **Permisos por modo, no por profesión.** El modo profesional exige identidad verificada; si falta, se aplica el modo cliente. En modo cliente están prohibidos `proponer-cambio`, `ver-costes`, `abrir-herramientas` y `publicar`, con un texto que explica el límite.
- **Memoria** (`createMemory`):
  - Campos: nombre preferido, profesión, proyectos y nota.
  - Sin consentimiento no lee ni escribe; sin propietario local no hay memoria.
  - Rechaza DNI, NIE, IBAN, credenciales y tarjetas.
  - Se puede consultar, editar, borrar campos y olvidarlo todo.
  - El contexto por proyecto va separado de la memoria personal.
  - Las claves se separan por titular local para evitar mezclas accidentales, **no** como barrera de seguridad sin identidad verificada.
- **Traspaso entre canales:** entrega solo los campos que la persona autoriza e indica exactamente cuáles. Si se revoca, no hay más traspasos.

## Pendiente en este bloque

- Panel visible de memoria y consentimiento en la interfaz (texto y laboratorio), con Playwright en escritorio y móvil, accesibilidad, registro de peticiones y prueba de que el proyecto queda idéntico ante acciones prohibidas en modo cliente.
- Preview privado para la prueba real de Nuance del propietario: ver `PREVIEW-NUANCE.md`.
