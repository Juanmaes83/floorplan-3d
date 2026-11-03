const {test}=require('node:test'),assert=require('node:assert/strict');
test('stone transfer retains constant fields and uses only verified roughness G',async()=>{
 const {stoneTransfer}=await import('../js/surface-fidelity.mjs');
 const field=new Uint8Array([120,140,160,255,120,140,160,255]);
 assert.deepEqual([...stoneTransfer(field,'color')],[...field]);
 assert.deepEqual([...stoneTransfer(new Uint8Array([0,128,255,255]),'roughness')],[...stoneTransfer(new Uint8Array([255,128,0,255]),'roughness')]);
 const lo=stoneTransfer(new Uint8Array([255,0,255,255]),'roughness')[1],hi=stoneTransfer(new Uint8Array([0,255,0,255]),'roughness')[1];
 assert.equal(lo,71);assert.equal(hi,199);assert.throws(()=>stoneTransfer(field,'metalness'));
});
