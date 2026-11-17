"""Read-only over-approximation. Git objects are data, never executed. Requires PyYAML 6.0.3."""
import sys,json,re,subprocess,posixpath,fnmatch
import yaml
def git(*args): return subprocess.check_output(['git',*args])
def inventory(ref):
 files=git('ls-tree','-r','--name-only',ref).decode().splitlines()
 texts={};paths=[p for p in files if p.endswith(('.js','.cjs','.mjs','.html','.css','.json','.md','.yml','.yaml','.svg','.py'))]
 batch=subprocess.run(['git','cat-file','--batch'],input=('\n'.join(ref+':'+p for p in paths)+'\n').encode(),stdout=subprocess.PIPE,check=True).stdout
 offset=0
 for p in paths:
  end=batch.index(b'\n',offset);size=int(batch[offset:end].split()[-1]);offset=end+1
  texts[p]=batch[offset:offset+size].decode('utf-8',errors='replace');offset+=size+1
 workflows={};owners={};tests=sorted(p for p in files if p.startswith('tests/') and p.endswith('.test.cjs'))
 parts=json.loads(texts.get('tests/regression-partitions.json','{}'))
 for p in files:
  if not p.startswith('.github/workflows/') or not p.endswith(('.yml','.yaml')): continue
  raw=texts[p];data=yaml.load(raw,Loader=yaml.BaseLoader);claimed=set()
  for pattern in re.findall(r'tests/[A-Za-z0-9_./*?{}-]+\.cjs',raw):
   claimed.update(t for t in tests if fnmatch.fnmatchcase(t,pattern))
  if 'check-browser-test-coverage.cjs' in raw:
   claimed.update(parts.get('blocking',[]))
   for group in parts.get('historical',{}).values():claimed.update(group)
  workflows[p]={'name':data.get('name',p),'triggers':data.get('on'), 'jobs':data.get('jobs',{}),'tests':sorted(claimed),'source':raw}
  for t in claimed:owners.setdefault(t,[]).append(p)
 runtime=[p for p in files if not p.startswith(('.git/','docs/','.github/')) and p.endswith(('.js','.cjs','.mjs','.json','.html','.css','.svg','.wasm','.hdr','.png','.webp','.jpg','.glb','.gltf'))]
 documents=[p for p in files if p.startswith('docs/')]
 deps={p:[] for p in files};uncertain=[]
 for p,s in texts.items():
  edges=set()
  if p.endswith(('.js','.cjs','.mjs')) and (re.search(r'(?:readFile|readFileSync|readdir|glob)\s*\(',s) or re.search(r'(?:require|import)\s*\(\s*[^\s\x22\x27`]',s)):
   uncertain.append(p)
  for literal in re.findall(r'[\x22\x27`]([^\x22\x27`\n]+)[\x22\x27`]',s):
   for q in [literal,posixpath.normpath(posixpath.join(posixpath.dirname(p),literal))]:
    for candidate in [q,q+'.js',q+'.cjs',q+'/index.js']:
     if candidate in deps and candidate!=p:edges.add(candidate)
  for literal in re.findall(r'require\s*\(\s*[\x22\x27](\.[^\x22\x27]+)[\x22\x27]\s*\)',s):
   q=posixpath.normpath(posixpath.join(posixpath.dirname(p),literal))
   if not any(x in deps for x in [q,q+'.js',q+'.cjs',q+'/index.js']):uncertain.append(p)
  # Browser fixtures serve arbitrary UMD scripts/assets through index/global state: all runtime is intentional.
  if p in tests and ('.browser.' in p or 'playwright' in s or 'puppeteer' in s): edges.update(runtime)
  # Dynamic docs readers are not assumed independent of any document merely because a literal is absent.
  if p.endswith(('.js','.cjs','.mjs','.py')) and ('docs/' in s or "'docs'" in s or '"docs"' in s):edges.update(documents)
  deps[p]=sorted(edges)
  if p in tests and re.search(r'require\(\s*[^\s\x22\x27]',s):uncertain.append(p)
 unowned=[t for t in tests if t not in owners]
 for t in unowned:owners[t]=sorted(workflows) # conservative owner; never falsely certify exact command coverage
 return {'sha':git('rev-parse',ref).decode().strip(),'files':files,'texts':texts,'tests':tests,'workflows':workflows,'ownership':owners,'dependencies':deps,'uncertainFiles':uncertain,'unresolvedOwnership':unowned,'policy':'browser runtime over-approximation; dynamic documentation readers depend on all documents; unresolved owners force full'}
if __name__=='__main__':
 json.dump(inventory(sys.argv[1]),sys.stdout,ensure_ascii=True)
