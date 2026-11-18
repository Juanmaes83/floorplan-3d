# 20 · Aceptación de la candidata conjunta (E2 + H01 + H02 + programa)

Responsable de esta hoja: Claude Code (Studio Presentation). Asset Lab, MCP, UX y beta IA son de Codex (handoff en #259).

## Candidata

| Campo | Valor |
|---|---|
| PR | #259 (`codex/candidata-conjunta`, borrador) |
| SHA | `26c0dbdef94676c188360c4e8869b05c16c3dc23` |
| Base | `master@7dccf7a6095e6700b2a6b81161f4172b53c340fb` |
| Orígenes | #251@`a9a92996` (E2), #252@`75c47928` (H01), #253@`b74dab7f` (H02), #254, #255, #257, #258 |
| Preview fija (inmutable, no es Production) | https://floorplan-3d-huv9ak7qq-juanma-espinosas-projects.vercel.app (`dpl_EXDRjpKGyx6WzxAs5YWgftcdzzH8`) |
| Production | Sin cambios. Sigue sirviendo `8525025`. |

## Qué cambió en E2 desde la primera entrega

| Commit | Cambio | Prueba |
|---|---|---|
| `23c765d6` | «Verificar» muestra una sola línea de resumen (íntegro **y** vigente) y debajo los dos grupos | ux07-activation, ux07-integration-audit |
| `f7b937a3`, `210565b5`, `02b29780` | El asistente no inserta nada visible para el código de los diálogos: acceso encapsulado (shadow root cerrado) al final del diálogo y panel en su propio diálogo modal | browser.test (F2 raw export, room labels), assistant-gen, welcome-generar, E2 |
| `30abf6f4` | A26/H03: si lo guardado cambia **mientras** se genera un borrador o una orden de cambio, se descarta y no se puede descargar | E2 «A26/H03 · cambio de datos DURANTE…» (×2; fallan sin el arreglo) |
| `30abf6f4` | Marca: los borradores del comparador no llevan la marca, así que cambiarla no los desfasa | E2 «Marca · …» |
| `30abf6f4` | Límite de planificación RP14 documentado | `docs/product/e2-comparativas/RP14-limite-planificacion.md` |
| `a9a92996` (+ unificación de Codex `62155563`) | El acceso al asistente no flota sobre la presentación (no intercepta sus paradas) | presentation-*, ux-stability |

## Checklist de la revisión visual humana conjunta (una sola, en la Preview fija)

Datos: los del ejemplo («Probar el ejemplo») o un proyecto propio de prueba. No usar datos de clientes.

**Studio Presentation · E2**

- [ ] Entregar → «Comparar con el original»: sin variante, explica cómo crearla; con variante, abre el comparador.
- [ ] El comparador muestra «Se compara lo guardado en este navegador» y el límite de varias plantas.
- [ ] Economía: con presupuestos coherentes hay diferencia; con incoherentes o con uno solo, no aparece ninguna cifra de la otra revisión, ni en pantalla ni en el HTML descargado.
- [ ] Vigencia: con el comparador abierto, cambiar el nombre de la variante en otra pestaña. Aparece el aviso; «Preparar» y las descargas quedan bloqueadas; «Verificar» dice «íntegro, pero NO vigente».
- [ ] Orden de cambio: sin responsable o sin motivo no se prepara. Descargada, dice «Sin plazo», no lleva firma y no da por aceptada la conformidad.
- [ ] Asistente: visible en el editor; dentro de Presupuesto y de Territorio aparece «Asistente» abajo, sin tapar «Cerrar»; el panel se abre encima; Escape lo cierra sin cerrar el diálogo.
- [ ] Asistente en la presentación: no tapa los controles de las paradas.
- [ ] Móvil (390 px): nada desborda en horizontal en el comparador, en Territorio ni en Presupuesto.

**H01 / H02**

- [ ] Dossier del proyecto con presupuesto: el índice incluye la página económica (H01).
- [ ] Con una marca guardada, la cabecera del dossier económico muestra el nombre del estudio (H02).

**Programa (verificación de Codex, revisar en la misma pasada)**

- [ ] #257: «Guardar proyecto JSON» visible en la cabecera, también en móvil.
- [ ] #255: control «Detalle arquitectónico» con fachada y carpinterías; el proyecto no cambia al activarlo.
- [ ] #258: en la Preview, la IA real está desactivada; no se pide ninguna clave ni se cobra nada.
- [ ] #254: servidor MCP por stdio. Sin Preview web; su evidencia está en `tools/rubik-mcp/validation/real-beta01.md`.

## Evidencias

- CI de la candidata: check runs de `26c0dbde` en #259. A las 17:27 UTC, 69 terminados en verde, 0 fallos y el resto en curso. Este dictamen se cierra con el CI completo.
- E2 en local sobre `30abf6f4`: e2-comparativas 11/11, ux07-integration-audit 4/4, ux07-activation 6/6, ux07-ent04-budget 3/3, ux07-ent04-origin 4/4, núcleo 34/34.
- Capturas E2 previas: `labs/studio-presentation/evidence/e2/capturas/` (commit `2d49a254`). Muestran el asistente en su posición anterior: las sustituye la revisión visual en la Preview fija.
- Diagnóstico E2 y H01/H02: `evidence/e2/*.json`.

## Rollback

- Repositorio: revertir el commit de integración de #259 con master como primer padre.
- Por componente: revertir el merge del origen (#251, #252, #253…). E2.5 y el asistente no persisten datos; no hay migraciones.
- Production no se toca. La promoción se decide aparte.

## Dictamen

**GO técnico condicionado** para Studio Presentation (E2, H01, H02) en `26c0dbde`. Las condiciones son dos:

1. que el CI de `26c0dbde` termine sin fallos bloqueantes;
2. la revisión visual humana conjunta con esta checklist.

**NO-GO** para activar IA real (#258) y para Production: están fuera de esta integración. Beta 01 queda intacta. E3 no empieza hasta cerrar esta consolidación.
