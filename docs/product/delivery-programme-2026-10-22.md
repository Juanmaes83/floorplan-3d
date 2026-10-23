# Programa de creación y entrega profesional — encargo, matriz y orden de cortes

**Fecha:** 2026-10-22 · **Base:** `master@e796e3d` · **Estado:** encargo de Juanma registrado; **ningún candidato de este
documento queda aprobado ni implementado por estar aquí.** Fuentes leídas: `docs/ROADMAP.md`, contratos
`FloorPlanProjectV1`/`FloorPlanBuildingV1`, `docs/product/professional-client-experience-2026-10-21.md`, propuesta #77
(`docs/product/exterior-location-video-candidates-2026-10-22.md`, rama `docs/exterior-location-video-20261022`) y el
estado de las PR abiertas #70–#79 a la fecha.

## 1. Objetivo del encargo

Una persona profesional (arquitectura, promoción, inmobiliaria, reformas o interiorismo) crea y personaliza una
vivienda, la explica de forma convincente y entrega a su cliente una experiencia que se entiende por sí sola. El cliente
sabe qué ve, cómo recorrerlo y qué características importan; el profesional controla la información comercial y la
ubicación que se comparte. En cada pantalla: ¿qué debe entender y hacer aquí el usuario?

## 2. Referencias visuales

| Referencia | Estado en este repositorio/sesión |
|---|---|
| 4 capturas LoRA LAB de Juanma (3 del editor, 1 inmersiva) | **No accesibles** en la sesión de trabajo; solicitadas. No se describe su contenido aquí a partir de terceros. |
| Captura «Compartir imagen» de Rubik, 22-10-2026 | No existe como tal; el hallazgo se midió sobre el PNG real de #78 (vivienda al 19,7 % en teléfono, sin datos) — ver #81. |
| Enviz (5 imágenes) | En `docs/product/references/enviz-2026-10-22/`. Solo referencias de resultado, no de funciones verificadas. |
| Matterport (puntos de interés) | Pendiente de consultar en fuentes oficiales; referencia de interacción, no de diseño a copiar. |

### 2.1 Lo que muestran las capturas de LoRA LAB (controles visibles; **ninguna acción observada**)
| Área | Visible en la referencia | Rubik hoy | Lectura |
|---|---|---|---|
| Familias | Construir / Amueblar / **Exterior** | Construir / Amueblar (master) | exterior = línea A |
| Plantas | 1F / 2F / 3F, «Mostrar planta inferior», altura de planta | dos plantas (master) | Rubik limita a 2 |
| Estructura | «Muro de carga», «Tabique», «Medir» | dato `structure` y modo demoler (master) | sin control de asignación visible; C-8 |
| Exterior | fachada, cubierta (5 tipos y acabados), marcos de ventana, terreno | fondos decorativos | requiere contrato propio |
| Estadísticas | m² por planta, «Superficie construida total», «Presupuesto de acabados (est.)» sin moneda visible | superficie útil aprox. | presupuesto: D-05 |
| Sol | norte, hora, mes, latitud, luces interiores; barra horaria en 3D | iluminación de presentación | ambiente ≠ simulación solar validada |
| Vista 3D | vista general/superior, muros cortados, cortinas, abrir todo, captura, calidad | presentación, recorrido, captura PNG/ZIP | comparar con evidencia (línea C) |
| Recorrido | «Recorre tu casa: empieza en la puerta principal; las escaleras te llevan entre plantas», ojos 1,70 m | recorrido libre y guiado | subir escaleras caminando **no** acreditado |
| Proyecto | «Copiar enlace para compartir», JSON, imagen del plano, captura 3D | JSON/ZIP, PNG, lámina; sin enlace | enlace: D-06/D-08/D-09 |

## 3. Matriz de capacidades (4 estados)

Estados: **1** funciona y está comprobado · **2** existe como dato/tecnología sin control útil · **3** aparece en interfaz,
documentación o propuesta sin función completa · **4** no existe o requiere contrato, proveedor o infraestructura.
«master» = `e796e3d`; «PR» = rama sin fusionar (su estado no es el de master).

| Necesidad | Estado | Evidencia y límites |
|---|---|---|
| Editor 2D, 3D, recorrido libre, puertas interactivas | 1 (master) | Suites de navegador en master; 3D solo con SwiftShader, sin GPU ni móvil físico. |
| Presentación guiada (una y dos plantas) | 1 (master) / con defectos de master corregidos en PR #79 | Botón «Iniciar presentación» fuera de pantalla en master (#79). Suite `presentation`: 4 TIMEOUT sin resolver en la integración. |
| Paleta Construir / Amueblar | 1 (master) | No existe pestaña Exterior. |
| Marca profesional (#69) en presentación, lámina y PNG | 1 (master) | En el PNG la franja se **superpone** a la parte inferior de la vista. |
| Captura PNG y lote ZIP de vistas | 1 (master) | Encuadre = vista 3D actual; sin composición de entrega. |
| «Compartir imagen» (WhatsApp, Gmail, LinkedIn…) | 3 (PR #78; imagen de entrega en #81) | Comparte un archivo, no un enlace. Sin prueba en teléfono físico. Sin identidad cuando no hay marca. |
| Lámina de distribución | 1 (master); a escala 1:50/1:100/1:200 en PR #72 | Medida A3 impresa con regla: pendiente. Preview de su último commit no existe. |
| Procedencia y precisión del plano | 3 (PR #74) | Muestra origen y calibración; no registra quién eligió muebles. |
| Observaciones del cliente por archivo | 3 (PR #75) | Privadas, sin servidor; distintas de una «petición incorporada» pública. |
| Entrada y perfil profesional | 3 (PR #70/#73, #76) | No duplicar el selector de #70. |
| Orientación del recorrido (guía) | 3 (PR #71) | Defecto de foco corregido en #71. |
| Fondos 3D (Estudio, Jardín suave, Ciudad) | 1 (master) | Decorativos; **no** son edición de exterior. |
| Clasificación muro de carga / tabique | 2 (master) | El dato existe (`structure:"load-bearing"`, modo demoler: negros = carga). Contrato C-8: etiqueta orientativa, nunca dictamen. |
| Superficie útil aprox. del proyecto | 1 (master) | «Superficie útil aprox.» en cabecera; por planta: comprobar antes de prometer. Precisión ligada a la calibración. |
| Familias de estancias / nombres sugeridos | 2–3 | Revisar la paleta integrada antes de proponer otro selector. |
| Identidad del inmueble (nombre, descripción) | 2 | Hay nombre de proyecto y título de marca; no hay ficha del inmueble separada del profesional. |
| Ubicación del inmueble | 4 | No existe. Mapa o geocodificación = proveedor externo (decisión). |
| Puntos de interés | 4 | No existe. Estudio y opciones de contrato en #82. |
| Exterior editable (terreno, fachada, cubierta) | 4 | Solo propuesta (#77). |
| Modelos 3D propios del profesional | 4 | Solo propuesta (#77). Distinto de exportar GLB. |
| Vídeo del recorrido desde la aplicación | 4 | Piloto Blender offline ≠ grabación en la app. Estudio en #83 (Chromium de pruebas: WebM sí, MP4 sin H.264). |
| Enlace alojado para el cliente | 4 | D-06/D-08/D-09 sin decidir. |
| Presupuesto en euros | 4 | D-05 sin decidir. |
| Instalaciones (electricidad, fontanería, clima, domótica) | 4 | Sin modelo de datos. |
| Sol / norte / latitud | 3–4 | Iluminación ambiental ≠ simulación solar validada. |

## 4. Orden de PR propuesto

| # | Corte | Tipo | Base | Depende de | Decisión de Juanma |
|---|---|---|---|---|---|
| 0 | Cierre de la integración: 4 TIMEOUT, perfilado de +7 s, revisión de 21 capturas, previews | QA | `integration/2026-10-22` | #71–#79 | No |
| 1 | Este documento y enlace en el roadmap | Docs | master | — | No |
| 2 | **Imagen de entrega profesional** (composición, encuadre, identidad sin inventar datos) | Implementación | `feat/share-image` (#78), apilada | #78 | Solo si exige identidad persistente del inmueble (contrato) |
| 3 | **Puntos de interés — estudio y contrato** (asociación estable, compatibilidad) | Estudio + contrato | master | — | Sí: cambio de contrato |
| 4 | Puntos de interés — primer corte (característica, material/acabado, petición incorporada) | Implementación | 3 | 3 | — |
| 5 | Identidad del inmueble y ubicación con precisión elegida | Estudio + decisión | master | — | Sí: proveedor de mapas, privacidad |
| 6 | Exterior: descubribilidad honesta | Estudio con usuarios D-01 | master | — | Sí, tras observar |
| 7 | Ensayo comparativo de visita inmersiva | Estudio con evidencia | master | GPU y móvil físico | No |
| 8 | Vídeo del recorrido descargable | Estudio técnico | master | — | Sí, si requiere alojamiento |
| 9 | Modelos 3D propios | Estudio técnico | master | — | Sí: formatos, licencias |

**Corte 2, composición horizontal (decisión de Juanma, 23-10-2026):** aprobada la composición **D, columna lateral**, sobre la comparación de imágenes reales (vivienda 818×878 px, mayor que en la imagen anterior de #78, y los datos comerciales no se superponen a la casa). La composición vertical ya validada se mantiene. Esta decisión **no** aprueba #78, de la que depende #81, ni autoriza un merge: #78 sigue pendiente de su propia decisión.

Los candidatos de §6 del encargo (muros de carga, familias de estancias, superficies, presupuesto, instalaciones,
fachada/cubierta/terreno, sol) quedan en el roadmap como **candidatos**; ninguno autoriza controles vacíos.

## 5. Decisiones abiertas que no se dan por aprobadas

D-05 (precios), D-06/D-08/D-09 (enlace alojado, privacidad, retención), proveedor de mapas, IA conectada, cambios de
contrato para puntos de interés e identidad del inmueble. Para cada una se presentarán dos o tres opciones con
consecuencias y recomendación antes de implementar.

## 6. Evidencia exigida por corte

Base y SHA probados; matriz de recorridos (profesional y cliente) en 1440×900, 390×844 y 844×390, una y dos plantas;
PASS/FAIL/SKIP/TIMEOUT con comandos y versiones; capturas antes/después revisadas una a una y hoja de contacto; vídeo
cuando el movimiento importe; archivos finales inspeccionados (PNG, ZIP, JSON); estado real de Actions (job ejecutado y
fallido ≠ no ejecutado); preview del commit exacto (Vercel exige sesión). Pendiente físico explícito cuando dependa de
GPU, teléfono o impresión. Sin merge ni despliegue.
