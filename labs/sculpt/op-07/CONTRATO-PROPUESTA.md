# OP-07 · Propuesta de contrato compatible (NO aplicada)

Es una propuesta: no cambia el contrato de producción. Aplicarla requiere la autorización de la cirugía S1 (ver [PLAN-CIRUGIA.md](PLAN-CIRUGIA.md)).

## 1. Principio

No hay un segundo modelo. El muro canónico de `project-core` sigue siendo el mismo y gana **dos campos opcionales**. Un muro sin ellos es exactamente el muro recto y a nivel de hoy: mismas medidas, presupuesto, DXF y 3D. Las pruebas de paridad del laboratorio lo acreditan.

```jsonc
{
  "id": "wal_…", "start": {"x": 0, "y": 0}, "end": {"x": 4000, "y": 0},   // mm, sin cambios
  "thicknessMm": 150, "heightMm": 2500,                                   // heightMm = altura en el inicio
  "curve": {"control": {"x": 2000, "y": 1500}},   // OPCIONAL · Bézier cuadrática, punto de control en mm
  "heightEndMm": 1200                              // OPCIONAL · altura en el final; si falta, = heightMm
}
```

## 2. Unidades: donante y RUBIK

| Concepto | openPlan3D | RUBIK (propuesta) |
|---|---|---|
| Coordenadas, grosor, alturas | cm | mm (×10) |
| Curva | `curvePoint` | `curve.control` (objeto ampliable sin romper) |
| Altura variable | `startHeight` / `endHeight`, con `height` heredada | `heightMm` (inicio) + `heightEndMm` (final) |
| Posición de abertura | `position` 0–1, **parámetro** cuadrático del **centro** | `offsetMm`, **distancia física** del borde izquierdo sobre la trayectoria |
| Ancho, alto y antepecho de abertura | cm | `widthMm`, `heightMm`, `sillHeightMm` |
| Área | m² (cm²/10 000) | mm² internamente, m² hacia fuera (como `quantity-core`) |

## 3. Reglas de validación

1. `curve.control`: `x` e `y` finitos. Un control alineado con la cuerda es válido y produce un muro recto; el editor puede eliminarlo.
2. `heightEndMm`: finito y > 0. Si es igual a `heightMm`, se puede omitir; el editor la normaliza.
3. Longitud del muro: la de la **trayectoria facetada** (16 tramos si hay curva), que es la misma en plano, 3D, cotas y presupuesto. En un muro recto equivale a `hypot(end-start)`.
4. Abertura: se mantiene `offsetMm + widthMm ≤ longitud`. La altura cambia: `sillHeightMm + heightMm ≤ min(altura en el borde izquierdo, altura en el borde derecho)`. En un muro a nivel es la regla actual. No hay recorte silencioso; el recorte del donante queda solo para dibujar.
5. Estancias: el anillo sigue las facetas de cada muro curvo de su contorno. Solo hay una altura de techo si todos los muros del contorno están a nivel y a la misma altura.

## 4. Consumidores: implicación y compatibilidad

| Consumidor | Hoy | Con la propuesta | Riesgo |
|---|---|---|---|
| `project-core.validate` | Rechaza un campo desconocido | Acepta los dos opcionales y aplica las reglas 1–4 | Un lector antiguo rechaza un proyecto nuevo. Exige una versión de esquema y una migración (S1) |
| `project-core.geometry` / `wallRect` | Rectángulo por muro | Un rectángulo por faceta y hueco; recto = idéntico | Plano, selección |
| `quantity-core.wall` | `length × heightMm`; superficie = 2 × cara | Cara bruta = trapecio por faceta. Superficie = cara izquierda + cara derecha (distintas en curva) | Presupuestos: solo cambian los muros que usan los campos |
| Superficies y perímetro de estancia | Polígono recto | Anillo facetado; área interior por barrido, descontando las huellas de muro | Paridad acreditada con el donante |
| `building-core` (plantas) | Altura por planta | `heightEndMm` es independiente de la planta. Un muro inclinado no fija el techo de la estancia | Escaleras y forjados: no cambian |
| Persistencia (F0.2) | JSON del proyecto | Los campos viajan en el mismo documento, sin almacén nuevo | Lector antiguo → versión de esquema |
| DXF (G-02, #265) | Línea por muro | `LWPOLYLINE` con las facetas (`facets`) | Una Bézier no es un arco DXF. Decidir entre facetas (paridad) o arco circular |
| 3D (`renderer`) | Caja por pieza | `slopedPiece` por pieza y faceta, con UV continuas | Sin Three.js en el núcleo |
| Editor (R03) | Arrastre de extremos | Arrastre del punto de control, `splitAt` por distancia | Sin un segundo editor: se amplía el vigente |
| Proyectos antiguos | — | Sin cambios: ningún muro tiene los campos | Ninguno |
| Lectores antiguos de un proyecto nuevo | — | `legacyView` degrada a cuerda y altura máxima e informa la pérdida | Solo lectura; nunca se guarda degradado |

## 5. Decisiones abiertas (para el responsable de producto)

- **D-OP07-1:** el tipo de curva. Recomendado: Bézier cuadrática, por paridad con el donante. La alternativa es el arco circular, más natural para DXF y obra, pero sin paridad.
- **D-OP07-2:** la superficie en curva. Recomendado: cara exterior + cara interior. La alternativa, 2 × eje, mantiene el criterio actual pero infla una cara y reduce la otra.
- **D-OP07-3:** el número de facetas. Recomendado: 16 fijas, como el donante. La alternativa es adaptativo por flecha máxima en mm.
