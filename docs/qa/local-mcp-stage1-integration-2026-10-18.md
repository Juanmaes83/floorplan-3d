# MCP local — integración de tres cortes de la Etapa 1 (18-10-2026)

## Estado comprobado

Sobre `master` `017d801` (tras #55) se integraron, en este orden:

| Corte | HEAD revisado | Merge en `master` | Pruebas MCP sobre el árbol integrado |
| --- | --- | --- | --- |
| [#40](https://github.com/Juanmaes83/floorplan-3d/pull/40): relaciones por estancia | `20b67f2` | `19f2f44` | 12 PASS, 0 FAIL, 0 SKIP |
| [#41](https://github.com/Juanmaes83/floorplan-3d/pull/41): diagnóstico y medidas 2D | `a244fe2` | `9c9e155` | 19 PASS, 0 FAIL, 0 SKIP |
| [#43](https://github.com/Juanmaes83/floorplan-3d/pull/43): obstáculos del segmento mínimo y cadena de puertas | `ddecbd9` | `6728e16` | 25 PASS, 0 FAIL, 0 SKIP |

Cada merge local fue limpio. Tras cada merge remoto se comparó su árbol Git con el árbol local probado: los tres coincidieron. En el `master` final se repitió `npm ci --no-audit --no-fund && npm test && npm run check` desde `tools/rubik-mcp`: 25 PASS, 0 FAIL, 0 SKIP y sintaxis correcta. Entorno de la revisión: Linux, Node v24.19.0 y npm 11.9.0.

Regresiones compartidas sobre el árbol final: `TMPDIR=$PWD/.qa-tmp node --test tests/project.test.cjs tests/layout-review.test.cjs tests/tracing.test.cjs tests/room-layout.test.cjs tests/building.test.cjs tests/library.test.cjs` → 108 PASS, 0 FAIL, 0 SKIP. Se usó `TMPDIR` dentro del worktree porque el sandbox no ofrece `/tmp`. `npm audit --audit-level=high --omit=dev` informó 0 vulnerabilidades. El comprobador de documentos pasó para los documentos MCP y su README.

Las pruebas incluyen el servidor stdio con JSON válido e inválido, protección de enlaces simbólicos, tamaño del archivo, hash y bytes originales, paginación y respuestas acotadas. El diagnóstico de un JSON inválido informa del primer error del validador canónico; las demás herramientas lo rechazan. Las distancias y obstáculos son geometría 2D del archivo seleccionado, con confianza de escala explícita. **GitHub Actions no ejecutó pasos** en estas PR; esto no es CI aprobada. Tampoco se ejecutó una regresión completa de navegador: los cortes sólo añaden consultas al servidor local y documentación.

## Límite y siguiente corte

La Etapa 1 **no está completa**. #43 mide la separación mínima recta entre dos muebles, identifica obstáculos documentados sobre ese segmento y busca una cadena de puertas entre estancias derivadas. No busca un camino por el espacio libre ni prueba anchura continua, maniobras en giros, extremos de muro, hojas de puertas o empotramientos. La ausencia de un obstáculo en la recta nunca equivale a «paso libre» ni a conformidad normativa.

El siguiente corte de Etapa 1 debe definir puntos de inicio y fin, modelar obstáculos y anchura en toda una trayectoria con desvíos y giros, y devolver camino, cuello de botella, evidencias e incertidumbres. Debe cubrir puertas, extremos de muro, muebles girados y estancias cóncavas con fixtures numéricos conocidos; rechazar geometría/escala no evaluable sin inventar transitabilidad; mantener umbral de anchura explícito y archivo de origen intacto. El contrato y el coste computacional se revisarán antes de implementarlo. Las Etapas 2–4 siguen como propuestas separadas.

El estudio de LoRA LAB en [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48) continúa por Claude Code y no altera este orden técnico del MCP.
