# Prompt de continuación — Studio Presentation (trabajo de diseño autónomo en local)

## Dos vías independientes
- **Vía A, gobierno (#243, #244, #245):** solo informar. El merge necesita autorización expresa del propietario. Esperar CI **no bloquea** la vía B. Rojo conocido y no regresivo: `wall-structure` 390×844 en `historical (editor)`.
- **Vía B, diseño (esta misión):** trabaja **ya, de forma continua y en local**. No te detengas por CI, PR ni la elección de portada. Si una decisión es del propietario, regístrala en `reports/DECISIONES-PENDIENTES.md` y sigue con lo demás.

## Permisos de la vía B
- **Permitido:** commits en `lab/studio-presentation-e0e1`. Push **solo** a esa rama, al cerrar cada bloque, para no perder trabajo entre ventanas.
- **Prohibido:** PR, merge, despliegues, Vercel, cambios en el producto (`js/`, `css/`, `api/`, `index.html`), workflows, secretos, IA de pago y generación de imágenes.

## Puesta en marcha
1. `git fetch origin lab/studio-presentation-e0e1 && git worktree add ../studio lab/studio-presentation-e0e1`, o haz checkout de la rama. Lee `HANDOFF.md` y `reports/01`, `03`, `04` y `05`.
2. Donantes, solo lectura:
   - Públicos: `git clone --depth 1 https://github.com/Juanmaes83/<repo> /home/user/juanmaes83/<repo>` para `brand-identity-skill`, `get-shit-pretty`, `huashu-design-3.0-agent-`, `brand-system-skill` y `diagram-design`.
   - Públicos de terceros, en `/home/user/donors`: `alpaca-labs/skills-for-architects`, `ifc-sheet`, `invoify` y `papora`. Comprueba sus SHA en `reports/01`.
   - Privados: `add_repo` (lectura) y clon en `/home/user/<repo>` para `impeccable`, `designer-skills`, `design-system`, `power-design`, `guizang-ppt-skill`, `100-layout-compositions`, `open-design`, `baoyu-design`, `anydesign`, `design-dna`, `mono-color-skill`, `skill.color-expert`, `400-free-design-resources`, `casebook-pro-v2-spatial-storytelling-system`, `product-editorial-showcase` y `portafolios-premium_rubik-sota`.
   - No llames a `register_repo_root`.
3. Fuentes: `cd tools && npm i --no-save @fontsource/inter@5.1.1 @fontsource/newsreader@5.1.1 @fontsource/source-serif-4@5.1.1`.
   - Inter procede de IFC Sheet: `IFC_FONTS=<ifc-sheet>/packages/ifcsheet/fonts`.
   - El lint de Huashu se lee de `HUASHU_LINT=<huashu>/scripts/design_lint.py`.
4. Render: `node tools/compose.cjs snapshot out/v3`. Opcionalmente, regenera el snapshot con `node tools/snapshot.cjs <raíz del repo> snapshot`, que usa Chromium y el producto real.

## Bucle de trabajo (por bloque)
Generar → hojas de contacto (`pdftoppm`) → **mirar cada página** → crítica escrita → corrección → QA → commit → push a la rama del laboratorio.

La crítica se hace con tres herramientas:
- `reference/critique.md` de Impeccable;
- `skills/critique` de Open Design (5 dimensiones);
- `design_lint` de Huashu, ya portado en `compose.cjs`.

**Criterio de aceptación de cada página:**
- `qa.json` sin desbordes, solapes de bloques, solapes de etiquetas ni rótulos perdidos;
- 0 peticiones externas;
- lint con 0 rojos;
- prueba a una tinta legible;
- todo dato rastreable al snapshot, con su procedencia escrita.

## Bloques (en orden; no pares entre bloques)
1. **B1 · Más diseños por entregable**, a partir de las referencias con nota A de `reports/03`, aplicando la puerta de 3 direcciones de Huashu por tipo de página:
   - Interiorismo: índice; **doble página por estancia** (recorte de planta, vista 3D, objetos y pavimento de esa estancia); cierre con los datos del estudio.
   - Materiales y mobiliario: portada con palabra gigante (gramática de `product-editorial-showcase`); **ficha por objeto** (gramática de `product-cut-sheet` y `ffe-spec-book`, con «sin referencia de producto» explícito); tablero de materiales por estancia.
   - Propuesta económica: gráfico de capítulos (skill `dataviz`); resumen en una página; versión cliente frente a profesional, ambas de `FloorPlanEconomicDossier.view`.
   - Inmobiliario: ficha A4 vertical de una página; cifras con su origen.
   - Lámina: A3 con cuadro y leyenda; variante de cajetín en franja derecha (IFC `right`). Alzados y secciones = **FALTA** (no hay motor): decláralo, no lo dibujes.
2. **B2 · Pruebas de robustez:**
   - proyecto vacío o sin presupuesto, sin vistas y sin perfil de marca;
   - nombres largos;
   - estudio con logotipo de prueba sintético rotulado (sin rediseñarlo).
3. **B3 · E1 motores:** CSS Print (actual), Paged.js y Typst.ts (WASM). Tablas de 1, 50, 200 y 500 filas y una fila extrema; encabezados repetidos y paginación. Resultado en el ADR `reports/06-ADR-MOTOR.md`.
4. **B4 · Chino:** fuente de reserva Noto Sans SC / Noto Serif SC (OFL, solo en el laboratorio). Repite `brand.py fonts audit --langs zh`.
5. **B5 · Cierre:** matriz EXISTE/AMPLIAR/FALTA; notas H03, H05 y H06; informes 00, 02 y 07–09; ZIP sanitizado; GO/NO-GO de E2; mensaje al propietario.

## Reglas permanentes
- **RUBIK no inventa nada.** Precios de prueba rotulados. Vistas «del modelo 3D, no fotografía». Desconocidos explícitos.
- Se conservan los tokens de RUBIK (EXTEND) y la marca del profesional. No se rediseña ninguna marca.
- Sin cadenas «·», sin eyebrows en mayúsculas, sin bandas laterales; un solo acento por documento.
- Informa en español, con capturas, al cerrar cada bloque.
