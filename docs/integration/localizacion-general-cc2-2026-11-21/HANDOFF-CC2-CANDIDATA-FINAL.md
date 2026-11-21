# CC2 · Candidata final única · localización ES/EN/ZH de Home, navegación, Construir, Amueblar y Propiedades

**Fecha:** 21/11/2026 · **Rama:** `claude/cc2-l10n-candidata-final` · **Base efectiva:** `master@1bc501d64ab091a8fac25669bf8843f8f5076a3d` (incluye #297 y #298).
Aplica la [regla de cierre de módulos](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/chatgpt/continuidad-v5-regla-cierre-20261121/CONTINUIDAD/2026-11-21/REGLA_CIERRE_MODULOS_Y_MANDATOS_TRES_AGENTES.md) (mandato CC2 y lista de comprobación). No abre otro frente, no fusiona, no despliega, no activa Production.

## 0. Estado, con el vocabulario de la regla

**ÁMBITO ACOTADO: CANDIDATA COMPLETA PARA REVISIÓN E INTEGRACIÓN.** El módulo entregado es «idioma de las superficies Home, navegación global, Construir, Amueblar y Propiedades» (no «toda RUBIK»). La experiencia se recorre de principio a fin en el RUBIK real (cambio de idioma por cabecera y por Home, con la superficie abierta, escritorio y móvil) y no deja funciones pendientes **dentro de ese ámbito**.

**Lo que NO está cubierto y se declara:** otras superficies heredadas (Plano propio/`tracing-ui`, Plantas/`building-ui`, importación/`plan-intake-ui`, Presupuestar y Entregar —E3 #299 es de Codex—, `persistence-editor` —F0 congelada—). Para esas superficies el estado es **«COMPONENTE VALIDADO / PENDIENTE DE MÓDULO»**, no «cerrado». Tampoco se afirma Firefox/WebKit, lector de pantalla real, Preview ni Production.

Esta capacidad no es audiovisual: no aplica vídeo. El resultado real son las propias superficies de RUBIK usadas en los tres idiomas; la evidencia es funcional (pruebas de navegador contra la UI real) y visual (capturas).

## 1. Qué cambió respecto a las entregas anteriores

* Una sola candidata contra la base efectiva (antes: dos ramas apiladas sobre `a6a0494`, obsoleta tras #297/#298).
* Fusión con #297 y #298 resuelta (dos conflictos en `index.html`, descritos en §5).
* La prueba **ya no excluye** el panel R02-A «Techo y elementos altos» ni sus capas: #298 lo localizó, y la prueba comprueba ahora que sigue sin mezclar idiomas en estas superficies. R02-A sigue **no normativo** (el aviso informativo no bloquea la edición; esta candidata no toca `r02a-*`).
* Se incorporan dos mejoras de política que Codex había aplicado en #300 y que faltaban aquí: nombres de variante por `nm()` (sin chino en ES/EN) y foco del botón «Proyectos» antes de `showModal` (WebKit).

## 2. Alcance localizado

Cabecera y accesos móviles, barra de áreas, guía, Home (botón de idioma con foco y cinco fases), diálogo de Proyectos, avisos y confirmaciones del núcleo, «Presentar mi vivienda»; paleta **Construir**; **Amueblar** (buscador, 25 modelos, «Traer mi mueble», «Producto de mi estudio»); **Propiedades** (vista general, muro, estancia, mueble, hueco, amueblamiento inteligente); diálogos de nueva estancia, dimensiones, nuevo proyecto y acabados (50 acabados). Detalle por superficie en [HANDOFF-CC2-HOME-NAVEGACION.md](HANDOFF-CC2-HOME-NAVEGACION.md) y [HANDOFF-CC2-CONSTRUIR-AMUEBLAR-PROPIEDADES.md](HANDOFF-CC2-CONSTRUIR-AMUEBLAR-PROPIEDADES.md).

## 3. Lista de comprobación de la regla

| Exigencia | Evidencia |
|---|---|
| Código entero y ruta real | Rama completa; sin motores nuevos: `setLang()` emite `rubik:languagechange`; diccionarios de presentación; los núcleos (`opening-edit`, `room-layout`, `own-furniture-core`, `smart-furnishing-core`) no cambian |
| Entrada y salida de usuario | Cabecera, botón de idioma de la Home y teclado (Intro): la superficie abierta cambia sin perder selección, vista previa ni foco |
| Errores y recuperación | Estados con error del hueco, rechazo de dimensiones, validación de «Traer mi mueble», propuesta rechazada del amueblamiento; Escape cierra sin cambiar el proyecto |
| Conservación del proyecto | Las pruebas comparan proyecto y almacenamiento antes y después de ES→EN→ZH→ES; nombres guardados intactos |
| Idiomas y sin chino visible en ES/EN | Prueba por superficie (fresh vs. live, sin restos, sin CJK en ES/EN) más `no-chinese-display` de #297 |
| Accesibilidad | Nombres accesibles, `aria-label`, foco y Escape comprobados; **no** se afirma lector de pantalla real |
| Escritorio / móvil | 1440×900 y 390×844 en todas las pruebas nuevas |
| Regresiones | Ver §4 |
| Parche autosuficiente | `parche/CC2-L10N-candidata-final.patch` (+ `.sha256`), aplicable con `git apply` sobre `1bc501d6` |
| SHA, árbol, base | En el informe de entrega (se verifican tras el último commit) |
| Límites | §0 y §6 |

## 4. Pruebas

Resultados exactos en [`parche/RESULTADOS-QA.txt`](parche/RESULTADOS-QA.txt). Resumen: prueba nueva **41/41** (sin exclusión de R02-A), `language-home-navigation` 7/7, `no-chinese-display` 4/4, R02-A (`r02a-i18n`, `r02a-editor`, `r02a-r03-coexistence`, núcleos) y R03 en verde, y las 25 suites de regresión de las superficies tocadas más `browser.test` (39/39) en verde. La primera ejecución de la prueba sin exclusión dio 34/41: los 7 fallos eran el cognado «experimental» (idéntico en ES y EN) y se admitió como nombre fijo; no se rebajó ninguna aserción de contenido.

## 5. Integración

* **Conflictos resueltos al construir esta candidata sobre `1bc501d6`:** (1) `index.html`, cabecera: líneas `traceBtn` / `projectsBtn` con `data-*` + el selector `ES · EN · ZH` de #297; (2) `index.html`: `nm`/`nmRaw` de #297 con el diccionario `NAMES_FROM_ES` dentro de `nmRaw`.
* **#300 (Codex):** contiene mis dos cortes sobre `cf0b5012` (post #297, **anterior a #298**) más sus dos mejoras (incorporadas aquí). Esta candidata difiere de #300 en: los archivos de #298, el `<script>` de `r02a-passage-indicative.js` y la prueba sin exclusión R02-A. Codex puede elegir entre actualizar #300 con #298 o tomar esta candidata; ninguna de las dos toca ramas ajenas.
* No se modifican #299 (E3), #296, #298, F0/A0, OP-07, ni ramas de Codex/CC1.

## 6. Riesgos y límites

* Firefox/WebKit y dispositivos físicos: no probados (la corrección de foco de WebKit es de #300 y se incorpora sin verificación en WebKit).
* `presentation.browser` es una suite larga (>1 h); se ha ejecutado solo parcialmente (48 casos verdes, 0 rojos); la ejecuta la CI.
* Los mensajes del núcleo no previstos se muestran como los emite el núcleo (español).

## 7. Propuesta GO / NO-GO

**GO para revisión e integración por Codex** de lo declarado en §0, **condicionado a** CI completa verde del HEAD final y aceptación visual del propietario. **NO-GO** para presentar esta candidata como «localización completa de RUBIK»: faltan las superficies de §0.
