# 11 · Propuesta de integración progresiva en E2

Este documento es una propuesta. **No autoriza nada.** Cada corte necesita el GO del propietario, su PR y su CI, y ninguno publica ni gasta sin decisión expresa.

Base: los prototipos del laboratorio (informe 10), que usan el mismo snapshot que el producto y no tocan `js/`, `css/`, `api/` ni `index.html`.

## Principios

1. **Un solo contenido, muchos tipos de entrega.** Los 7 tipos son selecciones de capítulos y documentos sobre el mismo modelo de entrega. No se crea un documento distinto por tipo.
2. **Cada pieza declara su grado de verdad.** Los grados son:
   - medida del proyecto;
   - vista del modelo;
   - imagen orientativa (IA);
   - ejemplo ilustrativo (plan de obra de la demo).

   Los grados no se mezclan en una misma cifra ni en una misma imagen.
3. **La entrega no contiene el proyecto editable.** El registro de la entrega (SHA-256 por pieza) se guarda junto al proyecto, como ya hace FT3D-8 con sus entregas.
4. **Primero offline y local; el enlace remoto después**, cuando GOV-08 (S3 caducidad, S4 cuotas, S5 enlaces opacos) y DEC-05 estén decididos.

## Cortes propuestos

| Corte | Qué entra en el producto | Desde el laboratorio | Relación con el backlog | Riesgo | Gate |
|---|---|---|---|---|---|
| **E2-1 · Modelo de entrega** | Núcleo puro `FloorPlanDelivery`: capítulos, tipos, piezas, grado de verdad, comprobaciones y registro con SHA-256. Pruebas unitarias. Sin interfaz. | `tools/entrega.cjs` (TIPOS, CH, checks, `entrega.json`) | ENT-01 (#189, contrato puro): extender el contrato o alinearse con él, sin duplicarlo | Bajo | Revisión de contrato con #189 |
| **E2-2 · Paginación medida** | La paginación de `tools/flow.js` en el compositor de dossiers del producto, con el invariante de filas en CI | ADR 06, `tools/flow.js`, variante `long-budget` | Dossier económico (`FloorPlanEconomicDossier`) | Bajo | Pruebas con presupuestos de 1, 50, 200 y 500 líneas |
| **E2-3 · Preparar entrega** | «Entregar» → «Preparar entrega»: tipo, capítulos, documentos, vista del cliente en vivo y comprobaciones. Descarga de la carpeta (ZIP) sin publicar. | `out/v3/profesional/preparar-entrega.html` | ENT-03 (Story y personalización), ENT-04 (comparar) | Medio (interfaz) | Pruebas de navegador (escritorio, tableta, móvil) y aceptación del propietario |
| **E2-4 · Carpeta del cliente** | Exportar la web de cliente offline desde el producto, con los PDF ya existentes y los vídeos ya exportables (recorrido, obra) | `out/v3/entrega/` | ENT-02, ENT-05 (fichas de imagen) | Medio: peso de la carpeta y formatos | Límite de tamaño con aviso (las comprobaciones ya lo calculan) |
| **E2-5 · Render IA trazable** | Guardar la **vista de origen** junto a cada render, con su SHA y el estilo, modelo y coste que devuelva la API. Empareja render y vista en todas las salidas. | `evidence/render-ia/trazabilidad.json`: sin la vista guardada solo se pudo cotejar contra miniaturas | IMG-xx (Render IA) | Bajo técnico; depende del contrato de `api/render` | Sin coste nuevo: solo guarda lo que ya se recibe |
| **E2-6 · Obra en la entrega** | El vídeo y la presentación de FT3D-8 como capítulo «Cómo avanzará la obra», con el rótulo de la autoridad del plan. Aviso si el plan viene de otra revisión. | Camino biblioteca → plan → evolución → entrega (`tools/delivery-assets.cjs`) | OBR-01/02/03, FT3D-8 | Medio | DEC-05 para cualquier publicación remota |
| **E2-7 · Dibujo vivo exportable** | Que «Grabar vídeo» respete Dibujo vivo, o una exportación de su apertura como imagen y vídeo | Hallazgo del informe 10 §3 | Hybrid V2 Dibujo vivo | Medio (rendimiento del grabador) | Medición en dispositivos reales (GOV-07) |
| **E2-8 · Enlace remoto** | Publicar la carpeta como enlace, con caducidad, cuota y revocación | — | GOV-08 S3/S4/S5, #244, DEC-05 | Alto (privacidad y coste) | Decisiones del propietario. «No indexado» no es privado. |

## Orden recomendado

1. E2-1 y E2-2: puros y sin interfaz.
2. E2-5: barato, y cierra una deuda de trazabilidad.
3. E2-3 y E2-4: la experiencia completa sin publicar nada.
4. E2-6 y E2-7.
5. E2-8: solo tras las decisiones de GOV-08 y DEC-05.

## Qué no se propone

- Generar imágenes IA nuevas en el flujo de entrega sin acción expresa del profesional.
- Mezclar el presupuesto con el plan de obra de ejemplo.
- Incluir la descarga «Vistas + proyecto ZIP» (contiene el proyecto editable) en una entrega de cliente.
- Documentos en chino (D6: mercado no prioritario; las tipografías editoriales no tienen glifos CJK).
