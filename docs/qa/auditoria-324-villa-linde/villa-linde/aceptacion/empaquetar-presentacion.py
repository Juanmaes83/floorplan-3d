import hashlib
import json
from pathlib import Path
import sys
import zipfile

folder=Path(sys.argv[1])
items={
 'LEEME-PRESENTACION.md': 'LEEME.md',
 '../villa-linde-propuesta-baja.png':'01-planos/Planta-baja.png',
 '../villa-linde-propuesta-primera.png':'01-planos/Planta-primera.png',
 'villa-linde-baja.dxf':'01-planos/Planta-baja.dxf',
 'villa-linde-primera.dxf':'01-planos/Planta-primera.dxf',
 'villa-linde-aprobada.json':'02-modelo/Villa-Linde.json',
 'presentacion-edificio.zip':'02-modelo/Presentacion-y-modelo.zip',
 'P1-rubik-sota-recorrido-villa-linde-planta-baja.mp4':'03-videos/Recorrido-cinematografico.mp4',
 '04-dibujo-vivo.webm':'03-videos/Dibujo-vivo-dos-plantas.webm',
 '07-HERO-dibujo-vivo.webm':'03-videos/HERO-FINAL.webm',
 'evolucion-producto.mp4':'04-evolucion/Evolucion-demostracion.mp4',
 'evolucion-cliente.html':'04-evolucion/Presentacion-evolucion.html',
 'evolucion-manifiesto.json':'04-evolucion/Manifiesto-evolucion.json',
 'material-board.png':'05-laminas/Materiales-baja.png',
 'blueprint-lamina.png':'05-laminas/Blueprint-baja.png',
 'despiece-lamina.png':'05-laminas/Despiece-baja.png',
 'blender-baja/previsualizacion/rom_linde-b-12.png':'06-renders/Salon-planta-baja.png',
 'blender-primera/previsualizacion/rom_linde-p-11.png':'06-renders/Dormitorio-planta-primera.png',
 'villa-historia.zip':'07-variante/Propuesta-suelo-salon.zip',
}
archive=folder/'Villa-Linde-presentacion-conceptual.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 manifest=[]
 for source,target in items.items():
  data=(folder/source).read_bytes()
  if not data:
   raise RuntimeError(f'Archivo vacío: {source}')
  z.writestr(target,data)
  manifest.append({'archivo':target,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 z.writestr('manifiesto.json',json.dumps({'sha_rubik':'5a061725573c8bf9796f365d3dee1708484c6723','archivos':manifest},ensure_ascii=False,indent=2))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for entry in manifest:
  assert hashlib.sha256(z.read(entry['archivo'])).hexdigest()==entry['sha256']
print(f'{archive.name} · {len(manifest)} archivos comprobados · {archive.stat().st_size} bytes')
