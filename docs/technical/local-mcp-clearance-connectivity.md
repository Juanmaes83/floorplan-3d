# MCP local — obstáculos y conectividad documentada (tercer corte parcial de Etapa 1)

Rama apilada sobre PR #41 (`8351bda6`), que a su vez depende de #40. El JSON seleccionado se vuelve a validar y leer con las protecciones y el hash existentes; no se modifica el contrato ni el editor.

## Consulta

```json
inspect_pair_clearance({"idA":"obj_rect","idB":"obj_next","clearanceMm":600})
```

Admite **dos muebles** y un umbral positivo aportado explícitamente. `geometricGap` reproduce la distancia mínima entre sus huellas giradas en planta y sus puntos próximos, en milímetros. `comparison` sólo compara esa distancia con el umbral del usuario; no decide si el espacio es transitable. Contacto y solape dan cero y se identifican como posibles empotramientos o solapes, sin declararlos defecto.

`minimumSegment` examina **sólo el segmento recto entre los dos puntos más próximos**. Reconstruye cada muro activo como bandas sólidas separadas por sus subtramos de hueco, y comprueba qué bandas, huecos y huellas de otros muebles intersectan ese segmento. Un muro `demolished` no actúa como obstáculo. Una ventana sigue siendo obstáculo en planta; una puerta se muestra como hueco, pero su anchura, hoja y obstrucciones no prueban paso. Se comunica longitud de intersección por ID y tipo, con recuento y truncamiento explícitos después de 100 evidencias.

La relación de estancia de #40 debe ser única para ambos muebles antes de afirmar que el segmento queda en una misma estancia. Si el segmento sale de un polígono cóncavo, se comunica `leaves_derived_room`. `connectivity` construye por separado un grafo de **puertas documentadas** (`door`/`sliding-door`, cota de antepecho cero, muro activo) atribuidas exactamente a dos estancias. Puede informar `same_derived_room`, `documented_door_chain`, `no_documented_door_chain` o `uncertain_room_assignment`; incluye los IDs de estancias y puertas de la cadena. La ausencia de cadena documentada no prueba que no exista acceso real.

En el fixture, los muebles `obj_rect` y `obj_next` están a 3450 mm. El segmento mínimo cruza el tramo sólido de `wal_shared` a y=750 mm, aunque otra parte del muro contiene `opn_shared-door` y el grafo registra esa conexión. Una pareja alineada con el hueco a y≈1350 mm muestra el subtramo de puerta, pero queda en `cross_room_route_not_evaluated`: no se busca otra ruta ni se calcula su anchura libre.

## Límites y aceptación

- Esta herramienta **no sustituye** `review_layout` ni altera sus hallazgos. Se limita a 100 muebles, 500 muros y 500 huecos para acotar el cálculo. No usa umbral por defecto.
- Sólo compara separación 2D entre huellas. No comprueba un corredor de anchura constante, giros, hoja de puerta, alturas, accesibilidad, normativa o transitabilidad; no descuenta muebles empotrados sin evidencia explícita. Una escala `estimated` se conserva como tal.
- Un hueco en el trayecto puede ser demasiado estrecho o estar ocupado. Si la distancia mínima pasa por un muro, otra ruta podría existir. Ninguno de esos casos autoriza una conclusión positiva o negativa de paso.
- Las coordenadas de los puntos próximos están redondeadas a 0,001 mm según `measure_elements`; las intersecciones usan tolerancia numérica de `1e-7` mm y reportan longitud con 0,001 mm. No son tolerancias arquitectónicas.
- JSON inválido bloquea la consulta y queda diagnosticable con `diagnose_project`. Respuesta sin rutas, imágenes ni documento completo; SHA-256 identifica el archivo y sus bytes se conservan.

Este corte aporta evidencia de obstáculos y conexiones, pero **Etapa 1 no queda completa**: falta una evaluación conservadora de corredores y anchuras con desvíos, extremos de muros, puertas y empotramientos, además de casos reales y escala confirmada. No se declara una holgura utilizable a partir de un segmento sin obstáculos. El recorrido con desvíos y anchura comprobable se aborda aparte en `check_route_2d` ([cuarto corte](local-mcp-route-2d.md)); esta herramienta conserva su semántica.
