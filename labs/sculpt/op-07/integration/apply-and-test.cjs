'use strict';
/* OP-07 · Aplica los parches S1–S6 sobre una base (por defecto origin/master) en un worktree temporal y ejecuta sus
   pruebas. No toca el árbol de trabajo ni ninguna rama: el worktree se borra al terminar.
   Uso: node labs/sculpt/op-07/integration/apply-and-test.cjs [base] [--browser] [--full]
     --browser  añade las dos pruebas de navegador de OP-07 (CHROME y THREE_LOCAL_DIR como en el resto del repo)
     --full     añade la suite pura completa del repositorio */
const {execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const args=process.argv.slice(2),base=args.find(a=>!a.startsWith('--'))||'origin/master';
const repo=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim(),dir=path.join(__dirname,'..','patches');
const ORDER=['S1-contrato','S2-geometria-plano','S3-mediciones','S6-dxf','S4-3d','S5-edicion'];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'op07-apply-')),run=(cmd,a,o={})=>execFileSync(cmd,a,{cwd:tmp,stdio:'inherit',...o});
try{
 execFileSync('git',['worktree','add','--detach',tmp,base],{cwd:repo,stdio:'inherit'});
 for(const p of ORDER){process.stdout.write(`\n== ${p}\n`);run('git',['-c','user.name=op07','-c','user.email=op07@local','am','--3way',path.join(dir,p+'.patch')]);}
 const tests=fs.readdirSync(path.join(tmp,'tests')).filter(f=>/^op07-.*\.test\.cjs$/.test(f)&&(args.includes('--browser')||!f.includes('.browser.'))).map(f=>'tests/'+f);
 run('node',['--test',...tests]);
 if(args.includes('--full'))run('node',['--test',...fs.readdirSync(path.join(tmp,'tests')).filter(f=>f.endsWith('.test.cjs')&&!f.includes('.browser.')).map(f=>'tests/'+f)]);
 console.log(`\nOK · parches aplicados sobre ${execFileSync('git',['rev-parse','--short',base],{cwd:repo,encoding:'utf8'}).trim()} y pruebas en verde`);
}finally{execFileSync('git',['worktree','remove','--force',tmp],{cwd:repo,stdio:'inherit'});}
