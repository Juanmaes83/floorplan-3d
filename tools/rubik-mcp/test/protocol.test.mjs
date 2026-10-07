import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Core from '../../../js/project-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const serverPath = path.join(root, 'tools/rubik-mcp/src/server.mjs');

test('MCP stdio exposes read-only project tools and never changes the export', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-protocol-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'project.json');
  const project = Core.initial();
  const original = JSON.stringify(project);
  await writeFile(file, original);

  const client = new Client({ name: 'rubik-mcp-protocol-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath, '--project', file],
  });
  t.after(async () => {
    try { await client.close(); } catch { /* already closed by test */ }
  });
  await client.connect(transport);

  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map(tool => tool.name).sort(), [
    'get_project_element', 'get_project_summary', 'list_project_elements', 'review_layout',
  ]);
  for (const tool of listed.tools) {
    assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
    assert.equal(tool.annotations?.destructiveHint, false, tool.name);
  }

  const summary = await client.callTool({ name: 'get_project_summary', arguments: {} });
  assert.equal(summary.isError, undefined);
  assert.equal(summary.structuredContent.snapshot.projectId, project.id);
  assert.equal(summary.structuredContent.counts.objects, project.objects.length);

  const review = await client.callTool({ name: 'review_layout', arguments: {} });
  assert.equal(review.isError, undefined);
  assert.equal(review.structuredContent.checks.holgura.status, 'insufficient_evidence');

  const object = project.objects[0];
  const element = await client.callTool({ name: 'get_project_element', arguments: { id: object.id } });
  assert.equal(element.structuredContent.item.id, object.id);
  assert.equal(await readFile(file, 'utf8'), original);
});
