# RUBIK SOTA — SCULPT-GIT-TRANSFER v1.0

**Tipo:** protocolo técnico auxiliar y reproducible de transferencia verificada GitHub → GitHub.  
**Fecha:** 20/11/2026.  
**Estado:** propuesta formalizada en rama documental para revisión del propietario. **No integrada en master, no autoriza una nueva extracción ni cambia el roadmap.**  
**Autoridad:** [SCULPT aprobado](https://github.com/Juanmaes83/SUBVENCIONES-PYMES/blob/main/docs/20-SCULPT-METHODOLOGY.md) y [metodología transversal de RUBIK](../product/sculpt-metodologia-y-cartera-2026-11-10.md).  
**Base documental:** `master@130ba24d420a2f4b26ab261313202e6070904fd8`.  
**Precedencia:** decisiones del propietario → código vigente verificado → documentación reciente → antecedentes.  
**No crea** nuevas piedras, IDs, olas ni prioridades frente al [plan maestro v1.12](../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md) y su [matriz](../product/MATRIZ-TRAZABILIDAD-v1.12.md).

## 1. Objetivo y límites del método

SCULPT-GIT-TRANSFER estandariza exclusivamente la **adquisición fiel de archivos** dentro de **SOURCE + ISOLATE**. Permite copiar de modo verificable código, recursos binarios, pruebas, fixtures, documentación y manifiestos entre repositorios accesibles de GitHub **sin depender, por defecto, de descargas locales, PowerShell ni clones completos**.

**Workflow SCULPT canónico — permanece intacto:**

`SOURCE → ISOLATE → CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW → HUMAN REVIEW → MERGE`

**Subproceso de transferencia dentro de SOURCE + ISOLATE:**

`SOURCE IDENTIFICADO → LICENCIA → INVENTARIO → TRANSFERENCIA DE BLOBS → COMPARACIÓN SHA → MANIFIESTO → COMMIT AISLADO → VERIFICACIÓN REMOTA`

La identidad binaria **no prueba** compatibilidad, ausencia de código malicioso, titularidad, que un fichero sea funcional, que la dependencia esté completa o que el catálogo/usuario lo pueda utilizar. **No saltar CLASSIFY, NORMALIZE, TEST, PREVIEW, HUMAN REVIEW ni la autorización de MERGE.**

## 2. Condiciones para aplicar el protocolo

**GO preliminar** si: donante y commit exacto accesibles; licencia compatible verificada por fichero/pack; destino autorizado; archivo ordinario de Git (blob), contenido recuperable completo; tamaño manejable por las herramientas disponibles; dependencia inventariada; ubicación de laboratorio separada; no existe snapshot exacto equivalente que deba reutilizarse.

**HOLD** si: la procedencia o derechos no están claros; se trata de datos personales/privados, secretos o ficheros de clientes; existe Git LFS, submódulo, symlink, objeto ausente, archivo enorme, límites del conector, árbol truncado, PR histórica no recuperable, riesgo de divulgación por visibilidad del repositorio o conflicto con trabajo de otro agente. Documentar motivo y método alternativo, **no declarar transferencia terminada**.

**NO-GO** si: no hay autorización de acceso/publicación o licencia; se detecta contenido confidencial no autorizado; se requieren cambios productivos fuera de SOURCE/ISOLATE; destino incorrecto; mismatch de identidad sin explicación; intento de hacer pasar un puntero LFS por los bytes del recurso; estado de rama no verificable o acción no reversible.

**Restricción de tamaño:** validar el límite **efectivo de la API/conector** antes de intentar el archivo, independientemente de los límites generales de GitHub. Los límites de GitHub para ficheros Git convencionales no garantizan que un conector pueda procesar archivos grandes. LFS, ZIP, Blender, texturas pesadas y multimedia requieren tratamiento específico (o HOLD). No dividir ni recomprimir un SOURCE EXACT sin abrir una variante distinta y documentada.

## 3. Contrato operativo obligatorio

### Gate A — PREFLIGHT sin escrituras

1. Confirmar repositorio donante, propietario, **commit completo fijo** y rama o PR histórica exacta. Registrar si se ha fijado HEAD o un commit anterior.
2. Confirmar repositorio de destino y **visibilidad** (público/privado), permiso de escritura, rama de base y **SHA del HEAD y del árbol base**; consultar ramas abiertas. No usar una ruta genérica ni un HEAD flotante al descargar.
3. Revisar instrucciones del repo (AGENTS.md si existe), SCULPT vigente, plan maestro, catálogo F3 y laboratorios existentes; detectar si la capacidad/asset ya está copiado, integrado o en ejecución por Codex/Claude.
4. Fijar alcance: **familia completa relevante**, dependencias, pruebas, licencias y criterios de exclusión. No confundir archivos de catálogo, número de modelos físicos y modelos admitidos. Listar paths esperados, tipos Git, tamaños, modo de fichero, SHA de objeto, hashes de contenido disponibles y el origen de cada uno.
5. Examinar **licencia por recurso** y otros avisos/atribuciones; confirmar que copiar de un repositorio público a otro público está permitido. Un código MIT **no autoriza automáticamente** assets, música, fotos ni marcas.
6. Seleccionar rama nueva **exclusiva** y ruta `labs/sculpt/<corte>/upstream/`. Nunca usar master como destino ni reabrir un snapshot fiel para modificarlo. Detenerse si la rama ya existe salvo reconciliación explícita con el propietario.

**Salida:** plan de archivos y dependencias, decisión GO/HOLD/NO-GO, base SHA, ubicación de destino y condiciones de reversión.

### Gate B — ADQUISICIÓN Y TRANSFERENCIA; sin publicar rama todavía cuando sea viable

1. Leer el **árbol Git del commit fijo**, comprobando si la respuesta está truncada. Seleccionar explícitamente la lista cerrada de blobs autorizados; no confiar en globs imprecisos si pueden incluir datos excluidos.
2. Para **cada blob**, leer el contenido original completo en representación binaria/base64 a través de una acción que lo soporte. Verificar que el SHA Git de origen obtenido por esa acción coincide con el árbol original.
3. Crear **un nuevo blob en el repositorio destino a partir de los bytes recibidos**. Esto es esencial: **NO intentar referenciar directamente un objeto Git de otro repositorio**, porque el destino puede no contener ese objeto. Tampoco confiar en la mera existencia de un SHA en el repositorio origen.
4. Comparar **SHA Git del nuevo blob destino == SHA Git del blob fuente**. Se exige mismo tipo de objeto y formato de repositorio compatible. En caso de error o discrepancia: **STOP**, sin crear la rama final, e investigar bytes/encoding.
5. Priorizar representación binaria sin transformación para texto y binarios por igual. Cambiar CRLF/BOM/codificación, serializar JSON o recomprimir **rompe SOURCE EXACT** y debe tratarse como adaptación separada.
6. Si hay SHA-256 externo fiable, recalcularlo **sobre los bytes efectivamente recibidos** cuando la herramienta permita obtenerlos como bytes, y contrastarlo. Si no se ha calculado independientemente, registrar **SOURCE_DECLARED_SHA256 / NOT_RECALCULATED**, aunque la igualdad Git SHA esté acreditada.
7. Acreditar por fichero contenido completo, tamaño, origen, destino, tipo, licencia, estado y cualquier riesgo residual. No transformar/ejecutar código no confiable durante la transferencia.

**Transferencia de objeto ≠ publicación en una rama.** Los blobs creados sin referencia no significan que haya recursos utilizables ni un commit visible; solo acreditan bytes cargados y objetos existentes en el destino.

### Gate C — MANIFIESTO Y COMMIT AISLADO

1. Crear manifiesto de la operación con **registros por fichero** y separar metadatos del donante de las comprobaciones realizadas realmente. Conservar avisos originales y pruebas/fixtures relevantes.
2. Construir **un nuevo árbol** sobre el árbol del **commit base comprobado**, usando únicamente los SHA de blobs creados **en el destino**, los ficheros auxiliares y paths **bajo el laboratorio autorizado**.
3. Crear un **commit con padre explícito** igual al SHA base. Preferir crear la **referencia de rama al final**, una vez que el árbol y commit completos existen: esto evita mostrar una rama parcialmente poblada.
4. Si la herramienta obliga a crear la rama antes, protegerla como provisional y **NO declararla completa** hasta su verificación final. Nunca escribir sobre `master` ni usar force push.
5. No introducir dependencias, cambios en `js/`, `assets/f3/`, esquema, backend, persistencia, workflows, secretos, deployments o CI sin un mandato independiente y explícito.

**Una operación atómica a nivel de ref de rama no implica transacción entre múltiples endpoints:** si falla la creación del árbol/commit, pueden quedar objetos Git no referenciados; registrarlo. Nunca afirmar que fueron eliminados ni hacer borrados destructivos por iniciativa propia.

### Gate D — VERIFICACIÓN REMOTA (obligatoria)

1. Leer **la rama publicada** por GitHub y verificar que apunta al **commit esperado**, con el **padre y árbol esperados**.
2. Comparar `base SHA ... commit destino`: deben aparecer **solo** los archivos esperados dentro de `labs/sculpt/<corte>/`; no cambios ajenos ni pérdidas. Detectar truncamientos/paginación; no contar únicamente la primera página si hay más resultados.
3. Recontar archivos por clase y procedencia; contrastar tamaños y **SHA Git de todos los blobs** contra el árbol donante y manifiesto. Para los SHA-256, conservar la distinción declarado vs recalculado.
4. Consultar `master` y confirmar que **la operación no ha escrito en él**. Puede avanzar legítimamente por trabajo simultáneo: comparar SHA del antes y después y atribuir cualquier avance a su origen; no prometer que HEAD siempre permanezca idéntico.
5. Registrar URL, SHA final, fecha, archivos aprobados/no copiados y estados: `SOURCE_VERIFIED / ISOLATED / HOLD / BLOCKED`; ejecución de baseline y tests normalmente `NOT_RUN` en esta fase.
6. Verificar que la rama contiene las licencias, el inventario, la procedencia y un traspaso reproducible para Codex. No depender solo de un mensaje de éxito del conector.

**Cierre:** solo `SOURCE VERIFIED + ISOLATED` cuando todos los archivos aprobados, manifest y controles remotos pasan. Si hay excepciones, `PARTIAL / BLOCKED`, lista precisa de faltantes y rama sin autorización de integración.

## 4. Manifiesto mínimo (contrato de evidencia)

Archivo recomendado: `labs/sculpt/<corte>/SOURCE-MANIFEST.json`, bajo esquema versionado.

**Campos globales obligatorios:**
- `schema`, `project`, `capabilityId`, `runDate`, `operationId`, `sourceRepo`, `sourceCommit`, `destinationRepo`, `baseCommit`, `destinationBranch` y `destinationCommit`.
- `state`, `sourceLicenseReferences`, `scope`, `includedCount`, `excludedCount`, `transferMethod`, `verificationSummary` y `limitations`.
- `baselineOriginal` y `rubikFunctionalTests` con valores explícitos `PASS / FAIL / SKIP / NOT_RUN / BLOCKED` y commit asociado.
- `files[]` con, al menos: `sourcePath`, `destinationPath`, `mode`, `type`, `sizeBytes`, `sourceGitBlobSha`, `destinationGitBlobSha`, `gitShaVerified`, `sha256Declared`, `sha256Measured`, `sha256Status`, `licenseId`, `licenseEvidence`, `dependencyRole`, `sourceStatus`, `integratedInRubik` y `issues`.

**Convención:** `sha256Measured = null` y `sha256Status = NOT_RECALCULATED` cuando únicamente se conoce el valor que declara el donante. No escribir `PASS` para una comprobación que no se ejecutó.

**Notas de integridad:** un Git blob SHA calcula un identificador de objeto de Git, no necesariamente SHA-256 puro del fichero. La coincidencia entre fuente y destino acredita identidad del objeto bajo el mismo formato de hash, **no valida los derechos o la ejecución**.

## 5. Excepciones y fallos previsibles

| Situación | Acción |
|---|---|
| GitHub conector no permite lectura binaria o payload excede su límite | HOLD; elegir ruta alternativa segura con verificación independiente. No convertir binario a texto UTF-8 |
| Git LFS | Verificar y recuperar el objeto LFS real con licencia/hashes; **un puntero LFS no cuenta como modelo o vídeo transferido** |
| Git submódulo (`160000`) | Tratar como repositorio/commit dependiente; SOURCE separado |
| Symlink (`120000`) | Registrar target; revisar rutas y posible fuga; no seguirlo automáticamente |
| SHA de origen/destino distinto | STOP antes de crear branch; investigar encoding, contenido y tipo |
| Licencia incierta o mixed content | HOLD por archivo/familia; no compartir públicamente |
| La rama destino existe o cambió el base | No sobrescribir; verificar historia y pedir reconciliación |
| Un archivo falla a mitad de lote | Registrar fallos y no declarar éxito completo; blobs sueltos no equivalen a publicación |
| Referencias o datos sensibles | BLOCKED; no trasladar ni mostrar en logs o previews |
| El donante ya estaba extraído/integrado | Reutilizar snapshot y evidencias, no generar duplicados |
| El donante incluye código ejecutable/instaladores | Copiar como fuente **sin ejecutar** hasta revisión y baseline aislada |
| Recurso comercial pesadísimo | Evaluar Git LFS, almacenamiento autorizado o solo manifiesto; evitar promesas de transferencia automática |

**No usar comandos de emergencia como reset --hard, push --force o eliminación de carpetas/worktrees.** No almacenar credenciales en scripts o manifiestos.

## 6. Handoff a Codex y siguiente gate

El responsable de SOURCE + ISOLATE entrega **un snapshot inmutable con origen, licencias, hashes, prueba de copia remota y límites declarados**. Codex **no vuelve a clonar por reflejo**: verifica el manifiesto, ejecuta baseline de origen o registra `NOT_RUN`, y aplica CLASSIFY (**KEEP / GENERALISE / OPTIONALISE / REPLACE / REMOVE**) por fichero. Solo entonces SCULPT, NORMALIZE, TEST y PREVIEW sobre adaptadores al núcleo RUBIK vigente.

**HUMAN REVIEW** del propietario antes de MERGE en los cambios visibles; **MERGE** y **Production** requieren autorizaciones independientes. Copiar módulos no justifica sustituir el editor, catálogo F3, `FloorPlanProjectV1`, renderer, persistencia F0, MCP u otras autoridades del producto.

## 7. Evidencia real del piloto OP-11 (20/11/2026)

- **Fuente:** [OpenPlan3D @ 771c9e1](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d).
- **Salida:** [SCULPT OP-11 — 68 GLB](https://github.com/Juanmaes83/floorplan-3d/tree/sculpt/op11-source-assets-20261120/labs/sculpt/op-11), commit `3d0c58bb086fc9628aa3c954ff01ec60aa826b4a`.
- **Evidencia:** 64 GLB Nature Kit + 4 Furniture Kit (plantas interiores); 12 piloto; 7 documentos/licencias; 75 archivos de corte. Comparación original/destino: **68/68 Git blob SHA iguales**, ningún fichero fuera de `labs/sculpt/op-11/`, sin cambios del producto.
- **Límite explícito:** hashes SHA-256 **declarados en el manifiesto del donante**, **NO recalculados independientemente** durante esa transferencia. Ninguna prueba de render, F3, CPU/GPU, móvil ni HUMAN REVIEW ejecutada. El uso de CC0 está asociado a los kits Kenney auditados, no a recursos externos arbitrarios.
- **Ámbito:** no integrar automáticamente los 68 GLB, no cerrar OP-05, no asumir que personas o coches 2D son modelos 3D.

El piloto valida la **transferencia fiel de objetos Git en este entorno y con estos tamaños**, **no** una compatibilidad universal de formatos ni una automatización garantizada para todo repositorio.

## 8. Próximas candidatas (solo investigación; no autorizadas por este documento)

1. **OpenPlan3D — 136 GLB restantes del Furniture Kit** (misma fuente y procedencia declarada, ~1,9 MB según tree inspeccionado). Antes de transferir: comprobar duplicación con F3, derechos por pack, categoría y destino.
2. **OpenPlan3D — 12 símbolos 2D entourage**, catálogo, geometrías, exports y pruebas. Su recuperación como archivos de código es sencilla; la integración requerirá clasificación.
3. **OpenPlan3D — OP-09 plantillas y OP-06 selección múltiple**, con tests y cierre de dependencias; **no copiar el editor completo**.
4. **OpenLandscape3D — paisajismo**, donante independiente. Licencia, modelos, catálogo botánico, superficies y contratos requieren SOURCE separado; no atribuir topografía avanzada ni datos agronómicos españoles validados.
5. **Simulator A–F**, con registro previo en [laboratorio Simulator](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab): **reutilizar** los snapshots existentes antes de decidir una nueva transferencia, y mantener el HOLD de derechos de F.

Para cada operación futura: rama, gate, permisos y alcance **aprobados separadamente**. Ninguna de estas candidatas se copia por el solo hecho de aparecer en el protocolo.

## 9. Criterios de aprobación de este documento y mantenimiento

- La presente rama es **solo documentación**; no añade una librería automática, CLI, GitHub Action, script de PowerShell ni conectores nuevos.
- Confirmar que el documento es subordinado a SCULPT original; los estados son verificables y los hashes no se sobredeclaran; el método no sugiere copiar SHAs directamente entre repositorios, sino **crear objetos locales destino a partir de bytes originales**.
- Antes de incorporarlo a `master`, revisión del propietario y PR con CI aplicable al HEAD. Mantener versión v1.0; cualquier cambio en rutas, seguridad, visibilidad o modelo de evidencia se registra en PR posterior.
- Actualizar este protocolo **solo** cuando un incidente real, un cambio en GitHub/connector o un segundo piloto aporten evidencia verificable; no modificar retrospectivamente el resultado de OP-11.

**Última comprobación:** el protocolo se limita a SOURCE + ISOLATE y no concede GO para otra extracción, merge ni Production.
