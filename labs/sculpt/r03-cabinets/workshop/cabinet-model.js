// Geometry uses the same millimetre cabinet data as the elevation and collision model.
export function buildCabinet(f, {THREE, box, mat, rod, metal}) {
  const design = globalThis.HomeDesign, c = design.cabinet(f), g = new THREE.Group();
  const board = mat(f.color || '#efe6d8', {roughness:.65}), inside = mat('#dfc7a5', {roughness:.75});
  const add = (parent,w,h,d,x,y,z,m=board) => parent.add(box(w/1000,h/1000,d/1000,m,x/1000,y/1000,z/1000));
  const t = c.thickness, bottom = c.plinth+t, innerH = c.height-c.plinth-2*t, depth = f.d-c.back-c.frontGap;
  const backZ = -f.d/2+c.back, midZ = backZ+depth/2;
  add(g,f.w-2*t,c.plinth,Math.max(20,f.d-60),0,0,-20,mat('#5d554b'));
  add(g,t,c.height-c.plinth,f.d,-f.w/2+t/2,c.plinth,0);
  add(g,t,c.height-c.plinth,f.d,f.w/2-t/2,c.plinth,0);
  add(g,f.w-2*t,t,f.d,0,c.plinth,0);
  add(g,f.w-2*t,t,f.d,0,c.height-t,0);
  add(g,f.w-2*t,innerH,c.back,0,bottom,-f.d/2+c.back/2,inside);
  for (const b of design.bays(f)) {
    const centre=b.x+b.width/2;
    if(b.index<c.columns.length-1) add(g,t,innerH,depth,b.x+b.width+t/2,bottom,midZ);
    for(const y of b.shelves) add(g,b.width,t,depth,centre,bottom+y,midZ,inside);
    if(b.rod!==null) g.add(rod([(b.x+10)/1000,(bottom+b.rod)/1000,midZ/1000],[(b.x+b.width-10)/1000,(bottom+b.rod)/1000,midZ/1000],.01,metal()));
    const size=design.drawerSize(f,b);
    for(let i=0;i<b.drawers;i++) {
      const y=bottom+i*b.drawerHeight, h=b.drawerHeight-40, z=backZ+size.outerDepth/2+(c.front==='open'?size.travel:0), w=size.outerWidth, d=size.outerDepth;
      add(g,w,12,d,centre,y,z,inside);
      add(g,12,h-12,d,centre-w/2+6,y+12,z,inside);
      add(g,12,h-12,d,centre+w/2-6,y+12,z,inside);
      add(g,w-24,h-12,9,centre,y+12,z-d/2+4.5,inside);
      add(g,w-24,h-12,18,centre,y+12,z+d/2-9,inside);
      add(g,b.width-6,b.drawerHeight-6,18,centre,y+3,z+d/2+9);
      add(g,Math.min(160,b.width*.4),8,2,centre,y+b.drawerHeight*.6,z+d/2+18,metal());
    }
  }
  if(c.front!=='hidden') for(const front of design.fronts(f)) {
    const pivot = new THREE.Group(), sign=front.right?-1:1;
    pivot.position.set((front.x+(front.right?front.width:0))/1000,bottom/1000,(f.d/2-18)/1000);
    add(pivot,front.width-5,innerH-4,18,sign*front.width/2,2,9);
    add(pivot,10,Math.min(300,innerH*.25),30,sign*(front.width-40),Math.min(1050,innerH*.5),29,metal());
    if(c.front==='open') pivot.rotation.y=sign*-Math.PI/2;
    g.add(pivot);
  }
  return g;
}
