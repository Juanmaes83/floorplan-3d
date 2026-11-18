# Handoff de la candidata conjunta RUBIK SOTA

La rama `codex/candidata-conjunta` parte de `master@7dccf7a6095e6700b2a6b81161f4172b53c340fb`. Los SHA de origen permanecen como antepasados y cada incorporación tiene su propio commit de fusión en la rama candidata.

| PR | SHA de origen | Alcance |
| --- | --- | --- |
| [#251](https://github.com/Juanmaes83/floorplan-3d/pull/251) | `02b297804e6ca4336409abcf10e412f47e4c2f67` | Studio E2, evolución de ENT-04 |
| [#252](https://github.com/Juanmaes83/floorplan-3d/pull/252) | `75c479289876a93f1511cbf5a2fab909aea1f9c8` | H01, inventario del dossier |
| [#253](https://github.com/Juanmaes83/floorplan-3d/pull/253) | `b74dab7fbb1235dda5084c8de36740c792b29f69` | H02, marca de la cabecera económica |
| [#254](https://github.com/Juanmaes83/floorplan-3d/pull/254) | `4eb58ae97e9cb6eb2e580c532f2b1fff0f367b1c` | MCP Etapa 2 aprobado en alcance digital y de solo lectura, escala estimada |
| [#255](https://github.com/Juanmaes83/floorplan-3d/pull/255) | `15658307c83a48e595a2dada2e32c70d66abaa59` | Detalle arquitectónico VQ-01, Hero F02 y F03 |
| [#257](https://github.com/Juanmaes83/floorplan-3d/pull/257) | `7dd0b454521d5dedce52acb9449aa8d9e3cdeb82` | Guardar proyecto JSON, UX-BETA-001 |
| [#258](https://github.com/Juanmaes83/floorplan-3d/pull/258) | `56e6777f357100fb6ce6b241ea3ba51bd7bf22f1` | Infraestructura IA para beta privada, desactivada |

La única resolución manual combina las tres altas bloqueantes de E2, H01 y H02 en `tests/regression-partitions.json`, incluidas sus anotaciones. El guard encuentra 156 archivos de navegador, 13 en la partición bloqueante y ninguno sin cobertura. Los workflows del producto y el modo de observación siguen vigentes. Los archivos compartidos del editor se combinaron por Git.

## Coordinación y cierre

Claude puede validar esta rama desde un worktree separado. Actualizar la candidata al cambiar un SHA de origen y volver a verificar las rutas afectadas. La cola de CI de una PR se evalúa en su propio SHA. La validación previa de cada origen y la validación conjunta acreditan alcances distintos.

El visto bueno operativo de IA se evalúa aparte. Visual, MCP y guardado JSON pueden pasar su validación e integración sin esperar credenciales ni consumo real. Mantener Beta 01 y Production en sus despliegues aprobados. Para retirar un bloque de la candidata usar el commit de incorporación correspondiente y el primer padre como referencia de rollback.

Tras la incorporación efectiva en master, actualizar solo los IDs demostrados con la auditoría reconciliada de 98 IDs como base. ENT-04 se evalúa en el alcance de E2, sin extender su cierre a Studio E3–E7. H01, H02, UX-BETA-001, MCP y SCULPT tienen seguimiento propio y quedan fuera del recuento histórico. VQ-01, F02 y F03 conservan su procedencia y alcance visual. FOT-01, CAT-01 y el asistente real siguen pendientes de la prueba pagada autorizada. MCP Etapa 2 no cierra AG-5 ni GEN-01.
