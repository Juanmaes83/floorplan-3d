from pathlib import Path
import re,sys,subprocess,unicodedata
files=[Path(x) for x in sys.argv[1:]]
def plain(s):
 lines=s.splitlines();out=[];fenced=False
 for line in lines:
  if re.match(r'^\s*```',line):fenced=not fenced;continue
  if not fenced:out.append(line)
 assert not fenced,'Unclosed fence'
 return '\n'.join(out)
for p in files:
 text=plain(p.read_text());cols=None
 for line in text.splitlines():
  if line.startswith('|'):
   count=len(re.split(r'(?<!\\)\|',line))
   if cols is None:cols=count
   assert count==cols,f'{p}: bad table columns: {line}'
  else:cols=None
 for dest in re.findall(r'\]\(([^)]+)\)',text):
  if dest.startswith(('https:','http:')):continue
  target,_,anchor=dest.partition('#');q=p.parent/target if target else p
  assert q.exists(),f'{p}: missing file {dest}'
  if anchor:
   headings=re.findall(r'^#+\s+(.+)',q.read_text(),re.M)
   normalized=[re.sub(r'[^\w\s-]','',re.sub(r'[*`\[\]]','',h).lower()).replace(' ','-') for h in headings]
   assert anchor in normalized,f'{p}: missing anchor {dest}'
 print(p,': Markdown tables/fences, internal links and anchors OK')
