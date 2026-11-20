# Propuesta de contrato · Referencias GLB privadas

## Identidad y relaciones

| Registro | Campos propuestos | Dueño y alcance |
|---|---|---|
| Referencia de instancia `privateModelRef` | `version`, `modelId`, `sha256` | El objeto canónico conserva identidad, estancia, huella, posición, rotación y cotas. El modelo solo resuelve su representación. Una instancia tiene una única representación elegida entre el catálogo F3 y el recurso privado. |
| Descriptor privado | `version`, `modelId`, `sha256`, `byteLength`, `mediaType`, `title`, `rightsId`, `profileId` | La biblioteca F0 resuelve el descriptor por identidad y comprueba la huella contra la referencia. Identidad y ámbito son obligatorios. El registro de derechos conserva base, atribución, licencia y `evidenceSha256` en el mismo ámbito privado. |
| Contenido | SHA-256 de los bytes GLB originales, longitud y bytes | La autoridad de adjuntos de F0.2c guarda una copia por digest dentro del ámbito permitido. Las fichas e instancias comparten contenido sin ampliar derechos. |

`version` empieza en `1`, `sha256` exige 64 caracteres hexadecimales minúsculos y `mediaType` es `model/gltf-binary`. `modelId` es opaco y tiene significado solo en la biblioteca autorizada. Los bytes o el perfil de admisión distintos requieren una ficha nueva o una revisión explícita. La deduplicación comprueba longitud, huella y ámbito. Una evidencia de derechos incompatible abre un conflicto. La huella por sí sola nunca otorga acceso.

Un recurso ausente, rechazado o ajeno al ámbito deja visible la huella genérica del objeto. El editor conserva su geometría e identidad y muestra el estado de resolución. El valor de `privateModelRef` se mantiene separado de `assetRef` y del catálogo de Asset Lab.

## Transacciones, recuperación y compatibilidad

- **F0.2b** abre la sesión única antes de leer o escribir la biblioteca. Los consumidores de claves gestionadas comparten su fachada y su revisión. El editor indica «guardado» cuando termina la transacción. El almacenamiento anterior es la copia de compatibilidad de F0, con barrera de escritura. El corte que conecta el editor puede preceder al soporte GLB.
- **F0.2c** registra bytes provisionales y referencias de la operación en su diario. La confirmación de descriptor, documento y alcance usa la misma autoridad y comprobación de revisión. Cancelación, fallo de cuota o caída mantienen la revisión anterior y dejan una operación recuperable o descartable. La recogida comprueba proyectos, plantas, variantes, revisiones, historial, conflictos, diarios y expedientes en restauración. Se libera un digest cuando la transacción confirma que carece de titulares.
- **F0.3** presenta estado, cuota, copia verificable y decisión de recuperación, también cuando falta un adjunto privado. El permiso de almacenamiento sigue bajo el flujo humano existente. Una versión anterior recibe la huella genérica mediante la política de compatibilidad de F0. La versión que ignora referencias no puede sobrescribir el expediente privado actual con una copia degradada sin que F0 detecte la divergencia.

## Expediente y privacidad

La propuesta de copia privada usa `assets/glb/<sha256>.glb` y un manifiesto versionado con tipo, bytes y SHA-256. La restauración valida ruta, tamaño individual y total, lista de archivos, hash, derechos y el perfil admisible antes de publicar referencias. Si falta una entrada o sobra un archivo, restaura la vista genérica solo mediante una decisión explícita que conserve el diagnóstico. El formato de expediente vigente requiere una extensión aprobada para aceptar este nuevo tipo de adjunto.

La exportación compartida conserva la representación genérica y elimina referencias privadas, hashes de evidencia, derechos privados, rutas, nombres de fichero y binarios. La exportación privada requiere una acción explícita y una comprobación de alcance por recurso. El expediente conserva la evidencia mínima para restablecer el permiso. El resolvedor local evita red y URLs de origen. La resolución y deduplicación se limitan al ámbito autorizado de la biblioteca activa.

**GO de contrato para revisión de F0.2b/c y F0.3.** **NO-GO de persistencia GLB hasta validar** la semántica de alcance y compatibilidad, las transacciones con fallos y cuota, el recorrido privado de exportación/restauración y la ausencia de recursos privados en entregas compartidas. Esta propuesta no implementa esquema, persistencia ni transición de producción.
