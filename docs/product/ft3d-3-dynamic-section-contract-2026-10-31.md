# FT3D-3 — Contrato de corte: sección dinámica

**Fecha:** 31-10-2026  
**Estado:** ESPECIFICADO / AUTORIZADO PARA IMPLEMENTACIÓN  
**Base funcional revisada:** `master@86342f8a1ff8bbf77e448ac80c2fdb14774bfb6d`  
**Programa padre:** `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`  
**Motor padre:** FT3D-2 / `FloorPlanPresentationStory`  

---

## 1. Objetivo del corte

FT3D-3 convierte la geometría que Rubik ya conoce en una **sección visual narrativa, reversible y presentable** que permite leer el interior del proyecto sin crear un segundo modelo.

La experiencia mínima aprobada es:

```text
vista general 3D existente
→ el corte aparece sobre el mismo modelo
→ cámara frontal de sección legible
→ se mantiene el tamaño aparente del corte mientras se abre la perspectiva
→ se revelan los espacios situados detrás del plano de corte
→ la escena termina en la vista general determinista del nivel, con la sección aún visible
→ al continuar/salir se restaura el modelo normal y se puede entrar en la estancia existente sin salto de cámara
```

La sección es **visual y explicativa**. Nunca debe presentarse como sección constructiva, plano de ejecución, escala certificada o comprobación normativa.

---

## 2. Reglas no negociables

1. **Una sola autoridad geométrica.** Consumir `FloorPlanProjectV1`, `FloorPlanBuildingV1` y la geometría/renderer actuales. No crear un segundo edificio, un segundo renderer ni una copia persistente de la geometría.
2. **Aditivo.** Con FT3D-3 desactivado, la presentación actual debe comportarse exactamente como antes.
3. **Sin schema/persistencia nueva.** La selección de sección, plano de corte, progreso, cámara, caps y estados visuales son runtime/derivados.
4. **Determinismo.** Mismo proyecto + mismo nivel + mismo progreso = mismo estado visible.
5. **Reversibilidad.** Scrub hacia atrás debe reconstruir el estado anterior; salir debe restaurar clipping, cámara, FOV, near/far, controles, nivel y visibilidad.
6. **Sin falsa certeza.** La UI debe usar “Sección visual” o equivalente y mostrar que deriva del modelo. No usar “sección técnica certificada”.
7. **No tocar B2/B8, FT3D-4 ni fases posteriores.**

---

## 3. Arquitectura obligatoria

### 3.1 Story engine

FT3D-3 debe extender `js/presentation-story-core.js`; no crear un player paralelo.

Añadir una narrativa reusable de tipo conceptual:

```text
section-open
```

El nombre final puede ajustarse a los patrones del repo, pero debe vivir en `NARRATIVES`, entrar en `SCENE_MS` y producir `stateAt(p)` puro sobre `p ∈ [0,1]`.

Debe seguir usando:

- `FloorPlanPresentationStory.sequence()`;
- controles globales de progreso;
- anterior/siguiente;
- play/pausa;
- captions;
- `View3D.presentationStoryBegin/Apply/End`;
- restauración del Story engine existente.

### 3.2 Derivación geométrica

Crear una primitiva pura de sección. Preferencia de arquitectura:

`js/presentation-section-core.js`

Puede integrarse en otro core existente si queda claramente separada y testeable sin DOM/Three.js.

Responsabilidad: derivar un descriptor de sección a partir de geometría real, no dibujarla.

Salida conceptual mínima:

```text
{
  supported,
  reason,
  axis,
  normal,
  frontSign,
  targetOffset,
  startOffset,
  bounds,
  intersections,
  levelId?
}
```

No persistir este descriptor.

### 3.3 Renderer

Extender la autoridad `View3D` actual. El renderer debe aplicar un **plano vertical de clipping real** sobre la geometría del edificio y una representación derivada de las superficies/contorno cortados.

No reutilizar `opt.cut` como sustituto del plano vertical: `opt.cut` es el corte/altura horizontal existente y debe conservarse/restaurarse tal como estaba.

El clipping de sección debe afectar a la geometría del modelo que corresponda (arquitectura, huecos, cubierta/elementos soportados y objetos cuando sea viable), pero **no** debe cortar terreno, ortofoto, contexto, UI, minimapa ni ayudas que no formen parte del edificio.

El estado de clipping/materiales/visibilidad temporal debe guardarse y restaurarse completamente en `presentationStoryEnd`.

---

## 4. Derivación determinista del plano de corte

### 4.1 Eje

Usar la envolvente en planta del nivel/proyecto:

- si `spanX >= spanZ`, la sección se extiende en X y su normal base es Z;
- si `spanZ > spanX`, la sección se extiende en Z y su normal base es X.

Así la sección muestra, por defecto, la mayor longitud legible del proyecto.

### 4.2 Lado visible

Elegir el signo de la normal usando la vista general determinista de Presentation: la normal debe mirar hacia la cámara de overview. No depender de la última órbita libre del usuario.

### 4.3 Posición objetivo

Evaluar, en este orden estable, candidatos situados al **50 %, 40 % y 60 %** del recorrido de la envolvente sobre la normal elegida.

Para cada candidato medir de forma puramente geométrica:

- habitaciones/polígonos atravesados;
- muros activos atravesados.

Elegir el candidato con mayor número de habitaciones atravesadas; desempatar por muros atravesados; segundo desempate por el orden estable `50 % → 40 % → 60 %`.

Si no existe ningún candidato que atraviese geometría útil, devolver `supported:false` con razón explícita. No inventar un corte.

### 4.4 Sweep

`startOffset` debe situar el plano justo por delante de la envolvente del lado de cámara. El progreso mueve el plano desde ese estado exterior hasta `targetOffset`; nunca acumula desplazamientos frame a frame.

---

## 5. Superficie de corte y fidelidad visual

El requisito “superficie de corte visualmente diferenciada” es obligatorio.

La implementación puede usar clipping + caps/stencil/intersecciones derivadas, pero debe cumplir:

- el borde/superficie donde el plano atraviesa arquitectura se distingue claramente del material normal;
- no se inventa espesor de forjado, muro, cubierta o elemento que el modelo no conozca;
- puertas/ventanas no quedan flotando en la mitad eliminada;
- muebles/GLB no pueden quedar como residuos manifiestamente desconectados del lado conservado;
- materiales reales del proyecto siguen visibles en las superficies no cortadas;
- cualquier geometría auxiliar de cap es runtime, se crea como máximo al entrar/cambiar de nivel y se destruye/restaura al salir; **no se reconstruye por frame**.

Si una clase de material/objeto no puede cortarse limpiamente, degradar de forma estable y documentada antes que falsear geometría.

---

## 6. Contrato temporal de la narrativa

`stateAt(p)` debe ser continuo, reversible y con checkpoints reproducibles `0 / .25 / .50 / .75 / 1`.

Fases obligatorias:

### p = 0 — overview intacto

- cámara = pose de overview existente para ese stop;
- clipping de sección inactivo/fuera de la envolvente;
- estado visual equivalente al Presentation actual.

### 0 → ~0.30 — alinear y cortar

- mover cámara hacia una vista frontal de sección;
- lente larga / FOV estrecho derivado con el mismo principio de representación casi plana ya usado por `planReveal`;
- el plano de corte entra desde `startOffset` hasta `targetOffset`;
- el tamaño útil de la sección permanece encuadrado en la región libre de la UI.

### ~0.30 → ~0.45 — sección frontal legible

- plano estable en `targetOffset`;
- sección claramente legible;
- superficie/contorno cortado visible;
- caption de sección visual.

### ~0.45 → ~0.85 — abrir profundidad

- mantener el plano de corte estable;
- abrir FOV y acercar cámara mediante dolly-zoom/encuadre equivalente para conservar el tamaño aparente del corte;
- interpolar gradualmente hacia la dirección de la vista general existente;
- revelar profundidad y espacios detrás del corte sin cambiar de modelo.

### ~0.85 → 1 — estado de salida

- cámara termina **exactamente en la pose de overview que Presentation ya calcula** para ese nivel;
- FOV/near/far compatibles con esa pose;
- el plano de sección permanece activo en `targetOffset` hasta finalizar la escena.

Al terminar/cambiar de escena, `presentationStoryEnd({keepPose:true})` restaura clipping/caps y deja la cámara en el overview exacto. El siguiente `room-descent` puede empezar desde la misma pose sin salto de cámara.

Las proporciones exactas pueden ajustarse ligeramente por razones técnicas, pero los cinco estados anteriores y sus invariantes son obligatorios.

---

## 7. Cámara

La cámara de sección no depende del último gesto del usuario.

Debe derivarse de:

- descriptor de sección;
- bounds reales;
- altura realmente construida/visible del nivel;
- región libre de pantalla que ya usa Presentation;
- pose de overview existente.

Reglas:

- vista frontal: dirección paralela a la normal del corte;
- objetivo vertical: centro del volumen realmente visible, sin inventar alturas;
- FOV estrecho derivado, no un “modo ortográfico” separado si no es necesario;
- apertura de perspectiva por dolly zoom, conservando encuadre;
- p=0 y p=1 deben anclar exactamente a la pose determinista de overview indicada arriba;
- resize/reorientación recalcula encuadre con el mismo descriptor de plano y conserva el progreso semántico.

---

## 8. Interacción y UX

FT3D-3 vive dentro de **ENTREGAR → Presentación**. No crear una sexta área conceptual.

Añadir una opción aditiva de configuración:

```text
☐ Incluir sección dinámica
```

Reglas:

- OFF por defecto para preservar el comportamiento actual;
- visible/habilitada sólo cuando el nivel/proyecto tenga una sección soportada;
- no persistida en el proyecto;
- cuando está activa, `fullStory()` inserta `section-open` inmediatamente después del `plan-reveal` del nivel y antes de su primer `room-descent`;
- en un overview soportado puede ofrecerse `Ver sección dinámica` como reproducción de una escena mediante el mismo player;
- no duplicar controles de progreso/play/pausa/anterior/siguiente.

Caption mínimo durante la escena:

```text
Sección visual · derivada del modelo · no es plano de ejecución
```

Durante la apertura puede añadirse contexto breve del tipo “Abrimos perspectiva para leer los espacios detrás del corte”. No usar lenguaje de certificación.

### Minimap

Mientras la sección esté activa, el minimapa debe mostrar una línea de corte y dirección de mirada derivadas del mismo descriptor. Es presentación/ayuda visual, no dato persistente.

---

## 9. Multipiso

El contrato actual de `FloorPlanBuildingV1` admite hasta **2 niveles**. FT3D-3 debe ser compatible con ese límite sin crear una arquitectura paralela.

Reglas:

1. Derivar un eje/dirección de sección coherente para el edificio usando la envolvente de niveles en el marco del edificio cuando esté disponible.
2. Aplicar el mismo criterio de dirección a cada nivel, respetando `offsetMm`, orden y autoridad de cada proyecto embebido.
3. `fullStory()` presenta la sección de cada nivel soportado después de su overview correspondiente.
4. El cambio de nivel sigue usando la infraestructura existente (`showLevel`/plan de Presentation).
5. **No fabricar una sección simultánea apilada de dos plantas si el renderer actual no mantiene ambos modelos activos a la vez.** La primera versión es una narrativa coherente por nivel. La relación apilada/exploded pertenece a FT3D-5.
6. Si un nivel no soporta corte, se omite únicamente su escena de sección y la historia continúa; debe quedar una razón disponible para QA/UI, no un fallo global.

---

## 10. Accesibilidad y reduced motion

Los controles existentes de Story siguen siendo la autoridad.

Obligatorio:

- teclado/foco visibles en todos los controles nuevos;
- botón/checkbox con label accesible;
- captions no dependientes sólo de color o movimiento;
- línea de sección del minimapa no puede ser la única forma de saber que hay un corte;
- `prefers-reduced-motion` no ejecuta vuelos/sweeps continuos: aplica estados discretos equivalentes;
- en reduced motion la sección debe seguir siendo visible y comprensible; no puede saltarse por tener animación 0 ms;
- autoplay debe permitir pausa y no debe hacer imperceptible el estado de sección abierta en reduced motion;
- salir funciona en cualquier progreso.

Versión reducida mínima:

```text
overview
→ sección frontal/abierta instantánea
→ siguiente acción explícita del usuario
→ overview/restauración
```

---

## 11. Progressive enhancement y fallbacks

Orden de degradación:

```text
clipping + superficie de corte + transición completa
→ sección instantánea con el mismo plano/cap, sin movimiento continuo
→ omitir escena de sección y continuar Presentation existente
```

Omitir FT3D-3 nunca debe impedir usar Presentation, capturas, vídeo ni entrega existente.

Razones de no disponibilidad deben ser concretas, por ejemplo:

- geometría sin bounds válidos;
- ningún plano candidato atraviesa geometría útil;
- contexto WebGL perdido/no disponible;
- material/renderer incompatible con el efecto mínimo.

No mostrar “sección disponible” cuando sólo se está bajando la altura general de muros.

---

## 12. Restauración y no mutación

Debe demostrarse que tras salir/cancelar/cambiar escena se restauran exactamente:

- clipping planes del renderer/materiales;
- geometría/caps auxiliares eliminados;
- visibilidad de grupos/objetos;
- `opt.cut` y cualquier corte horizontal previo;
- wall/furniture scale del Story;
- cámara, target, FOV, near/far y orbit limits según lifecycle existente;
- nivel activo al cerrar Presentation;
- selección/editor mediante la restauración global actual;
- proyecto JSON sin cambios.

Cancelar una sección a mitad debe devolver a su overview de inicio, no dejar una cámara arbitraria con clipping residual.

---

## 13. Rendimiento

Gates arquitectónicos:

- no reconstruir proyecto/mallas por frame;
- no recalcular intersecciones topológicas por frame;
- descriptor/caps se calculan al entrar o al cambiar de nivel;
- `stateAt(p)` sólo actualiza estado temporal/cámara/plano;
- no crear un canvas/WebGLRenderer adicional;
- liberar geometría/materiales auxiliares al salir;
- preservar DPR/adaptación móvil existente.

Registrar en QA desktop y móvil:

- tiempo de entrada a escena;
- ausencia de context loss/errores;
- comportamiento durante scrub y autoplay;
- cualquier degradación necesaria.

No fijar una cifra de FPS universal sin hardware controlado; comparar con el mismo baseline y reportar regresiones perceptibles.

---

## 14. Casos límite obligatorios

Cubrir al menos:

1. proyecto simple de una planta;
2. planta rectangular;
3. planta irregular;
4. eje X dominante;
5. eje Z dominante;
6. empate de spans;
7. candidato central válido;
8. central inválido y fallback 40 %;
9. fallback 60 %;
10. ningún candidato válido → unsupported;
11. muros demolidos no cuentan como autoridad de corte;
12. proyecto sin habitaciones pero con geometría suficiente;
13. proyecto sin geometría útil;
14. puertas/ventanas atravesadas por el corte;
15. mobiliario normal;
16. mobiliario/GLB próximo al plano;
17. materiales reales;
18. parapeto/cubierta soportada existente;
19. `opt.cut` previo distinto del estándar;
20. resize durante la escena;
21. móvil vertical;
22. móvil horizontal/corto;
23. reduced motion;
24. autoplay + pausa;
25. scrub 0→1;
26. scrub 1→0;
27. anterior/siguiente de Story;
28. cancelación a mitad;
29. cierre de Presentation a mitad;
30. captura en un checkpoint de sección;
31. vídeo/recorder no roto;
32. edificio de 2 niveles sin offsets;
33. edificio de 2 niveles con offsets;
34. un nivel soportado y otro no;
35. cambio de nivel y restauración;
36. contexto/terrain exterior existente no cortado;
37. proyecto JSON idéntico antes/después;
38. Story desactivado: comportamiento idéntico a master base.

---

## 15. Pruebas mínimas

### Unitarias

Crear/ajustar pruebas para:

- derivación pura del descriptor de sección;
- eje, signo y candidato deterministas;
- unsupported/reasons;
- `section-open.stateAt()` en checkpoints;
- igualdad determinista de estados;
- reversibilidad;
- p=0 = overview intacto;
- p=1 = cámara overview exacta + sección activa;
- `sequence()` con `section-open`;
- no mutación de inputs.

Preferencia de archivos:

- `tests/presentation-section.test.cjs`;
- ampliar `tests/presentation-story.test.cjs` sólo donde sea realmente compartido.

### Browser

Crear un browser test dedicado, preferentemente:

`tests/presentation-section.browser.test.cjs`

Debe probar como mínimo:

- escritorio, una planta;
- checkpoints 0/.25/.50/.75/1;
- plano/cap activo sólo cuando corresponde;
- transición hacia el siguiente room stop sin salto de cámara;
- reverse scrub;
- cancelación/restauración;
- reduced motion;
- móvil 390×844;
- short landscape 844×390;
- edificio 2 niveles;
- sin overflow horizontal;
- cero `pageerror` nuevos;
- proyecto no mutado.

### Regresiones obligatorias

Ejecutar, como mínimo, las suites existentes de:

- Presentation Story;
- overview/framing;
- focus/labels;
- capture;
- building presentation;
- tour/video;
- professional workspace;
- Project-First.

Si aparece R10, `professional-workspace` bajo carga o `render-budget` timeout, comparar con `master` base antes de modificar producto.

---

## 16. Evidencia humana obligatoria

Entregar después del código final:

1. captura desktop p=0;
2. captura desktop sección frontal (~.35);
3. captura desktop profundidad (~.65/.75);
4. captura desktop p=1;
5. captura móvil;
6. captura de edificio de 2 niveles, al menos una por nivel;
7. captura/fallback de caso unsupported;
8. vídeo o secuencia continua:

```text
overview
→ sweep/corte
→ sección frontal
→ apertura de profundidad
→ overview seccionado
→ continuar a estancia
→ salir/restaurar
```

El vídeo debe permitir comprobar que no hay cambio de modelo, salto de cámara manifiesto ni clipping residual al salir.

---

## 17. Fuera de alcance

No implementar en FT3D-3:

- alzado/fachada/Solar narrativo (FT3D-4);
- axonometría/exploded o apilado simultáneo de niveles (FT3D-5);
- plantillas Inmobiliaria/Arquitectura/etc. (FT3D-6);
- nuevas salidas/hosting (FT3D-7);
- timeline de construcción (FT3D-8);
- B2/B8/OpenAI;
- schema persistente de Story;
- edición manual persistente del plano de corte;
- sección estructural/normativa;
- nueva autoridad geométrica.

---

## 18. Criterios de aceptación

FT3D-3 pasa auditoría sólo si simultáneamente:

1. el plano de corte es real y deriva de geometría existente;
2. la superficie/contorno cortado se diferencia visualmente;
3. la cámara de sección es determinista;
4. se conserva el tamaño aparente del corte al abrir perspectiva;
5. el mismo `p` reproduce el mismo estado;
6. reverse scrub funciona;
7. p=0 coincide con overview actual;
8. p=1 termina en la misma cámara overview, sin salto hacia la siguiente estancia;
9. la sección es opt-in y el comportamiento histórico queda intacto cuando está OFF;
10. reduced motion conserva comprensión y control;
11. multipiso funciona dentro del límite vigente sin inventar modelo apilado;
12. terrain/contexto externo no queda seccionado accidentalmente;
13. no hay mutación/persistencia nueva;
14. salir restaura completamente estado;
15. mobile/short landscape siguen operables;
16. pruebas dedicadas + regresiones relevantes pasan o cualquier fallo queda demostrado como baseline;
17. evidencia visual demuestra continuidad y ausencia de residuos.

---

## 19. Definición de DONE

FT3D-3 sólo está **DONE** cuando:

- contrato implementado en rama dedicada;
- unitarias y browser dedicados completos;
- batería de regresión ejecutada;
- capturas/vídeo final sobre el último commit;
- commit(s) publicados sin force sobre la rama autorizada;
- Claude se detiene y entrega handoff;
- ChatGPT audita diff/arquitectura/evidencia;
- CI remoto queda verde o cualquier baseline está demostrado;
- integración segura en `master`;
- actualización inmediata de `current-status` y matriz;
- FT3D-3 pasa a **INTEGRADO Y VALIDADO** antes de autorizar FT3D-4.

**READY en rama no equivale a DONE.**
