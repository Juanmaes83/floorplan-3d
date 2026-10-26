Commits auditados: `5f86c43` · 141.0.7390.37 · renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) · emulación de teléfono en Chromium (no es un teléfono físico).

### B. Proyecto vacío: primera estancia, nombre y guardado

**Intención:** Proyecto vacío: crear la primera estancia, nombrarla, seguir y recargar sin perderse.

**Decisión de diseño:** El plano vacío conserva «Crear primera estancia» como única acción (sin duplicarla en la guía). Tras la primera estancia, la guía ya no declara «Objetivo completado»: propone «Añadir puertas y ventanas», que abre «Construir» con el foco en los tipos de hueco (O1).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | — | 6 capturas + vídeo (1440x900/B/) |
| 390x844 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | — | 6 capturas + vídeo (390x844/B/) |
| 844x390 | roomDesignDialog · 0 est., 0 muebles, 0 huecos | Plano vacío: «Aquí empieza tu distribuciónCrea tu primera estancia con dim» · Guía: «Crea o revisa las estancias» → «Abrir dibujo» | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | «Crear desde cero» → «Ver cambio» y «Confirmar y guardar» → Pulsar el botón principal de la guía → Abrir «Crear y amueblar» si está cerrada → «Nueva estancia» de la paleta → F5 | ninguno | sí | — | 6 capturas + vídeo (844x390/B/) |

### C. Ejemplo amueblado: construir, amueblar o revisar

**Intención:** En el ejemplo amueblado: construir una estancia, amueblar o revisar.

**Decisión de diseño:** La paleta empieza en «Construir» sin preferencia guardada (O6). En 3D la guía no vuelve a ofrecer 3D ni declara el objetivo cumplido: propone crear la vivienda propia (O1, O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | — | 7 capturas + vídeo (1440x900/C/) |
| 390x844 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | — | 7 capturas + vídeo (390x844/C/) |
| 844x390 | 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Probar el ejemplo» → Abrir «Crear y amueblar» → Pulsar la pestaña «Construir» → «Nueva estancia» → Escape → Buscar «cama» y pulsar el primer resultado → Botón principal de la guía | ninguno | sí | — | 7 capturas + vídeo (844x390/C/) |

### D. Subir una imagen: escala, segunda cota y trazado

**Intención:** Subir una imagen, ajustar la escala, comprobar una segunda cota y recuperarse de una contradictoria.

**Decisión de diseño:** El botón de la guía ejecuta el requisito («Empezar a ajustar») en vez de abrir la lista de tareas (O3). La segunda cota contradictoria mantiene su aviso y la guía ofrece repetirla.

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 0 est., 0 muebles, 0 huecos | Guía: «Ajusta y comprueba la escala» → «Empezar a ajustar» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» | 5 capturas + vídeo (1440x900/D/) |
| 390x844 | 0 est., 0 muebles, 0 huecos | Guía: «Ajusta y comprueba la escala» → «Empezar a ajustar» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» | 5 capturas + vídeo (390x844/D/) |
| 844x390 | 0 est., 0 muebles, 0 huecos | Guía: «Ajusta y comprueba la escala» → «Empezar a ajustar» | Guía: «Ajusta y comprueba la escala» → «Revisar escala» | Elegir manual-plan.png → Botón principal de la guía → Dos puntos y 2500 mm → Dos puntos y 3000 mm (contradice) → Botón de la guía | ninguno | sí | Nombre de proyecto con forma de archivo en la cabecera: «manual-plan» | 5 capturas + vídeo (844x390/D/) |

### I. Edificio de dos plantas: cambiar planta, ver todas y resolver conflictos

**Intención:** Edificio de dos plantas: cambiar de planta, ver conflictos, intentar presentar.

**Decisión de diseño:** El selector de planta aparece en la cabecera guiada; la guía propone «Ver conflictos» y dice que la presentación está bloqueada (O2, O7).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» | 4 capturas + vídeo (1440x900/I/) |
| 390x844 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» | 4 capturas + vídeo (390x844/I/) |
| 844x390 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Importar dúplex con conflictos → Pulsar la planta alta → Pulsar el aviso de conflictos → «Presentar mi vivienda» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» | 4 capturas + vídeo (844x390/I/) |

### L. Presentar la vivienda (una planta)

**Intención:** Presentar la vivienda de una planta y volver al editor.

**Decisión de diseño:** Presentar cuenta como revisión 3D y marca la versión como presentada; al volver la guía no pide abrir 3D (O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (1440x900/L/) |
| 390x844 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (390x844/L/) |
| 844x390 | presentationConfig · 13 est., 46 muebles, 22 huecos | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | Guía: «Estás viendo un ejemplo» → «Crear mi vivienda desde el ejemplo» | «Presentar mi vivienda» → Iniciar → Cerrar presentación | ninguno | sí | — | 3 capturas + vídeo (844x390/L/) |

### N. Reabrir un trabajo a medio hacer y continuar

**Intención:** Volver otro día y continuar; retroceder por la guía.

**Decisión de diseño:** «← Paso anterior» no sale del editor en la primera tarea (O5). Una tarea ya hecha a la que se volvió lo dice y ofrece seguir con lo pendiente (O4).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | Guía: «Ya hecho: Prepara tu proyecto» → «Seguir con: Añade puertas y ventanas» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → BLOQUEADO: locator.click: Timeout 5000ms exceeded. | previous-steps: locator.click: Timeout 5000ms exceeded. | **no** | — | 4 capturas + vídeo (1440x900/N/) |
| 390x844 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | Guía: «Ya hecho: Prepara tu proyecto» → «Seguir con: Añade puertas y ventanas» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → BLOQUEADO: locator.tap: Timeout 5000ms exceeded. | previous-steps: locator.tap: Timeout 5000ms exceeded. | **no** | — | 4 capturas + vídeo (390x844/N/) |
| 844x390 | welcomeDialog · 1 est., 0 muebles, 0 huecos | Guía: «Añade puertas y ventanas» → «Añadir puertas y ventanas» | Guía: «Ya hecho: Prepara tu proyecto» → «Seguir con: Añade puertas y ventanas» | Abrir la URL de entrada → «Continuar mi proyecto» → «← Paso anterior» (1) → BLOQUEADO: locator.tap: Timeout 5000ms exceeded. | previous-steps: locator.tap: Timeout 5000ms exceeded. | **no** | — | 4 capturas + vídeo (844x390/N/) |

### P. Entrega profesional: dúplex, conflictos, presentación, marca, lote ZIP y vuelta

**Intención:** Entrega profesional: dúplex con conflictos, presentación de dos plantas firmada con la marca, lote ZIP y vuelta al editor.

**Decisión de diseño:** Conflictos primero; la presentación cuenta como revisión y entrega; al volver, «Entrega preparada» sin acción dominante (O2).

| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Guarda tu proyecto» → «Confirmar guardado» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (1440x900/P/) |
| 390x844 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (390x844/P/) |
| 844x390 | 2 est., 2 muebles, 1 huecos · 2 conflictos en 2 plantas: distribución pendiente | Guía: «Resuelve los conflictos del edificio» → «Ver conflictos» | Guía: «Revisa la distribución en 3D» → «Abrir 3D» | «Subir un plano» con el ZIP del dúplex → Abrir la lista de conflictos → «Buscar sitio libre» → «Localizar en el plano 2D» → «Eliminar» → «Buscar sitio libre» → «Aplicar» → Conflictos resueltos → «Presentar mi vivienda» → «Tu marca profesional…» desde la presentación → Rellenar y «Guardar marca» → Elegir la marca y escribir el título → Iniciar → «Vistas + proyecto ZIP» → «Volver a editar» | ninguno | sí | La guía muestra como actual una tarea ya completada: «Resuelve los conflictos del edificio» · Conflicto 1: la propuesta no ofrece sitio libre; se localiza y elimina el mueble · ZIP: views/view-001.png, views/view-002.png, views/view-003.png, views/view-004.png, editable-building.zip, presentation.json | 15 capturas + vídeo (844x390/P/) |
