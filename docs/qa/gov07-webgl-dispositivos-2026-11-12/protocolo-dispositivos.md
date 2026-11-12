# GOV-07 — Protocolo para dispositivos físicos

**Para quién:** la persona que prueba con un teléfono, una tableta o un ordenador reales. Hace falta un dispositivo; no hace falta saber programar. Unos 15 minutos por dispositivo.

**Regla:** solo se marca ✅ lo que has visto tú en ese dispositivo. Las pruebas automáticas de esta PR usan Chromium con SwiftShader (CPU) y **no** sustituyen a nada de esta lista.

## ⚠️ Hoy no se puede ejecutar en la Preview (decisión pendiente)

Comprobado en la Preview de `3e8a6f0` (`floorplan-3d-5tj7f34gm-…vercel.app`): `/labs/gov07/` y los datos de prueba que carga `?lab=1` (`labs/ft3d-8/fidelity-fixtures.js`) devuelven **404**. El motivo es `.vercelignore`, que desde FT3D-8 E2 (`e790546`) deja todo `labs/` fuera del despliegue. La Evolución del producto (`/evolucion/`) sí se publica.

Para poder seguir este protocolo, el propietario debe decidir si se publican el banco y los dos archivos de datos sintéticos. Se publicarían también en Production al integrar. Son datos de prueba, no envían nada y llevan `noindex`. Excepción mínima propuesta para `.vercelignore` (no aplicada en esta PR). Con las reglas de `git check-ignore`, publica solo el banco y los dos archivos de datos; el resto de `labs/` sigue fuera. Falta comprobarlo en una Preview:

```
labs/*
!labs/gov07/
!labs/ft3d-8/
labs/ft3d-8/*
!labs/ft3d-8/fidelity-fixtures.js
!labs/ft3d-8/dossier-fixtures.js
```

Mientras no se decida, el protocolo solo se puede seguir con un servidor local del repositorio en la misma red Wi-Fi que el dispositivo. Esa es una tarea técnica, no del propietario.

## Antes de empezar

1. Abre la **Preview** de la PR GOV-07 en el dispositivo (cuando el banco esté publicado: ver el aviso anterior).
2. Ve a `/labs/gov07/`. El banco usa solo el proyecto de prueba (sintético) y no envía nada a ningún servidor.
3. Anota el modelo exacto, el sistema operativo y su versión, y el navegador y su versión.

## A. Banco automático (5 min)

1. En **vertical**, pulsa «Ejecutar banco». Espera a «Terminado» y pulsa «Descargar JSON» o «Copiar resultado».
2. Gira a **horizontal** y repite.
3. Mientras corre, mira la vista 3D y anota:
   - si se ve fluido, con tirones o a saltos;
   - si viste el aviso «Vista 3D interrumpida» y si la casa volvió.
4. Cómo leer el resultado:
   - la columna **Fuente** distingue lo **medido** en tu dispositivo de lo **declarado** por el navegador (que puede redondear u ocultar datos, como la memoria) y de lo **no disponible**;
   - **Memoria GPU** se mide siempre en el mismo momento del plan: «sin geometrías huérfanas» es lo esperado; «POSIBLE FUGA» es un fallo que hay que anotar;
   - **Resultado general** dice «Sin incidencias automáticas» o «Revisar: …» con los avisos. **No es un aprobado**: tu valoración manda;
   - el JSON lleva una huella SHA-256 (`integrity.hex`) para comprobar después que no se ha modificado.

## B. Pruebas a mano (10 min)

Abre la Evolución del proyecto de prueba (`/evolucion/index.html?lab=1&case=B`) y pulsa «Ver evolución».

| # | Qué haces | Qué debe pasar |
|---|---|---|
| B1 | Pulsa ▶ y deja que avance 30 s. | La obra avanza sin saltos grandes; el dispositivo no se calienta de forma llamativa. |
| B2 | Gira el dispositivo durante la reproducción. | La vista se recoloca, sin barra de scroll horizontal ni controles cortados. |
| B3 | Cambia a otra aplicación (cámara, juego) 30 s y vuelve. | La casa sigue ahí. Si el sistema liberó la GPU, aparece «Vista 3D interrumpida» y la casa vuelve sola. |
| B4 | Bloquea la pantalla 1 min y desbloquea. | Igual que B3. |
| B5 | Abre 8–10 pestañas pesadas (mapas, vídeo) y vuelve. | Igual que B3. Si sale «No se ha podido recuperar la vista 3D», pulsa «Recargar la vista»: la casa debe volver sin perder el proyecto. |
| B6 | Cambia 5 veces entre Proyecto, Evolución y Entrega, con ▶ puesto. | Nada se queda congelado; sin errores visibles. |
| B7 | Activa «Reducir movimiento» del sistema y pulsa AUTO. | La casa no gira sola (OBR-01). |
| B8 | Modo ahorro de energía o batería baja (si existe). | Puede bajar la fluidez; no deben aparecer errores ni una pantalla en blanco sin explicación. |
| B9 | Si aparece «Calidad 3D reducida para mantener la vista estable». | La imagen se ve algo menos nítida, pero la casa y los colores siguen siendo correctos. Tocar una tarea del plan sigue marcando sus elementos. |
| B10 | En `/evolucion/index.html?lab=1`, cambia el proyecto de prueba (A → B → A) muy deprisa en el selector. | Al final se ve el último elegido (A), nunca uno anterior. |
| B11 | Cambia 5 veces entre Proyecto y Evolución y después toca el nombre de una tarea del plan. | La tarjeta muestra esa tarea una sola vez y la casa la marca; nada parpadea ni se repite. |

## C. Matriz (para rellenar a mano)

Basada en la matriz de hardware real de `docs/technical/ent01-client-delivery-contract.md` §5, ampliada con las pruebas de GOV-07. **Nada está marcado.**

| Dispositivo | Navegador | Banco V | Banco H | B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| iPhone reciente | Safari | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| iPhone de 4 años o más | Safari | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Android de gama media | Chrome | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| iPad o tableta Android | Safari / Chrome | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Portátil con GPU integrada | Chrome, Edge, Firefox, Safari | ☐ | — | ☐ | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Escritorio con GPU dedicada | Chrome, Firefox | ☐ | — | ☐ | — | ☐ | ☐ | ☐ | ☐ | ☐ | — | ☐ | ☐ | ☐ | |

**Cómo entregar el resultado:**
- adjunta los JSON del banco y una captura por fallo en el issue de coordinación;
- describe cada fallo con lo que hiciste, lo que esperabas y lo que pasó.

## Navegadores en esta PR

| Navegador | Estado |
|---|---|
| Chromium | Automatizado (SwiftShader). |
| Firefox | En el runner de GitHub (Playwright, sin GPU): sin ventana, el camino «sin WebGL»; con ventana, WebGL por software con dibujo, pérdida y recuperación. **No** equivale a Firefox con GPU real. |
| WebKit | En el runner (Playwright, Linux): la Evolución cae al cargar por su GStreamer, también en `master`, al consultar los formatos de vídeo (acta §7). Retirando esas API, la vista 3D, la pérdida y la recuperación funcionan. **No** equivale a Safari en iPhone: anota en B1 si la página se cierra o recarga sola al abrir la Evolución. |
