# F2 — prototipo experimental de sugerencias locales de muros

> **Estado actualizado tras PR #9 (30-09-2026):** aprobado por Juanma y fusionado en `master` mediante `10f7439b3fc86b0a0bd325d94531709d45cbcad4`. El HEAD revisado fue `3e3e6117770d97cb6e82f73fa06613d31a506019`; la preview Vercel `READY` se verificó contra ese SHA. Este prototipo sigue siendo experimental y **F2 no está validada**. Los apartados de publicación que describen bloqueos son la evidencia histórica previa a abrir la PR; véase el cierre al final.

Estado de esta rama: **prototipo experimental de F2; en revisión; no validado**.
Base: `master` remoto verificado `dbd29987308e7cca1455fdbf3cf7f3813feda1d6`,
coincidente con la referencia de Juanma. Rama única `feat/f2-local-wall-assist`.
Checkout inicial limpio; ramas y trabajo previos conservados. Las PR abiertas
#1/#2/#3 se comprobaron en el listado público de GitHub; no hay otra PR F2 allí.
No se incorporan sus contratos históricos ni se cambian otros repositorios.

## Decisión de Juanma y puertas pendientes

El 30-09-2026 Juanma autoriza implementar y revisar este prototipo antes de tener
cinco planos reales medidos, veinte planos de evaluación y umbrales finales.
La excepción es solo para esta capacidad experimental. No valida ni completa F2,
no aprueba decisiones F0, no acredita precisión, ahorro de tiempo o compatibilidad
general. Master solo reflejará el estado nuevo tras merge revisado y aprobado.
No se fusiona ni se despliega manualmente a producción en esta tarea.

Siguen pendientes [cinco sesiones manuales](../qa/F1b-five-plans.md) aptas, con
exportación digital/escaneo/foto, y [veinte planos fijos](../qa/F2-entry-protocol.md)
autorizados con referencias independientes, esos tres tipos y con/sin mobiliario.
Juanma puede proporcionar/revisar esos datos **en privado y localmente** cuando abordemos la validación empírica y fijar umbrales antes de afirmar precisión, mejora temporal o cobertura. No son un bloqueo para seguir implementando F2 con fixtures sintéticos y limitaciones explícitas. Ningún fixture sustituye los datos reales para validar.
El recorder sigue emitiendo `implementation_authorized:false`; la autorización
procede del mensaje explícito de Juanma, no de completar sus contadores.

## Capacidad, algoritmo y límites

Desde «Plano propio» → «Sugerir muros localmente», se leen los bytes de la imagen
seleccionada en IndexedDB y se validan con F1b. Se decodifica una copia con la
orientación EXIF neutralizada como en el render F1b; los originales no cambian.
Se muestrea en un canvas de lado máximo **512 px**, manteniendo la proporción,
y se compone transparencia sobre blanco. No se crea un canvas original de 8000²
para leer RGBA; el bitmap decodificado se cierra también al cancelar/fallar.
La decodificación sigue teniendo coste de memoria dependiente del raster original;
512 px no es un presupuesto aprobado de RAM ni garantía para imágenes máximas.

El módulo propio sin dependencias detecta recorridos oscuros horizontales/verticales,
con luminancia ponderada, contraste mínimo 60, corte de oscuridad hasta 200,
longitud mínima `max(20, ceil(lado*0.12))`, huecos de hasta cuatro píxeles entre
muestras oscuras y ocupación mínima 80 %. Agrupa filas/columnas adyacentes con
extremos similares (hasta cuatro píxeles), toma su centro y descarta bandas de
más de doce píxeles. Ordena por longitud y limita a cuarenta candidatos. Son
constantes del algoritmo en el raster reducido, **no criterios de precisión,
tiempo o rendimiento aprobados**. No hay probabilidades ni confianza ficticia.

Devuelve posibles líneas, no una interpretación arquitectónica. Puede confundir
cotas, texto, muebles o líneas duplicadas con muros, omitir trazos finos tras
reducir resolución, unir interrupciones pequeñas y fragmentar las mayores.
No detecta diagonales/curvas, pares de caras, habitaciones, puertas o ventanas;
no corrige perspectiva ni calibra. Puede abstenerse ante contraste bajo o fondos
uniformes. Reanalizar puede proponer otra vez muros ya aceptados: no deduplica
contra geometría existente. Revisar el centro, extremos y grosor manualmente.
Sin nuevos endpoints, servicios, analytics, workers o dependencias/licencias nuevas.

## Integración y revisión humana

Los candidatos solo existen en memoria de `tracing-ui.js`. Se muestran morados,
discontinuos y numerados S1… en una capa SVG que no captura gestos del editor.
La lista tiene botones de al menos 44 px, foco visible y activación teclado/toque.
El panel móvil es el drawer F1b existente: cerrarlo libera el espacio de trabajo;
el 3D usa el mismo proyecto y mantiene su canvas. No hay aceptación en bloque.

- **Aceptar:** crea un muro con `FloorPlanTracing.wall`, defaults y validaciones
  F1b; registra `source:{method:"suggested",review:"confirmed"}`. Solo la acción
  humana escribe geometría. Confirmar revisión no confirma escala o precisión.
- **Corregir:** diálogo con extremos X/Y en mm; cancelar no cambia el proyecto.
  «Aceptar muro corregido» valida y guarda con la misma procedencia/estado.
  Errores o coordenadas inválidas conservan el proyecto vivo sin escritura parcial.
- **Rechazar/descartar/cancelar:** elimina candidatos, sin crear historial ni cambiar
  geometría/calibración. Una respuesta tardía de análisis cancelado no los restaura.
- Cambiar imagen, transformación, escala o proyecto invalida candidatos y diálogo.
  El análisis en curso además compara el snapshot completo antes de publicar.
  Escape y Navegar/cancelar descartan propuestas. El trazado manual sigue accesible.

La persistencia, undo/redo, JSON, ZIP y 2D/3D reutilizan F1a/F1b. No hay segundo
modelo persistente ni migración: el schema vigente ya admite los enums usados y
permanece idéntico al embebido. IDs de muros sobreviven guardado/edición/historial.
Candidatos no aceptados no aparecen en JSON/ZIP. Editar un muro sugerido conserva
`method:"suggested"`, marca `unreviewed` y requiere nueva confirmación; W1 distingue
revisión pendiente de origen experimental ya revisado, sin ocultar este último.

## Privacidad y método de pruebas

Solo fixtures sintéticos propios, en particular `tests/fixtures/manual-plan.png`.
Playwright observa **todas** las peticiones intentadas, incluso bloqueadas, y
WebSockets, con service workers deshabilitados para la prueba. Solo permite GET
sin body ni query a los scripts locales y a Three.js 0.160.0 en jsDelivr.
Cualquier intento ajeno falla la aserción; abortarlo no lo convierte en éxito.
Las pruebas cubren importación, análisis, rechazo/corrección/aceptación, recarga,
ZIP y 2D/3D. No se envían imágenes ni JSON del proyecto en los recorridos medidos;
esto acredita esos recorridos, no constituye garantía sobre toda extensión futura.
Chromium no confía en el CA de acceso directo al CDN: el transporte de pruebas
existente usa curl con TLS verificado para los módulos oficiales. No cambia
política de red ni código de carga de la app. 3D: **SwiftShader, renderizado por
software**, sin acreditar GPU física, rendimiento de un teléfono ni precisión real.

## Capturas automatizadas

En cada tamaño, `*-review.png` muestra controles/candidatos, `*-2d.png` muestra el
proyecto tras recarga y `*-3d.png` la geometría aceptada en SwiftShader. Son
artefactos de recorridos con aserciones visuales (capa discontinua morada, tamaño
de controles, ausencia de overflow, canvas ≥60 % y píxeles renderizados), sin
comparación de píxeles con un baseline aprobado. Requieren revisión humana.

| Viewport | Revisión | 2D | 3D por software |
| --- | --- | --- | --- |
| 360×800 | [Captura](../qa/artifacts/f2/360x800-review.png) | [Captura](../qa/artifacts/f2/360x800-2d.png) | [Captura](../qa/artifacts/f2/360x800-3d.png) |
| 390×844 | [Captura](../qa/artifacts/f2/390x844-review.png) | [Captura](../qa/artifacts/f2/390x844-2d.png) | [Captura](../qa/artifacts/f2/390x844-3d.png) |
| 844×390 | [Captura](../qa/artifacts/f2/844x390-review.png) | [Captura](../qa/artifacts/f2/844x390-2d.png) | [Captura](../qa/artifacts/f2/844x390-3d.png) |
| 1440×900 | [Captura](../qa/artifacts/f2/1440x900-review.png) | [Captura](../qa/artifacts/f2/1440x900-2d.png) | [Captura](../qa/artifacts/f2/1440x900-3d.png) |

## Medición técnica sintética

Node v24.19.0, Linux x64 de este entorno cloud. Treinta llamadas al detector,
raster RGBA sintético 160×100 con tres trazos claros; sin decodificación, UI,
red ni teléfono físico. Ejecución `node --test tests/wall_assist.test.cjs`:
mediana 0,1472 ms, p90 por rango más cercano 0,2422 ms, tres candidatos.
Son observaciones de esa ejecución, no presupuestos ni resultados sobre planos reales.

## Verificación y publicación

Resultados ejecutados el 30-09-2026 (hora local Europe/Madrid):

| Comando real | Resultado |
| --- | --- |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/wall_assist.test.cjs tests/browser.test.cjs` | 98/98 aprobadas; 0 fallos/cancelaciones/omisiones; 274,40 s. Incluye regresiones F1a/F1b: importación, calibración, segunda cota, trazado, undo/redo, guardado, ZIP y 2D/3D. Ejecución previa al último ajuste de recuperación y a la octava prueba del detector. |
| `node --test tests/wall_assist.test.cjs` | 8/8 aprobadas, 0,143 s; incorpora registro técnico sintético sin umbral de rendimiento. |
| `node --test --test-name-pattern='F2 temporary' tests/browser.test.cjs` antes/después de corregir recuperación | Primero 1 fallo reproducido: análisis deshabilitado cuando falta blob local; después 1/1 aprobada, 3,05 s. |
| Repetición dirigida F2 (comando siguiente) | Repetición final tras la corrección: 13/13 aprobadas, sin fallos/cancelaciones/omisiones; ocho de algoritmo y cinco de navegador. Los cuatro recorridos de red observan 34 peticiones GET estáticas cada uno, cero intentos ajenos y cuatro candidatos en el fixture. |
| `python3 tests/schema.test.py` | 10/10 aprobadas; 0,237 s. Incluye igualdad schema canónico/embebido y rechazo de claves duplicadas. |
| `python3 tests/f2_readiness.test.py` | 12/12 aprobadas; 0,098 s. Las puertas de inventario conservan sus mínimos. |
| `node --check js/project-core.js`, `js/tracing-core.js`, `js/tracing-ui.js`, `js/wall-assist.js`, `tests/browser.test.cjs` y `tests/wall_assist.test.cjs` | Todos con código 0; sin errores. |
| `node --check /tmp/f2-inline-10.cjs` y `/tmp/f2-inline-12.mjs` | Ambos con código 0 tras extraer los scripts inline actuales. Importmap validado como JSON. |
| `git diff --check` | Código 0, sin errores. |

```bash
node --test --test-name-pattern='F2 |synthetic detector|clear strokes|short interruptions|blank, uniform|transparent strokes|sampling maps|explicit acceptance|invalid corrected' tests/wall_assist.test.cjs tests/browser.test.cjs
```

Una primera extracción de sintaxis trató el importmap JSON como JavaScript y
falló con `Unexpected token ':'`; se corrigió el extractor distinguiendo
importmap de scripts. Fue un error del comando auxiliar, no del producto. Un auxiliar de formato
documental también falló con `IndexError` antes de escribir; se corrigió después.
Los 98 tests completos no se repitieron tras la última corrección acotada: se
repitieron sus cinco recorridos F2 y los ocho de algoritmo sobre el código final.
No se ejecutaron mediciones en teléfono físico ni evaluación real con cinco/veinte
planos, ni revisión humana de Vercel. No se afirma que esas validaciones pasaran. La siguiente acción de evaluación
real es que Juanma prepare localmente el inventario autorizado y referencias,
registre las cinco sesiones y congele el conjunto de veinte, sin publicar sus bytes.


## Publicación inicial: bloqueo externo (estado previo a crear PR #9; supersedido)

Código/capturas publicados mediante `git push -u origin HEAD`, sin force push,
en [feat/f2-local-wall-assist](https://github.com/Juanmaes83/floorplan-3d/tree/feat/f2-local-wall-assist).
Commit funcional: `9e35908e9206738a34c3b9ac1d8bad3d1b3b2b61`. Este informe
recibe después una corrección documental, sin alterar el código probado.

Crear PR por REST con la descripción preparada dio exactamente:
`Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
No hay PR nueva creada por Codex; no se inventa un número ni se fusiona.
[Abrir PR hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/f2-local-wall-assist?expand=1).
Se intentó una consulta inicial con gh pr list (GraphQL) y también devolvió
Forbidden; no se insistió. La consulta posterior fue por REST y el listado
público HTML confirmó únicamente #1/#2/#3 abiertas antes de publicar.

Consultar check-runs por REST del commit funcional también dio `Forbidden`.
La [página pública de checks de ese SHA](https://github.com/Juanmaes83/floorplan-3d/commit/9e35908e9206738a34c3b9ac1d8bad3d1b3b2b61/checks)
muestra `Vercel / Vercel Preview Comments` succeeded (0 comentarios pendientes).
**Eso no demuestra un deployment READY** ni sustituye CI de tests. No se pudo
obtener una URL exacta de preview ni comprobar su SHA, estado o acceso humano.
Las rutas públicas de deployments y parciales de suites consultadas dieron 404;
no se cambió red/autenticación ni se hizo despliegue manual para suplirlo.

Pendiente concreto: abrir la PR mediante la integración de GitHub con permisos
y obtener de Vercel el deployment de su HEAD; verificar READY, SHA y URL/acceso
antes de revisión humana. No usar la preview histórica #7/#8 como esta entrega.
Las capturas publicadas permiten revisar los recorridos locales mientras tanto.


## Cierre de revisión y merge — PR #9 (30-09-2026)

- Juanma aprobó la PR #9 tras la revisión visual. Se fusionó a `master` con merge commit `10f7439b3fc86b0a0bd325d94531709d45cbcad4`; HEAD aprobado `3e3e6117770d97cb6e82f73fa06613d31a506019`.
- Vercel confirmó deployment `READY` con `githubCommitSha` igual al HEAD aprobado. [Preview protegida](https://floorplan-3d-git-feat-f2-local-82705b-juanma-espinosas-projects.vercel.app/) · [inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/DCTag9Sc5JH4j3sce8sA6LLZN9Wn). La revisión usó una URL temporal que expira; el token no se conserva en documentación.
- Verificación final disponible: suite completa 98/98 antes del último ajuste localizado; pruebas dirigidas F2 13/13 después del ajuste; schema 10/10 y recorder 12/12. No se repitió la suite completa tras la corrección acotada.
- La aprobación visual valida la revisión humana del prototipo, no la precisión del detector. Continúan pendientes las cinco sesiones manuales, el conjunto fijo de veinte planos reales autorizados con referencias independientes y los umbrales decididos por Juanma. Las capturas y fixtures sintéticos no sustituyen esos datos.
- El 3D se comprobó con SwiftShader. No hubo medición de rendimiento en un teléfono físico. No se hizo despliegue manual a producción.

**Siguiente etapa — evaluación F2:** conservar el prototipo como baseline de código; preparar datos y referencias localmente, medir primero la línea base manual de cinco sesiones y congelar el conjunto de veinte antes de evaluar el detector. No afinar parámetros ni presentar cifras de precisión/tiempo/cobertura hasta separar calibración y evaluación y acordar criterios. El proceso y límites están en [el protocolo F2](../qa/F2-entry-protocol.md) y el [roadmap](../ROADMAP.md).


## Decisión métrica y continuación de F2 (30-09-2026)

Juanma aprobó por la PR #10 el comparador offline de precisión/exhaustividad por longitud. Las diagonales quedan sin crédito en el comparador de ejes, pero se conservan en los denominadores globales; el informe presenta aparte exhaustividad en ejes soportados. La aprobación no fija tolerancia universal ni umbrales de producto y no valida F2. PR #10 está integrada en `master` mediante `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`.

F2 puede continuar desarrollándose sin esperar cinco sesiones ni veinte planos reales; esos datos se reservan para la validación empírica. Limitación concreta a resolver en una próxima entrega: las sugerencias crudas no aceptadas solo viven en memoria de `tracing-ui.js` y no pueden alimentar el evaluador sin reconstruirlas manualmente. Candidato de siguiente tarea: exportación explícita y local de predicciones crudas antes de revisión humana, sin imagen, red ni envío automático, con prueba de privacidad y formato compatible con el evaluador. La decisión final de formato/flujo debe comprobarse contra el código actual en la siguiente PR.


## Exportación cruda local en esta rama (30-09-2026)

[Formato, auditoría del marco y flujo](F2-raw-export.md): captura antes de
`toWorld`, descarga voluntaria calibrada y conversión local al evaluador. No
reconstruye predicciones desde geometría revisada ni persiste candidatos. Se
exporta antes de aceptar/corregir/rechazar; cualquier revisión invalida la
instantánea. Detector y contrato permanecen intactos. F2 sigue experimental y
no validada; cinco sesiones/veinte planos son evaluación empírica posterior,
no bloqueo para implementar este flujo.
