# Decisión del propietario · material por objeto y ranura

**Estado:** propuesta, sin aplicar. El esquema del proyecto **no se ha tocado** (instrucción del propietario, 26/11/2026).
**Rama de la propuesta:** `claude/rodaje-cierre-1440`. Contrato afectado: `rubik-sota.material-tokens` 1.0.0 (`js/material-tokens-core.js`).

## 1 · Qué hay hoy (medido en el código)

| Dónde | Campo | ¿Lo admite el esquema 1.x? | Efecto en el rodaje |
|---|---|---|---|
| `rooms[].floorMaterialId` → `materials[]` | id de catálogo o `appearance.preset` | Sí | Identidad **documentada** (`explicit`/`catalog`) |
| `walls[].surfaceMaterialId` → `materials[]` | ídem | Sí | Identidad **documentada** |
| `materials[].appearance.materialToken` | token de la taxonomía | **No** (`appearance` tiene `additionalProperties:false`) | El contrato lo lee, pero ningún proyecto válido lo trae |
| `objects[].materialToken` | token por objeto | **No** (`object` tiene `additionalProperties:false`) | Ídem |
| `objects[]` | `type`, `color` | Sí | Solo orientan una **aproximación** por familia y pieza: «Acabado pendiente de revisión» |

Consecuencia: el sofá, la alfombra, la mesa o el electrodoméstico salen con la receta que el kit **deduce** del tipo de
catálogo y del nombre de cada pieza del GLB. Es determinista y queda declarado en `rodaje-report.json`, pero el profesional no
puede fijar que un sofá concreto es de terciopelo y no de lino.

## 2 · Opciones

| | Opción | Qué cambia | A favor | En contra |
|---|---|---|---|---|
| A | **Mantener** (estado actual) | Nada | Cero migración | Muebles siempre en nivel B («aproximación»); el profesional no puede corregirlos |
| B | **Ranuras que apuntan a materiales del proyecto** (recomendada) | `objects[].materials?: { <ranura>: <materialId> }` (opcional) y `materials[].appearance.materialToken?` (opcional). Las ranuras válidas las declara el **catálogo** por modelo (p. ej. sofá: `tapiceria`, `estructura`, `patas`, `cojines`), no el usuario | Reutiliza la entidad `materials[]` que ya tienen suelos y muros: un único sitio para color, preset, repetición y token. Varias ranuras por objeto. Aditivo: versión menor 1.x | Hay que tocar el esquema, `project-core`, el panel de Amueblar y el mapa pieza→ranura de cada GLB del catálogo |
| C | Token suelto por objeto | `objects[].materialToken` (un solo token) | Mínimo | Un sofá tiene tela, madera y metal: un solo token no lo expresa. Duplica la identidad fuera de `materials[]` |

## 3 · Recomendación: B, en tres pasos que se pueden aprobar por separado

1. **Esquema 1.(n+1), aditivo.** Dos campos opcionales. Un proyecto sin ellos sigue siendo idéntico. Una versión anterior de
   RUBIK que abra un proyecto más nuevo **conserva** los campos desconocidos (`project-core.validate`: «Newer V1 version:
   unknown fields are retained»), así que no se pierden datos.
2. **Catálogo.** Cada modelo declara sus ranuras y qué piezas del GLB cubre cada una (nombres de malla). Sin esa tabla, el kit
   sigue aproximando por pieza: la ranura nunca se adivina.
3. **Interfaz (Amueblar).** Selector por ranura con los materiales del proyecto y del catálogo de RUBIK. El rodaje lo consume
   ya: `materialsDoc` emitiría `{kind:'object', id, slot:'tapiceria'}` con identidad `explicit`/`declared`, y `receta_token()` la
   aplica antes que cualquier aproximación (orden explícito → catálogo → aproximación → reserva, sin cambios).

**Criterios de aceptación propuestos:** proyecto sin ranuras = huella y ZIP idénticos a hoy; ranura declarada con token conocido
= nivel A en el informe y en la ficha; token desconocido o ranura que no existe en el modelo = aviso en el preflight sin
bloquear; reabrir en una versión anterior conserva los campos; ningún nombre visible en chino.

## 4 · Lo que necesito del propietario

- Elegir A, B o C.
- Si es B: confirmar quién define el vocabulario de ranuras por modelo de catálogo (propuesta: RUBIK, versionado con la
  taxonomía) y si la interfaz entra en este corte o en el siguiente.

Hasta esa decisión el kit, el contrato y las pruebas (`tests/material-tokens.test.cjs`, comprobador 13/13) se quedan como están.
