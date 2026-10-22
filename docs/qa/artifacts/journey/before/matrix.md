Commits auditados: `e796e3d` · 141.0.7390.37 · renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) · emulación de teléfono en Chromium (no es un teléfono físico).

### A. Primera visita: bienvenida y elección de entrada

**Intención:** Entender qué ofrece la herramienta y elegir cómo empezar: crear, subir un plano o explorar el ejemplo.

**Decisión de diseño:** Sin cambio de pantalla: la bienvenida ya ofrece tres entradas claras. Cancelar «Nueva estancia» vuelve a la bienvenida (comportamiento existente, cubierto por guide-navigation).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | welcomeDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir la URL de entrada (perfil limpio) → Pulsar «Crear desde cero» → Escape en «Nueva estancia» → «← Inicio» (o ya en la bienvenida tras cancelar) → Pulsar «Probar el ejemplo» → Pulsar «Subir un plano» y cerrar el selector sin elegir | ninguno | sí | — | 6 capturas + vídeo (1440x900/A/) |
| 390x844 | welcomeDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir la URL de entrada (perfil limpio) → Pulsar «Crear desde cero» → Escape en «Nueva estancia» → «← Inicio» (o ya en la bienvenida tras cancelar) → Pulsar «Probar el ejemplo» → Pulsar «Subir un plano» y cerrar el selector sin elegir | ninguno | sí | — | 6 capturas + vídeo (390x844/A/) |
| 844x390 | welcomeDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir la URL de entrada (perfil limpio) → Pulsar «Crear desde cero» → Escape en «Nueva estancia» → «← Inicio» (o ya en la bienvenida tras cancelar) → Pulsar «Probar el ejemplo» → Pulsar «Subir un plano» y cerrar el selector sin elegir | ninguno | sí | — | 6 capturas + vídeo (844x390/A/) |

### B. Proyecto vacío: primera estancia, nombre y guardado

**Intención:** Proyecto vacío: crear la primera estancia, nombrarla, seguir y recargar sin perderse.

**Decisión de diseño:** El plano vacío conserva «Crear primera estancia» como única acción (sin duplicarla en la guía). Tras la primera estancia, la guía ya no declara «Objetivo completado»: propone «Añadir puertas y ventanas», que abre «Construir» con el foco en los tipos de hueco (O1).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 2 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (1440x900/B/) |
| 390x844 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 2 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (390x844/B/) |
| 844x390 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 2 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (844x390/B/) |

### C. Ejemplo amueblado: construir, amueblar o revisar

**Intención:** En el ejemplo amueblado: construir una estancia, amueblar o revisar.

**Decisión de diseño:** La paleta empieza en «Construir» sin preferencia guardada (O6). En 3D la guía no vuelve a ofrecer 3D ni declara el objetivo cumplido: propone crear la vivienda propia (O1, O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 47 muebles y 22 huecos | 7 capturas + vídeo (1440x900/C/) |
| 390x844 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 47 muebles y 22 huecos | 7 capturas + vídeo (390x844/C/) |
| 844x390 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 47 muebles y 22 huecos | 7 capturas + vídeo (844x390/C/) |

### D. Subir una imagen: escala, segunda cota y trazado

**Intención:** Subir una imagen, ajustar la escala, comprobar una segunda cota y recuperarse de una contradictoria.

**Decisión de diseño:** El botón de la guía ejecuta el requisito («Empezar a ajustar») en vez de abrir la lista de tareas (O3). La segunda cota contradictoria mantiene su aviso y la guía ofrece repetirla.

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 0 est., 0 muebles, 0 huecos | Guía: «Crea o revisa las estancias» → «Resolver requisito» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → «Empezar a ajustar» en «Tu recorrido» → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» · «Empezar a ajustar» abrió «Tu recorrido» en vez de la calibración | 6 capturas + vídeo (1440x900/D/) |
| 390x844 | 0 est., 0 muebles, 0 huecos | Guía: «Crea o revisa las estancias» → «Resolver requisito» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → «Empezar a ajustar» en «Tu recorrido» → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» · «Empezar a ajustar» abrió «Tu recorrido» en vez de la calibración | 6 capturas + vídeo (390x844/D/) |
| 844x390 | 0 est., 0 muebles, 0 huecos | Guía: «Crea o revisa las estancias» → «Resolver requisito» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → «Empezar a ajustar» en «Tu recorrido» → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» · «Empezar a ajustar» abrió «Tu recorrido» en vez de la calibración | 6 capturas + vídeo (844x390/D/) |

### E. Estancias y muros: seleccionar, editar, cancelar y deshacer

**Intención:** Seleccionar y editar estancias y muros; cancelar, deshacer y rehacer.

**Decisión de diseño:** «Rehacer» visible junto a «Deshacer» en modo guiado (O7).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía oculta | Tocar la estancia en el plano → «Dimensiones» → Escape → «Dibujar muro» → Escape → Deshacer → Rehacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · Oculto en modo guiado: Rehacer | 7 capturas + vídeo (1440x900/E/) |
| 390x844 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía oculta | Tocar la estancia en el plano → «Dimensiones» → Escape → «Dibujar muro» → Escape → Deshacer → Rehacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · Oculto en modo guiado: Rehacer | 7 capturas + vídeo (390x844/E/) |
| 844x390 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía oculta | Tocar la estancia en el plano → «Dimensiones» → Escape → «Dibujar muro» → Escape → Deshacer → Rehacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · Oculto en modo guiado: Rehacer | 7 capturas + vídeo (844x390/E/) |

### F. Puertas y ventanas: añadir, seleccionar, editar y volver

**Intención:** Añadir una ventana a una estancia, ver el resultado y volver.

**Decisión de diseño:** En el teléfono, abrir la paleta con un hueco a medio colocar cancela ese modo y lo anuncia (M3).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Ventana» en la paleta → Seleccionar estancia y «Ventana» → Tocar el muro superior → Escape | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (1440x900/F/) |
| 390x844 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Ventana» en la paleta → Seleccionar estancia y «Ventana» → Tocar el muro superior → Escape | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (390x844/F/) |
| 844x390 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Ventana» en la paleta → Seleccionar estancia y «Ventana» → Tocar el muro superior → Escape | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (844x390/F/) |

### G. Muebles: buscar, añadir, duplicar, sin sitio y conflicto con escalera

**Intención:** Buscar, añadir y duplicar muebles; sin sitio; conflicto con la escalera.

**Decisión de diseño:** En el teléfono la barra de selección cabe y el aviso «Añadido…» queda encima de ella (M1, M2). Con conflictos, la guía propone «Ver conflictos» (O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir «Crear y amueblar» → Buscar «sofá» y pulsar el primero → Duplicar en la barra de selección → Añadir seis camas → Importar dúplex (ZIP) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 1 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 2 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 8 muebles y 0 huecos · La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» | 5 capturas + vídeo (1440x900/G/) |
| 390x844 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir «Crear y amueblar» → Buscar «sofá» y pulsar el primero → Duplicar en la barra de selección → Añadir seis camas → Importar dúplex (ZIP) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 1 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 2 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 8 muebles y 0 huecos · La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · El aviso «Añadido…» tapa la barra de selección tras añadir un mueble | 5 capturas + vídeo (390x844/G/) |
| 844x390 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Abrir «Crear y amueblar» → Buscar «sofá» y pulsar el primero → Duplicar en la barra de selección → Añadir seis camas → Importar dúplex (ZIP) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 1 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 2 muebles y 0 huecos · La guía declara el objetivo completado (create) con 1 estancias, 8 muebles y 0 huecos · La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» | 5 capturas + vídeo (844x390/G/) |

### H. Suelos y paredes: encontrar, previsualizar, aplicar y deshacer

**Intención:** Cambiar el suelo de una estancia: encontrarlo, previsualizar, aplicar y deshacer.

**Decisión de diseño:** Sin cambio: el camino existe (barra de selección «Suelo / Propiedades» en el teléfono).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Tocar la estancia → «Suelo» → Elegir el primer acabado → Escape → Deshacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 5 capturas + vídeo (1440x900/H/) |
| 390x844 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Tocar la estancia → «Suelo» → Elegir el primer acabado → Escape → Deshacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 5 capturas + vídeo (390x844/H/) |
| 844x390 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Tocar la estancia → «Suelo» → Elegir el primer acabado → Escape → Deshacer | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 5 capturas + vídeo (844x390/H/) |

### I. Edificio de dos plantas: cambiar planta, ver todas y resolver conflictos

**Intención:** Edificio de dos plantas: cambiar de planta, ver conflictos, intentar presentar.

**Decisión de diseño:** El selector de planta aparece en la cabecera guiada; la guía propone «Ver conflictos» y dice que la presentación está bloqueada (O2, O7).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Oculto en modo guiado: Cambiar de planta | 4 capturas + vídeo (1440x900/I/) |
| 390x844 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Oculto en modo guiado: Cambiar de planta | 4 capturas + vídeo (390x844/I/) |
| 844x390 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Oculto en modo guiado: Cambiar de planta | 4 capturas + vídeo (844x390/I/) |

### J. Revisar distribución y diagnósticos

**Intención:** Revisar la distribución y entender un diagnóstico.

**Decisión de diseño:** Sin cambio en este corte; la búsqueda «revisar distribución» no lleva a la revisión 2D y se registra como pendiente.

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | actionDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Buscar «revisar distribución» → «Plano propio» → «Revisar distribución» | ninguno | sí | — | 3 capturas + vídeo (1440x900/J/) |
| 390x844 | actionDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Buscar «revisar distribución» → «Plano propio» → «Revisar distribución» | ninguno | sí | — | 3 capturas + vídeo (390x844/J/) |
| 844x390 | actionDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Buscar «revisar distribución» → «Plano propio» → «Revisar distribución» | ninguno | sí | — | 3 capturas + vídeo (844x390/J/) |

### K. 2D, 3D y recorrido: entrar, entender y volver

**Intención:** Entrar en 3D, recorrer y volver a 2D con el contexto.

**Decisión de diseño:** «Vista aérea / Recorrer» visibles en 3D en modo guiado (O7). Abrir 3D ya no declara el objetivo cumplido en el ejemplo (O1).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Tocar «Salón» → Pulsar 3D → «Recorrer» → «Salir» → Pulsar 2D | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 46 muebles y 22 huecos · Oculto en modo guiado: Recorrer | 5 capturas + vídeo (1440x900/K/) |
| 390x844 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Tocar «Salón» → Pulsar 3D → «Recorrer» → «Salir» → Pulsar 2D | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 46 muebles y 22 huecos · Oculto en modo guiado: Recorrer | 5 capturas + vídeo (390x844/K/) |
| 844x390 | 13 est., 47 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | Tocar «Salón» → Pulsar 3D → «Recorrer» → «Salir» → Pulsar 2D | ninguno | sí | La guía declara el objetivo completado (review) con 13 estancias, 47 muebles y 22 huecos · Oculto en modo guiado: Recorrer | 5 capturas + vídeo (844x390/K/) |

### L. Presentar la vivienda (una planta)

**Intención:** Presentar la vivienda de una planta y volver al editor.

**Decisión de diseño:** Presentar cuenta como revisión 3D y marca la versión como presentada; al volver la guía no pide abrir 3D (O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (1440x900/L/) |
| 390x844 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (390x844/L/) |
| 844x390 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (844x390/L/) |

### M. Guardar, exportar y entregar

**Intención:** Saber dónde está guardado el trabajo y qué se exporta para el cliente.

**Decisión de diseño:** Sin cambio: «Proyectos» y la lámina siguen igual; el menú «Archivo» sigue en «Ver todas las herramientas» y exportar copia está en «Tareas y ayuda».

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | projectsDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | «Proyectos» → Abrir el menú de archivo → «Lámina» | ninguno | sí | Oculto en modo guiado: Menú Archivo | 3 capturas + vídeo (1440x900/M/) |
| 390x844 | projectsDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | «Proyectos» → Abrir el menú de archivo → «Lámina» | ninguno | sí | Oculto en modo guiado: Menú Archivo | 3 capturas + vídeo (390x844/M/) |
| 844x390 | projectsDialog · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía oculta | «Proyectos» → Abrir el menú de archivo → «Lámina» | ninguno | sí | Oculto en modo guiado: Menú Archivo | 3 capturas + vídeo (844x390/M/) |

### N. Reabrir un trabajo a medio hacer y continuar

**Intención:** Volver otro día y continuar; retroceder por la guía.

**Decisión de diseño:** «← Paso anterior» no sale del editor en la primera tarea (O5). Una tarea ya hecha a la que se volvió lo dice y ofrece seguir con lo pendiente (O4).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Prepara tu proyecto» → «Volver al inicio» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → «← Paso anterior» (2) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (1440x900/N/) |
| 390x844 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Prepara tu proyecto» → «Volver al inicio» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → «← Paso anterior» (2) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (390x844/N/) |
| 844x390 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «Prepara tu proyecto» → «Volver al inicio» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → «← Paso anterior» (2) | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 4 capturas + vídeo (844x390/N/) |

### O. Cambiar de intención, cerrar, atrás, cancelar, deshacer

**Intención:** Cambiar de intención, cerrar paneles y la guía, volver atrás.

**Decisión de diseño:** Sin modos ocultos tras la paleta en el teléfono (M3); cerrar y recuperar la guía no cambia.

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Puerta abatible» → Cerrar «Crear y amueblar» → «Cambiar objetivo» → «×» → «Recuperar guía» → Atrás | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (1440x900/O/) |
| 390x844 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Puerta abatible» → Cerrar «Crear y amueblar» → «Cambiar objetivo» → «×» → «Recuperar guía» → Atrás | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (390x844/O/) |
| 844x390 | 1 est., 0 muebles, 0 huecos | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | Guía: «✓ Objetivo completado» → «Ver resultado y exportar» | «Puerta abatible» → Cerrar «Crear y amueblar» → «Cambiar objetivo» → «×» → «Recuperar guía» → Atrás | ninguno | sí | La guía declara el objetivo completado (create) con 1 estancias, 0 muebles y 0 huecos | 6 capturas + vídeo (844x390/O/) |

### P. Entrega profesional: dúplex, conflictos, presentación, marca, lote ZIP y vuelta

**Intención:** Entrega profesional: dúplex con conflictos, presentación de dos plantas firmada con la marca, lote ZIP y vuelta al editor.

**Decisión de diseño:** Conflictos primero; la presentación cuenta como revisión y entrega; al volver, «Entrega preparada» sin acción dominante (O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (1440x900/P/) |
| 390x844 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (390x844/P/) |
| 844x390 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Revisa la distribución en 3D» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (844x390/P/) |
