# HOM-03 · «Nuevos servicios IA» en la Home

**Estado:** PR Draft. **NO MERGE · NO PRODUCTION · STOP_GASTO.**
**Base:** `master@b9f7613` (#234). La auditoría previa y su matriz están en [`matriz-hom-03-auditoria-2026-11-15.md`](matriz-hom-03-auditoria-2026-11-15.md).

## Qué cambia

Se **evoluciona** la Home de HOM-01/HOM-02, no se sustituye. Se mantienen sin cambios:
- cabeceras;
- los seis perfiles;
- su preferencia;
- «Lo que puedes hacer hoy» y su `ORDER`;
- la banda Render IA;
- «Recórrela en 3D» y «Soluciones».

Se añade **una sola sección**, `#welcomeAIServices`, entre la banda Render IA y «Recórrela en 3D». Agrupa los servicios por su estado **real**, verificado en el código, el contrato, las pruebas y la configuración efectiva de Production:

| Estado | Rótulo en la Home | Servicios | Botón |
|---|---|---|---|
| `available` | **Disponible** · «Activo en RUBIK, con sus condiciones» | Render IA | «Ver Render IA»: lleva a la **banda existente**. No hay un segundo acceso de pago ni se abre el diálogo |
| `pilot` | **Piloto en este navegador** · «sin cuentas de usuario ni garantías comerciales» | Asistente RUBIK (consulta guiada) · Mis catálogos | «Abrir el Asistente» → panel del editor · «Abrir Mis catálogos» → Mi estudio |
| `simulation` | **Simulación** · «no hay IA real ni resultado entregable» | Estudio de imágenes · Reformar desde fotografía | «Ver la simulación» → Entregar → su diálogo real (rotulado SIMULACIÓN) |
| `preparation` | **En preparación** · «Todavía no se puede usar» | Asistente conversacional con IA · Imágenes reales desde tu foto | **Ninguno** |

**Cada tarjeta** dice:
- qué es;
- qué **no** es (por ejemplo, «No es un chat con IA generativa: no hay ningún modelo de lenguaje conectado»);
- su límite.

**Reglas de visualización:**
- **Origen de los datos:** el registro. No hay textos sueltos en la interfaz.
- **Botones:** solo aparecen si el módulo que abre el servicio está en la página.
- **Orden:** el perfil elegido solo reordena **dentro** de cada estado.

## Registro verificable (GOV-03)

`js/capability-registry.js` incorpora `AI_GROUPS`, `AI_SERVICES` y `aiServices(audience)`.

Cada servicio incluye:
- módulos y pruebas, que deben existir;
- su SHA de verificación (`b9f7613`);
- las profesiones relevantes;
- textos ES/EN/ZH.

Además:
- **Solo `available` lleva evidencia de Production:** despliegue, SHA, fecha y comprobación. La prueba falla si un servicio sin esa evidencia se declara disponible.
- **CAT-04:** «Tus fichas en Presupuestar» y «El Asistente consulta tus catálogos» están redactados detrás de `gate:'CAT-04'`. `aiServices()` **nunca** los devuelve.
- **Activación de CAT-04:** cuando tenga GO técnico y esté publicado, basta con quitar la puerta y fijar su estado verificado. La prueba exigirá lo mismo que al resto.

## Pruebas

| Suite | Qué demuestra |
|---|---|
| `capability-registry.test.cjs` (4 originales + 4 nuevas) | Módulos y pruebas existen. Solo Render IA es `available`, con evidencia de Production. Las simulaciones se rotulan y dicen «no». El asistente declara «ningún modelo de lenguaje». CAT-04 no se devuelve nunca. Se mantiene el orden por estado. Sin promesas prohibidas |
| `welcome-ai-services.browser.test.cjs` (7, nueva) | 4 estados en 1440×900, 390×844 y 844×390. Ninguna mención a CAT-04. Una sola entrada de pago a Render IA. Objetivos táctiles de 44 px. Sin desplazamiento horizontal. Cada botón abre el lugar real (banda, panel, diálogos) y Escape cierra sin cambiar el proyecto. Los 6 perfiles en escritorio y móvil. EN y ZH sin restos en español. Teclado (Tab a los 5 botones y foco visible). **0 peticiones a `/api`** |
| Mutaciones de control | Cada una de estas mutaciones hace fallar las pruebas: quitar la puerta CAT-04, declarar «disponible» el asistente y poner botón en «En preparación» |

En CI, el workflow **«Home por profesión»** añade el paso «Nuevos servicios IA (HOM-03)».

## Evidencias

`scripts/qa/record-home-ai-services.cjs <dir>` genera desde la app real:
- capturas de la sección por perfil y tamaño;
- una captura de cada lugar que abre un botón;
- un vídeo 1440×900 pulsando cada botón (`ffprobe` y decodificación completa);
- `manifest.json` con SHA-256, la matriz de servicios y las peticiones a `/api`, que deben ser 0.

Las capturas de revisión están en [`capturas/`](capturas/).

## Límites y decisiones abiertas

- **Production no sirve master:** el dominio público sigue en `master@8df49ed`. Esta sección **no** es visible en Production hasta que el propietario haga un Promote (decisión D4 de la matriz). Los pilotos y simulaciones solo funcionan en un despliegue que contenga sus módulos (master ≥ `b9f7613`).
- **Render IA y STOP_GASTO (D3):** la Home ya lo presentaba como «Ya disponible» y en Production sigue activado (`RUBIK_RENDER_ENABLED=1`). HOM-03 no añade ningún acceso de pago nuevo, pero decidir si se mantiene, se rotula o se apaga le corresponde al propietario.
- **Sin cambios en este trabajo:**
  - motores de presupuesto, catálogo, fotos o asistente;
  - APIs;
  - `vercel.json`;
  - secretos;
  - variables de entorno;
  - `ORDER` de «Lo que puedes hacer hoy».
- **D1 y D2:** el antetítulo neutro y la entrada de nuevas capacidades del editor en `ORDER` quedan como decisiones aparte.
