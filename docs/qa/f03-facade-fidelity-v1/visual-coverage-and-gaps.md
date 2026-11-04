# F03 — Cobertura visual y faltantes (sin inventar activos)

## Qué cuenta y qué NO cuenta
**Objetivo original de dirección artística:** 36 referencias arquitectónicas conceptuales individuales. El objetivo todavía **no está alcanzado ni validado**. En la rama hay 12 PNG de usuario con contenidos no clasificados visualmente desde el conector. Su nombre puede ser UUID o una lámina: ni cada PNG garantiza una escena arquitectónica independiente, ni una lámina de múltiples imágenes se contabiliza automáticamente como varias escenas originales.

**Fórmula verificable:** 36 menos el número de **escenas independientes visualmente validadas**. Si los 12 PNG fueran válidos como escenas distintas (caso máximo no demostrado), faltarían **al menos 24**. Los 4 JPG que constan en el inventario local comunicado anteriormente **no están publicados aquí** y no se incluyen. No rellenar huecos con los 13 albedos, los 9 mapas PBR ni las evidencias F02.

## Matriz de cobertura por tipo — pendiente de etiquetado visual humano
| Familia visual a acreditar | Evidencia aceptable | Estado actual | Acción de cierre |
|---|---|---|---|
| Fachada completa · frontal | Escena original con escala, huecos y volumen completos | NO CLASIFICADO | Revisar 12 PNG y asignar IDs o marcar PENDIENTE |
| Fachada completa · oblicua | Volumen, esquinas, transición de materiales y cubierta | NO CLASIFICADO | Revisar y documentar |
| Revestimiento mineral · detalle | Relieve, jambas, luz rasante, sin inventar geometría | FUENTE PBR EXISTE; ESCENA PENDIENTE | Captura/render original independiente |
| Ladrillo / aplacado | Juntas, textura y continuidad en paños reales | SOLO ALBEDO EN GITHUB | Clasificar o obtener escena específica |
| Madera / cerámica exterior | Escala y colocación físicamente plausibles | SOLO ALBEDO EN GITHUB | Clasificar o obtener escena específica |
| Relación fachada–ventana | Encuentro real con F02, alféizar y vidrio | BASELINE F02 EXISTE | Generar F03 sin tocar F02 y contrastar |
| Contexto pavimento/terreno | Referencia del entorno, no `MATERIAL.WALL` | 3 ALBEDOS DE SUELO | Excluir de la cuenta arquitectónica principal |
| Sistema completo móvil | Fachada completa legible en móvil | SOLO EVIDENCIA F02 | Captura comparada F03 en navegador y móvil físico cuando disponible |

## Protocolo de cierre sin acumular imágenes
1. Abrir [índice visual](reference-index.md) y etiquetar los 12 PNG: `SCENE_FULL`, `SCENE_DETAIL`, `CONTACT_SHEET`, `NOT_ARCHITECTURAL`, `UNKNOWN`. Registrar nivel de confianza y motivo por imagen.
2. Asignar etiquetas de fachada/estilo solamente tras inspeccionar la imagen. Un collage no equivale a múltiples archivos originales.
3. Verificar si los 4 JPG locales faltantes son referencias útiles. La publicación de esos binarios requiere un operador con acceso a `C:\Users\temp123\Downloads\IMAGENES REFERENCIA KIMI CODE`; desde GitHub no se puede acceder a esa carpeta. No afirmar que estén en el repo.
4. Sólo si el encargo de 36 escenas sigue siendo obligatorio, generar o incorporar **únicamente el déficit verificado** por categorías, evitando duplicados; con derechos y revisión, en un incremento separado. Esta tarea documental no genera imágenes nuevas.
5. No aceptar la fase visual por alcanzar un número de ficheros. Aplicar QA de fachada completa y juicio humano comparativo.

**Estado al 04/11/2026:** `INVENTORY_COMPLETE_FOR_REMOTE_ASSETS`; `SEMANTIC_CLASSIFICATION_PENDING`; `ORIGINAL_36_SCENE_TARGET_NOT_MET`; `F03_RENDER_NOT_IMPLEMENTED`; `F02_FROZEN`.
