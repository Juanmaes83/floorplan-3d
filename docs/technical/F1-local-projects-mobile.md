# Base F1: proyectos locales, español y uso móvil

Base: `master` en `de195e35f531cccc5711d11f3b7fa82657d100c1`, que incluye F1a (PR #4).
Esta entrega integra el español y la marca de PR #1 (`540b8255eddd23e5ebb805a8f51dd5406a86911f`)
y completa los criterios acotados de F1a de PR #3. No integra los roadmaps de PR #2/#3
ni altera el contrato, el validador, la plantilla o la proyección compartida ya fusionados.

## Comportamiento

- Español inicial y persistente, marca Rubik Sota, nombres incluidos traducidos;
  nombres personalizados se conservan. Inglés y chino siguen disponibles.
- «Proyectos»: crear desde plantilla, abrir, renombrar, duplicar y eliminar con
  confirmación. Se conserva al menos un proyecto. El historial se vacía al cambiar
  de proyecto para impedir que deshacer recupere un plano distinto.
- Colección `rubik-sota-project-library-v1`: versión, proyecto activo y entradas
  `{id, name, project}`. Cada `project` sigue siendo un FloorPlanProjectV1 completo.
  Duplicar genera un nuevo ID raíz; conserva los IDs hijos válidos dentro del proyecto.
- Una escritura de colección se prepara en una copia y se aplica solo después de
  guardarse. Fallos de cuota o nombres inválidos conservan la colección anterior.
  Una colección corrupta se conserva y se avisa; la app permite recuperar/exportar
  el proyecto F1a anterior, con gestión de colección deshabilitada.
- Las claves F1a y legacy se conservan. La colección adopta el proyecto cargado por
  el migrador existente; no vuelve a migrarlo ni modifica el contrato. Guardados,
  importación y deshacer posteriores escriben el proyecto activo en la colección.
  Exportar conserva el JSON completo del proyecto activo, no exporta la colección.
  No hay coordinación entre pestañas simultáneas: prevalece el último guardado;
  se recomienda editar la colección desde una sola pestaña.
- Datos limitados a navegador/origen, sin sincronización ni backend. Borrar datos
  del navegador pierde la colección: exportar JSON proporciona copias independientes.
- Nombres de la colección se asignan con `textContent`/`value`, sin HTML interpretado.
- Cabecera móvil de una fila desplazable, controles de al menos 44 px y cajones
  laterales. La barra contextual también se desplaza si no caben sus acciones.
  El canvas dispone del alto restante menos cabecera de 58 px y pie de 24 px.
- Si WebGL falta o falla el arranque 3D, un aviso comprensible permite seguir en 2D;
  `busy` y el estado de transición se limpian. Una descarga CDN fallida conserva
  también el aviso existente y 2D operativo.
- En español se omiten todos los importes, precios unitarios y totales en yuanes.
  No se convierten monedas ni se introducen precios nuevos. Las superficies permanecen.

## Comprobaciones de esta entrega

No se reimplementa F1a. Por instrucción final del usuario se ejecuta también
la suite completa histórica, junto con los nuevos flujos.

```bash
node --test tests/project.test.cjs tests/library.test.cjs tests/browser.test.cjs
python3 tests/schema.test.py
git diff --check
```

Pruebas añadidas: persistencia y aislamiento entre proyectos; nuevo ID al duplicar;
renombrado; eliminación confirmada/cancelada; cuota, nombres inválidos y corrupción;
UI en español y texto hostil inerte; importación/exportación de proyecto completo;
rechazo inválido sin alterar colección; adopción de migración F1a conservando ambas
claves históricas; 2D y 3D táctil en ambas orientaciones, cambio de orientación,
giro de cámara, edición 2D, vuelta desde 3D y fallback sin WebGL.

Se usa Chromium/SwiftShader: renderizado por software e interacción emulada, no
rendimiento ni comportamiento acreditado en un móvil físico. Los módulos oficiales
Three.js se sirven solo durante los tests mediante el transporte curl con TLS
verificado ya documentado en F1a; no se modifica el CDN ni la política de red.

## Publicación y pendientes

La rama se basa en master; no sobrescribe la rama abierta de PR #1 ni incorpora
cambios de otros repositorios. Esta entrega debe revisarse en una sola PR hacia master,
sin fusionarla. No hay CI configurada en la base. Consultar estado remoto requiere API
GitHub, que en este entorno devuelve `Forbidden` en `api.github.com/graphql`.

Preview pública: no disponible/verificada. Tanto `raw.githack.com` como
`rawcdn.githack.com` rechazan la conexión desde este entorno con HTTP 403 del proxy.
No se presenta un enlace hipotético como preview ni una respuesta HTTP como QA 3D.
Crear/publicar Pages mediante API tampoco está disponible aquí. Queda pendiente
una URL pública vinculada al SHA final, abierta sin autenticar y con 2D/3D comprobados.

La comparación cuantitativa de píxeles frente al commit anterior a F1a, con umbral
acordado, no se rehace ni se acredita en esta entrega. Las pruebas históricas de F1a
se mantienen con su resultado y límites; esta entrega documenta solo evidencia nueva.
F1b sigue pendiente: imagen, calibración, trazado y revisión manual. No se incluye
interpretación automática, Asset Lab, IKEA, backend ni publicación en producción.

## Resultado local (30-09-2026)

- 3/3 pruebas nuevas de colección aprobadas, sin omisiones.
- 5/5 pruebas de navegador de esta entrega aprobadas, sin omisiones.
- Canvas vertical: 390 × 762 px, 90,3 % del alto del viewport.
- Canvas horizontal: 844 × 308 px, 79,0 % del alto del viewport.
- Cambio de orientación en ambas sesiones y giro táctil de cámara comprobados.
- Capturas propias 2D, 3D y tras girar disponibles en `/tmp/f1-mobile-*` durante QA;
  no se incorporan temporales ni imágenes de prueba al repositorio.
- La entrada en 3D cierra los cajones móviles para mostrar la escena; siguen
  disponibles mediante los controles de cabecera.
- Sintaxis de scripts inline, colección y pruebas comprobada; diff sin errores.
- Las pruebas históricas completas de F1a se ejecutan por la instrucción final del usuario.

Cierre por instrucción final del usuario: suite completa ejecutada incluyendo F1a.
`node --test tests/project.test.cjs tests/library.test.cjs tests/browser.test.cjs`:
53 pruebas aprobadas, cero fallidas y cero omitidas (134,97 s).
`python3 tests/schema.test.py`: 3 pruebas aprobadas. No se intenta crear la PR
por GraphQL ni se modifica la red. Se publica la rama mediante push normal y no se fusiona.
