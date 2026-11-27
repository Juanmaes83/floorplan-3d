async page => { await page.locator('#welcomeExample').click(); await page.waitForFunction(()=>window.FloorPlanDossier&&window.FloorPlanProjectViews); return 'ok'; }
