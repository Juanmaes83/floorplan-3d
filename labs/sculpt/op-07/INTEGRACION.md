# OP-07 · Muros curvos e inclinados — expediente de integración (serie v3, 20/11/2026)

> Este documento **sustituye** a la versión de seis parches (S1–S6 sobre `02712b51`), que queda en el historial de git.
> Inventario único. Sin PR productiva, sin fusión y sin migración real. Codex integra; el propietario autoriza.

## 0. Fuente verificable

| Qué | Ref |
|---|---|
| Master de base | `bf131c30` (SMART: K4, K9, UX-03, AST-01 y K13 integrados) |
| Serie (commits) | rama `claude/op07-serie-v3` @ `3833838e`. La anterior, `claude/op07-serie-local@04b8e6f2` sobre `02712b51`, se conserva |
| Parches | `labs/sculpt/op-07/patches/0001…0010` + `MANIFEST.sha256` (orden numérico) |
| Laboratorio Blender | rama `claude/op07-blender-v3` @ `972ac0b9` (= `6d3e5260` + la serie). Delta en `blender/0001-…patch` |
| A0 (instrumentación para Codex) | `labs/sculpt/op-07/a0/ro-trace.init.js` + `README.md` |
| Reproducir | `node labs/sculpt/op-07/integration/apply-and-test.cjs origin/master [--browser] [--full]` |

## 1. Contrato 2.0 consolidado (D-OP07-4, opción B, ratificada para preparación)

1. **Alcance de la versión mayor.**
   - `curve.control` (Bézier cuadrática) y `heightEndMm` son opcionales y solo existen en documentos **2.x**.
   - Un documento sin esos campos sigue siendo 1.x **byte a byte**: plano, cantidades, presupuesto y DXF son idénticos a master.
2. **Autoridad única de versiones.**
   - `Core.parseVersion`, `versionAtLeast` y `raiseVersion` (`V2_BASE_MINOR = 12`; 2.0 ⊇ 1.12 y una futura 1.(12+k) equivale a 2.k).
   - Una prueba impide comparar o elevar versiones fuera de esa autoridad.
   - Hoy ha detectado y migrado `scan-alignment.js` (RoomPlan), que habría **rebajado** un 2.0, y las 3 elevaciones de K4.
3. **Lectores antiguos.**
   - Un lector 1.x rechaza 2.x sin modificar nada. Comprobado con master `bf131c30` mediante `integration/s7-legacy-reader.cjs`: `validate` rechaza, la biblioteca no carga, el editor no arranca y la colección queda byte a byte igual.
   - A0 (la barrera de época) protege a los escritores antiguos. Se complementan; la versión mayor **no** sustituye a A0.
4. **Geometría.**
   - Un solo núcleo, `js/wall-geometry-core.js`, igual al del laboratorio. La prueba de huella admite un único delta declarado: `guardSave` recibe la política de trayectoria.
   - `Core.WALL_PATH = {toleranceMm: 1}`, con techo de 1024 facetas.
5. **Estancias.**
   - `Core.roomRing` es el polígono guardado con la cara facetada de cada muro curvo, o de cada **cadena** de piezas de un muro curvo dividido.
   - De él salen suelo, perímetro, caras, plano, 3D y presupuesto.
6. **Guardado (S7).**
   - `Core.saveGate` compara la última revisión **confirmada** de F0.2b con la siguiente, usando la intención de cada paso.
   - Nunca rechaza un v1 por pérdida.

## 2. Cortes, estado y GO/NO-GO

Escala del protocolo §4.1: DESARROLLADO → VALIDADO → INTEGRADO → CONECTADO → DISPONIBLE → ACEPTADO. Ningún corte pasa de VALIDADO: no hay nada en master.

| # | Corte | SHA serie | Estado | GO/NO-GO para cirugía | Condición pendiente |
|---|---|---|---|---|---|
| 1 | S1 Contrato 2.0 | `f601cc9e` | VALIDADO | **GO condicionado** | Ratificación de producto de D-OP07-4 y de 1 mm/1024; Firefox/WebKit |
| 2 | S2 Geometría y plano | `da302a9c` | VALIDADO | **GO condicionado** | Ídem. Incluye la corrección de huecos en muro recto inclinado (hoy) |
| 3 | S3 Mediciones | `342655f9` | VALIDADO | **GO condicionado** | Aceptación de D-OP07-2 (caras por muro) por el propietario |
| 4 | S6 DXF | `03276fe9` | VALIDADO (lector independiente) | **NO-GO para «CAD validado»**, GO técnico | Aceptación en dos CAD comerciales (arquitecto) |
| 5 | S4 3D | `de677003` | VALIDADO | **GO condicionado** | Aceptación visual; Firefox/WebKit |
| 6 | S5 Edición | `5bc072d9` | VALIDADO | **GO condicionado** | Se integra con S7 |
| 7 | S3b Estancias | `77cff3ed` | VALIDADO | **GO condicionado** | Incluye la corrección de división (hoy) |
| 8 | S5b Edición visual | `6709f260` | VALIDADO (Chromium) | **GO condicionado** | Aceptación visual y de accesibilidad en dispositivos |
| 9 | S4b 3D estanco | `11522575` | VALIDADO | **GO condicionado** | Aceptación visual |
| 10 | S7 Guardado protegido | `3833838e` | VALIDADO (Chromium, F0.2b real) | **GO condicionado** | Cirugía de Codex en F0.2b. Validar la decisión de alcance (§4) |
| — | Blender (OP-10) | `972ac0b9` | VALIDADO (bpy 5.2.1) | **GO como delta de OP-10** | Integrar después de OP-10, nunca sobre `6d3e5260` |

**La regla de activación no cambia:** ningún documento 2.0 se crea en Production hasta que S1, S2, S3, S3b, S4, S4b, S5, S5b, S6 y S7 estén integrados **juntos** (todos los escritores protegidos) y A0 esté integrado. Integrar no es activar.

## 3. Declaración funcional (regla permanente §4.1, diez puntos)

| Punto | Declaración |
|---|---|
| 1 Capacidad | Muros curvos (Bézier), muros inclinados (altura final), dividirlos sin perder nada y medir, presupuestar, ver en 3D, exportar en DXF y enviar a Blender con su geometría real |
| 2 Área | Editor de planos (2D/3D), Cantidades/Presupuesto, Entregar (DXF y Blender) y persistencia F0.2b |
| 3 Recorrido | Seleccionar un muro → punto de curvatura en el plano (arrastrar) o panel **«Forma del muro»** (flecha, altura final, Enderezar, Nivelar, Dividir) → panel de la estancia: «Paredes de la estancia» (UX-03) con la cara curva → Presupuestar → Entregar → DXF / Escena para Blender |
| 4 Tipo | Visible: el manipulador y el panel. Automático: medición, 3D, DXF y la puerta de guardado (solo visible cuando rechaza) |
| 5 Reutiliza | `project-core` (camino único `applyExtension`, historial y validación), `quantity-core`, `surface-core`, `dxf-export`, el visor 3D (`wallBox`) y el panel de muro existente, F0.2b (sesión, cola, estado, `notify`) y el comparador de OP-10. Sin autoridades nuevas |
| 6 Perla / UX-FIRST | Una sola entrada («Forma del muro») dentro del panel del muro. Un arrastre = un paso de historial y un guardado. Un rechazo explica la causa, el estado de los datos, el siguiente paso y una alternativa segura. Botones de 44 px |
| 7 Dependencias y límites | Requiere A0 + F0.2b. Tolerancia de 1 mm y como mucho 1024 facetas. Una estancia junto a un muro curvo que no sigue su cara queda «pendiente» y nombrada, nunca medida por la cuerda. Recuperar un conflicto cuenta como restauración |
| 8 Pruebas | 61 pruebas de OP-07 en `apply-and-test`. Suite pura completa 1587 (0 fallos). Navegador 42/42 (persistencia, edificios, OP-07 ×5, UX-03, K4, presupuesto). G-02 CAD con ezdxf. Blender f1–f7. Negativos en cada corte |
| 9 Evidencia | `integration/visual/01…05-*-{2d,3d}.webp` (editor real), `blender/evidence-f7/`, este documento con SHA. No hay Preview de Vercel: la rama no se despliega |
| 10 Para Production falta | Ratificación de producto, A0 en master (WebKit), cirugía de Codex (serie + S7 en F0.2b), Firefox/WebKit/dispositivos, aceptación visual y CAD, autorización explícita de activación |

## 4. Decisiones nuevas que Codex y ChatGPT deben auditar

1. **Alcance de `saveGate`.**
   - `detectLoss` rechazaba cualquier muro desaparecido sin intención, y eso habría bloqueado borrados v1 normales y deshacer un curvado.
   - Ahora pérdida y reglas solo se aplican a muros con curva o pendiente (y a sus huecos), con el mismo alcance que `validate()`.
   - La degradación y el escritor sin rasgos se rechazan siempre.
2. **Intención por paso**, no global:
   - una operación OP-07 lleva la suya;
   - una edición genérica, solo los borrados que hace;
   - deshacer y rehacer, el diff completo.
   - Se compone desde la revisión confirmada y se descarta al confirmarse.
3. **Caras tras dividir.** Cada pieza mide su cara con el extremo perpendicular a su última faceta (D-OP07-2). En cada junta una cara gana a lo sumo t/2·θ (< 1 cm) y la otra lo pierde. El suelo y el perímetro no cambian.

## 5. Plan de integración (Codex)

1. Con A0 integrado: aplicar `0001…0010` con `git am --3way` sobre el master vigente en una rama `codex/…`. Si algo no aplica, se regenera desde `claude/op07-serie-v3` y no se toca a mano.
2. Pruebas:
   - `apply-and-test.cjs <base> --browser --full`;
   - `regression-partitions.json` ya incluye `op07-s7-persistence`;
   - G-02 CAD (`tests/g02-dxf-cad.py`);
   - `integration/g02-dxf-curved*.{cjs,py}`;
   - `integration/s7-legacy-reader.cjs`.
3. Firefox y WebKit para `op07-s4-3d`, `s4b-render`, `s5-edit`, `s5b-edit-ui`, `s7-persistence` y `persistence.browser`.
4. OP-10 se integra antes; después se aplica `blender/0001-…patch` y se ejecuta `scene-run.cjs` (f1–f7).
5. Una sola PR draft de la serie, o las que Codex prefiera, con los SHA de esta tabla. **Sin activar** documentos 2.0 en Production.

## 6. Rollback (nunca abrir un 2.0 como recto en silencio)

- **Código:** revertir los commits de la serie restaura master. Un documento 2.0 ya guardado se rechaza entonces al cargar (como en master hoy): el editor no arranca sobre él y la colección no se reescribe. Así lo comprueba `s7-legacy-reader.cjs`.
- **Datos:** no hay migración. Los v1 nunca se convierten y un 2.0 solo existe si la persona curva o inclina un muro.
- **Recuperación:** la copia de emergencia de F0.2b exporta el 2.0 completo. Volver a aplicar la serie lo reabre intacto (prueba S7: exportar y reabrir).
- **Prohibido:** degradar un 2.0 a 1.x por código, o abrirlo con `legacyView` y guardarlo. `assertSavable` y `saveGate` lo impiden.

## 7. Puertas pendientes

| Puerta | Responsable |
|---|---|
| A0 · residual WebKit (ResizeObserver) con `a0/ro-trace.init.js` | Codex (reproducción), Claude (corrección) |
| Firefox/WebKit y dispositivos de toda la serie | Codex |
| Aceptación visual 2D/3D y de «Forma del muro» | Propietario |
| DXF en dos CAD comerciales | Arquitecto |
| Cotejo con el delta *acwall* de Codex (ref no localizada en esta sesión) | Codex indica la ref |
| «G-02 downloads only the active building level»: falla también en master `bf131c30` | Corte aparte, si se autoriza |
| Cuatro fallos previos de `walk-controls` en el HEAD de A0 | Documentados aparte |
| Simulator A/E: A conserva el sólido canónico; E no debe tratar curvas como cajas favorables | Claude Code 1 / Codex (no se ha tocado) |
