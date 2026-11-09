# Matriz de revisión visual — Home con 6 perfiles (HOM-01 + HOM-02)

**Para qué sirve:** que el propietario revise en la Preview, perfil a perfil, lo que la Home muestra. Las comprobaciones automáticas ya están cubiertas por pruebas. **Las columnas «Revisión humana» están vacías a propósito**: solo el propietario puede marcarlas.

**Cómo revisarlo:**
1. Abrir la Preview de la PR (#184 para los 5 perfiles, #185 para los 6).
2. En «¿En qué trabajas?», elegir el perfil.
3. Revisar la cabecera, «Lo que puedes hacer hoy» y la banda de Render IA.
4. Pulsar cada acceso.
5. Repetir en un móvil real.

## 1. Lo que muestra cada perfil (sacado del código, no inventado)

| Perfil (id) | Cabecera | Acción principal | Capacidades, en orden, y el área que abren |
|---|---|---|---|
| Sin perfil | «¿Qué quieres hacer?» (**sin cambios**) | — | Subir y calibrar (Subir un plano) · Recorrido 3D (paseo del ejemplo) · Render IA (Entregar) · Mediciones y presupuesto (Presupuestar) |
| Arquitectura (`architecture`) | «Del plano a una propuesta que tu cliente entiende» | Subir un plano | Subir y calibrar · Lámina con tu marca (Entregar) · Orientación, sol y emplazamiento (Analizar) · Mediciones y presupuesto (Presupuestar) |
| Inmobiliaria (`real-estate`) | «Que el comprador recorra el inmueble antes de visitarlo» | Recorrer el ejemplo | Recorrido 3D · Presentación guiada (Entregar) · Render IA (Entregar) · Entrega al cliente (Entregar) |
| Promotora (`developer`) | «Cada tipología, también de dos plantas, con tu marca» | Probar el ejemplo | Viviendas de dos plantas (Diseñar) · Presentación guiada · Render IA · Tu marca (Mi estudio) |
| Reformas (`renovation`) | «Enseña la reforma antes de empezar la obra» | Subir un plano | Subir y calibrar · Comparar propuestas (Diseñar) · Mediciones y presupuesto · Render IA |
| Interiorismo (`interior`) | «Ambientes amueblados que tu cliente puede recorrer» | Probar el ejemplo | Amueblar y acabados (Diseñar) · Render IA · Recorrido 3D · Presentación guiada |
| **Constructora (`construction`, HOM-02)** | «La obra planificada, explicada en 3D» | Probar el ejemplo | Plan de obra y Gantt (Presupuestar) · Evolución de obra en 3D (Entregar) · Mediciones y presupuesto · Viviendas de dos plantas (Diseñar) |

Las capacidades con límites muestran su aviso en la propia tarjeta:
- Subir y calibrar;
- Render IA;
- Orientación, sol y emplazamiento;
- Mediciones y presupuesto;
- Entrega al cliente;
- Plan de obra y Gantt;
- Evolución de obra.

## 2. Ya comprobado automáticamente (no requiere revisión humana)

| Comprobación | Prueba |
|---|---|
| Cada perfil muestra las capacidades del registro, en su orden y con 3 o 4 tarjetas | `welcome-capabilities.browser` |
| Elegir o quitar un perfil no modifica el proyecto | `welcome-capabilities.browser` |
| Sin desplazamiento horizontal en 1440×900, 390×844 y 844×390 | `welcome-capabilities.browser` |
| Cada acceso abre un sitio que existe: el selector de archivos, el paseo del ejemplo o las áreas Presupuestar, Analizar, Entregar y Mi estudio | `welcome-capabilities.browser` |
| El Render IA no llama al proveedor desde la Home ni abre su diálogo por detrás | `welcome-capabilities.browser` (intercepta `/api/render`) |
| No aparecen promesas prohibidas («certificado», «garantiza», «en tiempo real», «exclusivo»; y para Constructora, seguimiento real, sensores o certificaciones) | `welcome-capabilities.browser` y `capability-registry` |
| Cada módulo y prueba citados en el registro existen en el repositorio | `capability-registry` |
| Los 5 ids originales no cambian; los perfiles y tarjetas de Soluciones pasan a 6 | `professional-entry.browser` |
| Foco visible y uso con teclado | `welcome-capabilities.browser` |

## 3. Revisión humana (para que la marque el propietario)

| Perfil | Tono y textos de la cabecera | Orden de las capacidades | Banda Render IA | Móvil real | Observaciones |
|---|---|---|---|---|---|
| Sin perfil | ☐ | ☐ | ☐ | ☐ | |
| Arquitectura | ☐ | ☐ | ☐ | ☐ | |
| Inmobiliaria | ☐ | ☐ | ☐ | ☐ | |
| Promotora | ☐ | ☐ | ☐ | ☐ | |
| Reformas | ☐ | ☐ | ☐ | ☐ | |
| Interiorismo | ☐ | ☐ | ☐ | ☐ | |
| Constructora | ☐ | ☐ | ☐ | ☐ | ¿Nombre comercial «Constructora / jefe de obra»? |

## 4. Capturas de referencia

- **HOM-01** (`docs/product/hom-01/capturas/`):
  - antes: escritorio neutral, escritorio con Interiorismo y móvil con Interiorismo;
  - después: escritorio por perfil, móvil con capacidades por perfil y la banda de Render IA.
- **HOM-02** (`docs/product/hom-02/capturas/`): Constructora en escritorio (cabecera, selector y capacidades) y en móvil (cabecera y capacidades).

## 5. Decisiones abiertas
- La banda de Render IA usa una **captura real del 3D de Rubik**, rotulada como punto de partida. Si se quiere mostrar un resultado real de IA, el propietario tiene que aportar la imagen del salón validada el 09/11. **No se generará ninguna imagen nueva.**
- Si alguna profesión debe ver otras capacidades, hay que cambiar el orden en `ORDER` de `js/capability-registry.js`. La prueba del registro impide anunciar algo que no exista.
