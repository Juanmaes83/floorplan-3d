# QA de experiencia guiada — 13-10-2026

Repositorio: Juanmaes83/floorplan-3d. Base remota verificada `88aef0b`. Rama: `feat/unified-guided-experience`. Checkout nuevo y sin cambios ajenos; no se encontró AGENTS.md. La QA inicial no modificó el schema ni realizó merge o promoción manual. Después de la corrección de navegación y la aprobación humana, PR #34 quedó integrada; [cierre y evidencia](guided-experience-integration-2026-10-13.md). La PR registra la preview READY y el SHA final, comprobados después de publicar.

## Resultados locales

| Comprobación | Resultado |
| --- | --- |
| Suite Node de producto y guía | 162 aprobadas, 0 fallos, 1 omitida: requiere Blender externo no configurado |
| Motor de progreso/intenciones | 14/14; incluye solicitudes de cama, lavadora, bañera, escala, guardar, exportar y cocina ambigua |
| Recorridos nuevos de navegador | 5/5 |
| Primera visita, ejemplo, copia propia, creación, muebles, búsqueda, 3D, guardado, recarga y exportación | Comprobados en 1440×900, 390×844 y 844×390 |
| Imagen local | Rechazo conserva proyecto; importación, calibración, segunda cota, confirmación, geometría y PNG 2D correctos; cambio y recarga de proyectos conservan datos |
| Cancelación de vaciado y fallo de guardado | Vaciado cancelado conserva documento; error de almacenamiento impide acreditar guardado |
| Idioma y teclado | ES/EN/ZH, sugerencias con flechas/Enter, Escape, consultas sin coincidencia |
| Regresión dimensional anterior, escritorio | 1/1: dimensiones, vista previa, IDs, muros compartidos, deshacer/rehacer, 3D, JSON, imagen/ZIP y apertura de proyectos |
| Regresión de capturas 3D, escritorio | 1/1: PNG real de varios tamaños/proporciones; cámara, canvas y proyecto conservados |
| Schema Python | 11/11 |
| Sintaxis y whitespace | JS locales, scripts inline y `git diff --check` correctos |

No se ejecutaron completas todas las suites antiguas de navegador; se seleccionaron las regresiones dimensional y de captura relacionadas con los puntos de integración. Los cinco recorridos nuevos recorren las tres resoluciones solicitadas. No se afirma una auditoría WCAG formal ni rendimiento físico móvil.

## Incidencias resueltas durante QA

1. Solapamiento de objetivo y controles en móvil: identidad y controles ahora ocupan filas separadas.
2. Preferencia de editor completo perdida al crear un proyecto: se conserva durante la sesión y por proyecto, con recuperación explícita de la guía.
3. Las pruebas antiguas asumían entrar directamente al editor: el fixture abre el editor completo mediante acciones reales; los tests nuevos verifican la bienvenida.
4. La prueba de capturas exigía que toda la guía fuera inmutable: ahora distingue su evidencia de exportación del documento, historial, cámara y almacenamiento de proyecto, que sí deben conservarse.
5. Se corrigió la espera del entorno de prueba para el módulo Three.js y una cota de fixture fuera de la imagen. El producto rechazó la cota inválida; no se relajaron sus validaciones.
6. Se eliminó una expectativa de deshacer entre sesiones: se comprueba invalidación con una edición nueva y restauración con el historial de la sesión actual.
7. Al ampliar el buscador a los muebles existentes, las coincidencias parciales de palabras intermedias podían desviar una consulta de escala. Solo el último token incompleto se usa para sugerencias; la suite de intenciones pasa.
8. Lectura tardía de una imagen de otro proyecto: se comprueba su propietario antes de publicar la imagen en la vista.

## Evidencia

- [Log Node](artifacts/guided-experience/unit-results.txt)
- [Log navegador, cinco recorridos](artifacts/guided-experience/browser-results.txt)
- [Schema](artifacts/guided-experience/schema-results.txt)
- [Regresión dimensional](artifacts/guided-experience/legacy-room-results.txt)
- [Regresión capturas](artifacts/guided-experience/legacy-capture-results.txt)
- [Bienvenida](artifacts/guided-experience/1440x900-welcome.png)
- [Editor guiado](artifacts/guided-experience/1440x900-guided-editor.png)
- [Buscador](artifacts/guided-experience/1440x900-search.png)
- [Progreso](artifacts/guided-experience/1440x900-progress.png)
- [Editor móvil](artifacts/guided-experience/390x844-guided-editor.png)
- [Editor horizontal](artifacts/guided-experience/844x390-guided-editor.png)
- [Resultados 1440×900](artifacts/guided-experience/1440x900-results.json)
- [Resultados 390×844](artifacts/guided-experience/390x844-results.json)
- [Resultados 844×390](artifacts/guided-experience/844x390-results.json)

## Reproducción

La aplicación sigue siendo estática. Usa un servidor HTTP local y un Chromium disponible. La suite usa Playwright como herramienta de QA, sin introducir dependencias de runtime en la web.

```bash
node --test tests/guide.test.cjs tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/room-layout.test.cjs tests/furniture-search.test.cjs tests/variants.test.cjs tests/layout-review.test.cjs tests/surfaces.test.cjs tests/interop.test.cjs tests/assets.test.cjs tests/wall_assist.test.cjs tests/raw_wall_export.test.cjs
CHROME=/ruta/a/chromium node --test tests/guide.browser.test.cjs
python3 tests/schema.test.py
```

En este entorno se utilizó Playwright 1.62.1, Chrome Headless Shell 151.0.7922.34 y SwiftShader. Fue necesario ejecutar el navegador en proceso único porque los sockets Unix no están disponibles; no es una configuración exigida al producto.
