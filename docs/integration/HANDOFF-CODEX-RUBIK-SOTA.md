# Continuidad Codex — RUBIK SOTA

Fecha: 17/11/2026. Master consultado: `8525025a1470d48d52d8e365070e5a0acf116134`.
Rama documental: `docs/cierre-consolidacion-2026-11-17`. El SHA exacto del cierre lo identifica el commit que contiene este documento; no cambia código funcional.

## Autorización y resultado

El propietario autorizó expresamente promover `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA` en esta sesión. Operación ejecutada; la API del alias confirmó su asociación a `floorplan-3d-alpha.vercel.app`. El HTML público coincide byte a byte con `8525025:index.html`; [huellas y fecha](../qa/evidencias-cierre-2026-11-17/public-index.json).
Recuperación conservada: `dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs`, SHA `40b4ae5`.
No autoriza promociones futuras, nuevos proveedores, gasto IA, Cron ni integración de Studio Presentation.

## Evidencias

- #243, #244 y #245 fusionadas, verificación directa por API. Ninguna PR abierta al inicio del corte.
- CI de master: 11 check-runs completados con éxito. No se mezclan con los checks de los candidatos anteriores.
- Árbol de master `5441db02b71407ab03731216054165eee24940c0`, idéntico a #244 `28a01b0b0195593d966729d385ab97d32bc16c6c`.
- Se recuperaron los resultados originales S3: [30/30](../qa/evidencias-s3-2026-11-17/result.json), [7/7 conservación](../qa/evidencias-s3-2026-11-17/retention-result.json), logs, capturas y metadatos de aislamiento. Preview original `dpl_BLpr8QmGMd6mUxn1Wfaf5cCmLkep`, #244 `28a01b0`; resultados fechados el 17/11. Son evidencia recuperada, no pruebas ejecutadas de nuevo.
- Los dos archivos privados locales temporales no existen, comprobado directamente. La revocación del bypass fue comunicada en el registro histórico recuperado; no se ha ejecutado de nuevo ni certificado la revocación de variables de rama. No se leyeron valores de secretos.
- Smoke público ejecutado sobre el dominio promovido: 11/11. [Log](../qa/evidencias-cierre-2026-11-17/public-smoke.log). Home escritorio/móvil, perfiles, 2D/3D y áreas profesionales; cero intentos de render o publicación. No certifica por sí solo todos los recorridos de biblioteca, presentación, Evolución y Dibujo vivo; conservan su evidencia anterior y requieren prueba pública dirigida si se pide una nueva aceptación completa.

## Siguiente operación

Revisar la PR documental de cierre; no fusionar automáticamente. No se dispone de autorización expresa para fusionar nuevas PR de esta sesión.
Continuar CI inteligente en **otra PR**. Ya existe un prototipo local del agente anterior: `impact-plan.cjs`, 22 pruebas y auditoría de 36 workflows. Falta adaptar dependencias reales, manifestar cobertura, conectar selector y workflows, demostrar selección y rollback, y medir resultados. No está implantado ni se atribuye ahorro.
Antes de cambiar workflows, inspeccionar sus comandos y los tests consumidores de documentación. Seguridad, contratos compartidos, configuración global, desconocidos y cambios del selector deben forzar regresión integral. Gate estable para estados no aplicables; ninguna omisión se considera PASS ni evidencia reutilizada sin equivalencia.

Studio Presentation pertenece a Claude (`lab/studio-presentation-e0e1`); no se modificó. GOV-08 sigue parcial: S4/S5 y GOV-06a fuera del corte.

## Comandos reproducibles

```powershell
git ls-remote origin refs/heads/master
git rev-parse '8525025^{tree}' '28a01b0^{tree}'
gh api repos/Juanmaes83/floorplan-3d/commits/8525025a1470d48d52d8e365070e5a0acf116134/check-runs --paginate
gh api repos/Juanmaes83/floorplan-3d/rulesets
```

Master no tiene protección efectiva: endpoint de protección devuelve 404; rulesets vacíos. No se modificó administración. El rollback documental es revertir el commit; el rollback público exige decisión del propietario sobre el deployment anterior conservado.

## Cierre residual de #246

Matrices y olas reconciliadas: GOV-08 S3 integrado; ENT-02 parcial con caducidad, ENT-01 con 410 acreditado; ENT-04 parcial accesible en comparar/, evolución coordinada con Studio Presentation. Variables temporales de rama Preview aún configuradas al consultarlas sin decrypt; retirada preparada y autorización solicitada exclusivamente para esas dos variables. Production no se modifica. Los metadatos públicos se minimizaron en el árbol actual; las versiones anteriores siguen en el historial, que no se reescribe. Original completo conservado localmente.

Pruebas públicas dirigidas sobre master@8525025: 6/7. Evolución pasó los cuatro casos, Home y Dibujo vivo móvil pasaron; el caso escritorio falló por timeout en «Volver a ver» después de «Cómo hacerlo» (esperaba reinicio de story living-drawing). No es un verde ni un fallo histórico descartado: requiere confirmar la incidencia de replay y corrección de producto en corte separado. [Log sanitizado](../qa/evidencias-cierre-2026-11-17/directed-public.txt). Se adaptaron las dos suites home-demos/evolution-demo a la URL pública, manteniendo aserciones y bloqueando /api/. No hubo llamadas de pago, publicaciones ni borrados. Biblioteca/presentación/presupuesto mantienen evidencia histórica; el smoke 11/11 anterior no acredita aceptación integral nueva de sus recorridos.

CI inteligente se implementa en rama independiente feat/ci-inteligente-observacion-20261117. Observación obligatoria, sin omisiones habilitadas ni ahorro atribuido hasta medir.
