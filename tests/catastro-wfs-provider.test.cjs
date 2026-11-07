'use strict';
/* FT3D-8 · M1 · S3 — official Catastro WFS lookup by reference (FT8-S3-01/05). Network is INJECTED: these tests prove
   the contract, query form and every failure path; they do not claim a real official answer (see the browser suite
   and the M1 report for what was verified remotely). GML parsing of a successful answer runs in Chromium (DOMParser). */
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../js/catastro-wfs-provider.js'),Geo=require('../js/geo-provider.js');
const res=(status,body,type='text/xml; charset=utf-8',extra={})=>({ok:status>=200&&status<300,status,headers:{get:k=>({'content-type':type,...extra})[k.toLowerCase()]??null},text:async()=>body});
const now=()=>new Date('2026-11-05T12:00:00Z');

test('FT8-S3-01 · official service, documented query form, GeoProvider 1.3.0 reference mode, licence restricted',()=>{
  assert.equal(W.queryUrl('3662001tf3136s'),'https://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2&request=getfeature&STOREDQUERIE_ID=GetParcel&refcat=3662001TF3136S&srsname=EPSG%3A%3A25830');
  assert.match(W.queryUrl('3662001TF3136S0001AB','EPSG:25829'),/refcat=3662001TF3136S&srsname=EPSG%3A%3A25829$/,'20-character references are cut to the 14-character parcel');
  assert.throws(()=>W.queryUrl('ABC'),/invalid-parcel-reference/);assert.throws(()=>W.queryUrl('3662001TF3136S','EPSG:4326'),/unsupported-source-crs/);
  const p=W.create({fetch:async()=>res(200,'')}),d=Geo.inspectProvider(p);
  assert.deepEqual([d.providerId,d.kind,d.network,d.parcelInputModes,d.license.status,d.attribution],['catastro-inspire-wfs','official','required',['reference'],'restricted','Dirección General del Catastro']);
  assert.match(d.coverage,/no incluye País Vasco ni Navarra/);
  assert.ok(W.ZONES.every(z=>['EPSG:25829','EPSG:25830','EPSG:25831','EPSG:32628'].includes(z.crs)));
});

test('FT8-S3-01 · the browser request sends no credentials, no referrer and follows no redirect',async()=>{
  let seen;const p=W.create({fetch:async(url,init)=>{seen={url,init};return res(200,'<wfs:FeatureCollection numberReturned="0"/>');},now});
  const r=await p.getParcel({mode:'reference',reference:'3662001TF3136S'});
  assert.deepEqual(r,{status:'not-found',reason:'parcel-not-found'});
  assert.deepEqual([seen.init.credentials,seen.init.redirect,seen.init.referrerPolicy,seen.init.mode,seen.init.method],['omit','error','no-referrer','cors','GET']);
  assert.equal(p.lastDiagnostic().kind,'empty');
});

test('FT8-S3-05 · every failure is a normal result: rejected service, exception, network, timeout, cancellation, size',async()=>{
  const html=W.create({fetch:async()=>res(400,'<html>No se puede procesar su petición</html>','text/html'),now});
  assert.deepEqual(await html.getParcel({mode:'reference',reference:'3662001TF3136S'}),{status:'unavailable',reason:'network-unavailable'});
  assert.deepEqual(html.lastDiagnostic(),{kind:'service-rejected',at:'2026-11-05T12:00:00.000Z',httpStatus:400,contentType:'text/html'});
  const exc=W.create({fetch:async()=>res(200,'<ows:ExceptionReport><ows:Exception><ows:ExceptionText>La REFCAT no es correcta</ows:ExceptionText></ows:Exception></ows:ExceptionReport>'),now});
  assert.deepEqual(await exc.getParcel({mode:'reference',reference:'3662001TF3136S'}),{status:'invalid',reason:'invalid-parcel-reference'});
  // Real wording observed from the official service (2026-11-06) for a reference that does not exist in the zone.
  const nf=W.create({now,crs:'EPSG:25830',fetch:async()=>res(200,'<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception exceptionCode="InvalidParameterValue"><ows:ExceptionText><![CDATA[No se ha encontrado la parcela 0000000AA0000A para el huso 25830]]></ows:ExceptionText></ows:Exception></ows:ExceptionReport>')});
  assert.deepEqual(await nf.getParcel({mode:'reference',reference:'0000000AA0000A'}),{status:'not-found',reason:'parcel-not-found'});
  assert.deepEqual([nf.lastDiagnostic().kind,nf.lastDiagnostic().zone,nf.lastDiagnostic().message],['not-found-in-zone','EPSG:25830','No se ha encontrado la parcela 0000000AA0000A para el huso 25830']);
  const exc2=W.create({fetch:async()=>res(200,'<ExceptionReport><ExceptionText>Servicio no disponible</ExceptionText></ExceptionReport>'),now});
  assert.equal((await exc2.getParcel({mode:'reference',reference:'3662001TF3136S'})).reason,'network-unavailable');
  const down=W.create({fetch:async()=>{throw new TypeError('Failed to fetch');},now});
  assert.deepEqual(await down.getParcel({mode:'reference',reference:'3662001TF3136S'}),{status:'unavailable',reason:'network-unavailable'});
  assert.equal(down.lastDiagnostic().kind,'network');
  const slow=W.create({timeoutMs:30,now,fetch:(url,{signal})=>new Promise((_,rej)=>signal.addEventListener('abort',()=>rej(Object.assign(new Error('aborted'),{name:'AbortError'}))))});
  assert.equal((await slow.getParcel({mode:'reference',reference:'3662001TF3136S'})).reason,'network-unavailable');assert.equal(slow.lastDiagnostic().kind,'timeout');
  const ctrl=new AbortController(),pending=W.create({now,fetch:(url,{signal})=>new Promise((_,rej)=>signal.addEventListener('abort',()=>rej(Object.assign(new Error('aborted'),{name:'AbortError'}))))});
  const run=pending.getParcel({mode:'reference',reference:'3662001TF3136S'},{signal:ctrl.signal});ctrl.abort();
  assert.deepEqual(await run,{status:'cancelled',reason:'cancelled'});
  const big=W.create({now,fetch:async()=>res(200,'x','text/xml',{'content-length':String(3_000_000)})});
  assert.deepEqual(await big.getParcel({mode:'reference',reference:'3662001TF3136S'}),{status:'invalid',reason:'invalid-source-document'});
  const bad=W.create({now,fetch:async()=>res(200,'')});
  assert.deepEqual(await bad.getParcel({mode:'reference',reference:'NOPE'}),{status:'invalid',reason:'invalid-parcel-reference'});
  assert.deepEqual(await bad.getParcel({mode:'document',text:'<x/>'}),{status:'unsupported',reason:'invalid-parcel-input'});
});

test('FT8-S3-05 · through the GeoProvider registry: cancellation and input validation stay in the contract',async()=>{
  const p=W.create({now,fetch:async()=>res(400,'<html/>','text/html')}),reg=Geo.createRegistry([p]);
  assert.deepEqual(await reg.getParcel('catastro-inspire-wfs',{mode:'reference',reference:'3662001TF3136S'}),{status:'unavailable',providerId:'catastro-inspire-wfs',reason:'network-unavailable'});
  assert.equal((await reg.getParcel('catastro-inspire-wfs',{mode:'document',text:'<x/>'})).reason,'parcel-input-mode-disabled');
  const c=new AbortController();c.abort();
  assert.equal((await reg.getParcel('catastro-inspire-wfs',{mode:'reference',reference:'3662001TF3136S'},{signal:c.signal})).status,'cancelled');
});

test('M2 · autoZone: tries the official zones only while the service says «not found in this zone»; any other answer stops',async()=>{
  const nf=z=>res(200,`<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception><ows:ExceptionText><![CDATA[No se ha encontrado la parcela 0000000AA0000A para el huso ${z}]]></ows:ExceptionText></ows:Exception></ows:ExceptionReport>`);
  const seen=[];const p=W.create({now,autoZone:true,fetch:async url=>{const z=/srsname=EPSG%3A%3A(\d+)/.exec(url)[1];seen.push(z);return z==='25829'?res(400,'<html/>','text/html'):nf(z);}});
  assert.deepEqual(await p.getParcel({mode:'reference',reference:'0000000AA0000A'}),{status:'unavailable',reason:'network-unavailable'});
  assert.deepEqual(seen,['25830','25829'],'stops at the first answer that is not «not found in this zone»');
  assert.deepEqual(p.lastDiagnostic().zonesTried,['EPSG:25830','EPSG:25829']);
  const all=[];const q=W.create({now,autoZone:true,fetch:async url=>{const z=/srsname=EPSG%3A%3A(\d+)/.exec(url)[1];all.push(z);return nf(z);}});
  assert.deepEqual(await q.getParcel({mode:'reference',reference:'0000000AA0000A'}),{status:'not-found',reason:'parcel-not-found'});
  assert.equal(all.length,4,'one request per official zone, never more');assert.equal(q.lastDiagnostic().kind,'not-found-in-any-zone');
  const one=W.create({now,fetch:async()=>nf('25830')});await one.getParcel({mode:'reference',reference:'0000000AA0000A'});assert.equal(one.lastDiagnostic().kind,'not-found-in-zone','without autoZone the M1 behaviour is unchanged');
});
