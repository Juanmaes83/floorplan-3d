# SCULPT 1.3 · Entorno y accesos

## Recorrido

Analizar → Emplazamiento → Configurar emplazamiento → Entorno y accesos. La parcela debe estar guardada. Las acciones externas reutilizan su punto de referencia y funcionan sin proveedor configurado. El desplegable «Consultar servicios y rutas» requiere código y una acción explícita antes de enviar coordenadas.

- **Places Nearby Search** propone hasta ocho farmacias, comercios, centros escolares o estaciones de autobús o tren, ordenados por distancia y en un radio de 1,2 km.
- **Routes** calcula distancia y duración desde el punto de referencia hasta uno de los lugares encontrados, a pie o en coche. El punto de referencia puede diferir de la entrada real de una propiedad.
- **Street View** consulta disponibilidad exterior cerca del punto y muestra la fecha cuando Google la facilita.

## Activación y pruebas

La ruta `POST /api/places-context` requiere Vercel Preview, `RUBIK_CONTEXT_ENABLED=1`, un código propio `RUBIK_CONTEXT_TOKEN` (32–200 caracteres), `RUBIK_CONTEXT_GOOGLE_KEY`, `RUBIK_CONTEXT_DAILY_LIMIT` (1–1000 operaciones en conjunto por día UTC) y Redis mediante `RUBIK_SPEND_STORE_URL` / `RUBIK_SPEND_STORE_TOKEN`. El límite cuenta operaciones, por lo que se debe acordar el techo económico según las SKU y las cuotas de la cuenta. El código se elimina al cerrar el diálogo. La clave de Google solo se usa en servidor. La cuota conserva un contador, nunca cuerpos ni resultados. Cada respuesta se envía con `Cache-Control: no-store`.

`node --test tests/places-context.test.cjs tests/parcel.browser.test.cjs` comprueba las tres operaciones sin llamadas reales, la denegación por entorno, origen y código, el límite diario, Redis caído y el recorrido de la interfaz. Quedan por comprobar la latencia y las respuestas reales en un Preview autorizado.

## Dossier

El dossier puede seguir usando la ubicación y el plano del propio proyecto. Una ampliación viable sería ofrecer un enlace externo generado a partir de ese dato, con una elección explícita de incluir la ubicación. Los lugares, direcciones, tiempos, distancias y metadatos de Street View consultados se mantienen en pantalla. Para incorporar contenido de Google a un documento compartible es preciso acordar el uso, los términos de la cuenta y la atribución antes de activar esa salida.

- [Places y atribución](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Routes y atribución](https://developers.google.com/maps/documentation/routes/policies)
- [Street View y atribución](https://developers.google.com/maps/documentation/streetview/policies)
