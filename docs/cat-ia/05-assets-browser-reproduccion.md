# `tests/assets.browser.test.cjs` · reproducción en CAT-03 y en `master` (no resuelto)

**Estado: ABIERTO.** No se declara resuelto y no se ha cambiado ninguna expectativa ni ningún tiempo de espera.

## Resultado (mismo contenedor, mismas condiciones, ejecuciones secuenciales)

| Árbol | SHA | Resultado | Fallan |
|---|---|---|---|
| CAT-03 | `df11946c8db3576f1ca3472b9903d2dc39f2fd37` | 23 OK / 2 fallos | 3 «normalized Asset Lab mixed scene 1440x900», 5 «next Asset Lab cohort renders and persists 1440x900» |
| `master` | `c91d12d1d76c71541c3accb3779f9d95519c2725` | 23 OK / 2 fallos | **las mismas dos** |

Los logs completos están en `docs/cat-ia/evidencia/`:
- `assets-browser-cat03-df11946.log` (sha256 `8d42ae1d…49f5`).
- `assets-browser-master-c91d12d.log` (sha256 `f90f05fb…a3f1`).

Ejecución anterior en esta rama:
- Prueba 5 en `592e593`: falló en 1440×900.
- Pareja en `master`: fallaron las 3 resoluciones de la prueba 5.

## Mecanismo observado (con datos de los logs)

- **Todos** los errores son `{"state":"error","reason":"Loading aborted"}`, sobre modelos IKEA del Asset Lab que se cargan en paralelo en la escena.
  - CAT-03: 2 abortos.
  - `master`: 5 abortos, con más carga de CPU (`load` 3,55 frente a 1,42 al empezar).
- `js/asset-loader.mjs:92` aborta a los **8000 ms** por defecto. En este contenedor (SwiftShader, 4 CPU), las cargas que sí terminan tardan **6,0–8,1 s** (por ejemplo, NÄMMARÖ 8090 ms y STRANDMON 7896 ms). Las que cruzan el límite se abortan.
- `js/asset-loader.mjs` y la parte del test afectada son **idénticos a `master`**.
- CAT-03 solo añade dos GLB sintéticos pequeños (4 y 2 KB), que no están en esa escena.

## Qué NO se ha hecho

- No se ha subido el tiempo de espera del cargador. Es código de producción compartido y cambiaría el comportamiento real ante redes lentas.
- No se ha cambiado el test ni se ha desactivado ninguna prueba.

## Qué falta

- La referencia es la **CI de GitHub** del HEAD de la PR, porque el `workflow` de CAT-IA ejecuta `tests/assets.browser.test.cjs` en el trabajo `browser`.
  - Si en CI pasa: queda registrado como dependiente del entorno, sin cambios.
  - Si falla: se compara con la CI de `master` en el mismo trabajo antes de cualquier dictamen.
- Ajustar el tiempo de espera del cargador o paralelizar menos la escena del test es una decisión del propietario del pipeline de activos, fuera del alcance de CAT-03.
