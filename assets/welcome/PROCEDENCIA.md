# Procedencia de las imágenes de la Home (UX-312)

| Archivo | Origen | Uso |
|---|---|---|
| `caso-plano.webp`, `caso-3d.webp`, `caso-presupuesto.webp`, `caso-entrega.webp` | Capturas reales de RUBIK con la vivienda de ejemplo (lámina, vista 3D, Presupuestar y archivo para el cliente), hechas con Playwright sobre la rama UX-312 | Prueba del caso y «Qué recibe tu cliente» |
| `entregas/D1, D3, D5, P1, P2, P5, S2.webp` | Salidas reales de RUBIK con la vivienda de ejemplo (ficha de superficies, dossier, E3, presentación, vista 3D, material board, observaciones) | Miniaturas de «Qué recibe tu cliente» |
| `perfiles/arquitectura, inmobiliaria, promotora, reformas, decoracion.webp` | **Imágenes generadas con IA** (Canva, generación de imagen del conector autorizado por el propietario el 23/11/2026). No son personas reales. Recorte de la vista previa de 199 × 150 px | Retratos decorativos de las profesiones, rotulados en la Home como imágenes generadas |
| `perfiles/constructora.webp` | Recorte de `demo-evolucion-4d.webp` (captura real de Evolución de obra) | Constructora: la generación se detuvo por cuota agotada; no se compraron créditos |

**Pendiente del propietario:** el encargo pide fotos editoriales autorizadas de personas reales, con originales en 2K y licencia registrada. Las imágenes generadas NO cumplen ese criterio (ni resolución 2K ni personas reales). Hay que sustituirlas por fotos con licencia cuando se aporten. Basta con reemplazar los seis archivos de `perfiles/`, con el mismo nombre y formato cuadrado.
