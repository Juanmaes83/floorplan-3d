# RUBIK SOTA — Referencias visuales de entrega profesional
Fecha de revisión: 17/11/2026. Material aportado por el usuario, en el orden original.

## Encargo entendido
Convertir la entrega de proyectos en una propuesta profesional de diseño, venta y comunicación: planos, comparativas, visualizaciones, materiales, mediciones, presupuesto y, cuando proceda, planificación. Sistema modular de plantillas, no un documento único ni un editor gráfico genérico.

Estas imágenes se conservan como referencias internas de diseño. No hay licencia de reutilización comercial acreditada. No publicar las imágenes ni copiarlas como plantillas de producto; producir diseños propios, utilizar recursos propios o autorizados. Los identificadores VIS-01 a VIS-14 son exclusivamente referencias de este archivo, no IDs del catálogo de RUBIK ni piedras SCULPT.

## Inventario y auditoría
| Referencia | Archivo | Contenido observado | Aplicación propuesta |
|---|---|---|---|
| VIS-01 | [VIS-01-plano-actual-propuesta-fotografias.jpg](referencias/VIS-01-plano-actual-propuesta-fotografias.jpg) | Planta actual y propuesta; fotografías de estado existente. | Lámina técnica comparativa con fotos autorizadas. |
| VIS-02 | [VIS-02-dossier-editorial-arquitectura.jpg](referencias/VIS-02-dossier-editorial-arquitectura.jpg) | Doble página editorial; texto y fotografía de detalle. | Jerarquía tipográfica y narrativa de proyecto. |
| VIS-03 | [VIS-03-presupuesto-comercial.jpg](referencias/VIS-03-presupuesto-comercial.jpg) | Tabla resumida por categorías y contacto. | Resumen económico legible, sin sustituir las partidas canónicas. |
| VIS-04 | [VIS-04-propuesta-terra.jpg](referencias/VIS-04-propuesta-terra.jpg) | Propuesta editorial cálida: equipo, inspiración, condiciones y siguientes pasos. | Plantilla premium y secciones opcionales de estudio. |
| VIS-05 | [VIS-05-alcance-honorarios.jpg](referencias/VIS-05-alcance-honorarios.jpg) | Portada fotográfica, alcance de servicios, honorarios y descripción. | Separar honorarios del coste de ejecución. |
| VIS-06 | [VIS-06-plano-antes-despues.jpg](referencias/VIS-06-plano-antes-despues.jpg) | Dos plantas comparadas, composición limpia. | Misma escala y encuadre cuando corresponda; indicar las excepciones. |
| VIS-07 | [VIS-07-dossier-integral.jpg](referencias/VIS-07-dossier-integral.jpg) | Sistema editorial con presupuesto, plazos, materiales y objetivos. | Referencia principal del dossier integral modular. |
| VIS-08 | [VIS-08-comparacion-planos-3d.jpg](referencias/VIS-08-comparacion-planos-3d.jpg) | Estado inicial y propuesta en planta y axonometría. | Vistas 2D y 3D coherentes, con encuadre comparable. |
| VIS-09 | [VIS-09-propuesta-mobiliario.jpg](referencias/VIS-09-propuesta-mobiliario.jpg) | Alcance, precios, plazo y visualizaciones de cocina. | Variante comercial orientada a mobiliario y catálogos. |
| VIS-10 | [VIS-10-vision-materiales-presupuesto.jpg](referencias/VIS-10-vision-materiales-presupuesto.jpg) | Cuatro páginas: concepto, plano, materiales y propuesta. | Plantilla de diseño con paleta y cifras trazables. |
| VIS-11 | [VIS-11-dossier-arquitectura-tecnico.jpg](referencias/VIS-11-dossier-arquitectura-tecnico.jpg) | Visualizaciones, planos con cotas e indicadores económicos. | Documentación técnica y métricas verificadas. |
| VIS-12 | [VIS-12-propuesta-inmobiliaria-reforma.jpg](referencias/VIS-12-propuesta-inmobiliaria-reforma.jpg) | Vivienda existente, reforma, vistas y simulación económica. | Separar precio del inmueble, reforma y otros costes; no inventar financiación. |
| VIS-13 | [VIS-13-dossier-interiorismo-minimal.jpg](referencias/VIS-13-dossier-interiorismo-minimal.jpg) | Portada, alcance, estimación y siguientes pasos. | Sistema visual limpio, adaptable al estudio. |
| VIS-14 | [VIS-14-axonometria-antes-despues.jpg](referencias/VIS-14-axonometria-antes-despues.jpg) | Dos modelos 3D comparables con llamadas explicativas. | Anotaciones ancladas a cambios reales y revisión del profesional. |

## Prioridades de diseño
- VIS-07, 08, 09, 10, 11 y 14 como referencias principales; VIS-01 y 06 para claridad técnica.
- Tres familias iniciales de diseño: técnica (planos y comparación), editorial (interiorismo), comercial (presupuesto y propuesta).
- Diferentes perfiles profesionales pueden utilizar el mismo documento de datos y seleccionar secciones y orden. Logo, colores, nombre del estudio, proyecto, revisión y fecha; estilo propio y revisable.
- Un dossier no es un presupuesto contractual ni una certificación técnica por defecto. Diferenciar fotografía real, modelo 3D, imagen IA ilustrativa y referencias estéticas.

## Relación con RUBIK — verificación en master@40b4ae5
- UX-07 y ENT-04: comparación de revisiones y dossier interno HTML autocontenido. Núcleos existentes: `js/revision-compare-core.js`, `js/revision-budget-core.js`, `js/before-after-dossier-core.js` (1.1.0), `js/variants-compare-adapter.js`. Laboratorio excluido de publicación; falta activación en interfaz. No hay que rehacer el motor.
- ENT-03: Story y plantillas profesionales para cliente. Es la ubicación natural de la ampliación editorial; no se declara implementada por activar ENT-04.
- ENT-01 / ENT-02 / GOV-08: futura entrega mediante enlace con seguridad, revocación y caducidad según gates. No confundir descargar localmente con publicar.
- ENT-05: fichas de imagen, versiones y leyenda IA; ENT-06: lotes posteriores con coste controlado. No iniciar como parte de ENT-04.
- Referencias: [Acta ENT-04](https://github.com/Juanmaes83/floorplan-3d/blob/40b4ae5d724ef83d0e70651545b4f5e4832becd3/docs/qa/ux07-ent04-integracion-master-20261113.md), [núcleo dossier](https://github.com/Juanmaes83/floorplan-3d/blob/40b4ae5d724ef83d0e70651545b4f5e4832becd3/js/before-after-dossier-core.js), [catálogo](https://github.com/Juanmaes83/floorplan-3d/blob/40b4ae5d724ef83d0e70651545b4f5e4832becd3/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md).

## Propuesta por cortes (no autorización)
1. ENT-04: activar el comparador existente y el borrador local; seleccionar dos revisiones, vistas equivalentes, datos económicos verificados y descargar. Diseñar una primera plantilla sobria. Conservar compatibilidad 1.0.0/1.1.0 y no modificar el proyecto ni sus presupuestos.
2. ENT-03: personalización de estudio y plantillas modulares; portada, objetivos, planos, axonometrías, materiales, capítulos de presupuesto y siguientes pasos. Probar impresión/PDF y adaptación móvil. No dar por acreditada la exportación PDF hasta comprobarla.
3. Conectar cronograma existente solo si pertenece al mismo proyecto/revisión, incluirlo de forma opcional. Imágenes y referencias con autorización; distinguir imágenes 3D/IA de fotos reales.
4. Tras los gates de seguridad: entrega mediante enlace y posible versión interactiva de dossier/visita. Portal multiusuario y white-label completo quedan para ENT-07 / GOV-06b.

## Criterios imprescindibles
- El presupuesto usa el informe del motor canónico; nunca inventar precios, importes, IVA, plazos o superficies.
- Presupuesto parcial: solo cifras conocidas y diferencias comparables, con advertencia. Incoherente: no mostrar importes comparativos ni delta total.
- Proyectos y variantes no se mezclan. En edificios, declarar si solo se compara una planta.
- No generar imágenes IA de pago, activar proveedores ni publicar para probar las plantillas.
- Impresión legible, tablas sin cortes de filas, imágenes no deformadas, formatos A4 horizontal/vertical según plantilla y revisión de escritorio/móvil.
- Validar con ejemplo sintético; diferenciar vistas 3D comparables y fotografías existentes; si falta una imagen o precio, no inventarlo.
- No introducir un segundo motor económico o geométrico ni un editor de maquetación de propósito general en el primer corte.
- Estado de autorización: referencia visual y propuesta de alcance, no autorización para implementar, fusionar, desplegar ni gastar.
