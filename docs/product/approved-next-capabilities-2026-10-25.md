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

## Regla para retomarlo

Cuando el trabajo actual esté integrado en `master`, antes de implementar cualquiera de estas capacidades:

1. reconstruir el estado real del repositorio;
2. comprobar qué partes ya existen o cambiaron durante la integración;
3. elegir un corte pequeño y revisable;
4. definir datos/persistencia antes de UI si el cambio afecta al contrato;
5. implementar, probar y documentar sin mezclar varias capacidades grandes en una misma PR;
6. distinguir siempre entre «funciona técnicamente», «está validado» y «se puede prometer/lanzar».

Este documento registra decisiones aprobadas; **no declara ninguna de estas nueve capacidades como implementada por el mero hecho de estar documentada**.
