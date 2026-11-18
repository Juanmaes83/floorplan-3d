# 21 · Continuidad E3: recuperación, residual real y preparación hacia F0 (laboratorio)

**Fecha:** 19/11/2026. **Rama:** `lab/studio-presentation-e0e1`. **Base recuperada:** `0cf7c2e`. **Master de contraste:** `dd528119` (incluye #259 y #261–#265: F0.1 expediente, F0.2a persistencia, F0.3 permiso y G-02 DXF).

**Ámbito:**
- Solo escritura en `labs/studio-presentation/`.
- No toca producto, persistencia, esquemas, workflows ni ramas de Codex.
- No es aceptación profesional, firma ni emisión.

## 1. Recuperación (antes de modificar nada)

| Comprobación | Resultado |
|---|---|
| Worktree local con E3 | No había ninguno registrado. Se creó `C:/w/sp` desde la rama remota, sin rebase ni limpieza |
| Trabajo local sin publicar | Ninguno: checkout principal limpio, sin stash, sin commits locales fuera del remoto en `labs/studio-presentation` |
| HEAD efectivo | `0cf7c2e` = `origin/lab/studio-presentation-e0e1` |
| Handoff | `HANDOFF-v1.4.md` (`101fe16`) quedó superado por la sección vigente de `HANDOFF.md` (`dfac7e7`): v1.4 ampliada §3–§12 y cierre D08 |

## 2. Residual N01–N08 y RP-Q01–RP-Q12 (estado efectivo; no se repite nada)

| Bloque | Estado | Evidencia acreditada |
|---|---|---|
| N01 recetas (incluido RP07) | **CERRADO**. El único FAIL de v1.4 (`UI-rp07-artefacto-real-igual-al-adaptador`) quedó resuelto: RP-Q02 verifica identidad e inventario entre adaptador e interfaz | `recetas-qa` 117/117, informe 15 RP-Q02 |
| N02 Architecture Book | CERRADO | AB-01–AB-11, `evidence/architecture/pdf-qa.json` |
| N03 oráculo FF&E | CERRADO | 46 instancias, 40 fichas, 1/50/200/500, `evidence/ffe/ffe-qa.json` |
| N04 economía | CERRADO, salvo la licencia de redistribución del núcleo | 6 escenarios ES/EN, `economia-zip-qa` 24/24 |
| N05 estados | CERRADO | `estado-qa` 23/23 |
| N06 conciliación RP13–RP21 | CERRADO como contratos | Informe 15 RP-Q08 |
| N07 paleta y callouts | CERRADO | Informe 15 N07 |
| N08 trazabilidad | CERRADO | `mapa-impacto`, `impacto-qa` 5/5 |
| RP-Q01–RP-Q12 | EXECUTED_PASS | Informe 15 §RP-Q |
| Revisión visual, paquetes y reconstrucciones | CERRADO; D08 aceptado por el propietario (`ca9fcc1`) | Informes 19 y 20 |

**Residual real (no lo resuelve el agente):**
- impresión a escala física;
- Safari real y dispositivos;
- H08 (68 archivos VIS en Git público);
- licencia del núcleo económico N04;
- D4 y coordinación de contratos para E3 de producción.

## 3. Delta nuevo: adaptador de laboratorio hacia F0

**Archivos nuevos:** `tools/f0-adaptador.cjs` y `tools/f0-adaptador-qa.cjs`. Evidencia: `evidence/f0/f0-adaptador-qa.json`, **11/11 PASS**.

El adaptador lee de un pin de producto de solo lectura (`git archive dd528119 js`, fuera del repositorio):
- el expediente v1;
- la identidad de contenido (`contentId`);
- los documentos (presupuestos `FloorPlanBudgetV1` y observaciones);
- las huellas de imagen del manifiesto;
- las exclusiones (`notIncluded`).

Lo une al contexto de recetas como `ctx.f0`. **El contrato de recetas no cambia:** las 21 recetas resuelven igual en ES y EN con y sin `f0` (F0-08).

| Caso | Acredita |
|---|---|
| F0-01 | Ciclo `pack` → `read` real del proyecto de referencia del producto |
| F0-02 | Identidad portable: otro id local y otra fecha dan el mismo trabajo; 10 mm de geometría dan otro trabajo |
| F0-03 | El presupuesto viaja como documento validado y entra en la identidad, con referencias neutralizadas |
| F0-04 | Un expediente alterado o truncado se rechaza antes de producir nada |
| F0-05 | El JSON histórico se acepta y es el mismo trabajo que su expediente |
| F0-06 | El mapa cubre exactamente las 43 fuentes del catálogo |
| F0-07 | Cada exclusión del expediente v1 tiene fuente asignada y no se presenta como disponible |
| F0-08 | El contrato de recetas queda intacto |
| F0-09 | Vigencia por identidad de trabajo con el vocabulario de N05 (`verificado` / `verificado-desactualizado`) |
| F0-10 | La revisión confirmada se declara ausente con su motivo, sin simularla |
| F0-11 | Solo lectura: el pin no cambia y no se tocan rutas de producto |

**Deriva del producto:** los 13 módulos de los que se compone el snapshot son idénticos byte a byte entre `8525025` y `dd528119`:
- `surface`, `sheet`, `project-preview`, `project-views`, `moodboard`;
- `budget`, `budget-presentation`, `economic-dossier`, `revision-budget`, `brand`;
- `assistant-domain-tools`, `project-core`, `quantity-core`.

Los 29 archivos `js/` que sí cambiaron son F0, DXF y E2. **La base de lectura acreditada sigue siendo válida.**

**Capturas:** este delta no tiene superficie visual. Los entregables aceptados (D08) no se regeneran, así que no hay capturas nuevas que acreditar.

## 4. Contratos y dependencias de F0 (para que Codex los evalúe; no se modifican aquí)

Las 43 fuentes de receta, según `MAPA` en `tools/f0-adaptador.cjs`:

| Estado | Fuentes | Qué falta |
|---|---|---|
| `expediente` (hoy en master) | 6: geometría, materiales, objetos, presupuesto, dimensiones de huecos, fotos aportadas | Nada; leer el expediente |
| `motor` | 4: superficies, dibujo vivo, recorrido, sección y fachadas | Nada; se calculan desde la geometría |
| `F0.2b` | 2: presupuesto revisado, catálogo de productos | Pasar la sesión a sus consumidores. Exponer la **revisión confirmada** en solo lectura |
| `F0.3` | 1: revisión anterior | Historial de versiones (candidato F0.3) |
| `exp-v2` | 1: variantes guardadas | Expediente v2 con `subjects[]` y `variantOf` (§7 del contrato) |
| `excluido` | 4: marca, honorarios, plan de obra, vínculo plan–presupuesto | Decidir la autoridad de `brand-profiles`, `studio-tariff` y `construction-record` |
| `sin-fuente` | 3: vistas 3D, imágenes IA, norte | El modelo canónico no guarda cámaras, resultado visual ni orientación |
| `aportacion` | 9 | Datos del profesional; hoy fixture rotulada |
| `fuera` | 13 | Obra, comercial y F1 |

**Peticiones concretas a F0** (solo propuestas):
1. **F0.2b:** una lectura de la revisión confirmada (`{revision, contentId}`) para consumidores de solo lectura, sin acceso de escritura a la sesión.
2. **N05 + F0:** añadir `congelado.contentId` al candidato preparado. La vigencia pasaría a ser snapshot + registro + identidad de trabajo, para que una restauración en otro navegador no invalide un candidato vigente.
3. **Expediente v2:** `subjects[]` y `variantOf`, para la fuente de variantes y la comparación económica.
4. **Cámaras y resultado visual:** se recomienda no persistirlos para E3 y seguir calculando las vistas. Si producto los quiere, deben tener una autoridad propia (no la de Studio).

## 5. Riesgos y decisiones pendientes

| Riesgo o decisión | Responsable |
|---|---|
| D4: autorizar E3 de producción (selector de recetas y adaptadores en «Preparar entrega») | Propietario |
| Coordinar `congelado.contentId` y la lectura de la revisión con F0.2b | Codex |
| Autoridad de marca, tarifa y registro de obra excluidos del expediente v1 | Propietario y Codex |
| Safari real, dispositivos y escala física del selector y las láminas | Propietario |
| Licencia del núcleo económico (N04) antes de redistribuirlo | Propietario |
| H08 | Propietario |
| Los rechazos de integridad devuelven un error sin código propio (`code: null`), así que el adaptador no distingue «alterado» de «truncado» | Codex, si lo considera |

## 6. GO/NO-GO graduado

| Ámbito | Dictamen |
|---|---|
| Laboratorio E3: recuperación, residual y adaptador F0 | **GO (cerrado)** |
| Diseño del contrato E3 ↔ F0 (§4) | **GO técnico como propuesta**; requiere la revisión de Codex |
| Recetas L sobre identidad F0 (6 fuentes del expediente + 4 de motor) | **GO condicionado** a F0.2b integrada |
| E3 de producción (selector y adaptadores en la interfaz) | **NO-GO** hasta D4, F0.2b, coordinación de contratos, Safari real y dispositivos |
| Recetas C/F | **Siguen siendo contratos**; NO-GO de emisión |
| Redistribución del núcleo económico | **NO-GO** hasta acreditar la licencia |
