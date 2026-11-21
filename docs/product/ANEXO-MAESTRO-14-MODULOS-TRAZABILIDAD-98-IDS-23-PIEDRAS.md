# RUBIK SOTA — ANEXO CANÓNICO DE TRAZABILIDAD: 98 IDs, 17 PIEDRAS Y 6 SIMULATOR

**Anexo técnico del [Documento maestro operativo de 14 módulos](MAESTRO-OPERATIVO-14-MODULOS-DE-CIERRE.md).** Corte de revisión: 21/11/2026; fuente canónica del estado de ID: [matriz v1.12](MATRIZ-TRAZABILIDAD-v1.12.md) (fotografía del 18/11/2026). Ola histórica: [inventario de olas 0–5](../qa/rubik-estado-unico-piedras-olas-2026-11-12.md), más HOM-04 de ola 1 añadido al catálogo el 17/11. Producto consultado: `1bc501d64ab091a8fac25669bf8843f8f5076a3d`.

**Regla:** la columna «Módulo director» es **nueva y solo organizativa**; cada ID mantiene exactamente su nombre, P, ola, estado v1.12 e hito. No redefine estados actuales; verificar PR/master nuevamente antes de cada misión. Un ID puede ser usado por otros módulos como consumidor secundario. M01 y M03 tienen autoridad F0/piedras/Blender fuera de los 98; **no fabricar códigos nuevos**.

## Control de integridad del anexo

| Fuente | Distribución comprobada | Total |
|---|---|---:|
| P1…P8 | 10 / 26 / 6 / 23 / 10 / 8 / 8 / 7 | **98** |
| Olas 0–5 | 10 / 9 / 28 / 22 / 14 / 15 | **98** |
| IDs únicos + módulo director | Una y solo una asignación principal cada uno | **98** |
| Piedras SCULPT | R01–R03 (3), OP-01…OP-12 (12), RG-01/02 (2) | **17** |
| Simulator | A–F | **6** |
| Piedra + Simulator | Sin sumar donantes o 13 áreas G0–G12 como módulos | **23** |

## Matriz cruzada 98 × módulos

| ID | Nombre v1.12 | P original | Ola original | Estado documental 18/11 | Hito | Módulo director |
|---|---|---|---:|---|:---:|---|
| GOV-01a | Fusionar Render IA D1 | P2 | 0 | RV | A | **M06** |
| GOV-01b | Configurar entorno de Render IA | P2 | 0 | RV | A | **M06** |
| GOV-01c | Promote de Render IA | P2 | 0 | RV | A | **M06** |
| GOV-09a | Acreditar el modelo antes del Promote | P2 | 0 | SU | A | **M06** |
| GOV-09b | Confirmar modelo en el registro de Production | P2 | 0 | RV | A | **M06** |
| GOV-02 | Cerrar o archivar PR obsoletas | P4 | 0 | RV | A | **M02** |
| GOV-03 | Registro único de capacidades | P4 | 0 | PA | B | **M12** |
| GOV-04 | Documentación de la rama de preparación a master | P4 | 0 | RV | A | **M02** |
| GOV-05 | Revisión jurídica y privacidad | P3 | 1 | DX | B | **M02** |
| GOV-06a | Autenticación y cuotas por profesional | P3 | 2 | PA | B | **M02** |
| GOV-06b | Plataforma multiusuario avanzada | P3 | 5 | ND | D | **M02** |
| GOV-07 | Hardware real y resiliencia WebGL | P4 | 1 | PA | B | **M12** |
| GOV-08 | Publicación segura de enlaces de cliente | P3 | 1 | RL | B | **M02** |
| HOM-01 | Home por profesión | P4 | 1 | RV | A | **M12** |
| HOM-02 | Perfil Constructora | P4 | 1 | RV | A | **M12** |
| HOM-03 | «Nuevos servicios IA» en la Home | P4 | 2 | RV | A | **M12** |
| HOM-04 | Demostraciones guiadas en la Home | P4 | 1 | RL | A | **M12** |
| ENT-01 | Visita 3D del cliente | P1 | 1 | RL | B | **M04** |
| ENT-02 | Seguridad del enlace de cliente | P3 | 1 | RL | B | **M02** |
| ENT-03 | Story y plantillas hacia el cliente | P1 | 2 | EX | B | **M04** |
| ENT-04 | Dossier antes/después con presupuesto rotulado | P1 | 2 | RL | B | **M04** |
| ENT-05 | Fichas de imagen trazables | P1 | 3 | PA | C | **M04** |
| ENT-06 | Lotes de entrega con coste y cancelación | P1 | 3 | ND | C | **M04** |
| ENT-07 | Portal profesional y white-label | P3 | 5 | ND | D | **M02** |
| IMG-01 | Textos completos en la exportación | P2 | 0 | RV | A | **M06** |
| IMG-02 | Consumo, coste y registro por imagen | P2 | 0 | RV | A | **M06** |
| IMG-03 | Calidad explícita y coste previsto | P2 | 2 | ND | C | **M06** |
| IMG-04 | Confirmación de gasto y lotes | P2 | 2 | PA | B | **M06** |
| IMG-05 | Catálogo amplio de suelos | P5 | 2 | PA | C | **M07** |
| IMG-06 | Paredes y techos | P5 | 2 | PA | C | **M07** |
| IMG-07 | Iluminación del render IA | P2 | 2 | IR | C | **M06** |
| IMG-08 | Estilos | P2 | 2 | PA | C | **M06** |
| IMG-09 | Decoración visual | P2 | 3 | ND | C | **M06** |
| IMG-10 | Intensidad de cambio | P2 | 2 | SI | C | **M06** |
| IMG-11 | Presets por estancia | P2 | 2 | SI | C | **M06** |
| IMG-12 | Variantes, comparador y favoritos | P2 | 2 | PA | C | **M06** |
| IMG-13 | Biblioteca visual del estudio | P5 | 3 | PA | C | **M07** |
| IMG-14 | Edición por zona | P2 | 4 | SI | C | **M06** |
| IMG-15 | Referencia estética propia | P2 | 3 | SI | C | **M06** |
| IMG-16 | Coherencia entre vistas | P2 | 3 | ND | C | **M06** |
| IMG-22 | Panel de consumo IA | P2 | 3 | IR | C | **M06** |
| CAM-01 | Cámara posicionable desde el plano 2D | P2 | 2 | IR | C | **M06** |
| PER-01 | Personas genéricas | P8 | 3 | ND | D | **M11** |
| PER-02 | Personas reales con consentimiento | P8 | 4 | DX | D | **M11** |
| PER-03 | Narrativas «Así se vive» | P8 | 4 | ND | D | **M11** |
| FOT-01 | Reforma sobre la foto del cliente | P2 | 3 | SI | B | **M06** |
| FOT-02 | Foto a espacio métrico editable | P6 | 5 | ND | D | **M09** |
| MUE-01 | «Trae tu mueble» simple | P5 | 3 | RV | A | **M10** |
| MUE-02 | Foto a mueble 3D reconstruido | P8 | 5 | ND | D | **M10** |
| CAT-01 | Catálogo del profesional como referencia del render | P2 | 3 | SI | B | **M06** |
| CAT-02 | Catálogos con fichas, SKU y medidas | P5 | 4 | EX | B | **M10** |
| CAT-03 | Productos 3D colocables y presupuestados | P5 | 5 | PA | C | **M10** |
| BIB-01 | Biblioteca propia con licencias | P5 | 2 | PA | B | **M07** |
| VID-01 | Animación determinista | P1 | 3 | PA | C | **M11** |
| PAN-01 | Panorama conceptual | P8 | 4 | ND | D | **M11** |
| PAN-02 | 360 del modelo 3D real | P8 | 5 | ND | C | **M11** |
| VID-02 | Vídeo generativo | P8 | 5 | ND | D | **M11** |
| UX-07 | Comparador antes/después | P1 | 2 | RV | A | **M04** |
| UX-22 | Minimapa en el paseo | P4 | 2 | RV | A | **M12** |
| UX-23 | Accesos por estancia | P4 | 2 | RV | A | **M12** |
| UX-25 | Abrir o cerrar todas las puertas | P4 | 2 | RV | A | **M12** |
| UX-09 | Maqueta blanca | P4 | 2 | PA | B | **M12** |
| UX-05 | Selector agrupado de modos | P4 | 2 | PA | B | **M12** |
| UX-03 | Panel contextual con KPI | P4 | 2 | RL | B | **M12** |
| UX-08 | Cotas en vivo | P4 | 2 | RV | A | **M12** |
| UX-04 | Ayudas y atajos | P4 | 2 | RL | C | **M12** |
| PRE-01 | Preflight de integridad | P7 | 3 | RL | C | **M05** |
| UX-11 | Acabado de pared desde el 3D | P4 | 3 | PA | C | **M12** |
| UX-12 | Amueblar por estancia | P7 | 3 | EX | C | **M10** |
| UX-13 | Recetas de estilo | P7 | 3 | EX | C | **M10** |
| UX-24 | Sugerir el tipo de estancia | P4 | 3 | PV | B | **M12** |
| UX-10 | Píldora de inspección | P4 | 4 | IR | C | **M12** |
| UX-26 | Intercambiar usos de estancias | P4 | 4 | PV | C | **M12** |
| UX-21 | Panel de sol | P5 | 4 | PA | C | **M07** |
| LUZ-01 | Iluminación ambiental | P5 | 5 | IR | D | **M07** |
| UX-14 | Move Rooms topológico | P7 | 5 | ND | D | **M08** |
| OBR-01 | Pendientes de FT3D-8 | P1 | 1 | RV | A | **M13** |
| OBR-02 | Fantasma de la siguiente tarea | P1 | 2 | RV | A | **M13** |
| OBR-03 | % del plan y coste planificado | P1 | 2 | RV | A | **M13** |
| OBR-04 | Muros de carga declarados y pasos libres | P5 | 3 | PA | C | **M13** |
| OBR-05 | Exportar a MS Project o GanttProject | P6 | 4 | IR | C | **M13** |
| G-06 | Medir sobre el plano importado | P6 | 2 | PA | C | **M09** |
| G-01 | Auditoría del plano importado | P6 | 4 | EX | C | **M09** |
| G-08 | Alinear dos planos | P6 | 4 | SU | C | **M09** |
| G-02 | Exportación DXF profesional | P6 | 4 | RL | C | **M14** |
| G-07 | Exportación IMDF | P6 | 5 | RD | D | **M14** |
| G-04 | Foto, LiDAR o IFC a espacio métrico | P6 | 5 | ND | D | **M09** |
| AG-0 | Contratos, permisos, telemetría y costes | P2 | 3 | PA | B | **M05** |
| AG-1 | Asistente de consulta | P2 | 4 | RL | B | **M05** |
| AG-2 | Propuestas revisables con diff | P7 | 4 | RL | C | **M05** |
| AG-3 | Aplicar con confirmación y deshacer | P7 | 5 | RL | C | **M05** |
| AG-4 | Orquestar renders | P2 | 5 | PA | C | **M05** |
| AG-5 | Capacidades avanzadas | P7 | 5 | ND | D | **M05** |
| AST-01 | Onboarding con tarjetas | P4 | 3 | RL | B | **M12** |
| GEN-01 | Generación paramétrica de distribuciones | P7 | 5 | IR | D | **M08** |
| ECO-01 | Medición de coste por imagen y lote | P2 | 2 | PA | B | **M06** |
| ECO-02 | Paquetes y precios comerciales | P4 | 3 | DX | B | **M13** |
| ECO-03 | Piloto con 5 profesionales | P4 | 3 | ND | B | **M13** |

## Registro íntegro de piedras y Simulator (23/23)

| Alias | Módulo director | Estado y frontera real |
|---|---|---|
| R01 | M09 | Reconocimiento raster/OCR; laboratorio HOLD, escala/planos reales y derechos pendientes |
| R02 | M08 | Techos; R02-A experimental integrado, no normativo; R02-B no acreditado |
| R03 | M10 | Armarios paramétricos; experimental integrado y pendiente validación profesional |
| OP-01 | M01 | Continuidad F0: F0.2b integrado, F0.2c/F0.3 y F1 condicionados |
| OP-02 | M12 | Render bajo demanda integrado; consumidor transversal M07/M11 |
| OP-03 | M14 | Exportación DXF integrada con límites; validar en CAD profesional |
| OP-04 | M12 | Unión RoomPlan integrada, UX y escaneos reales por verificar; cruce M09 |
| OP-05 | M10 | GLB privados: LAB; C1 NO-GO; cruce F3 y M11 |
| OP-06 | M08 | Selección, alineación y edición múltiple; no consta cierre |
| OP-07 | M08 | Muros curvos/inclinados: LAB/HOLD sobre contrato geométrico |
| OP-08 | M08 | Escaleras/edificios avanzados: alcance pendiente |
| OP-09 | M08 | Plantillas paramétricas: alcance pendiente |
| OP-10 | M03 | Donante openPlan3D render local: NO confundir con flujo OP-10 Blender de RUBIK; cruce M07 |
| OP-11 | M07 | Ambientación: lote 01 integrado, lote 02 pendiente; cruce M10 |
| OP-12 | M05 | Puente MCP: herramientas y etapas parciales, no escritura autónoma |
| RG-01 | M06 | Reforma por foto: simulación; servicio real requiere permiso y costes |
| RG-02 | M06 | Estilos/generación visual: ampliar sobre generadores vigentes, cruce M07 |
| Simulator A | M11 | Fábrica de Evolución integrada #295; cruce M13 |
| Simulator B | M11 | Candidata lab con SB-01…SB-11 reportada 11/11; NO integrado |
| Simulator C | M12 | Etiquetas 3D integradas #293; cruce M11 |
| Simulator D | M11 | Captura reproducible LAB; gate WebKit pendiente |
| Simulator E | M11 | Preflight de movimiento integrado #291, solo QA |
| Simulator F | M11 | Audio HOLD, derechos/consentimiento/decisión |

## Correspondencias secundarias esenciales (sin duplicación)

M01→M02: nube y sesión dependen de identidad. M03→M04/M11: Blender comparte entregas y presentación, pero su render no es el grabador de vídeo. M05→M06/M12: Asistente consulta proyecto y motores IA sin poseer un segundo escritor. M07→M10/M11: materiales y activos son consumidos por catálogo y vídeo. M08→M09/M14: geometría canónica gobierna reconocimiento y CAD. M10→M04/M11: GLB privado no se filtra en entregas públicas. M13→M04/M14: presupuesto y obra mantienen la procedencia de cantidades al exportar. M14→M01: el expediente portable usa la autoridad de proyecto y no reemplaza almacenamiento.

## Fuentes que no se deben confundir con módulos implementados

Los 13 alias donantes G0–G12 son **áreas de investigación**; las ocho PR upstream y los repos externos no son automáticamente módulos autorizados. Los seis descartes X-01…X-06 quedan fuera de los 98. La procedencia/las licencias se revisan en [SCULPT](sculpt-metodologia-y-cartera-2026-11-10.md), [openPlan3D/roomGPT](sculpt-openplan3d-roomgpt-2026-11-18.md), [matriz](MATRIZ-TRAZABILIDAD-v1.12.md) y [catálogo](rubik-catalogo-maestro-mejoras-2026-11-09.md). Donantes con código bajo otras licencias no se trasplantan sin validar obligaciones y derechos de assets.

**Actualización:** conservar estado documental tal cual; una futura actualización de estado operativo irá con fecha, HEAD y pruebas, sin reescribir la fotografía del 18/11. No se autoriza merge, gasto, despliegue ni cambio de P/ola por este anexo.
