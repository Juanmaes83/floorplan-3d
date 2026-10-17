// Structural summary of a third-party JSON export (e.g. LoRA LAB's villa) without copying its content.
// Prints the key tree with types and array lengths. String values are redacted to their length, and
// keys that hint at levels, stairs, scale or images are listed with their paths. It does not judge or reuse the model.
// Usage: node scripts/qa/loralab/analyze-export.cjs villa-original.json > villa-structure.md
// (Windows PowerShell 5: pipe to `Out-File -Encoding utf8 villa-structure.md` to avoid UTF-16 output.)
const fs = require('node:fs'), crypto = require('node:crypto');
const file = process.argv[2];
if (!file) { console.error('Usage: node analyze-export.cjs <file.json>'); process.exit(2); }
const bytes = fs.readFileSync(file), data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const HINTS = {
 niveles: /level|floor|storey|story|楼层|层|elev/i,
 escalera: /stair|step|楼梯|台阶/i,
 escala: /scale|unit|mm|meter|metre|pixel|px|比例/i,
 imagen: /image|img|texture|url|src|base64|图/i,
 altura: /height|高/i,
};
const SENSITIVE = [[/[\w.+-]+@[\w-]+\.[\w.]+/, 'email'], [/eyJ[\w-]{10,}\.[\w-]{10,}/, 'jwt'], [/\b(?:token|key|secret|session)\b/i, 'clave'], [/^https?:\/\//i, 'url'], [/^data:/i, 'data-uri']];
const tree = new Map(), hits = Object.fromEntries(Object.keys(HINTS).map(k => [k, new Set()])), sensitive = new Map();
let maxDepth = 0;
function walk(v, p, d) {
 maxDepth = Math.max(maxDepth, d);
 const type = Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v, e = tree.get(p) || {types: new Set(), count: 0, lengths: []};
 e.types.add(type); e.count++; tree.set(p, e);
 if (type === 'array') { e.lengths.push(v.length); v.forEach(x => walk(x, p + '[]', d + 1)); }
 else if (type === 'object') for (const [k, x] of Object.entries(v)) {
  for (const [h, re] of Object.entries(HINTS)) if (re.test(k)) hits[h].add(p + '.' + k);
  walk(x, p + '.' + k, d + 1);
 }
 else if (type === 'string') { e.lengths.push(v.length); for (const [re, kind] of SENSITIVE) if (re.test(v)) sensitive.set(kind, (sensitive.get(kind) || 0) + 1); }
}
walk(data, '$', 0);
const range = a => a.length ? (Math.min(...a) === Math.max(...a) ? `${a[0]}` : `${Math.min(...a)}–${Math.max(...a)}`) : '';
const lines = [
 `# Estructura de ${require('node:path').basename(file)}`, '',
 `- Tamaño: ${bytes.length} bytes; SHA-256 \`${crypto.createHash('sha256').update(bytes).digest('hex')}\`; profundidad máxima ${maxDepth}.`,
 `- Valores de texto **redactados**: sólo se indica su longitud.`,
 `- Posibles datos sensibles (recuento, sin valores): ${[...sensitive].map(([k, n]) => `${k} ${n}`).join(', ') || 'ninguno detectado'}.`, '',
 '## Claves con indicios', '',
 ...Object.entries(hits).map(([h, s]) => `- **${h}:** ${[...s].slice(0, 40).map(x => '`' + x + '`').join(', ') || '—'}`), '',
 '## Árbol de claves', '', '| Ruta | Tipos | Apariciones | Longitud de array o texto |', '| --- | --- | --- | --- |',
 ...[...tree].slice(0, 400).map(([p, e]) => `| \`${p}\` | ${[...e.types].join(', ')} | ${e.count} | ${range(e.lengths)} |`),
 tree.size > 400 ? `\n(${tree.size - 400} rutas más omitidas.)` : '',
];
console.log(lines.join('\n'));
