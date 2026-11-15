#!/usr/bin/env node
/* CAT-04 · evidencias del flujo completo en el editor REAL: ejecuta tests/cat04.browser.test.cjs (mismas aserciones) con
   vídeo (Playwright recordVideo) y capturas; comprueba cada vídeo con ffprobe y una decodificación completa con ffmpeg;
   escribe qa-results/cat04/manifest.json con SHA-256, duración, HEAD, versiones y el resultado de las pruebas.
   Sin red externa ni proveedores (STOP_GASTO). Uso: node scripts/qa/record-cat04.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process');
const ROOT=path.join(__dirname,'../..'),OUT=path.join(ROOT,'qa-results/cat04'),VID=path.join(OUT,'videos'),SHOTS=path.join(OUT,'screens');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(VID,{recursive:true});fs.mkdirSync(SHOTS,{recursive:true});
const run=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/cat04.browser.test.cjs'],{cwd:ROOT,env:{...process.env,CAT04_VIDEO:VID,CAT04_SHOTS:SHOTS},encoding:'utf8',maxBuffer:64<<20});
const tap=run.stdout+run.stderr,count=k=>Number((new RegExp(`^# ${k} (\\d+)`,'m').exec(tap)||[])[1]||0);
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const videos=fs.readdirSync(VID).filter(f=>f.endsWith('.webm')).sort().map(f=>{const p=path.join(VID,f);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',p],{encoding:'utf8'}));
 execFileSync('ffmpeg',['-v','error','-i',p,'-f','null','-']);const st=probe.streams[0]||{};
 return {file:path.relative(ROOT,p),sha256:sha(p),bytes:fs.statSync(p).size,durationS:Math.round(Number(probe.format.duration)*10)/10,codec:st.codec_name,width:st.width,height:st.height,fullDecode:'ok'};});
const screens=fs.readdirSync(SHOTS).filter(f=>f.endsWith('.png')).sort().map(f=>({file:path.relative(ROOT,path.join(SHOTS,f)),sha256:sha(path.join(SHOTS,f))}));
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const manifest={schema:'rubik-cat04-evidence/1',head,generatedAt:new Date().toISOString(),tests:{file:'tests/cat04.browser.test.cjs',pass:count('pass'),fail:count('fail'),exit:run.status},
 tools:{node:process.version,ffmpeg:execFileSync('ffmpeg',['-version'],{encoding:'utf8'}).split('\n')[0]},network:'local server only; external requests aborted; 0 calls to /api/ asserted by the tests',spend:'STOP_GASTO · 0 provider calls',
 data:'synthetic QA catalogue (assets/cat-ia/fixtures, synthetic-fixture) and a synthetic kitchen photo; no client data',videos,screens};
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,1));
console.log(JSON.stringify({pass:manifest.tests.pass,fail:manifest.tests.fail,videos:videos.length,screens:screens.length},null,0));process.exit(run.status===0&&videos.length>=4?0:1);
