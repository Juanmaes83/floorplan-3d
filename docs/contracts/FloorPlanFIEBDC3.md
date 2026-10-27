# FloorPlanFIEBDC3 — contrato del subconjunto BC3 (7C-D)

## Frontera

`js/fiebdc3-codec.js` publica `FloorPlanFIEBDC3` como CommonJS y global de navegador cuando se carga expresamente. Es un codec de datos FIEBDC-3 independiente de `FloorPlanCostProvider`, CostQuote y Budget. No hace IO, red, DOM, almacenamiento ni registro automático.

La autoridad de sintaxis es [FIEBDC-3/2024 de la Asociación FIEBDC](https://www.fiebdc.es/web2/datos/uploads/Formato-FIEBDC-3-2024.pdf). Se implementa un subconjunto deliberado, no compatibilidad completa con las 97 páginas del formato.

## API

- `decode(bytes: Uint8Array) -> { text, encoding }`: interpreta bytes según el `~V` declarado; si el campo está vacío, usa CP850.
- `encode(text: string, encoding?: '850' | '437' | 'ANSI') -> Uint8Array`: codifica de forma estricta. Si se omite `encoding`, usa la declaración de `~V` o CP850 por defecto.
- `parse(text: string | Uint8Array) -> Model`: lectura léxica, validación y proyección semántica. No muta la entrada.
- `serialize(model: Model) -> string`: escritura determinista de registros en el mismo orden, con CRLF y EOF ASCII 26. Rechaza un modelo semántico editado sin actualizar su ledger de registros.
- `validate(model) -> Model`: serializa y vuelve a analizar; los errores se lanzan con `error.code` estable.
- `encodeModel(model) -> Uint8Array`: serializa y codifica.

## Modelo

`Model` contiene `format`, `encoding`, `version`, `coefficients`, `concepts`, `decompositions`, `texts`, `scopes`, `records` y `warnings`. `records` es el ledger de fuente y la autoridad para la escritura; cada registro conserva `type` y `fields` en orden. Las proyecciones semánticas son de solo lectura conceptual: para editar, se actualiza el ledger y se vuelve a llamar `parse(serialize({records,...}))` o se construye otro ledger. `serialize` detecta divergencias entre ledger y proyecciones.

`version` proyecta propietario, versión/fecha del formato, programa, cabecera/rótulos de precio, encoding, comentario, tipo de información y metadatos restantes de `~V`. `coefficients` guarda grupos antiguos y actuales de `~K` y porcentajes sin realizar cálculos. `concepts` guarda código y alias, unidad, resumen, tipo, precios/fechas explícitos y `prices` por índice/rótulo. `decompositions` guarda grupos antiguo y actual de hijos, orden, factor, rendimiento y códigos de porcentaje crudos. `texts` guarda el texto de `~T`, incluso CRLF interno. `scopes` guarda abreviatura/nombre de `~W`; este ámbito de pliegos no se equipara automáticamente a los rótulos de precios de `~V`.

Un campo numérico vacío es `null`; un `0` explícito es `0`. Las fechas parciales se conservan como cadenas de dígitos, sin completar ni validar como fecha de calendario. Cuando hay más rótulos que precios o fechas explícitos, la última entrada explícita se repite y se marca `inheritedPrice` / `inheritedDate`. No se elige una variante activa. No hay conversión de moneda o unidades.

## Sintaxis y errores

La capa léxica exige `~`, `|`, subcampos `\`, CRLF y EOF ASCII 26. Cada registro termina en `|`. El primer registro es `~V`; los conocidos son `~V`, `~K`, `~C`, `~D`, `~T` y `~W`. Un tipo no interpretado se conserva en `records` y genera `warnings: [{code:'unsupported-record',recordIndex,type}]`. Los errores explícitos abarcan EOF/registro truncado, controles o saltos de línea inválidos, encoding no soportado, byte indefinido, carácter no representable, código/número/fecha inválido, duplicado y referencia sin concepto. Para archivos de actualización `~V` tipo 4, referencias no resueltas generan warning.

CP850, CP437 y ANSI se implementan con tablas acotadas, sin dependencia externa. **ANSI se interpreta como Windows-1252**, una decisión operativa porque la especificación lo llama juego de Windows sin fijar página de códigos numérica. Los cinco bytes no asignados de Windows-1252 fallan explícitamente. Otros juegos no están soportados.

## Límites

El ledger permite round-trip de registros no interpretados siempre que su sintaxis léxica sea segura. No se normalizan semánticamente registros adicionales, adjuntos, fórmulas, mediciones o variantes más complejas. Actualizaciones secuenciales de un mismo código `~C` no se fusionan: el subconjunto rechaza código duplicado. No se pretende validar toda la gramática FIEBDC ni el valor de todos los campos de registros desconocidos.
