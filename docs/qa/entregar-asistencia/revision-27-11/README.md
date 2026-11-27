# Entregar · revisión humana del 27/11 · D3, P2/FOT-01 y cuadrícula P8 → P9 → P10

> **APROBADO por el propietario (27/11, noche)** en `7b2e01ab`: D3, P2/FOT-01, cuadrícula P8 → P9 → P10 y la muestra de
> estilos de Home, revisados en https://floorplan-3d-eyj9ph0s3-juanma-espinosas-projects.vercel.app/. La propuesta comercial
> sigue en borrador. Integración autorizada sobre `master` vigente junto con §9. Añadido posterior, a petición del
> propietario: D3 «Preparar imágenes» que falla o mientras la persona sale (`2f4a25d9`, D3 5/5).

Rama `claude/entregar-asistencia`. D3 y P2 se verifican en **una misma Preview**, la del último SHA de la rama (ver el handoff).

## Cuadrícula de Entregar · P8 → P9 → P10 y sin tarjetas aisladas
- **Orden:** P8 y P9 entran en el índice antes de P10, así que el orden visual, el del DOM y el del teclado coinciden.
- **P10 con la plantilla común:**
  - miniatura StoryLayers, el antes y después real de la vivienda de ejemplo y sin texto en la imagen;
  - título, estado y una acción;
  - los tres pasos pasan al detalle de la ficha;
  - altura: de 611 a 346 px.
- **Ninguna tarjeta aislada:**
  - si la última fila de un grupo queda incompleta, sus tarjetas se reparten el ancho y la que ocupa más de una columna
    pasa a imagen y texto en horizontal;
  - todas las tarjetas de una fila tienen la misma altura;
  - se mide la cuadrícula real (columnas `auto-fill`) en 1440×900, 1024×768 y 390×844.
- **Evidencia:** `cuadricula/antes-P8-P9-P10-*.png`, `cuadricula/despues-P8-P9-P10-*.png` y `cuadricula/despues-fin-grupo-*.png`.

## D3 · Preparar, revisar y entregar
**Entrada:** Entregar → D3 «Dossier del proyecto» → estilo **Cliente**.

| Paso | Qué contiene | Acción principal |
|---|---|---|
| 1 · Cliente y contacto | Cargar ficha (JSON) o usar la de la historia; cada dato con «Usar para redactar» y «Mostrar en el dossier» por separado; contacto de Mi estudio con «Abrir Mi estudio» si falta un dato | «Siguiente: nota de presentación» |
| 2 · Nota de presentación | Ayuda local con borrador visible y «Aceptar en la nota» o «Descartar», editable antes de aceptar; notas internas aparte («nunca salen en el dossier ni en el PDF») | «Siguiente: revisar el dossier» |
| 3 · Revisar el dossier | La portada y el documento | «Imprimir / Guardar PDF», en vino |

- **Vuelta:** «← Volver a Entregar», siempre visible.
- **Datos pendientes:** si faltan vistas, el aviso ofrece «Preparar imágenes». Al terminar se vuelve al dossier, en «Revisar»,
  con lo escrito y con las vistas.
- **Estancias:** la portada dice «Estancias en el cómputo: 11 · 2 no suman superficie». Son los dos miradores (1,41 y 1,17 m²),
  que la ficha de superficies ya marca «fuera del cómputo». Las otras vistas cuentan 13 espacios.
- **Salida Cliente frente a Técnica:** la salida Cliente no lleva instrucciones de trabajo para el profesional («Prepáralas en
  Entregar…», «Configura el norte…», «Sin ubicación o norte…»); la Técnica las conserva. Los demás estilos abren directamente
  en «Revisar».
- **Prueba (3/3):**
  - datos marcados frente a reservados y nota interna, comprobados en el documento y en la ventana de impresión;
  - los tres pasos y una acción principal por paso;
  - vuelta a Entregar;
  - «Preparar imágenes» y vuelta con lo escrito.
- **Vídeos:** `video/d3-dossier-cliente-{escritorio,movil}.mp4`, de Entregar → D3 a la impresión.
  - Dato **mostrado**: el nombre (Sra. Lucía Prueba).
  - Dato **reservado**: «presupuesto cerrado», solo para redactar y sin salir.
  - **Nota interna**: «Margen interno 22 %», que no sale.

## P2 Imágenes y FOT-01
- **Tarjeta:**
  - estado «5 vistas preparadas»;
  - acción real «Ver imágenes y opciones», un botón que abre la ficha con ratón, teclado (Enter o Espacio) y táctil.
- **Ficha:**
  - secciones «Vistas del proyecto» y «Reformar desde fotografía», sin las líneas repetidas;
  - acción principal «Generar imágenes»; volver a preparar las vistas queda como secundaria;
  - cada caso a ancho completo para comparar las dos imágenes;
  - «Probar con tu foto» es secundaria (una sola principal por vista).
- **Casos:**
  - **Inmobiliaria** abre «Más luz y orden». Explica que hoy no retira muebles de una foto; el salón despejado es un ejemplo
    del 3D de RUBIK que ilustra el potencial del espacio.
  - **Interiorismo y reformas** abre «Cambiar el suelo · Roble claro».
  - Los ejemplos del 3D de RUBIK se rotulan aparte de la simulación con la foto de la persona («SIMULACIÓN rotulada, no
    generada por IA»).
- **Vídeos:** `video/fot01-casos-{escritorio,movil}.mp4`. Capturas en `p2/` (antes y después).

## Pruebas y regresión
- Locales, Chromium sin interfaz:
  - `dossier-cliente` 3/3, `fot01-casos` 2/2 y `economic-dossier` 2/2;
  - la cuadrícula se mide sin huecos en los tres anchos.
- Regresión de `photo-project` y `perla-*` (más las pruebas que pasan por las fichas de Entregar, 28 archivos): la primera
  ejecución detectó dos fallos propios, C4 y Point9, ya corregidos en `03afd382`. Se repite sobre el SHA final; el resultado
  va al handoff.
