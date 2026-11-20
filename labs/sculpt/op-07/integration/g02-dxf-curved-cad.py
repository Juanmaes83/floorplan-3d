"""OP-07 · lectura INDEPENDIENTE (ezdxf, la misma versión fijada en CI) del DXF de un proyecto 2.0 con un muro curvo e
inclinado. Esto no es la aceptación en dos CAD comerciales, que sigue pendiente (arquitecto): es auditoría,
unidades, una huella de 4 vértices por faceta y el área de las huellas frente al núcleo (facetas = grueso × trayectoria).
Uso: python g02-dxf-curved-cad.py archivo.dxf esperado.json"""
import json, math
from collections import Counter
from sys import argv
import ezdxf

def main(path, expected_path):
    exp = json.load(open(expected_path))
    drawing = ezdxf.readfile(path)
    audit = drawing.audit()
    assert not audit.errors and not audit.fixes, (audit.errors, audit.fixes)
    assert drawing.dxfversion == "AC1021" and drawing.units == 4
    model = drawing.modelspace()
    feet = [e for e in model.query('LWPOLYLINE[layer=="RUBIK_WALL_FOOTPRINT"]')]
    assert all(len(list(e.get_points("xy"))) == 4 and e.closed for e in feet), "huellas de 4 vértices cerradas"
    def area(e):
        p = list(e.get_points("xy"))
        return abs(sum(p[i][0] * p[(i + 1) % 4][1] - p[(i + 1) % 4][0] * p[i][1] for i in range(4))) / 2
    assert len(feet) == exp["footprints"], (len(feet), exp["footprints"])
    total = sum(area(e) for e in feet)
    assert abs(total - exp["footprintAreaMm2"]) / exp["footprintAreaMm2"] <= 1e-4, (total, exp["footprintAreaMm2"])
    assert len(model.query('ARC[layer=="DOORS"]')) == exp["doors"]
    assert len(model.query('LINE[layer=="WINDOWS"]')) >= exp["windows"]
    print(f"ezdxf {ezdxf.__version__}, {drawing.dxfversion}, mm, {dict(Counter(e.dxftype() for e in model))}")
    print(f"huellas {len(feet)} (4 vértices, cerradas), área leída {total/1e6:.4f} m² vs núcleo {exp['footprintAreaMm2']/1e6:.4f} m²; muro curvo: {exp['facets']} facetas = grueso × trayectoria {exp['pathMm']:.1f} mm")
    print("CAD audit: 0 errors, 0 repairs")

if __name__ == "__main__":
    main(argv[1], argv[2])
