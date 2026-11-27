from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys, json
out=Path(sys.argv[1])
ink='#142c32'; soft='#53696d'; wall='#31474a'; wine='#803a4e'; paper='#fbfaf6'
fills={'night':'#eee8df','day':'#f1dfd5','bath':'#deecec','service':'#e7ebea','hall':'#f6f1e4','out':'#e4ece0'}
scale=38
ox,oy=68,255
fonts=Path('C:/Windows/Fonts')
def font(name,size): return ImageFont.truetype(str(fonts/name),size)
small=font('calibri.ttf',17); tiny=font('calibri.ttf',14); bold=font('calibrib.ttf',19)
section=font('calibrib.ttf',24); title=font('georgia.ttf',51)
def begin(sub):
 global d,im, plan
 plan={'rooms':[],'things':[],'openings':[],'name':sub}
 im=Image.new('RGB',(1850,1160),paper); d=ImageDraw.Draw(im)
 d.text((68,38),'ESTUDIO LINDE MEDITERRÁNEA   /   ANTEPROYECTO',font=bold,fill=wine)
 d.text((65,66),'Villa Linde · '+sub,font=title,fill=ink)
 d.text((68,135),'Costa Blanca · distribución amueblada · llegada al norte y jardín al sur como hipótesis',font=section,fill=soft)
 d.line((68,182,1782,182),fill='#cbd3ca',width=2)
 d.text((104,211),'N  ↑',font=section,fill=ink)
 d.text((154,213),'NORTE · acceso desde calle supuesta',font=bold,fill=soft)
 for pos in ('ESTE →',): d.text((1165,213),pos,font=bold,fill=soft)
def p(x,y): return ox+x*scale,oy+y*scale
def rect(x,y,w,h,fill=None,outline=wall,width=2,r=0):
 a,b=p(x,y),p(x+w,y+h)
 if r:d.rounded_rectangle((*a,*b),radius=r,fill=fill,outline=outline,width=width)
 else:d.rectangle((*a,*b),fill=fill,outline=outline,width=width)
def line(x,y,x2,y2,fill=wall,w=3):d.line((*p(x,y),*p(x2,y2)),fill=fill,width=w)
def label(x,y,t,f=small,color=ink):d.text(p(x,y),t,font=f,anchor='mm',fill=color)
def room(x,y,w,h,name,cat):
 plan['rooms'].append([x,y,w,h,name,cat])
 rect(x,y,w,h,fills[cat],wall,5); label(x+w/2,y+.46,name,bold)
def opening(x,y,length=1,axis='h',external=False):
 plan['openings'].append([x,y,length,axis,external])
 c='#f8fcfc' if not external else '#5598a4'
 lw=7 if not external else 9
 if axis=='h':
  line(x,y,x+length,y,c,lw)
  if not external: line(x,y,x,y+.48,wine,2)
 else:
  line(x,y,x,y+length,c,lw)
  if not external: line(x,y,x+.48,y,wine,2)
def thing(x,y,w,h,kind='wood'):
 plan['things'].append([x,y,w,h,kind])
 color={'wood':'#d6b99b','white':'#fdfcf8','cloth':'#b8c5c6','dark':'#8ba3a0','green':'#bdcfab'}[kind]
 rect(x,y,w,h,color,'#6f8584',2,5)
def bed(x,y,w,h,twin=False,desk=False):
 sizes=[(.45,.94),(1.6,.94)] if twin else [(.7,1.7)]
 for dx,bw in sizes:
  thing(x+dx,y+1,bw,2.0,'cloth')
  thing(x+dx+.10,y+1.12,bw-.2,.38,'white')
 thing(x+2.6,y+1.0,min(.66,w-2.85),1.85)
 if not twin: 
  thing(x+.27,y+1,.35,.40)
  thing(x+2.45,y+1,.30,.40)
 if desk:thing(x+.48,y+3.45,1.4,.48)
def bath(x,y,w,h,double=False):
 thing(x+.28,y+.85,.86,.86,'white')
 line(x+.33,y+1.62,x+1.06,y+.91,'#879d9c',1)
 thing(x+w-.62,y+.82,.40,.65,'white')
 thing(x+.25,y+h-.63,1.18 if double else .8,.41)
 thing(x+.40,y+h-.57,.28,.29,'white')
 if double:thing(x+.87,y+h-.57,.28,.29,'white')
def lounge(x,y,w,h):
 thing(x+.55,y+1.22,w-1.10,.75,'cloth')
 thing(x+.60,y+2.58,.78,1.15,'cloth')
 thing(x+1.63,y+2.51,min(1.63,w-2.03),.78)
 thing(x+w-.58,y+2.02,.29,1.85)
def stair(upper=False):
 room(14.55,0,3.55,5.4,'Escalera S1','hall')
 rect(15.07,1.10,2.51,3.49,'#eadac0','#637b78',2)
 for j in range(1,11):line(15.07,1.10+j*.29,17.58,1.10+j*.29,'#7f8e84',1)
 tip,tail=(4.14,1.60) if upper else (1.60,4.14)
 wings=tip-.27 if upper else tip+.27
 line(16.33,tail,16.33,tip,wine,4)
 line(16.33,tip,16.07,wings,wine,3)
 line(16.33,tip,16.59,wings,wine,3)
 opening(15.58,5.4,1.48)
def side(chunks):
 x=1310;y=222
 for t,body in chunks:
  d.text((x,y),t,font=section,fill=wine); y+=39
  for s in body:d.text((x,y),s,font=bold,fill=ink); y+=25
  y+=30
 d.line((x,y,1770,y),fill='#ced6ce',width=2); y+=22
 for name,c in [('Social','day'),('Dormitorios','night'),('Baños','bath'),('Exterior','out')]:
  d.rectangle((x,y+3,x+25,y+21),fill=fills[c],outline='#abbdb9')
  d.text((x+38,y),name,font=small,fill=soft); y+=30
 d.text((x,y+12),'Trazo azul · hueco exterior',font=small,fill='#427d85')
def footer(file):
 line(0,20.8,5,20.8,wall,3)
 for i in [0,1,2,3,4,5]:line(i,20.7,i,20.9,wall,2)
 label(2.5,21.2,'5 m · escala gráfica de la propuesta',small)
 d.text((68,1102),'Geometría conceptual · parcela, vistas, cotas de ejecución y sombras de entorno pendientes.',font=small,fill=soft)
 (out/(file+'.json')).write_text(json.dumps(plan,ensure_ascii=False),encoding='utf-8')
begin('Planta baja')
room(0,0,6.35,5.4,'Garaje · 2 plazas','service')
room(6.35,0,3.15,5.4,'Lavandería','service')
room(9.5,0,2.6,5.4,'Gimnasio','service')
room(12.1,0,2.45,5.4,'Acceso','hall'); stair()
room(0,5.4,31,2.08,'','hall'); opening(15.58,5.4,1.48)
label(23.3,6.48,'Distribuidor privado',bold); label(7.5,6.48,'Galería de acceso a la zona de día',bold)
line(14.55,5.4,14.55,7.48,wall,4); opening(14.55,5.85,1.21,'v')
for xx,ww,name,twin in [(18.1,4.1,'B01 · Doble',False),(22.2,4.4,'B02 · Doble',False),(26.6,4.4,'B03 · Twin',True)]:
 room(xx,0,ww,5.4,name,'night');bed(xx,0,ww,5.4,twin,True); opening(xx+ww-.99,5.4,.85); opening(xx+.6,0,1.95,external=True)
for xx,ww,name,twin in [(18.1,4.1,'B04 · Doble',False),(22.2,4.4,'B05 · Doble',False),(26.6,4.4,'B06 · Twin',True)]:
 room(xx,7.48,ww,6.05,name,'night');bed(xx,7.48,ww,6.05,twin,True);opening(xx+ww-1.03,7.48,.86);opening(xx+.65,13.53,2.05,external=True)
for x,w,name in [(0,5.05,'Salón principal'),(5.05,5.25,'Cocina y comedor'),(10.3,4.25,'Salón de piscina')]:
 room(x,7.48,w,6.88,name,'day');opening(x+w-1.6,7.48,1.35);opening(x+.50,14.36,w-1,external=True)
lounge(0,7.48,5.05,6.88);lounge(10.3,7.48,4.25,6.88)
thing(5.36,8.48,4.64,.52);thing(6.55,9.40,2.20,.85);label(7.65,9.82,'Isla',tiny)
thing(6.52,11.35,2.52,1.05);label(7.76,11.87,'Mesa · 12',tiny)
for xx in [6.68,7.26,7.84,8.42]:
 thing(xx,11,.36,.25,'cloth');thing(xx,12.48,.36,.25,'cloth')
for y in [11.4,11.93]:
 thing(6.18,y,.25,.30,'cloth');thing(9.12,y,.25,.30,'cloth')
room(17.02,7.48,1.08,6.04,'','hall');opening(17.12,7.48,.84)
for yy,t in [(7.48,'Baño B1'),(10.50,'Baño B2')]:
 room(14.55,yy,2.47,3.02,t,'bath');bath(14.55,yy,2.47,3.02);opening(17.02,yy+1.47,.85,'v')
opening(.33,0,5.65,external=True);opening(12.56,0,1.38,external=True)
for xx in [5,8.4,11,12.65]:opening(xx,5.4,.84)
opening(6.35,3.55,.86,'v'); opening(14.55,3.85,.88,'v')
for xx in [.66,3.5]:
 thing(xx,1.02,1.74,3.86,'dark');thing(xx+.19,1.75,1.35,1.5,'white')
thing(6.6,1.7,1.93,.65);thing(7.8,3.95,1.3,.63)
thing(9.83,1.3,.71,2.1,'dark');thing(10.85,1.5,.87,1.35,'cloth');thing(10.2,4.2,1.7,.45)
rect(0,14.36,14.55,5.34,fills['out'],'#7c9786',2,14)
rect(7.25,15.46,6.64,3.54,'#b5dce1','#6da3ad',3,20)
label(10.4,17.18,'Piscina',bold);label(3.55,15.13,'Terraza cubierta y comedor exterior',small)
thing(2.4,16.25,2.3,.88);thing(4.95,17.61,.62,1.42,'cloth');thing(5.77,17.61,.62,1.42,'cloth')
line(0,14.36,14.5,14.36,'#657e70',2)
# Curvature reserved on the covered garden edge; no curved load-bearing wall implied on the drawing.
d.arc((*p(0,14.0),*p(6.0,18.3)),start=3,end=167,fill=wine,width=4)
side([('6 dormitorios · 2 baños · 2 salones', ['Ala este separada del acceso y garaje.','Ambos baños abren a un paso común.']),
      ('Vida diaria sin subir escaleras',['Dos plazas, acceso de servicio y lavadero.','Cocina, comedor y piscina conectados.']),
      ('Sur y oeste · sol y protección',['Porche para el frente sur.','Control solar exterior en el extremo oeste.']),
      ('Escalera S1',['Mismo núcleo en ambas plantas.','Arranque junto al vestíbulo principal.']),
      ('Exterior y curva',['Curva esquemática en borde del porche.','Forma y geometría RUBIK por verificar.'])])
footer('villa-linde-propuesta-baja.png')
begin('Planta primera')
room(0,0,3.55,5.4,'Despacho','service')
thing(.45,1.15,1.7,.64);thing(.95,1.88,.55,.49,'cloth');thing(.45,3.72,1.6,.67,'cloth')
opening(.5,0,1.9,external=True);opening(2.45,5.4,.88);stair(upper=True)
room(0,5.4,31,2.08,'','hall'); opening(15.58,5.4,1.48);label(20.4,6.45,'Galería de dormitorios · llegada desde S1',bold)
for x,w,n,t in [(3.55,5.2,'P01 · Doble',False),(8.75,5.8,'P02 · Twin',True),(21,4.7,'P03 · Doble',False),(25.7,5.3,'P04 · Twin',True)]:
 room(x,0,w,5.4,n,'night');bed(x,0,w,5.4,t,True);opening(x+w-1.35,5.4,.9);opening(x+.44,0,2,external=True)
room(18.1,0,2.90,5.4,'Baño P1','bath');bath(18.1,0,2.9,5.4,True);opening(19.2,5.4,.86)
room(0,7.48,7.1,6.88,'Salón panorámico','day');lounge(0,7.48,7.1,6.88);opening(2.6,7.48,1.65);opening(1,14.36,4.5,external=True)
for x,w,n,t in [(7.1,4.35,'P05 · Doble',False),(11.45,4.20,'P06 · Doble',False),(18.65,4.1,'P07 · Doble',False)]:
 room(x,7.48,w,6.88,n,'night');bed(x,7.48,w,6.88,t,True);opening(x+w-1.11,7.48,.86);opening(x+.50,14.36,2.3,external=True)
room(15.65,7.48,3,6.88,'Baño P2','bath');bath(15.65,7.48,3,6.88,True);opening(16.82,7.48,.87);opening(16.02,14.36,1.3,external=True)
room(22.75,7.48,8.25,6.88,'P08 · Principal','night')
thing(24.6,9.1,2,2.12,'cloth');thing(24.8,9.2,1.6,.42,'white');thing(24,9.1,.42,.45);thing(26.75,9.1,.42,.45);thing(23.34,12.75,1.6,.55,'cloth')
opening(24.25,7.48,1.13)
room(27.5,8.45,3.5,2.15,'Vestidor','service');thing(27.79,9.33,2.33,.47);opening(27.5,9.20,.83,'v')
room(27.5,10.60,3.50,3.76,'Baño P3','bath');bath(27.5,10.6,3.5,3.76,True);opening(27.5,11.79,.88,'v')
rect(0,14.36,7.1,3.4,fills['out'],'#7c9786',2); opening(1,14.36,4.5,external=True)
label(3.55,14.83,'Terraza del salón',bold);thing(.5,15.55,2.1,.72);thing(4.4,15.60,1.6,.72,'cloth')
for x,w,t in [(7.1,4.35,'Balcón P05'),(22.75,4.75,'Balcón principal')]:
 rect(x,14.36,w,1.68,fills['out'],'#7c9786',2);opening(x+.65,14.36,w-1.5,external=True); label(x+w/2,15.48,t,small)
side([('8 dormitorios · 3 baños · 1 salón',['Los baños P1 y P2 sirven a la planta.','P3 es de uso privado de la suite.']),
      ('Oficina y dormitorios privados',['Despacho con luz norte y puerta propia.','Sin paso de invitados por dormitorios.']),
      ('Vistas por confirmar',['Salón y suite hacia el jardín.','Terraza y balcones con salida directa.']),
      ('Escalera S1',['Hueco y desembarco en el mismo eje.','Baños próximos al núcleo húmedo.']),
      ('Luz de mañana y tarde',['Frente sur abierto y protegible.','Huecos al norte en despacho y dormitorios.'])])
footer('villa-linde-propuesta-primera.png')


