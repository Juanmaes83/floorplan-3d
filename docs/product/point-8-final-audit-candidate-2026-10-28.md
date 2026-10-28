# Punto 8 — auditoría final CANDIDATA

Estado: **candidato en revisión**, no cierre de Punto 8 ni de 8C-E. Base `51a3a07b16da8876ab32189b8db9db18eb182c12`. Esta auditoría describe la implementación y sus pruebas; no sustituye revisión, CI ni merge.

## Matriz de exportación real

«Metadata» significa snapshot/contrato, nunca blob, URL de sesión, raster o grid. «Visual» exige capa activada y runtime disponible. La columna edificio se refiere al perfil que ya soporta cada exportador, no a añadir geometría nueva de 8B al exportador offline.

| Salida existente | Edificio | Placement metadata | Parcela | Ortofoto | Terreno | Runtime requerido | Atribución / decisión | Soporte y motivo |
|---|---|---|---|---|---|---|---|---|
| JSON | Modelo canónico | Sí | Snapshot y geometría fuente | Snapshot | Snapshot | No | Conserva licencia y créditos sin declararlos verificados | Metadata soportada; no assets remotos ni runtime |
| ZIP Project/Building | Modelo y assets de proyecto existentes | Sí | Metadata | Metadata | Metadata | No para contexto | Conserva snapshots | Round-trip probado; excluye raster/grid territoriales |
| PNG / captura nativa | Escena visible | No como dato estructurado | Visual si exportable | Visual si runtime exportable | Visual si runtime y cota exportables | Sí para orto/terrain | Pie en imagen, créditos ordenados sin duplicados; restricted/unknown omitidos | Pipeline real `View3D.shot`, probado con dos fuentes verificadas y parcela restricted |
| Share image | Perfil delivery existente | No | Mismo filtro visual | Mismo filtro visual | Mismo filtro visual | Sí cuando participa | Hereda pie de `View3D.deliveryShot` antes de componer | Integración por pipeline existente; no formato nuevo |
| Delivery image | Modelo/escena encuadrada | No | Visual exportable | Visual exportable | Visual exportable | Sí cuando participa | Filtra antes de render; framing considera sólo contexto exportable; pie de créditos | Pipeline `renderDelivery` / composer existente |
| Presentation interactiva | Modelo y contexto exterior; habitaciones conservan sus stops | Sólo en proyecto, no export independiente | Visible, incluso restricted en uso interno | Visible si runtime | Visible si runtime y cota | Sí para assets | Crédito interno; las imágenes capturadas vuelven a pasar la política de salida | Configuración y transición exterior/habitación/restauración probadas en ambos móviles |
| GLB | Perfil local de edificio ya soportado | Sí en `source-project.json` del paquete, no transform aplicada al GLB | Omitida como geometría | Omitida | Omitido | No | No se autoexporta fuente territorial | GLB byte idéntico con/sin site en fixture; sin roles territoriales |
| Blender | Mismo paquete GLB local del interop existente | En archivo fuente del paquete | Omitida | Omitida | Omitido | No | No participa fuente territorial | Omisión deliberada; no se amplía el importador Blender ni se afirma prueba de ejecución de Blender |
| Vídeo TourRecorder | Recorrido existente | No | Omitida | Omitida | Omitido | No para contexto | Omitido conservadoramente porque no hay contrato de créditos territoriales de vídeo | Capas ocultadas durante grabación y restauradas en finally |

Si falta el runtime, el exportador omite la capa: no inicia red. Una fuente `verified` sólo participa automáticamente con atribución. `not-applicable` puede participar sin crédito obligatorio. `restricted` y `unknown` quedan fuera de las salidas automáticas. No existe lista de providers privilegiados.

## Comprobaciones por área

| Área | Evidencia / alcance |
|---|---|
| 8A exterior / 8B cubierta y volúmenes | Regresiones core existentes; no se rediseña su geometría ni su perfil de exportación |
| Parcela | CRS fuente intacto, frame local, snapshots; referencia cambiada invalida runtime/placement anterior |
| Ortofoto | Blob de sesión, UV de dominio fuente y sin estirar límites; persistencia sólo metadata |
| Terrain | Grid de sesión; cota ortométrica explícita; no alignment automático ni collider |
| Transform | Norte 0/90/37, inversa, offset de planta y elevación no cero; origen de renderer separado |
| Solar | Caso norte37 y placement no cero idéntico; solar-core sin modificar |
| Walk/Journey | No se añade contexto a colliders; fallo previo de overlay documentado, sin afirmar PASS global |
| Presentation | Contexto exterior y habitación, exit y restauración real de cámara/target/capas/sección/luz |
| Mobile | 390×844 y 844×390; CTA real y capa accesible; capturas sintéticas deliberadas |
| Offline / provider ausente | Reapertura mantiene snapshots, elimina assets runtime, informa ausencia y realiza 0 requests externos |
| Recursos | Tests de URL revocada y geometría/material/textura dispuestos; generación invalida callbacks antiguos |
| Contratos | Project1.12, Building1.5, autoridad root, versiones anteriores intactas y exportLevel físico |

Resultados finales y FAIL/SKIP: [validación local y contraste de baseline](../qa/point-8c-e-local-validation-2026-10-28.md). Los diez casos Walk coinciden exactamente en nombre, mensaje y ubicación con master limpio; la aserción de aspecto de Presentation también falla previamente en master. Tests específicos 8C-E: 3/3 browser y 11/11 unit PASS. Amplia Node: 567 PASS, 2 SKIP, 0 FAIL. No se eleva un fallo conocido a PASS por estar reproducido en master.

## Restricciones de cierre

No hay geolocalización automática, certificación cadastral/topográfica, geotecnia, descarga al abrir ni ampliación de providers. No hay cierre canónico, merge ni autorización implícita para omitir validaciones. Después de abrir PR sólo se permite confirmar sus datos y una observación inicial de checks; cero polling de CI/Vercel y cero reruns manuales.
