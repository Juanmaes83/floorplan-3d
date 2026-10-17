# R8 M17 — piloto de detalle genérico, diferido

SHA de código: `ab2f89a`. Se ensayaron cuatro muebles del ejemplo, de los tipos genéricos `vanity` y `coffeetable`. Cada uno recibe cuatro marcas de superficie cuya posición y longitud derivan del ID estable del objeto. La opción `View3D.setProceduralDetails(true)` permite repetir el piloto; queda **desactivada por defecto**. El JSON `FloorPlanProjectV1`, IDs, dimensiones, catálogo y envolvente no cambian.

En Chromium/SwiftShader 1440×900, sin agrupación de primitivas para aislar el coste: de **1729 a 1745 llamadas de dibujo**, **199934 a 200126 triángulos** y **1298 a 1314 geometrías**. Ocho texturas en ambos casos. Al desactivar se recuperan las cifras base; al volver a activar, las posiciones derivadas de los IDs son idénticas. La selección por clic, el documento y la reimportación de sus 46 objetos pasaron la prueba. También pasó la regresión M16 en el mismo código: 2/2 pruebas.

Se abrieron las cuatro capturas de baño y salón con el detalle activado y desactivado. Con umbral de diferencia máxima RGB >20, el baño tuvo **0 píxeles cambiados** y el salón **11** de 1.296.000; la aportación visual no justifica las 16 llamadas adicionales en esta vista. Por eso se difiere la activación de M17. `detail-pilot.json` contiene las cifras, IDs y posiciones; los PNG muestran las comparaciones de cámara y escena.
