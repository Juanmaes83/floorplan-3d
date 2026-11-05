# RUBIK SOTA — F03 V2: decisión humana y siguiente misión

**Fecha:** 5 de noviembre de 2026  
**Repositorio:** `Juanmaes83/floorplan-3d`  
**Rama:** `feat/visual-families-next-f03-f04-f05-v1`  
**Estado:** `TECHNICALLY_TESTED_PARTIAL_VISUAL_ACCEPTANCE` · sin merge, deploy ni activación por defecto.

## 1. Decisión aprobada por dirección

**Se aprueba visualmente el resultado del ejemplo `rough_plaster_03` de F03 V2.** Entre los tratamientos vistos en la comparativa, es el que más convence por su riqueza, microrelieve y respuesta visual; se toma como **referente preferido de calidad para la siguiente fase**.

**La aprobación más importante es de la técnica y metodología experimental, NO de extender ese mismo revoco a todas las fachadas.** Dirección corrigió expresamente la interpretación «aplicar el revoco a todo»: quiere reproducir el **proceso que ha conseguido ese resultado** sobre *otros referentes y materiales distintos*, adaptándolo a su naturaleza. Un estuco, piedra, ladrillo, madera o cerámica debe conservar su identidad propia. No copiar el aspecto rugoso o envejecido del revoco por defecto.

Alcance estricto:
- `rough_plaster_03` queda **VISUALLY_APPROVED_HUMAN para las imágenes examinadas**, no para todas las escenas, fachadas, dispositivos o producción.
- Es el **ejemplo de referencia preferido para evaluar el método**, no material global predeterminado. Solo puede aplicarse a superficies semánticamente compatibles con su preset persistido, o fixtures QA explícitos; conservar `allowExperimentalVariant:true`, OFF por defecto.
- Las ventanas **F02 V2** y el ejemplo histórico `white_stucco` **F03 V1** conservan sus aprobaciones visuales anteriores; no reabrirlos ni alterarlos sin QA y autorización.
- **F03 V2 en conjunto sigue sin estar aprobado**: las imágenes F1 muestran principalmente paños aislados y G1 muestra planta aérea; aún falta una vivienda vista desde **altura humana** con ventanas, esquinas y lectura de fachada completa.
- **Móvil NO aprobado visualmente**: la captura cenital muestra la vivienda demasiado pequeña; el acercamiento M1 recorta una pared sin contexto suficiente. El PASS de Chromium no valida la calidad de la composición, ni acredita prueba en dispositivo físico.
- **F04 y F05 siguen pendientes**. La decisión no autoriza merge, deploy, modificación de ramas de otros agentes ni activación automática.

## 2. Evidencia técnica y límites del corte recuperado

| Elemento | Situación acreditada |
|---|---|
| R0 inventario | 70 muros: 29 fachadas, 33 interiores, 8 indeterminados. Dos fixtures QA declarados; nueve muros elegibles y once mallas en las capturas |
| Código F03 V2 | `dd9c26ff47da38a2e1672121d55cf8c4ccd07f98` — recuperación WIP de Kimi, preservando la receta V1 |
| QA ejecutada localmente | 10/10 tests unitarios PASS; 1/1 test visual Chromium PASS |
| Capturas | 42 WebP, tres manifiestos e índice; publicados en `4400994c7cb85060e4a75618fbf2aa8edb63c95d` |
| Recursos | Tres texturas compartidas; 16.777.218 B GPU HERO **estimados**, frente al presupuesto V2 de 17.000.000 B. No equivale a una medida GPU del driver ni prueba multivariante |
| Revisión humana | Ejemplo de `rough_plaster_03` aprobado; V2 como sistema y móvil pendientes |
| QA aún necesaria | Regresiones dirigidas completas, lifecycle/rebuild/context loss/rendimiento V2 y control visual humano de exteriores |

**Galería:** [F03 V2 — comparativas A/B/C](evidence/f03-v2/dd9c26ff47da38a2e1672121d55cf8c4ccd07f98/README.md).  
A = F02 OFF / F03 OFF; B = F02 ON / F03 OFF; C = F02 ON / F03 V2 ON.  
Los fixtures de prueba **no son proyectos reales de cliente**.

## 3. Próxima misión operativa para Kimi Code / Codex

**META:** convertir el buen resultado experimental observado en un **método reproducible y transferible de fidelidad arquitectónica**, no en una textura universal.

### M1 — Entender el mecanismo real
Analizar las decisiones implementadas en `facade-fidelity-core.mjs`, `facade-fidelity-adapter.mjs`, manifiestos y mapas: albedo sRGB, normal OpenGL, rugosidad lineal, UV y repetición métricas, calibración cromática, fuerza normal, perfiles HERO/balanced y luz. Separar lo que es *metodología del proceso* de lo que simplemente procede de que `rough_plaster_03` tiene una textura fuente distinta. No afirmar que existe un algoritmo no implementado.

### M2 — Aplicar la metodología a OTROS referentes
Seleccionar materiales/referencias distintos y documentados, aprovechando el inventario ya presente en GitHub; comprobar licencias, canales PBR, elegibilidad semántica y disponibilidad. No presentar albedo-only como PBR completo, ni adaptar piedra/madera/ladrillo con el mismo grano de revoco. No cambiar las asignaciones reales de un usuario para maquillar renders. La prueba de `rough_plaster_03` puede extenderse a más paños **solo cuando el preset compatible esté asignado**, como control metodológico, no como diseño universal.

### M3 — Enseñar arquitectura, no solo paredes
Crear comparativas A/B/C emparejadas que muestren **fachada completa a altura humana**, al menos una carpintería F02, una esquina o encuentro existente, paños con materiales legítimamente distintos y oblicuas. Conservar cámara, proyecto, exposición, iluminación y geometría entre estados. Entregar detalle D1, plano medio y exterior general legible. Si el fixture carece de cubierta u otro elemento, declarar NOT_TESTED y no inventarlo.

### M4 — Móvil útil
Para 390×844 y 844×390 usar encuadres desde el exterior que permitan identificar una fachada real, ventana y esquina. No aceptar como validación una vista aérea diminuta o una pared recortada. Diferenciar emulación Chromium de móvil físico.

### M5 — Validar y publicar por hitos
Regresiones F02/F03, `FloorPlanProjectV1` y `renderedGeometry` intactos, recursos compartidos/reversibles, OFF por defecto; 3 ciclos ON/OFF, rebuild, fallback y pérdida de contexto cuando correspondan. Medir presupuesto de varias variantes, draw calls/triángulos, memoria estimada y p50/p95 sin confundir RAF con tiempo GPU. Publicar tests, manifiestos con SHA, capturas y enlaces para revisión humana; commit/push y comprobar HEAD remoto. No merge, no deploy, no force push.

### Orden posterior
**Primero** cerrar R1 con la transferencia de metodología, fachada completa y móvil presentable. **Después** abordar R2/F04 iluminación de presentación independiente de análisis solar y R3/F05 encuentros constructivos reales. F06–F09 siguen condicionadas por datos de proyecto. No declarar ninguna familia terminada por la cantidad de renders o los PASS de tests.

## 4. Gate y handoff

**R1 = `TECHNICALLY_TESTED_PARTIAL_VISUAL_ACCEPTANCE`, no `VISUAL_APPROVED_WHOLE_FACADE`.** Cada nuevo referente requiere su propia comparación visual y aprobación. La actualización del conocimiento para «ChatGPT Madre» se cerrará cuando las nuevas vistas se revisen, con SHA/PR, pendientes, riesgos y decisiones, sin fingir que F04/F05 están implementadas.

**Invariantes:** proteger F02 V2 y F03 V1 aprobados; `VISUAL_ONLY`; sin alterar proyecto persistido, huecos, cubierta, dimensiones o materiales; sin modificar ramas de Claude, sin merge/deploy/autoactivación.
