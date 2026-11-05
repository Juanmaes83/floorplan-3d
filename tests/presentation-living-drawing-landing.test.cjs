/* Hybrid V2 — pure parts of the landing kept from b9b0ace: bounded room-mask memory and every room fully real by the
   end of its own time (never a last frame left in pencil). */
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/presentation-living-drawing.js').FloorPlanLivingDrawingRenderer;

test('HV2 room mask: 4 cm on a home, bounded to 2048 px (and the GPU limit) on a huge plan',()=>{
 const home=R.maskGrid([-6,6],[-5,5],16384);assert.equal(home.res,.04);assert.ok(home.w<=2048&&home.h<=2048);
 const huge=R.maskGrid([-500,500],[-120,120],16384);assert.ok(huge.w<=2048&&huge.h<=2048,`${huge.w}×${huge.h}`);assert.ok(huge.res>.04);
 assert.ok(huge.w*huge.h*4<=2048*2048*4,'at most 16 MiB of mask');
 const small=R.maskGrid([-500,500],[-500,500],1024);assert.ok(small.w<=1024&&small.h<=1024,'never above the GPU max texture size');
 const thin=R.maskGrid([0,0],[0,0],undefined);assert.ok(thin.w>=1&&thin.h>=1);
});

test('HV2 a room is complete when its last piece lands, and in any case before its own end',()=>{
 const v={start:10,duration:6};
 assert.equal(R.roomDoneAt(v,12),12.3,'early when everything has landed');
 assert.ok(R.roomDoneAt(v,30)<16,'never after the end of the room, even if a stain would still be growing');
});
