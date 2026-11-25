# U14 · Asesor RUBIK: Nuance Live preparado (sin llamadas reales) y skills socráticos

**Rama:** `claude/asesor-rubik-en-vivo`. **HEAD verificado al empezar:** `75291e8d` (último auditado).
Se reutilizan el laboratorio, el puente con RUBIK (`adapter.js · rubikBridge`) y la lista de herramientas (`tools.js`).

## Qué hay
| Pieza | Archivo | Estado |
|---|---|---|
| Inicio controlado por el servidor | `api/advisor-session.js` | Cerrado por defecto (solo Preview). Operador autenticado. Reserva atómica de cuota y una sola sesión activa. `GET /usage`. Token con cámara del usuario desactivada y las 3 herramientas del cliente. El **servidor** crea la conversación con `max_session_seconds` y entrega al navegador un token **ya gastado**. Cierre y abandono con `Content-Length: 0`. |
| Adaptador Nuance Live | `labs/asesor-rubik/nuance-adapter.js` | Inicio por clic. Eventos por long-poll con cursor. Sala LiveKit (`livekit-client@2.5.7`). Micrófono con cancelación de eco y sin cámara. Vídeo y audio del avatar, subtítulos, herramientas por delegación, errores, cancelación durante la conexión y cierre con limpieza. **Desactivado por defecto:** el laboratorio arranca en «Simulada». |
| Simulador local del protocolo | `tests/fixtures/nuance-mock.cjs` | Reproduce `/session-tokens`, `/conversation`, eventos, `/end`, `/abandon`, `/usage`, los errores 401/403/409/411/429/503 y el topic `nuance_live`. |
| Skills socráticos | `labs/asesor-rubik/skills.js` | Presupuesto, organización, puntualidad y negocio. Memoria de nombre, tarea y misión. Preguntas, resumen y confirmación antes de proponer. Solo datos reales. Sin asesoría legal ni fiscal vinculante. No guarda datos personales. |

## Decisiones comprobadas en la documentación de Nuance
- `max_session_seconds` solo existe en `POST /conversation` (token de sesión), no en `/session-tokens`. Por eso la conversación la crea el servidor.
- El SDK JS (`createNuanceConversation`) siempre crea la conversación: no documenta unirse a una ya creada. Se usa el **transporte directo documentado**: eventos y luego LiveKit con el `livekit_url` y el `token` del evento `admitted`.
- **Inferencia por verificar en el primer ensayo:** que el servidor llame a `POST /conversation` con el token. La documentación no lo prohíbe ni lo describe.
- El tope **no** se acredita con un temporizador de interfaz. Lo acreditan el `max_session_seconds` fijado por el servidor y el cierre desde el servidor. La reconciliación con `GET /usage` queda para el ensayo.

## Seguridad: corrección incluida
En modo cliente, «continuar por texto» sigue en el asesor con las mismas consultas. Ya **no abre** el Asistente completo de RUBIK, que consulta costes internos. Comprobado por voz simulada, por texto y por delegación real del protocolo.

## Pruebas (12/12 en verde)
- `tests/advisor-session.test.cjs` · **5/5** (servidor contra el simulador):
  - cerrado por defecto, nunca en Production, y el código del operador nunca viaja;
  - orden de las llamadas: saldo → token → conversación con tope;
  - el token gastado no crea otra conversación;
  - dos solicitudes simultáneas: una 201 y otra 409;
  - tope diario, saldo agotado y errores del proveedor, con la reserva liberada;
  - abandono, y 411 si falta `Content-Length: 0`.
- `tests/asesor-rubik-live.browser.test.cjs` · **3/3** (Chromium 1440 y 390 con micrófono falso):
  - inicio por gesto;
  - micrófono con `echoCancellation:true` y sin pedir cámara;
  - vídeo del avatar con fotogramas y audio conectado;
  - subtítulos;
  - herramientas permitidas con su resultado real por `function_call_output` + `response.create`;
  - 4 herramientas no permitidas rechazadas, con el proyecto idéntico;
  - pasar a texto sin abrir costes internos;
  - cancelación durante la conexión (abandono);
  - errores de saldo, concurrencia, capacidad y no disponible, con recursos liberados;
  - cierre con limpieza y foco;
  - **0 peticiones al proveedor real**;
  - en modo simulado, 0 peticiones al simulador y al servidor de voz.
- `tests/asesor-rubik-skills.browser.test.cjs` · **2/2**:
  - memoria y olvido;
  - DNI rechazado;
  - preguntas antes de proponer, con eco, resumen y confirmación;
  - presupuesto sin importes en modo cliente;
  - superficie real y estimada;
  - aviso legal;
  - plazos con margen del 20 % y sin promesas;
  - modo técnico con el motor real y sin total inventado;
  - 0 peticiones externas.
- `tests/asesor-rubik-lab.browser.test.cjs` · **2/2**: el laboratorio simulado, actualizado al traspaso seguro.

**No probado aquí (requiere el ensayo autorizado):**
- WebRTC/LiveKit real;
- audio, vídeo y voz reales del proveedor;
- facturación real;
- `ended.reason` reales;
- el comportamiento del SDK.

## Primer ensayo privado: pasos exactos (NO ejecutado; requiere autorización)
1. **Autorización del propietario**, con un presupuesto aprobado (créditos máximos) y la cuenta y el ámbito de Nuance confirmados.
2. **Variables en Vercel**, solo en Preview y en la rama del ensayo:
   - `RUBIK_ADVISOR_ENABLED=1`;
   - `RUBIK_ADVISOR_TOKEN`: código de operador de 32 a 200 caracteres, distinto de los demás códigos de RUBIK;
   - `RUBIK_ADVISOR_NUANCE_KEY` (`nk_…`, como secreto);
   - `RUBIK_ADVISOR_DAILY_STARTS`: por ejemplo `3`;
   - `RUBIK_ADVISOR_MAX_SESSION_SECONDS`: por ejemplo `120`;
   - `RUBIK_SPEND_STORE_URL` y `RUBIK_SPEND_STORE_TOKEN`.
   - **No** definir `RUBIK_ADVISOR_TEST_API`.
3. **Antes de empezar,** anotar `GET /usage` (`available_credits`, `credits.used`) desde el panel o la consola de Nuance.
4. **Iniciar:** abrir la Preview → `labs/asesor-rubik/` → Conexión «Nuance Live» → código de operador → «Iniciar conversación».
5. **Comprobar** y anotar:
   - que la conversación arranca;
   - vídeo y audio del avatar;
   - subtítulos;
   - las 3 consultas por voz en **inglés** (la API reconoce y habla solo inglés);
   - el rechazo de «¿cuánto cuesta?»;
   - «Terminar», que debe cerrar la sesión en el servidor.
6. **Medir:** duración real, créditos antes y después (`GET /usage`), y si `max_session_seconds` corta la sesión al llegar al tope (con el tope corto del paso 2).
7. **Documentar las diferencias con el simulador:**
   - eventos no previstos;
   - `ended.reason`;
   - tiempos;
   - si el servidor puede crear la conversación con el token (la inferencia de arriba).
8. **Cierre de seguridad:** comprobar que no queda ninguna conversación activa y volver a `RUBIK_ADVISOR_ENABLED=0`.

**Español para clientes:** la documentación dice que la persona habla y reconoce solo inglés, y rechaza otros idiomas con `instructions_refused`. La salida en español requiere validar una conversación real en español cuando el proveedor lo ofrezca.
