# Cierre autorizado de tanda F3 #23 — reconciliación

## Estado y preservación

Una sola entrega activa, rama existente `feat/f3-asset-lab-controlled-next`.
Base original/HEAD visualmente aprobado: `5b7267f84380586d5e482373bd70f0392e896009`.
Master remoto observado: `7d49a5ed3c07da73c80e259465d62c22c6a69c0d`.
PR #24 MERGED `67b7f999c42b3a2960dac6caf94ab77dcc637819`; cierres #25/#26 incluidos.
PR #23 inicialmente OPEN/CONFLICTING. Solo ROADMAP y Roadmap 2 tenían conflictos;
se combinaron ambos estados sin restaurar código antiguo ni cambiar prioridades.
README/contrato/pipeline se inspeccionaron: schema y exportador #24 conservados.
No force push, rama satélite, nuevos modelos ni modificación de PR #21.

Juanma aprobó previamente la apariencia y autoriza squash condicionado a
pruebas, preview exacta y conservación del contenido. La comparación física
de 156 archivos (UI/js/catálogos/modelos/superficies/permisos) contra el SHA
aprobado da igualdad bytes/SHA. Una auditoría independiente confirma diff vacío
para lo visible y exportador/schema intactos respecto de master.
[Comparación](artifacts/f3-reconciliation/approved-content.json).

## Pipeline repetido

Herramientas fijadas restauradas exclusivamente con `npm ci --offline` desde
caché existente, sin descarga, cambio de lockfile ni servicios nuevos.
Fuente Asset Lab preservada `5dc7b182c5c227472b84aea66a3ffa1368c95981`.
Seis conversiones repetidas y dos rechazos, después integración del manifiesto:
todos los GLB, registro de resultados y manifiesto idénticos byte a byte.
[Comandos/hashes/exclusiones](artifacts/f3-reconciliation/pipeline/verification.json).
No se convirtió otra vez para cambiar la apariencia; se comprobó repetibilidad.
GLOSTAD 3 plazas y SALTSJÖBADEN siguen fuera por extensiones no admitidas.

## Regresión y fallos

La primera suite completa: 199 tests, 197 PASS, un timeout de importación de
imagen, un negativo Blender omitido porque faltaba BLENDER_EXE en el entorno.
Python schema falló por usar Python3.12 con el rpds nativo existente para3.11.
Se seleccionó Python3.11.9 ya instalado; no se instalaron librerías Python.
La prueba de imagen pasa en repetición dirigida sin tocar producto/expectativas;
no se atribuye con certeza una causa al timeout transitorio.
[Primera ejecución](artifacts/f3-reconciliation/validation.json).

Una selección dirigida inicial incluyó suites sin casos coincidentes y quedó
esperando su teardown: solo esos tres procesos se detuvieron; se restringió
la selección a los dos archivos afectados. La repetición dirigida dio3/3,
incluido rechazo real de paquete corrupto en Blender, y42/42 Python.
[Dirigida](artifacts/f3-reconciliation-focused-r02/validation.json).

La instrumentación inicial colapsó algunos nombres de screenshots y las suites
escribieron17 métricas históricas. Se preservaron esas métricas nuevas con hash
en `generated-metrics` y se recuperaron los originales del índice, que eran
limpios al comienzo. Se corrigió el preload para conservar subcarpetas y
redirigir tanto PNG como métricas; no se modificó el código de aplicación.
Las tres capturas `cohort-*` iniciales no colisionaron ni reemplazaron las
aprobadas. La repetición final conserva la estructura por suite.

La suite completa final pasa **199/199 Node, sin omisiones, y42/42 Python**;
344,03s para Node. Sus comandos se guardan en
[validation.json](artifacts/f3-reconciliation-final/validation.json).
No inferir su PASS del resultado dirigido; consultar sus códigos y log.
Node24.14.1, Chromium instalado1243/SwiftShader; Blender5.2.1 LTS.
Python3.11.9 para las cuatro suites;3.12.14/Pillow para conversión interop.
No QA de teléfono físico ni nuevos umbrales de producto.

## Preview, squash y siguiente estado

Tras publicar normalmente se verifican Vercel READY, SHA final, target preview,
HTML/aplicación y modelos en URL protegida. No se usa producción como preview.
La URL/ID y el SHA exacto se registran en la propia PR para evitar el bucle de
cambiar el SHA al documentar el mismo SHA dentro de su commit.
Si la protección exige enlace temporal, se entrega acceso limitado con caducidad;
no se desactiva la protección ni se versionan credenciales/bypass.

El squash solo se ejecuta si todos estos controles pasan y GitHub confirma
mergeable, usando `--match-head-commit`. El estado MERGED/SHA squash se comprueba
en [PR #23](https://github.com/Juanmaes83/floorplan-3d/pull/23) y master después.
Esta documentación está incluida en la misma entrega, no en commit aislado
posterior de cierre. Borrado de rama remota solo tras MERGED y ninguna otra PR
dependiente; rama local/historia conservadas. LAB v03 NO empieza antes del merge.

DO NOT REDO: modelos/aprobación visual, pipeline/profile/schema#24, históricos
PNG/JSON, F2 detector, producción. Pendientes globales: cinco sesiones/veinte
planos/umbrales F2; escala física; rendimiento en teléfono; D-01; conectores
PROJECT-PELU/Immersphere, CRM, CAD y Unreal aún no probados por esta tanda.
