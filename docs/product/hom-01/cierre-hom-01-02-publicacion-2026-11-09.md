# HOM-01 + HOM-02 — Acta de integración y publicación en Production (09/11/2026)

**Resultado:** la Home con los **seis perfiles** profesionales está en Production y Render IA D1 sigue intacto.
**Autorización:** orden definitiva de integración del propietario del 09/11/2026. La revisión visual de los seis perfiles estaba aprobada por el propietario antes de fusionar.
**Secretos:** este documento no contiene ninguno. No se leyeron, cambiaron ni rotaron variables de Vercel.

## 1. Fusiones

| PR | Contenido | Método | Commit probado | Merge en master | Checks del commit probado |
|---|---|---|---|---|---|
| #183 | Acta D1, catálogo v1.3 y tres auditorías (solo `docs/`) | Merge commit | `86666b8` | `6cd30cf` | 2/2 (project-first y Vercel) |
| #184 | HOM-01: Home por profesión y registro de capacidades | **Merge commit, sin squash** | `253771a` | `e2dfe42` | 55/55 |
| #185 | HOM-02: sexto perfil «Constructora / jefe de obra» | Merge commit | `82155a2` | `8df49ed` | 9/9 (con base `master`) |

**Validez de la CI de #184.** Entre `253771a` y la fusión, master solo añadió los cinco documentos de #183. Ninguna prueba los lee, así que el código fusionado es idéntico al probado.

**Por qué #185 no duplica HOM-01:**
1. #184 se fusionó con merge commit, sin squash, de modo que `253771a` (la punta de HOM-01) es antecesor de master.
2. La rama de HOM-02 ya contenía ese mismo `253771a` (por `2668c14`). Al cambiar la base de #185 a `master` e incorporar master con un merge (`82155a2`), el diff contra master quedó en **solo 12 archivos de HOM-02**.
3. No se reescribió historia ni se hizo force-push.

**Árbol final.** `8df49ed` es **idéntico byte a byte** al árbol de integración (master + #183 + #184 + #185) probado en local antes de la primera fusión. Desde `5fb7a5c` no cambian `api/` ni `vercel.json`.

## 2. Publicación

| Campo | Resultado |
|---|---|
| Mecanismo | Production en dos pasos (`autoAssignCustomDomains: false`): cada merge crea un despliegue de Production sin dominio y el dominio cambia solo con un Promote expreso |
| Despliegues intermedios (sin dominio) | `dpl_AEtRxJNmUGKuGRHFFbYQnjEVPu3T` (`6cd30cf`) y `dpl_72Z2eDnycy8N3aQPESwhDubDjpXX` (`e2dfe42`). No se promocionaron. |
| Despliegue final | `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` · `master@8df49ed7110215eb3723788aee6da42d5eb095cb` · READY · creado por la integración Git, no a mano |
| Comprobación antes del Promote | El código servido incluye `construction-plan`, `evolution-4d` y `ORDER.construction`; `GET /api/render` responde 405 `method` |
| Promote | 09/11/2026, hacia las 17:17 UTC |
| Dominio público | `floorplan-3d-alpha.vercel.app` → `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` (comprobado con la API de Vercel) |
| Despliegue de vuelta atrás | `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi` (`5fb7a5c`, Render IA D1 validado). **No hizo falta usarlo.** |

## 3. Pruebas

### Antes de fusionar, sobre el árbol final exacto (local)
| Suite | Resultado |
|---|---|
| Todas las pruebas puras | 939 pasan · 0 fallan · 2 omitidas |
| Navegador: `welcome-capabilities`, `professional-entry`, `welcome-generar`, `guide`, `guide-navigation`, `professional-workspace`, `ai-render` (proveedor simulado), `delivery-image-detail`, `m2-s4` (plan de obra), `ft3d-8-ux4d` (4D) y `browser.test.cjs` | 134 de 135 pasan · 0 fallan · 1 omitida por la propia suite |

### En el dominio público, después del Promote
Script: `scripts/qa/home-production-smoke.cjs`. Bloquea y registra toda petición a `/api/render` y `/api/share`.

| # | Comprobación | Resultado |
|---|---|---|
| 1 | 1440×900: Home sin perfil con la cabecera original, 3 entradas, 4 capacidades, banda Render IA con sus avisos y sin desplazamiento horizontal | PASA |
| 2 | 1440×900: los seis perfiles, cada uno con su cabecera y las capacidades del registro; el proyecto no cambia y no hay desplazamiento horizontal | PASA |
| 3 | 390×844: lo mismo que la fila 1 | PASA |
| 4 | 390×844: lo mismo que la fila 2 | PASA |
| 5 | La preferencia se guarda en `localStorage`, fuera del proyecto | PASA |
| 6 | Accesos reales: Presupuestar (plan de obra y presupuesto), Entregar (evolución 4D y Render IA), Analizar, Mi estudio, selector de archivos y recorrido del ejemplo. El diálogo de Render IA no se abre por detrás. | PASA |
| 7 | Teclado: el selector de profesión responde a Enter | PASA |
| 8 | Proyecto de ejemplo en 2D y en 3D | PASA |
| 9 | Áreas Diseñar, Analizar, Presupuestar, Entregar y Mi estudio | PASA |
| 10 | El diálogo real de Render IA se abre desde Entregar → Vistas del proyecto y se cierra sin enviar nada. Muros, estancias, puertas y ventanas no cambian. | PASA |
| 11 | No hubo ninguna petición a `/api/render` ni a `/api/share` | PASA |

### HTTP sin coste de proveedor
| Petición | Respuesta |
|---|---|
| `GET /` | 200; el script del registro se carga una sola vez |
| `POST /api/render` con `{}` y sin código | **401 `token`**: Render IA sigue activado y configurado, y la petición se rechaza antes de llamar a OpenAI |
| `GET /api/share` | 405 `method`, sin cambios |
| `GET /labs/` | 404, sigue excluido |

**Registros de Vercel** del despliegue final: ningún error, aviso ni fatal en los primeros minutos tras el Promote.

**Capturas:** `capturas-production/` (escritorio y móvil sin perfil, Constructora, ejemplo en 3D y diálogo de Render IA).

## 4. Lo que no se ha tocado
- `OPENAI_API_KEY`, `RUBIK_RENDER_TOKEN`, `RUBIK_RENDER_ENABLED`, `RUBIK_RENDER_MODEL` y `BLOB_READ_WRITE_TOKEN`: ni se leyeron ni se cambiaron. No se generó ninguna imagen ni se publicó ningún enlace.
- `api/render.js` y `api/share.js`: sin cambios.
- ENT-01, ENT-02 y GOV-08: sin implementar.
- **Configuración del entorno de trabajo de Claude** (no de Vercel ni del producto): se añadió `floorplan-3d-alpha.vercel.app` a los hosts permitidos del entorno de la sesión para poder probar el dominio público.

## 5. Incidencias
Ningún fallo durante la integración ni en Production. No hizo falta vuelta atrás.

Cambio documental en #183: se añadió una **nota de vigencia** a `auditoria-oportunidades-ux-servicios-2026-11-09.md`, porque lo que decía de Production describía el estado anterior a D1.

## 6. Pendientes que siguen abiertos
- **GOV-08 (riesgo alto):** el mismo código de acceso de Production sirve para Render IA y para publicar en `api/share.js`. Además, ese código se compartió en una conversación anterior: su exposición debe gestionarse dentro del trabajo de seguridad (corte S1 de la auditoría), no en esta publicación.
- IMG-01: falta la revisión visual de la banda descargada con acabados alternativos.
- HOM-03, ENT-01 y ENT-02: pendientes de decisión del propietario.
