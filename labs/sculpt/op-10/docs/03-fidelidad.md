# OP-10 · 03 · Fidelidad geométrica A ↔ B ↔ C

- **A** = proyecto canónico observado en el visor tras cargar el fixture (`project.json`, mm).
- **B** = mallas realmente visibles en el visor (`scene.json`, m, Y arriba).
- **C** = la misma escena abierta en Blender 5.2.1 LTS y devuelta al marco Y-up (`blender-geometry.json`).

Comparadores: `src/compare.cjs` (A↔B y A↔C, el mismo código) y `src/roundtrip.cjs` (C↔B).

## Tolerancias propuestas (de EXPORTACIÓN, no de precisión arquitectónica)

| Nombre | Valor | Justificación |
|---|---|---|
| `exact` | 1,0 mm | Misma geometría reexpresada: float32 del buffer, redondeo a 1 µm y matriz de mundo. Medido: desviación máxima **0,001 mm** |
| `area` | 0,5 % | Área de suelo triangulada (polígonos cóncavos). Medido: 0 % |
| `envelope` | 2,0 mm | Mallas procedimentales que deben caber en su caja declarada (clase **visual**) |
| C↔B | 1 µm por vértice | Ida y vuelta Blender. Medido: **0,000 mm** |

Que estas tolerancias se cumplan prueba que la **exportación** no deforma lo visible. No dice nada de la exactitud del proyecto frente a la obra real: los fixtures son sintéticos y la escala del F4 se declara estimada.

## Comprobaciones

**Contractuales** (deben pasar):
- muros: espesor, eje, altura, base (con muros-dintel), longitud y saliente de esquina;
- estancias: área de suelo (restando huecos de escalera) y límites;
- huecos: un rayo perpendicular al muro por el centro del hueco no toca el muro;
- objetos: presencia y centro dentro de su caja;
- elementos de techo R02-A: centro y cota;
- escalera: número de peldaños y cota de llegada;
- plantas: desplazamiento y cota relativa.

**Visuales** (se miden y se declaran; no son contrato):
- mobiliario procedimental que sobresale de su caja (cabecero hasta 50 mm, tiradores 20–54 mm);
- piezas que el visor coloca por regla: encimera 862 mm, poyete 450 mm, lavabo suspendido 330 mm, zapatero 150 mm;
- estancias dibujadas como plataforma: poyetes de 450 mm.

## Resultados (ejecución final `run.cjs`, [E])

| Escenario | A↔B contractual | Visuales declaradas | Sin ID → asociadas a huecos | C↔B | C↔A | Reapertura |
|---|---|---|---|---|---|---|
| F1 rectangular | 31 / 0 fallos | 0 | 7 → 6 (+1 lámpara) | 0,000 mm | 31 / 0 | PASS 8/8 |
| F2 girada 30° | 599 / 0 | 32 | 108 → 97 | 0,000 mm (446.541 vértices) | 599 / 0 | PASS |
| F3 huecos | 63 / 0 | 0 | 18 → 18 | 0,000 mm | 63 / 0 | PASS |
| F4 edificio, vista activa | 55 / 0 | 0 | — | 0,000 mm | 55 / 0 | PASS |
| F4 edificio, apilado | 55 + 32 / 0 | 0 | — | 0,000 mm | 87 / 0 | PASS |
| F5 mobiliario + catálogo | 601 / 0 | 35 | 108 → 97 | 0,000 mm | 601 / 0 | PASS |
| F6 R02-A + R03 | 602 / 0 | 34 | 108 → 97 | 0,000 mm | 602 / 0 | PASS |

**Total:** 2.038 comprobaciones contractuales A↔B, 0 fallos; las mismas sobre C, 0 fallos; C↔B exacto en 1,4 M vértices.

## Hallazgos durante la escultura (corregidos en la expectativa, no en los datos)

1. **Muros-dintel:** un muro cuyo hueco a ras de suelo ocupa toda su longitud solo tiene sólido por encima del hueco. La base esperada es la cota superior del hueco. En la variante girada, el redondeo deja una franja de 0,4 mm que el visor sí dibuja: la cobertura se exige a 1 µm.
2. **Hueco de forjado:** en la planta alta, el suelo de la estancia carece exactamente de 2.160.000 mm² = 900 × 2.400 mm, la huella de la escalera. Se resta en la expectativa.
3. **Estancias plataforma:** los poyetes se dibujan como un volumen de 450 mm; la huella se mide en su cara superior.

## Marco y unidades verificados

Visor: `x=(x−OX)/1000`, `y` arriba, `z=(y−OY)/1000`, `OX/OY = Core.geometry(project).center`. Es el **mismo marco que `scripts/interop/export.cjs`**. Factor aplicado: **1** (el 0,01 del donante no aplica). Blender: `(XB, YB, ZB) = (x, −z, y)`, una sola vez y registrado en la escena (`scene["op10"].transform`). Planta activa en `y = 0`; en vista apilada, la planta alta a +3,1 m y desplazada su `offsetMm`.
