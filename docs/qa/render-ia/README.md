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

- **Contador por instancia y cuota global persistente: RESUELTO en código, cerrado por defecto.** El contador por instancia (`createMeter`, por hora y día) se conserva como primera barrera; por sí solo no es global (cada instancia de Vercel lleva el suyo). Con `RUBIK_RENDER_GLOBAL_QUOTA=1`, `api/render.js` reserva de forma atómica 1 imagen y un importe en el libro común existente (`api/_spend-ledger.js`, scripts Lua en Redis) **antes** de llamar al proveedor y liquida después (fallo del proveedor → 0 unidades). Parámetros: `RUBIK_RENDER_GLOBAL_MAX_IMAGES` (30), `RUBIK_RENDER_GLOBAL_CAP_USD` (5), `RUBIK_RENDER_RESERVE_USD` (0,25 por imagen, por exceso). Sin almacén → `503 store-not-configured` (no recurre a la cuota por instancia); almacén caído → `503 store-unavailable`; tope → `429 global-limit`, sin llamada al proveedor. Prueba: `tests/render-global-quota.test.cjs` (5/5) sobre **Redis real local**: dos instancias comparten el tope; 6 peticiones concurrentes con tope 3 → exactamente 3 llamadas. **Pendiente del propietario:** configurar `RUBIK_SPEND_STORE_URL/_TOKEN` (Upstash, solo Preview) y activar la variable; no se ha activado nada ni se ha llamado al proveedor.
- **Validación visual de que la variante sigue representando el espacio** con salidas reales del producto, y **cualquier capacidad generativa nueva** (p. ej. 4K nativo del proveedor): requieren ensayo autorizado con el proveedor.
- Firefox, WebKit y móvil físico: NOT_RUN.
