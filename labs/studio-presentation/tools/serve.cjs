// Static server for the lab: serves the RUBIK repository root with correct MIME types (the 3D view needs .hdr/.glb/.wasm).
// Local only (127.0.0.1). Usage: require('./serve.cjs')(root) → {url, close}
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.hdr':'application/octet-stream','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.wasm':'application/wasm','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.pdf':'application/pdf'};
module.exports=async function serve(root){
 const server=http.createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));
  if(!f.startsWith(path.resolve(root)))throw 0;res.setHeader('Content-Type',TYPES[path.extname(f).toLowerCase()]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {url:`http://127.0.0.1:${server.address().port}/`,close:()=>new Promise(r=>server.close(r))};
};
