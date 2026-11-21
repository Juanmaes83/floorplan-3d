# RUBIK SOTA — Punto de recuperación y reanudación

> **CORTE OPERATIVO POST-#300 · 21/11/2026 (posterior a los apartados históricos).** [Auditoría operativa y cola de cierres](CORTE-OPERATIVO-POST300-2026-11-21.md) (en esta PR #305): `master@414e53acf302c434afb85cf86434382b81eb7b0e` y Vercel Production READY del mismo SHA; #306 Blender y #300 idiomas ya **fusionadas**. CI posfusión #300 en una consulta posterior: 6 PASS, 1 en ejecución y 1 SKIP. Verificar GitHub antes de declararla cerrada. Próximo M12 #301 cámara → #271 RoomPlan UX; M11 #309 HERO bloqueada, M01 A0 #310 con CI general verde pero gate específico WebKit/Firefox y composición pendientes. Las fechas/contadores del cuerpo original son históricos y **no** deben interpretarse como el estado actual. No se autoriza con esta nota merge, gasto ni migración.
> **Recuperación:** GitHub recupera el código, no los proyectos guardados en localStorage/IndexedDB. No existe en este corte un simulacro acreditado de copia independiente/restauración integral.

---

**Corte auditado:** 21/11/2026, 22:37 CET. Documento operativo de solo documentación: no ejecuta copias, restauraciones, migraciones, cambios de código ni despliegues. Leer junto a [Continuidad vigente](CONTINUIDAD-OPERATIVA-VIGENTE.md). Comprobar el remoto antes de actuar: una fotografía de estado no es monitorización continua.

## 1. Qué podemos recuperar hoy

| Objeto | Situación acreditada | Límite pendiente |
| --- | --- | --- |
| Código del producto | Commit y árbol identificados en GitHub; historial y PR con sus alcances | No se ha acreditado en este corte un respaldo independiente del repositorio ni un simulacro integral desde cero |
| Contexto para continuar | Handoff, contratos, matriz de 98 IDs, corte de 14 módulos, candidatas y evidencias enlazadas | Esta actualización está en PR documental #305; no está fusionada en master. Las referencias fijas de este documento permiten encontrarla aunque cambie una rama |
| Evidencias publicadas | Resultados, capturas, vídeos y manifiestos separados por ejecución en los laboratorios indicados | Una ejecución no prueba otro árbol; los artefactos temporales de Actions pueden caducar. Descargar y conservar el paquete de cierre cuando se autorice su respaldo |
| Proyectos del usuario | Biblioteca/exportaciones existentes; núcleo F0.1 de expediente con integridad y restauración | GitHub no contiene los proyectos guardados en localStorage/IndexedDB. Tener el núcleo no acredita una interfaz de recuperación general en Production. F0.3 pendiente |
| Recuperación completa de datos | Diseño y candidatas F0.2c/F0.3 ya avanzados | No está cerrada ni activada en el origen normal. No se garantiza recuperar datos eliminados antes de una copia válida. F1 nube/multidispositivo es un frente separado |

**Objetivo «recuperar siempre»: aún no acreditado.** Sí podemos retomar el desarrollo desde fuentes publicadas; faltan la copia completa de datos, su restauración demostrada y un respaldo independiente probado. No confundir exportar un proyecto con respaldar todo el estudio.

## 2. Referencias fijas para retomar sin rehacer

| Alcance | Repositorio / referencia | Commit completo | Árbol o evidencia |
| --- | --- | --- | --- |
| Producto observado | `Juanmaes83/floorplan-3d`, master | `9d8a71eaa11c885199ed3001c5eab1d7b59b7799` | `7dda0024c1e68674126a0f0723d683b8557484f7` |
| Continuidad documental anterior a esta ampliación | mismo repositorio, `codex/auditoria-delta-master-20261121`, PR #305 | `ba05fce37e6be227cfebda0f1265292fc3718d2f` | `820874caf8c01e13918a48388a56f1f66bcaf829`; el commit que incorpora este documento se obtiene en el historial de #305, sin hash autorreferente |
| Blender profesional | mismo repositorio, PR #306 | `401e882c0e84d44f16d85deba27eabf4da8e6eb5` | Aceptación previa conservada; CI de ese HEAD, no de su predecesor |
| HERO candidata de producto | mismo repositorio, PR #309 | `78cfa859ba16a32ddbadd35327368f4f6b663c85` | `258ee2322671f7660e1f6566f40cc28f5e11a5b6`; aún no contiene las últimas correcciones del laboratorio |
| A0 nueva candidata | mismo repositorio, `claude/a0-writer-fence-4cd3884`, PR #310 | `2c7e77392a6137be2d1efb5674fd774385942e85` | `c6f2468c0ad530fdb7fffc4b92c4126197ed45d7`; fuente base 4cd3884. #273 original intacta |
| HERO laboratorio | `Juanmaes83/rubik-sculpt-simulator-lab`, `claude/hero-final-candidata` | `895bd7defc3f721fbca9437a95c7d67262c81826` | `COMPONENTES/A-construccion-procedural/final-hero/` |
| Simulator B laboratorio | mismo laboratorio, `claude/simulator-b-cierre` | `b201f7a73bf3421b73ac7c49b885cd8838323a9f` | `7692b62f4011e1d77bacf354f53a3757f0024d74`; `COMPONENTES/B-tiempo-direccion-cinematografica/producto/evidence/PROCEDENCIA.md` |
| F03 V2 laboratorio | mismo laboratorio, `claude/f03-v2-fidelidad-profesional` | `ba4b138063f47f4095615a367bf8668cc67356d5` | `COMPONENTES/F03-V2-fachadas/HANDOFF.md`; GO-LAB, OFF por defecto |

Production observada: `dpl_CttnoX3Bp7qhdwsoFA1QpeGhY5jb`, target `production`, READY, Git SHA `9d8a71eaa11c885199ed3001c5eab1d7b59b7799`. [Inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/CttnoX3Bp7qhdwsoFA1QpeGhY5jb). No se ha repetido smoke funcional de Production ni se extrapola a Alpha/Demo.

## 3. Reanudación de una sesión de desarrollo

1. Leer `AGENTS.md`, el protocolo de coordinación, el encabezado vigente del handoff y `CONTINUIDAD-OPERATIVA-VIGENTE.md` desde esta rama documental mientras #305 siga abierta. Consultar después GitHub, no deducir el estado actual del cuerpo histórico.
2. Leer master y HEAD de la PR asignada. Comparar con las referencias fijas anteriores; registrar el delta posterior. Verificar commit, árbol, base y contenido antes de reutilizar una prueba.
3. Conservar una copia de solo lectura de la fuente publicada y trabajar en rama/worktree propios. No restaurar, limpiar, forzar ni sobrescribir árboles de otro agente. Los cambios locales no publicados deben quedar declarados: no inventar una entrega remota.
4. Recuperar la evidencia del SHA asignado y su manifiesto, comprobar hashes y procedencia. No mezclar vídeos y resultados de ejecuciones distintas. Reutilizar la aceptación válida y ejecutar solo los gates necesarios por delta, entorno o fallo pendiente.
5. Continuar la cola #306 → #300 → #301 → #271 → #309. A0 #310 sigue en el carril de seguridad paralelo. M05 #303/#304, M08 #308, E3 #299, R02-A #298, R03 #297 y Simulator A/C/E ya están integrados en sus alcances. #296 está absorbida por #298.
6. Conservar las autorizaciones ya registradas en su alcance exacto. Este documento no concede fusiones, despliegues, activaciones, gasto ni migraciones. Registrar el siguiente paso con responsable, candidato y bloqueo concreto.
7. Al terminar: publicar documentos/evidencias del corte autorizado, verificar SHA y árbol remotos y actualizar el corte vigente. Preservar en el historial la fotografía anterior.

## 4. Datos de usuario: orden de cierre de M01

| Paso | Lo que falta acreditar | Dependencia |
| --- | --- | --- |
| A0 #310 | Batería de escritores y concurrencia persistente, especialmente WebKit; Firefox; composición con master efectivo | Candidata ya publicada y autorizada para su alcance. CI ordinaria verde no sustituye el gate original |
| Convivencia | Al menos 7 días desde A0 **activo**, sin escritores antiguos ni nuevas divergencias en la ventana observada, y demás condiciones de R1 | Integrar no inicia por sí solo el cómputo; registrar activación y evidencia |
| F0.2c #274/#276/#277 | Autoridad única, recursos, copia de emergencia completa con SHA-256 y restauración verificada; migración recuperable | Ya existen candidatas; reconciliar, no rehacer. Requiere superar R1 y autorización propia |
| F0.3 #278/#279 | Estados de guardado y acciones de recuperar/copia accesibles, enlazados al núcleo real | Cerrar UI/consumidores con la autoridad aprobada; no un segundo sistema de guardado |
| Respaldo independiente | Copia fuera del navegador, inventario de datos incluidos y excluidos, conservación y simulacro en perfil limpio | Propuesta de cierre; no se ha realizado en esta auditoría |
| F1 | Identidad, sincronización, conflictos y recuperación entre dispositivos | Decisiones propias; no asumir nube operativa por disponer de IndexedDB |

[R1](../contracts/persistencia-f0-2c-r1.md) exige copia previa completa y conservación de cambios posteriores para rollback. No borrar el legado ni restaurar datos a ciegas. Si el almacén nuevo es ilegible, no se puede prometer un rollback que conserve cambios que no se pueden leer.

El [expediente v1](../contracts/expediente-v1.md) incluye proyecto/edificio, imágenes de su contrato, presupuestos y observaciones; declara fuera `assistant-log`, `construction-record`, `studio-tariff`, `brand-profiles`, `published-links` y `variant-links`. La exportación ordinaria y el expediente excluyen las fotos privadas de MUE-01. La copia de emergencia privada completa de R1 es un alcance distinto, con confirmación. El contrato F0.1 conserva limitaciones de interfaz/arranque pendientes de F0.3; no describirlo como botón global ya disponible.

## 5. Cuándo podremos acreditar recuperación

- Del desarrollo: fuente, dependencias, configuración no secreta, instrucciones y evidencias suficientes para reconstruir y probar en un entorno limpio. Credenciales y servicios externos se recuperan por sus procedimientos seguros, nunca dentro del repositorio.
- De los proyectos: copia completa independiente que enumere todos los datos necesarios, recursos y exclusiones; integridad verificada y restauración ensayada con edificios, plantas, imágenes, documentos y conflictos en otro perfil/origen.
- Del servicio: fuente exacta desplegada, configuración y permisos controlados, restauración y verificación funcional. READY no sustituye una prueba de recuperación.
- Registro del simulacro: fecha, fuente, entorno, responsable, hashes, resultado, pérdida máxima observada y tiempo medido de recuperación. No fijar RPO/RTO ni «cero pérdidas» sin medición.

Esta auditoría solo leyó GitHub, contratos, código y estado de Vercel y actualizó documentación. No ejecutó un respaldo de datos personales ni un simulacro integral.
