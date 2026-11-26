# §§8.1–8.2 · Asistencia y contexto en el resto de Entregar

**Rama:** `claude/entregar-asistencia` · **base:** `claude/storylayers-v1` `cd694e88` (StoryLayersV1 aprobado: P10, propuesta y
asistencia demostrada). Estado: **inventario y propuesta del primer caso**; sin código todavía. Requiere el visto bueno del
propietario sobre el alcance antes de implementar.

## Inventario de plantillas de Entregar (interfaz real, proyecto de ejemplo, 1440×900, base `cd694e88`)
| Código | Plantilla | Estado en el ejemplo | Entrada | Cliente (§8.2) | Mi estudio (§8.2) | Asistencia (§8.1) |
|---|---|---|---|---|---|---|
| D1 | Ficha de superficies | 87,18 m² · Estimado | Ver ficha | — | — | — |
| D2 | Lámina profesional | Lista para revisar · ajustada a la hoja | Abrir lámina | — | firma/escala | — |
| D3 | Dossier del proyecto | 5 de 8 secciones con contenido real | Preparar dossier | estilo «Cliente» sin datos del destinatario | portada con marca (logo, nombre, persona) | — |
| D4 | Dossier económico | Sin presupuesto preparado | Preparar dossier económico · Revisar en S1 | variante cliente | — | — |
| D5 | Entregables profesionales | Elige y prepara lo que recibirá el cliente | Preparar entregables | — | — | — |
| P1 | Presentación 3D | Planta única · 13 estancias | Preparar presentación | — | — | — |
| P2 | Imágenes | Plano 2D · Vista 3D · Exterior | Generar imágenes · Preparar 5 vistas · Reformar desde fotografía · Estudio de imágenes | — | — | — |
| P3 | Visita 3D interactiva | prueba privada | Revisar como cliente | — | — | — |
| P4 | Evolución de obra | Necesita un plan de obra | Crear plan de obra | — | — | — |
| P5 | Material board | 6 suelos · 0 paredes · 8 colores | Ver material board | — | — | — |
| P6 | Personalización HERO FINAL | Sin firma elegida | Personalizar en Mi estudio | — | firma | — |
| P7 | Archivo para tu cliente | Listo para enviar · sin servidor | Descargar · Publicar enlace | — | — | — |
| **P10** | **Historia del cambio (StoryLayers)** | Primer paso: crear una variante | Crear variante | **sí** (ficha, uso/visibilidad por campo) | **sí** (contacto, logo) | **sí** (`rubik-texto-local`, borrador → aceptar) |
| P8/P9 | Blueprint 3D · Despiece 3D | Requieren la vista 3D | Abrir la vista 3D | — | — | — |
| S1 | Presupuesto | Sin presupuesto preparado | Revisar presupuesto | — | — | — |
| S2 | Observaciones del cliente | Sin observaciones pendientes | Gestionar observaciones | (notas del cliente) | — | — |
| T1 | Escena para Blender | ZIP con medidas e identificadores | Preparar escena · Revisar render | — | — | — |
| T2 | Comparar con el original | Sin variantes para comparar | Abrir proyectos | — | — | — |
| — | Identidad de la entrega | Sin marca seleccionada | Configurar Mi estudio | — | origen de la identidad | — |
| — | Proyecto editable | Conserva una copia | Exportar JSON/ZIP · DXF | — | — | — |
Conclusión: solo **P10** aplica hoy el patrón completo. El documento más cercano para extenderlo es **D3 Dossier del proyecto**
(ya tiene estilo «Cliente», secciones con contenido real y portada con la marca de Mi estudio).

## Primer caso acotado propuesto · D3 Dossier del proyecto con el patrón de StoryLayers
Reutilizar SIN duplicar: `story-proposal-core` (`normClient`, `clientFromFile`, `clientForAssist`, visibilidad por campo) y
`story-assist-core` (`context()` mínimo y autorizado; adaptador `rubik-texto-local`, borrador → editar/aceptar/descartar).
1. **Cliente (§8.2).** Bloque «Preparado para» en el diálogo del dossier: nombre, tratamiento, encargo/preferencias; cargar una
   ficha JSON existente (`clientFromFile`) o reutilizar la de la historia si existe para el mismo proyecto. Por campo: «usar para
   personalizar» y «mostrar en la entrega». La portada muestra solo lo marcado para mostrar.
2. **Profesional (§8.2).** La portada ya toma marca/logo/persona de Mi estudio; se añade el control de qué campos de contacto
   aparecen (mismo `CONTACT` de StoryLayers). Nada se vuelve a teclear.
3. **Asistencia (§8.1 Redactar).** «Nota de presentación» en la portada con «Ayuda para redactar»: el borrador se muestra antes
   de insertarlo; editar/aceptar/descartar; contexto enviado = secciones con contenido real + campos del cliente autorizados.
   Criterio profesional, plazos y costes los aporta el profesional (la ayuda los pide, no los inventa).
4. **Revisar y entregar (§8.1).** Antes de imprimir: lista de lo que falta (secciones sin contenido, vistas no preparadas,
   presupuesto parcial) con acceso directo a completarlo y vuelta al dossier con el contexto intacto.
5. **Exclusiones.** Las notas internas y los campos no marcados para mostrar no salen en el dossier del cliente.
**Aceptación:** recorrido escritorio y móvil desde Entregar → D3; cliente cargado y no cargado; borrador aceptado y descartado;
vuelta desde «completar» sin perder texto ni posición; sin chino visible; el dossier impreso solo con lo autorizado.
**Decisión del propietario:** confirmar D3 como primer caso (alternativas: D4 dossier económico o P7 archivo para el cliente).
«Anounce» del encargo: con ese nombre no aparece en el repositorio. Sí existe un adaptador **Nuance** en el laboratorio del
asesor (`labs/asesor-rubik/nuance-adapter.js`, sesión `api/advisor-session.js`). Si «Anounce» es Nuance, se aplica el alcance y la
activación ya autorizados para sus canales; el primer caso se acredita con el adaptador local `rubik-texto-local`, sin conectar
nada nuevo hasta que el propietario confirme el nombre.
