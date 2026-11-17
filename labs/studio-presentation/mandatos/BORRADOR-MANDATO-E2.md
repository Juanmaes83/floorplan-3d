# BORRADOR · Mandato E2 · Comparativas profesionales (ENT-04)

**Estado: BORRADOR con las decisiones 2 y 3 del propietario incorporadas (17/11/2026). Falta el SHA base. No autoriza nada.** E2 empieza solo con un mandato firmado y un GO específico. Antes, Codex debe cerrar la consolidación previa.

Fuentes:

- `reports/11-PROPUESTA-E2.md`;
- diagnóstico reproducido: `diagnostico/e2-diagnostico.cjs` y `evidence/e2/*.json`;
- roadmap de recetas: informe 18 (RP14);
- cierre E0/E1: informe 19;
- handoff de Codex: `docs/integration/HANDOFF-CONSOLIDACION-PREVIA-STUDIO.md` en `8e2f1f7`.

## 0. Condiciones de entrada (bloqueantes)

1. **Consolidación de Codex cerrada.** El handoff de Codex fija tres pasos:
   - resultados de los 37 workflows sobre el SHA candidato (CAT-IA V1, regresión con Dibujo vivo y observador);
   - validación independiente de las PR de producto (#248 y #249) y autorización del propietario;
   - integración autorizada y verificación de las regresiones sobre el **SHA efectivo de `master`**.
2. **Base de E2 = ese SHA de `master`**, registrado en el mandato definitivo. Hoy `master` está en `8525025`; la candidata `8e2f1f7` no está integrada.
3. **Revalidación del diagnóstico sobre la nueva base**, antes de cambiar código:
   - `node diagnostico/e2-diagnostico.cjs <worktree>`;
   - `node diagnostico/h01-h02.cjs <worktree>`;
   - `node diagnostico/identidad-fixture.cjs <worktree>`.

   Si un hallazgo ya no se reproduce, se registra y se retira del alcance.
4. **Rama propia de E2**, creada desde la base registrada. No se mezcla con ramas de Codex, workflows ni `scripts/ci`.

## 1. Objetivo

Que un profesional pueda comparar, desde «Entregar», el original y una variante guardados (antes y después). El resultado debe mostrar:

- cambios reales;
- diferencias económicas honestas;
- un borrador interno verificable.

Nada de esto debe presentar datos desfasados como vigentes. Se reutiliza el comparador existente (`comparar/`, ENT-04 1.1.0, `FloorPlanRevisionBudget` 1.0.0): **no se construye otro**.

## 2. Alcance por cortes (en orden; un commit o PR por corte)

| Corte | Qué | Archivos previstos | Pruebas nuevas |
|---|---|---|---|
| E2.1 Acceso | Entrada desde «Entregar» al comparador existente con el mismo `handoff`. Estados explicados: «sin original», «sin variante», «selección no elegible». | `js/professional-workspace-ui.js`; `index.html` solo para el punto de entrada (zona distinta de la cola de Asset Lab de la candidata) | Navegador: Entregar → comparar en cada estado; 1440/820/390 |
| E2.2 Economía honesta (A25) | Bloque individual frente a comparativo, con su revisión. En `incoherent` y en una sola cara, ninguna cifra de otra revisión en pantalla ni en el HTML descargable. Solo-antes y solo-después simétricos. La nota de revisión no afirma coincidencia (DEC-07). Sin recalcular el motor. | `comparar/comparar.js` (`build`, `renderBudgets`), `js/before-after-dossier-core.js` (`budgetBlock`, `html`) | Los cuatro casos A25 del diagnóstico pasan a «no reproducido»; seis estados (completo, parcial, incoherente, solo antes, solo después, ninguno) en UI y en HTML descargado |
| E2.3 Vigencia (A26/H03) | Antes de preparar, descargar y verificar se vuelven a leer biblioteca, presupuestos y marca. Si difieren: aviso y reconfirmación. `verify()` distingue «borrador íntegro» de «coincide con lo guardado ahora». Nunca se escribe al comparar. | `comparar/comparar.js`, `js/before-after-dossier-core.js` | Cambio en otra pestaña, carrera durante la preparación y storage byte a byte (D02) |
| E2.4 Contexto | «Se compara lo guardado en este navegador» y límite de varias plantas | `comparar/` | Revisión visual |
| E2.5 Orden de cambio (RP14), **dentro de E2** (decisión del propietario, 17/11) | Borrador interno «orden de cambio» a partir del comparador. Contrato RP14: revisión base y propuesta; motivo atribuido por el profesional; diferencias canónicas; delta económico solo si ambas revisiones son coherentes; plazo solo con plan válido. **La conformidad no se infiere.** Sin firma (E7). | `comparar/` (sección y descarga del borrador) | Motivo ausente bloquea; revisiones incoherentes sin delta; sin plan sin plazo |
| H01/H02 · ventana E2 | H01 (inventario del dossier sin «economic») y H02 (cabecera económica sin la marca): **dentro de la ventana E2 como PR independientes** (decisión del propietario, 17/11), fuera de ENT-04 | `js/project-dossier-ui.js` | Las cuatro combinaciones de `h01-h02` |

**Variantes.** E2 compara el original y una variante del mismo grupo de «Variantes» (UX-07). La comparación entre variantes hermanas o múltiples queda fuera; si se decide hacerla, irá en un corte posterior con GO.

## 3. Fuera de E2

Quedan fuera de E2:

- PDF avanzado (E5);
- multimedia y ZIP;
- portal y publicación (E6/E7);
- el exportador del laboratorio y sus binarios;
- un núcleo `FloorPlanDelivery` paralelo;
- cambios en B1, Story, C4 o visita;
- workflows y CI (de Codex);
- Production, Vercel y secretos;
- IA de pago.

Recetas RP13–RP21: siguen como contrato (informe 18). Los módulos de obra siguen en el roadmap y no se implementan: actas, certificaciones, recepción, remates, as-built, garantías y liquidación.

## 4. Gates de aceptación de E2

1. Suites existentes en verde sobre la base y sobre cada corte:
   - `ux07-*`;
   - `economic-dossier*`;
   - `budget-presentation`;
   - `project-dossier.browser`;
   - `professional-workspace.browser`;
   - `brand.browser`;
   - `client-share.browser`;
   - `delivery-3d-link.browser`;
   - `ft3d-8-*`.
2. Diagnóstico E2: A25-1…4 y A26/H03-1…2 pasan a «no reproducido». D02 sigue a cero escrituras.
3. Manifiestos ENT-04 1.0.0 y 1.1.0 siguen verificando (fixture `ux07-dossier-1.0.0`).
4. Revisión visual humana en escritorio y móvil del comparador y del borrador descargado.
5. CI completo del SHA de cada PR de E2, con la observación de Codex. El mapa de impacto **no autoriza omitir CI**.
6. GO del propietario para fusionar cada corte.

## 5. Rollback

- **E2.1:** retirar la entrada en «Entregar»; el comparador sigue accesible como hoy.
- **E2.2 y E2.3:** revertir sus commits; el comparador vuelve a su estado actual.
- **E2.5:** retirar la sección; no hay datos persistidos.
- **H01 y H02:** revertir cada PR independiente.

No hay migraciones de datos.

## 6. Coordinación con Codex

- No tocar `.github/workflows`, `scripts/ci` ni las ramas `codex/*`.
- Si la integración de la consolidación cambia `index.html`, E2 se basa en el resultado integrado, sin cherry-picks cruzados.
- Comunicar a Codex el SHA de cada PR de E2 para que su observador lo cubra.

## 7. Entregables

- PR por corte con evidencias de navegador (capturas y vídeo de recorrido).
- Diagnóstico E2 re-ejecutado antes y después.
- Actualización de `reports/11` y del registro (A25, A26, H03, D02 y D03 en producto).
- Handoff E2.

## 8. Decisiones del propietario (17/11/2026)

| # | Decisión | Estado |
|---|---|---|
| 1 | SHA base de E2 | **Pendiente**: el `master` que resulte de la consolidación de Codex, verificado. Se fija en el mandato definitivo. |
| 2 | Orden de cambio E2.5 (RP14) | **Dentro de E2.** |
| 3 | H01 y H02 | **En la ventana de E2, como PR independientes.** |
| 4 | DEC-05 y H08 | Fuera de E2. |

Con la decisión 1 resuelta y el GO específico, este borrador pasa a ser el mandato definitivo.
