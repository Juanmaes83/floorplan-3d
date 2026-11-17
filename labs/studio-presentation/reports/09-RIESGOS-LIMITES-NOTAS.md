# 09 · Riesgos, límites conocidos y notas

## Límites conocidos integrados en la entrega

Cada límite está escrito donde afecta. Ninguno se oculta.

| Límite | Dónde se nota | Cómo lo trata la entrega |
|---|---|---|
| Las escenas Story y Dibujo vivo bloquean las exportaciones convencionales. La captura de fotogramas de Dibujo vivo es un instrumento de QA, no una exportación. | Capítulo «Del dibujo a la imagen» | Un único fotograma de la apertura, rotulado como dibujo. Propuesta E2-7. |
| La publicación remota de la obra está bloqueada por DEC-05 | «Cómo avanzará la obra», «Preparar entrega» | La entrega es una carpeta offline; la comprobación «Enlace para el cliente» lo explica |
| Los Render IA solo se guardan en la memoria de la sesión | «Preparar entrega» (comprobación IA) | El laboratorio conserva los 3 PNG con SHA-256. Propuesta E2-5: guardarlos con su vista de origen. |
| El vídeo debe probar a qué proyecto y revisión pertenece | Registro de la entrega, manifiesto FT3D-8 | `entrega.json` lleva el proyecto, la revisión y el SHA-256 de cada pieza. El manifiesto FT3D-8 declara proyecto, plan y huellas. |
| Restricciones de la visita del cliente en varias plantas | Comprobación «Visita 3D» | Este proyecto es de una planta; la comprobación lo dice |
| Límites de tamaño y formato al publicar medios | Comprobación «Peso y formato» | Mide la carpeta y los vídeos. Avisa por encima de 25 MB (correo habitual) y de los 12 MB que FT3D-8 incrusta. |
| «Vistas + proyecto ZIP» incluye el proyecto editable | Comprobación «Sin el proyecto editable» | Se advierte que no se adjunte a una entrega de cliente |
| No indexado no es privado | Comprobación «Enlace para el cliente» | Escrito tal cual |
| La caducidad en S3 depende de #244 | Ídem | Escrito tal cual |
| La demo pública de obra no permite entregar | Informe 10 §3 | Se usa el camino real de la biblioteca |
| El plan de la demo no encaja con los muros existentes del proyecto guardado | Informe 10 §3 | Se quitan los vínculos incompatibles (`assets/ft3d8-plan-ajuste.json`) y la entrega queda en nivel orientativo |

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El cliente toma la imagen IA por la propuesta real | Media | Alto: expectativas y reclamaciones | Siempre junto a su vista; rótulo «orientativa»; nota de lo que añade; hoja de decisiones |
| Se confunde el plan de obra de ejemplo con un calendario | Media | Alto | Rótulo en web, PDF y procedencia; nivel «orientativo» del propio producto |
| Se envía el proyecto editable por error | Baja | Alto: propiedad intelectual | Comprobación previa; la carpeta no lo contiene |
| La carpeta es demasiado pesada para el correo | Media | Bajo | Comprobación de peso; recomendación de ZIP o servicio de archivos |
| Los precios de prueba se presentan como reales | Baja en el laboratorio | Alto | Rótulo de precios de prueba en cada cifra económica. En producción, el estado de revisión del estudio. |
| Un enlace publicado sin caducidad | — (no se publica) | Alto | Fuera de alcance hasta GOV-08 y DEC-05 |

## Notas H03, H05 y H06

El prompt de continuación pide cerrar las notas H03, H05 y H06 del baseline E0 (hallazgos H01–H08).

**Los enunciados de esas tres notas no están en el repositorio.** Quedaron en el informe de la sesión E0, que no se versionó. En la rama solo constan:

- H01, H02 y H04, en `evidence/baseline/baseline.json`;
- H07, en `reports/04-SISTEMA-EDITORIAL.md`.

No se reconstruyen de memoria, para no inventar.

Lo que sí consta y les puede afectar:

- **Hallazgos medidos del baseline:**
  - el inventario del dossier no incluye la página económica, aunque se compone (H01);
  - el encabezado económico no muestra la línea de marca (H02);
  - la ventana de impresión carga dos hojas de estilo (H04).
- **Lo que el laboratorio resuelve en su ámbito:**
  - documentos económicos con la identidad del estudio (B1);
  - paginación sin pérdidas (B3);
  - logotipo mostrado tal cual (B2).

**Pendiente del propietario:** reenviar los enunciados de H03, H05 y H06 para anotarlos aquí.

## Seguridad y datos

- **Repositorio revisado:** no hay claves, tokens ni datos personales.
  - El script de Render IA envía el marcador `proxy-injected`; el valor real lo inyectaba el proxy del entorno y nunca se ha visto.
  - El escaneo de `tools/package.sh` bloquea el empaquetado si encuentra patrones de claves o correos personales.
- **Capturas del diálogo de Render IA** (`evidence/render-ia/dialogo-*.png`): el campo del código aparece enmascarado. Solo se ve su longitud.
- **Acción del propietario:** borrar el secreto de red «Código de acceso Render IA» del entorno (menú del entorno → Editar → Secretos de red). Ya no se necesita.
- **Identidad del estudio:** sintética (`Estudio Ejemplo`, dominio `.invalid`). No se usan datos de clientes reales.
