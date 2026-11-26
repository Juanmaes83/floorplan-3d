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
