# C4 — Contrato de producto y arquitectura para el dossier económico

**Fecha:** 31-10-2026  
**Estado:** especificado / listo para implementación  
**Bloque:** Fase C — C4  
**Principio:** C4 presenta y entrega la autoridad económica ya existente. No crea una segunda autoridad de cantidades, precios, IVA ni totales.

---

## 1. Objetivo

Cerrar la Fase C con una entrega económica profesional que conecte de forma trazable:

```text
geometría del proyecto
→ C1 cantidades
→ C2 partidas / precios / revisión / IVA
→ C3 referencias / BC3 / procedencia
→ C4 dossier económico / entrega
```

C4 debe permitir que un profesional entregue a cliente o conserve para revisión interna un documento económico comprensible, verificable y honesto sobre lo que Rubik sabe y lo que todavía no sabe.

Regla de producto:

> más contexto, no más falsa certeza.

Regla aditiva:

> Todo lo nuevo se suma. Nada de lo existente se elimina sin una decisión expresa de Juanma.

---

## 2. Autoridades que C4 DEBE reutilizar

### C1 — cantidades

Autoridades existentes:

- `js/quantity-core.js`
- `js/quantity-schedule-core.js`
- referencias de cantidad ya transportadas al presupuesto.

C4 no mide geometría y no calcula cantidades.

Debe mostrar, cuando estén presentes en el modelo económico:

- valor de cantidad;
- unidad;
- estado `measured`, `estimated` o `unavailable`;
- completitud de cantidad;
- contexto trazable `room`, `level` o `home` cuando exista;
- procedencia de cantidad (`quantity-engine` o manual).

### C2 — presupuesto

Autoridades existentes:

- `js/budget-core.js`
- `js/budget-draft-core.js`
- `js/budget-presentation.js`
- UI existente de presupuesto.

**Fuente canónica de C4:** `FloorPlanBudgetPresentation.buildReport(budget)`.

C4 no debe recalcular:

- merma;
- cantidad presupuestaria;
- subtotales de partida;
- subtotales de capítulo;
- IVA;
- total neto;
- total bruto;
- completitud;
- estado de revisión.

Todos esos valores proceden del report canónico derivado de `FloorPlanBudget.calculateBudget()`.

### C3 — referencia / BC3 / procedencia

Autoridades existentes:

- `js/bc3-budget-core.js`
- `js/fiebdc3-codec.js`
- `js/provenance-core.js`
- `js/budget-cost-bridge.js`
- proveedores/cost quotes existentes.

C4 debe transportar, sin reinterpretar:

- origen del precio activo;
- referencia disponible;
- proveedor;
- código/item de referencia;
- fuente/edición/región/fecha cuando existan;
- attribution/licencia cuando existan;
- estado de revisión;
- BC3 como exportación interoperable existente, no como formato reimplementado por C4.

---

## 3. Ubicación en la experiencia profesional

### `PRESUPUESTAR`

Sigue siendo el lugar donde se:

- revisan cantidades;
- introducen/aplican precios;
- aplican referencias;
- configuran mermas;
- configuran IVA;
- marcan partidas como revisadas;
- importan/exportan referencias/BC3 según capacidades existentes.

C4 NO convierte `ENTREGAR` en un editor económico.

### `ENTREGAR`

Añadir una tarjeta nueva y aditiva:

**Dossier económico**

Estado de la tarjeta, derivado del report:

- total disponible y completo;
- o presupuesto incompleto con el número de incidencias relevantes;
- nunca un total definitivo cuando el report no lo permite.

Acción primaria:

**Preparar dossier económico**

Acción secundaria, si conviene al diseño existente:

**Revisar presupuesto** → vuelve al área `PRESUPUESTAR` existente.

La tarjeta debe convivir con:

- Dossier del proyecto A4;
- Presupuesto existente;
- Archivo para cliente;
- lámina;
- presentación;
- imágenes;
- observaciones;
- identidad profesional.

No sustituye ninguna de ellas.

---

## 4. Modelo de presentación C4

Crear una capa UI/presentación de sólo lectura que reciba el budget actual y construya su vista a partir de:

`FloorPlanBudgetPresentation.buildReport(budget)`

No debe leer geometría para recalcular economía.

No debe construir un shadow budget.

No debe persistir el report.

### Datos mínimos del report a utilizar

- `budgetId`
- `subject`
- `title`
- `currency`
- `taxRatePercent`
- `chapters`
- `unassigned`
- `contexts`
- `totals`
- `warnings`
- `lines`

---

## 5. Estados económicos visibles

No representar `revisado` como si fuera un origen de precio. Son dos dimensiones distintas.

### Origen del precio

1. **Sin precio**
   - `unitPrice === null`.
   - No existe subtotal económico completo para esa partida.

2. **Referencia**
   - precio activo con `priceSource.type === 'provider-reference'`.
   - mostrar referencia/proveedor y procedencia disponible.

3. **Propio**
   - precio activo con `priceSource.type === 'manual'`.
   - mostrar etiqueta/fecha de la fuente manual si existen.

### Estado de revisión

- **Pendiente de revisar**
- **Revisado**

Una partida puede, por tanto, mostrarse como:

- `Referencia · Pendiente de revisar`
- `Referencia · Revisado`
- `Propio · Pendiente de revisar`
- `Propio · Revisado`
- `Sin precio`

### Referencia conservada con precio propio activo

Si existe `priceReference` pero el precio activo es manual:

- el estado principal es **Propio**;
- la referencia se muestra aparte como **Referencia de contraste**;
- no afirmar que el precio activo procede de esa referencia.

---

## 6. IVA y certeza de totales

C4 debe obedecer exclusivamente la completitud que entrega el report.

### IVA definido

Si el report tiene impuesto completo:

- mostrar neto;
- IVA;
- total con IVA;
- indicar el tipo global cuando exista, o la realidad calculada por partida si el motor ya la representa.

### IVA no definido / incompleto

Si aparece `tax-incomplete` o `totals.tax.complete === false`:

- mostrar **IVA no definido / incompleto**;
- no presentar un total bruto como definitivo;
- puede mostrarse el importe conocido acompañado de estado **incompleto**, si el report lo proporciona;
- indicar qué partidas impiden completarlo cuando sea útil en versión profesional.

### IVA 0 %

Es un valor definido, no equivale a “sin IVA indicado”.

### Regla de certeza

Nunca transformar un total parcial en un total final mediante suma propia en C4.

---

## 7. Estructura del dossier económico

## 7.1 Portada / cabecera

- identidad profesional existente si está configurada;
- nombre del proyecto/sujeto;
- título del presupuesto;
- fecha de generación del documento como presentación, no como dato persistido del proyecto;
- variante: `Profesional` o `Cliente`.

## 7.2 Resumen económico

Mostrar:

- neto, sólo con su estado real de completitud;
- IVA, definido/incompleto;
- total bruto, sólo como definitivo si es completo;
- número de capítulos;
- número de partidas;
- partidas sin precio;
- partidas con cantidad no disponible/incompleta;
- precios pendientes de revisión;
- estado global de revisión (`reviewComplete`).

El resumen debe ser legible antes de entrar en el detalle.

## 7.3 Capítulos

Para cada capítulo del report:

- título;
- partidas;
- subtotal neto del capítulo según report;
- IVA/subtotal bruto según report cuando estén disponibles;
- estado de completitud;
- advertencia visual si contiene información económica incompleta.

## 7.4 Partidas

Versión profesional debe poder mostrar por partida:

- descripción;
- cantidad;
- unidad;
- estado de cantidad;
- merma;
- cantidad presupuestaria;
- precio unitario;
- origen del precio;
- estado de revisión;
- subtotal neto;
- IVA efectivo;
- subtotal bruto;
- contexto habitación/planta/vivienda cuando exista;
- referencia/procedencia cuando corresponda.

No se inventan valores vacíos: usar `No disponible`, `Sin precio`, `Pendiente` o equivalente explícito.

## 7.5 Partidas sin capítulo

`report.unassigned` debe aparecer como bloque explícito:

**Sin capítulo**

Nunca ocultarlas de los totales ni del dossier.

## 7.6 Fuentes y trazabilidad

Versión profesional debe incluir una sección de trazabilidad con:

- cantidades provenientes del proyecto vs manuales;
- precios propios vs referencias;
- referencias de contraste retenidas;
- proveedor/código cuando existan;
- fecha/edición/región de fuente cuando existan;
- attribution/licencia cuando existan;
- explicación de que Rubik no certifica el coste real.

## 7.7 Advertencias

Mapear directamente los warnings canónicos:

- `unpriced-items` → partidas sin precio;
- `unavailable-quantities` → cantidades no disponibles;
- `incomplete-quantities` → cantidades incompletas;
- `unreviewed-prices` → precios pendientes de revisión;
- `tax-incomplete` → IVA/total con impuestos incompleto.

No crear warnings económicos nuevos a partir de heurísticas si no están sustentados por datos canónicos.

---

## 8. Variante profesional

Objetivo: trazabilidad y revisión interna/entrega técnica.

Debe incluir:

- resumen completo;
- capítulos;
- partidas;
- origen de cantidades;
- origen de precios;
- referencias/proveedores;
- revisión;
- warnings;
- IVA/completitud;
- fuentes/licencias cuando existan;
- contexto por habitación/planta/vivienda;
- enlaces/acciones de exportación existentes apropiados.

Puede ser detallada.

---

## 9. Variante cliente

Objetivo: entender cuánto se ha presupuestado y con qué grado de certeza sin exponer ruido interno innecesario.

Debe incluir:

- cabecera/identidad;
- resumen económico;
- capítulos y sus importes;
- partidas sólo con el detalle útil para comprender la propuesta;
- IVA claramente indicado;
- advertencias relevantes para certeza: sin precio, cantidades incompletas, total incompleto;
- indicación clara cuando los importes sean orientativos;
- nota de que no constituye certificación del coste real.

No mostrar por defecto:

- metadatos técnicos de licencia;
- IDs internos de proveedor;
- IDs de presupuesto/partida;
- notas internas de revisión;
- detalles de implementación.

Una referencia comercial comprensible (nombre/fuente/fecha) puede mostrarse si aporta contexto, pero no debe confundirse con precio certificado.

---

## 10. Integración con el dossier A4 existente

C4 no reemplaza `FloorPlanDossier`.

### Integración mínima obligatoria

1. El dossier A4 deja de afirmar:
   `No incluye presupuesto: no disponible todavía en esta versión.`

2. Si existe un presupuesto/report disponible:
   - la sección `Fuentes y alcance` debe reconocer que existe información económica;
   - puede incluir un resumen económico compacto derivado del mismo report, sin recalcular.

3. Si no existe presupuesto:
   - el dossier A4 sigue siendo válido;
   - debe decir que no hay presupuesto preparado, no que la función no existe.

### Integración recomendada

Añadir sección opcional `economic` a los estilos donde aporte valor:

- `technical`: sí;
- `studio`: sí;
- `client`: resumen cliente, sí si hay presupuesto;
- `realestate`: no obligatoria para C4; sólo si el producto lo justifica sin ruido.

La sección utiliza la misma capa de presentación C4, no una segunda implementación.

---

## 11. Integración con Archivo para cliente B1

B1 reutiliza la composición del dossier existente.

Si la variante cliente del dossier incluye resumen económico:

- B1 puede heredarlo mediante la composición existente;
- no crear otro exportador económico dentro de B1;
- debe seguir siendo autocontenido/offline según el contrato actual de B1;
- no incluir información interna/profesional que la variante cliente haya ocultado.

Si la integración B1 requiere un cambio grande o rompe su contrato offline, dejarlo fuera de C4 mínimo y documentarlo como integración posterior; no bloquear C4 por una duplicación innecesaria.

---

## 12. Exportaciones C4

### Obligatorio

1. **Imprimir / Guardar PDF**
   - seguir el patrón del dossier existente;
   - documento imprimible con estilos propios;
   - no depender de servidor;
   - no mutar proyecto/presupuesto.

2. **CSV económico**
   - reutilizar `FloorPlanBudgetPresentation.toCsv()`;
   - no implementar un CSV paralelo.

3. **JSON del report**
   - reutilizar `FloorPlanBudgetPresentation.serializeReport()` si se expone desde UI;
   - útil como salida técnica/profesional.

4. **BC3**
   - enlazar/reutilizar exportación C3 existente;
   - C4 no genera un segundo BC3.

### Regla

Cada botón debe invocar la autoridad exportadora ya existente siempre que exista.

---

## 13. Persistencia: prohibiciones

C4 NO debe persistir:

- una copia del report;
- subtotales o totales derivados;
- un segundo presupuesto;
- estados de certeza duplicados;
- referencias copiadas fuera del budget;
- fecha de generación del dossier dentro del modelo del proyecto;
- HTML/PDF generado dentro del proyecto;
- selección de variante del dossier si no existe ya una preferencia equivalente aprobada;
- geometría o mediciones nuevas.

C4 puede mantener estado efímero de UI durante la sesión.

La persistencia económica sigue perteneciendo únicamente a C1/C2/C3 y sus contratos existentes.

---

## 14. Casos límite obligatorios

1. presupuesto inexistente;
2. presupuesto vacío;
3. todas las partidas sin precio;
4. una o más cantidades `unavailable`;
5. cantidades `complete:false`;
6. precio explícito `0` — debe mostrarse como cero, nunca como sin precio;
7. precio propio activo sin referencia;
8. referencia activa;
9. referencia conservada + precio propio activo;
10. mezcla de precios propios y referencias;
11. precios sin revisar;
12. precios revisados;
13. revisión invalidada por cambio de cantidad — debe reaparecer como pendiente según C2;
14. IVA `null`;
15. IVA `0`;
16. IVA definido >0;
17. capítulo completo;
18. capítulo incompleto;
19. partidas sin capítulo;
20. contexto habitación/planta/vivienda;
21. cantidad manual sin contexto — no inventar habitación/planta;
22. sujeto `project`;
23. sujeto `building`;
24. sin identidad profesional;
25. con identidad profesional;
26. escritorio;
27. móvil;
28. ventana de impresión bloqueada;
29. dossier abierto y cerrado sin mutación del proyecto/presupuesto;
30. exportaciones deterministas para el mismo budget.

---

## 15. Criterios de aceptación

C4 se considera funcionalmente correcto cuando:

1. Existe `Dossier económico` en `ENTREGAR` sin eliminar ninguna tarjeta existente.
2. La edición económica sigue ocurriendo en `PRESUPUESTAR`.
3. El dossier obtiene todos los cálculos de `FloorPlanBudgetPresentation.buildReport()`.
4. No existen fórmulas paralelas de subtotales/totales/IVA en la UI C4.
5. Capítulos, partidas y `Sin capítulo` coinciden exactamente con el report.
6. `Sin precio / Referencia / Propio` se distinguen correctamente.
7. `Revisado` se trata como dimensión independiente del origen del precio.
8. Referencia conservada + precio propio no se confunden.
9. IVA `null` nunca se presenta como 0 %.
10. Un total incompleto nunca se presenta como definitivo.
11. Los cinco warnings canónicos tienen representación comprensible.
12. Variante profesional y cliente difieren en profundidad, no en cifras.
13. El dossier existente A4 deja de decir que presupuesto “no está disponible todavía”.
14. La integración A4 reutiliza la misma presentación económica.
15. PDF/impresión, CSV, JSON y BC3 reutilizan autoridades existentes.
16. C4 no añade schema ni persistencia económica nueva.
17. Abrir/exportar/cerrar no modifica proyecto ni budget.
18. Funciona en escritorio y móvil sin overflow horizontal.
19. Accesibilidad: diálogo correctamente etiquetado, teclado/foco y estados legibles.
20. No rompe A4, B1, C1, C2, C3, Point9 ni Presentation/FT3D.

---

## 16. Pruebas mínimas

### Unitarias

Añadir pruebas para la capa C4 pura/presentación, sin navegador, que verifiquen:

- mapeo de estados de precio;
- estado de revisión independiente;
- resumen completo/incompleto;
- IVA null vs 0;
- warnings;
- capítulos y unassigned;
- profesional vs cliente usan exactamente los mismos importes;
- referencia conservada con precio propio;
- cero explícito;
- función pura/no mutación.

### Browser

Añadir smoke dedicado C4 en desktop y móvil:

- abrir `ENTREGAR`;
- tarjeta `Dossier económico`;
- abrir profesional;
- cambiar a cliente;
- comprobar totals/warnings;
- comprobar caso sin IVA;
- comprobar precio referencia/propio/revisado;
- abrir ventana de impresión y confirmar mismo contenido económico;
- descargar/activar exportaciones donde puedan comprobarse sin introducir servicios externos;
- cerrar y comprobar retorno de foco;
- verificar que proyecto/budget no se modificaron;
- sin page errors ni peticiones externas inesperadas.

### Regresión

Ejecutar como mínimo:

- budget core;
- budget presentation;
- BC3/provenance;
- project dossier A4;
- professional workspace;
- client file B1;
- Project-First;
- CI integrado relevante.

Un fallo conocido de infraestructura/baseline debe compararse con `master` antes de modificar producto.

---

## 17. Diseño de archivos esperado

La implementación puede adaptar nombres al patrón del repo, pero debe preferir separación clara:

- `js/economic-dossier-core.js` o equivalente puro de mapeo de `buildReport` → view model;
- `js/economic-dossier-ui.js` para diálogo/render/export;
- `css/economic-dossier.css`;
- integración mínima en `professional-workspace-ui.js`;
- integración mínima y reusable en `project-dossier-ui.js`;
- tests unitarios/browser dedicados.

No mover ni reescribir C1/C2/C3 salvo adaptación mínima necesaria y justificada.

---

## 18. Definición de DONE

C4 está DONE cuando se cumplen simultáneamente:

- implementación en rama dedicada;
- tests locales verdes o cualquier baseline documentado/reproducido en master;
- capturas desktop/móvil;
- vídeo o recorrido visual breve de `ENTREGAR → Dossier económico → Profesional/Cliente → impresión`;
- revisión de no mutación;
- CI remoto verde;
- integración en master;
- documentación/matriz actualizadas;
- Fase C marcada **4/4**;
- no queda una segunda autoridad económica ni deuda funcional creada por el corte.

---

## 19. Fuera de alcance de C4

- modificar el motor de cantidades C1;
- crear un nuevo motor de presupuesto;
- scraping o adquisición automática de precios;
- nuevas fuentes comerciales;
- cambiar BC3/FIEBDC;
- pagos/facturación;
- firma digital certificada;
- contabilidad;
- financiación/ROI/promoción inmobiliaria;
- sincronización cloud del presupuesto;
- portal cliente nuevo;
- FT3D-3 o posteriores.

Estas capacidades requieren decisiones separadas y no bloquean el cierre de C4.

---

## 20. Instrucción de implementación

Claude debe implementar **exactamente este contrato**, con cambios mínimos y aditivos, ejecutar QA, producir capturas/vídeo, hacer push a la rama autorizada y pausar.

Claude no debe rediseñar C1/C2/C3, ampliar el alcance ni iniciar la siguiente fase.
