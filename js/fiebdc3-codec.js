/* FIEBDC-3/2024 subset codec. No provider, budget, IO, DOM or network dependency. */
(function(root){
  'use strict';
  const fail=(code,message)=>{const error=new TypeError(`FloorPlanFIEBDC3 ${code}: ${message}`);error.code=code;throw error;};
  const HIGH_850="\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00f8\u00a3\u00d8\u00d7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u00ae\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u00c1\u00c2\u00c0\u00a9\u2563\u2551\u2557\u255d\u00a2\u00a5\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u00e3\u00c3\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u00a4\u00f0\u00d0\u00ca\u00cb\u00c8\u0131\u00cd\u00ce\u00cf\u2518\u250c\u2588\u2584\u00a6\u00cc\u2580\u00d3\u00df\u00d4\u00d2\u00f5\u00d5\u00b5\u00fe\u00de\u00da\u00db\u00d9\u00fd\u00dd\u00af\u00b4\u00ad\u00b1\u2017\u00be\u00b6\u00a7\u00f7\u00b8\u00b0\u00a8\u00b7\u00b9\u00b3\u00b2\u25a0\u00a0";
  const HIGH_437="\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00a2\u00a3\u00a5\u20a7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u2310\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580\u03b1\u00df\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0\u00a0";
  // FIEBDC calls Windows' character set ANSI; this bounded codec uses Windows-1252.
  const ANSI_80_9F="\u20ac\u0000\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u0000\u017d\u0000\u0000\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u0000\u017e\u0178";
  const TABLES={'850':HIGH_850,'437':HIGH_437,ANSI:ANSI_80_9F+Array.from({length:96},(_,i)=>String.fromCharCode(i+160)).join('')};
  const reverse=Object.fromEntries(Object.entries(TABLES).map(([name,table])=>[name,new Map([...table].map((char,i)=>[char,i+128]).filter(([char])=>char!=='\u0000'))]));
  const encodingName=value=>{
    const name=value==null||value===''?'850':String(value);
    if(!Object.hasOwn(TABLES,name))fail('unsupported-encoding',`character set ${name}`);
    return name;
  };
  function declaredEncoding(ascii){
    const match=ascii.match(/~V\|([^~]*)/);
    if(!match)return '850';
    const fields=match[1].split('|');
    return encodingName((fields[4]||'').trim());
  }
  function decode(bytes){
    if(!(bytes instanceof Uint8Array))fail('invalid-input','decode expects Uint8Array');
    const ascii=Array.from(bytes,b=>String.fromCharCode(b<128?b:63)).join('');
    const encoding=declaredEncoding(ascii),table=TABLES[encoding];
    let text='';
    for(const byte of bytes){
      if(byte<128)text+=String.fromCharCode(byte);
      else {const char=table[byte-128];if(char==='\u0000'||char===undefined)fail('invalid-encoding',`undefined ${encoding} byte 0x${byte.toString(16)}`);text+=char;}
    }
    return {text,encoding};
  }
  function encode(text,encoding){
    if(typeof text!=='string')fail('invalid-input','encode expects text');
    const name=encodingName(encoding===undefined?declaredEncoding(text):encoding),mapping=reverse[name],out=[];
    for(const char of text){
      const point=char.codePointAt(0);
      if(point<128)out.push(point);
      else if(mapping.has(char))out.push(mapping.get(char));
      else fail('unrepresentable-character',`${JSON.stringify(char)} cannot be encoded as ${name}`);
    }
    return Uint8Array.from(out);
  }
  const textField=(value,label)=>{
    if(typeof value!=='string')fail('invalid-model',`${label} must be text`);
    if(/[~|\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))fail('invalid-field',`${label} contains a record delimiter or control`);
    return value;
  };
  const code=value=>{
    if(typeof value!=='string'||!value||value.length>22||!/^[A-Za-z0-9ñÑ.\-$#%&_]+$/.test(value))fail('invalid-code',`invalid concept code ${JSON.stringify(value)}`);
    return value;
  };
  const number=(raw,label)=>{
    if(raw==='')return null;
    if(!/^[+-]?\d+(?:\.\d+)?$/.test(raw)||!Number.isFinite(Number(raw)))fail('invalid-number',`${label}: ${JSON.stringify(raw)}`);
    return Number(raw);
  };
  const date=(raw,label)=>{
    if(raw==='')return null;
    if(!/^\d{1,8}$/.test(raw))fail('invalid-date',`${label}: ${JSON.stringify(raw)}`);
    return raw; // BC3 permits partial DDMMYYYY dates; do not invent missing precision.
  };
  const sub=(raw)=>{const parts=raw.split('\\');if(parts.at(-1)==='')parts.pop();return parts;};
  const field=(record,index)=>record.fields[index]??'';
  const group=(raw,width,label,parser)=>{
    if(raw==='')return [];
    const parts=sub(raw);
    if(parts.length%width)fail('truncated-record',`${label} has incomplete subfields`);
    const result=[];
    for(let i=0;i<parts.length;i+=width)result.push(parser(parts.slice(i,i+width),i/width));
    return result;
  };
  function lex(text){
    if(typeof text!=='string')fail('invalid-input','parse expects text or Uint8Array');
    if(!text.endsWith('\x1a'))fail('missing-eof','BC3 must end with ASCII 26');
    const body=text.slice(0,-1);
    if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body))fail('invalid-control','unexpected control byte');
    if(/(^|[^\r])\n|\r(?!\n)/.test(body))fail('invalid-line-ending','BC3 line endings must be CRLF');
    if(!/^\s*~/.test(body))fail('malformed-file','missing first record');
    const chunks=body.split('~').slice(1),records=[];
    for(const [index,chunk] of chunks.entries()){
      const trimmed=chunk.replace(/[ \t\r\n]+$/,'');
      if(!trimmed.endsWith('|'))fail('truncated-record',`record ${index+1} lacks final field separator`);
      const pieces=trimmed.slice(0,-1).split('|');
      const type=pieces.shift()?.trim();
      if(!/^[A-Z]$/.test(type))fail('malformed-record',`record ${index+1} has invalid header`);
      records.push({type,fields:pieces.map(part=>part.replace(/[ \t\r\n]+$/,''))});
    }
    if(records.length===0)fail('malformed-file','no records');
    return records;
  }
  function semantic(records,encoding){
    if(records[0].type!=='V')fail('missing-version','first BC3 record must be ~V');
    const model={format:'FIEBDC-3',encoding,version:null,coefficients:[],concepts:[],decompositions:[],texts:[],scopes:[],records:records.map(r=>({type:r.type,fields:[...r.fields]})),warnings:[]};
    const codes=new Set();
    for(const [index,r] of records.entries()){
      const f=i=>field(r,i),where=`~${r.type} record ${index+1}`;
      if(r.type==='V'){
        if(model.version)fail('duplicate-record','multiple ~V records');
        const versionParts=sub(f(1));if(!versionParts[0])fail('malformed-record','~V needs VERSION_FORMATO');
        const headers=sub(f(3));
        model.version={owner:f(0)||null,format:versionParts[0],date:date(versionParts[1]||'',where),program:f(2)||null,
          priceHeader:headers[0]||null,labels:headers.slice(1).filter(Boolean),declaredEncoding:f(4)||null,
          comment:f(5)||null,informationType:f(6)||null,certificationNumber:f(7)||null,
          certificationDate:date(f(8),where),baseUrl:f(9)||null};
        if(encodingName(f(4))!==encoding)fail('encoding-mismatch','~V declaration differs from decoded bytes');
      }else if(r.type==='K'){
        const legacy=group(f(0),9,where,(p)=>p.map((x,i)=>i===8?(x||null):number(x,where)));
        const percentages=f(1)===''?[]:sub(f(1)).map(x=>number(x,where));
        if(percentages.length>5)fail('malformed-record','~K has too many percentages');
        const current=group(f(2),13,where,(p)=>p.map((x,i)=>i===12?(x||null):number(x,where)));
        model.coefficients.push({legacyGroups:legacy,percentages,currentGroups:current,count:number(f(3),where)});
      }else if(r.type==='C'){
        const aliases=sub(f(0)).map(code);if(!aliases.length)fail('malformed-record','~C needs a code');
        for(const alias of aliases){if(codes.has(alias))fail('duplicate-code',alias);codes.add(alias);}
        const rawPrices=f(3)===''?[]:sub(f(3)).map((x,i)=>number(x,`${where} price ${i}`));
        const rawDates=f(4)===''?[]:sub(f(4)).map((x,i)=>date(x,`${where} date ${i}`));
        const type=f(5)===''?null:f(5);
        const concept={code:aliases[0],aliases,unit:f(1)||null,summary:f(2)||null,type,
          explicitPrices:rawPrices,explicitDates:rawDates,prices:[]};
        model.concepts.push(concept);
      }else if(r.type==='D'){
        const parent=code(f(0));
        const parseOld=p=>({child:code(p[0]),factor:number(p[1],where),yield:number(p[2],where),percentageCodes:null});
        const parseNew=p=>({child:code(p[0]),factor:number(p[1],where),yield:number(p[2],where),percentageCodes:p[3]||null});
        const legacy=group(f(1),3,where,parseOld),current=group(f(2),4,where,parseNew);
        if(!legacy.length&&!current.length)fail('malformed-record','~D needs a child');
        model.decompositions.push({parent,legacy,current,children:current.length?current:legacy});
      }else if(r.type==='T'){
        model.texts.push({code:code(f(0)),text:f(1)});
      }else if(r.type==='W'){
        const parts=sub(f(0)),scopes=[];
        for(let i=0;i<parts.length;i+=2)scopes.push({abbreviation:parts[i],name:parts[i+1]||null});
        if(!scopes.length||scopes.some(s=>!s.abbreviation))fail('malformed-record','~W needs an abbreviation');
        model.scopes.push(...scopes);
      }else model.warnings.push({code:'unsupported-record',recordIndex:index,type:r.type});
    }
    const labels=model.version?.labels||[];
    for(const concept of model.concepts){
      const count=Math.max(concept.explicitPrices.length,labels.length);
      if(!concept.explicitPrices.length)continue;
      for(let i=0;i<count;i++){
        const p=Math.min(i,concept.explicitPrices.length-1),d=Math.min(i,concept.explicitDates.length-1);
        concept.prices.push({index:i,label:labels[i]||null,value:concept.explicitPrices[p],date:d<0?null:concept.explicitDates[d],
          inheritedPrice:i>=concept.explicitPrices.length,inheritedDate:concept.explicitDates.length>0&&i>=concept.explicitDates.length});
      }
    }
    const known=new Set(model.concepts.flatMap(c=>c.aliases));
    const update=model.version?.informationType==='4';
    for(const d of model.decompositions){
      for(const target of [d.parent,...d.children.map(c=>c.child)])if(!known.has(target)){
        if(update)model.warnings.push({code:'unresolved-concept',conceptCode:target});
        else fail('unresolved-concept',`~D references ${target}`);
      }
    }
    for(const t of model.texts)if(!known.has(t.code)){
      if(update)model.warnings.push({code:'unresolved-concept',conceptCode:t.code});
      else fail('unresolved-concept',`~T references ${t.code}`);
    }
    return model;
  }
  function parse(input){
    const decoded=typeof input==='string'?{text:input,encoding:declaredEncoding(input)}:decode(input);
    return semantic(lex(decoded.text),decoded.encoding);
  }
  function serialize(model){
    if(!model||typeof model!=='object'||!Array.isArray(model.records)||!model.records.length)fail('invalid-model','records are required');
    const records=model.records.map((r,index)=>{
      if(!r||typeof r!=='object'||!/^[A-Z]$/.test(r.type)||!Array.isArray(r.fields))fail('invalid-model',`record ${index+1} is invalid`);
      for(const [fieldIndex,value] of r.fields.entries())textField(value,`record ${index+1} field ${fieldIndex+1}`);
      return `~${r.type}|${r.fields.join('|')}|`;
    });
    const text=records.join('\r\n')+'\r\n\x1a';
    const checked=parse(text);
    if(model.encoding!==undefined&&model.encoding!==checked.encoding)fail('encoding-mismatch','model encoding differs from ~V');
    for(const key of ['version','coefficients','concepts','decompositions','texts','scopes','warnings']){
      if(Object.hasOwn(model,key)&&JSON.stringify(model[key])!==JSON.stringify(checked[key]))
        fail('model-record-mismatch',`${key} differs from the authoritative record ledger`);
    }
    return text;
  }
  function validate(model){return parse(serialize(model));}
  function encodeModel(model){return encode(serialize(model),model.encoding);}
  const api=Object.freeze({decode,encode,parse,serialize,validate,encodeModel});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanFIEBDC3=api;
})(globalThis);
