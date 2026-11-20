# Simulator E · comprobación aislada

Preflight de trayectorias de cámara sobre la planta activa. El adaptador recibe la geometría de FloorPlanCore. La herramienta no carga en el editor y su salida distingue trayectorias libres, contactos y cobertura incompleta.

Desde la raíz, ejecutar `node --test scripts/capture/simulator-e/test/motion-preflight.test.cjs` en PowerShell con `$env:RUBIK_ROOT = (Get-Location).Path` o en Bash con `RUBIK_ROOT="$PWD"`.

El manifiesto SOURCE-EXACT.json identifica los blobs recuperados. El handoff conserva los límites y la evidencia de D. La conexión posterior con Presentación, Recorrer y Studio requiere autorización propia y la validación de sus trayectorias reales de D/B.
