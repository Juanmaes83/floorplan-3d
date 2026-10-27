# Infraestructura territorial y relación con Exterior V1/V2/V3

**Fecha:** 27-10-2026  
**Estado:** decisión transversal aprobada; documentación de arquitectura/producto para implementaciones futuras.  
**Relacionado con:** Punto 6D (`FloorPlanGeoProvider`), Punto 8 — Exterior, D-11 ubicación y D-12 mapas/geocodificación.  
**No es:** una implementación de Catastro, un GIS, un modelador de terreno ni una modificación de la numeración 7–9.

---

# 1. Decisión principal

Floor Plan 3D debe poder beneficiarse de fuentes territoriales fiables sin acoplar su núcleo a un organismo, país o API concreta.

Arquitectura conceptual:

```text
Floor Plan 3D
      |
      v
FloorPlanGeoProvider
      |
      +-- Manual
      +-- Spain
      |    +-- Catastro
      |    +-- IGN / CNIG
      |    +-- PNOA
      |
      +-- France (futuro, solo con demanda)
      +-- Germany (futuro, solo con demanda)
      +-- otros países / INSPIRE / proveedores futuros
```

España será el **Proveedor 1 / primer país real** por disponibilidad de fuentes oficiales y cercanía al mercado inicial.

El siguiente país se seleccionará por necesidad comercial real, no por deseo de completar cobertura global.

---

# 2. Por qué esta infraestructura eleva la plataforma

Hasta ahora Floor Plan 3D representa principalmente:

- geometría creada/importada por el profesional;
- estado y metadatos del proyecto;
- superficies, estancias y presentación 2D/3D.

La infraestructura territorial permite añadir una cuarta capa:

```text
lo que el profesional dibuja
+ lo que el proyecto sabe
+ lo que fuentes externas fiables aportan
```

Esto puede elevar la plataforma de editor/presentador de planos a entorno profesional para **preparar, contextualizar y presentar un inmueble real**, sin convertirse en GIS, BIM completo ni herramienta certificadora.

Valor potencial:

- menos entrada manual;
- más contexto;
- más trazabilidad;
- mayor credibilidad de presentación;
- reutilización de datos oficiales;
- base para exterior/terreno;
- arquitectura internacionalizable.

---

# 3. Principios de producto

## GEO-01 — La fuente debe identificarse

Cuando un dato proceda de una fuente reconocida, Rubik debe poder conservar su procedencia.

Ejemplos aceptables:

- “Ubicación introducida por el profesional”.
- “Parcela obtenida de cartografía catastral oficial”.
- “Ortofoto: PNOA / IGN-CNIG”.

No decir:

- “certificado por Rubik”;
- “geometría oficial validada por Rubik”;
- “medición catastral verificada por Rubik”.

## GEO-02 — Fuente oficial no significa certificación del uso concreto

Un dato puede proceder de una administración y seguir necesitando contraste para determinados usos profesionales, administrativos o técnicos.

Rubik aporta fuente y contexto; no certifica adecuación a un procedimiento externo.

## GEO-03 — Minimización

No importar ni persistir todo lo que devuelva una API.

Solo lo necesario para la función.

## GEO-04 — Datos protegidos fuera

No diseñar funciones del Punto 6/8 alrededor de:

- titularidad;
- NIF/CIF;
- valores catastrales;
- información personal protegida.

## GEO-05 — Degradación limpia

Si el proveedor no responde:

- el proyecto sigue abriendo;
- el editor sigue funcionando;
- los datos ya guardados no se destruyen;
- se permite entrada manual cuando proceda;
- el error se explica sin bloquear tareas no relacionadas.

## GEO-06 — El proveedor no gobierna el contrato interno

Los formatos externos se adaptan al modelo de Rubik, no al revés.

## GEO-07 — Internacionalización por adaptadores

Un nuevo país debe entrar como adaptador/proveedor, no mediante `if country === ...` dispersos por el producto.

---

# 4. `FloorPlanGeoProvider` — contrato conceptual

El nombre puede ajustarse al estilo real del código, pero la frontera debe existir.

## 4.1 Operaciones candidatas

```js
search(query, options)
getParcel(id, options)
getGeometry(id, options)
getCoordinates(id, options)
getSourceMetadata(id, options)
```

Posibles futuras operaciones, **no aprobadas para Punto 6 V1**:

```js
getOrthophoto(bounds, options)
getElevation(bounds, options)
getTerrain(bounds, options)
```

## 4.2 Declaración de capacidades

Cada adaptador debe indicar lo que realmente soporta.

```js
{
  search: true,
  parcel: true,
  geometry: true,
  coordinates: true,
  orthophoto: false,
  elevation: false,
  terrain: false
}
```

La UI no debe ofrecer operaciones que el proveedor no soporta.

## 4.3 Salida normalizada

Conceptualmente:

```js
{
  providerId: 'catastro-es',
  countryCode: 'ES',
  source: {
    name,
    url,
    retrievedAt,
    licenseNotice
  },
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
  }
}
```

No congelar estos nombres hasta auditar contratos existentes.

## 4.4 CRS / sistemas de coordenadas

El proveedor debe conservar o declarar el CRS de geometrías de origen.

Reglas futuras:

- no asumir que toda geometría externa llega en WGS84;
- no mezclar coordenadas geográficas y coordenadas locales de plano;
- cualquier transformación debe quedar centralizada y testeada;
- conservar precisión suficiente sin introducir complejidad GIS innecesaria en Punto 6.

El problema CRS es especialmente relevante para Punto 8 V3 y debe tratarse allí con mayor profundidad.

---

# 5. Proveedor manual

`Manual` es una capacidad permanente, no un fallback temporal que deba desaparecer.

Permite:

- latitud;
- longitud;
- zona horaria;
- orientación configurada por el profesional.

Ventajas:

- funcionamiento offline;
- países sin proveedor;
- inmuebles sin resultado oficial fácil de localizar;
- pruebas;
- recuperación si cambia una API externa.

El proveedor manual garantiza que Punto 6 no dependa de la infraestructura territorial avanzada.

---

# 6. España — Catastro

## 6.1 Capacidades potenciales

Las fuentes oficiales revisadas el 27-10-2026 publican servicios de:

- consulta de datos catastrales no protegidos;
- cartografía;
- WMS;
- INSPIRE;
- descargas/consultas asociadas.

## 6.2 Usos potenciales en Rubik

- localizar una parcela/inmueble;
- obtener referencia catastral cuando sea útil;
- recuperar geometría de parcela;
- recuperar coordenadas/contexto;
- obtener superficie/uso no protegido cuando el endpoint y condiciones lo permitan;
- conservar fuente y fecha de recuperación.

## 6.3 No usar

- titularidad;
- datos personales;
- valor catastral;
- endpoints protegidos para funciones de presentación general.

## 6.4 Regla de licencia/reutilización

Antes de usar un servicio concreto:

- revisar condiciones exactas;
- documentar atribución;
- documentar límites de redistribución;
- distinguir datos transformados de copia/redistribución de base original;
- no incluir cachés masivas de información original sin necesidad/licencia.

---

# 7. España — IGN / CNIG

El Centro de Descargas del CNIG ofrece información geográfica digital reutilizable y servicios para integración en aplicaciones de terceros.

Potenciales productos útiles:

- cartografía;
- fotografía aérea;
- ortofotos;
- modelos digitales del terreno;
- bases geográficas;
- nubes LiDAR.

## Uso en Rubik

No asumir que todos estos productos pertenecen al mismo corte.

Clasificación recomendada:

- Punto 6: como máximo localización/contexto si aporta valor y el coste es bajo;
- Punto 8 V3: terreno/contexto, ortofoto y elevación cuando exista caso de uso claro;
- estudios futuros: LiDAR/volumetría/cubiertas solo con alcance independiente.

---

# 8. España — PNOA / PNOA-LiDAR

## 8.1 Valor potencial

PNOA aporta una capa visual/contextual de gran valor para el futuro Exterior:

- ortofoto;
- comparación temporal según producto;
- modelos derivados;
- datos LiDAR;
- terreno/superficie según productos disponibles.

## 8.2 Decisión de alcance

**No integrar PNOA-LiDAR en Punto 6.**

El solar V1 no necesita terreno real, LiDAR ni cubiertas derivadas.

## 8.3 Punto natural de entrada

Punto 8 V3 — parcela/terreno/contexto.

Antes de incorporarlo allí deben evaluarse:

- formato;
- tamaño;
- resolución necesaria;
- recorte por área;
- CRS;
- coste de procesado en navegador;
- caché;
- atribución/licencia;
- dispositivo móvil;
- fallback;
- diferencia entre ortofoto, MDT, MDS y nube LiDAR.

---

# 9. Relación exacta con Punto 6

## Punto 6A — Orientación

No necesita fuentes externas.

## Punto 6B — Ubicación

V1 manual.

Puede consumir en el futuro una ubicación normalizada por GeoProvider.

## Punto 6C — Solar

Solo consume:

- latitud;
- longitud;
- timezone;
- fecha/hora;
- norte.

No conoce Catastro/IGN/Google Maps.

## Punto 6D — GeoProvider

Define la frontera y, si el corte lo permite, un primer adaptador mínimo.

No debe convertirse en importador completo de terreno.

---

# 10. Relación exacta con Punto 8 — Exterior

**El Punto 8 original se conserva. No se elimina, no se reemplaza y no se renumera.**

## 10.1 Exterior V1 — fachada y exteriores básicos

Alcance aprobado anterior:

- paredes exteriores;
- materiales de fachada;
- ventanas/puertas visibles exteriormente;
- suelo;
- terraza;
- balcón.

### Relación con GeoProvider

Baja.

V1 debe poder implementarse sin Catastro/PNOA.

GeoProvider puede aportar ubicación/contexto, pero no debe bloquear la edición básica de fachada.

## 10.2 Exterior V2 — cubierta y volúmenes

Alcance aprobado anterior:

- cubierta sencilla;
- altura de petos;
- volúmenes exteriores.

### Relación con fuentes territoriales

Media/futura.

PNOA-LiDAR u otras fuentes podrían aportar referencias de cubierta/volumen en fases posteriores, pero **no deben convertir V2 en reconstrucción automática desde LiDAR** salvo nueva decisión.

El profesional debe conservar control explícito del modelo.

## 10.3 Exterior V3 — parcela, terreno y contexto

Alcance aprobado anterior:

- parcela/terreno;
- desniveles;
- contexto exterior.

### Relación con GeoProvider

Alta.

Aquí es donde la infraestructura territorial adquiere máximo valor.

Potencial flujo:

```text
Catastro
   -> parcela / referencia / geometría

IGN / CNIG / PNOA
   -> ortofoto / MDT / contexto / productos de elevación

FloorPlanGeoProvider
   -> normalización + procedencia

Exterior V3
   -> parcela/terreno/contexto editable y presentable
```

### Principio clave

Los datos externos son **punto de partida y contexto**, no verdad inmutable.

El profesional debe poder revisar/ajustar la representación de trabajo sin que Rubik afirme que esa edición altera el dato oficial de origen.

---

# 11. Separación entre “dato territorial” y “modelo editable”

Este punto es crítico.

Ejemplo:

- Catastro devuelve polígono de parcela.
- Rubik conserva el polígono fuente + procedencia.
- Exterior crea una representación editable/local derivada cuando sea necesario.

No sobreescribir silenciosamente el dato fuente con una edición del profesional.

Modelo conceptual:

```text
SOURCE GEOMETRY
  provider: catastro-es
  retrievedAt: ...
  geometry: ...
        |
        v
WORKING GEOMETRY
  editable in Rubik
  derivedFrom: source-id
```

Esto permite trazabilidad y evita confundir “lo que decía la fuente” con “lo que el profesional adaptó para su proyecto”.

---

# 12. Fuentes territoriales de otros países

## 12.1 Decisión

Sí se espera que otros mercados dispongan de catastros, registros parcelarios, infraestructuras geoespaciales u organismos equivalentes, pero **no se debe asumir equivalencia funcional**.

## 12.2 Europa

INSPIRE ofrece modelos y servicios interoperables, incluido el tema de parcelas catastrales, pero cada país puede variar en:

- organismo;
- cobertura;
- atributos;
- frecuencia de actualización;
- autenticación;
- licencia;
- calidad;
- endpoints;
- CRS;
- límites de uso.

## 12.3 Proceso para Proveedor 2

Cuando exista mercado objetivo:

1. identificar organismo/fuente oficial;
2. revisar datos realmente abiertos;
3. revisar licencia;
4. revisar API/OGC/INSPIRE/descarga;
5. construir fixture real;
6. mapear capacidades;
7. implementar adaptador;
8. tests de error/cobertura;
9. revisión legal/licencia;
10. solo entonces activar UI.

---

# 13. Mapas y geocodificación

`FloorPlanGeoProvider` no implica mostrar un mapa.

Separar:

- búsqueda/geocodificación;
- mapa visual;
- parcela;
- ortofoto;
- elevación;
- contexto.

Google Maps puede seguir siendo proveedor objetivo de mapa/geocodificación según D-12 si se aprueba su integración técnica/económica.

No usar Google Maps como sustituto conceptual de Catastro/IGN ni Catastro como sustituto de un servicio de búsqueda de direcciones si no lo cubre bien.

---

# 14. Caché, reproducibilidad y proyectos guardados

## 14.1 El proyecto debe ser reproducible

Si una parcela/contexto es esencial para la presentación, no depender únicamente de volver a consultar la API años después.

Debe decidirse qué representación mínima se persiste dentro del proyecto/paquete.

## 14.2 No copiar bases completas

Persistir el recorte/dato necesario, no una base territorial masiva.

## 14.3 Actualización

Cuando una fuente cambie:

- no actualizar automáticamente un proyecto guardado sin consentimiento;
- mostrar que existe dato más reciente si la función futura lo permite;
- permitir comparar/refrescar de forma expresa;
- conservar trazabilidad de la versión anterior cuando tenga impacto en el proyecto.

---

# 15. QA transversal de GeoProvider

Cada proveedor real debe probar:

- consulta válida;
- sin resultados;
- múltiples resultados;
- servicio caído;
- timeout;
- respuesta malformada;
- campos opcionales ausentes;
- geometría inválida;
- CRS inesperado;
- cancelación;
- offline;
- caché/proyecto guardado;
- privacidad/logs;
- atribución visible cuando proceda.

## Tests contractuales

Crear una suite común para todos los proveedores:

```text
GeoProvider contract tests
  - capabilities honestas
  - shape normalizado
  - errores normalizados
  - source metadata
  - no datos protegidos
```

Los adaptadores específicos añaden sus propios fixtures.

---

# 16. UX futura de fuentes

No llenar la UI con nombres de organismos si no ayudan.

Experiencia deseada:

1. profesional busca/introduce ubicación;
2. Rubik muestra resultados/contexto;
3. profesional elige;
4. Rubik explica fuente;
5. dato se aplica al proyecto;
6. el profesional conserva control sobre lo que se publica.

Ejemplo de información secundaria:

> Fuente: Catastro · recuperado el 27/10/2026

No convertir la ficha de proyecto en un expediente administrativo.

---

# 17. Valor por público

## Inmobiliarias

- contexto real del inmueble;
- presentación con mayor credibilidad;
- menos configuración manual;
- potencial para parcela/exterior.

## Promotoras

- relación entre vivienda, parcela y entorno;
- base para explicar promociones y exteriores;
- reutilización de contexto oficial cuando exista.

## Estudios de arquitectura

- trazabilidad de fuente;
- punto de partida territorial;
- utilidad de parcela/contexto sin fingir BIM/GIS completo;
- posibilidad de revisar y adaptar datos externos.

## Reformas/interiorismo

- ubicación/orientación simple;
- contexto suficiente sin sobrecargar herramientas interiores.

## Cliente final

No necesita ver APIs ni CRS.

Debe recibir respuestas comprensibles:

- dónde está la vivienda;
- cómo está orientada;
- cómo se relaciona con parcela/entorno;
- de qué fuente procede un dato cuando sea relevante.

---

# 18. Qué NO construir todavía

- cobertura mundial;
- motor GIS general;
- descarga masiva de Catastro;
- visor cartográfico complejo;
- edición de datos oficiales;
- sincronización bidireccional con organismos;
- reconstrucción 3D automática desde LiDAR;
- nubes LiDAR completas en móvil;
- certificación de parcelas;
- cálculo urbanístico;
- consulta de titularidad;
- valoración catastral;
- clima/AEMET integrado por defecto;
- planeamiento municipal nacional unificado.

---

# 19. Futuras fuentes complementarias — no aprobadas para implementación inmediata

## AEMET

Puede aportar en el futuro clima histórico/meteorología si aparece una necesidad de producto clara.

No pertenece al solar V1.

Antes de integrar:

- API/key;
- condiciones;
- disponibilidad;
- caché;
- utilidad real para públicos.

## Datos autonómicos/municipales

Potencial para:

- planeamiento;
- callejero;
- ortofoto adicional;
- datos abiertos locales;
- contexto urbano.

No crear conectores sin caso de uso.

---

# 20. Secuencia recomendada de implementación

## Fase actual — Punto 6

- definir `FloorPlanGeoProvider`;
- proveedor Manual;
- no bloquear por red;
- SunCalc consume ubicación normalizada;
- si se implementa `CatastroES` ahora, limitarlo a un corte muy pequeño y demostrable.

## Punto 7

No se altera: presupuesto/acabados.

## Punto 8 V1

Exterior básico independiente de fuentes.

## Punto 8 V2

Cubierta/volúmenes; no reconstrucción LiDAR automática.

## Punto 8 V3

Primer gran consumidor territorial:

- parcela;
- terreno;
- contexto;
- potencial Catastro + IGN/CNIG + PNOA.

## Punto 9

No se altera: instalaciones ligeras.

---

# 21. Gate para cualquier agente futuro

Codex, Claude Code o cualquier otro agente debe:

1. leer este documento y el documento de Punto 6;
2. fijar SHA base;
3. no ampliar alcance silenciosamente;
4. verificar licencias/endpoints actuales antes de conectar una fuente;
5. no usar datos protegidos;
6. crear adaptador, no acoplamiento directo;
7. añadir tests contractuales;
8. dejar Draft PR con handoff completo;
9. no mergear automáticamente una integración territorial nueva sin revisión humana.

---

# 22. Decisiones cerradas

- `FloorPlanGeoProvider` es infraestructura transversal aprobada.
- España es Proveedor 1 real.
- Catastro, IGN/CNIG y PNOA son fuentes prioritarias a evaluar/usar según fase.
- Entrada manual permanece siempre.
- Punto 6 usa GeoProvider para ubicación, no para terreno avanzado.
- Punto 8 conserva su alcance V1/V2/V3.
- Punto 8 V3 es el principal consumidor futuro de parcela/terreno/contexto.
- INSPIRE sirve como vía de internacionalización, no como garantía uniforme.
- Proveedor 2 se decide por mercado real.
- No se incorporan datos personales/protegidos.
- Fuente oficial se muestra como procedencia, no como certificación de Rubik.
- No se construye GIS general.
