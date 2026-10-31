# FT3D-4 — Contrato de alzado / fachada narrativa

**Fecha:** 31-10-2026  
**Estado:** contrato canónico para implementación.  
**Programa:** Flat-to-3D / Presentation Story.  
**Base funcional anterior:** FT3D-3 integrado y validado.  
**Regla permanente:** Todo lo nuevo se suma. Nada de lo existente se elimina sin decisión expresa de Juanma.

---

## 1. Objetivo exacto de producto

FT3D-4 debe permitir que un profesional presente una fachada del proyecto como una lectura arquitectónica clara y narrativa del mismo modelo:

```text
vista general existente
→ alineación frontal con la fachada
→ fachada visual legible
→ profundidad / materiales / iluminación
→ perspectiva exterior
→ vuelta exacta a la vista general
→ continuación normal de Presentation Story
```

El resultado debe ayudar a un cliente a entender la relación entre alzado, orientación, materiales, huecos, volumen y exterior sin exigir navegación libre 3D.

FT3D-4 NO crea un alzado técnico normativo ni un plano de ejecución. La presentación debe usar lenguaje honesto: **«Fachada visual · derivada del modelo · no es alzado de ejecución»**.

Principio Rubik: **más contexto, no más falsa certeza**.

---

## 2. Alcance aprobado

Incluye:

- derivación determinista de fachadas candidatas a partir del modelo actual;
- selector runtime de fachada en la configuración de Presentación;
- una nueva narrativa reutilizable en el Story engine existente;
- cámara frontal tipo alzado usando la misma PerspectiveCamera con FOV estrecho;
- apertura gradual hacia perspectiva exterior;
- materiales reales existentes;
- orientación cardinal sólo cuando `site.northOffsetDeg` existe;
- Solar como enhancement opcional, nunca requisito;
- contexto exterior existente como enhancement opcional, nunca requisito;
- soporte del edificio actual de hasta dos plantas, sin exploded;
- mobile, reduced motion, minimapa, cancelación y restauración completa;
- pruebas unitarias, browser, evidencia visual y vídeo.

No incluye:

- editor de alzados;
- persistencia de configuración FT3D-4;
- schema nuevo o modificación de `FloorPlanProjectV1`;
- declarar una «fachada principal»;
- entrada principal inventada;
- rayado técnico o dibujo CAD nuevo;
- certificación solar, energética o normativa;
- nuevas cubiertas inclinadas 8B-C;
- exploded/axon FT3D-5;
- plantillas FT3D-6;
- outputs/share FT3D-7;
- timeline FT3D-8;
- arreglar deuda baseline no causada por FT3D-4.

---

## 3. Autoridades que deben reutilizarse

FT3D-4 no puede duplicar autoridades existentes.

### 3.1 Fachadas

`FloorPlanExterior.derive(project)` es la autoridad para decidir qué muros son `facade`, `interior` o `unavailable` y qué huecos pertenecen a fachadas.

FT3D-4 puede derivar orientación exterior de los muros ya clasificados como fachada, pero NO puede crear un segundo clasificador independiente que contradiga `FloorPlanExterior`.

### 3.2 Story

Debe reutilizar:

- `js/presentation-story-core.js`;
- `sequence()` / progreso global;
- el player actual;
- `View3D.presentationStoryBegin` / apply / end;
- controles actual/anterior/siguiente/play/pause/scrub;
- lifecycle y restauración de Presentation.

No se admite un segundo reproductor, timeline paralela ni segundo renderer/canvas.

### 3.3 Orientación

`site.northOffsetDeg`, cuando existe, es la única autoridad para convertir una dirección del proyecto en orientación cardinal.

Ausencia de norte NO significa que la fachada no exista.

### 3.4 Solar

Debe reutilizar exclusivamente:

- `FloorPlanSolar.position()`;
- `FloorPlanSolarRenderer` / `View3D.setSolar()`;
- el estado runtime ya existente de Solar.

No se admite otro cálculo solar.

### 3.5 Contexto

Debe reutilizar el contexto territorial/exterior existente y sus grupos/renderers. No debe descargar, sintetizar ni inventar contexto sólo para la narrativa.

---

## 4. Nuevo core puro recomendado

Crear preferiblemente:

`js/presentation-elevation-core.js`

Debe ser puro: sin DOM, sin Three.js, sin red, sin localStorage y sin mutar proyecto.

API conceptual mínima:

```js
derive({ levels, northOffsetDeg? }) => {
  supported,
  reason,
  candidates,
  defaultId,
  partial
}
```

Cada `level` debe contener únicamente los datos necesarios: proyecto, geometría y offset del edificio ya existente.

Cada candidato debe exponer al menos:

```js
{
  id,                 // estable: facade-A, facade-B...
  wallRefs,           // levelId + wallId
  openingRefs,
  normalPlan,         // normal exterior unitaria en coordenadas de planta
  tangentPlan,
  anglePlanDeg,
  cardinal?,          // sólo con northOffsetDeg
  label,              // Fachada A / Fachada A · sur...
  centerMm,
  widthMm,
  heightMm,
  totalFacadeLengthMm,
  openingCount
}
```

No persistir este descriptor.

---

## 5. Derivación determinista de fachadas

### 5.1 Muros válidos

Usar sólo muros que la autoridad `FloorPlanExterior.derive()` marque como `facade`.

Muros demolidos ya deben quedar fuera por esa autoridad. No reintroducirlos.

### 5.2 Normal exterior

Para cada muro fachada, determinar cuál de sus dos normales apunta al exterior usando las estancias interiores existentes:

- muestrear 20 %, 50 % y 80 % del muro;
- offset = `thicknessMm / 2 + 50 mm`;
- comprobar ocupación interior a ambos lados;
- la normal válida es la que apunta al lado consistentemente no ocupado;
- si el lado exterior no puede demostrarse de forma coherente, ese muro sigue siendo fachada según la autoridad, pero queda `orientation-unavailable` para agrupación FT3D-4.

No usar la cámara del usuario para decidir el exterior.

### 5.3 Agrupación

Agrupar las normales exteriores demostrables en 8 sectores estables de 45° en coordenadas del proyecto, con centros cada 45° y tolerancia implícita ±22,5°.

Los candidatos se ordenan por ángulo del proyecto, empezando en plan-up y en sentido horario. Asignar IDs estables `facade-A`, `facade-B`, etc. según ese orden.

Un edificio irregular puede producir más de cuatro candidatos. No forzar N/S/E/O.

### 5.4 Candidato por defecto

El candidato por defecto NO se denomina «fachada principal».

Elegir:

1. mayor `totalFacadeLengthMm` sumada en todos los niveles;
2. si empata, mayor `openingCount`;
3. si empata, menor orden angular/ID estable.

La UI puede decir «selección automática» o «fachada predeterminada», nunca «principal».

### 5.5 Orientación cardinal

Si existe `northOffsetDeg`, convertir el ángulo de la normal del proyecto a azimut real:

```text
azimutReal = wrap(anglePlanDeg - northOffsetDeg)
```

Usar 8 nombres cardinales: norte, noreste, este, sureste, sur, suroeste, oeste, noroeste.

Mantener siempre el ID neutral. Ejemplo: `Fachada B · sureste`.

Sin norte: `Fachada A`, `Fachada B`... sin inventar cardinalidad.

### 5.6 Unsupported y partial

La narrativa es unsupported sólo si no existe ningún candidato útil con normal exterior demostrable y extensión suficiente.

Motivos concretos esperados, no un genérico:

- `no-facade-walls`;
- `no-oriented-facade-walls`;
- `degenerate-facade`;
- `invalid-geometry`.

La ausencia de norte, ubicación, Solar, terreno, parcela u ortofoto NO hace unsupported la fachada.

Si existen candidatos válidos pero algunos muros fachada no tienen orientación demostrable, devolver `partial: true` y continuar honestamente.

---

## 6. Multipiso

El edificio actual soporta hasta dos plantas. FT3D-4 debe aprovecharlo sin entrar en FT3D-5.

Reglas:

- derivar candidatos en el frame común del edificio;
- sumar muros equivalentes de todas las plantas en el mismo sector;
- respetar offsets horizontales y verticales actuales;
- mostrar el edificio completo en la escena de fachada;
- NO separar plantas;
- NO desplazar plantas artificialmente;
- NO crear exploded/axon;
- NO cambiar el nivel activo del editor como dato persistente;
- si el renderer necesita `levelView='all'` durante la escena, debe ser runtime y restaurarse exactamente al salir.

La fachada narrativa aparece **una sola vez por Story completo**, no una vez por planta.

---

## 7. Inserción exacta en Presentation Story

Añadir una nueva narrativa a `NARRATIVES` y `SCENE_MS`, nombre recomendado:

`elevation-open`

No crear otro player.

### 7.1 fullStory()

Para el primer overview compatible de la presentación:

```text
plan-reveal
→ section-open, si FT3D-3 está activado y soportado
→ elevation-open, si FT3D-4 está activado y soportado
→ room-descent
```

Para plantas posteriores del mismo edificio NO repetir `elevation-open`.

Si FT3D-3 está apagado:

```text
plan-reveal → elevation-open → room-descent
```

Si FT3D-4 está apagado, la secuencia existente debe ser idéntica a `master` base.

---

## 8. Narrativa temporal y cámara

La escena debe ser determinista y reversible. Mismo descriptor + misma configuración runtime + mismo `p` = mismo estado.

No acumular deltas por frame.

### 8.1 Checkpoints obligatorios

- `p = 0.00`: pose exacta del overview existente. Sin alteración visible FT3D-4.
- `0.00 → ~0.28`: desplazamiento continuo hacia cámara frontal perpendicular a la fachada; reducir FOV progresivamente.
- `~0.28 → ~0.42`: **hold frontal**. Fachada legible, verticales verticales, FOV estrecho, mismo modelo/materiales.
- `~0.42 → ~0.58`: mantener encuadre; activar de forma progresiva sólo enhancements runtime elegidos (por ejemplo Solar snapshot) sin cambiar geometría.
- `~0.58 → ~0.82`: abrir perspectiva mediante dolly/FOV y dirección oblicua determinista; revelar profundidad y, si ya está disponible, contexto exterior.
- `~0.82 → ~0.90`: hold de perspectiva exterior.
- `~0.90 → 1.00`: volver de forma continua a la pose exacta de overview.
- `p = 1.00`: pose de overview bit-for-bit/tolerancia numérica equivalente a la pose que usará `room-descent`.

La escena termina con `presentationStoryEnd({keepPose:true})` o mecanismo equivalente que conserve la cámara final y retire sólo estado temporal de la fachada antes del `room-descent`.

### 8.2 Cámara frontal

Usar la PerspectiveCamera existente. No crear OrthographicCamera ni segundo renderer.

- dirección de mirada perpendicular a la normal de fachada;
- eje Y mundial vertical;
- target = centro del volumen arquitectónico demostrable del candidato;
- FOV frontal recomendado como constante estrecha dentro de 2°–8°; elegir un valor estable (recomendado 4°) y calcular la distancia necesaria para encajar el volumen;
- framing debe respetar `viewRegion()`/región libre de la tarjeta;
- margen visual estable;
- muebles/GLB ajenos a la envolvente arquitectónica NO deben decidir el tamaño del encuadre frontal.

### 8.3 Perspectiva oblicua

Derivar la dirección oblicua del propio candidato, nunca de la última órbita del usuario.

Usar una dirección estable basada en normal exterior + tangente canónica + pequeña elevación. Patrón recomendado:

```text
normalize(outward * 1.0 + tangentClockwise * 0.35 + up * 0.18)
```

Puede ajustarse sólo si el framing real exige una corrección técnica demostrable, manteniendo determinismo y tests.

### 8.4 Sin falsa ortografía técnica

El aspecto tipo alzado proviene de frontalidad + FOV largo. No crear líneas CAD, cotas, rayado, espesores inventados ni una segunda malla «de dibujo».

---

## 9. Materiales, cubierta y objetos

- mantener materiales reales existentes;
- huecos reales de puertas/ventanas deben mantenerse;
- mobiliario/GLB puede seguir visible según Presentation actual, pero no debe gobernar el framing frontal;
- cubierta/parapeto existente puede mostrarse según estado normal de Presentation;
- no reabrir 8B-C cubiertas inclinadas;
- no inventar espesores ni detalles de fachada ausentes.

---

## 10. Solar como enhancement opcional

Solar NO es requisito para FT3D-4.

### 10.1 UI

Dentro de la opción de fachada, ofrecer opcionalmente:

`☐ Usar solar orientativo actual`

OFF por defecto.

Sólo habilitado si el estado Solar runtime puede producir un resultado `available-orientative`.

Si la UI Solar actual no expone fecha/hora runtime de forma segura, se permite añadir un getter **read-only runtime** para snapshot; no persistencia ni schema.

### 10.2 Snapshot

Al iniciar la presentación, si Solar está activado para la fachada:

- capturar una sola vez `{result, localDate, localTime}` o equivalente;
- no recalcular Solar por frame;
- la escena debe ser determinista respecto a ese snapshot;
- mostrar caption con fecha/hora cuando esté disponible;
- usar exclusivamente `View3D.setSolar()` / `FloorPlanSolarRenderer`.

### 10.3 Honestidad

Texto obligatorio cuando se usa:

`Solar orientativo · no es estudio de soleamiento, certificación ni verificación normativa.`

Si Solar deja de estar disponible antes de iniciar, desactivar el enhancement y continuar con iluminación de presentación; no bloquear la fachada.

### 10.4 Restauración

Al terminar/cancelar, restaurar exactamente la iluminación previa de Presentation/Solar. Cero residuos de intensidad, background, lamps, exposure o envMap.

---

## 11. Contexto exterior

El contexto es progressive enhancement.

Durante el hold frontal, priorizar el edificio; no permitir que terreno/ortofoto haga ilegible la fachada.

Durante la apertura de perspectiva puede mostrarse contexto existente si `View3D` ya lo tiene disponible.

Reglas:

- no iniciar descargas de red para completar la historia;
- no inventar edificios, vegetación o entorno;
- si contexto no está disponible, continuar con edificio/ground normal;
- no persistir cambios de territorio;
- restaurar `levelView`, far plane, orbit limits y visibilidad territorial usados temporalmente.

---

## 12. UI y copy

En `ENTREGAR → Presentación`, junto a las opciones runtime actuales:

`☐ Incluir alzado/fachada narrativa`

OFF por defecto y no persistido.

Cuando se activa y existen candidatos:

- selector `Fachada` con `Fachada A`, `Fachada B`...;
- si hay norte: `Fachada A · oeste`, etc.;
- marcar cuál es la selección automática, sin llamarla «principal»;
- si `partial`, explicar que la lectura usa sólo fachadas derivables del modelo.

Si unsupported, checkbox deshabilitado y motivo concreto visible.

Se permite botón standalone `Ver fachada`, pero sólo debe existir cuando la opción FT3D-4 está activada y debe usar el mismo Story player/narrativa.

**Regresión cero OFF:** con la opción apagada, la Presentation debe ser históricamente equivalente a `master` base, incluida la presencia/ausencia de botones y nodos específicos FT3D-4. No dejar controles FT3D-4 ocultos en DOM si los tests históricos esperan ausencia.

Caption base:

`Fachada visual · derivada del modelo · no es alzado de ejecución`

Con orientación:

`Fachada B · sureste · orientación derivada del proyecto`

Nunca usar «fachada principal» salvo dato futuro explícito aprobado.

---

## 13. Minimap

Mientras `elevation-open` está activo y el minimapa está abierto:

- resaltar los muros del candidato de fachada cuando sea viable sin duplicar geometría;
- mostrar flecha/dirección de observación frontal derivada del mismo `normalPlan`;
- actualizar aria-label: `Plano de orientación con la fachada visual seleccionada`;
- no romper la línea de sección FT3D-3 fuera de su escena;
- al salir, cero marcas FT3D-4 residuales.

---

## 14. Accesibilidad y reduced motion

Reutilizar controles, foco y teclado del Story actual.

- selector de fachada con label accesible;
- checkbox FT3D-4 con `aria-describedby`;
- motivo unsupported accesible;
- captions en aria-live donde ya corresponda;
- Escape/cerrar/atrás restauran foco y estado.

Reduced motion NO omite la fachada. Debe usar estados discretos:

```text
overview
→ fachada frontal
→ perspectiva exterior
→ overview
```

Sin interpolación larga, pero permitiendo anterior/siguiente y reverse determinista.

---

## 15. Restauración y cancelación

Al salir normalmente, Escape, cerrar, atrás del navegador, cambiar escena, scrub reverse o error:

restaurar:

- cámara position/target;
- FOV;
- near/far;
- orbit enabled y límites;
- nivel activo;
- `levelView`;
- visibilidad de roof;
- iluminación Presentation;
- Solar previo;
- context/territory visibility;
- materiales/surface quality;
- helpers/minimap temporales;
- foco;
- estado del editor.

No cambiar proyecto, revisión, JSON ni schema.

**Invariante:** JSON editable antes y después debe ser idéntico.

Cancelar a cualquier `p` debe dejar el mismo estado que cancelar desde `p=0`.

---

## 16. Rendimiento

- derivar candidatos al abrir/configurar Presentation o al entrar en la escena, no por frame;
- precalcular bounds/framing;
- no reconstruir geometría arquitectónica por frame;
- no recalcular `FloorPlanExterior.derive()` por frame;
- no recalcular Solar por frame;
- no crear renderer/canvas nuevo;
- no iniciar red desde `stateAt(p)`;
- helpers runtime creados una vez y destruidos al salir;
- memoria del renderer estable tras ciclos repetidos.

---

## 17. Progressive enhancement

Orden de degradación:

1. fachada + materiales + Solar + contexto, si todo está disponible y elegido;
2. fachada + materiales + contexto;
3. fachada + materiales;
4. fachada frontal instantánea/reduced;
5. si no existe fachada demostrable: omitir `elevation-open` y continuar Story.

Nunca sustituir la fachada por una representación falsa.

---

## 18. Tests unitarios mínimos

Crear:

`tests/presentation-elevation.test.cjs`

Cubrir al menos:

1. rectángulo simple produce candidatos estables;
2. autoridad exterior: sólo muros `facade` cuentan;
3. demolidos no reaparecen;
4. determinación de normal exterior;
5. normal ambigua se omite sin reclasificar fachada;
6. agrupación a sectores de 45°;
7. edificio irregular/diagonal;
8. IDs A/B/C estables;
9. default = longitud → huecos → orden;
10. norte ausente = labels neutrales;
11. norte presente = cardinal correcto;
12. northOffset no múltiplo de 45°;
13. partial;
14. no-facade-walls;
15. no-oriented-facade-walls;
16. degenerate;
17. edificio de 2 plantas suma candidatos coherentemente;
18. offsets de plantas respetados;
19. input no mutado;
20. mismo input produce deepEqual exacto.

Actualizar `tests/presentation-story.test.cjs` para `elevation-open`, secuencia, duración, `stateAt(p)`, p0/p1, reverse y reduced hold.

El comando unitario debe usar el filtro canónico del repositorio, excluyendo browser tests. No repetir el error de mezclar tests browser por nombre/filtro incorrecto.

---

## 19. Browser QA obligatorio

Crear:

`tests/presentation-elevation.browser.test.cjs`

Debe ejecutar Chromium real/headless y comprobar como mínimo:

1. OFF parity: opción apagada = secuencia/herramientas históricas sin nodo/botón FT3D-4 residual;
2. opción ON + candidatos + selector;
3. default determinista y cambio a un candidato alternativo;
4. norte ausente: labels A/B sin cardinal inventado;
5. norte presente: cardinal derivado correcto;
6. p=0 pose exacta del overview;
7. hold frontal: cámara perpendicular, FOV estrecho, edificio dentro de región libre;
8. perspectiva oblicua con profundidad real;
9. p=1 pose exacta del overview;
10. full chain `plan → section si ON → elevation → room-descent` sin salto de cámara;
11. reverse 1→0;
12. scrub ida/vuelta varias veces sin deriva;
13. reduced motion incluye la fachada;
14. autoplay pause/resume;
15. Escape/cerrar restaura todo;
16. botón Atrás restaura cámara/foco/editor;
17. JSON before/after idéntico;
18. Solar OFF: no altera Solar;
19. Solar ON con snapshot fijo: dirección/luz aplicada y restaurada;
20. Solar unavailable: no bloquea fachada;
21. contexto disponible: aparece sólo en fase perspectiva y se restaura;
22. contexto ausente: narrativa sigue;
23. multipiso: ambas plantas visibles, offsets reales, sin exploded;
24. 390×844;
25. 844×390;
26. resize durante historia;
27. minimapa: candidato + look direction y limpieza;
28. unsupported: checkbox disabled + motivo;
29. capture/video/otras herramientas no quedan habilitadas en estado inestable;
30. salida deja cero helpers/estado de fachada.

---

## 20. Suites de regresión mínimas

Ejecutar, además de las nuevas:

- `presentation-story.browser.test.cjs`;
- `presentation-section.browser.test.cjs`;
- `presentation-overview.browser.test.cjs`;
- `presentation-focus.browser.test.cjs`;
- `presentation-framing.browser.test.cjs`;
- `presentation-minimap.browser.test.cjs`;
- `presentation-light.browser.test.cjs`;
- `presentation.browser.test.cjs`;
- `building-presentation.browser.test.cjs`;
- `solar.browser.test.cjs`;
- `capture-3d.browser.test.cjs`;
- `tour-video.browser.test.cjs`;
- `professional-workspace.browser.test.cjs`;
- `project-first.browser.test.cjs`;
- `territory-integration.browser.test.cjs` cuando el entorno lo permita.

También ejecutar unitarias canónicas completas.

### Baseline obligatorio

Deuda conocida que NO debe arreglarse dentro de FT3D-4 salvo regresión demostrada:

- R10 framing bajo carga;
- cancelaciones/timeouts 1440 observadas en Presentation/minimap/P05/P13/P15/caso 31;
- otros timeouts ya reproducidos en baseline.

Si una suite histórica falla/cancela:

1. aislar el caso exacto;
2. ejecutar el mismo caso sobre el SHA base exacto del contrato/branch;
3. si falla igual, documentar baseline y no modificar producto;
4. si pasa en base y falla en rama, investigar/corregir antes de DONE.

No declarar «es SwiftShader» sin evidencia comparativa; declarar sólo lo demostrado.

---

## 21. QA visual obligatorio: Playwright + Chromium + CLI

No basta con tests lógicos.

Claude Code debe usar **Playwright, Chromium headless y CLI** durante el desarrollo y al cierre.

Entorno conocido del cierre FT3D-3, si sigue disponible:

```bash
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
THREE_LOCAL_DIR=/home/user/ft3d-qa/three/package
```

Si una ruta cambió, localizar el Chromium instalado por Playwright y documentar la ruta usada. No degradar a una validación puramente manual.

Ciclo obligatorio:

```text
implementar
→ ejecutar browser test en Chromium
→ generar capturas
→ inspeccionarlas visualmente
→ generar vídeo
→ inspeccionar frames/transiciones
→ corregir
→ repetir hasta cierre
```

No esperar al final para mirar por primera vez la escena.

---

## 22. Capturas finales obligatorias

Todas deben generarse sobre el **HEAD final exacto** de la rama, no sobre un commit anterior.

Escritorio 1440×900:

- p=0.00;
- p≈0.25;
- p≈0.35 frontal;
- p≈0.50 iluminación/materiales;
- p≈0.72 perspectiva;
- p≈0.86 hold exterior;
- p=1.00 overview recuperado;
- primera estancia después de continuar;
- después de salir.

Además:

- candidato automático;
- candidato alternativo seleccionado;
- sin norte;
- con norte/cardinal;
- Solar opcional ON con snapshot fijo;
- Solar unavailable/OFF;
- edificio de dos plantas;
- 390×844;
- 844×390;
- unsupported con motivo.

Crear una hoja/contact sheet final para revisión humana.

Evidencia fuera del commit salvo que el repo tenga una política explícita contraria. Restaurar PNG/versionados que los tests reescriban.

---

## 23. Vídeos finales obligatorios

Extender/reutilizar `scripts/qa/render-presentation-story-frames.cjs`; no crear un pipeline audiovisual paralelo innecesario.

Añadir partes FT3D-4, recomendadas `4` y `4r`.

Vídeo forward 1440×900, suficiente muestreo para revisar:

```text
overview
→ alineación
→ fachada frontal
→ iluminación/materiales
→ perspectiva/contexto
→ overview recuperado
→ room-descent
→ estancia
→ salida
```

Vídeo reverse:

```text
p=1 → p=0 de elevation-open
```

Codificar con `ffmpeg` a 24 fps como en FT3D-3.

Revisar fotograma a fotograma o mediante diff/contact sheets y buscar:

- camera jump;
- FOV jump;
- popping de plantas;
- fachada invertida;
- clipping accidental;
- contexto apareciendo durante el hold frontal y ocultando fachada;
- Solar que parpadea o cambia por frame;
- materiales que cambian incorrectamente;
- salto elevation→room;
- estado residual al salir;
- reverse no simétrico.

No declarar QA visual cerrado hasta revisar los dos vídeos.

---

## 24. Higiene Git/artefactos

- trabajar sólo en `feat/ft3d-4-elevation-facade`;
- no trabajar ni commitear directamente en `master`;
- no force-push;
- commits pequeños/coherentes;
- no mezclar C4, B2/B8, FT3D-5+ ni deuda baseline;
- no commitear logs/capturas/vídeos temporales salvo política ya existente;
- restaurar artefactos versionados modificados por QA;
- `git status` limpio antes del handoff;
- branch subida a origin.

---

## 25. Criterios DONE

FT3D-4 NO está DONE por «se ve bien» ni por «tests nuevos pasan».

DONE exige TODO:

1. implementación completa en la rama autorizada;
2. arquitectura conforme a autoridades existentes;
3. no schema/persistencia nueva;
4. OFF parity demostrada;
5. unitarias nuevas verdes;
6. browser FT3D-4 verde;
7. Story/Section/Solar/Building/Presentation regresiones ejecutadas;
8. cualquier fallo histórico comparado con baseline exacto;
9. p=0 y p=1 recuperan overview exacto;
10. reverse determinista;
11. cancelación/restauración completas;
12. JSON before/after idéntico;
13. mobile portrait + short landscape;
14. multipiso sin exploded;
15. Solar opcional y honesto;
16. contexto opcional y honesto;
17. capturas finales sobre HEAD final;
18. vídeos forward/reverse sobre HEAD final;
19. revisión visual de capturas y vídeos sin defecto abierto;
20. working tree limpio;
21. push sin force;
22. handoff completo;
23. detenerse antes de FT3D-5.

La integración, CI remoto, actualización de roadmap y autorización FT3D-5 pertenecen a ChatGPT/Juanma después del handoff.

---

## 26. Handoff obligatorio

Entregar:

- base SHA exacto;
- HEAD final exacto;
- commits;
- archivos modificados y líneas +/-;
- explicación de arquitectura;
- candidatos/selección de fachada;
- Story insertion/order;
- cámara/checkpoints;
- Solar/contexto;
- multipiso;
- accesibilidad/reduced motion;
- restoration invariants;
- unit tests y browser tests con recuentos;
- regresiones con resultados;
- comparaciones baseline concretas;
- entorno Chromium/Playwright usado;
- rutas de capturas/contact sheet;
- rutas de vídeos y número de frames;
- defectos encontrados/corregidos;
- riesgos/deuda real restante;
- confirmación de `git status` limpio y branch pushed;
- confirmación explícita: C4 no tocado, B2/B8 no tocados, FT3D-5 no iniciado.

Terminar literalmente con:

`ESTADO: PAUSADO PARA INTEGRACIÓN`

Después, parar.
