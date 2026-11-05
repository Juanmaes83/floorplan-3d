# F03 — Cobertura visual y faltantes (sin inventar activos)

## Qué cuenta y qué NO cuenta
**Objetivo original de dirección artística:** 36 referencias arquitectónicas conceptuales individuales. El objetivo todavía **no está alcanzado**. Tras inspeccionar individualmente los 12 PNG se verifican **9 escenas independientes** y **3 collages**; por tanto faltan **27**, no 24. Los paneles de un collage no se multiplican como referencias originales. Los 4 JPG históricos no publicados se excluyen, igual que los 13 albedos, los 9 mapas PBR y las evidencias F02.

La descripción, categoría, uso, confianza y limitaciones de cada archivo están en la [matriz visual verificada](visual-reference-matrix.md). La inspección no demuestra licencia, autoría ni si una escena es fotografía o imagen generada.

## Matriz de cobertura por tipo
| Familia visual a acreditar | Evidencia aceptable | Estado actual | Acción de cierre |
|---|---|---|---|
| Fachada completa · frontal | Escena original con escala, huecos y volumen completos | 6 VERIFICADAS: V-01, V-05, V-07, V-08, V-11, V-12 | Incorporar más originales sólo si se mantiene el objetivo de 36 |
| Fachada completa · oblicua | Volumen, esquinas, transición de materiales y cubierta | 3 VERIFICADAS: V-02, V-09, V-10 | Ampliar cobertura de oblicua opuesta |
| Revestimiento mineral · detalle | Relieve, jambas, luz rasante, sin inventar geometría | FUENTES PBR Y PANELES EN COLLAGES; SIN ORIGINAL INDEPENDIENTE | Generar comparativas F03, sin contarlas como referencias históricas |
| Ladrillo / aplacado | Juntas, textura y continuidad en paños reales | SOLO ALBEDO EN GITHUB | Obtener escena específica si entra en alcance |
| Madera / cerámica exterior | Escala y colocación físicamente plausibles | SOLO ALBEDO EN GITHUB | Obtener escena específica si entra en alcance |
| Relación fachada–ventana | Encuentro real con F02, alféizar y vidrio | BASELINE F02 EXISTE | Generar F03 sin tocar F02 y contrastar |
| Contexto pavimento/terreno | Referencia del entorno, no `MATERIAL.WALL` | 3 ALBEDOS DE SUELO | Excluir de la cuenta arquitectónica principal |
| Sistema completo móvil | Fachada completa legible en móvil | SOLO EVIDENCIA F02 | Captura comparada F03 en emulación; móvil físico no verificado |

## Protocolo de cierre sin acumular imágenes
1. Consultar la [matriz visual](visual-reference-matrix.md) antes de reutilizar una imagen; las 12 ya tienen categoría, confianza y motivo registrados.
2. No multiplicar paneles de collage ni asignar equivalencias materiales desde sus rótulos. Una revisión adicional debe actualizar matriz y manifiesto con trazabilidad.
3. Verificar si los 4 JPG locales faltantes son referencias útiles. La publicación de esos binarios requiere un operador con acceso a `C:\Users\temp123\Downloads\IMAGENES REFERENCIA KIMI CODE`; desde GitHub no se puede acceder a esa carpeta. No afirmar que estén en el repo.
4. Sólo si el encargo de 36 escenas sigue siendo obligatorio, generar o incorporar **únicamente el déficit verificado** por categorías, evitando duplicados; con derechos y revisión, en un incremento separado. Esta tarea documental no genera imágenes nuevas.
5. No aceptar la fase visual por alcanzar un número de ficheros. Aplicar QA de fachada completa y juicio humano comparativo.

**Estado de implementación:** `INVENTORY_COMPLETE_FOR_REMOTE_ASSETS`; `SEMANTIC_CLASSIFICATION_COMPLETE`; `ORIGINAL_36_SCENE_TARGET_NOT_MET_27_REMAINING`; `F03_RENDER_NOT_IMPLEMENTED`; `F02_FROZEN`.
