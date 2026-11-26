# StoryLayersV1 · «Explicar el cambio al cliente» (Entregar › P10) · handoff

**Rama:** `claude/storylayers-v1` · **base:** master `dacb5d39` · **encargo:** §8 de
[`ENCARGO-…-BLENDER-STORYLAYERS.md` @ `121ad35a`/`94f5596a`] y aclaraciones del propietario. El documento externo
«Auditoría de referencias» **no estaba disponible** en el repositorio ni en la sesión: no se ha usado y queda registrado.

## Qué hace

1. **Entregar › P10 «Explicar el cambio»** abre un diálogo con dos revisiones guardadas del mismo proyecto (biblioteca:
   original y variante) dibujadas con **la misma planta, el mismo encuadre y la misma escala** (`FloorPlanRevisionCompare`,
   `viewBox` común).
2. **Capítulos** deterministas: qué cambia (superficie útil, estancias), superficie de cada estancia que cambia,
   distribución (muros añadidos o quitados), acabado de suelo, puertas y ventanas.
3. **Datos trazables**: cada dato lleva valor, unidad, fuente (campo del proyecto), revisión (lado + huella SHA-256) y
   estado; lo que falta se muestra **«Ausente»**, nunca 0. Rótulos numerados **anclados** al elemento visible (estancia,
   muro, abertura).
4. **Revisión profesional**: reordenar capítulos (↑ ↓), reescribir textos; editar no cambia los datos.
5. **Preparación** (modelo adaptado en limpio de `escaparates-pro/readiness.js`): imágenes listas ≠ historia guardada ≠
   historia **vigente**. Si cambia una revisión guardada, la historia queda **OBSOLETA**: no se guarda, no genera imágenes
   y no se descarga como vigente; ofrece «Rehacer con las revisiones actuales».
6. **Exportación**: PNG 1600×1000 por capítulo + `historia/manifiesto.json` (referencias durables a las entradas y sus
   huellas, cada dato con su fuente y revisión, huella SHA-256 de cada imagen), en un ZIP.
7. **Vuelta a Entregar** con Escape o Cerrar: misma ficha, misma posición y foco en «Explicar el cambio».

Fuera de alcance (posterior, según el encargo): vídeo y narración.

## Ejemplo exportado (datos sintéticos UX-07/ENT-04)

- [`ejemplo-exportado/rubik-historia-del-cambio.zip`](ejemplo-exportado/rubik-historia-del-cambio.zip): ZIP tal como lo
  descarga la interfaz en la prueba de navegador (`SL_EXPORT=<dir>`); 5 capítulos.
- [`ejemplo-exportado/manifiesto.json`](ejemplo-exportado/manifiesto.json): el manifiesto del ZIP, sin cambios, para leerlo
  en GitHub. Comprobación cruzada: el salón pasa de 21,53 a 23,11 m² y la superficie útil total de 87,18 a 88,76 m²
  (+1,58 m² en ambos); las cifras de superficie coinciden con una ficha independiente (fórmula del lazo escrita en la prueba).
- Capturas: [`capturas/`](capturas/) (escritorio ES, EN 1440, teléfono 390×844, historia obsoleta). Revisadas: sin texto
  en chino.

## Correcciones de este corte tras revisar las capturas

| Defecto visto | Causa | Corrección | Prueba que lo detecta (falla sin la corrección) |
|---|---|---|---|
| El botón **Asistente** tapaba «Descargar historia vigente» | El Asistente inserta su acceso como último elemento de todo modal, fijo abajo; la barra de acciones también lo está | Acceso en flujo tras las acciones (misma convención que `css/scene-export.css`) | «el acceso del Asistente no tapa acciones» |
| Con la historia obsoleta, «Descargar» **parecía** activa (estaba deshabilitada) | La acción principal conservaba su color | Acciones deshabilitadas con aspecto deshabilitado | «“Descargar” se ve deshabilitada» |
| En 390 px la tabla partía palabras letra a letra («Revisió n») | Seis columnas en un teléfono | Cada fila es una ficha «columna · valor» (`data-label`) | «en el teléfono cada valor lleva su columna» |
| Point9 (`professional-workspace`) falló una vez | Interferencia de otra batería en paralelo; en ejecución limpia pasa 23/23 con `perla-return` y `story-layers` | — | — |

## Pruebas

| Suite | Resultado |
|---|---|
| `tests/story-layers-core.test.cjs` | 5/5 (cifras contra ficha independiente, ausentes, revisión profesional, obsolescencia, manifiesto) |
| `tests/story-layers.browser.test.cjs` | 4/4 (recorrido completo, obsolescencia y cancelar, ES 390×844, EN 1440×900) |
| Regresión de Entregar y PERLA (`perla-return`, `professional-workspace`, `e2-comparativas`, `no-chinese-display`) | 40/40 en Chromium sobre el árbol de `9aa99a40` (ejecución limpia, sin baterías en paralelo) |

## Límites declarados

- Comparación por identificador: un elemento redibujado con otro identificador aparece como quitado y añadido (el
  manifiesto lo declara en `limits`).
- Escala no confirmada en una revisión → medidas orientativas (declarado en `limits`).
- Solo Chromium en esta rama; el recorrido no usa WebGL.

## §7 del encargo (`c14bd07a`) · decisiones del propietario y plantilla comercial

**Decisiones registradas (prueba humana sobre `0e7aff2d`):**
- Aceptado: detección del cambio y descarga.
- Rechazado: la calidad de la entrega para el cliente.
  - Relato en términos internos.
  - Huellas de revisión en la lámina.
  - Texto truncado a 120 caracteres en una línea («…la misma esca»).
- Pendiente: la entrega comercial requiere aprobación. Codex audita con el propietario antes de extender la personalización al
  resto de Entregar.

### §7.3 · Primera plantilla comercial (hecho en este corte)

«Mi estudio define la identidad. Cada entrega define la propuesta.»

| Pregunta del cliente | Cómo responde la plantilla |
|---|---|
| ¿Quién propone? | Instantánea de **Mi estudio** (`FloorPlanBrand.snapshot`): nombre, lema y logo, más solo el contacto que el profesional marca para esta entrega (persona, teléfono, correo, web). Sin identidad, la propuesta sale sin nombre ni logo y la interfaz lo avisa. |
| ¿Qué y dónde? | Título y resumen editables. El resumen por defecto sale de lo comprobado. Plantas **Estado actual / Propuesta** con el mismo encuadre, la zona señalada y «Qué cambia / Qué se conserva» en lenguaje natural. |
| ¿Por qué? · ¿Cómo? | Los escribe el profesional. Si faltan, la lámina dice «Pendiente de definir por el estudio». |
| ¿Cuánto cuesta? | Solo importes **trazables** de los presupuestos guardados de esas dos revisiones (`FloorPlanRevisionBudget.compareBudgets`), con IVA, la condición parcial y lo pendiente. Sin presupuesto, o si no corresponde a la revisión, no hay cifras: «Pendiente de valorar». |
| ¿Qué decidir? | Cierre editable. |
| Notas | Generales o de un capítulo, editables, reordenables y con visibilidad explícita **Para el cliente / Interna**. Una nota nueva es interna hasta que se elige lo contrario. Las internas no entran en ningún archivo del cliente, tampoco en su manifiesto. |

- **Previsualizar como cliente:** dibuja con la misma función las páginas que luego se descargan. La prueba compara los bytes
  de la vista previa y del ZIP. Si se edita algo después de previsualizar, la descarga se bloquea y se explica el motivo.
- **Ajuste de texto:** el texto se ajusta al ancho y continúa en otra página, sin truncar. Los títulos no quedan solos al pie.
- **ZIP del cliente:** `propuesta/NN-portada|pagina.png` en A4 apaisado a 150 ppp, más `propuesta/manifiesto.json` en
  lenguaje natural. No lleva identificadores, rutas de campos ni huellas de revisión.
- **Trazabilidad técnica:** la historia con identificadores, rutas y huellas, la propuesta completa y la huella de cada página.
  Se descarga aparte como archivo **INTERNO** y nunca entra en el ZIP del cliente.

**Muestra descargable (caso de control Baldosa → Moqueta):**
- [`plantilla-7-3/propuesta-baldosa-moqueta.zip`](plantilla-7-3/propuesta-baldosa-moqueta.zip): el ZIP tal como lo descarga
  la interfaz.
- [`plantilla-7-3/manifiesto-cliente.json`](plantilla-7-3/manifiesto-cliente.json).
- Páginas: [`muestra-pagina-1.png`](plantilla-7-3/capturas/muestra-pagina-1.png) y
  [`muestra-pagina-2.png`](plantilla-7-3/capturas/muestra-pagina-2.png).
- Editor: [`p10-propuesta-editor.png`](plantilla-7-3/capturas/p10-propuesta-editor.png).
- Vista previa: [`p10-vista-previa-cliente.png`](plantilla-7-3/capturas/p10-vista-previa-cliente.png).
- Móvil sin identidad: [`p10-propuesta-movil.png`](plantilla-7-3/capturas/p10-propuesta-movil.png).
- Texto largo en varias páginas: [`texto-largo-pagina-*.png`](plantilla-7-3/capturas/).

**Discrepancia registrada:** la prueba humana describe «Baldosa 800 → Moqueta», pero RUBIK muestra ese material
(`mat_tile800`) como **«Baldosa 80×80»**, que es el nombre visible del embudo `FloorPlanDisplayName`. La plantilla usa siempre
el nombre visible del producto.

**Pruebas:**

| Suite | Resultado |
|---|---|
| `tests/story-proposal-core.test.cjs` | 5/5 |
| `tests/story-proposal.browser.test.cjs` | 3/3 |
| `tests/story-layers-core.test.cjs` | 5/5 |
| `tests/story-layers.browser.test.cjs` | 4/4 |
| Regresión de Entregar y PERLA | Ver el informe del corte |

Las pruebas `story-proposal` cubren:
- el caso de control, la identidad con los campos elegidos y la vista previa igual al archivo;
- la edición tras previsualizar, el texto largo en varias páginas y la visibilidad de notas;
- la ausencia de presupuesto, de identidad y de notas internas en el ZIP, y el móvil a 390 px.

**Límites:**
- El documento del cliente sale en español o inglés.
- Los textos que escribe el profesional no se traducen.
- No se ha probado con un presupuesto completo guardado de las dos revisiones: el núcleo lo cubre con datos sintéticos, pero
  falta el recorrido de navegador.
- **Preview humana identificada por SHA:** requiere el despliegue de Preview de Codex o del propietario; desde esta sesión no
  despliego.

### §7.2 · Guiar de la variante a la descarga (siguiente en este bloque)

Pendiente:
- Ficha P10 con tres pasos y acción principal por estado: sin variante, variante idéntica, cambio guardado.
- Crear y editar la variante desde P10.
- «Volver a la historia» desde Diseñar y desde el comparador.
- Progreso visible y motivos de bloqueo.

Ya entra en este corte:
- Título «Historia del cambio».
- Pasos numerados en el diálogo.
- Progreso «Revisión guardada · N de N páginas listas».
- Motivo de cualquier acción bloqueada, y cómo rehacer una historia obsoleta.
