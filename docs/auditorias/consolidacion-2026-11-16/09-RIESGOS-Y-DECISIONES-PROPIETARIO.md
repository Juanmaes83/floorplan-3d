# Riesgos, decisiones del propietario y condiciones de GO

**Referencia:** `master@46174d6918e336119a79f5bda9fd2733aa5464c4`. P0 = integridad/seguridad bloqueante para el alcance elegido; P1 = riesgo alto o brecha esencial; P2 = moderado/local; P3 = histórico o futuro. No se asigna una fecha de entrega especulativa.

| Riesgo o decisión | Evidencia real | Medida propuesta y dueño | ¿GO requerido? |
|---|---|---|---|
| Protección de master ausente | API protection 404; reglas efectivas `[]`. | Definir required checks/reviews y permiso de push antes de futuras fusiones; Codex prepara propuesta. | Sí, cambio remoto de reglas. |
| Piloto móvil o solo escritorio | Tres fallos reproducidos de controles táctiles, 35/38 browser. | Si móvil, corregir solape/margen y repetir 390×844/844×390; si escritorio, declarar el límite. | Juanma decide alcance; merge del fix exige GO. |
| Presupuesto portable y cifras | `project-package` exporta proyecto/imágenes; `budget-ui` descarga JSON separado, sin import hallado; `FloorPlanBudgetV1` tiene IVA por partida. | Ensayo de recuperación y traspaso; diseñar paquete/lector solo si piloto cruza navegador o dispositivo. Mantener «parcial» si falta precio, cantidad o IVA. | GO de alcance y de cualquier nueva migración. |
| Identidad de estudios | `studioId` local de CAT, sin sesión servidor; V3 remoto usa código propio, no identidad de cuenta. | Piloto sintético/cerrado y separación local verificada. Autenticación real antes de SaaS multiestudio o datos sensibles. | Juanma define datos y acceso; proveedor/identidad requiere GO. |
| Entrega mediante enlace | API snapshot/share/unshare y preview existen; lector `delivery-client` master solo opener. #166 conserva fetch remoto pero 8 conflictos. | Primer piloto puede usar archivo local. Si exige enlace, portar lector sobre master, probar dos navegadores, permiso y revocación. | Sí para publicar cualquier enlace de prueba y para merge. |
| Asistente V3 y gasto | #238 remoto `5e3a2e9` anterior a F1/F8/F8-C y XR finales; CI browser rojo; Claude trabaja local. | Esperar entrega de Claude, auditar IVA/unidad, aislamiento, ledger Redis y test de proveedor. Mantener V2 local. | GO separado para merge, proveedor, pago y Production. Issue #239 no es GO. |
| Home y mensajes de disponibilidad | #236 Draft, base b9f7613, merge-tree limpio; alias público del 9/11. | Conciliar registro, CAT04 y rutas; probar seis perfiles e idiomas en SHA nuevo. | GO de merge y otro de Promote. |
| Servicios externos y derechos | R01/visual/MCP labs con código exclusivo; referencias/planes y donantes con condiciones. | Mantener aislados; solicitar planos/assets licenciados y aceptación profesional antes de integrarlos. | GO de producto/licencia cuando haya candidato concreto. |
| Despliegue no alineado | HEAD READY `7818009528`; alias en dpl_5abs del 9/11. | Verificar deployment exacto y promover solo tras gates A–H del alcance. | Sí, Promote/domino son actos separados. |

## Decisiones prioritarias de Juanma

1. **Dispositivos:** recomiendo escritorio en primera ronda; móvil solo tras corregir y verificar los tres fallos.
2. **Entrega:** recomiendo paquete local en primera ronda; enlace 3D interactivo si es objetivo de evaluación explícito.
3. **Datos:** recomiendo proyectos sintéticos o material con consentimiento/licencia; no exponer datos de otros estudios en un entorno sin identidad servidor.
4. **V3 y gasto:** recomiendo mantener #238 aislada hasta SHA final de Claude y revisión; no activar modelo ni Redis de pago por mera presencia de variables.
5. **Gobernanza/publicación:** recomiendo proteger master y, en un acto distinto, aprobar o rechazar el Promote del deployment exacto tras prueba visual y E2E.

**Bloqueado por Claude:** únicamente el dictamen final del corte V3 posterior a `5e3a2e9`; los cortes 0–3 de auditoría y preparación pueden avanzar. Recibir su entrega no constituye autorización automática para merge. **Autorizaciones no concedidas en esta misión:** cerrar PR, modificar reglas, merge, push, publicar enlaces, desplegar/promover, cambiar variables, pagar proveedores o utilizar datos reales de clientes.
