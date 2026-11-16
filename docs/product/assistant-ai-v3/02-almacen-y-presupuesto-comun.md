# Almacén persistente atómico y presupuesto común de IA (texto + imágenes)

**Estado:** investigado, implementado y probado **sin contratar ni activar ningún servicio**. NO MERGE · NO PRODUCTION · STOP_GASTO.

## 1. Necesidad

Sin almacén persistente compartido, cada instancia de función lleva su propio contador. En ese caso:

- el tope de gasto **no es global**;
- la idempotencia y el límite por minuto **no sobreviven** entre instancias.

Por eso hoy la pasarela desplegada responde `503 store-not-configured`. Hace falta:

1. **Reserva atómica** del peor caso antes de llamar al proveedor y **liquidación** con el uso real.
2. Un **tope común** para el texto del Asistente y las imágenes de Render IA.
3. Un **registro sin contenido**, conciliable con la factura del proveedor.

## 2. Opciones (investigación, 2026-11-15)

| Opción | Atomicidad | Encaje con Vercel | Coste de arranque | Valoración |
|---|---|---|---|---|
| **Upstash Redis** (Vercel Marketplace) | Scripts Lua `EVAL` atómicos y transacciones `MULTI/EXEC`, ambos por la API REST | Integración oficial del Marketplace. Sustituye a Vercel KV, que ya no existe: los almacenes KV se migraron a Upstash en diciembre de 2024 | Plan gratuito (≈256 MB y ≈500 000 comandos/mes según fuentes secundarias; **confirmar en upstash.com/pricing**). Al añadir tarjeta pasa a pago por uso | **Recomendada** |
| Vercel KV | — | **Retirado** | — | Descartada |
| Postgres (Neon/Supabase) | Transacciones SQL (`SELECT … FOR UPDATE`) | Marketplace | Gratuito limitado | Válida, pero más pesada para un contador |
| Edge Config | No apta para escrituras frecuentes | — | — | Descartada |
| Memoria de la función | No compartida | — | 0 | Solo pruebas (`memoryStore`) |

Consumo estimado con la recomendada: unos **6–8 comandos por paso** del asistente. La prueba C (30 preguntas, ≤ 6 pasos) queda muy por debajo de cualquier plan gratuito.

**Decisión del propietario pendiente:**

- crear (o no) la base Upstash Redis desde el Marketplace, **solo para Preview**;
- revisar el plan y las condiciones.

No se ha creado nada.

## 3. Implementación (`api/_spend-ledger.js`, no publicado como función)

- **Interfaz del almacén:** `get`, `set`, `setIfAbsent`, `rate`, `fail`, `reserve`, `settle` y `snapshot`. Es la misma que el `memoryStore` de pruebas, así que la pasarela no cambia.
- **Importes en micro-USD enteros** dentro de Redis, para evitar errores de coma flotante.
- **`reserve` (Lua, atómico)**:
  - rechaza un id duplicado;
  - suma lo gastado en `text` + `image` + lo reservado abierto;
  - si se pasa del tope, responde `cap`;
  - si no, anota la reserva y escribe la entrada en el registro.
- **`settle` (Lua, atómico)**:
  - solo liquida reservas abiertas, y nunca dos veces;
  - libera la reserva y suma el uso real a su familia.
- **Una reserva sin liquidar sigue contando** contra el tope (por ejemplo, si la función cae a mitad). El error es siempre **por exceso**.
- **Registro `rubik:spend:log`**: operación, id, familia, importe, base del cálculo, modelo, fecha de la tarifa y hora. **Nunca** pregunta, proyecto, código ni clave (está probado).
- **E/S**:
  - `exec(cmd)`: `restExec` habla la API REST de Upstash (POST con el comando como array JSON, Bearer);
  - `storeFromEnv` solo crea el almacén si existen `RUBIK_SPEND_STORE_URL` (https) y `RUBIK_SPEND_STORE_TOKEN`;
  - sin ellos devuelve `null` y la pasarela sigue cerrada.

**Pruebas (`tests/spend-ledger.test.cjs`)** sobre un **Redis 7 real local** (`redis-server`, sin red y sin servicio de pago; la CI lo instala):

- **20 reservas simultáneas en 20 conexiones**, mezclando texto e imagen: pasan exactamente `tope / importe`;
- id duplicado, doble liquidación y reserva abierta que bloquea;
- registro sin contenido;
- idempotencia, ventana deslizante y contador de fallos;
- **la pasarela completa** sobre el almacén persistente: reserva del peor caso → proveedor falso → liquidación real;
- conciliación correcta y conciliación bloqueante.

## 4. Presupuesto común verificable (Render IA + Asistente)

**Tope común:** un único `capUsd` sobre `spent:text + spent:image + reservado`. El asistente ya reserva y liquida con `family:'text'`.

**Render IA (`api/render.js`, en Production):** **no se ha modificado**. Para que comparta el tope, la integración propuesta (≈10 líneas, PR aparte con revisión):

1. Antes de llamar, `reserve({id, family:'image', usd: peorCaso})`. El peor caso sale de la tarifa `RUBIK_RENDER_PRICE_*` y del máximo de tokens de imagen de la llamada.
2. Después, `settle(id, {usd: coste real con usage})`; peor caso si no hay `usage` o el proveedor no responde; 0 en 4xx.
3. Mantener los límites por hora y día actuales como freno adicional.

Así, un mismo tope aprobado por el propietario cubre texto e imagen, y el libro registra las dos familias.

**Conciliación (`reconcile(log, providerRows)`):**

- **Entrada:** el registro y los costes del proveedor por día y familia. Con **proyectos del proveedor separados** por familia (uno para Render IA y otro para el Asistente), la factura se puede atribuir sin ambigüedad.
- **Por cada día y familia:** lo liquidado en el libro + las reservas abiertas, frente a lo facturado.
- **Veredicto:**
  - `ok`;
  - `review`, si hay reservas abiertas;
  - **`blocking`**, si el libro queda **por debajo** de la factura. Estimamos por exceso, así que esto sería un defecto que detiene el piloto.
- **Totales** por familia y total común.

**Verificación manual propuesta** tras cada sesión de prueba:

1. Exportar los costes del día desde el panel del proveedor, para los dos proyectos.
2. Ejecutar `reconcile` con el registro.
3. Adjuntar el resultado al acta.

## 5. Qué queda bloqueado y por qué

- **Sin almacén configurado:** 503 (correcto).
- **Render IA aún no anota en el libro:** el tope común **todavía no es efectivo** para las imágenes. Requiere la PR de integración descrita y su revisión.
- **El tope del panel del proveedor (límite de gasto mensual duro) sigue siendo la última barrera.** El libro no lo sustituye.
