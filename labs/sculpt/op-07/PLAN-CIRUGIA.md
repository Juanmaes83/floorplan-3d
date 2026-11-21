# OP-07 · Plan de cirugía (NO ejecutado)

Cada fase es una PR draft propia, desde el SHA de master vigente, con pruebas dirigidas y revisión humana. No empieza ninguna sin autorización expresa.

**Precondiciones:**
- F0.2b integrada: la persistencia transporta el documento canónico tal cual;
- decisiones D-OP07-1, D-OP07-2 y D-OP07-3 aprobadas el 18/11/2026; tolerancia global de facetas (se recomienda 1 mm, [DECISIONES.md](DECISIONES.md) §2) fijada antes de S1;
- coordinación con G-02 (#265) para el DXF.

| Fase | Superficie | Cambio | Gate |
|---|---|---|---|
| **S1 · Contrato** | `project-core` (validate, migrate) | Campos opcionales `curve` y `heightEndMm`, reglas 1–6, versión de esquema y migración sin cambios para proyectos existentes | Paridad completa de la suite de contrato. `featuresOf` y `guardSave` conectados al camino de escritura de la persistencia (con F0.2b), con un lector antiguo que se niega a sobrescribir. Las pruebas de este laboratorio pasan contra `project-core` |
| **S2 · Geometría y plano** | `project-core.geometry` | Rectángulos por faceta (núcleo del laboratorio) | Plano idéntico en muros rectos (captura y prueba de piezas) |
| **S3 · Mediciones** | `quantity-core`, superficies | Longitud de trayectoria, trapecio, `faceAreas` por cara con mochetas, área interior por barrido | Presupuestos de proyectos existentes, byte a byte idénticos |
| **S4 · 3D** | renderer | `slopedPiece` y UV continuas | Prueba de navegador en 3 tamaños |
| **S5 · Edición** | editor vigente (R03) | Punto de control, división por distancia, validación de aberturas en vivo | Historial y deshacer. Sin un segundo editor |
| **S6 · DXF** | exportador G-02 | `LWPOLYLINE` facetada | Coordinado con #265 |

**Reversión:** cada fase es reversible por sí sola. Un proyecto sin los campos nuevos no depende de ninguna fase. Si S1 se revierte con proyectos nuevos guardados, `legacyView` permite leerlos degradados y avisando de la pérdida.

**Fuera de alcance de OP-07:** muros compuestos por capas, coronaciones no lineales y aberturas no rectangulares.
