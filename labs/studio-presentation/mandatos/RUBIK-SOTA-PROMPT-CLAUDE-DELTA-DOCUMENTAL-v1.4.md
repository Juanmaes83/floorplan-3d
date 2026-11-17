# RUBIK SOTA — Mandato diferido para Claude Code: evolución documental profesional v1.4

**17/11/2026 · Encargo complementario acumulativo · No sustituye v1.3.**

## 0. Encargo del propietario

Claude, cuando hayas terminado la implementación y entrega técnica del mandato v1.3, lee íntegramente `RUBIK-SOTA-ANEXO-ENTREGABLES-PROFESIONALES-v1.4.md` que te adjunto. Tienes GO para ejecutar sus mejoras **implementables en el laboratorio E0/E1**, dentro del perímetro autorizado. No te limites a analizar, diseñar, listar recomendaciones o generar maquetas desconectadas de la exportación real. Implementa y prueba el delta N01–N08, con sus criterios RP-Q01–RP-Q12, sobre el resultado que acabas de construir.

No comiences este encargo mientras el anterior siga en ejecución. Conserva las pruebas, artefactos y decisiones existentes y entrega el cierre técnico de v1.3 antes de iniciar el nuevo candidato. Si la revisión visual humana está pendiente, señálalo: este mandato autoriza otro delta de lab, nunca sustituye la decisión humana ni acredita un GO de integración. Los bloqueos técnicos del mandato anterior que sean dependencia de este encargo se resuelven primero o se identifican con evidencia y alcance bloqueado; avanza en lo independiente. No des por cerrado un gate por haber cambiado de versión.

El objetivo es elevar el producto a un sistema de documentación profesional para antes, durante y después del proyecto, reutilizando Studio Presentation, sin crear otro Studio. Más profundidad de contenido, mejores entregables, mejor experiencia y seguridad, preservando exactamente la autoridad de las fuentes y el diseño RUBIK.

## 1. Fuentes, contexto y autoridad

Lee la especificación maestra `RUBIK-SOTA-MISION-STUDIO-PRESENTATION-v1.2-REVISADA.md`, el mandato de cierre `RUBIK-SOTA-PROMPT-CLAUDE-CIERRE-INTEGRAL-E0E1-v1.3.md`, el nuevo anexo v1.4 completo y el handoff que resulte de tu última entrega. Si están disponibles, consulta también `Manual_Maestro_Entregables_Profesionales_FloorPlan_3D_RUBIK (1).pdf` y `Texto pegado(20261117-175355).txt`; el anexo ya recoge sus propuestas, correcciones, límites y referencias. No detengas el trabajo para pedirme archivos originales si puedes implementar con las autoridades disponibles y el anexo. Si faltase una fuente imprescindible, registra el bloqueo exacto y no la reconstruyas de memoria.

Repositorio: https://github.com/Juanmaes83/floorplan-3d. Rama autorizada: `lab/studio-presentation-e0e1`. Fotografía histórica de la auditoría: `master@8525025a1470d48d52d8e365070e5a0acf116134`, lab `b967d448dd0607c6c70a09f15db681c5c7c06f75`. Estos SHA no fijan el nuevo baseline: reconsulta HEAD/master y separa worktree de lectura del producto. Los informes históricos de QA (72/72 exportador, 11/11 motor) no certifican el candidato nuevo. Lee las evidencias finales y cambios v1.3 antes de decidir qué reutilizar.

El nuevo documento es un anexo delta, no una orden de reiniciar el plan, ni un reemplazo de v1.2 o v1.3. Ante contradicción con estado real: conserva decisiones del propietario, contratos y restricciones, verifica el código, deja acta de la discrepancia y corrige dentro de alcance. No inventes autorizaciones ni una dirección artística nueva.

## 2. Perímetro absoluto

- Implementación únicamente dentro de `labs/studio-presentation/` en la rama autorizada; commits/push sanitizados solo ahí. Si la estructura final difiere, identifica las rutas efectivas del laboratorio sin tocar producto.
- E2–E7 son diseño, análisis, elegibilidad, contrato y diagnóstico de producto de solo lectura. No ejecutar integración del producto, nueva ruta, esquema persistente, PR/merge, publicación ni cambio Production. No alterar ramas/workflows de Codex, que sigue con consolidación y CI inteligente.
- Preservar las tres familias, cinco tipos (la lámina comparativa es variante técnica), diez módulos, cinco perfiles Story y siete modalidades. Recetas RP01–RP21 son metadatos/selecciones de laboratorio, NO nuevos IDs de catálogo, plantillas/motores independientes ni nuevas capacidades publicitadas.
- Mantener CSS Print + paginación medida, ADR 06, D1–D7 y gates v1.2/v1.3; no reintroducir CDN/Paged.js ni otra dependencia sin caso y aprobación. Typst/pdfme/ERP/firma solo análisis futuro. No instalar plugins de donantes automáticamente ni copiar identidades o assets no licenciados.
- Cero llamadas IA de pago; no generar nuevas imágenes, ni secretos, datos de clientes, cuentas, publicación, Cron, cambios Vercel/variables/almacén, ni firmas reales. Solo fixtures explícitas. No tocar el fallo HOM-04 que Codex tiene en su alcance; si un hallazgo afecta al lab, registra el vínculo, prueba local de lectura independiente y coordínalo, no edites su código.

## 3. Orden de ejecución obligatorio

### A. Baseline y auditoría diferencial

1. Cierra v1.3 técnicamente con los gates aplicables. Guarda SHA, snapshot, selección, manifiesto/digest, artefactos y QA; congela baseline. Distingue hecho, observado, pendiente y humano.
2. Recorre `HANDOFF.md`, handoffs vigentes, informes 01, 05, 06, 07, 09, 10, 11 y 12, y código/tests finales. Para cada N01–N08 identifica lo que existe, lo parcial y lo que falta, y registra prueba. No recrees una mejora que ya cumple: acredita equivalencia y compón encima. Conserva H01–H08/A01–A29/D01–D18/ST01–ST09.
3. Consulta donantes concretos del anexo §7 y sus rutas/pins. Skills for Architects: diez SKILL.md al commit `a9c4355a6d5bff526786d590ed1f04b687b880a6`, no confundir 61 skills con 61 layouts. Aprovecha especialmente el inventario íntegro FF&E, fuente/variante y recibos, términos comerciales preservados, conciliación sin adopción automática, distinción hecho observado/declaración/interpretación. Reutiliza IFC Sheet, Invoify y Papora ya inventariados; v1.4 pide delta de patrones, no instalar motores. Registra licencia de todo recurso que se distribuya. El 404 del donante no acreditado no autoriza sustituciones silenciosas.

### B. Implementación real del delta de laboratorio

4. **N01:** implementa el catálogo RP01–RP21 del anexo con estados L/C/F y filtros por seis perfiles y tres fases. Conecta las recetas L con el preparador, grafo, exportador y verificador vigentes. Los presets/modalidades no cambian: una receta es una selección de sus piezas elegibles. Cada L elegible produce el artefacto final real correcto, no solo una simulación. Cada C/F no demostrada muestra por qué no se puede emitir, sin descarga cliente falsa. Implementa negativos y ES/EN. No inventes un tipo de documento para cubrir una receta parcialmente representada por un tipo vigente.
5. **N02:** perfecciona Architecture Book y lámina en su código existente. Índice/hojas, cajetín, escala, planta/áreas/estancias, huecos conocidos, referencias cruzadas, FT3D-3/4 esquemáticos acreditados. Audita A-01–A-08 según datos. No declarar cotas, estructura, MEP, cumplimiento, alzados ejecutivos ni As-built sin fuente; no convertir escala estimada en real; revisar todas las páginas afectadas.
6. **N03:** eleva Materials & Furniture Book con fichas, keyplans y comprobación de integridad de todas las instancias/elegibles; usa códigos estables, fuente/variante/acabado/imagen/cantidad/unidad y precio cuando exista. Agrupar correctamente sin doble contar. Prueba genéricos, variantes, cantidades y ausencias, licencias y paginación extrema. Usar un único compositor; sin scraping ni IA de pago.
7. **N04:** mejora Commercial Proposal y Real Estate Presentation con alcance atribuido, honorarios aportados (nunca derivados del coste de obra), exclusiones, resumen y detalle, bloques compra/reforma/impuestos separados, estados completos/parciales/incoherentes/one-sided/none. No recalcular ni mezclar revisiones o duplicar precios FF&E. Verifica dinero/celdas/selección final y ausencia semántica/física de importes cuando se omiten. Si los datos no existen, no simules un presupuesto real.
8. **N05:** preserva los términos y versiones documentales. Snapshot/selección/piezas exactas preparadas y verificadas, obsolescencia separada de integridad; cambios invalidan reconocimiento y descarga pendiente. «Emitido/aceptado/firmado» no se infiere de QA/descarga; toda demostración de estado de emisión es sintética y rotulada. No crear registro contractual real, firma, envío ni persistencia de producto.
9. **N06:** implementa reglas de elegibilidad y conciliación informativa de fuentes, ámbito/unidad/revisión, ausencia o incompatibilidad. Reutiliza A25/A26; contratos RP13–RP21, orden de cambio, prevista vs observada y As-built. C = validación de requisitos y proyección acotada de datos disponibles en lab; F = especificación y prueba de indisponibilidad. No construir funciones productivas de ofertas, certificación, actas, garantías, obras reales, firma o posventa sin GO ni datos. Entrega plan separado de E2–E7.
10. **N07:** mejora la gramática visual de los documentos existentes, sin deshacer D1–D5. Colores/muestras con procedencia, contraste, ritmo, callouts ligados a elementos reales; cambiar de encuadre y escala se avisa. No adaptar una referencia de modo que copie identidad de terceros. Revisa formatos, ausencia de imagen, texto extenso e idiomas.
11. **N08:** genera mapa machine-readable y legible `receta → módulo → fuente → pieza → gate/test`, con huellas Git/recursos binarios/entorno y dependencias indirectas. Codex podrá usarlo como referencia para su CI, pero NO edites su selector/workflows, rama o protecciones. No omitas comprobaciones por sugerencia de este mapa.

### C. Validación de salida real y cierre

12. Ejecuta RP-Q01–RP-Q12 del anexo y D/ST aplicables; conserva suites y trazabilidad v1.3. Las pruebas deben confrontar piezas finales con oráculos del snapshot, no solo DOM. Ejercita las 21 recetas (todas L elegibles con salida real, C/F con estado y negativo), JS/JSON según herramientas reales, ES/EN, PDFs/celdas/filas/páginas, 1/50/200/500 donde aplique, tipos de ausencia. Prueba carrera, cambio de marca/precio/revisión/receta, inputs cruzados, selección sin importes, integridad ZIP, fuga, parser, binarios y offline. No bajar aserciones ni subir tiempos arbitrariamente. Las estimaciones no se presentan como mediciones.
13. QA editorial: cinco tipos (lámina variante incluida), revisión humana separada, comparativas antes/después, visualización de todas las páginas nuevas/modificadas y equivalencia acreditada de las conservadas, paquete completo revisado según v1.3. Desktop/tableta/móvil/320/landscape, teclado, foco, zoom, contraste, reducción movimiento según corresponda, motores adicionales si disponibles. Mantén origen del render y assets. No sustituir fuentes faltantes por generación remota. Pruebas p50/p95, pesos y degradaciones, sin inventar SLA.
14. Entrega ZIP cliente exacto inspeccionado y ZIP laboratorio reproducible con herramientas/versiones, hashes, manifiesto/README, licencias y receta; dos reconstrucciones limpias según ST09. Si se reutiliza evidencia, demostrar mismo conjunto relevante de fuentes, dependencias, entorno/configuración y artefacto. No reejecutar todo producto sin necesidad; sí gates comunes afectados y salida final. Los archivos que no se puedan distribuir se excluyen y el bloqueo se registra. No entregar URL ficticia ni asumir que el viejo ZIP incluye los nuevos cambios.

## 4. Entregables y mandato de cierre

Entrega:

- Registro N01–N08 / RP-Q01–12 y matriz RP01–RP21, cada uno con fuente, cambio, estado, prueba, SHA/artefacto, alcance y limitación. Diferencia EXECUTED_PASS, EXECUTED_FAIL, REUSED_VERIFIED, BLOCKED, NO_VERIFICADO y N/A. Los C/F son contratos futuros, no prestaciones listas. No presentar como terminado lo bloqueado.
- Código real, pruebas, salida real, índice/capturas, diferencias respecto a v1.3, mapa de impacto para Codex y dossier de revisión visual. Evita crear duplicados si se demuestra igualdad de selección y bytes; mantén la prueba individual de mapping.
- Documentos y paquetes comprobados (ES/EN, SHA-256 y hashes de distribución, privacidad, assets y licencias, receta reproducible), con enlaces o adjuntos reales. Reporta tiempo, tamaño y resultados medidos.
- Informe de E2–E7, especialmente ENT-04 (comparador existe en `comparar/`, no rehacer), ENT-03 (compositor y recetas), E4 (Architecture Book/FF&E), E5 (PDF), E6 (entrega/seguridad S3 ≠ S5), E7 (portal/firma sujeto a legal/GOV-06b). Sin nuevos IDs ni olas. No activar integraciones. Identifica rollback y decisiones del propietario.
- Handoff vigente versionado, SHA/fecha, baseline, cambios, resultados, artefactos, próximos pasos y bloqueos. Si otra sesión agota créditos, debe continuar sin depender de la memoria del chat.

GO para implementar el delta en laboratorio después de cerrar v1.3. NO GO para E2 producto, master, PR, merge, Production, nuevos proveedores, firma o gasto IA. No pidas de nuevo aprobaciones ya concedidas, pero tampoco traspases límites. Si faltan datos o permisos, documenta exactamente la limitación, continúa lo que sí pertenece al mandato y no fabriques resultados.

**Entrega la implementación, no otro plan. El objetivo es sumar excelencia documental profesional a lo que ya tenemos: máximo diseño y calidad, máxima utilidad, máxima trazabilidad, cero invenciones.**
