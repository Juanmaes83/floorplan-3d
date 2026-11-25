# §2 · Home y Asesor en vivo junto al retrato

Encargo `89bae1ff` §2 · rama `claude/visualizacion-home` · base `899415f3` (PERLA #322 con CI en verde).

| Requisito | Estado | Evidencia |
|---|---|---|
| «Hablar con el Asesor» junto al retrato, en «¿En qué trabajas?» | Hecho: botón en la fila de acciones del oficio elegido | `home-asesor-*.png` |
| Abre el Asesor con la profesión seleccionada | Hecho: `?perfil=<id>&desde=home` preselecciona el oficio | `tests/asesor-home.browser.test.cjs` 2/2 |
| Saludo, tono y preguntas con una sola configuración para los seis perfiles | Hecho: `labs/asesor-rubik/profiles.js` | `asesor-perfil-*.png`, `asesor-home-*.json` |
| La profesión personaliza; el modo y la identidad deciden el acceso | Se mantiene: el perfil no cambia la lista de herramientas del modo cliente | `tools.js` (filtro por modo), pruebas del laboratorio |
| La consulta guiada de Home mantiene su entrada | Sin cambios | `home-ux312` 8/8 |
| La demo indica «Simulada», usa datos de ejemplo y empieza solo por acción explícita | «Sesión simulada»; «Iniciar conversación» habilitado y ninguna sesión abierta al llegar | prueba |
| Ida y vuelta, teclado y toque | «← Volver a la Home»; teclado (Enter) y toque en 390×844 | prueba |
| Traspaso a texto; el modo cliente conserva su límite al pasar a texto | Cubierto por las suites del laboratorio | `asesor-rubik-lab` 2/2 · `asesor-rubik-live` 3/3 · `asesor-rubik-skills` 2/2 |
| Registro de cero peticiones a Nuance | 0 peticiones externas en los dos tamaños | `asesor-home-1440x900.json`, `asesor-home-390x844.json` |
| Cierre del adaptador (`/abandon` con token de sesión, `/end` con clave de servidor, bloqueo hasta estado terminal, cierre rechazado, 200 aún activa, cancelación durante el arranque, reintento, pérdida de conexión, simulador con las mismas credenciales, instrucciones en inglés) | Hecho | `tests/advisor-session.test.cjs` 10/10 (commit `a326972b`) |

## Pendiente o sujeto a autorización

- **Contrato exacto de Nuance:** `docs.nuancelabs.ai` no resuelve desde este entorno. El cierre sigue lo fijado en el encargo; códigos y cuerpos de respuesta reales (p. ej. qué devuelve `/abandon`) se contrastan en el ensayo privado autorizado.
- **Prueba privada real** (autorización, presupuesto, credenciales e inicio desde servidor) y **conversación real en español**: no ejecutadas.
- Firefox, WebKit y móvil físico: NOT_RUN.
