# Idioma visible · coordinación con CC1 (HERO, Hybrid, Simulator, STUDIO) · 20/11/2026

**Regla permanente del propietario:** en las sesiones española e inglesa **nunca** aparece texto en chino (interfaz, evidencias, capturas, entregables). El chino sigue disponible como idioma.

## Qué hay en `claude/r03-holguras` (para que CC1 lo reutilice, sin motores nuevos)

| Pieza | Uso |
|---|---|
| `nm(s)` (`index.html`) | Embudo único que ya usan ~35 módulos. Traduce con `NAMES_ES`/`NAMES_EN`; en ES/EN **nunca** devuelve chino («Nombre sin traducir» / «Untranslated name») |
| `window.FloorPlanDisplayName(name, type)` | Para objetos con tipo: diccionario, después nombre del tipo del catálogo y, por último, «Elemento» / «Item». En ZH devuelve el original |
| `FloorPlanDisplayName.typeName(type)` | Nombre del tipo en el idioma visible, para evitar redundancias como «Armario ropero «Armario»» |
| Selector `#langBtn` | `ES · EN · ZH`, con el activo resaltado. Un clic pasa al siguiente idioma, igual que antes |
| Guarda `tests/no-chinese-display.browser.test.cjs` (bloqueante) | Recorre en ES y EN el plano, cada mueble, cada estancia, cada armario R03, las áreas de trabajo y el cuadro de cantidades. Cualquier carácter CJK visible la hace fallar. **Sin excepciones** |

## Lo que se pide a CC1 en sus superficies

1. Mostrar todo nombre de proyecto, estancia, mueble o material con `nm()` o `FloorPlanDisplayName`, nunca `.name` en bruto.
2. Añadir sus pantallas (HERO, Hybrid, Simulator, STUDIO) al recorrido de la guarda, o una guarda equivalente con la misma expresión regular.
3. **No alterar el modelo:** las funciones son solo de presentación. Los nombres del usuario en alfabeto latino pasan intactos y los datos originales no se reescriben.
4. Revisar cada captura con este criterio antes de entregarla.

**Límite conocido:** un nombre escrito en chino por la persona dentro de una sesión ES/EN se muestra como «Nombre sin traducir». El dato se conserva intacto y se ve en ZH.

## Política de nombres (decisión del propietario, 20/11/2026)

| Clase de nombre | Qué se hace | Qué no se hace nunca |
|---|---|---|
| **Datos originales** (lo que la persona escribió o importó) | Se conservan intactos en el modelo. Mostrar es una función de presentación (`nm`, `FloorPlanDisplayName`) | Reescribirlos, traducirlos en el modelo o sustituirlos al guardar |
| **Ejemplos conocidos** (proyecto de ejemplo, catálogo genérico) | Se **localizan** con los diccionarios (`NAMES_ES`/`NAMES_EN`) | Mostrar el original chino en ES/EN |
| **Nombres propios legítimos** (profesional, empresa, destinatario, marca, proyecto) | Se muestran **tal como se escribieron** si están en alfabeto latino. No se traducen ni se acortan, y no se ocultan por parecerse al tipo: solo se omite un nombre **exactamente igual** al del tipo, como «Armario» en un armario; «Col» en una columna se muestra | Ocultarlos por coincidencias parciales; transliterarlos automáticamente |
| **Nombre propio en CJK en una sesión ES/EN** | Se usa un **alias autorizado**: un nombre de presentación en alfabeto latino que la persona elige explícitamente (p. ej. en el destinatario de una entrega). Sin alias, «Nombre sin traducir» y el dato intacto | Inventar el alias ni transliterar sin autorización |

**Alias:** es una **propuesta de contrato** para CC1, sin cambio de modelo en este corte. Requiere que el propietario decida dónde vive (ficha del profesional y del destinatario, o un campo de presentación existente) y su validación. Hasta entonces ninguna superficie lo inventa.

**Pendiente con CC1:**
1. Añadir HERO, Hybrid, Simulator y STUDIO al recorrido de `no-chinese-display`.
2. Proponer dónde vive el alias.
3. Localizar sus textos de interfaz. «Sin chino» no acredita una interfaz traducida: hace falta una prueba de idioma real, como la del diálogo R03 en EN.
