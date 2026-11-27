async page => {
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.locator('[data-entrega-code="P2"] .perla-card-selector').click({position:{x:12,y:12}});
 const cases=page.locator('#professionalWorkspace .perla-panel-open .photo-reform-showcase');
 await cases.locator('[data-case-go="interiorismo"]').click();
 const d=page.locator('#photoReformDialog'); const mode=await d.locator('#photoReformIntent').inputValue();
 const finish=await d.locator('#photoReformFinish').inputValue();
 const outgoing=[];page.on('request',r=>{if(['POST','PUT','PATCH'].includes(r.method()))outgoing.push(r.method());});
 await d.locator('#photoReformFile').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/qa-foto-sintetica.png');
 await d.locator('#photoReformOriginal').waitFor({state:'visible'});
 await d.locator('#photoReformSimulate').click();
 await d.locator('#photoReformStatus').filter({hasText:'Falta tu consentimiento'}).waitFor();
 const blockedBeforeConsent=!(await d.locator('#photoReformResults').isVisible());
 await d.locator('#photoReformConsent').check();
 await d.locator('#photoReformScenario').selectOption('slow');
 await d.locator('#photoReformSimulate').click();
 await d.locator('#photoReformCancel').click();
 await d.locator('#photoReformStatus').filter({hasText:'Cancelado:'}).waitFor();
 const cancelledWithoutDownload=await d.locator('#photoReformDownload').isDisabled();
 await d.locator('#photoReformScenario').selectOption('ok');
 await d.locator('#photoReformSimulate').click();
 await d.locator('#photoReformStatus').filter({hasText:'Simulación terminada'}).waitFor();
 await d.locator('#photoReformStatus').scrollIntoViewIfNeeded();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/villa-linde/P2-fot01-simulacion-movil.png'});
 return {mode,finish,blockedBeforeConsent,cancelledWithoutDownload,outgoing,realBlocked:await d.locator('#photoReformReal').isDisabled(),downloadBlocked:await d.locator('#photoReformDownload').isDisabled(),status:await d.locator('#photoReformStatus').innerText(),proyecto:await page.evaluate(()=>FloorPlanApp.levelContext.buildingName)};
}


