import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import core from './core.cjs';

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--project' || !argv[1]) {
    throw new Error('Uso: node src/server.mjs --project /ruta/al/proyecto.json');
  }
  return argv[1];
}

const errorResult = error => ({
  isError: true,
  content: [{ type: 'text', text: error instanceof Error ? error.message : 'Error desconocido.' }],
});

function registerReadTool(server, name, title, description, schema, handler) {
  server.registerTool(name, {
    title,
    description,
    inputSchema: schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, async args => {
    try {
      const result = await handler(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      };
    } catch (error) { return errorResult(error); }
  });
}

async function main() {
  const projectPath = parseArgs(process.argv.slice(2));
  const reader = core.createProjectReader(projectPath);
  await reader.load();

  const server = new McpServer({ name: 'rubik-floorplan-readonly', version: '0.1.0' });
  registerReadTool(server, 'get_project_summary', 'Resumen del proyecto',
    'Lee el resumen del JSON Rubik seleccionado al iniciar. Devuelve versión, hash, escala, recuentos y superficie aproximada. Nunca incluye imágenes ni rutas locales.',
    {}, () => core.getSummary(reader));
  registerReadTool(server, 'list_project_elements', 'Listar elementos',
    'Consulta habitaciones, muros, huecos o muebles del único JSON seleccionado. Usa páginas con limit/offset. La respuesta excluye imágenes incrustadas, rutas locales y metadatos no necesarios.',
    { kind: z.enum(['rooms', 'walls', 'openings', 'objects']), query: z.string().optional(), roomId: z.string().optional(), offset: z.number().int().min(0).optional(), limit: z.number().int().min(1).max(100).optional() },
    args => core.listElements(reader, args));
  registerReadTool(server, 'get_project_element', 'Consultar elemento',
    'Obtiene un único elemento del proyecto por ID, sin modificar el archivo.',
    { id: z.string().min(1).max(160) },
    args => core.getElement(reader, args));
  registerReadTool(server, 'review_layout', 'Revisar distribución',
    'Reutiliza la revisión geométrica de Rubik para solapes, holgura indicada explícitamente y barridos de puertas. clearanceMm es opcional: si se omite, holguras queda como insufficient_evidence. El resultado no certifica normativa ni accesibilidad.',
    { clearanceMm: z.number().positive().optional() },
    args => core.reviewLayout(reader, args));

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Rubik MCP local de solo lectura iniciado.\n');
}

main().catch(error => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exitCode = 1;
});
