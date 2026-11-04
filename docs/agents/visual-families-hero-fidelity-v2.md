# RUBIK SOTA — MISIÓN DEFINITIVA PARA KIMI CODE
# VISUAL FAMILIES · HERO ARCHITECTURAL FIDELITY V2
## Escultura visual profesional, transferencia de técnicas verificadas, recetas semánticas reutilizables y desarrollo continuo con GitHub

**Proyecto:** Rubik Sota — Floor Plan 3D  
**Repositorio:** `Juanmaes83/floorplan-3d`  
**Agente responsable:** Kimi Code  
**Objetivo:** implementar una mejora arquitectónica visualmente relevante en la vivienda real de prueba y convertir los mecanismos que funcionen en recetas semánticas reutilizables.  
**Base técnica:** Visual Families F02 V1.  
**Baseline visual:** B2.  
**Modalidad:** desarrollo autónomo por incrementos, capturas reales, revisión visual, checkpoints remotos y relevo entre agentes.  
**Autorizado:** crear rama, implementar, ejecutar QA, hacer commits, push y preparar PR en borrador.  
**No autorizado:** merge, despliegue, publicación de datos privados, modificación de ramas ajenas ni declaración de aprobación visual humana.

---

# 0. INSTRUCCIONES PRIORITARIAS — LEER PRIMERO

**Esta misión no consiste en hacer otra prueba de tres ventanas, crear dos colores de marco o entregar únicamente una arquitectura de tokens.**

Tenemos un prototipo técnico de Visual Families que funciona, pero su resultado visual fue rechazado porque no produjo la calidad arquitectónica buscada.

Tu misión es corregir esa deficiencia aprovechando técnicas reales ya implementadas en nuestros proyectos.

## Las siete obligaciones principales

**1. CALIDAD VISUAL RELEVANTE**

La vivienda real de Rubik debe mejorar perceptiblemente en planos medios y de detalle. No bastan cambios cosméticos.

**2. TRANSFERENCIA REAL DE TÉCNICAS**

Aprovechar mecanismos ejecutables de VECINIA y las autoridades de Rubik, no limitarse a copiar conceptos o enumerar posibilidades.

**3. ESCULTURA VISUAL**

Aplicar el ciclo referencia → defecto → técnica → render → inspección → corrección → QA.

**4. REUTILIZACIÓN SEMÁNTICA**

La receta debe poder aplicarse a elementos compatibles mediante tokens, versiones y parámetros. Un token no es simplemente un color.

**5. RENDIMIENTO**

Una mejora que bloquea la navegación móvil o de escritorio es una regresión.

**6. GITHUB CONTINUO Y OBLIGATORIO**

**Cada incremento útil debe terminar con commit, push y verificación del HEAD remoto. No acumular varias horas de trabajo únicamente en local.**

**7. CONTINUIDAD ENTRE AGENTES**

Toda la misión, avances, decisiones, evidencias y próximo paso deben estar documentados en GitHub para que Kimi, Codex u otra IA puedan continuar sin reconstruir la conversación.

**No dediques la sesión a una auditoría general. Debes implementar y mostrar resultados visuales.**

---

# 1. QUÉ ES RUBIK Y QUÉ DEBES ENTENDER

Rubik Sota es una plataforma de creación, visualización y presentación arquitectónica a partir de planos reales.

Tiene:

- Proyecto editable.
- Geometría de estancias, muros y huecos.
- Materiales.
- Visualizador Three.js.
- Visita 3D interactiva.
- Presentación profesional.
- Capturas y vídeos.
- Entrega de documentación al cliente.

La geometría del proyecto representa las características conocidas del inmueble.

**Las mejoras visuales son representaciones derivadas. No pueden alterar silenciosamente la geometría ni los datos constructivos.**

## Autoridades existentes

| Responsabilidad | Fuente |
|---|---|
| Proyecto y datos constructivos | `FloorPlanProjectV1`, `js/project-schema.js` |
| Superficies y materiales | `js/surface-catalog.js` |
| Representación material | `js/surface-renderer.mjs` |
| Fidelidad material B2 | `js/surface-fidelity.mjs` |
| Exterior | `js/exterior-core.js`, `js/exterior-volumes.js` |
| Entorno | `js/territory-renderer.js` |
| Recursos | `js/asset-loader.mjs` |
| Visor y construcción de ventanas | `index.html`, runtime `View3D` |
| Infraestructura Visual Families | `js/visual-families-core.mjs`, `js/visual-families-adapter.mjs` |

No crear otro renderer, otro editor, otro sistema de cámaras ni otra fuente de verdad.

No modificar `FloorPlanProjectV1` para guardar una preferencia experimental.

Los elementos de representación derivados deben mantener autoridad `VISUAL_ONLY`, procedencia y versión.

---

# 2. ESTADO ACTUAL: NO REPETIR TRABAJO CERRADO

## 2.1. Fundamento visual B2

Referencia:

`894607b38fa43a5e89a9f5296a41cdbcc989d5ce`

Rama:

`feat/vq-01-material-fidelity-foundation`

Decisión humana:

`TECHNICAL_PASS / VISUAL_PARTIAL_ACCEPT_FOUNDATION / NO_MERGE_AUTHORIZATION`

B2 está aceptado como fundamento parcial, pero no constituye una certificación de realismo profesional global.

No repetir CP2, A0/B1/B2 ni sus campañas históricas.

No modificar PR #165 ni PR #164.

## 2.2. Visual Families F02 V1

Checkpoint:

`feat/visual-families-v1@de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`

Esta implementación consiguió:

- Resolver semántico.
- Receta `window-profile@1`.
- Selección por proyecto e identificadores.
- Perfiles visuales derivados.
- Acabados grafito y claro.
- Toggle OFF/ON.
- Recursos compartidos.
- Cleanup.
- Pruebas iniciales.
- Checkpoint publicado.

**Resultado visual: NO APROBADO.**

Los defectos principales fueron:

1. Perfiles demasiado elementales y visualmente pesados.
2. Vidrio prácticamente sin mejora.
3. Encuentros con fachada insuficientemente creíbles.
4. Materialidad exterior excesivamente plana.
5. Variantes limitadas sobre todo a acabados.
6. Cobertura restringida artificialmente a tres ventanas.

No repetir esa solución cambiando otras pequeñas constantes.

La infraestructura semántica es aprovechable.

La receta visual anterior no es el estándar objetivo.

## 2.3. Comparación OFF/B2

En las capturas ya revisadas, F02-OFF y B2 presentaron diferencias de píxel mínimas, sin regresión visual perceptible.

No repetir esa investigación histórica salvo que una modificación nueva introduzca una diferencia significativa.

---

# 3. GIT Y CONTINUIDAD — PRIMERA OPERACIÓN

Antes de escribir código:

1. Comprueba repositorio, remotos, ramas y worktrees.
2. Comprueba que el checkpoint V1 existe y que su HEAD corresponde al esperado.
3. Comprueba si hay avances posteriores.
4. Verifica qué cambios locales no están publicados.
5. No sobrescribas trabajo previo.

## Nueva rama

Utiliza preferentemente:

`feat/visual-families-hero-fidelity-v2`

Desde el checkpoint válido de Visual Families V1.

La dependencia histórica es:

**B2 → Visual Families V1 → Hero Fidelity V2**

No escribir directamente en las ramas anteriores.

Si la rama V2 ya existe, inspecciónala y continúa; no crees duplicados.

## Documentos canónicos obligatorios

La especificación y el avance deben residir en GitHub:

`docs/agents/visual-families-hero-fidelity-v2.md`

`docs/qa/hero-fidelity-v2/progress.md`

`docs/qa/hero-fidelity-v2/visual-acceptance.md`

`docs/qa/hero-fidelity-v2/evidence-manifest.json`

Si ya existe una versión aprobada de alguno, conservarla y actualizar únicamente lo necesario.

**Primera publicación:** guardar la misión aprobada, el estado inicial, la nueva rama y el primer checkpoint. Hacer commit, push y comprobar el SHA remoto antes de entrar en trabajo prolongado.

No necesitas redactar cuatro documentos extensos. La misión es la fuente canónica; los demás son registros breves y estructurados.

---

# 4. LECTURA MÍNIMA PARA NO MALGASTAR TOKENS

No leer todo el repositorio.

No volver a estudiar todas las PR históricas.

No reconstruir la conversación de tres horas que originó Visual Families.

## Lectura inicial obligatoria y acotada

**Rubik:**

1. `docs/qa/visual-families-v1/checkpoint.md`
2. `js/visual-families-core.mjs`
3. `js/visual-families-adapter.mjs`
4. `tests/visual-families-harness.cjs`
5. Las secciones de ventanas, materiales y lifecycle de `index.html`.

**Proceso:**

6. `docs/technical/terminal-development-loop.md`, especialmente loop, checkpoints y recuperación.
7. `docs/qa/PR-preview-checklist.md`, especialmente QA 3D y evidencias.

**Donantes:**

8. Sólo las funciones concretas de VECINIA identificadas en la siguiente sección.

Consulta `SurfaceRenderer`, `SurfaceFidelity` y los módulos exteriores cuando el mecanismo elegido lo requiera.

**No hagas una auditoría completa de todas las familias F01–F09.**

La lectura inicial debe terminar con un diagnóstico breve de los tres defectos visuales prioritarios y la técnica que vas a aplicar.

Después, comienza la implementación.

---

# 5. FUENTES REALES DE CALIDAD VISUAL

## 5.1. VECINIA-WORLDS

Snapshot:

`Juanmaes83/VECINIA-WORLDS@f4efdbea2a230d8b88911796af78bfc6ee630d4`

### Archivo A — Prototipos de calidad arquitectónica

`visual/src/skin/three-house-prototypes.js`

Funciones y mecanismos concretos:

- `canvasTexture()`
- `granularMaps()`
- `woodMap()`
- Definiciones de materiales del prototipo.
- `addWindow()`
- `addSierraQualityPrototype()`

Este código implementa:

- Texturas procedurales deterministas.
- Mapas materiales diferenciados.
- Variación de color, normal y roughness.
- Geometrías visuales de huecos.
- Planos de profundidad.
- Revelados y perfiles.
- Diferenciación entre revestimientos.
- Técnicas de materialidad PBR.

**Qué debes transferir:** los mecanismos visuales compatibles con la geometría y renderer de Rubik.

**Qué no debes trasladar:** el edificio fijo, el motor de VECINIA o los interiores aparentes que sustituyan habitaciones reales.

### Archivo B — Arquitectura residencial

`visual/src/skin/residential-dna.js`

Inspecciona:

- `RESIDENTIAL_DNA_MATERIALS`
- `addResidentialWindow()`

Aprovecha las ideas ejecutables de:

- Diferenciación de materiales.
- Profundidad de huecos.
- Composición de ventanas.
- Variación controlada.
- Calidad por distancia.
- Separación entre representación e identidad.

No copiar indiscriminadamente el constructor de la vivienda donante.

### Archivo C — Texturas compartidas

`visual/src/builders/textures.js`

Inspecciona:

`limewashTexture()`

El mecanismo genera una textura procedural compartida para variación superficial.

Su interés es evitar una fachada completamente plana con un coste controlado.

No copiar simplemente el patrón de manchas.

Estudia cómo combinar variación de albedo, rugosidad, microrelieve y escala física para mejorar el revestimiento real asignado en Rubik.

### Archivo D — Profundidad visual

`visual/src/skin/glsl-visual-depth.js`

Inspecciona:

`createFacadeDepthMaterial()`

El módulo introduce ruido, variación de grano, pátina y roughness mediante modificaciones de shader.

Evalúa dos vías:

**A.** Adaptar el mecanismo de shader dentro del renderer existente.

**B.** Reproducir el efecto mediante mapas de color, normal y roughness compatibles con `SurfaceRenderer`.

Elegir según:

- Resultado visible.
- Compatibilidad con Three.js.
- Riesgos.
- Rendimiento.
- Ownership de recursos.
- Fallback.

No descartar la técnica sólo por requerir adaptación.

Tampoco introducir un shader incompatible porque produzca una buena captura aislada.

### Archivo E — Semántica

- `visual/src/tokens/catalog.js`
- `visual/src/tokens/resolver.js`
- `visual/src/skin/skin-binding.js`

Aprovechar la herencia declarativa, las decisiones semánticas y la separación `VISUAL_ONLY`.

No importar un `WorldStore`, `Walker`, cámaras ni otro renderer.

## 5.2. WORLD COSTA BLANCA

Snapshot:

`Juanmaes83/WORLD-COSTA-BLANCA@1979efc73237fa506090d3c74b8de284af3740ce`

Documento:

`docs/32-VISUAL-SEMANTIC-META-TOKENS.md`

Utilizar la gramática:

**Intención arquitectónica → tokens → reglas de composición → receta → representación → QA.**

No dar por implementados en código todos los conceptos del documento.

Una receta puede seleccionar:

- Sección de carpintería.
- Sistema de marco y hoja.
- Materialidad.
- Geometría derivada.
- Profundidad.
- Vidrio.
- Encuentros.
- Recursos.
- Calidad por dispositivo.
- Fallback.

**Un token no puede reducirse a cambiar `#40474b` por `#dedbd2`.**

## 5.3. Regla de transferencia obligatoria

Por cada mecanismo realmente utilizado, registrar:

| Campo | Obligación |
|---|---|
| Origen | Repositorio, SHA y función |
| Propósito | Defecto visual que resuelve |
| Adaptación | Cómo se conecta a Rubik |
| Evidencia | Antes/después en la vivienda real |
| Coste | Recursos, GPU y mantenimiento |
| Procedencia | Código, dependencias y derechos |
| Resultado | Mejora, parcial o descartado |

**Leer un archivo donante no cuenta como reutilización implementada.**

La transferencia debe demostrarse en un render real.

---

# 6. OBJETIVO VISUAL: UNA MEJORA ARQUITECTÓNICA IMPORTANTE

La misión se centra en la relación:

**Fachada real + hueco + carpintería + vidrio + materiales + luz.**

No desarrollar únicamente una pieza desconectada.

## 6.1. Primer conjunto representativo

Selecciona un conjunto de ventanas reales que permita observar:

- Vista frontal.
- Vista oblicua.
- Encuentro con muro.
- Interior visible.
- Relación con el revestimiento exterior.

La primera prueba puede utilizar uno o varios huecos representativos.

**Eso es una prueba, no el límite final de cobertura.**

No programar una restricción arbitraria de tres IDs como diseño definitivo.

## 6.2. Perfiles y profundidad

Mejorar:

- Sección del marco.
- Relación entre marco y hoja.
- Juntas y junquillos.
- Retranqueos.
- Alféizares.
- Jambas.
- Encuentros con el muro.
- Oclusión y sombras de contacto.
- Continuidad de esquinas.
- Proporciones verificables.

No añadir simplemente más anillos rectangulares.

La geometría visual derivada debe responder al espacio real del hueco.

No inventar otras ventanas ni modificar medidas constructivas.

## 6.3. Vidrio

Buscar una lectura óptica creíble mediante:

- Transparencia.
- Reflejos controlados.
- Respuesta angular.
- Entorno.
- Roughness y tinte coherentes.
- Espesor aparente cuando esté justificado.
- Compatibilidad con interiores reales.
- Correcta ordenación de superficies transparentes.

Inspecciona las posibilidades actuales de `MeshPhysicalMaterial`, pero no asumas que `transmission` por sí solo garantiza calidad.

Comprobar vista exterior e interior.

**No utilizar interiores aparentes de Three-Fenestra en la vivienda protagonista.**

Three-Fenestra podrá evaluarse más adelante para edificios `VISUAL_ONLY` de contexto, con derechos y compatibilidad verificados.

## 6.4. Fachada y materiales

El sistema existente de Rubik es la autoridad material.

Conservar el revestimiento realmente asignado.

Mejorar cuando proceda:

- Albedo.
- Normal.
- Roughness.
- Escala.
- Grano.
- Variación sutil.
- Luz rasante.
- Encuentros.
- Sombra de contacto.

La textura debe respetar la identidad material.

No convertir yeso en piedra ni una piedra beige con juntas en mármol veteado ficticio.

No reabrir los cuatro tratamientos CP2 de materiales como campaña general.

## 6.5. Iluminación

Utilizar el sistema existente de Rubik.

La iluminación debe ayudar a revelar materialidad y geometría, sin falsear la comparación.

Si el HDR de pruebas falla por tipo MIME, reutiliza la configuración del harness de presentación que ya sirve `.hdr` como `application/octet-stream`.

Registrar:

- HDR solicitado.
- Estado efectivo de carga.
- Fallback.
- Exposición y preset.
- Perfil de render.

No declarar que se ha evaluado un HDR si en realidad se utilizó luz sintética de respaldo.

---

# 7. QUÉ CUENTA COMO MEJORA VISUAL RELEVANTE

**No basta con que la imagen sea diferente. Tiene que ser mejor.**

No son pruebas suficientes:

- Más polígonos.
- Más draw calls.
- Otro acabado.
- Más contraste.
- Más líneas.
- Nuevos tokens.
- Una gran diferencia de píxeles.
- Tests verdes.

## Primer gate visual

El primer conjunto tratado deberá mostrar, a escala normal:

1. Una lectura arquitectónica más convincente.
2. Mejores encuentros y profundidad.
3. Materialidad menos plana.
4. Vidrio coherente con el interior real.
5. Integración visual natural con el conjunto.

Si sólo se perciben pequeños cambios al ampliar el detalle, el resultado es insuficiente para este gate.

La mejora no tiene que resolver toda la vivienda en la primera prueba, pero **debe demostrar que el mecanismo elegido tiene capacidad real para acercarnos a la calidad objetivo**.

## Regla de propagación

**No propagar masivamente una receta visual que todavía no demuestra calidad.**

Primero probar, inspeccionar y corregir.

Después aplicar a todas las ventanas realmente compatibles del alcance aprobado, conservando exclusiones explícitas.

---

# 8. ESCULTURA VISUAL Y LOOP OBLIGATORIO

Reutiliza el protocolo existente:

`docs/technical/terminal-development-loop.md`

En particular, su método de implementar, probar, capturar, observar, corregir, publicar y recuperar progreso.

Adáptalo a esta misión.

## Ciclo de cada iteración

**1. REFERENCIA**

Fijar un encuadre y una cualidad arquitectónica que se quiere conseguir.

**2. DIAGNÓSTICO**

Identificar los 3–5 defectos principales, priorizados por impacto visual.

**3. MECANISMO**

Elegir una técnica real que pueda corregir el defecto dominante.

**4. IMPLEMENTACIÓN**

Adaptarla a las autoridades existentes de Rubik.

**5. RENDER**

Capturar el resultado real del navegador y del SHA probado.

**6. INSPECCIÓN**

Abrir las imágenes y observarlas.

No basta con guardar PNG o calcular diferencias.

**7. CRÍTICA**

Describir brevemente:

- Qué ha mejorado.
- Qué ha empeorado.
- Qué sigue siendo artificial.
- Qué mecanismo explica el defecto restante.

**8. CORRECCIÓN**

Modificar el mecanismo relevante y volver a capturar.

**9. CHECKPOINT REMOTO**

Publicar código y estado antes de seguir acumulando trabajo.

**10. GATE**

Si el resultado tiene calidad suficiente, avanzar a la siguiente etapa.

Si no, repetir con un diagnóstico nuevo.

## Regla de no convergencia

Después de tres o cuatro iteraciones sustanciales sin mejora perceptible:

- Detener microajustes.
- Revisar geometría, textura, luz, vidrio o técnica.
- Probar un mecanismo alternativo justificado.
- Registrar `VISUAL_NON_CONVERGENT` cuando corresponda.

No consumir créditos indefinidamente modificando roughness, color o normalStrength.

## Continuidad autónoma

No detenerse tras escribir un informe.

Si una tarea concreta queda bloqueada, publicar el estado y continuar con otra tarea independiente dentro del alcance.

Pero no extender una receta visual rechazada por toda la vivienda.

La revisión humana del primer candidato sigue siendo el gate para aceptar la dirección artística; mientras esté pendiente pueden avanzar pruebas y trabajos independientes.

---

# 9. HERRAMIENTAS DE QA QUE YA EXISTEN EN RUBIK

**No crear un nuevo sistema de captura si puedes reutilizar el existente.**

El repositorio contiene infraestructura aprovechable.

## Para F02

`tests/visual-families-harness.cjs`

Reutiliza:

- Fixture de proyecto.
- Entrada a presentación.
- Cámaras reproducibles.
- Captura PNG.
- Hash de imágenes.

`tests/visual-families-smoke.browser.test.cjs`

Sirve para comprobar integración y ON/OFF.

## Para navegador y presentación

`scripts/qa/presentation/harness.cjs`

Contiene un servidor de pruebas y utilidades Playwright/Chromium.

`scripts/qa/presentation/gpu-check.cjs`

Sirve para identificar GPU y distinguir render por software.

`scripts/qa/record-presentation-story.cjs`

Demuestra grabación de vídeo de la experiencia real mediante Chromium/Playwright.

`docs/qa/PR-preview-checklist.md`

Contiene criterios de interacción, viewport, evidencia y revisión humana.

## Instrucción práctica

Antes de implementar nuevas herramientas:

1. Comprueba las dependencias disponibles.
2. Comprueba la versión instalada de Node.
3. Comprueba Chromium/Chrome y Playwright.
4. Comprueba cómo se proporciona Three.js 0.160.0 en ese entorno.
5. Reutiliza las utilidades existentes.
6. Amplía únicamente lo necesario para V2.

Rubik no dispone de un `package.json` raíz en el checkpoint auditado.

No presupongas que `npm test` desde la raíz ejecuta toda la suite.

Ejemplo de prueba existente, cuando las dependencias estén preparadas:

`node --test tests/visual-families-smoke.browser.test.cjs`

Adapta el harness para V2, sin alterar los controles visuales de la aplicación en producción.

---

# 10. QA DE IMÁGENES Y VÍDEO

## Escenas de referencia

**D1 — Detalle**

Materiales, vidrio, perfiles, juntas, remates y profundidad.

**M1 — Plano medio**

Credibilidad de fachada o estancia, relación entre materiales e iluminación.

**M2 — Oblicuo**

Retranqueos, oclusión, encuentros y geometría lateral.

**M3 — Oblicuo opuesto**

Continuidad arquitectónica y defectos ocultos desde el otro ángulo.

**G1 — General**

Distribución, coherencia espacial y ausencia de alteraciones constructivas.

La vista general no es el juez principal de materialidad.

Añade una vista de fachada completa cuando sea necesaria para demostrar cobertura.

## Referencias de calidad

VECINIA, SHA fijado:

- `visual/qa/three-house-quality-proof/after-window/sierra.png`
- `visual/qa/three-house-quality-proof/after-window/oldtown.png`
- `visual/qa/three-house-quality-proof/after-window/marina.png`

Son referencias de técnicas y dirección visual, no edificios que deban copiarse.

## Comparadores obligatorios

- B2.
- F02 V1.
- Nuevo candidato V2.
- OFF de V2.

Mantener geometría, cámara, resolución, iluminación y calidad equivalentes.

Cuando se pruebe otra iluminación, crear una comparación separada y declarada.

## Vídeo

Grabar cuando la técnica tenga comportamiento dependiente del ángulo o del tiempo:

- Vidrio.
- Reflejos.
- Sombras.
- Oclusión.
- Navegación.

Comprobar que el vídeo contiene movimiento real y no una captura estática repetida.

Una secuencia de capturas no prueba por sí sola continuidad temporal.

## Inspección

El agente debe abrir e inspeccionar las imágenes antes de declarar un gate visual.

Guardar un resumen corto con los defectos observados.

**No usar una métrica de diferencia de píxeles como sustituto del juicio visual.**

---

# 11. GITHUB ACTIONS Y PUBLICACIÓN DE EVIDENCIAS

GitHub forma parte del flujo de trabajo.

**No basta con generar capturas en una carpeta local.**

## Reutilización de CI

El repositorio tiene workflows de QA con:

- Node.
- Playwright.
- Chromium.
- Three.js fijado.
- Pruebas de navegador.
- `actions/upload-artifact@v4`.

Ejemplo de referencia:

`.github/workflows/vq-01-material-cp2.yml`

Pero ese workflow pertenece a CP2 y no garantiza ejecución sobre la rama nueva.

No modificar la campaña histórica.

Preparar, cuando sea necesario, un workflow pequeño específico para V2, reutilizando la infraestructura:

- Rama o activación manual apropiada.
- Checkout del SHA probado.
- Tests pertinentes.
- Capturas.
- Métricas.
- Upload de artefactos.
- Publicación de los resultados disponibles incluso si alguna prueba falla.

No declarar CI aprobada hasta verificar que realmente se ha ejecutado.

## Evidencia ligera permanente

Publicar en GitHub una muestra visual suficiente para revisión:

- Contact sheet o comparador comprimido.
- Al menos una vista de detalle.
- Al menos una vista de plano medio.
- Manifiesto JSON.
- SHA del código y hashes.

Utilizar tamaños razonables para no saturar el historial Git.

## Evidencia completa

Preferir artefactos de GitHub Actions u otro almacenamiento autorizado para:

- PNG completos.
- Vídeos.
- Logs.
- Métricas.
- Paquetes de comparación.

Comprobar el enlace y su acceso real.

Registrar caducidad si el almacenamiento es temporal.

## Fallback si Actions no está disponible

No detener todo el proyecto porque un workflow no pueda ejecutarse.

Si está autorizado por la política del repositorio:

- Publicar una selección pequeña de imágenes comprimidas en la rama experimental.
- Publicar manifiesto y hashes.
- Mantener los archivos completos locales hasta disponer de un canal permitido.
- Declarar explícitamente lo que aún no está publicado.

**No declarar una prueba visual revisable si no existe al menos una evidencia gráfica accesible fuera de la máquina local.**

No subir secretos, proyectos privados ni paquetes masivos sin autorización.

---

# 12. PUBLICACIÓN CONTINUA DE CADA AVANCE

**ESTA ES UNA ORDEN OBLIGATORIA.**

No se permite acumular varios incrementos significativos sin publicarlos.

## Ciclo operativo

**IMPLEMENTAR → VALIDAR LO IMPRESCINDIBLE → COMMIT → PUSH → VERIFICAR REMOTO → REGISTRAR CONTINUIDAD → SEGUIR.**

## Publicar obligatoriamente

- Al preparar la rama y misión.
- Después del primer mecanismo funcional.
- Después del primer resultado visual.
- Después de una corrección importante.
- Después de integrar una receta.
- Después de ampliar cobertura.
- Después del QA.
- Antes de una prueba larga o arriesgada cuando existan cambios útiles.
- Antes de una interrupción prevista.
- Antes de terminar la sesión.

No esperar a disponer de todos los tests.

Se permiten commits `WIP` con estado claramente identificado si el código queda aislado y seguro.

No activar funcionalidades incompletas por defecto.

## Verificación remota

Después de publicar:

- `git status`
- `git rev-parse HEAD`
- `git ls-remote origin refs/heads/<rama>`

Comprueba que el HEAD remoto corresponde al commit publicado.

Si existe una diferencia, no afirmar que la subida ha sido completada.

No hacer force push.

No cambiar ramas protegidas.

## Registro mínimo

`docs/qa/hero-fidelity-v2/progress.md`

Debe indicar:

- Rama.
- Base.
- HEAD de código probado.
- HEAD remoto publicado.
- Fase.
- Mejora implementada.
- Tests ejecutados.
- Evidencias.
- Defectos abiertos.
- Próxima acción exacta.

No redactar un informe largo por cada commit.

---

# 13. CONTINUIDAD CON KIMI, CODEX Y OTRAS IA

El documento:

`docs/technical/terminal-development-loop.md`

incluye un protocolo de continuidad concebido para Codex CLI.

**Conserva sus garantías; no copies ciegamente sus comandos.**

## Para Kimi

Comprueba las funciones reales de la instalación:

- Versiones.
- CLI.
- Sesiones.
- Reanudación.
- Modo no interactivo.
- Permisos.
- Gestión de límites.
- Capacidad de continuar una tarea existente.

No inventes opciones de terminal.

Si existe reanudación automática fiable, adapta un supervisor con:

- Un solo worker.
- Un solo worktree escritor.
- Identificador persistente.
- Checkpoint.
- Espera acotada.
- Parada explícita.
- Sin procesos duplicados.
- Sin cambios de facturación ni autenticación.

**No dedicar una gran parte de la primera sesión a construir un supervisor si no es necesario para avanzar.**

Primero garantiza continuidad manual basada en GitHub; después automatiza si el entorno lo permite.

No prometer que Kimi despertará automáticamente al restablecerse una cuota sin verificar esa capacidad.

## Relevo entre agentes

Cuando otro agente retome la misión, debe:

1. Leer la especificación canónica.
2. Leer el último checkpoint.
3. Verificar el HEAD remoto.
4. Comprobar el worktree.
5. Identificar trabajo pendiente no publicado.
6. Continuar desde la siguiente tarea.
7. No repetir pruebas históricas sin motivo.
8. No escribir simultáneamente con otro agente en el mismo worktree.

**GitHub debe contener información suficiente para continuar sin esta conversación.**

---

# 14. RECETAS SEMÁNTICAS Y PROPAGACIÓN

Cuando el primer mecanismo alcance una calidad visual demostrable, formalízalo como receta.

## Contrato mínimo

- Familia.
- ID y versión.
- Tipología.
- Tokens admitidos.
- Parámetros.
- Geometría derivada.
- Materiales.
- Recursos.
- Procedencia.
- Compatibilidad.
- Calidad por dispositivo.
- Fallback.
- Estado visual.
- Estado de aprobación.

Reutiliza el resolver actual.

No crear un framework nuevo de nueve familias.

## Primero una receta de calidad

No desarrollar dos soluciones mediocres para cumplir artificialmente el requisito de variantes.

**Primero una receta convincente.**

Después demostrar variación arquitectónica significativa:

- Otra sección.
- Otra relación marco/hoja.
- Otra composición compatible.
- Otra respuesta material.
- Otro sistema de encuentros.

No basta con variar grafito y blanco.

## Cobertura

Después de validar la receta:

- Identificar todas las ventanas reales.
- Clasificarlas.
- Determinar compatibilidad.
- Aplicar a las compatibles.
- Excluir las no compatibles con motivo.
- Verificar diferentes fachadas y plantas.

Utilizar la clasificación exterior real de Rubik.

No introducir ventanas ni características constructivas inexistentes.

## Familias futuras

La arquitectura debe poder evolucionar hacia:

- F01 Materiales.
- F02 Carpinterías.
- F03 Fachadas y cubiertas.
- F04 Iluminación.
- F05 Detalles constructivos.
- F06 Paisajismo.
- F07 Agua.
- F08 Vida ambiental.
- F09 Arquetipos.

**No implementar F01–F09 completas en esta misión.**

La misión actual es un conjunto acotado de alta fidelidad relacionado con F02 y los tratamientos complementarios estrictamente necesarios.

---

# 15. RENDIMIENTO, LIFECYCLE Y NO REGRESIÓN

La calidad debe funcionar en móvil y escritorio.

## Modos

- Edición 3D.
- Presentación.
- Recorrido.
- Captura.
- Futuro visor del cliente.

No implementar el visor del cliente. Pertenece a Claude Code.

## Medición

Comparar baseline y candidato:

- Tiempo de carga.
- Intervalo de frame p50/p95.
- Tiempo GPU cuando pueda medirse adecuadamente.
- Draw calls.
- Triángulos.
- Texturas.
- Memoria estimada.
- Recursos compartidos.
- Rebuild.
- Cambio de perfil.
- ON/OFF.
- Entrada/salida.
- Cleanup.
- Manejo de pérdida de contexto.

**No confundir intervalo de `requestAnimationFrame` con duración del trabajo GPU.**

No certificar móvil físico con una simulación de viewport.

## Calidad adaptativa

Utiliza perfiles de calidad apropiados para:

- HERO.
- Distancia de cámara.
- Móvil.
- Escritorio.
- Captura.

Conserva un fallback seguro.

El presupuesto F02 V1 de tres ventanas, seis draw calls y cero texturas **no es una restricción para V2**.

Define el nuevo presupuesto a partir de una mejora visible y del coste medido.

No sacrificar toda la calidad para mantener un presupuesto arbitrariamente pequeño.

Tampoco aceptar efectos que vuelvan inutilizable la navegación.

## Invariantes

Preservar:

- Proyecto canónico.
- Muros y huecos.
- Medidas.
- Cámaras.
- Recorridos.
- Colisiones.
- Presentación.
- Capturas.
- Persistencia.
- Materiales declarados.
- Recursos compartidos.

El estado OFF debe recuperar la representación base sin residuos de la receta nueva.

Probar que las texturas y materiales compartidos no se liberan mientras sigan en uso.

---

# 16. CLAUDE CODE Y LÍMITES ENTRE AGENTES

Claude Code está desarrollando otra misión:

**DELIVERY 3D CLIENT EXPERIENCE V1**

Su responsabilidad:

- Panel «Entregar».
- Experiencia de cliente.
- Visita 3D.
- Dossier.
- Publicación.
- Seguridad.
- UI-UX comercial.

La responsabilidad de Kimi:

- Visual Families.
- Calidad arquitectónica.
- Recetas.
- Materiales.
- Carpinterías.
- Fachada.
- QA visual.
- Rendimiento del mecanismo.

No modificar la rama de Claude.

No integrar automáticamente F02 experimental en la experiencia del cliente.

No modificar sus APIs de presentación o publicación.

## Archivo compartido

`index.html` puede estar afectado por ambas líneas.

Preferir módulos independientes y hooks mínimos.

Si aparece un conflicto real:

- Identificar la función o bloque.
- Documentar el cambio necesario.
- Mantener separado el desarrollo.
- Continuar con trabajo independiente.
- Solicitar una decisión sólo cuando la operación conflictiva no pueda resolverse de forma segura.

## Contrato futuro

Documentar cómo podrá consumir el visor de cliente una receta aprobada:

- ID y versión.
- Datos necesarios.
- Recursos.
- Perfil de calidad.
- Estado de aprobación.
- Fallback.
- Cleanup.

**No exigir a Claude que consuma ahora una rama experimental.**

---

# 17. ROADMAP EJECUTABLE Y CHECKPOINTS

## R0 — Incorporación y continuidad

Objetivo:

- Recuperar estado.
- Crear rama independiente.
- Publicar la misión.
- Establecer checkpoint remoto.
- Preparar QA existente.

**Salida:** GitHub recuperable y siguiente tarea clara.

No dedicar una sesión completa a descubrimiento general.

## R1 — Primera escultura visual relevante

Objetivo:

- Analizar el defecto dominante.
- Seleccionar técnica donante concreta.
- Implementar sobre un conjunto representativo.
- Capturar antes/después.
- Inspeccionar las imágenes.
- Corregir el defecto principal.

**Gate:** evidencia de mejora perceptible en plano medio y detalle.

**Publicar checkpoint.**

Si no mejora suficientemente, revisar el mecanismo; no pasar a propagación.

## R2 — Tratamiento arquitectónico coherente

Objetivo:

Completar los elementos necesarios del conjunto:

- Carpintería.
- Encuentros.
- Vidrio.
- Materialidad de fachada.
- Respuesta visual a la luz.

No implementar todas las técnicas indiscriminadamente; elegir las que explican el defecto.

**Gate:** conjunto arquitectónico convincente, no sólo una pieza decorada.

**Publicar checkpoint.**

## R3 — Receta semántica de calidad

Objetivo:

Formalizar el mecanismo probado.

- Versión.
- Tokens.
- Parámetros.
- Compatibilidad.
- Recursos.
- Fallback.

Después, demostrar una segunda variante arquitectónica mediante mecanismos compartidos.

**Publicar checkpoint.**

## R4 — Cobertura real

Objetivo:

Aplicar a todos los elementos compatibles del alcance aprobado.

Registrar:

- Existentes.
- Compatibles.
- Tratados.
- Excluidos.
- Razones.

Verificar fachadas y niveles.

**Publicar checkpoint.**

## R5 — QA completo del candidato

Objetivo:

- Imágenes y vídeo.
- Regresiones.
- Rendimiento.
- Calidad adaptativa.
- Lifecycle.
- Geometría intacta.
- Fallback.

**Publicar checkpoint y evidencias.**

## R6 — Handoff

Objetivo:

Dejar:

- Código.
- PR draft.
- SHAs.
- Informe compacto.
- Capturas descargables.
- Vídeo cuando corresponda.
- Riesgos.
- Gates humanos.
- Próxima tarea.

**Último push verificado. No merge.**

---

# 18. REGLAS DE EFICIENCIA EN TOKENS Y CRÉDITOS

1. No repetir auditorías CP2.
2. No leer toda la documentación del producto.
3. No reconstruir los módulos V1 ya funcionales.
4. No crear otro renderer.
5. No generar informes extensos por cada prueba.
6. No ejecutar todas las suites después de cada pequeño ajuste.
7. No crear diez variantes antes de validar una.
8. No copiar una vivienda completa de VECINIA.
9. No reescribir el resolver si puede ampliarse.
10. No desarrollar un nuevo sistema de captura.
11. No acumular código sin publicar.
12. No gastar cuatro iteraciones cambiando sólo parámetros sin diagnóstico.
13. Reutilizar los fixtures y encuadres existentes.
14. Reutilizar los recursos y técnicas disponibles de Rubik y VECINIA.
15. Reservar las pruebas completas para el cierre de incrementos sustanciales.
16. Identificar bloqueos pronto y continuar con tareas independientes.
17. Publicar estados y pruebas antes de agotar contexto o créditos.
18. No comenzar otra familia hasta cerrar o diagnosticar honestamente el objetivo actual.

**La eficiencia se mide por mejoras visuales comprobables, reutilización y ausencia de trabajo perdido, no por número de archivos, commits o tokens gastados.**

---

# 19. ESTADOS Y CRITERIOS DE ACEPTACIÓN

Mantén estados independientes.

## Código

`WIP / IMPLEMENTED / TECHNICAL_PASS / TECHNICAL_PARTIAL / TECHNICAL_FAIL`

## Calidad visual

`VISUAL_NON_PASS / VISUAL_NON_CONVERGENT / VISUAL_PENDING_HUMAN / VISUAL_PASS_HUMAN`

No declarar `VISUAL_PASS_HUMAN` sin nuestra aceptación explícita.

## Evidencia

`LOCAL_ONLY / PUBLISHED / REMOTE_VERIFIED`

Una ruta local no es una evidencia remota.

## Rendimiento

`UNMEASURED / MEASURED_PARTIAL / REGRESSION / ACCEPTABLE_PENDING_HUMAN`

## Git

`LOCAL_ONLY / REMOTE_CHECKPOINT_VERIFIED / DRAFT_UNMERGED`

## Integración

`MERGE_NOT_AUTHORIZED / MERGE_AUTHORIZED / MERGED`

No declarar merge autorizado por tener CI verde.

---

# 20. INFORME FINAL BREVE Y TRANSFERIBLE

El informe debe permitir continuar a cualquier IA sin consultar esta conversación.

### A. Estado

- Rama.
- Base.
- HEAD local.
- HEAD remoto verificado.
- PR draft y dependencia.
- Estado del worktree.

### B. Trabajo implementado

- Qué mecanismos funcionan.
- Qué técnicas donantes se adaptaron.
- Qué queda incompleto.
- Qué se descartó y por qué.

### C. Calidad visual

- Defectos iniciales.
- Mejoras conseguidas.
- Defectos restantes.
- Comparaciones publicadas.
- Resultado de la revisión.

### D. Cobertura

- Ventanas y fachadas.
- Compatibles.
- Tratadas.
- Excluidas.

### E. Rendimiento y pruebas

- Comandos ejecutados.
- Resultados.
- GPU y navegador.
- Datos móviles.
- Regresiones.
- Lifecycle.

### F. Evidencia

- Enlaces descargables verificados.
- SHA del código.
- Manifiestos.
- Hashes.
- Vídeo si corresponde.

### G. Continuidad

- Próxima tarea exacta.
- Dependencias.
- Bloqueos.
- Decisiones humanas pendientes.

No presentar como finalizado un objetivo que sólo esté parcialmente implementado.

---

# 21. AUTORIZACIONES Y PROHIBICIONES

## AUTORIZADO

- Crear rama/worktree independiente.
- Leer fuentes y checkpoints necesarios.
- Implementar técnicas compatibles.
- Crear recetas.
- Ejecutar pruebas.
- Capturar imágenes y vídeos.
- Iterar con el loop de escultura.
- Crear commits.
- Hacer push.
- Publicar evidencias permitidas.
- Preparar PR draft.
- Documentar continuidad.

## PROHIBIDO SIN AUTORIZACIÓN EXPRESA

- Merge.
- Despliegue.
- Modificación de `master`.
- Modificación de PR #165 o CP2.
- Reactivar Hybrid.
- Escribir en la rama de Claude.
- Cambiar el proyecto constructivo.
- Alterar medidas o huecos.
- Publicar datos privados.
- Introducir assets sin derechos verificados.
- Declarar aprobación visual humana.
- Propagar globalmente recetas rechazadas.
- Modificar credenciales, facturación o políticas del repositorio.
- Ejecutar automatismos que dupliquen agentes escritores.

---

# 22. ORDEN FINAL DE EJECUCIÓN

**KIMI CODE: COMIENZA POR RECUPERAR EL CHECKPOINT F02 V1 Y PUBLICAR LA MISIÓN EN TU NUEVA RAMA.**

Después:

**NO INICIES OTRA AUDITORÍA GENERAL.**

Inspecciona las funciones donantes identificadas.

Determina qué mecanismos pueden corregir los defectos visuales observados.

Implementa un primer tratamiento arquitectónico coherente sobre la vivienda real Rubik.

Ejecuta Chromium/Playwright.

Captura las imágenes.

Ábrelas e inspecciónalas.

Corrige los defectos dominantes.

**Publica el avance en GitHub.**

Repite el loop hasta conseguir una mejora visual relevante o demostrar por qué el mecanismo no converge.

Sólo después convierte la mejora en una receta reutilizable y amplía su cobertura.

**OBJETIVO INNEGOCIABLE:**

Una vivienda Rubik visualmente más creíble y profesional, con mejores carpinterías, vidrio, encuentros y materialidad arquitectónica; generada mediante técnicas reales adaptadas, recetas semánticas versionadas y rendimiento controlado.

**NO CONFUNDIR INFRAESTRUCTURA CON CALIDAD.**

**NO CONFUNDIR VARIANTES DE COLOR CON SISTEMAS ARQUITECTÓNICOS.**

**NO CONFUNDIR UN RENDER GENERADO CON UNO REVISADO.**

**NO CONFUNDIR UN COMMIT LOCAL CON UN CHECKPOINT PUBLICADO.**

**NO CONFUNDIR CI VERDE CON APROBACIÓN VISUAL HUMANA.**

**CADA AVANCE SIGNIFICATIVO DEBE QUEDAR RECUPERABLE EN GITHUB.**

**NO MERGE. NO DEPLOY.**

**EMPIEZA A IMPLEMENTAR.**
