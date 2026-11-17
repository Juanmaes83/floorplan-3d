# Decisiones pendientes del propietario (vía B, diseño)

Registro vivo. La sesión no se detiene por estas decisiones: usa la opción recomendada, la marca como pendiente y sigue.

| # | Decisión | Opciones | Recomendación y motivo | Dónde verla | Estado |
|---|---|---|---|---|---|
| D1 | Dirección de portada (E0) | A vista 3D · B dibujo · C cifra | **B**: la axonometría sale de la geometría real del proyecto; no depende de que haya buenas vistas. | `out/v2/directions.pdf` | **Aprobada** (propietario, 17/11/2026: opción recomendada) |
| D2 | Pliego de estancia (B1) | A la vista manda · B el dibujo manda · C lámina R46 | **B**: planta a escala con objetos numerados a la izquierda y vista a sangre a la derecha; la C sirve como página única de estancia. | `out/v3/directions-b1.pdf` págs. 1–3 | **Aprobada** (propietario, 17/11/2026: opción recomendada) |
| D3 | Ficha de objeto (B1) | A una por página · B cuatro por página · C fila con situación | **B** mientras haya pocos datos por objeto; **C** si se prefiere densidad (5 págs. en lugar de 10). | `out/v3/directions-b1.pdf` págs. 4–6 | **Aprobada** (propietario, 17/11/2026: opción recomendada) |
| D4 | Portada de materiales (B1) | A palabra gigante · B campo de muestras · C axonometría | **A**: es la gramática pedida (product-editorial-showcase) y usa los datos (altura ∝ superficie). | `out/v3/directions-b1.pdf` págs. 7–9 | **Aprobada** (propietario, 17/11/2026: opción recomendada) |
| D5 | Ficha inmobiliaria A4 (B1) | A la vista arriba · B el dibujo arriba · C la cifra | **A**: el ADN inmobiliario (reports/05) pide imagen y cifras con origen. | `out/v3/directions-b1-portrait.pdf` | **Aprobada** (propietario, 17/11/2026: opción recomendada) |
| D6 | Documentos en chino (B4) | A) añadir Noto Sans/Serif SC · B) declarar «documentos solo en español e inglés» | **B por ahora** (propietario, 17/11: el mercado chino no es prioritario). Motivo técnico del bloque: el producto tiene interfaz zh y las tipografías editoriales no tienen glifos chinos (0/1968); un PDF en zh saldría con cuadros vacíos. | — | **B4 aplazado** |

| D7 | Render IA con coste (ampliación) | 3 imágenes reales en Production (Salón, Dormitorio principal, Vista general) | Autorizado por el propietario el 17/11/2026, solo esas 3 peticiones. | `evidence/render-ia/` | **Hecho**: 3 peticiones, 3 respuestas 200, 3 PNG 1536×1024 con SHA-256. Consumo visible solo de la imagen 1 (1.738 tokens); modelo y coste por imagen no conservados (no se repiten peticiones). El código de acceso ya no se necesita: el propietario debe borrarlo de los secretos de red del entorno. |
