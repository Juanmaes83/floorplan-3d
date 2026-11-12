# ENT-01-I1A — Integración de API mínima, sin publicación de visitas

**Corte:** 12/11/2026. **Base apilada:** GOV-08 /api/view aislamiento #195, a su vez sobre S2 #188 y S1 #187. **Estado:** solo Draft; no fusionado a master.

## Alcance

- POST /api/share admite el tipo `delivery` SOLO con el permiso nuevo `RUBIK_SHARE_TOKEN` de S1; primero valida con `FloorPlanClientDelivery.validate` sobre el cuerpo completo. El JSON de proyecto editable o un snapshot con campos adicionales responde 400, sin contactar Blob.
- Se guarda un objeto `rubik-share/<nombre>-<96 bits aleatorios>.delivery.json`, con MIME JSON y sin sufijo adicional del proveedor para conservar exactamente la doble extensión. No se admite colisión o sobrescritura por diseño.
- GET /api/delivery recibe exclusivamente una URL de este mismo Blob, dentro de `rubik-share/` y con extensión `.delivery.json`; descarga con límite de 4 MiB y valida otra vez. Entrega JSON de solo lectura, `no-store`, `nosniff`, `noindex`, sin guardar nada en el servidor.
- POST /api/unshare mantiene los límites S2 (código propio, origen, máximo 8 objetos, 8 KiB en cuerpo, canonicalización, eliminación selectiva) y añade exclusivamente la extensión `.delivery.json` a las anteriores.
- Pruebas sintéticas nuevas `tests/ent01-delivery-api.test.cjs` y workflow propio `.github/workflows/ent01-i1a-api.yml`, sin publicar ni borrar nada real.

## Seguridad y límites

- **Cualquiera con el enlace puede inspeccionar el snapshot completo que sí se entrega**; no contiene el proyecto editable, pero NO es secreto, privado, ni protegido por cuenta. El enlace actúa como capacidad.
- Las decisiones sobre caducidad S3, cuotas S4, identificadores opacos / Blob privado S5, cuentas GOV-06a y protección de datos continúan pendientes.
- La retirada borra objetos individuales, pero una copia descargada o guardada por una caché puede seguir disponible; no prometer revocación instantánea ni desaparición de copias.
- **No** se añade navegador de cliente, minimapa, botones ni interfaz de publicación de visitas. Los prototipos #166 no se fusionan en este corte.
- Para publicación real faltan la activación de S1/S2/#195 en orden, la configuración de `RUBIK_SHARE_TOKEN` directamente por el propietario en Vercel sin mostrarlo en el chat, y una revisión de seguridad de permisos y de datos.

## Gate de integración

1. Revisar el HEAD concreto y que el diff frente a #195 se limite a esta API, su suite, workflow y documento.
2. Ejecutar CI general y ENT-01-I1A específico; verificar los test de autorización, aislamiento de origen/host, rechazo antes del almacenamiento, lectura y retirada independiente.
3. Preparar la UI de visita 3D en Preview **aislada** y pruebas humanas antes de habilitar clientes reales.
4. No fusionar ni desplegar a Production desde este corte mientras dependa de GOV-08 Draft y no exista permiso de publicación operativo.

**Resultado buscado:** preparar un puente de API probado, que facilite completar ENT-01 como producto, sin convertir el éxito de las pruebas en una afirmación de que las visitas ya están activas.
