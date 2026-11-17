# Continuidad Codex — CI inteligente en observación

17/11/2026. Base `master@8525025a1470d48d52d8e365070e5a0acf116134`. Rama `feat/ci-inteligente-observacion-20261117`. PR documental #246 independiente, no fusionada. Studio Presentation permanece en la rama de Claude, sin intervención.

Se recuperaron `impact-plan.cjs` y sus 22 tests, se versionaron en scripts/ci y se añadieron pruebas de observación y reutilización. Se conecta inventario Git de base/candidato, matriz de impacto conservadora, medición de Actions, verificación de conservación de workflows y gate universal. Los 36 workflows originales conservan la ejecución; se habilita dispatch manual/completo y ronda semanal Actions. **No hay omisiones activas ni ahorro conseguido durante observación.** La política y reproducción están en [ci-inteligente](../technical/ci-inteligente.md).

Siguiente operación: revisar artefactos `ci-impact-SHA`, contrastar el inventario con las ejecuciones reales y clasificar cualquier fallo sin confundir timeout, entorno y aserción. La propuesta selectiva no sustituye checks originales. No autoriza merge, promoción ni cambios de protección de master. Si el gate o inventario falla, corregir antes de recomendar aceptación. Una activación posterior de omisiones requiere evidencia representativa y cambio independiente revisable.

Producción permanece en deployment `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`, SHA `8525025`, promovido con GO explícito en la sesión anterior. Caducidad S3 tiene evidencia original 30/30 + 7/7 conservada en #246. La comprobación pública dirigida posterior encontró timeout de replay en Dibujo vivo; no se modifica producto en este corte.

Rollback: revertir este corte restaura workflows originales; ninguna prueba o aserción se elimina. Los resultados históricos mantienen su SHA. No se leen secretos, no se habilitan proveedores generativos ni Cron de Production.
