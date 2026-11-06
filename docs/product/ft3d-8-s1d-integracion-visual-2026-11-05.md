# FT3D-8 · S1-D — Laboratorio de integración, fidelidad y evidencias

**URL:** `/labs/ft3d-8/` abre el **expediente** (A por defecto; `?dossier=A…J` elige el escenario). `?case=A…D`
conserva el modo de fidelidad anterior, sin expediente. No se modificó el editor principal ni ningún módulo
compartido.

## 1. Flujo para el profesional

1. **Proyecto:** identidad (proyecto o edificio, plantas e ID de cada una), esquema, revisión de geometría, huella
   del documento y evidencia de escala.
2. **Ubicación:** parcela guardada, CRS, fuente y licencia («se puede ver aquí, no se incluye en el archivo del
   cliente»), colocación con 5 comprobaciones numéricas, evidencia GML y evidencia de escala (con escala estimada, la
   posición es aproximada: estado «Estimado»).
3. **Presupuesto:** cada presupuesto con su sujeto (proyecto, edificio o planta), neto, IVA y total («desconocido» si
   falta un precio, nunca 0 €), partidas sin precio o sin revisar, y origen de los precios (manual, BC3 del estudio o
   BCCA). En un edificio, cada planta por separado y **sin sumar**.
4. **Plan de obra:** ID, tareas, fechas, tipos de dependencia, vínculos (y los rotos) y revisión declarada.
5. **Evolución:** timelapse y Gantt sobre el mismo modelo y el mismo plan. La animación es ilustrativa.
6. **Entrega:** nivel FT3D-8, bloqueos con mensajes comprensibles y qué lleva cada canal. El enlace público no está
   activado en S1.

Estados visibles: Válido, Verificado, Declarado, Parcial, Estimado, Pendiente, No disponible, Desactualizado,
Incompatible y No verificable. El **panel de diagnóstico** reúne las correspondencias (cinco resultados), los
códigos técnicos, los conflictos (con los dos valores) y las huellas.

**Carga:** un único selector de archivos acepta varios documentos a la vez y los identifica por su contenido.
Cargar un proyecto, un edificio o un expediente empieza un expediente nuevo. Si un documento se rechaza, el estado
anterior se conserva. «Guardar expediente» descarga el paquete 0.1.0, que no incluye el texto del GML.

## 2. Evidencias (artefacto de CI `ft3d-8-dossier-evidence`)

| # | Evidencia pedida | Archivo |
|---|---|---|
| 1 | Proyecto A correctamente vinculado | `01-proyecto-A-vinculado.png`, `01b-proyecto-A-diagnostico.png` |
| 2 | Proyecto B correctamente vinculado (cambio de cliente) | `02-proyecto-B-vinculado-tras-el-cambio.png` |
| 3 | Reforma | `03-reforma-demolicion-en-curso.png` |
| 4 | Edificio de dos plantas y su alcance económico | `04-edificio-dos-plantas-alcance-economico.png` |
| 5 | Error de presupuesto ajeno | `05-error-presupuesto-ajeno.png` |
| 6 | Error de planificación ajena | `06-error-planificacion-ajena.png` |
| 7 | Error de parcela ajena | `07-error-parcela-ajena.png` |
| 8 | Revisión obsoleta | `08-revision-obsoleta.png` |
| 9 | Presupuesto parcial | `09-presupuesto-parcial.png` |
| 10 | Proyecto sin plan | `10-proyecto-sin-plan.png` |
| 11 | Comparación del modelo original y el timelapse | `11-timelapse-final-con-expediente.png` y la prueba: al final del plan, `inspect()` y los elementos presentes coinciden **exactamente** con el caso A sin expediente (la parcela no añade geometría). La comparación con el editor real (IoU 0,948/0,962/0,967) sigue en `ft3d-8-fidelity-evidence` |
| 11b | GML no válido: estado conservado | `11b-gml-no-valido-estado-conservado.png` |
| 12 | Vista móvil | `12-movil-expediente.png`, más `12b-cambio-documentos-de-A-en-B-bloqueados.png` |
| 13 | Reproducción del vídeo | `13-reproduccion-video-descargado.png`: el archivo descargado se reproduce; su duración coincide con la declarada y los saltos al 30, 60 y 90 % aterrizan en su punto |
| 14 | Entrega vinculada al expediente correcto | `14-entrega-vinculada-al-expediente.png`, `14b-historial-tras-cambiar-de-expediente.png` |

Un PASS no se usa como única evidencia: cada caso tiene su captura y aserciones sobre el texto visible.

## 3. Resultados de la integración

- **Cambio de proyecto** (input real de archivos): A completo → C solo (expediente nuevo: 0 presupuestos, plan
  ausente, marca ausente, sin evidencia GML y sin la marca ni los textos de A en pantalla) → presupuesto y plan de A
  dentro de C (bloqueados por identidad; vídeo desactivado) → documentos de C (coherente; ningún identificador de A en
  el panel, la tarjeta, el Gantt ni la entrega).
- **Vídeo:** el MP4 H.264 indexado del expediente A lleva el manifiesto 0.2.0 con `dossier.id`, la marca del
  expediente y el territorio solo como texto. El HTML de cliente no contiene ninguna coordenada de la parcela. El
  historial conserva el vídeo y la presentación al cambiar a C, y el archivo descargado mantiene su SHA-256.
- **Proveedor real:** `FloorPlanCatastroParcel` lee los GML de los fixtures con el mismo resultado que el sustituto de
  Node usado en las pruebas puras.

## 4. Limitaciones

- La escena reutiliza la réplica de montaje de mallas de FT3D-8; no se ha ampliado (el contrato de mallas por
  elemento depende de Kimi).
- La parcela no se dibuja en la escena: su licencia lo permite en pantalla, pero no se ha reutilizado
  `territory-renderer.js` sin tocar módulos compartidos. Por eso el laboratorio muestra los metadatos y las
  comprobaciones numéricas, y declara pendiente el contrato de visualización.
- Ortofoto y terreno: solo metadatos (en ejecución, en el editor).
- Ruta S1 de documentos locales: no es la conexión directa con la biblioteca de RUBIK.
