#!/usr/bin/env python3
"""Selected PNG albedo derivatives from a pinned library; no sphere/site captures.
Requires the existing Pillow installation. Does not alter network configuration.
"""
import concurrent.futures, hashlib, io, json, pathlib, urllib.request
from PIL import Image, ImageStat, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/materials'
LIB_PIN='fcc4ff97a5a843dc2e242ec9e195389bc46ed7d2'
AUTHOR_PIN='b1a6aa13afc03ae00860f6ac5fe6d5daf8e95356'
LIB='Papyszoo/CC0-Public-Domain-Textures'
RAW=f'https://raw.githubusercontent.com/{LIB}/{LIB_PIN}/'
CHOICES={
 'wood': [('wood_floor','Tablón de madera natural'),('herringbone_parquet','Parqué en espiga'),('diagonal_parquet','Parqué diagonal'),('rectangular_parquet','Parqué rectangular'),('oak_wood_planks','Tablones de roble'),('old_wood_floor','Suelo de madera envejecida'),('wood_floor_worn','Madera con desgaste'),('wood_floor_deck','Tarima de madera'),('wood_planks','Madera de veta abierta'),('wood_planks_grey','Tablón gris rústico')],
 'ceramic': [('square_tiles','Mosaico cerámico ajedrezado'),('brown_floor_tiles','Baldosas marrones'),('floor_tiles_02','Cerámica de trama fina'),('floor_tiles_04','Baldosas geométricas'),('floor_tiles_06','Cerámica de junta marcada'),('floor_tiles_08','Baldosas de patrón alterno'),('floor_tiles_09','Cerámica de trama modular'),('interior_tiles','Baldosas de interior'),('large_floor_tiles_02','Baldosas de gran formato'),('long_white_tiles','Azulejos blancos alargados')],
 'stone': [('marble_01','Mármol de veta natural'),('marble_tiles','Losas de mármol'),('marble_mosaic_tiles','Mosaico de mármol'),('slate_floor','Suelo de pizarra'),('slate_floor_02','Pizarra de bloques irregulares'),('slate_floor_03','Pizarra de textura estratificada'),('stone_floor','Losas de piedra'),('monastery_stone_floor','Piedra de monasterio'),('granite_tile_02','Baldosas de granito'),('mixed_stone_tiles','Mosaico de piedra mixta')],
 'mineral': [('brushed_concrete','Hormigón cepillado'),('brushed_concrete_03','Cemento estriado'),('concrete_floor_01','Hormigón de suelo'),('concrete_floor_02','Hormigón de grano fino'),('concrete_floor_03','Hormigón mineral'),('hangar_concrete_floor','Hormigón de acabado industrial'),('smooth_concrete_floor','Cemento liso'),('scuffed_cement','Cemento desgastado'),('terrazzo_tiles','Terrazo de agregados'),('granular_concrete','Hormigón granular')],
 'wall': [('white_plaster_02','Yeso blanco fino'),('grey_plaster_03','Yeso gris mineral'),('grey_plaster_02','Yeso gris de grano visible'),('painted_plaster_wall','Yeso pintado'),('patterned_plaster_wall','Yeso de trama decorativa'),('plastered_wall_03','Revoco mate artesanal'),('plastered_wall_04','Revoco gris liso'),('blue_plaster_wall','Revoco azul'),('yellow_plaster','Revoco amarillo'),('patterned_clay_plaster','Arcilla de trama decorativa')]
}
def download(url):
 cache=pathlib.Path('/tmp/rubik-surface-source-cache');cache.mkdir(exist_ok=True);cached=cache/hashlib.sha256(url.encode()).hexdigest()
 if cached.exists():return cached.read_bytes()
 with urllib.request.urlopen(url,timeout=30) as r:
  if r.status!=200: raise ValueError(f'HTTP {r.status}: {url}')
  data=r.read();cached.write_bytes(data);return data
def metadata(p,size):
 data=p.read_bytes()
 return {'path':p.relative_to(ROOT).as_posix(),'format':'image/webp','width':size[0],'height':size[1],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def main():
 OUT.mkdir(exist_ok=True,parents=True);licenses=OUT/'licenses';licenses.mkdir(exist_ok=True)
 library=json.loads(download(RAW+'packs/polyhaven-textures/store-manifest.json'))
 assert library['creator']=='Poly Haven' and library['license']=='CC0'
 indexed={json.loads(e['metadataJson'])['sourceUrl'].rsplit('/',1)[-1]:e for e in library['items']}
 evidence={
  'POLY-HAVEN-asset-license.json':f'https://raw.githubusercontent.com/Poly-Haven/polyhaven.com/{AUTHOR_PIN}/public/locales/en/license.json',
  'POLY-HAVEN-license-page.tsx.txt':f'https://raw.githubusercontent.com/Poly-Haven/polyhaven.com/{AUTHOR_PIN}/pages/license.tsx',
  'LIBRARY-CC0.txt':RAW+'LICENSE',
  'LIBRARY-README.txt':RAW+'README.md',
  'LIBRARY-conversion-script.mjs.txt':RAW+'scripts/convert-to-ktx2.mjs'
 }
 for filename,url in evidence.items():(licenses/filename).write_bytes(download(url))
 assert 'You can redistribute them' in (licenses/'POLY-HAVEN-asset-license.json').read_text()
 def prepare(choice):
  family,aid,name=choice;item=indexed[aid];meta=json.loads(item['metadataJson'])
  source_path=next(f['path'] for f in item['files'] if f['role']=='Texture:Albedo' and f['path'].endswith('_albedo_preview.png'))
  data=download(RAW+source_path);im=Image.open(io.BytesIO(data));im.load();original=list(im.size)
  assert im.format=='PNG' and max(im.size)<=512 and min(im.size)>=128
  im=im.convert('RGB');assert max(ImageStat.Stat(im).stddev)>3,f'Low-contrast candidate {aid}: {ImageStat.Stat(im).stddev}'
  im.thumbnail((512,512),Image.Resampling.LANCZOS);dest=OUT/(aid.replace('_','-')+'.webp');im.save(dest,'WEBP',quality=88,method=6)
  sample=im.copy();sample.thumbnail((112,112),Image.Resampling.LANCZOS);thumb=OUT/(aid.replace('_','-')+'-sample.webp');sample.save(thumb,'WEBP',quality=80,method=6)
  color='#'+''.join(f'{round(x):02x}' for x in ImageStat.Stat(im.resize((1,1))).mean)
  return {'id':'surface-'+aid.replace('_','-'),'name':name,'family':family,'applications':['wall'] if family=='wall' else ['floor','wall'],'tags':[aid.replace('_',' '),name], 'color':color,'roughness':.92 if family in ['wall','mineral'] else .65,'source':{'assetId':aid,'title':item['name'],'author':'Poly Haven; individual artist not stated in library manifest','url':meta['sourceUrl'],'license':'CC0-1.0','licenseUrl':f'https://github.com/Poly-Haven/polyhaven.com/blob/{AUTHOR_PIN}/public/locales/en/license.json','library':'Modelibr CC0 Public Domain Textures','distributionUrl':f'https://github.com/{LIB}/blob/{LIB_PIN}/{source_path}','downloadUrl':RAW+source_path,'distributionLicenseUrl':f'https://github.com/{LIB}/blob/{LIB_PIN}/LICENSE','consultedAt':'2026-10-01','sourceFormat':'image/png','sourceSha256':hashlib.sha256(data).hexdigest(),'sourceBytes':len(data),'sourceDimensions':original,'changes':'Library-generated flat albedo PNG at 256 px (not a website or sphere capture), re-encoded as WebP; separate 112 px thumbnail. No recolouring.','rightsEvidence':'CC0 per pinned library pack, corroborated by the official Poly Haven asset-license source. Original website/API unavailable in this environment.'},'repeatMm':{'x':1000,'y':round(1000*im.height/im.width)},'scaleEvidence':'Design default, not a physical measurement published by the source. Adjustable before applying.','maps':{'baseColor':metadata(dest,im.size)},'sample':metadata(thumb,sample.size),'totalBytes':dest.stat().st_size+thumb.stat().st_size,'estimatedGpuBytes':int((im.width*im.height*4*4+2)//3)}
 choices=[(f,a,n)for f,rows in CHOICES.items()for a,n in rows]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:entries=list(pool.map(prepare,choices))
 assert len(entries)==50 and len({e['maps']['baseColor']['sha256']for e in entries})==50
 (OUT/'catalog.json').write_text(json.dumps({'version':1,'status':'complete','targetCount':50,'libraryCommit':LIB_PIN,'licenseSourceCommit':AUTHOR_PIN,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 sheet=Image.new('RGB',(10*150,5*180),'white');draw=ImageDraw.Draw(sheet)
 for i,e in enumerate(entries):
  im=Image.open(ROOT/e['maps']['baseColor']['path']);im.thumbnail((145,145));x=(i%10)*150;y=(i//10)*180;sheet.paste(im,(x,y));draw.text((x,y+148),e['source']['assetId'][:24],fill='black')
 qa=ROOT/'docs/qa/artifacts/surface-library';qa.mkdir(parents=True,exist_ok=True);sheet.save(qa/'contact-sheet.jpg')
 print('Decoded',len(entries),'unique albedo files; optimized total',sum(e['totalBytes']for e in entries),'bytes.')
if __name__=='__main__':main()
