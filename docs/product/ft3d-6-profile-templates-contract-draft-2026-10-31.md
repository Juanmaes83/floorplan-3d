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

No implementar FT3D-4/5/6/7/8 ni Phase D. No offsets exploded, cámaras axon, corte nuevo, before/after inferido, timeline constructivo o certificaciones. No editor libre de timeline ni sexta plantilla «Personalizada»: las cinco tienen personalización limitada. No actualizar estados canónicos como si el diseño documental fuera implementación/cierre.

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
| Plan/UI requieren estancia válida y muros no demolidos | Sin rooms no se habilita una presentación nueva de geometría sola |
| Sidecar local por entrada/proyecto para rooms; Story/sección runtime | No ampliar sidecar ni confundir ausencia de persistencia nueva con ausencia de storage existente |
| B3 graba paradas del plan | No acredita exportación de una Story arbitraria |
| B7 deriva asignaciones/muestras reales, no geometría | Existencia de moodboard no implica builder narrativo de materiales |
| C4 usa `FloorPlanBudgetPresentation.buildReport()` | La plantilla no recalcula precios, sumas o IVA |

## 4. Perfiles y tabla comparativa completa

IDs estables en kebab-case; labels traducibles separados. Prioridad comercial: Inmobiliaria, Promotora, Arquitectura; secundarias Reformas, Interiorismo. No deducir profesión desde nombre/marca/proyecto.

Duración relativa: breve < media < explicativa; describe concisión/densidad, no segundos ni constantes de animación. Cambiar velocidad global no altera composición. No eliminar rooms elegidas para cumplir un tiempo; la estimación real la aporta el builder.

| Criterio | Inmobiliaria | Promotora | Arquitectura | Reformas | Interiorismo |
|---|---|---|---|---|---|
| 1. ID | `real-estate` | `developer` | `architecture` | `renovation` | `interior-design` |
| 2. Nombre | Inmobiliaria | Promotora | Arquitectura | Reformas | Interiorismo |
| 3. Objetivo | Comunicar vivienda rápida y claramente | Explicar edificio, niveles y espacios elegidos | Explicar organización espacial y decisiones | Explicar distribución propuesta y acabados | Explicar interiores, materiales y ambiente |
| 4. Audiencia | Comprador/arrendatario no técnico | Comprador, propiedad, interlocutor comercial | Cliente/promotor, interlocutor técnico sin sustituir planos | Cliente/profesional de intervención | Cliente/prescriptor de interiores |
| 5. Duración | Breve | Media | Explicativa | Media | Media |
| 6. Orden | plan → overview → elevation → room-tour → exterior → closing | overview edificio → axon/exploded → plan por nivel → elevation → room-tour → exterior/site → closing | plan → section → elevation → axon → room-tour → site → closing | plan → section → room-tour → materials → closing | overview → room-tour → materials → closing |
| 7. Required | room-tour, closing | room-tour, closing | plan, room-tour, closing | plan, room-tour, closing | room-tour, closing |
| 8. Preferred | plan, overview, elevation, exterior | overview, exploded/axon, plan, elevation, exterior, site | overview, section, elevation, axon, site | overview, section, materials | overview, materials |
| 9. Optional | site | section, materials, solar, budget-summary | exploded-levels, exterior, materials, solar, budget-summary | elevation, exterior, site, budget-summary | plan, section, exterior, site |
| 10. Excluded por defecto | section, axon, exploded, materials, solar, budget-summary | Ninguna adicional del catálogo | Ninguna adicional del catálogo | axon, exploded, solar | elevation, axon, exploded, solar, budget-summary |
| 11. Unsupported | Omitir, seguir por rooms; avisar required ausente | Omitir scope no demostrado; sin vivienda tipo inferida | Sin section/axon seguir con plano/fachada/rooms y aviso | Sin intervención/before-after inventados | Sin moodboard seguir con rooms y aviso |
| 12. Una planta | Vivienda y rooms | Variante vivienda; omitir exploded | Sección/axon compacta si soportadas | Rooms del único nivel | Rooms del único nivel |
| 13. Dos plantas | Una vivienda, rooms por nivel; no repetir arco completo | Edificio → relación de niveles → bloque por nivel/rooms elegidas | Plano/sección por nivel; fachada/axon global una vez | Niveles elegidos; materiales global una vez | Interiores por nivel y rótulos de continuidad |
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

## 5. Capability taxonomy

Separar existencia en el producto, integración con Story y disponibilidad en este proyecto/ámbito. Un botón existente no prueba un builder narrativo.

| Capability | Intención y scope | Evidencia / frontera |
|---|---|---|
| `plan` | Lectura de distribución por nivel | FT3D-1/2; reveal puede compartir transición con overview |
| `overview` | Vista general por nivel o edificio si acreditado | Paradas existentes; una vista de planta no es overview global |
| `section` | Corte visual por nivel soportado | FT3D-3 integrado; no corte horizontal de muros como reemplazo |
| `elevation` | Fachada visual global/candidata | Contrato FT3D-4, implementación no acreditada aquí |
| `axon` | Lectura axonométrica compacta | FT3D-5 futura; nunca órbita arbitraria |
| `exploded-levels` | Relación espacial de dos niveles | FT3D-5 futura; no secuencia constructiva |
| `room-tour` | Visitas ordenadas a rooms `(levelId,roomId)` | No implica caminar entre rooms/escaleras; primera llegada Story existente, resto requiere composición común |
| `materials` | Acabados/asignaciones reales, apoyo documental | B7 existe, escena Story no acreditada; sin adapter, acceso separado |
| `solar` | Enhancement orientativo en escena compatible | Snapshot válido, anfitriona FT3D-4; no capítulo orbital nuevo |
| `exterior` | Lectura exterior de scope validado | Derivación existente no garantiza capítulo Story |
| `site` | Contexto/implantación ya cargados con provenance | Sin descargas ni estudio urbanístico inventado |
| `budget-summary` | Resumen autorizado desde C4 | No nuevo cálculo ni escena acreditada por existir dossier |
| `closing` | Fin legible con proyecto/identidad existente | Estado terminal común, no necesita cámara/escena geométrica nueva |

Building/level son scopes; rooms miembros de room-tour; walk acción existente explícita; moodboard/dossier recursos relacionados. No motores adicionales. Añadir capability exige decisión revisada, no schema nuevo.

Disponibilidad conceptual: capability, scope/refs válidas, razones, cobertura parcial, recursos presentes y compatibilidad Story. Estados conceptuales supported/partial/unsupported/unknown; unknown no se activa como supported. Son runtime, no estados legales ni datos del proyecto. Para FT3D-4/5: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 6. Modelo declarativo conceptual

Ilustración, NO API pública ni schema persistente; nombres/campos ajustables al contrato final:

```js
{
  id: 'architecture', labelKey: 'presentation.template.architecture',
  intent: 'explain-spatial-organisation', durationIntent: 'explanatory',
  entries: [
    { capability: 'plan', policy: 'required', scope: 'selected-levels' },
    { capability: 'overview', policy: 'preferred', scope: 'selected-levels' },
    { capability: 'section', policy: 'preferred', scope: 'supported-levels' },
    { capability: 'elevation', policy: 'preferred', scope: 'building-once' },
    { capability: 'axon', policy: 'preferred', scope: 'model-once' },
    { capability: 'room-tour', policy: 'required', scope: 'selected-rooms' },
    { capability: 'site', policy: 'preferred', scope: 'model-once' },
    { capability: 'closing', policy: 'required', scope: 'once' }
  ]
}
```

El registro completo declara también optional/excluded, slots de inserción, composición por nivel, captions y selección de rooms. No funciones de render dentro de los datos. Los cinco comparten una forma y algoritmos, sin `if (profile === 'architect')` disperso.

## 7. Required / preferred / optional / excluded

| Policy | Default | Decisión profesional | Unsupported |
|---|---|---|---|
| required | Incluida | No OFF en preset; elegir otro o aceptar resultado parcial sobrevenido | Omitir con motivo, integridad degraded si queda contenido útil |
| preferred | ON si soportada | Puede omitir explícitamente | Omitir con resumen previo, no bloquear |
| optional | OFF | ON/OFF | Deshabilitar con razón, informar si se solicitó |
| excluded-by-default | OFF, fuera del selector básico | Activación deliberada en Más opciones | OFF, explicar si se intenta |

Precedencia: gates/soporte real > opción válida explícita > policy > concisión/duración. Ningún toggle crea soporte. Required expresa pérdida del propósito pleno, no excepción que tumbe todo. No permitir apagar required y mostrar la plantilla como completa.

R=required, P=preferred, O=optional, X=excluded-by-default:

| Capability | real-estate | developer | architecture | renovation | interior-design |
|---|---|---|---|---|---|
| plan | P | P | R | R | O |
| overview | P | P | P | P | P |
| section | X | O | P | P | O |
| elevation | P | P | P | O | X |
| axon | X | P* | P | X | X |
| exploded-levels | X | P* | O | X | X |
| room-tour | R | R | R | R | R |
| materials | X | O | O | P | P |
| solar | X | O | O | X | X |
| exterior | P | P | O | O | O |
| site | O | P | P | O | O |
| budget-summary | X | O | O | O | X |
| closing | R | R | R | R | R |

P*: grupo alternativo. Promotora prefiere exploded con dos niveles, axon compacta con uno; no ambas por defecto. Sin exploded, compacta real es alternativa declarada, rotulada axon y con aviso «sin separación de plantas». Sin ninguna, omitir grupo.

## 8. Resolver puro

`template + capabilities normalizadas + userOptions → resolved story semántica + motivos + integridad`. Sin DOM, red, storage, acceso global ni ejecución de motores.

1. Validar ID/policies/opciones/refs. ID desconocido pide elección válida o flujo histórico, nunca otro perfil silencioso.
2. Validar gates y revisión del snapshot aportado por adaptador; no derivar geometría dentro del resolver.
3. Aplicar priorities/overrides, expandir scopes y alternativas. Partial se resuelve por destino, no booleano global.
4. Componer bloques de nivel/rooms (§10/14); orden estable de autoridad, desempate por ID si corresponde, no reloj/orden accidental.
5. Deduplicar `(capability,scope,target)`. Coalescer plan/overview sólo si el builder acredita ambas lecturas; conservar evidencia semántica de lo cubierto.
6. Aplicar sólo alternativas de §9; registrar lo pedido y lo mostrado separadamente.
7. Devolver intenciones ordenadas, targets/refs, policies, opciones efectivas, cobertura, omisiones/razones y estado. Sin cámara, clipping, matrices ni meshes.
8. Revalidar revisión/recursos/gates antes de iniciar. Si cambian, resolver de nuevo y presentar diferencias; no reproducir refs stale.

Estados runtime conceptuales:

- **ready:** required cubiertas. Las preferred/optional omitidas se explican en preparación como adaptación, sin bloqueo.
- **degraded:** required ausente o alcance elegido incompleto. Si queda contenido espacial útil ejecutable, aviso prominente y aceptación «Ver presentación parcial» antes de reproducir.
- **unavailable:** gate de producto, ausencia de plan ejecutable por el motor actual/rooms válidas, o sólo quedan cierre/documentos. No presentación vacía ni sólo marca. Otras herramientas/entregas siguen disponibles.

Arquitectura sin section/axon conserva plano/fachada si hay/rooms/cierre: ambas son preferred, se informa omisión. Plan required ausente con rooms ejecutables permitiría degraded consentido; si el builder real no puede ejecutar ese subconjunto, unavailable por límite real, no por profesión.

Resolver una vez al preparar/iniciar, nunca por frame. Congelar resultado runtime; cambios posteriores invalidan/restauran por lifecycle actual. Mismos datos+catálogo+opciones producen deepEqual; idioma/viewport/motion no cambian IDs/orden/targets.

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
| Sin informe económico vigente/autorizado | Omitir resumen, dossier separado con sus gates; nunca ausencia → cero |
| Sin identidad | Closing neutral con nombre de proyecto |

Resumen previo enumera omisiones solicitadas y razones/scopes. Required ausente requiere aceptación de parcial. Preferred omitida no genera alertas repetidas durante playback. Optional OFF deliberada no es fallo. No capítulos vacíos «No disponible» para conservar longitud.

## 10. Una y dos plantas

Una planta: globales una vez; bloque plano/overview, sección si procede y rooms. Sin exploded por niveles. Promotora rotula variante de vivienda, sin inventar edificio complejo.

Dos plantas (máximo actual): autoridad/orden abajo arriba; offsets reales sólo vía capacidades. No duplicar el arco completo por nivel. Globales: fachada una vez, axon/exploded una vez, contexto una vez, materiales/económico si soportados una vez y cierre una vez. Por nivel: plano/overview, sección soportada y rooms elegidas; caption de nivel y refs compuestas. No alternar pisos ni recorrer escalera para fingir continuidad.

Órdenes semánticos:

- Inmobiliaria: primer plano/overview → fachada global → rooms nivel 1 → plano/overview y rooms nivel 2 → exterior/site elegido → cierre.
- Promotora: overview global si real (si no, primera vista rotulada por nivel) → exploded/axon → primer bloque plano/overview → fachada global → rooms → segundo bloque/rooms → exterior/site → materiales/económico elegidos → cierre. Nivel representativo elegido cambia énfasis/selección, no tipología ni orden de plantas.
- Arquitectura: plano/overview/sección nivel 1 → fachada global → axon → rooms nivel 1 → plano/overview/sección/rooms nivel 2 → exterior/site → materiales/económico elegidos → cierre.
- Reformas: plano/overview/sección/rooms de cada nivel elegido → materiales → fachada/exterior/site elegidos → económico elegido → cierre.
- Interiorismo: overview/rooms por nivel; plano/sección elegidos antes de rooms de ese nivel → materiales → exterior/site elegidos → cierre.

Slots comunes: section tras plano/overview; axon/exploded global tras fachada o vista global según registro; solar dentro de fachada compatible; materials antes de económico/cierre; budget-summary antes del cierre. Anclajes internos de retorno a overview no son capítulos duplicados.

Una planta sin rooms válidas omite su bloque sin bloquear otra válida. Su geometría sólo aparece en lectura global si la capability acredita ese scope, con aviso de cobertura. Sin ninguna planta presentable: unavailable. Sin tres niveles ni repetición de narrativa. Composición exacta con nuevos anclajes FT3D-5: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 11. Sección: consumir FT3D-3

Intención: incluir, omitir o incluir si soportada según policy. No elegir/recalcular otro corte, eje o candidatos 50/40/60: consumir el determinado por FT3D-3. Sólo una futura API aprobada permitiría otra selección. Soporte por nivel; no implica sección apilada completa. Mantener caption de sección visual, limitaciones de caps y estado abierto legible en reduced motion. Corte horizontal de estancia no satisface section. No fijar p/FOV desde plantilla.

## 12. Fachada: consumir FT3D-4

Intención automática, candidata elegida u omitir. La automática la decide FT3D-4; nunca «principal». Sin norte usar labels neutrales; cardinales sólo derivados de autoridad existente. Norte 0 es válido, distinto de ausencia.

Partial: conservar candidata/scope real con aviso; segundo nivel sin fachada válida no autoriza afirmar edificio completo. Si FT3D-4 no soporta esa cobertura parcial, omitir escena y explicar. Fachada elegida desaparecida requiere aviso y reconfirmación, no candidata alternativa silenciosa. Una vez por Story, no por planta. APIs/refs/anclajes efectivos: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 13. Axon / exploded

Pedir sólo axonometría compacta, relación de dos niveles explotados o ninguna. FT3D-5 decide soporte, scope, offsets, cámara, grupos, cubierta, transformaciones y ensamblaje. No imponer una API privada desde este draft.

Exploded explica organización espacial, nunca orden de construcción/fases/estado de obra. No fabricar dos capas con una planta ni órbita para satisfacer axon. Todo binding concreto: **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**.

## 14. Rooms

- Conservar selección explícita válida del profesional, incluida la reconciliada por el flujo actual. No sobrescribirla por recomendaciones de plantilla.
- Sin selección explícita usar family conocida como clasificación, name como texto. No inferir función/principal/reformado desde palabras o traducciones. Family ausente, unspecified o futura desconocida: label y orden estable, sin reclasificar.
- Defaults recomendados revisables: Inmobiliaria hasta tres rooms living → kitchen → bedroom; Arquitectura/Reformas/Interiorismo hasta cuatro; Promotora hasta tres del nivel representativo elegido y al menos una válida del otro si se incluye. No límites de motor ni requisitos de existencia. No recortar selección explícita para cumplir duración.
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

Usar asignaciones reales y B7 como apoyo documental; no convertir muestra/color en acabado 3D aplicado ni moodboard en geometría. No asignar materiales, inventar calidad constructiva ni usar imagen IA como evidencia. Sin adapter Story, omitir capítulo y mantener acceso existente fuera del player. Tener B7 no acredita capítulo narrativo. Un recurso sin vínculo demostrable a una room no se atribuye a ella.

Reformas/Interiorismo comparten policies y renderer, sin un motor especializado. Si tras FT3D-5 falta representación de apoyo documental dentro del player, decidir alcance separado o seguir con acceso externo; no introducirla como requisito oculto del preset.

## 18. Personalización y UI ligera

Casa: **Entregar → Presentación → Preparar presentación**. Selector de cinco plantillas, objetivo en una frase y resumen «Qué se mostrará» basado en resultado real. Sin área nueva, perfil profesional persistente obligatorio ni editor de timeline.

| Automático | Editable por profesional | Fuera de la plantilla |
|---|---|---|
| Soporte/scope, fallback autorizado, orden base, rooms demostrables sugeridas, cardinales derivados, coalescencia, avisos | Plantilla, preferred/optional/excluded soportadas, fachada elegida, room inicial/selección/orden por nivel, nivel representativo, Solar orientativo, ritmo global, branding/cierre existentes | Geometría, topología, clasificación exterior, cálculo Solar, schema, corte no autorizado, cámaras/offsets |

Cambios sólo en preparación; durante playback salir/pausar y resolver tras restauración, no mutar Story activa. Required no es toggle; ausencia sobrevenida permite parcial consentido. Cambiar plantilla conserva opciones explícitas compatibles y avisa descartes, sin arrastrar Solar ON de forma accidental. «Restaurar recomendaciones» es acción runtime explícita, no borra proyecto, perfiles de marca o sidecars. Flujo histórico sin plantilla permanece disponible y equivalente.

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
| Registro declarativo | Qué contar, policies/scopes/slots/copy | Consultar proyecto/DOM o renderizar |
| Adaptador/snapshot común | Qué sabe hacer el modelo/revisión, refs/razones/partial | Inferir profesión o nueva geometría |
| Resolver puro | Qué queda activado, orden/targets/motivos | Cámara, motor, I/O, storage |
| Builder/player comunes | Cómo convertir en escenas/paradas y reproducir/restaurar | Lógica de negocio por profesión |

Organización candidata: registro + resolver en core puro pequeño; adaptador junto a composición; ampliar ligeramente diálogo existente. Rutas/APIs finales se decidirán al implementar. Catálogo interno versionable para QA, sin formato persistente de proyecto/Story portable.

- **Bajo:** cinco presets, policies, captions, resolver y pruebas puras. Datos/selección, no geometría.
- **Medio:** UI, selección/sidecars, scopes/globales por nivel, punto común de composición y continuidad/restore.
- **Medio:** más de primera room, coalescer plan/overview y coordinar capítulos globales con paradas. No otro player.
- **Alto si se incluye:** nuevas primitivas materiales/económico, exportar Story arbitraria, persistencia portable o cambios de cámara. Fuera salvo soporte previamente aprobado.
- **Dependencia abierta:** bindings/scopes/anclajes FT3D-4/5, PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5.

**Conclusión condicional: presets + resolver puro + UI ligera + tests es viable** tras FT3D-5 si el builder común acepta composición semántica. Story core numérico (`sequence/stateAt`) no debería conocer perfiles. Puede ser necesario modificar integración/composición en UI y captions/controles genéricos para capacidades soportadas; no duplicar escenas. Si hace falta tocar clipping, transformaciones, cámaras, geometría o pipeline de salida, separar gap y decisión de alcance. FT3D-6 no es otro gran corte geométrico.

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

1. Cinco IDs estables, labels separados, capabilities conocidas, policies completas y slots sin ciclos.
2. Required no toggle; preferred ON soportada; optional/excluded OFF; overrides válidos y precedence.
3. Determinismo deepEqual, inputs congelados/no mutación, sin Date/random/I/O, sin dependencia de idioma/viewport/motion.
4. Supported/partial/unsupported/unknown por scope, razones y ningún fallback engañoso.
5. Required ausente → degraded si útil; unavailable sólo §8; nunca cierre solo.
6. Una/dos plantas, nivel vacío, máximo actual, IDs compuestos, globales una vez, sin duplicar arco.
7. Sin section/elevation/axon, grupo alternativo exploded/compacta, ausencia de ambas.
8. Múltiples rooms, una room, selección explícita, family ausente/futura, empate, selección eliminada y snapshot stale.
9. Todas optional OFF; preferred omitida no reaparece por duración; defaults no recortan selección.
10. Mobile/reduced conservan semántica; materiales/económico sin adapter no crean escenas ficticias.

### Browser: ejecutar cada recorrido para cada uno de los cinco perfiles

| Recorrido | Assert |
|---|---|
| Selector/objetivo | Elección real, label/foco/teclado y flujo sin plantilla intacto |
| Story resuelta/orden | Igual al resolver, targets/scopes/cobertura y diferencias narrativas reales |
| Optional toggles | OFF/ON y excluded deliberada; required explicado; resumen actualizado |
| Unsupported | Omisión local/motivo visible, sin escena falsa ni bloqueo injustificado |
| Playback | Player único, anterior/siguiente/scrub/play/pausa/captions coherentes |
| Restore | Salida/cancel/Atrás/Escape a varios puntos restaura cámara/nivel/clipping/Solar/contexto/selección/foco |
| JSON unchanged | Proyecto/edificio/revisión iguales, sin storage/formato nuevo; observar sidecars existentes |
| Mobile | 390×844 y 844×390: iguales escenas/orden/captions, controles y sin overflow |
| Reduced motion | Iguales targets; estados avanzados legibles, no saltados por 0 ms |

### Regresiones

Tras reconciliar: unitarias canónicas; presentation-story, section, elevation y futura axon; Presentation/framing/minimap/foco, building, Solar/territorio si mostrados, capture-3d, tour-video, workspace/Project-First, branding/sidecar afectados. Share/output existentes si cambia entrada; paridad portable Story cuando llegue FT3D-7. Tomar comandos/nombres de la base real, no inventar archivo axon hoy.

Fallos históricos: mismo caso en base limpia exacta y rama, registrar causa/evidencia; no arreglar deuda ajena ni atribuir a SwiftShader sin comparación. No verde con cancelaciones. FAIL/SKIP/gates pendientes separados.

### Evidencia mínima representativa

- Fixture sintético de una planta con varias families/acabados y capability ausente; otro de dos niveles con soporte parcial. Sin datos privados.
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
| Proyecto sin rooms | Unavailable por gate actual; otras entregas accesibles |
| Una estancia | Una visita, no habitaciones/capítulos duplicados |
| Dos plantas | Bloques por nivel/globales una vez, IDs compuestos/restore |
| Planta sin rooms válidas | Omitir bloque; geometría global sólo si scope soportado, aviso |
| Segundo nivel sin fachada válida | Partial validado por FT3D-4 o escena omitida; sin edificio completo ficticio |
| Sección unsupported | Omitir corte sólo donde falla, no bajar muros como sustituto |
| Elevation unsupported | Omitir y motivo previo; rooms siguen |
| Futura axon unsupported | Omitir, no órbita; conservar lectura existente de niveles |
| Solar unavailable | OFF con razón, fachada normal sigue |
| Sin norte | Labels neutrales, no asumir 0 ni inventar cardinal |
| Sin contexto | Omitir site; exterior real puede seguir |
| Sin moodboard | Omitir materials sin contenido; no paleta inventada |
| Exterior parcial | Scope rotulado parcial, no cobertura completa |
| Room inicial desaparece | Reconciliar/reconfirmar; si activa, invalidar/restaurar |
| Todas optional OFF | Núcleo + preferred soportadas; nada vacío |
| Arquitectura sin section/axon | Plano/fachada si hay/rooms/cierre; avisos, no falsa sección |
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
| Required ausente y útil restante | Degraded con aceptación, no excepción/fallback falso |
| Sólo closing/documentos | Unavailable narrativa, herramientas documentales accesibles |
| Precio 0/ausente, IVA null/0 | Semántica C4 conservada sin rellenos |
| ID/opción desconocida | Rechazo explicable, elección válida, sin ejecución dinámica |

## 29. DONE futuro

**Documento publicado no es DONE funcional de FT3D-6.** Entrada: FT3D-4/5 cerrados/integrados, nueva base exacta comprobada, reconciliar scopes/slots/limitaciones, aprobar contrato y gaps de primitivas antes de autorizar implementación.

DONE exige catálogo/resolver con policies completas, adaptadores a autoridades existentes, una/dos plantas y todas las rooms elegidas, UI ligera/omisiones/consentimiento parcial, cero nueva geometría/schema/persistencia, flujo histórico y gates intactos, restore/JSON comprobados, QA §26/28 y regresiones/baseline, evidencia visual en HEAD exacto y revisión humana, mobile/reduced equivalentes y salidas existentes no rotas con FT3D-7 explícito. Publicación/integración y actualización canónica según workflow; READY de rama no equivale a cerrado.

## 30. Preguntas tras FT3D-5

Todas **PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**, sin intervenir ahora en FT3D-4:

1. ¿Qué disponibilidad/scopes/refs/revisiones y partial efectivos ofrecen elevation/axon/exploded?
2. ¿Qué overview global/compacta y anclajes de entrada/salida aporta FT3D-5 en uno/dos niveles? No decidir cámara/offsets aquí.
3. ¿Cómo acepta el builder lista semántica, globales/bloques y más de primera room conservando player/restore/progreso? ¿Cuál es el cambio mínimo de composición?
4. ¿Qué holds reducidos de cada capacidad preservan estados útiles, reverse y navegación?
5. ¿Existen adapters comunes materiales/C4 en Story? Si no, accesos documentales/omisión; cualquier primitiva nueva requiere alcance separado.
6. ¿Closing cabe como estado terminal con branding existente o requiere pequeño adaptador UI común, sin geometría?
7. ¿Cómo se invalidan/reconfirman IDs de fachada al cambiar proyecto según contrato efectivo FT3D-4?
8. ¿Cómo se representa cobertura parcial de nivel sin afirmar lectura de edificio completo?
9. ¿Qué comportamiento exacto de sidecar/selección debe conservarse sin persistir automáticamente defaults de preset?
10. ¿Qué salidas consumen Story real tras FT3D-5 y cuáles aún paradas? Reservar gaps de transporte a FT3D-7.
11. ¿Qué densidad/duración y evidencia sobre hardware representativo se aprueban? No fijar FPS/segundos sin medición.

### Entrega documental

Un único documento draft, base fija conservada, sin código ni tests de producto modificados/ejecutados. Sin cambios a Story/UI, View3D, building, Solar, exterior, schema o persistencia. Validación documental local: 30 secciones numeradas en orden, 27 criterios comparativos para los cinco perfiles, 13 filas de capabilities con cinco policies y enlaces locales resueltos; revisión de consistencia y diff limitado a este archivo. Sin suites de producto ni QA visual de una funcionalidad que aún no se implementa. Publicación: commit/push de rama documental y worktree limpio. No merge, PR nueva ni apertura de implementación en esta misión.

**ESTADO: FT3D-6 DISEÑADO — PENDIENTE DE RECONCILIACIÓN TRAS FT3D-5**
