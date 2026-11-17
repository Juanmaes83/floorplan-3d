# 12 · Matriz QA de la v1.2 (D01–D18 y ST01–ST09)

**Ámbito:** el laboratorio, no el producto. «PASS» significa ejecutado en este cierre sobre la rama `lab/studio-presentation-e0e1`, con los commits `ef8711c`, `2119a37` y siguientes.

**Entorno:** contenedor Linux; Chromium de Playwright 1.63 (headless); Node 22; poppler 24.02; ffmpeg.

No se han probado dispositivos físicos, Firefox ni WebKit. Ninguna fila acredita el producto.

| ID | Estado | Evidencia / comando | Nota |
|---|---|---|---|
| D01 Identidad proyecto/revisión | PASS (lab) | `node tools/exportar-qa.cjs`: ST03-f y g | Obra de otro proyecto y revisión cruzada bloquean. En el producto: E2. |
| D02 Sin mutación | NO_VERIFICADO | — | El laboratorio no escribe en el producto. La prueba byte a byte de biblioteca y presupuestos es para E2. |
| D03 Estados económicos | NO_VERIFICADO | — | Solo hay un presupuesto completo con precios de prueba. Los estados `partial`, `incoherent`, `one-sided` y `none` son para E2 con `revision-budget-core`. |
| D04 Equivalencia de formatos | PASS (parcial) | `out/v3/qa.json` → `pdfRows` | Tablas `flow`: cada celda canónica aparece en su rectángulo del PDF. El resto del texto no se ha confrontado celda a celda. |
| D05 Paginación larga | PASS (lab) | Variantes `long-budget` (97 filas, 543 celdas, 0 diferencias) y `oversized-row` (rechazada); banco B3 1/50/200/500 en `out/v3/b3` | Solo tablas `table.flow`; no hay cobertura universal. |
| D06 Tamaño y orientación | PASS | `pdfinfo`: A4 horizontal 841,92×594,96 pt; A4 vertical 594,96×841,92; A3 1191,12×841,92 | Escala física solo rotulada «sobre medidas del modelo (estimada)». |
| D07 Planos y vistas | PASS (lab) | QA de etiquetas, recortes y solapes en `qa.json`; rótulos de escala corregidos (A06) | Sin cotas: el modelo no las acredita. |
| D08 Calidad visual | PASS (agente) / pendiente humano | 41 páginas v3 revisadas en hojas de contacto y web móvil completa | Requiere revisión humana (rúbrica ≥ 4/5). |
| D09 Responsive y accesibilidad | PASS (Chromium) | `tools/paquete-navegador-qa.cjs`, 4 vistas: 0 desbordes, 0 contraste bajo, 0 textos < 12 px, foco visible | Firefox, WebKit y dispositivos físicos: NO_VERIFICADO. |
| D10 Privacidad y HTML estático | PASS | Navegador sin red (0 externas); web final sin scripts; inspección del ZIP | `verify()` de ENT-04 no aplica a esta web; es para E2. |
| D11 Manifiesto y versiones | PASS (lab) | ST04-a…d | Fixture ENT-04 1.0.0 y 1.1.0: E2. |
| D12 Branding | PASS (parcial) | Variantes B2 `logo`, `no-budget-views-brand` y `long-names`; ST03-e (sin identidad bloquea) | Colores de marca sin contraste: no hay esquema (H07). |
| D13 Datos incompletos | PASS (lab) | B2 `empty`, `no-budget-views-brand` | — |
| D14 Rendimiento | NO_VERIFICADO | Tiempos de composición y tamaños anotados (cliente 14,9 MB) | Sin presupuesto de rendimiento aprobado. |
| D15 Seguridad de publicación | N/A | — | Solo E6 |
| D16 Regresión | N/A en el lab | — | El producto no se ha modificado. Suites listadas en `reports/11` §5. |
| D17 Licencias | PASS (inventario) | `reports/01` | Revisar MPL-2.0 de IFC Sheet si se copia código; AGPL de guizang solo como conocimiento. |
| D18 PDF/A | N/A | — | No se afirma PDF/A. |
| ST01 Snapshot transaccional | PENDIENTE | — | E2 (H03) |
| ST02 Selección real | PASS | ST02-a (0 importes con el presupuesto desmarcado); ST02-b (7/7 tipos) | Comprobado sobre HTML, PDF, medios y manifiesto. |
| ST03 Gates reales | PASS | ST03-a…g | Bloquean o exigen reconocimiento; borrador rotulado. |
| ST04 Manifiesto por archivo | PASS | ST04-a…d y verificador independiente | Integridad, no autenticidad. |
| ST05 QA del artefacto final | PASS (tablas flow) | `pdfRows` celda a celda; FLOW_FAULT bloquea | Títulos huérfanos y texto fuera de tablas: QA geométrico existente. |
| ST06 Seguridad offline | PASS | ST06-a/b; inspección del ZIP (0 hallazgos); canal de vista previa con comprobación de emisor | En `file://` el origen es opaco: límite declarado. |
| ST07 Trazabilidad de pilares | PASS (rotulado) | `reports/00` §5; textos verificados | La exportación de Dibujo vivo no existe (rotulado). |
| ST08 Cobertura editorial | PARCIAL | 5 tipos y 7 modalidades | Architecture Book ausente; inglés sin muestras. |
| ST09 Reproducibilidad | PASS (contenedor) | `bash tools/package.sh` (ZIP desde la allowlist, `SHA256SUMS`, `INDICE.json`); ZIP probado en carpeta limpia | Versiones: Node 22, Playwright 1.63 y `@fontsource` 5.1.1, `@fontsource` 5.1.1 fijado exacto en `tools/package.json` y `package-lock.json`; Playwright y Chromium los aporta el entorno. |

## Reproducir

```bash
cd labs/studio-presentation
node tools/compose.cjs snapshot out/v3        # 16 documentos; termina con código 2 si algún documento queda bloqueado
node tools/exportar-qa.cjs /tmp/exp          # 16 casos
bash tools/package.sh                        # dist/: ZIP, resumen externo, SHA256SUMS, inspecciones
node tools/paquete-navegador-qa.cjs dist/entrega-vivienda-de-ejemplo-reparto.zip evidence/entrega/v1.2
```
