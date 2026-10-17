/* three@0.160.0 module source for browser tests. Default: the caller's CDN fetch. When THREE_LOCAL_DIR points
   at an unpacked copy of the official npm package (e.g. `npm pack three@0.160.0`), the same files are read
   locally; use it only where the CDN is unreachable and record it with the test results. */
const fs=require('node:fs/promises'),path=require('node:path');
module.exports=function threeModule(target,fallback){
 const local=process.env.THREE_LOCAL_DIR,prefix='https://cdn.jsdelivr.net/npm/three@0.160.0/';
 if(!local||!String(target).startsWith(prefix))return fallback();
 const file=path.resolve(local,String(target).slice(prefix.length).split('?')[0]);
 if(!file.startsWith(path.resolve(local)+path.sep))return Promise.reject(Error('three path outside THREE_LOCAL_DIR'));
 return fs.readFile(file,'utf8');
};
