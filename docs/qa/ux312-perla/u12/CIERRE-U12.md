# U12 · Mejoras UI-UX extendidas al resto de páginas internas

Áreas cubiertas: Diseñar (editor), Analizar (+ Territorio), Presupuestar, Entregar y Mi estudio, en escritorio (1440) y
móvil (390), más todos los diálogos.

| Mejora | Alcance | Cómo se aplica | Evidencia |
|---|---|---|---|
| «Volver» al origen + Atrás del navegador (U9) | Todas las áreas y diálogos | Capa genérica `js/perla-return.js` | `auditoria-volver-resultado.jsonl`: **48/48 rutas** (Entregar, Presupuestar, Analizar, Mi estudio): diálogo → vuelve a su área; acción que sale → «← Volver a <área>»; acciones en el sitio no salen del área. Prueba `perla-return` 2/2 |
| Aviso «✓ Guardado» (U9) | Editor y cabecera de cada área | `js/perla-saved.js` | Visible en Diseñar, Analizar, Presupuestar, Entregar y Mi estudio |
| Asistente sin tapar controles en diálogos del móvil (U9) | Todos los diálogos | Pie a todo el ancho | `perla-dialog-assistant` 2/2 + E2 14/14 |
| Sin duplicados a la vista (U9) | Todas las áreas | — | `auditoria-duplicados-resultado.txt`: sin duplicados en 9 de 10 pantallas; excepción documentada: el Recorrido de obra de Presupuestar (1440), que es el camino guiado paso a paso y lo usa la prueba del usuario novato (`qa-m2-novato`) |
| Semáforo + barra % (U10) | Editor (tareas), Analizar (fichas), Presupuestar (resumen), Entregar (fichas), Recorrido de obra (pasos) | `js/perla-semaforo.js` con estados reales | Prueba `perla-semaforo` 2/2 (incluye Analizar: medidas naranja, norte y parcela rojo, fachadas verde, 25 %) |
| Botón «hecho» (U11) | Guardar proyecto JSON, descargas E3, archivo para el cliente, vistas preparadas, parcela, **ortofoto y terreno (Territorio)** | `js/perla-done.js` | `perla-done` 2/2; orthophoto 2/2, terrain 2/2, parcel 6/6 |

Regresión de U12 (12 suites relacionadas, 3D real): brand 3, language-home-navigation 7, no-chinese-display 5,
obr01-ex09-territory 3, orthophoto 2, parcel 6, perla-done 2, perla-semaforo 2, site-analyze 2, solar 5, terrain 2,
territory-integration 3 — **todas en verde**.

Mi estudio no lleva semáforo: sus fichas son configuración (perfiles, preferencias, catálogos), no tareas del proyecto.
