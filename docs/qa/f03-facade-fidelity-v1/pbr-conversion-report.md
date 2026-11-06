# F03 — Informe de conversión PBR verificada

## Resultado

Los tres paquetes prioritarios tienen derivados WebP en perfiles `hero` 1024×1024 y `balanced` 512×512. Las fuentes 4K permanecen intactas y separadas de `assets/materials/f03/`. El pipeline se ejecutó dos veces y produjo el mismo digest agregado de los 18 WebP: `7ef8b46f3efad7c0642fec87451a082ffc59a7f27d5c0eb1d44ec559e4628fb3`.

- Pipeline: `scripts/qa/f03/convert-pbr.py`; dependencias aisladas y fijadas en `scripts/qa/f03/requirements.txt`.
- Herramientas verificadas: Python 3.11.9, OpenEXR 3.5.3, NumPy 2.4.6 y Pillow 12.3.0.
- Inventario fuente completo, hashes y estadísticas: `assets/materials/f03/source-audit.json`.
- Manifiesto de entradas/salidas, tamaños, hashes y controles: `assets/materials/f03/derivatives-manifest.json`.
- Hoja visual: [materiales derivados](evidence/materials/pbr-derived-contact.jpg).

## Fuentes auditadas

| Material | Albedo | Normal | Roughness | Displacement |
|---|---|---|---|---|
| white_stucco | JPG RGB 8 bits, ICC sRGB IEC61966-2.1 | EXR RGB half-float, DWAA | EXR Y half-float, DWAA; 0,8457–0,9883 | PNG `I;16` |
| white_rough_plaster | JPG RGB 8 bits, sin ICC | EXR RGB half-float, DWAA; 1 píxel degenerado reparado a +Z | JPG L 8 bits | PNG `I;16` |
| rough_plaster_03 | JPG RGB 8 bits, sin ICC | EXR RGBA half-float, DWAA; alfa descartado | JPG L 8 bits | PNG RGBA 8 bits |

Las doce fuentes son 4096×4096. Los hashes SHA-256 completos están en los manifiestos, no abreviados en esta tabla. El EXR de white_stucco produjo errores `decode_block()` con FFmpeg 8.1.2 y valores incorrectos; se descartó esa vía. OpenEXR oficial leyó los mismos archivos sin errores y con rugosidad físicamente plausible. Esto es una limitación observada del decodificador FFmpeg para estos DWAA, no una afirmación general sobre FFmpeg.

## Derivados y transferencia

| Material | HERO: color / normal / rugosidad | Balanced: color / normal / rugosidad | Total HERO | Total balanced |
|---|---:|---:|---:|---:|
| white_stucco | 103474 / 1656104 / 317626 B | 10402 / 329290 / 73468 B | 2077204 B | 413160 B |
| white_rough_plaster | 400596 / 1644732 / 525900 B | 102050 / 421590 / 127854 B | 2571228 B | 651494 B |
| rough_plaster_03 | 399194 / 1899448 / 604800 B | 100942 / 473886 / 151806 B | 2903442 B | 726634 B |

- Albedo: sRGB, WebP calidad 88/método 6. Si hay ICC se transforma a sRGB; sin ICC se conservan los valores y se declara sRGB. Error absoluto medio HERO frente a la imagen redimensionada antes de comprimir: 1,81 / 2,45 / 2,53 niveles de 8 bits, en el orden de la tabla.
- Normal: datos lineales, OpenGL Y+, reducción por media de área y renormalización; WebP lossless. Error medio de longitud unitaria tras cuantizar: 0,00181 / 0,00195 / 0,00192. El pipeline no invierte Y. La primera integración mostró microsombras coherentes en el detalle; no se detectó inversión de relieve en las vistas inspeccionadas.
- Roughness: datos lineales sin gamma, replicados en R=G=B para que Three.js lea correctamente G; WebP lossless. La igualdad de canales se verifica reabriendo cada archivo.
- Displacement: fuente inventariada, **OFF** y sin derivado runtime. No hay subdivisión apta ni autorización para alterar cotas.
- GPU estimada con mipmaps: `ancho × alto × 4 × 4/3` por textura; es estimación, no medición de driver.

## Escala, compatibilidad y fallback

`repeatMm = 2000 × 2000` es una hipótesis experimental de calibración, no una dimensión certificada de la fuente. La integración debe validar continuidad y tamaño aparente antes de fijar otro valor. No se incorporan EXR al catálogo de 50 superficies ni se cambian sus validaciones.

La hoja visual muestra que `white_rough_plaster` contiene desconchones y `rough_plaster_03` una variación parda marcada. Sus derivados están disponibles, pero **no se autoriza su sustitución automática** por semejanza de nombre. `white_stucco` es el primer candidato para el preset `surface-white-plaster-02`; los otros dos serán variantes experimentales sólo si una revisión de compatibilidad lo permite.

Fallback: cualquier fallo de hash, MIME, dimensión o carga conserva/restaura el material original, sin dejar una mezcla parcial; el fallo 404 y la recuperación están probados en navegador. KTX2/BasisU no se introduce porque no se ha verificado transcoder/soporte local; WebP es la ruta validada. Los costes de transferencia, render y lifecycle se documentan en `delivery-report.md`; la aceptación visual humana permanece pendiente.
