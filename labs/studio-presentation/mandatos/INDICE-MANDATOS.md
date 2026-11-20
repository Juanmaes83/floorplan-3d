# Índice de mandatos vigentes

**Regla:**
- Los originales se copian **byte a byte** y no se editan.
- Las correcciones, interpretaciones y hallazgos se registran fuera de ellos: en `reports/13` (registro vivo) y `reports/14` (auditoría v1.4).
- Los requisitos son **acumulativos**: ningún mandato posterior sustituye ni rebaja los anteriores.

| Versión | Archivo | Bytes | SHA-256 | Naturaleza | Estado de ejecución |
|---|---|---|---|---|---|
| v1.2 | `RUBIK-SOTA-MISION-STUDIO-PRESENTATION-v1.2-REVISADA.md` | 80.369 | `22c097c3db403d66bca7df402fe96e64dbc78da004944ae5ff390f302569cfdf` | Especificación maestra | Fuente recuperada byte a byte. Matrices acumulativas en `reports/12`, `reports/13` y `reports/15`. |
| v1.3 | `RUBIK-SOTA-PROMPT-CLAUDE-CIERRE-INTEGRAL-E0E1-v1.3.md` | 42.430 | `c2f16097b21eef089bdf414db9c463385ae081828bec282311ad98e594a552a4` | Mandato de cierre E0/E1 (A01–A29, H01–H08, D/ST) | Cierre técnico y residual hechos (A10, A22, A23 y A27–A29 reconciliados contra §4–§7). Pendientes delimitados: estados económicos → N04; Firefox/WebKit; revisión humana. Ver `reports/13`. |
| v1.4 | `RUBIK-SOTA-PROMPT-CLAUDE-DELTA-DOCUMENTAL-v1.4.md` | 13.410 | `bfff73fcc4a63ea7c1489733a252d0831c68305c5be481ec1c326e569b7878de` | Mandato delta (N01–N08, RP-Q01–RP-Q12) | Resultados del candidato y límites en `reports/15`. |
| v1.4 | `RUBIK-SOTA-ANEXO-ENTREGABLES-PROFESIONALES-v1.4.md` | 43.659 | `6241ac2f1074f20984b361914f877a2dde00eb9f7b1f8a93153477905021636d` | Anexo funcional (RP01–RP21, M01–M12) | Auditado (`reports/14`). Las 5 correcciones de la auditoría (V1–V5) se aplican al ejecutar, sin editar el anexo. |
| E3 / K10 / ENT-03 (20/11/2026) | — (recibido en el chat del propietario; no se dispone del archivo original, así que no se copia ni se resume como si lo fuera) | — | — | GO de preparación funcional en laboratorio: contratos C1–C4 con Codex, 43 fuentes contra master `130ba24`, selector E3, vigencia N05, Blender/Simulator solo contrato, UX, pruebas del delta y §4.1 | Ejecutado como laboratorio hasta VALIDADO: `reports/22-E3-K10-ENT03-CONTRATOS-SELECTOR.md` y `reports/22b-MATRIZ-43-FUENTES.md`. Sus requisitos se suman a los anteriores |
| CC1 · Cierre técnico E3 / K10 / ENT-03 (20/11/2026) | — (recibido en el chat; sin archivo original, no se copia) | — | — | Cierre diferencial de los hallazgos de auditoría E3-A a E3-D y §8 | Hecho en laboratorio: `reports/23-E3-CIERRE-TECNICO.md`. Se suma a los anteriores |
| CC1 · Cierre final E3 y transferencia a Codex (20/11/2026) | — (recibido en el chat; sin archivo original) | — | — | Residual E3-D: identidad real de las tomas; handoff definitivo de integración | Hecho: §7 del informe 23 y `HANDOFF-INTEGRACION-CODEX-E3.md`. E3 detenido en el laboratorio |
| CC1 · Studio E4 / K11 / K12 / ENT-05 (20/11/2026) | — (recibido en el chat; sin archivo original) | — | — | K11 (resultado visual trazable), después K12, Architecture Book y FF&E | Primer corte K11 en `lab/studio-e4-k11`: `reports/24-E4-K11-RESULTADO-VISUAL.md`. K12/AB/FF&E pendientes de la auditoría de K11 |

## Hallazgos externos de continuidad

| Fuente | Estado |
|---|---|
| V13-01 a V13-09 y CONT-01 a CONT-03 | Recibidos en el handoff de continuidad del propietario. Ver `reports/15-REGISTRO-v1.4.md` para la revalidación sobre el candidato. |

## Cadena de requisitos acumulativos

`v1.2` (especificación) → `v1.3` (cierre: P0, editorial, QA, paquetes, E2 solo diagnóstico) → `v1.4` (delta: recetas, Architecture Book, FF&E, comercial, autoridad documental, conciliación, gramática visual, mapa de impacto).

Restricciones comunes a los tres:
- solo laboratorio;
- E2–E7 solo diagnóstico y plan;
- sin master, PR, merge, Production, Vercel ni secretos;
- sin IA de pago;
- sin tocar a Codex.

| `RUBIK-SOTA-CIERRE-INTEGRAL-PROFESIONAL-v1.4-AUDITORIA-AMPLIADA.md` | Mandato vigente desde el 17/11/2026 (resumen operativo transcrito; el texto íntegro es el mensaje del propietario). Amplía el cierre v1.4 con F01–F16. |

| `BORRADOR-MANDATO-E2.md` | BORRADOR (17/11/2026) del mandato E2 · comparativas profesionales (ENT-04). No autoriza nada: requiere el cierre de la consolidación de Codex, el SHA base de master y el GO específico. |
