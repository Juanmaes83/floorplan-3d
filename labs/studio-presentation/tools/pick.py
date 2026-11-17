# Mosaic of chosen pages from several PDFs: pick.py out.png cols dpi "file.pdf:p1,p2" ... (labels: file stem and page)
import subprocess,sys,os,glob,tempfile
from PIL import Image,ImageDraw
out,cols,dpi=sys.argv[1],int(sys.argv[2]),sys.argv[3];tiles=[]
for spec in sys.argv[4:]:
  f,ps=spec.rsplit(':',1)
  for p in ps.split(','):
    t=tempfile.mkdtemp();subprocess.run(['pdftoppm','-r',dpi,'-png','-f',p,'-l',p,f,t+'/x'],check=True)
    tiles.append((f'{os.path.basename(f)[:-4]} p{p}',Image.open(glob.glob(t+'/x*.png')[0]).convert('RGB')))
W=max(i.width for _,i in tiles);H=max(i.height for _,i in tiles);pad=12;rows=(len(tiles)+cols-1)//cols
sh=Image.new('RGB',(cols*(W+pad)+pad,rows*(H+pad+16)+pad),(214,210,202));d=ImageDraw.Draw(sh)
for k,(lab,im) in enumerate(tiles):
  x=pad+(k%cols)*(W+pad);y=pad+(k//cols)*(H+pad+16);sh.paste(im,(x,y+16));d.text((x,y+2),lab,fill=(40,40,40))
sh.save(out);print(out,len(tiles))
