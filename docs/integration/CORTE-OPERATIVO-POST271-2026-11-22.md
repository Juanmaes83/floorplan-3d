# RUBIK SOTA — Corte de continuidad posterior a #271 (22/11/2026)

**Alcance:** auditoría puntual de GitHub, GitHub Actions, Vercel y evidencia publicada en el laboratorio; registro en la PR documental [#305](https://github.com/Juanmaes83/floorplan-3d/pull/305). No es un cierre de los 14 módulos, ni una nueva autorización de producto, merge, activación, datos o gasto.

## 1. Producto efectivamente integrado

| Bloque | Identidad y pruebas del mismo árbol | Situación |
| --- | --- | --- |
| [#300 Localización ES/EN/ZH](https://github.com/Juanmaes83/floorplan-3d/pull/300) | Incorporada antes de #301, dentro de la línea de master | Integrado, solo en el alcance publicado |
| [#301 Cámara](https://github.com/Juanmaes83/floorplan-3d/pull/301) | Merge `03abd3f5ee24b55cb86b22e3a7704f80d3d26b99`; árbol `3fae9820d6ce88cea409dd7508552ab4189522ed`; padres `414e53ac` y `667e2f94` | Fusionada y verificada en Production, Escape/Atrás, foco, canvas, recarga y proyecto sintético |
| [#271 RoomPlan UX](https://github.com/Juanmaes83/floorplan-3d/pull/271) | HEAD de PR `77aa4e6c2606c4bb38a2ff1219c57583ab655566`; merge `4d97879b675200840eee00afeb7250667da03da9`; árbol `489dc3757d642d7199dc005960f0cfa547f1fd97`; padres `03abd3f5` y `77aa4e6c` | Fusionada y verificada en Production dentro del recorrido aceptado |

**Estado actual de `master` consultado:** `4d97879b675200840eee00afeb7250667da03da9`. En la CI de la candidata #271 constan **92 success + 1 skipped = 93 checks**, sin fallos. En el commit de fusión de master constan **7 success + 1 skipped = 8 checks**, sin fallos. La PR registra además seis workflows funcionales posfusión superados. No sumar la omisión como PASS.

**Vercel:** el despliegue Production correspondiente al merge de #271 figura READY en [su URL de despliegue](https://floorplan-3d-jxg8ngu4d-juanma-espinosas-projects.vercel.app); esto se suma al recorrido real comunicado en la PR #271 (Chromium, escritorio 1440×900 y móvil emulado 390×844). En el recorrido: búsqueda por teclado, previsualización, unión, Deshacer, rechazo por solapamiento/cancelación sin mutación y controles de navegación/idioma. La verificación comunicada compara cinco archivos servidos con Git. No inferir dispositivo físico ni que todos los datos de usuario estén respaldados. Alpha y Demo se conservan en sus despliegues anteriores según el acta de #271.

**Consecuencia operativa:** #301 y #271 ya no están en la cola de integración; no se deben rehacer. M12 mantiene solo los residuales no cubiertos por esas pruebas (accesibilidad/hardware físico y otros contratos pendientes).

## 2. M11 HERO A+B+C y Simulator B — avance de laboratorio, NO-GO de integración

- [PR #309](https://github.com/Juanmaes83/floorplan-3d/pull/309) continúa abierta en borrador, HEAD Git **`b1b2fbd91307ba373d4997ad7db5779fd89f836d`**, con árbol Git `823cc8e0093e7fdf7eac1b9e431a51ac83752747`, basado en `4cd3884`. No confundir HEAD con árbol ni con la combinación local de Claude. CI de ese HEAD: **94 success, 4 failure, 1 skipped = 99 checks**. Gates rojos: `gov07`, `app-m2-gate-d`, `contract`, `import-and-regressions`.
- El laboratorio de Claude `Juanmaes83/rubik-sculpt-simulator-lab`, rama `claude/hero-final-candidata`, llegó al commit **`95baf4f476286e8bdaf5faa4a965885aaafd384e`**. [Expediente de corrección y evidencias](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/95baf4f476286e8bdaf5faa4a965885aaafd384e/COMPONENTES/A-construccion-procedural/final-hero/integracion-ci-309/README.md). Es laboratorio: **no se ha subido la corrección c7/c8 a #309**.
- **C-04 (barra de demo):** [rojo 0/4](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/95baf4f476286e8bdaf5faa4a965885aaafd384e/COMPONENTES/A-construccion-procedural/final-hero/integracion-ci-309/rojo-base-y-309/c04-cand.json) en la candidata antigua frente a [verde 4/4 en c7](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/95baf4f476286e8bdaf5faa4a965885aaafd384e/COMPONENTES/A-construccion-procedural/final-hero/integracion-ci-309/verde-c7/c04-c7.json): tres recorridos de escritorio (clic/teclado/clic) y uno móvil emulado. Registrados opacidad, `pointer-events`, `elementFromPoint`, orden de capas, final `hero.fin`, nueva reproducción, firma sostenida y proyectos intactos. No se ha realizado un smoke final de la PR con estas correcciones.
- **c7**, según los resultados publicados por el constructor en Chromium/SwiftShader: F2 **10/10**, GOV-07 **9/9**, HERO-A **11/11** y HERO-B **11/11**. STUDIO no solicita las cinco imágenes durante una sesión de editor; en Home se difiere la carga hasta que la banda entra en pantalla. Núcleos comunes bajo `js/`. Estos resultados son de laboratorio, no CI del HEAD de #309.
- **c7 aún incompleta:** la suite `ft3d-8-delivery` quedó en **39/41**: dos fallos de contrato, antes ocultos por el MIME `.mjs`; no están resueltos. El resultado del bloque HERO-C publicado en `cqa-c7.json` fue **4/5**, con C-02 FALLIDA; el laboratorio ajustó después su especificación, pero se requiere repetición verificable del caso, sin declarar verde la suite entera.
- **c8:** el laboratorio publicó una ampliación sobre la tarjeta final de la demo de Evolución; [el log](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/95baf4f476286e8bdaf5faa4a965885aaafd384e/COMPONENTES/A-construccion-procedural/final-hero/integracion-ci-309/verde-c8/c8-demos.log) contiene **7/7 PASS** (cuatro de Evolución y tres de Home/Dibujo vivo). El parche c8 sigue en validación, sin equivalencia de suite completa ni CI de producto demostradas.
- Se mantuvieron aisladas las correcciones de MIME en **cuatro** fixtures `ft3d-8-*`, sin refactorizar el servidor de pruebas. La futura reconciliación necesita superar CI completa y las pruebas sobre el master **posterior a #271**. El conjunto anterior `master@4cd3884 + HERO c5 + Simulator B` no equivale a c7/c8 ni a la futura integración.
- **Alcance aprobado:** HERO-C es epílogo **en vivo**, no exportación MP4 propia. Que Simulator B no incluya de serie firma y epílogo C es una ampliación separada salvo contrato posterior aprobado. No inventar esos requisitos para impedir el cierre; sí exigir las funciones realmente aprobadas, vídeos auténticos donde corresponda y su evidencia.

**Decisión:** #309 sigue **NO-GO para merge y Production**. Pendientes: decisión/reconciliación del contrato FT3D (dos fallos), repetición de C-02, c8 integral, regresiones de STUDIO/F2, pruebas de Cámara y localización sobre `master@4d97879b...`, CI del nuevo HEAD exacto, preview y aceptación visual.

## 3. M01, M07 y otros gates que permanecen abiertos

- [A0 #310](https://github.com/Juanmaes83/floorplan-3d/pull/310) HEAD `2c7e77392a6137be2d1efb5674fd774385942e85`: **99 success, 1 skipped (100 checks), sin fallos de CI general**. Aún **NO-GO de activación e integración**: completar concurrencia persistente de dos o más pestañas, `onversionchange`, época y escritores antiguos en WebKit/Firefox, escritorio/móvil, además de reconciliación con el master nuevo. No atribuir a CI verde la prueba de este gate.
- **R1 / F0.2c / F0.3:** la convivencia mínima de **siete días** solo empieza una vez A0 esté efectivamente **activo**, con evidencia, no al aprobar CI ni al fusionar. Requiere copia privada independiente, recuperación verificable y rollback antes de migrar datos. GitHub protege código, no recupera por sí solo los proyectos guardados en localStorage/IndexedDB.
- **F03 V2 (M07):** laboratorio `ba4b138063f47f4095615a367bf8668cc67356d5`, aceptación visual de laboratorio y 15/15 pruebas comunicadas. OFF por defecto. Falta presupuesto real de rendimiento escritorio→móvil, contrato de exportación/captura, integración y aceptación en producto.
- **Simulator D:** gate específico WebKit no acreditado; **Simulator F:** HOLD. M02 identidad/seguridad, M04 entregables restantes, M05 proveedores/gasto, M10 activos privados y restantes M06/M08/M09/M13/M14 mantienen los deltas de la [continuidad anterior](CONTINUIDAD-OPERATIVA-VIGENTE.md). No marcar los 14 módulos como terminados por el cierre de M12.

## 4. Cola y reglas de seguridad

1. **Codex:** reconocer #271 y #301 como cerradas; siguiente puerta M01 A0 en navegadores requeridos y reconciliación por árbol; no activar ni fusionar sin gate y autorización específica.
2. **Claude:** cerrar c8, demostrar FT3D y C-02 con pruebas reproducibles, completar comparación con `master@4d97879b`, preparar candidata #309; no modificar ramas de Codex ni Production.
3. **Propietario:** aceptar cada preview/alcance y autorizar cada merge por HEAD y árbol, de forma independiente. El cierre documental #305 también tiene autorización separada.

**Método:** estado [R] GitHub/Vercel, [CI] check-runs, [H] evidencia de constructor publicada y leída, [V] gate abierto. No confundir pruebas locales con CI o disponibilidad READY con restauración de datos.

**No se ejecutaron en esta auditoría** suites E2E, pruebas físicas, copia de datos, exportación de proyectos, simulacro de restauración, migraciones, promoción ni merge. La actualización de documentación es exclusivamente Markdown.
