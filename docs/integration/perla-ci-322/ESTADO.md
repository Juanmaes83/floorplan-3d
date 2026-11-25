# Estado · Bloque 1 (CI de PERLA #322)
- Candidata 09eebc9c (árbol 710193b5), base master 6ca70a5b. Worktrees: /home/user/perla (rama claude/perla-ci-322, sin commits) y /home/user/perla-base.
- 16 rojos, 8 causas:
  1. Cobertura: 4 suites perla-* sin CI (pasan 2/2 en local) → añadirlas a «blocking» en tests/regression-partitions.json. Afecta a guard, observe, contract e integration-gate.
  2. professional-workspace Point9 (falla en 4 trabajos; pasa en master):
     a) 390x844: «← Volver a Entregar» (js/perla-return.js, en .perla-r2) hace crecer r2 de 148 a 192 px y el lienzo pasa de 531 a 487. Regresión real. Probar order:5 en la fila del progreso: el primer intento no surtió efecto y se revirtió; la regla con max-width:760px no aplica tal cual, hay que revisar más reglas del mismo media query. Sonda: scratchpad/perla/r2.cjs.
     b) Botón «← Volver a Diseñar» no encontrado: perla-return cambia su texto a «← Volver a <origen>». Revisar el flujo del test (línea 88).
  3. Tableta 820x1180: aside.right abierto intercepta #tgPanel (ux08 ×2; upload OP-04 tests 38 y 44).
  4. capture-3d (trabajo solar): opciones PNG, discrepancia en la aserción.
  5. assistant-ai-v2 test 9: no aparece [data-route=client-link|client-file].
  6. anchored-comments B6: la descarga agota el tiempo; tour-video SCULPT: 240 s.
  7. presentation R2 P05 360x800: #guideCopyExample no estable.
  8. bpdp-candidate: memoria Δ24,7 MB; bpdp-routes: e3-descargar-blueprint-video no visible.
- Registros en /root/.claude/projects/-home-user/f18da444-ec78-5298-b836-06fe16cf01e3/tool-results/mcp-github-get_job_logs-17955983*.txt

## Cola según el encargo actualizado (89bae1ff, rama documental `codex/encargo-cierre-perla-visualizacion`)
1. Cierre de PERLA #322 (en curso: causas 1–2 hechas; 3–8 pendientes; luego SHA y deltas a Codex).
2. Visualización y Home: Render IA, rodaje local, Asesor junto al retrato **y §2.1** (perfil y catálogo de capacidades comunes a consulta guiada, texto IA, voz y avatar; memoria bajo control; traspaso de contexto; proveedores simulados primero en Chromium). Correcciones de CI en commits separados de prestaciones nuevas.
3. Presupuestos y geometría: MSPDI #320, BCCA, A0 y muros.
4. **§8 Examen del MVP** (cinco proyectos sintéticos de principio a fin) solo sobre la candidata MVP cerrada y antes del piloto. Mientras tanto, preparar protocolo, hojas de referencia y casos sin mezclarlos con pruebas de desarrollo.
