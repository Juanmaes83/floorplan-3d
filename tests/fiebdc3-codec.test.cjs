'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const Codec=require('../js/fiebdc3-codec.js');
const {file,base,minimal}=require('./fixtures/fiebdc3/synthetic.cjs');

test('projects ordered V/K/C/D/T/W records and preserves unknown records',()=>{
  const model=Codec.parse(Codec.encode(base));
  assert.deepEqual(model.records.map(r=>r.type),['V','K','C','C','D','T','W','X']);
  assert.equal(model.version.owner,'Estudio Serra');
  assert.deepEqual(model.version.labels,['Madrid','Valencia']);
  assert.equal(model.version.declaredEncoding,'850');
  assert.equal(model.coefficients[0].legacyGroups[0][8],'EUR');
  assert.equal(model.coefficients[0].currentGroups[0][12],'EUR');
  assert.equal(model.concepts[1].aliases[1],'ALIAS-1');
  assert.deepEqual(model.concepts[1].prices.map(p=>p.value),[0,25.5]);
  assert.equal(model.concepts[1].prices[1].inheritedDate,true);
  assert.equal(model.decompositions[0].children[0].yield,2);
  assert.equal(model.decompositions[0].current[0].percentageCodes,null);
  assert.match(model.texts[0].text,/línea dos\r\ncontinúa/);
  assert.deepEqual(model.scopes.map(s=>s.abbreviation),['MAD','VAL']);
  assert.deepEqual(model.warnings,[{code:'unsupported-record',recordIndex:7,type:'X'}]);
});

test('optional W scope name and raw percentage code survive projection',()=>{
  const text=file([
    '~V|A|FIEBDC-3/2016|P|Precios|850||||||',
    '~C|ROOT#|ud|Obra|0|27102026|0|',
    '~C|X|m2|Material|1|27102026|0|',
    '~D|ROOT#||X\\1\\2\\%A;%B\\|',
    '~W|MAD\\|'
  ]);
  const model=Codec.parse(text);
  assert.equal(model.decompositions[0].children[0].percentageCodes,'%A;%B');
  assert.deepEqual(model.scopes,[{abbreviation:'MAD',name:null}]);
  assert.equal(Codec.serialize(model),text);
});

test('byte and normalized-model round trips are deterministic',()=>{
  const bytes=Codec.encode(base),model=Codec.parse(bytes);
  assert.deepEqual(Codec.encodeModel(model),bytes);
  assert.equal(Codec.serialize(model),base);
  assert.deepEqual(Codec.parse(Codec.serialize(model)),model);
  assert.deepEqual(Codec.validate(model),model);
});

test('explicit zero and absent price remain different',()=>{
  const zero=Codec.parse(minimal).concepts[0];
  assert.deepEqual(zero.explicitPrices,[0]);
  assert.equal(zero.prices[0].value,0);
  const absent=Codec.parse(minimal.replace('|0|27102026|0|','||27102026|0|')).concepts[0];
  assert.deepEqual(absent.explicitPrices,[]);
  assert.deepEqual(absent.prices,[]);
});

test('repeat the final price and date across additional V labels',()=>{
  const text=file([
    '~V|A|FIEBDC-3/2016|P|Precios\\A\\B\\C|850||||||',
    '~C|X|m2|Concepto|1\\2\\|1012020\\|0|'
  ]);
  const p=Codec.parse(text).concepts[0].prices;
  assert.deepEqual(p.map(x=>x.value),[1,2,2]);
  assert.deepEqual(p.map(x=>x.date),['1012020','1012020','1012020']);
  assert.equal(p[2].inheritedPrice,true);
  assert.equal(p[1].inheritedDate,true);
});

test('850, 437 and ANSI bytes decode according to V and re-encode exactly',()=>{
  for(const charset of ['850','437','ANSI']){
    const text=minimal.replace('|850|',`|${charset}|`).replace('Obra','Obra ñ é');
    assert.equal(Codec.decode(Codec.encode(text)).text,text);
    assert.deepEqual(Codec.encodeModel(Codec.parse(Codec.encode(text))),Codec.encode(text));
  }
  assert.equal(Codec.decode(Codec.encode(minimal.replace('|850|','||'))).encoding,'850');
  assert.throws(()=>Codec.encode(minimal.replace('Obra','Obra 😀')),/unrepresentable-character/);
  assert.throws(()=>Codec.encode(minimal.replace('|850|','|UTF-8|')),/unsupported-encoding/);
});

test('malformed and truncated input has explicit errors',()=>{
  assert.throws(()=>Codec.parse(minimal.slice(0,-1)),/missing-eof/);
  assert.throws(()=>Codec.parse(minimal.replace('\r\n','\n')),/invalid-line-ending/);
  assert.throws(()=>Codec.parse(minimal.replace('|27102026|0|','|27102026|0')),/truncated-record/);
  assert.throws(()=>Codec.parse(minimal.replace('ROOT#','BAD CODE')),/invalid-code/);
  assert.throws(()=>Codec.parse(minimal.replace('|0|27102026|0|','|1,2|27102026|0|')),/invalid-number/);
  assert.throws(()=>Codec.parse(minimal.replace('27102026','2710202X')),/invalid-date/);
  assert.throws(()=>Codec.parse(file(['~V|A|FIEBDC-3/2016|P|Precios|850||||||','~D|ROOT#|X\\1\\2\\||'])),/unresolved-concept/);
  assert.throws(()=>Codec.parse(file(['~C|X|m2|Concepto|1|27102026|0|'])),/missing-version/);
  const changed=Codec.parse(minimal);changed.concepts[0].summary='Cambio sin reflejo en ~C';
  assert.throws(()=>Codec.serialize(changed),/model-record-mismatch/);
});

test('a 7C-D codec has no provider, Budget, IO or network dependencies',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/fiebdc3-codec.js'),'utf8');
  const context=vm.createContext({Uint8Array,console,fetch(){throw Error('network');},document:undefined,localStorage:undefined});
  vm.runInContext(source,context);
  assert.equal(typeof context.FloorPlanFIEBDC3.parse,'function');
  const model=context.FloorPlanFIEBDC3.parse(minimal);
  assert.equal(model.concepts[0].code,'ROOT#');
  assert.equal(context.FloorPlanBudget,undefined);
  assert.equal(context.FloorPlanCostProvider,undefined);
});
