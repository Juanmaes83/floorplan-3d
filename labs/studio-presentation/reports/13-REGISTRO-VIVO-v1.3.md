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
| H08 | Referencias públicas en Git | Inventario hecho: 68 archivos (64 imágenes) en el Git público de master, presentes desde `01c73ba`; licencia no acreditada; `.vercelignore` solo excluye `labs/`, así que **no** están excluidas del deploy. 0 archivos VIS en el ZIP del laboratorio. No se borra ni se reescribe historial: decisión del propietario. | `evidence/h08/inventario-vis.json` |

## A01–A29 (hallazgos de auditoría)

El mandato v1.3 ya está versionado en `mandatos/` (SHA-256 `c2f16097…52a4`, índice en `mandatos/INDICE-MANDATOS.md`). El mandato **no da un enunciado por identificador**: agrupa los A por secciones (§2 A01–A03/A07–A09/A12–A19, §4 A06/A21–A23, §5 A22/A23/A27/A28, §6 A10/A29, §7 A24–A27). Para A10, A22, A23 y A27–A29 se reconcilia contra los requisitos de su sección, citados abajo; no se inventa un enunciado individual.

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
| A10, A29 | §6: paquetes reproducibles, licencias, documentación y limpieza. Ver la tabla de reconciliación. | PASS (lab), con limitaciones | `evidence/paquetes/`, `RECETA.md`, `HANDOFF.md` |
| A22, A23 | §4.1 (ES/EN, marca y sistema editorial) y §5 (QA, accesibilidad, estados económicos). Ver la tabla. | PASS parcial: estados económicos PENDIENTE (N04); Firefox y WebKit NO_VERIFICADO | `evidence/i18n/`, `evidence/perfiles/`, `evidence/consumidor/` |
| A27 | §7 (E2 corregido desde la raíz) y §5 | Diagnóstico y plan hechos; implementar es E2 y requiere GO | `reports/11-PROPUESTA-E2.md`, `evidence/e2/` |
| A28 | §5: rendimiento y revisión visual de todas las páginas | PASS (agente); aceptación HUMANO | `evidence/consumidor/`, `evidence/revision-visual/` |

## Reconciliación de A10, A22, A23 y A27–A29 contra el mandato v1.3

Cada fila es un requisito escrito en la sección del mandato. «Ámbito» distingue laboratorio y producto.

| ID | Requisito (§ del mandato) | Ámbito | Resultado | Evidencia | Limitación |
|---|---|---|---|---|---|
| A10/A29 | ZIP del cliente inequívoco, README dentro del inventario, manifiesto y resumen (§6) | lab | PASS: un ZIP por idioma (ES, EN), verificado con su resumen externo; no se le añade nada después | `evidence/paquetes/verificacion-*.json`, `SHA256SUMS` | Los ZIP de `dist/` no se versionan |
| A10/A29 | ZIP del laboratorio por lista de permitidos, con activos, snapshot, fuentes, código, pruebas, evidencias, receta (§6) | lab | PASS | `evidence/paquetes/INDICE.json`, `inspeccion-laboratorio.json` | Avisos «revisar» explicados en `HANDOFF-v1.3.md` |
| A10/A29 | Sin `node_modules`, secretos, referencias sin licencia ni proyecto editable (§6) | lab | PASS: inspección por tipo; 0 archivos VIS | `inspeccion-*.json`, `evidence/h08/` | — |
| A10/A29 | `HANDOFF.md` sin la receta v2 ni rutas absolutas en la sección vigente; histórico rotulado (§6) | lab | PASS | `HANDOFF.md` | — |
| A10/A29 | Receta portable con versiones fijadas (Playwright/Chromium, Poppler, FFmpeg, Python/Pillow); instalación con red declarada (§6) | lab | PASS: versiones fijadas en `RECETA.md`; Playwright 1.63.0 fijado en el lockfile | `RECETA.md`, `tools/package-lock.json` | Chromium lo instala `npx playwright install` o el entorno |
| A10/A29 | Comando único de reconstrucción desde carpeta limpia, dos veces, comparando contenido y no bytes (§6) | lab | PASS | `evidence/paquetes/RECONSTRUCCION.json` | Los PDF llevan fecha de creación: igualdad por texto y páginas |
| A10/A29 | Saneamiento de rutas y metadatos sin destruir evidencia (§6) | lab | PASS: copia saneada, el repositorio no cambia; vídeos de evidencia sin fecha | `evidence/paquetes/SANEAMIENTO.json` | — |
| A10/A29 | H08: inventario VIS por hash, licencia y exposición (§6) | producto | Hecho; decisión pendiente | `evidence/h08/inventario-vis.json` | Exclusión de deploy y licencia: decisión del propietario |
| A22/A23 | Cinco documentos representativos en ES y EN; cifras iguales; marca y textos del profesional sin traducir (§4.1) | lab | PASS: 8 PDF y 7 webs en inglés, residuo español 0, cifras ES = EN | `out/v3/qa.json` → `en`, `evidence/i18n/` | Textos del profesional quedan en español, marcados `lang="es"` |
| A22/A23 | Perfiles de marca: sin marca, logo, nombres largos, logo pálido (§4.1) | lab | PASS: 4 perfiles, ES y EN, QA 0; aviso de contraste del logotipo | `evidence/perfiles/` | Colores y tipografía de marca: H07, deuda E3 |
| A22/A23 | QA de consumidor por modalidad e idioma, 5 vistas, teclado, landmarks, foco (§5) | lab | PASS (Chromium) | `evidence/consumidor/consumidor-qa.json` | Firefox, WebKit y dispositivos físicos: NO_VERIFICADO |
| A22/A23 | Estados económicos completo, parcial, incoherente, de una cara y ninguno (§5) | lab | **PENDIENTE.** Solo «ninguno» está cubierto (ficha sin presupuesto). Se ejecuta en N04 con el núcleo del producto copiado y su huella (`reports/14`, V4). | — | El snapshot tiene un solo presupuesto completo |
| A27 | E2 corregido: lectura del código actual, A25 y A26 reproducidos, corte mínimo, sin tocar producto (§7) | producto | Diagnóstico y plan hechos | `reports/11-PROPUESTA-E2.md`, `evidence/e2/` | Implementar requiere GO y base con Codex |
| A28 | Tamaños y tiempos p50/p95 de apertura y exportación (§5) | lab | PASS (medido) | `evidence/consumidor/consumidor-qa.json` → `rendimiento` | Sin SLA aprobado |
| A28 | Revisión visual de **todas** las páginas ES/EN, con dossier e índice (§5) | lab | PASS (agente): 116 páginas; corregidos la leyenda del Architecture Book y «Ventana» sin traducir | `evidence/revision-visual/index.html` | La aceptación es humana (D08) |

**Paquetes de este cierre** (`evidence/paquetes/SHA256SUMS`):

| ZIP | Bytes | SHA-256 |
|---|---|---|
| `entrega-vivienda-de-ejemplo-es.zip` | 12.660.567 | `a3f9958a…7bbe8` |
| `entrega-vivienda-de-ejemplo-en.zip` | 12.661.385 | `7a19c71a…01258` |
| `rubik-studio-presentation-lab.zip` | 141.343.443 | `309e077b…c1b07` |

La evidencia de un paquete no puede estar dentro de él: el ZIP del laboratorio lleva la evidencia y el registro tal como estaban al empaquetar, y los resultados de su propia inspección y reconstrucción se versionan después en `evidence/paquetes/`.

## Avisos «revisar» del ZIP del laboratorio, clasificados

La inspección (`evidence/paquetes/inspeccion-laboratorio.json`) no bloquea nada y deja 9 avisos para revisión humana (468 archivos). Ninguno es un dato personal ni una ruta de esta sesión.

| Archivo | Aviso | Clasificación | Por qué se deja |
|---|---|---|---|
| `assets/recorrido/…-proyecto-de-ejemplo.mp4` | Etiqueta `creation_time` del vídeo | Aceptado: procedencia | Es el vídeo tal como lo exportó el producto. Quitar la etiqueta cambia su huella, y la entrega y `assets/log-*.json` registran la original. La fecha es la de exportación. |
| `evidence/entrega/qa/exportar-qa.json` | Contacto fuera de la lista de permitidos | Aceptado: dato de prueba | `persona.ajena@correo.example` es el contacto sintético del caso negativo que debe bloquearse. El dominio `.example` está reservado. |
| `tools/exportar-qa.cjs` | Ídem | Aceptado: dato de prueba | El código que crea ese caso negativo. |
| `evidence/paquetes/inspeccion-laboratorio.json`, `reports/13-REGISTRO-VIVO-v1.3.md` | Ídem | Aceptado: cita | La inspección anterior y este registro citan ese mismo contacto sintético. |
| `tools/inspeccionar-paquete.py` | Patrón de ruta absoluta | Aceptado: código | Es el patrón que busca rutas. Reescribirlo rompería el inspector. |
| `tools/package.sh` (×3) | `/home/user`, `/tmp/claude-0`, `/home/user/studio` | Aceptado: código | Son las rutas que el saneador sustituye. Reescribirlas rompería el saneado. |

## Fuentes ausentes en v1.3 (histórico)

La especificación y los hallazgos llegaron en la continuidad v1.4. Su estado actual está en `reports/15-REGISTRO-v1.4.md`.

| Fuente | Estado |
|---|---|
| Especificación maestra v1.2 revisada | **BLOCKED: no recibida.** Se usa lo que citan v1.3, v1.4 y los informes 00 y 12. |
| Hallazgos V13-01 a V13-09 (auditoría externa) | **BLOCKED: no recibidos.** Ningún hallazgo se da por cerrado ni se inventa su contenido. Al recibirlos, se añaden aquí con su resultado. |

## D01–D18 y ST01–ST09 (actualizado respecto a `reports/12`)

| ID | Estado | Cambio en este cierre |
|---|---|---|
| D01 | PASS (lab) | — |
| D02, D03 | NO_VERIFICADO en el laboratorio; diagnosticado en el producto | D02 reproducido en `evidence/e2` |
| D04 | PASS (parcial) | Además: cifras ES = EN en los 8 PDF ingleses (gate de cifras) |
| D05–D07 | PASS (lab) | — |
| D08 | **ACEPTADO por el propietario** (17/11/2026, candidato `ca9fcc1`, v1.4 ampliada); antes PASS (agente) | Revisión del agente de las páginas ES/EN (`evidence/revision-visual/`) y aceptación visual expresa del propietario (informe 19). Impresión física y dispositivos: no incluidos |
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
4. **Estados económicos en el laboratorio** (§5): pasan a N04.
5. **Especificación v1.2 y hallazgos V13-01 a V13-09**: no recibidos.
6. **H08**: decisión del propietario sobre licencia, historial y exclusión de deploy.
