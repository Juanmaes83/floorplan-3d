# Contact sheet as a printed book is read: the cover alone on the right, then facing pages 2–3, 4–5… side by side.
import subprocess,sys,os,glob,tempfile
from PIL import Image,ImageDraw
pdf,out=sys.argv[1],sys.argv[2];dpi=sys.argv[3] if len(sys.argv)>3 else '40';cols=int(sys.argv[4]) if len(sys.argv)>4 else 2
tmp=tempfile.mkdtemp();subprocess.run(['pdftoppm','-r',dpi,'-png',pdf,os.path.join(tmp,'p')],check=True)
pages=[Image.open(f).convert('RGB') for f in sorted(glob.glob(os.path.join(tmp,'p*.png')))]
w,h=pages[0].size;pairs=[[None,0]]+[[i,i+1 if i+1<len(pages) else None] for i in range(1,len(pages),2)]
pad=14;rows=(len(pairs)+cols-1)//cols;sw=2*w+2
sheet=Image.new('RGB',(cols*(sw+pad)+pad,rows*(h+pad+16)+pad),(214,210,202));d=ImageDraw.Draw(sheet)
for k,(a,b) in enumerate(pairs):
  x=pad+(k%cols)*(sw+pad);y=pad+(k//cols)*(h+pad+16)
  for j,i in enumerate((a,b)):
    if i is not None:sheet.paste(pages[i],(x+j*(w+2),y+16));d.text((x+j*(w+2),y+2),f'p{i+1}',fill=(40,40,40))
sheet.save(out);print(out,len(pages),'pages')
