/* Data strings never enter the HTML/SVG parser. They are bound to inert nodes afterwards. */
(function(root){
  'use strict';
  const values=new Map();let serial=0;
  const prefix=`FPDATA${root.crypto.randomUUID().replaceAll('-','')}X`;
  const pattern=new RegExp(`${prefix}\\d+END`,'g');
  function value(input){const token=`${prefix}${++serial}END`;values.set(token,String(input));return token;}
  function markup(element, source){
    const used=new Set();
    const resolve=s=>s.replace(pattern, token=>{used.add(token);return values.get(token)??token;});
    const template=document.createElement('template');
    const svg=element.namespaceURI==='http://www.w3.org/2000/svg';
    template.innerHTML=svg?`<svg xmlns="http://www.w3.org/2000/svg">${source}</svg>`:source;
    const fragment=svg?template.content.firstChild:template.content;
    const walk=document.createTreeWalker(fragment,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    let node;
    while((node=walk.nextNode())){
      if(node.nodeType===Node.TEXT_NODE)node.textContent=resolve(node.textContent);
      else for(const attr of [...node.attributes])if(attr.value.includes(prefix))node.setAttribute(attr.name,resolve(attr.value));
    }
    element.replaceChildren(...fragment.childNodes);
    for(const token of used)values.delete(token);
  }
  root.SafeDOM={value,markup};
})(globalThis);
