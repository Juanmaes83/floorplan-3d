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

## Opciones de cierre (para decidir con la reproducción, sin aplicar)

1. **Releer tras escribir.** Después de `setItem`, releer el marcador; si cambió, restaurar el valor anterior y retener el nuevo en memoria. Es barato, pero una ventana mínima no desaparece del todo.
2. **Cerrojo `navigator.locks`**, ya usado en `js/persistence-store.js`, compartido entre subir el marcador y cada escritura gestionada. Ordena las operaciones, pero no garantiza que WebKit haya propagado el valor dentro del cerrojo. Combinarlo con la opción 1.
3. **No migrar en el origen normal** mientras haya pestañas vivas de una época anterior (presencia por `BroadcastChannel` o el cerrojo de pestaña existente, `TAB_LOCK`). Es lo que ya exige el gate R1 de convivencia previa a cualquier migración.

**Recomendación:**
- mantener la opción 3 como barrera mientras no haya migración, que es el estado actual;
- medir la ventana en WebKit (macOS y Linux) con el escenario de arriba;
- solo si se autoriza una migración en el origen normal, aplicar las opciones 1 y 2 juntas, con la prueba del escenario como regresión.

## Reparto

| Quién | Qué |
|---|---|
| Codex | Reproducción WebKit del escenario y decisión con datos |
| Claude Code 2 | Implementar la opción elegida sobre la candidata cuando se autorice y descongele |
