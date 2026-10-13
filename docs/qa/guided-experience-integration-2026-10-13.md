# Cierre de integración UI/UX — 13 de octubre de 2026

Juanma aprobó la revisión de la preview corregida y pidió fusionar, revisar y actualizar documentación. La [PR #34](https://github.com/Juanmaes83/floorplan-3d/pull/34) figura MERGED.

| Dato | Resultado comprobado |
| --- | --- |
| Base antes del merge | `88aef0bfeea8abb67865c3d2a33a484c909511ea` |
| HEAD aprobado | `5f0ae7200c206fec2ad22ada8b5be3ae17ebd5f0` |
| Merge en master | `92a1193fc1386d3f69566beab15923cc62836222` |
| Árbol de archivos probado y fusionado | `b7578ecea42c07112e2c4c8dde1243f059490a7e`; igualdad exacta |
| Check goals-and-editor | completed / success |
| Check Vercel Preview Comments | completed / success |
| Status Vercel | success |
| Producción automática del merge | READY, `dpl_8kp858e4QmFkkhZ2Epy7xW2gBHRu`, SHA igual al merge |

## Alcance integrado

Bienvenida, ejemplo identificado y copia propia, objetivos, cinco etapas, buscador de intenciones local, requisitos accionables, progreso verificable, ayuda contextual, persistencia separada del documento y accesibilidad ES/EN/ZH. Incluye la corrección de navegación: Inicio visible en móvil, Paso anterior, tareas elegidas para revisar, Atrás/Adelante, retorno desde primera estancia y respeto de la pantalla elegida durante una importación.

URL base → bienvenida con posibilidad de continuar; recargar `#editor` → trabajo en curso. Volver no borra el documento. Guardado local por navegador/origen; para mover datos entre previews o dispositivos se necesita JSON/ZIP. No cambia el schema ni la compatibilidad de archivos.

## Evidencia y límites

- [QA integral](guided-experience-2026-10-13.md): motor de objetivos 14/14 y pruebas de lógica/editor 162 aprobadas, 1 omitida por dependencia de Blender.
- [QA de navegación](guide-navigation-2026-10-13.md): 4/4. Regresión de recorridos guiados 5/5; tamaños 1440×900, 390×844 y 844×390.
- La revisión previa de la implementación inicial incluyó schema Python 11/11 y regresiones de dimensiones/capturas 3D. No se volvió a ejecutar toda la suite histórica para un merge cuyo árbol es idéntico al probado.
- Móvil emulado y 3D local con SwiftShader. El navegador remoto sin WebGL permitió comprobar el retorno y el fallback; no sustituye pruebas de GPU o móviles físicos.
- [Preview exacta del HEAD aprobado](https://floorplan-3d-56u9qd7dn-juanma-espinosas-projects.vercel.app/): READY, revisada antes de la aprobación; requiere autorización Vercel. No se registran enlaces temporales con token.
- [Sitio de producción](https://floorplan-3d-alpha.vercel.app/) asignado por Vercel al despliegue automático del merge. El estado READY y su SHA se comprobaron mediante metadata de Vercel; no se declara una nueva revisión visual completa de producción.

La actualización de cierre modifica solo Markdown. PR #33 sigue abierta: su flujo visible de imagen ya se conserva en #34; no se ha fusionado de nuevo ni cerrado. PR #23 se comprobó MERGED (`c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3`), corrigiendo las menciones documentales que aún remitían su cierre a una comprobación futura.

F2 continúa experimental y no validada. Siguen pendientes cinco sesiones manuales y veinte planos de evaluación con referencias, además de la escala física de los modelos y el rendimiento en móviles reales. Esta entrega no acredita esos resultados ni aprueba otras fases. No se realizó promoción manual a producción.
