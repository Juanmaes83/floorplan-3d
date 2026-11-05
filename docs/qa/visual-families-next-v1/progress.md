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

El estado visual es `VISUAL_PENDING_HUMAN`; este checkpoint no implica aprobación del conjunto.
