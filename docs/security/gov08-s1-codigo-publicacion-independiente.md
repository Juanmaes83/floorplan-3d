# GOV-08 S1 — Código de publicación independiente del Render IA

**Fecha:** 09/11/2026 · **Base:** `master@5f1df46` · **Alcance:** solo S1. **No incluye** retirar enlaces (S2), caducidad (S3), cuotas persistentes (S4), identificadores opacos o Blob privado (S5), la visita 3D de #166 (S6) ni cuentas.
**Secretos:** este documento no contiene ninguno. Las pruebas usan códigos ficticios.

## 1. Problema
Antes de S1, `api/share.js` autorizaba la publicación con `RUBIK_RENDER_TOKEN`. El mismo código servía para generar imágenes de pago y para guardar archivos en el Vercel Blob del propietario. Además, el código de Production se mostró en una conversación anterior, así que **debe considerarse expuesto**.

## 2. Permisos antes y después

| Operación | Antes | Después de S1 |
|---|---|---|
| Generar Render IA (`api/render.js`) | `RUBIK_RENDER_TOKEN` en la cabecera `x-rubik-render-token` | **Sin cambios** |
| Publicar enlace (`api/share.js`) | `RUBIK_RENDER_TOKEN` en la cabecera `x-rubik-render-token`, comparado con `!==` | `RUBIK_SHARE_TOKEN` en la cabecera `x-rubik-share-token`, comparado en tiempo constante (SHA-256 + `timingSafeEqual`). La cabecera y el código del render se **ignoran**. |
| Sin `RUBIK_SHARE_TOKEN` | — | **503 `not-configured`**. No hay ninguna alternativa con el código antiguo. |
| `RUBIK_SHARE_TOKEN` igual a `RUBIK_RENDER_TOKEN`, o de menos de 32 caracteres | — | **503 `misconfigured`**: no se publica |
| Petición desde otro sitio web (`Origin` distinto) | Aceptada si el código era correcto | **403 `origin`**, la misma regla que el render |
| Código guardado en el navegador (Entregar) | `localStorage['rubik-render-token']`, la misma clave que el render | **Solo en memoria** mientras la página está abierta. Nunca lee, copia ni borra el código del render. |
| Evolución de obra 4D (`evolucion/`) | Código tecleado que viajaba en `x-rubik-render-token` | Código tecleado que viaja en `x-rubik-share-token`; no se guarda |
| Abrir un enlace ya publicado (`api/view.js`) | Lee el Blob propio | **Sin cambios**: los enlaces anteriores siguen abriéndose |

Los dos códigos no son intercambiables en ningún sentido, y no hay periodo de transición: en cuanto S1 está activo, el código del render ya no publica.

## 3. Archivos

| Archivo | Cambio |
|---|---|
| `api/share.js` | Nuevo permiso, comparación en tiempo constante, comprobación de origen, `misconfigured` y ninguna alternativa con el código antiguo |
| `js/share-link-ui.js` | Campo «Código de publicación de enlaces» con el aviso «Es distinto del código del Render IA», código solo en memoria, nueva cabecera y mensajes claros |
| `evolucion/delivery-ui.js`, `evolucion/index.html` | Nueva cabecera, etiqueta y texto. Se corrige el texto «el mismo que para Render IA». |
| `js/construction-delivery-core.js` | Mensajes `not-configured`, `misconfigured`, `origin` y `token` |
| `tests/share-api.test.cjs` | Matriz completa de autenticación de la publicación |
| `tests/ai-render-api.test.cjs` | El código de publicación no autoriza el render, en ninguna de las dos cabeceras |
| `tests/share-link.browser.test.cjs` | Campo propio y vacío; el código del render no publica ni se toca; el código no se guarda en el navegador; nunca se envía la cabecera del render |
| `tests/ft3d-8-delivery.browser.test.cjs`, `tests/construction-delivery-core.test.cjs` | Nueva cabecera y nuevos textos. Son los cambios intencionados de S1. |

**Sin cambios:** `api/render.js`, `js/ai-render-ui.js` y `api/view.js`.

## 4. Matriz de pruebas (automáticas, con códigos ficticios)

| Operación | Código | Resultado esperado | Prueba |
|---|---|---|---|
| Render IA | Código del render válido | Autenticación aceptada | `ai-render-api` (pruebas existentes) |
| Render IA | Código de publicación válido, en cualquiera de las dos cabeceras | 401 `token` | `ai-render-api` «S1: RUBIK_SHARE_TOKEN does not authorise the render» |
| Render IA | Código incorrecto | 401 | `ai-render-api` (existente) |
| Publicar | Código de publicación válido | Autenticación aceptada (se para en la validación siguiente, sin llamar al almacén) | `share-api` «S1: only RUBIK_SHARE_TOKEN publishes…» |
| Publicar | Código del render, en cualquiera de las dos cabeceras | 401 | ídem |
| Publicar | Código de publicación en la cabecera antigua | 401 | ídem |
| Publicar | Código incorrecto, casi igual, vacío, ausente o de más de 200 caracteres | 401 | ídem y la prueba existente |
| Publicar | Sin `RUBIK_SHARE_TOKEN`, aunque exista y se envíe el código del render | 503 `not-configured` | ídem |
| Publicar | Los dos códigos iguales, o código débil | 503 `misconfigured` | ídem |
| Publicar | Otro origen | 403 `origin` | ídem |
| Publicar | GET | 405 | prueba existente |
| Publicar | Los códigos no aparecen en respuestas ni en lo que se envía al almacén | Verificado | «S1: the codes never appear…» |

## 5. Activación en Production (requiere una acción del propietario)

Ni Claude ni ninguna herramienta de esta sesión deben generar, ver ni transportar el código real. Pasar un valor por el chat, por un argumento de herramienta o por un archivo del entorno remoto lo expondría. Por eso **el propietario genera el código en su propio equipo y lo guarda directamente** en su gestor de contraseñas y en Vercel.

1. **Generar el código en tu equipo, sin mostrarlo.** Usa el generador del gestor de contraseñas (al menos 43 caracteres aleatorios, sin espacios) o este comando, que copia 64 caracteres hexadecimales (256 bits) al portapapeles sin mostrarlos en pantalla:
   - macOS: `openssl rand -hex 32 | tr -d '\n' | pbcopy`
   - Linux: `openssl rand -hex 32 | tr -d '\n' | xclip -selection clipboard`

   Guárdalo **antes que nada** en tu gestor de contraseñas como «RUBIK — código de publicación de enlaces».
2. **Crearlo en Vercel:** Project `floorplan-3d` → Settings → Environment Variables → Add.
   - Nombre: `RUBIK_SHARE_TOKEN`.
   - Valor: pégalo.
   - Entorno: **solo Production**.
   - Tipo: **Sensitive**.
   - No reutilices el valor de `RUBIK_RENDER_TOKEN`; el servidor lo rechaza con `misconfigured`.
3. **Avisar a Claude con «RUBIK_SHARE_TOKEN creado».** Sin el valor. Claude comprueba que la variable existe por su nombre y ámbito, sin leerla.
4. **Claude fusiona S1.** Vercel crea un despliegue de Production con la variable. Claude comprueba que una petición sin código devuelve **401** (si devuelve 503, la variable falta o no es válida). Después lo promociona.
5. **Comprobación tuya, sin publicar nada.** Este comando pide el código sin mostrarlo, no lo pone en el historial ni en los argumentos del proceso, y usa un tipo de archivo no válido para que la petición se detenga antes del almacén:
   ```bash
   read -rs -p "Código de publicación: " C; echo; curl -s -X POST https://floorplan-3d-alpha.vercel.app/api/share -H @<(printf 'x-rubik-share-token: %s\n' "$C") -H 'x-rubik-share-kind: none' --data x -w '  HTTP %{http_code}\n'; unset C
   ```
   - El código de publicación debe dar `{"error":"kind"}  HTTP 400`: el código es correcto y no se ha guardado nada.
   - El código del Render IA debe dar `{"error":"token"}  HTTP 401`.
6. **Las pestañas de Rubik ya abiertas** fallarán al publicar hasta que se recarguen y se introduzca el código nuevo. La interfaz lo explica.

**Recuperación.** Si S1 falla en Production, primero se corrige la causa: casi siempre es la variable (nombre, ámbito o valor). Volver a `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` recupera el servicio, pero **reactiva el permiso compartido**. Solo debe hacerse con conocimiento del propietario y de forma temporal. Volver atrás en Vercel no revierte master.

## 6. Rotación del código del Render IA (después de S1)

Se hace solo cuando S1 está en Production y verificado:
1. Generar en tu equipo otro código distinto, con el mismo método del paso 1, y guardarlo en el gestor como «RUBIK — código Render IA».
2. En Vercel, editar **solo** `RUBIK_RENDER_TOKEN` en **Production**. No se tocan Preview ni Development.
3. Avisar a Claude con «RUBIK_RENDER_TOKEN rotado». Claude crea un despliegue nuevo, porque las variables solo se aplican a despliegues nuevos, lo promociona y comprueba que un código incorrecto da **401 `token`**.
4. Comprobación tuya, sin coste:
   ```bash
   read -rs -p "Código Render IA: " C; echo; curl -s -X POST https://floorplan-3d-alpha.vercel.app/api/render -H 'Content-Type: application/json' -H 'Origin: https://floorplan-3d-alpha.vercel.app' -H @<(printf 'x-rubik-render-token: %s\n' "$C") --data '{}' -w '  HTTP %{http_code}\n'; unset C
   ```
   - El código nuevo debe dar `{"error":"style"}  HTTP 400`: la autenticación pasa y la petición se rechaza antes de llamar a OpenAI.
   - El código antiguo debe dar 401.
5. En Rubik, el diálogo de Render IA mostrará «código no correcto» con el código antiguo; se introduce el nuevo.

**Atención:** el render tiene un freno por códigos erróneos. Si se prueba muchas veces con códigos incorrectos, la instancia bloquea durante una hora y responde 429. Basta con una prueba de cada.

## 7. Riesgos residuales tras S1 (no los resuelve S1)

| Riesgo | Estado |
|---|---|
| El código actual del Render IA está expuesto | **Pendiente** hasta la rotación del §6 |
| Enlaces públicos de Blob: la URL del Blob va dentro del enlace y se puede abrir directamente | Pendiente (S5) |
| Retirada individual de enlaces desde Rubik | Pendiente (S2). Hoy se borran en el panel de Vercel Blob. |
| Caducidad de los enlaces | Pendiente (S3) |
| Cuotas persistentes de publicación y almacenamiento | Pendiente (S4) |
| `/api/view` con `Cache-Control: max-age=60` | Pendiente (S2) |
| Un único código de publicación compartido por todos los profesionales | Pendiente (GOV-06a, cuentas) |

**S1 no hace privadas las entregas ya publicadas:** solo separa quién puede **crear** enlaces nuevos.

## 8. Auditoría adversarial (11/11/2026)

Se ejecutó sobre `54e6fc3` **sin cambiar el código**, con códigos ficticios, un almacenamiento y un proveedor de IA simulados que hacen fallar la prueba si se les llama, y la consola capturada. Batería: `tests/gov08-s1-adversarial.test.cjs`, 5 pruebas, todas **ya correctas antes de esta auditoría**.

| Comportamiento atacado | Resultado |
|---|---|
| 12 variantes de credencial: ausente, vacía, errónea, código del render en la cabecera de publicación, código de publicación en la cabecera antigua, ambas cabeceras a la vez, más de 200 caracteres, prefijo, espacios, cabecera duplicada (array), número y token del Blob | 401 `token`, sin llamar al almacenamiento |
| 7 configuraciones: sin Blob, sin código, solo el código del render, código de 31 o de 201 caracteres, mismo valor que el render, código vacío | 503 (`not-configured` / `misconfigured`), también enviando el código del render: **sin *fallback*** |
| 7 orígenes: sitio ajeno, `null`, valor mal formado, subdominio engañoso, otro puerto, consulta con el host y `x-forwarded-host` en lista | 403 `origin` aunque el código sea correcto. El propio host y las herramientas sin `Origin` se juzgan solo por el código |
| Aislamiento cruzado | El código de publicación nunca autoriza el Render IA (3 combinaciones de cabeceras) y el del render nunca publica |
| Fugas | Ninguna respuesta ni salida de consola contiene los códigos, el token del Blob ni la clave del proveedor. Toda respuesta lleva `Cache-Control: no-store` y solo `{error}` |

**Resultado: sin defectos reproducibles en S1. No se modifica su código.** La batería se añade a la CI (`project-first.yml`).

**Observaciones fuera del alcance de S1**, registradas en la deuda residual:
- `api/render.js` compara longitudes antes de `timingSafeEqual`, lo que puede filtrar la longitud del código del render por tiempos;
- la interfaz del Render IA guarda su código en `localStorage`.

Ninguna de las dos se toca aquí: el Render IA queda fuera de este corte.
