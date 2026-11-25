# §3 · Render IA · comparación de estilos y exportación 2K–4K

Encargo `121ad35a` §3 · rama `claude/visualizacion-home` · base `899415f3`. Todas las pruebas son locales y **sin proveedor**: `/api/render` se intercepta con imágenes de prueba locales (`tests/fixtures/render-ia`).

| Requisito | Estado | Evidencia |
|---|---|---|
| Catálogo canónico para Home, cliente y API | `js/render-styles.js`; la API y el cliente lo usan | `render-styles.test.cjs` |
| Industrial y Mediterráneo | Añadidos (texto al generador en inglés) | ídem |
| Nórdico y Escandinavo como una sola opción visible | Una opción, «Nórdico» (id `scandinavian`) | selector comprobado en el navegador |
| Conservar identificadores aceptados y estilos de proyectos previos | `natural`, `warm`, `scandinavian`, `premium` intactos; alias `nordic`, `nórdico`, `escandinavo`, `mediterráneo`; rechaza `__proto__` y desconocidos | `render-styles.test.cjs`, `ai-render-api` 14/14 |
| Misma captura fuente, encuadre y revisión para todas las variantes | Las 3 variantes de la prueba envían la misma imagen; solo cambia el estilo | `render-ia-resolucion.browser.test.cjs` |
| Descarga 2K y 4K con dimensiones por encuadre y píxeles reales | 16:9 → 2560 × 1440 y 3840 × 2160; 3:2 → 2560 × 1707 y 3840 × 2560; vertical conserva el encuadre. El PNG se lee y se comprueba | prueba 2/2; `descargas-ffprobe.txt` (12 PNG) |
| «4K reescalado desde …» frente a «4K nativo» | Nativo solo si el original ya tiene ese tamaño. Con la salida actual de la API (1536 × 1024) **todas son reescaladas** | prueba y pruebas unitarias |
| Frase de resolución solo donde la descarga está disponible y verificada | Aparece tras descargar el archivo en el diálogo; **no** en Home (allí no hay descarga) | prueba |
| Textos aprobados (titular, subtítulo, información, botón «Comparar estilos») | Tarjeta y muestra de Home | `home-ux312` 8/8, `home-demos` 3/3 |
| Procedencia: generador externo frente a producto | Muestra y `assets/welcome/PROCEDENCIA.md` actualizadas: las variantes de Home proceden de un generador externo, no de `api/render.js` | — |
| No prometer conservación geométrica exacta | Retirada la frase «conservando muros, huecos y distribución»; ahora «puede alterar detalles» | — |
| Apertura de la muestra local y gratuita; credenciales y confirmación de gasto | Sin cambios | `ai-render` 1/1, `render-budget` 1/1, `op02-render-demand` 3/3 |

## Pendiente

- **Cuota global persistente: código preparado, DESACTIVADA y BLOQUEADA por defecto.** No está cerrada como capacidad: falta una cota superior demostrable.
  - **Modelo predeterminado:** `gpt-image-2.5-sunburst`. `RUBIK_RENDER_MODEL` permite configurar el modelo explícitamente. La petición solicita una imagen de 1536 × 1024 con calidad `high`. La cota de reserva debe cubrir ese perfil y los límites de entrada del entorno. [Referencia oficial de edición de imágenes](https://developers.openai.com/api/reference/resources/images/methods/edit).
  - **Cómo se calcula la reserva:** reserva = max(`RUBIK_RENDER_RESERVE_USD`, cota), con cota = `RUBIK_RENDER_MAX_INPUT_TOKENS` · max(precio de texto, precio de imagen) + `RUBIK_RENDER_MAX_OUTPUT_TOKENS` · precio de salida (USD por millón, `RUBIK_RENDER_PRICE_*`). El tope se comprueba atómicamente sobre lo gastado más lo reservado, así que la concurrencia no lo supera.
  - **Por qué está bloqueada:** para gpt-image-2.5 no hay una fuente que garantice un máximo de tokens antes de llamar; la documentación advierte que el calculador de GPT Image 2 no estima 2.5. Sin cota garantizada, una estimación no sirve como garantía. Por eso la cuota exige `RUBIK_RENDER_QUOTA_BOUND_MODEL` igual al modelo exacto en uso, declarado por el propietario solo cuando exista una fuente oficial o una medición que garantice el máximo. Sin eso responde `503 quota-bound-unverified` sin llamar al proveedor.
  - **Límites explícitos de la petición** (con la cuota activa):
    - Salida: `size=1536x1024` y `n=1`.
    - Entrada: lado largo ≤ `RUBIK_RENDER_MAX_INPUT_PX` (1536 por defecto), medido en la cabecera PNG o JPEG (no por bytes); si lo supera, `413 image-dimensions`.
    - La **calidad** no se fija: no se puede verificar el valor admitido por 2.5 sin documentación. Es un pendiente del propietario o de la documentación.
  - **Otras salvaguardas:**
    - Sobrecoste: `render-overrun` y detención persistente (`503 global-halted`).
    - Liquidación fallida: registro `ledger-settle-failed`, cabecera `x-rubik-ledger: unsettled`, reserva abierta y conciliación en `review`.
    - Sin almacén: `503 store-not-configured`.
  - **Pruebas:** `tests/render-global-quota.test.cjs` 11/11 sobre Redis real local; cero llamadas al proveedor y ningún gasto.
  - **CI:** `point-6-solar` y `op02-render-demand` correctos en `347b6136` (runs 45657604425 y 45658853019). Consolidation Regression en `347b6136`: run 45658846332, resultado pendiente de anotar.
- **Validación visual de que la variante sigue representando el espacio** con salidas reales del producto, y **cualquier capacidad generativa nueva** (p. ej. 4K nativo del proveedor): requieren ensayo autorizado con el proveedor.
- Firefox, WebKit y móvil físico: NOT_RUN.
