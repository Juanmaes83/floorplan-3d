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
