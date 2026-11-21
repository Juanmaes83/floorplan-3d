import { parseArgs, stripVTControlCharacters } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { lstat, realpath, open, link, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Core from '../../../js/project-core.js';
import Package from '../../../js/project-package.js';
import Tracing from '../../../js/tracing-core.js';
import ProposalV1 from '../../../js/proposal-core.js';
import { createProjectReader } from './core.cjs';
import { createIsolate } from './isolate.cjs';
import { digest } from './simulation.cjs';

const names = new Set(['project.json', 'simulation.json']);
export function entryName(name) {
  if (!names.has(name)) throw new Error('Entrada no válida en el ZIP de revisión.');
  return name;
}

async function directory(path) {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Elige una carpeta local existente y directa.');
  return { path: await realpath(path), dev: stat.dev, ino: stat.ino };
}

export async function exportVariant({ projectPath, outputPath, request, simulationSha256, confirm, signal }) {
  const destination = await directory(resolve(outputPath));
  const reader = createProjectReader(projectPath);
  const { project, snapshot } = await reader.load();
  const result = await createIsolate({ concurrent: 1 }).run('prepareVariant', project, snapshot, request, { signal });
  const { report } = result;
  if (!result.project || report.simulationSha256 !== simulationSha256) {
    throw new Error('La simulación no es exportable o su huella ha cambiado. Vuelve a simular antes de autorizar.');
  }
  const variant = result.project;
  variant.id = `prj_mcp_${randomUUID()}`;
  const suffix = ' — Variante MCP';
  variant.name = project.name.slice(0, 120 - suffix.length).replace(/[\uD800-\uDBFF]$/u, '').trimEnd() + suffix;
  Core.validate(variant);
  const projectBytes = Buffer.from(JSON.stringify(variant));
  if (projectBytes.length > Tracing.LIMITS.jsonBytes) throw new Error('El JSON de la variante supera 15 MiB.');
  const manifest = {
    version: 'RubikVariantReviewV1',
    source: { id: project.id, sha256: snapshot.sha256 },
    variant: { id: variant.id, path: 'project.json', sha256: digest(projectBytes) },
    scope: 'FloorPlanProjectV1 JSON · una planta · solo posición de un mueble existente',
    sourceImageReferences: (variant.sourceImages || []).length,
    attachmentsIncluded: false,
    simulation: report,
  };
  const finalPath = join(destination.path, `rubik-variante-${variant.id.slice(8)}.zip`);
  if (!await confirm({ manifest, finalPath })) return null;
  signal?.throwIfAborted();

  const bytes = await Package.zip(new Map([
    ['project.json', projectBytes],
    ['simulation.json', Buffer.from(JSON.stringify(manifest, null, 2))],
  ]), { check: entryName }).arrayBuffer();
  const temporary = join(destination.path, `.rubik-${randomUUID()}.tmp`);
  const file = await open(temporary, 'wx', 0o600);
  try {
    try {
      await file.writeFile(Buffer.from(bytes), { signal });
      await file.sync();
    } finally { await file.close(); }
    const current = await reader.load();
    if (!ProposalV1.checkFresh(report.proposal.base, current.snapshot.sha256).ok) {
      throw new Error('El original cambió tras la revisión. Vuelve a simular. No se ha guardado la variante.');
    }
    const selected = await directory(resolve(outputPath));
    if (selected.path !== destination.path || selected.dev !== destination.dev || selected.ino !== destination.ino) {
      throw new Error('La carpeta de destino cambió. No se ha guardado la variante.');
    }
    signal?.throwIfAborted();
    // Link publishes the complete archive atomically and fails if the destination already exists.
    await link(temporary, finalPath);
  } finally { await unlink(temporary); }
  return { finalPath, manifest };
}

const required = ['project', 'output-dir', 'object-id', 'goal', 'expected-sha256', 'simulation-sha256'];
const optional = ['opening-id', 'step-mm', 'max-candidates', 'clearance-mm'];
const usage = 'npm run variant -- --project ORIGINAL.json --output-dir CARPETA --object-id ID --goal OBJETIVO --expected-sha256 SHA --simulation-sha256 SHA [--opening-id ID] [--step-mm N] [--max-candidates N] [--clearance-mm N]';

async function main() {
  const options = Object.fromEntries([...required, ...optional].map(name => [name, { type: 'string' }]));
  const { values } = parseArgs({ options: { ...options, help: { type: 'boolean' } } });
  if (values.help) { console.log(usage); return; }
  if (required.some(key => !values[key])) throw new Error(usage);
  if (!process.stdin.isTTY || !process.stderr.isTTY) throw new Error('Abre una terminal interactiva y confirma la variante personalmente.');
  const request = Object.fromEntries([
    ['objectId', values['object-id']], ['goal', values.goal], ['expectedSha256', values['expected-sha256']],
    ['openingId', values['opening-id']], ['stepMm', values['step-mm']], ['maxCandidates', values['max-candidates']],
    ['clearanceMm', values['clearance-mm']],
  ].filter(([, value]) => value !== undefined).map(([name, value]) => [name, ['stepMm', 'maxCandidates', 'clearanceMm'].includes(name) ? Number(value) : value]));
  if (!/^[a-f0-9]{64}$/.test(values['simulation-sha256'])) throw new Error('Indica el simulationSha256 devuelto por simulate_layout.');
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.on('SIGINT', stop);
  try {
    const result = await exportVariant({
      projectPath: values.project, outputPath: values['output-dir'], request,
      simulationSha256: values['simulation-sha256'], signal: controller.signal,
      async confirm({ manifest, finalPath }) {
        const { simulation, source, sourceImageReferences } = manifest;
        const safePath = stripVTControlCharacters(finalPath).replace(/[\x00-\x1f\x7f]/g, '?');
        console.error(JSON.stringify({ original: source, cambios: simulation.affected, revisión: simulation.comparison, límites: simulation.notEvaluated, referenciasDeImágenes: sourceImageReferences, adjuntosIncluidos: false }, null, 2));
        console.error(`Destino: ${safePath}\nSe guardará un ZIP de revisión. Extrae project.json e impórtalo en RUBIK como proyecto independiente.`);
        const phrase = `GUARDAR ${simulation.simulationSha256.slice(0, 8)}`;
        const terminal = createInterface({ input: process.stdin, output: process.stderr });
        terminal.on('SIGINT', stop);
        try { return (await terminal.question(`Escribe «${phrase}» para confirmar: `, { signal: controller.signal })) === phrase; }
        finally { terminal.close(); }
      },
    });
    console.log(result ? JSON.stringify({ file: result.finalPath, variant: result.manifest.variant }) : 'Cancelado. El original y el destino siguen intactos.');
  } finally { process.off('SIGINT', stop); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.name === 'AbortError' ? 'Operación cancelada. El original sigue intacto.' : String(error.message));
    process.exitCode = 1;
  });
}
