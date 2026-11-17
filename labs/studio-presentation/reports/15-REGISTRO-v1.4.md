# 15 · Registro del delta v1.4 (N01–N08, RP-Q01–RP-Q12)

**Ámbito:** laboratorio `lab/studio-presentation-e0e1`. Nada de esto acredita el producto ni autoriza integrarlo.
**Mandatos:** `mandatos/RUBIK-SOTA-PROMPT-CLAUDE-DELTA-DOCUMENTAL-v1.4.md` y su anexo; correcciones V1–V5 e interpretaciones de `reports/14`. Índice y huellas: `mandatos/INDICE-MANDATOS.md`.

**Estados** (los del anexo §8):

| Estado | Significado |
|---|---|
| EXECUTED_PASS | Ejecutado sobre el candidato v1.4 y superado. |
| EXECUTED_FAIL | Ejecutado y no superado. |
| REUSED_VERIFIED | Evidencia anterior válida: mismas fuentes, dependencias, entorno y artefacto. |
| BLOCKED | Falta una fuente o un permiso. |
| NO_VERIFICADO | No se puede probar en este entorno. |
| N/A | No aplica. |
| EXPECTED | Planificado, aún no ejecutado. |

## Baseline congelada (cierre v1.3)

| Qué | Valor |
|---|---|
| Commit | `585fd9c` (rama del laboratorio) |
| Snapshot | `snapshot/snapshot.json`, SHA-256 `fcb6e19f…b390` |
| ZIP de cliente ES / EN | `a3f9958a…7bbe8` / `7a19c71a…01258` |
| ZIP del laboratorio | `309e077b…c1b07` |
| QA | 25 PDF con QA 0; web 42/42; exportador 72/72; reconstrucción ×2: 25/25 |
| Evidencia | `evidence/paquetes/`, `reports/13-REGISTRO-VIVO-v1.3.md` |

## N01 · Catálogo y selector de recetas RP01–RP21

**Qué existía:** 7 modalidades de entrega (`entrega.json` → `tipos`), el catálogo único de módulos, capítulos y documentos (`tools/catalogo-entrega.cjs`), el exportador con gates (`tools/exportar.cjs`), el verificador y «Preparar entrega».

**Qué se añade:**

| Pieza | Qué hace |
|---|---|
| `tools/recetas.cjs` | Catálogo de las 21 recetas (campos del anexo §5 N01), 6 perfiles, 3 fases y 43 fuentes evaluadas sobre el snapshot y el registro reales. `resolver()` devuelve el estado y, para una L, la selección del contrato v1.3 (modalidad, capítulos y documentos existentes). |
| `tools/receta-exportar.cjs` | Adaptador mínimo. Una L va a `exportar.cjs` **sin cambiar su contrato**. La receta y su versión quedan en la nota de la selección y en `<dir>.receta.json`, que liga la receta a la huella del ZIP. Una C, F o L bloqueada deja solo `<dir>.receta-rechazo.json`: ninguna carpeta, ZIP ni resumen. |
| «Preparar entrega», paso 1 | Filtros de perfil y fase (reversibles), lista con estado, detalle (qué obtendrás, qué falta, qué se omite, qué verificar). «Aplicar» rellena la selección libre, que sigue editable. C y F explican por qué no hay descarga. |
| `tools/recetas-qa.cjs` | Esquema, filtros, exportación real ES/EN de cada L, rechazo de cada C/F, negativos, navegador. |

**Interpretaciones aplicadas** (`reports/14` §3):

- Las aportaciones de fixture no cuentan en una L: los documentos actuales no las componen, así que la receta sigue parcial y lo dice.
- RP02 y RP09 comparten la selección y, por tanto, los bytes. Se acredita con las huellas del manifiesto, sin duplicar salida.
- El registro de la receta no entra en el manifiesto del cliente: el contrato del exportador no cambia. La evidencia es interna del laboratorio (`<dir>.receta.json`), como permite el anexo.

**Resolución sobre la entrega real** (`evidence/recetas/matriz-recetas.json`):

| Estado | Recetas |
|---|---|
| L completa | RP05, RP07 |
| L parcial (exportada; nombra lo que falta) | RP01, RP02, RP03, RP04, RP06, RP08, RP09, RP10, RP11, RP12 |
| C no elegible (sin descarga) | RP13, RP14, RP15, RP17, RP21 |
| F no disponible (sin descarga) | RP16, RP18, RP19, RP20 |

Resultados de las pruebas: ver la sección «RP-Q» más abajo.

## Continuidad del 17/11/2026

Rama remota y punto de partida `101fe167bd920c94c7e27938dfd3c22526dd9728`. Referencia de producto de solo lectura `8525025a1470d48d52d8e365070e5a0acf116134`. Las PR abiertas #246 y #247 apuntaban a master desde otras ramas. Se verificó un checkout limpio y disperso del laboratorio para evitar las rutas largas de las referencias VIS en Windows.

La fuente v1.2 está en `mandatos/` con su huella original. El bloqueo por ausencia de fuente de `reports/13` es histórico. Su §3.3 se sigue en H01–H08, §9 en D01–D18 y ST01–ST09, y §11 en A01–A06 más las ampliaciones v1.3. Las dos brechas editoriales de tamaño y contraste y la diferencia entre reconstrucción textual y visual se vuelven a evaluar con V13 y CONT. Se conservan E2–E7 como diagnóstico y planificación y D08 como decisión humana pendiente.

| ID | Requisito recuperado | Evidencia inicial y siguiente comprobación |
|---|---|---|
| V13-01 | Medir el texto efectivo de la escala gráfica, contando transformaciones SVG. | Aproximadamente 1,96 pt en PDF del candidato `cbdd24c`. Medir de nuevo en PDF, ES y EN. N02/N08. |
| V13-02 | Elevar la legibilidad de rótulos, usar números y leyendas donde falte espacio. | Rango observado 6,2–7,5 pt en `cbdd24c`. Reextraer del PDF y revisar visualmente. N02/N08. |
| V13-03 | Mejorar tamaño y contraste de pies editoriales. | Observación del candidato `cbdd24c`. Medir tipografía y contraste en la salida actual. N07/RP-Q09. |
| V13-04 | Recomponer láminas de estancias pequeñas, en especial el mirador, con localizador y escala honesta. | Observación visual de `cbdd24c`. Contrastar páginas ES/EN actuales. N02/N07. |
| V13-05 | Diferenciar Architecture Book, Interior Design Book y presentación integral por jerarquía y composición. | Observación visual de `cbdd24c`. Comparar las tres portadas. N07. |
| V13-06 | Revalidar foco visible efectivo, desplazamiento, navegación por teclado y zoom. | Incidencias del consumidor de `cbdd24c`. Reejecutar sobre paquetes reales. RP-Q09. |
| V13-07 | Entregar ZIP lab y digest externos ES/EN del candidato exacto. | Auditoría `cbdd24c`. Validar bytes e inventarios del cierre final. RP-Q10/RP-Q12. |
| V13-08 | Localizar textos y avisos de lector del manifiesto EN preservando claves, IDs y datos. | Auditoría `cbdd24c`. Inspeccionar ZIP inglés recién exportado. RP-Q09/RP-Q10. |
| V13-09 | Una sección vigente de handoff e histórico explícito. | Auditoría `cbdd24c`. El puntero de continuidad se actualiza desde `HANDOFF.md`. |
| CONT-01 | Comparación obligatoria y afirmativa de las rutas, huellas, selección e identidad común del adaptador y la UI. | Lectura estática `101fe167`: `eq !== false` también pasa con `null`. Pendiente prueba RP07 congelada. |
| CONT-02 | Separar receta consultada, selección activa y candidato descargable. | Lectura estática `101fe167`: al consultar C/F, el manejador de descarga sigue disponible. Pendiente prueba UI. |
| CONT-03 | Dos reconstrucciones independientes, conjuntos exactos, integridad, QA, idiomas, visual y salida no cero al discrepar. | Lectura estática `101fe167`: comparación de texto y páginas, medios A/B por intersección y sin puerta de salida. Pendiente ampliar y aplicar a ZIP final. |
