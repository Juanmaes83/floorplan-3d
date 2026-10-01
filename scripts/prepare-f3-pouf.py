"""Reproducible F3 pilot texture reduction; requires existing Pillow 12.3.0.
Original GLB is retained. No source repo changes, geometry edits or network.
"""
import argparse
import hashlib
import io
import json
import struct
from pathlib import Path
import PIL
from PIL import Image

INPUT_SHA = 'f293f011748cb7687beb9e664ca5133eed55beae2c20011453a520c3a1b9f8d0'

def prepare(data):
    if PIL.__version__ != '12.3.0':
        raise ValueError('Exact Pillow version 12.3.0 required for reproducible bytes')
    if hashlib.sha256(data).hexdigest() != INPUT_SHA:
        raise ValueError('Source GLB hash differs')
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+size])
    binary = data[28+size:]
    image_views = [doc['bufferViews'][im['bufferView']] for im in doc['images']]
    output = bytearray(binary[:min(v['byteOffset'] for v in image_views)])
    for im, view in zip(doc['images'], image_views):
        source = binary[view['byteOffset']:view['byteOffset']+view['byteLength']]
        with Image.open(io.BytesIO(source)) as image:
            if im['mimeType'] != 'image/jpeg' or image.size != (1613, 1613):
                raise ValueError('Unexpected source image')
            resized = image.convert('RGB').resize((1024, 1024), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            resized.save(encoded, format='JPEG', quality=85, subsampling=0,
                         optimize=False, progressive=False)
        output.extend(b'\0' * (-len(output) % 4))
        view['byteOffset'], view['byteLength'] = len(output), len(encoded.getvalue())
        output.extend(encoded.getvalue())
    doc['buffers'][0]['byteLength'] = len(output)
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    output.extend(b'\0' * (-len(output) % 4))
    result = (struct.pack('<4sII', b'glTF', 2, 28+len(encoded)+len(output)) +
              struct.pack('<II', len(encoded), 0x4e4f534a) + encoded +
              struct.pack('<II', len(output), 0x004e4942) + output)
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    original = root / 'assets/f3/original-stockholm-pouf-80586139.glb'
    served = root / 'assets/f3/stockholm-pouf-80586139.glb'
    result = prepare(original.read_bytes())
    if args.check:
        if served.read_bytes() != result:
            parser.exit(1, 'Optimized model differs from reproducible conversion\n')
    else:
        served.write_bytes(result)
    print('Pillow '+PIL.__version__+'; output '+str(len(result))+' bytes; SHA256 '+hashlib.sha256(result).hexdigest())
