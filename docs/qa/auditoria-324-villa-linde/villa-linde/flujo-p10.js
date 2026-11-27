async page=>{
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const card=page.locator('[data-entrega-code="P10"]');
 await card.scrollIntoViewIfNeeded();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/P10-edificio.png'});
 return {card:await card.innerText(),buttons:await card.locator('button').evaluateAll(bs=>bs.map(b=>[b.textContent.trim(),b.disabled,b.getAttribute('aria-label')]))};
}
