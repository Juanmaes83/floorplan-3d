# 13 · Registro vivo del cierre v1.3

**Ámbito:** el laboratorio `lab/studio-presentation-e0e1`; ningún estado acredita el producto. **Fecha:** 17/11/2026.
**Entorno:** contenedor Linux, Chromium de Playwright 1.63 (sin Firefox ni WebKit), Node 22.23, poppler 24.02, ffmpeg 6.1.1, Python 3.13.

**Estados:**

| Estado | Significado |
|---|---|
| PASS | Ejecutado en este cierre. |
| REUTILIZADO | Ejecutado antes sobre el mismo código afectado, con evidencia. |
| PENDIENTE | No hecho. |
| NO_VERIFICADO | No se puede probar aquí. |
| N/A | No aplica. |
| HUMANO | Requiere aceptación de una persona. |

Las cifras proceden de los archivos de evidencia citados, no de la memoria.

## H01–H08 (baseline del producto)

| ID | Enunciado (v1.2 §3.3) | Estado | Evidencia |
|---|---|---|---|
| H01 | El inventario del dossier no declara la página económica | Reproducido en `master@8525025`, con y sin presupuesto y marca (4 combinaciones) | `evidence/e2/h01-h02.json` |
| H02 | La cabecera económica lee `brand.name`, que el snapshot no tiene | Reproducido (4 combinaciones) | `evidence/e2/h01-h02.json` |
| H03 | Carrera en la preparación asíncrona | Reproducido en el producto como A26 (2 casos: estado retenido tras cambiar la variante o el presupuesto guardado) | `evidence/e2/diagnostico.json` (A26/H03-1, A26/H03-2) |
| H04 | Paginación A4 | El baseline del producto se reprodujo. En el laboratorio, la paginación medida queda resuelta por el ADR 06. | `evidence/baseline/`, `reports/06` |
| H05 | Dos contratos HTML (ENT-04 sin scripts y B1 con scripts) | Confirmado por lectura | `reports/00` §3 |
| H06 | Revisión ≠ coincidencia de cantidades | Confirmado. **Corrección:** `revision-budget-core` sí se carga, en `comparar/index.html`, no en `index.html`. | `HANDOFF-v1.3.md` §2 |
| H07 | Sin colores ni tipografía de marca | Reproducido. Mitigado en el laboratorio con un **aviso de contraste del logotipo**: el logotipo se muestra tal cual y se avisa si su contraste baja de 3:1. | `evidence/perfiles/perfiles-marca.json` |
| H08 | Referencias públicas en Git | Riesgo confirmado; requiere decisión del propietario | `reports/00` §3 |

## A01–A29 (hallazgos de auditoría)

Los enunciados completos de A07–A29 están en el mandato v1.3, que no se versionó en la rama. La columna «Qué cubre» resume lo que el **código** cita con ese identificador; no se reconstruyen enunciados.

| ID | Qué cubre (según el código y los informes) | Estado | Evidencia |
|---|---|---|---|
| A01 | La selección es la entrega: el HTML se poda, no se oculta, y solo se copia lo referenciado | PASS | `exportar-qa` 72/72 (ST02-a/b) |
| A02 | Integridad: manifiesto con todos los archivos y resumen externo | PASS | `verificar-entrega.cjs`; ST04-a…d |
| A03 | Comprobaciones como gates; borrador rotulado | PASS | `exportar-qa` (ST03-a…g) |
| A04 | Paginación: invariante de filas y celda a celda sobre el PDF | PASS | `out/v3/qa.json` → `pdfRows`; `motor-qa` |
| A05 | Canal de la vista previa (`postMessage`) y paquetes por lista de permitidos | PASS, con corrección: en `file://` el emisor y el receptor descartaban los mensajes legítimos por el origen opaco. Ahora el emisor ajeno se ignora y la página obedece. | `evidence/consumidor/consumidor-qa.json` → `postMessage`; `evidence/entrega/profesional/preparar-qa.json` |
| A06 | Rótulos de pilares y escala estimada | PASS | `reports/00` §4 |
| A07–A09 | El registro liga la entrega al snapshot por huella y a la página web por huella; el verificador es independiente | PASS | `exportar-qa`, `verificar-entrega` |
| A11 | Publicación atómica: un documento bloqueado no publica la entrega y la anterior queda intacta | PASS | `compose.cjs`, `exportar-qa` |
| A12 | Catálogo único de dependencias (módulos → capítulos → documentos → archivos) | PASS | `catalogo-entrega.cjs`; el grafo bloquea fugas (`exportar-qa`) |
| A13–A19 | Exportación selectiva, borrador, flujo de preparación del profesional e identidad | PASS (A17/A18 reejecutados hoy) | `exportar-qa` 72/72; `preparar-qa` en escritorio y móvil |
| A20 | QA del motor de PDF | REUTILIZADO 11/11 (`motor-qa`). El código de `flow.js` no ha cambiado desde entonces. | `evidence/motor/motor-qa.json` |
| A21 | Architecture Book | PASS: 14 láminas; sección con la banda de estancias legible; plantas por estancia sobre línea base común; lint 0 rojos | `out/v3/qa.json`, `out/v3/architecture-book.pdf` |
| A24–A26 | Diagnóstico del producto en el comparador ENT-04 | Diagnóstico hecho: A25 ×4, A26 ×2. Corregir es E2. | `evidence/e2/diagnostico.json` |
| A10, A22, A23, A27–A29 | Enunciado solo en el mandato v1.3 | NO_VERIFICADO aquí | Pedir el enunciado al propietario |

## D01–D18 y ST01–ST09 (actualizado respecto a `reports/12`)

| ID | Estado | Cambio en este cierre |
|---|---|---|
| D01 | PASS (lab) | — |
| D02, D03 | NO_VERIFICADO en el laboratorio; diagnosticado en el producto | D02 reproducido en `evidence/e2` |
| D04 | PASS (parcial) | Además: cifras ES = EN en los 8 PDF ingleses (gate de cifras) |
| D05–D07 | PASS (lab) | — |
| D08 | PASS (agente) / HUMANO | Revisión página a página del Architecture Book, de los PDF ingleses y de las portadas por perfil de marca |
| D09 | PASS (Chromium) | Ampliado: 7 modalidades × ES/EN × 5 vistas (1440, 820, 390, 844 en horizontal, 320), con landmarks, títulos, `lang`, `alt` y foco. Firefox y WebKit: NO_VERIFICADO (no instalados; el entorno prohíbe instalar navegadores). |
| D10 | PASS | — |
| D11 | PASS (lab) | — |
| D12 | PASS (lab) | 4 perfiles completos (sin marca, logo, nombres largos, logo pálido) en ES y EN con QA a cero |
| D13 | PASS (lab) | — |
| D14 | PASS (medido) | p50/p95 de carga por idioma y vista, y de exportación; sin SLA aprobado |
| D15 | N/A | — |
| D16 | N/A | — |
| D17 | PASS | Licencias en `vendor/PROCEDENCIA.md` |
| D18 | N/A | — |
| ST01 | PENDIENTE | E2 |
| ST02–ST06 | PASS | — |
| ST07 | PASS (rotulado) | Ficha de trazabilidad de Render IA en el PDF integral y en la web |
| ST08 | PASS | Architecture Book presente; inglés con muestras reales (8 PDF y 7 web) |
| ST09 | Ver `HANDOFF-v1.3.md` | Paquetes y dos reconstrucciones desde el ZIP del laboratorio |

## Pendientes genuinos

1. **Revisión humana** de las páginas y de la web (D08).
2. **Firefox, WebKit y dispositivos físicos** (D09).
3. **ST01 / H03 en el producto** (E2).
4. **Enunciados de A10, A22, A23 y A27–A29** (mandato v1.3 no versionado).
