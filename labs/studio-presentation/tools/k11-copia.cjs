'use strict';
// K11 · Copia AISLADA de la candidata (enlaces duros; el pin no se toca) con los scripts de LABORATORIO K11 cargados tras E3.
// No genera parche productivo: la conexión de interfaz K11 en producto queda propuesta (informe 24), no se aplica.
// Uso: node tools/k11-copia.cjs <pinDir> <destino>
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const [pin,dest]=process.argv.slice(2);if(!pin||!dest){console.error('Uso: node tools/k11-copia.cjs <pinDir> <destino>');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),P=path.resolve(pin),D=path.resolve(dest);
if(fs.existsSync(D)){console.error('El destino ya existe; no se toca: '+D);process.exit(1);}
if(spawnSync('cp',['-al',P,D]).status!==0){console.error('cp falló');process.exit(1);}
const AT='<script src="js/studio-e3-ui.js"></script>';const f=path.join(D,'index.html'),src=fs.readFileSync(f,'utf8');
if(src.split(AT).length!==2)throw new Error('Ancla no única (¿la candidata no integra E3?)');
fs.unlinkSync(f);fs.writeFileSync(f,src.replace(AT,AT+'<script src="k11/k11-core.js"></script><script src="k11/k11-lab-ui.js"></script>'));
fs.mkdirSync(path.join(D,'k11'));for(const x of ['k11-core.js','k11-lab-ui.js'])fs.copyFileSync(path.join(LAB,'k11',x),path.join(D,'k11',x));
if(fs.readFileSync(path.join(P,'index.html'),'utf8').includes('k11/'))throw new Error('El pin cambió');
console.log(JSON.stringify({copia:D}));
