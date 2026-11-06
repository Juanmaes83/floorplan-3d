# FT3D-8 · Examen final integral M2/S4 (06/11/2026)

Auditoría QA independiente, de extremo a extremo, de la integración M2/S4 (Evolución de obra 4D dentro de RUBIK).
**Esto no es desarrollo:** en esta rama no se ha modificado código de producto, ni se ha corregido nada, ni se ha fusionado nada.

| Dato | Valor |
|---|---|
| **Código examinado (SHA)** | `49e8feba2e3aad03a25fb602248758e39dbe3b3c`, rama `feat/ft3d-8-m2-s4-integracion-2026-11-06` (sin modificar) |
| master contrastado | `0cfe6a5f09ffddf35221dc0175e24b75b246bde0` (solo lectura) |
| Rama de esta auditoría | `qa/ft3d-8-m2-examen-final-2026-11-06`, creada desde `49e8feb`. Solo añade tests, fixtures y documentación. El SHA del commit de evidencias es **distinto** del SHA examinado. |
| Navegador | Chrome for Testing 153.0.8010.12 (Chromium, Playwright 1.63.0, SwiftShader, sin GPU) |
| Entorno | Linux 6.18 x86_64, 4 vCPU, 15 GB de RAM, Node v22.23.4. Servidor HTTP local sobre el árbol `49e8feb`. |
| Preview Vercel de M2 | READY en `49e8feb` según la API, pero **no se ha probado interactivamente**: el entorno de auditoría no la alcanza (protección y red) y no se eludió la autenticación. |

## Contenido

| Archivo | Qué contiene |
|---|---|
| [`informe-final.md`](informe-final.md) | Informe con las secciones A–J: identidad, conteos, proyecto, economía, E2E, QA técnica, UX, defectos, gates y conclusiones. |
| [`matriz-pruebas.md`](matriz-pruebas.md) | Todas las comprobaciones con su estado (PASS/FAIL/PARTIAL/BLOCKED/NOT_RUN). |
| [`defectos-y-deuda-tecnica.md`](defectos-y-deuda-tecnica.md) | Ficha completa de cada defecto (P0–P3) y la deuda técnica. |
| [`obra-sintetica.md`](obra-sintetica.md) | La vivienda, las 10 tareas con el hito, las dependencias y la economía. |
| [`presupuestos-revisiones.md`](presupuestos-revisiones.md) | Las revisiones A, B y C con su referencia independiente en céntimos. |
| [`integracion-y-riesgos.md`](integracion-y-riesgos.md) | La convivencia con master `0cfe6a5`, Section, Kimi y Entregar. |
| [`manifest-evidencias.json`](manifest-evidencias.json) | Cada evidencia con sha256, SHA del código, escenario, resolución, navegador, fecha, esperado y observado. |
| `resultados.json` y `resultados-v4-hallazgos.json` | Salida bruta de cada comprobación. |
| `evidencias/` | Capturas (`.jpg`) y vídeos (`.webm`) V1–V4. |
| `fixtures/` | Copia del fixture sintético y una instantánea JSON. |
| `regresion/` | Resumen de las suites existentes ejecutadas en secuencia. |

## Vídeos

| Vídeo | Archivo | Contenido |
|---|---|---|
| V1 | `evidencias/v1-recorrido-escritorio.webm` | Recorrido de escritorio: revisión A, 10 tareas y el hito por la UI, Evolución, cambio de precio y vuelta (5.1). |
| V2 | `evidencias/v2-economia-persistencia.webm` | Revisiones B y C, tarifa BC3, invalidación, recarga y nueva entrega. |
| V3 | `evidencias/v3-movil.webm` | Móvil a 390×844 y 844×390: Plan de obra, navegación de la Evolución y controles. |
| V4 | `evidencias/v4-hallazgos-escritorio.webm` y `evidencias/v4-hallazgos-movil.webm` | Cada defecto, con un rótulo que lo identifica **antes** de reproducirlo. |

## Cómo reproducir

```bash
CHROME=/ruta/a/chrome node --test --test-concurrency=1 tests/qa-m2-examen.browser.test.cjs
```

```bash
CHROME=/ruta/a/chrome node --test tests/qa-m2-hallazgos-v4.browser.test.cjs
```

Cada comprobación espera el comportamiento **correcto**. Por eso los defectos presentes hacen que el test termine **en rojo**, y es intencionado: no se rebajó ninguna aserción.
Ningún workflow de CI se dispara con ramas `qa/*`.
