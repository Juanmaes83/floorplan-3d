# Consolidación 2026-11-16 — relevo (rama `claude/vibrant-clarke-woev1u`, PR #241 Draft)

Base: `master@46174d6`. Sin merge a master, sin Production, sin gasto. `vercel.json` desactiva los despliegues de esta rama; la validación de publicación queda pendiente de autorización.

## Hecho y probado
| SHA | Corte | Pruebas |
|---|---|---|
| `2349297` | CON-01: unidad de catálogo sin ficha no se inventa al reabrir | `tests/con-01-unit-history.test.cjs` 2/2 |
| `a913919` | CON-03: «Importar presupuesto (JSON)» + recorrido transversal | `tests/con-03-budget-import.test.cjs` 4/4 · `tests/consolidacion-transversal.browser.test.cjs` 3/3 |
| `766f6db` | Identidad P1: un `project.id` por proyecto; bifurcación de presupuesto en duplicar/variante/edificio; importación sin herencia; migración idempotente; Asistente por proyecto | `tests/project-identity.test.cjs` 6/6 · `tests/project-identity.browser.test.cjs` 3/3 · pura completa 1334/0 |
| `babe3bc` | CI: `consolidation-regression.yml`, manifiesto `tests/regression-partitions.json`, detector de cobertura | 146 archivos, 0 sin cobertura |
| `99761f0` | Hilo de revisión ligado a la identidad del archivo; dos aserciones obsoletas actualizadas | client-review 5/5 · building 3/3 · variants 4/4 |
| `6d19ee5` | NAV3D móvil bajo el cajón de paleta abierto | `build-palette` + `nav3d` 9/9 en 1440×900, 390×844 y 844×390, ejecutado localmente el 16-11 |
| `8c48b55` | Merge local de #238 `6568d8c`: conservar log por proyecto incluso con panel cerrado y pasarela cerrada | 23 pruebas puras de V3/CAT-04 + 8 de navegador, todas pasan con dobles; proveedor real no probado ni habilitado |
| `6bbe283`, `93bd9fc`, `572eddc`, `8e6a5a8` | HOM-03 y acceso CAT-04 ya fusionado por #237, rotulado como piloto local | 20 pruebas puras + 7 de navegador, seis perfiles, móvil e idiomas |
| `73153f2` | #166 selectiva: snapshot 3D opcional, enlace y lector con API GOV-08 de master; retirada conjunta | 31 pruebas puras de entrega/registro/API; navegador: publicar, abrir en otro contexto y revocar con Blob sintético 1/1; vista previa 3/3; retirada histórica 2/2 |
| `00ca054` | Seis fallos de journey clasificados; barra compacta móvil reducida 6 px | Selección de seis casos 6/6; la suite completa sigue sin verificación |

## Estado de validación y siguiente gate
- El CI remoto de `#241@6d19ee5`, consultado el 16-11, tenía 8 checks correctos, 3 en ejecución y 65 en cola; **ningún fallo confirmado**. Esos resultados no certifican los commits posteriores. Revisar los checks del HEAD exacto después del push; separar regresiones de tandas históricas.
- Las pruebas dirigidas de identidad y presupuesto de este corte: 12/12 (migración idempotente; copias independientes; fallo de almacenamiento; IVA propio, unidad, fuente y revisión; adopción y confirmación de importación). No se detectó regresión en ese contrato.
- `tests/build-palette.browser.test.cjs` y la nueva prueba sintética de entrega pasan al gate `blocking`. El detector de cobertura encuentra 150 archivos de navegador y 0 sin asignar.
- Seis fallos históricos de `journey-orientation`: T1/T9/T10 en 1440×900, 390×844 y 844×390 y T8 usaban una sonda de color que incluía controles de amueblamiento fuera de la guía; la aserción ahora examina solo la guía y los cuatro casos pasan completos. T11 era defecto real (176 px frente a 170): ajuste de 6 px, caso completo verde. T13 esperaba el nombre antiguo «Distribuir»; el producto ahora usa «Diseñar» y sigue ofreciendo «Ver conflictos», caso completo verde. **Solo estos seis casos se ejecutaron**; la suite entera no se declara verde.
- `tests/spend-ledger.test.cjs` no puede ejecutarse aquí porque falta `redis-server`. La prueba de generación de contratos de `assistant-ai-v2.test.cjs` falló localmente por diferencias de salida de archivos en Windows; revisar en CI Linux del HEAD exacto. No se ha usado proveedor real.
- La entrega se validó con `api/share`, `api/view`, `api/delivery` y `api/unshare` reales sobre Blob **en memoria**, con dos contextos aislados de Chromium y datos sintéticos. Falta aceptación en Preview; no se ha publicado ni revocado un enlace real.
- Mantener la PR Draft. No fusionar a master, activar IA ni publicar Production sin GO del propietario.

## Límites conocidos
- La bifurcación copia el presupuesto guardado; no copia `priceHistory` de obra ni re-dirige referencias visuales (`projectId` dentro de la extensión).
- Proyecto y presupuesto siguen siendo dos archivos al cambiar de navegador.
- El registro de publicaciones vive en este navegador y no constituye control de acceso multiusuario. La URL de visita da acceso a quien la tenga; el flujo exige consentimiento y permite retirada, con posibles cachés y copias ya descargadas.
