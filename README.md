# Rubik Sota Floor Plan Designer

**Rubik Sota Floor Plan Designer** es un editor de planos de vivienda en el navegador. Permite organizar estancias y muebles en 2D, medir y modificar tabiques, y recorrer la propuesta en 3D.

La aplicación es estática: no necesita servidor de aplicación ni compilación. El plano de ejemplo y las preferencias se guardan en el navegador.

## Idiomas

La interfaz está disponible en:

- Español (idioma inicial)
- English
- 中文

El selector de idioma conserva la elección en el navegador. Los nombres de estancias, muebles y materiales incluidos se traducen; los nombres personalizados por el usuario se mantienen.

## Funciones

### Plano 2D

- Crear proyectos locales vacíos o desde imagen, independientes entre sí.
- Crear estancias rectangulares e introducir ancho y profundidad interiores en milímetros, con vista previa, lado fijo, confirmación y deshacer/rehacer.
- Plano de referencia con escala 1:60 y cotas en milímetros.
- Biblioteca de más de 60 muebles y electrodomésticos, organizados por estancia.
- Añadir elementos con un clic o arrastrándolos al plano.
- Mover, girar y redimensionar muebles; ajustar a los muros.
- Medir distancias con ajuste a los muros.
- Retirar y restaurar tabiques no estructurales; los muros de carga quedan identificados.
- Capas independientes para cotas, nombres de estancia, muebles, cuadrícula y muros de carga.

### Vista 3D

- Cambiar entre plano 2D y escena 3D con transición.
- Vista aérea, isométrica y superior.
- Recorrido en primera persona: WASD y ratón en escritorio; joystick virtual en pantallas táctiles.
- Abrir puertas durante el recorrido.
- Muros a altura completa o en sección.
- Control de luz diurna y modo nocturno.
- Seleccionar y mover muebles en 3D; los cambios se reflejan en el plano.

### Superficies y estimaciones

- Superficie por estancia y superficie útil total.
- Seleccionar materiales de suelo por estancia.
- Superficies por material. En español se ocultan los precios heredados en yuanes, sin sustituir moneda ni inventar importes.
- Deshacer y rehacer cambios.

### Archivos

- Exportar una imagen PNG del plano.
- Importar una imagen PNG/JPG/WebP estática desde «Archivo» o «Plano propio» para calibrarla y trazar encima.
- Exportar e importar proyectos en JSON; exportar ZIP cuando se necesite transportar también las imágenes.
- Restablecer la distribución de ejemplo.

## Uso local

Se recomienda servir la carpeta con un servidor HTTP sencillo:

```bash
python3 -m http.server 8000
```

Después abre [http://localhost:8000](http://localhost:8000).

Three.js se carga desde jsDelivr; la primera apertura de la escena 3D necesita conexión a internet.

## Atajos

| Tecla | Acción |
| --- | --- |
| `T` | Cambiar entre 2D y 3D |
| `V` | Seleccionar o mover |
| `M` | Medir |
| `X` | Modificar un muro no estructural |
| `R` | Girar 90° |
| Flechas | Ajuste fino de 10 mm |
| `Shift` + flechas | Ajuste fino de 100 mm |
| `Ctrl/Cmd + D` | Duplicar |
| `Delete` | Eliminar |
| `Ctrl/Cmd + Z` | Deshacer |
| `F` | Ajustar el plano a la ventana |
| `Shift + F` | Pantalla completa |
| `Esc` | Cancelar selección o pausar recorrido |

## Tecnología

- HTML/CSS en `index.html` y módulos JavaScript locales en `js/`.
- Three.js 0.160.0 para la escena 3D.
- Sin dependencias de servidor ni datos enviados a una API propia.
- Los datos de trabajo y la preferencia de idioma se guardan en el almacenamiento local del navegador.

## Autoría y marca

Producto: **Rubik Sota Floor Plan Designer**
Autoría del proyecto: **Rubik Sota**

## Proyectos locales

El botón «Proyectos» permite crear, abrir, renombrar, duplicar y eliminar proyectos
(con confirmación). Cada proyecto conserva su geometría y edición al recargar.
La colección es local a este navegador y origen; no se sincroniza entre dispositivos.
Exporta cada proyecto como JSON para conservar una copia independiente.

F1a y su ampliación de proyectos locales, español, experiencia móvil y fallback sin WebGL quedaron integradas por las PR #4 y #5. F1b quedó integrada por la PR #6. PR #7 integró la claridad de importación y WebP estático. La línea base con cinco planos reales autorizados sigue pendiente; véanse los registros de fase.

## Plano propio (F1b integrada)

«Plano propio» permite importar PNG/JPG/WebP estático local, calibrar con dos puntos y una
distancia en milímetros, verificar una segunda cota y trazar muros, huecos y estancias.
Usa «Navegar» para desplazar/ampliar y «Seleccionar/editar» para corregir geometría.
Las medidas son orientativas; no hay generación automática de vivienda ni garantía profesional.

Exporta un ZIP para transportar proyecto e imágenes a otro navegador. Los originales
y sus metadatos permanecen locales hasta esa exportación explícita: revisa datos
personales antes de compartirlo. Para cargar una imagen usa «Plano propio» → «Nuevo
desde imagen». «Archivo» → «Importar proyecto JSON» importa JSON. «Archivo» → «Cargar imagen de plano (PNG/JPG/WebP)» ofrece el acceso directo al flujo de imagen.
PNG/JPG/WebP estático: máximo 15 MiB y 8000 px por lado. Consulta [uso y límites](docs/technical/F1b.md)
y la [evaluación pendiente con cinco planos](docs/qa/F1b-five-plans.md).

Seguimiento de importación en esta entrega: «Archivo → Cargar imagen de plano
(PNG/JPG/WebP)» abre el mismo flujo de «Nuevo desde imagen». [Formatos admitidos
y diferidos](docs/technical/image-formats.md); [roadmap canónico](docs/ROADMAP.md).

## F2: prototipo experimental integrado, no validado

Juanma autorizó el 30-09-2026 un prototipo local limitado a sugerencias de muros,
antes de completar la evaluación. En «Plano propio», «Sugerir muros localmente»
presenta segmentos discontinuos morados: acepta, corrige o rechaza cada uno.
No modifica escala ni geometría sin aceptación explícita; el trazado manual sigue
disponible. Solo analiza líneas horizontales/verticales, sin interpretar habitaciones
ni huecos. [Informe y límites](docs/technical/F2-wall-assist.md).

F2 está **integrada por las PR #9/#10/#11 y no validada empíricamente**. Falta medir cinco planos autorizados,
preparar un conjunto fijo de al menos veinte con referencias y acordar umbrales
con Juanma. Estos datos siguen pendientes para validar F2 y no bloquean nuevas entregas de producto. [Protocolo reproducible](docs/qa/F2-entry-protocol.md). El recorder
offline no implementa asistencia ni lee/sube imágenes. Juanma confirmó el flujo
en su teléfono; el rendimiento físico sigue sin medir.


## F3 — piloto externo texturizado integrado

La [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17) completó y cerró el piloto acotado tras revisión visual de Juanma. Se integraron SONGESAND 90366839 y STOCKHOLM 2025 puf 80586139 con dimensiones, atribución y texturas JPEG embebidas; el buscador permite encontrar los modelos junto con los muebles genéricos. SHA revisado/desplegado: `772e24c26d10cec4349f28558ffc87ee18748317`; merge en `master`: `24534b5544ffa37840bf4fe77c4ad12afda0c38b`. La [preview de ese SHA](https://floorplan-3d-rgf0u4thu-juanma-espinosas-projects.vercel.app/) está protegida por Vercel Authentication y figura READY. No hubo despliegue manual a producción.

Este cierre cubre el piloto inicial, no un catálogo comercial amplio ni una biblioteca PBR completa. No se admiten de forma general Draco, KTX2, meshopt, WebP ni URI de texturas remotas. El schema permanece en 1.3.0; se conserva el fallback genérico. El informe registra pruebas, diagnósticos y limitaciones: [corrección de catálogo en preview protegida](docs/technical/F3-preview-catalog-fix.md) y [estado F3/roadmap](docs/ROADMAP.md).

La entrega post-F3 de «Nuevo proyecto» y edición directa de dimensiones se aprobó y fusionó mediante la [PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18), merge `10e9f96`. Permite crear proyectos vacíos o desde imagen y dimensionar habitaciones rectangulares compatibles con previsualización y protección de geometría. No incluye un editor numérico general para formas irregulares. [Alcance, QA, limitaciones y registro de cierre](docs/technical/home-room-dimensions.md) · [roadmap canónico](docs/ROADMAP.md). F2 sigue experimental: cinco sesiones y veinte planos de evaluación permanecen pendientes, sin bloquear esta entrega.
