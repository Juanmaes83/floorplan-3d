# 8C-E — validación local, baseline y cierre

Estado: **CERRADO**.

Base funcional inicial: `51a3a07b16da8876ab32189b8db9db18eb182c12`.
PR: #132 `feat/point-8c-e-territorial-integration`.
HEAD final revisado: `482a2b8a8bef15f33c16de5580713a45b9941a30`.
Squash en `master`: `012fb1409f1e73f4ca3c088aea0bb8682bec3197`.

## Entorno y validación local

Windows, Node test runner, Python 3.12/jsonschema 4.26 y Playwright/Chrome con SwiftShader. No se descargó contexto territorial real durante las pruebas 8C-E; fixtures de ortofoto y terrain son sintéticas. No es una medición de rendimiento móvil físico.

| Grupo | Resultado |
|---|---|
| Integración + Project/Building | 66 PASS |
| Dependencias core territoriales/exterior/Solar | 66 PASS |
| Node no-browser | 569 casos: 567 PASS, 0 FAIL, 2 SKIP |
| Python schemas | 25 PASS |
| Browser 8C-E final | 3 PASS |
| Terrain browser | 2 PASS |
| Privacidad F2 | 4 PASS, 0 requests inesperados |
| ZIP por lotes afectado | 1 PASS |
| Syntax / `node --check` | PASS |
| `git diff --check` | PASS |

Los 2 SKIP amplios son verificaciones Blender que requieren `BLENDER_EXE`/`BPY_PYTHON` configurados; no se presenta ejecución real de Blender como probada.

## Cobertura 8C-E específica

La regresión integrada cubre:

- placement horizontal/vertical explícito;
- norte 37° sin doble rotación;
- building con offsets/elevaciones no cero;
- ortofoto y terrain runtime sintéticos;
- contexto 3D sin modificar muros editables;
- Presentación exterior y stop de habitación;
- restauración de cámara/target/quaternion/opciones/capas/reveal/Solar/luz;
- reapertura offline sin auto-fetch;
- provider ausente;
- captura/delivery con atribución;
- Walk comparativo con/sin contexto.

Los viewports 390×844 y 844×390 pasan con CTA real de Presentación y controles accesibles.

## Independencia final Ortofoto / Terreno

Durante la revisión de PR #132 se detectó que la ortofoto drapeada usaba `['orthophoto','terrain']` como lista de visibilidad, por lo que apagar terrain ocultaba también la ortofoto.

Se corrigió en el HEAD final:

```text
mesh terrain      → territoryLayers = ['terrain']
mesh orthophoto   → territoryLayers = ['orthophoto']
```

Cuando la ortofoto está drapeada sobre la geometría terrain, sus `territoryPolicies` conservan **orthophoto + terrain**. Así la visibilidad es independiente, pero la atribución/licencia sigue reconociendo ambas fuentes cuando corresponde.

La prueba browser final demuestra:

- Ortofoto ON / Terreno OFF → ortofoto visible, terrain oculto, atribución ortofoto + terrain;
- Ortofoto OFF / Terreno ON → ortofoto oculta, terrain visible, atribución terrain.

El workflow que ejecuta esta regresión terminó en `success` sobre el HEAD exacto final.

## Baseline: diez casos Walk preexistentes

Se ejecutaron los tests originales sin modificar en master base limpio y en la rama:

```text
node --test --test-concurrency=2 tests/walk-controls.browser.test.cjs tests/walk.browser.test.cjs
```

Resultado del contraste: **10/10 casos, nombres, mensajes completos y ubicaciones de fallo coinciden exactamente; 0 fallos nuevos**.

No son diez timeouts: cinco son timeouts sobre `#walkOverlay` oculto y cinco son aserciones del panel oculto. No se modificó Walk ni sus pruebas para forzar verde.

| Caso original | Master base | Rama 8C-E | Causa |
|---|---|---|---|
| desktop controls 1440×900 | FAIL | FAIL | `#walkOverlay` oculto / timeout |
| desktop E 1440×900 | FAIL | FAIL | `#walkOverlay` oculto / timeout |
| phone joystick/drag/door/exit 390×844 | FAIL | FAIL | `#walkOverlay` oculto / timeout |
| entry panel 1440×900 | FAIL | FAIL | sin control primario visible |
| entry panel 390×844 | FAIL | FAIL | sin control primario visible |
| entry panel 844×390 | FAIL | FAIL | sin control primario visible |
| instructions mouse 844×390 | FAIL | FAIL | instrucciones no visibles |
| instructions touch 844×390 | FAIL | FAIL | instrucciones no visibles |
| walk example entrance → other room | FAIL | FAIL | `#walkOverlay` oculto / timeout |
| walk contract entrance → other room | FAIL | FAIL | `#walkOverlay` oculto / timeout |

Estos fallos permanecen como deuda técnica histórica y no son regresiones de 8C-E.

## Otro baseline preexistente de Presentación

`3D camera, focus and editor state return after Escape and browser Back` mantiene una aserción de aspect ratio que también falla en master base limpio. Es la misma aserción de aspecto, no un fallo de posición/target ni de la transformación territorial.

La regresión nueva 8C-E verifica por separado cámara, target, quaternion, sección/reveal, capas, Solar y luz.

## CI final

Sobre HEAD `482a2b8a8bef15f33c16de5580713a45b9941a30`, todos los workflows naturales finalizaron en `success`, sin reruns manuales:

- Guided experience;
- Rubik local MCP;
- Point 8C-C orthophoto context;
- Point 8C-D terrain context / integración territorial;
- Integrated browser regressions;
- Point 6 solar and compatibility;
- Multiformat guided import.

Vercel preview quedó `Ready` para la PR. No se utilizó polling continuo para forzar el cierre.

## Merge y cierre

PR #132 se fusionó mediante squash con `expected_head_sha` fijado al HEAD final. Squash: `012fb1409f1e73f4ca3c088aea0bb8682bec3197`.

El merge usa `[skip ci]` para no repetir en `push` a `master` la misma validación ya completada en el HEAD exacto de la PR.

La auditoría final canónica de Punto 8 está en:

`docs/product/point-8-final-audit-2026-10-28.md`
