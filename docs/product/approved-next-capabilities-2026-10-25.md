# Decisiones aprobadas — siguientes capacidades tras el cierre de integración

**Fecha de decisión:** 25-10-2026  
**Estado:** decisiones de producto aprobadas y documentadas. **No son trabajo activo todavía.**  
**Condición de inicio:** no implementar estas capacidades hasta cerrar, validar y fusionar la integración funcional actualmente en curso y las mejoras que Claude Code ya tiene asignadas.  
**Objetivo:** conservar alcance y prioridades para retomarlas sin perder contexto ni abrir trabajo paralelo que distraiga del cierre actual.

## Regla de secuencia

1. Terminar el cierre de la integración actual, construir el SHA candidato, validarlo y llevar exactamente ese contenido a `master` mediante una única estrategia de integración.
2. Mantener el vídeo técnico/profesional y las mejoras ya conocidas por Claude Code dentro de su secuencia aprobada.
3. **Después** iniciar este programa de capacidades.
4. Primer bloque funcional aprobado: **1–6**.
5. Capacidades **7–9** quedan aprobadas para fases posteriores y no deben adelantarse salvo nueva decisión expresa.
6. Ninguna de estas capacidades convierte Rubik en herramienta de certificación estructural, energética, de instalaciones ni de mediciones oficiales. Cuando exista incertidumbre, debe mostrarse su procedencia y estado de revisión.

---

## 1. Construir y medir — mejor acceso y contexto

### Decisión
Las herramientas de selección, construcción/dibujo de muros y medición ya existen. **No se rehacen ni se duplican.**

### Primer corte
- Mejorar descubribilidad y acceso dentro del flujo de trabajo.
- Mostrar contexto de uso y siguiente acción útil.
- Mantener las herramientas existentes como fuente funcional única.
- Evitar crear un segundo sistema de dibujo o medición.

### Objetivo de producto
Reducir fricción para que un profesional encuentre rápidamente cómo seleccionar, dibujar y medir sin aprender una interfaz paralela.

---

## 2. Tipo declarado de muro — tabique / portante

### Decisión
El tipo estructural del muro será **un dato declarado**, nunca una inferencia automática ni un dictamen técnico.

### Tipo declarado
- `Sin especificar`
- `Tabique`
- `Muro portante`
- `Otro`

### Procedencia / revisión
- `declarado por profesional`
- `importado`
- `pendiente de revisar`

### Reglas obligatorias
- No deducir que un muro es portante por grosor, posición, geometría, dibujo ni IA.
- No presentar la etiqueta como verificación estructural.
- Persistir el dato y su procedencia/revisión en el proyecto.
- El usuario profesional debe poder modificarlo expresamente.

### Objetivo de producto
Aportar contexto útil para arquitectura y reformas sin atribuir a Rubik capacidades de cálculo o certificación estructural.

---

## 3. Modelo de superficies — estancia → planta → vivienda

### Decisión
Consolidar el cálculo existente en una jerarquía coherente:

`estancia → planta → vivienda`

### Estado de la cifra
Cuando corresponda, cada cifra deberá poder distinguir entre:
- `medido/calibrado`
- `estimado`
- `no disponible`

### Primer corte
- Mantener la superficie de cada estancia como dato de base.
- Agregar superficies por planta.
- Agregar el total de vivienda.
- Preservar exclusiones o zonas que no computen.
- No inventar superficie construida cuando no existan datos suficientes.

### Distinción con el punto 5
Este punto define **el modelo y la agregación de datos**. El punto 5 define **cómo presentar profesionalmente esos datos**.

---

## 4. Familias funcionales de estancias

### Decisión
Cada estancia tendrá una **categoría funcional persistente**, mientras su nombre visible seguirá siendo completamente libre y editable.

### Categorías iniciales aprobadas
- `salón`
- `dormitorio`
- `cocina`
- `baño`
- `circulación`
- `exterior`
- `servicio`
- `otro`

### Reglas
- La categoría no sustituye al nombre.
- Ejemplo válido: categoría `dormitorio`, nombre `Suite principal`.
- No multiplicar categorías sin una utilidad funcional concreta.
- La categoría debe quedar preparada para usos posteriores como estadísticas, presentación, acabados, mobiliario o presupuesto.

### Objetivo de producto
Separar semántica funcional de nomenclatura comercial/personalizada y habilitar automatismos futuros sin limitar al profesional.

---

## 5. Ficha profesional de superficies de la vivienda

### Decisión
Convertir los datos disponibles en una ficha profesional clara y reutilizable en revisión y entregas.

### Contenido objetivo
- superficie útil por estancia;
- superficie útil por planta;
- total útil de la vivienda;
- zonas excluidas del cómputo;
- pavimento estimado;
- superficie construida **solo cuando existan datos suficientes y un método definido**.

### Estado visible
Etiquetar claramente las cifras como:
- **medido/calibrado**;
- **estimado**;
- **no disponible**.

### Reglas
- No presentar estimaciones como mediciones profesionales certificadas.
- La ficha debe reutilizar el modelo del punto 3; no crear cálculos paralelos.
- Prepararla para futuras láminas, presentación y presupuesto.

---

## 6. Sol, orientación, hora, mes y latitud

### Contexto aprobado
La plataforma original ya disponía de control visual de hora solar y modo nocturno. La siguiente capacidad debe evolucionar esa idea sin confundir iluminación artística con una simulación geográfica.

### Primer corte aprobado
- orientación/norte del proyecto;
- hora;
- fecha/mes;
- latitud y ubicación necesaria para el cálculo;
- zona horaria coherente;
- posición solar calculada a partir de esos datos;
- control visual comprensible en 3D.

### Reglas
- Separar **luz de presentación** de **estudio solar orientativo**.
- Se pueden reutilizar librerías o algoritmos open source maduros si se revisan licencia, mantenimiento y adecuación técnica antes de incorporarlos.
- No prometer estudio de insolación, certificación energética ni cumplimiento normativo solo por disponer de posición solar.

### Objetivo de producto
Mejorar presentación y comprensión de orientación/luz de la vivienda con un coste de implementación contenido y datos explícitos.

---

# Fases aprobadas para después del bloque 1–6

## 7. Presupuesto — primero acabados/materiales

### Decisión
No partir de cero conceptualmente: la plataforma histórica tuvo lógica de precios/materiales, pero los precios heredados en ¥ no son válidos para un presupuesto profesional en España/Europa y no deben convertirse mecánicamente a euros.

### Etapa 1 aprobada — acabados/materiales
Aprovechar las superficies y cantidades calculables para crear una base de presupuesto orientativo con:
- material/acabado;
- cantidad calculada;
- precio unitario introducido o revisado por el profesional;
- partidas y subtotales;
- merma/exclusiones visibles cuando proceda;
- moneda EUR;
- impuestos/IVA configurables cuando se diseñe el alcance;
- fecha/revisión y procedencia de precios.

### Etapa 2 futura — muebles/equipamiento
Solo cuando exista demanda real de clientes o proyectos concretos:
- mobiliario;
- equipamiento;
- partidas personalizadas por cliente/proyecto.

Esta segunda etapa puede funcionar como servicio o personalización comercial antes de convertirse en una función general del producto.

### Reglas
- No reutilizar como precios vigentes los datos históricos chinos.
- No presentar estimaciones como presupuesto contractual o medición oficial sin el proceso profesional correspondiente.

---

## 8. Exterior — fachada, cubierta, marcos y terreno

### Exterior V1
- paredes exteriores;
- materiales de fachada;
- ventanas/puertas visibles exteriormente;
- suelo, terraza y balcón.

### Exterior V2
- cubierta sencilla;
- altura de petos;
- volúmenes exteriores.

### Exterior V3
- parcela/terreno;
- desniveles;
- contexto exterior.

### Reglas
- Mantener cada versión acotada; no intentar resolver terreno y cubiertas complejas en V1.
- Cualquier control marcado como futuro o «Próximamente» debe describir una capacidad futura, no simular que ya funciona.

### Objetivo de producto
Extender la vivienda desde el interior hacia una presentación exterior comprensible sin convertir el primer corte en un modelador arquitectónico completo.

---

## 9. Instalaciones ligeras — símbolos y elementos, no cálculo MEP

### Decisión
Implementar una **capa ligera de elementos de instalaciones**, no un sistema de cálculo técnico ni BIM/MEP completo.

### Ejemplos de elementos
- enchufes;
- interruptores;
- puntos de luz;
- tomas TV/datos;
- termostatos;
- radiadores;
- splits/unidades de climatización;
- tomas de agua;
- desagües;
- elementos domóticos sencillos.

### Alcance
- colocar/mover/editar elementos;
- representación mediante símbolos en 2D;
- visualización 3D cuando aporte valor;
- propiedades simples y persistentes cuando proceda.

### Fuera de alcance
- cálculo de circuitos;
- cargas eléctricas;
- secciones de cable;
- caudales;
- dimensionado de tuberías;
- cálculo térmico;
- verificación normativa;
- diseño o certificación completa de instalaciones.

### Objetivo de producto
Aportar utilidad real a reformas, interiorismo y arquitectura sin desviar Rubik hacia un software técnico MEP.

---

## Estado de aprobación y prioridad

| Nº | Capacidad | Decisión | Momento |
|---:|---|---|---|
| 1 | Construir/medir: acceso y contexto | Aprobada | Próximo bloque tras integración actual |
| 2 | Tipo declarado de muro | Aprobada | Próximo bloque tras integración actual |
| 3 | Superficie estancia→planta→vivienda | Aprobada | Próximo bloque tras integración actual |
| 4 | Familias de estancias | Aprobada | Próximo bloque tras integración actual |
| 5 | Ficha profesional de superficies | Aprobada | Próximo bloque tras integración actual |
| 6 | Sol/orientación/fecha/hora/latitud | Aprobada | Próximo bloque tras integración actual |
| 7 | Presupuesto de acabados/materiales | Aprobada para fase posterior | Después de 1–6 y del cierre de prioridades actuales |
| 8 | Exterior V1→V3 | Aprobada para fase posterior | Después de 1–6 y del cierre de prioridades actuales |
| 9 | Instalaciones ligeras | Aprobada para fase posterior | Después de 1–6 y del cierre de prioridades actuales |

---

# Decisiones transversales cerradas para el programa posterior

Estas decisiones son **criterios de producto ya resueltos por Juanma**. No deben volver a presentarse como dudas abiertas salvo que exista nueva evidencia que obligue a reconsiderarlas. Documentarlas **no inicia implementación** ni altera la prioridad del cierre actual.

## D-10. Puntos de interés — contrato A aprobado

### Decisión
Aprobar la opción **A** del estudio de POI: añadir `pointsOfInterest[]` como extensión compatible del contrato del proyecto.

### Alcance inicial ya acordado
- `característica`;
- `material/acabado` con estado honesto;
- `petición incorporada` únicamente cuando el cambio esté realmente hecho.

### Reglas permanentes
- Las observaciones privadas del cliente de #75 no son POI públicos.
- Nunca publicar automáticamente comentarios, nombres o conversaciones del cliente.
- El contenido visible al cliente debe ser redactado/seleccionado por el profesional.
- La asociación debe apoyarse en IDs persistentes del proyecto.

### Consecuencia
Cuando llegue la fase POI, **no volver a abrir A/B/C**: partir de `pointsOfInterest[]` y diseñar el corte mínimo compatible.

---

## D-11. Ubicación — precisión interna y publicación separada

### Decisión
Rubik podrá guardar una ubicación suficientemente precisa **internamente cuando el profesional la introduzca**, pero la información publicada al cliente se controlará de forma independiente.

### Principios
- Guardar y publicar son decisiones distintas.
- La ubicación interna puede servir a funciones como posición solar sin obligar a mostrar la dirección.
- El profesional decide qué nivel de información comercial/geográfica se expone en cada entrega.
- Dirección, precio y contacto no deben aparecer automáticamente por existir en el proyecto.

### Diseño posterior
La UI deberá permitir controlar qué se publica sin destruir la precisión interna necesaria para otras funciones.

---

## D-12. Mapas/geocodificación — Google Maps como proveedor objetivo

### Decisión
Si se incorpora mapa/geocodificación, el proveedor objetivo será **Google Maps**; no se diseñará una abstracción multiproveedor en el primer corte.

### Límites
- Esta decisión **no ordena implementarlo ahora**.
- Antes de activar la integración deberán verificarse API disponible, costes, claves, condiciones de uso, privacidad y tratamiento de datos.
- La ausencia temporal de Google Maps no debe bloquear que el profesional introduzca ubicación/coordenadas por otros medios simples si el producto lo necesita antes.

### Consecuencia
No volver a abrir una comparativa de proveedores salvo que Google Maps resulte inviable técnica, legal o económicamente.

---

## D-13. Modelos 3D propios del profesional — capacidad futura aprobada

### Decisión
Arquitectos, interioristas y otros profesionales podrán incorporar sus propios muebles/modelos 3D.

### Primer alcance funcional aprobado
- importar modelo propio;
- colocarlo;
- escalarlo;
- rotarlo;
- conservarlo con el proyecto;
- disponer de fallback si el recurso no puede cargarse.

### Fuera del primer corte
- marketplace;
- biblioteca online general;
- catálogo comercial compartido.

### Decisiones técnicas posteriores
Formato, tamaño, límites de geometría/texturas, seguridad, licencias y empaquetado se resolverán en el estudio técnico de esa fase, sin reabrir la decisión de producto de que **sí queremos esta capacidad**.

---

## D-14. Visita inmersiva avanzada / VR — depriorizada

### Decisión
**No desarrollar ahora** una experiencia VR/WebXR o una visita inmersiva avanzada como fase prioritaria.

### Motivo de producto
- Coste elevado en tiempo y esfuerzo frente al valor inmediato.
- Los usuarios/clientes objetivo actuales no dependen de gafas VR ni de conocimientos tecnológicos avanzados.
- El recorrido 3D accesible en navegador tiene prioridad.

### Consecuencia
No bloquea la versión objetivo ni la validación comercial. Puede reabrirse en el futuro si aparecen clientes, hardware o evidencia de demanda que justifiquen el coste.

---

## D-15. Enlace alojado para cliente — objetivo futuro, después de validación comercial

### Decisión
Sí queremos que, en el futuro, un profesional pueda enviar al cliente un enlace alojado al proyecto/presentación.

### Regla de prioridad
**No desarrollar esta infraestructura antes de estabilizar y validar comercialmente la experiencia local.**

### Fase posterior de diseño
Después de la validación del producto se decidirán:
- acceso privado/público;
- caducidad;
- contraseña o mecanismos de acceso;
- revocación;
- almacenamiento;
- retención;
- coste;
- privacidad y permisos.

### Consecuencia
PNG, ZIP, JSON, archivo compartido o Web Share **no deben describirse como enlace alojado**. La capacidad queda aprobada como objetivo futuro, no como requisito del cierre actual.

---

## D-16. IA conectada — comenzar por redacción profesional

### Decisión
No introducir una «IA» genérica. La primera finalidad aprobada para una futura IA conectada será **redacción profesional**.

### Primer grupo de usos
- descripción de vivienda;
- redacción de POI;
- textos comerciales;
- resumen profesional de cambios/versiones.

### Líneas posteriores posibles, no prioritarias
- ayuda con el plano: sugerencias, interpretación, clasificación;
- revisión: señalar incoherencias y ayudar a explicar riesgos;
- diseño: propuestas de mobiliario/acabados.

### Reglas
- F2 ya explora parte de la ayuda con el plano; no duplicar funciones sin evaluar F2.
- Antes de conectar un proveedor habrá que decidir datos enviados, privacidad, coste, retención y fallback.
- La redacción generada deberá seguir bajo control/revisión profesional.

---

## D-17. F2 — criterio de validación de producto

### Decisión
La asistencia de interpretación solo merece considerarse validada para producto si **ahorra trabajo al profesional sin reducir la calidad final**.

### Condiciones
- Las propuestas deben seguir siendo revisables y editables.
- No aprobar automatización irreversible o sin revisión humana.
- Mantener pendiente la evidencia ya exigida: línea base de cinco sesiones, conjunto de veinte planos reales con referencia y umbrales medibles.

### Consecuencia
Integración técnica de un prototipo no equivale a validación de F2. Claude podrá convertir este criterio de producto en métricas concretas cuando llegue la fase de validación.

---

## D-18. MCP/análisis geométrico — asistencia, nunca certificación

### Decisión
El objetivo de MCP/análisis geométrico es:

> **Ayudar a detectar posibles problemas geométricos.**

### Puede evolucionar para analizar
- paso;
- conflictos;
- anchuras;
- obstáculos;
- otras comprobaciones geométricas útiles y explícitamente acotadas.

### Regla permanente
Presentarlo como **herramienta de apoyo/revisión profesional**, nunca como certificación de accesibilidad, normativa, seguridad o cumplimiento técnico.

### Consecuencia
Los futuros Stages 2–4 requerirán decisión propia sobre alcance técnico, pero no deben cambiar este posicionamiento sin nueva aprobación expresa.

---

## D-19. Vídeo — WebM permitido con aviso cuando sea el formato disponible

### Decisión
En una primera versión, si un navegador permite grabar un WebM válido pero no ofrece un formato más compatible verificado, **se podrá ofrecer WebM con aviso claro de compatibilidad**.

### Condiciones obligatorias
- Identificar el archivo correctamente como WebM; nunca renombrarlo `.mp4`.
- Comprobar que el archivo descargado se abre fuera de Rubik.
- Mostrar aviso de compatibilidad adecuado.
- No prometer WhatsApp, iPhone/Safari, portales u otros canales hasta haberlos verificado realmente.
- Mantener separados: archivo descargable, Web Share con adjunto, enlaces de texto y enlace alojado.

### Consecuencia
La ausencia de H.264 no bloquea por sí sola el primer corte de descarga si WebM funciona y se comunica honestamente.

---

## D-20. Vídeo profesional — contenido y control editorial aprobados

### Decisión
El vídeo profesional tendrá como protagonista la vivienda y no la interfaz del editor.

### Contenido aprobado
- vivienda como protagonista;
- nombre del inmueble;
- planta cuando sea relevante;
- marca profesional;
- contacto solo con autorización;
- nombres de estancias;
- POI seleccionados cuando exista esa fase;
- nada de controles del editor;
- indicación discreta de medidas orientativas cuando corresponda.

### No automático
- precio;
- dirección;
- contacto.

El profesional decide qué información comercial publica.

### Regla de entrega
El vídeo visible/previsualizado debe corresponder al mismo archivo que se entrega o descarga; no usar una preview distinta para aparentar una calidad que el archivo final no tenga.

---

## Estado resumido de las 11 decisiones transversales

| ID | Decisión | Estado | Momento |
|---|---|---|---|
| D-10 | POI con `pointsOfInterest[]` | Aprobada | Fase POI, tras cierre/integración actual |
| D-11 | Ubicación precisa interna + publicación separada | Aprobada | Cuando se diseñe identidad/ubicación |
| D-12 | Google Maps como proveedor objetivo | Aprobada con revisión previa de API/coste/privacidad | No prioritaria ahora |
| D-13 | Modelos 3D propios | Aprobada | Fase técnica separada |
| D-14 | VR/visita inmersiva avanzada | Depriorizada | Reabrir solo por nueva demanda/evidencia |
| D-15 | Enlace alojado | Aprobado como objetivo futuro | **Después de validación comercial/local** |
| D-16 | IA conectada: redacción profesional primero | Aprobada como dirección | Fase futura, proveedor aún sin decidir |
| D-17 | F2: ahorrar trabajo sin bajar calidad + revisión humana | Criterio aprobado | Validación experimental F2 |
| D-18 | MCP: asistencia geométrica, no certificación | Posicionamiento aprobado | Permanente |
| D-19 | WebM con aviso si es el formato disponible | Aprobada | V2/V3 de vídeo, sujeto a pruebas reales |
| D-20 | Contenido/editorial del vídeo profesional | Aprobada | V1b/V2/V3 |

---

## Regla para retomarlo

Cuando el trabajo actual esté integrado en `master`, antes de implementar cualquiera de estas capacidades:

1. reconstruir el estado real del repositorio;
2. comprobar qué partes ya existen o cambiaron durante la integración;
3. elegir un corte pequeño y revisable;
4. definir datos/persistencia antes de UI si el cambio afecta al contrato;
5. implementar, probar y documentar sin mezclar varias capacidades grandes en una misma PR;
6. distinguir siempre entre «funciona técnicamente», «está validado» y «se puede prometer/lanzar»;
7. **no reabrir decisiones D-10–D-20 ya aprobadas** salvo nueva evidencia material, inviabilidad técnica/legal/económica o decisión expresa de Juanma.

Este documento registra **9 capacidades aprobadas y 11 decisiones transversales cerradas**; **no declara ninguna de ellas como implementada por el mero hecho de estar documentada**.
