# Rubik — cláusulas de protección del servicio, ingeniería inversa y extracción

**Estado:** `DRAFT_LEGAL_REVIEW — NOT_EFFECTIVE — MERGE_NOT_AUTHORIZED`  
**Fecha de propuesta:** 2026-11-03  
**Ámbito propuesto:** condiciones de uso del servicio SaaS / API Rubik, preferentemente contratos B2B.  
**Autoridad:** borrador de protección comercial y técnica, **no** nuevo contrato del modelo `FloorPlanProjectV1`, ni modificación del software.  
**Rama de trabajo:** `docs/legal-rubik-proteccion-extraccion-2026-11-03`.

> **Importante:** este documento no constituye todavía términos aceptados por los clientes ni crea por sí mismo obligaciones frente a terceros. Requiere revisión jurídica, identificación del prestador y de la modalidad de contratación, publicación de una versión completa y mecanismo válido de incorporación/aceptación. No sustituye licencias de componentes de terceros ni los derechos legales imperativos.

## A. Texto propuesto para los futuros Términos de Uso de Rubik

### 1. Propiedad intelectual, acceso y licencia limitada

Salvo indicación expresa en contrario, el acceso a Rubik únicamente concede al usuario el derecho de utilizar las funcionalidades contratadas conforme a las condiciones aplicables. El código fuente y objeto, el diseño original del servicio, sus interfaces, documentación, bases de datos, marcas, recursos gráficos, modelos y demás elementos protegidos pertenecen a sus respectivos titulares y están sujetos a los derechos y licencias correspondientes. No se transfiere titularidad por el mero acceso.

Los contenidos, documentos y proyectos aportados por cada cliente seguirán rigiéndose por sus propios derechos y por los acuerdos de tratamiento y uso aplicables; esta cláusula no supone que Rubik adquiera su titularidad.

### 2. Ingeniería inversa y acceso a componentes no públicos

En la medida permitida por la normativa aplicable y salvo autorización previa y escrita del titular correspondiente, queda prohibido descompilar, desensamblar o realizar otras operaciones destinadas a obtener o reconstruir código fuente no publicado, componentes internos no accesibles legítimamente, modelos o pesos propietarios, secretos empresariales, claves, reglas internas o algoritmos protegidos del servicio.

También se prohíbe eludir controles de acceso, licencias, cuotas, protecciones técnicas o medidas destinadas a impedir accesos no autorizados.

Esta prohibición **no** limita los derechos legales imperativos de observación, estudio o prueba del programa ni los supuestos legalmente permitidos de descompilación para interoperabilidad, así como otros derechos que no puedan excluirse contractualmente.

### 3. Extracción automatizada y reutilización no autorizadas

Sin autorización escrita o licencia aplicable, no se permite emplear bots, crawlers, scrapers, capturadores o procesos automatizados para extraer masivamente o reproducir de forma sustancial código, materiales, activos, resultados, bases de datos protegidas, recursos internos o información no pública de Rubik; tampoco acceder a endpoints no documentados o protegidos eludiendo controles, límites o permisos.

Los accesos automáticos autorizados —por ejemplo, mediante API documentada y credenciales válidas— deberán respetar su finalidad, alcance, límites de uso, privacidad, seguridad y condiciones de licencia.

La prohibición no alcanza a los datos propios del cliente ni a actos legalmente permitidos, ni restringe derechos inderogables de acceso, portabilidad o interoperabilidad.

### 4. Uso del servicio para replicación competitiva no autorizada

No está permitido utilizar accesos, credenciales, materiales protegidos, activos propietarios o información confidencial obtenidos a través de Rubik para copiar, reproducir o explotar sin autorización elementos protegidos del servicio, ni para construir o comercializar un producto sustancialmente equivalente **mediante ese uso no autorizado**.

Esta restricción **no es una prohibición general de competir**: no impide desarrollar de forma independiente software o servicios competidores usando conocimientos propios, estándares públicos, información adquirida lícitamente o derechos reconocidos por la ley. Las ideas y principios no protegidos no pasan a ser propiedad exclusiva de Rubik por esta cláusula.

### 5. Investigación, interoperabilidad y derechos legales

Nada de estas condiciones pretende excluir, reducir o sancionar derechos que la legislación aplicable reconozca de modo imperativo, incluidos los recogidos, según corresponda, en los artículos 5.2, 5.3, 6 y 8 de la **Directiva 2009/24/CE** y en el artículo 100 del **Texto Refundido de la Ley de Propiedad Intelectual española**. Las disposiciones de este apartado prevalecen ante cualquier interpretación más amplia de las prohibiciones anteriores.

Rubik podrá ofrecer canales de contacto para consultas de interoperabilidad, seguridad responsable, uso de API o solicitud de autorización, sin convertir la petición de permiso en condición de ejercicio de derechos legalmente reconocidos.

### 6. Incumplimientos y medidas proporcionadas

Cuando existan indicios razonables de uso contrario a estas condiciones, Rubik podrá aplicar medidas proporcionadas previstas en los contratos y la normativa aplicable, como requerir el cese, restringir accesos abusivos o adoptar acciones legales procedentes. Estas medidas deberán respetar las garantías contractuales, derechos de los afectados, legislación de consumo si aplica y normativa de privacidad.

## B. Condiciones para convertir el borrador en términos vinculantes

1. **Revisión jurídica España/UE.** Confirmar redacción, derechos de interoperabilidad y uso legítimo, secretos empresariales, licencias, consumidores/B2B y aplicabilidad de cláusulas de no competencia. No usar prohibiciones absolutas que contradigan derechos imperativos.
2. **Identidad del prestador y alcance.** Identificar titular contractual, web y servicios cubiertos (SaaS, cuentas B2B, API y despliegues a medida). Distinguir términos del **servicio alojado** y licencias del **código público**: una cláusula SaaS no modifica ni revoca por sí misma permisos ya concedidos por licencias de software.
3. **Contrato íntegro.** Integrar la cláusula en términos completos con vigencia, jurisdicción, suspensión, protección de datos, privacidad, condiciones comerciales y mecanismo demostrable de aceptación; no activarla unilateralmente desde este documento.
4. **No restringir contenido propio del cliente.** Garantizar exportación y tratamiento conforme a contratos y normas aplicables.
5. **No modificar el núcleo Rubik.** `FloorPlanProjectV1`, catálogo F3, SurfaceRenderer, VQ-01, master y Hybrid no cambian por esta propuesta.
6. **Seguridad de producto, por otra vía.** Si más adelante se desean cuotas API, protección de tokens, observabilidad o antiabuso, definirlos como contratos técnicos específicos con pruebas y privacidad. Los términos por sí solos no sustituyen los controles técnicos.
7. **Aprobación de negocio y asesoría jurídica.** Sólo tras revisión explícita podrá marcarse como `APPROVED_FOR_PUBLICATION` y proponerse la publicación de términos.

## C. Base legal para la revisión

- **Directiva 2009/24/CE:** https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009L0024 — en especial los artículos 5, 6 y 8.
- **Texto Refundido de la Ley de Propiedad Intelectual (España):** https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930 — especialmente los artículos 95-100.
- **REA, declaración responsable (referencia de límites, NO texto adoptado):** https://github.com/Juanmaes83/rea/blob/main/DISCLAIMER.md

## D. Historia y límites de alcance

- Origen: decisión de reforzar la protección jurídica de Rubik tras auditar los términos de un servicio competidor. El texto es **original** para Rubik; no es copia de los términos de Maket.
- **No autoriza ni incentiva extracción de terceros:** la política de Rubik para investigación externa sigue exigiendo cumplimiento de licencias, derechos y términos aplicables.
- **No es consejo jurídico definitivo ni garantía de exigibilidad.**
- **No se publicará como términos efectivos ni se hará merge automáticamente.**

## E. Decision record y punto de reanudación (2026-11-03)

**Decisión de producto del responsable:** `APPROVED_FOR_DURABLE_DOCUMENTATION`. Incorporar el objetivo de proteger a Rubik frente a ingeniería inversa no autorizada, extracción automatizada y replicación competitiva basada en apropiación de código, activos o información protegidos.

**Importante — separación de gates:**
- **Aprobado ahora:** guardar y mantener en el repositorio la propuesta legal, su alcance y los pendientes.
- **No aprobado todavía:** considerar esta redacción revisada por abogado, hacerla vinculante para clientes, publicarla como términos oficiales, activar sanciones automáticas, cambiar licencias existentes o fusionar el PR.
- **No es una prohibición general de competencia ni de estudio legítimo:** siguen aplicando los derechos imperativos de interoperabilidad y los demás límites legales.
- **No copiar los términos de Maket:** redacción propia, cuya eficacia se revisará conforme al contrato, jurisdicción y modo de prestación de Rubik.

**Identidad durable del trabajo:**
- Repositorio: `Juanmaes83/floorplan-3d`
- Base de la propuesta: `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
- Rama: `docs/legal-rubik-proteccion-extraccion-2026-11-03`
- PR en borrador: https://github.com/Juanmaes83/floorplan-3d/pull/161
- Primer commit del borrador: `0c88c4b289187e757f8ddf8e1cc87801611d7387`
- Estado de referencia: `DRAFT_LEGAL_REVIEW / NOT_EFFECTIVE / MERGE_NOT_AUTHORIZED`

**Checklist pendiente cuando se retome este expediente:**
- [ ] Determinar quién es el prestador legal de Rubik y para qué productos se aplican los términos (SaaS, API, B2B, contratos a medida, código disponible públicamente).
- [ ] Obtener revisión jurídica específica para España/UE; ajustar prohibiciones y excepciones imperativas.
- [ ] Alinear con licencias abiertas, derechos del cliente sobre sus proyectos, privacidad y derechos de exportación.
- [ ] Preparar términos completos, vigencia, política de cambios y mecanismo verificable de aceptación.
- [ ] Revisar si hacen falta controles técnicos independientes de antiabuso, rate limiting y seguridad de API, con contratos y pruebas propios.
- [ ] Obtener aprobación final expresa antes de publicar o fusionar; no confundir una redacción depositada en GitHub con protección contractual activa.

**Punto exacto para volver al brainstorming, por separado de este expediente legal:**

El programa `RUBIK CAPABILITY DISCOVERY` está en **investigación, no en implementación autorizada**. Los cuatro frentes registrados en conversación son:

1. **NeonPlan3D + REA:** auditoría focalizada de mecanismos 2D/3D, render bajo demanda, GPU, importación y mobiliario, aprovechando el código open source MIT y sin transplante integral.
2. **Maket:** benchmark funcional/UX a partir de información autorizada y pública; no extracción no autorizada de código propietario ni suposiciones sobre backend/modelos.
3. **image-to-3d-pipeline + img2threejs:** spike aislado foto → activo 3D con evaluación, licencias, provenance y calidad; sin prometer precisión a partir de una sola imagen.
4. **Rubik API + catálogo F3:** el producto ya cuenta con `api/render.js`, `js/asset-loader.mjs`, `js/asset-catalog.js` y `FloorPlanProjectV1`; la integración futura será un servicio/adapter sobre estas autoridades, no un segundo core.

**Reglas de separación:** Codex sigue con VQ-01/CP2 en su propio worktree; `Hybrid@07ae6f9969cae9df746443e97410e40cee2e932a` congelado y sin tocar; `master` sin cambios derivados de este PR; ningún brainstorming abre por sí solo nueva cantera VQ ni autoriza un merge.

**Siguiente conversación deseada:** retomar desde la matrix de oportunidades y elegir un primer piloto acotado (por ejemplo, foto → activo GLB validado por F3), sólo después de comparar el gap con el Rubik que ya existe. No iniciar cambios de producto basándose exclusivamente en esta nota.
