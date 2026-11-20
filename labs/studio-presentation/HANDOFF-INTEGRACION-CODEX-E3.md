# Handoff definitivo de integración · Studio E3 / K10 / ENT-03 → Codex

**Estado:** E3 está **cerrado en laboratorio** (VALIDADO). Se detiene su desarrollo: el objetivo es incorporarlo al proyecto madre.

**Quién decide:** Codex integra, el propietario autoriza (D4) y acepta, y ChatGPT audita. Este documento **no** autoriza a fusionar, desplegar ni activar.

**Referencias:**
- Rama de origen: `lab/studio-presentation-e0e1` (SHA del cierre en la sección vigente de `HANDOFF.md`; padre `e9bd6bf`).
- Master de contraste: `130ba24d420a2f4b26ab261313202e6070904fd8`.
- Informes: `reports/22` (contratos, selector), `reports/22b` (43 fuentes) y `reports/23` (cierre técnico y residual de tomas).

## 1. Qué se integra

| Laboratorio | Destino propuesto en producto | Notas |
|---|---|---|
| `e3/recetas-catalogo.js` | `js/studio-e3-recetas.js` | **Generado** desde `labs/studio-presentation/tools/recetas.cjs`. Regenerar con `tools/e3-catalogo.cjs` y comprobar con `--check`. No editar a mano |
| `e3/e3-core.js` | `js/studio-e3-core.js` | Núcleo puro (UMD): C1–C4, N05, integridad, controlador de concurrencia |
| `e3/e3-ui.js` | `js/studio-e3-ui.js` | Tarjeta «Preparar entrega» en Entregar → Documentación + `<dialog>` |
| `e3/e3.css` | `css/studio-e3.css` | Ajustar la ruta del `<link>` en `e3-ui.js` (`e3/e3.css`) |
| `e3/rubik-130ba24-e3.patch` | `index.html`, `js/professional-workspace-ui.js` | 22 líneas. Añade `js/expediente-core.js` (hoy no se carga en el editor) y los tres `<script>` de E3, y una línea de enganche junto a `FloorPlanDeliveryPreview.card` |

**No se integra:**
- `tools/*` y `evidence/*` (son de QA de laboratorio);
- la bandera `window.RUBIK_E3_QA`, que no debe activarse en producto: sin ella no existe `window.__e3`;
- el filtro de depuración `E3_CASOS` de la QA de navegador.

## 2. Contratos que Codex debe confirmar o resolver

| Contrato | Qué hace E3 hoy (laboratorio) | Qué se pide a Codex |
|---|---|---|
| **C1** lectura confirmada | Solo `FloorPlanPersistence.readConfirmed()` e `isTestOrigin()`. Sin sesión, flush, migración ni autoguardado | Confirmar la API estable para consumidores, y que el proyecto abierto es la **entrada activa de la biblioteca confirmada**. Activar F0.2b fuera de `f0-2b.localhost` (D3/D4) |
| **C2** identidades | `contentId` con `FloorPlanExpediente.contentId` y **bytes efectivos** de imagen, más revisión local, proyecto, selección y paquete nulo | Cargar `js/expediente-core.js` en el editor (va en el parche) |
| **C2-img** bytes de imagen | `adaptadorImagenes`: comprueba `indexedDB.databases()` antes de `FloorPlanImages.get` (que **crea** la base con `onupgradeneeded`) | Un `FloorPlanImages.get` **sin creación**; confirmar el token por bytes efectivos (`storage.ref \|\| id`) |
| **C3** variantes | Lee `variantOf` de la biblioteca confirmada (no portable) | Nada para E3; la portabilidad queda en el expediente v2 (fuera de alcance) |
| **C4** vistas de sesión | `E3.vistasDesde(FloorPlanProjectViews)`: identidad de la **toma** = `takenAt` (Date → ISO UTC con ms) + origen + ids y etiquetas. Sin identidad válida no se acredita. **No persiste cámaras** | Identidad de toma propia en la API (un `takeId` o similar), que elimina la dependencia del milisegundo y del reloj. Blender/C6: futuro consumidor; pasar `{contentId, revision}` a `record()` solo cuando se decida |
| Presupuesto ↔ geometría | Presupuesto válido del mismo sujeto = «parcial» | Una autoridad que ligue el presupuesto a la revisión de geometría, si se quiere «disponible» |
| Errores de integridad del expediente | Se tratan como «inválido» sin código propio | Darles un código propio (pendiente del informe 21) |

## 3. Pruebas para reproducir tras integrar

**Preparar el pin:** `git archive <sha-master> | tar -x -C <pin>`. Para las reproducciones «antes», extraer el núcleo anterior con `git show <sha>:labs/studio-presentation/e3/{e3-core,recetas-catalogo}.js`.

**Comandos y resultados en el laboratorio:**

| Suite | Comando | Resultado en laboratorio |
|---|---|---|
| Catálogo | `node tools/e3-catalogo.cjs --check` | idéntico |
| Núcleo | `node tools/e3-qa.cjs <pin> <sha>` | 23/23 (incluye F0 11/11) |
| Cierre técnico | `node tools/e3-cierre-qa.cjs <pin> <sha> --antes <448b3ef>` | 46/46; antes 8/8 |
| Tomas | `node tools/e3-tomas-qa.cjs <pin> <sha> --antes <e9bd6bf>` | 8/8; antes 2/2 |
| Copia aislada | `node tools/e3-copia.cjs <pin> <copia> <sha>` | copia y parche |
| Interfaz | `node tools/e3-ui-qa.cjs <copia>` | Chromium 157: 24/24 (Firefox/WebKit NOT_RUN) |
| Tomas «antes» en navegador | `node tools/e3-tomas-antes-navegador.cjs <copia> <e9bd6bf>` | antes misma huella, ahora distintas |

**Firefox / WebKit:** NOT_RUN en el laboratorio. Para ejecutarlos:
1. `cd labs/studio-presentation/tools && npm ci && npx playwright@1.63.0 install firefox webkit`;
2. `E3_NAV=firefox,webkit node tools/e3-ui-qa.cjs <copia>`.

**Tras integrar en el producto:**
- volver a ejecutar las suites contra el SHA efectivo, con las rutas de producto;
- ejecutar la regresión propia de Entregar: E2.1 «Comparar con el original», la visita 3D y los grupos;
- probar Preview en el origen donde F0.2b esté activa.

## 4. Gates pendientes (en orden)

1. Auditoría independiente de este cierre (ChatGPT).
2. Decisiones de contrato de Codex (§2) y preparación de la integración en su rama.
3. **D4** del propietario para integrar E3 en producción.
4. Preview con F0.2b activa, Firefox/WebKit, Safari real y dispositivos físicos.
5. Aceptación visual del selector por el propietario.
6. Residual global de Codex: el botón «Asistente» se superpone al diálogo.

**Siguen cerrados:** emisión, firma, aceptación de entregas, K11/K12 y E4–E7.

## 5. Reversión

- Quitar del `index.html` las 4 etiquetas `<script>` añadidas y la línea de enganche de `js/professional-workspace-ui.js`.
- Borrar los archivos `studio-e3-*`.
- E3 no escribe en ningún almacenamiento ni crea bases, así que **no deja datos que limpiar** en los navegadores.

## 6. Garantías y límites declarados

**Garantías:**
- **Solo lectura:** sin `setItem`, sin sesión de escritura, sin apertura directa de IndexedDB y sin peticiones externas (comprobado en Node y en Chromium).
- **Integridad local:** la huella cubre el candidato completo y verifica todas sus derivaciones. **No es una firma** ni acredita autoría, identidad profesional o aceptación del cliente.
- **Recetas:** 21 (RP01–RP21) con niveles L/C/F intactos. Las C nunca se emiten; las F, no disponibles. Siempre `emitible:false` y `paquete:null`.

**Límites:**
- Textos ES/EN/ZH; los nombres de receta (catálogo ES/EN) se muestran en inglés rotulado en ZH, sin respaldo silencioso.
- La vista previa es de **composición**, no un documento final.
