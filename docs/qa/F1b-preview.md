# F1b — registro de preview y revisión humana

## Versión revisada

- PR [#6](https://github.com/Juanmaes83/floorplan-3d/pull/6), fusionada en master.
- HEAD de código revisado: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`.
- Merge commit: `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`.
- Deployment Vercel de preview: [abrir deployment ligado al SHA](https://floorplan-3-6cgnmgojz-juanma-espinosas-projects.vercel.app/), estado READY.
- Vercel protegía el URL directo. Se generó URL compartible temporal y Juanma abrió la aplicación; el token caduca el 01-10-2026. No dejar ese token como enlace permanente.
- Tras el merge, Vercel también publicó automáticamente master en producción. Ese deployment no sustituye la revisión de la preview.

## Resultado de revisión

Las capturas mostraron la interfaz española con la vivienda de referencia y el menú Archivo desplegado. La persona usuaria intentó abrir el PNG mediante «Archivo > Importar plano»; esa acción filtra JSON y el selector de Windows oculta imágenes. No es evidencia de que el decoder PNG falle: el PNG debe cargarse por «Plano propio > Nuevo desde imagen». La carga del PNG adjunto por esa ruta queda pendiente de verificación humana.

Juanma autorizó el merge de F1b con esta limitación registrada. No se afirma que se hayan completado todos los puntos de abajo.

## Checklist y estado

- [x] PR de F1b fusionada y deployment READY asociado al SHA revisado.
- [x] Acceso temporal compartible usado para abrir la aplicación.
- [x] Escritorio: interfaz y menú Archivo inspeccionados mediante capturas.
- [ ] Subir el PNG adjunto por «Plano propio > Nuevo desde imagen» y calibrar usando la cota 10,00 m.
- [ ] Confirmar segunda cota, trazado, edición, 2D/3D, ZIP y recuperación en sesión limpia.
- [ ] Recorrer la plataforma táctil en móvil vertical y horizontal.
- [ ] Validar cinco planos reales autorizados según [F1b-five-plans.md](F1b-five-plans.md).
- [ ] Medir rendimiento en móvil físico.

## Mejora inmediata derivada

En el trabajo de formatos/ingesta, separar claramente los dos flujos:
- «Importar proyecto JSON» para .json.
- «Cargar imagen de plano (PNG/JPG)» para el flujo actual de F1b.

La mejora de UX no altera retroactivamente lo observado: el input JSON está haciendo el filtrado esperado y la entrada de imagen existe en otro lugar.