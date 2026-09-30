"""Original mathematical synthetic bench. MIT: assets/f3/LICENSE.txt.

Generate with --output PATH; --check verifies the tracked fixture byte for byte.
No source models, brands, images or downloaded geometry.
"""
import argparse
import json
import struct
from pathlib import Path


def generate():
    vertices, normals, indices = [], [], []
    faces = [
        ((1, 0, 0), [(1,-1,-1),(1,1,-1),(1,1,1),(1,-1,1)]),
        ((-1, 0, 0), [(-1,-1,1),(-1,1,1),(-1,1,-1),(-1,-1,-1)]),
        ((0, 1, 0), [(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]),
        ((0, -1, 0), [(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)]),
        ((0, 0, 1), [(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),
        ((0, 0, -1), [(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)])]

    def box(cx, cy, cz, width, height, depth):
        for normal, points in faces:
            base = len(vertices)//3
            for x, y, z in points:
                vertices.extend([cx+x*width/2, cy+y*height/2, cz+z*depth/2])
                normals.extend(normal)
            indices.extend([base,base+1,base+2,base,base+2,base+3])

    box(0, .42, 0, .6, .06, .4)
    for x in [-.25, .25]:
        for z in [-.15, .15]:
            box(x, .195, z, .05, .39, .05)
    v = struct.pack('<%sf' % len(vertices), *vertices)
    n = struct.pack('<%sf' % len(normals), *normals)
    i = struct.pack('<%sH' % len(indices), *indices)
    binary = v+n+i
    binary += b'\0' * ((-len(binary)) % 4)
    document = {
        'asset': {'version':'2.0','generator':'Rubik Sota synthetic rectangular bench generator'},
        'scene':0, 'scenes':[{'nodes':[0]}],
        'nodes':[{'mesh':0,'translation':[1,2,3],'rotation':[0,2**-.5,0,2**-.5],'scale':[2,2,2]}],
        'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
        'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.6,.35,.18,1],'metallicFactor':0,'roughnessFactor':.8}}],
        'buffers':[{'byteLength':len(binary)}],
        'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(v),'target':34962},
                       {'buffer':0,'byteOffset':len(v),'byteLength':len(n),'target':34962},
                       {'buffer':0,'byteOffset':len(v)+len(n),'byteLength':len(i),'target':34963}],
        'accessors':[{'bufferView':0,'componentType':5126,'count':len(vertices)//3,'type':'VEC3','min':[-.3,0,-.2],'max':[.3,.45,.2]},
                     {'bufferView':1,'componentType':5126,'count':len(normals)//3,'type':'VEC3'},
                     {'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}]}
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * ((-len(encoded)) % 4)
    return (struct.pack('<4sII',b'glTF',2,12+8+len(encoded)+8+len(binary))+
            struct.pack('<II',len(encoded),0x4e4f534a)+encoded+
            struct.pack('<II',len(binary),0x004e4942)+binary)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        fixture = Path(__file__).resolve().parents[1]/'assets/f3/synthetic-bench.glb'
        if fixture.read_bytes() != generate():
            parser.exit(1, 'Synthetic fixture differs from original generator\n')
        print('Synthetic GLB: byte-identical to generator')
    elif args.output:
        args.output.write_bytes(generate())
    else:
        parser.error('Choose --check or --output PATH')
