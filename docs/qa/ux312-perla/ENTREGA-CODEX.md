# Entrega para Codex · integración PERLA (PR #322)

**Qué integrar:** avance directo (fast-forward) de `codex/integracion-perla-5835` @ `8378764c` hasta
`claude/vibrant-clarke-woev1u` @ `0bf3f551d8ea6a5c6f9978eaa2d684eb511a6a72` (o el HEAD de documentación que lo sigue,
sin cambios de código). Base común = `8378764c`: **sin conflictos** (`git merge-tree` limpio).

```
git fetch origin claude/vibrant-clarke-woev1u
git checkout codex/integracion-perla-5835
git merge --ff-only origin/claude/vibrant-clarke-woev1u
```

## Commits incluidos (de más antiguo a más reciente)
- `f406f8b3` UX-312 PERLA · correcciones para la CI de la PR #322 (sobre codex/integracion-perla-5835 @ 8378764c)
- `3791f364` UX-312 PERLA · CI de la PR #322: selección, avisos y menús del lienzo sin solaparse; pruebas táctiles robustas
- `92390556` UX-312 PERLA · CI de la PR #322: zoom a mano con el panel abierto, cabecera guiada del teléfono, chip de proyecto traducido
- `692e031f` UX-312 PERLA · ningún control cortado ni tapado en la cabecera y el lienzo (360, 390, 844, 1024, 1280, 1440)
- `6e6f7102` UX-312 PERLA · paseo 3D: «Vista aérea» a mano con el paseo en pausa; «Retirar tabique» estable al cambiar de idioma
- `6047ef76` UX-312 PERLA · CI de la PR #322: estado de la última entrega visible, «Mostrar ▾» por encima de la brújula; pruebas 3D al V4
- `f8dca3e5` UX-312 PERLA · teléfono: el plano se encaja en la zona libre del lienzo; barra de selección sin tapar el plano
- `3674d3ac` UX-312 PERLA · teléfono: Deshacer/Rehacer a la vista y menú de escala que no se recorta
- `441de280` Prototype SCULPT plan checks, room sun and drone flight
- `403fdcf2` Add MapLibre parcel review to the RUBIK territorial workspace
- `7b2707bf` Reflect saved parcel in the territory dialog and Analyze
- `8f6d9dcb` Link saved parcels to surroundings, directions and street view
- `b3008190` Add opt-in territorial Places, Routes and Street View lookups
- `ca234797` Integrate SCULPT plan analysis and drone capture into RUBIK
- `b7af2d99` Add attributed IGN map and optional location to the dossier
- `72746996` UX-312 PERLA · Entregar: «Última entrega…» siempre a la vista; plano del teléfono vertical con todo su alto
- `dd5ba8c2` UX-312 PERLA · editor: barra del teléfono sobre el pie, hoja de tareas inferior, selección compacta en horizontal y fila 2 con dos plantas
- `bbb1a77e` UX-312 PERLA · teléfono: Deshacer/Rehacer en la barra inferior, brújula arriba a la derecha; horizontal: Inspector termina sobre la barra
- `7a887ead` UX-312 PERLA · brújula del teléfono bajo la barra del lienzo; gov08: acción de ficha con panel abierto
- `b6c411f7` Merge commit 'b7af2d994a27e65f2356bb55bd09eb3ef131c9c8' into claude/vibrant-clarke-woev1u
- `8368cfa7` UX-312 PERLA · U9: «Volver» devuelve al origen (área, ficha y posición) y Atrás no saca de la aplicación
- `b0ffb13c` UX-312 PERLA · U9: el historial no intercepta la salida de la presentación ni entradas de la misma área (share-link, opening-contextual)
- `1270f097` UX-312 PERLA · U9: aviso «Guardado», Asistente sin solape en diálogos del móvil, sin botones duplicados a la vista
- `5d487d4c` UX-312 PERLA · U9: acceso «Asistente» de los diálogos del móvil como pie a todo el ancho (contrato E2 y sin tapar controles); aviso «Guardado» estable; pruebas pulsan la acción del panel abierto
- `f49b7957` UX-312 PERLA · U9: share-link y share-withdraw pulsan «Publicar enlace» en el panel de la ficha abierta
- `e49a881a` UX-312 PERLA · U9 cerrado: tabla de la batería de 39 suites sobre 5d487d4c y causa de cada fallo pendiente
- `801ac8e7` UX-312 PERLA · U11: botón «hecho» común (✓ y verde tras una acción con resultado real; vuelve a su forma de acción si el proyecto cambia)
- `ecbe8baa` UX-312 PERLA · U10: semáforo (rojo sin hacer · naranja empezado · verde hecho) con barra de % y recuento
- `236d7751` UX-312 PERLA · U12: mejoras extendidas al resto de páginas internas (semáforo en Analizar, botón «hecho» en Territorio, auditorías de Volver 48/48 y duplicados)
- `0bf3f551` UX-312 PERLA · U2/U3/U4: evidencias sobre el código final (editor 47/47, móvil 35/35, Entregar 35/35, Home 25/25)

Incluye la fusión de la rama de mapas `codex/sculpt-mapas-11` @ `b7af2d99` (U8).

## Pruebas de esta rama (no son la CI de la PR)
- **Batería local:** 41 suites de navegador con 3D real sobre `0bf3f551`. 38 en verde y 3 con fallos explicados: `bpdp-routes` y `tour-video` por la velocidad del contenedor, y `presentation` 27, que ya falla en `master`. Detalle: `INFORME-UX312-PERLA.md` § Regresión y `bateria-final-0bf3f551.md`.
- **Evidencias funcionales:** editor 47/47, móvil 35/35, Entregar 35/35 y Home 25/25.
- **Pruebas tuyas adaptadas**, cada una con su nota UX-312:
  - `share-link`, `share-withdraw`, `gov08-s2-focus`, `gov08-s3-expiry` y `delivery-3d-link` pulsan «Publicar enlace» en el panel de la ficha abierta.
  - `premium-shell` localiza el selector 2D/3D en la cabecera.
  - `journey-orientation`: reparada una línea propia (T2/T6).
- **No se ha relajado ninguna aserción** de tus pruebas. Sin tocar `master`.

## Lo que debe validar tu CI
La CI de la PR #322 debe ejecutarse sobre el SHA de la candidata que resulte tras el fast-forward. Mis resultados locales no
sustituyen a esa ejecución. Atención especial a `bpdp-routes` (vídeo) y `tour-video` (dron): fallan aquí solo por tiempo.
Si también fallan en la CI por tiempo, propongo ampliar sus esperas, sin cambiar ninguna aserción.

## Fuera de esta entrega
- Asesor RUBIK (laboratorio simulado) en `claude/asesor-rubik-en-vivo` @ `75291e8d`: rama aparte, no integrar en la PR.
- Places, Routes y Street View: apagados en la Preview hasta que el propietario configure `RUBIK_CONTEXT_*` y `RUBIK_SPEND_STORE_*`.
- Fusión a `master` y Production: pendientes de autorización del propietario.
