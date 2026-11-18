'use strict';
// Baseline only. Probes are inserted into a local HTTP response; the measured checkout stays untouched.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const os = require('node:os');

const root = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const repetitions = Number(process.env.OP02_REPEATS || 2);
const idleMs = 1500;
const K = require(path.join(root, 'tests/photo-project/kit.cjs'));
const blank = require(path.join(root, 'js/tracing-core.js')).blank;
const f3 = require(path.join(root, 'docs/contracts/examples/floorplan-project-v1.f3.example.json'));
const building = require(path.join(root, 'docs/contracts/examples/floorplan-building-v1.example.json'));

function instrument(html) {
  const replacements = [
    ['function loop(){\n  raf = requestAnimationFrame(loop);', 'function loop(){\n  window.__op02.tick();\n  raf = requestAnimationFrame(loop);'],
    ['  if (livingDrawing) livingDrawing.render(scene, camera); else renderer.render(scene, camera);\n  labelRenderer.render(scene, camera);',
      '  const renderStart = performance.now();\n  if (livingDrawing) livingDrawing.render(scene, camera); else renderer.render(scene, camera);\n  labelRenderer.render(scene, camera);\n  window.__op02.frame(renderStart, renderer.info, camera);'],
    ['sigArch = a; buildArch();', 'sigArch = a; const started = performance.now(); buildArch(); window.__op02.build("architecture", started);'],
    ['sigFurn = f; buildFurn();', 'sigFurn = f; const started = performance.now(); buildFurn(); window.__op02.build("furniture", started);'],
  ];
  for (const [from, to] of replacements) {
    assert.equal(html.split(from).length, 2, 'locate each measuring point exactly once');
    html = html.replace(from, to);
  }
  return html;
}

function addBrowserProbe() {
  let recording, pressedAt = null, lastCamera;
  const cameraPose = camera => [...camera.position, ...camera.quaternion];
  window.__op02 = {
    start() {
      recording = { start: performance.now(), callbacks: 0, frameEnds: [], submissionMs: [], builds: [], maxTextures: 0 };
      pressedAt = null;
    },
    stop() {
      const out = { ...recording, durationMs: performance.now() - recording.start };
      recording = null;
      return out;
    },
    tick() { if (recording) recording.callbacks++; },
    build(layer, start) { if (recording) recording.builds.push({ layer, ms: performance.now() - start }); },
    frame(start, info, camera) {
      const pose = cameraPose(camera), priorCamera = lastCamera;
      lastCamera = pose;
      if (!recording) return;
      const now = performance.now();
      recording.frameEnds.push(now);
      recording.submissionMs.push(now - start);
      recording.maxTextures = Math.max(recording.maxTextures, info.memory.textures);
      recording.lastDrawCalls = info.render.calls;
      if (pressedAt !== null && priorCamera && recording.inputToChangedFrameMs === undefined &&
          pose.some((n, i) => Math.abs(n - priorCamera[i]) > 0.000001)) recording.inputToChangedFrameMs = now - pressedAt;
    },
  };
  window.addEventListener('pointerdown', event => {
    if (recording && event.target instanceof HTMLCanvasElement && pressedAt === null) pressedAt = performance.now();
  }, { capture: true });
}

const round = n => Math.round(n * 100) / 100;
function summarize(data, taskDurationMs) {
  const intervals = data.frameEnds.slice(1).map((time, i) => time - data.frameEnds[i]).sort((a, b) => a - b);
  const p95 = values => values.length ? round(values[Math.ceil(values.length * .95) - 1]) : null;
  return {
    tookMs: round(data.durationMs), callbacks: data.callbacks, frames: data.frameEnds.length,
    framesPerSecond: round(data.frameEnds.length * 1000 / data.durationMs),
    frameIntervalP95Ms: p95(intervals), submissionP95Ms: p95([...data.submissionMs].sort((a,b)=>a-b)),
    inputToChangedFrameMs: data.inputToChangedFrameMs == null ? null : round(data.inputToChangedFrameMs),
    rendererThreadTaskMs: round(taskDurationMs), lastDrawCalls: data.lastDrawCalls ?? null,
    maxTextures: data.maxTextures, builds: data.builds.map(b => ({ ...b, ms: round(b.ms) })),
  };
}

async function drag(page, cdp, mobile) {
  const point = await page.locator('#view3d > canvas').first().evaluate(canvas => {
    const { x, y, width, height } = canvas.getBoundingClientRect();
    for (const row of [.55,.4,.7]) for (const col of [.5,.35,.65]) {
      const left = Math.round(x + width * col), top = Math.round(y + height * row);
      if (document.elementFromPoint(left,top) === canvas && document.elementFromPoint(left+60,top-12) === canvas) return {left,top};
    }
    return null;
  });
  assert.ok(point,'orbit drag starts and ends on the 3D canvas');
  const {left,top} = point;
  if (mobile) {
    const touch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    await touch('touchStart', [{ x: left, y: top }]);
    for (let i = 1; i <= 12; i++) await touch('touchMove', [{ x: left + 5*i, y: top - i }]);
    await touch('touchEnd', []);
  } else {
    await page.mouse.move(left, top); await page.mouse.down();
    await page.mouse.move(left + 60, top - 12, { steps: 12 }); await page.mouse.up();
  }
}

async function trial(env, html, scene, profile) {
  const { mobile, width, height, dpr } = profile;
  const context = await env.browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage(), errors = K.watch(page,env.base);
    await page.route(env.base, route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.addInitScript(addBrowserProbe);
    await page.goto(env.base);
    await require(path.join(root, 'tests/editor-fixture.cjs'))(page);
    if (scene !== 'furnished') {
      const project = scene === 'empty' ? blank('OP-02 vacío') : building;
      const previous = await page.evaluate(()=>FloorPlanApp.entryId);
      await page.locator('#fileIn').setInputFiles({ name: scene+'.json', mimeType:'application/json', buffer: Buffer.from(JSON.stringify(project)) });
      await page.waitForFunction(id=>FloorPlanApp.entryId!==id,previous);
      if (scene === 'building') await page.locator('#levelBar [data-level]').last().click();
    } else {
      const importedModel = f3.objects.find(o=>o.assetRef);
      await page.evaluate(model=>{
        const project = structuredClone(FloorPlanApp.project);
        const old = project.objects.find(o=>o.type===model.type);
        if (old) old.assetRef = model.assetRef;
        else {
          const room = project.rooms[0];
          project.objects.push({...model,id:'obj_op02_probe',roomId:room.id,position:room.labelAt||room.polygon[0]});
        }
        FloorPlanApp.importProject(project);
      }, importedModel);
    }
    await page.waitForFunction(()=>!!window.View3D);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    const task = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='TaskDuration').value*1000;
    const sample = async work => {
      const start = await task();
      await page.evaluate(()=>window.__op02.start());
      await work();
      const data = await page.evaluate(()=>window.__op02.stop());
      return summarize(data, (await task())-start);
    };
    const entry = await sample(async()=>{
      await page.locator('#viewSeg [data-view="3d"]').click();
      await page.waitForFunction(()=>View3D.lifecycleMetrics.loopActive&&View3D.contextAvailable);
      if (scene === 'building') {
        await page.locator('#levelViewAll').click();
        await page.waitForFunction(()=>View3D.levelInspect().view==='all');
      }
      await page.waitForFunction(furnished=>{
        const m=View3D.lifecycleMetrics;
        return !m.animating&&!m.flying&&!m.pendingAssets&&(!furnished||View3D.assetMetrics.some(asset=>asset.state==='ready'));
      },scene==='furnished',{timeout:25000});
    });
    const idle = await sample(()=>page.waitForTimeout(idleMs));
    const interaction = await sample(async()=>{ await drag(page,cdp,mobile); await page.waitForTimeout(250); });
    const sceneFacts = await page.evaluate(()=>({
      rooms:FloorPlanApp.project.rooms.length, walls:FloorPlanApp.project.walls.length, objects:FloorPlanApp.project.objects.length,
      levelGroups:View3D.levelInspect().levelGroups.length, canvas:View3D.canvasState,
      assets:View3D.assetMetrics.filter(asset=>asset.state==='ready').map(asset=>({ bytes:asset.bytes, triangles:asset.triangles, durationMs:asset.durationMs })),
    }));
    assert.ok(idle.frames > 0,'active baseline renderer drew frames');
    assert.ok(interaction.inputToChangedFrameMs !== null,scene+' '+profile.name+': pointer caused a camera change');
    assert.deepEqual(errors.errors,[]);
    assert.deepEqual(errors.external,[]);
    return { scene, profile: profile.name, sceneFacts, entry, idle, interaction };
  } finally { await context.close(); }
}

async function main() {
  const source = await fs.readFile(path.join(root, 'index.html'));
  const html = instrument(source.toString('utf8').replace(/\r\n/g,'\n'));
  const env = await K.start();
  try {
    const profiles = [{ name:'desktop', width:1440,height:900,dpr:1,mobile:false },{ name:'touch',width:390,height:844,dpr:2,mobile:true }];
    const result = {
      sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
      indexGitBlob:execFileSync('git',['rev-parse','HEAD:index.html'],{cwd:root,encoding:'utf8'}).trim(),
      servedIndexVariantSha256:createHash('sha256').update(html).digest('hex'),
      node:process.version, chromium:env.browser.version(), os:os.version(), cpu:os.cpus()[0].model,
      renderer:'Chromium SwiftShader software', profiles, repetitions, idleMs, samples:[],
    };
    if (process.env.OP02_RESUME === '1') {
      const {samples,...condition}=JSON.parse(await fs.readFile(output,'utf8'));
      assert.deepEqual(condition,Object.fromEntries(Object.entries(result).filter(([key])=>key!=='samples')));
      result.samples=samples;
    }
    for (const profile of profiles) for (const scene of ['empty','furnished','building']) for (let repeat=0;repeat<repetitions;repeat++) {
      if (result.samples.some(sample=>sample.profile===profile.name&&sample.scene===scene&&sample.repeat===repeat+1)) continue;
      const sample=await trial(env,html,scene,profile);result.samples.push({repeat:repeat+1,...sample});
      console.log(profile.name,scene,repeat+1,'idle fps',sample.idle.framesPerSecond,'camera ms',sample.interaction.inputToChangedFrameMs);
      await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
    }
  } finally { await env.stop(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
