# Asesor RUBIK en vivo · Paso 0 y laboratorio simulado

Encargo: `docs/product/assistant-ai-v3/ENCARGO-ASESOR-RUBIK-EN-VIVO.md` @ `7dc372f541881a017c867b4f412b574af71eacaf`.

| Campo | Valor |
|---|---|
| Repositorio | `Juanmaes83/floorplan-3d` |
| Rama propia | `claude/asesor-rubik-en-vivo` |
| SHA base | `1270f0976cf79ddc4037b960e533cae657b95b76` (rama `claude/vibrant-clarke-woev1u`, U9 cerrado, incluye el Asistente vigente y PERLA) |
| Árbol base | `b6264e696a25f7fb008720cbf3ca07a46fb955eb` |
| Laboratorio | `labs/asesor-rubik/index.html` (+ `tools.js`, `adapter.js`, `lab.js`, `lab.css`) |
| Prueba | `tests/asesor-rubik-lab.browser.test.cjs` |
| Evidencia | `docs/qa/asesor-rubik/capturas/` (5 capturas por tamaño + registro de red JSON) |

**Todo resultado del laboratorio es SIMULADO** salvo lo que hace RUBIK: las superficies, la selección de la estancia y el Asistente de texto son los del producto real (cargado en un iframe del mismo origen). No hubo ninguna comprobación con servicios reales.

## Paso 0 · Auditoría del Asistente actual (SHA base)

### Entradas
- **Asistente guiado / de texto** — `js/assistant-ui.js`: panel único en Diseñar, Analizar, Presupuestar y Entregar; entradas: botón «Asistente» de la navegación (`opener`), flotante `#assistantFab`, acceso dentro de diálogos `#assistantAccess`, chips de sugerencias, formulario de texto. API pública `window.RubikAssistantUI {open, close, ask, cancel, invalidate, state, trace}`. Sin modelo por defecto: cada respuesta sale de `RubikAssistantSession` con su fuente.
- **Asistente generativo (opcional)** — `js/assistant-gen-ui.js` + `api/assistant.js`: pasarela de servidor **cerrada por defecto** (`RUBIK_ASSISTANT_ENABLED`, código propio, tope de gasto, almacén atómico); el navegador solo elige nombres de una lista que fija el servidor.

### Contrato de herramientas
- `js/assistant-domain-tools-core.js` (`RubikAssistantDomainTools.execute(tool,args,ctx,callId)`): 12 herramientas **de solo lectura** y deterministas (`list_capabilities`, `get_project_summary`, `list_rooms`, `get_room`, `get_quantities`, `get_budget_summary`, `get_layout_review`, `list_materials`, `list_objects`, `list_catalog_products`, `get_placed_products`, `get_visual_references`). Argumentos de lista cerrada; resultado `AssistantToolResultV1` con procedencia (motor, proyecto, revisión por contenido, estado medido/estimado).
- `expectedProjectId` / `expectedRevision` son comprobaciones **defensivas**, explícitamente **no autenticación** (comentario del propio archivo).

### Confirmaciones
- `js/assistant-proposals-core.js`: dos operaciones tipadas (`set_room_floor_material`, `move_object`). `plan` valida en una COPIA y produce un diff; **nada escribe** hasta que la persona pulsa «Aplicar», que revalida contra el proyecto vigente y entra en **un solo paso del commit del editor** (`FloorPlanApp.applyAssistant`), con deshacer y guardado de siempre.

### Identidad, operador y destinatario
- RUBIK **no tiene cuentas de usuario**. El acceso a servicios con gasto usa **códigos de acceso provisionales** por servicio (`RUBIK_*_TOKEN`), comparados en tiempo constante en servidor.
- El **destinatario** de una entrega recibe una **visita de solo lectura** (`js/delivery-client.js`, `window.RUBIK_DELIVERY`): no puede modificar la vivienda.
- El identificador de proyecto y la **profesión elegida en Home** (`js/guide-ui.js`) **no conceden permisos**.
- **Conclusión:** no hay identidad verificable de operador → el trabajo queda limitado al **laboratorio local con datos de ejemplo**, como indica el encargo.

### Mapa de capacidades del piloto (los tres recorridos)
| Caso | Recorrido real de RUBIK reutilizado | Archivo · función | Datos | Permiso | Salida visible |
|---|---|---|---|---|---|
| Consultar superficies | Lo que muestra «Superficie de las estancias» | `js/assistant-domain-tools-core.js` · `execute('list_rooms')` → `FloorPlanQuantities.room` | Proyecto activo (iframe) | Solo lectura | Tabla por estancia + total, con estado medida/estimada y fuente |
| Enfocar una estancia | Tocar la estancia en el plano | `index.html` · `select({kind:'room',id})` (Inspector); en 3D `View3D.focusRoom` | Id de estancia por nombre visible (`FloorPlanDisplayName`) | Vista temporal, no modifica | Estancia seleccionada en el plano y en el Inspector |
| Continuar con el Asistente de texto | Botón «Asistente» | `js/assistant-ui.js` · `RubikAssistantUI.open()` (+ `ask` solo con texto autorizado) | Ninguno por defecto | Traspaso solo con autorización | Panel del Asistente abierto en RUBIK |

### Inventario candidato (no incluido en el piloto; destino por validar)
Vistas, sol, cortes, capas, despiece y recorrido (`View3D`, `nav3d-ui`, Blueprint/Despiece `bpdp/`), informes de superficies y holguras (`get_quantities`, `get_layout_review`), emplazamiento (Analizar → territorio), presupuesto (`get_budget_summary`, **interno**), entregables (Entregar). GIS, LiDAR, normativa local, Street View y servicios de pago dependen de capacidades y autorizaciones reales (p. ej. Places/Routes/Street View exigen `RUBIK_CONTEXT_*`, hoy sin configurar en Preview).

## Laboratorio (SCULPT)

- **Sandbox** `labs/asesor-rubik/`: estilo RUBIK; avatar identificado como **IA**; distintivos **«Sesión simulada»** y **«Voz real apagada · sin conexión a Nuance»**; botón **«Continuar por texto»** siempre visible; visor = RUBIK real con la vivienda de ejemplo.
- **Contrato** (`tools.js`): una sola lista canónica; perfiles (los seis de Home) y modos **seleccionan subconjuntos explícitos**. Modo cliente = `consultar_superficies`, `enfocar_estancia`, `continuar_por_texto`. Modo técnico añade `resumen_presupuesto` y `proponer_cambio_suelo` (solo propuesta). Definiciones en formato plano con `annotations.readOnlyHint/destructiveHint` y `parameters.required`; máximo 16. **La autorización se aplica en ejecución** (`authorize`): sesión viva, proyecto vinculado, herramienta del modo, argumentos válidos, y cualquier herramienta no de solo lectura exige el flujo de confirmación de RUBIK.
- **Adaptador** (`adapter.js`, `SimAdapter`): inicio **solo por gesto** (`isTrusted`), conexión, subtítulos, llamada de herramienta, error, cambio a texto, cierre; **desvincula** la conversación si cambia el proyecto activo; no usa micrófono, cámara ni red.
- **Límites y alternativa**: permiso de micrófono denegado, credencial inválida (401), sin acceso (403), concurrencia (409), saldo (429 `credits_spent`), límite de inicios (429 `start_limit`), capacidad (429 `capacity_unavailable`), indisponible (503) y pérdida de conexión. Siempre se ofrece **seguir por texto**; **sin reintentos automáticos**; como mucho **2 reintentos manuales** por sesión.

## Pruebas (Playwright + Chromium) · resultados

Comando (desde la raíz de la rama):
```
CHROME=<ruta de Chromium> node --test tests/asesor-rubik-lab.browser.test.cjs
```
Resultado en `claude/asesor-rubik-en-vivo`: **2/2 en verde** (1440×900 ratón y 390×844 táctil).

| Comprobación | 1440 | 390 |
|---|---|---|
| Sin gesto no hay sesión (`isTrusted:false` → bloqueado) | ✓ | ✓ |
| Inicio por clic; subtítulo «una IA… sesión simulada» | ✓ | ✓ |
| Superficies: una fila por estancia y total = motor de RUBIK (87,18 m², 13 estancias) | ✓ | ✓ |
| Enfocar «Salón»: `ui.sel` = Salón; proyecto idéntico | ✓ | ✓ |
| **Modo cliente**: «Presupuesto» y «Cambiar suelo» → **rechazo visible** (`not_allowed_in_mode`) y **proyecto idéntico** (JSON byte a byte) | ✓ | ✓ |
| Modo cliente: `publicar_enlace` rechazada; definiciones del cliente = solo las 3 consultas | ✓ | ✓ |
| Continuar por texto: `RubikAssistantUI.state.open === true` | ✓ | ✓ |
| Cerrar: estado `ended`, recursos 0, temporizadores 0; foco vuelve a «Iniciar» | ✓ | ✓ |
| Técnico: propuesta de suelo → `confirmation_required`, proyecto intacto | ✓ | ✓ |
| 8 errores: mensaje, código, foco en «Continuar por texto», sin reintento automático (1,2 s), recursos 0 | ✓ | ✓ |
| Reintentos manuales ≤ 2 | ✓ | ✓ |
| Pérdida de conexión en curso | ✓ | ✓ |
| Cambio de proyecto → conversación desvinculada | ✓ | ✓ |
| **Red: 0 peticiones a Nuance y 0 a hosts externos** (todas a `127.0.0.1`; ver `*-red.json`) | ✓ | ✓ |
| Sin errores de página; sin texto CJK en resultados | ✓ | ✓ |

## Incidencias
1. Detectada y corregida durante la validación: «Cambia el suelo del salón» se interpretaba como «enfocar el salón» (el nombre de estancia se evaluaba antes que el verbo). Ahora la intención se evalúa primero.
2. El guion de intenciones del laboratorio es un sustituto **determinista** del modelo del proveedor; no lo imita ni mide su calidad.

## Punto exacto para reanudar un Preview autorizado (no ejecutado)
Requiere autorización del propietario. Pasos:
1. Ruta de servidor nueva (p. ej. `api/advisor-session.js`), cerrada por defecto, con la clave del proveedor solo en servidor.
2. Identidad verificada del operador (hoy inexistente) antes de emitir un token de un solo uso.
3. Demostrar en el Preview previsto:
   - el tope `max_session_seconds` aplicado por el servidor al crear la conversación;
   - la reserva de cuota (`GET /usage`; créditos e inicios como límites separados);
   - el cierre y la reconciliación fiables ante interrupciones.
4. Sustituir `SimAdapter` por un adaptador real con la misma interfaz (`start/hear/close/simulate→eventos reales`). Las herramientas se ejecutarían igual, porque `authorize` ya está en el punto de ejecución.

**Español:** según su documentación, la API está en vista previa con voz y reconocimiento en inglés. La salida a clientes en español requiere validar reconocimiento y respuesta hablada en español en una conversación real.

**Límites que se respetan:** sin llamadas reales a Nuance, sin gasto, sin fusión a `master` y sin producción.
