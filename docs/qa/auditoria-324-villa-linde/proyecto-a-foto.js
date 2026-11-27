async page => {
 await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 if(await page.locator('[data-view="3d"]').getAttribute('aria-pressed')!=='true') await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&View3D.renderedSource===FloorPlanApp.project&&!View3D.lifecycleMetrics.animating);
 await page.locator('#view3d canvas').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-vista-3d.png'});
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.locator('[data-entrega-code="P2"] .perla-card-selector').click({position:{x:12,y:12}});
 const cases=page.locator('#professionalWorkspace .perla-panel-open .photo-reform-showcase');
 await cases.locator('[data-case-go="interiorismo"]').click();
 const d=page.locator('#photoReformDialog'); const mode=await d.locator('#photoReformIntent').inputValue();
 const finish=await d.locator('#photoReformFinish').inputValue();
 const outgoing=[];page.on('request',r=>{if(['POST','PUT','PATCH'].includes(r.method()))outgoing.push(r.method());});
 await d.locator('#photoReformFile').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-vista-3d.png');
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
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-simulacion-p2.png'});
 return {mode,finish,blockedBeforeConsent,cancelledWithoutDownload,outgoing,realBlocked:await d.locator('#photoReformReal').isDisabled(),downloadBlocked:await d.locator('#photoReformDownload').isDisabled(),status:await d.locator('#photoReformStatus').innerText()};
}


