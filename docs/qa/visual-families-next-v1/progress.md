# Visual Families Next V1 — checkpoint recuperable

- Repositorio: `Juanmaes83/floorplan-3d`.
- Rama: `feat/visual-families-next-f03-f04-f05-v1`; HEAD inicial `5e182592376bd0b3a9b5e53917ac90bc8255aa25`.
- Base aprobada: F03 V1 `ce70f85941e32ba2483ac9bba70d9c4dd674eca2`; F02 V2 permanece protegido. Sin merge, deploy ni activación por defecto.
- R0 completado en Chromium: 70 muros inventariados; 29 fachadas, 33 interiores y 8 con clasificación no disponible. El fixture canónico tiene 2 fachadas asignadas y sólo 1 elegible F03; cada fixture nuevo tiene 10 fachadas asignadas y 9 elegibles. F02 conserva 12/12 ventanas; no hubo errores de navegador.
- Estuco multi-paño: 9 muros/11 mallas, 3 texturas compartidas y 16.777.218 B GPU estimados. Revoco experimental: misma cobertura con opt-in explícito. Inventarios y hashes en `inventory/`; generador: `scripts/qa/visual-families-next/inventory.cjs`.
- Decisión R1: mantener intacta `F03/facade-material@1`; añadir una extensión V2 para propagación compatible y conciliar el presupuesto HERO de 16.777.218 B antes de aplicar geometrías derivadas.
- Exclusiones: hormigón albedo-only no se denomina PBR completo; variantes envejecidas requieren opt-in; muros sin asignación o con clasificación incierta quedan fuera.
- QA previsto: unitarias → Chromium → FULL/MEDIUM/DETAIL/oblicuas/control F02 → inspección de imágenes → corrección → regresión/lifecycle/rendimiento → PR draft contra `feat/f03-facade-material-fidelity-v1`.

## Publicaciones

| Hito | HEAD local | HEAD remoto verificado | Evidencia |
|---|---|---|---|
| Base | `5e182592376bd0b3a9b5e53917ac90bc8255aa25` | `5e182592376bd0b3a9b5e53917ac90bc8255aa25` | Rama y documento de misión |

## Actualización de recuperación y decisión humana — 5 noviembre 2026

- **R0 publicado:** `d4b43f3`; inventario 70 muros y dos fixtures de compatibilidad.
- **R1 código recuperado de Kimi:** `dd9c26ff47da38a2e1672121d55cf8c4ccd07f98`, receta `facade-material-v2@2` versionada que preserva V1. Estado WIP, no cierre.
- **Evidencias:** `4400994c7cb85060e4a75618fbf2aa8edb63c95d`, 42 WebP y 3 manifiestos [A/B/C](evidence/f03-v2/dd9c26ff47da38a2e1672121d55cf8c4ccd07f98/README.md). Validación local comunicada: 10/10 unitarias PASS y 1/1 Chromium PASS, 9 muros / 11 mallas, 3 texturas; GPU HERO **estimada** 16.777.218 B, presupuesto V2 17.000.000 B.
- **Decisión visual:** `rough_plaster_03` **aprobado como resultado específico y referente preferido de calidad**. **Se aprueba transferir la METODOLOGÍA EXPERIMENTAL a otros materiales/referentes**, no usar el mismo revoco como material universal o default. Solo en paños compatibles, con opt-in. Ventanas F02 V2 y `white_stucco` F03 V1 permanecen protegidos.
- **NO aprobado:** F03 V2 como conjunto ni móvil. Falta fachada completa a altura humana con ventanas, encuentros y esquinas reales. Móvil emulado actual muestra vista cenital diminuta o paño aislado; falta reencuadre 390×844 y 844×390, y prueba física.
- **Pendientes:** R1 transferibilidad y vistas arquitectónicas + regresiones/lifecycle/performance; R2 F04, R3 F05, R4 F06–F09 condicionadas, R5 QA integral y R6 PR/handoff. Sin merge, deploy ni activación por defecto.
- **Decisión operativa completa:** [aprobaciones, restricciones y siguiente misión Kimi/Codex](F03-V2-DECISION-METODOLOGIA-Y-SIGUIENTE-MISION-2026-11-05.md).

**Estado global:** `TECHNICALLY_TESTED_PARTIAL_VISUAL_ACCEPTANCE`. El resultado aprobado es una muestra, no el sistema F03 V2 completo.
