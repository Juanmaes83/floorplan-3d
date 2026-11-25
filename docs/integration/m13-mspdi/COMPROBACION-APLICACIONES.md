# M13 · Comprobación en Microsoft Project y GanttProject

Hoja generada por `scripts/interop/mspdi/checklist.cjs` a partir de los XML de `muestras/`: describe **exactamente** lo que contiene cada archivo. La lectura con MPXJ 13.12.0 ya da estos mismos valores campo a campo (`verify-report.json`), y queda acreditada como **prueba del lector**. Esta hoja sirve para comprobarlo **en las aplicaciones**.

## Cómo abrir

| Aplicación | Pasos |
|---|---|
| Microsoft Project (escritorio) | 1. Archivo › Abrir y elegir el `.xml` (tipo «Formato XML»).<br>2. Si pregunta, «Como un nuevo proyecto».<br>3. Añadir las columnas **Id**, **Nombre**, **Duración**, **Comienzo**, **Fin**, **Predecesoras**, **Tipo de restricción**, **Fecha de restricción** y **Texto1** («RUBIK id») |
| GanttProject 3.4 | 1. Proyecto › Importar › Microsoft Project (`.xml`).<br>2. Revisar la tabla y el Gantt.<br>3. Abrir cada dependencia en «Propiedades de la tarea» › Predecesoras |

## Qué debe cumplirse en todos los archivos

1. **Ninguna fecha se mueve al abrir.** Cada tarea lleva «No comenzar antes de» en su inicio, y el calendario del proyecto es «RUBIK · días naturales (7 días)», con sábados y domingos laborables.
2. Las **duraciones** son días naturales: una tarea que cruza un fin de semana conserva sus días.
3. Los **hitos** tienen duración 0 y aparecen con el símbolo de hito.
4. Las **predecesoras** conservan tipo y desfase: FC/CC/FF/CF en Microsoft Project en español, que en GanttProject equivalen a Fin-Inicio, Inicio-Inicio, Fin-Fin e Inicio-Fin.
5. **Avance 0 %** en todas las tareas, sin fechas reales ni costes: es un plan, no una ejecución.
6. En Microsoft Project, **Texto1** muestra el id de RUBIK y **Texto2** su WBS. GanttProject puede no mostrar los campos personalizados: no es un fallo del archivo.

**Nota sobre el fin en GanttProject:** la duración en días es la referencia. Si la columna «Fin» de GanttProject muestra el día siguiente al último día de trabajo, es su convención de visualización, no un desplazamiento: comprobar que la barra termina al final del día indicado aquí.

**Formato de las columnas:** «Inicio» y «Fin» se dan como dd/mm/aaaa hh:mm. En «Predecesoras», «2CC+4 días» significa que depende de la fila 2, de comienzo a comienzo, con 4 días de desfase.


## `interfaz-escritorio.mspdi.xml`

Plan de obra · Vivienda M13 · **4 filas**, 1 hitos y 3 dependencias. Inicio del proyecto: 01/03/2027 08:00 · fin: 22/03/2027 17:00.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | Replanteo y protecciones | 01/03/2027 08:00 | 03/03/2027 17:00 | 3 días | — | tsk_5ab75711d9cc9ace | ☐ | ☐ |
| 2 | Demolición & retirada | 04/03/2027 08:00 | 12/03/2027 17:00 | 9 días | 1FC | tsk_062f78e3767cc6ad | ☐ | ☐ |
| 3 | Instalaciones | 08/03/2027 08:00 | 19/03/2027 17:00 | 12 días | 2CC+4 días | tsk_d6331c6cdf73c1ff | ☐ | ☐ |
| 4 | Entrega de llaves | 22/03/2027 08:00 | 22/03/2027 08:00 | 0 días (hito) | 3FC+2 días | tsk_18da3b876ba74687 | ☐ | ☐ |

## `milestones.xml`

RUBIK · milestones · **3 filas**, 2 hitos y 2 dependencias. Inicio del proyecto: 04/01/2027 08:00 · fin: 08/01/2027 17:00.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | FIXTURE start | 04/01/2027 08:00 | 04/01/2027 08:00 | 0 días (hito) | — | start | ☐ | ☐ |
| 2 | FIXTURE one-day-work | 05/01/2027 08:00 | 05/01/2027 17:00 | 1 día | 1FC | one-day-work | ☐ | ☐ |
| 3 | FIXTURE handover | 08/01/2027 08:00 | 08/01/2027 08:00 | 0 días (hito) | 2FC | handover | ☐ | ☐ |

## `dependencyTypes.xml`

RUBIK · dependencyTypes · **6 filas**, 0 hitos y 5 dependencias. Inicio del proyecto: 25/02/2027 08:00 · fin: 20/03/2027 17:00.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | FIXTURE sf | 25/02/2027 08:00 | 02/03/2027 17:00 | 6 días | 2CF+1 día | sf | ☐ | ☐ |
| 2 | FIXTURE a | 01/03/2027 08:00 | 10/03/2027 17:00 | 10 días | — | a | ☐ | ☐ |
| 3 | FIXTURE ss | 03/03/2027 08:00 | 12/03/2027 17:00 | 10 días | 2CC+2 días | ss | ☐ | ☐ |
| 4 | FIXTURE ff | 05/03/2027 08:00 | 09/03/2027 17:00 | 5 días | 2FF-1 día | ff | ☐ | ☐ |
| 5 | FIXTURE lead | 09/03/2027 08:00 | 20/03/2027 17:00 | 12 días | 2FC-2 días | lead | ☐ | ☐ |
| 6 | FIXTURE fs | 13/03/2027 08:00 | 16/03/2027 17:00 | 4 días | 2FC+2 días | fs | ☐ | ☐ |

## `textAndCalendar.xml`

RUBIK · textAndCalendar · **2 filas**, 0 hitos y 1 dependencias. Inicio del proyecto: 30/12/2027 08:00 · fin: 01/03/2028 17:00.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | Demolición & «retirada» <tabique> "norte" — fase 1 | 30/12/2027 08:00 | 03/01/2028 17:00 | 5 días | — | amp | ☐ | ☐ |
| 2 | Solera · ñandú · ç · día 29/02 | 28/02/2028 08:00 | 01/03/2028 17:00 | 3 días | 1FC | leap | ☐ | ☐ |

## `simpleHouse.xml`

RUBIK · simpleHouse · **8 filas**, 0 hitos y 8 dependencias. Inicio del proyecto: 01/12/2026 08:00 · fin: 26/02/2027 17:00.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | FIXTURE site | 01/12/2026 08:00 | 04/12/2026 17:00 | 4 días | — | site | ☐ | ☐ |
| 2 | FIXTURE foundations | 07/12/2026 08:00 | 18/12/2026 17:00 | 12 días | 1FC | foundations | ☐ | ☐ |
| 3 | FIXTURE structure | 21/12/2026 08:00 | 15/01/2027 17:00 | 26 días | 2FC+2 días | structure | ☐ | ☐ |
| 4 | FIXTURE services | 05/01/2027 08:00 | 05/02/2027 17:00 | 32 días | 3CC+15 días | services | ☐ | ☐ |
| 5 | FIXTURE roof | 18/01/2027 08:00 | 29/01/2027 17:00 | 12 días | 3FC | roof | ☐ | ☐ |
| 6 | FIXTURE cladding | 01/02/2027 08:00 | 12/02/2027 17:00 | 12 días | 5FC | cladding | ☐ | ☐ |
| 7 | FIXTURE floors | 08/02/2027 08:00 | 15/02/2027 17:00 | 8 días | 6FF+3 días | floors | ☐ | ☐ |
| 8 | FIXTURE finishes | 16/02/2027 08:00 | 26/02/2027 17:00 | 11 días | 4FC; 7FC | finishes | ☐ | ☐ |

## `complex.xml`

RUBIK · complex · **120 filas**, 6 hitos y 149 dependencias. Inicio del proyecto: 04/01/2027 08:00 · fin: 01/05/2027 17:00.

Se listan las 6 primeras filas y los 6 hitos. Comprobar además el total de filas, de hitos y de dependencias, y que el fin del proyecto coincide.

| Id | Nombre | Inicio | Fin | Duración | Predecesoras | RUBIK id (Texto1) | ✓ MS Project | ✓ GanttProject |
|---|---|---|---|---|---|---|---|---|
| 1 | FIXTURE f0-t0 | 04/01/2027 08:00 | 06/01/2027 17:00 | 3 días | — | f0-t0 | ☐ | ☐ |
| 2 | FIXTURE f1-t0 | 06/01/2027 08:00 | 11/01/2027 17:00 | 6 días | 1FF+5 días | f1-t0 | ☐ | ☐ |
| 3 | FIXTURE f0-t1 | 07/01/2027 08:00 | 10/01/2027 17:00 | 4 días | 1FC | f0-t1 | ☐ | ☐ |
| 4 | FIXTURE f2-t0 | 08/01/2027 08:00 | 16/01/2027 17:00 | 9 días | 2FF+5 días | f2-t0 | ☐ | ☐ |
| 5 | FIXTURE f3-t0 | 10/01/2027 08:00 | 21/01/2027 17:00 | 12 días | 4FF+5 días | f3-t0 | ☐ | ☐ |
| 6 | FIXTURE f0-t2 | 11/01/2027 08:00 | 15/01/2027 17:00 | 5 días | 3FC | f0-t2 | ☐ | ☐ |
| 103 | FIXTURE hito fin frente 1 | 31/03/2027 08:00 | 31/03/2027 08:00 | 0 días (hito) | 93FC | m0 | ☐ | ☐ |
| 108 | FIXTURE hito fin frente 2 | 07/04/2027 08:00 | 07/04/2027 08:00 | 0 días (hito) | 99FC | m1 | ☐ | ☐ |
| 112 | FIXTURE hito fin frente 3 | 12/04/2027 08:00 | 12/04/2027 08:00 | 0 días (hito) | 104FC | m2 | ☐ | ☐ |
| 116 | FIXTURE hito fin frente 4 | 17/04/2027 08:00 | 17/04/2027 08:00 | 0 días (hito) | 110FC | m3 | ☐ | ☐ |
| 118 | FIXTURE hito fin frente 5 | 22/04/2027 08:00 | 22/04/2027 08:00 | 0 días (hito) | 114FC | m4 | ☐ | ☐ |
| 120 | FIXTURE hito fin frente 6 | 01/05/2027 08:00 | 01/05/2027 08:00 | 0 días (hito) | 119FC | m5 | ☐ | ☐ |

## Resultado de la comprobación externa

| Aplicación y versión | Archivos comprobados | Resultado | Observaciones | Quién y fecha |
|---|---|---|---|---|
| Microsoft Project | | ☐ correcto ☐ con diferencias | | |
| GanttProject 3.4.x | | ☐ correcto ☐ con diferencias | | |

