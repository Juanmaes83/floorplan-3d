# F1b: evaluación con cinco planos reales

## Autorización posterior: prototipo experimental en revisión (30-09-2026)

Juanma autoriza implementar y revisar en `feat/f2-local-wall-assist` un prototipo
local limitado a sugerencias editables de muros antes de disponer de las cinco
sesiones, veinte planos y umbrales finales. Esta decisión sustituye, solo para
ese prototipo, la prohibición de comenzar implementación previa que figura en
el protocolo inicial. No completa ni elimina ninguna puerta de evaluación.
F2 no está validada ni terminada; no se afirma precisión, ahorro temporal,
compatibilidad general ni rendimiento móvil físico. Master solo reflejará el
nuevo estado después de un merge aprobado. [Informe de la rama](../technical/F2-wall-assist.md).
El recorder conserva `implementation_authorized:false`: resume registros y no
otorga autorizaciones; la excepción procede exclusivamente de Juanma.

Estado: **pendiente de validación con cinco planos reales autorizados**. F1b ya fue aprobada y fusionada por Juanma; esta evaluación queda como seguimiento y no se marca como ejecutada ni se presenta como prueba que haya bloqueado el merge. No se han proporcionado cinco planos
con autorización de uso. Los fixtures sintéticos comprueban comportamiento técnico;
no representan esta evaluación ni acreditan precisión profesional.

| Plano autorizado | Tipo | Resolución | Error segunda cota | Tiempo de trazado | Correcciones | Incidencias / resultado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 — pendiente | Exportación digital (obligatoria) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| 2 — pendiente | Escaneo (obligatorio) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| 3 — pendiente | Foto móvil (obligatoria) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| 4 — pendiente | A determinar | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| 5 — pendiente | A determinar | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Registrar autorización antes de usar cada fichero. No adjuntar direcciones, nombres
ni datos privados al repositorio o a una preview. Medir error y tiempo como evidencia,
sin comparar con una promesa de precisión o un tiempo de trazado aún no aprobados.

Esta línea base debe medirse antes de iniciar F2 (asistencia) y antes de fijar
umbrales con Juanma. El 2 % del aviso de segunda cota no es un umbral de aceptación
para F2. El seguimiento UX/WebP no completa ninguna fila de esta tabla.

## Protocolo reproducible de línea base antes de F2

Preflight del 30-09-2026 sobre `master` @ `d644665`: en `/workspace` se encontraron
solo seis raster sintéticos de `tests/fixtures`, **cero planos reales candidatos**
y ninguna autorización documentada para esos conjuntos. No se recorren carpetas
privadas externas ni se buscan viviendas en Internet. La tabla anterior sigue sin
mediciones; no es un resultado negativo del producto.

Juanma confirmó funcionamiento del flujo en su teléfono. No se conoce modelo,
navegador/versiones ni mediciones de rendimiento físico; no equivale a esta línea
base ni al conjunto de veinte planos para F2.

### Material que debe proporcionar Juanma en local

1. Al menos cinco planos reales distintos con IDs `plan_NNN`: al menos una
   exportación digital (`digital`), un escaneo (`scan`) y una foto móvil (`photo`).
   Los otros dos pueden ser de cualquiera de esos tipos; no hay cuotas adicionales
   ni mínimo con/sin mobiliario para esta línea base. Solo las sesiones aptas y
   medidas descritas en el protocolo F2 cuentan para el mínimo y su cobertura.
   Usar PNG/JPEG o WebP estático admitido, hasta 15 MiB/8000 px de lado mayor.
   PDF/HEIC/HEIF requieren una copia raster obtenida **localmente**; conservar la
   fuente y la relación de conversión solo en el registro privado.
2. Por plano, autorización expresa de la persona/titular con facultad para
   autorizar este uso: evaluación manual y procesamiento local, quién la concedió,
   fecha, alcance, restricciones y evidencia verificable. Juanma debe revisar y
   registrar esa evidencia; recibir el fichero o marcar una casilla no prueba
   derechos. Asignar `auth_001`… y guardar la correspondencia privada fuera de Git.
3. Una cota fiable para calibrar y otra físicamente independiente para verificar,
   ambas en mm, identificadas como `dim_001` y `dim_002` **dentro de cada plano**.
   No reutilizar el mismo segmento o su valor calculado como validación. Registrar
   puntos en el raster original y origen de las cotas en la ficha privada.
4. Dispositivo/navegador/orientación, operador y condiciones de la sesión, con
   códigos anónimos. La identidad y los nombres de archivos, direcciones, EXIF,
   rutas y autorizaciones completas permanecen en local y fuera del checkout.

Ubicación propuesta: carpeta local segura elegida por Juanma, **fuera del repo**.
No se crea ni presume una carpeta con datos/autorizaciones. No pegar documentos
privados en una PR, herramienta externa o preview. Abrir la app local en el
navegador; su descarga de Three.js no envía los planos. No exportar ZIP/JSON con
imágenes a servicios; conservar también los resultados y el manifiesto real en
esa carpeta privada. El ZIP original puede contener EXIF.

### Una sesión por plano, con fallos registrados

- Revisar autorización y raster antes de empezar. Anotar tipo (digital/scan/photo),
  formato, bytes, dimensiones y orientación del raster usado. Registrar las
  conversiones externas locales; no ocultar un cambio de resolución.
- Iniciar cronómetro al ejecutar «Cargar imagen de plano»; medir por separado
  preparación/carga, calibración, trazado inicial y revisión/correcciones. Pausas,
  interrupciones y reintentos se anotan; no borrar sesiones fallidas del denominador.
- Registrar éxito/fallo de carga y calibración. Calibrar con la primera cota.
  Verificar con la segunda: guardar longitud conocida, longitud medida, error
  firmado y absoluto. El aviso existente del 2 % es provisional; no lo convertir
  en criterio aprobado de F2 ni descartar mediciones por superarlo.
- Trazar muros, huecos y estancias con el flujo manual; revisar W1–W4 y 2D/3D.
  Contar cada operación correctiva por categoría (muro/hueco/estancia/escala),
  incluyendo deshacer/rehacer correctivo. No contar la creación inicial como
  corrección. Registrar incidencia por código y detalle privado, y resultado final.
- Definir `tracing_seconds` como tiempo activo desde el primer gesto de trazado
  hasta cerrar la última estancia del trazado inicial, sin calibración, pausas ni
  revisión posterior. Guardar esos otros tiempos por separado en la ficha privada.
  Completar un fallo con `load_success:false` o `calibration_success:false` y
  medidas no obtenidas como `null`; nunca sustituirlas por cero o estimarlas.
- Conservar proyecto/ZIP local y referencias de sesión. Publicar como máximo un
  resumen anónimo previamente revisado, sin bytes, nombres, cotas/puntos privados
  ni evidencias de autorización. Comparar futuras sesiones asistidas con la misma
  definición de tiempos y condiciones; informar cambios de operador/aprendizaje.

### Registro y cálculo offline

Copiar [la plantilla vacía](f2-evaluation.template.json) a la carpeta privada y
seguir el [diccionario de registros](F2-entry-protocol.md). La plantilla del repo
no contiene planos ni mediciones. El script no lee imágenes, no usa red, no
verifica jurídicamente autorizaciones y **nunca autoriza implementar F2**.

```bash
python3 scripts/f2-readiness.py docs/qa/f2-evaluation.template.json
python3 tests/f2_readiness.test.py
```

El primer comando demuestra el estado vacío: cero registros medidos y métricas
`null`; no es una evaluación de planos. Para datos reales, ejecutar el mismo
script con la ruta al registro **local privado**, revisar el resumen antes de
compartirlo y conservar el original fuera de Git. La CLI no imprime rutas privadas.

Las cinco sesiones miden la base manual. Los **veinte o más** planos de evaluación
F2 son un conjunto fijo distinto como finalidad y registro, descrito en el
[protocolo F2](F2-entry-protocol.md). No sumar fixtures o contar cinco como veinte.
