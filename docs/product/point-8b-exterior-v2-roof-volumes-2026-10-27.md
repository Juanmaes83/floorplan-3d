# Punto 8B / Exterior V2 — cubierta y volúmenes exteriores

**Decisión de alcance:** 27-10-2026  
**Estado:** aprobado como trabajo posterior; **NO implementado** por este documento.  
**Predecesor:** 8A / Exterior V1 — fachada y exterior básico.  
**Sucesor:** 8C / Exterior V3 — parcela, terreno y contexto territorial.

## 1. Propósito

El Punto 8B debe hacer que FLOOR PLAN 3D pueda leer el edificio como un volumen exterior coherente por encima de la fachada de 8A: cubierta, petos, retranqueos y cuerpos exteriores derivados de la geometría real del proyecto/edificio.

El objetivo no es construir un generador arquitectónico universal de tejados. El objetivo es cubrir un subconjunto **pequeño, explícito, determinista, editable y comprobable** que aporte valor visual y de presentación sin introducir una segunda verdad geométrica ni una heurística difícil de mantener.

Principio de producto aplicable:

> **Más contexto, no más falsa certeza.**

Una cubierta o un volumen que FLOOR PLAN 3D no pueda justificar con datos existentes o con parámetros explícitos del profesional debe quedar como no disponible, pendiente o requerir entrada explícita; nunca debe inventarse por apariencia.

## 2. Por qué 8B necesita límites estrictos

8B tiene una superficie funcional menor que 8C, pero puede ser más difícil algorítmicamente. El riesgo principal no es la cantidad de UI sino la geometría: huellas no rectangulares, plantas con huellas distintas, retranqueos, cubiertas inferiores expuestas, petos, triangulación, normales, caras internas, materiales y exportación.

Ejemplo de huella no rectangular:

```text
████████
████████
████
████
```

No existe una única cubierta inclinada obvia para esa forma. Elegir automáticamente cumbreras, faldones o encuentros sería una inferencia arquitectónica que no está respaldada por el modelo.

Ejemplo multiplanta:

```text
Planta 1      █████
                ███

Planta 0    █████████
            █████████
```

La diferencia de huellas puede producir terraza, cubierta inferior visible, retranqueo, peto u otra solución. FLOOR PLAN 3D no debe decidir cuál es la solución constructiva sólo a partir de la proyección de las plantas.

**Estimación de planificación, no compromiso:** 8B puede representar aproximadamente un **65–80 % del esfuerzo de 8C** aunque tenga menos integraciones externas. Su coste puede concentrarse en iteraciones de geometría y debugging si se intenta resolver demasiadas tipologías automáticamente.

Por ello, el criterio de éxito de V2 es **reducir el espacio de problemas**, no demostrar que el sistema puede generar cualquier tejado.

## 3. Autoridades existentes que 8B debe reutilizar

8B debe leer, no duplicar, las autoridades existentes:

- `FloorPlanProjectV1` para geometría de cada planta;
- muros, huecos y materiales existentes;
- alturas ya conocidas o declaradas;
- `FloorPlanBuildingV1` para niveles, elevaciones y offsets;
- la raíz del edificio como autoridad de relación entre plantas;
- la representación exterior/fachada cerrada en 8A cuando exista;
- los contratos de persistencia y exportación actuales.

No debe aparecer un segundo edificio independiente del edificio real del proyecto.

La secuencia conceptual es:

```text
proyecto/planta + edificio
          ↓
huellas y alturas demostrables
          ↓
derivación de envolvente / zonas expuestas
          ↓
parámetros de cubierta explícitos cuando proceda
          ↓
mesh exterior 3D
```

No:

```text
edificio real
+
modelo paralelo de tejado/volúmenes que pueda divergir
```

## 4. Alcance V2 obligatorio

### 4.1 Lectura global del edificio

El usuario debe poder comprender el edificio como un conjunto exterior, no únicamente como plantas apiladas.

8B debe respetar:

- orden de niveles;
- `elevationMm`;
- `offsetMm`;
- alturas válidas;
- diferencias de huella entre plantas;
- fachada/huecos de 8A;
- ausencia de afirmaciones estructurales.

### 4.2 Huellas

Antes de generar una cubierta, 8B debe obtener una huella defendible de cada cuerpo o nivel relevante.

La huella debe derivarse de geometría válida, no de bounding boxes salvo que una operación concreta lo documente explícitamente como aproximación visual.

Deben contemplarse:

- polígonos no rectangulares;
- concavidades;
- huecos o geometría insuficiente;
- plantas con huellas diferentes;
- offsets entre niveles.

Si la huella no puede obtenerse de forma estable, la cubierta automática debe degradar a `unavailable`/pendiente o solicitar parámetros explícitos. No debe inventar un polígono simplificado que parezca correcto.

### 4.3 Cubierta plana como base obligatoria

El **mínimo obligatorio y defendible de 8B** es una cubierta plana coherente con la huella soportada.

Debe cubrir:

- superficie superior;
- canto/espesor visual mínimo cuando proceda;
- relación correcta con la fachada;
- zonas de cubierta inferior expuesta por retranqueo de plantas superiores;
- materiales básicos;
- ausencia de caras internas visibles.

No se presume pendiente, drenaje, impermeabilización, composición de capas ni solución normativa.

### 4.4 Petos

Los petos forman parte de V2 únicamente como geometría exterior simple y explícita.

No deben inferirse automáticamente por normativa o por el hecho de existir una terraza/cubierta.

Si se generan o editan, sus parámetros deben ser claros, por ejemplo altura y presencia, y su relación con el borde debe ser determinista.

No se debe afirmar que un peto cumple requisitos de seguridad.

### 4.5 Retranqueos y cubiertas inferiores expuestas

Cuando una planta superior ocupe menos superficie que la inferior, 8B puede derivar qué superficie superior del nivel inferior queda geométricamente expuesta.

Eso no autoriza a etiquetarla automáticamente como terraza transitable.

Debe distinguirse:

- **superficie exterior/cubierta expuesta**: derivación geométrica;
- **terraza/balcón transitable**: sólo si el proyecto lo declara o el modelo aprobado lo permite de forma explícita.

### 4.6 Volúmenes exteriores sencillos

V2 puede representar cuerpos que se deduzcan de niveles, offsets, alturas y huellas existentes.

No debe introducir un modelador libre de masas arquitectónicas en este corte.

El volumen debe seguir siendo una lectura del edificio existente, no una herramienta BIM de diseño volumétrico general.

## 5. Cubiertas inclinadas: soporte deliberadamente limitado

Las cubiertas inclinadas son la principal fuente potencial de explosión algorítmica.

### 5.1 Regla general

**No implementar un algoritmo que intente generar automáticamente una cubierta razonable para cualquier polígono.**

No inferir automáticamente:

- cumbreras;
- limatesas;
- limahoyas;
- encuentros entre múltiples faldones;
- buhardillas;
- mansardas;
- cubiertas curvas;
- soluciones por estética;
- pendientes por clima o normativa.

### 5.2 Tipologías permitidas en V2

Una implementación de 8B puede añadir cubiertas inclinadas únicamente después de que la base plana/retranqueos/volúmenes esté estable y con tests verdes.

Las tipologías iniciales permitidas deben limitarse a casos explícitos y fáciles de validar:

1. **Monopendiente simple** sobre una huella simple soportada, con dirección y pendiente/altura declaradas.
2. **Dos aguas simple** sobre huella rectangular o caso geométrico expresamente soportado, con eje de cumbrera y pendiente/altura declarados.

Estas tipologías no son obligatorias para el primer PR interno de 8B si su inclusión hace crecer de forma desproporcionada el corte. Pueden dividirse en un subcorte posterior dentro de 8B.

### 5.3 Sin inferencia mágica

El profesional debe declarar los parámetros que no estén en el modelo.

Por ejemplo:

```text
roof.kind = flat | mono-pitch | gable
roof.pitchDeg / ridgeHeightMm
roof.direction / ridgeAxis
```

Los nombres y contrato definitivos deben decidirse al auditar el código real; este documento define el principio, no obliga a ese esquema literal.

Un cambio contractual sólo debe introducirse si es necesario y debe mantener compatibilidad, validación, round-trip y documentación.

## 6. Multiplanta y diferencias de huella

`FloorPlanBuildingV1` es la autoridad de niveles. 8B no crea otra lógica de apilado.

Para cada nivel deben respetarse:

- elevación;
- offset;
- altura disponible;
- huella real;
- relación con niveles superior/inferior.

Reglas:

- no asumir que las plantas están alineadas;
- no asumir que una planta superior cubre completamente a la inferior;
- no asumir que un retranqueo es terraza;
- no interpretar falta de coincidencia entre muros como fallo estructural;
- no generar apoyos, pilares o vigas para justificar volúmenes;
- no realizar análisis estructural.

La comparación entre niveles sirve para construir una **envolvente visual coherente**, no para emitir un dictamen de construcción.

## 7. Triangulación y mesh

La geometría 3D debe ser determinista y comprobable.

Requisitos mínimos:

- triangulación estable de polígonos soportados;
- winding consistente;
- normales correctas;
- ausencia de triángulos degenerados;
- ausencia de caras duplicadas;
- evitar caras internas cuando dos volúmenes se solapan o contactan y su eliminación sea demostrable;
- tolerancias centralizadas, no números mágicos dispersos;
- resultados reproducibles con el mismo input.

No escribir un triangulador general propio si Three.js o una utilidad ya aprobada del repositorio resuelve el caso de forma suficiente y compatible.

Las optimizaciones de mesh no deben cambiar la geometría contractual ni introducir aproximaciones silenciosas.

## 8. Caras interiores y encuentros

Evitar caras interiores es un objetivo visual/rendimiento, pero no debe provocar un motor booleano general dentro de V2.

Prioridad:

1. construir sólo las superficies necesarias cuando la relación entre niveles sea simple y demostrable;
2. eliminar caras coincidentes sólo con reglas deterministas y tolerancias documentadas;
3. si un encuentro complejo requiere CSG/booleanos generales o heurísticas frágiles, mantener las geometrías separadas antes que introducir un sistema difícil de validar.

Un artefacto visual menor y documentado es preferible a una topología aparentemente limpia obtenida con una inferencia no fiable.

## 9. Materiales

Reutilizar la infraestructura de materiales existente y la semántica establecida por 8A.

8B puede distinguir, cuando sea útil y explícito:

- material de cubierta;
- material de peto;
- material exterior de volumen.

No modelar capas constructivas, aislamiento, estructura de cubierta ni propiedades térmicas.

Ausencia de material específico debe producir un fallback visual claramente definido, no datos constructivos inventados.

## 10. Persistencia

No persistir meshes derivados.

Preferencia:

```text
parámetros mínimos editables
        +
geometría fuente existente
        ↓
mesh derivado en runtime
```

Si se introducen parámetros de cubierta deben:

- estar versionados cuando afecten a contrato;
- validar rangos y combinaciones;
- conservar documentos antiguos;
- soportar JSON/ZIP round-trip;
- no migrar proyectos automáticamente sólo por abrirlos;
- distinguir explícito de derivado.

## 11. Renderer Three.js

8B debe integrarse con el renderer existente sin crear otro renderer exterior.

Comprobar:

- z-fighting;
- normales;
- sombras/iluminación actuales;
- transparencia si existe;
- clipping/modos de planta;
- selección;
- cámaras;
- presentación;
- Solar;
- captura PNG.

No modificar matemáticas solares para adaptar la cubierta. Solar consume geometría/renderizado, pero 8B no convierte Solar en estudio de sombras reglamentario.

## 12. Cámaras y presentación

8B debe preservar las cámaras y recorridos existentes.

Una cubierta no debe:

- tapar de forma irreversible la edición interior;
- romper los modos de visualización por planta;
- invalidar encuadres existentes;
- romper presentación de una planta o edificio;
- cambiar el proyecto por el mero hecho de presentar/capturar.

Puede ser necesario un modo de visibilidad exterior/interior o una regla de ocultación, pero debe reutilizar patrones existentes y tener tests.

No añadir un sistema cinematográfico específico de exterior dentro de V2 salvo decisión separada.

## 13. Exportación y Blender

8B debe auditar los exportadores existentes antes de decidir alcance.

Regla de compatibilidad:

- no romper exportaciones actuales;
- una exportación que no soporte la nueva cubierta debe declarar la omisión de forma honesta;
- no presentar un archivo parcial como si incluyera toda la envolvente;
- añadir soporte Blender/GLB sólo si el contrato actual permite hacerlo sin convertir 8B en un proyecto paralelo.

Blender es un consumidor posible, no la autoridad de geometría.

## 14. Casos explícitamente fuera de V2

Salvo decisión posterior, quedan fuera:

- generador universal de tejados;
- cubiertas complejas multipolígono automáticas;
- limatesas/limahoyas arbitrarias;
- buhardillas;
- mansardas;
- cubiertas curvas;
- lucernarios complejos;
- detalles constructivos;
- canalones y bajantes como sistema;
- estructura de cubierta;
- cálculo de cargas;
- cumplimiento normativo;
- impermeabilización/aislamiento;
- cálculo energético;
- drenaje;
- terreno;
- parcela;
- Catastro;
- IGN/CNIG/PNOA;
- edificios vecinos/contexto territorial;
- CSG general si sólo se introduce para resolver encuentros de cubierta.

Terreno/parcela/contexto pertenecen a 8C.

## 15. Estrategia de implementación recomendada

Para reducir debugging, consumo de contexto y gasto de tokens de agentes, 8B debe poder dividirse internamente en PR pequeños sin cambiar la numeración de producto:

### 8B-A — envolvente superior y cubierta plana

- auditoría de huellas;
- derivación de superficies superiores;
- cubierta plana;
- retranqueos;
- materiales;
- tests una/multiplanta.

### 8B-B — petos y volúmenes exteriores simples

- petos explícitos;
- continuidad visual de volúmenes;
- caras internas simples;
- interacción con fachada 8A.

### 8B-C — inclinadas simples, sólo si está justificado

- monopendiente simple;
- dos aguas simple;
- parámetros explícitos;
- casos soportados cerrados;
- ningún solver general.

La denominación de ramas/PR puede variar. Lo importante es conservar la secuencia de riesgo.

Un agente no debe implementar 8B-C por adelantado mientras 8B-A/B no estén estables sólo porque resulte cómodo tocar la misma función.

## 16. Fixtures mínimos

Usar datos sintéticos y geometrías deliberadamente asimétricas.

Casos mínimos:

1. rectángulo de una planta;
2. huella en L;
3. polígono cóncavo soportado;
4. dos plantas con la misma huella;
5. dos plantas con retranqueo;
6. dos plantas con offset;
7. planta superior parcialmente fuera de la proyección inferior, si el contrato actual permite ese edificio;
8. huecos de fachada bajo cubierta;
9. cubierta sin material específico;
10. parámetros de cubierta inválidos;
11. documento antiguo sin configuración de cubierta.

Los fixtures deben permitir distinguir visual y numéricamente orientación, lados y niveles para evitar tests que pasen por simetría accidental.

## 17. Tests obligatorios

### Geometría pura

- huella estable;
- área esperada;
- triangulación;
- winding/normales;
- no degenerados;
- no duplicados evidentes;
- retranqueos;
- offsets;
- niveles diferentes;
- determinismo.

### Cubierta plana

- rectángulo;
- L/concavidad soportada;
- varias plantas;
- superficies inferiores expuestas;
- material/fallback.

### Petos

- presencia/ausencia explícita;
- altura válida/inválida;
- borde correcto;
- no inferencia normativa.

### Inclinadas, si se implementan

- sólo casos documentados;
- parámetros explícitos;
- rechazo/degradación de huella no soportada;
- ninguna salida silenciosa para un caso complejo.

### Renderer/browser

- 2D/3D siguen operativos;
- visibilidad interior/exterior;
- cámaras;
- presentación;
- PNG;
- Solar;
- multiplanta.

### Persistencia/exportación

- JSON/ZIP round-trip cuando exista configuración persistente;
- compatibilidad de documentos antiguos;
- exportadores no afectados o limitación explícita;
- Blender/GLB sólo si se toca.

### Regresiones

Ejecutar las suites existentes relevantes de proyecto, building, renderer, materials, openings, presentation, Solar, import/export y cualquier contrato afectado.

## 18. Criterios de aceptación

8B se considera cerrado únicamente cuando:

1. la lectura global exterior del edificio es coherente;
2. existe cubierta plana defendible para los casos soportados;
3. las diferencias de huella entre plantas se representan sin inventar usos;
4. elevaciones y offsets provienen de `FloorPlanBuildingV1`;
5. no existe un segundo modelo de edificio;
6. petos, si existen, son explícitos y no normativos;
7. las cubiertas inclinadas, si se incluyen, se limitan a una matriz de casos documentada;
8. un caso no soportado falla/degrada de forma honesta en lugar de generar geometría plausible pero inventada;
9. triangulación, normales y materiales son estables;
10. no hay regresiones en edición, Presentación o Solar;
11. persistencia sigue siendo compatible;
12. exportación declara con precisión qué incluye;
13. no se introduce terreno/contexto de 8C;
14. tests específicos y regresiones están verdes;
15. la documentación final enumera exactamente tipologías soportadas y no soportadas.

## 19. Instrucción para Codex/agentes

Antes de implementar 8B:

1. leer `docs/product/current-status-2026-10-27.md`;
2. verificar el HEAD real de `master`;
3. leer el cierre real de 8A;
4. leer este documento completo;
5. auditar `FloorPlanProjectV1`, `FloorPlanBuildingV1`, renderer, materiales, presentación y exportadores actuales;
6. proponer el corte mínimo que satisfaga 8B-A antes de ampliar tipologías;
7. no implementar un solver general de cubiertas;
8. no adelantar 8C;
9. no ampliar contratos por comodidad del renderer;
10. detener una tipología automática si requiere heurísticas no demostrables y convertirla en parámetro explícito o caso no soportado.

La respuesta final de cualquier implementación 8B debe indicar:

- tipologías exactas soportadas;
- tipologías rechazadas/no soportadas;
- autoridad de cada dato;
- parámetros explícitos añadidos;
- archivos modificados;
- tests y resultados;
- limitaciones visuales/topológicas;
- impacto en exportadores;
- HEAD exacto y CI.

## 20. Relación con 8A y 8C

```text
8A / Exterior V1
fachada + materiales + huecos + exterior básico
        ↓
8B / Exterior V2
cubierta + petos + retranqueos + volúmenes
        ↓
8C / Exterior V3
parcela + terreno + contexto territorial
```

8B debe construirse sobre el edificio que FLOOR PLAN 3D ya conoce. No necesita `FloorPlanGeoProvider`, Catastro, IGN/CNIG ni PNOA.

`FloorPlanGeoProvider` vuelve a ser relevante en 8C, donde la plataforma puede normalizar fuentes territoriales sin acoplar Exterior a un proveedor concreto.

## 21. Regla final de control de complejidad

Cuando existan dos opciones:

- una solución automática que parece funcionar en muchos casos pero requiere heurísticas difíciles de demostrar;
- una solución más limitada, explícita y testeable;

**8B debe elegir la segunda.**

El objetivo de V2 no es impresionar con la cantidad de tejados que genera. Es establecer una base geométrica exterior estable sobre la que el producto pueda crecer sin pagar después una deuda de topología, compatibilidad y debugging desproporcionada.
