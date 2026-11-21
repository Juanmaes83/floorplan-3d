'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const kit = require('../../tests/r02a/editor-kit.cjs');
const { scenario } = require('../../tools/rubik-mcp/fixtures/proposal-projects.cjs');
const Package = require('../../js/project-package.js');

const mcp = path.join(kit.ROOT, 'tools', 'rubik-mcp');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const probe = file => JSON.parse(execFileSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height', '-of', 'json', file,
], { encoding: 'utf8' }));

async function record(out, evidenceBrowser = 'chromium') {
  await fs.mkdir(out, { recursive: true });
  const env = await kit.start();
  let browser = env.browser, context, video, client;
  try {
    if (evidenceBrowser !== 'chromium') browser = await require('playwright')[evidenceBrowser].launch();
    const editor = await kit.editor({ ...env, browser }, { viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce', ...(evidenceBrowser === 'chromium' ? { recordVideo: { dir: out, size: { width: 1120, height: 700 } } } : {}) });
    const { page, watch } = editor;
    context = editor.context;
    video = page.video();
    const capture = async name => {
      if (evidenceBrowser === 'chromium') {
        await page.screenshot({ path: path.join(out, name + '.png') });
        // Pause the recorded walkthrough at evidence frames so the reviewer can read them.
        await new Promise(resolve => setTimeout(resolve, 2200));
      }
    };
    const download = async (control, file) => {
      const fileReady = page.waitForEvent('download');
      await control.click();
      await (await fileReady).saveAs(file);
    };
    const assistant = page.getByRole('button', { name: 'Abrir el asistente RUBIK', exact: true });
    const question = async text => {
      await page.locator('#assistantInput').fill(text);
      await page.locator('#assistantSend').click();
      await page.waitForFunction(() => !RubikAssistantUI.state.pending);
    };
    await assistant.click();
    await question('¿Qué conflictos tiene la distribución?');
    assert.match(await page.textContent('#assistantLog'), /FloorPlanLayoutReview/);
    await question('Mueve el sofá 20 cm a la izquierda');
    const before = await page.evaluate(() => snap());
    assert.deepEqual(await page.locator('.assistant-diff-values dt').allTextContents(), ['Antes', 'Después']);
    await capture('01-asistente-antes-despues');
    await page.locator('#assistantApply').click();
    assert.notEqual(await page.evaluate(() => snap()), before);
    await page.locator('#assistantUndo').click();
    assert.equal(await page.evaluate(() => snap()), before);
    await page.locator('#assistantClose').click();

    // Test double for the provider. The real browser still executes the live RUBIK tools.
    const calls = [];
    await page.route('**/api/assistant', async route => {
      const req = route.request(), body = JSON.parse(req.postData());
      if (body.action === 'status') return route.fulfill({ json: {
        enabled: true, reason: 'ok', model: 'QA-simulado', priceDate: '2026-11-21', capUsd: 1, spentUsd: 0,
      } });
      calls.push(body);
      return route.fulfill({ json: calls.length === 1
        ? { type: 'tool_calls', calls: [{ id: 'm05_summary', name: 'get_project_summary', arguments: '{}' }] }
        : { type: 'message', text: 'QA con proveedor simulado. La revisión usa el resumen del proyecto abierto.', usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } } });
    });
    await assistant.click();
    await page.locator('#assistantClear').click();
    await page.locator('#assistantModeGen').click();
    await page.waitForFunction(() => RubikAssistantGenUI.active());
    await page.locator('#assistantConsentQuestion').check();
    await page.locator('#assistantConsentData').check();
    await question('¿Qué datos puedes comprobar de esta vivienda?');
    assert.equal(calls.length, 2);
    assert.ok(calls[1].messages.some(m => m.role === 'tool' && m.name === 'get_project_summary'));
    assert.match(await page.textContent('#assistantLog'), /QA con proveedor simulado/);
    assert.equal(await page.evaluate(() => snap()), before);
    await capture('02-asistente-v3-proveedor-simulado');
    await page.locator('#assistantModeGuided').click();
    await page.locator('#assistantClose').click();

    const fixture = scenario('overlap');
    fixture.id = 'prj_m05-synthetic-layout';
    fixture.name = 'Vivienda sintética MCP — revisión';
    await page.locator('#fileIn').setInputFiles({ name: 'mcp-qa.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
    await page.waitForFunction(id => FloorPlanApp.project.id === id, fixture.id);
    await assistant.click();
    await page.locator('#assistantMcp summary').click();
    const sourcePath = path.join(out, 'original-exportado-rubik.json');
    await download(page.getByRole('button', { name: 'Guardar JSON para MCP', exact: true }), sourcePath);
    await page.locator('#assistantClose').click();
    const original = await fs.readFile(sourcePath);
    assert.deepEqual(JSON.parse(original), fixture);
    await capture('03-mcp-plano-original');

    const sdk = subpath => require(require.resolve('@modelcontextprotocol/sdk/' + subpath, { paths: [mcp] }));
    client = new (sdk('client/index.js').Client)({ name: 'rubik-m05-evidence', version: '1.0.0' });
    await client.connect(new (sdk('client/stdio.js').StdioClientTransport)({
      command: process.execPath, args: [path.join(mcp, 'src', 'server.mjs'), '--project', sourcePath],
    }));
    const call = async (name, args = {}) => {
      const reply = await client.callTool({ name, arguments: args });
      assert.equal(reply.isError, undefined, JSON.stringify(reply));
      return reply.structuredContent;
    };
    const diagnosis = await call('diagnose_project');
    assert.equal(diagnosis.valid, true);
    const summary = await call('get_project_summary');
    assert.equal(summary.snapshot.sha256, sha(original));
    const request = { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: sha(original) };
    const proposal = await call('propose_layout', request);
    assert.equal(proposal.status, 'candidate-reviewable');
    const simulation = await call('simulate_layout', request);
    assert.equal(simulation.comparison.before.review.counts.solape, 1);
    assert.equal(simulation.comparison.after.review.counts.solape, 0);
    const { exportVariant, entryName } = await import(pathToFileURL(path.join(mcp, 'src', 'export-variant.mjs')));
    const variant = await exportVariant({ projectPath: sourcePath, outputPath: out, request, simulationSha256: simulation.simulationSha256,
      confirm: ({ manifest }) => manifest.simulation.simulationSha256 === simulation.simulationSha256 });
    const archive = await Package.unzip(await fs.readFile(variant.finalPath), {
      check: entryName, maxEntries: 2, jsonNames: ['project.json', 'simulation.json'],
    });
    const variantBytes = Buffer.from(archive.get('project.json'));
    assert.equal(sha(variantBytes), variant.manifest.variant.sha256);
    await page.locator('#fileIn').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: variantBytes });
    await page.waitForFunction(id => FloorPlanApp.project.id === id, variant.manifest.variant.id);
    assert.deepEqual(await page.evaluate(() => FloorPlanApp.project), JSON.parse(variantBytes));
    await capture('04-mcp-variante-reabierta');
    const untouched = await page.evaluate(id => library.projects().find(item => item.id === id), fixture.id);
    assert.deepEqual(untouched, fixture);
    assert.deepEqual(await fs.readFile(sourcePath), original);
    assert.deepEqual(watch.errors, []);
    assert.deepEqual(watch.external, []);
    await context.close();
    context = null;
    const evidence = { browser: evidenceBrowser, browserVersion: browser.version(), node: process.version,
      synthetic: true, paymentCalls: 0, provider: 'Test double + real browser tools', diagnosis, proposal, simulation,
      variant: { ...variant.manifest.variant, archive: path.basename(variant.finalPath) }, originalBytesIntact: true, variantReopened: true };
    if (video) {
      const recording = path.join(out, 'recorrido-m05.webm');
      await video.saveAs(recording);
      const rawPath = await video.path();
      if (rawPath !== recording) await fs.unlink(rawPath);
      evidence.video = probe(recording);
      assert.ok(Number(evidence.video.format.duration) > 0);
      execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-i', recording, '-f', 'null', '-']);
    }
    await fs.writeFile(path.join(out, 'resultado.json'), JSON.stringify(evidence, null, 2) + '\n');
    const files = (await fs.readdir(out)).filter(name => name !== 'MANIFEST.sha256').sort();
    await fs.writeFile(path.join(out, 'MANIFEST.sha256'), (await Promise.all(files.map(async name =>
      `${sha(await fs.readFile(path.join(out, name)))}  ${name}`))).join('\n') + '\n');
    console.log(`M05 PASS ${evidenceBrowser} ${browser.version()} · ${out}`);
  } finally {
    await client?.close();
    await context?.close();
    if (browser !== env.browser) await browser.close();
    await env.stop();
  }
}

if (require.main === module) record(path.resolve(process.argv[2] || 'qa-results/m05'), process.argv[3])
  .catch(error => { console.error(error); process.exitCode = 1; });
