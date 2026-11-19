# F0.2b · Verificación del candidato aislado

Base `dd528119bdfd80733c4faf5bb56a594190fea5ac`, árbol `f62e9492de0ee616c8edd1966703238d57702a63`. Se conservó el mapa de `007fa8c` como evidencia histórica. El candidato desarrolla la conexión únicamente en `http://f0-2b.localhost:<puerto>`.

| Corte | Delta y dependencias | Evidencia |
|---|---|---|
| Autoridad y arranque | Reutiliza F0.2a y #264. Migración transaccional con y sin Web Locks, espejo separado de la confirmación, recuperación transaccional y exportación | Carreras de migración, recarga, error de apertura, cuota real, recuperación entre pestañas y permiso tras guardado explícito |
| Consumidores | Fachada de las cinco claves desde antes de cargar biblioteca. Variantes y Presupuestar comparten revisión. Estado pendiente durante el guardado. Cliente y demos quedan aislados | Editor real, variantes, presupuesto, BC3, observaciones y edificio en tres formatos de pantalla |
| Lecturas y traspasos | Comparar lee sin migración ni escritura. Evolución embebida registra a través del editor. Evolución independiente usa su propia sesión | E2, generación concurrente, traspasos, reintento idempotente y renderer existente |
| Portabilidad | Se reutilizan F0.1, lectura validada y `contentId`. Las imágenes de un edificio se identifican por nivel e id exacto. Restauración mantiene el diario hasta confirmación | Dos perfiles, ids locales distintos, imágenes con ids parcialmente coincidentes, presupuesto, observación y conflicto después de preparar imágenes |
| Revisión E3 | Laboratorio `8c53263423359e4fa71fc25494c7a3b6ee1f7fd1`, árbol `1bbe949e09eb056ce483a00993b4b8aa8d35fc2f`. Reutiliza evidencia 117/117 y 11/11 | La [matriz y el contrato](../contracts/persistencia-v1.md#8-consumidores-de-f02b) delimitan revisión local, identidad portable y vigencia de entrega |

## Pruebas dirigidas

Chromium en Windows cubrió persistencia, expediente, E2, variantes, presupuestos, observaciones y edificios. Firefox de Playwright cubrió migración concurrente, lectura sin migración, aislamiento y portabilidad. WebKit de Playwright cubrió esos escenarios y el flujo del editor. WebKit en Windows rechaza la escritura Blob de IndexedDB en su contexto temporal incluso mediante una llamada mínima a IndexedDB. La prueba de portabilidad usa perfiles en disco, donde la misma operación funciona. La cuota real se comprobó en Chromium con un perfil en disco.

Para el corte portable en Firefox o WebKit, establecer `F0_BROWSER` y ejecutar `node --test --test-name-pattern="F0.2b portable building" tests/persistence.browser.test.cjs` con el motor instalado. Safari en equipos Apple, iOS, Android físico y desalojo por el navegador quedan en F0.3.

## Convivencia con los otros cortes

- #266 `edfbf66beb93d2943d3421a2ab35a13299a5c9dc` sobre el master consolidado produce el árbol `0ff75783bd0bbe16a200ead239989938644d6c50`. Coincide con el ensayo acreditado `59f3783` y conserva su delta.
- #268 `d8ca06dadf6de4c121c8f499a89d0c405a67cc60` sobre master produce `604cdf4593aacfd90d826be0f7a3f0c98a8bbdf3`. Tras #266 se conserva el mismo delta y el árbol pasa a `d5978840bea9b652f4e6d9fb04cfac47675736bf`.
- OP-05 `a722f9d`, OP-07 #267 y E3 permanecen congelados. Las dependencias de GLB privados, adjuntos, historial y E3 productivo pertenecen a cortes posteriores.

**GO técnico para revisión de la rama aislada.** La integración y activación pública requieren gates separados. Consultar el [procedimiento de rollback](../contracts/persistencia-v1.md#rollback) antes de volver a una versión que lea la copia de compatibilidad.

## Corrección del arranque de R03 en #269

En `6edb0d6a`, el manifiesto I1 esperaba ocho scripts desde el inicio del bloque R03 hasta el final de la página. El bootstrap situado tras la plantilla aumentaba ese recuento a nueve. Los ocho jobs fallidos observados en ese SHA reproducen la misma aserción. En Asistente IA V2 y QA Integrada, la ausencia de artefactos siguió a la interrupción del job. [Checks del candidato anterior](https://github.com/Juanmaes83/floorplan-3d/commit/6edb0d6a5d498df24e053379bd948643ea643e2a/checks)

El bootstrap se declara con `defer` antes de la plantilla. Se ejecuta con la plantilla ya analizada y R03 conserva el bloque final, su orden y sus hooks. El gate, el manifiesto, los módulos R02/R03 y los laboratorios quedan intactos.

Verificación dirigida en Chromium, servidor local y Three del repositorio. Pasaron 24 casos de contrato y auditoría R02/R03, 21 de persistencia, 2 de R03 real y coexistencia, 2 de NAV3D y Presentación con WebGL y 6 de vista previa de cliente y demos. Las pruebas de arranque distinguen el origen normal, el origen F0.2b y las rutas aisladas. El corte continúa desactivado para usuarios reales.

Firefox mantenía como activa la animación CSS de un menú cerrado en el fixture de persistencia. Ese caso usa la preferencia de movimiento reducido y conserva las aserciones de guardado, descarga y recuperación. El arranque aislado pasó también en Firefox y WebKit automatizados.

## Diagnóstico de CI en 79cd98f6

- **Persistencia.** Reproducción local en Ubuntu 24.04 con Node 22.13.0, Playwright 1.62.1 y Chromium 151. La prueba completó las descargas, confirmó la revisión 2, conservó el conflicto y leyó la revisión 3 recuperada. El cierre del contexto ocurrió mientras la recarga seguía arrancando. El protocolo registró `Target.disposeBrowserContext` sin respuesta y el caso alcanzó 120 s. La comprobación anterior podía observar el proyecto recuperado y la revisión 3 en el documento saliente. Ahora la prueba espera la navegación del marco principal y el indicador de arranque del documento nuevo antes de verificar los mismos datos. Conserva el timeout y las aserciones existentes, y emite diagnósticos por fase. Pasaron los 21 casos de persistencia en Linux y tres repeticiones dirigidas del caso afectado. El cierre del contexto tomó entre 15 y 17 ms en esas repeticiones. [Job de persistencia](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358160/job/135401024290)
- **Project-First.** Los cuatro perfiles A1 fallaron buscando «Presupuesto: sin preparar» en Entregar. El arranque diferido hacía que el dossier intentase instalar el observador antes de que existiera el panel profesional. El panel registra el observador en su propio montaje y conserva el cálculo del dossier. La prueba de Project-First queda intacta. [Job de Project-First](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358373/job/135401125375)
- **FT3D-8 E2, exam-novice.** Plan de obra invocaba `app.persistence.requireSaved()` sin importar la referencia local a `FloorPlanApp`. El repro en la interfaz mostró `app is not defined` al guardar y dejaba el diálogo con cambios pendientes. Eso bloqueaba los pasos posteriores del examen y dejaba escenarios de Evolución sin el plan esperado. El módulo toma el mismo `FloorPlanApp` que el resto de consumidores. Con el cambio, la misma interacción muestra «Plan guardado» y V4 y V5 pasan en escritorio y móvil. [Job exam-novice](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44477358321/job/135403101873)

Verificación local conjunta en Linux: 7/7 Project-First y dossier económico, más el control de Entregar en el origen F0.2b. El examen FT3D-8 pasó 20/20, V4 pasó 2/2 y V5 pasó 2/2. El arreglo de persistencia se verificó además en Chromium de Windows.
