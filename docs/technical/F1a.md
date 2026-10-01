# F1a: proyecto canónico y migración local

Base histórica de F1a: `a03136c86842968a3de5da4c33549d3df3313c51`, rama de trabajo `work`.
F1a fue fusionada en master por la PR #4, commit `de195e35f531cccc5711d11f3b7fa82657d100c1`.
Los criterios de proyectos locales, español y móvil que completa la siguiente entrega
se documentan en [F1-local-projects-mobile.md](F1-local-projects-mobile.md).
Autoridad: contrato y ejemplos de F0 recuperados del PR #3, commit
`825ddf629d037d57690aedeea188b725ebf561b5`. Los archivos bajo
`docs/contracts/` conservan ese contenido y su estado histórico de propuesta;
este cambio implementa F1a por instrucción del usuario, sin aprobar otras decisiones de F0.

## Modelo y vistas

- `js/reference-project.js`: instancia inicial completa `FloorPlanProjectV1`.
- `js/project-core.js`: esquema, reglas semánticas S1–S7 (incluida autointersección),
  migración, importación y una proyección común para SVG/Three.js.
- `js/project-schema.js`: copia exacta del JSON Schema, empaquetada como script local
  para mantener la apertura directa de `index.html` sin instalar dependencias.
  Una prueba comprueba que ambas copias son idénticas.
- `js/safe-dom.js`: las cadenas de datos se sustituyen por tokens antes de analizar
  el marcado de presentación. Después se asignan como texto/atributos de nodos inertes.
  Nombres, IDs y colores importados no entran directamente en el parser HTML/SVG.

`project` es la fuente durable. La proyección `geometry` es derivada, compartida por
2D y 3D y nunca se guarda como una segunda geometría. Los adaptadores de mobiliario
mantienen las operaciones existentes mediante accesores no enumerables; los campos
canónicos son `position`, `size` y `rotationDeg`. Historial y exportación serializan
el proyecto completo. Selección, cámara, paneles, herramientas y precios heredados
son presentación/edición y no se incorporan al contrato.

La vivienda conserva 13 estancias, 46 muebles y los 48 segmentos sólidos que realmente
contiene el código base. Se añaden 22 segmentos portadores para los huecos (12 ventanas,
6 puertas, 2 correderas y 2 huecos de mirador), porque el contrato exige `wallId`.
Estos portadores se recortan al proyectar, evitando duplicar sólidos. Los IDs
`wal_ref-wN` son asignados una sola vez según el migrador de F0; reordenar las listas
no cambia identidades ni referencias.

Los ejes se escriben en mm enteros. Rectángulos con centro a medio milímetro requieren
redondeo al generar la plantilla: su contorno puede desplazarse como máximo 0,5 mm.
Los polígonos de estancia y las dimensiones de objetos se conservan.
La escala de la plantilla es `estimated/template`, con proporción declarada `1:60`;
no implica calibración ni precisión acreditada.

## Persistencia, importación y compatibilidad

Clave nueva: `rubik-sota-floorplan-project-v1`. Clave antigua: `huxing-design-v1`.

1. Si existe un proyecto nuevo válido, se utiliza.
2. Si solo existe estado antiguo, se migra con IDs/referencias deterministas, se
   valida y se intenta guardar bajo la nueva clave. La clave antigua se conserva.
3. Si el guardado falla, el diseño migrado sigue disponible en memoria con aviso.
4. Datos corruptos degradan a la plantilla con aviso; no se sobrescribe el original
   durante la carga. Una edición posterior es una operación de guardado explícita.

Las importaciones validan y calculan su proyección antes de escribir o aplicar el
estado. Un rechazo o un fallo de escritura no modifica el proyecto ni el guardado.
El manejador de archivo limita el JSON a 15 MB y evita aplicar una lectura anterior
si se ha seleccionado otro archivo. No sube nada a servidores.

Se comprueban estructura, versión, unidades, tipos/rangos, fechas, unicidad global,
referencias, muros de longitud positiva, huecos dentro del muro, polígonos simples
de área positiva y coherencia de calibración. Los errores incluyen ruta o ID.
Una versión major distinta de 1 se rechaza. V1 posterior conserva campos desconocidos
y avisa; enums no soportados y campos que colisionan con los accesores de edición
(`cx`, `cy`, `w`, `d`, `rot`) se rechazan en vez de interpretarse o descartarse.
No se aplican por defecto campos opcionales que alteren los datos importados.

Referencias a imágenes y `assetRef` se conservan como datos opacos. No se descargan,
cargan ni integran sus recursos. Tipos de objeto desconocidos usan la caja genérica;
presets de material desconocidos usan color liso. Los modelos procedurales actuales
no constituyen un catálogo de assets con dimensiones/licencias verificadas.

## Límites de esta fase

No hay carga de imagen, calibración interactiva, trazado ni edición geométrica nueva:
son F1b. No hay backend, cuentas, Asset Lab ni servicios comerciales.
Los avisos topológicos W2/W3 propuestos en F0 no se implementan: estancias y muros
siguen siendo entidades independientes. Se conserva la presentación heredada de
miradores para estancias excluidas del área. Los precios solo pertenecen a la UI
heredada; no son presupuestos ni se exportan como materiales del contrato.
Juanma confirmó el 30-09-2026 que tenemos los derechos y permisos necesarios para
continuar y publicar los cambios de F1a en este repositorio. Esta confirmación no
crea una licencia ni implica que exista un archivo `LICENSE`.

## Pruebas reproducibles

Desde la raíz del checkout:

```bash
node --test tests/project.test.cjs tests/browser.test.cjs
python3 tests/schema.test.py
git diff --check
```

No se añadió instalación o manifest de dependencias. Las pruebas de modelo usan
Node estándar. Las de navegador necesitan Playwright y Chromium; el oráculo
independiente necesita Python `jsonschema`. En este entorno ya estaban disponibles
Node 24.19.0, Playwright 1.62.1, Python 3.12 y jsonschema 4.26.0.
`CHROME` permite indicar otra ruta al ejecutable.

El runner de navegador inicia un servidor HTTP temporal en un puerto libre, sirve
el checkout y lo cierra al terminar. No altera el servidor preexistente del puerto 8000.
Los contextos y almacenamiento de prueba están aislados de las sesiones del usuario.

La prueba 3D intenta primero cargar el CDN directamente. Este Chromium rechaza el
certificado de la CA del entorno. Solo en ese caso el runner obtiene los mismos módulos
versionados con `curl` y TLS verificado y los entrega a las solicitudes del navegador.
No usa `-k`, `ignoreHTTPSErrors`, cambios de red ni modificación de la aplicación.
Si ese transporte también falla, el test se marca omitido con el bloqueo exacto.
Por tanto, un pase con este transporte verifica renderizado/interacción y geometría,
pero no demuestra que la carga directa del CDN funcione en este Chromium.
SwiftShader tampoco valida rendimiento con hardware ni móviles físicos.

Para revisión manual, si el servidor existente no responde, desde la raíz:

```bash
python3 -m http.server 8001 --bind 127.0.0.1
```

Abrir la dirección local del puerto 8001 en un navegador con confianza TLS válida
para el CDN. Importar el ejemplo válido de `docs/contracts/examples/`, exportarlo
y comprobar cambios de geometría en ambas vistas. El ejemplo inválido debe dejar
intacto el diseño y mostrar el error. No se ha publicado ninguna preview.

## Resultado ejecutado el 30-09-2026

- Node: 45 pruebas aprobadas, cero fallidas y cero omitidas (36 de modelo y 9 de navegador).
- Python: 3 pruebas de esquema aprobadas con el validador independiente.
- Sintaxis: 2 scripts inline y los 4 módulos locales comprobados con `node --check`.
- `git diff --check`: sin errores.
- Capturas de la vivienda 2D y 3D revisadas visualmente por Codex.
- 3D propio en Chromium/SwiftShader con el transporte HTTPS verificado descrito arriba;
  incluye importación de otra geometría, dimensiones reales de meshes, muro diagonal
  y regreso a 2D. La carga directa del CDN en Chromium sigue bloqueada por confianza TLS.
- Rendimiento con hardware y dispositivos físicos: no verificado. No se amplió esta
  fase a corregir el fallo sin WebGL reportado anteriormente en F0.
