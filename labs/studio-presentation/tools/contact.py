# Contact sheet of a PDF: every page rasterised (pdftoppm), laid out in a grid, labelled with its page number.
import subprocess,sys,os,glob,tempfile
from PIL import Image,ImageDraw
pdf,out=sys.argv[1],sys.argv[2];cols=int(sys.argv[3]) if len(sys.argv)>3 else 4;dpi=sys.argv[4] if len(sys.argv)>4 else '45'
tmp=tempfile.mkdtemp();subprocess.run(['pdftoppm','-r',dpi,'-png',pdf,os.path.join(tmp,'p')],check=True)
pages=[Image.open(f).convert('RGB') for f in sorted(glob.glob(os.path.join(tmp,'p*.png')))]
w=max(p.width for p in pages);h=max(p.height for p in pages);pad=16;rows=(len(pages)+cols-1)//cols
sheet=Image.new('RGB',(cols*(w+pad)+pad,rows*(h+pad+18)+pad),(214,210,202));d=ImageDraw.Draw(sheet)
for i,p in enumerate(pages):
  x=pad+(i%cols)*(w+pad);y=pad+(i//cols)*(h+pad+18);sheet.paste(p,(x,y+18));d.text((x,y+2),f'p{i+1}',fill=(40,40,40))
sheet.save(out);print(out,len(pages),'pages')
