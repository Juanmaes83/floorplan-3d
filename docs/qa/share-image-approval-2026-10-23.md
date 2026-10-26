# #78 «Compartir imagen» — ficha para la decisión de Juanma (23-10-2026)

**Estado: pendiente de decisión expresa («apruebo #78» o «no apruebo #78»).** #81 (imagen de entrega) depende de #78.
La aprobación de la composición horizontal D de #81 (23-10-2026) **no** aprueba #78 ni autoriza un merge.

## Qué se comparte
- **Un PNG** de la vista que se está presentando (vista general o estancia), generado en el navegador.
- Con #78 sola: la vista 3D con el sello de marca (logo, nombre comercial, título y nombre de la vista).
- Con #81: la imagen de entrega compuesta (horizontal 1600×1000 con columna lateral D, o vertical 1080×1350):
  título del proyecto, vista, número de estancias, superficie útil aproximada, «Imagen orientativa · medidas
  aproximadas», logo y nombre del estudio. **El contacto** (teléfono, correo o web de la marca) aparece **solo si se
  marca** «Mostrar mi contacto en la imagen»; por defecto no va.
- La vista previa del diálogo y el archivo son los mismos bytes.

## Qué sale del navegador y cómo
- **Nada sale sin una acción explícita** de la persona en el diálogo «Compartir imagen».
- «Compartir…»: entrega el PNG al menú de compartir del sistema operativo (`navigator.share` con el archivo). El
  sistema decide la app de destino (WhatsApp, Gmail, AirDrop…); Rubik no ve a quién se envía.
- «Descargar imagen»: guarda el PNG en el dispositivo.
- «WhatsApp» y «Correo»: abren un enlace `wa.me` o `mailto:` con **texto** (nombre, vista y «Imagen creada con Rubik
  Sota; medidas orientativas»). **No adjuntan el PNG**: la persona tiene que adjuntar la imagen descargada (el correo lo
  dice en su cuerpo).

## Teléfono que admite compartir archivos / que no lo admite
- Si el navegador admite compartir archivos (`navigator.canShare({files})`), aparece «Compartir…» como acción principal.
- Si no lo admite (la mayoría de navegadores de escritorio), «Compartir…» **no aparece**; la acción principal es
  «Descargar imagen», y WhatsApp/Correo siguen ofreciendo solo texto.
- Si el sistema falla al compartir, se avisa: «El sistema no pudo compartir la imagen. Descárgala y adjúntala.»

## Qué NO hace
- No comparte el proyecto (ni JSON ni ZIP), ni un enlace a él.
- No crea ningún enlace alojado ni página pública.
- Rubik **no sube** archivos a ningún servidor; todo ocurre en el navegador.
- No envía datos del cliente ni observaciones.

## Pruebas y límites
- Navegador (Chromium/SwiftShader, Playwright): `share-image` y `delivery-image`; resultados por SHA en el informe de
  la integración (`integration/2026-10-23-full`).
- **No probado en un teléfono físico**: el menú «Compartir…» real (Android Chrome, iPhone Safari). La emulación no
  ejecuta el menú del sistema. Protocolo: abrir la preview en el teléfono, «Presentar mi vivienda» → «Compartir
  imagen» → «Compartir…» → elegir WhatsApp o correo; comprobar que llega el PNG que se veía en la vista previa (con y
  sin contacto) y anotar modelo, sistema y navegador.
