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

## Publicación y cierre

La entrega de proyectos locales, español/marca, mobile-first y fallback sin WebGL se integró mediante la PR [#5](https://github.com/Juanmaes83/floorplan-3d/pull/5), merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`. La rama F1b dependiente se fusionó después; véase [F1b](F1b.md).

Preview examinada de esta entrega: https://floorplan-3d-6ii3r2tdm-juanma-espinosas-projects.vercel.app/ , ligada al SHA de aplicación `a4b5a9dbb1af6349170c802dea6b931a45cfbed4`. No se generó un deployment nuevo para el HEAD documental `966ab83`; ambos contienen la misma aplicación F1a local/mobile-first.

Al fusionarse F1b a master, Vercel produjo automáticamente el deployment de producción READY asociado al commit `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`. No hubo despliegue manual.

La validación técnica local reportada fue 53/53 Node/navegador y 3/3 de esquema. 3D en SwiftShader no acredita rendimiento en móvil físico. Los detalles originales y limitaciones se conservan abajo.
## Resultado local (30-09-2026)

- 3/3 pruebas nuevas de colección y 5/5 pruebas de navegador de esta entrega aprobadas, sin omisiones.
- Canvas vertical: 390 × 762 px, 90,3 % del alto del viewport.
- Canvas horizontal: 844 × 308 px, 79,0 % del alto del viewport.
- Cambio de orientación en ambas sesiones y giro táctil de cámara comprobados.
- 3D comprobado en Chromium/SwiftShader; no acredita rendimiento en GPU ni móvil físico.
- F1-local-projects-mobile se integró por la PR #5, merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.
- La fase F1b dependiente se integró después por la PR #6; su estado y pendientes están en [F1b.md](F1b.md).
