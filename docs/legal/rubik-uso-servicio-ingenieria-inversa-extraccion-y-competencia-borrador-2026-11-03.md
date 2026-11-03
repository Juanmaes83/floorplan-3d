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
