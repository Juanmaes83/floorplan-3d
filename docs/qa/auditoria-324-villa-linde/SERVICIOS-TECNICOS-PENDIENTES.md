# Servicios técnicos · frente pendiente de RUBIK

**Estado al 27/11/2026:** investigación inicial realizada. El propietario pide conservar esta línea como tarea pendiente mientras Claude Code continúa la integración. Todavía no hay encargo de implementación, comercialización ni activación de proveedor. Esta ficha vive en la rama documental de Codex y se coordina por separado de la [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324).

| Orden propuesto | Servicio o entregable | Punto de partida | Validación pendiente |
|---|---|---|---|
| 1 | Ficha de inmueble, parcela y orientación para inmobiliarias | Proveedor Catastro e importación GML existentes, informe de emplazamiento, superficies con procedencia y D3 para composición. | Trazabilidad de las fuentes, claridad entre superficie útil y catastral, alcance de plantas corregido, obtener una ficha utilizable con una inmobiliaria. |
| 2 | Comparativa de reforma de envolvente para interiorismo y reformas | P10, cantidades del proyecto, precios revisados y [EnvolventeCTE](https://github.com/pachi/envolventecte) como primer piloto. | Comparar estado actual y alternativas con datos térmicos aportados y contrastar resultados de referencia. Sin ahorro en factura ni letra hasta tener método y entradas suficientes. |
| 3 | Revisión previa de habitabilidad y expediente transferible al técnico | Geometría comprobable y reglas versionadas para una actuación y jurisdicción concretas. [Normatia](https://github.com/normatia/normatia) es candidato para consulta con fuentes. [CE3X-MCP-Server](https://github.com/jmcaamanog/CE3X-MCP-Server) se estudia como puente energético para abrir y contrastar un archivo en CE3X, en un piloto aparte. | Probar con un técnico, fijar normativa vigente, separar hechos medidos de verificaciones profesionales y validar formatos. |

CteEPBD y visorepbd son candidatos posteriores al disponer de demanda y consumos. pyBuildingEnergy se reserva para simulación horaria. Los repositorios de Catastro consultados sirven como referencias de formatos y conectores. Aprovechar el proveedor oficial ya integrado para España y evaluar Catastro GPS si se solicita alcance internacional o foral. El [caso Villa Linde](villa-linde/aceptacion/CIERRE-VILLA-LINDE.md) muestra qué datos ya se pueden extraer y dónde falta cobertura.

No se fijan precios, cupos, métricas de ahorro ni compromisos de certificación. Antes de decidir, medir el tiempo hasta la entrega utilizable y los datos que el profesional debe volver a introducir.
