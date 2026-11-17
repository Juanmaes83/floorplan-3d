import sys,json,yaml,subprocess,pathlib
base,head,out=sys.argv[1:];results=[]
files=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'.github/workflows']).decode().splitlines()
def read(ref,p):return yaml.load(subprocess.check_output(['git','show',ref+':'+p]),Loader=yaml.BaseLoader)
for p in files:
 a,b=read(base,p),read(head,p)
 def normalized(x):return json.dumps(x,sort_keys=True).replace('github.event.pull_request.head.sha }}','github.event.pull_request.head.sha || github.sha }}')
 assert normalized(a['jobs'])==normalized(b['jobs']),p+' changed execution contracts'
 assert all(k in b['on'] and b['on'][k]==v for k,v in a['on'].items()),p+' changed previous triggers'
 assert 'workflow_dispatch' in b['on'],p
 results.append({'workflow':p,'jobsAndAssertions':'unchanged except explicit head SHA fallback for dispatch','existingTriggers':'unchanged','dispatch':'enabled'})
pathlib.Path(out).write_text(json.dumps(results,indent=2)+'\n');print(str(len(results))+' original workflow execution contracts and triggers preserved')
