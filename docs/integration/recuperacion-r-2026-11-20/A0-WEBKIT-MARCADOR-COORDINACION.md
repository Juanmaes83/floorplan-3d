# A0 · WebKit: escrituras durante la propagación del marcador entre pestañas (nota de coordinación para Codex, 20/11/2026)

> **Solo análisis.** No se cambia código. La candidata OP-07 + A0 (`claude/op07-a0-s8-v5@8d29c700`) sigue **congelada**.
> - Este contenedor no tiene WebKit (solo Chromium 1243), así que no hay reproducción propia.
> - #273–#279 siguen congeladas y R1 se mantiene íntegro.

## Camino de escritura leído (`js/schema-epoch.js` en `112eaf52`, idéntico en la candidata)

```js
setItem(k,v){ if(writable(storage)&&!overlay.size){ … storage.setItem(k,v); recordWriter(storage); return; } overlay.set(k,v); emit(read(storage)); }
```

| Origen | Comprobación de época y escritura | Exposición en WebKit |
|---|---|---|
| **F0.2b (IndexedDB)** | La época se lee **en la misma transacción** que la escritura (R1-T03) | Ninguna: la transacción serializa |
| **Normal (`localStorage`)** | `writable()` lee el marcador y `setItem` escribe: **dos operaciones sin cerrojo** entre pestañas | **Sí.** WebKit propaga `localStorage` entre procesos de forma asíncrona. Una pestaña de época anterior puede leer el marcador antiguo y confirmar una escritura justo después de que otra pestaña haya subido la época |

## Escenario a reproducir (dos pestañas, mismo origen normal)

1. La pestaña A (época N) está abierta con cambios.
2. La pestaña B sube el marcador a N+1.
3. Sin esperar al evento `storage`, A guarda.
4. **Esperado (R1-T02):** A no confirma y retiene en memoria. **Riesgo:** A confirma porque aún lee N.

Hay que medir la ventana: repetir con 0, 1, 5 y 20 ms entre los pasos 2 y 3, y comprobar los documentos persistidos byte a byte.

## Criterio del propietario (20/11/2026)

1. La garantía de los escritores se **acredita antes** de autorizar cualquier migración.
2. No se confía **solo** en la propagación del marcador.
3. **No se restauran valores antiguos sin comprobar escrituras concurrentes.**

> **Corrección de la primera versión de esta nota.** Su opción 1 («releer tras escribir y, si cambió, restaurar el valor anterior») queda **retirada**. Restaurar a ciegas puede pisar una escritura legítima de otra pestaña hecha entre medias.

## Opciones revisadas (para decidir con la reproducción, sin aplicar)

1. **Escritura condicionada, nunca restauración.** Cada escritura gestionada lleva la época y una versión del documento (contador o huella) leídas **dentro del mismo cerrojo** (`navigator.locks`, como en `js/persistence-store.js`).
   - Solo confirma si la época sigue siendo la suya y la versión no cambió.
   - Si algo cambió, **no escribe** y retiene en memoria, como hoy (R1-T02).
   - Nunca escribe un valor antiguo encima de otro.
2. **Detección posterior, sin reparación automática.** Si tras escribir se observa una época mayor, se **marca el estado como indeterminado** y la pestaña deja de escribir. Se avisa a la persona y se ofrece la exportación de emergencia que ya existe. No se toca lo escrito por otros.
3. **Barrera de migración (gate R1).** No migrar en el origen normal mientras haya pestañas vivas de una época anterior. La presencia se detecta por `TAB_LOCK`/`BroadcastChannel` con confirmación (ack), no solo por el marcador.

**Acreditación previa a cualquier migración** (lo que Codex reproduce en WebKit macOS y Linux):
- **(a)** el escenario de dos pestañas con 0, 1, 5 y 20 ms entre subir la época y guardar;
- **(b)** escrituras **concurrentes** reales de las dos pestañas sobre documentos distintos y sobre el mismo;
- **(c)** en cada caso, documentos persistidos byte a byte iguales a los esperados: ninguna escritura de época antigua confirmada y **ninguna escritura legítima perdida**.

Sin (a), (b) y (c) en verde, la migración sigue en NO-GO.

## Reparto

| Quién | Qué |
|---|---|
| Codex | Reproducción WebKit del escenario y decisión con datos |
| Claude Code 2 | Implementar la opción elegida sobre la candidata cuando se autorice y descongele |
