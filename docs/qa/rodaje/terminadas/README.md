# §4 · Imágenes terminadas y cómo reanudar

**Código:** rama `claude/rodaje-4k`. Los renders se hicieron con `blender-rodaje.py` de `0e8e0c1bee68cd9282883cb9fd9d64af92459911`.
El commit que publica esta carpeta se indica en la respuesta de entrega; el script no ha cambiado desde `0e8e0c1b`.

**Equipo:** 4 CPU lógicas, 15 GB de RAM, sin GPU, Cycles CPU (Blender 5.2.1 LTS como módulo `bpy`) y OIDN.
**Escena:** ZIP exportado por la interfaz de RUBIK, proyecto de ejemplo `f2-rot30`, `rubik-estancias.json` 1.1.0.

## Terminadas

| Archivo | Qué es | Resolución | Tiempo |
|---|---|---|---|
| `1440/detalle-antes-materiales-visor.png` | Detalle con la luz final y los materiales del visor (comparativa controlada) | 2560×1440 | 299,5 s |
| `1440/detalle-despues-acabado-actual.png` | Detalle con la misma cámara, luz y exposición, y el acabado actual | 2560×1440 | 555,5 s |
| `1440/detalle-antes-despues-5120x1440.png` | Los dos anteriores, uno junto a otro | 5120×1440 | — |
| `1440/recortes/{tapiceria,madera-y-objetos,vegetacion-flores}.png` | Recortes 1:1, a la izquierda el antes y a la derecha el después | 1:1 | — |
| `1440/interior-f0000-acabado-anterior.png` | Fotograma 0 del interior con el acabado ANTERIOR (referencia) | 2560×1440 | 454 s |
| `720/detalle-acabado-actual.png`, `720/balcon-acabado-actual.png` | Revisión rápida del detalle y del balcón | 1280×720 | 69 s / 44 s |
| `720/segundo-proyecto-f3-openings.png` + `-informe.json` | Segundo proyecto por el flujo del kit (`sh rodar.sh revision interior dia 0-0`) | 1280×720 | 24,8 s |
| `720/vivienda-ejemplo-informe.json` | Informe del mismo flujo en la vivienda de ejemplo | — | 56,9 s |
| `1440/interior-{antes-materiales-visor,despues-acabado-actual}.png` + `interior-antes-despues-5120x1440.png` + `recortes/interior-{alfombra,exterior-tras-vidrio,sofa}.png` | Interior con comparativa controlada (misma cámara, luz y exposición) | 2560×1440 | 303,2 s / 459,0 s |
| `4k-aereo/f0000…f0004.png` + `rodaje-report.json` | 5 de 48 fotogramas del aéreo de día, 4K nativo, pausado (acabado anterior al pase de realismo) | 3840×2160 | 73,8–106 s |

## En curso / pendiente

- **Comparativa controlada a 1440p** (`r1440.sh`, se lanza desde la carpeta de trabajo). Hechas: detalle e interior, antes y después.
  - Falta: balcón antes y después.
- **Tramo en movimiento a 1440p** (con alfombra, sombras y vidrio) y comparación de dos muestreos: pendiente de lanzar.
- **MP4 completo:** espera la aprobación visual.

## Comandos exactos para reanudar

Carpeta de trabajo: `/tmp/claude-0/-home-user/f18da444-ec78-5298-b836-06fe16cf01e3/scratchpad/rodaje`.
`V` = entorno con `bpy` 5.2.1 en `/tmp/claude-0/-home-user-floorplan-3d/f18da444-ec78-5298-b836-06fe16cf01e3/scratchpad/V`.
Cada orden continúa por el primer fotograma que falte y nunca rehace uno ya terminado.

```bash
# Comparativa controlada 1440p: las tomas ya hechas se saltan solas
cd /tmp/claude-0/-home-user/f18da444-ec78-5298-b836-06fe16cf01e3/scratchpad/rodaje && nohup bash r1440.sh > r1440.log 2>&1 &
```

```bash
# Aéreo 4K de día (5/48 hechos), sigue en f0005 (acabado ANTERIOR; para el acabado actual, usar otra carpeta de salida)
$V/bin/python /home/user/rodaje/scripts/interop/blender-rodaje.py -- prep-f5-furniture f5-furniture a4k --profile entrega4k --shot aereo --light dia --seconds 2
```

```bash
# En el ordenador del profesional, desde el ZIP descomprimido de RUBIK › Entregar › Escena para Blender
sh rodar.sh entrega1440 interior dia
```

`rodar.sh` es reanudable, igual que el resto del kit.
