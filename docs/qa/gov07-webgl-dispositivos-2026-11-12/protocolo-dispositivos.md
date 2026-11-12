# GOV-07 — Protocolo para dispositivos físicos

**Para quién:** la persona que prueba con un teléfono, una tableta o un ordenador reales. Hace falta un dispositivo; no hace falta saber programar. Unos 15 minutos por dispositivo.

**Regla:** solo se marca ✅ lo que has visto tú en ese dispositivo. Las pruebas automáticas de esta PR usan Chromium con SwiftShader (CPU) y **no** sustituyen a nada de esta lista.

## Antes de empezar

1. Abre la **Preview** de la PR GOV-07 en el dispositivo.
2. Ve a `/labs/gov07/`. El banco usa solo el proyecto de prueba (sintético) y no envía nada a ningún servidor.
3. Anota el modelo exacto, el sistema operativo y su versión, y el navegador y su versión.

## A. Banco automático (5 min)

1. En **vertical**, pulsa «Ejecutar banco». Espera a «Terminado» y pulsa «Descargar JSON» o «Copiar resultado».
2. Gira a **horizontal** y repite.
3. Mientras corre, mira la vista 3D y anota:
   - si se ve fluido, con tirones o a saltos;
   - si viste el aviso «Vista 3D interrumpida» y si la casa volvió.

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
| B9 | Si aparece «Calidad 3D reducida para mantener la vista estable». | La imagen se ve algo menos nítida, pero la casa y los colores siguen siendo correctos. |

## C. Matriz (para rellenar a mano)

Basada en la matriz de hardware real de `docs/technical/ent01-client-delivery-contract.md` §5, ampliada con las pruebas de GOV-07. **Nada está marcado.**

| Dispositivo | Navegador | Banco V | Banco H | B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| iPhone reciente | Safari | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| iPhone de 4 años o más | Safari | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Android de gama media | Chrome | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| iPad o tableta Android | Safari / Chrome | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Portátil con GPU integrada | Chrome, Edge, Firefox, Safari | ☐ | — | ☐ | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Escritorio con GPU dedicada | Chrome, Firefox | ☐ | — | ☐ | — | ☐ | ☐ | ☐ | ☐ | ☐ | — | ☐ | |

**Cómo entregar el resultado:**
- adjunta los JSON del banco y una captura por fallo en el issue de coordinación;
- describe cada fallo con lo que hiciste, lo que esperabas y lo que pasó.

## Navegadores en esta PR

| Navegador | Estado |
|---|---|
| Chromium | Automatizado (SwiftShader). |
| Firefox y WebKit | No hay motores instalados en el entorno de CI de este carril. Quedan para la matriz física: Safari en iOS/macOS y Firefox de escritorio. |
