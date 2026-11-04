# Rubik VQ-01 / CP2 — cierre de CI y evaluación visual responsable

**Fecha de verificación:** 2026-11-04.  
**Naturaleza:** `DOCS_ONLY / TECHNICAL_PASS / HUMAN_VISUAL_PENDING`.  
**No constituye autorización de merge a master, ni PASS visual firmado por Juanma.**

## 1. Fuente congelada, ejecución definitiva y evidencias

| Objeto | Identidad exacta |
|---|---|
| A0 / `master` | `0f9c6ead9732901681498efec326d1ca92e42ffe` |
| B1 / CP1 | `fac408025c9cc11ed554f6f395cd3153d1838861` |
| B2 / CP2 con arreglo M08 | `894607b38fa43a5e89a9f5296a41cdbcc989d5ce` |
| Rama candidata | `feat/vq-01-material-fidelity-foundation` |
| Hybrid congelado | `feat/hybrid-registered-elevation-v1@07ae6f9969cae9df746443e97410e40cee2e932a` |
| Workflow definitivo | [VQ-01 CP2 material impact — run 41802674784](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41802674784) |
| Artefacto CI completo | [Artifact 13310485726](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41802674784/artifacts/13310485726) |
| Desbloqueo M08 | [PR #163](https://github.com/Juanmaes83/floorplan-3d/pull/163), merge squash `eb8f159d13a52038b5c55d95b9ca0b2962af5830` |
| Activación de CP2 por cambio de test M08 | Commit `894607b38fa43a5e89a9f5296a41cdbcc989d5ce` |

**GitHub Actions terminado:** `completed/success`, 2026-11-04 09:22:34 UTC. Todas las etapas del job `material-impact` aparecen SUCCESS:

1. Reproduce A0 global + cinco closeups dos veces.
2. Reproduce B1 global + cinco closeups dos veces.
3. Reproduce B2 global + cinco closeups dos veces.
4. Verifica contratos y cobertura de navegador heredada (incluye M08).
5. Ejecuta `tests/vq01-cp2-compare.cjs` para comparar `A0→B2` y `B1→B2`.
6. Publica el artifact QA (`vq01-cp2-894607b38fa43a5e89a9f5296a41cdbcc989d5ce`, ~64.7 MB ZIP comprimido en el artefacto descargado).

**Estado real del comparador** (`review/comparison.json`): `status=READY_FOR_HUMAN_AB_CP2`, `visualVerdict=PENDING_JUANMA`. El comparador no asigna puntuación a B1/B2: conserva sólo `A0=100` como base conceptual. La mejora perceptiva de +30% era una aspiración humana, NO un resultado medido.

### Contenido comprobado del archivo definitivo

El ZIP descargado se comprobó en esta sesión: **117 entradas**. Incluye todas las capturas dobles A0/B1/B2 (global y cinco closeups), manifiestos SHA-256, `review/comparison.json`, `review/index.html`, `review/artifact-files-sha256.json`, resultados unitarios, browser M08, lifecycle y logs.

El archivo ZIP completo descargado y verificado localmente tenía SHA-256:
`4c1f8de1603ccc7b72d9f6bca8682a14b0655fc9a02a932ce70944d0d760768c`.

**No duplicar los 65 MB en la rama `master` sin política de retención.** Los ZIPs y contact sheets entregados por ChatGPT son **copias derivadas locales** de las capturas CI, y NO deben presentarse como archivos versionados en Git. GitHub Actions artifact sí está alojado en GitHub, pero está sujeto a caducidad por retención.

Comparación de bytes: capturas aportadas posteriormente por Juanma y copias en `review/*` del artifact coinciden por SHA-256 para las muestras verificadas A0/B1/B2 (madera, yeso). No confundirlas con las tres fotografías profesionales mediterráneas aportadas por el usuario, pendientes de colocación como referencias profesionales.

## 2. QA de recursos y lifecycle

Datos del manifiesto oficial:

- A0: 1178 geometrías / 17 texturas de renderer.
- B1: 1178 geometrías / 17 texturas.
- B2: **1178 geometrías / 21 texturas**.
- B2 GPU estimada para las cuatro superficies: **7,340,040 bytes**, frente a **2,796,208 bytes** en B1, diferencia **4,543,832 bytes ≈ 4.33 MiB**, inferior al límite **8 MiB** extra.
- `b2/lifecycle.json`: `result=PASS`, tres ciclos, `errors=[]`, `warnings=[]`.
- `recovery=reload`: se verificó recuperación por recarga, **NO restauración WebGL en caliente**.
- En el artifact B2, las repeticiones de global y los cinco detalles ofrecen `changedPixels=0` (según `b2/ab-side-result.json` del run definitivo).
- `FloorPlanProjectV1`, geometría, cámaras, luz, fixtures y asignaciones comparadas contra las baselines se mantuvieron en sus invariantes.

El error M08 original (`locator.click` timeout durante export PNG bajo software WebGL) se corrigió mediante **clic real `page.mouse.click` y verificación de evento `download`, PNG y cámara**, sin tocar el producto. El run M08 aislado `41797322348` ya había probado 2/2 casos. PR #163 fusionado **sólo en la rama CP2**.

## 3. Diagnóstico visual por familia (revisión experta, NO PASS humano)

Las observaciones se basan en las capturas oficiales A0/B1/B2 del artifact 13310485726.

| Vista / familia | A0→B2 píxeles diferentes | B1→B2 | Qué se ve en B2 | Gate visual actual |
|---|---:|---:|---|---|
| GLOBAL | 1.81% | 1.19% | Composición general casi idéntica; mejoras concentradas en regiones materiales, no en atmósfera/arquitectura | `PENDING_JUANMA` |
| TIMBER_CLOSEUP | 39.83% | 39.80% | Veta más legible, tablas/juntas con mejor definición; vigilar exceso de contraste, escala y repetición | Candidato positivo; sin PASS firmado |
| CONCRETE_CLOSEUP | 70.20% | 68.53% | Paso de patrón oscuro rayado a granulado mineral más continuo; revisar si parece uniforme o demasiado oscuro | Candidato positivo; sin PASS firmado |
| PLASTER_CLOSEUP | 74.69% | 74.47% | Desaparece el patrón visual antiguo y queda pared mate cálida bastante uniforme; puede ser más verosímil, pero falta relieve con luz rasante | Requiere prueba dirigida |
| STONE_CLOSEUP | 31.40% | 29.93% | Se mantiene suelo de piedra beige con juntas; parte del delta viene de la madera visible a la derecha: **no atribuirlo todo a la piedra** | Cambio de piedra aislada no demostrado por ese porcentaje |
| GLASS_METAL_CLOSEUP | 16.62% | 2.17% | Muy similar a B1; el ensayo de nuevo vidrio fue descartado en CP2; mejora óptica no demostrada | Posponer a familia ventanas/óptica |

**Nunca traducir porcentaje de píxeles a calidad perceptiva.** Madera es el avance con lectura perceptiva más evidente de esta tanda; la escena global no alcanza aún el estándar fotográfico profesional de las referencias mediterráneas. La percepción favorable de Juanma expresada en conversación es una valoración positiva preliminar, **no sustituye un PASS/score/firma formales**.

## 4. Qué queda exactamente para no repetir gasto con Astra

**No faltan:** reabrir las tres piedras, generar A0/B1/B2, resolver M08, lanzar CI, reproducir manifests, ejecutar comparador, revisar los límites GPU ni producir ZIP técnico. Todo eso ya está realizado con el SHA indicado.

**Sí falta decisión humana y de producto:**

1. Juanma evalúa B2 frente a A0/B1 por madera, piedra, yeso, hormigón, vidrio y GLOBAL; asigna score o verdict explícito. Nunca inventar `B2≈130`.
2. Elegir `VISUAL_PASS_CP2`, `VISUAL_PARTIAL_ACCEPT_FOUNDATION` o `VISUAL_NON_PASS`. En caso de aprobación parcial, preservar el mecanismo técnico B2 y trasladar gaps a nuevas familias; **no declarar el VQ completo finalizado**.
3. [PR #165, B2→`master`](https://github.com/Juanmaes83/floorplan-3d/pull/165) **ya preparado como borrador** (no fusionado), para evitar a Astra la preparación del PR; necesita revisión y decisión humana. El merge de PR #163 a la rama VQ **no equivale** al merge de VQ a master.
4. Determinar la estrategia de retención de evidencias antes de que el artifact de Actions caduque: Git LFS, storage de release u otro repositorio de QA; **no introducir ZIP masivos en Git por defecto**.

**Trabajo que Astra no debe repetir:** todos los pasos completados por run 41802674784. Próxima invocación, si necesaria: leer este checkpoint, el comparison oficial y el veredicto humano; no realizar más microajustes VQ-01 sin decisión de alcance. Los problemas de iluminación, carpinterías, fachadas y contexto no son deuda oculta de CP2; forman parte del programa de familias visuales separado.

## 5. Restricciones de continuidad

- `master@0f9c6ead…` continúa separado de `feat/vq-01-material-fidelity-foundation@894607b…`.
- `feat/hybrid-registered-elevation-v1@07ae6f…` permanece congelada; ningún acto de este cierre la reactiva.
- Usar el trabajo de NeonPlan (15 parciales + 11 diferenciales) como backlog independiente; no presentarlo como integrado por este cierre.
- No incorporar VECINIA, Three-Fenestra, ventanas, piscinas ni animales en CP2 final: preservar evidencia causal. Nueva implementación sólo en workstream aislado, con contrato.

## 6. Ruta de continuación recomendada

- **Ahora:** congelar evidencia final técnica, obtener decisión humana sobre B2 y conservar el candidato.
- **En paralelo, sin tocar CP2:** discovery del sistema semántico de familias y preparación de fixtures/referencias profesionales.
- **Después:** integrar la fundación material sólo con aprobación expresa, y reanudar deuda técnica, Hybrid y fases siguientes por sus gates específicos.
- **Programa visual futuro:** [Rubik Visual Families + Residential Experience](../research/vecinia/rubik-visual-families-integration-roadmap-2026-11-04.md), separando materiales, carpinterías, arquitectura y contexto ilustrativo.

**STOP:** un CI verde NO autoriza adjudicar calidad profesional ni merge automático.
