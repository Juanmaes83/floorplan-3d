# OP-07 · Decisiones aprobadas y pulido final del laboratorio

**18/11/2026.** El responsable de producto aprobó las tres decisiones. Siguen siendo decisiones de laboratorio: no cambian producción ni el contrato canónico.

| ID | Decisión aprobada | Cómo queda en el núcleo |
|---|---|---|
| D-OP07-1 | Bézier cuadrática, extensible a arcos circulares | `curve` es un objeto: `{control}` hoy; un futuro `{kind:'arc', …}` solo toca `point`, `split`, `bounds` y `minRadius`. El resto de consumidores usa facetas |
| D-OP07-2 | Superficies independientes de ambas caras | `faceAreas` devuelve `left`, `right` y `centre`, cada una con longitud, bruta, huecos y neta, más `revealsMm2` aparte |
| D-OP07-3 | 16 facetas de base, preparadas para resolución adaptativa por tolerancia métrica | `facetCount(w, {toleranceMm})`: 16 por defecto (paridad con el donante). Con tolerancia, el mínimo que garantiza la desviación pedida, nunca menos de 16 ni más de 1024 |

## 1. Superficies reales por cara

- **Cada cara** es el desfase en inglete de las facetas, a ±grosor/2. Por faceta, la cara mide k × el eje, y **izquierda + derecha = 2 × eje exacto**: los términos del inglete se anulan. Así, D-OP07-2 no altera el total de un presupuesto agregado; solo reparte bien cada cara.
- **Pendiente:** la misma altura en ambas caras. Cada faceta es un trapecio.
- **Huecos:**
  - se resta la unión de huecos, y los solapes cuentan una vez;
  - en una curva, el hueco es más ancho en la cara exterior (mochetas perpendiculares al muro);
  - mochetas: jambas, dintel y alféizar si hay antepecho, con la profundidad del grosor; se informan aparte.
- **Sin recorte silencioso:** una abertura que no cabe, o un muro inválido, deja huecos, neta y mochetas en `null`, con `complete:false`. Es el mismo criterio que `quantity-core`.
- **Reglas nuevas de muro (`validateWall`):**
  - curva más cerrada que medio grosor, es decir, la cara interior se anula: `minRadius` es exacto, porque B'×B'' es constante en una cuadrática;
  - curva que se pliega sobre sí misma;
  - altura final no válida.

## 2. Precisión y conservación (medido)

La desviación máxima entre una faceta y la curva es **exacta**: |P0 − 2P1 + P2| / (4n²). Se alcanza en el centro de cada faceta.

| Caso (grosor 240) | 16 facetas: desviación / error de longitud | Tolerancia 1 mm: facetas / desviación / error de longitud |
|---|---|---|
| Típico, 4 m, flecha de control 1,5 m | 2,93 mm / 1,17 mm | 28 / 0,96 mm / 0,38 mm |
| Pronunciado, 3 m, control 2,8 m | 5,47 mm / 3,21 mm | 38 / 0,97 mm / 0,57 mm |
| Largo, 60 m, control 20 m | **39,06 mm / 14,45 mm** | 100 / 1,00 mm / 0,37 mm |

- **Divisiones sucesivas exactas.** 10 cortes: las piezas son la curva original (< 1e-6 mm), quedan unidas exactamente, y la longitud real y las alturas se conservan (1e-9).
- **Divisiones con redondeo a mm entero**, como guarda `project-core` hoy. 12 cortes: las piezas siguen unidas exactamente y la peor deriva es **0,51 mm**. La cota teórica es 0,71 mm por generación.
- **Aberturas tras dividir.** Se anclan por el parámetro de su centro, no por «desplazamiento − longitud del primer trozo». Con 16 facetas, en una curva fuerte de 8 m, el hueco se mueve **5,1 mm** en planta al refacetar. Con tolerancia 0,1 mm se mueve **0,011 mm**.
- **Muro recto de 100 m, 20 cortes:** longitud exacta (1e-12) y altura sobre la pendiente original.

**Conclusión para la cirugía.** Las 16 facetas son correctas en muros típicos, pero no en muros largos o muy curvos: en esos casos las mediciones, el DXF y la posición de los huecos tras dividir se apartan varios milímetros. Se recomienda activar en S1–S3 una tolerancia global única de **1 mm**, como política del motor y no como dato del muro, para que plano, 3D, DXF y presupuesto sigan usando las mismas facetas.

## 3. Protección frente a guardados degradados

| Defensa | Qué evita |
|---|---|
| `legacyView` congelada y marcada (`DEGRADED`), con `assertSavable` | Guardar en memoria la vista degradada de un lector antiguo |
| `detectLoss(prev, next, intent)` | Lo que sobrevive a JSON: curva, pendiente, muro o abertura perdidos sin una intención explícita (`straightened`, `leveled`, `removed`, `removedOpenings`, `split`) |
| `featuresOf` y `writerFeatures` | Que un escritor que no conoce `wall.curve` o `wall.heightEnd` sobrescriba un proyecto que los usa |
| `guardSave` | Lo anterior más las reglas de muro y abertura, en un único veredicto con causas nombradas |
| `splitAt` → `blocked` | Que una abertura cortada por la división desaparezca: queda bloqueada y nombrada, y el guardado la detecta si se pierde |

Los proyectos sin los campos nuevos pasan el guardado igual que hoy, incluso con un escritor antiguo.

## Validación

```bash
node --test labs/sculpt/op-07/tests/op07.test.cjs labs/sculpt/op-07/tests/op07-polish.test.cjs   # 34/34, local
```

Sin repetir el baseline del donante: los 19 casos de paridad siguen verdes tras el pulido, y se añaden 15 casos sintéticos dirigidos.
