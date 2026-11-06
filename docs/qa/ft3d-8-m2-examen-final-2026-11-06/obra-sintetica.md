# Obra sintética del examen

**Todos los datos son inventados.** No hay clientes, direcciones, precios ni referencias catastrales reales. El único dato que se parece a una referencia catastral es `1907401VK4810H`, que sale del fixture sintético del repositorio (`tests/fixtures/catastro-cp-synthetic.gml`). El host oficial del Catastro se intercepta y **nunca se consulta**.

- Fuente ejecutable: `tests/qa-m2/obra-sintetica.cjs`. Hay una copia en `fixtures/obra-sintetica.cjs` y una instantánea de los datos en `fixtures/obra-sintetica.json`.
- El fixture se construye con los formatos y las API reales de RUBIK: `FloorPlanCore.validate`, `FloorPlanBuilding` y la biblioteca `rubik-sota-project-library-v1`.

## Biblioteca de proyectos

| Entrada | Proyecto | Propósito |
|---|---|---|
| `ent_qa-a` | `prj_qa-vivienda-obra` · «Vivienda QA obra nueva» | Vivienda de ejemplo de RUBIK convertida en **obra nueva**: todos los muros en `new` y norte a 12°. Contiene unos 152 elementos de inventario. |
| `ent_qa-b` | `prj_qa-vivienda-obra-2` · **mismo nombre visible** | Aislamiento: otra identidad y un muro distinto (+300 mm). |
| `ent_qa-p` | `prj_qa-emplazable` · «Vivienda QA emplazable» | Planta baja del fixture de edificio, con norte a 20°. Se usa en Catastro/GML. |
| `ent_qa-c` | `bld_fixture-house` · «Edificio QA dos plantas» | Edificio de dos plantas para DEC-06 y DEC-07. |
| (generado) | `prj_qa-grande-4` / `prj_qa-grande-8` | Carga para QA-22: la planta repetida 4 y 8 veces (unos 280 y 560 muros). Supera la validación. |

## Diez tareas y un hito (fechas de 2027)
El motor **no mueve fechas**: el auditor eligió fechas que cumplen exactamente cada dependencia.

| ID | Tarea | Material declarado | Inicio | Fin | Dependencias | Elementos (rol) | Partidas C1–C4 |
|---|---|---|---|---|---|---|---|
| T01 | Cimentación | Hormigón estructural | 03-01 | 03-10 | — | — (RUBIK no modela cimentación) | — |
| T02 | Estructura | Acero estructural | 03-11 | 03-24 | FS T01 +0 | 3 muros de carga (estructura) | — (C1–C4 no tiene partida de estructura) |
| T03 | Cerramientos exteriores | Fábrica cerámica | 03-25 | 04-14 | FS T02 +0 | 3 muros exteriores (construir) | `partition-new` 50 % |
| T04 | Tabiquería interior | Placas de yeso laminado | 03-28 | 04-20 | **SS** T03 **+3** | 3 tabiques (construir) | `partition-new` 50 % |
| T05 | Impermeabilización | Lámina | 04-15 | 04-21 | FS T03 +0 | cubierta (envolvente) | — |
| T06 | Aislamiento | Lana mineral | 04-17 | 04-28 | **SS** T05 **+2** | 3 muros exteriores (revestimiento) | — |
| T07 | Carpintería exterior | Aluminio | 04-15 | 04-30 | **FF** T06 **+2** | 3 ventanas (construir) | `opening:window` 100 % y `opening:sliding-door` 100 % |
| T08 | Fontanería | Tubería PEX | 03-31 | 04-23 | SS T04 +3 | — (RUBIK no modela instalaciones) | — |
| T09 | Pavimentos | Parqué de roble | 04-22 | 05-07 | FS T08 **−2** (desfase negativo) | 3 suelos (acabado) | 6 suelos y rodapié, cada uno al 100 % |
| T10 | Pintura y acabados | Pintura plástica | 04-26 | 05-12 | **FF** T09 +5 y **SF** T07 +0 | 3 tabiques (acabado) | `paint` 100 % |
| H01 | Fin de obra (hito) | — | 05-13 | 05-13 | FS T10 +0 | — | — |

- Hay **4 tipos de dependencia**: FS, SS, FF y SF.
- Los desfases son positivos (+2, +3, +5), cero y negativos (−2).
- `opening:door` queda **sin tarea a propósito**.
- Los materiales declarados (acero, aluminio, PEX…) son texto de la tarea. RUBIK **no** los convierte en materiales del modelo; se anota como límite del alcance, no como defecto.

## Economía

| Revisión | Contenido |
|---|---|
| **A** | IVA del 10 %. Diez precios propios: madera 38, gres 80×80 29,50, gres 60×60 27, antideslizante 31, nogal 44, rodapié 9,20, pintura 7,40, tabique nuevo 41,75, ventana 420 y corredera 690 €. **Sin precio:** mármol y puerta. |
| **B** | Tres precios cambiados a mano: gres 80×80 a 31,25, tabique a 43,10 y ventana a 455. Pintura con la referencia **BC3 sintética** `PINT-LISA`, columna 0, a 7,90 € y confirmada. Se **retira el precio** del nogal (queda sin valorar). |
| **C** | Reparto del tabique al 60 % (T03) y al 40 % (T04). Prueba de reparto por encima del 100 % (debe rechazarse) y cambio de fechas. |

- La referencia independiente se calcula **en céntimos enteros**: redondeo por línea e IVA por línea, como dice el contrato. También se calcula el IVA sobre el total para mostrar la diferencia de redondeo.
- El reparto entre tareas sigue el método de **restos mayores en céntimos** (contrato FT3D-8 0.2.0).
