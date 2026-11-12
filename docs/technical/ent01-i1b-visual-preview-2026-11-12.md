# ENT-01 I1B — primera Preview visual de visita 3D real (no publicación)

Corte de continuidad del 12/11/2026. Base: master después de S2 #188, aislamiento #195 y API ENT-01 I1A #200.

## Límite explícito
- SOLO revisión local mediante «Entregar» → «Revisar como cliente»; no hay enlace de visita público, Blob, cuenta ni cambios de permisos.
- Se utiliza el View3D auténtico de RUBIK, su modo Recorrer y su Presentación, no vídeos ni una simulación 2D.
- La instantánea se crea con el validador estricto integrado FloorPlanClientDelivery y se envía al segundo tab mediante postMessage con comprobación de origen y ventana. El cliente recibe almacenamiento en memoria antes de cargar módulos.
- Únicamente proyectos de **una planta** con paredes/estancias; el ejemplo sintético es la única validación autorizada. Multi-planta y publicación siguen fuera.
- No se modifica #166 (referencia histórica). No se toca api/share, api/unshare ni api/delivery, ni se cargan archivos privados ni secrets.
- Si se introduce manualmente ?entrega=vista-previa sin ventana profesional válida, se muestra error y ningún proyecto.

## Gates
1. Workflow ENT-01 I1B: pruebas de minimapa, título, almacenamiento sin publicar, cliente real desktop/móvil, WebGL real, navegación, salida y origen de mensaje.
2. CI genérica del HEAD exacto y Preview Vercel READY correspondiente al SHA.
3. Revisión humana en hardware de escritorio y móvil: abrir Preview → proyecto de ejemplo → Entregar → Revisar como cliente → Explorar → saltar con minimapa → salir → presentación si se preparó.
4. Registrar GO/NO GO visual. NO activar publicación ni fusionar una UI observable sin aprobación.
5. Después del GO, auditar multi-planta, publicaciones de tres archivos con limpieza parcial según S2, expiración/cuotas/retirada y regreso desde el dossier antes de cualquier autorización de datos reales.

## Riesgos / no equivalencias
La UI de previsualización no acredita acceso por enlace real, revocación ni aislamiento de un link compartido. Una Preview READY significa que Vercel compiló, no que el navegador pasó. No declarar ni activar producción hasta cumplir las pruebas y GO humano.
