# GOV-07 — Publicación temporal del banco de dispositivos (solo Preview)

**Decisión:** #208, comentario 6835414237 (12/11/2026). Autorización limitada: Preview temporal y aislada, **no** Production.

## Alcance exacto

- **Rama:** `review/gov07-device-bench-preview`, creada desde el HEAD de #208 (`e2d0e84`). Es una rama de revisión **no fusionable**: no tiene PR y no entra en `master` por merge.
- **Único cambio respecto a #208:** `.vercelignore` de esta rama (y este documento). Publica solo:
  - `labs/gov07/index.html`: el banco;
  - `labs/ft3d-8/fidelity-fixtures.js` y `labs/ft3d-8/dossier-fixtures.js`: los dos archivos de datos sintéticos que carga `evolucion/?lab=1`. Todo lo que contienen está marcado `FIXTURE`, los correos son `@example.com` y las referencias catastrales están inventadas.
- **Sigue fuera:** el resto de `labs/ft3d-8/` y todo `labs/m1-s2-s3/`.
- **Sin cambios:** el `.vercelignore` de `master` y la PR #208.
- **Datos:** el banco no usa datos de clientes, claves, endpoints de escritura, catálogos reales ni publicación comercial, y no envía nada a ningún servidor.
- **Acceso:** `noindex` **no protege**. El enlace se trata como accesible para cualquiera que lo conozca.

## Compromiso

- La Preview se usa solo para la matriz física de GOV-07.
- Al terminar la matriz:
  - se conservan los JSON del banco y las capturas como evidencia en el acta de #208;
  - la rama se puede borrar sin que haga falta publicar el laboratorio en Production.
- Esta rama no lleva otros cambios de producto. Si #208 cambia, se rehace desde el nuevo HEAD.
