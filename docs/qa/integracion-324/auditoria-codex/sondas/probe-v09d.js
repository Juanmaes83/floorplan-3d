async page => {
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#workArea-deliver').click();await page.waitForTimeout(2000);
 return await page.evaluate(()=>({card:!!document.getElementById('bpdpCard-blueprint'),btns:[...document.querySelectorAll('#bpdpCard-blueprint button, #bpdpCard-blueprint a')].map(b=>b.id+'|'+b.textContent.trim()+'|'+(b.dataset.route||''))}));
}
