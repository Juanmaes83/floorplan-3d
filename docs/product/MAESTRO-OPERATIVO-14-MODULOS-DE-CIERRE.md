# RUBIK SOTA — DOCUMENTO MAESTRO OPERATIVO DE LOS 14 MÓDULOS DE CIERRE

**Versión:** 1.0 · **Aprobación del enfoque por el propietario:** 21/11/2026 · **Base de verificación:** `floorplan-3d/master@1bc501d64ab091a8fac25669bf8843f8f5076a3d` · **Naturaleza:** gobierno operativo de misiones. **Esta publicación no autoriza merge, Production, gasto, servicios o ampliación del alcance técnico.**

> **DECISIÓN PRINCIPAL:** dejamos de dirigir el desarrollo por 98 mejoras sueltas. Desde ahora planificamos, ejecutamos y auditamos el **cierre de 14 módulos de producto**. Conservamos intactos los **98 IDs originales**, **P1–P8**, **olas 0–5**, **17 piedras SCULPT** y **seis Simulator** para seguir toda la historia sin duplicar trabajo.

**[ANEXO DE TRAZABILIDAD 98 IDS + 23 PIEDRAS](ANEXO-MAESTRO-14-MODULOS-TRAZABILIDAD-98-IDS-23-PIEDRAS.md)** — cruzado y comprobado: cada ID tiene **exactamente un módulo director**, conserva su P/ola/estado/hito y puede tener consumidores secundarios. El estado documental v1.12 corresponde al **18/11**, no al estado remoto de hoy.

## 0. Carácter vinculante y precedencia

Este maestro es la **autoridad operativa para definir próximas misiones** aprobada en conversación por el propietario. Su rama es documental e independiente, y **hasta autorizar su fusión no se debe afirmar que está integrado en `master`**. Puede citarse desde esta rama desde hoy en cada encargo de Claude/Codex.

La [matriz v1.12](MATRIZ-TRAZABILIDAD-v1.12.md) conserva IDs, P, estados, hito y criterios originales; el [catálogo maestro](rubik-catalogo-maestro-mejoras-2026-11-09.md), nombres, olas 0–5, descartes, conflictos y 2a–2f; el [plan v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md), arquitectura/hitos; el [protocolo multiagente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md), autorizaciones. Este maestro modifica la **unidad de trabajo**, no borra ni sustituye sus contenidos. Si una afirmación histórica contradice el árbol vigente, verificar `master`/PR en GitHub y documentar la discrepancia; jamás reescribir el pasado silenciosamente.

La clasificación «Módulo director» es **solo coordinación**, no cambio de programa, asignación exclusiva del código ni autorización para construir todo el alcance. M01 (F0) y M03 (Blender) tienen gran parte de su trazabilidad **fuera de los 98 IDs**, en contratos F0 y piedras. No se inventan IDs nuevos para rellenar su casilla.

## 1. Cartera de producto: las 14 unidades de dirección

| Módulo | Capacidad y partes existentes | Meta de usuario | Estado/residual (fotografía, verificar HEAD) |
|---|---|---|---|
| **M01 · Continuidad del proyecto** | OP-01, F0.1–F0.3, biblioteca, backups, historial, F1 condicionada | Guardar, cerrar, reabrir, recuperar y transportar proyectos reales sin pérdidas | Parcial en producto; F0.2c/F0.3 y F1 bajo gates |
| **M02 · Identidad y entrega segura** | GOV-06a, GOV-08 S4/S5, ENT-01/02, GOV-05 | Cada profesional accede a sus datos y comparte una entrega derivada con permisos y revocación | Identidad real y dictamen legal no completados |
| **M03 · Render y Blender profesional** | exportación GLB/ZIP, OP-10, C6, Studio, posrender | Del proyecto a un render Blender auténtico, verificable y entregable | Exportación integrada; experiencia premium incompleta |
| **M04 · Studio y entregables** | E2–E7, ENT-03/04/05/06, dossier e imágenes | Un profesional prepara, revisa, descarga y entrega documentos reales | E2 integrado; E3 #299 Draft; resto parcial |
| **M05 · Asistente inteligente y MCP** | AG-0…AG-5, OP-12, MCP 1–4, ProposalV1 | Consultar proyecto y revisar/autorizar propuestas antes de escribir | V2 consulta; V3 apagada; acciones condicionadas |
| **M06 · Imágenes IA profesionales** | IMG, CAM-01, FOT-01, RG-01/02, gasto y variantes | Generar, comparar, conservar y entregar imágenes con coste/consentimiento explícitos | D1 real; ampliaciones parcialmente simuladas |
| **M07 · Fidelidad arquitectónica** | F01–F09, OP-11, F3, materiales y licencias | Edificio fiel, materiales correctos, comparación reversible y vistas profesionales | F03 V2 en misión CC1; entorno visual parcial |
| **M08 · Geometría avanzada** | R02, OP-06/07/08/09, editor y plantillas | Editar geometría compleja 2D/3D y reabrirla sin deformaciones ni pérdida de datos | R02-A experimental; OP-07 HOLD |
| **M09 · Reconocimiento y fidelidad al plano** | R01, F2, G-01/04/06/08, escaneos | Importar, interpretar y verificar planos reales con incertidumbre medible | R01 laboratorio HOLD; corpus real pendiente |
| **M10 · Mobiliario y catálogo 3D** | R03, OP-05, CAT-02/03, UX-12/13, MUE | Seleccionar, colocar y editar muebles/GLB privados y conservar el proyecto | R03 experimental; OP-05 C1 NO-GO |
| **M11 · Presentación, cinematografía y vídeo** | Simulator A–F, HERO FINAL, VID, Dibujo vivo | Mostrar evolución, recorrer la vivienda y descargar/reproducir vídeo auténtico | A/C/E integrados; B lab 11/11; D/F condicionados |
| **M12 · Edición y navegación profesional** | NAV3D, OP-04, UX, Home, onboarding | Del inicio al editor y las vistas/acciones, con UX y accesibilidad coherentes | Muchas piezas integradas; residuales UX/hardware |
| **M13 · Presupuestos, mediciones y obra** | C1–C4, BC3, FT3D-8, ECO, OBR, MSPDI | De mediciones a presupuesto, evolución y entrega de obra con trazabilidad | Núcleo integrado; costes y exportaciones incompletos |
| **M14 · Interoperabilidad profesional** | OP-03, DXF, IFC, CAD, expedientes, formatos | Abrir e intercambiar archivos sin falsear cotas, capas, unidades ni pérdidas | DXF integrado; faltan verificaciones externas |

**No son 14 autorizaciones nuevas.** Cada «Mxx» es una cartera de capacidades relacionadas. El propietario elige **una misión cerrable y completa** dentro de un módulo con un resultado de usuario innegociable. No mezclar en una PR gigante todas las capacidades históricas de Mxx ni declarar terminado el módulo entero si queda un recorrido esencial sin desarrollar.

## 2. Los ocho programas P1–P8: arquitectura estratégica intacta

| Programa | IDs originales | Resultado estratégico |
|---|---:|---|
| **P1 · Studio Presentation** | 10 | E2–E7; dossier, plantillas y entregables profesionales |
| **P2 · Servicios IA** | 26 | Render IA, imágenes, foto, resultados, costes y consumo |
| **P3 · Identidad, seguridad y cuotas** | 6 | Permisos, GOV-06a/GOV-08, publicación, protección y control de cuentas |
| **P4 · Beta comercial** | 23 | Home, onboarding, UX, pilotos, calidad, precios y dispositivos |
| **P5 · Fidelidad y bibliotecas** | 10 | Materiales, F3, GLB, catálogos y activos autorizados |
| **P6 · Interoperabilidad y precisión** | 8 | DXF/IFC, plano, escala, cantidades y MSPDI |
| **P7 · Generación y asistentes avanzados** | 8 | MCP/agentes, propuestas, confirmación y generación paramétrica |
| **P8 · Experiencias premium** | 7 | Personas, 360, vídeo, portal y experiencias avanzadas |
| **TOTAL** | **98** | **Cada ID conserva su programa P1–P8 original** |

Los programas P, las seis olas y los 14 módulos **son ejes diferentes**, no 8 + 6 + 14 grupos nuevos de desarrollo. El anexo enumera los 98 IDs y preserva las olas **10 / 9 / 28 / 22 / 14 / 15**. Las **17 piedras SCULPT** (R01–R03, OP-01…OP-12, RG-01/02) y los **seis Simulator** (A–F) están cruzados allí sin convertir los donantes G0–G12 en nuevos módulos. Los descartes históricos X-01…X-06 siguen descartados.

## 3. Contrato de meta — qué significa cerrar cada módulo

No se prescribe un árbol de ficheros ni una receta de implementación: **se exige el resultado, sus invariantes y la demostración de uso real**. Una misión autorizada selecciona una capacidad completa de este contrato, no necesariamente todo el programa estratégico.

### M01 · Continuidad del proyecto

**Recorrido final exigido:** Proyecto creado → guardado y cierre → reapertura → conflicto/respaldo → restauración idéntica.

**Prueba real de cierre:** Export/import con hashes, variantes, imágenes y presupuestos; crash/2 pestañas, migración idempotente, pérdida de almacenamiento y prueba de escritura confirmada.

**Barrera y límite obligatorio:** F1 nube y multi-dispositivo no autorizada; sin cuentas reales no declararla disponible.

### M02 · Identidad y entrega segura

**Recorrido final exigido:** Entrar como profesional A/B → ver únicamente sus proyectos → publicar entrega → cliente autorizado → revocar/caducar.

**Prueba real de cierre:** Aislamiento entre identidades, permisos reales, ataques adversarios, logs y revocación; aviso de retención y consentimiento.

**Barrera y límite obligatorio:** GOV-05 requiere asesoramiento externo; GOV-06a no se sustituye por un código compartido ni tester de Preview.

### M03 · Render y Blender profesional

**Recorrido final exigido:** Proyecto real → Entregar → GLB/ZIP → abrir en Blender → render Cycles real → revisar → archivo profesional.

**Prueba real de cierre:** Escena con geometría/materiales correctos, cámaras reales, render auténtico y hashes, vídeo de flujo, limpio vs. firmado con autorización.

**Barrera y límite obligatorio:** No prometer render directo en la nube si el flujo actual requiere Blender externo; distinguir OP-10 del donante pathtracing y OP-10/Blender de RUBIK.

### M04 · Studio y entregables

**Recorrido final exigido:** Entregar/Mi estudio → escoger documento → previsualizar → preparar → descarga válida → abrir y usar por cliente.

**Prueba real de cierre:** Generadores reales, PDF/ZIP/imágenes que existan, firma y privacidad, capturas, accesibilidad, retorno al proyecto; alternativas honestas para funciones no disponibles.

**Barrera y límite obligatorio:** No declarar E2–E7 completo porque E3 muestre diez tarjetas; no habilitar una ficha ficticia.

### M05 · Asistente inteligente y MCP

**Recorrido final exigido:** Preguntar por un proyecto → herramientas de lectura verificadas → respuesta con fuente → propuesta diffs → confirmación → undo.

**Prueba real de cierre:** Herramientas con resultados reales, roles, no fuga inter-proyecto, transacción atómica, error y reintento; red team de instrucciones adversarias.

**Barrera y límite obligatorio:** V3 generativa y etapas MCP superiores no se activan por suite verde; sin confirmación humana no se ejecuta escritura.

### M06 · Imágenes IA profesionales

**Recorrido final exigido:** Seleccionar proyecto/foto consentida → vista/estilo → coste previo → generación → variantes → aceptar → recuperar/entregar.

**Prueba real de cierre:** Imagen real de proveedor autorizado, trazabilidad del modelo/versión, gasto estimado y real, reversión, persistencia, permisos y efectos de cancelación.

**Barrera y límite obligatorio:** Sin presupuesto y GO de API no existe autorización para gastos; simulación sigue rotulada simulación.

### M07 · Fidelidad arquitectónica

**Recorrido final exigido:** Abrir vivienda completa → material elegible → ON/OFF reversible → recorrer fachada a altura humana → comparar y demostrar.

**Prueba real de cierre:** A/B/C misma cámara/luz, fachada completa, encuentros, móvil útil, autenticidad/licencia/hashes de PBR, rendimiento OP-02, vídeo real.

**Barrera y límite obligatorio:** No alterar geometría ni poner una textura universal; no declarar validación Safari/hardware no probada.

### M08 · Geometría avanzada

**Recorrido final exigido:** Editar muros/techos/escaleras → preflight → ver 2D/3D → deshacer → guardar/reabrir → exportar consumidor.

**Prueba real de cierre:** Cotas, superficies, huecos, presupuesto, escenas, historial y 3D idénticos; casos curvos/inclinados/irregulares.

**Barrera y límite obligatorio:** R02-A no acredita cumplimiento normativo ni altura de paso legal; OP-07 requiere decisión de contrato.

### M09 · Reconocimiento y fidelidad al plano

**Recorrido final exigido:** Importar original autorizado → detectar elementos → comparar con referencia → corregir manualmente → conservar y medir.

**Prueba real de cierre:** Corpus real F2 con trazabilidad/consentimiento, escala y cotas verificadas, errores/falsos positivos, OCR probado en idioma real.

**Barrera y límite obligatorio:** No aplicar geometry automática sin aceptación; no anunciar reconocimiento exacto basado en seis fixtures sintéticos.

### M10 · Mobiliario y catálogo 3D

**Recorrido final exigido:** Autorizar GLB/catálogo → colocar en 3D → configurar interior → ver ficha y coste → guardar → exportar sin fugas.

**Prueba real de cierre:** Modelo desde fuente legal, metadatos/SKU/medidas verificadas, undo, render, privados aislados, licencias y tests multiconsumidor.

**Barrera y límite obligatorio:** CAT-03 no está cerrado por R03; C1 de OP-05 es NO-GO.

### M11 · Presentación, cinematografía y vídeo

**Recorrido final exigido:** Presentar → elegir paradas → vista cinematográfica → grabar → descargar/reproducir MP4 → reintentar.

**Prueba real de cierre:** Duración/fps/fotogramas/hash medidos, encuadres profesionalmente legibles, 3 vídeos de QA cuando proceda, teclado, cancelación, estados, regresiones del grabador.

**Barrera y límite obligatorio:** Un 11/11 de laboratorio no sustituye CI y aceptación visual en master; audio/360/proveedor quedan bajo sus propios gates.

### M12 · Edición y navegación profesional

**Recorrido final exigido:** Home → editor → 2D/3D → seleccionar/cambiar modos → guía → entrega y vuelta segura.

**Prueba real de cierre:** Vista útil en móvil/escritorio, foco, Tab/Escape, jerarquía CTA, i18n ES/EN/ZH, no desbordamiento, perf OP-02/hardware.

**Barrera y límite obligatorio:** No aceptar regresiones de UX reescribiendo aserciones; GOV-07 hardware no queda acreditado por emulación.

### M13 · Presupuestos, mediciones y obra

**Recorrido final exigido:** Proyecto con mediciones → cantidades → presupuesto → obra 4D y progreso planificado → BC3/entregable.

**Prueba real de cierre:** Unidades, origen de cada cantidad, precios y versiones, proyecto reabierto, lector BC3, diferencia planificado/real, errores.

**Barrera y límite obligatorio:** No declarar certificación ni tarifa real si la fuente es estimada. Datos/licencias externas condicionan salida.

### M14 · Interoperabilidad profesional

**Recorrido final exigido:** Importar/crear plano → exportar DXF/IFC/otro autorizado → abrir en programa real → comparar escala y capas → volver.

**Prueba real de cierre:** Ficheros reales, unidades y pérdidas documentadas; CAD externo, roundtrip, validación en programa profesional, proyecto intacto.

**Barrera y límite obligatorio:** G-07 IMDF RD histórico no equivale a tarea nueva; no añadir compatibilidad sin evidencia.

## 4. Regla de oro — «componente probado» ≠ «módulo completo»

**Meta final universal:** convertir un módulo parcial o aislado en **módulo profesional y funcional de RUBIK SOTA**, completo y conectado, para que **Codex lo revise e integre**, **no** desarrolle las partes que falten. El resultado se prueba **desde la experiencia auténtica del producto hasta el archivo, decisión o efecto final utilizable**.

**Definition of Done obligatoria de una candidata de laboratorio:**

- Una persona consigue el resultado íntegro desde el acceso real de RUBIK. Interfaz coherente, texto y acciones no engañosos, accesibilidad y estados vacíos/errores resueltos.
- El módulo utiliza el proyecto/edificio, editor, render, biblioteca, identidad, historial, grabador y proveedores **canónicos**, sin clonar escritores, motores, catálogos ni servicios.
- Datos y permisos se conservan tras éxito, cancelación, error, reintento, cierre y reapertura; no fugan contenidos privados ni se inventan medidas.
- Pruebas puras, de navegador, regresiones cruzadas, i18n **ES/EN/ZH** (sin chino visible en ES/EN), escritorio y móvil, navegación teclado y rendimiento con entorno y SHA reproducibles.
- **Evidencias visuales auténticas** de principio a fin. Cuando el módulo produce vídeo o se le exige mostrarlo, **vídeo real reproducible**, fps, resolución, duración, fotogramas y hash. No sustituirlo por cuatro capturas o un MP4 montado para simular uso.
- Otros artefactos prometidos —GLB/ZIP/DXF/PDF/imagen, según el módulo— deben existir, abrirse y verificar contenidos y hashes. Distinguir recurso **real** de sintético, proveedor real de mock y grabación de pantalla de exportación propia de RUBIK.
- Fuentes, derechos, licencias, accesibilidad, privacidad, presupuestos y limitaciones reales documentados. Chromium/SwiftShader no demuestra por sí solo hardware, Safari o Firefox.
- **Una sola candidata final en GitHub**, código completo, base efectiva, HEAD SHA y árbol, parche reproducible, suite íntegra sobre árbol final, capturas, vídeos, resultados y handoff GO/NO-GO.
- Ningún requisito esencial queda «para que Codex lo termine»; ningún test se desactiva o relaja para conseguir un verde; ningún error de otro módulo se esconde.

Si cualquier condición esencial no es demostrable: **BLOCKED / CANDIDATA PARCIAL, NO-GO**. Publicar y conservar el trabajo y el diagnóstico, sin llamar «módulo terminado» a una experiencia incompleta. Un laboratorio 11/11 puede ofrecer **GO para revisión**, nunca un GO automático para fusionar.

## 5. Metodología de producción: resultado primero, libertad técnica, integración controlada

### 5.1. Antes de empezar

1. El propietario autoriza **una única capacidad completa**, identificando Mxx, usuario, principio, final, evidencia obligatoria, dependencias, coste autorizado y prohibiciones.
2. Claude lee **documentación vigente y código de `master`/Production**, recupera las piezas existentes y documenta: ya funciona / necesita conexión / falta construir / requiere decisión externa. Compara fuentes por SHA y licencias.
3. Se asigna **un responsable técnico y una rama aislada**; comprobar solapamientos con el otro Claude y la cola de Codex antes de tocar un core compartido.

### 5.2. Durante el desarrollo

4. Claude decide **cómo** resolverlo y puede iterar cuanto necesite dentro de su rama. No se le ordena un parche pequeño, ni un número de commits, ni una ruta rígida de implementación.
5. No abrir otros frentes ni instalar otro renderer/ERP/editor/almacén/chat/servicio para sustituir autoridades existentes. Si encuentra una dependencia fuera de mandato, documentarla y, si bloquea el resultado esencial, detener ese GO.
6. Pruebas tempranas y QA dirigida **en laboratorio**, luego una suite completa del árbol candidato con experiencia real. No provocar CI de producto por cada revisión exploratoria. La evaluación final no puede basarse en pruebas anteriores al último cambio de código.

### 5.3. Entrega final a Codex

7. Claude publica una candidata **autosuficiente** con handoff reproducible, archivos verdaderos, capturas/vídeos, resultados negativos y positivos y propuesta GO-LAB o NO-GO. No es aceptable traspasar funcionalidades faltantes.
8. **Codex actúa como integrador:** compara con `master` efectivo, adapta solo las conexiones y diferencias de base, revisa contratos/licencias, recrea pruebas y Preview y ejecuta la CI **completa** del HEAD final. Si hay que desarrollar una función esencial, **devuelve NO-GO al autor**.
9. ChatGPT audita de forma independiente fuente, objeto Git, CI, pruebas, vídeos, visuales, regresiones, calidad y estados de autorización, sin afirmar que ha ejecutado lo que solo ha leído.
10. El propietario revisa calidad funcional/visual y da autorización **específica por SHA y árbol** de fusión. Despliegue en Production y activación de servicios se autorizan **por separado**, no por tener una PR verde.

### 5.4. Tres GO distintos

| Estado | Qué significa | Quién decide |
|---|---|---|
| **GO-LAB** | Constructor demuestra candidata completa y entrega evidencia | Autor, sujeto a auditoría |
| **GO-REVISIÓN** | Candidata técnicamente apta para revisión/reconciliación de Codex | Auditoría independiente; Codex valida |
| **GO-MERGE** | HEAD final, CI y aceptación visual admitidos para fusión | **Solo propietario**, sobre SHA exacto |

Aún después: **GO-PRODUCTION** y **GO-ACTIVACIÓN/GO-GASTO** son decisiones adicionales. CI verde, Preview READY, laboratorio GO o un vídeo reproducible **no sustituyen** estas autorizaciones.

## 6. Metodología de trabajo con Claude Code 1, Claude Code 2 y Codex

| Responsable | Trabajo principal | Lo que está prohibido | Resultado esperado |
|---|---|---|---|
| **Claude Code 1** | Construir y cerrar la capacidad/módulo autorizado; preferencia operativa por experiencias visuales, F03, presentación, Blender, cuando el propietario así lo indique | Cambiar módulos sin orden, tocar ramas de CC2/Codex/master, introducir funcionalidades ajenas, afirmar vídeo real con mock | Candidata lab íntegra con prueba de uso real, vídeo si corresponde, evidencias, SHA, árbol y handoff |
| **Claude Code 2** | Cerrar la capacidad/módulo autorizado; preferencia operativa por geometría, persistencia, interoperabilidad, seguridad y asistentes si se encarga | Solaparse sobre escritores o núcleos de CC1; declarar un core probado como UX integrada; usar proveedores/activos sin permiso | Candidata lab íntegra, reversible y verificable, con QA, UX, riesgos y handoff |
| **Codex** | Integración exclusiva en producto, reconciliación del master, calidad de CI, Preview, revisión técnica, traspaso al propietario | Ser segundo desarrollador de un módulo incompleto; aprobar merge/Production o relajar gates; iniciar misiones ajenas mientras se atasca integración | **Una PR de integración coherente por capacidad**, HEAD/árbol, CI íntegra, Preview y petición de autorización |
| **ChatGPT auditor** | Trazabilidad y comparación, auditoría independiente de código/CI/evidencias y GO/NO-GO | Confundir reportes con pruebas propias; autorizar decisiones externas | Informe verificable por SHA, evidencias y riesgo |
| **Propietario** | Dirección de producto, elección de capacidad y prioridad, calidad visual, gasto, licencias, autorizaciones | Gestionar microparches y prioridades cambiantes de varios agentes | Decisiones GO/NO-GO comprensibles sobre módulos completos |

**Concurrencia controlada:** máximo dos capacidades en desarrollo **que no se pisen**, una por Claude, más el carril de integración de Codex. **Una misión activa por agente** salvo permiso nuevo. Ningún agente incorpora un core compartido sin definir primero quién es su autoridad. Un módulo puede requerir varios archivos y pruebas, pero **no** requiere diez PR de pequeños parches que saturen CI.

**Protocolo de conflicto:** los dos Claude deben comparar el HEAD efectivo y las ramas activas antes de empezar. Si ambos reclaman `index.html`, F3, proyecto canónico, grabador, persistencia, estado de identidad o render, se acuerda interfaz o se escalona el trabajo. Codex no integra en lote dos candidatos de base obsoleta: integra por orden y revalida cada HEAD.

## 7. Plantillas de misión — definir el resultado, no imponer el camino

### Mensaje mínimo para cualquiera de los Claude Code

> MISIÓN Mxx — [capacidad profesional completa, no un ID pequeño]. Tu misión es que [usuario] pueda [recorrido real desde RUBIK] y obtenga [resultado auténtico, útil, medible]. Lee el maestro y el anexo, comprueba el `master` efectivo y reutiliza el código autorizado. Decide autónomamente la implementación compatible con las autoridades existentes. **No abras otra misión.** El cierre requiere UX real, archivos/vídeos auténticos según función, evidencias visuales, QA pura y navegador, regresiones, fallos y recuperación, licencias, límites y prueba completa de principio a fin. Publica **una candidata final** con código, patch, base, SHA, árbol y handoff para Codex. **Codex solo debe revisar e integrar, no desarrollar lo que falte.** Si falla un requisito esencial, publica BLOCKED/NO-GO. No merge/Production/servicios de pago sin autorización.

### Mandato permanente para Codex

> Integra **solo candidatas funcionalmente completas** y autorizadas para revisión. Audita procedencia, reproducibilidad, seguridad, compatibilidad y experiencia de usuario. Rebase/cirugía mínima sobre el master actual sin quitar contratos. Nueva CI completa y Preview correspondiente al HEAD final; vídeo y archivos inspeccionables si aplican. No corrijas a base de relajar tests. Si falta una función esencial, devuelve el defecto al Claude responsable. Solicita al propietario **autorización de merge por SHA exacto**. No fusionar, desplegar ni activar sin orden separada.

**Importante:** estos modelos no asignan automáticamente otro trabajo. La lista de 14 módulos define el marco permanente para futuros encargos del propietario.

## 8. Cola efectiva y prioridad a 21/11/2026 (fotografía que se revalida)

| Carril | Situación consultada | Decisión operativa |
|---|---|---|
| **Codex / M04** | Studio E3 [PR #299](https://github.com/Juanmaes83/floorplan-3d/pull/299) abierta en Draft; HEAD `a1a23555843b26c57ab5b6dd6684154c420acb0a` al consultar | Seguir E3, cerrar CI del HEAD final, aceptación visual, autorización; #300/#301 son gates posteriores separados |
| **Claude Code 1 / M07** | F03 V2 ya encargada por propietario como misión nueva | Completar fachadas/materiales de la vivienda real, ON/OFF, pruebas, vídeo y única candidata |
| **Claude Code 2** | Este documento **no** asigna nueva misión; conserva investigaciones R01/R02/R03 y otros handoffs | No iniciar otro frente salvo mandato de capacidad completa y sin conflicto |
| **Traspaso a Codex / M11** | Simulator B candidato lab `4bab4bdb8fe61411d5168486a9e9b1be8049971b`; 11/11 reportado, vídeo/QA publicados | Auditar independientemente e integrar cuando corresponda, con aceptación visual; no fusionar directamente |
| **Producto** | `master@1bc501d64ab091a8fac25669bf8843f8f5076a3d` | No dar por actual una PR/Preview/Production sin volver a comprobar SHA |

**Secuenciar integración, no bloquear creación de valor:** se pueden cerrar módulos aislados en paralelo, pero sus fusiones se ordenan por dependencias y no se considera el plan «terminado» mientras queden experiencias esenciales bloqueadas.

## 9. Mantenimiento del maestro y protección contra dispersión

Registrar por cada misión: **Mxx + recorrido final + lista de IDs/piedras + responsable + rama + base SHA + estado real + autorización + dependencia + evidencia + GO/NO-GO**. Al cierre, añadir SHA/árbol y artefactos. Tras fusión autorizada, añadir SHA de merge, CI post-fusión, despliegue y activación solo si ocurrieron.

Los estados permitidos son **PARCIAL / LAB / BLOQUEADO / GO-LAB / GO-REVISIÓN / AUTORIZADO-MERGE / INTEGRADO / PRODUCTION-VERIFICADA**. Mantener la distinción entre un módulo, su capacidad actualmente autorizada y el estado histórico de sus IDs. Los 98 IDs nunca se renombran para mejorar el cuadro de mandos. Un ID histórico terminado no obliga a declarar terminado todo el módulo; un módulo que habilita un recorrido nuevo no requiere reabrir cientos de funciones que ya están estables.

La cartera documenta **decisiones**; GitHub/CI/Preview demuestran **hechos**; aceptación visual y jurídico/gasto se resuelven por sus autoridades. No renombrar un bloqueo externo como éxito técnico. No prometer actividad autónoma o integración futura sin una orden real.

## 10. Fuentes y anexos que cada agente debe leer

- **[Anexo verificable 98 IDs, 17 piedras y 6 Simulator](ANEXO-MAESTRO-14-MODULOS-TRAZABILIDAD-98-IDS-23-PIEDRAS.md)** — correspondencia Mxx, P1–P8, olas 0–5, estado documental e hito.
- [Plan maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md), [Matriz v1.12](MATRIZ-TRAZABILIDAD-v1.12.md), [Catálogo de mejoras](rubik-catalogo-maestro-mejoras-2026-11-09.md), [Estado maestro](ESTADO-MAESTRO-RUBIK-SOTA.md).
- [Protocolo de coordinación multiagente](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md), [SCULPT: método y donantes](sculpt-metodologia-y-cartera-2026-11-10.md), [openPlan3D/roomGPT](sculpt-openplan3d-roomgpt-2026-11-18.md).
- [Inventario Simulator A/C/D](../integration/INVENTARIO-SIMULATOR-C-A-D.md), [handoff final de Simulator B](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/4bab4bdb8fe61411d5168486a9e9b1be8049971b/COMPONENTES/B-tiempo-direccion-cinematografica/producto/HANDOFF-CIERRE.md).
- [Inventario de continuidad V5](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/chatgpt/continuidad-v5-regla-cierre-20261121/CONTINUIDAD/2026-11-21/RUBIK_SOTA_INVENTARIO_CONTINUIDAD_V5.md), conservado íntegro como histórico.

---

**ORDEN PERMANENTE:** **RUBIK SOTA avanza por módulos completos.** La misión concluye cuando una persona obtiene el resultado profesional real, está probada la experiencia completa y existe una candidata única trazable a GitHub, con pruebas, evidencias visuales y vídeos auténticos cuando corresponda. **Codex integra, no termina el trabajo de Claude.** El propietario decide y autoriza cada fusión, despliegue, activación y gasto por separado.
