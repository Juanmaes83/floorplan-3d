# HANDOFF · HUMAN-3D / SCULPT — investigación y PREFLIGHT

**Contrato:** [HUMAN-3D-PREFLIGHT-CONTRACT.md](HUMAN-3D-PREFLIGHT-CONTRACT.md)  
**Registro técnico:** [PREFLIGHT-REGISTRY.json](PREFLIGHT-REGISTRY.json)  
**Corte:** P0 documental terminado. **No es SOURCE + ISOLATE**.

## Repositorio y compatibilidad
- RUBIK `master@4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2`; consulta estática de `js/asset-loader.mjs`, `js/asset-catalog.js` y fuentes de F3.
- El validador F3 rechaza skins, morph targets, animaciones, extensiones glTF y texturas que no sean JPEG embebidas; máximo 8 MiB. La ruta de catálogo actualmente supone piezas de catálogo con derechos y dimensiones manifestadas.
- No registrar «human entourage» como SKU o mobiliario comercial. No inventar dimensiones ni historial.

## Candidatos congelados para nueva consulta
- VRM Avatar Maker `ffunch/vrm-avatar-maker@1435345c66da752e0e7a3b6cbae2c09bb1766c98`: MIT code / CC0 assets declarados. Rig y expresiones requieren futuro bake estático.
- HumanForge `abdulrehman043/humanforge@2226df1f50a04c5a8e1c02ea33780d28337dfbb1`: MIT code / CC0 assets declarados. Rig, morph, KHR_quantization, WebP; experimental.
- Quaternius Background Posed Humans (pack 2018; web sin SHA Git oficial): página original CC0, pero QAL v1.0 desde agosto 2026. **No descargar ni redistribuir** hasta verificar licencia concreta dentro de paquete y situación de adquisición; la ficha distingue 20 humanos posados + 8 peinados aunque rotula 28 modelos.

## Evidencias/ejecución
- Remoto GitHub: rutas de fuente y repos consultados; licencias README/ASSETS contrastados.
- Quaternius: páginas de pack, QAL y contraste externo revisadas.
- NO se han obtenido binarios, ni ejecutado build, Vitest, Playwright, glTF-validator, benchmarking ni preview.
- NO se ha tocado producto, master, OP-11/C4, los snapshots GLB previos o Production.

## Propuesta siguiente (necesita GO nuevo)
P1 revisión estricta de licencias por activo y paquete, sin ampliar F3 y sin reabrir OP-09. Empezar por acreditar o descartar derechos de Quaternius, y por decidir el mínimo de escenas humanas deseables para RUBIK; **no traducir esta recomendación en una descarga automática**.

**No abrir merge, ni activar Preview/Production ni conceder permiso implícito de extracción.**
