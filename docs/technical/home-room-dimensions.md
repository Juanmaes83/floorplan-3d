# Viviendas y dimensiones de estancias — entrega post-F3

Estado: implementación preparada para revisión; no aprobada ni fusionada.
Fecha: 01-10-2026. Rama: `feat/home-room-dimensions`.
Base remota comprobada: `master` @ `19fbd5f90b1766580eb1c0ae45cc2827d69404e7`.
Checkout inicial limpio en la rama F3 @ `772e24c`; trabajo previo conservado.
PR #17 fusionada y F3 cerrada para el piloto de dos IKEA. PR #15 continúa como
propuesta histórica; se leyó `ROADMAP-2-proposal.md` @ `eebbfd9`, sin usarlo
como base ni copiar su estado anterior de F3.

## Flujo implementado

- **Nuevo proyecto** siempre visible al principio de la barra: nombre y elección
  entre plano vacío e imagen raster. Cada uno es independiente en la colección
  local. Cancelar el selector de imagen o rechazar una imagen no crea un proyecto.
- El plano vacío inicia **Nueva estancia**. Cancelar deja ese proyecto vacío;
  `+ Estancia` permite continuar. El botón antiguo de crear desde Proyectos se
  identifica ahora como **Crear plantilla de referencia**.
- Nueva estancia: nombre, ancho/profundidad interiores en mm; posición X/Y de
  esquina interior o unión a la derecha/debajo de una estancia compatible.
  La unión reutiliza exactamente un muro y exige igual longitud interior en
  el lado de contacto. Se pueden repetir habitaciones para formar una vivienda.
- Propiedades → **Editar dimensiones interiores**: una dimensión por operación,
  lado fijo explícito, nueva medida y **Ver cambio**. Plano previo discontinuo,
  propuesta continua, muebles y huecos, más detalle textual de impactos.
- Confirmar guarda primero, después publica el proyecto y añade una sola entrada
  al historial existente. Cancelar no cambia nada. Una cuota de almacenamiento
  agotada o una preview obsoleta no publican un cambio parcial.
- 2D y 3D se derivan del mismo contrato. Se muestran área y dimensiones de los
  rectángulos manuales. Se mantienen muebles, materiales, imagen, calibración,
  escala, importación/exportación JSON/ZIP y el trazado F1b.
- Renombrar actualiza también el nombre portable del proyecto, sin cambiar el
  contenido de otros proyectos de la colección.

## Reglas geométricas y límites deliberados

No cambia el contrato/schema 1.3.0 ni añade relaciones persistidas. El modelo
sigue siendo la fuente de verdad; el módulo deriva y verifica la relación
entre las caras interiores de un rectángulo y cuatro muros completos.

Se admiten cuatro vértices ortogonales, un muro activo inequívoco por lado y
esquinas coincidentes. Los muros se representan por su eje: se incluye medio
espesor al construirlos, evitando confundir longitud de eje con medida interior.
Las dimensiones de este editor están acotadas a enteros de 100–50000 mm;
los grosores impares y relaciones fuera de ese alcance usan edición manual.
No se convierte ni rebaja la versión de proyectos importados. El proyecto vacío
nuevo usa 1.3.0; el flujo de imagen conserva su compatibilidad 1.1/1.2 existente.

Al cambiar una dimensión se desplaza el muro opuesto al lado fijo y se ajustan
los extremos de los dos perpendiculares. Se conservan IDs, atributos y fuentes.
La etiqueta solo se recentra si sale de la habitación, y el impacto lo indica.
No hay solver general de adyacencias, ajuste proporcional ni reparación oculta.

| Situación | Decisión segura |
| --- | --- |
| Habitación independiente compatible | Previsualizar y confirmar el cambio. |
| Habitación con pared compartida | Mantener fijo el lado compartido y mover un muro exterior si no afecta otra relación. |
| Mover/alargar un muro compartido, incluso con vecino irregular o contacto parcial | Bloquear, identificar al vecino y proponer lado fijo compatible o edición manual. No deformar al vecino. |
| Puerta/ventana en muro desplazado | Mostrar desplazamiento; exige aceptación expresa antes de confirmar. Mantiene ID, dimensiones, offset y muro. |
| Hueco en muro que se acorta/alarga | Conservar posición física recalculando offset y mostrarlo. Bloquear si queda fuera. |
| Cota manual en cara/eje desplazado o que cambia su relación con el interior | Bloquear e identificarla; corregir/eliminar manualmente primero. No actualizar una cota sin conocer su anclaje. |
| Mueble que saldría de su estancia o nueva colisión con muro | Bloquear y pedir reubicarlo antes. Nunca escalar, trasladar ni reasignar automáticamente. |
| Nueva estancia/muro que invade vecino o cruza otros muros | Bloquear. Se permiten juntas de muros en extremos coincidentes. |
| Formas irregulares, diagonales, muros fragmentados/prolongados o esquinas conectadas ambiguas | Conservar proyecto y ofrecer Plano propio → Seleccionar/editar. |

Las medidas son de diseño orientativas. Introducir mm no verifica la escala de
una imagen, no confirma una medición profesional ni autoriza cambios estructurales.
Los conflictos geométricos existentes no se reparan automáticamente. No incorpora
normativa, DWG/DXF, solver para toda vivienda ni automatización F2 nueva.

## Verificación y publicación

Resultados finales y acceso de revisión se registrarán tras completar las suites
y publicar esta rama. Las capturas sintéticas están en
[artifacts/home-room-dimensions](../qa/artifacts/home-room-dimensions/).
El 3D local usa Chromium/SwiftShader: renderizado por software, sin acreditar
rendimiento de móvil físico. READY de Vercel no equivale a revisión visual.

F3 permanece cerrado y no se modifica su catálogo/pipeline. F2 conserva su estado
experimental: cinco sesiones y veinte planos reales siguen pendientes.

## Revisión de Juanma

1. Nuevo proyecto → plano vacío → crear y nombrar una habitación.
2. Añadir otra a la derecha/debajo; verificar medidas y pared compartida.
3. Seleccionar habitación → dimensiones → elegir lado fijo y comparar preview;
   cancelar y después confirmar, deshacer/rehacer y recargar.
4. Comprobar bloqueo al mover un lado compartido; probar puerta/ventana, cota y
   mueble afectado. Revisar la explicación y la alternativa manual.
5. Crear otro proyecto desde una imagen, calibrar/trazar, abrir el anterior y
   comprobar independencia; descargar JSON y ZIP, importarlos y revisar 2D/3D.
6. Repetir en escritorio y teléfono vertical/horizontal. Revisión física y
   aprobación humana pendientes; no se fusiona en esta tarea.
