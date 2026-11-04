/* Delivery 3D V1 test server: the app's static files plus the REAL /api/share, /api/view, /api/delivery and /api/unshare
   handlers, wired to an in-memory stand-in for the Vercel Blob REST API (PUT upload with random suffix, public GET,
   POST /delete). Nothing leaves the machine; no real store, token or project is used. */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const ENV={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_teststore_0123456789',RUBIK_RENDER_TOKEN:'codigo-de-prueba'};
const STORE='https://teststore.public.blob.vercel-storage.com';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.woff2':'font/woff2'};
function blobStore(){
 const files=new Map(),log=[];
 const res=(status,body,type='application/json')=>({ok:status>=200&&status<300,status,headers:{get:k=>k.toLowerCase()==='content-type'?type:null},json:async()=>JSON.parse(typeof body==='string'?body:JSON.stringify(body)),text:async()=>typeof body==='string'?body:JSON.stringify(body)});
 async function fetchImpl(url,init={}){
  url=String(url);log.push({url,method:init.method||'GET',auth:init.headers?.authorization?'bearer':null});
  if(url.startsWith('https://blob.vercel-storage.com/delete')){const {urls}=JSON.parse(init.body);for(const u of urls)files.delete(u);return res(200,{});}
  if(url.startsWith('https://blob.vercel-storage.com/')&&init.method==='PUT'){
   const p=url.slice('https://blob.vercel-storage.com/'.length),dot=p.lastIndexOf('/')+p.slice(p.lastIndexOf('/')).indexOf('.'),suffix='-'+crypto.randomBytes(5).toString('hex');
   const stored=STORE+'/'+p.slice(0,dot)+suffix+p.slice(dot);files.set(stored,{body:Buffer.from(init.body instanceof Uint8Array?init.body:await new Response(init.body).arrayBuffer()),type:init.headers['x-content-type']});return res(200,{url:stored});}
  if(url.startsWith(STORE+'/')){const f=files.get(url.split('?')[0]);return f?res(200,f.body.toString('utf8'),f.type):res(404,'not found','text/plain');}
  return res(404,'unknown','text/plain');
 }
 return {files,log,fetchImpl};
}
async function start({root=ROOT,three}={}){
 const blob=blobStore();
 const api={share:require(path.join(root,'api/share.js')),view:require(path.join(root,'api/view.js')),delivery:require(path.join(root,'api/delivery.js')),unshare:require(path.join(root,'api/unshare.js'))};
 const server=createServer(async(req,res)=>{
  const u=new URL(req.url,'http://local'),m=/^\/api\/(share|view|delivery|unshare)$/.exec(u.pathname);
  if(m)return api[m[1]].handler(req,res,{env:ENV,fetchImpl:blob.fetchImpl});
  try{const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {server,url:`http://127.0.0.1:${server.address().port}/`,blob,ENV,STORE,close:()=>new Promise(r=>server.close(r))};
}
module.exports={start,ENV,STORE};
