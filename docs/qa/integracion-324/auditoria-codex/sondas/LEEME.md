# Sondas de la auditoría #324

Ejecutor y sondas usados para reproducir V01–V09.

**Uso:** `node run.cjs <árbol-del-repo> <proc.js> [proc2.js …]`, con `CHROME` apuntando a Chromium.

**Preparación:**
- Extrae la carpeta de Codex con `git archive 87f4661b docs/qa/auditoria-324-villa-linde`.
- Copia su contenido a `ws/output/auditoria-324/`, junto a `run.cjs`. Allí apuntan las rutas `AUDIT_WORKSPACE`.

**Contenido:**
- `probe-v08*`: diagnóstico de la cubierta de Villa Linde.
- `probe-v09*`: medición de la barra de Blueprint. `probe-v09e` es el Blueprint integrado en Entregar, sin verificar todavía.
- `evid-v01v02.js`: genera las salidas publicadas en `../salidas/`.
