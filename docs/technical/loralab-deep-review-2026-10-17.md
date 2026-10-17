# LoRA LAB y Summerz3002 frente a Rubik: matriz de candidatos (17-10-2026)

**Estado: revisión de producto para una decisión futura. No es una fase aprobada, no altera el [roadmap canónico](../ROADMAP.md) ni el orden orientativo 4–8 de [Roadmap 2](../ROADMAP-2-proposal.md#3-secuencia-propuesta), y no contiene código.**

Amplía la [nota exploratoria](loralab-design-reference-2026-10-17.md) y la [auditoría de la grabación de Juanma](loralab-video-gap-audit-2026-10-17.md). No reutiliza código, modelos ni texturas de terceros.

## Qué se pudo comprobar en esta revisión

| Fuente | Intento | Resultado |
| --- | --- | --- |
| Demo de LoRA LAB (`fun.loralab.top`) | Navegador del contenedor, `curl` y WebFetch, 17-10-2026 ~18:00–19:30 UTC | **No accesible.** El nombre no resuelve (`ENOTFOUND`) por ninguna de las vías. No pude recorrer la demo en escritorio ni en móvil. |
| Grabación de Juanma (3:24, SHA-256 `b9ab170d…`) | Auditada en `bf9680a` por otra sesión | Única evidencia directa de LoRA LAB en este repositorio. No he visto el vídeo; uso sus observaciones tal como están registradas. |
| Publicación de Summerz3002 en X | WebFetch | **No accesible** (`x.com` no resuelve). |
| Perfil o fork de Summerz3002 en GitHub | WebFetch y búsqueda web | El perfil `github.com/Summerz3002` devuelve **404**; no encontré ningún fork ni repositorio con la ampliación CAD/Blender. |
| Base `wy51ai/floorplan-3d` | WebFetch de GitHub | Accesible. **MIT**, 9 commits, 456 forks. Su README describe exportar PNG y exportar/importar JSON, con `localStorage`. **No menciona CAD, DXF/DWG ni Blender.** |
| Rubik | Código de `9e3ba33` (#39) y `master` `3fdbc0f` | Comprobado en el repositorio (ver columna «Rubik»). |

**Consecuencia:** la parte «recorrer la demo en escritorio y móvil» de la evaluación profunda **queda pendiente**. Para completarla hace falta acceso desde un equipo que resuelva `fun.loralab.top`, o que Juanma grabe la sesión móvil igual que la de escritorio. Nada de la columna LoRA LAB está reverificado por mí. La ampliación CAD/Blender de Summerz3002 sigue siendo una afirmación sin código público localizable y **no se atribuye a LoRA LAB ni a `wy51ai`**.

## Matriz

- **Coste:** S = un corte acotado; M = varios cortes o contrato extendido; L = contrato nuevo y migración.
- **Dependencia del contrato:** «ninguna» si `FloorPlanProjectV1` no cambia; «sidecar» si basta un archivo de presentación o exportación separado, como el de orden de paradas de #39 o el sidecar visual de #42; «versión» si exige ampliar el contrato con migración.

| Capacidad | LoRA LAB (evidencia y límite) | Rubik (comprobado en código) | Limitación observable en Rubik | Coste | Contrato |
| --- | --- | --- | --- | --- | --- |
| Varias plantas | Grabación: cambio 1F/2F/3F y corte de niveles en la villa; altura y superficie por planta. No se vio construir ni recorrer el enlace entre plantas. | Una planta. El contrato no tiene niveles; el importador IFC escoge la planta con más muros e informa de que hay más. | Una vivienda de dos plantas no se representa. | **L** | **versión** (nivel, elevación, pertenencia, forjado, hueco y escalera) |
| Exterior y cubierta | Grabación: materiales de fachada, cubierta y terreno; terraza, jardín y piscina en la plantilla. | No hay entidades de terreno, fachada ni cubierta. Balcones como estancias; superficies y objetos acotados. | No hay presentación de parcela ni envolvente. | **M–L** | **versión** para la cubierta; terreno o fachada derivados podrían ir en sidecar |
| Sol y luz | Grabación: norte, hora, mes, latitud, luces interiores y día/noche funcionando. Sin exactitud solar verificada. | Control de hora de 7 a 18 h (`#sun`), que mueve el `DirectionalLight` por un arco estilizado (`applyLight`, sin astronomía); presets HDR neutro/cálido (M09). Sin fecha, latitud ni norte. #42 usa un sol fijo propio en Blender. | La luz no se orienta a la casa real, y el 3D web y el render Blender no comparten sol. | **S** | **sidecar** de presentación (norte, fecha, latitud); ninguno en `FloorPlanProjectV1` |
| Visita libre | Grabación: desde la puerta, ojos a 1,70/1,05 m, WASD, E puertas/ventanas/cortinas, L luces. | Recorrido en primera persona con `PointerLockControls`, joystick táctil y puertas que se abren al hacer clic. Visita guiada por estancias de #39, con ojos a 1,5 m. | Altura de ojos fija; sin luces ni cortinas interactivas. | **S–M** | ninguno para la altura; **versión** para luces y cortinas como entidades |
| Edición | Grabación: Construir / Amueblar / Exterior en la misma escena; plantillas. No se probó guardar y reabrir. | Muros, huecos, estancias, cotas, objetos y catálogo F3; guía de pasos; materiales de suelos y paredes; importador multiformato en #38. | Flujo repartido entre guía, editor y presentación (cuestión de descubrimiento, no de capacidad). | — | ninguna |
| Exportación | Grabación: JSON, imagen del plano, captura 3D y copiar enlace. No se inspeccionó el JSON ni el enlace. | JSON, ZIP portable (proyecto e imagen), PNG de vistas y estancias, lámina SVG, paquete GLB/Blender (#24) y vídeo offline (#42). | Sin enlace compartible (requiere servicio, privacidad y caducidad). | — / M para enlace | ninguna |
| CAD → Blender (Summerz3002) | No forma parte de LoRA LAB según la grabación. | DXF en el importador multiformato de #38 y salida Blender por #24 y #42. | La ampliación de Summerz3002 no es verificable: sin código, licencia ni ejemplo. | — | — |

## Candidatos, sin fase aprobada

Ninguna fila de la matriz es la siguiente entrega. La secuencia vigente es la de la [auditoría de la grabación](loralab-video-gap-audit-2026-10-17.md#candidatos-y-dependencias-sin-cambiar-las-fases-del-roadmap): cerrar y revisar las PR en curso y después seguir el roadmap canónico y los gates fase a fase de Roadmap 2. Varias plantas, exterior y sol son **candidatos del mismo rango**; esta revisión sólo añade datos de coste y de dependencia del contrato para cuando el roadmap llegue a esa decisión.

| Candidato | Por qué podría elegirse | Qué lo frena hoy | Antes de abrirlo |
| --- | --- | --- | --- |
| Varias plantas y escalera | Mayor brecha estructural frente a la grabación. | Coste **L**: versión del contrato con migración. | Documento de diseño del contrato con su propio gate. |
| Exterior y envolvente | Presentación de parcela y fachada. | Coste **M–L**; la cubierta exige versión del contrato. | Decidir el segmento: vivienda, reforma/profesional o presentación. |
| Sol orientativo compartido entre el 3D web y Blender | Complementa #39 y #42 sin tocar `FloorPlanProjectV1`; se puede medir con valores de referencia. | Valor no confirmado para el público que se elija; depende de que #39 y #42 se integren. | Confirmar público y valor, y que el sidecar de presentación es el lugar correcto. |

Si en su momento se elige el sol, un alcance acotado sería: norte del plano, fecha, hora y latitud en el sidecar de presentación, con un algoritmo solar estándar y la etiqueta «simulación visual orientativa, no estudio solar ni energético». Aplicaría el mismo vector al `DirectionalLight` del 3D y al sol de #42. Los criterios medibles serían: ±1° frente a valores publicados (3 ubicaciones × 4 fechas); norte 0° y 90° giran la sombra 90°; JSON, IDs e historial sin cambios; coste ≤ 1 ms por fotograma en GPU y sin regresión en un móvil real sin GPU; y la misma dirección de sombra en el render de #42 y en la captura web. Es una referencia de dimensionado, **no una propuesta aprobada**.

## Pendiente de decisión de Juanma

1. Qué entrega del roadmap sigue al cierre de #38/#39/#42, y si en algún momento entra alguno de estos candidatos.
2. Facilitar el recorrido móvil de LoRA LAB, en grabación o con acceso desde otro equipo, para cerrar la parte de la evaluación que aquí no fue posible.
3. Si aparece el código de Summerz3002: SHA, licencia y un DXF de ejemplo para reproducirlo antes de considerar ninguna reutilización.
