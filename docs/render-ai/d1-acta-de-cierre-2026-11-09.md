# RENDER AI D1 — Acta de cierre (09/11/2026)

**Conclusión:** **Render IA D1 está operativo y validado para la generación básica en Production.** Hay una generación real correcta, revisada visualmente por el propietario. Los pendientes secundarios quedan registrados abajo; ninguno invalida el cierre.

| Concepto | Valor |
|---|---|
| Entorno | Production |
| URL | https://floorplan-3d-alpha.vercel.app |
| Commit | `master@5fb7a5c1387c85614666367238510934167d4809` |
| Despliegue activo | `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi` (READY, Production; verificado el 09/11/2026) |
| Proyecto Vercel | `floorplan-3d` |
| Secretos | Ninguno figura en este documento. No se han leído ni copiado valores secretos. |

## 1. Integración (código)

| PR | Contenido | Merge en master | CI de la PR |
|---|---|---|---|
| #180 | Acceso y límites en el servidor: interruptor, origen, freno a códigos erróneos, límites por hora y día | `a12a01e` | 6/6 sobre `db81ee3` |
| #182 | Consumo de tokens, coste estimado (solo con tarifa configurada) y registro `rubik-render` | `8896055` | 6/6 sobre `9bfab08` |
| #181 | IMG-01: acabados completos en la imagen exportada | `5fb7a5c` | 6/6 sobre `aad6d75`, reconciliada con #180 y #182 |
| CI de master sobre `5fb7a5c` | Guided experience, Project-First (incluye `ai-render-api`, `ai-render.browser` y `delivery-image-detail`) y Multiformat | — | 3/3 en verde |

Documentación técnica: `docs/render-ai/d1-pr1-acceso-y-limites.md`, `d1-pr3-img01-textos-exportacion.md` y `d1-pr4-img02-consumo-y-coste.md`.

## 2. Cronología real de la activación

| # | Hecho | Quién | Resultado |
|---|---|---|---|
| 1 | Se crea `RUBIK_RENDER_ENABLED=1` en Production y Preview | Claude, con autorización del propietario | Creada |
| 2 | Se crea `RUBIK_RENDER_MODEL=gpt-image-2.5-sunburst` en Production **solo si no existía** | Claude, con autorización | Creada: **no existía**. Hasta entonces Production usaba el modelo de reserva del código (`gpt-image-1`, retirado). |
| 3 | Redespliegue de master y Promote | Claude | `dpl_fzFZHVzeHBLCb5aM349scQCGNfBB` promocionado |
| 4 | **Incidencia A:** «El Render IA no está configurado…». Causa: `OPENAI_API_KEY` estaba asignada a Preview pero no a Production. | Propietario + ChatGPT con el conector de Vercel | La variable se extiende a Production conservando su valor. Nuevo despliegue `dpl_E8B26KYdaB4ffbHKiTPnqmDojcL2`, READY y promocionado. |
| 5 | **Incidencia B:** «El código de acceso no es correcto» | Propietario + ChatGPT | Rotación controlada **solo** del `RUBIK_RENDER_TOKEN` de Production. Preview y Development conservan los suyos; la variable sigue siendo sensible. Despliegue `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi`, READY y promocionado. |
| 6 | Pruebas de autenticación sin coste de proveedor, contra el dominio público | ChatGPT | Código correcto con cuerpo `{}` → **400 `style`**: la autenticación pasa y se rechaza antes de llamar al proveedor. Código incorrecto → **401 `token`**. |
| 7 | **Generación real** en Production: «Proyecto de ejemplo» · «Render IA · Salón» | Propietario | Correcta: imagen fotorrealista obtenida y descargada |

Los pasos 4 a 7 los ejecutaron el propietario y ChatGPT. Esta acta los registra según su relato. **El paso 7 está además corroborado por el registro de Vercel** (sección 3).

## 3. Evidencias

| Evidencia | Tipo | Detalle |
|---|---|---|
| Registro `rubik-render` de Production | **Automática (log del servidor)** | 13:55:31 UTC · `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi` · `POST /api/render` · `"model":"gpt-image-2.5-sunburst"`, `"status":"ok"`, `"ms":21317`, `"style":"natural"`, `"floor":null`, `"walls":null`, `"usage":{"inputTokens":1395,"outputTokens":601,"totalTokens":1996,"inputTextTokens":95,"inputImageTokens":1300}`, `"cost":null`. Sin imagen, código, clave ni IP, como diseñó #182. |
| Consumo mostrado en la interfaz | Humana | «1.996 tokens». **Coincide** con el registro. |
| Geometría | **Validación visual humana del propietario** | El propietario comparó la imagen con el proyecto original y confirma que la geometría se conserva en esa imagen. **No es una prueba geométrica automatizada** ni garantiza la fidelidad de renders futuros. |
| Descarga y banda | Humana | Descarga correcta. La banda incluye el proyecto, la identificación «Render IA · Salón» y el aviso de imagen IA orientativa. |
| Archivo PNG de la prueba | **No incorporado** | Se aportó en otro chat y no está en este entorno ni en el repositorio. Si se quiere como evidencia formal, el propietario debe facilitarlo. |

## 4. Estado por componente

| Componente | Estado |
|---|---|
| Integración #180 / #181 / #182 | **Hecho** (master `5fb7a5c`) |
| Configuración de Production (interruptor, modelo, clave del proveedor, código de acceso) | **Hecho** (sección 2) |
| Despliegue y Promote | **Hecho** (`dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi`) |
| Autenticación con código correcto | **Validada** (400 `style`, sin coste) |
| Rechazo de código incorrecto | **Validado** (401 `token`) |
| Generación fotorrealista | **Validada** en Production (propietario + log) |
| Geometría de la imagen probada | **Validada visualmente** por el propietario |
| Descarga | **Validada** |
| Consumo de tokens | **Validado**: 1.996, en la interfaz y en el log |
| Modelo usado | **Acreditado por el log**: `gpt-image-2.5-sunburst`. Se distinguen tres cosas: el valor configurado en Vercel (`gpt-image-2.5-sunburst`, creado el 09/11), el modelo registrado en la llamada real (el mismo) y el modelo de reserva del código (`gpt-image-1`, que solo se usa si falta la variable). |
| IMG-01, acabados completos | **Implementado y probado en CI** (`delivery-image-detail`: 20 combinaciones sin «…», PNG idénticos sin acabados). **Revisión humana pendiente:** la prueba real no usó acabados (`floor` y `walls` null). No se gastará otra generación sin autorización. |
| Coste estimado | **No acreditado**: no hay tarifas configuradas (`cost: null`) |
| Coste facturado | **No acreditado**: es el de la factura del proveedor |
| Presupuesto global garantizado | **No implementado**: los límites de #180 viven en la memoria de cada instancia; son un freno, no un tope global |

## 5. Puertas del catálogo maestro

| ID | Estado | Nota |
|---|---|---|
| GOV-01a fusionar | ✔ Hecho | — |
| GOV-01b configurar | ✔ Hecho | Incluye las correcciones posteriores: `OPENAI_API_KEY` en Production y rotación del código |
| GOV-01c Promote | ✔ Hecho | Despliegue final `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi` |
| GOV-09a prueba **antes** del Promote | ⚠ **No realizada en ese orden** | No hubo prueba en Preview antes del Promote. Se registra la **desviación cronológica**: la compatibilidad se acreditó **después**, en Production (GOV-09b). |
| GOV-09b confirmación **después** | ✔ Hecho | Log real: modelo `gpt-image-2.5-sunburst`, estado ok |

## 6. Riesgos residuales y decisiones pendientes

| Riesgo o pendiente | Severidad | Decisión del propietario |
|---|---|---|
| **`api/share.js` comparte el código de acceso del render.** Con la rotación de Production, publicar enlaces de cliente también depende del código nuevo. | Alta | Ver la auditoría ENT-02/GOV-08 |
| Límites de gasto por instancia, sin tope global | Media | Fijar el presupuesto mensual en la cuenta del proveedor (tope vinculante) |
| Tarifas no configuradas: no se ve el coste estimado | Baja | Opcional: `RUBIK_RENDER_PRICE_INPUT_TEXT`, `_INPUT_IMAGE` y `_OUTPUT` |
| Código de acceso compartido por todos los profesionales | Media | GOV-06a (cuentas y cuotas por profesional) |
| IMG-01 sin revisión humana con acabados | Baja | En la próxima generación que se haga con acabados por uso real, revisar la banda descargada |
| PNG de la prueba fuera del repositorio | Baja | Facilitarlo si se quiere archivar |

**D1 no se reabre** salvo que aparezca una regresión real.
