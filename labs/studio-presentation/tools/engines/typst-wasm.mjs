// Typst.ts (WASM, @myriaddreamin/typst-ts-web-compiler 0.7.0) in Node, offline: the wasm module and every font are
// read from local files; no access model beyond in-memory sources, no package registry, no network.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const PKG=path.join(here,'../node_modules/@myriaddreamin/typst-ts-web-compiler/pkg');
const W=await import(path.join(PKG,'typst_ts_web_compiler.mjs'));
await W.default({module_or_path:fs.readFileSync(path.join(PKG,'typst_ts_web_compiler_bg.wasm'))});
export async function compiler(fontFiles){const b=new W.TypstCompilerBuilder();b.set_dummy_access_model();for(const f of fontFiles)await b.add_raw_font(new Uint8Array(fs.readFileSync(f)));return b.build();}
export function compilePdf(c,src){c.reset_shadow?.();c.add_source('/main.typ',src);const r=c.compile('/main.typ',null,'pdf',0);return r;}
