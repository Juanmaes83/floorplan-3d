# RUBIK SOTA — preparación coordinada de próximas capacidades
**Corte:** 2026-11-04 · **Base de lectura:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
**Estado:** DOCUMENTACIÓN PREPARATORIA, SIN MERGE / SIN DESPLIEGUE

## 0. Autoridad y bloqueos
- NO MERGE de PR #166 (Claude, Delivery 3D) ni #161 (legal) antes de: trabajo de Claude terminado + trabajo de Kimi terminado + revisión del propietario + OK explícito.
- No modificar ramas de terceros, no integrar cambios a `master`, no activar auto-merge ni publicar contenido de cliente.
- Revisar el SHA exacto de cada PR y cambios posteriores antes de evaluar integración; realizar QA sobre combinación real, no inferir del QA individual.
- La PR #161 solo incluye borrador jurídico, no condiciones vigentes. Exige revisión profesional y licencias de dependencias.
- Kimi: no se asume rama ni resultado sin referencia comprobable; prevenir colisiones cuando se conozca.
- F02/Visual Families: trabajo visual independiente y no bloqueante; aceptación visual no demostrada; no incluirlo en el marketing de Home V2.

## 1. Inventario fiable de puntos ya existentes
- Render IA B2 y alternativas B8: `api/render.js` recibe vista preparada y opciones cerradas; usa `/v1/images/edits` en servidor; UI `js/ai-render-ui.js` compara original/IA. Integrado en código pero sin validación real documentada de proveedor.
- Import DXF: `js/plan-intake.js::dxfToProject()`; no equiparar con exportación DXF.
- Cantidades y presupuestos C1–C4: modelo y módulos actuales; cualquier asistente debe usar autoridad existente.
- Home: `js/guide-ui.js::buildWelcome()` y `css/guided-experience.css`.
- Entregas: PR #166 agrega snapshot cliente 3D en borrador y pruebas reportadas; evitar duplicarlo.
- Documentación en `docs/product/current-status-2026-10-30.md` y `roadmap-completion-matrix-2026-10-30.md` aún describe FT3D-5/6 como futuro, pese a integraciones posteriores: reconciliar antes de marketing definitivo.

## 2. Trabajo W1 — Home actualizada
**Especificación separada:** `docs/product/home-v2-content-audit-2026-11-04.md`.
**DoD:** tres rutas intactas, beneficio comercial actual, alcance real, móvil con demo, ES/EN/ZH, accesibilidad, browser/regresión y aceptación visual.

## 3. Trabajo W2 — revisión de Entregas (NO implementar alternativa)
**Entrada:** PR #166 (rama `feat/delivery-client-3d-experience-v1`).
**Auditar:** snapshot y lista blanca; privacidad; códigos/acceso; retirada y caducidad; comportamiento offline; restauración de contexto; móvil físico; rendimiento; interacción de mapa y paseo; compatibilidad con Story actual.
**DoD:** matriz funciones actuales/PR, revisión de seguridad, pruebas móviles, plan de integración consensuado. Nada de merge ni publish antes de autorización.

## 4. Trabajo W3 — legal y comercial (NO publicar borrador)
**Entrada:** PR #161.
**Auditar:** cláusulas de uso, ingeniería inversa/extracción y sus límites legales; licencias/atribuciones de materiales, modelos, texturas, APIs y dependencias; congruencia con avisos del editor y términos de prestación real.
**DoD:** checklist de revisión jurídica y ruta de aceptación válida antes de desplegar; sin sustituir asesoramiento jurídico.

## 5. Trabajo W4 — B2/B8 validación externa real
**Código base:** `api/render.js`, `js/ai-render-ui.js`.
**Prueba:** clave OpenAI de servidor + cuota/crédito controlado, token de autorización, una misma vista 3D consentida, variaciones de estilo/suelo/pared; 3 ejecuciones comparables si presupuesto lo permite.
**Medir:** respuesta HTTP, latencia, precio cobrado verificable, tamaño salida, errores/rate limits, fidelidad a huecos y geometría (revisión humana), privacidad y leyenda "imagen orientativa".
**DoD:** informe reproducible con prompt/modelo/versión, costes reales, evidencia visual y fallbacks. No cambiar el motor ni reescribir el proveedor antes de hallar fallo comprobado. Nunca poner secretos en repositorio o chat.

## 6. Trabajo W5 — OpenAI / Codex y herramientas de dominio
**Decisión:** Codex como ayuda para implementar/probar software; asistente para usuarios sobre API servidor y funciones autorizadas de RUBIK.
**Diseño mínimo:** `parseIntent` → `planProposal` → `validateAgainstProject` → `previewDiff` → confirmación → `applyExistingEdit` → deshacer.
**Herramientas V1 permitidas:** leer estancias, consultar superficies, proponer cambio de acabado, consultar cantidades y presupuesto sin recalcular en un motor paralelo.
**Excluido V1:** modificar geometría por texto de forma irreversible, ejecutar código libre, crear proyectos sin validación, acceder a datos privados innecesarios, operar sin confirmar.
**DoD:** JSON de acciones tipado, lista blanca de ids/campos, auth, límites de costes, telemetría sin datos sensibles, prueba de inyección de instrucciones y deshacer; servidor protege claves.

## 7. Trabajo W6 — exportación DXF limitada
**Alcance inicial:** DXF ASCII 2D en mm; capas explícitas `WALLS`, `OPENINGS`, `ROOMS` y referencias `DIMENSIONS` si corresponden al modelo. Identificadores y cotas con convención documentada.
**Excluido:** DWG, DXF 3D, certificación CAD/BIM, bloques avanzados, instalaciones, garantía de compatibilidad universal.
**DoD:** archivos válidos abiertos por lector independiente, prueba de reimportación para subcasos soportados, comprobación de unidades/origen/rotación y tolerancias definidas; no afirmar round-trip completo por el mero hecho de que el importador acepte DXF.

## 8. Trabajo W7 — edición conversacional acotada
**Primera versión:** `cambiar material de esta estancia`, `mover/rotar un mueble con parámetros controlados`, `consultar presupuesto de X`, siempre con selección/IDs reales.
**Guarda:** acciones atómicas, vista previa, validación contra autoridad del proyecto, confirmación y undo. El modelo solo propone; el núcleo de RUBIK aplica.
**DoD:** pruebas de ambigüedad, ausencia de estancias, conflictos geométricos, denegación, restauración exacta de JSON y accesibilidad de confirmación.

## 9. Trabajo W8 — foto a mueble 3D: piloto aislado
**Entrada:** una imagen del objeto con permiso de uso y 1–3 medidas aportadas/confirmadas por usuario. El servicio reconstruye malla visual opcional, no sustituye dimensiones.
**Gate:** formato de importación compatible con catálogo, origen/procedencia, límites de triángulos/texturas/peso, licencia/uso comercial, caja de colisión derivada de medidas confirmadas, degradación a modelo genérico.
**DoD:** prueba con objetos simples diversos; revisión humana en varias vistas; no reclamar fidelidad métrica desde una sola foto.

## 10. Trabajo W9 — generación paramétrica de plantas
**Fase 1:** generador determinista para un contorno sencillo, programa de estancias y restricciones explícitas (superficies, accesos, adyacencias, huecos). Sin IA libre necesaria.
**Fase 2:** ranking de alternativas y lenguaje natural como interfaz al mismo solucionador.
**Guarda:** proyectos candidatos separados; revisión manual; no autopublicar; validación por el schema/geometría existente.
**DoD:** restricciones duras, razones verificables para soluciones inviables, tests de colisión/adyacencia/áreas, 1/2 plantas solo si el núcleo soporta el caso; no certificar normativa.

## 11. Secuencia / dependencias
```
RECONCILIACIÓN (master + PR Claude/Kimi + docs)
 ├─ W1 Home V2 especificación/implementación independiente
 ├─ W2 Auditoría PR166                         [NO MERGE]
 ├─ W3 Auditoría PR161                         [NO MERGE]
 ├─ W4 B2/B8 prueba externa (solo con configuración/créditos)
 └─ W5 Arquitectura IA de herramientas
       ├─ W7 Edición conversacional después de acciones seguras
       ├─ W8 Piloto foto→mueble 3D aislado
       └─ W9 Plantas paramétricas después de restricciones
 W6 DXF puede desarrollarse en paralelo sin romper importación.
```
No abrir ramas con cambios a `index.html` simultáneamente sin reconciliar interfaces con PR #166, Home y F02.

## 12. Criterios globales de aceptación
- QA unitario / navegador / móvil / accesibilidad y evidencia de antes/después.
- No repetir ni migrar a otro stack sin necesidad demostrada.
- Nunca presentar un render IA como plano exacto ni una recomendación como licencia/proyecto técnico.
- Regresión cero en importación, 2D, 3D, Story, presupuestos y B1/B3/B4.
- Validación de licencias/privacidad para activos comerciales.
- Cierre de cada corte únicamente con QA, revisión humana y autorización de integración separada.

**Este archivo no autoriza ningún merge ni despliegue.**
