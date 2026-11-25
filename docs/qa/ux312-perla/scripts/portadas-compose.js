async page => {
  const D = '/tmp/claude-0/-home-user/77f7999d-dbef-5d2d-b2bb-d65083e0834f/scratchpad/covers/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1000, height: 3600 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await p.goto('file://' + D + 'portadas.html'); await p.waitForTimeout(800);
  const ids = ['recorrido', 'video', 'comparativa', 'asistente', 'estilos', 'entrega'];
  for (const id of ids) await p.locator('#' + id).screenshot({ path: D + 'out-' + id + '.png' });
  await p.screenshot({ path: D + 'todas.png', fullPage: true });
  await ctx.close(); return 'ok';
}
