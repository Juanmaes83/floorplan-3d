# Punto 6 — orientación, ubicación, solar orientativo y puerta de entrada territorial

**Fecha de decisión:** 27-10-2026  
**Estado:** alcance de producto aprobado por Juanma; documento de handoff para implementación posterior.  
**Base documental anterior:** `docs/product/approved-next-capabilities-2026-10-25.md`, Punto 6 y decisiones D-11/D-12.  
**Base de código al redactar este documento:** `master@2f6a7583a0f3d65238e1de2903f40fdd20cbe4a2`, después del cierre del Punto 5 (#104).  
**Relación con otros puntos:** el Punto 6 se simplifica deliberadamente; la infraestructura geográfica que nace aquí debe quedar preparada para reutilizarse especialmente en el Punto 8 — Exterior V1/V2/V3. No sustituye ni renumera el Punto 8.

---

## 0. Resumen ejecutivo

El Punto 6 deja de plantearse como un proyecto solar avanzado. La decisión de producto es priorizar una experiencia **simple, comprensible y honesta** que aporte orientación y contexto sin consumir esfuerzo desproporcionado en precisión astronómica o simulación física que no es diferencial para los públicos iniciales.

El corte se divide en cuatro piezas:

1. **6A — Orientación básica:** norte configurable, visible y persistente.
2. **6B — Ubicación:** latitud, longitud y zona horaria IANA; entrada manual en el primer corte y arquitectura preparada para fuentes externas.
3. **6C — Solar orientativo:** posición solar aproximada con una librería madura, preferentemente SunCalc, aplicada a la iluminación 3D existente con el cambio mínimo posible.
4. **6D — Infraestructura geográfica:** definir `FloorPlanGeoProvider` como frontera estable entre Rubik y fuentes territoriales externas. El primer proveedor funcional del producto puede ser manual; España será el primer país objetivo para integración territorial real mediante Catastro/IGN/CNIG/PNOA cuando el corte correspondiente lo justifique.

La decisión clave es que **no se busca precisión científica, energética ni normativa**. Se busca responder de forma útil a preguntas humanas como:

- ¿Dónde está el norte respecto a esta vivienda?
- ¿Cómo está orientada la distribución?
- ¿De qué lado vendría aproximadamente el sol a esta hora y época del año?
- ¿Qué ubicación/contexto conocido alimenta esa visualización?

La plataforma debe ser capaz de mostrar de dónde salen los datos y qué nivel de certeza tienen, pero no debe presentarse como certificador.

---

# 1. Público, problema y valor de producto

## 1.1 Públicos prioritarios

Se conserva la decisión D-01 ya documentada en el proyecto:

- inmobiliarias;
- promotoras;
- estudios de arquitectura;
- como segundo público, profesionales de reformas e interiorismo;
- cliente final como receptor de presentación y comprensión del inmueble.

## 1.2 Problema real que resuelve el Punto 6

Para estos públicos, el valor no está en disponer de una simulación solar científica. El valor está en que el inmueble deje de ser un objeto abstracto y pueda entenderse con una referencia espacial sencilla:

- norte;
- orientación;
- ubicación;
- fecha/hora;
- incidencia solar aproximada;
- fuente de los datos cuando exista.

## 1.3 Lo que NO debe convertirse en objetivo

No invertir el corte en:

- simulación de radiación solar;
- irradiancia en W/m²;
- cálculo energético;
- pérdidas o ganancias térmicas;
- horas de soleamiento normativo;
- estudios de sombras reglamentarios;
- certificación energética;
- cumplimiento urbanístico;
- cálculo de luna, fases lunares o efemérides sin utilidad directa;
- motor climático;
- análisis anual científico;
- precisión submétrica de geolocalización cuando no sea necesaria;
- sustitución del renderer actual por una arquitectura nueva solo para obtener una luz solar más sofisticada.

Si alguno de estos puntos se considera en el futuro, debe abrirse como capacidad separada con demanda demostrada.

---

# 2. Principios obligatorios

## P6-01 — La vivienda sigue siendo protagonista

La orientación y el sol son ayudas de comprensión. No deben convertir la interfaz en una consola astronómica ni desplazar las tareas principales de diseñar, revisar y presentar la vivienda.

## P6-02 — Separar presentación y solar

Debe existir una distinción inequívoca entre:

- **Iluminación de presentación:** busca una imagen agradable, estable y comprensible.
- **Solar orientativo:** busca relacionar una dirección de luz aproximada con ubicación, fecha, hora y orientación.

Entrar en solar no debe reescribir permanentemente la configuración visual de presentación.

## P6-03 — No prometer exactitud total

La experiencia debe explicar que la posición y las sombras son orientativas y dependen de los datos introducidos, la geometría disponible y las limitaciones del renderer.

Texto mínimo equivalente en la UI:

> Visualización solar orientativa basada en los datos disponibles. No constituye un estudio de soleamiento, certificación energética ni verificación normativa.

Debe existir en ES/EN/ZH cuando el Punto 6 llegue a UI pública.

## P6-04 — No inferir lo que no se conoce

No adivinar silenciosamente:

- norte;
- coordenadas;
- dirección postal;
- zona horaria;
- orientación de fachada;
- precisión de la fuente;
- procedencia territorial.

Cuando falte un dato, mostrarlo como no configurado/no disponible.

## P6-05 — Guardar y publicar son decisiones distintas

Se reafirma D-11:

- Rubik puede almacenar una ubicación interna suficientemente precisa cuando el profesional la introduce o la obtiene de una fuente autorizada.
- Esa precisión interna puede servir al cálculo solar y a funciones territoriales.
- No se publica automáticamente al cliente.
- Dirección, coordenadas exactas, precio, contacto o referencia catastral no deben aparecer en una entrega por el mero hecho de existir internamente.

## P6-06 — El núcleo no conoce proveedores territoriales concretos

El cálculo solar debe consumir datos normalizados, no llamar directamente a Catastro, Google Maps, IGN o cualquier otro servicio.

## P6-07 — Fallo externo ≠ fallo del proyecto

Si una fuente territorial no responde, cambia su API o está fuera de cobertura, el proyecto debe seguir abriendo y trabajando. La ubicación manual debe seguir siendo suficiente para el solar V1.

---

# 3. Alcance funcional por cortes

## 3.1 6A — Orientación básica

### Objetivo

Que cualquier proyecto pueda declarar de forma explícita cómo se relaciona su plano con el norte.

### Requisitos

- `northOffsetDeg` o representación equivalente persistente.
- Norte configurable por el profesional.
- Indicador visual de norte en 2D.
- El indicador no debe obstaculizar selección, cotas ni herramientas principales.
- Debe funcionar en proyecto de una planta y edificio multiplanta.
- En edificio multiplanta, la orientación debe tener una regla única y explícita. Preferencia inicial: orientación del edificio/proyecto compartida por las plantas salvo evidencia de que el contrato actual exige otra cosa.
- Cambiar la orientación no rota destructivamente la geometría del proyecto salvo que se diseñe expresamente esa operación. El primer corte debe preferir un **offset lógico de norte**.
- Persistencia en guardar/cargar/exportar/importar.
- Proyecto legacy sin orientación: estado `not-configured`; no asumir norte = arriba como dato real, aunque la UI pueda usar arriba como referencia visual neutra.

### UI mínima

- control para indicar norte;
- lectura en grados opcional para profesional;
- representación gráfica simple;
- acción clara para restablecer a “sin configurar” cuando el contrato lo permita.

### Fuera de alcance

- brújula física del dispositivo;
- geolocalización automática;
- inferencia a partir de ortofoto;
- detectar la orientación por una fachada dibujada.

---

## 3.2 6B — Ubicación y zona horaria

### Objetivo

Guardar los datos mínimos que permiten contextualizar la vivienda y construir un instante solar coherente.

### Datos mínimos

- `latitude`;
- `longitude`;
- `timeZone` usando identificador IANA, por ejemplo `Europe/Madrid`;
- procedencia del dato cuando se conozca;
- precisión/estado cuando proceda;
- marca temporal de recuperación de una fuente externa cuando proceda.

### Decisión sobre zona horaria

No persistir únicamente un offset como `UTC+1`.

Persistir preferentemente un identificador IANA porque:

- expresa reglas de horario de verano;
- evita que un proyecto quede atado al offset observado un día concreto;
- permite construir correctamente fecha/hora local cuando cambian las reglas estacionales;
- es una representación interoperable ampliamente soportada por JavaScript moderno mediante `Intl.DateTimeFormat`.

Un offset puntual puede derivarse para cálculo o presentación, pero no debe ser la fuente primaria de verdad.

### Entrada manual V1

El primer corte no depende de servicios externos.

Debe ser posible introducir:

- latitud;
- longitud;
- zona horaria IANA.

La UI puede añadir ayudas de validación, pero no debe bloquear el flujo por no disponer de mapa.

### Validaciones mínimas

- latitud: rango válido;
- longitud: rango válido;
- zona IANA reconocida por el entorno soportado;
- datos incompletos: estado `incomplete` o equivalente;
- no convertir cadenas vacías en coordenadas 0/0;
- no usar 0/0 como fallback silencioso.

---

## 3.3 6C — Solar orientativo

### Objetivo

Mostrar de forma aproximada y comprensible la dirección solar para una combinación de:

- ubicación;
- fecha;
- hora local;
- zona horaria;
- orientación/norte del proyecto.

### Librería preferente

**SunCalc** como candidato A para producción V1.

Repositorio disponible bajo la cuenta de Juanma:

`Juanmaes83/suncalc-A-tiny-JavaScript-library-for-calculating-sun-moon-positions-and-phases.`

Estado revisado el 27-10-2026:

- paquete `suncalc` versión `2.1.1` en el fork/repo disponible;
- ESM y CommonJS;
- sin dependencias runtime declaradas;
- licencia BSD permisiva;
- se debe conservar copyright/licencia original de Volodymyr Agafonkin según sus términos.

### Alternativa / referencia

`Juanmaes83/nrel-spa`.

Uso preferente inicial:

- referencia secundaria de validación;
- comparación de casos de prueba;
- posible proveedor futuro si se demuestra una necesidad de precisión superior.

Estado de licencia revisado el 27-10-2026:

- wrapper MIT;
- incluye aviso de terceros del Solar Position Algorithm de NREL;
- cualquier incorporación debe conservar los avisos aplicables;
- no usarlo solo por ser “más técnico” si SunCalc cubre el objetivo de producto.

### Regla de implementación

No reimplementar fórmulas astronómicas desde cero salvo que exista una razón técnica demostrable y documentada.

### API interna objetivo

Nombre orientativo; el implementador puede adaptar estilo al repositorio:

```js
FloorPlanSolar.position({
  latitude,
  longitude,
  timeZone,
  localDate,
  localTime,
  northOffsetDeg
})
```

Salida conceptual:

```js
{
  status: 'available' | 'unavailable',
  azimuthDeg,
  altitudeDeg,
  aboveHorizon,
  projectAzimuthDeg,
  sceneDirection,
  source: 'suncalc',
  assumptions: []
}
```

### Reglas de salida

- Si faltan ubicación o fecha/hora válidas: no inventar resultado.
- Si el sol está bajo el horizonte: indicarlo; no colocar una “luz solar real” desde una posición imposible solo para que se vea bonito.
- La iluminación artística puede permanecer disponible en modo Presentación.
- `sceneDirection` debe ser una adaptación explícita al sistema de coordenadas real de la escena, no una fórmula copiada sin validar.

### Precisión objetivo

**Suficiente para comprensión visual**, no precisión pericial.

Los tests deben priorizar:

- dirección coherente;
- cambios consistentes mañana/mediodía/tarde;
- cambios estacionales visibles;
- hemisferios norte/sur;
- noche/día;
- rotación por `northOffsetDeg`;
- correcta interpretación de zona horaria.

No establecer tolerancias extremadamente estrictas que conviertan un detalle astronómico irrelevante para el producto en un bloqueo del corte.

---

## 3.4 Integración 3D — política de cambio mínimo

### Decisión

No reemplazar el sistema de iluminación actual por una arquitectura nueva solo para el Punto 6.

### Auditoría obligatoria antes de código

El implementador debe fijar por escrito, sobre el SHA base:

1. versión real de Three.js o equivalente;
2. cómo se carga Three.js;
3. renderer real (`WebGLRenderer` u otro);
4. luces actuales de la escena;
5. qué luz produce sombras;
6. configuración de `shadowMap`;
7. controles actuales de día/noche o luz de presentación;
8. cómo se guarda/restaura la iluminación durante Presentación/Recorrer/capturas/vídeo;
9. cómo se comporta el edificio multiplanta;
10. qué pruebas existentes protegen cámara, luz, presentación y capturas.

### Regla sobre `DirectionalLight` / `SunLight`

No migrar a un objeto o addon nuevo solo por su nombre o por existir en versiones modernas de Three.js.

Si la escena actual utiliza una luz direccional compatible con sombras y permite mover su dirección, el primer corte debe preferir reutilizarla.

Solo introducir una luz/renderer distinto si:

- existe un defecto reproducible que la solución actual no puede cubrir;
- hay evidencia de compatibilidad con la versión real de Three.js;
- las regresiones en presentación/recorrido/capturas quedan medidas;
- se documenta por qué el cambio es necesario.

### Sombra “suficientemente buena”

El objetivo no es una simulación físicamente exacta.

Aceptable para V1:

- dirección de luz coherente con el sol aproximado;
- sombra estable y legible si la arquitectura actual la soporta;
- rendimiento razonable;
- no romper el aspecto de Presentación.

No bloquear V1 por:

- cascaded shadow maps;
- sombras de gran extensión exterior;
- penumbra físicamente correcta;
- corrección atmosférica visual;
- cielo físico;
- HDR dinámico por clima.

---

# 4. 6D — FloorPlanGeoProvider

## 4.1 Decisión estratégica

Crear una frontera técnica estable para que Floor Plan 3D pueda consumir datos territoriales sin acoplar su núcleo a un país, organismo o API concreta.

Nombre conceptual aprobado:

`FloorPlanGeoProvider`

Puede cambiar de nombre si el estilo del repositorio lo exige, pero debe conservar la separación de responsabilidades.

## 4.2 Responsabilidades

La capa debe permitir, cuando un proveedor lo soporte:

```js
search()
getParcel()
getGeometry()
getCoordinates()
getSourceMetadata()
```

No todos los proveedores tienen que implementar todas las capacidades.

La API real debe declarar capacidades para evitar falsos supuestos:

```js
capabilities: {
  search: true,
  parcel: true,
  geometry: true,
  coordinates: true,
  orthophoto: false,
  elevation: false
}
```

## 4.3 Modelo normalizado conceptual

```js
{
  providerId,
  countryCode,
  sourceName,
  sourceUrl,
  retrievedAt,
  licenseNotice,
  location: {
    latitude,
    longitude,
    timeZone
  },
  parcel: {
    sourceId,
    reference,
    geometry,
    geometryCrs,
    area,
    use
  },
  confidence: 'official-source' | 'user-entered' | 'derived' | 'unknown'
}
```

No adoptar estos nombres literalmente sin revisar contratos existentes. Son un **contrato conceptual** para la implementación.

## 4.4 Separación entre dato fuente y dato de proyecto

El proveedor devuelve datos territoriales.

El proyecto decide qué persiste.

No guardar respuestas completas de APIs por defecto. Persistir solo:

- datos necesarios para la función;
- procedencia;
- identificador de fuente cuando sea útil;
- geometría o coordenadas si son parte del proyecto;
- metadatos mínimos de trazabilidad.

Esto reduce:

- dependencia de formatos externos;
- riesgo de privacidad;
- tamaño de archivo;
- problemas de licencia/redifusión;
- roturas si cambia la API.

## 4.5 Proveedor manual

Debe existir siempre un proveedor lógico/manual equivalente:

`FloorPlanGeoProvider.Manual`

Responsabilidad:

- aceptar lat/lon/timezone introducidos por el profesional;
- marcar procedencia `user-entered`;
- no depender de red;
- permitir que Punto 6 funcione fuera de España y cuando los proveedores oficiales no estén disponibles.

---

# 5. España como Proveedor 1 territorial

## 5.1 Decisión

España será el primer país objetivo para una integración territorial real porque:

- existe Catastro con servicios de datos no protegidos;
- existen servicios INSPIRE de cartografía catastral;
- IGN/CNIG ofrecen información geográfica reutilizable;
- PNOA ofrece ortofoto y productos LiDAR/MDT;
- es un mercado natural para la primera validación del producto;
- permite desarrollar y probar la abstracción con fuentes oficiales antes de abrir otros países.

## 5.2 Catastro — uso potencial

Fuentes oficiales consultadas el 27-10-2026 indican disponibilidad de:

- servicios de consulta de datos catastrales no protegidos;
- servicios WMS de cartografía;
- servicios INSPIRE de cartografía catastral;
- descargas y consultas de información no protegida.

La Sede Electrónica distingue datos no protegidos de datos protegidos.

### Datos que Rubik puede valorar

Según disponibilidad, licencia y endpoint concreto:

- referencia catastral;
- localización;
- parcela;
- geometría;
- superficie;
- uso/destino no protegido;
- metadatos de fuente.

### Datos que Rubik NO necesita para estos puntos

- nombre del titular;
- NIF/CIF del titular;
- valor catastral;
- otros datos personales/protegidos.

No diseñar el producto para solicitarlos ni almacenarlos.

## 5.3 IGN / CNIG

El Centro de Descargas del CNIG publica información geográfica reutilizable y gratuita, con condiciones de atribución indicadas por el propio organismo, y ofrece servicios para integración en aplicaciones de terceros.

Productos potencialmente útiles para fases posteriores:

- cartografía;
- ortofotos;
- modelos digitales del terreno;
- nubes de puntos LiDAR;
- otras bases geográficas.

## 5.4 PNOA

PNOA/PNOA-LiDAR puede aportar, cuando el producto llegue a necesitarlo:

- ortofotografía;
- contexto visual real;
- modelos de terreno/superficie;
- nubes LiDAR;
- clases derivadas relacionadas con suelo, edificios, cubiertas y otros elementos según cobertura/producto.

### Regla

No incorporar LiDAR al Punto 6.

LiDAR/MDT/ortofoto son insumos candidatos del Punto 8 V3 o de investigaciones específicas. No deben inflar el corte solar.

---

# 6. Internacionalización territorial

## 6.1 Principio

No crear un “Catastro España” incrustado por todo el código.

Arquitectura objetivo:

```text
Floor Plan 3D
     |
     v
FloorPlanGeoProvider
     |
     +-- Manual
     +-- Spain / Catastro + IGN/CNIG + PNOA
     +-- France / proveedor futuro
     +-- Germany / proveedor futuro
     +-- ...
```

## 6.2 Europa / INSPIRE

INSPIRE constituye una base de interoperabilidad útil, incluyendo el tema de parcelas catastrales, pero no se debe asumir que todos los países:

- ofrecen los mismos atributos;
- exponen la misma API;
- tienen la misma licencia;
- tienen la misma cobertura;
- tienen la misma calidad/actualización;
- permiten la misma redistribución.

`FloorPlanGeoProvider` debe normalizar capacidades sin fingir uniformidad.

## 6.3 Regla de expansión

No implementar proveedores de países sin demanda.

Secuencia:

1. España.
2. Medir uso y valor.
3. Elegir el siguiente país por necesidad comercial real.
4. Auditar organismo, API, licencia, privacidad, calidad y cobertura de ese país.
5. Implementar un nuevo adaptador sin modificar el núcleo solar/exterior salvo necesidad justificada.

---

# 7. Relación con Google Maps y decisión D-12

D-12 había establecido Google Maps como proveedor objetivo si se incorporaba mapa/geocodificación.

Este documento **no invalida automáticamente D-12**, pero aclara responsabilidades:

- `FloorPlanGeoProvider` es una abstracción de datos territoriales del producto.
- Google Maps, si se incorpora, puede ser un proveedor de búsqueda/geocodificación/mapa.
- Catastro/IGN/PNOA son fuentes territoriales oficiales con otros tipos de datos y no son equivalentes funcionales a Google Maps.
- Punto 6 V1 no depende de Google Maps.
- Antes de cualquier Google Maps activo deben revisarse coste, API, claves, condiciones y privacidad, como ya exige D-12.

Si en implementación aparece una contradicción real entre D-12 y esta arquitectura multiproveedor, documentarla como decisión de producto antes de modificar el contrato.

---

# 8. Contrato de proyecto — requisitos, no solución cerrada

## 8.1 No inventar el contrato sin auditoría

Antes de cambiar schema/versiones, revisar:

- versión vigente del proyecto;
- reglas de compatibilidad V1;
- `FloorPlanBuildingV1`;
- persistencia por proyecto/planta/edificio;
- exportación/importación;
- paquetes ZIP;
- proyectos legacy;
- futuras versiones desconocidas.

## 8.2 Datos que probablemente requieren persistencia

Conceptualmente:

```json
{
  "orientation": {
    "northOffsetDeg": 0
  },
  "location": {
    "latitude": 0,
    "longitude": 0,
    "timeZone": "Europe/Madrid",
    "source": {
      "type": "user-entered"
    }
  }
}
```

Esto **no es todavía un schema aprobado literal**.

El implementador debe proponer el diff mínimo y justificar:

- ubicación a nivel proyecto vs edificio;
- orientación a nivel proyecto vs edificio;
- compatibilidad multiplanta;
- si requiere nueva minor version;
- tratamiento de datos desconocidos;
- migración: preferencia por no reescribir legacy solo por abrirlo.

## 8.3 Regla de edificio

Preferencia de producto:

- un edificio físico comparte ubicación;
- normalmente comparte norte/orientación;
- una planta no debería declarar coordenadas incompatibles con otra por accidente.

Pero la implementación debe reconciliar esta preferencia con el contrato vigente sin introducir duplicación destructiva.

---

# 9. Procedencia, estado y mensajes

## 9.1 Estados mínimos

Ubicación:

- `not-configured`;
- `user-entered`;
- `official-source`;
- `derived` si alguna función futura lo calcula;
- `unavailable`.

Orientación:

- `not-configured`;
- `configured`.

Solar:

- `unavailable`;
- `available-orientative`;
- `below-horizon`.

No es obligatorio usar exactamente estos strings, pero sí conservar la semántica.

## 9.2 Fuente visible cuando aporte valor

Ejemplos de UI futura:

- “Ubicación introducida por el profesional”.
- “Parcela obtenida de cartografía catastral oficial”.
- “Ortofoto: PNOA / IGN-CNIG”.

Evitar:

- “Verificado por Rubik”.
- “Geometría certificada”.
- “Medición oficial de Rubik”.

La fuente puede ser oficial sin que Rubik certifique la adecuación de ese dato a un procedimiento técnico concreto.

---

# 10. Privacidad y seguridad de datos

## 10.1 Minimización

Guardar únicamente lo necesario.

No almacenar respuestas completas de Catastro o servicios geográficos si no se necesitan.

## 10.2 Publicación

Por defecto, ninguna salida pública debe incluir automáticamente:

- latitud/longitud exactas;
- referencia catastral;
- dirección exacta;
- identificadores administrativos;
- metadatos internos del proveedor.

Una futura capacidad de entrega puede permitir al profesional elegir qué mostrar.

## 10.3 Fuentes protegidas

No utilizar endpoints de datos protegidos como atajo para funciones que pueden resolverse con datos abiertos/no protegidos.

## 10.4 Telemetría

No introducir telemetría de ubicación en este corte.

---

# 11. Dependencias y licencias

## 11.1 SunCalc

Antes de incorporar:

- fijar commit/tag/version exacta;
- conservar LICENSE/copyright;
- decidir si se instala, vendoriza o se adapta según la arquitectura del repositorio;
- evitar CDN en runtime si las políticas actuales favorecen recursos locales/reproducibles;
- añadir atribución a inventario de terceros si existe.

## 11.2 NREL-SPA

Si se usa:

- fijar versión/commit;
- conservar MIT del wrapper;
- conservar third-party notice NREL;
- no copiar código sin sus avisos.

## 11.3 Catastro / IGN / CNIG / PNOA

Antes de implementar un endpoint concreto:

- registrar URL oficial;
- registrar licencia/condiciones aplicables a ese servicio/producto;
- registrar obligación de atribución;
- documentar limitaciones de redistribución;
- evitar asumir que “público” significa “sin condiciones”.

---

# 12. QA del Punto 6

## 12.1 Núcleo solar

Casos mínimos:

- hemisferio norte;
- hemisferio sur;
- mañana;
- mediodía;
- tarde;
- noche/sol bajo horizonte;
- verano/invierno;
- cambio de `northOffsetDeg`;
- cambio de zona horaria;
- transición de horario de verano en una zona IANA relevante;
- coordenadas inválidas;
- timezone inválida;
- datos incompletos;
- proyecto legacy.

### Validación cruzada

Para un conjunto pequeño de fixtures, comparar SunCalc con una fuente secundaria fiable, potencialmente NREL-SPA, con una tolerancia de producto razonable.

El objetivo no es demostrar igualdad bit a bit.

## 12.2 Persistencia

- guardar/cargar;
- exportar/importar;
- una planta;
- edificio multiplanta;
- copias/variantes si les afecta;
- proyecto legacy sin mutación inesperada;
- versión futura V1 conservada según reglas vigentes.

## 12.3 UI

Tamaños mínimos habituales del proyecto:

- 1440×900;
- 390×844;
- 844×390;
- considerar 360×800 cuando los controles entren en zonas ya sensibles.

Comprobar:

- no overflow horizontal;
- controles táctiles utilizables;
- indicador norte no tapa cotas/selección;
- estados de datos ausentes claros;
- texto legal/orientativo visible sin dominar la interfaz.

## 12.4 3D

Comprobar:

- cambiar hora mueve la dirección de luz de forma coherente;
- cambiar fecha/mes produce cambio observable cuando corresponda;
- cambiar norte rota la relación entre vivienda y sol;
- sol bajo horizonte no genera una dirección diurna engañosa;
- salir de Solar restaura Presentación;
- entrar/salir repetidamente no acumula luces;
- no aparecen sombras NaN/infinito;
- no degradación grave de rendimiento.

## 12.5 Regresiones críticas

Ejecutar las suites dirigidas que protejan:

- presentación;
- recorrido;
- cámaras;
- capturas PNG;
- lote ZIP;
- vídeo/recorder si consume la escena;
- edificio multiplanta;
- import/export;
- idiomas;
- privacidad/network si se añade cualquier llamada externa.

---

# 13. Política de red y degradación

## 13.1 Punto 6 V1

Debe poder funcionar completamente con:

- proyecto local;
- coordenadas manuales;
- timezone IANA;
- SunCalc local.

Sin red.

## 13.2 Proveedores externos

Cuando se activen:

- timeout explícito;
- cancelación;
- mensaje de fallo comprensible;
- no bloquear edición;
- no borrar ubicación válida existente por un fallo de consulta;
- distinguir “sin resultados” de “servicio no disponible”;
- registrar solo errores necesarios, sin filtrar datos sensibles.

---

# 14. Handoff obligatorio para Codex o Claude Code

La persona/agente que implemente debe comenzar por leer:

1. este documento;
2. `docs/product/approved-next-capabilities-2026-10-25.md`;
3. `docs/contracts/FloorPlanProjectV1.md` y schemas vigentes;
4. contrato de edificio/multiplanta;
5. código y tests del renderer/presentación;
6. documento transversal territorial `territorial-data-provider-exterior-2026-10-27.md`.

## 14.1 Orden de trabajo recomendado

1. actualizar base y registrar SHA;
2. auditar renderer/Three.js/luz/sombras;
3. auditar contrato persistente;
4. proponer diff de contrato mínimo;
5. implementar 6A;
6. implementar 6B manual;
7. integrar SunCalc detrás de `FloorPlanSolar`;
8. implementar 6C con cambio mínimo de luz;
9. introducir interfaz `FloorPlanGeoProvider` sin inflar el alcance;
10. tests unitarios;
11. tests 3D dirigidos;
12. QA responsive;
13. Draft PR;
14. preview humana antes de merge.

## 14.2 Gate de complejidad

Si para obtener solar orientativo se requiere reestructurar de forma grande el renderer:

**parar antes del refactor**.

Documentar:

- bloqueo exacto;
- archivos afectados;
- alternativa mínima;
- riesgos;
- tests que fallan;
- rama/SHA.

No convertir Punto 6 en una migración de renderer sin nueva decisión.

## 14.3 Gate de créditos/tokens

Antes de agotar una sesión:

- commit de todo trabajo útil;
- push de la rama;
- Draft PR;
- HEAD SHA;
- base SHA;
- tests ejecutados;
- resultados;
- pendientes;
- si queda trabajo local deliberado: ruta absoluta, rama, `git status` y archivos exactos.

No dejar trabajo útil únicamente en local sin ruta/handoff.

---

# 15. Criterios de aceptación del Punto 6

El Punto 6 puede considerarse funcionalmente cerrado cuando:

- el norte se configura y persiste;
- ubicación manual válida se guarda con zona IANA;
- proyecto legacy abre sin inventar datos;
- SunCalc o proveedor solar elegido calcula una posición coherente;
- la escena 3D representa esa dirección de forma comprensible;
- Presentación y Solar son modos distinguibles;
- salir de Solar restaura la iluminación de presentación;
- el texto de carácter orientativo está visible;
- una y varias plantas funcionan;
- import/export conserva los datos;
- tests dirigidos están verdes o cualquier fallo preexistente está demostrado y separado;
- QA visual humana aprueba 1440×900, 390×844 y 844×390;
- no se ha introducido dependencia obligatoria de Catastro/Google Maps/red;
- `FloorPlanGeoProvider` queda definido de forma suficiente para añadir un proveedor territorial sin tocar el núcleo solar.

No es criterio de cierre:

- exactitud de ingeniería solar;
- LiDAR;
- importación automática de parcela;
- terreno 3D real;
- Google Maps;
- clima;
- luna;
- cálculo energético.

---

# 16. Decisiones cerradas por este documento

1. El Punto 6 se simplifica: **orientación + ubicación + solar orientativo**, no simulación avanzada.
2. SunCalc es el candidato preferente para V1; NREL-SPA queda como alternativa/referencia.
3. Zona horaria persistente: IANA, no solo offset.
4. Ubicación manual debe permitir funcionamiento offline.
5. No cambiar el renderer profundamente salvo necesidad demostrada.
6. Sombra razonable es suficiente; precisión física avanzada no es objetivo.
7. Se introduce la arquitectura transversal `FloorPlanGeoProvider`.
8. España será el primer país objetivo para proveedor territorial real.
9. Catastro/IGN/CNIG/PNOA se consideran fuentes potenciales oficiales, con licencia/atribución revisadas por servicio/producto.
10. Datos protegidos/personales del Catastro quedan fuera del alcance.
11. La ubicación interna no se publica automáticamente.
12. INSPIRE es una vía de interoperabilidad futura, no garantía de uniformidad entre países.
13. El siguiente país se elige por demanda comercial, no por completar un mapa mundial.
14. La infraestructura territorial puede alimentar Punto 8, pero **no sustituye el alcance Exterior V1/V2/V3**.
15. Punto 6 V1 no depende de Google Maps, Catastro ni red.

---

# 17. Fuentes externas revisadas al tomar la decisión

## Código open source

- SunCalc disponible en `Juanmaes83/suncalc-A-tiny-JavaScript-library-for-calculating-sun-moon-positions-and-phases.` — versión declarada 2.1.1; licencia BSD del proyecto original.
- `Juanmaes83/nrel-spa` — wrapper MIT y third-party notice del algoritmo NREL.

## España — fuentes oficiales

- Sede Electrónica del Catastro, difusión de datos catastrales: servicios de datos no protegidos, servicios protegidos para usuarios habilitados y servicios INSPIRE.
- Portal del Catastro, acceso a la información: consulta no protegida, WMS e INSPIRE.
- Centro de Descargas del CNIG: información geográfica reutilizable, ortofoto, cartografía, modelos del terreno y LiDAR; revisar licencia/atribución exacta del producto antes de integrar.
- PNOA / PNOA-LiDAR: ortofotografía, visualizadores/servicios web y productos LiDAR/derivados según cobertura.

Las URLs y condiciones exactas del endpoint/producto deben fijarse en la PR que implemente cada integración externa; este documento aprueba la arquitectura y la prioridad, no congela endpoints de terceros.

---

# 18. Relación con el roadmap

Este documento **reemplaza como especificación detallada** el texto resumido del Punto 6 fechado el 25-10-2026, sin borrar la trazabilidad histórica de aquella decisión.

El programa queda conceptualmente:

- 1 — Construir/medir: cerrado.
- 2 — Tipo declarado de muro: cerrado.
- 3 — Superficies estancia→planta→vivienda: cerrado.
- 4 — Familias de estancias: cerrado.
- 5 — Ficha profesional de superficies: cerrado.
- **6 — Orientación + ubicación + solar orientativo + frontera GeoProvider: siguiente corte.**
- 7 — Presupuesto: fase posterior.
- **8 — Exterior V1/V2/V3: fase posterior; reutiliza GeoProvider y fuentes territoriales cuando aporten valor.**
- 9 — Instalaciones ligeras: fase posterior.

No renumerar 7–9 por la aparición de `FloorPlanGeoProvider`.
