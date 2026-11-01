# Metodología FT3D de referencia, REA y escultura

**Fecha:** 2026-11-01  
**Estado:** metodología de trabajo aprobada para investigación y transferencia; no integra código ni sustituye por sí sola contratos FT3D existentes.  
**Repositorio objetivo:** `Juanmaes83/floorplan-3d`.  
**Base documental:** `master@5f4e3d20e905f5f302783f67fda0ab4a7eb21371`.  
**Referencia audiovisual local:** `videos/proyecto-floor-plan-3d.mp4`.  
**Referencia web principal:** `https://sam1983aing.github.io/flat-to-3d/`.  
**Repositorio donante principal:** `Juanmaes83/flat-to-3d` (MIT).  
**Herramienta de ingeniería inversa:** `Juanmaes83/rea` / REA (MIT).

---

## 0. Decisión de método

El programa FT3D deja de abordar las referencias únicamente como inspiración visual o como una lista de escenas que haya que reconstruir desde cero.

A partir de este documento, la metodología preferente para capacidades de presentación arquitectónica complejas es:

```text
REFERENCE ATLAS
      ↓
REA / OBSERVACIÓN RUNTIME
      ↓
DONOR CODE MAP
      ↓
SCULPTURE LAB
      ↓
RUBIK ADAPTERS
      ↓
VISUAL PARITY / GOLDEN MASTER
      ↓
PRODUCT INTEGRATION
```

El objetivo es aprovechar implementaciones y comportamientos ya demostrados, entenderlos con evidencia y adaptarlos a las autoridades de Rubik, en lugar de pedir a un agente que invente cada solución desde una descripción textual.

Esto debe reducir:

- prueba y error;
- tokens y créditos de agentes;
- tiempo de implementación;
- divergencia visual respecto de la referencia;
- regresiones por reinterpretar comportamientos ya resueltos.

La metodología no autoriza copiar código sin licencia ni integrar demos completas sin adaptación.

---

# 1. Principio de producto

La referencia confirma una dirección de producto más ambiciosa que «añadir animaciones».

Rubik debe poder presentar **el mismo proyecto** mediante diferentes lecturas arquitectónicas sin que parezcan productos separados:

```text
plano
→ sección
→ alzado
→ axonometría
→ exploded / descomposición
→ materialización
→ escala humana
→ recorrido
```

La idea rectora es:

> **Plano, sección, alzado, axonometría, exploded y recorrido deben percibirse como estados del mismo objeto, no como escenas desconectadas.**

Esto conserva el principio de producto:

> **más contexto, no más falsa certeza**.

Una técnica visual sólo puede mostrar información que Rubik pueda demostrar o etiquetar honestamente como representación/estimación.

---

# 2. Activos de referencia permanentes

## 2.1 Vídeo local del repositorio

La referencia audiovisual principal está guardada en:

```text
videos/proyecto-floor-plan-3d.mp4
```

Este vídeo sirve como:

- guía visual común para humanos y agentes;
- fuente para extraer frames y contact sheets;
- referencia temporal para escenas y transiciones;
- soporte de comparación cuando la web externa cambie o no sea accesible;
- medio para reducir reanálisis repetido de fuentes externas.

No debe tratarse como una prueba automática de comportamiento. El vídeo muestra el resultado visual; REA, el código donante y la observación runtime aportan la explicación técnica.

## 2.2 Web de referencia

Referencia principal:

```text
https://sam1983aing.github.io/flat-to-3d/
```

La navegación debe estudiar no sólo las siete técnicas principales, sino también **cada submodo/variante expuesto por la interfaz**.

Ejemplo ya identificado dentro de `01 Exploded House`:

```text
A · The Board
B · Unfolded Room
C · Floor by Floor
```

Por tanto, la unidad de análisis no es «uno de siete cortes», sino:

```text
familia → variante → estados internos → transición
```

## 2.3 Repositorios donantes

### `Juanmaes83/flat-to-3d`

Uso permitido como donante de código bajo MIT, conservando avisos y obligaciones de licencia aplicables.

Debe servir para localizar y adaptar, entre otras piezas:

- trucos de proyección/lente;
- dolly zoom;
- clipping y caps;
- material sweep;
- transformaciones exploded;
- transformaciones unfolded;
- timelines de scroll/progress;
- choreography de cámara;
- callouts y composición visual.

### Lintel y otras referencias sin licencia clara

Los repositorios públicos sin una licencia explícita compatible se consideran **referencias técnicas y visuales**, no fuentes de código para copiar literalmente.

De ellos se puede extraer:

- comportamiento observable;
- arquitectura conceptual;
- patrones de QA;
- objetivos visuales;
- ideas de interacción.

No se copiarán bloques sustanciales sin verificar antes su licencia/procedencia.

## 2.4 REA

REA se utiliza como herramienta de evidencia para ingeniería inversa sobre webs, JavaScript, aplicaciones y comportamiento runtime.

Su función dentro de FT3D es:

- observar el target real;
- inventariar scripts y recursos;
- capturar screenshots;
- observar sesiones y cambios;
- exportar scripts para análisis estático;
- relacionar comportamiento runtime con código;
- comparar capturas y escenarios;
- documentar evidencias, limitaciones y desconocidos.

REA no sustituye el juicio de producto ni convierte automáticamente una referencia en código Rubik.

---

# 3. Reference Atlas

Antes de implementar una nueva familia o variante de alto impacto debe existir un **Reference Atlas** suficiente para evitar trabajar sólo desde memoria o descripción.

## 3.1 Unidad del atlas

Cada entrada debe tener una identidad estable, por ejemplo:

```text
01/A The Board
01/B Unfolded Room
01/C Floor by Floor
02/A Section Sweep
03/A Open Section
07/A Sunlit Elevation
```

Si una familia contiene más variantes, se enumeran individualmente.

## 3.2 Datos mínimos por variante

Cada entrada debe registrar, cuando sea observable:

- familia y variante;
- fuente web/repo/vídeo;
- timestamps del vídeo local;
- estado inicial;
- checkpoints significativos de progreso;
- estado final;
- cámara, FOV/proyección y target;
- clipping;
- grupos que se mueven;
- grupos que permanecen;
- visibilidad;
- materiales/representación;
- sombras/iluminación;
- labels/callouts;
- entrada/salida de interior;
- recorrido;
- comportamiento reverse;
- reduced motion equivalente si procede;
- comportamiento móvil;
- coste/performance observable;
- piezas de código donante relacionadas;
- autoridad Rubik equivalente;
- gaps conocidos.

## 3.3 Checkpoints

Cuando sea útil, una variante se documentará con checkpoints normalizados:

```text
p=0.00
p=0.25
p=0.50
p=0.75
p=1.00
```

No es obligatorio que el donor utilice esos porcentajes internamente. Se usan para comparar visualmente estados equivalentes.

---

# 4. REA: investigación antes de implementación

REA debe usarse para responder preguntas concretas, no para una exploración ilimitada.

Ejemplos de preguntas válidas:

- ¿qué script controla el FOV durante Open Section?
- ¿qué grupos se transforman en Floor by Floor?
- ¿cómo se construye el Unfolded Room?
- ¿qué estado controla el cambio drawing → material?
- ¿cómo se mantiene el plano de corte estable mientras cambia la lente?
- ¿qué elementos se ocultan durante una transición?
- ¿qué evento/progress activa cada subfase?

Resultado esperado:

```text
pregunta
→ evidencia runtime
→ fuente/código relacionado
→ explicación
→ limitaciones
→ pieza candidata para Sculpture Lab
```

No se debe continuar investigando una vez que ya existe evidencia suficiente para construir y validar el comportamiento objetivo.

---

# 5. Donor Code Map

Antes de copiar/adaptar código se crea un mapa explícito.

Ejemplo:

| Comportamiento | Donante | Código/área | Dependencias demo | Autoridad Rubik destino |
|---|---|---|---|---|
| lens reveal | flat-to-3d | camera/timeline | cámara demo | View3D / Story |
| section clipping | flat-to-3d | clipping/material | mesh demo | geometry + FT3D-3 |
| floor exploded | flat-to-3d | group transforms | niveles hard-coded | Building presentationSources |
| walk | demo / referencia | camera path | spline artística | presentation-route.js |
| room unfold | flat-to-3d | transforms | room hard-coded | room/wall geometry Rubik |

El mapa obliga a distinguir:

1. código transferible;
2. datos hard-coded;
3. assets demo;
4. lógica de producto Rubik;
5. piezas que ya existen en Rubik y no deben duplicarse.

---

# 6. Metodología de escultura

## 6.1 Concepto

«Escultura» significa portar primero un bloque funcional suficientemente grande como para conservar la lógica visual del donante y después sustituir gradualmente sus dependencias por autoridades Rubik.

No significa pegar un repositorio completo sobre el producto.

## 6.2 Flujo

```text
1. aislar la pieza donante
2. hacerla funcionar en laboratorio
3. demostrar paridad visual básica
4. identificar hard-coded/demo assumptions
5. sustituir una dependencia cada vez
6. conservar comportamiento observable
7. ejecutar comparación donor vs Rubik
8. repetir hasta eliminar las dependencias demo
9. integrar sólo cuando respeta contratos Rubik
```

## 6.3 Rama de laboratorio

El trabajo de escultura debe ocurrir en una rama aislada, separada de master y de ramas de implementación ya en curso.

Una rama de laboratorio puede tolerar temporalmente:

- nombres del donante;
- datos de muestra;
- código menos idiomático para Rubik;
- helpers temporales.

Pero **no puede integrarse así**.

Antes de integración debe:

- usar autoridades Rubik;
- eliminar duplicaciones;
- respetar lifecycle/restoration;
- cumplir accesibilidad/móvil/reduced motion;
- pasar QA y regresiones;
- documentar atribución/licencia.

---

# 7. Autoridades Rubik que no se deben reemplazar

La escultura adapta el donante a Rubik. No convierte Rubik en la demo.

Autoridades actuales a preservar/reutilizar:

- geometría del proyecto/derivaciones Rubik;
- `BuildingUI.presentationSources()` para niveles/building;
- `PresentationStory.stateAt(p)` y lifecycle Story;
- `View3D` y su cámara real;
- contratos FT3D-3 y FT3D-4 para sección/alzado;
- `presentation-route.js` para rutas interiores seguras y choreography;
- materiales reales del proyecto;
- rooms reales;
- offsets/elevaciones reales de Building;
- sistema de restauración de Presentation;
- toggles y preferencias existentes;
- reduced motion;
- offline/share/capture/video existentes.

Una spline artística del donante no sustituye una ruta Rubik válida si Rubik ya posee una autoridad mejor.

---

# 8. Golden Master visual

La validación no puede limitarse a «los tests pasan».

Para capacidades inspiradas en referencias externas se requiere una comparación visual explícita.

## 8.1 Evidencia

Cuando sea viable:

```text
DONOR checkpoint
vs
RUBIK checkpoint
```

Comparar:

- composición;
- escala;
- cámara;
- profundidad;
- legibilidad;
- clipping;
- materiales;
- transiciones;
- residuos;
- reversibilidad.

## 8.2 Vídeo

Las escenas temporales deben validarse también mediante vídeo, no sólo screenshots.

Para Story reversible:

- forward real;
- reverse real mediante progreso/story inversa, no reproducción invertida del vídeo;
- cierre/restauración desde estados intermedios cuando sea relevante.

## 8.3 Quality bar

Una capacidad no se considera visualmente equivalente sólo porque:

- el DOM existe;
- la geometría se desplaza;
- una prueba numérica pasa;
- la cámara llega a un destino.

Se requiere revisión humana de:

- continuidad;
- ritmo;
- jerarquía visual;
- flicker;
- solapes;
- elementos flotantes;
- claridad arquitectónica;
- calidad percibida.

---

# 9. Familias de referencia conocidas

## 9.1 Continuidad representación → espacio

Prioridad actual alta:

- Section Sweep;
- Open Section;
- Sunlit Elevation;
- Card Model cuando aporte infraestructura reutilizable.

Patrón:

```text
dibujo técnico
→ mismo modelo adquiere profundidad
→ representación/material cambia
→ perspectiva
→ escala humana / recorrido
```

## 9.2 Descomposición espacial

Prioridad actual alta:

### The Board

Técnica de descomposición por layers/assemblies.

Rubik sólo debe mostrar grupos demostrables. No debe inventar estructura, cladding o sistemas constructivos inexistentes.

Primera adaptación honesta posible:

```text
floor/slab
walls
openings
furniture
exterior/roof disponible
```

### Unfolded Room

Gran oportunidad para arquitectura, reformas e interiorismo.

Objetivo conceptual:

```text
planta central
+ techo
+ paredes desplegadas
+ huecos
+ materiales
+ mobiliario
```

Debe derivarse de una habitación real y sus walls/openings, no de geometría hard-coded.

### Floor by Floor

Es la variante más próxima al FT3D-5 actual.

La implementación FT3D-5 en curso debe terminarse y auditarse; después se comparará contra esta referencia y se reutilizará/adaptará en lugar de descartarse.

## 9.3 Narrativa temporal

- Build Time-Lapse;
- Schedule Build.

Pertenecen a una familia temporal/constructiva distinta y permanecen separadas del núcleo actual FT3D.

Su destino natural sigue siendo FT3D-8 o una fase futura equivalente.

---

# 10. Relación con FT3D-5

FT3D-5 ya estaba implementándose cuando se adoptó esta metodología.

Decisión:

1. dejar terminar la implementación/QA contratados;
2. no integrar automáticamente por estar READY;
3. auditar el resultado;
4. compararlo contra `Floor by Floor` y el Reference Atlas;
5. clasificar sus piezas como:
   - reutilizar tal cual;
   - adaptar;
   - sustituir;
6. usarlo como infraestructura para las variantes posteriores.

FT3D-5 aporta previsiblemente infraestructura valiosa:

- transformaciones de niveles;
- lifecycle `active → all → active`;
- rollback transaccional;
- Story reversible;
- framing;
- ownership;
- restoration;
- reduced holds;
- QA y evidencia.

---

# 11. Relación con FT3D-6

El working contract FT3D-6 ya existe en:

```text
docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md
```

Su rama de trabajo actual es:

```text
docs/ft3d-6-working-contract-after-ft3d4
```

FT3D-6 no debe reescribirse desde cero.

La nueva investigación sirve precisamente para resolver/reconciliar sus pendientes sobre FT3D-5 y ampliar su taxonomía.

El modelo probable evoluciona desde:

```text
capability → adapter → scene
```

hacia una estructura capaz de expresar:

```text
presentation family
→ capability
→ variant
→ narrative states/phases
→ adapter
→ Story
```

Ejemplos potenciales:

```text
spatial-decomposition
  ├─ board
  ├─ unfolded-room
  └─ floor-by-floor

section
  ├─ section-sweep
  └─ open-section

elevation
  └─ sunlit-elevation
```

Los perfiles profesionales, resolver semántico, capability snapshot, minimumStory, scopes, overrides, warnings, QA y default «Sin plantilla» siguen siendo activos válidos.

---

# 12. Relación con FT3D-7 y FT3D-8

FT3D-7 debe consumir capacidades de Presentation ya estabilizadas para salidas/share/export. No debe inventar nuevas geometrías o escenas por necesidad de exportación.

FT3D-8 conserva la familia temporal/construcción como dominio separado.

No introducir Build Time-Lapse o Schedule Build dentro de FT3D-5/6 sólo porque comparten estética de presentación.

---

# 13. Licencias y atribución

Antes de copiar código:

1. identificar el repositorio/fuente;
2. comprobar la licencia concreta del código utilizado;
3. registrar qué se reutiliza o adapta;
4. conservar avisos de copyright/licencia cuando corresponda;
5. no inferir derechos de copia porque un repositorio sea público.

`flat-to-3d` y REA declaran MIT en las copias estudiadas.

Otros repos sin licencia explícita compatible sólo se usan como referencia de comportamiento hasta aclarar derechos.

---

# 14. Reglas para ahorrar tokens, créditos y tiempo

1. No pedir a un agente que redescubra un comportamiento ya documentado en el Reference Atlas.
2. Dar timestamps del vídeo y checkpoints concretos.
3. Dar archivos/funciones donantes concretos mediante Donor Code Map.
4. Dar autoridades Rubik destino.
5. Trabajar una variante por vez.
6. Portar bloques probados antes de reescribirlos.
7. Comparar visualmente pronto, no al final.
8. Parar investigación cuando existe evidencia suficiente.
9. No repetir suites largas mientras el código sigue cambiando de forma importante.
10. Generar evidencia final sólo sobre el HEAD definitivo.
11. No regenerar screenshots/videos de todos los casos por cambios irrelevantes; regenerar el conjunto afectado y los gates contractuales.
12. Separar discovery, laboratorio e integración.

---

# 15. Gates de una capacidad esculpida

Una capacidad pasa por estos estados:

```text
REFERENCE IDENTIFIED
→ REA UNDERSTOOD
→ DONOR MAPPED
→ LAB RUNNING
→ VISUAL PARITY CANDIDATE
→ RUBIK ADAPTED
→ QA READY
→ HUMAN REVIEWED
→ INTEGRATED
```

No saltar directamente de «se ve bien en el donor» a `master`.

## Gate de integración

Antes de integración debe cumplirse, según aplique:

- autoridad geométrica Rubik;
- determinismo;
- reversibilidad;
- restore exacto;
- no persistencia accidental;
- no schema change no autorizado;
- mobile;
- reduced motion;
- accesibilidad;
- offline/regresiones;
- evidence manifest ligado al HEAD;
- revisión visual humana;
- obligaciones de licencia.

---

# 16. Invariantes permanentes

Esta metodología es aditiva.

> **FT3D amplía Rubik. No sustituye Rubik.**

> **Todo lo nuevo se suma. Nada de lo existente se elimina sin una decisión expresa de Juanma.**

Por tanto:

- no eliminar rutas, vistas, modos o exports existentes;
- no hacer que una capacidad FT3D sea requisito para usar funciones históricas;
- preservar fallbacks;
- preservar mobile/accessibility/reduced motion;
- no cambiar persistencia/schema sin autorización;
- no convertir Presentation en la autoridad de geometría;
- no introducir falsa precisión.

---

# 17. Próxima secuencia de trabajo

Mientras FT3D-5 termina su QA en su rama actual, esta metodología permanece documental y separada.

Después del handoff de FT3D-5:

```text
1. auditoría FT3D-5
2. Reference Atlas completo de variantes prioritarias
3. REA de preguntas concretas
4. Donor Code Map
5. reconciliación FT3D-5 / referencia
6. Sculpture Lab de la primera variante prioritaria
7. golden-master comparison
8. reconciliación FT3D-6
9. integración por cortes pequeños y auditables
```

No se inicia FT3D-6 de implementación hasta que su working contract haya sido reconciliado con los resultados reales de FT3D-5 y del Reference Atlas.

---

# 18. Resultado esperado de esta metodología

El éxito no es «copiar las siete demos».

El éxito es que Rubik posea una infraestructura reusable capaz de transformar cualquier proyecto compatible en una presentación arquitectónica profesional utilizando técnicas demostradas y adaptadas a su propia verdad geométrica.

Resultado objetivo:

> **un mismo modelo Rubik puede pasar de dibujo técnico a experiencia espacial mediante familias y variantes de presentación reproducibles, reversibles, honestas y de calidad visual comparable a las referencias, sin abandonar las autoridades ni los invariantes del producto.**
