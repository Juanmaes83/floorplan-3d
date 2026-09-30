# Plan acotado F1–F3 (propuesta F0)

**Estado:** propuesta para revisión. **No** sustituye ni modifica el roadmap del [PR #2](https://github.com/Juanmaes83/floorplan-3d/pull/2) (`docs/ROADMAP.md`, sin mergear). Cómo encajan ambos: §4 y decisión D-13.
**Regla:** no se empieza F1 sin decisión explícita de Juanma tras revisar F0. Cada fase se entrega en PRs pequeños con una preview verificada según [`../qa/PR-preview-checklist.md`](../qa/PR-preview-checklist.md).

## 1. Por qué esta división (y qué cambia respecto al encargo)

El encargo proponía F1 = contrato + proyectos + calibración y revisión manual, F2 = interpretación asistida y F3 = catálogo. La auditoría confirma el orden, pero obliga a **partir F1 en dos entregas**. El motivo es que hoy la geometría **no es un dato**: muros, huecos y estancias son constantes del código (audit. §3.2). Sin convertirlos antes en datos del proyecto no se puede calibrar, trazar ni guardar un plano distinto. Además, en móvil horizontal el 3D queda en 844×140 px (§3.6), lo que impide el uso previsto por el operador.

- **F1a:** el proyecto como fuente de verdad (contrato, migración, varios proyectos), sin cambiar lo que se ve.
- **F1b:** imagen, calibración, trazado manual y revisión.

## 2. Fases

### F1a: proyecto `FloorPlanProjectV1` como fuente de verdad

| | |
|---|---|
| **Usuario y problema** | Operador inmobiliario (D-01). Necesita varios proyectos que sobrevivan a recargas y exportaciones sin perder la geometría |
| **Resultado demostrable** | La vivienda de referencia se carga **desde un `FloorPlanProjectV1`** y se ve igual que hoy en 2D y 3D. Se pueden crear, duplicar, renombrar y borrar proyectos (con confirmación). Exportar e importar da un proyecto idéntico |
| **Incluido** | Plantilla de referencia convertida a V1 con IDs deterministas. 2D y 3D renderizados desde los datos (no desde `WALLS`/`ROOMS`). Migrador `huxing-design-v1` → V1 idempotente. Validación de importación (esquema más reglas S1–S7). Lista de proyectos local. Mensaje claro sin WebGL (hoy la UI se bloquea, §3.5). Ocultar el precio en ¥ en la UI en español (D-05). Diseño móvil mínimo: el 3D debe ocupar al menos el 60 % del alto en 390×844 y 844×390 |
| **Excluido** | Carga de imágenes, calibración, trazado, catálogo externo, backend, cuentas, precios, IA |
| **Dependencias** | Aprobación del contrato (con cambios si procede). D-00, D-06, **D-07** (preview) |
| **Criterios de aceptación** | 1) Diferencia de píxeles 2D y 3D de la plantilla migrada frente a `a03136c` por debajo de un umbral acordado, en las mismas cámaras. 2) Ida y vuelta export → import → export **byte a byte igual** salvo `updatedAt`. 3) Un estado `huxing-design-v1` real se migra sin perder muebles, materiales, demoliciones ni medidas, y la clave antigua solo se borra tras confirmar el guardado nuevo. 4) Un JSON inválido se rechaza con un mensaje que nombra la regla. 5) Sin WebGL: mensaje visible y 2D operativo. 6) Tamaño del canvas 3D ≥ 60 % del alto en 390×844 y 844×390 |
| **Pruebas y evidencia** | Tests del migrador y del validador con los ejemplos de `docs/contracts/examples`. QA según la checklist en escritorio y móvil, con capturas antes y después. Informe JSON de `qa3d` adjunto al PR |
| **Riesgos** | Regresiones visuales al sustituir constantes; `index.html` monolítico de 2664 líneas. Mitigación: PRs pequeños y comparación de capturas |
| **Condición de parada** | Si la migración exige reescribir el render 3D por completo (más de ~40 % del bloque módulo), parar y replantear con Juanma antes de seguir |

### F1b: flujo manual de imagen, calibración, trazado y revisión

| | |
|---|---|
| **Usuario y problema** | Operador con el plano de una vivienda **distinta** de la plantilla |
| **Resultado demostrable** | Con un PNG/JPG, el operador calibra, verifica con una segunda cota, traza muros, huecos y estancias, revisa los avisos, amuebla con genéricos y lo ve en 2D y 3D. Exporta un `.zip` (D-09) que otra persona importa y ve igual |
| **Incluido** | Importar PNG/JPG (D-02, límites D-10) a almacenamiento local (D-06 y D-08: nada sale del navegador). Calibración de dos puntos más longitud y verificación con segunda cota (D-03). Herramientas de trazado con imán a ángulos de 90° y 45° y a extremos. Huecos sobre muros. Cierre de estancias. Panel de avisos W1–W4. `scale.confidence` visible en la UI. Opacidad y ocultado de la imagen |
| **Excluido** | Detección automática, PDF, subida a servidor, catálogo de marca |
| **Dependencias** | F1a mergeada. D-02, D-03, D-08, D-09, D-10 |
| **Criterios de aceptación** | 1) Con **5 planos reales distintos** (al menos uno escaneado y una foto de móvil), un operador llega a una propuesta 3D sin tocar código. 2) Error en la cota de verificación medido y registrado por plano (sin umbral prometido; sirve de base para D-04). 3) Se registra el tiempo de trazado por plano como línea base para F2. 4) Todo el flujo se completa en 390×844 táctil y en escritorio. 5) Borrar un proyecto elimina también su imagen local |
| **Pruebas y evidencia** | Tabla por plano (tipo, resolución, error de verificación, tiempo, nº de correcciones) en el PR. Capturas y grabación del flujo completo en móvil y escritorio |
| **Riesgos** | Trazado lento en móvil; planos deformados; datos personales en planos |
| **Condición de parada** | Si el tiempo mediano de trazado de una vivienda estándar supera lo que Juanma considera aceptable para D-01, parar y revisar el usuario o el enfoque (por ejemplo, el equipo interno como operador) antes de F2 |

### F2: asistencia a la interpretación del plano (siempre con corrección humana)

| | |
|---|---|
| **Usuario y problema** | Mismo operador: reducir el tiempo de trazado medido en F1b |
| **Resultado demostrable** | Sugerencias editables (`source.method:"suggested"`, `review:"unreviewed"`) que el operador acepta o corrige. Ninguna sugerencia cuenta como medida confirmada |
| **Enfoque recomendado** | Empezar por **asistencia local** (imán a líneas detectadas en la imagen dentro del navegador y propuesta de muro al pasar el cursor), que no sube el plano ni añade coste por uso. Solo después evaluar detección completa (modelo propio o servicio) si los datos lo justifican y D-08 lo permite |
| **Incluido** | Conjunto de evaluación, métricas, prototipo de asistencia local y comparación con la línea base de F1b |
| **Excluido** | Promesa de interpretar «cualquier plano»; publicar geometría sugerida sin revisar; subir planos a terceros sin D-08 |
| **Métricas que hay que medir antes de prometer nada** | Sobre un **conjunto fijo de ≥ 20 planos** con cotas de referencia, de tipos variados (exportado de CAD, escaneado, foto, con y sin mobiliario dibujado): (a) **error dimensional** (mediana y p90) en cotas de verificación; (b) **precisión y exhaustividad** de muros y huecos con tolerancia en mm definida; (c) **% de planos que necesitan corrección manual** y nº medio de correcciones; (d) **tiempo total de preparación** frente a F1b; (e) **tipos de plano compatibles** y no compatibles; (f) coste y latencia por plano si hay servicio externo |
| **Dependencias** | F1b con línea base medida. D-04. D-08 si se procesa fuera del navegador |
| **Criterios de aceptación** | Juanma fija los umbrales **antes** de construir. Referencia provisional: reducción del tiempo mediano ≥ 30 % sin empeorar el error de verificación, y la geometría incierta siempre marcada |
| **Riesgos** | Sobreajuste al conjunto de prueba, falsa sensación de precisión, privacidad |
| **Condición de parada** | Si tras el prototipo local no hay mejora medible del tiempo, no pasar a detección completa |

### F3: catálogo de objetos 3D y materiales (condicionado)

| | |
|---|---|
| **Usuario y problema** | Operador: que la propuesta muestre muebles reconocibles y a escala |
| **Resultado demostrable** | Un mueble genérico se sustituye por un asset autorizado sin perder posición, medidas ni estancia. Si el asset no carga, vuelve el genérico |
| **Incluido** | Alturas y dimensiones del catálogo genérico como datos. Adaptador de lectura del manifest de Asset Lab (sin duplicar el catálogo). `GLTFLoader` + `DRACOLoader` (109 de 114 GLB exigen Draco, audit. §4.1). Normalización de orientación y unidades por asset. Presupuesto de peso y polígonos en móvil. `assetRef` en el contrato |
| **Excluido** | Precios, compra, publicar assets sin licencia, copiar GLB dentro de los proyectos |
| **Dependencias** | **D-11** (licencia verificable **por asset**; hoy 0 de 134). Dimensiones reales en el manifest (hoy 1 de 114). F1a |
| **Criterios de aceptación** | 1) Solo aparecen assets con documento de permiso verificable y vigente para el uso concreto. 2) La caja del GLB normalizado coincide con las dimensiones declaradas ±2 cm. 3) Carga en móvil de gama media dentro del presupuesto acordado, con medida real (no SwiftShader). 4) Fallback probado desconectando la URL del asset |
| **Riesgos** | Legal (marca e IP), rendimiento, mantenimiento de dos catálogos |
| **Condición de parada** | Sin D-11 resuelta, F3 se limita a mejorar el catálogo **genérico** y el cargador con un asset propio o de licencia libre verificada |

## 3. Dependencias entre fases

```text
F0 aprobada ─► D-00, D-01, D-06, D-07 ─► F1a ─► F1b ─► (línea base medida) ─► F2
                                          └──────────────► F3 (solo si D-11) ◄─ Asset Lab: licencias + dimensiones
```

## 4. Correspondencia con el roadmap del PR #2 (sin modificarlo)

| Este plan | Roadmap PR #2 | Diferencia |
|---|---|---|
| F1a | F1 (base mobile-first) + F2 (proyectos múltiples) | Se agrupan porque ambos dependen de que la geometría sea un dato. Del mobile-first solo entra el mínimo imprescindible |
| F1b | F3 (subir y trazar plano 2D) | Añade la verificación con segunda cota y la medición de línea base |
| F2 | F4 (detección asistida) | Empieza por asistencia local y métricas previas |
| (dentro de F1a) | F5 (escena 3D desde geometría) | El 3D desde datos es requisito de F1a, no una fase posterior |
| F3 | F6 (Asset Lab e IKEA) | Igual, con la puerta de licencia cuantificada (0 de 134) |
| — | F7–F9 (CRM, Immersphere Pro, analítica) | Fuera de este plan |
