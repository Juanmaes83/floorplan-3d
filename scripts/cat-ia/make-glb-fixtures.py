"""CAT-03 synthetic GLB fixtures: original rectangular solids made here (no source models, brands or downloads).
Own permission: assets/f3/LICENSE-cat-ia.txt. Metres, scale 1, no rotation: x = width, y = height, z = depth.
Run: python3 -I scripts/cat-ia/make-glb-fixtures.py --write | --check (byte-identical)."""
import argparse, hashlib, json, struct
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
FACES = [((1,0,0),[(1,-1,-1),(1,1,-1),(1,1,1),(1,-1,1)]),((-1,0,0),[(-1,-1,1),(-1,1,1),(-1,1,-1),(-1,-1,-1)]),
         ((0,1,0),[(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]),((0,-1,0),[(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)]),
         ((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)])]

def glb(boxes, colour, generator):
    vertices, normals, indices = [], [], []
    for cx, cy, cz, w, h, d in boxes:
        for normal, points in FACES:
            base = len(vertices)//3
            for x, y, z in points:
                vertices.extend([cx+x*w/2, cy+y*h/2, cz+z*d/2]); normals.extend(normal)
            indices.extend([base,base+1,base+2,base,base+2,base+3])
    xs, ys, zs = vertices[0::3], vertices[1::3], vertices[2::3]
    v = struct.pack('<%sf' % len(vertices), *vertices); n = struct.pack('<%sf' % len(normals), *normals); i = struct.pack('<%sH' % len(indices), *indices)
    binary = v+n+i; binary += b'\0' * ((-len(binary)) % 4)
    doc = {'asset':{'version':'2.0','generator':generator},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],
           'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
           'materials':[{'pbrMetallicRoughness':{'baseColorFactor':colour,'metallicFactor':0,'roughnessFactor':.7}}],
           'buffers':[{'byteLength':len(binary)}],
           'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(v),'target':34962},{'buffer':0,'byteOffset':len(v),'byteLength':len(n),'target':34962},
                          {'buffer':0,'byteOffset':len(v)+len(n),'byteLength':len(i),'target':34963}],
           'accessors':[{'bufferView':0,'componentType':5126,'count':len(vertices)//3,'type':'VEC3','min':[min(xs),min(ys),min(zs)],'max':[max(xs),max(ys),max(zs)]},
                        {'bufferView':1,'componentType':5126,'count':len(normals)//3,'type':'VEC3'},{'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}]}
    enc = json.dumps(doc, separators=(',',':')).encode(); enc += b' ' * ((-len(enc)) % 4)
    return struct.pack('<4sII',b'glTF',2,12+8+len(enc)+8+len(binary))+struct.pack('<II',len(enc),0x4e4f534a)+enc+struct.pack('<II',len(binary),0x004e4942)+binary

def sideboard():  # 1600 x 780 x 450 mm: body on four legs
    legs = [(x, .04, z, .05, .08, .05) for x in (-.74, .74) for z in (-.19, .19)]
    return glb([(0, .43, 0, 1.6, .70, .45)] + legs, [.62,.45,.3,1], 'Rubik Sota CAT-03 synthetic sideboard generator')

def oven():  # 595 x 595 x 548 mm: housing plus a recessed door panel
    return glb([(0, .2975, -.01, .595, .595, .528), (0, .27, .264, .5, .4, .02)], [.78,.79,.81,1], 'Rubik Sota CAT-03 synthetic oven generator')

FILES = {'assets/f3/cat-ia-aparador-lumen.glb': sideboard, 'assets/f3/cat-ia-horno-h60.glb': oven}
if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); g = p.add_mutually_exclusive_group(required=True); g.add_argument('--write', action='store_true'); g.add_argument('--check', action='store_true'); a = p.parse_args()
    for rel, make in FILES.items():
        data = make(); path = ROOT/rel
        if a.check:
            if path.read_bytes() != data: p.exit(1, rel+' differs from the generator\n')
        else: path.write_bytes(data)
        print(rel, len(data), hashlib.sha256(data).hexdigest())
