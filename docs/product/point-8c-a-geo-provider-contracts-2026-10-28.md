# Punto 8C-A — GeoProvider y contratos territoriales — candidato en revisión

**BASE:** `master@12a74c7542e07081cbec67e17cbc85309c0b7cca`. El estado canónico marca 8B cerrado (incluida la auditoría de PR #126) y 8C activo. **Alcance:** sólo infraestructura contractual de 8C-A. Punto 8 y 8C permanecen abiertos.

## Implementación

`FloorPlanGeoProvider` tiene contrato runtime 1.0.0, ocho capabilities booleanas centralizadas, modos de red explícitos, descriptor con metadata/licencia y procedencia por resultado separada. `inspectProvider` valida antes de registrar. El registry aislable ordena y filtra providers, exige ID explícito y normaliza `getCoordinates` asíncrono sin fallback silencioso. La factory por defecto registra únicamente Manual, que conserva su API anterior, trabaja offline y declara licencia `not-applicable`. No hay Catastro, IGN, CNIG, PNOA ni otro provider territorial real; tampoco hay llamadas de red.

`FloorPlanGeoSiteAdapter` convierte resultados disponibles a los campos ya admitidos por `site.location` y lee ubicaciones durables incluso si el provider ya no está registrado. `project.site` sigue siendo autoridad de proyecto y `building.site` la compartida del edificio. No se usa ubicación de planta como fallback. JSON y ZIP editables conservan `site` sin añadir archivos ni campos. **Schema unchanged**; versiones ProjectV1 y BuildingV1 sin cambios; registry, adapter, capacidades, metadata de licencia runtime y respuestas de proveedor no se persisten. La metadata general de licencia/atribución no cabe automáticamente en `site.location.source`; un futuro adapter externo que necesite esos datos durables debe resolverlo antes de activarse.

El único acoplamiento UI existente a `Geo.Manual` estaba en el guardado de orientación/ubicación. Ahora solicita explícitamente `manual` a través del registry y usa el adapter Geo→Site. Se conserva el formulario, sus mensajes, la autoridad `building.site`, la privacidad y la vista solar. Con un solo provider no aparece selector visual. La UI futura puede consultar `registry.list({capability})` sin conocer nombres territoriales concretos. Solar no cambia sus cálculos.

No hay parcela, referencia, geometría fuente ni conversión a geometría editable; tampoco ortofoto, elevación o terreno. **Provider source geometry ≠ editable project geometry.** Las futuras capacidades de la matriz todavía no tienen payload ni operación capaz de devolver `available` en 8C-A. Contrato técnico: [FloorPlanGeoProviderV1](../contracts/FloorPlanGeoProviderV1.md).

## Verificación y siguientes cortes

Los 9 tests específicos cubren contrato, inspección, registry, Manual, cancelación previa, errores sin stacks, snapshots, procedencia, adapter y roundtrip JSON/ZIP con provider ausente. Las regresiones directas Geo/Project/Building/Solar pasan 71/71; los esquemas Python, 17/17; la suite Node no-browser amplia, 537 PASS y 2 SKIP; el flujo solar en Chromium, 14/14 en escritorio y dos tamaños móviles. Se revisaron visualmente capturas de configuración y presentación solar. CI y preview quedan en la PR.

- **8C-B pendiente:** parcela, referencia y geometría fuente.
- **8C-C pendiente:** ortofoto y contexto.
- **8C-D pendiente:** elevación y terreno.
- **8C-E pendiente:** integración exterior, presentación y exportación.
