// GEN-AI · protocolo de validación C con SIMULADORES rotulados (sin red, sin modelo, sin gasto). Prueba que el ARNÉS
// mide bien: el simulador de referencia supera las 30 preguntas y CADA respuesta del simulador defectuoso falla al menos
// una métrica. No demuestra comprensión generativa; el modo real está bloqueado sin GO expreso.
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../scripts/qa/assistant-eval-core.cjs'),CLI=require('../scripts/qa/assistant-eval.cjs'),protocol=require('../docs/product/assistant-ai-v3/eval/questions.json');

test('the question set: 30 items = 10 scenarios × ES/EN/ZH, synthetic data, explicitly NOT executed against real providers',()=>{
 assert.equal(protocol.items.length,30);assert.equal(new Set(protocol.items.map(i=>i.id)).size,30);
 const sc=new Set(protocol.items.map(i=>i.scenario));assert.equal(sc.size,10);for(const s of sc)assert.deepEqual(protocol.items.filter(i=>i.scenario===s).map(i=>i.lang).sort(),['en','es','zh']);
 assert.match(protocol.status,/NO EJECUTADO CONTRA PROVEEDORES REALES/);assert.match(protocol.dataset,/sintético/);assert.ok(protocol.budgetPerTurnUsd>0);
});

test('harness validity: reference simulator 30/30; faulty simulator detected on every item, by the expected metric family',async()=>{
 const good=await E.run({protocol,adapterFor:E.simulator('reference')});assert.equal(good.passed,30,JSON.stringify(good.results.filter(r=>!r.pass).map(r=>r.id)));assert.equal(good.providerCalls>0,true);
 const bad=await E.run({protocol,adapterFor:E.simulator('faulty')});assert.deepEqual(bad.results.filter(r=>r.pass).map(r=>r.id),[],'every fault is caught');
 const failed=id=>Object.entries(bad.results.find(r=>r.id===id).metrics).filter(([,v])=>!v.pass).map(([k])=>k);
 for(const l of ['es','en','zh']){
  assert.ok(failed('rooms_count.'+l).includes('tools')&&failed('rooms_count.'+l).includes('figures'),'invented figure without consulting');
  assert.ok(failed('injection.'+l).includes('forbidden')&&failed('injection.'+l).includes('injection'),'embedded instruction obeyed');
  assert.ok(failed('floor_proposal.'+l).includes('proposal'),'wrong room proposed');
  assert.ok(failed('spend_refusal.'+l).includes('noSpend'),'tried to act instead of offering Render IA');
  assert.ok(failed('partial_amount.'+l).includes('figures'),'wrong amount (VAT added) caught by the independent oracle');
  assert.ok(failed('catalogue_empty.'+l).includes('figures'),'invented catalogue product and price');}
 assert.ok(failed('followup.en').includes('language'),'answer in the wrong language');
});

test('real mode is locked: refused without GO, in CI, with a non-Preview endpoint or without code; nothing is sent',async()=>{
 const base={ASSISTANT_EVAL_GO:'GO-EVAL-C-001',ASSISTANT_EVAL_ENDPOINT:'https://rubik-git-x.vercel.app/api/assistant',ASSISTANT_EVAL_CODE:'c'.repeat(40)};
 assert.deepEqual(CLI.realGuard({},[]),{real:false},'simulated by default');
 for(const env of [{},{...base,CI:'true'},{...base,ASSISTANT_EVAL_GO:'yes'},{...base,ASSISTANT_EVAL_ENDPOINT:'https://rubik.example.com/api/assistant'},{...base,ASSISTANT_EVAL_ENDPOINT:'http://x.vercel.app/api/assistant'},{...base,ASSISTANT_EVAL_CODE:''}])
  assert.ok(CLI.realGuard(env,['--real']).refused?.length>0,JSON.stringify(env));
 const fetched=[];const orig=globalThis.fetch;globalThis.fetch=async(...a)=>{fetched.push(a);throw new Error('no network');};
 const err=console.error;console.error=()=>{};try{assert.equal(await CLI.main({},['--real']),2);}finally{console.error=err;globalThis.fetch=orig;}
 assert.equal(fetched.length,0,'refused before any request');
 assert.equal(CLI.realGuard({...base},['--real']).refused,undefined,'only a full GO configuration unlocks it (not run here)');
});
