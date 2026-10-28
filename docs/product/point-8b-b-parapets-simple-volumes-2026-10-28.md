# Punto 8B-B — petos declarados y volúmenes exteriores simples (candidato)

**Base:** `master` `7dc8b41aa21a37ebbb59ccf4855a2f4cbaf5ba4d`, que fusionó 8B-A por PR #124; 8A ya estaba integrado por PR #121. El estado canónico anterior describe la situación histórica previa a esos merges. **Alcance:** sólo 8B-B; 8B completo no se cierra.

## Autoridad y persistencia

`FloorPlanExteriorVolumes` consume el resultado de `FloorPlanRoof` de 8B-A. No vuelve a recorrer muros, normalizar huellas, calcular offsets ni diferencias entre plantas. La autoridad durable sigue siendo `FloorPlanProjectV1` y, cuando hay dos plantas, `FloorPlanBuildingV1` (`elevationMm`, `offsetMm`, `order`). El resultado conceptual puro contiene `volumes` y `parapets`, sin objetos Three.js. No se persiste geometría derivada: **derived geometry not persisted**.

El único campo nuevo es `levels[].project.roofParapet` o `project.roofParapet` en un proyecto suelto, opcional desde versión 1.8.0: `{enabled:boolean,heightMm?:integer,materialId?:materialId}`. La presencia es una decisión explícita; `enabled:false` expresa rechazo explícito. Con `enabled:true` se exige `heightMm` entre 100 y 3000 mm. La UI no introduce altura predeterminada: la persona la escribe en Propiedades → «Peto visual declarado». `materialId` opcional apunta a material mural existente. No hay parámetros nuevos en la raíz del edificio. Abrir 1.0–1.7 no crea el campo ni eleva versión; editarlo sí eleva a 1.8.0. JSON y ZIP editables conservan la declaración, no las caras.

Ningún peto se infiere de cubierta, retranqueo, terraza o balcón. No hay afirmación de seguridad, cumplimiento normativo, resistencia ni solución constructiva.

## Geometría derivada y visualización

Cada volumen simple reutiliza la huella canónica de 8B-A en **coordenadas del edificio**. `zBottom` es la elevación de suelo del nivel (0 en proyecto suelto); `zTop` es la cota superior uniforme que 8B-A demostró. Si faltan cotas, la altura no es positiva o dos cuerpos se solapan verticalmente, el resultado es `unavailable`. Un voladizo se representa como relación geométrica, sin añadir apoyos.

Para la cubierta superior, el peto declarado sigue todo su perímetro demostrado. Para celdas inferiores expuestas por un retranqueo, sólo se usan porciones que coinciden con el **borde exterior de la huella inferior**; se excluyen costuras entre celdas y el borde interior contra el cuerpo superior. No se usan CSG ni reparaciones topológicas. Una diferencia no ortogonal que 8B-A declara no disponible sigue no disponible. El peto se dibuja como cara vertical de altura exacta, sin inventar grosor o albardilla; el volumen se visualiza mediante aristas de un prisma `ExtrudeGeometry`, evitando duplicar superficies opacas de las fachadas de 8A.

«Exterior» sigue siendo el único control. En órbita muestra cubierta, petos declarados y aristas de cuerpos demostrables; al apagarlo, los oculta. Recorrer y Presentación los ocultan para mantener el interior accesible; al salir se restaura el estado previo. PNG y captura de entrega reflejan la visibilidad del renderer. El material mural declarado aporta color al peto; sin él se usa un **fallback visual neutro**, sin presumir composición constructiva. La escena se reconstruye con la arquitectura, no en cada frame.

## Cobertura de exportación

| Exportador | Incluye 8B-B | Límite |
|---|---|---|
| PNG 3D y captura de entrega | Sí, si «Exterior» está visible | Imagen del renderer, sin geometría editable |
| JSON/ZIP editables de proyecto y edificio | Sólo la intención `roofParapet` | Huellas, caras y mallas se derivan al abrir |
| GLB/paquete Blender offline (`scripts/interop/export.cjs`) | No | Consume `FloorPlanProjectV1` independiente y genera su propia escena; no es exportación exterior completa ni edificio multipiso |
| Exportación de una planta desde edificio | Sólo la declaración de esa planta | Omite relación, offsets y otras plantas según el contrato existente |
| Exportación de predicciones crudas de muros | No | Formato de análisis de trazos, ajeno a la escena |

## Casos y límites

Se admiten cubiertas rectangulares, L/U y concavidades simples aceptadas por 8B-A; una planta; dos plantas con huellas iguales, retranqueo ortogonal, offsets y solape parcial/voladizo geométrico. Cada nivel conserva su propia cota demostrada y su decisión de peto. Altura inválida o material no mural se rechazan. Fachada abierta, múltiples cuerpos o huecos internos no soportados siguen `unavailable` desde 8B-A. No hay volumen freeform, elemento curvo, pilar, viga, barandilla calculada, editor de masas, solver de cubiertas inclinadas ni CSG. La línea de prisma es una lectura visual, no una prueba de apoyo estructural.

Tests puros: `tests/exterior-volumes.test.cjs`; regresión permanente Chromium: `tests/exterior-volumes.browser.test.cjs`, incorporada al workflow de browser existente. Capturas locales: [una planta con peto](../qa/point-8b-b-one.png) y [dos plantas con retranqueo](../qa/point-8b-b-two.png). Verificación local: 10/10 casos puros 8B-B; suite no-browser 525 PASS, 0 FAIL, 2 SKIP opcionales (527 total); esquemas Python 13/13; batería Chromium de captura, Solar, ficha de superficies y 8B-B 24/24; `node --check` y `git diff --check` sin errores. CI y preview del SHA publicado se consignan en la PR.

8B-C conserva únicamente la evaluación posterior de cubiertas inclinadas simples con parámetros explícitos. 8C conserva parcela, terreno y contexto territorial.
