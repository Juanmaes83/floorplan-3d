# 07 · Matriz EXISTE / AMPLIAR / FALTA

Qué tiene hoy el producto (`master` `f31f303`, base de la rama), qué amplía el laboratorio y qué falta para una entrega profesional completa.

Cómo se usan las etiquetas:

- **EXISTE:** en el producto, usable hoy.
- **AMPLIAR:** existe, pero la entrega necesita más; el laboratorio lo prototipa.
- **FALTA:** no existe.

Fuentes de cada fila: baseline E0 (`evidence/baseline/`), activos de esta ampliación (`assets/`, `assets/log-*.json`) e informes B1–B3 y 10.

## Por pieza de la entrega

| Pieza | Estado | Qué hay hoy | Qué aporta o propone el laboratorio | Evidencia |
|---|---|---|---|---|
| Planta y superficies | EXISTE | Dossier técnico, ficha de superficies, lámina | Planta a escala con números enlazados, cuadro anexo y paginación medida | `out/v3/*`, B1, B2 |
| Vistas 3D del modelo | EXISTE | «Preparar vistas» (5 vistas) | Pliegos por estancia y emparejadas con su imagen IA | `snapshot/assets/`, `interior-book-v3.pdf` |
| Dibujo vivo | AMPLIAR | Activo solo en la apertura de la presentación; sin exportación | Fotograma de la apertura en la entrega; propuesta E2-7 de exportarlo | `assets/log-living.json` |
| Recorrido en vídeo | EXISTE | «Grabar vídeo» (MP4 H.264 de 1280×720) | Capítulo «Recorrer la vivienda» con vídeo y fotogramas | `assets/recorrido/` |
| Visita 3D interactiva | AMPLIAR | Vista previa local; el enlace requiere publicación | Explicada en la entrega; minimapa auditado | Informe 10 §6, `evidence/minimapa/` |
| Render IA | AMPLIAR | Diálogo real con coste; resultado en memoria de sesión | Siempre junto a su vista, rotulado y con trazabilidad; propuesta E2-5 de guardar la vista de origen | `evidence/render-ia/trazabilidad.json` |
| Evolución de obra (FT3D-8) | EXISTE | Plan de obra, evolución, vídeo, presentación de solo lectura y manifiesto (camino biblioteca) | Capítulo «Cómo avanzará la obra» con el rótulo de la autoridad del plan | `assets/ft3d8/`, `assets/log-ft3d8.json` |
| Demo pública de obra | EXISTE | `?demo=obra` sin entrega (por diseño) | Su plan se importa al proyecto, rotulado como ejemplo | Informe 10 §3 |
| Presupuesto cliente y estudio | EXISTE | `FloorPlanEconomicDossier`, dos variantes | Propuestas v3 con gráfico por capítulos; paginación sin pérdidas | `commercial-proposal-*-v3.pdf`, ADR 06 |
| Libros editoriales | AMPLIAR | Dossier del producto (4 estilos) | Libro de interiorismo, libro de materiales y mobiliario, ficha inmobiliaria, lámina con franja | B1 |
| Identidad del estudio | EXISTE | «Mi estudio» (FloorPlanBrand) | Usada tal cual; logotipo sin alterar | B2 (logotipo) |
| Hoja de decisiones | FALTA | — | Prototipo derivado de los datos: estados por línea | Web, cap. «Lo que hay que decidir»; PDF pág. 9 |
| Tipos de entrega (7) | FALTA | — | Selección de capítulos y documentos sobre un único contenido | `entrega.cjs` (TIPOS) |
| Preparar entrega (profesional) | FALTA | — | Tipo, contenido, vista del cliente en vivo, comprobaciones y registro | `out/v3/profesional/preparar-entrega.html` |
| Comprobaciones antes de enviar | FALTA | — | 10 comprobaciones calculadas: identidad, revisión, presupuesto, IA, plan, editable, peso, enlace, visita y datos | Ídem |
| Registro de entrega con huellas | AMPLIAR | FT3D-8 registra sus entregas | Registro de toda la entrega (SHA-256 por pieza) | `entrega.json`, `registro-*.json` |
| Carpeta offline del cliente | FALTA | Archivos sueltos | Web de solo lectura para escritorio, tableta y móvil, con vídeos y PDF | `out/v3/entrega/` |
| Enlace remoto seguro | FALTA | `/api/share` + `/api/view`; GOV-08 en Draft; DEC-05 | Fuera del alcance (E2-8) | Informe 11 |
| Documentos en chino | FALTA | Interfaz en zh; tipografías editoriales sin CJK | Aplazado (D6) | `DECISIONES-PENDIENTES.md` |

## Por pilar estratégico

| Pilar | Hoy | Tras E2 (propuesta) |
|---|---|---|
| Evolución de obra FT3D-8 | EXISTE completo en la biblioteca; demo sin entrega | Capítulo de entrega con autoridad rotulada y aviso de revisión (E2-6) |
| Hybrid V2 Dibujo vivo | AMPLIAR: no se exporta | Apertura exportable como imagen y vídeo (E2-7) |
| Render IA | AMPLIAR: sin vista de origen guardada | Render emparejado y trazable (E2-5) |
| Visita inmersiva | AMPLIAR: necesita enlace | Enlace con GOV-08 y DEC-05 (E2-8); la carpeta la explica |
