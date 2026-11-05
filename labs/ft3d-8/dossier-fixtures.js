/* FIXTURES FT3D-8 S1 — EXPEDIENTES SINTETICOS DE PRUEBA. NO SON PROYECTOS, PARCELAS NI MARCAS DE CLIENTES.
   Parten de los proyectos A-D de fidelity-fixtures.js (validados por FloorPlanCore/FloorPlanBuilding) y les añaden, con
   las autoridades reales, lo que un profesional haría en RUBIK:
   - parcela: GML INSPIRE CP sintético (referencias FX…, coordenadas inventadas cerca de 500000/4500000 EPSG:25830) que en
     el navegador se lee con el proveedor REAL FloorPlanCatastroParcel; site.parcel con FloorPlanParcelSiteAdapter;
   - colocación: site.buildingPlacement «user-entered» validado por FloorPlanTerritoryIntegration y FloorPlanCore.setSite;
   - presupuestos: FloorPlanBudgetDraft (el de la planta alta del edificio B se añade aquí);
   - marca: perfil normalizado por FloorPlanBrand.normalizeProfile, con la forma de FloorPlanBrand.snapshot.
   El plan y el vínculo de cada caso se vuelven a fijar sobre la revisión del proyecto con parcela (huella SHA-256). */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(()=>({Fid:require('./fidelity-fixtures.js'),Core:require('../../js/project-core.js'),
    Building:require('../../js/building-core.js'),Parcel:require('../../js/parcel-core.js'),ParcelSite:require('../../js/parcel-site-adapter.js'),
    Adapter:require('../../js/construction-project-adapter.js'),Brand:require('../../js/brand-core.js')}));
  else root.FT3D8DossierFixtures=factory(()=>({Fid:root.FT3D8FidelityFixtures,Core:root.FloorPlanCore,Building:root.FloorPlanBuilding,Parcel:root.FloorPlanParcelCore,
    ParcelSite:root.FloorPlanParcelSiteAdapter,Adapter:root.FloorPlanConstructionProject,Brand:root.FloorPlanBrand}));
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  // Synthetic parcels (rings in EPSG:25830 metres). References are clearly fake (FX prefix) but valid in format.
  const PARCELS={
    A:{reference:'FX00A00001AA01',ring:[[500000,4500000],[500030,4500000],[500030,4500020],[500000,4500020]],north:15},
    B:{reference:'FX00B00001BB01',ring:[[500100,4500100],[500140,4500100],[500140,4500130],[500100,4500130]],north:352},
    C:{reference:'FX00C00001CC01',ring:[[500200,4500200],[500216,4500200],[500216,4500212],[500200,4500212]],north:0}};
  const ns='xmlns:g="http://www.opengis.net/gml/3.2" xmlns:c="http://inspire.ec.europa.eu/schemas/cp/4.0" xmlns:b="http://inspire.ec.europa.eu/schemas/base/3.3"';
  function gml(reference,ring,{crs='25830'}={}){
    const pos=[...ring,ring[0]].map(p=>p.join(' ')).join(' ');
    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- FIXTURE SINTETICO FT3D-8 S1: no es una parcela real -->
<g:FeatureCollection ${ns}>
  <g:featureMember>
    <c:CadastralParcel g:id="ES.SDGC.CP.${reference}">
      <c:geometry><g:MultiSurface srsName="http://www.opengis.net/def/crs/EPSG/0/${crs}"><g:surfaceMember><g:Surface srsName="http://www.opengis.net/def/crs/EPSG/0/${crs}"><g:patches><g:PolygonPatch>
        <g:exterior><g:LinearRing><g:posList srsDimension="2">${pos}</g:posList></g:LinearRing></g:exterior>
      </g:PolygonPatch></g:patches></g:Surface></g:surfaceMember></g:MultiSurface></c:geometry>
      <c:inspireId><b:Identifier><b:localId>${reference}</b:localId><b:namespace>ES.SDGC.CP</b:namespace></b:Identifier></c:inspireId>
      <c:nationalCadastralReference>${reference}</c:nationalCadastralReference>
    </c:CadastralParcel>
  </g:featureMember>
</g:FeatureCollection>`;
  }
  // The provenance the real Catastro provider attaches (catastro-parcel-provider.js): restricted licence.
  const CATASTRO_PROVENANCE=ref=>({providerId:'catastro-inspire-cp',type:'official-source',sourceName:'Dirección General del Catastro · INSPIRE CP',
    sourceUrl:'https://www.catastro.hacienda.gob.es/webinspire/',sourceId:ref,attribution:'Dirección General del Catastro',
    license:{status:'restricted',name:'Licencia de acceso y uso INSPIRE de la DGC',url:'https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf',
      note:'Uso propio permitido; no difundir información original sin transformación.'}});
  // Same result shape as FloorPlanCatastroParcel.provider.getParcel (used where DOMParser is unavailable: Node tests).
  function catastroResult(id){const {Parcel}=deps(),p=PARCELS[id];
    return {status:'available',providerId:'catastro-inspire-cp',parcel:Parcel.normalizeParcel({reference:p.reference,inspireId:{localId:p.reference,namespace:'ES.SDGC.CP'},
      sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[clone(p.ring)]}]}}),provenance:CATASTRO_PROVENANCE(p.reference)};}
  // Node-side stand-in for the provider: same output for the fixture GML (the browser test checks the real one matches).
  const stubProvider=Object.freeze({getParcel({text}){for(const id of Object.keys(PARCELS))if(text===gml(PARCELS[id].reference,PARCELS[id].ring))return catastroResult(id);
    if(/EPSG\/0\/4326/.test(text))return {status:'unsupported',reason:'unsupported-source-crs'};return {status:'invalid',reason:'invalid-source-document'};}});
  function siteFor(id,source){
    const {Core,ParcelSite}=deps(),p=PARCELS[id],parcel=ParcelSite.toSiteParcel(catastroResult(id));
    // Model anchor: centre of the model bounds; parcel anchor: centre of the parcel frame (0,0). Chosen by the professional.
    const projects=source.levels?source.levels.map(l=>l.project):[source];
    const b=Core.geometry(projects[0]).bounds;
    return {parcel,northOffsetDeg:p.north,buildingPlacement:{horizontal:{modelAnchorMm:{x:Math.round(b.x+b.w/2),y:Math.round(b.y+b.h/2)},parcelLocalAnchorMm:{x:0,y:0},source:{type:'user-entered'}},
      vertical:{modelZeroElevationM:612.4,verticalReference:'orthometric',source:{type:'user-entered'}}}};
  }
  // Re-fix the plan and the binding on the revision that includes the parcel (what a professional would do).
  async function resign(c,source){
    const {Adapter}=deps(),fp=await Adapter.fingerprint(source);
    const schedule=c.schedule?{...clone(c.schedule),projectRef:{...c.schedule.projectRef,revision:fp}}:null;
    const binding=c.binding?Adapter.createBinding({id:c.binding.id,source,fingerprints:{project:fp,schedule:await Adapter.fingerprint(schedule),budget:c.budget?await Adapter.fingerprint(c.budget):null},
      scheduleId:c.binding.scheduleId,budgetId:c.binding.budgetId,review:c.binding.review}):null;
    return {schedule,binding};
  }
  const BRANDS={A:{name:'FIXTURE Estudio Norte',person:'FIXTURE Ana Arquitecta',email:'estudio-norte@example.com',tagline:'FIXTURE arquitectura'},
    B:{name:'FIXTURE Constructora Ladera',person:'FIXTURE Bruno',email:'ladera@example.com'},
    C:{name:'FIXTURE Reformas Centro',person:'FIXTURE Carla',email:'centro@example.com'}};
  function brandFor(id,subject){const {Brand}=deps(),profile=Brand.normalizeProfile({...BRANDS[id]},{id:'brd_fx'+id.toLowerCase()+'00001'});
    return {snapshot:{profile,title:'FIXTURE evolución de obra '+id,intro:'FIXTURE presentación sintética',takenAt:'2026-11-05T09:00:00.000Z'},appliesTo:{type:subject.type,id:subject.id}};}
  // Dossier input for Dossier.evaluate (and for the lab). gml: the text the professional loads, associated with this subject.
  async function dossier(id){
    const {Fid,Core,Building}=deps(),c=await Fid.build(id);
    if(id==='D')return {id,label:'D · Sin plan ni parcela',project:c.source,budgets:[c.budget],schedule:null,binding:null,brand:null,gml:null};
    const site=siteFor(id,c.source),source=c.source.levels?Building.setSite(c.source,site):Core.setSite(c.source,site);
    const {schedule,binding}=await resign(c,source),subject={type:source.levels?'building':'project',id:source.id};
    let budgets=c.budget?[c.budget]:[];
    if(id==='B'){const upper=source.levels[1].project;budgets=[c.budgets[0].budget,Fid.budgetFor(upper,{paint:12.5,'opening:window':595,'opening:door':410},['paint'])];}
    return {id,label:c.label,project:source,budgets,schedule,binding,brand:brandFor(id,subject),
      gml:{fileName:'FIXTURE-'+PARCELS[id].reference+'.gml',text:gml(PARCELS[id].reference,PARCELS[id].ring),associatedWith:subject}};
  }
  return Object.freeze({PARCELS,gml,catastroResult,stubProvider,siteFor,brandFor,dossier,ids:['A','B','C','D']});
});
