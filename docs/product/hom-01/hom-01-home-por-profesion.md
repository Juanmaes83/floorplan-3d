# HOM-01 — Home por profesión

**Estado:** PR para revisión humana. No está fusionada ni desplegada en Production.
**Base:** `master@5fb7a5c`. Catálogo: HOM-01 + GOV-03 (mínimo).

## Qué cambia (evoluciona la bienvenida existente, no la sustituye)

| Pieza | Antes | Después |
|---|---|---|
| Cabecera | Igual para todos | **Sin profesión, idéntica a la de antes.** Con profesión, el antetítulo, el título y la descripción se adaptan. Se añaden dos llamadas a la acción que funcionan: la principal es la primera acción recomendada (subir plano, probar el ejemplo o recorrerlo en 3D) y la secundaria lleva a «Lo que puedes hacer hoy». En pantallas horizontales muy bajas no se muestran, porque repiten las tres entradas de debajo. |
| «Lo que puedes hacer hoy» | No existía | 3–4 capacidades por profesión (4 neutras sin profesión), sacadas del **registro verificado**. Cada una tiene beneficio, estado («Disponible»), límites honestos y un acceso real. |
| Render IA | No aparecía en la Home | Banda propia «Render IA fotorrealista desde tu proyecto», con tres avisos (parte de una vista real en Entregar → Vistas del proyecto; imagen orientativa; código de acceso y créditos de IA) y el botón «Abrir Entregar». La imagen es una **captura real de Rubik**, rotulada como punto de partida, no como resultado de IA. |
| Tres entradas, perfil opcional, «Recórrela en 3D» y «Soluciones» | — | **Sin cambios.** Se mantienen los mismos IDs y acciones. La preferencia sigue en `localStorage` y nunca entra en el proyecto. |

## Registro de capacidades (GOV-03, mínimo)

`js/capability-registry.js` es la única fuente de lo que la Home puede anunciar. Cada capacidad incluye:
- los módulos que la implementan y las pruebas que la demuestran;
- el SHA en que se verificó (`5fb7a5c`);
- su estado, las profesiones para las que es relevante y sus límites.

`tests/capability-registry.test.cjs` **falla si un módulo o una prueba citados no existen**, si un estado no es válido o si aparece una promesa prohibida («certificado», «garantiza», «en tiempo real», etc.).

| Profesión | Capacidades (en orden) |
|---|---|
| Sin profesión | Subir y calibrar · Recorrido 3D · Render IA · Mediciones y presupuesto |
| Arquitectura | Subir y calibrar · Lámina con tu marca · Orientación, sol y emplazamiento · Mediciones y presupuesto |
| Inmobiliaria | Recorrido 3D · Presentación guiada · Render IA · Entrega al cliente |
| Promotora | Dos plantas · Presentación guiada · Render IA · Tu marca |
| Reformas | Subir y calibrar · Comparar propuestas · Mediciones y presupuesto · Render IA |
| Interiorismo | Amueblar y acabados · Render IA · Recorrido 3D · Presentación guiada |

Accesos: «Subir un plano» (entrada existente), «Recorrer el ejemplo en 3D» (paseo existente), y las áreas **Diseñar, Analizar, Presupuestar, Entregar y Mi estudio**. El Render IA se abre siempre en **Entregar**, donde exige proyecto, vista 3D y código de acceso. La Home no llama nunca al proveedor de IA.

## Pruebas

| Suite | Resultado local |
|---|---|
| `capability-registry.test.cjs` (nueva) | 4/4 |
| `welcome-capabilities.browser.test.cjs` (nueva): neutral en 3 tamaños, 5 profesiones en escritorio y móvil, todos los accesos, teclado | 7/7 |
| `professional-entry`, `welcome-generar`, `guide`, `professional-workspace`, `ai-render` y `guide-navigation` en el navegador | Sin regresiones; 57/57 junto con las nuevas (1 omitida por la propia suite) |
| Todas las pruebas puras | 939 PASS · 0 FAIL · 2 omitidas |

En CI: nuevo workflow **«Home por profesión»** (`.github/workflows/home-profession.yml`).

## Capturas (`capturas/`)

- **Antes:** `antes-escritorio-neutral`, `antes-escritorio-interiorismo` (cabecera idéntica a la neutral) y `antes-movil-interiorismo`.
- **Después:** `despues-escritorio-<perfil>` (cabecera adaptada), `despues-movil-<perfil>-capacidades`, `despues-escritorio-interior-capacidades` y `despues-escritorio-neutral-renderia`.

## Revisión humana pendiente

| Qué revisar | Dónde |
|---|---|
| Tono y textos de cada cabecera | Preview: elegir cada profesión en «¿En qué trabajas?» |
| Orden de las capacidades por profesión | Preview y tabla anterior |
| Banda de Render IA, y si se quiere una imagen real de resultado (la del salón validada el 09/11 no está en el repositorio) | Preview |
| Móvil real | Dispositivo físico |
