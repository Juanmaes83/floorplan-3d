const {test}=require('node:test'),assert=require('node:assert/strict');
test('stone transfer retains constant fields and uses only verified roughness G',async()=>{
 const {stoneTransfer}=await import('../js/surface-fidelity.mjs');
 const field=new Uint8Array([120,140,160,255,120,140,160,255]);
 assert.deepEqual([...stoneTransfer(field,'color')],[...field]);
 assert.deepEqual([...stoneTransfer(new Uint8Array([0,128,255,255]),'roughness')],[...stoneTransfer(new Uint8Array([255,128,0,255]),'roughness')]);
 const lo=stoneTransfer(new Uint8Array([255,0,255,255]),'roughness')[1],hi=stoneTransfer(new Uint8Array([0,255,0,255]),'roughness')[1];
 assert.equal(lo,71);assert.equal(hi,199);assert.throws(()=>stoneTransfer(field,'metalness'));
});
test('finite recipes are periodic, deterministic, physically bounded and distinct',async()=>{
 const {bakeSurface,materialField}=await import('../js/surface-fidelity.mjs');
 for(const family of ['oak','plaster','concrete']){
  const a=bakeSurface(family,[160,140,120]),b=bakeSurface(family,[160,140,120]);
  assert.deepEqual(a,b);assert.ok(a.size<=512);
  for(const [u,v]of [[.13,.21],[.44,.62]]){
   const p=materialField(family,u,v),q=materialField(family,u+1,v+1);
   p.forEach((value,i)=>assert.ok(Math.abs(value-q[i])<1e-10));
  }
  for(let i=0;i<a.normal.length;i+=4){const x=a.normal[i]/127.5-1,y=a.normal[i+1]/127.5-1,z=a.normal[i+2]/127.5-1;assert.ok(z>.80);assert.ok(Math.abs(Math.hypot(x,y,z)-1)<.015);assert.ok(a.roughness[i+1]>=64);}
 }
 assert.notDeepEqual(bakeSurface('plaster',[160,140,120]).normal,bakeSurface('concrete',[160,140,120]).normal);
});
test('authored relief normals lean away from rise and respond to physical scale',async()=>{
 const {normalsFromHeights}=await import('../js/surface-fidelity.mjs');
 const n=32,h=Float32Array.from({length:n*n},(_,i)=>.01*Math.sin(2*Math.PI*(i%n)/n));
 const a=normalsFromHeights(h,n,{x:1,y:1}),b=normalsFromHeights(h,n,{x:2,y:1});
 assert.ok(a[0]<128,'positive U height slope must point toward negative U');assert.ok(b[0]>a[0],'doubling period reduces slope');assert.ok(Math.abs(a[1]-128)<=1);
});
