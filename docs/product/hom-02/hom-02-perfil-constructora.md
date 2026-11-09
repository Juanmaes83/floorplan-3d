# HOM-02 — Sexto perfil: Constructora / jefe de obra

**Estado:** PR apilada sobre HOM-01 (#184), para revisión humana. No está fusionada ni desplegada.

## Decisión de identificador
Se usa **`construction`**, inglés en *kebab-case* como los otros cinco (`architecture`, `real-estate`, `developer`, `renovation`, `interior`). Los cinco identificadores anteriores **no cambian** y conservan su orden; el nuevo va el último. Una preferencia ya guardada con cualquiera de los cinco sigue siendo válida.

## Qué muestra
| Pieza | Contenido |
|---|---|
| Selector «¿En qué trabajas?» | «Constructora / jefe de obra» (ES), «Construction company / site manager» (EN), «施工单位 / 项目经理» (ZH) |
| Cabecera | «La obra planificada, explicada en 3D». La descripción termina con «**No sustituye el seguimiento real de la obra.**» |
| Para qué te sirve | «Mide y presupuesta, organiza el plan de obra con su Gantt y enseña al cliente la evolución prevista en 3D.» |
| Capacidades | **Plan de obra y Gantt** (abre Presupuestar) · **Evolución de obra en 3D (4D)** (abre Entregar) · **Mediciones y presupuesto** (Presupuestar) · **Viviendas de dos plantas** (Diseñar) |
| Tarjeta en «Soluciones» | La obra prevista, del presupuesto al plan y a su evolución en 3D |

Todas son capacidades de FT3D-8 ya en master. Cada una cita módulos y pruebas en `js/capability-registry.js`, por ejemplo `tests/m2-s4.browser.test.cjs` y `tests/ft3d-8-ux4d.browser.test.cjs`.

## Lo que no promete
- El plan y la evolución 4D se rotulan como **planificados y derivados del plan y de los datos disponibles**: «no registra el avance real ni datos de obra» y «no es el estado real de ejecución».
- No se anuncian seguimiento automático, certificaciones, sensores, mediciones certificadas ni control económico real. Una prueba lo comprueba.

## Pruebas
- `welcome-capabilities.browser`: nueva prueba que cubre el perfil, sus cuatro capacidades, los textos de límite, la ausencia de promesas falsas y que los accesos abren Presupuestar y Entregar.
- `professional-entry.browser`: la lista de perfiles pasa de 5 a **6** y las tarjetas de «Soluciones» de 5 a **6**. Es un cambio intencionado de HOM-02, documentado en la propia aserción.
- `capability-registry`: la sexta profesión tiene 3–4 capacidades válidas.

## Capturas (`capturas/`)
Escritorio (cabecera, selector y capacidades) y móvil (cabecera y capacidades).
