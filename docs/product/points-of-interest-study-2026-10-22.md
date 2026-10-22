# «Puntos de interés» — estudio, contrato y primer corte

**Fecha:** 2026-10-22 · **Base:** `master@e796e3d` · **Estado:** estudio; **ningún cambio de contrato ni de código
queda aprobado por este documento**. Encargo: `docs/product/delivery-programme-2026-10-22.md` (§ Puntos de interés).

## 1. Resultado buscado
- **Profesional:** elige qué explicar de la vivienda (no todo), lo redacta en una tarjeta breve, lo ordena, lo oculta
  y lo publica antes de entregar; la vista previa es lo que recibirá el cliente.
- **Cliente:** activa voluntariamente «Puntos de interés», ve marcas discretas y una lista por planta y estancia; abrir
  una tarjeta no le quita la orientación y al cerrarla recupera su vista. Nada se abre solo ni tapa puertas, muebles
  o controles. Sin puntos, no aparece ningún control vacío.

## 2. Tipos de contenido y alcance del primer corte
| Tipo | Ejemplo | Ancla | Primer corte | Motivo |
|---|---|---|---|---|
| Característica | «Cocina abierta conectada al salón» | estancia (`rom_`) o elemento (`obj_`, `opn_`, `wal_`) | **sí** | solo texto del profesional sobre datos que ya existen |
| Material / acabado | «Encimera de piedra; acabado pendiente de elección» | mueble (`obj_`) o superficie (`rom_` suelo, `wal_` pared) | **sí** | con **estado honesto**: `elegido` · `pendiente de elección` · `orientativo` |
| Petición incorporada | «Pediste ampliar la ventana del salón: hecho en la versión 3f2a…» | estancia o elemento | **sí** | se publica **solo** cuando el cambio está hecho; enlaza con el código de versión de #75, sin nombres ni conversación |
| Experiencia y entorno | «Colegio a 600 m a pie» | proyecto / ubicación | **no** | exige ubicación verificable, fuente, fecha y método (decisión D de ubicación); no se inventa clima, sol ni orientación |

Alcance mínimo justificado: los tres primeros tipos solo necesitan anclas que **ya existen** con IDs estables y texto
del profesional; el cuarto depende de datos que Rubik no tiene.

## 3. Asociación estable
El contrato V1 garantiza IDs que **no se regeneran** al editar, mover, guardar, exportar, importar o migrar (§2), y
únicos en el documento. Reglas propuestas:

| Suceso | Efecto sobre el punto |
|---|---|
| Mover / girar / redimensionar el ancla | el punto sigue al ancla (posición derivada, no guardada) |
| Eliminar el ancla | el punto pasa a **«sin ancla»**: no se publica; aviso al profesional para reasignar o borrar |
| Deshacer / rehacer | el punto viaja en el mismo documento: el historial lo restaura con su ancla |
| Duplicar un objeto | el punto **no** se duplica (es una explicación, no una propiedad del objeto) |
| Duplicar el proyecto | se conservan (IDs hijos se conservan, §2) |
| Exportar / importar JSON-ZIP | viajan dentro del proyecto; un lector antiguo los conserva sin mostrarlos |
| Edificio de varias plantas | cada planta es un proyecto: los puntos van en la planta del ancla; la lista se agrupa por planta |
| Variante / copia del ejemplo | se copian con la vivienda; el profesional los revisa antes de publicar |

## 4. Opciones de contrato (decisión de Juanma)
| Opción | Dónde | Compatibilidad | Riesgo |
|---|---|---|---|
| **A. Minor 1.5 `pointsOfInterest[]`** | campo opcional en `FloorPlanProjectV1` con esquema y reglas semánticas (ancla existente, estados, longitud) | lectores 1.x conservan campos desconocidos (§3) | cambio de contrato formal: esquema, ejemplos, validador, migración nula |
| B. Extensión `x-poi` | `extensions["x-poi"]` (EXPERIMENTAL, ya permitido) | conservada por lectores; sin validación estructural | queda «experimental»; otros consumidores (LoRA LAB, MCP) no pueden confiar en su forma |
| C. Archivo aparte (como #75) | `puntos.json` junto al proyecto | no toca el contrato | se separa del proyecto: se pierde al exportar solo el ZIP; asociación frágil |

**Recomendación:** **A**, porque los puntos son contenido del proyecto que se entrega y deben validarse (ancla
existente, estado honesto). Si se quiere medir el uso antes de formalizar, **B** como piloto con la misma forma que A,
para que el paso a 1.5 sea mecánico.

Forma propuesta (igual en A y B):
```json
{ "id": "poi_…", "kind": "feature|finish|request",
  "anchor": { "type": "room|object|opening|wall", "id": "rom_…" },
  "title": "≤ 80", "text": "≤ 400",
  "finishStatus": "chosen|pending|indicative",          // solo kind=finish
  "implementedIn": "8 hex (código de versión #75)",    // solo kind=request, obligatorio
  "order": 0, "published": false }
```
Sin datos personales: no hay campo de autor ni de cliente; `request` no copia el texto de la observación privada.

## 5. Relación con #75 (observaciones del cliente)
| | Observación (#75) | Punto «petición incorporada» |
|---|---|---|
| Quién escribe | el cliente | el profesional |
| Visibilidad | privada, por archivo entre ambos | pública en la entrega |
| Estado | recibida / se incorporará / descartada / implementada | solo existe si está implementada |
| Contenido | texto libre del cliente | redacción del profesional, sin nombres ni citas |
Atajo propuesto: desde una observación marcada «Hecho en esta versión», «Crear punto de interés» abre una tarjeta
vacía anclada a la misma estancia, con `implementedIn` precargado; el texto lo escribe el profesional.

## 6. Interacción — referencia Matterport (fuentes oficiales, consultadas el 22-10-2026)
Según la documentación de soporte y del SDK de Matterport (no verificado en uso propio):
- Se crean en modo edición: botón «+», clic en el punto del modelo (ancla) y barra lateral con **título (≤ 60
  caracteres) y descripción (≤ 2 000)**; enlaces solo `https://`. [Add Tags to Your Matterport Space](https://support.matterport.com/s/article/Create-a-Mattertag-Post?language=en_US)
- Admiten multimedia enlazada o adjunta (hasta 25 adjuntos de ≤ 500 MB por etiqueta). [Add Multimedia to a Tag](https://support.matterport.com/s/article/Add-Multimedia-to-a-Mattertag-Post?language=en_US)
- Se anclan a la **malla** del modelo, no a la vista; pueden «flotar» o verse a través de muros si la malla difiere.
  Recomiendan **menos de 100 etiquetas** por espacio por rendimiento. (mismo artículo de soporte)
- En el SDK, `Tag.add` recibe posición de anclaje y vector del «tallo»; `Mattertag.add` está obsoleto.
  [Showcase SDK — Tag](https://matterport.github.io/showcase-sdk/docs/reference/current/modules/tag.html)

**Qué tomamos para Rubik:** marca → tarjeta breve → cerrar recupera la vista; límites de longitud cortos (proponemos
título ≤ 80, texto ≤ 400, más estrictos que Matterport porque son tarjetas de entrega, no fichas).
**Qué no tomamos:** anclaje a una malla escaneada (Rubik ancla a **entidades con ID**: estancia, objeto, hueco, pared,
lo que evita etiquetas «flotantes» al editar); multimedia adjunta en el primer corte (peso y privacidad); etiquetas
ilimitadas (Rubik limitará la densidad por vista).
Decisiones propias: marcas solo con la capa activa; la lista es el acceso principal en teléfono; cada marca es un botón
con nombre accesible y el foco vuelve a ella al cerrar.

## 7. Primer corte propuesto (PR de implementación, tras decidir A/B)
1. Modelo y validación (unitarias): crear, editar, ordenar, ocultar, publicar; ancla eliminada → «sin ancla».
2. Editor: panel «Puntos de interés» en Propiedades de la estancia/objeto seleccionado; lista general.
3. Presentación: capa opcional, marcas, lista por planta/estancia, tarjeta; Escape/Atrás cierran la tarjeta antes
   que la presentación; sin puntos publicados no aparece el control.
4. QA: 1440×900, 390×844, 844×390; una y dos plantas; teclado, foco, tacto; exportar/importar; deshacer; proyecto sin
   puntos; capturas antes/después y recorrido profesional y cliente.

## 8. Decisiones abiertas
- Contrato A (1.5) o piloto B (`x-poi`).
- Si la «petición incorporada» admite imagen antes/después (requeriría guardar imágenes: tamaño y privacidad).
- Experiencia y entorno: depende de la decisión de ubicación (D, delivery-programme §5).
