# F03 — checkpoint de implementación

- Repo: `Juanmaes83/floorplan-3d`. Rama activa: `feat/f03-facade-material-fidelity-v1`, creada desde el HEAD documental remoto `6b8d9f33cbf5ada5f4e210777f195a73e4ddfa1c`. Sin merge ni deploy.
- Baseline F02 incluido en la base: PR [#167](https://github.com/Juanmaes83/floorplan-3d/pull/167), HEAD `fe876c1c2016beafba48f1993b5c23ecb82f6814`, abierta y draft, sin tocar. No se han editado `visual-families-core.mjs` ni `visual-families-adapter.mjs`.
- Inventario heredado: 12 PNG, 13 albedos 4K, 9 mapas complementarios y 3 sets PBR completos como fuentes. Los 4 JPG históricos y los canales complementarios de los otros 10 materiales no están publicados.
- **Gate F03-1 completado:** los 12 PNG fueron abiertos y clasificados. Resultado: 9 escenas independientes (6 frontales, 3 oblicuas) y 3 collages; déficit real de 27 para el objetivo histórico de 36. Ver `visual-reference-matrix.md`.
- Conversión EXR: FFmpeg 8.1.2 reconoce half-float lineal, pero la prueba numérica de `white_stucco` devolvió errores `decode_block()` y rugosidad no plausible; esa salida queda rechazada. Se validará con OpenEXR oficial aislado antes de producir derivados.
- **Pendiente:** auditoría y conversión PBR, módulos F03, integración opt-in, capturas A/B/C, regresión F02, rendimiento, lifecycle, PR draft y revisión humana. No se declara mejora visual todavía.
- Fuente PBR: licencia CC0 comunicada por el usuario. No extender esa licencia a los PNG conceptuales.
