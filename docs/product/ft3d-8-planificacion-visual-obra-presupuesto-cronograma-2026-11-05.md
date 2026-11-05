# FT3D-8 — Planificación visual de obra, cronograma y presupuesto vinculados al modelo 3D
**RUBIK SOTA · Adenda de descubrimiento y contrato preliminar · 05/11/2026**

**Estado:** DOCUMENTADO EN EL PROGRAMA ORIGINAL / NO IMPLEMENTADO COMO CAPACIDAD PROFESIONAL EN `master`. **SIN AUTORIZACIÓN DE CÓDIGO, MERGE, DEPLOY NI GASTOS API**. Esperar finalización de Claude Code y Kimi Code; coordinar únicamente después de aprobación del propietario.
**Prioridad propuesta:** backlog estratégico FT3D-8, más visible en el programa global. Debe evaluarse por producto/cliente y datos de proyecto antes de comparar su prioridad con Home V2, E2, Render IA o CAT-IA.
**Objetivo:** hacer comprensible **qué partes de una obra se ejecutarían en qué fase, con qué duración, qué dependencias y qué presupuesto respaldado por cantidades y precios verificados**, sin confundir una simulación con ejecución real.

## Actualización de producto: prioridad visual con DATOS reales (05/11/2026)

Tras revisar los repositorios disponibles, el propietario ha especificado una prioridad más precisa: **mostrar visualmente el inicio, desarrollo y fin de la obra, con animación ilustrativa de montaje y tareas, pero un Gantt REAL de fechas, tareas y presupuesto vinculado a datos C1–C4**. Esto **no significa** que FT3D-8A aislado sea un producto profesional listo para venta: el primer piloto útil debe unir la experiencia visual con el cronograma y las cifras verificadas, aunque la coreografía no sea fiel a la ejecución exacta.

**Estudio comparativo y recomendación de stack:** [FT3D-8 — repositorios, animación visual, Gantt real y presupuesto](ft3d-8-repositorios-plan-visual-gantt-presupuesto-2026-11-05.md). Incluye Flat-to-3D MIT (visual), Frappe Gantt MIT (cronograma), 4DBIM MIT (vínculo tarea↔elemento), jsgantt-improved (alternativa con auditoría de licencia pendiente) y otras referencias. Ninguna dependencia nueva ha sido añadida a RUBIK. **No implementar ni fusionar mientras Claude y Kimi no terminen**.

## 1. Evidencia visual aportada por el propietario

En seis capturas de la referencia interactiva **Schedule Build / The Build** se ven la misma casa en:
- **WK 01:** emplazamiento y preparación de excavación;
- **WK 08 / WK 09:** estructura y cerramientos / montaje de cubierta;
- **WK 12 / WK 13:** fachada y acabados próximos a completarse.
Cada imagen muestra una casa 3D transformándose con grúa, cubierta, cerramientos y elementos auxiliares; una banda inferior con Gantt, semanas y tareas; indicador naranja de fecha/actividad y controles de cámara/reproducción. La comparación incluye `A // PROG`, `B // 1:1 SHEET`, `C // CAM`.

**Lo observado visualmente no acredita** una vinculación real con cantidades, costes, precios, certificaciones ni planificación calculada. Las fechas/presupuestos del cliente **no se extraen** de las capturas.

Referencias originales:
- [Schedule Build, demo](https://sam1983aing.github.io/flat-to-3d/05-schedule-build/?dir=a)
- [Schedule Build, código y README](https://github.com/Sam1983Aing/flat-to-3d/tree/main/05-schedule-build)
- [Build Time-Lapse, demo](https://sam1983aing.github.io/flat-to-3d/04-build-time-lapse/)
- [Build Time-Lapse, código](https://github.com/Sam1983Aing/flat-to-3d/tree/main/04-build-time-lapse)
- [Vídeo externo estudiado en el programa](https://www.youtube.com/watch?v=UTCPqJZFg04)
- [Archivo de vídeo en el repositorio RUBIK](https://github.com/Juanmaes83/floorplan-3d/blob/master/videos/proyecto-floor-plan-3d.mp4) (91.650.280 bytes; presencia de archivo comprobada, **contenido visual exacto no comprobado**).

## 2. DÓNDE estaba documentado YA (localización obligatoria)

1. [`docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`](flat-to-3d-presentation-knowledge-programme-2026-10-30.md), §3 («Build Time-Lapse» y «Schedule Build») y **§7 «Fase FT3D-8 — Timeline de construcción»**, que la define expresamente como familia futura separada, no como funcionalidad disponible.
2. [`docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md`](evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md), auditoría específica **D16** (aparición temporal), **D17** (varias vistas), **D18** (programa y 3D sincronizados).
3. [`docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`](ft3d-donor-global-reconciliation-2026-11-01.md), §2 D16–D18 y §7.1 «Frontera temporal y económica». Confirma **MODEL D — HYBRID**, Gantt/3D compartiendo cursor, Story ya reutilizable y dominio constructivo faltante.
4. [`docs/product/evidence/donor-cuts-2026-11-01/manifest.md`](evidence/donor-cuts-2026-11-01/manifest.md) fija procedencia de la auditoría de D16–D18 (Cut 4, investigación, sin implementación).
5. [`docs/product/rubik-roadmap-operativo-reconciliado-2026-11-05.md`](rubik-roadmap-operativo-reconciliado-2026-11-05.md) ya clasifica FT3D-8 en E3, visión premium futura (no bloquea por defecto E2).
6. La base FT3D-5/FT3D-6 del producto está implementada en su alcance; **no** implementa por eso planificación de obra.

**Conclusión de descubrimiento:** la línea no se perdió: fue investigada y diferida intencionadamente; el valor comercial exige ahora una **decisión nueva y acotada** sobre alcance y tiempos de lanzamiento.

## 3. Referencia externa: QUÉ demuestra, QUÉ NO

**El código fuente del donante en `05-schedule-build/house.js`** establece explícitamente:
- `START = 2027-03-01`, `WEEKS = 14`;
- **diez** fases `PHASES` de 0 a 9 con `w0, w1` escritos para el ejemplo: site set-up, excavation, foundations, structure, floors, walls, roof, windows and doors, finishes y furniture;
- `add(obj, phase, order, how)` asocia piezas de la casa a una fase; `update(week)` deriva el estado del 3D; la misma tabla gobierna Gantt.
- El programa es de ejemplo; no hay vínculo demostrado a datos económicos Rubik, recursos, precedencias calculadas CPM ni obra ejecutada.
- `04-build-time-lapse` es otra demo con **38 semanas**, distinta del Schedule Build de 14 semanas.

**No copiar** el diseño de casa, los calendarios, las duraciones, el código ni una licencia presunta directamente al producto. Reusar conceptos y contratos bajo la evaluación de derechos correspondiente.

## 4. Producto RUBIK propuesto: tres niveles de fidelidad

| Nivel | Denominación de producto | Datos necesarios | Qué puede asegurar |
| --- | --- | --- | --- |
| **FT3D-8A** | **Evolución visual ilustrativa** | geometría Rubik + secuencia de fases genérica revisada | «simulación conceptual de una secuencia»; no planificación ni presupuesto de obra |
| **FT3D-8B** | **Plan de obra conectado a presupuesto** | proyecto + cantidades C1 + partidas/costes C2–C4 + programa validado de tareas/fechas/dependencias y asociaciones a elementos | escenario de calendario y presupuesto estimado, importes y tareas vinculados con procedencia |
| **FT3D-8C** | **Seguimiento de ejecución real** | programación base + partes de obra/hitos/mediciones certificadas y responsables | comparativa planificado/real con procedencia; **sin certificación automática** |

**Orden estratégico a analizar:** A para experiencia comercial demostrable; B para mayor valor a reformistas, constructoras, promotoras y arquitectos; C solo si existe sistema fiable de captura/validación de ejecución. No presentar A como B ni B como C.

## 5. Qué datos se pueden REUTILIZAR y cuál es la brecha real

| Subsistema | Autoridad ya existente | Lo que FT3D-8 necesita adicionalmente |
| --- | --- | --- |
| `FloorPlanProjectV1` / `FloorPlanBuildingV1` | muros, huecos, niveles, objetos, geometría | correspondencia de elementos a trabajos y estado de instalación por tarea (sin modificar geometría canónica) |
| Presentation Story / FT3D-1…6 | progreso normalizado, reproducción/pausa, scrub, cámaras, escenas y restauración | descriptor temporal constructivo y reglas de visibilidad por elemento/fase |
| C1 cantidades | superficies, longitudes, unidades, provenance | desglose de mediciones por paquete/tarea si se puede vincular |
| C2–C4 presupuesto | partidas, coste unitario/total, fuentes, informe | relación tarea ↔ partida ↔ cantidades; importes por fase; no segunda calculadora |
| B3 vídeo / Entregar | exportaciones y recorridos existentes en el alcance actual | captura/render de secuencia temporal orientativa, etiqueta y versión de plan |
| Mi estudio | marca y entrega profesional | plantillas de fases revisadas por oficio y sector, propiedad/validación de presupuestos |
| IA B2/B8 (opcional) | fotorealismo de una vista fija | coherencia temporal no garantizada; vídeo ilustrativo NO requiere generación IA para ser útil |

### Dominio propuesto: `ConstructionScheduleV1` (contrato a decidir, NO schema implementado)

- `scheduleId`, `projectRevision`, `baselineDate`, `calendar`, `revision`, `author/approvedBy`.
- `tasks[]`: `taskId`, `wbs`, `name`, `start/end`, `duration`, `dependencies`, `status`, `manualOrEstimated`, `provenance`.
- Vínculos opcionales revisados `taskId -> elementIds[]`, `taskId -> budgetLineIds[]`, `taskId -> quantityIds[]`, con asignación proporcional explícita solo si se justifica y sin doble cómputo.
- `progressPlanned` derivado de tiempo, `progressReported` documentado por profesional y `earnedValue` solo si existe método de medición admitido; **los tres no son sinónimos**.
- `milestones`, `reportingPeriod`, `notes`, `sourceRevisions`, estado `UNVERIFIED` para lagunas.
- Datos durables separados del JSON canónico cuando proceda; la representación se calcula como estado runtime, reversible.

**Regla económica:** el presupuesto total **no determina automáticamente** el tiempo de cada partida ni las dependencias o recursos. Nunca inferir «14 semanas» de los euros ni «70 % construido» del cursor. Necesitamos duración, calendario, secuencia de oficios, condicionantes y asignación responsable. CPM real solo si existen precedencias y algoritmo comprobado.

## 6. Experiencia propuesta, dónde y por qué

**Ruta principal:** `Entregar → Presentación → Evolución de la obra` (FT3D-8A/8B); **gestión profesional del programa:** `Presupuestar → Plan de obra` si se aprueba 8B. No crear una sexta navegación ni duplicar Story/Entregas o el presupuesto. Coordinar con PR #166 de Claude.

**Vista sincronizada:**
1. Panel 3D real a partir del proyecto, no modelo ficticio del donante.
2. Banda Gantt con paquetes/fases, fechas, duración, indicadores de certeza y presupuesto por fase cuando proceda.
3. Un único cursor temporal reversible `date/week` controla simultáneamente **visibilidad del modelo + resaltado de tarea + vista de semana + detalles de coste**.
4. Play/pausa, arrastre, anterior/siguiente, velocidad, resumen por hito, cámara; `reduced-motion`, teclado/móvil.
5. Original/revisión de calendario, fuente y etiqueta «simulación», «programación estimada» o «seguimiento validado» conforme al nivel.
6. Salidas: imagen por fase, presentación cliente, secuencia/vídeo determinista con marca y presupuesto revisado; opciones futuras para comparador planificado/real.
7. Todo lo visual es reversible: al cerrar, restaurar geometría, visibilidad, materiales, cámara y selección.

**No confundir**:
- `Gantt` ≠ CPM auténtico;
- `week=8` ≠ obra ejecutada al 60%;
- `budgetLine = 3000 €` ≠ certificación de 3000 €;
- elementos de demo `house.js` ≠ elementos del plano aportado por usuario;
- render IA/vídeo ≠ planificación.

## 7. Reglas de derivación y propuestas de fases sectoriales

**Plantilla conceptual opcional (NO duraciones por defecto):** preparación, demoliciones, movimiento de tierras, cimentaciones, estructura, forjados, cerramientos, cubierta, carpintería, instalaciones, revestimientos, acabados, equipamiento, pruebas y entrega. Orden/solapes dependen de cada proyecto; una reforma de baño no necesita «cimentación» por defecto.

**Fidelidad por tipo:**
- **Reformista:** demoler, cambiar instalaciones, revestir, instalar muebles y entregar; estados de muro existentes/nuevo/demolido no equivalen a plan ejecutado.
- **Cocinas y CAT-IA:** desmontaje, instalaciones, adaptación de módulos, montaje, encimera/electrodomésticos y entrega. Productos SKU de CAT-IA requieren fichas y medidas verificadas.
- **Promotora/construcción nueva:** WBS de proyecto, oficios, hitos, Gantt, modelos y estados; solo programar lo que está representado o descrito honestamente.
- **Interiorista:** fases de montaje y amueblamiento, con inventario/catalogación y restricciones de instalación.

## 8. Coste y monetización a medir (no inventar cifras)

**FT3D-8A** puede reproducirse con el render 3D/Story actual sin coste variable de OpenAI, aunque sí tiene coste de desarrollo/CPU/WebGL, vídeo y revisión.

**FT3D-8B** aporta valor por integración con presupuesto y planificación profesional, pero requiere tiempo humano de asignación de tareas/paquetes/fechas y QA. Coste completo por propuesta = horas de planificación + validación + render/exportaciones + almacenamiento/infraestructura + soporte. No proponer rentabilidad a partir de duración de animación.

**FT3D-8C** añade gestión de datos de obra, permisos, trazabilidad, auditoría, actualización periódica y responsabilidad del responsable técnico. Es otro nivel de negocio.

**No asignar precio comercial** a ninguno de los cortes sin pruebas de valor, fuentes, tiempo profesional y criterios de fiabilidad. No confundir presupuesto de obra con precio del servicio SaaS.

## 9. QA y gates — no programar hasta decidirlos

| Gate | Verificación requerida |
| --- | --- |
| G0 producto | decidir A/B/C y público inicial; no confundir demo con planificación de obra |
| G1 contrato | `taskId`, fases, dependencias, calendario, asignaciones y provenance; presupuesto vinculado sin duplicaciones |
| G2 tiempo | scrubbing reversible, ida/vuelta, semana exacta, fechas de calendario, control teclado/táctil/reduced motion |
| G3 geometría | estados del **mismo proyecto real**, sin geometría inventada ni mutación; restauración 100% al salir |
| G4 plan económico | importe total de partidas vinculado y no asignado, dobles asignaciones, coste fase y fuente; nunca certificación ficticia |
| G5 incertidumbre | tareas sin elemento visual, elementos sin tarea, duraciones no acreditadas y presupuesto sin partidas mostrados como tales |
| G6 UX/cliente | Gantt/3D sincronizados en móvil/desktop, tabla accesible, idiomas y estados |
| G7 salidas | vistas por hito, vídeo real de la secuencia, ficha con marca, fecha, revisión y etiquetas de simulación |
| G8 negocio | coste completo de preparación, tasa de aceptación, tiempo de revisión, precio viable de servicio |
| G9 governance | documentación legal, no copia de donante, cierre de Claude/Kimi y autorización expresa antes de merge |
| G10 end-to-end | fixture de reforma de cocina y obra nueva: C1→C2 presupuesto→plan revisado→timeline→entrega; comparar vista con origen en checkpoints y retroceso |

## 10. Prioridad y recomendación documental

**Por qué recuperarlo:** esta familia une los activos diferenciales que RUBIK ya tiene (geometría, mediciones, presupuesto, Story y Entregas) con una explicación temporal de **cómo se construye**; complementa los renders IA y los catálogos comerciales. Tiene valor para reformistas, constructoras, promotoras, estudios y clientes finales.

**Por qué no lanzarlo sin contrato:** una secuencia bonita pero desconectada del presupuesto y la realidad física puede inducir a error y provocar decisiones económicas o de plazo equivocadas.

**Decisión solicitada a la ventana madre:** registrar FT3D-8 como **pendiente documental importante**, no implementado, con dos cortes conceptuales 8A/8B y un seguimiento 8C futuro; revisar su prioridad frente a E2 y nuevas iniciativas solo cuando terminen Claude/Kimi. Ni el vídeo del donante ni 14 semanas reales del cliente se incorporan automáticamente.

**Prohibido actuar:** esta adenda **no** autoriza hacer código, cambiar presupuesto, integrar ramas, gastar API, publicar Home, fusionar PR ni desplegar.

## 11. Fuentes verificadas
- `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md` §3, §7/FT3D-8
- `docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md` (CUT 4)
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md` D16–D18 y §7.1
- `docs/product/evidence/donor-cuts-2026-11-01/manifest.md`
- `docs/product/rubik-roadmap-operativo-reconciliado-2026-11-05.md` E3
- `Sam1983Aing/flat-to-3d`: `05-schedule-build/README.md`, `PROMPT.md`, `house.js`, `view.js`; `04-build-time-lapse/README.md`

**Cierre:** **FT3D-8 era un plan documentado y deliberadamente diferido. No hay evidencia de planificación de obra profesional 3D+presupuesto ya integrada en RUBIK. La nueva propuesta no cambia ese estado.**
