# SCULPT 1.2 · Mapa de parcelas

La selección espacial está en **Analizar → Contexto territorial**. Permite comparar las parcelas de un GML sin transcribir referencias. El mismo visor permite revisar una parcela cargada por referencia o ya guardada. El botón «Preparar parcela» mantiene el paso de revisión y «Guardar parcela» utiliza el contrato vigente de `site.parcel`. Las coordenadas originales, la atribución y los huecos se conservan. Solo la vista se proyecta a GeoJSON.

- [Laboratorio local](http://127.0.0.1:43991/labs/territory-map.html) con dos parcelas ficticias. En el producto de la candidata se usa el diálogo existente.
- MapLibre GL JS 5.24.0, distribución oficial BSD-3-Clause, Git `fd31bd85967c19446d836236e93021fb10ffe30d`. El fork documentado se contrastó en `df9fb2ac933febea13f117e47a6ddac142449efc`. Se eligió la distribución publicada y versionada. SHA-256 del JS `45a9b07a9189ce56054c620a947ccf41e291e58c95e9b61533b740aaa65ee5cb`.
- Proj4js 2.23.0, MIT. SHA-256 del JS `3c800c9082229fe58fef68ed458b720ec81d9e9a398e71908275aeaecd76b437`. Los avisos de ambos paquetes están en vendor.
- El mapa base se activa a petición mediante el [WMTS oficial del IGN](https://nco.ign.es/portal/sharing/portals/self). El selector abre por defecto con geometría local. Las teselas se solicitan directamente al IGN solo al activar esa capa y la atribución se muestra en la interfaz.
- El caso E2E verifica que revisar una candidata no escribe en el proyecto, que guardar conserva la geometría editable y que cerrar el diálogo elimina el lienzo y pierde el contexto WebGL.

El dossier conserva su diagrama vectorial de «Emplazamiento». La captura de la cartografía base para una lámina o un PDF requiere validar el circuito de exportación y atribución antes de incorporarla.
