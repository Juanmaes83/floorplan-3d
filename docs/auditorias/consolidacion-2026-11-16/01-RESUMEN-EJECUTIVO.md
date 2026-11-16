# Consolidación de RUBIK SOTA — resumen ejecutivo

**Corte remoto:** 16/11/2026 10:02:54 UTC, `master@46174d6918e336119a79f5bda9fd2733aa5464c4`. El clon `rubik-audit-master-20261116` se mantuvo separado de la sesión de Claude. GitHub tiene 29 PR abiertas; no hay porcentaje defendible de «integración» porque sus alcances se solapan y algunas PR son solo documentos o laboratorios.

## Dictamen

RUBIK **sí es una sola aplicación principal en master**, con editor 2D, proyecto `FloorPlanProjectV1`, visor 3D, mobiliario, catálogo, presupuesto, Asistente V2 y Entregar conectados por entradas de `index.html`. El problema no es unir 29 aplicaciones. Las brechas son el estado paralelo de proyecto/catálogo/presupuesto, la ausencia de identidad multiestudio autenticada, una visita de cliente cuyo enlace completo no está acreditado, algunas rutas y mensajes de Home pendientes y un despliegue público anterior al HEAD.

De 29 PR, la clasificación principal forense es **A=6 absorbidas**, **B=4 parcialmente absorbidas**, **C=1 candidata**, **D=1 bloqueada**, **E=8 laboratorios**, **F=9 documentales históricas**, **G=0**, **H=0**. Esto clasifica su destino funcional, no autoriza cierres. El merge simulado directamente contra master fue limpio en **18** y conflictivo en **11**; muchas limpias son laboratorios o documentos. GitHub informó #86 limpia contra su base `feat/solutions`, mientras la simulación contra master produjo 12 conflictos.

**Absorbidas:** #225–#227 por #228; #217 por ancestralidad Git y posterior activación #223; #71 y #86 por guías actuales equivalentes. #225/#226 conservan solo un `index.html` distinto por reconciliación posterior; #227 coincidía en 13/14 blobs con el commit de integración #228. **Parciales:** #166 (lector externo de visita y pruebas aún exclusivos), #193/#194 (labs R02/R03 con cortes usables en master), #215 (R03 activado por #222; parte de la evidencia permanece en la PR). **Candidata:** #236 HOM-03, merge mecánico limpio pero base anterior a CAT-04. **Bloqueada:** #238 V3 remoto, conflicto de workflow, CI browser rojo y contratos económicos posteriores a su base. **Laboratorios:** #191/#205, #196/#197/#204 y #165/#167/#169. Las nueve documentales no son producto; algunas conservan decisiones o procedencia.

## Primera acción y espera de Claude

Antes de Claude pueden fijarse el SHA/gates, comprobar el proyecto sintético de extremo a extremo, reconciliar Home #236 con CAT-04, documentar el paquete local y definir si el piloto exige enlace remoto. Ninguna de estas acciones requiere tocar #238. La rama V3 solo se reauditará cuando Claude entregue SHA final, historial, diferencias económicas, pruebas y límites. Los commits locales comunicados `eb6cc57` y `16a7d13` no están en el clon aislado; no se les atribuye estado remoto ni aprobación.

## Riesgos que impiden llamar al sistema «completamente integrado»

1. `master` carece de protección efectiva visible: API `/branches/master/protection` = 404 «Branch not protected», reglas de rama = `[]`.
2. Proyecto, catálogo y presupuesto son estados locales separados. `project-package` exporta proyecto e imágenes; el presupuesto se descarga como JSON aparte y no se encontró importación equivalente en `budget-ui`. Es una limitación de portabilidad y coherencia a probar, no prueba de corrupción.
3. El catálogo usa un identificador de estudio local, no identidad autenticada. El Asistente V3 remoto usa un código compartido y contexto del navegador; sus pruebas de aislamiento no sustituyen un servidor multiestudio.
4. Master tiene preview ENT-01 y GET `/api/delivery`, pero `js/delivery-client.js` carga solo desde `opener`; no se verificó publicar→abrir en otro navegador→revocar.
5. La URL pública `floorplan-3d-alpha.vercel.app` sigue en `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` (9/11), mientras HEAD tiene deployment Production READY `7818009528`. READY no es alias público ni aceptación funcional.
6. Los controles móviles de Construir/Inicio fallaron dos veces sobre este mismo SHA; en la tanda reproducida de 10:12–10:19 UTC fueron 3 fallos de 38. Son P0 si el piloto incluye móvil.

**Recomendación:** conservar el producto incremental. Ninguna de las 29 PR se recomienda para merge directo ahora; #236 es candidata tras reconciliación, #166 aporta un corte parcial opcional, #238 espera a Claude y GO independiente de gasto/privacidad. R01, MCP Etapa 2 y los visuales permanecen aislados. Ver `MATRIZ-29-PR.md`, `FICHAS-TECNICAS-PR.md` y `07-PLAN-CONSOLIDACION-CODEX.md` para las condiciones comprobables.
