# MCP local — recorrido 2D con desvíos y anchura comprobable (cuarto corte de Etapa 1)

Herramienta `check_route_2d`, de solo lectura, en `tools/rubik-mcp/src/route.cjs`. Responde a una única pregunta:

> Dados dos puntos explícitos del mismo proyecto y una anchura explícita en milímetros, ¿existe en el plano 2D modelado un recorrido continuo para un disco de ese diámetro?

**Ninguna respuesta acredita** accesibilidad, evacuación, cumplimiento normativo, altura libre, transitabilidad real de una persona ni precisión física certificada. Una recta sin obstáculos o una cadena de puertas, como las de `inspect_pair_clearance`, no son «paso libre»; esta herramienta tampoco usa esa expresión.

## 1. Contrato geométrico

### 1.1 Agente y anchura

- El agente es un **disco 2D de diámetro `widthMm`** (radio r = `widthMm`/2). Su centro recorre la trayectoria.
- El disco cabe en un punto si su **distancia libre** (*clearance*) a todo obstáculo y al borde del dominio es como mínimo r.
- **El contacto es admisible:** el disco puede tocar un obstáculo, pero no invadirlo. La regla numérica es una sola en todo el algoritmo y en las pruebas: distancia libre ≥ r − 1·10⁻⁶ mm.
- Por tanto, un pasillo de exactamente `widthMm` admite el disco, y uno 0,01 mm más estrecho no.
- `widthMm` es **obligatorio**, positivo y como máximo 100 000 mm. No hay ancho por defecto ni ancho normativo.
- El disco no representa una persona, una silla de ruedas ni un mueble rectangular que gira.

### 1.2 Puntos inicial y final

- `start` y `end` son coordenadas `{x, y}` en mm del plano del JSON, con origen, ejes y giro según `coordinateSystem`. La respuesta las repite.
- No se infiere ningún punto, ni desde el centro de un mueble ni desde la etiqueta de una estancia.
- Cada punto debe estar **dentro de una sola región del dominio** (estancia o hueco de paso), sin tocar su borde, y no dentro de un obstáculo.
- Su distancia libre debe ser como mínimo r.
- En caso contrario el resultado es `no_evaluable`, con la causa y la distancia libre exacta del punto. Las causas posibles:
  - `point_outside_documented_domain`;
  - `point_on_region_boundary`, también en el límite entre dos estancias abiertas;
  - `point_in_several_regions`;
  - `point_inside_obstacle`;
  - `point_clearance_below_required`.

### 1.3 Dominio y obstáculos

**Dominio** (el suelo que el disco puede pisar) = unión de:

- los polígonos de todas las estancias;
- los subtramos de hueco de tipo `door`, `sliding-door` u `opening` con `sillHeightMm = 0`, cuyo subtramo de muro esté compartido por **exactamente dos estancias**, según la relación espacial de #40;
- las bandas de muros `demolished` compartidas por exactamente dos estancias.

**Una puerta no es transitable por existir:** pasa sólo si su subtramo cumple esas condiciones y el disco cabe por él. La anchura considerada es la **nominal del hueco**: no se descuentan hoja, marco, tope ni maniobra.

**Obstáculos**:

- los tramos sólidos de muros activos, reconstruidos como en `inspect_pair_clearance`;
- las ventanas;
- los huecos no transitables: antepecho distinto de 0, o sin dos estancias;
- las huellas giradas de muebles (`T.footprint`).

Las alfombras (`rug`) y los splits de pared (`acwall`) no son obstáculo en planta, con la misma regla de apilado que `layout-review`. Se listan en `ignoredObjects`.

**Borde del dominio:**

- Se calcula partiendo cada arista de estancia y de hueco por sus cruces con las demás.
- Un trozo es borde si, a 0,001 mm a cada lado, el dominio está sólo en uno. Dos estancias que comparten arista sin muro quedan, por tanto, comunicadas («planta abierta»).
- Las aristas de los obstáculos son siempre borde.
- El borde de una estancia limita el recorrido aunque no haya un muro dibujado.

**Geometría no evaluable:**

- estancias solapadas más de 1 mm² (`rooms_overlap`);
- huecos solapados en un mismo muro (`openings_overlap`);
- un polígono que no se puede triangular.

Estos casos no se evalúan: no se elige una estancia. Un JSON que no cumple `FloorPlanProjectV1` se **rechaza**; `diagnose_project` sigue pudiendo explicarlo.

**Cobertura geométrica:** polígonos cóncavos, extremos libres de muro (la banda termina en el extremo del eje), esquinas, giros, muebles girados y muebles empotrados o en contacto (la unión de obstáculos no deja hueco).

### 1.4 Escala

La geometría se calcula en los milímetros del modelo. `scaleConfidence` se devuelve siempre.

- Con escala `estimated` o `pending`, el estado se mantiene, porque describe el modelo.
- Además, `limits` añade «los milímetros del modelo no están confirmados físicamente».
- Una anchura «demostrada» con escala estimada no es una medida física.

## 2. Algoritmo y garantías

Sea S el conjunto de segmentos del borde del dominio y de los obstáculos. El espacio libre es F = {p del dominio : d(p, S) ≥ r − 10⁻⁶}.

1. **Recta.** Si el segmento start–end tiene distancia exacta (segmento–segmento) ≥ r a todo S, la ruta es esa recta. Como la distancia es positiva, la recta no cruza S y queda en el dominio.
2. **Quadtree certificado.** Celdas cuadradas de lado h, con h₀ = r/2 y el lado más fino 0,25 mm. La semidiagonal es hd = h·√2/2 y c es el centro de la celda.
   - **Libre:** c está en el dominio y d(c, S) ≥ r + hd. Por Lipschitz, todos los puntos de la celda tienen distancia ≥ r y están en el dominio.
   - **Bloqueada:**
     - c está fuera del dominio y hd < r;
     - d(c, S) + hd < r;
     - existe un segmento s tal que max sobre las cuatro esquinas de d(·, s) < r (la distancia a un segmento es convexa: su máximo en el cuadrado está en una esquina);
     - o existe un par s, t tal que max sobre las esquinas de (d(·, s) + d(·, t))/2 < r. Así se cierran pasillos y huecos estrechos sin refinar todo su interior.
   - **Incierta** en cualquier otro caso.
3. **Búsqueda A\*** sobre celdas no bloqueadas, con vecindad 8 completa entre celdas de distinto tamaño. Las celdas inciertas penalizan y sólo se refinan las del camino encontrado; el ciclo se repite.
4. **Positivo:** el camino está formado sólo por celdas libres. Se construye una polilínea por centros y puntos de contacto entre celdas, cada tramo dentro de una celda cerrada libre.
   - Se simplifica uniendo puntos con tramos que se comprueban **de forma exacta**.
   - **La polilínea final se vuelve a verificar por fuerza bruta** contra todos los segmentos, sin índice. Si esa verificación fallase, el resultado sería `evidencia_insuficiente` (`internal_verification_failed`), nunca positivo.
   - Si sólo quedan celdas inciertas sin refinar, se intenta llevar los puntos al centro entre sus dos elementos opuestos más próximos. El resultado vuelve a verificarse de forma exacta.
5. **Negativo:** si A\* agota las celdas no bloqueadas sin llegar al final, ninguna curva continua de F une los puntos. Toda curva continua recorre celdas 8-adyacentes, y ninguna celda bloqueada contiene puntos de F.
6. **Incertidumbre:** si sólo hay conexión por celdas de 0,25 mm sin resolver y la reparación no supera la verificación, el resultado es `evidencia_insuficiente` (`margin_below_resolution`). Ocurre cuando el margen frente al ancho pedido es menor que la resolución, en torno a ±0,35 mm.

La discretización no puede producir un positivo falso: todo positivo es una polilínea verificada de forma exacta. Tampoco un negativo falso: las celdas bloqueadas tienen cota demostrada. Lo que no se puede demostrar en ninguno de los dos sentidos queda como incertidumbre.

## 3. Respuesta

| Campo | Contenido |
| --- | --- |
| `status` | `recorrido_demostrado_en_modelo_2d`, `bloqueado_por_geometría_documentada`, `evidencia_insuficiente`, `no_evaluable` o `límite_de_cálculo` |
| `rule` | Regla del disco, del contacto, de la tolerancia, del dominio, de los obstáculos y de las garantías |
| `request`, `endpoints` | Puntos y anchura pedidos; región y distancia libre exacta de cada punto, con el elemento más cercano |
| `units`, `plane`, `coordinateSystem`, `scaleConfidence` | `mm`, `2d`, marco del JSON y confianza de escala |
| `trajectory` | Puntos ordenados (en coma flotante exacta, reproducibles), número de tramos, longitud y método. Sólo si el estado es positivo |
| `limiting` | `widthMm` = 2 × distancia libre mínima **exacta sobre la trayectoria devuelta**, con los elementos que la fijan, el punto del camino y el del elemento. Otra trayectoria podría admitir más |
| `traversed` | Estancias y huecos por orden de entrada |
| `reasons` | Bloqueo, incertidumbre, no evaluable o presupuesto (ver §4) |
| `startRegion` | En un bloqueo: elementos que acotan la región alcanzable desde el inicio |
| `computation` | Método, celdas, iteraciones, celda inicial y más fina, número de segmentos |
| `snapshot`, `limits`, `ignoredObjects` | Hash SHA-256 del archivo, límites de interpretación y muebles no considerados obstáculo |

## 4. Razones de bloqueo

Las razones de bloqueo se calculan **después** de demostrar la separación y no afectan al estado.

- `gap_narrower_than_required`: dos elementos a menos de `widthMm`.
  - La distancia es exacta y va con sus puntos.
  - El punto medio del hueco está sobre suelo documentado.
  - **Separa** la región alcanzable desde el inicio de otro espacio libre: a un lado se llega al inicio y al otro a espacio libre exterior a esa región.
  - Por ejemplo, las dos jambas de una puerta estrecha o un mueble y un muro.
- `contact_closes_passage`: un mueble toca otro elemento y cierra así el paso.
- `opening_narrower_than_required`: un hueco transitable cuya anchura nominal es menor que `widthMm`.
- `opening_not_passable`: ventana, antepecho distinto de 0 o hueco que no está entre dos estancias.
- `no_documented_passage_from_start_region`: no se identifica ningún hueco; por ejemplo, un muro continuo.

## 5. Presupuestos

Cuando se agota un presupuesto, el resultado es siempre `límite_de_cálculo`, nunca bloqueado ni demostrado.

| Presupuesto | Límite |
| --- | --- |
| Muebles | 100 |
| Muros | 500 |
| Huecos | 500 |
| Estancias | 200 |
| Vértices de estancia | 4000 |
| Segmentos de borde | 20 000 |
| Entradas del índice espacial | 4 000 000 |
| Celdas iniciales | 200 000 |
| Celdas totales | 250 000 |
| Iteraciones de refinado | 400 |
| Tiempo por consulta | 6 s |
| Puntos de trayectoria | 200 |
| Evidencias por lista | 10 |

La respuesta sigue limitada a 750 KiB por el lector común.

**Determinismo:** con el mismo archivo y la misma petición, la respuesta es idéntica. El límite de tiempo es una salvaguarda: si se alcanza, depende de la máquina y se informa como `time_budget`.

## 6. Ejemplos

Las peticiones son las del fixture `tools/rubik-mcp/fixtures/route-projects.cjs`. Las respuestas, abreviadas, están en el [informe QA](../qa/local-mcp-route-2d-2026-10-18.md).

```json
check_route_2d({"start":{"x":1000,"y":2000},"end":{"x":5000,"y":2000},"widthMm":800})
```

## 7. Límites que permanecen

- Es un modelo 2D. No contempla:
  - altura de paso ni dinteles;
  - la hoja de la puerta en ninguna posición;
  - la maniobra de una persona o de un objeto no circular;
  - pendientes ni escalones;
  - mobiliario no documentado.
- Un borde de estancia sin muro dibujado limita el paso. Un muro sin estancia a ambos lados no crea un paso.
- No se garantiza encontrar el camino más corto ni el más ancho: `limiting` describe la trayectoria devuelta.
- Un margen inferior a unos 0,35 mm frente al ancho pedido, sin solución exacta, queda en `evidencia_insuficiente`.
- Tolerancias internas:
  - 10⁻⁶ mm en la admisión del contacto;
  - 10⁻⁶ mm para un punto sobre un borde;
  - 0,001 mm en la sonda de bordes;
  - 10⁻⁷ mm en la colinealidad.

  Un detalle del plano por debajo de 0,001 mm puede clasificarse mal y no tiene significado en Rubik, que guarda milímetros enteros.
