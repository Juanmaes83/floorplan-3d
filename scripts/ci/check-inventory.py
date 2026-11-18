import json,sys,yaml
j=json.load(open(sys.argv[1]));assert not j['unresolvedOwnership'],j['unresolvedOwnership']
for path,w in j['workflows'].items():
 data=yaml.load(w['source'],Loader=yaml.BaseLoader)
 assert 'workflow_dispatch' in data['on'],path+' cannot be included in manual/periodic full round'
 assert isinstance(data['jobs'],dict),path
for t in j['tests']:assert j['ownership'].get(t),t
print(str(len(j['workflows']))+' workflows, '+str(len(j['tests']))+' test files, zero unresolved owners; dispatch contracts valid')
