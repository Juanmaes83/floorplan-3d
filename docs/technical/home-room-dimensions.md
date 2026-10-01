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

Código comprobado: `648374a12eee15d538ffa2c4058b382082d7df23`, publicado en
la misma rama. Los cambios posteriores son pruebas/documentación/capturas;
no cambian el código de la aplicación. El SHA final se obtiene de la cabeza de
[la rama publicada](https://github.com/Juanmaes83/floorplan-3d/tree/feat/home-room-dimensions).

| Comando ejecutado | Resultado real |
| --- | --- |
| `node --test --test-concurrency=1 tests/*.test.cjs` | 160 ejecutadas: 159 aprobadas, 1 fallida inicialmente; 0 omitidas. 556,75 s. |
| `node --test --test-name-pattern='collection adopts F1a migration' tests/browser.test.cjs` | Repetición tras ajustar la expectativa: 1/1 aprobada, 0 omitidas. |
| `node --test --test-concurrency=1 tests/room-layout.test.cjs tests/room-layout.browser.test.cjs tests/library.test.cjs` | Repetición final: 25/25 aprobadas, 0 omitidas. Incluye taps táctiles reales en emulación móvil. |
| `python3 tests/schema.test.py` | 10/10 aprobadas; incluye igualdad estructural y ausencia de claves duplicadas. |
| `python3 tests/f2_readiness.test.py` | 12/12 aprobadas. |
| `python3 tests/f2_wall_evaluation.test.py` | 16/16 aprobadas. |
| `python3 tests/f2_raw_export.test.py` | 3/3 aprobadas. |
| `node --check` | Módulos modificados, nuevos tests y los dos scripts inline JS/module extraídos: correctos. |
| `git diff --check` y `git diff --cached --check` | Correctos. |

El fallo de la suite agregada fue exclusivamente la expectativa antigua de
renombrado en la prueba F1a de migración. Antes esperaba conservar incluso el
nombre portable; ahora exige `name: Migrado` y compara estrictamente todos los
demás datos y ambas claves históricas. La repetición pasa. **No se repitió la
suite agregada completa después de ajustar esa expectativa y los tests táctiles**;
se repitieron las pruebas afectadas, sin cambiar código de aplicación.
Los primeros ensayos nuevos también detectaron errores del harness (nombre de
fixture WebP inexistente y uso incorrecto de Array/Blob en el constructor ZIP).
Se corrigieron los tests, manteniendo validación ZIP, y se repitieron con éxito.
Los transcripts finales y el fallo agregado se conservan junto a las capturas.

Escritorio 1440×900, móvil 390×844 y 844×390: proyectos vacío/imagen independientes,
habitaciones, unión, cancelación, confirmar, historial, recarga, JSON, calibración
conservada y ZIP probados. 2D/3D comparten la misma fuente canónica; siete IDs de
muros en escena y canvas ≥60 % del alto del escenario. Pruebas unitarias cubren
puertas/ventanas, cotas en eje/cara, muebles rotados, colisiones, vecinos
irregulares/parciales, muros ambiguos y límites. Prueba de interfaz cubre el
consentimiento explícito para huecos y el fallo atómico de almacenamiento.
Las capturas/metrics son sintéticas y locales, no planos reales.

No existe workflow de CI de pruebas en `.github/workflows` en esta base. La
página pública de checks del commit muestra **Vercel Preview Comments** y una
referencia al alias de rama; ese check no acredita las regresiones ni READY.
La [referencia de preview encontrada en ese check](https://floorplan-3d-git-feat-home-roo-573ef9-juanma-espinosas-projects.vercel.app/)
es un alias mutable: **no se certifica como deployment inmutable del SHA final**.

### Bloqueos externos de publicación de revisión

El push Git normal funcionó. La creación autorizada de PR REST falló:
`Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
No se insistió con GraphQL ni se cambiaron permisos/red. No se abrió ni fusionó
una PR en este entorno. Se deja [el enlace de creación hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/home-room-dimensions?expand=1)
y todo el trabajo publicado en la misma rama.

Comprobar el alias desde una sesión nueva sin autenticar dio:

- `curl -I --max-time 20 <alias>`: `CONNECT tunnel failed, response 403`.
- Playwright/Chromium, contexto nuevo sin cookies: `net::ERR_TUNNEL_CONNECTION_FAILED`.
- GET público a GitHub API para estado del commit: HTTP 403.

No se verifican acceso de la persona invitada, protección de autenticación,
READY ni URL inmutable del SHA final. No hay enlace temporal autorizado disponible.
Estos requisitos de revisión quedan **pendientes**, junto con la apertura de PR;
no se presenta el trabajo como completamente entregado ni visualmente aprobado.
No se ejecuta merge ni despliegue manual a producción. Las capturas sintéticas están en
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
