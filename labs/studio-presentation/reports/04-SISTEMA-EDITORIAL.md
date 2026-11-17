# 04 · Sistema editorial común v0.2 (laboratorio)

Archivos: `system/rubik-editorial.css`, `tools/compose.cjs`, `tools/snapshot.cjs`. Salida: `out/v2/*.pdf` + `qa.json`; contactos en `evidence/v2/`.

## GSP EXTEND sobre los tokens de RUBIK
- **KEEP:** `--d-ink #2d332f`, `--d-muted #626457`, `--d-rule #cbc2b3`, `--d-paper #fffdf8`; acentos por estilo: técnico petróleo `#205b60`, cliente arcilla `#875936`, inmobiliario tinta.
- **DELTA:** geometría en mm (A4 apaisado 297×210, márgenes 14/16/16, 12 columnas, medianil 5 mm; A3 lámina), escala en pt (pie 7,5; pie de foto y tabla 9; cuerpo 9,5; lectura 10,5; entradilla 13; h2 20; h1 30; cifra 30), fuentes embebidas.
- Componentes del dosier actual: `dossier-cover` RESTYLE · `dossier-facts` RESTYLE como cifras · `dossier-sheet-frame` (PNG) **REPLACE** por plano vectorial + cajetín IFC · `dossier-table/econ-table` KEEP+RESTYLE (tnum, unidades) · `econ-warnings` con banda lateral **REPLACE** (estado en palabras) · `dossier-page>h2` en mayúsculas espaciadas RESTYLE · `@page` A4 vertical REFACTOR.

## Tipografía (medida con Brand Identity `fonts audit`)
- Técnica: **Inter 4.001** de IFC Sheet (Regular/Bold; OFL; tnum; `cv08` contra I/l). Lectura y titulares: **Source Serif 4** (OFL, @fontsource 5.1.1). Newsreader descartada (reflejo según Impeccable y Brand Identity).
- ES/EN: base completa. **ZH: FALTA** (0/1968 en ambas) → candidata Noto Sans SC / Noto Serif SC (OFL) por carácter, sin instalar aún.
- Contraste medido: todo texto ≥ 5,88:1.

## Reglas aplicadas
Sin cadenas «·», sin eyebrows, una cifra focal en acento por documento, pies de procedencia en toda imagen («Vista del modelo 3D… No es una fotografía»), desconocidos explícitos («No facilitado», «Sin referencia de producto»), precios de prueba etiquetados, etiquetas de planta con fondo opaco y ≤2 llamadas, leyenda inferior, axonometría desde la geometría real.

## QA v2 (out/v2/qa.json)
6 documentos (24 páginas): 0 desbordes, 0 solapes de bloques, 0 solapes de etiquetas, 0 estancias sin rótulo, 0 peticiones externas, 0 errores, lint Huashu 0 rojos. Prueba a una tinta superada.

## Puertas abiertas (decisión del propietario)
- `direction-approved`: **PENDIENTE**. Direcciones A (vista 3D), B (dibujo, recomendada), C (cifra) en out/v2/directions.pdf. Los prototipos usan B en portada de interiorismo y propuesta; inmobiliario usa A (su ADN).
- `brand-spec`: el estudio es sintético («Estudio Ejemplo», .invalid); sin logo ni colores (H07). No se rediseña marca alguna.
