# 18 · Roadmap de recetas futuras RP13–RP21 (v1.4 §10)

Generado por `tools/roadmap-recetas.cjs` desde `tools/recetas.cjs` (rubik-lab-recetas/1) y la evaluación de fuentes sobre la entrega compuesta. Ningún motor operativo se implementa; los negativos están en `tools/recetas-qa.cjs`.

| Receta | Finalidad | Nivel | Fuentes requeridas | Integración prevista | Criterios de aceptación (contrato) | Bloqueo actual | Corte |
|---|---|---|---|---|---|---|---|
| RP13 | Comparativo de ofertas homologadas | C | Ofertas independientes comparables; Presupuesto canónico | Comparador económico sobre FloorPlanRevisionBudget; ofertas aportadas como fuente atribuida | proveedor; moneda; IVA; alcance; unidad; fecha de la oferta | no-elegible: Ofertas independientes comparables | corte económico específico |
| RP14 | Orden de cambio de diseño u obra | C | Revisión anterior vinculada y comparable (estado actual); Motivo del cambio atribuido | ENT-04 (comparar/) + motivo atribuido; delta económico solo con revisiones coherentes (A25) | revisión base; revisión propuesta; motivo atribuido; diferencias canónicas; delta económico solo si ambas revisiones son coherentes (A25); plazo solo con plan válido | no-elegible: Revisión anterior vinculada y comparable (estado actual); Motivo del cambio atribuido | E2/E3 (ENT-04) |
| RP15 | Seguimiento y certificaciones de obra | C | Plan de obra (FT3D-8); Observaciones de obra reales (fecha, autor); Certificaciones de obra aportadas | FT3D-8 + observaciones y certificados de obra | previsto; simulado; declarado por terceros; observado (fecha, autor, ubicación) | no-elegible: Observaciones de obra reales (fecha, autor); Certificaciones de obra aportadas | E3/E6 + OBR |
| RP16 | Visita, actas, RFI y decisiones | F | Actas de visita, RFI y decisiones | Registro de visitas OBR (no existe) | fecha; participantes; observaciones; hechos, propuestas y decisiones separados; responsables; fuentes autorizadas | no-disponible: Actas de visita, RFI y decisiones | OBR futuro |
| RP17 | Personalización y especificación técnica | C | Materiales del modelo; Objetos colocados (mobiliario y equipamiento); Referencias de producto acreditadas (SKU, marca); Especificación de ejecución validada por técnico competente | ENT-05 especificación sobre catálogo acreditado | selección de acabados actual; alternativas; especificación de ejecución validada | no-elegible: Referencias de producto acreditadas (SKU, marca); Especificación de ejecución validada por técnico competente | E4 (ENT-05) |
| RP18 | Recepción y remates | F | Lista de remates observada | Registro de remates OBR (no existe) | ubicación; estado observado; responsable; cierre aceptado expresamente | no-disponible: Lista de remates observada | OBR futuro |
| RP19 | As-built y manual de mantenimiento | F | Revisión ejecutada y validada (as-built); Manuales y garantías aportados | Revisión ejecutada validada + manuales y garantías (E6) | revisión ejecutada validada; manuales; garantías; planos de instalaciones solo con evidencia | no-disponible: Revisión ejecutada y validada (as-built); Manuales y garantías aportados | E6 / alcance futuro |
| RP20 | Liquidación, garantías y entrega de llaves | F | Coste real liquidado; Manuales y garantías aportados; Actas de entrega y aceptación | Liquidación y actas; sin firma simulada | coste liquidado; desviación homologada; garantías; actas | no-disponible: Coste real liquidado; Manuales y garantías aportados; Actas de entrega y aceptación | corte futuro |
| RP21 | Dossier del propietario y portfolio final | C | Evidencia de lo ejecutado (fotos reales de obra); Archivo del propietario disponible por contrato | Evidencia ejecutada + archivo del propietario (E6/E7) | imágenes del diseño frente a evidencia ejecutada; visita y archivo por contrato; sin datos ajenos | no-elegible: Evidencia de lo ejecutado (fotos reales de obra); Archivo del propietario disponible por contrato | E6/E7 |

## Seguimiento de pilares (sin cambios de alcance)

| Pilar | Estado en el laboratorio | Corte |
|---|---|---|
| Dibujo vivo | Fotograma auténtico; exportación de la transformación no existe | E4/E5 |
| FT3D-8 | Vídeo, presentación y manifiesto reales; huella verificada con la función canónica | E3/E6 |
| Render IA | 3 renders D7 con trazabilidad; sin persistencia de la imagen enviada | E4 (IMG-12/ENT-05) |
| Visita inmersiva | Ausencia explícita en la carpeta offline | E3/E6 |
| Mi estudio (marca) | Perfiles de laboratorio; sin colores ni fuentes en producto (H07) | E3 |
| PDF avanzado | CSS Print + paginación medida; PDF/A no afirmado | E5 |
| Seguridad de entregas | Exportador con gates, verificador e inspector; publicación remota fuera | E6 (GOV-08, DEC-05) |

Sin IDs maestros ni olas nuevas.
