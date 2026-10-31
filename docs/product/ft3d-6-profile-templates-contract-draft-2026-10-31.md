# FT3D-6 — Plantillas de presentación por perfil profesional — contrato draft

**Fecha:** 31-10-2026.

**Estado:** diseño documental; NO IMPLEMENTADO; PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5.

**Repositorio:** `Juanmaes83/floorplan-3d`.

**Base fija estudiada:** `master@806e8558a6459fe74ac55c8f7d0ab2d387eac5c8`, confirmada también como HEAD remoto al iniciar.

**Rama:** `docs/ft3d-6-profile-templates-contract`.

**Entrada funcional:** sólo después de integrar/cerrar FT3D-5 y reconciliar este draft con FT3D-4/5 efectivos. La autorización documental paralela no autoriza implementación ni interferencia en `feat/ft3d-4-elevation-facade`.

## 1. Objetivo

El profesional elige una intención narrativa y obtiene una presentación coherente del proyecto sin construir animaciones ni una timeline manual. FT3D-6 cambia selección, énfasis y orden; no los hechos.

```text
CAPACIDADES DEL MODELO → Presentation Story común
        ↓
PLANTILLA DE PERFIL + opciones del profesional
        ↓
resolver de capacidades disponibles
        ↓
descripción semántica resuelta
        ↓
builder común → escenas reales → player existente → cliente
```

La plantilla no asigna profesión al proyecto. Un proyecto puede presentarse con distintas plantillas. Principio: **más contexto, no más falsa certeza**.

## 2. No objetivos

Sin otro Story engine, player, renderer/canvas, escenas duplicadas por profesión, modelo geométrico, sistema de cámaras o persistencia paralela. Sin condiciones de perfil dispersas por el renderer. No modificar topología, Solar, exterior, contratos, schema, datos persistidos, providers, licencias ni políticas de exportación.

No implementar FT3D-4/5/6/7/8 ni Phase D. No offsets exploded, cámaras axon, corte nuevo, before/after inferido, timeline constructivo o certificaciones. Fuera de FT3D-6 V1: editor libre de timeline y plantilla «Personalizada». V1 sólo implementará las cinco plantillas definidas, con personalización limitada. Una plantilla personalizada/editor avanzado podrá estudiarse después como alcance separado; no se diseña aquí ni queda prohibida para siempre. No actualizar estados canónicos como si el diseño documental fuera implementación/cierre.

## 3. Fuentes y arquitectura observada

Estudiados en la base fija:

- [Programa Flat-to-3D](flat-to-3d-presentation-knowledge-programme-2026-10-30.md): perfiles, Story, una autoridad y secuencia FT3D-6/7/8.
- [Estado operativo](current-status-2026-10-30.md) y [matriz](roadmap-completion-matrix-2026-10-30.md): FT3D-1/2/3 integrados; 4 siguiente corte, 5/6/7 pendientes. C1–C4 integrados; B1/B3/B4/B7 existentes con límites. El encargo informa del desarrollo paralelo FT3D-4; esta misión no consulta/modifica su rama.
- [FT3D-3](ft3d-3-dynamic-section-contract-2026-10-31.md): corte derivado, omisión por nivel, restauración y reduced motion legible. Su encabezado de autorización es histórico respecto a su integración actual.
- [FT3D-4](ft3d-4-elevation-facade-contract-2026-10-31.md): fachada global una vez, candidata automática neutral, norte/Solar/contexto opcionales. En esta base es contrato, no implementación acreditada.
- [Punto 9](point-9-ux-professional-discoverability-2026-10-28.md): Entregar es la casa narrativa, Mi estudio es identidad transversal. Sus límites históricos de presupuesto no sustituyen el estado actual C4.
- [Building presentation](building-presentation-2026-10-19.md): máximo dos niveles, abajo arriba, identidad `(levelId, roomId)`, retorno al nivel inicial y sin recorrer escaleras.
- [Workflow](../DEVELOPMENT-WORKFLOW.md): preservar trabajo, base exacta, separar validación/cierre y revisión humana. Esta misión autoriza sólo documento, commit y push de rama; no pide PR ni merge.

Inspección de sólo lectura de [Story core](../../js/presentation-story-core.js), [UI](../../js/presentation-ui.js), [Presentation core](../../js/presentation-core.js), [rutas](../../js/presentation-route.js), [moodboard](../../js/moodboard-core.js), [vídeo](../../js/tour-video-ui.js) y [presentación económica](../../js/budget-presentation.js):

| Evidencia en la base | Consecuencia |
|---|---|
| Builders puros, `stateAt(p)`, `sequence`, pesos y progreso reversible | El resolver no calcula cámaras ni matrices |
| `plan-reveal`, `room-descent`, `section-open` existentes | Nombres de implementación conocidos; no autoridad conceptual del preset. `elevation-open` es recomendado por contrato FT3D-4 |
| `fullStory()` encadena por nivel plano, sección si elegida y descenso a la PRIMERA estancia | No afirmar que ya reproduce todas las rooms/capabilities: habrá un gap de composición que reconciliar |
| Plan con overview y todas las rooms seleccionadas, UI con orden por planta | Reutilizar paradas/selección/navegación; no otro itinerario |
| Plan/UI actuales requieren estancia válida y muros no demolidos | Limitación del builder/player de esta base, no mínimo semántico permanente. Ejecutar una Story válida sin rooms queda PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5 |
| Sidecar local por entrada/proyecto para rooms; Story/sección runtime | No ampliar sidecar ni confundir ausencia de persistencia nueva con ausencia de storage existente |
| B3 graba paradas del plan | No acredita exportación de una Story arbitraria |
| B7 deriva asignaciones/muestras reales, no geometría | Existencia de moodboard no implica builder narrativo de materiales |
| C4 usa `FloorPlanBudgetPresentation.buildReport()` | La plantilla no recalcula precios, sumas o IVA |

## 4. Perfiles y tabla comparativa completa

IDs estables en kebab-case; labels traducibles separados. Prioridad comercial: Inmobiliaria, Promotora, Arquitectura; secundarias Reformas, Interiorismo. No deducir profesión desde nombre/marca/proyecto.

Duración relativa: breve < media < explicativa; describe concisión/densidad, no segundos ni constantes de animación. Cambiar velocidad global no altera composición. No eliminar rooms elegidas para cumplir un tiempo; la estimación real la aporta el builder. Los órdenes incluyen sólo elementos resueltos y no exigen rooms en todos los perfiles. Required expresa intención fuerte; el mínimo narrativo vinculante de cada perfil está en §7.

| Criterio | Inmobiliaria | Promotora | Arquitectura | Reformas | Interiorismo |
|---|---|---|---|---|---|
| 1. ID | `real-estate` | `developer` | `architecture` | `renovation` | `interior-design` |
| 2. Nombre | Inmobiliaria | Promotora | Arquitectura | Reformas | Interiorismo |
| 3. Objetivo | Comunicar vivienda rápida y claramente | Explicar edificio, niveles y espacios elegidos | Explicar organización espacial y decisiones | Explicar distribución propuesta y acabados | Explicar interiores, materiales y ambiente |
| 4. Audiencia | Comprador/arrendatario no técnico | Comprador, propiedad, interlocutor comercial | Cliente/promotor, interlocutor técnico sin sustituir planos | Cliente/profesional de intervención | Cliente/prescriptor de interiores |
| 5. Duración | Breve | Media | Explicativa | Media | Media |
| 6. Orden | plan → overview → elevation → room-tour → exterior → closing | overview edificio → axon/exploded → plan por nivel → elevation → room-tour → exterior/site → closing | plan → section → elevation → axon → room-tour → site → closing | plan → section → room-tour → materials → closing | overview → room-tour → materials → closing |
| 7. Required (intención fuerte) | room-tour, closing | overview global, closing | plan, closing | plan, closing | room-tour, closing |
| 8. Preferred | plan, overview, elevation, exterior | exploded/axon, plan, elevation, room-tour, exterior, site | overview, section, elevation, axon, room-tour, site | overview, section, room-tour, materials | overview, materials |
| 9. Optional | site | section, materials, solar, budget-summary | exploded-levels, exterior, materials, solar, budget-summary | elevation, exterior, site, budget-summary | plan, section, exterior, site |
| 10. Excluded por defecto | section, axon, exploded, materials, solar, budget-summary | Ninguna adicional del catálogo | Ninguna adicional del catálogo | axon, exploded, solar | elevation, axon, exploded, solar, budget-summary |
| 11. Unsupported | Evaluar mínimo general + interior; sin él unavailable | Lectura de edificio suficiente sin rooms; required ausente sólo degraded si mínimo pasa | Plan + sección/fachada/axon puede bastar sin rooms; comprobar mínimo | Plan + rooms o sección; sin mínimo unavailable, sin before/after | Mantener lectura general + interior; moodboard solo no sustituye rooms |
| 12. Una planta | Vivienda y rooms | Variante vivienda; omitir exploded; lectura espacial sin rooms posible | Plano/lectura arquitectónica; rooms no obligatorias | Plano + rooms y/o sección del nivel | Lectura interior del único nivel |
| 13. Dos plantas | Una vivienda, rooms por nivel; no repetir arco completo | Edificio → niveles/fachada/contexto; rooms si existen y se eligen | Planos/secciones por nivel; fachada/axon global; rooms si existen | Base espacial por nivel elegido; materiales global una vez | Interiores por nivel y rótulos de continuidad |
| 14. Inicio | living → kitchen → bedroom si family explícita | Elección en nivel representativo; fallback primera válida abajo arriba | Elección; después living o primera válida | Elección profesional; sin ella no decir afectada | Elección; después living o primera válida |
| 15. Sección | Excluida salvo elección deliberada | Opcional por nivel soportado | Preferida, corte automático FT3D-3 | Preferida sin inferir afectación | Opcional |
| 16. Fachada | Preferida automática/seleccionable | Preferida global, no principal | Preferida global | Opcional | Excluida por defecto |
| 17. Axon/exploded | Excluidas | Exploded con dos niveles; compacta con uno | Compacta preferida; exploded opcional con dos niveles | Excluidas | Excluidas |
| 18. Exterior/contexto | Exterior preferido, site opcional | Ambos preferidos si existen | Site preferido, exterior opcional | Ambos opcionales | Ambos opcionales |
| 19. Solar | Excluido | Opcional orientativo | Opcional orientativo | Excluido | Excluido |
| 20. Materiales | Excluidos del arco breve | Opcionales asignados | Opcionales asignados | Preferidos, sin calidad/ejecución inventada | Preferidos, moodboard documental vinculado |
| 21. Económico/dossier | Sin económico por defecto; A4 aparte | C4 opcional autorizado, A4 aparte | C4 opcional, A4 aparte | C4 opcional con pendientes visibles, A4 aparte | Económico excluido, A4/moodboard aparte |
| 22. Captions | Distribución/nombre real de estancia | Edificio/nivel/espacios elegidos | Lectura espacial y límites visuales | Propuesta actual/acabados asignados | Interior/paleta asignada |
| 23. Closing | Proyecto + identidad/contacto existente | Identidad/entregas existentes, sin estado comercial inventado | Identidad/documentación existente | Identidad/documentación para revisar | Identidad/moodboard si existe |
| 24. Reduced motion | Mismas rooms/vistas; discreto | Mismos niveles y estados legibles | Mantener sección/fachada/axon | Mismos espacios/materiales | Mismos espacios/moodboard |
| 25. Mobile | Igual narrativa, selector compacto | Igual niveles y rótulos | Advertencias visibles, controles compactos | Igual selección/captions | Igual materiales; detalles plegables |
| 26. Vídeo/export | B3 actual, sin prometer Story completa | Idem; sin nuevo transporte de edificio | Idem; límites técnicos conservados | Idem; no before/after | Idem; no moodboard en vídeo implícito |
| 27. Personalización | Toggles, fachada, rooms/inicio/orden, ritmo, marca | Idem + nivel representativo elegido | Idem + omitir lecturas preferidas | Idem + rooms indicadas por profesional | Idem + materiales soportados; sin cámaras |

Salón/cocina/dormitorios son recomendaciones condicionadas a family explícita, no capítulos a inventar. «Representativa» es elección narrativa; no demuestra que una planta sea unidad independiente o vivienda tipo.

## 5. Capability taxonomy: scene / enhancement / resource / structure

Separar existencia en el producto, integración con Story y disponibilidad en este proyecto/ámbito. Un botón existente no prueba un builder narrativo. Las cuatro familias NO pasan por el mismo gate ni crean capítulos de la misma manera.

| Familia | Elementos | Tratamiento del resolver |
|---|---|---|
| `scene` | plan, overview, section, elevation, axon, exploded-levels, room-tour, exterior, site | Lecturas narrativas espaciales con soporte y scope ejecutables; candidatas a capítulos y a satisfacer minimumStory |
| `enhancement` | solar | Resolver contra una escena anfitriona compatible; enriquecerla, nunca crear capítulo ni satisfacer por sí solo un grupo espacial |
| `resource` | materials, budget-summary; moodboard y dossier relacionados como recursos de apoyo | Alimentar captions/paneles/anexos; sólo capítulo si existe adapter Story aprobado y ejecutable. La existencia del recurso no prueba escena ni mínimo espacial |
| `structure` | closing | Estructura narrativa común del builder/player, no capacidad geométrica del proyecto ni prueba de contenido espacial mínimo |

| Elemento | Familia | Intención y scope | Evidencia / frontera |
|---|---|---|---|
| `plan` | scene | Lectura de distribución por nivel | FT3D-1/2; reveal puede compartir transición con overview |
| `overview` | scene | Vista general por nivel o edificio si acreditado | Paradas existentes; una vista de planta no es overview global |
| `section` | scene | Corte visual por nivel soportado | FT3D-3 integrado; no corte horizontal de muros como reemplazo |
| `elevation` | scene | Fachada visual global/candidata | Contrato FT3D-4, implementación no acreditada aquí |
| `axon` | scene | Lectura axonométrica compacta | FT3D-5 futura; nunca órbita arbitraria |
| `exploded-levels` | scene | Relación espacial de dos niveles | FT3D-5 futura; no secuencia constructiva |
| `room-tour` | scene | Visitas ordenadas a rooms `(levelId,roomId)` | No implica caminar entre rooms/escaleras; primera llegada Story existente, resto requiere composición común |
| `materials` | resource | Acabados/asignaciones reales, apoyo documental | B7 existe, escena Story no acreditada; sin adapter, acceso separado |
| `solar` | enhancement | Enriquecimiento orientativo de escena compatible | Snapshot válido, anfitriona FT3D-4; no capítulo solar nuevo |
| `exterior` | scene | Lectura exterior de scope validado | Derivación existente no garantiza capítulo Story |
| `site` | scene | Contexto/implantación ya cargados con provenance | Sin descargas ni estudio urbanístico inventado |
| `budget-summary` | resource | Resumen autorizado desde C4 | No nuevo cálculo ni escena acreditada por existir dossier |
| `closing` | structure | Fin legible con proyecto/identidad existente | Estado terminal común; no depende de disponibilidad geométrica |

Building/level son scopes; rooms miembros de room-tour; walk acción existente explícita. Moodboard/dossier no añaden IDs de escena a V1: son recursos relacionados con materials/budget-summary y salidas existentes. Sin motores adicionales. Añadir elemento exige decisión revisada, no schema nuevo.

Disponibilidad conceptual de escenas: scope/refs válidas, razones, cobertura parcial y compatibilidad Story. Enhancements añaden vínculo a anfitriona; recursos separan existencia, relación/provenance y adapter aprobado; estructura se valida en el relato común, no contra geometría. Supported/partial/unsupported/unknown son estados runtime conceptuales; unknown no se activa como supported, ni son estados legales/datos de proyecto. Para FT3D-4/5 y ejecución sin rooms: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 6. Modelo declarativo conceptual

Ilustración, NO API pública ni schema persistente; nombres/campos ajustables al contrato final:

```js
{
  id: 'architecture', labelKey: 'presentation.template.architecture',
  intent: 'explain-spatial-organisation', durationIntent: 'explanatory',
  minimumStory: [
    { oneOf: ['plan'] },
    { oneOf: ['section', 'elevation', 'axon'] }
  ],
  entries: [
    { capability: 'plan', policy: 'required', scope: 'selected-levels' },
    { capability: 'overview', policy: 'preferred', scope: 'selected-levels' },
    { capability: 'section', policy: 'preferred', scope: 'supported-levels' },
    { capability: 'elevation', policy: 'preferred', scope: 'building-once' },
    { capability: 'axon', policy: 'preferred', scope: 'model-once' },
    { capability: 'room-tour', policy: 'preferred', scope: 'selected-rooms' },
    { capability: 'site', policy: 'preferred', scope: 'model-once' },
    { capability: 'closing', policy: 'required', scope: 'once' }
  ]
}
```

El registro completo declara también familia según §5, minimumStory con scopes según §7, optional/excluded, slots de inserción, composición por nivel, captions y selección de rooms. El ejemplo mantiene capability como clave conceptual compartida, sin equiparar escenas, enhancements, recursos y estructura. Closing es estructura común; Solar requiere anfitriona; los recursos requieren adapter aprobado para crear capítulo. No funciones de render dentro de los datos. Los cinco comparten una forma y algoritmos, sin `if (profile === 'architect')` disperso.

## 7. Required / preferred / optional / excluded

| Policy | Default | Decisión profesional | Unsupported |
|---|---|---|---|
| required | Intención fuerte incluida | No OFF en preset completo; elegir otro o aceptar parcial | Omitir con motivo; degraded sólo si minimumStory se cumple y el builder lo ejecuta |
| preferred | ON si soportada | Puede omitir explícitamente | Omitir con resumen previo, no bloquear |
| optional | OFF | ON/OFF | Deshabilitar con razón, informar si se solicitó |
| excluded-by-default | OFF, fuera del selector básico | Activación deliberada en Más opciones | OFF, explicar si se intenta |

Precedencia: gates/soporte real > opción válida explícita > policy > concisión/duración. Ningún toggle crea soporte. Required expresa intención fuerte/pérdida del propósito pleno; minimumStory es el gate obligatorio de validez narrativa. No permitir apagar required y mostrar la plantilla como completa. Required ausente sólo admite degraded si minimumStory se cumple; si éste falla, unavailable, aunque se acepte una omisión. El consentimiento no crea mínimos ni soporte.

R=required, P=preferred, O=optional, X=excluded-by-default:

| Capability | real-estate | developer | architecture | renovation | interior-design |
|---|---|---|---|---|---|
| plan | P | P | R | R | O |
| overview | P | R | P | P | P |
| section | X | O | P | P | O |
| elevation | P | P | P | O | X |
| axon | X | P* | P | X | X |
| exploded-levels | X | P* | O | X | X |
| room-tour | R | P | P | P | R |
| materials | X | O | O | P | P |
| solar | X | O | O | X | X |
| exterior | P | P | O | O | O |
| site | O | P | P | O | O |
| budget-summary | X | O | O | O | X |
| closing | R | R | R | R | R |

La matriz es de intención por elemento: R/P/O/X no elimina la distinción de familias ni convierte recursos/enhancements/closing en escenas. Overview R de Promotora se refiere a lectura global; una vista aislada de planta no la cumple como si fuera edificio completo. P*: grupo alternativo. Promotora prefiere exploded con dos niveles, axon compacta con uno; no ambas por defecto. Sin exploded, compacta real es alternativa declarada, rotulada axon y con aviso «sin separación de plantas». Sin ninguna, omitir grupo.

### Minimum viable story / grupos de requisitos

MinimumStory expresa grupos semánticos mínimos: todos los grupos deben cumplirse (AND); dentro de cada oneOf basta una alternativa válida (OR), con el scope y contenido exigidos. Se evalúa sobre lo incluido realmente después de policies/opciones/soporte, no sobre catálogo ideal. No activa por sí mismo optional/excluded ni reintroduce escenas omitidas. Si un cambio de opción rompe el mínimo, indicarlo antes de iniciar y pedir revisar opciones; no sustituir silenciosamente.

| Perfil | Minimum story conceptual | Relación con required / rooms |
|---|---|---|
| Inmobiliaria | Lectura general de vivienda: oneOf(plan, overview, axon) AND lectura interior: room-tour | Room-tour sigue siendo central por decisión explícita V1. Una fachada/contexto no sustituye interiores; required ausente no salva un mínimo incumplido |
| Promotora | Lectura de edificio: oneOf(overview global, axon del edificio, exploded-levels, plan por niveles, elevation con scope de edificio) | Sin obligación de rooms. Overview global es intención fuerte; axon/planos/fachada pueden sostener mínimo y permitir degraded si falta overview |
| Arquitectura | plan AND oneOf(section, elevation, axon), con alcance coherente del proyecto/niveles presentados | Sin obligación de room-tour. Overview/site añaden contexto preferido, no son necesarios para validar plan → section/elevation/axon → closing |
| Reformas | plan AND oneOf(room-tour, section) del alcance presentado | Base espacial demostrable; materials puede enriquecer si adapter real, nunca sustituir esta base. Sin before/after inferido |
| Interiorismo | Lectura general: oneOf(overview, plan, axon) AND lectura interior demostrable: room-tour en V1 | Room-tour central. Puede estudiarse alternativa futura mediante lectura interior/materiales suficientemente rica con adapter Story aprobado, vínculo espacial y criterio de aceptación explícito; un moodboard/recurso solo NO satisface ese grupo |

Los scopes son vinculantes: en dos plantas, «plan por niveles» cubre los niveles declarados, no sólo una planta rotulada como edificio entero. Con una planta Promotora admite su lectura global real de vivienda. Coverage parcial exige valorar el alcance narrado y avisar; no dar por cumplido un mínimo de alcance completo con datos parciales.

Closing debe estar presente como estructura común, pero no cuenta como grupo espacial ni depende de rooms/geometría. Si el builder no puede producir un cierre común válido, registrar fallo de composición/estructura, no unsupported geométrico; no iniciar una composición estructuralmente inválida. Solar nunca satisface un grupo por sí solo. Recursos sin adapter Story aprobado no cuentan como escenas; materiales con adapter tampoco satisfacen automáticamente mínimos espaciales: la alternativa interior futura necesita decisión de contrato separada. No se inventa ese adapter aquí.

Validez semántica y ejecución se registran por separado. Ejemplos válidos conceptualmente sin rooms: Promotora overview edificio → axon/exploded → planos por nivel → fachada → contexto → closing; Arquitectura plan → section → elevation → axon → closing. Si la base actual no puede materializarlos por su builder dependiente de rooms, registrar bloqueo de ejecución actual **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**, no cambiar minimumStory a «debe haber rooms».

## 8. Resolver puro

`template + snapshot tipado + userOptions → descripción semántica + minimumStory + integridad + ejecutabilidad`. Sin DOM, red, storage, acceso global ni ejecución de motores. Separar lo que el perfil quiere, su validez mínima y lo que el builder actual puede ejecutar.

1. Validar ID/policies/familias/minimumStory/opciones/refs. ID desconocido pide elección válida o flujo histórico, nunca otro perfil silencioso.
2. Validar gates y revisión del snapshot aportado por adaptador. Separar requisitos semánticos del perfil de limitaciones actuales del builder/player; no derivar geometría aquí.
3. Aplicar prioridades/overrides y scopes. Escenas: candidatos espaciales con soporte real y scope demostrado; la materialización de la secuencia global se verifica después, sin filtrar todo por el gate actual de rooms. Enhancements: adjuntar sólo a anfitriona compatible real. Recursos: captions/paneles/anexos; capítulo sólo mediante adapter Story aprobado. Estructura: closing del relato común, no disponibilidad geométrica. Partial se resuelve por destino/alcance.
4. Componer bloques de nivel/rooms (§10/14); orden estable de autoridad/ID, no reloj. No exigir room-tour a perfiles cuyo mínimo admite otras lecturas.
5. Deduplicar por familia/intención/scope/target; coalescer plan/overview sólo si builder acredita ambas lecturas. No contar Solar/recurso/closing como escena espacial para satisfacer mínimos.
6. Aplicar sólo alternativas §9; registrar pedido/mostrado por separado. Evaluar AND/OR de minimumStory con scopes sobre resultado efectivo. Si falla, unavailable; no rescatarlo sólo porque queda algo útil o un required cubierto.
7. Evaluar required como intención fuerte: si falta pero mínimo pasa, degraded con aviso/aceptación. Preferred omitida informa adaptación; optional OFF no es fallo. Verificar además que el builder puede materializar esa Story válida, sin convertir sus límites actuales en reglas permanentes.
8. Devolver intenciones tipadas ordenadas, refs, policies, opciones efectivas, omisiones, cobertura, grupos mínimos satisfechos/incumplidos y razones separadas de validez/ejecución/integridad. Sin cámara, clipping, matrices ni meshes.
9. Revalidar revisión/recursos/gates antes de iniciar; cambios obligan a resolver de nuevo y presentar diferencias, no reproducir refs stale.

Estados runtime conceptuales:

- **ready:** minimumStory satisfecho, required cubiertas, estructura válida y builder capaz de ejecutar. Preferred/optional omitidas se explican sin bloqueo.
- **degraded:** minimumStory satisfecho y ejecutable, pero falta required o cobertura del alcance elegido. Aviso prominente y aceptación «Ver presentación parcial». El mínimo del alcance realmente declarado debe seguir cumpliéndose; aceptar no autoriza fingir cobertura.
- **unavailable:** minimumStory incumplido, gate real de producto o resultado no ejecutable por builder/player. Identificar cuál es la causa. No relato vacío/sólo marca. Otras herramientas/entregas siguen disponibles.

Una Story puede ser semánticamente válida sin rooms. En la base inspeccionada el builder/player necesita rooms válidas para crear su plan: es limitación actual de ejecución, **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**, no unavailable conceptual permanente del perfil. Si persiste al implementar, la UI no ofrece iniciar ese resultado aunque el mínimo pase: informa validez semántica y bloqueo actual por separado, sin inventar soporte.

Arquitectura sin section/axon pasa si quedan plan + elevation soportada; sin las tres lecturas alternativas falla su mínimo, aunque queden rooms/closing. Promotora sin rooms puede cumplir con axon/planos/fachada globales. Inmobiliaria sin lectura interior falla el mínimo V1. Required ausente sólo permite degraded con mínimo satisfecho, nunca excepción al gate.

Resolver una vez, no por frame; congelar resultado runtime. Invalidación restaura por lifecycle actual. Mismos datos+catálogo+opciones producen deepEqual; idioma/viewport/motion no cambian IDs/orden/targets ni grupos mínimos.

## 9. Fallbacks y avisos

| Ausencia | Política |
|---|---|
| Section por nivel | Omitir ese corte; nunca section → lowered walls |
| Elevation | Omitir, no vista interior disfrazada de fachada |
| Axon | Omitir, no axon → arbitrary orbit |
| Exploded sin soporte, compacta real disponible | Alternativa §7 rotulada compacta, sin afirmar separación |
| Plan/overview redundantes | Coalescer sólo si primitiva cubre ambas intenciones |
| Ruta de caminar no viable | Mantener visitas/paradas, no llamarlas recorrido continuo; acción de ruta conserva fallbacks/rótulos actuales |
| Exterior parcial | Scope validado y aviso; no completar envolvente/contexto |
| Solar unavailable | Desactivar enhancement, fachada sigue con iluminación normal |
| Sin materiales/moodboard | Omitir capítulo, estado honesto en preparación |
| Sin informe económico vigente/autorizado | Omitir recurso/resumen, dossier separado con sus gates; nunca ausencia → cero |
| Sin identidad | Closing neutral con nombre de proyecto |

Tras omitir/sustituir, reevaluar minimumStory antes de reproducir: si falla, unavailable; si pasa pero falta required, degraded con aceptación. No sustituir room-tour por fachada para Inmobiliaria V1; Promotora/Arquitectura no requieren ese reemplazo porque rooms no son obligatorias. Resumen previo enumera omisiones solicitadas y razones/scopes. Required ausente sólo admite parcial si el mínimo sigue satisfecho y ejecutable. Preferred omitida no genera alertas repetidas durante playback. Optional OFF deliberada no es fallo. No capítulos vacíos «No disponible» para conservar longitud.

## 10. Una y dos plantas

Una planta: globales una vez; bloque plano/overview, sección si procede y rooms si resueltas; sin rooms evaluar minimumStory independientemente. Sin exploded por niveles. Promotora rotula variante de vivienda, sin inventar edificio complejo.

Dos plantas (máximo actual): autoridad/orden abajo arriba; offsets reales sólo vía capacidades. No duplicar el arco completo por nivel. Globales: fachada una vez, axon/exploded una vez, contexto una vez, materiales/económico si soportados una vez y cierre una vez. Por nivel: plano/overview, sección soportada y rooms elegidas si existen; caption de nivel y refs compuestas. No alternar pisos ni recorrer escalera para fingir continuidad.

Órdenes semánticos:

- Inmobiliaria: primer plano/overview → fachada global → rooms nivel 1 → plano/overview y rooms nivel 2 → exterior/site elegido → cierre.
- Promotora: overview global si real (si no, primera vista rotulada por nivel) → exploded/axon → primer bloque plano/overview → fachada global → rooms → segundo bloque/rooms → exterior/site → materiales/económico elegidos → cierre. Nivel representativo elegido cambia énfasis/selección, no tipología ni orden de plantas.
- Arquitectura: plano/overview/sección nivel 1 → fachada global → axon → rooms nivel 1 → plano/overview/sección/rooms nivel 2 → exterior/site → materiales/económico elegidos → cierre.
- Reformas: plano/overview/sección/rooms de cada nivel elegido → materiales → fachada/exterior/site elegidos → económico elegido → cierre.
- Interiorismo: overview/rooms por nivel; plano/sección elegidos antes de rooms de ese nivel → materiales → exterior/site elegidos → cierre.

Los órdenes anteriores son ideales condicionados al soporte y al mínimo, no listas de pasos obligatorios: sin rooms se suprime room-tour sin eliminar otras lecturas por nivel. Promotora y Arquitectura admiten las historias sin rooms de §7; ejecución concreta PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5. Slots comunes: section tras plano/overview; axon/exploded global tras fachada o vista global según registro; solar dentro de fachada compatible; materials antes de económico/cierre; budget-summary antes del cierre. Anclajes internos de retorno a overview no son capítulos duplicados.

Una planta sin rooms válidas omite únicamente room-tour. Plano/sección/fachada/axon u otras lecturas pueden seguir siendo semánticamente válidas si la capability acredita su scope; no borrar todo el bloque por falta de rooms. Evaluar minimumStory del perfil y alcance: sin rooms puede bastar para Promotora/Arquitectura, o para Reformas con plan + section. El builder actual puede impedir ejecutar incluso esa Story válida: límite actual PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5, no prohibición futura de producto. Unavailable narrativo sólo si el mínimo falla; un bloqueo de ejecución se informa por separado como §8. Sin tres niveles ni repetición de narrativa. Composición exacta con nuevos anclajes FT3D-5: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 11. Sección: consumir FT3D-3

Intención: incluir, omitir o incluir si soportada según policy. No elegir/recalcular otro corte, eje o candidatos 50/40/60: consumir el determinado por FT3D-3. Sólo una futura API aprobada permitiría otra selección. Soporte por nivel; no implica sección apilada completa. Mantener caption de sección visual, limitaciones de caps y estado abierto legible en reduced motion. Corte horizontal de estancia no satisface section. No fijar p/FOV desde plantilla.

## 12. Fachada: consumir FT3D-4

Intención automática, candidata elegida u omitir. La automática la decide FT3D-4; nunca «principal». Sin norte usar labels neutrales; cardinales sólo derivados de autoridad existente. Norte 0 es válido, distinto de ausencia.

Partial: conservar candidata/scope real con aviso; segundo nivel sin fachada válida no autoriza afirmar edificio completo. Si FT3D-4 no soporta esa cobertura parcial, omitir escena y explicar. Fachada elegida desaparecida requiere aviso y reconfirmación, no candidata alternativa silenciosa. Una vez por Story, no por planta. APIs/refs/anclajes efectivos: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 13. Axon / exploded

Pedir sólo axonometría compacta, relación de dos niveles explotados o ninguna. FT3D-5 decide soporte, scope, offsets, cámara, grupos, cubierta, transformaciones y ensamblaje. No imponer una API privada desde este draft.

Exploded explica organización espacial, nunca orden de construcción/fases/estado de obra. No fabricar dos capas con una planta ni órbita para satisfacer axon. Todo binding concreto: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 14. Rooms

- Room-tour no es condición universal de existencia: sólo componente central explícito de Inmobiliaria e Interiorismo V1; Promotora/Arquitectura y Reformas con sección evalúan sus mínimos sin obligar a tour. Si no hay rooms, no ejecutar defaults de selección vacíos ni inventar habitaciones; las otras lecturas conservan su elegibilidad semántica, con límite actual de builder PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5.
- Conservar selección explícita válida del profesional, incluida la reconciliada por el flujo actual. No sobrescribirla por recomendaciones de plantilla.
- Sin selección explícita usar family conocida como clasificación, name como texto. No inferir función/principal/reformado desde palabras o traducciones. Family ausente, unspecified o futura desconocida: label y orden estable, sin reclasificar.
- Defaults recomendados revisables: Inmobiliaria hasta tres rooms living → kitchen → bedroom; Arquitectura/Reformas/Interiorismo hasta cuatro; Promotora hasta tres del nivel representativo elegido y una válida del otro si se incluye room-tour y existe; no obligación de generar rooms para presentar edificio. No límites de motor ni requisitos de existencia. No recortar selección explícita para cumplir duración.
- Arquitectura/Interiorismo: inicio explícito, después living si clasificada, después primera válida. Reformas pide elegir espacios si se quiere decir «afectados»; sin indicación dice «Espacios del proyecto». Promotora no detecta viviendas tipo/unidades.
- Desempate por orden canónico de la fuente e ID. Sin family: primera válida sin adivinar. Una estancia se visita una vez, sin simular más habitaciones.
- Validez y encuadre son de autoridades actuales. Room-tour no promete ruta interior viable entre paradas.
- Profesional cambia inicio, selección y orden dentro del nivel; no cámaras, keyframes, caminos dibujados ni orden libre de capítulos globales.
- Inicio eliminado antes de empezar: reconciliar, avisar, proponer primera válida restante y reconfirmar cambio. Durante playback: invalidar/restaurar y volver a preparar, no salto silencioso.

## 15. Exterior / site

Sólo derivaciones/recursos existentes y cargados, con scope, calidad, provenance, licencias y gates actuales. Exterior del modelo y contexto territorial son cosas distintas. Sin site no ocultar modelo ni bloquear rooms; parcial rotulado parcial. No descargas por elegir perfil ni nueva colocación, clasificación, permisos o persistencia. Transporte puede tener gates más estrictos que vista interna.

## 16. Solar

Enhancement orientativo opt-in, inicialmente OFF incluso en perfiles que lo admiten. Sólo snapshot válido existente y anfitriona compatible (fachada según FT3D-4), sin capítulo solar inventado. Sin reloj como entrada implícita ni recálculo por frame. Mantener fecha/hora y advertencia de no estudio/certificación. Sin norte/ubicación suficientes, unavailable real, no norte asumido. Restauración de iluminación por lifecycle común. Perder Solar no bloquea fachada.

## 17. Materiales / moodboard

Usar asignaciones reales y B7 como apoyo documental; no convertir muestra/color en acabado 3D aplicado ni moodboard en geometría. No asignar materiales, inventar calidad constructiva ni usar imagen IA como evidencia. Sin adapter Story, omitir capítulo y mantener acceso existente fuera del player. Tener B7 no acredita capítulo narrativo ni satisfacción de minimumStory. Materials/budget-summary son recursos: el resolver sólo crea capítulo con adapter Story aprobado y scope/contenido válidos; no los trata como escenas por existir. Un recurso sin vínculo demostrable a una room no se atribuye a ella.

Reformas/Interiorismo comparten policies y renderer, sin un motor especializado. Si tras FT3D-5 falta representación de apoyo documental dentro del player, decidir alcance separado o seguir con acceso externo; no introducirla como requisito oculto del preset.

## 18. Personalización y UI ligera

Casa: **Entregar → Presentación → Preparar presentación**. Selector de cinco plantillas, objetivo en una frase y resumen «Qué se mostrará» basado en resultado real. Sin área nueva ni perfil profesional persistente obligatorio; editor de timeline/plantilla Personalizada fuera de V1, ampliación futura separada sin diseñarla aquí.

| Automático | Editable por profesional | Fuera de la plantilla |
|---|---|---|
| Soporte/scope, fallback autorizado, orden base, rooms demostrables sugeridas, cardinales derivados, coalescencia, avisos | Plantilla, preferred/optional/excluded soportadas, fachada elegida, room inicial/selección/orden por nivel, nivel representativo, Solar orientativo, ritmo global, branding/cierre existentes | Geometría, topología, clasificación exterior, cálculo Solar, schema, corte no autorizado, cámaras/offsets |

Cambios sólo en preparación; durante playback salir/pausar y resolver tras restauración, no mutar Story activa. Required es intención fuerte, no toggle del preset completo; ausencia sólo permite parcial consentido si minimumStory se mantiene y la Story es ejecutable. Si mínimo falla no se habilita iniciar ni se compensa con consentimiento. Cambiar plantilla conserva opciones explícitas compatibles y avisa descartes, sin arrastrar Solar ON de forma accidental. «Restaurar recomendaciones» es acción runtime explícita, no borra proyecto, perfiles de marca o sidecars. Flujo histórico sin plantilla permanece disponible y equivalente.

## 19. Persistencia

Recomendación inicial: **runtime configuration sin modificar FloorPlanProjectV1/BuildingV1**. ID, toggles, fachada, ritmo, resultado, snapshot de capabilities, warnings y progreso viven en sesión. No guardar cámara, clipping, descriptors, offsets, escenas derivadas ni traducciones.

Rooms y marca ya tienen mecanismos locales: preservarlos sin nueva clave/versión/campo. Previsualizar recomendaciones no debe escribirlas automáticamente como preferencia permanente; selección explícita iniciada mantiene comportamiento del flujo existente, que debe probarse. JSON editable idéntico antes/después no equivale a prometer que no exista ninguna escritura UI local histórica.

«Última plantilla» podría ser preferencia UI/local futura con reset, separada del proyecto y sin probar profesión. No se recomienda en primer corte. Reproducibilidad entre dispositivos/archivos necesita contrato de salida FT3D-7; no serialización oculta aquí.

## 20. Captions y closing

| Perfil | Intención de copy, sólo si demostrable | Closing |
|---|---|---|
| Inmobiliaria | «Así se organiza la vivienda»; nombre real de estancia/nivel | Proyecto + identidad/contacto seleccionado |
| Promotora | «Organización del edificio» sólo con scope global; «Espacios seleccionados · nivel» | Identidad/entregas existentes, sin estado comercial |
| Arquitectura | «Lectura espacial del proyecto»; advertencias canónicas de sección/fachada visual | Proyecto/identidad/documentación existente |
| Reformas | «Distribución propuesta del proyecto»; «Acabados asignados» | Documentación para revisar; económico sólo autorizado/elegido |
| Interiorismo | «Espacios interiores del proyecto»; «Paleta y acabados asignados» | Identidad y moodboard existente si hay contenido |

No reemplazar facts/advertencias de cada capability por marketing. No inventar norte, principal, certificación, calidad, precio final, estado de obra, antes/después, secuencia constructiva o cumplimiento normativo. Precio 0 distinto de ausente; IVA null distinto de 0; provenance/revisión/licencia tal como C4 informa. No sumas ni recálculos.

Closing neutral si no hay marca: nombre de proyecto + fin. Snapshot de identidad existente al iniciar; sin empresa ficticia ni enlace remoto/upload automático.

## 21. Accessibility

Selector accesible con label, objetivo y foco predecible; razones disabled asociadas, resumen/omisiones en texto. No depender de color, animación, minimapa o miniatura. Explicar priorities al profesional sin imponer jerga al cliente.

Mismos controles de play/pausa/anterior/siguiente/scrub/salida y retorno de foco. Sin nuevos atajos ni autoplay por elegir plantilla. Traducción ES/EN/ZH mediante sistema actual; datos del usuario como texto, no HTML. Aria-live para escena/mensaje, no cada frame. Captions con room/nivel y advertencias, incluso sin animación.

## 22. Reduced motion

```text
mismas capabilities resueltas → mismos targets/orden/captions
        ↓
transiciones reducidas + estados semánticos legibles del player común
```

Nunca eliminar section/elevation/axon por movimiento reducido. Sección abierta, frontal de fachada y lectura de niveles deben tener estados discretos/holds con avance explícito, no todos en 0 ms invisibles. Capability anfitriona define esos estados, no preset. Si falta estado reducido equivalente es gate del adaptador/QA, no paridad ficticia.

Reverse y restore iguales. Cambiar preferencia no modifica resolved story, sólo transición. No confundir reduced motion con fallo WebGL/soporte geométrico.

## 23. Mobile

En 390×844 y 844×390 conservar plantilla, orden, targets, captions, warnings y controles principales. Reducir texto secundario/densidad del selector, plegar opciones; no eliminar narrativa ni controles de salida/pausa/nivel.

Sin nuevos paneles que tapen el modelo. Encadre adaptado por builder actual a región libre, no cámara móvil del preset. Resize/orientación conserva escena/progreso semántico. QA sin overflow horizontal y con scroll vertical operable. Rendimiento con entorno declarado: SwiftShader no acredita móvil físico.

## 24. Arquitectura y estimación de riesgo (sin horas)

| Capa | Responsabilidad | Prohibición |
|---|---|---|
| Registro declarativo | Qué contar, familias, policies/scopes/slots/copy y minimumStory | Consultar proyecto/DOM o renderizar |
| Adaptador/snapshot común | Disponibilidad tipada, refs/partial; separar soporte de capacidad de límite del builder actual | Inferir profesión o nueva geometría |
| Resolver puro | Resultado por familia, minimumStory, integridad required y ejecución separados | Cámara, motor, I/O, storage |
| Builder/player comunes | Cómo convertir en escenas/paradas y reproducir/restaurar | Lógica de negocio por profesión |

Organización candidata: registro + resolver en core puro pequeño; adaptador junto a composición; ampliar ligeramente diálogo existente. Rutas/APIs finales se decidirán al implementar. Catálogo interno versionable para QA, sin formato persistente de proyecto/Story portable.

- **Bajo:** cinco presets, policies, captions, resolver y pruebas puras. Datos/selección, no geometría.
- **Medio:** UI, selección/sidecars, scopes/globales por nivel, punto común de composición y continuidad/restore.
- **Medio:** más de primera room, coalescer plan/overview y coordinar capítulos globales con paradas. No otro player.
- **Alto si se incluye:** nuevas primitivas materiales/económico, exportar Story arbitraria, persistencia portable o cambios de cámara. Fuera salvo soporte previamente aprobado.
- **Dependencia abierta:** bindings/scopes/anclajes FT3D-4/5, PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5.

**Conclusión condicional: presets + resolver puro + UI ligera + tests es viable** tras FT3D-5 si el builder común acepta composición semántica. Story core numérico (`sequence/stateAt`) no debería conocer perfiles ni policies. El gate actual de rooms pertenece al builder/player: permitir materializar Stories semánticamente válidas sin rooms es gap por reconciliar tras FT3D-5, no requisito permanente del catálogo. Solar se adjunta a anfitriona, recursos usan adapters aprobados y closing es estructura común sin disponibilidad geométrica. Puede ser necesario modificar integración/composición en UI y captions/controles genéricos para capacidades soportadas; no duplicar escenas. Si hace falta tocar clipping, transformaciones, cámaras, geometría o pipeline de salida, separar gap y decisión de alcance. FT3D-6 no es otro gran corte geométrico.

## 25. Separación de FT3D-7 y salidas

FT3D-6 elige **qué contar** dentro de Rubik. FT3D-7 resolverá **cómo entregar la Story con equivalencia semántica**, permisos y transporte. No prometer que seleccionar preset modifica todos los archivos existentes.

| Recurso | FT3D-6 reutiliza | Frontera |
|---|---|---|
| B1 offline | Archivo cliente/flujo actual | Sin serialización preset ni player portable nuevo |
| B3 vídeo | Recorder de paradas actual y regresiones | Story arbitraria con todos los holds/captions no acreditada: FT3D-7 |
| B4 share | Share existente/permisos/privacidad | No upload al elegir plantilla ni enlace con Story completa implícito |
| A4 dossier | Documentación existente relacionada | No cambiar composición/exportación por perfil |
| C4 económico | Fuente autorizada y salida separada | Sin recálculo/cambio de variante/permisos/nuevo formato |
| B7 moodboard | Apoyo real o acceso aparte sin adapter | No malla ni incrustación vídeo/share no demostrada |
| Branding/Mi estudio | Snapshot y cierre existentes | Sin duplicación de identidad o perfiles persistentes de plantilla |

Capturas sólo en checkpoints estables con gates actuales de movimiento/carga/licencias. Sin cámara distinta para exportar. B3 puede grabar selección de paradas sin representar todas las capabilities: decirlo, no «vídeo completo de Story». No romper salidas existentes; paridad portable ampliada queda FT3D-7.

## 26. QA futuro (no se implementan tests en esta misión)

### Unitarias

1. Cinco IDs estables, labels separados, familias scene/enhancement/resource/structure, policies completas, minimumStory por perfil y slots sin ciclos.
2. Required como intención fuerte no toggle del preset completo; preferred ON soportada; optional/excluded OFF; overrides válidos y precedence. MinimumStory se evalúa después de opciones, sin reactivar elementos apagados.
3. Determinismo deepEqual, inputs congelados/no mutación, sin Date/random/I/O, sin dependencia de idioma/viewport/motion.
4. Supported/partial/unsupported/unknown por scope, razones y ningún fallback engañoso.
5. Required ausente + minimumStory satisfecho + ejecución válida → degraded consentido; minimumStory incumplido → unavailable aunque quede algún contenido útil. Closing/Solar/recursos sin adapter nunca satisfacen un grupo espacial. Reportar gate de ejecución distinto de invalidez semántica.
6. Una/dos plantas, nivel sin rooms, máximo actual, IDs compuestos, globales una vez, sin duplicar arco. Fixtures sin rooms de Promotora/Arquitectura satisfacen semánticamente sus mínimos con lecturas soportadas; si builder no ejecuta, razón de bloqueo actual separada y PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5.
7. Sin section/elevation/axon, grupo alternativo exploded/compacta, ausencia de ambas.
8. Múltiples rooms, una room, selección explícita, family ausente/futura, empate, selección eliminada y snapshot stale.
9. Todas optional OFF; preferred omitida no reaparece por duración; defaults no recortan selección.
10. Mobile/reduced conservan semántica/mínimos. Solar sólo enhancement con anfitriona, sin capítulo; materiales/económico sólo capítulo con adapter Story aprobado; closing estructural común, no capacidad geométrica. Inmobiliaria requiere general + interior; Reformas plan + rooms/section; Interiorismo V1 general + rooms, alternativa interior rica futura sólo tras aprobación explícita.

### Browser: ejecutar cada recorrido para cada uno de los cinco perfiles

| Recorrido | Assert |
|---|---|
| Selector/objetivo | Elección real, label/foco/teclado y flujo sin plantilla intacto |
| Story resuelta/orden | Igual al resolver, targets/scopes/cobertura; minimumStory efectivo y familias sin capítulos ficticios; diferencias narrativas reales |
| Optional toggles | OFF/ON y excluded deliberada; required explicado; resumen actualizado |
| Unsupported | Omisión local/motivo visible; required ausente sólo parcial si mínimo pasa, mínimo fallido bloquea iniciar; límite del builder sin rooms diferenciado |
| Playback | Player único, anterior/siguiente/scrub/play/pausa/captions coherentes |
| Restore | Salida/cancel/Atrás/Escape a varios puntos restaura cámara/nivel/clipping/Solar/contexto/selección/foco |
| JSON unchanged | Proyecto/edificio/revisión iguales, sin storage/formato nuevo; observar sidecars existentes |
| Mobile | 390×844 y 844×390: iguales escenas/orden/captions, controles y sin overflow |
| Reduced motion | Iguales targets; estados avanzados legibles, no saltados por 0 ms |

### Regresiones

Tras reconciliar: unitarias canónicas; presentation-story, section, elevation y futura axon; Presentation/framing/minimap/foco, building, Solar/territorio si mostrados, capture-3d, tour-video, workspace/Project-First, branding/sidecar afectados. Share/output existentes si cambia entrada; paridad portable Story cuando llegue FT3D-7. Tomar comandos/nombres de la base real, no inventar archivo axon hoy.

No declarar una suite «completamente verde» si contiene cancelaciones. Para fallos/cancelaciones ejecutar el mismo caso en baseline limpio del SHA exacto y en rama con condiciones comparables: si se reproduce en baseline, puede clasificarse como deuda preexistente no bloqueante, documentando explícitamente caso, resultados y evidencia; si base pasa y rama falla/cancela, es regresión y bloquea DONE. No arreglar deuda ajena ni atribuir a SwiftShader sin evidencia comparativa. FAIL/SKIP/cancelaciones/gates pendientes separados.

### Evidencia mínima representativa

- Fixture sintético de una planta con varias families/acabados y capability ausente; otro de dos niveles con soporte parcial. Añadir datos semánticos sin rooms para verificar mínimos Promotora/Arquitectura y su bloqueo de ejecución separado si persiste; no inventar evidencia browser de soporte aún no implementado. Sin datos privados.
- Cinco capturas selector/resumen y cinco listas resueltas locales, una por perfil: demuestra selección/orden distintos sin cinco vídeos enormes.
- Contact sheet desktop: inicio, capítulo distintivo y cierre por perfil (15 checkpoints): rooms breve, niveles Promotora, sección/axon Arquitectura, distribución/acabados Reformas, interiores/moodboard Interiorismo sólo si soportado.
- Dos vídeos cortos con pipeline QA común: Arquitectura una planta forward/reverse/cancel; Promotora dos plantas con degradación y cambio de nivel.
- Selector/resumen + capítulo en ambos móviles; estados reducidos de sección/fachada/axon y paridad lógica para los cinco.
- Comparación de salida/entrada, JSON idéntico, reporte de omisiones y capturas sobre SHA final exacto. Revisión visual real; READY/pixel diff no la sustituyen. Declarar límites hardware.

## 27. Riesgos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Helpers privados FT3D-4/5 cambian | Alto hasta reconciliar | Capabilities semánticas, adaptador único, gate posterior |
| Arco duplicado por nivel/profesión | Medio | Bloques comunes y globales una vez; fixture dos niveles |
| Botón existente confundido con builder | Alto | Separar existencia módulo, soporte Story y scope |
| Required produce fallo global | Medio | Integridad vs ejecutabilidad, parcial consentido |
| Inferir profesión/room/vivienda tipo | Medio | Elección explícita/family, no palabras del nombre |
| UI editor de timeline | Medio | Selector/resumen y opciones delimitadas |
| Cámaras/schema/persistencia paralelos | Alto si se permite | Runtime/autoridades comunes; sin formato nuevo |
| Pérdida en móvil/reduced | Medio | Paridad semántica, controles existentes |
| Export promete más que pipeline real | Alto | Límites actuales explícitos, FT3D-7 separado |
| Complejidad de secundarios | Bajo con catálogo común | Mismas policies/algoritmos, sin before/after ni motor moodboard |
| Rendimiento | Medio integración | Resolver una vez, no red/derivación por frame; comparar baseline |

## 28. Matriz de edge cases

| Caso | Resultado esperado / QA |
|---|---|
| Proyecto sin rooms | Evaluar minimumStory independiente: Promotora/Arquitectura pueden ser válidas sin tour; Inmobiliaria/Interiorismo V1 fallan grupo interior. Builder de esta base puede bloquear materialización: limitación actual PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5, no regla permanente |
| Una estancia | Una visita, no habitaciones/capítulos duplicados |
| Dos plantas | Bloques por nivel/globales una vez, IDs compuestos/restore |
| Planta sin rooms válidas | Omitir sólo tour; conservar lecturas soportadas de su nivel/globales, evaluar mínimo y scope; ejecución sin rooms pendiente de reconciliación |
| Segundo nivel sin fachada válida | Partial validado por FT3D-4 o escena omitida; sin edificio completo ficticio |
| Sección unsupported | Omitir corte sólo donde falla, no bajar muros como sustituto |
| Elevation unsupported | Omitir y motivo previo; rooms siguen |
| Futura axon unsupported | Omitir, no órbita; conservar lectura existente de niveles |
| Solar unavailable | Enhancement OFF con razón, fachada normal sigue; no capítulo ni grupo mínimo solar |
| Sin norte | Labels neutrales, no asumir 0 ni inventar cardinal |
| Sin contexto | Omitir site; exterior real puede seguir |
| Sin moodboard | Omitir recurso sin contenido; aun presente no crea escena sin adapter Story aprobado ni satisface mínimo interior por sí solo |
| Exterior parcial | Scope rotulado parcial, no cobertura completa |
| Room inicial desaparece | Reconciliar/reconfirmar; si activa, invalidar/restaurar |
| Todas optional OFF | Núcleo + preferred soportadas; nada vacío |
| Arquitectura sin section/axon | Plan + elevation válida satisface mínimo; sin section/elevation/axon mínimo falla aunque haya rooms/cierre; nunca falsa sección |
| Promotora una planta | Variante vivienda, sin exploded ni unidades inventadas |
| Interiorismo sin moodboard | Overview/rooms/cierre, omisión honesta |
| Reforma sin before/after | Sólo propuesta actual, sin comparativa |
| Orientación parcial | Cardinales sólo donde demostrables, resto neutral |
| Mobile landscape | 844×390 operable, igual narrativa/captions y salida visible |
| Reduced motion | Mismos targets/orden, estados discretos legibles |
| Cancelación | Restore exacto por lifecycle en cualquier capítulo |
| Reverse/scrub repetidos | Mismo progreso = mismo estado, sin acumulación |
| Offline | Resolver sin red; sólo recursos presentes; no Story B1 nueva |
| Capture | Checkpoint estable, gates/provenance actuales, formato igual |
| Vídeo | B3 no roto, alcance paradas explícito; resto FT3D-7 |
| Share | Sin upload por perfil ni paridad Story implícita |
| Project JSON unchanged | Igual al elegir/reproducir/exportar/cancelar; edificio también |
| Sin WebGL/context loss | Fallback/gate actual, sin renderer alternativo; restaurar/informar |
| Gate edificio pendiente | Preset no lo salta, conservar motivo/acción |
| Fachada seleccionada stale | Aviso/reconfirmación, no candidata distinta silenciosa |
| Required ausente y mínimo satisfecho | Degraded sólo si ejecutable y con aceptación; contenido útil genérico no reemplaza minimumStory |
| Sólo closing/documentos | Mínimo espacial falla: unavailable narrativa; closing estructural y recursos no son geometría; herramientas documentales accesibles |
| MinimumStory incumplido con required presente | Unavailable; intención fuerte cubierta no sustituye grupos mínimos |
| Promotora sin rooms | Overview global/axon/exploded/planos por niveles/elevation de edificio pueden validar mínimo; no exigir tour; registrar bloqueo actual si no ejecuta |
| Arquitectura sin rooms | Plan + section/elevation/axon puede validar mínimo y cierre; tour sólo preferido; ejecución pendiente tras FT3D-5 |
| Reformas sin rooms | Plan + section del alcance puede validar mínimo; sin ambos no iniciar; materials no sustituye base |
| Interiorismo sin tour con moodboard | En V1 mínimo interior no satisfecho; alternativa futura sólo con lectura interior rica y adapter/aprobación explícitos |
| Personalizada/editor avanzado | Fuera de V1; posible estudio futuro separado, no prohibición permanente |
| Precio 0/ausente, IVA null/0 | Semántica C4 conservada sin rellenos |
| ID/opción desconocida | Rechazo explicable, elección válida, sin ejecución dinámica |

## 29. DONE futuro

**Documento publicado no es DONE funcional de FT3D-6.** Entrada: FT3D-4/5 cerrados/integrados, nueva base exacta comprobada, reconciliar scopes/slots/limitaciones, aprobar contrato y gaps de primitivas antes de autorizar implementación.

DONE exige catálogo/resolver con familias y policies completas, minimumStory por perfil, required ausente sólo degraded si mínimo satisfecho, mínimo fallido unavailable y límites de ejecución actuales separados; adaptadores a autoridades existentes, una/dos plantas, todas las rooms elegidas cuando aplican y soporte/restricción sin rooms explícitamente reconciliado tras FT3D-5, UI ligera/omisiones/consentimiento parcial, cero nueva geometría/schema/persistencia, flujo histórico y gates intactos, restore/JSON comprobados, QA §26/28 y regresiones/baseline, evidencia visual en HEAD exacto y revisión humana, mobile/reduced equivalentes y salidas existentes no rotas con FT3D-7 explícito. Publicación/integración y actualización canónica según workflow; READY de rama no equivale a cerrado.

## 30. Preguntas tras FT3D-5

Todas **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**, sin intervenir ahora en FT3D-4:

1. ¿Qué disponibilidad/scopes/refs/revisiones y partial efectivos ofrecen elevation/axon/exploded? ¿Qué lecturas permiten cumplir los mínimos de Promotora/Arquitectura sin rooms y cómo materializa el builder esa Story, sin perpetuar su gate actual?
2. ¿Qué overview global/compacta y anclajes de entrada/salida aporta FT3D-5 en uno/dos niveles? No decidir cámara/offsets aquí.
3. ¿Cómo acepta el builder lista semántica, globales/bloques y más de primera room conservando player/restore/progreso? ¿Cuál es el cambio mínimo de composición?
4. ¿Qué holds reducidos de cada capacidad preservan estados útiles, reverse y navegación?
5. ¿Existen adapters Story aprobados materiales/C4? Sin ellos son recursos/accesos documentales, no capítulos. ¿Puede una evolución separada ofrecer lectura interior/materiales suficientemente rica como alternativa al grupo interior de Interiorismo? No basta moodboard solo ni se diseña adapter aquí.
6. ¿Cómo integra el builder closing como estructura terminal común y Solar como enhancement de anfitriona, sin tratarlos como capacidades geométricas ni grupos espaciales?
7. ¿Cómo se invalidan/reconfirman IDs de fachada al cambiar proyecto según contrato efectivo FT3D-4?
8. ¿Cómo se representa cobertura parcial de nivel sin afirmar lectura de edificio completo?
9. ¿Qué comportamiento exacto de sidecar/selección debe conservarse sin persistir automáticamente defaults de preset?
10. ¿Qué salidas consumen Story real tras FT3D-5 y cuáles aún paradas? Reservar gaps de transporte a FT3D-7.
11. ¿Qué densidad/duración y evidencia sobre hardware representativo se aprueban? No fijar FPS/segundos sin medición.

### Entrega documental

Un único documento draft, base fija conservada, sin código ni tests de producto modificados/ejecutados. Sin cambios a Story/UI, View3D, building, Solar, exterior, schema o persistencia. Validación documental: 30 secciones numeradas en orden, 27 criterios comparativos, 13 elementos de cuatro familias con cinco policies y mínimo narrativo explícito de los cinco perfiles; enlaces locales resueltos y revisión de consistencia required/minimumStory/ejecución. Corrección dirigida sobre HEAD 85eb3d58191e31aef5ab69c7ecdda38851428930, sin reescribir el contrato ni historia; diff limitado a este archivo. Sin suites de producto ni QA visual de una funcionalidad que aún no se implementa. Publicación: commit/push de rama documental y worktree limpio. No merge, PR nueva ni apertura de implementación en esta misión.

**ESTADO: FT3D-6 DRAFT CORREGIDO — PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**
