# G-02 · Exportación arquitectónica en DXF

**Archivo → Exportar planta activa en DXF** descarga la planta 2D abierta, incluida la de un edificio o una variante. El DXF R2007 expresa coordenadas en milímetros, con Y ascendente. Los muros se distinguen por estado. Incluye puertas, ventanas, huecos, contornos de estancias, superficies y cotas gráficas. La leyenda conserva el estado de escala del proyecto.

## Reimportación tras editar en CAD

El archivo de RUBIK conserva los contornos completos de muros activos en la capa auxiliar apagada `RUBIK_WALL_FOOTPRINT`. El comentario DXF `RUBIK-G02-SHA256` permite comprobar la integridad del dibujo completo al abrir el archivo. Es una suma de comprobación, no una firma de procedencia.

- Con el archivo intacto, RUBIK puede reconstruir los ejes, espesores y polígonos de estancia originales, con el desplazamiento de origen habitual del importador.
- Si un editor CAD cambia el contenido o elimina el comentario, RUBIK descarta la capa auxiliar y muestra un aviso. La reconstrucción usa el importador habitual a partir de capas de muros visibles y reconocibles. Si faltan esas capas, la importación se detiene y pide revisar el DXF. Un editor CAD puede reescribir el DXF aunque el dibujo se vea igual.
- La reimportación siempre declara escala estimada. Revisa orientación, dimensiones, estancias y huecos antes de usar el proyecto reconstruido.

## Alcance del dibujo y de los datos

- **Huecos.** Los contornos exportados dejan los vanos en su posición canónica. Se representan arcos y hojas de puertas abatibles, líneas de ventanas y correderas y símbolos de pasos. Al reimportar, el reconocimiento de huecos sigue siendo heurístico. Su tipo, ancho o posición pueden variar o quedar sin detectar, incluso en un DXF íntegro. La altura, la altura de antepecho y el sentido de apertura originales no se restauran como datos de proyecto.
- **Mobiliario y escaleras.** Este corte los omite. Tampoco incluye huecos de escalera, la geometría de otras plantas ni su conexión vertical. Para conservar esos datos de RUBIK, usa el JSON del proyecto o del edificio.
- **Cotas y superficies.** Se imprimen como geometría y texto CAD. Las cotas no son asociativas y la reimportación calcula las superficies desde los polígonos que logra reconstruir.
