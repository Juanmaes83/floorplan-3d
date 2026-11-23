/* BP-DP · MARCO DE LA EXPERIENCIA (módulo ES): el mismo en la página propia y en la capa sobre RUBIK.
 * Reservas de interfaz MEDIDAS (no supuestas): alto real de la barra superior y del dock → --top-h y --dock-h. Todo lo que
 * flota (cajón, rótulo de fase, leyenda, títulos HERO) se coloca ENTRE ambas, así nada se solapa aunque los botones pasen
 * a dos filas en móvil. */
export const MARKUP = `<div class="stage"></div><div class="annot"></div><div class="caption" aria-live="polite"></div><header class="top"></header><section class="drawer" hidden aria-live="polite"></section><div class="dock"></div>`;
export function shellFor(host) {
  const q = s => host.querySelector(s);
  const shell = { app: host, stage: q('.stage'), annot: q('.annot'), top: q('.top'), dock: q('.dock'), drawer: q('.drawer'), caption: q('.caption'), state: {} };
  const sync = () => { const a = host.getBoundingClientRect(), t = shell.top.getBoundingClientRect(), d = shell.dock.getBoundingClientRect();
    host.style.setProperty('--top-h', Math.max(56, Math.round(t.bottom - a.top)) + 'px'); host.style.setProperty('--dock-h', Math.max(0, Math.round(a.bottom - d.top)) + 'px'); };
  const obs = [new ResizeObserver(sync), new ResizeObserver(sync), new ResizeObserver(sync)]; obs[0].observe(shell.top); obs[1].observe(shell.dock); obs[2].observe(host);
  const mo = new MutationObserver(sync); mo.observe(shell.dock, { childList: true, subtree: true });
  shell.release = () => { obs.forEach(o => o.disconnect()); mo.disconnect(); };
  shell.clear = () => { shell.annot.innerHTML = ''; shell.top.innerHTML = ''; shell.dock.innerHTML = ''; shell.drawer.hidden = true; shell.drawer.innerHTML = ''; shell.caption.textContent = '';
    shell.stage.querySelectorAll('.catcher,.legend').forEach(n => n.remove()); host.querySelectorAll('.modal').forEach(n => n.remove()); };
  return shell;
}
