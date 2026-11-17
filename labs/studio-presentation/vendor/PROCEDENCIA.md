# Recursos de terceros incluidos en el laboratorio

Copiados sin modificar para que el laboratorio se reconstruya desde su propio ZIP, sin depender de repositorios externos.

| Ruta | Origen | Commit | Licencia | Uso |
|---|---|---|---|---|
| `fonts/inter/Inter-Regular.ttf`, `Inter-Bold.ttf` | Inter (rsms), tal como lo distribuye `Juanmaes83/ifc-sheet` en `packages/ifcsheet/fonts/` | `ec6f11f90b0eb1213012a3218f14b2ff6f886e7d` | SIL OFL 1.1 (`fonts/inter/Inter-OFL.txt`) | Fuente de texto embebida en PDF y web. La OFL permite redistribuirla con su licencia. |
| `huashu/design-lint-collect.js` | Bloque `COLLECT_JS` de `scripts/design_lint.py` de `Juanmaes83/huashu-design-3.0-agent-` | `9b01ee8751679724dd43d855a532944aaa2c2b59` | MIT (`huashu/LICENSE`) | Sonda de lint tipográfico que ejecuta `tools/compose.cjs`. |

Source Serif 4 se instala desde npm (`@fontsource/source-serif-4@5.1.1`, OFL 1.1) con `tools/package-lock.json`.
El código de IFC Sheet (MPL-2.0) no se copia: solo la fuente Inter, que tiene su propia licencia OFL.

## Huellas SHA-256

```
fbe825cbfc749317f57a1433d3905aa9d3f388732fd29b8e8a36f34845e3bc3e  vendor/fonts/inter/Inter-Bold.ttf
5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57  vendor/fonts/inter/Inter-OFL.txt
a414b48aa577ef2c62ebb135341ddeef33ee26a4f5dc9f787f93c1aab08ebb50  vendor/fonts/inter/Inter-Regular.ttf
6d6a2a9caf2e6d2b76974050427053b2892d8aa4c33fd168ce63a537fcee9d96  vendor/huashu/LICENSE
508381bd81e2041db6a113588b5a36e2ae2b26ca9906d8fe829fd675b83e8275  vendor/huashu/design-lint-collect.js
```
