# RUBIK SOTA E2 · Release de Hybrid V2 «Dibujo vivo» + Section corregida

**Fecha:** 2026-11-06 (Europe/Madrid). **Estado:** MERGED_MASTER / PROD_VERIFICADA (comprobación técnica de despliegue, no QA física completa).

## Autorización, procedencia y genealogía

- **Autorización del propietario:** aprobación visual humana **completa** de la experiencia conjunta y autorización explícita para fusionar la PR #174, comunicadas el 6 de noviembre de 2026.
- **PR de integración:** [#174](https://github.com/Juanmaes83/floorplan-3d/pull/174), inicialmente draft de staging y convertida a ready-for-review inmediatamente antes de la promoción autorizada.
- **Fuente Hybrid V2:** PR #170, `feat/hybrid-v2-living-drawing@747f8e7da98247ce86903ed85b467d50e7af6d03`.
- **Base efectiva:** `master@840189407cb63a996a71e47f14ad8931a3dcfb4a`, ya con Section y su corrección de handover incorporadas por PR #172. **Section no se integró por segunda vez.**
- **Staging verificado:** `integration/rubik-e2-hybrid-v2-2026-11-06@217b07b3ce26083922fdd5890b1319f9d56b993e`, 20 commits delante y cero detrás de la base, 36 archivos cambiados (32 añadidos, 4 modificados).
- **Merge autorizado:** `master@04155c7726b191d4c68b354ec8618f64edca45c7` mediante merge commit de PR #174, sin squash ni force-push.
- **Ramas NO incorporadas:** Hybrid V1, CP2/F02/F03, FT3D-8 M2, Delivery, Legal, AG-1 y Render IA. Su revisión y autorización son independientes.

## Evidencia de calidad antes de la promoción

**14/14 GitHub Checks SUCCESS** y ninguno pendiente/fallido sobre el **SHA exacto** `217b07b3ce26083922fdd5890b1319f9d56b993e`, incluidos `living-browser`, `living-section-combined-browser`, `section-handover-browser`, `living-and-visit-unit`, `import-and-regressions`, `project-first` y `templates-and-evidence`.

Pruebas específicas en GitHub Actions:
- `living-browser`: **8/8 PASS, 0 SKIP**. Grafito → áreas coloreadas, ida/vuelta, estado OFF por defecto, ambientación opt-in reversible, reduced motion, fallback, ciclos de limpieza y viewport simulado 390×844/DPR2.
- `section-handover-browser`: **3/3 PASS, 0 SKIP**. Autoplay hasta altura de ojos, «Explorar desde aquí», retorno a la sección, repetición y reduced motion.
- `living-section-combined-browser`: **1/1 PASS, 0 SKIP**, dos rondas completas en una presentación, sin residuos de clipping, renderizador, materiales ni cambios en JSON del proyecto.
- `living-and-visit-unit`: **46/46 PASS, 0 SKIP** en el conjunto ejecutado.
- Browser automatizado con Chromium/Playwright y SwiftShader en CI. **No sustituye prueba en teléfono/GPU físicos.**

La aprobación humana observó la Preview integrada, incluida la transición por manchas y el recorrido Section; la evaluación estética fue **aceptada íntegramente por el propietario**. La diferencia de contraste frente a la PoC histórica no constituye defecto bloqueante en esta aprobación.

## Publicación y smoke test

- **Preview previa (READY):** `https://floorplan-3d-e0pdf9s2b-juanma-espinosas-projects.vercel.app`, deployment `dpl_5RxnX6hVgNT7HsU3Fnce9isFk7Kq`, SHA `217b07b3`.
- **Producción autorizada mediante merge en master:** deployment Vercel `dpl_6o8QqMRW19HCD12biGzNdZRdNSbz`, `target=production`, `readyState=READY`, metadatos Git `master@04155c7726b191d4c68b354ec8618f64edca45c7`.
- **Alias verificado:** `https://floorplan-3d-alpha.vercel.app` resuelve al deployment de ese SHA. Página raíz HTTP 200; `/js/presentation-living-drawing.js` y `/js/presentation-story-core.js` HTTP 200. Esto es una **comprobación técnica HTTP**, no un recorrido visual manual en producción.
- **Observabilidad:** consulta Vercel de errores de runtime en ventana reciente (30 min) sin errores encontrados. La ausencia de logs no garantiza ausencia de fallos.
- **CI de merge commit master:** los workflows `import-and-regressions` y `project-first` estaban todavía **IN_PROGRESS** al cierre de este registro; `goals-and-editor` **SUCCESS**. **No marcar como PASS los pendientes.**

## Riesgos, controles y reversión

1. **Repositorio PUBLIC y master sin protección:** API GitHub `private:false`, `visibility:public`, branch `protected:false`, rulesets `[]`. Elevar para decisión del propietario; no se alteraron configuraciones.
2. **QA física:** navegador móvil simulado no certifica rendimiento, compatibilidad ni calidad en dispositivos físicos/GPU. Pendiente de validación explícita.
3. **Privacidad/coste:** este release no habilita API de IA de pago ni entrega con datos reales de clientes, ni integra cambios de licencias.
4. **Plan de reversión:** deployment precedente estable `dpl_9UyTQj7RjgNJZjKXLTc5Adg7NYMb` (`master@8401894`). Una reversión Vercel/commit debe realizarse **solo con autorización expresa**, siguiendo procedimiento controlado y comprobación de alias; no se ha ejecutado.
5. **Deuda diferida:** auditoría global de jerarquía UI/UX, rendimiento y revisión real de dispositivos. No repetir Section ni trabajos ya desarrollados en otras ramas.

## Siguiente integración

**No iniciar automáticamente.** Exigir una única PR de staging construida desde el `master` vigente, matriz de regresiones, aceptación humana y autorización específica antes de promover. Mantener FT3D-8 M2/S4 como requisito obligatorio E2.
