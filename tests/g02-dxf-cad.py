"""Independent CAD check for the synthetic G-02 DXF used in CI and review."""

from collections import Counter
from sys import argv

import ezdxf


def main(path):
    drawing = ezdxf.readfile(path)
    audit = drawing.audit()
    assert not audit.errors and not audit.fixes, (audit.errors, audit.fixes)
    assert drawing.dxfversion == "AC1021"
    assert drawing.units == 4  # millimetres
    assert drawing.layers.get("RUBIK_WALL_FOOTPRINT").is_off()
    model = drawing.modelspace()
    room_text = [e.dxf.text for e in model.query('TEXT[layer=="ROOMS"]')]
    assert room_text == ["Salón-dormitorio", "Baño"], room_text
    assert any(e.dxf.text == "3760 mm" for e in model.query('TEXT[layer=="DIMENSIONS"]'))
    assert any(
        abs(e.dxf.start.x - 3000) < 0.001
        and abs(e.dxf.start.y + 120) < 0.001
        and abs(e.dxf.end.x - 3000) < 0.001
        and abs(e.dxf.end.y + 3880) < 0.001
        for e in model.query('LINE[layer=="DIMENSIONS"]')
    )
    assert len(model.query('ARC[layer=="DOORS"]')) == 2
    assert len(model.query('LINE[layer=="WINDOWS"]')) == 2
    print(f"ezdxf {ezdxf.__version__}, {drawing.dxfversion}, mm, {dict(Counter(e.dxftype() for e in model))}")
    print("CAD audit: 0 errors, 0 repairs")


if __name__ == "__main__":
    main(argv[1])
