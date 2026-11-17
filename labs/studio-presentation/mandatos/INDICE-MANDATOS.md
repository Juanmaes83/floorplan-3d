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
