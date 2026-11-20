# Coordinación OP‑07 v3, A0 y Simulator E · 20/11/2026

Master verificado `adb86034d76e7ddd2033fcadf571a4358c5d25e0` con OP‑10. [Laboratorio OP‑07](https://github.com/Juanmaes83/floorplan-3d/commit/5994cb71daf826d05a761c6670f64eff9457e6dc), [serie v3](https://github.com/Juanmaes83/floorplan-3d/commit/3833838e2525a43f753bbb2907cded0c98cd0f41) y [delta Blender](https://github.com/Juanmaes83/floorplan-3d/commit/972ac0b9106a314d62c0ee24dbb7bdf59d433373).

## A0 · entrega de traza a Claude

[#273](https://github.com/Juanmaes83/floorplan-3d/pull/273) conserva `112eaf520157fb3f25a227b3c25fc48041220019`, árbol `40bd2d269450b5e12ea8dc0401299d504ce40aad`. Se usaron perfiles persistentes nuevos en Windows con Playwright 1.63.0, ambos orígenes y solo proyectos sintéticos. Se conservaron las aserciones. El arnés adapta el navegador del kit e inyecta el trazador exacto antes de navegar. Blob Git del trazador `398fb5ce4f37ccbcd46c0d4c03750f51a152f9b9` de `5994cb71`.

| Comparación | Resultado |
|---|---|
| WebKit persistente con traza, `112eaf52` | 19/19. Los 13 residuales y R1-T02/T02b/T04 en ambos orígenes. |
| WebKit persistente sin traza, `112eaf52` | 19/19 con las mismas aserciones. |
| WebKit móvil emulado 390×844 con traza, `112eaf52` | 6/6 de R1-T02/T02b/T04 en ambos orígenes. |
| Firefox persistente con traza, `112eaf52` | 19/19. |
| WebKit persistente histórico `8a2730ee` | 6/6 con traza y 3/3 sin traza del origen F0.2b, perfiles nuevos. |

Sin error ResizeObserver ni cambios síncronos de tamaño observados en las ejecuciones trazadas. El [fallo anterior](https://github.com/Juanmaes83/floorplan-3d/pull/273#issuecomment-7021022541) no se reprodujo, tampoco en el control histórico. Estas ejecuciones acotan el entorno y no identifican el callback causal. Se archivan 12 trazas completas de las tres rutas relevantes con F0.2b activo, el [resumen por caso y SHA-256](trazas-resumen.json) y el [arnés](a0-run.cjs). Ejecutar con `A0_ROOT` apuntando al checkout exacto, `A0_TRACE_OUT` a un directorio con el trazador y Playwright 1.63.0 en la resolución de Node: `node a0-run.cjs webkit a0-browser-residuals.browser.test.cjs a0-writer-fence.browser.test.cjs`. `A0_TRACED=0` conserva las aserciones sin inyección. La auditoría física sigue pendiente. A0 y #274–#279 permanecen congeladas.

Al simular A0 con master actual, Git detectó conflicto en `tests/regression-partitions.json`. Resolver el registro de cobertura de ambos lados solo al preparar un candidato autorizado. Mantener el gate de convivencia de escritores previo a cualquier activación.

## OP‑07 S7 · NO-GO de integración y activación

- **Intención entre proyectos.** Un enderezado explícito en el proyecto A permitió borrar sin intención la curva en B, con ID de muro repetido. Validar B por separado rechaza `curve-lost`. Componer las intenciones actuales y validar la biblioteca acepta ambos. [Sonda](s7-intentions.cjs) · [Salida](s7-intentions.json).
- **Intención en el tiempo.** Enderezar, deshacer antes de confirmar y luego perder genéricamente la curva también pasa el gate. La intención antigua sobrevive a la restauración. Asociar cada permiso a proyecto y revisión de origen y cancelar el permiso cuando se revierte su paso. Añadir negativos con variantes, plantas, cambio de proyecto, lotes, conflicto y guardado concurrente. Una restauración explícita puede llevar su propio diff, con las mismas validaciones y barreras de escritor.
- **Gate efectivo 2.0.** En el editor del origen normal, «Forma del muro» guardó una pendiente de 2300 mm como 2.0.0 en localStorage con F0.2b y A0 ausentes. Una edición genérica quitó el atributo y también lo guardó. La puerta S7 se instala solo en la sesión F0.2b y el panel puede crear 2.0 en el origen normal. El test necesita demostrar que con gate apagado ninguna ruta crea o confirma 2.0, incluidos panel, arrastre, importación y restauración. Con gate encendido, demostrar que todos los escritores quedan protegidos y los antiguos fallan cerrado. [Sonda de navegador](s7-activation.cjs) · [Salida](s7-activation.json).
- **Compatibilidad del lector anterior.** Los módulos v1 del master efectivo rechazan el 2.0 sintético, dejan la colección idéntica y registran cero escrituras. Esto acredita lectura, no una pestaña v1 ya abierta; esa convivencia depende de A0. [Salida](s7-legacy-reader.json).
- **Edición visual.** En Chromium Windows, `op07-s5b-edit-ui.browser.test.cjs` dejó el control de curva al volver al punto inicial (`enderezado`), reproducido con contexto normal y persistente. Reportar como residual dirigido en la próxima candidata. Firefox, WebKit y dispositivos de OP‑07 se acreditarán sobre la candidata actualizada.
- **Blender.** Considerar únicamente los tres archivos propios de `972ac0b9` sobre OP‑10 efectivo. Su validación de laboratorio corresponde a la base indicada en el handoff de Claude. No trasladar el merge histórico completo.

## DXF de planta activa · residual independiente

El [handoff de Claude](https://github.com/Juanmaes83/floorplan-3d/blob/5994cb71daf826d05a761c6670f64eff9457e6dc/labs/sculpt/op-07/HANDOFF.md) registró en SMART `bf131c30` que la prueba `G-02 downloads only the active building level` fallaba en el sufijo del nombre. La misma prueba dirigida en Chromium Windows pasó 1/1 sobre `adb86034`. Conservar el contraste por SHA y entorno. Quedan por comparar los nombres en el entorno afectado y la aceptación en dos CAD comerciales.

## Simulator E · #291

[#291](https://github.com/Juanmaes83/floorplan-3d/pull/291) publica el HEAD autorizado `a5d4ccdef8b7be45fb1e456126fe3145009d7e19`. El objeto GitHub `c4633dbbb70062d7aae213f8f41d4d695588abe7` confirma los padres y el árbol `dec6d20694e083cb615f42eae60bb74fd3209523`. Ocho pruebas dirigidas pasan. Siete archivos, exclusivamente QA.

[Observe](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44723866079/job/136246251958) y su gate fallan por la misma causa. El verificador lee el HEAD anterior a OP‑10, donde falta `.github/workflows/op10-blender-scene.yml`. El árbol efectivo sí lo conserva. Se preparó localmente `aa4641b69d68864b344425902873b3fa16129f76`, con padres HEAD original y master `adb86034`. Conserva el mismo árbol, los siete archivos y la ascendencia original. El verificador estricto confirma [43 contratos](simulator-e-contracts.json), incluidos los 42 originales y el de Blender. Publicación y fusión pendientes de autorización por el nuevo HEAD. D mantiene autorización propia y gate WebKit. C/A conservan aceptación visual pendiente.
