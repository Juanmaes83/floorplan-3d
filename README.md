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
- Exportar e importar distribuciones en JSON.
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

F1a está integrada desde la PR #4. Esta entrega completa proyectos, español/marca,
uso móvil y el aviso sin WebGL. Imagen, calibración y trazado siguen pendientes en F1b.
Véase [documentación de esta entrega](docs/technical/F1-local-projects-mobile.md).
