# MCP local — QA del cuarto corte de Etapa 1: recorrido 2D con desvíos y anchura (18-10-2026)

Rama `feat/rubik-mcp-route-2d`, creada desde `master` `d9cd11ba587d8c68bfa9d3a598958be28a0e0206` (tras #56). Los cambios se limitan a `tools/rubik-mcp` y a la documentación. No cambian el contrato `FloorPlanProjectV1`, el editor ni las herramientas anteriores.

Este corte es independiente del estudio LoRA LAB de #48 y no saca conclusiones sobre él.

## 1. Qué se entrega

`check_route_2d({start, end, widthMm})` es una consulta MCP de solo lectura. Contrato completo: [recorrido 2D](../technical/local-mcp-route-2d.md).

- **Agente:** un disco 2D de diámetro `widthMm`, con el contacto admitido (tolerancia de 10⁻⁶ mm).
- **Puntos:** explícitos. No se infieren desde muebles ni etiquetas.
- **Dominio y obstáculos:**
  - el dominio son las estancias, más los huecos de paso con antepecho 0 compartidos por dos estancias, más los muros demolidos compartidos;
  - son obstáculos los tramos sólidos, las ventanas, los huecos no transitables y las huellas giradas de muebles.
- **Positivo:** polilínea verificada por fuerza bruta con distancias segmento–segmento exactas. `limiting.widthMm` es exacto sobre esa trayectoria.
- **Bloqueo:** quadtree con celdas bloqueadas demostradas:
  - cota de Lipschitz;
  - convexidad de la distancia a un segmento;
  - cota por pares de segmentos.

  Agotar las celdas no bloqueadas demuestra la separación.
- **Otros estados:** `evidencia_insuficiente` si el margen queda por debajo de la celda de 0,25 mm; `no_evaluable` si la petición o la geometría no se pueden evaluar; `límite_de_cálculo` si se agota un presupuesto.
- **Seguridad:** se reutiliza el lector existente:
  - archivo explícito, sin symlinks;
  - 15 MiB de entrada y 750 KiB de respuesta;
  - validación canónica por consulta y SHA-256;
  - bytes intactos.

  Un JSON inválido se rechaza; `diagnose_project` lo sigue explicando.

## 2. Ejemplos reales

Salidas de `tools/rubik-mcp/fixtures/route-projects.cjs`, abreviadas: se omiten `rule`, `limits`, `coordinateSystem` y el hash.

### Ruta con desvío

Sala de 6000×4000 con una mesa de 1000×2000 en el centro (x 2500–3500, y 1000–3000) que corta la recta. Debajo y encima quedan 1000 mm.

```json
check_route_2d({"start":{"x":1000,"y":2000},"end":{"x":5000,"y":2000},"widthMm":800})
→ {"status":"recorrido_demostrado_en_modelo_2d",
   "trajectory":{"points":[{"x":1000,"y":2000},{"x":2350,"y":550},{"x":4000,"y":600},{"x":5000,"y":2000}],
                 "segments":3,"lengthMm":5352.384,"method":"quadtree_certificado"},
   "limiting":{"widthMm":829.9220699570744,"basis":"exacta_sobre_la_trayectoria_devuelta",
               "elements":[{"id":"obj_table","kind":"object","pathPoint":{"x":3512.569,"y":585.229},
                            "elementPoint":{"x":3500,"y":1000},"segmentIndex":1,"distanceMm":414.961}]},
   "traversed":{"regionIds":["rom_hall"],"openingIds":[]},
   "computation":{"method":"quadtree_certificado","leaves":900,"iterations":3,"initialCellMm":200,"finestCellMm":0.25,"segments":24}}
```

El disco de 800 mm pasa por debajo de la mesa. La trayectoria devuelta deja 829,92 mm junto a la esquina (3500, 1000): ese es el valor exacto para esta trayectoria, no la anchura máxima posible del hueco, que es de 1000 mm.

### Puerta insuficiente

Dos estancias separadas por un muro de 100 mm con una puerta de 700 mm.

```json
check_route_2d({"start":{"x":2000,"y":2000},"end":{"x":6000,"y":2000},"widthMm":800})
→ {"status":"bloqueado_por_geometría_documentada","trajectory":null,
   "reasons":[
     {"code":"opening_narrower_than_required","openingId":"opn_middle","kind":"door","widthMm":700,"requiredMm":800},
     {"code":"gap_narrower_than_required","elements":[{"id":"opn_middle","kind":"opening_edge"},{"id":"rom_west","kind":"room_boundary"},{"id":"wal_middle","kind":"solid_wall"}],
      "gapMm":700,"requiredMm":800,"points":[{"x":4000,"y":2300},{"x":4000,"y":1600}]}, …],
   "startRegion":{"boundingElements":[…],"separatingGapCount":3}}
```

Con la puerta de 900 mm, el mismo par da `recorrido_demostrado_en_modelo_2d`, con `traversed.openingIds:["opn_middle"]`. Con una ventana de 900 mm, el resultado es bloqueado con `opening_not_passable`, `reason:"window"`.

### Caso no evaluable

Punto inicial a 300 mm de la mesa con un disco de 800 mm (radio 400).

```json
check_route_2d({"start":{"x":2200,"y":2000},"end":{"x":5000,"y":2000},"widthMm":800})
→ {"status":"no_evaluable","trajectory":null,
   "reasons":[{"code":"point_clearance_below_required","point":"start","clearanceMm":300,"requiredMm":400,
               "nearestElement":{"id":"obj_table","kind":"object","point":{"x":2500,"y":2000}}}]}
```

## 3. Matriz de pruebas

Comando: `tools/rubik-mcp/test/route.test.cjs`.

- Un **verificador independiente** reconstruye los obstáculos y el suelo desde el JSON sin usar `route.cjs`. Comprueba cada tramo y cada giro de la trayectoria de dos formas:
  - de forma exacta contra todas las aristas de los obstáculos (y contra las de la estancia cuando sólo hay una);
  - muestreando el disco cada 5 mm a lo largo del camino, en 36 direcciones y 5 radios, contra el suelo.
- En los casos negativos se comprueba la razón concreta y su medida.

| Caso | Resultado esperado y comprobado |
| --- | --- |
| Recta libre | Demostrado, 1 tramo, anchura limitante exacta de 2000 mm (fijada por el muro oeste) |
| Recta bloqueada con desvío | Demostrado, ≥ 2 tramos; el verificador confirma cada tramo |
| Dos rutas: 1000 mm debajo y 700 mm encima | Para 800 mm, ningún punto pasa por encima de la mesa; para 1100 mm, bloqueado con huecos de 700 y 1000 |
| Pasillo de 799, 800 y 801 mm, ancho 800 | 799 bloqueado (hueco de 799 en `rom_corridor`); 800 demostrado con anchura exacta de 800; 801 demostrado con 801 |
| L de 900 mm y L de exactamente 800 mm | Ambas demostradas; la de 800 con anchura limitante 800 |
| L con armario en la esquina exterior | Los extremos caben (450 mm libres), pero hay bloqueo: hueco de 707,106 mm (500·√2) entre el armario y la esquina interior |
| Estancia cóncava | La cuerda sale del polígono; la ruta gira y queda dentro |
| Puerta de 900 / 700 / ventana / puerta con antepecho | Demostrado por la puerta / `opening_narrower_than_required` 700 / `opening_not_passable` window / `sill_above_floor` |
| Extremo de muro con 2000 mm libres / con 700 mm | Rodea el extremo (y ≥ 4400) / bloqueado, hueco de 700 con `wal_part` |
| Mueble girado 30° | 800 bloqueado; hueco exacto 1600 − y máx. de la huella; 500 demostrado |
| Mueble empotrado en el muro | Demostrado, anchura limitante exacta de 900 |
| Mueble en contacto con el muro | Bloqueado, hueco de 750 |
| Inicio dentro de un mueble, a 300 mm, fuera de las estancias, en el límite entre estancias | `no_evaluable` con `point_inside_obstacle`, `point_clearance_below_required` (300, `obj_table`), `point_outside_documented_domain` y `point_on_region_boundary` respectivamente |
| Estancias solapadas / huecos solapados / polígono que se autointerseca | `rooms_overlap` (3 000 000 mm²) / `openings_overlap` / rechazo `FloorPlanProjectV1` en la herramienta, explicado por `diagnose_project` |
| Escala `estimated` y `pending` | Mismo estado geométrico; `limits` avisa de que los milímetros no están confirmados |
| Poste de 10×10 en un pasillo de 1500 | 800 bloqueado (hueco de 745); 700 demostrado |
| Muro de 10 mm sin hueco | Bloqueado; `wal_thin` acota la región de inicio |
| Bloques tocándose por la esquina / a 1 mm en diagonal | `contact_closes_passage` en (2800, 800) / hueco de 1,414: nunca un paso falso |
| Márgenes de −1, −0,01, 0, +0,01 y +1 mm junto a piezas giradas 0°, 17° y 45° | Hasta 0 mm, demostrado (verificado); con +0,01 mm o más, bloqueado con el hueco exacto ±0,001 |
| Presupuestos | Celdas iniciales, celdas totales, iteraciones y geometría (101 muebles) → `límite_de_cálculo`, nunca bloqueado ni demostrado |
| Petición sin anchura, con anchura 0, negativa, NaN, sin `end` o > 100 000 | Error explícito |
| Determinismo | Dos ejecuciones dan una respuesta idéntica en tres casos |
| Plantilla de Rubik (13 estancias, 70 muros, 22 huecos, 46 muebles) | Dormitorio principal → salón con 600 mm: demostrado por `opn_door-1`, verificado. Cocina → dormitorio infantil con 900 mm: bloqueado; nombra la corredera `opn_slide-1` de 815 mm. Ambas consultas en menos de 5 s |
| Lector de archivo | Hash correcto, bytes iguales, respuesta < 750 KiB, sin ruta, `sourceImages`, `data:image` ni el documento |

**Contraste aleatorio** (`test/route-crosscheck.test.cjs`, semillas 42 y 20261018, 30 escenas cada una):

- Escenario: una sala de 3000×2000 con entre 2 y 6 muebles girados al azar y un ancho de 300 a 900 mm.
- Se compara con una búsqueda por fuerza bruta en celdas de 10 mm que no comparte código. Si existe una cadena de celdas con distancia ≥ r + 7,08 mm, el resultado debe ser «demostrado»; si no existe ni con r − 7,08 mm, debe ser «bloqueado».
- Además, cada trayectoria devuelta se remuestrea cada 2 mm.
- Antes de fijar las semillas se exploraron otras 332 escenas aleatorias con el mismo criterio: **0 bloqueos falsos, 0 positivos falsos y 0 violaciones de trayectoria**.

**Plantilla, comprobación independiente adicional (no automatizada, porque tarda minutos):** se inundó a fuerza bruta, con celdas de 10 mm, el suelo de las estancias y los huecos con un margen de r − 7,08 mm. Desde la etiqueta de la cocina no se alcanza la del dormitorio principal con 400 mm, ni la del comedor. Coincide con el bloqueo que devuelve la herramienta.

- **Motivo en el modelo:** el borde abierto entre la cocina y el comedor (x = 2180, y 5796–7400, 1604 mm sin muro) lleva a un hueco que cierran el frigorífico `obj_template-023` y las sillas y la mesa `obj_template-024` a `026`. Para 400 mm, la herramienta nombra entre otros los huecos de 205 mm (frigorífico–silla), 146,372 mm (mesa–silla) y 257,751 mm (frigorífico–borde de la cocina).
- Es un **hecho del modelo**, no una afirmación sobre la vivienda.

## 4. Resultados en el SHA final

**Entorno:** Linux, Node v22.22.0, npm 10.9.4.

| Comando | Resultado |
| --- | --- |
| `cd tools/rubik-mcp && npm ci --no-audit --no-fund && npm test` | 46 PASS, 0 FAIL, 0 SKIP |
| `npm run check` | PASS |
| `npm audit --audit-level=high --omit=dev` | 0 vulnerabilidades |
| `TMPDIR=$PWD/.qa-tmp node --test tests/project.test.cjs tests/layout-review.test.cjs tests/tracing.test.cjs tests/room-layout.test.cjs tests/building.test.cjs tests/library.test.cjs` | 108 PASS, 0 FAIL, 0 SKIP |
| `ls tests/*.test.cjs \| grep -v browser \| xargs node --test` | 237 tests: 235 PASS, 0 FAIL, 2 SKIP (preexistentes) |
| `python3 tests/*.test.py` (5 archivos) | 5 PASS |
| `python3 scripts/check-documents.py` sobre los documentos modificados | PASS |

Las pruebas stdio comprueban que:

- la herramienta aparece con anotaciones de solo lectura;
- una ruta se demuestra con el mismo hash que el resumen;
- tres peticiones inválidas devuelven error sin tumbar el servidor;
- un JSON inválido se rechaza mientras `diagnose_project` sigue respondiendo.

**Sin ejecutar:**

- **CI:** si GitHub Actions vuelve a terminar sin pasos, por facturación, se registra como «CI no ejecutada», no como CI verde.
- **Navegador:** no se ejecutaron pruebas de navegador; este corte no toca la aplicación.

## 5. Qué queda cerrado de la Etapa 1 y qué no

**Cerrado en el modelo 2D, pendiente de auditoría:**

- relaciones por estancia (#40);
- diagnóstico y medidas (#41);
- obstáculos y cadena de puertas (#43);
- con este corte, un **recorrido continuo con desvíos y giros para una anchura explícita**, que cubre:
  - extremos de muro;
  - puertas con anchura nominal;
  - ventanas;
  - muebles girados, empotrados y en contacto;
  - estancias cóncavas.

  Los resultados positivos están verificados; los bloqueos, demostrados.

**No se declara cerrada la Etapa 1**:

- Falta validarla con proyectos reales de escala `real`. Todos los fixtures y la plantilla tienen escala `estimated` o `pending`.
- La hoja, el marco y la maniobra de puerta no se modelan: la anchura es la nominal.
- No se modelan altura, dinteles, escalones ni pendientes. El agente es un disco, no una persona ni un mueble rectangular.
- El borde de una estancia limita aunque no haya un muro dibujado: un plano mal dibujado puede bloquear un paso real.
- Los márgenes inferiores a unos 0,35 mm sin solución exacta quedan en `evidencia_insuficiente`.

Este corte no aprueba las Etapas 2–4.
